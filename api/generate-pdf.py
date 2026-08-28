"""
Vercel Python Function: POST /api/generate-pdf

Replaces the old Next.js Node route that shelled out to a local `python3`
process (`spawn`) — that approach only works in local dev; Vercel's Node
serverless functions can't spawn a separate Python runtime process. This
function runs natively on Vercel's Python runtime instead, so no
Node -> Python handoff is needed at all in production.

Exposed as a plain WSGI app (`app`), which Vercel's Python builder detects
and wraps automatically — no extra config beyond the `vercel.json`
`functions` entry for this file (memory/duration) is required.
"""

import json
import os
import re
import sys
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from io import BytesIO

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent
sys.path.insert(0, str(_ROOT))

from pdf_engine import render_program_pdf, enrich_program  # noqa: E402

app = Flask(__name__)

_MACHINES_PATH = _ROOT / "data" / "machines.json"
_THUMB_DIR = _ROOT / "public" / "machines"


def _load_machines_by_id():
    with open(_MACHINES_PATH, "r") as f:
        machines = json.load(f)
    return {m["id"]: m for m in machines}


# Loaded once per warm serverless instance, reused across invocations.
_MACHINES_BY_ID = _load_machines_by_id()


@app.post("/api/generate-pdf")
@app.post("/")
@app.post("/<path:_unused>")
def generate_pdf(_unused=None):
    try:
        program = request.get_json(force=True)
        if not isinstance(program, dict):
            return jsonify({"error": "Request body must be a JSON program object"}), 400

        enriched = enrich_program(program, _MACHINES_BY_ID)
        pdf_bytes = render_program_pdf(enriched, str(_THUMB_DIR))

        member_name = program.get("memberName") or "program"
        safe_name = re.sub(r"[^a-zA-Z0-9\-_]", "_", member_name)

        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{safe_name}.pdf",
        )
    except Exception as err:  # noqa: BLE001 - surface any failure to the client
        return jsonify({"error": str(err)}), 500


# Local smoke test: `python3 api/generate-pdf.py` runs a dev server on :8000
if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 8000)))
