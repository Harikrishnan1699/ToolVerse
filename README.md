# Toolverse 🧰

A modern, all-in-one utility hub — **62+ tools**, all running entirely in your browser.

🌐 **Live:** https://harikrishnan1699.github.io/ToolVerse/

## What's inside

| Category | Highlights |
|---|---|
| 📄 **PDF (19)** | Merge, split, compress, rotate, watermark, page numbers, organize, scan, repair, crop, edit, sign (canvas pad), redact, unlock, JPG↔PDF, HTML→PDF |
| 🖼 **Image (9)** | Compressor, resizer, format converter, watermark, favicon generator, color picker, meme generator, **OCR (Tesseract)**, **AI background remover (ONNX)** |
| 🎬 **Audio & Video (5)** | **FFmpeg.wasm**: video → GIF, video compressor, video trimmer, audio converter (MP3/WAV/OGG/AAC/FLAC/M4A), audio trimmer |
| ⌨ **Developer (10)** | JSON formatter, Base64, URL encode, hash (MD5/SHA-1/256/512/3), JWT decoder, UUID, regex tester, color converter, gradient generator, box-shadow |
| ¶ **Text (3)** | Counter / case / lorem / diff / dedup / reverse / find-replace · Markdown editor · Speech (TTS + STT) |
| ∑ **Calculators (10)** | Unit converter (7 types), age, date diff, BMI, loan/EMI, tip-split, percentage, GST, Roman numerals, number-to-words |
| ▦ **QR (2)** | Generator (URL/WiFi/UPI/vCard/email/SMS) · Scanner (camera + image) |
| 🔐 **Security (3)** | Password generator + strength checker · AES encrypt/decrypt · Fake data (CSV/JSON) |
| ⏱ **Productivity (6)** | Pomodoro · Stopwatch · Countdown · To-do · Notes · Random (dice/coin/picker/range) |
| 🏷 **SEO (2)** | Meta tag + OG + Twitter card generator · robots.txt + sitemap.xml |
| 🌐 **Live data (6)** | Currency (Frankfurter) · Crypto (CoinGecko) · Weather (Open-Meteo) · Country info (REST Countries) · IP lookup · Public holidays |

## Tech stack

- **Angular 21** — zoneless change detection, lazy-loaded routes
- **Tailwind CSS 3** — modern design system, dark mode
- **pdf-lib** + **pdfjs-dist** — PDF manipulation & rendering
- **Tesseract.js** — on-device OCR
- **FFmpeg.wasm** — audio / video processing
- **@imgly/background-removal** — ONNX AI background removal
- **CryptoJS**, **qrcode**, **jsqr**, **marked**, **@faker-js/faker**, **file-saver**

## Privacy

100% client-side. Files never leave your device. No tracking, no accounts, no ads.

## Run locally

```bash
npm install
npm start            # http://localhost:4200
```

## Build

```bash
npm run build        # production build → dist/toolverse/browser
```

## Deploy

Pushing to `main` automatically deploys to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## License

MIT
