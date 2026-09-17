from pathlib import Path
import base64
import gzip
import hashlib

ROOT = Path(__file__).resolve().parent
EXPECTED = {
    "ko": "d2cfdd91a184839def626f5061fd9f78a5e9e0661f5133d01fd6baec7c06a132",
    "en": "b3c62a528bd770ff0c48404c915959b976c8b5a1afb51eb90a02f0c3c6f2c21e",
    "de": "83daae4ee5faa8b92b65fd81b07b725cce00743f0a04a734ee1c09f3db37e3db",
}

for lang, expected in EXPECTED.items():
    encoded = (ROOT / "source-static" / f"{lang}.html.gz.b64").read_text(encoding="utf-8").strip()
    data = gzip.decompress(base64.b64decode(encoded))
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise RuntimeError(f"A06 {lang}: SHA-256 mismatch: {actual} != {expected}")
    (ROOT / f"{lang}.html").write_bytes(data)
    print(f"A06 {lang}: {len(data)} bytes verified ({actual[:12]})")
