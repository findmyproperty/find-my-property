"""Build .docx and .pdf from a markdown file in docs/ with clickable contents."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from fpdf import FPDF

DOCS = Path(__file__).resolve().parent

HEADING_RE = re.compile(r"^(#{1,4})\s+(.*)$")
INLINE_RE = re.compile(r"\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)")


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:40] or "section"


def parse_inline(text: str) -> list[tuple[str, bool, str | None]]:
    parts: list[tuple[str, bool, str | None]] = []
    pos = 0
    for match in INLINE_RE.finditer(text):
        if match.start() > pos:
            parts.append((text[pos : match.start()], False, None))
        if match.group(1) is not None:
            parts.append((match.group(1), True, None))
        else:
            href = match.group(3)
            anchor = href[1:] if href.startswith("#") else None
            parts.append((match.group(2), False, anchor))
        pos = match.end()
    if pos < len(text):
        parts.append((text[pos:], False, None))
    return parts or [("", False, None)]


def plain(text: str) -> str:
    return "".join(part for part, _bold, _anchor in parse_inline(text))


def parse_blocks(markdown: str) -> list[dict]:
    lines = markdown.splitlines()
    blocks: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.strip() == "---":
            blocks.append({"type": "hr"})
            i += 1
            continue
        heading = HEADING_RE.match(line)
        if heading:
            level = len(heading.group(1))
            text = heading.group(2).strip()
            blocks.append({"type": "heading", "level": level, "text": text, "slug": slugify(text)})
            i += 1
            continue
        if line.startswith("|"):
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].startswith("|"):
                raw = lines[i].strip().strip("|")
                cells = [cell.strip() for cell in raw.split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
                    rows.append(cells)
                i += 1
            if rows:
                blocks.append({"type": "table", "rows": rows})
            continue
        if re.match(r"^[-*]\s+", line):
            items: list[str] = []
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i]):
                items.append(re.sub(r"^[-*]\s+", "", lines[i]).strip())
                i += 1
            blocks.append({"type": "bullets", "items": items})
            continue
        if re.match(r"^\d+\.\s+", line):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i]):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i]).strip())
                i += 1
            blocks.append({"type": "numbers", "items": items})
            continue
        paragraph = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "|", "-", "*")) and lines[i].strip() != "---" and not re.match(r"^\d+\.\s+", lines[i]):
            paragraph.append(lines[i].strip())
            i += 1
        blocks.append({"type": "p", "text": " ".join(paragraph)})
    return blocks


def heading_entries(blocks: list[dict]) -> list[dict]:
    seen: dict[str, int] = {}
    for block in blocks:
        if block["type"] != "heading":
            continue
        slug = block["slug"]
        if slug in seen:
            seen[slug] += 1
            slug = f"{slug}-{seen[slug]}"[:40]
        else:
            seen[slug] = 1
        block["slug"] = slug
    return [b for b in blocks if b["type"] == "heading" and b["level"] <= 3]


def add_bookmark(paragraph, name: str, bookmark_id: int) -> None:
    start = OxmlElement("w:bookmarkStart")
    start.set(qn("w:id"), str(bookmark_id))
    start.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"), str(bookmark_id))
    paragraph._p.insert(0, start)
    paragraph._p.append(end)


def add_internal_link(paragraph, text: str, anchor: str, bold: bool = False) -> None:
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("w:anchor"), anchor)
    run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "1F4E79")
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    r_pr.append(color)
    r_pr.append(underline)
    if bold:
        r_pr.append(OxmlElement("w:b"))
    run.append(r_pr)
    text_el = OxmlElement("w:t")
    text_el.set(qn("xml:space"), "preserve")
    text_el.text = text
    run.append(text_el)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def add_runs(paragraph, text: str) -> None:
    for part, bold, anchor in parse_inline(text):
        if not part:
            continue
        if anchor:
            add_internal_link(paragraph, part, anchor, bold)
            continue
        run = paragraph.add_run(part)
        run.bold = bold
        run.font.size = Pt(11)


def shade_cell(cell, hex_color: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tc_pr.append(shd)


def build_docx(blocks: list[dict], docx_path: Path, title: str) -> None:
    doc = Document()
    section = doc.sections[0]
    for margin in ("top_margin", "bottom_margin", "left_margin", "right_margin"):
        setattr(section, margin, Cm(1.8))
    doc.styles["Normal"].font.name = "Calibri"
    doc.styles["Normal"].font.size = Pt(11)
    doc.core_properties.title = title

    h = doc.add_paragraph()
    h.add_run(title.split("—")[0].strip()).bold = True
    h.runs[0].font.size = Pt(22)
    h.runs[0].font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)

    contents_heading = doc.add_heading("Contents", level=1)
    add_bookmark(contents_heading, "contents", 1)
    bookmark_id = 2
    for block in blocks:
        if block["type"] != "heading" or block["level"] == 1 or block["level"] > 3:
            continue
        line = doc.add_paragraph()
        line.paragraph_format.left_indent = Cm(0.4 * (block["level"] - 2))
        add_internal_link(line, block["text"], block["slug"])

    doc.add_page_break()

    for block in blocks:
        kind = block["type"]
        if kind == "heading":
            if block["level"] == 1:
                continue
            paragraph = doc.add_heading(block["text"], level=min(block["level"], 3))
            add_bookmark(paragraph, block["slug"], bookmark_id)
            bookmark_id += 1
            continue
        if kind == "hr":
            doc.add_paragraph()
            continue
        if kind == "p":
            paragraph = doc.add_paragraph()
            add_runs(paragraph, block["text"])
            continue
        if kind == "bullets":
            for item in block["items"]:
                paragraph = doc.add_paragraph(style="List Bullet")
                add_runs(paragraph, item)
            continue
        if kind == "numbers":
            for item in block["items"]:
                paragraph = doc.add_paragraph(style="List Number")
                add_runs(paragraph, item)
            continue
        if kind == "table":
            rows = block["rows"]
            cols = max(len(row) for row in rows)
            table = doc.add_table(rows=len(rows), cols=cols)
            table.style = "Table Grid"
            for r_index, row in enumerate(rows):
                for c_index in range(cols):
                    cell = table.cell(r_index, c_index)
                    cell.text = ""
                    paragraph = cell.paragraphs[0]
                    value = row[c_index] if c_index < len(row) else ""
                    add_runs(paragraph, value)
                    for run in paragraph.runs:
                        run.font.size = Pt(10)
                        if r_index == 0:
                            run.bold = True
                            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                    if r_index == 0:
                        shade_cell(cell, "1F4E79")
            doc.add_paragraph()

    doc.save(docx_path)


class ManualPDF(FPDF):
    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Arial", size=8)
        self.set_text_color(90, 100, 112)
        self.cell(0, 8, f"Page {self.page_no()}", align="R")


def build_pdf(blocks: list[dict], pdf_path: Path, title: str) -> None:
    font = Path(r"C:\Windows\Fonts\arial.ttf")
    font_bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    headings = [b for b in blocks if b["type"] == "heading" and 2 <= b["level"] <= 3]
    links = {b["slug"]: None for b in headings}

    pdf = ManualPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_font("Arial", "", str(font))
    pdf.add_font("Arial", "B", str(font_bold))
    pdf.set_title(title)

    for slug in links:
        links[slug] = pdf.add_link()
        pdf.set_link(links[slug], page=1, y=0)

    pdf.add_page()
    pdf.set_font("Arial", "B", 20)
    pdf.set_text_color(31, 78, 121)
    pdf.multi_cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Arial", "B", 14)
    pdf.multi_cell(0, 8, "Contents", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    for block in headings:
        indent = 4 if block["level"] == 2 else 10
        pdf.set_font("Arial", "B" if block["level"] == 2 else "", 11 if block["level"] == 2 else 10)
        pdf.set_text_color(31, 78, 121)
        pdf.set_x(pdf.l_margin + indent)
        pdf.multi_cell(0, 6, block["text"], link=links[block["slug"]], new_x="LMARGIN", new_y="NEXT")
    pdf.add_page()

    for block in blocks:
        kind = block["type"]
        if kind == "heading":
            if block["level"] == 1:
                continue
            if block["level"] == 2 and (
                block["text"][0:1].isdigit() or block["text"].startswith("Summary") or block["text"].startswith("Quick")
            ):
                if pdf.get_y() > 40:
                    pdf.add_page()
            pdf.ln(1)
            pdf.set_x(pdf.l_margin)
            size = {2: 15, 3: 12, 4: 11}[block["level"]]
            pdf.set_font("Arial", "B", size)
            pdf.set_text_color(31, 78, 121)
            if block["slug"] in links:
                pdf.set_link(links[block["slug"]], page=pdf.page, y=pdf.get_y())
            if block["level"] <= 3:
                pdf.start_section(block["text"], level=block["level"] - 2)
            pdf.multi_cell(0, 7, block["text"], new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(20, 24, 28)
            continue
        if kind == "hr":
            pdf.ln(2)
            continue
        if kind == "p":
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Arial", size=11)
            for part, bold, anchor in parse_inline(block["text"]):
                if not part:
                    continue
                pdf.set_font("Arial", "B" if bold else "", 11)
                link = links.get(anchor) if anchor else None
                pdf.write(6, part, link=link)
            pdf.ln(7)
            continue
        if kind in {"bullets", "numbers"}:
            for index, item in enumerate(block["items"], start=1):
                pdf.set_x(pdf.l_margin + 2)
                pdf.set_font("Arial", size=11)
                pdf.write(6, f"{index}. " if kind == "numbers" else "• ")
                for part, bold, anchor in parse_inline(item):
                    if not part:
                        continue
                    pdf.set_font("Arial", "B" if bold else "", 11)
                    link = links.get(anchor) if anchor else None
                    pdf.write(6, part, link=link)
                pdf.ln(7)
            continue
        if kind == "table":
            rows = block["rows"]
            cols = max(len(row) for row in rows)
            width = pdf.epw / cols
            for r_index, row in enumerate(rows):
                if pdf.get_y() > pdf.h - 24:
                    pdf.add_page()
                y_start = pdf.get_y()
                x_start = pdf.l_margin
                values = [plain(row[c]) if c < len(row) else "" for c in range(cols)]
                row_h = max(pdf.multi_cell(width - 2, 5, v, dry_run=True, output="HEIGHT") for v in values) + 2
                for c_index, value in enumerate(values):
                    x = x_start + c_index * width
                    if r_index == 0:
                        pdf.set_fill_color(31, 78, 121)
                        pdf.set_text_color(255, 255, 255)
                        pdf.set_font("Arial", "B", 9)
                    else:
                        pdf.set_fill_color(245, 247, 250)
                        pdf.set_text_color(20, 24, 28)
                        pdf.set_font("Arial", size=9)
                    pdf.set_xy(x, y_start)
                    pdf.rect(x, y_start, width, row_h, style="F")
                    pdf.set_xy(x + 1, y_start + 1)
                    pdf.multi_cell(width - 2, 5, value, new_x="RIGHT", new_y="TOP")
                pdf.set_y(y_start + row_h)
            pdf.ln(3)

    pdf.output(str(pdf_path))


def build(stem: str) -> None:
    md_path = DOCS / f"{stem}.md"
    if not md_path.is_file():
        raise SystemExit(f"Missing {md_path}")
    blocks = parse_blocks(md_path.read_text(encoding="utf-8"))
    heading_entries(blocks)
    title_line = next((b["text"] for b in blocks if b["type"] == "heading" and b["level"] == 1), stem)
    build_docx(blocks, DOCS / f"{stem}.docx", title_line)
    build_pdf(blocks, DOCS / f"{stem}.pdf", title_line)
    print(f"Wrote {DOCS / f'{stem}.docx'}")
    print(f"Wrote {DOCS / f'{stem}.pdf'}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Word and PDF from docs/*.md")
    parser.add_argument("stems", nargs="*", default=["USER_GUIDE", "FEATURE_STATUS"], help="Basename without extension")
    args = parser.parse_args()
    for stem in args.stems:
        build(stem)


if __name__ == "__main__":
    main()
