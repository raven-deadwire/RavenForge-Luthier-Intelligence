#!/usr/bin/env python3
"""Inspect actual raster PDFs, separately from browser/source assertions.

python tools/test_configurator_pdf_visual.py /path/to/matrix-output
Requires PyMuPDF, Pillow and the tesseract executable (English data suffices
for model IDs and numeric totals). Korean-capable fonts must be installed
before browser exports. Saves page PNGs/contact sheets for human visual QA.
"""
import concurrent.futures
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

root = Path(sys.argv[1])
output = root / "pdf-visual"
output.mkdir(exist_ok=True)
pdfs = sorted(root.glob("*.pdf"))
assert len(pdfs) == 24, f"Expected all 24 matrix PDFs; found {len(pdfs)}"


def inspect(pdf):
    document = fitz.open(pdf)
    pages = []
    text = []
    for number, page in enumerate(document, 1):
        assert abs(page.rect.width - 595.28) < 1 and abs(page.rect.height - 841.89) < 1, "Expected A4"
        pix = page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4))
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        # Ignore light rules and borders; a page containing only a trailing
        # container border must fail, even if the PDF is structurally valid.
        ink = sum(image.convert("L").point(lambda value: 255 if value < 160 else 0).histogram()[128:])
        assert ink > 150, f"Blank or nearly blank page: {pdf.name}/{number} ({ink} dark pixels)"
        filename = output / f"{pdf.stem}-p{number}.png"
        image.save(filename)
        ocr = subprocess.run(["tesseract", str(filename), "stdout", "-l", "eng", "--psm", "6"], capture_output=True, text=True, check=True,
                             timeout=30, env={**os.environ, "OMP_THREAD_LIMIT": "1"})
        text.append(ocr.stdout)
        pages.append(str(filename))
    actual = "\n".join(text)
    source = (root / f"{pdf.stem}-pdf-source.txt").read_text()
    model = pdf.stem.split("-")[-1]
    expected_total = re.findall(r"€\s*([\d,]+)", source)[-1].replace(",", "")
    assert model in actual, f"Model missing from rendered PDF: {pdf.name}"
    # OCR may insert separators into a large amount, but may not substitute
    # another amount. Source text assertions independently compare every row.
    pattern = r"\b" + r"[\s,.]*".join(expected_total) + r"\b"
    assert re.search(pattern, actual), f"Total €{expected_total} missing from rendered PDF: {pdf.name}"
    (output / f"{pdf.stem}-ocr.txt").write_text(actual)
    return {"filename": pdf.name, "pages": len(pages), "rendered_model": model, "rendered_total": expected_total, "page_images": pages, "result": "PASS"}


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(inspect, pdfs))
images = [Path(filename) for result in results for filename in result["page_images"]]
for offset in range(0, len(images), 12):
    sheet = Image.new("RGB", (1520, 1635), "white")
    for index, filename in enumerate(images[offset:offset + 12]):
        image = Image.open(filename).convert("RGB")
        image.thumbnail((360, 510))
        tile = Image.new("RGB", (380, 545), "#e5e7eb")
        tile.paste(image, ((380 - image.width) // 2, 25))
        ImageDraw.Draw(tile).text((8, 5), filename.stem, fill="black")
        sheet.paste(tile, ((index % 4) * 380, (index // 4) * 545))
    sheet.save(output / f"contact-{offset // 12 + 1}.png")
(output / "report.json").write_text(json.dumps({"result": "PASS", "pdfs": results}, indent=2) + "\n")
print(f"PASS: {len(results)} actual A4 PDFs / {len(images)} pages; no blank pages; rendered model IDs and totals match")
