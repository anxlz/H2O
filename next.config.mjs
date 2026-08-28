/** @type {import('next').NextConfig} */
const nextConfig = {
  // `api/generate-pdf.py` is a standalone Vercel Python Function (see
  // vercel.json). In production, Vercel's own router serves it directly at
  // `/api/generate-pdf` *before* the Next.js app is ever invoked, so this
  // rewrite never applies there.
  //
  // Locally, `next dev` only knows about the Next.js app — it has no idea
  // that Python file exists — so a POST to `/api/generate-pdf` fell through
  // to Next's own 404 page (that's the "Generate PDF" bug). This rewrite
  // proxies that one request, server-side, to the Flask dev server started
  // by `npm run dev:api` (see package.json / README "Setup").
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/api/generate-pdf",
        destination: "http://127.0.0.1:8000/api/generate-pdf",
      },
    ];
  },
};

export default nextConfig;
