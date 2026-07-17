from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "YDP_Automation_Demo_Guide.pdf"

assert PDF_PATH.exists(), "The demo guide PDF must exist."

document = fitz.open(PDF_PATH)
assert document.page_count == 2, f"Expected 2 pages, found {document.page_count}."

all_text = []
for page_number, page in enumerate(document, start=1):
    rectangle = page.rect
    assert rectangle.width > rectangle.height, f"Page {page_number} is not landscape."

    text = page.get_text("text").strip()
    assert len(text) >= 80, f"Page {page_number} appears blank or has too little extractable text."
    all_text.append(text)

combined_text = "\n".join(all_text)
for required_text in (
    "From Manual Work to a Controlled Mentorship System",
    "What We Built and Why",
    "Three Apps Script Projects",
    "How the Matching Flow Works",
    "20-30 Minute Demo Run Sheet",
    "GitHub and clasp",
):
    assert required_text in combined_text, f"Missing PDF text: {required_text}"

assert "AQ." not in combined_text, "The PDF must not expose Gemini API key values."

print(f"demo guide PDF verification passed: {document.page_count} pages")
