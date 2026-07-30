#!/usr/bin/env python3
"""Ingest reference material for presentation_builder.

Walks a ref_text folder and a ref_images folder and produces a single JSON
index on stdout describing every source. Designed to be run by the
presentation-builder skill before it drafts content.

Behavior per file type in ref_text:
  .txt / .md / .markdown / .rst   -> text read inline
  .pdf                            -> text extracted if pypdf/pdfplumber present,
                                     otherwise flagged needs_skill="pdf"
  .docx                           -> text extracted if python-docx present,
                                     otherwise flagged needs_skill="docx"
  .url / .webloc / inline links   -> URLs collected for the agent to WebFetch
                                     (this script never makes network calls)

URLs are also scraped out of any .txt/.md file body.

Images are indexed with dimensions when Pillow is available, else byte size only.

Usage:
  read_refs.py [--ref-text DIR] [--ref-images DIR] [--out FILE]

Defaults: --ref-text ref_text  --ref-images ref_images
If --out is given the JSON is also written there; it is always printed to stdout.
"""
import argparse
import json
import os
import re
import sys

URL_RE = re.compile(r"https?://[^\s)>\]\"']+")

TEXT_EXTS = {".txt", ".md", ".markdown", ".rst", ".text"}
LINK_EXTS = {".url", ".webloc"}


def extract_pdf(path):
    try:
        from pypdf import PdfReader
    except Exception:
        try:
            from PyPDF2 import PdfReader  # type: ignore
        except Exception:
            return None
    try:
        reader = PdfReader(path)
        return "\n".join((p.extract_text() or "") for p in reader.pages).strip()
    except Exception as e:
        return f"[pdf extract error: {e}]"


def extract_docx(path):
    try:
        import docx  # python-docx
    except Exception:
        return None
    try:
        d = docx.Document(path)
        parts = [p.text for p in d.paragraphs]
        for table in d.tables:
            for row in table.rows:
                parts.append("\t".join(c.text for c in row.cells))
        return "\n".join(parts).strip()
    except Exception as e:
        return f"[docx extract error: {e}]"


def read_text(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def parse_link_file(path, ext):
    body = read_text(path)
    if ext == ".webloc":  # macOS plist with <string>URL</string>
        m = re.search(r"<string>(https?://[^<]+)</string>", body)
        return [m.group(1)] if m else []
    if ext == ".url":  # windows .url: URL=...
        m = re.search(r"URL=(\S+)", body)
        return [m.group(1)] if m else URL_RE.findall(body)
    return URL_RE.findall(body)


def index_images(ref_images):
    images = []
    if not os.path.isdir(ref_images):
        return images
    exts = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".svg"}
    try:
        from PIL import Image
        have_pil = True
    except Exception:
        have_pil = False
    for name in sorted(os.listdir(ref_images)):
        path = os.path.join(ref_images, name)
        ext = os.path.splitext(name)[1].lower()
        if not os.path.isfile(path) or ext not in exts:
            continue
        entry = {"file": name, "path": os.path.abspath(path),
                 "bytes": os.path.getsize(path)}
        if have_pil and ext != ".svg":
            try:
                with Image.open(path) as im:
                    entry["width"], entry["height"] = im.size
            except Exception:
                pass
        images.append(entry)
    return images


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref-text", default="ref_text")
    ap.add_argument("--ref-images", default="ref_images")
    ap.add_argument("--out")
    args = ap.parse_args()

    sources, urls, needs_skill = [], [], []

    if os.path.isdir(args.ref_text):
        for root, _, files in os.walk(args.ref_text):
            for name in sorted(files):
                if name.startswith("."):
                    continue
                path = os.path.join(root, name)
                ext = os.path.splitext(name)[1].lower()
                rec = {"file": os.path.relpath(path, args.ref_text),
                       "path": os.path.abspath(path), "type": ext.lstrip(".")}
                if ext in TEXT_EXTS:
                    body = read_text(path)
                    rec["text"] = body
                    found = URL_RE.findall(body)
                    if found:
                        rec["urls"] = found
                        urls.extend(found)
                elif ext in LINK_EXTS:
                    found = parse_link_file(path, ext)
                    rec["urls"] = found
                    urls.extend(found)
                elif ext == ".pdf":
                    text = extract_pdf(path)
                    if text is None:
                        rec["needs_skill"] = "pdf"
                        needs_skill.append(rec["path"])
                    else:
                        rec["text"] = text
                elif ext == ".docx":
                    text = extract_docx(path)
                    if text is None:
                        rec["needs_skill"] = "docx"
                        needs_skill.append(rec["path"])
                    else:
                        rec["text"] = text
                else:
                    rec["note"] = "unsupported type, skipped"
                sources.append(rec)

    result = {
        "ref_text_dir": os.path.abspath(args.ref_text),
        "ref_images_dir": os.path.abspath(args.ref_images),
        "sources": sources,
        "urls_to_fetch": sorted(set(urls)),
        "needs_skill_extraction": needs_skill,
        "images": index_images(args.ref_images),
    }

    payload = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(payload)
    print(payload)


if __name__ == "__main__":
    main()
