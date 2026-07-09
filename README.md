# 🖼️ PixelForge — Image Resizer & Enhancer

A powerful, privacy-first **browser-based image processing tool** that lets you resize, compress, and enhance images — all 100% locally in your browser with zero uploads and zero servers. Built with vanilla HTML, CSS, and JavaScript, PixelForge demonstrates advanced Canvas API manipulation, real-time image processing, client-side file compression, and modern glassmorphism UI design.

---

## 🔗 Live Demo & Repository

> **Live:** [pixelforge.pages.dev](https://pixelforge.pages.dev) *(Deploy on Cloudflare Pages — Free)*
> **GitHub:** [github.com/DeepakDubat/PixelForge](https://github.com/DeepakDubat/PixelForge)

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

## ☁️ Deploy on Cloudflare Pages (Free)

### Option A — Direct Upload (2 minutes, no GitHub needed)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Create free account
2. **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. Name your project (e.g. `pixelforge`)
4. Drag & drop all 3 files: `index.html`, `styles.css`, `app.js`
5. Click **Deploy** → Live at `pixelforge.pages.dev` ✅

### Option B — GitHub Auto-Deploy

1. Fork/clone this repo to your GitHub
2. Cloudflare Pages → **Connect to Git** → Select this repo
3. Build settings:
   - **Build command:** *(leave blank)*
   - **Output directory:** `/`
4. Deploy → Every `git push` auto-updates the live site ✅

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

---

# 💳 Credit Card Management System

A robust, feature-rich **Credit Card Management System** built in Java with MySQL backend, enabling users to manage credit card accounts, track transactions, handle billing cycles, EMI conversions, and perform secure card operations — all through an intuitive console-based interface. This project demonstrates core Java concepts including OOP principles, JDBC connectivity, DAO design pattern, layered architecture, and MySQL database integration.

---

## 🔗 Repository

> **GitHub:** [github.com/DeepakDubat](https://github.com/DeepakDubat)

---

## ✨ Features

| Module | Functions |
|---|---|
| **👤 User Management** | Register, Login, Update Profile, Change Password, Delete Account |
| **💳 Card Management** | Apply, Issue (Admin), Block, Unblock, Credit Limit Update |
| **💸 Transactions** | Purchase, Cash Advance (3% fee), Payment, Refund, History |
| **🧾 Billing** | Generate Bill, Pay Bill, Convert to EMI (1.5%/month) |
| **🔐 Security** | Set PIN, OTP Generation, Lock/Unlock Card |
| **📊 Reports** | Monthly Summary, Spending Analysis, Admin Dashboard |

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Language** | Java SE 11+ |
| **Database** | MySQL |
| **IDE** | Apache NetBeans |
| **Connectivity** | JDBC (MySQL Connector/J) |

---

## 📁 Project Structure

```
Credit card management system/
├── schema.sql                   ← Run this in MySQL Workbench FIRST
├── build_and_run.bat            ← Alt: compile & run from command line
├── lib/
│   └── mysql-connector-j.jar   ← Download and place here
└── src/
    ├── models/
    │   ├── User.java
    │   ├── CreditCard.java
    │   ├── Transaction.java
    │   └── Bill.java
    ├── dao/
    │   ├── DBConnection.java    ← UPDATE password here
    │   ├── UserDAO.java
    │   ├── CreditCardDAO.java
    │   ├── TransactionDAO.java
    │   └── BillDAO.java
    ├── services/
    │   ├── UserService.java
    │   ├── CardService.java
    │   ├── TransactionService.java
    │   ├── BillingService.java
    │   ├── SecurityService.java
    │   └── ReportService.java
    └── ui/
        ├── Main.java            ← Entry point (Main class)
        ├── AdminMenu.java
        └── CustomerMenu.java
```

---

## 🚀 Setup Instructions

### Step 1 — Setup MySQL Database

1. Open **MySQL Workbench**
2. Connect to your local MySQL server
3. Open `schema.sql` → Run it (`Ctrl+Shift+Enter` or ⚡ button)
4. This creates database `credit_card_db` with all tables and a default admin user

### Step 2 — Download MySQL JDBC Connector

1. Go to: https://dev.mysql.com/downloads/connector/j/
2. Download the **Platform Independent** ZIP
3. Extract and copy `mysql-connector-j-x.x.x.jar`
4. Paste it into the `lib/` folder of this project

### Step 3 — Configure Database Password

Open `src/dao/DBConnection.java` and update your MySQL password:

```java
private static final String DB_PASSWORD = "root"; // ← change to your password
```

### Step 4 — Setup in Apache NetBeans

1. Open NetBeans → **File → New Project → Java with Existing Sources**
2. Set **Project Folder** to this directory
3. Add `src/` as the **Source Package Folder**
4. Right-click Project → **Properties → Libraries → Add JAR/Folder**
5. Browse to `lib/mysql-connector-j.jar` → Add it
6. Set **Main Class** to `ui.Main`
7. Press **F6** to Run

### Step 5 — (Alternative) Run from Command Line

```bash
# Compile
javac -cp lib/mysql-connector-j.jar -d out src/models/*.java src/dao/*.java src/services/*.java src/ui/*.java

# Run
java -cp out;lib/mysql-connector-j.jar ui.Main
```

> On Linux/macOS replace `;` with `:` in the classpath

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |

> ⚠️ Change the admin password after first login for security.

---

## 🖥️ Application Flow

```
🔐 Login / Register
        │
        ▼
┌───────────────────┐
│     Role Check    │
└───────────────────┘
     │           │
     ▼           ▼
👑 Admin      👤 Customer
  Menu          Menu
  │              │
  ├─ Issue Card  ├─ View Account
  ├─ Manage      ├─ Make Transaction
  │  Users       ├─ Pay Bill / EMI
  ├─ Reports     ├─ View History
  └─ Dashboard   └─ Security Settings
```

---

## 📚 Key Concepts Demonstrated

- ✅ **Layered Architecture** — Models → DAO → Services → UI separation of concerns
- ✅ **JDBC & MySQL** — Real database connectivity with prepared statements
- ✅ **DAO Design Pattern** — Clean data access abstraction for every entity
- ✅ **OOP Principles** — Encapsulation, Inheritance, Polymorphism across all layers
- ✅ **Exception Handling** — Graceful error management for DB and input failures
- ✅ **Security Features** — PIN, OTP, card lock/unlock mechanisms
- ✅ **Business Logic** — Interest calculation, EMI conversion, cash advance fees

---

## 🔮 Future Enhancements

- [ ] GUI using **Java Swing** or **JavaFX**
- [ ] REST API version using **Spring Boot**
- [ ] Export billing statements as **PDF**
- [ ] Email alerts for due dates and transactions
- [ ] Two-Factor Authentication (2FA)
- [ ] Docker support for easy deployment

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

---

> 💡 *Built as an academic project to demonstrate Java OOP, JDBC, DAO pattern, and MySQL-backed application development.*
