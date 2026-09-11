import json
import mimetypes
import re
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path("research")
TIMEOUT = 45
LANGS = ("ko", "en", "de")
GOOGLE_IMAGE_HOST_MARKERS = (
    "docs.google.com",
    "googleusercontent.com",
    "gstatic.com",
)

session = requests.Session()
session.headers.update({"User-Agent": "RavenForge-Research-Asset-Mirror/1.0"})


def is_remote(src: str) -> bool:
    return src.startswith("http://") or src.startswith("https://")


def is_google_asset(src: str) -> bool:
    host = urlparse(src).netloc.lower()
    return any(marker in host for marker in GOOGLE_IMAGE_HOST_MARKERS)


def extension_for(response: requests.Response, src: str) -> str:
    content_type = (response.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
    known = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
    }
    if content_type in known:
        return known[content_type]
    guessed = mimetypes.guess_extension(content_type) if content_type else None
    if guessed:
        return guessed
    suffix = Path(urlparse(src).path).suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return ".png"


def fresh_source_images(source_url: str):
    response = session.get(source_url, timeout=TIMEOUT)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or "utf-8"
    soup = BeautifulSoup(response.text, "html.parser")
    return [str(img.get("src", "")).strip() for img in soup.find_all("img") if img.get("src")]


def download_image(candidates, referer: str, destination_base: Path):
    errors = []
    for src in candidates:
        if not src or not is_remote(src):
            continue
        try:
            response = session.get(
                src,
                timeout=TIMEOUT,
                headers={"Referer": referer} if referer else None,
            )
            response.raise_for_status()
            if not response.content:
                raise RuntimeError("empty response body")
            content_type = (response.headers.get("content-type") or "").lower()
            if content_type and not content_type.startswith("image/"):
                raise RuntimeError(f"unexpected content-type {content_type!r}")
            ext = extension_for(response, src)
            destination = destination_base.with_suffix(ext)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(response.content)
            return destination
        except Exception as exc:
            errors.append(f"{src}: {exc}")
    raise RuntimeError("; ".join(errors) or "no usable image URL")


def process_language(folder: Path, lang: str, localized: dict):
    html_path = folder / f"{lang}.html"
    if not html_path.exists():
        return 0

    html = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    target_images = soup.find_all("img")
    if not target_images:
        return 0

    source_url = str(localized.get("sourceLink") or "").strip()
    source_images = []
    if source_url.startswith("http"):
        try:
            source_images = fresh_source_images(source_url)
        except Exception as exc:
            print(f"WARNING: could not refresh source document {source_url}: {exc}")

    assets_dir = folder / "assets"
    localized_count = 0

    for index, img in enumerate(target_images, start=1):
        current_src = str(img.get("src", "")).strip()
        if not is_remote(current_src):
            continue

        # Prefer the freshly fetched Google Docs image URL at the same document
        # position. Fall back to the URL already stored in the mirrored HTML.
        candidates = []
        if index - 1 < len(source_images):
            candidates.append(source_images[index - 1])
        candidates.append(current_src)
        # Preserve order while removing duplicates.
        candidates = list(dict.fromkeys(candidates))

        destination_base = assets_dir / f"{lang}-image-{index:02d}"
        destination = download_image(candidates, source_url, destination_base)
        img["src"] = f"assets/{destination.name}"
        img.attrs.pop("srcset", None)
        localized_count += 1

    # Fail loudly if a Google-hosted document image remains after localization.
    unresolved = []
    for img in soup.find_all("img"):
        src = str(img.get("src", "")).strip()
        if is_remote(src) and is_google_asset(src):
            unresolved.append(src)
    if unresolved:
        raise RuntimeError(f"{html_path}: {len(unresolved)} Google image URL(s) remain unresolved")

    if localized_count:
        html_path.write_text("<!doctype html>\n" + str(soup.html), encoding="utf-8")
    return localized_count


def main():
    total_images = 0
    touched_docs = 0
    failures = []

    for meta_path in sorted(ROOT.glob("*/meta.json")):
        data = json.loads(meta_path.read_text(encoding="utf-8"))
        folder = meta_path.parent
        article_count = 0
        for lang in LANGS:
            localized = data.get(lang)
            if not isinstance(localized, dict):
                continue
            try:
                article_count += process_language(folder, lang, localized)
            except Exception as exc:
                failures.append(f"{folder.name}/{lang}: {exc}")
        if article_count:
            touched_docs += 1
            total_images += article_count
            print(f"Localized {article_count} image(s) in {folder.name}")

    if failures:
        raise SystemExit("Image localization failed:\n" + "\n".join(failures))

    print(f"Localized {total_images} image(s) across {touched_docs} research entr{'y' if touched_docs == 1 else 'ies'}.")


if __name__ == "__main__":
    main()
