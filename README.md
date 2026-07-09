# 🖼️ PixelForge — Image Resizer & Enhancer

A powerful, privacy-first **browser-based image processing tool** that lets you resize, compress, and enhance images — all 100% locally in your browser with zero uploads and zero servers. Built with vanilla HTML, CSS, and JavaScript, PixelForge demonstrates advanced Canvas API manipulation, real-time image processing, client-side file compression, and modern glassmorphism UI design.

---

## 🔗 Live Demo & Repository

> **Live:** (https://pixelforge.deepakdubat.workers.dev/)

> **GitHub:** (https://github.com/DeepakDubat/PixelForge)

---

## ✨ Features

| Module | Functions |
|---|---|
| **📐 Resize & Optimize** | Custom W×H, Aspect Ratio Lock/Free, Social Media Presets |
| **🗜️ Compression** | Target file size in KB (binary search quality algorithm) |
| **🎨 Image Enhancer** | Brightness, Contrast, Saturation, Hue, Sharpness, Blur, Grayscale, Sepia |
| **🖌️ Filter Presets** | Natural, Vivid, Warm, Cool, Vintage, B&W, Fade, Drama |
| **🖼️ Canvas Editor** | Zoom, Pan (drag), Fit to Frame, Center, Reset — interactive preview |
| **⬇️ Export** | Download as JPEG, WebP, or PNG at full resolution |
| **🔒 Privacy** | Zero uploads — all processing happens locally in your browser |

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Structure** | HTML5 (Semantic) |
| **Styling** | Vanilla CSS3 (Glassmorphism, Animations, CSS Variables) |
| **Logic** | Vanilla JavaScript ES2020+ (`'use strict'`, async/await) |
| **Image Processing** | HTML5 Canvas API |
| **Fonts** | Google Fonts — Outfit, Plus Jakarta Sans |
| **Hosting** | Cloudflare Pages (Free Tier) |

---

## 📁 Project Structure

```
PixelForge/
├── index.html      ← Full app layout, tabs, controls, canvas structure
├── styles.css      ← Design system, glassmorphism, responsive layout
└── app.js          ← All processing logic, Canvas API, compression engine
```

> No build tools, no npm, no dependencies — just open `index.html` and it works.

---

## 🚀 Run Locally

### Option 1 — Direct (No server needed)

Just double-click `index.html` — opens straight in your browser. ✅

### Option 2 — Local Dev Server (Recommended for testing)

```bash
# Python (comes pre-installed on most systems)
python -m http.server 7700

# Then open:
# http://localhost:7700
```

---

## 🖥️ Application Flow

```
📂 Upload / Drop Image
        │
        ▼
┌───────────────────┐
│   Image Loaded    │  ← File info, dimensions, format detected
└───────────────────┘
        │
        ▼
   Choose Mode
     │       │
     ▼       ▼
📐 Resize   🎨 Enhance
& Optimize   & Filter
     │           │
     ├─ Set W×H  ├─ Adjust Sliders
     ├─ Presets  ├─ Apply Presets
     ├─ Compress ├─ Live Preview
     ├─ Preview  └─ Download
     └─ Download
```

---

## ⚙️ How It Works — Under the Hood

### Image Resizing
Uses the **HTML5 Canvas API** to draw the source image at the target dimensions using a **CONTAIN (letterbox)** algorithm — the image always fits fully without cropping, with white padding on letterbox areas.

### Compression Engine
A **binary search algorithm** over JPEG/WebP quality (0.01–1.0) that iteratively finds the optimal quality level to hit a user-defined target file size (e.g. 100 KB) within ±1.5% accuracy — in under 24 iterations.

```js
// Binary search quality for target KB
let lo = 0.01, hi = 1.0;
for (let i = 0; i < 24; i++) {
  const mid = (lo + hi) / 2;
  blob = await toBlob(canvas, format, mid);
  if (Math.abs(blob.size - targetBytes) / targetBytes < 0.015) break;
  blob.size > targetBytes ? hi = mid : lo = mid;
}
```

### Sharpness (Unsharp Mask)
Implements a real **unsharp mask** using pixel-level manipulation via `getImageData()`:
```
sharpened = original + strength × (original − blurred)
```

### Canvas Preview
An interactive canvas viewport with zoom (scroll/pinch), pan (drag), Fit-to-Frame, and Center controls — all rendered via `requestAnimationFrame` for smooth 60fps updates.

---

## 📚 Key Concepts Demonstrated

- ✅ **Canvas API** — Draw, transform, filter, and export images at pixel level
- ✅ **Async/Await** — Non-blocking blob generation and compression loops
- ✅ **Binary Search Algorithm** — Optimal quality search for file-size targeting
- ✅ **CSS Variables & Glassmorphism** — Modern, themeable dark UI system
- ✅ **Unsharp Mask** — Manual pixel-by-pixel image sharpening with `ImageData`
- ✅ **Drag & Drop API** — Native file drag-and-drop upload
- ✅ **CSS Animations** — Micro-interactions, hover effects, blob ambient animation
- ✅ **Responsive Design** — Mobile-first layout with CSS Grid and media queries
- ✅ **Privacy by Design** — Zero server communication, 100% client-side processing

---

## 🎨 Supported Formats

| Input | Output |
|---|---|
| JPEG, PNG, WebP, GIF, BMP | JPEG (`.jpg`), WebP (`.webp`), PNG (`.png`) |

---

## 📐 Social Media Presets

| Platform | Dimensions |
|---|---|
| Instagram Post | 1080 × 1080 |
| Story / Reel | 1080 × 1920 |
| YouTube Thumbnail | 1280 × 720 |
| LinkedIn Banner | 1200 × 628 |
| Twitter Header | 1500 × 500 |
| Facebook Cover | 820 × 312 |

---

## 🔮 Future Enhancements

- [ ] Batch processing — resize multiple images at once
- [ ] Background remover using AI (TensorFlow.js)
- [ ] Image crop tool with drag handles
- [ ] Watermark / text overlay feature
- [ ] Dark/Light theme toggle
- [ ] PWA support — install as desktop app

---

## 👨‍💻 Developer

**Deepak Dubat**
B.Tech CSE (Cyber Security) | Jaipur National University

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-blue?style=flat-square)](https://deepakdubat-portfolio.pages.dev/)
[![GitHub](https://img.shields.io/badge/GitHub-DeepakDubat-black?style=flat-square&logo=github)](https://github.com/DeepakDubat)
[![Email](https://img.shields.io/badge/Email-dubatdeepak3731@gmail.com-red?style=flat-square&logo=gmail)](mailto:dubatdeepak3731@gmail.com)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

