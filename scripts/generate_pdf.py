"""
CLI wrapper for local development / testing:

    python3 scripts/generate_pdf.py <input_program.json> <output.pdf> <thumbnail_dir>

<input_program.json> must already be "enriched" (each exercise has
`machineName` and `thumbnailFile` set) — see `pdf_engine.enrich_program`.
The actual rendering lives in `pdf_engine.py` at the repo root, shared with
the production `api/generate-pdf.py` Vercel Python Function so the two never
drift out of sync.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pdf_engine import render_program_pdf


def main():
    if len(sys.argv) != 4:
        print("Usage: generate_pdf.py <input.json> <output.pdf> <thumbnail_dir>", file=sys.stderr)
        sys.exit(1)

    input_path, output_path, thumb_dir = sys.argv[1], sys.argv[2], sys.argv[3]

    with open(input_path, "r") as f:
        program = json.load(f)

    pdf_bytes = render_program_pdf(program, thumb_dir)
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    n_pages = 1 + len(program.get("days", []))
    print(f"Wrote {n_pages} page(s) to {output_path}")


if __name__ == "__main__":
    main()
