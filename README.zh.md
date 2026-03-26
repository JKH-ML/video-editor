# 🎬 insta-cut

**快速、私密、基于浏览器的 MP4 视频裁剪工具。**

> **无限制免费 + 开源**  
> **无需注册 · 无广告 · 无水印 · 不收集数据**

[English](README.md) | [한국어](README.ko.md) | [简体中文](README.zh.md) | [日本語](README.ja.md)

`insta-cut` 是一款高性能的 MP4 编辑工具，无需上传服务器，即可在浏览器中即时运行。基于 **FFmpeg.wasm**，所有视频处理都在用户的本地环境中完成，无需担心数据泄露，安全快速地裁剪视频。

<div align="center">
  <a href="https://jkh-ml.github.io/insta-cut/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/🚀%20立即体验%20Live%20Demo-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo">
  </a>
</div>

---

## ✨ 主要功能 (Key Features)

- **⚡ 无服务器编码**：视频文件不上传到服务器，完全在浏览器内部处理。
- **✂️ 高精度裁剪**：支持 0.01 秒单位的微调及逐帧浏览。
- **🖼️ 高画质帧截取**：即时将所需画面提取为 PNG 图像。
- **⌨️ 支持键盘快捷键**：利用方向键（←, →）和空格键进行高效的时间轴控制。
- **🎨 现代 UI/UX**：采用 shadcn/ui 风格的极简精致设计。
- **🔒 隐私保护**：所有操作均在本地完成，可安心编辑敏感视频。

## 🛠️ 技术栈 (Tech Stack)

- **Engine**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) (WebAssembly)
- **Frontend**: Vanilla HTML5, CSS3 (Modern Zinc Theme), JavaScript (ES6+)
- **SEO**: Meta Tags, robots.txt, sitemap.xml 已优化
- **Deployment**: GitHub Pages (通过 COI Service Worker 支持 SharedArrayBuffer)

## 📖 使用方法 (Quick Start)

1. **上传文件**：拖放或点击选择 MP4 文件。
2. **设置区间**：利用底部滑块或键盘方向键设置开始/结束点。
    - `← / →`：移动 0.05 秒
    - `Shift + ← / →`：移动 0.01 秒（帧单位）
3. **截取/保存**：
    - `截取当前帧`：将当前画面保存为 PNG。
    - `裁剪并保存视频`：裁剪选定区间并下载为新文件。

## 🕒 版本历史 (Version History)

### [v1.3.0] - 2026-03-25
- **🎞️ GIF 转换**：新增将视频转换为高质量 GIF 动画的功能。
- **🔄 旋转与镜像**：新增视频 90 度旋转及左右翻转（镜像）功能。
- **⏩ 速度调节**：0.5x ~ 2.0x 播放速度调节（音频音调自动修正）。
- **🔇 静音及音频提取**：新增静音保存及单独提取 MP3 音频功能。
- **🌙 深色模式**：新增保护视力的深色主题切换及设置持久化功能。

### [v1.2.0] - 2026-03-25
- **🌐 多语言支持**：新增韩语、英语、中文、日语选择功能（应用 i18n）。
- **🔍 SEO 优化**：新增各语言元标签（标题、描述）自动切换功能。
- **📂 文件名统一**：所有下载结果的前缀统一为 `output_`。

### [v1.1.0] - 2026-03-25
- **✂️ 视频裁剪 (Crop)**：新增自由裁剪视频区域的功能。
- **📐 裁剪预设**：新增 16:9, 9:16, 1:1 比例即时设置按钮。
- **🗺️ 导航**：新增裁剪 (Trim) 与裁切 (Crop) 页面间的切换菜单。

### [v1.0.0] - 2026-03-25
- **🚀 初始发布**：开发基于 FFmpeg.wasm 的无服务器视频裁剪器。
- **✂️ 精确裁剪**：支持 0.01 秒单位的区间设置及导出。
- **🖼️ 帧截取**：支持将当前播放画面保存为 PNG。
- **🎨 现代 UI**：应用交互式滑块及时间轴设计。

## 📄 许可证 (License)

本项目遵循 MIT 许可证。

---

**Developed with ❤️ by [JKH-ML](https://github.com/JKH-ML)**
