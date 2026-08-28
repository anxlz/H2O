"""
Renders a Program (see lib/types.ts) into the H2O Gym branded PDF.

This is the single source of truth for the rendering logic — both
`scripts/generate_pdf.py` (local CLI, for `npm run dev`) and
`api/generate-pdf.py` (the Vercel Python Function used in production)
import `render_program_pdf` from here instead of keeping their own copies.

Ported from the h2o-gym-program-builder skill's scripts/pdf_theme_template.py —
keep the two in sync if the design changes.
"""

from __future__ import annotations

import os
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

# Fonts are bundled in the repo (assets/fonts) so rendering is identical and
# portable across local dev, CI, and Vercel's Python runtime — no reliance on
# system font paths like /usr/share/fonts/truetype/dejavu that may not exist
# in a serverless environment.
_HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(_HERE, "assets", "fonts")
if not os.path.isdir(FONT_DIR):
    FONT_DIR = None  # falls back to Pillow's built-in bitmap font


def font(name, size):
    if FONT_DIR is None:
        return ImageFont.load_default()
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


F_TITLE = font("DejaVuSans-Bold.ttf", 62)
F_SUB = font("DejaVuSans-Bold.ttf", 28)
F_GROUP = font("DejaVuSans-Bold.ttf", 32)
F_NAME = font("DejaVuSans-Bold.ttf", 30)
F_META = font("DejaVuSans.ttf", 22)
F_SEQ = font("DejaVuSans-Bold.ttf", 28)
F_CHIP = font("DejaVuSans-Bold.ttf", 20)
F_SMALL = font("DejaVuSans.ttf", 19)
F_FOOT = font("DejaVuSans.ttf", 19)
F_BIG_NUM = font("DejaVuSans-Bold.ttf", 34)

# Purple/yellow — training days
BG = (24, 23, 29)
PANEL = (34, 31, 42)
ROW_A = (39, 36, 49)
ROW_B = (34, 31, 42)
PURPLE = (99, 58, 150)
PURPLE_D = (58, 34, 89)
YELLOW = (219, 212, 78)
TEXT = (247, 245, 241)
SUBTEXT = (173, 167, 189)
DIVIDER = (55, 51, 66)
CHIP_BG = (50, 46, 61)
FW_BG = YELLOW
FW_TEXT = (34, 31, 42)

# Green — cardio / warm-up / rest
GREEN_D = (24, 56, 38)
GREEN = (46, 125, 74)
LIME = (168, 224, 99)
GBG = (20, 26, 22)
GCHIP_BG = (37, 48, 39)

W = 1500
PAD = 56
THUMB = 176
ROW_H = 224
GROUP_H = 74
HEADER_H = 260
FOOT_H = 100


def square_thumb(path, size):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    im = im.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=22, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def blank_thumb(size):
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    d.rounded_rectangle([0, 0, size, size], radius=22, fill=(60, 56, 70, 255))
    return out


def _text_w(draw, text, fnt):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0]


def draw_chip(draw, x, y, text, fnt, fg, bg, pad_x=14, pad_y=7, radius=13):
    tw = _text_w(draw, text, fnt)
    th = fnt.size if hasattr(fnt, "size") else 16
    draw.rounded_rectangle([x, y, x + tw + pad_x * 2, y + th + pad_y * 2], radius=radius, fill=bg)
    draw.text((x + pad_x, y + pad_y - 2), text, font=fnt, fill=fg)
    return tw + pad_x * 2


def sets_reps_label(ex):
    return f"{ex['sets']} sets x {ex['reps']} reps"


def weight_label(ex):
    w = ex["weight"]
    if w.get("kind") == "freeWeight":
        return "FREE WEIGHT"
    return f"{w['amount']} {w['unit']}"


def rest_label(seconds):
    if seconds and seconds % 60 == 0:
        return f"{seconds // 60} min"
    return f"{seconds}s"


def build_training_day(day, member, trainer, thumb_dir):
    groups = [g for g in day["groups"] if g["exercises"]]
    n_rows = sum(len(g["exercises"]) for g in groups)
    n_groups = len(groups)
    height = HEADER_H + n_groups * GROUP_H + n_rows * ROW_H + FOOT_H + PAD
    img = Image.new("RGB", (W, max(height, HEADER_H + FOOT_H + 200)), BG)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, HEADER_H], fill=PURPLE_D)
    draw.rectangle([0, HEADER_H - 10, W, HEADER_H], fill=YELLOW)
    draw.text((PAD, 46), f"DAY {day['dayNumber']}", font=F_SUB, fill=YELLOW)
    draw.text((PAD, 88), day["label"] or "Training", font=F_TITLE, fill=TEXT)
    draw.text((PAD, 208), f"Member: {member}   |   Trainer: {trainer}", font=F_META, fill=SUBTEXT)

    y = HEADER_H + 20
    row_toggle = 0
    for g in groups:
        draw.rectangle([0, y, W, y + GROUP_H], fill=PURPLE)
        draw.text((PAD, y + 18), g["muscleGroup"].upper(), font=F_GROUP, fill=YELLOW)
        y += GROUP_H

        for ex in g["exercises"]:
            row_bg = ROW_A if row_toggle % 2 == 0 else ROW_B
            row_toggle += 1
            draw.rectangle([0, y, W, y + ROW_H], fill=row_bg)

            thumb_file = ex.get("thumbnailFile")
            thumb_path = os.path.join(thumb_dir, thumb_file) if thumb_file else None
            thumb = square_thumb(thumb_path, THUMB) if thumb_path and os.path.exists(thumb_path) else blank_thumb(THUMB)
            ty = y + (ROW_H - THUMB) // 2
            img.paste(thumb, (PAD, ty), thumb)

            badge_r = 26
            bx, by = PAD - 10, ty - 10
            draw.ellipse([bx, by, bx + badge_r * 2, by + badge_r * 2], fill=YELLOW)
            seq_txt = str(ex["seq"])
            bbox = draw.textbbox((0, 0), seq_txt, font=F_SEQ)
            tw_, th_ = bbox[2] - bbox[0], bbox[3] - bbox[1]
            draw.text((bx + badge_r - tw_ / 2, by + badge_r - th_ / 2 - bbox[1]), seq_txt, font=F_SEQ, fill=(34, 31, 42))

            tx = PAD + THUMB + 40
            draw.text((tx, ty + 2), ex.get("machineName", "Exercise"), font=F_NAME, fill=TEXT)

            chip_y = ty + 46
            cx = tx
            cx += draw_chip(draw, cx, chip_y, sets_reps_label(ex), F_CHIP, TEXT, CHIP_BG) + 12
            is_fw = ex["weight"].get("kind") == "freeWeight"
            if is_fw:
                cx += draw_chip(draw, cx, chip_y, "FREE WEIGHT", F_CHIP, FW_TEXT, FW_BG) + 12

            chip_y2 = chip_y + 44
            if not is_fw:
                draw_chip(draw, tx, chip_y2, weight_label(ex), F_CHIP, TEXT, CHIP_BG)
            else:
                chip_y2 = chip_y  # no second chip row needed, pull the detail line up

            detail = f"Technique {ex.get('technique') or '-'} \u00b7 Rest {rest_label(ex.get('restSeconds', 0))}"
            draw.text((tx, chip_y2 + 46), detail, font=F_SMALL, fill=SUBTEXT)

            y += ROW_H
            draw.line([PAD, y, W - PAD, y], fill=DIVIDER, width=1)

    draw.rectangle([0, img.height - FOOT_H, W, img.height], fill=PANEL)
    draw.text((PAD, img.height - FOOT_H + 20), "H2O Gym Guide", font=F_FOOT, fill=SUBTEXT)
    return img


def build_rest_day(day, member, trainer):
    height = 620
    img = Image.new("RGB", (W, height), GBG)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, HEADER_H], fill=GREEN_D)
    draw.rectangle([0, HEADER_H - 10, W, HEADER_H], fill=LIME)
    draw.text((PAD, 46), f"DAY {day['dayNumber']}", font=F_SUB, fill=LIME)
    draw.text((PAD, 88), "Rest Day", font=F_TITLE, fill=TEXT)
    draw.text((PAD, 208), f"Member: {member}   |   Trainer: {trainer}", font=F_META, fill=SUBTEXT)

    y = HEADER_H + 40
    draw.rounded_rectangle([PAD, y, W - PAD, y + 200], radius=18, fill=GCHIP_BG)
    draw.text((PAD + 40, y + 40), "No training scheduled.", font=F_NAME, fill=TEXT)
    draw.text((PAD + 40, y + 90), "Focus on recovery: sleep, hydration, and light stretching.", font=F_META, fill=SUBTEXT)
    return img


def build_cardio_page(cardio, member, trainer):
    height = 700
    img = Image.new("RGB", (W, height), GBG)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, HEADER_H], fill=GREEN_D)
    draw.rectangle([0, HEADER_H - 10, W, HEADER_H], fill=LIME)
    draw.text((PAD, 46), "EVERY TRAINING DAY", font=F_SUB, fill=LIME)
    draw.text((PAD, 88), "Cardio & Rest", font=F_TITLE, fill=TEXT)
    draw.text((PAD, 208), f"Member: {member}   |   Trainer: {trainer}", font=F_META, fill=SUBTEXT)

    y = HEADER_H + 30
    draw.rectangle([0, y, W, y + GROUP_H], fill=GREEN)
    draw.text((PAD, y + 18), "SCHEDULE", font=F_GROUP, fill=LIME)
    y += GROUP_H + 40

    items = [
        ("Cardio", f"{cardio.get('type') or 'Cardio'}"),
        ("Warm Up", f"{cardio.get('warmupMinutes', 0)} minutes"),
        ("Post Workout", f"{cardio.get('postWorkoutMinutes', 0)} minutes"),
        ("Rest Between Sets", f"{cardio.get('restBetweenSetsMinutes', 0)} minute(s)"),
    ]
    cx = PAD
    for label, val in items:
        chip_w = 320
        draw.rounded_rectangle([cx, y, cx + chip_w, y + 130], radius=18, fill=GCHIP_BG)
        draw.text((cx + 24, y + 22), label, font=F_NAME, fill=TEXT)
        draw.text((cx + 24, y + 70), val, font=F_BIG_NUM, fill=LIME)
        cx += chip_w + 24

    draw.rectangle([0, height - FOOT_H, W, height], fill=(28, 36, 30))
    draw.text((PAD, height - FOOT_H + 30), "H2O Gym Guide", font=F_FOOT, fill=SUBTEXT)
    return img


def render_program_pdf(program: dict, thumb_dir: str) -> bytes:
    """Build the full multi-page PDF for a program and return it as bytes.

    `program` must already be "enriched": each exercise needs `machineName`
    and `thumbnailFile` (the basename of the thumbnail image inside
    `thumb_dir`, or None) set on it. See `enrich_program` in
    `api/generate-pdf.py` / `scripts/generate_pdf.py` for how that mapping
    gets applied from `data/machines.json`.
    """
    member = program.get("memberName") or "Member"
    trainer = program.get("trainerName") or "Trainer"

    pages = [build_cardio_page(program.get("cardio", {}), member, trainer)]
    for day in program.get("days", []):
        if day.get("isRestDay"):
            pages.append(build_rest_day(day, member, trainer))
        else:
            pages.append(build_training_day(day, member, trainer, thumb_dir))

    buf = BytesIO()
    pages[0].save(buf, format="PDF", save_all=True, append_images=pages[1:])
    return buf.getvalue()


def enrich_program(program: dict, machines_by_id: dict) -> dict:
    """Attach machineName / thumbnailFile to every exercise, mirroring what
    the old Node route did with lib/machines-seed.ts. `machines_by_id` maps
    machine id -> {"name": ..., "thumbnailUrl": "/machines/..."} (see
    data/machines.json)."""

    def enrich_exercise(ex):
        m = machines_by_id.get(ex["machineId"])
        thumbnail_url = m.get("thumbnailUrl") if m else None
        return {
            **ex,
            "machineName": (m or {}).get("name", "Unknown machine"),
            "thumbnailFile": os.path.basename(thumbnail_url) if thumbnail_url else None,
        }

    return {
        **program,
        "days": [
            {
                **day,
                "groups": [
                    {**g, "exercises": [enrich_exercise(ex) for ex in g["exercises"]]}
                    for g in day["groups"]
                ],
            }
            for day in program.get("days", [])
        ],
    }
