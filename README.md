# 🎬 insta-cut

**Fast, Private, and Browser-based MP4 Video Trimmer.**

> **Unlimited Free + Open Source**  
> **No Signup · No Ads · No Watermarks · No Data Collection**

[English](README.md) | [한국어](README.ko.md) | [简体中文](README.zh.md) | [日本語](README.ja.md)

`insta-cut` is a high-performance MP4 editing tool that runs instantly in the browser without server uploads. Powered by **FFmpeg.wasm**, all video processing happens locally on your device, ensuring fast and secure editing without data leakage.

<div align="center">
  <a href="https://jkh-ml.github.io/insta-cut/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/🚀%20Go%20to%20Live%20Demo-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo">
  </a>
</div>

---

## ✨ Key Features

- **⚡ Serverless Encoding**: No video uploads to servers. Processing happens entirely within the browser.
- **✂️ Precise Cut Editing**: Micro-adjustments in 0.01-second increments and frame-by-frame navigation.
- **🖼️ High-Quality Frame Capture**: Instantly extract any scene as a PNG image.
- **⌨️ Keyboard Shortcut Support**: Efficient timeline control using arrow keys (←, →) and Spacebar.
- **🎨 Modern UI/UX**: Minimalist and sophisticated design in shadcn/ui style.
- **🔒 Privacy Protection**: All work is completed locally, so you can edit sensitive videos with peace of mind.

## 🛠️ Tech Stack

- **Engine**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) (WebAssembly)
- **Frontend**: Vanilla HTML5, CSS3 (Modern Zinc Theme), JavaScript (ES6+)
- **SEO**: Meta Tags, robots.txt, sitemap.xml optimized
- **Deployment**: GitHub Pages (SharedArrayBuffer support via COI Service Worker)

## 📖 Quick Start

1. **Upload File**: Drag and drop or click to select an MP4 file.
2. **Set Interval**: Use the bottom slider or keyboard arrow keys to set the start/end points.
    - `← / →`: Move 0.05s
    - `Shift + ← / →`: Move 0.01s (Frame unit)
3. **Capture/Save**:
    - `Capture Current Frame`: Saves the current scene as a PNG.
    - `Trim and Save Video`: Cuts the selected section and downloads it as a new file.

## 🕒 Version History

### [v1.3.0] - 2026-03-25
- **🎞️ GIF Conversion**: Added feature to convert videos to high-quality GIF animations.
- **🔄 Rotate & Mirror**: Added 90-degree rotation and horizontal mirroring features.
- **⏩ Speed Control**: 0.5x ~ 2.0x playback speed adjustment (automatic audio pitch correction).
- **🔇 Mute & Audio Extraction**: Added features for muted saving and separate MP3 audio extraction.
- **🌙 Dark Mode**: Added dark theme toggle and setting persistence.

### [v1.2.0] - 2026-03-25
- **🌐 Multilingual Support**: Added selection for Korean, English, Chinese, and Japanese (i18n applied).
- **🔍 SEO Optimization**: Added automatic switching of language-specific meta tags (Title, Description).
- **📂 Unified Filenames**: Unified all download output prefixes to `output_`.

### [v1.1.0] - 2026-03-25
- **✂️ Video Crop**: Added feature to freely crop video areas.
- **📐 Crop Presets**: Added instant setting buttons for 16:9, 9:16, and 1:1 ratios.
- **🗺️ Navigation**: Added menu to move between Trim and Crop pages.

### [v1.0.0] - 2026-03-25
- **🚀 Initial Release**: Developed serverless video trimmer based on FFmpeg.wasm.
- **✂️ Precision Trim**: Supported 0.01-second interval setting and export.
- **🖼️ Frame Capture**: Supported saving the currently playing screen as PNG.
- **🎨 Modern UI**: Applied interactive slider and timeline design.

## 📄 License

This project is licensed under the MIT License.

---

**Developed with ❤️ by [JKH-ML](https://github.com/JKH-ML)**
