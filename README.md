# H2O Gym — Program Builder

A Next.js + shadcn-style UI for building member workout programs with a
categorized machine picker (instead of scanning a handwritten sheet), and
generating the same purple/yellow (training day) and green (cardio/rest)
branded PDF built by hand earlier in this project.

## Status — read this first

This project was hand-edited in a sandbox with **no network access**
(`npm install` fails with `403`/`host_not_allowed` against every registry).
That means:

- ✅ **The Python side is fully tested**, including the actual production
  entry point. `pdf_engine.render_program_pdf` was exercised directly, and
  `api/generate-pdf.py`'s Flask `app` was exercised through Flask's own test
  client with a realistic JSON payload (the same shape the browser sends) —
  both produced valid multi-page PDFs (`%PDF-...` header, correct page
  count). `scripts/generate_pdf.py` was also run as a real subprocess end to
  end.
- ✅ All `.ts`/`.tsx`/`.py` files passed a structural sanity check (balanced
  braces/parens/brackets, valid Python AST parse, valid JSON for
  `data/machines.json`), and every `category`/`equipment` string now used in
  `lib/machines-seed.ts` was checked against the `MuscleGroup`/`Equipment`
  unions in `lib/types.ts` to confirm nothing was left out.
- ⚠️ **`npm run build` has still not been run.** Without network access
  `npm install` can't fetch packages, so there may be a small issue (an
  import path, a prop type) a real build would catch that hand-editing
  can't fully rule out. **Run `npm install && npm run build` locally before
  deploying** — fix whatever surfaces there first.

## Setup

```bash
npm install
pip install -r requirements.txt   # Flask + Pillow, needed for local PDF generation
npm run dev:all
```Open http://localhost:3000. You should see the program builder: a member/trainer
name form, a tab per day, a categorized machine picker, and a "Generate PDF"
button.

`api/generate-pdf.py` is a **standalone Vercel Python Function** — on
Vercel it's served directly by Vercel's router, but `next dev` on its own
has no idea that file exists, so "Generate PDF" would just 404. `npm run
dev:all` starts both processes together: `next dev` on :3000 and the Flask
dev server (`api/generate-pdf.py`) on :8000, with a rewrite in
`next.config.mjs` (dev-only) that proxies `/api/generate-pdf` from the
former to the latter. Equivalent to running these in two terminals:

```bash
npm run dev        # Next.js app on :3000
npm run dev:api    # Flask PDF API on :8000
```

Fonts are bundled at `assets/fonts/` (DejaVu Sans/Sans-Bold), so rendering
looks the same locally, in CI, and on Vercel — no dependency on system font
paths.

### Dependency pins, and why

- **`next`/`react`/`react-dom` are pinned to 15.1.9 / 19.0.1** (not 15.1.0 /
  19.0.0). Those were the original versions and carry
  [CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478) / CVE-2025-55182 —
  a CVSS 10.0 unauthenticated RCE in the React Server Components protocol
  that affects every Next.js 15.x/16.x App Router app, this one included.
  There's no workaround short of upgrading; if you ever bump these further,
  stay on a patched line (15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, or
  16.0.7+) rather than reverting. `package-lock.json` was deleted so the
  first `npm install` regenerates it against the patched versions instead of
  resolving the old vulnerable ones.
- **`Pillow` in `requirements.txt` is `>=12.0`**, not the exact `==11.0.0`
  pin it started as. Pillow 11.0.0 predates Python 3.14 and has no prebuilt
  Windows wheel for it, so `pip install` tries to compile it from source and
  fails on a missing zlib header. Pillow 12.x ships wheels for Python
  3.9–3.14, so this installs cleanly on whichever supported Python you're
  running.

## UI

- **Design system**: [shadcn/ui](https://ui.shadcn.com) primitives already
  live in `components/ui/` (button, card, input, select, switch, tabs,
  badge, label), themed with the H2O brand tokens in `app/globals.css` /
  `tailwind.config.ts`. This build's header, toggles, and layout polish were
  hand-built on top of those same primitives in the
  [Shadcn Studio](https://shadcnstudio.com) style (clean navbar block,
  icon-button toggles) — this sandbox has no network access, so nothing was
  pulled live from their CLI/registry; if you want an exact Shadcn Studio
  block, their site has a copy-paste/CLI flow for it.
- **Light/dark mode**: toggle in the header (moon/sun icon). No `next-themes`
  dependency — a small inline script in `app/layout.tsx` applies the saved
  preference (or OS preference on first visit) before paint, and
  `components/theme-toggle.tsx` flips the `dark` class + remembers the
  choice in `localStorage`. Dark tokens are the `.dark { ... }` block in
  `app/globals.css`.
- **English/Arabic**: toggle in the header (globe icon). `lib/i18n.ts` holds
  the string dictionary, `components/language-provider.tsx` is the context
  (`useLanguage()` → `t(key)`, `locale`, `toggleLocale`), and switching sets
  `dir="rtl"`/`lang="ar"` on `<html>`. Exercise/machine names in
  `lib/machines-seed.ts` are data, not UI chrome, and stay in English for
  now — translating the 382-machine library is a separate effort.

## Machine library

`lib/machines-seed.ts` now has **382 machines**, of which **345 have real
thumbnails**:

- The original **22** hand-verified entries from actual recorded machine
  clips (Mohamed Fathy's program) — unchanged.
- **309 more**, added from `frames.zip` (334 recorded clip-frame thumbnails
  in total; 14 of them matched — and were merged into — existing placeholder
  rows below, so they don't appear twice). Names, categories, and equipment
  were derived from the clip filenames, which already followed the gym's
  `name_equipment.jpg` convention — not scraped from any third-party
  database. Thumbnails live in `public/machines/frames/`.
- A small remainder still has no recorded clip and shows a letter
  placeholder in the picker until the gym records one.

`data/machines.json` is a generated snapshot of `lib/machines-seed.ts` (id,
name, category, equipment, thumbnailUrl) that the Python PDF function reads
at request time, so it doesn't need its own copy of the TypeScript seed
data. **Regenerate it whenever `lib/machines-seed.ts` changes** — there's no
build-time hook wired up yet, so for now this is a manual step (a small
Node or Python script that parses the `machines` array and writes the JSON
file back out; the shape must stay `{id, name, category, equipment,
thumbnailUrl?}[]`).

## Architecture notes

- **State is in-memory only** (React `useState` in `app/page.tsx`) — nothing
  persists on refresh yet. Postgres (Neon or Vercel Postgres) is the natural
  next slice; `lib/types.ts` is already shaped to map onto a Prisma/Drizzle
  schema without much rework.
- **PDF generation runs natively on Vercel** — `api/generate-pdf.py` is a
  standalone Vercel Python Function (a Flask `app`) that Vercel's Python
  runtime picks up automatically alongside the Next.js app; no config beyond
  `vercel.json` (which just bumps memory/timeout for this one function) is
  needed. It shares its rendering code with the local CLI
  (`scripts/generate_pdf.py`) via `pdf_engine.py` at the repo root, so the
  two can't drift out of sync. The old approach — a Node API route spawning
  a local `python3` subprocess — has been removed; it never would have
  worked on Vercel's Node serverless functions in the first place.
- **No auth yet** — single-tenant, anyone who can reach the app can use it.
  Fine for an internal v1, not for anything public.
- Brand colors live in two places that need to stay in sync if the theme
  changes: `tailwind.config.ts` / `app/globals.css` (web UI) and
  `pdf_engine.py` (PDF). Both were derived from the same validated hex
  values — see the `h2o-gym-program-builder` skill's
  `references/design-tokens.md` for the source of truth.

## Deploying

1. Get `npm run build` passing locally first.
2. Push to a GitHub repo, import it in the Vercel dashboard, deploy. Vercel
   auto-detects both the Next.js app and `api/generate-pdf.py` (via
   `requirements.txt` at the repo root) — no extra configuration needed
   beyond what's already in `vercel.json`.
3. Add a Postgres database and wire up persistence when you're ready to move
   past in-memory state.

## Related

See the `h2o-gym-program-builder` Claude skill for the full architecture
plan, data model, design tokens, and the licensing note on why this project
doesn't scrape FitNotes X's exercise database.
"# H2O" 
