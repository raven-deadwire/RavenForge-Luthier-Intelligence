import json
import os
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path("research")
ONLY_ID = os.environ.get("ONLY_ID", "").strip()
TIMEOUT = 45


def fetch_published_doc(url: str) -> str:
    response = requests.get(
        url,
        timeout=TIMEOUT,
        headers={"User-Agent": "RavenForge-Research-Mirror/1.0"},
    )
    response.raise_for_status()
    response.encoding = response.apparent_encoding or "utf-8"
    return response.text


def make_static_html(source_html: str, source_url: str, title: str, lang: str) -> str:
    source = BeautifulSoup(source_html, "html.parser")

    # Google runtime code is not needed in a static archive.
    for tag in source.find_all(["script", "noscript"]):
        tag.decompose()
    for selector in ["#docs-toolbar-wrapper", ".docs-butterbar-container"]:
        for tag in source.select(selector):
            tag.decompose()

    # Keep the Google Docs publication CSS, but rebuild a clean standalone shell.
    source_css = "\n".join(tag.get_text() for tag in source.find_all("style"))
    content = source.select_one(".doc-content")
    if content is None:
        content = source.body if source.body is not None else source

    # Make relative resources absolute before moving away from docs.google.com.
    for tag in content.find_all(True):
        for attr in ("src", "href"):
            value = tag.get(attr)
            if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                continue
            tag[attr] = urljoin(source_url, value)

    out = BeautifulSoup("<!doctype html><html><head></head><body></body></html>", "html.parser")
    out.html["lang"] = lang

    charset = out.new_tag("meta")
    charset["charset"] = "utf-8"
    out.head.append(charset)
    viewport = out.new_tag("meta")
    viewport["name"] = "viewport"
    viewport["content"] = "width=device-width, initial-scale=1"
    out.head.append(viewport)
    title_tag = out.new_tag("title")
    title_tag.string = title
    out.head.append(title_tag)

    if source_css:
        source_style = out.new_tag("style")
        source_style.string = source_css
        out.head.append(source_style)

    ravenforge_style = out.new_tag("style")
    ravenforge_style.string = """
html, body { margin: 0; padding: 0; background: #fff; }
body { box-sizing: border-box; overflow-x: hidden; }
.doc-content { margin-left: auto !important; margin-right: auto !important; }
img { max-width: 100%; height: auto; }
table { max-width: 100%; }
@media (max-width: 720px) {
  body { overflow-wrap: anywhere; }
  .doc-content { max-width: none !important; padding: 24px 16px !important; }
  table { width: 100% !important; display: block; overflow-x: auto; }
}
"""
    out.head.append(ravenforge_style)

    fragment = BeautifulSoup(str(content), "html.parser")
    for child in list(fragment.contents):
        out.body.append(child)

    return "<!doctype html>\n" + str(out.html)


def migrate_meta(meta_path: Path) -> bool:
    data = json.loads(meta_path.read_text(encoding="utf-8"))
    article_id = str(data.get("id", "")).strip()
    if ONLY_ID and article_id != ONLY_ID:
        return False

    folder = meta_path.parent
    changed = False

    for lang in ("ko", "en", "de"):
        localized = data.get(lang)
        if not isinstance(localized, dict):
            raise RuntimeError(f"{meta_path}: missing {lang} metadata")

        source_url = str(localized.get("sourceLink") or localized.get("link") or "").strip()
        if not source_url:
            raise RuntimeError(f"{meta_path}: missing {lang} source link")
        if not source_url.startswith("http"):
            # Already local and no archival source remains.
            continue

        source_html = fetch_published_doc(source_url)
        output_html = make_static_html(
            source_html,
            source_url,
            str(localized.get("title", article_id)),
            lang,
        )
        output_path = folder / f"{lang}.html"
        output_path.write_text(output_html, encoding="utf-8")

        localized["sourceLink"] = source_url
        localized["link"] = f"research/{folder.name}/{lang}.html"
        changed = True

    if changed:
        meta_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changed


count = 0
for meta_path in sorted(ROOT.glob("*/meta.json")):
    if migrate_meta(meta_path):
        count += 1

if ONLY_ID and count == 0:
    raise SystemExit(f"No matching research entry migrated for ONLY_ID={ONLY_ID!r}")

print(f"Mirrored {count} research entr{'y' if count == 1 else 'ies'} to static HTML.")
