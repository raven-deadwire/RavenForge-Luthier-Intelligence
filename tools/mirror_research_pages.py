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
    soup = BeautifulSoup(source_html, "html.parser")

    # Published Google Docs pages contain runtime scripts that are unnecessary in
    # a static RavenForge mirror. Keep the document markup and CSS, drop scripts.
    for tag in soup.find_all(["script", "noscript"]):
        tag.decompose()

    # Remove Google UI elements when present, while preserving the document body.
    for selector in ["#docs-toolbar-wrapper", ".docs-butterbar-container"]:
        for tag in soup.select(selector):
            tag.decompose()

    # Make relative resources absolute before the page moves away from docs.google.com.
    for tag in soup.find_all(True):
        for attr in ("src", "href"):
            value = tag.get(attr)
            if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                continue
            tag[attr] = urljoin(source_url, value)

    if soup.html is None:
        wrapper = BeautifulSoup("<!doctype html><html><head></head><body></body></html>", "html.parser")
        wrapper.body.append(soup)
        soup = wrapper

    html_tag = soup.html
    html_tag["lang"] = lang

    head = soup.head
    if head is None:
        head = soup.new_tag("head")
        html_tag.insert(0, head)

    # Ensure a predictable standalone page inside the RavenForge modal iframe.
    charset = soup.new_tag("meta")
    charset["charset"] = "utf-8"
    head.insert(0, charset)
    viewport = soup.new_tag("meta")
    viewport["name"] = "viewport"
    viewport["content"] = "width=device-width, initial-scale=1"
    head.insert(1, viewport)

    if not head.title:
        title_tag = soup.new_tag("title")
        title_tag.string = title
        head.append(title_tag)

    style = soup.new_tag("style")
    style.string = """
html, body { margin: 0; padding: 0; background: #fff; }
body { box-sizing: border-box; }
img { max-width: 100%; height: auto; }
table { max-width: 100%; }
@media (max-width: 720px) {
  body { overflow-wrap: anywhere; }
}
"""
    head.append(style)

    return "<!doctype html>\n" + str(html_tag)


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

        # Once mirrored, preserve the original published Google Docs URL separately.
        if localized.get("sourceLink"):
            source_url = str(localized["sourceLink"]).strip()

        if not source_url.startswith("http"):
            # Already local and no source URL remains: nothing to mirror.
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
