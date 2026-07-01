<div align="center">

<img src="logo.png" alt="Yupoo Sorter logo" width="120" />

# 🧊 Yupoo Sorter

**A minimal, white, modern desktop app to keep your Yupoo album links organized.**

Paste a link, and it pulls the product images and title for you — clothing, jewelry, shoes and accessories, all in one clean overview.

<br/>

[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-stable-000000?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Platform](https://img.shields.io/badge/Windows-10%2F11-0078D6?logo=windows&logoColor=white)](#-download)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

- 🔗 **Yupoo album import** — paste an album link and the app automatically pulls the **product images** and the **title** in the background, so you can keep adding items without waiting.
- 🖼️ **Gallery + lightbox** — every item keeps a set of images; click a card to browse them with arrows and keyboard.
- 🗂️ **Categories & status** — organize by *Clothing · Jewelry · Shoes · Accessories* and track *Saved · Ordered · Received*.
- ⭐ **Favorites & tags** — star what matters and add your own tags.
- 🔍 **Search, filter & sort** — find anything by title/tags, filter by category or status, sort by date or name.
- 🗑️ **Trash** — deletes go to a recycle bin with a confirmation; restore anything or empty it for good.
- 💾 **No database, one portable file** — your whole collection lives in a single JSON file you can **export/import** to move between PCs.
- 🪶 **Tiny & fast** — native Windows WebView2, ~13 MB executable, low memory (no bundled Chromium).
- 🎨 **Distinctive white UI** — clean, animated, intentional — not your average starter-app look.

## 📦 Download

Grab the latest build from the [**Releases**](https://github.com/EmirRamco/Yupoo-Sorter/releases) page:

- **Installer** — `Yupoo Sorter_x64-setup.exe` (recommended)
- **Portable** — `yupoo-sorter.exe` (just run it)
- **MSI** — `Yupoo Sorter_x64_en-US.msi`

> 💡 Windows 10/11 include the required **WebView2** runtime by default, so no extra setup is needed.

## 🛠️ Tech stack

| Layer | Tech |
|------|------|
| Desktop shell | [Tauri 2](https://tauri.app) (Rust) |
| Frontend | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [lucide-react](https://lucide.dev) |

The Yupoo image fetching runs in Rust (via `reqwest`) with a proper `Referer` header, which bypasses hotlink protection and CORS; images are stored as compact embedded thumbnails so the collection stays a single portable file.

## 🚀 Build from source

**Prerequisites:** [Node.js](https://nodejs.org), [Rust](https://www.rust-lang.org/tools/install) (MSVC toolchain) and the Microsoft C++ Build Tools. On Windows 10/11 WebView2 is already installed.

```bash
# install dependencies
npm install

# run in development (hot reload)
npm run tauri dev

# build the production app + installers
npm run tauri build
```

Artifacts land in `src-tauri/target/release/` (the `.exe`) and `src-tauri/target/release/bundle/` (NSIS/MSI installers).

## 💾 Data & portability

- **Auto-save:** `%APPDATA%\com.yupoosorter.app\yupoo-sorter.json`
- **Export/Import:** save your collection anywhere (USB stick, cloud) and load it on another PC — images are embedded, so it's fully self-contained.

## ⚠️ Disclaimer

This is a personal organization tool. It only reads publicly accessible Yupoo album pages to display thumbnails for your own reference. Please respect Yupoo's terms of service and the rights of content owners.

## 👤 Author

Made by **Emirhan** — [@EmirRamco](https://github.com/EmirRamco)

## 📄 License

Released under the [MIT License](LICENSE).
