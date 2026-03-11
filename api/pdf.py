"""Small Python endpoint for PDF extraction only."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from lib.parser import parse_pdf
app = Flask(__name__)


@app.post("/api/pdf")
def parse_pdf_route() -> object:
    file = request.files.get("file")
    if file is None or not file.filename:
        return jsonify({"success": False, "error": "No file uploaded."}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "Only PDF files are supported."}), 400

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
            file.save(temp_pdf)
            temp_path = temp_pdf.name

        parsed = parse_pdf(temp_path)
        return jsonify({
            "success": True,
            "rows": parsed.get("rows") or [],
            "extractedDate": parsed.get("extractedDate") or "",
            "rowsProcessed": parsed.get("rowsProcessed") or 0,
        })
    except Exception as exc:  # pragma: no cover
        return jsonify({"success": False, "error": str(exc)}), 500
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)