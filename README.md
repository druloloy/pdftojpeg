# PDF → JPEG Converter

Convert any PDF into high-quality JPEG images — one file per page, bundled as a ZIP.

Built with **Fastify** (backend) + **React** (frontend), deployable on [Railway](https://railway.app) with zero config.

---

## Features

- Drag & drop or browse to upload PDFs up to **100 MB**
- Every page is converted at 2× scale (~144 dpi) for crisp output
- JPEG quality set to 92 (mozjpeg) for best size/quality ratio
- Download all pages as a single ZIP archive
- No file storage — conversion is in-memory, nothing is persisted

---

## Tech Stack

| Layer     | Library                      |
|-----------|------------------------------|
| Backend   | Fastify 5                    |
| Upload    | @fastify/multipart           |
| PDF parse | pdf-to-img (pdfjs-dist)      |
| JPEG      | sharp (mozjpeg)              |
| ZIP       | jszip                        |
| Frontend  | React 18 + Vite              |

---

## Local Development

```bash
npm install
npm run dev
```

- React dev server → `http://localhost:5173`
- Fastify API → `http://localhost:3000`
- Vite proxies `/api/*` to Fastify automatically

---

## Production Build

```bash
npm run build   # builds React into /dist
npm start       # Fastify serves /dist + /api/*
```

---

## Deploy to Railway

1. Push this repo to GitHub
2. Create a new project in Railway → **Deploy from GitHub repo**
3. Railway auto-detects `railway.toml` and runs:
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Set `PORT` env var if needed (Railway injects it automatically)

That's it — no additional environment variables required.

---

## Environment Variables

| Variable | Default | Description              |
|----------|---------|--------------------------|
| `PORT`   | `3000`  | Port the server listens on |
