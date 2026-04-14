# Video Editor — 재구현 가이드

이 문서만으로 프로젝트를 처음부터 완전히 재구현할 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요

- **목적**: 브라우저에서 동작하는 MP4 비디오 편집기. 서버 업로드 없이 100% 로컬 처리.
- **배포**: GitHub Pages
- **핵심 기술**: FFmpeg.wasm (WebAssembly) — 버전 **0.11.0** 사용
- **스택**: Vanilla HTML5 / CSS3 / JavaScript (ES6+), 프레임워크 없음
- **GitHub Pages 제약 해결**: `coi-serviceworker.js` 로 `SharedArrayBuffer` 지원 (COEP/COOP 헤더 주입)

### ⚠️ FFmpeg.wasm 버전 선택 이유

**반드시 0.11.0을 사용할 것.** 0.12.x는 Worker 기반 아키텍처로 변경되어 GitHub Pages / CDN 환경에서 CORS 문제로 로딩이 불가능함.

```html
<!-- 반드시 이 버전 사용 -->
<script src="https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js"></script>
```

FFmpeg 인스턴스 생성:
```js
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});
```

---

## 2. 디렉토리 구조

```
/
├── index.html              # Trim 도구 (메인 페이지)
├── coi-serviceworker.js    # SharedArrayBuffer 활성화용 Service Worker
├── robots.txt
├── sitemap.xml
├── server.js               # 로컬 개발 서버 (node server.js)
├── css/
│   └── style.css           # 전체 공통 스타일
├── js/
│   ├── i18n.js             # 다국어 번역 (ko/en/zh/ja)
│   └── main.js             # Trim 도구 로직
└── tools/
    ├── crop/
    │   ├── index.html
    │   └── crop.js
    ├── merge/
    │   ├── index.html
    │   └── merge.js
    ├── sync/
    │   ├── index.html
    │   └── sync.js
    └── frames/
        ├── index.html
        └── frames.js
```

---

## 3. 공통 설정

### coi-serviceworker.js
GitHub Pages에서 SharedArrayBuffer를 사용하기 위해 필요. 모든 HTML의 `<head>` 최상단에 위치해야 함.
```
https://github.com/gzuidhof/coi-serviceworker 에서 다운로드 (v0.1.7)
```

### server.js (로컬 개발용)
```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './' || filePath.endsWith('/')) filePath += 'index.html';
    else if (!path.extname(filePath)) filePath += '/index.html';

    const mimeTypes = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.wav': 'audio/wav',
        '.mp4': 'video/mp4', '.wasm': 'application/wasm'
    };
    const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(error.code === 'ENOENT' ? 404 : 500);
            res.end('Error: ' + error.code);
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => console.log(`Server running at http://localhost:${port}/`));
```

---

## 4. 공통 HTML 구조

모든 페이지가 공유하는 헤더/푸터/스크립트 패턴:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>페이지 제목</title>
    <!-- 반드시 최상단에 위치 -->
    <script src="[상대경로]/coi-serviceworker.js"></script>
    <link rel="stylesheet" href="[상대경로]/css/style.css">
    <script src="[상대경로]/js/i18n.js"></script>
    <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js"></script>
</head>
<body>
    <div class="app-container">
        <header>
            <div class="header-top">
                <div class="header-left">
                    <a href="[루트]/index.html" class="btn-home" title="Home">🏠</a>
                    <h1 data-i18n="title">Video Editor</h1>
                </div>
                <div class="header-right">
                    <button id="theme-toggle" class="theme-toggle" title="Toggle Theme">🌓</button>
                    <select id="lang-selector" class="lang-selector">
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                    </select>
                </div>
            </div>
            <nav class="nav-menu">
                <a href="[루트]/index.html" class="nav-link [active?]" data-i18n="trim">Trim</a>
                <a href="[루트]/tools/crop/index.html" class="nav-link [active?]" data-i18n="crop">Crop</a>
                <a href="[루트]/tools/merge/index.html" class="nav-link [active?]" data-i18n="merge">Merge</a>
                <a href="[루트]/tools/sync/index.html" class="nav-link [active?]" data-i18n="sync">Sync</a>
                <a href="[루트]/tools/frames/index.html" class="nav-link [active?]" data-i18n="frames">Frames</a>
            </nav>
            <div id="status" class="status-badge" data-i18n="status_init">FFmpeg initializing...</div>
        </header>

        <main>
            <!-- 도구별 콘텐츠 -->
        </main>

        <footer>
            <div class="footer-links">
                <a href="https://jkh-ml.github.io/image-editor/" target="_blank" class="btn-footer-tool">🖼️ Image Editor</a>
                <a href="https://jkh-ml.github.io/audio-editor/" target="_blank" class="btn-footer-tool">🎵 Audio Editor</a>
                <a href="https://github.com/JKH-ML/video-editor" target="_blank" class="btn-repo">
                    <svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <span data-i18n="repo">GitHub Repository</span>
                </a>
            </div>
        </footer>
    </div>
    <script src="도구.js"></script>
</body>
</html>
```

---

## 5. 공통 JS 패턴

모든 도구 JS 파일이 공유하는 초기화/실행 패턴:

```js
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

let isFFmpegLoaded = false;

// 테마 초기화
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
if (elements.themeToggle) {
    elements.themeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };
}

// FFmpeg 초기화
async function initFFmpeg() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || {};
    try {
        if (elements.status) elements.status.innerText = t.status_init;
        await ffmpeg.load();
        isFFmpegLoaded = true;
        if (elements.status) elements.status.innerText = t.status_ready;
    } catch (error) {
        if (elements.status) elements.status.innerText = t.status_error + error.message;
    }
}
initFFmpeg();

// FFmpeg 실행 공통 함수
async function runFFmpeg(args, outName) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || {};

    if (elements.exportBtn) elements.exportBtn.disabled = true;
    if (elements.progressContainer) elements.progressContainer.classList.remove('hidden');
    if (elements.downloadContainer) elements.downloadContainer.classList.add('hidden');

    ffmpeg.setProgress(({ ratio }) => {
        const p = Math.round(ratio * 100);
        if (elements.progressFill) elements.progressFill.style.width = `${p}%`;
        if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
    });

    try {
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
        await ffmpeg.run(...args);
        const data = ffmpeg.FS('readFile', outName);
        const url = URL.createObjectURL(new Blob([data.buffer]));

        if (elements.downloadLink) {
            elements.downloadLink.href = url;
            elements.downloadLink.download = outName;
        }
        if ((outName.endsWith('.mp4') || outName.endsWith('.gif')) && elements.resultVideoPreview) {
            elements.resultVideoPreview.src = url;
        }
        if (elements.downloadContainer) elements.downloadContainer.classList.remove('hidden');
        if (elements.progressText) elements.progressText.innerText = t.encoding_done;
    } catch (err) {
        if (elements.progressText) elements.progressText.innerText = t.status_error + err.message;
    } finally {
        if (elements.exportBtn) elements.exportBtn.disabled = false;
    }
}
```

---

## 6. css/style.css

shadcn/ui Zinc 테마 기반. 라이트/다크 모드 CSS 변수 시스템.

```css
:root {
    --background: #ffffff;
    --foreground: #09090b;
    --card: #ffffff;
    --card-foreground: #09090b;
    --primary: #18181b;
    --primary-foreground: #fafafa;
    --secondary: #f4f4f5;
    --secondary-foreground: #18181b;
    --muted: #f4f4f5;
    --muted-foreground: #71717a;
    --border: #e4e4e7;
    --input: #e4e4e7;
    --ring: #18181b;
    --radius: 0.5rem;
}

body.dark-mode {
    --background: #09090b;
    --foreground: #fafafa;
    --card: #09090b;
    --card-foreground: #fafafa;
    --primary: #fafafa;
    --primary-foreground: #18181b;
    --secondary: #27272a;
    --secondary-foreground: #fafafa;
    --muted: #27272a;
    --muted-foreground: #a1a1aa;
    --border: #27272a;
    --input: #27272a;
    --ring: #d4d4d8;
}

body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--background);
    color: var(--foreground);
    margin: 0;
    padding: 40px 20px;
    -webkit-font-smoothing: antialiased;
    transition: background-color 0.3s, color 0.3s;
}

.app-container { max-width: 800px; margin: 0 auto; }

/* Header */
header { margin-bottom: 40px; }
.header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 8px; }

h1 { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.025em; margin: 0; }

.btn-home {
    text-decoration: none; font-size: 1.25rem; color: var(--foreground);
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: var(--radius);
    border: 1px solid var(--border); transition: all 0.2s;
}
.btn-home:hover { background-color: var(--secondary); }

.theme-toggle {
    background: none; border: 1px solid var(--border); border-radius: var(--radius);
    width: 36px; height: 36px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; color: var(--foreground); font-size: 1.1rem;
}
.theme-toggle:hover { background-color: var(--secondary); }

.lang-selector {
    padding: 4px 8px; font-size: 0.75rem; border: 1px solid var(--border);
    border-radius: var(--radius); background-color: var(--background);
    color: var(--foreground); cursor: pointer; outline: none;
}

/* Nav */
.nav-menu { display: flex; gap: 16px; margin-bottom: 16px; }
.nav-link {
    text-decoration: none; color: var(--muted-foreground); font-size: 0.875rem;
    font-weight: 500; padding: 8px 12px; border-radius: var(--radius); transition: all 0.2s;
}
.nav-link:hover { background-color: var(--secondary); color: var(--foreground); }
.nav-link.active { background-color: var(--primary); color: var(--primary-foreground); }

.status-badge { font-size: 0.875rem; color: var(--muted-foreground); }

/* Card */
.card {
    background-color: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06);
    overflow: hidden;
}
.card-header { padding: 24px 24px 0 24px; margin-bottom: 16px; }
.card-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.card-content { padding: 24px; }

/* Upload */
.upload-area {
    border: 2px dashed var(--border); border-radius: var(--radius);
    padding: 48px; text-align: center; transition: all 0.2s ease; cursor: pointer;
}
.upload-area:hover, .upload-area.dragover { border-color: var(--primary); background-color: var(--secondary); }
.upload-icon { font-size: 2rem; margin-bottom: 12px; display: block; }
.upload-label { font-size: 0.875rem; font-weight: 500; color: var(--muted-foreground); }

/* Video Preview */
.video-preview-card { margin-bottom: 24px; }
.video-wrapper { position: relative; width: fit-content; margin: 0 auto; background: #000; border-radius: calc(var(--radius) - 2px); }
#video-preview { display: block; max-width: 100%; max-height: 500px; }
.current-info {
    display: flex; justify-content: center; align-items: center; gap: 12px;
    margin-top: 16px; font-size: 0.875rem; font-variant-numeric: tabular-nums;
}
.time-val { font-weight: 600; }
.frame-val { color: var(--muted-foreground); }

/* Crop overlay */
.crop-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
.crop-box {
    position: absolute; border: 2px solid #fff;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
    pointer-events: auto; cursor: move; box-sizing: border-box;
}
.crop-handle { position: absolute; width: 10px; height: 10px; background-color: #fff; border: 1px solid var(--primary); }
.crop-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
.crop-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
.crop-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.crop-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }

/* Controls */
.controls-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
.editor-main { margin-top: 32px; display: flex; flex-direction: column; gap: 24px; }

/* Timeline */
.timeline-container { position: relative; height: 20px; margin: 32px 0; }
.timeline-track { position: absolute; width: 100%; height: 6px; background-color: var(--secondary); border-radius: 3px; top: 50%; transform: translateY(-50%); }
.timeline-range { position: absolute; height: 6px; background-color: var(--primary); top: 50%; transform: translateY(-50%); z-index: 2; }
.range-slider { position: absolute; width: 100%; appearance: none; background: none; pointer-events: none; margin: 0; top: 50%; transform: translateY(-50%); z-index: 3; }
.range-slider::-webkit-slider-thumb { appearance: none; pointer-events: auto; width: 20px; height: 20px; background-color: white; border: 2px solid var(--primary); border-radius: 50%; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Inputs */
.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.input-box label { display: block; font-size: 0.75rem; font-weight: 500; margin-bottom: 6px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.05em; }
.input-box input { width: 100%; height: 36px; padding: 0 12px; border: 1px solid var(--input); border-radius: var(--radius); font-size: 0.875rem; box-sizing: border-box; transition: border-color 0.2s; background: var(--background); color: var(--foreground); }
.input-box input:focus { outline: none; border-color: var(--ring); }

.button-group { display: flex; gap: 8px; }
.btn-group-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

/* Buttons */
button { height: 36px; padding: 0 16px; font-size: 0.875rem; font-weight: 500; border-radius: var(--radius); cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.btn-primary { background-color: var(--primary); color: var(--primary-foreground); }
.btn-primary:hover { opacity: 0.9; }
.btn-secondary { background-color: var(--secondary); color: var(--secondary-foreground); }
.btn-secondary:hover { background-color: #e4e4e7; }
.btn-outline { background-color: transparent; border-color: var(--input); color: var(--foreground); }
.btn-outline:hover { background-color: var(--secondary); }
.btn-full { width: 100%; height: 44px; font-size: 1rem; }

/* Progress */
.progress-section { margin-top: 32px; }
.progress-info { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 8px; }
.progress-bar-bg { height: 8px; background-color: var(--secondary); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background-color: var(--primary); width: 0%; transition: width 0.3s ease; }

/* Download / Result */
.download-section { margin-top: 24px; }
.btn-download { display: flex; align-items: center; justify-content: center; height: 44px; background-color: #059669; color: white; text-decoration: none; border-radius: var(--radius); font-weight: 600; transition: opacity 0.2s; }
.btn-download:hover { opacity: 0.9; }

.result-preview-card { margin-bottom: 24px; padding: 20px; background-color: var(--secondary); border-radius: var(--radius); border: 1px solid var(--border); text-align: center; }
.result-preview-title { display: block; font-size: 0.875rem; font-weight: 600; color: var(--muted-foreground); margin-bottom: 12px; }
.result-video-wrapper { width: 100%; max-width: 480px; margin: 0 auto; background: #000; border-radius: calc(var(--radius) - 2px); overflow: hidden; aspect-ratio: 16/9; }
.result-video-wrapper video { width: 100%; height: 100%; display: block; }

/* Misc */
.action-card-content { display: flex; flex-direction: column; gap: 12px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.setting-label { font-size: 0.875rem; font-weight: 500; }
.checkbox-wrapper { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.radio-group { display: flex; gap: 12px; margin-top: 8px; }
.radio-item { display: flex; align-items: center; gap: 4px; font-size: 0.875rem; cursor: pointer; }
.speed-select { padding: 4px 8px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--background); color: var(--foreground); font-size: 0.875rem; }
.file-badge { margin-top: 8px; padding: 4px 10px; background: var(--secondary); border-radius: var(--radius); font-size: 0.75rem; }

.hidden { display: none !important; }

/* Footer */
footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); }
.footer-links { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px; }
.btn-footer-tool { display: inline-flex; align-items: center; padding: 8px 16px; background: var(--secondary); color: var(--secondary-foreground); border-radius: var(--radius); font-size: 0.875rem; font-weight: 500; text-decoration: none; transition: all 0.2s; border: 1px solid var(--border); }
.btn-footer-tool:hover { transform: translateY(-2px); }
.btn-repo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: var(--muted-foreground); font-size: 0.875rem; font-weight: 500; padding: 8px 16px; border-radius: var(--radius); border: 1px solid var(--border); transition: all 0.2s; }
.btn-repo:hover { background-color: var(--secondary); color: var(--foreground); }
.btn-repo svg { width: 16px; height: 16px; fill: currentColor; }

@media (max-width: 640px) {
    .footer-links { flex-direction: column; width: 100%; }
    .btn-footer-tool, .btn-repo { width: 100%; justify-content: center; }
}
```

---

## 7. js/i18n.js

4개 언어 번역 + 언어 전환 로직. 모든 페이지에서 공유.

```js
const translations = {
    ko: {
        title: "비디오 에디터",
        trim: "트림", crop: "크롭", merge: "병합", sync: "싱크", frames: "프레임",
        status_init: "FFmpeg 엔진 로딩 중...",
        status_ready: "준비 완료: 파일을 선택하세요.",
        status_error: "엔진 로드 실패: ",
        upload_label: "클릭하거나 비디오를 드래그하세요",
        upload_label_crop: "크롭할 비디오를 클릭하거나 드래그하세요",
        upload_label_merge: "병합할 비디오 파일들을 선택하세요 (여러 개 가능)",
        upload_label_sync_video: "비디오 파일을 선택하세요",
        upload_label_sync_audio: "오디오 파일을 선택하세요",
        upload_label_frames: "프레임을 추출할 비디오를 선택하세요",
        trim_card_title: "트림",
        start_label: "시작 (초)", end_label: "종료 (초)",
        set_start: "시작 설정", set_end: "종료 설정",
        actions_title: "작업",
        capture_btn: "프레임 추출 (PNG)",
        export_trim_btn: "비디오 내보내기",
        progress_processing: "처리 중...",
        encoding_done: "인코딩 완료!",
        download_btn: "결과 다운로드",
        result_preview: "결과물 미리보기",
        crop_settings_title: "크롭 설정",
        x_offset: "X 오프셋", y_offset: "Y 오프셋",
        width_label: "너비", height_label: "높이",
        reset_btn: "전체 화면으로 초기화",
        export_crop_btn: "크롭된 비디오 내보내기",
        merge_list_title: "병합할 파일 목록",
        merge_btn: "비디오 병합하기",
        clear_list_btn: "목록 비우기",
        no_files_msg: "선택된 파일이 없습니다.",
        sync_settings_title: "싱크 설정",
        video_info_label: "비디오 정보", audio_info_label: "오디오 정보",
        sync_btn: "오디오 길이에 맞춰 비디오 속도 조정",
        frames_settings_title: "프레임 추출",
        extract_btn: "비디오의 모든 프레임 추출하기",
        download_all_btn: "모든 이미지 다운로드",
        extracted_frames_title: "추출된 프레임 목록",
        extracting_msg: "모든 프레임을 분석하여 추출 중입니다. 잠시만 기다려 주세요...",
        transform_title: "변형 및 속도",
        rotate_btn: "회전 (90°)", flip_btn: "좌우 반전",
        speed_label: "재생 속도", mute_label: "음소거",
        format_label: "내보내기 형식",
        audio_extract_btn: "오디오만 추출 (MP3)",
        repo: "GitHub 저장소",
        meta_title: "온라인 MP4 비디오 에디터 | 빠르고 안전한 브라우저 기반 편집기",
        meta_description: "브라우저에서 직접 MP4 비디오를 자르고 크롭하세요. 서버 업로드 없이 100% 프라이버시가 보장되는 FFmpeg 기반 편집기입니다."
    },
    en: {
        title: "Video Editor",
        trim: "Trim", crop: "Crop", merge: "Merge", sync: "Sync", frames: "Frames",
        status_init: "FFmpeg initializing...",
        status_ready: "Ready: Select a file.",
        status_error: "Engine load failed: ",
        upload_label: "Click or drag to upload video",
        upload_label_crop: "Click or drag to upload video for cropping",
        upload_label_merge: "Select MP4 files to merge (Multiple allowed)",
        upload_label_sync_video: "Select Video File",
        upload_label_sync_audio: "Select Audio File",
        upload_label_frames: "Select Video to Extract Frames",
        trim_card_title: "Trim",
        start_label: "Start (s)", end_label: "End (s)",
        set_start: "Set Start", set_end: "Set End",
        actions_title: "Actions",
        capture_btn: "Capture Frame (PNG)",
        export_trim_btn: "Export Video",
        progress_processing: "Processing...",
        encoding_done: "Encoding complete!",
        download_btn: "Download Result",
        result_preview: "Result Preview",
        crop_settings_title: "Crop Settings",
        x_offset: "X Offset", y_offset: "Y Offset",
        width_label: "Width", height_label: "Height",
        reset_btn: "Reset to Full",
        export_crop_btn: "Export Cropped Video",
        merge_list_title: "Video List for Merging",
        merge_btn: "Merge Videos",
        clear_list_btn: "Clear List",
        no_files_msg: "No files selected.",
        sync_settings_title: "Sync Settings",
        video_info_label: "Video Info", audio_info_label: "Audio Info",
        sync_btn: "Sync Video Speed to Audio Length",
        frames_settings_title: "Frames Extraction",
        extract_btn: "Extract All Frames",
        download_all_btn: "Download All Images",
        extracted_frames_title: "Extracted Frames",
        extracting_msg: "Analyzing and extracting frames. Please wait...",
        transform_title: "Transform & Speed",
        rotate_btn: "Rotate (90°)", flip_btn: "Flip Horizontal",
        speed_label: "Playback Speed", mute_label: "Mute Audio",
        format_label: "Export Format",
        audio_extract_btn: "Extract Audio (MP3)",
        repo: "GitHub Repository",
        meta_title: "Online MP4 Video Editor | Fast & Private Browser-based Tool",
        meta_description: "Trim and crop MP4 videos directly in your browser. No uploads required, 100% private and fast using FFmpeg.wasm."
    },
    zh: {
        title: "视频编辑器",
        trim: "裁剪", crop: "切边", merge: "合并", sync: "同步", frames: "帧提取",
        status_init: "FFmpeg 引擎加载中...",
        status_ready: "准备就绪：请选择文件。",
        status_error: "引擎加载失败：",
        upload_label: "点击或拖拽上传视频",
        upload_label_crop: "点击或拖拽上传视频进行切边",
        upload_label_merge: "选择要合并的 MP4 文件（允许多选）",
        upload_label_sync_video: "选择视频文件",
        upload_label_sync_audio: "选择音频文件",
        upload_label_frames: "选择要提取帧的视频",
        trim_card_title: "裁剪",
        start_label: "开始 (秒)", end_label: "结束 (秒)",
        set_start: "设置起点", set_end: "设置终点",
        actions_title: "操作",
        capture_btn: "截取帧 (PNG)",
        export_trim_btn: "导出视频",
        progress_processing: "处理中...",
        encoding_done: "编码完成！",
        download_btn: "下载结果",
        result_preview: "结果预览",
        crop_settings_title: "切边设置",
        x_offset: "X 偏移", y_offset: "Y 偏移",
        width_label: "宽度", height_label: "高度",
        reset_btn: "重置为全屏",
        export_crop_btn: "导出切边视频",
        merge_list_title: "合并视频列表",
        merge_btn: "合并视频",
        clear_list_btn: "清除列表",
        no_files_msg: "未选择文件。",
        sync_settings_title: "同步设置",
        video_info_label: "视频信息", audio_info_label: "音频信息",
        sync_btn: "调整视频速度以匹配音频长度",
        frames_settings_title: "帧提取设置",
        extract_btn: "提取所有帧",
        download_all_btn: "下载所有图片",
        extracted_frames_title: "已提取的帧",
        extracting_msg: "正在分析并提取所有帧，请稍候...",
        transform_title: "变换与速度",
        rotate_btn: "旋转 (90°)", flip_btn: "水平翻转",
        speed_label: "播放速度", mute_label: "静音",
        format_label: "导出格式",
        audio_extract_btn: "仅提取音频 (MP3)",
        repo: "GitHub 仓库",
        meta_title: "在线 MP4 视频编辑器 | 快速、私密的浏览器端工具",
        meta_description: "在浏览器中直接裁剪和切边 MP4 视频。无需上传，基于 FFmpeg.wasm 的 100% 私密快捷工具。"
    },
    ja: {
        title: "ビデオエディター",
        trim: "トリミング", crop: "クロップ", merge: "結合", sync: "同期", frames: "フレーム抽出",
        status_init: "FFmpeg エンジンを読み込み中...",
        status_ready: "準備完了：ファイルを選択してください。",
        status_error: "エンジンの読み込みに失敗しました：",
        upload_label: "クリックまたは動画をドラッグしてください",
        upload_label_crop: "クリックまたは動画をドラッグしてクロップ",
        upload_label_merge: "結合する MP4 ファイルを選択してください（複数可）",
        upload_label_sync_video: "動画ファイルを選択",
        upload_label_sync_audio: "音声ファイルを選択",
        upload_label_frames: "フレームを抽出する動画を選択してください",
        trim_card_title: "トリミング",
        start_label: "開始（秒）", end_label: "終了（秒）",
        set_start: "開始を設定", set_end: "終了を設定",
        actions_title: "操作",
        capture_btn: "フレームをキャプチャ（PNG）",
        export_trim_btn: "動画を書き出す",
        progress_processing: "処理中...",
        encoding_done: "エンコード完了！",
        download_btn: "結果をダウンロード",
        result_preview: "結果のプレビュー",
        crop_settings_title: "クロップ設定",
        x_offset: "X オフセット", y_offset: "Y オフセット",
        width_label: "幅", height_label: "高さ",
        reset_btn: "全画面にリセット",
        export_crop_btn: "クロップした動画を書き出す",
        merge_list_title: "結合する動画リスト",
        merge_btn: "動画を結合する",
        clear_list_btn: "リストをクリア",
        no_files_msg: "ファイルが選択されていません。",
        sync_settings_title: "同期設定",
        video_info_label: "動画情報", audio_info_label: "音声情報",
        sync_btn: "音声の長さに合わせて動画速度を調整",
        frames_settings_title: "フレーム抽出",
        extract_btn: "すべてのフレームを抽出する",
        download_all_btn: "すべての画像をダウンロード",
        extracted_frames_title: "抽出されたフレーム一覧",
        extracting_msg: "すべてのフレームを分析・抽出中です。しばらくお待ちください...",
        transform_title: "変形・速度",
        rotate_btn: "回転（90°）", flip_btn: "左右反転",
        speed_label: "再生速度", mute_label: "ミュート",
        format_label: "書き出し形式",
        audio_extract_btn: "音声のみ抽出（MP3）",
        repo: "GitHub リポジトリ",
        meta_title: "オンライン MP4 ビデオエディター | 高速・プライベートなブラウザベース編集ツール",
        meta_description: "ブラウザ上で直接 MP4 動画をトリミング・クロップ。アップロード不要で 100% プライバシーを守る FFmpeg ベースの編集ツール。"
    }
};

function setLanguage(lang) {
    localStorage.setItem('preferred_lang', lang);
    applyTranslations(lang);
}

function applyTranslations(lang) {
    const t = translations[lang];
    document.title = t.meta_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t.meta_description);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = lang;
}

function getCurrentLang() {
    return localStorage.getItem('preferred_lang') || 'ko';
}

window.getCurrentLang = getCurrentLang;
window.translations = translations;

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = getCurrentLang();
    applyTranslations(savedLang);
    const selector = document.getElementById('lang-selector');
    if (selector) {
        selector.value = savedLang;
        selector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            window.dispatchEvent(new CustomEvent('langChanged', { detail: e.target.value }));
        });
    }
});
```

---

## 8. 도구 1: Trim (index.html + js/main.js)

### index.html 주요 구조 (main 영역)
```html
<main>
    <!-- 업로드 -->
    <section class="upload-area" id="drop-zone">
        <input type="file" id="uploader" accept="video/mp4" class="hidden">
        <div class="upload-content">
            <span class="upload-icon">↑</span>
            <p class="upload-label" data-i18n="upload_label">Click or drag to upload video</p>
        </div>
    </section>

    <section id="editor-container" class="editor-main hidden">
        <!-- 미리보기 -->
        <div class="card video-preview-card">
            <div class="card-content">
                <div class="video-wrapper">
                    <video id="video-preview" controls></video>
                </div>
                <div class="current-info">
                    <span id="current-time-val" class="time-val">0.00s</span>
                    <span id="current-frame-val" class="frame-val">Frame 0</span>
                </div>
            </div>
        </div>

        <div class="controls-grid">
            <!-- Trim 카드 -->
            <div class="card">
                <div class="card-header"><h3 class="card-title" data-i18n="trim_card_title">Trim</h3></div>
                <div class="card-content">
                    <div class="timeline-container">
                        <div class="timeline-track"></div>
                        <div id="timeline-range" class="timeline-range"></div>
                        <input type="range" id="range-start" class="range-slider" min="0" max="100" value="0" step="0.01">
                        <input type="range" id="range-end" class="range-slider" min="0" max="100" value="100" step="0.01">
                    </div>
                    <div class="input-grid">
                        <div class="input-box">
                            <label data-i18n="start_label">Start (s)</label>
                            <input type="number" id="start-time" value="0.00" step="0.01">
                        </div>
                        <div class="input-box">
                            <label data-i18n="end_label">End (s)</label>
                            <input type="number" id="end-time" value="0.00" step="0.01">
                        </div>
                    </div>
                    <div class="button-group">
                        <button id="set-start-btn" class="btn-outline" data-i18n="set_start">Set Start</button>
                        <button id="set-end-btn" class="btn-outline" data-i18n="set_end">Set End</button>
                    </div>
                </div>
            </div>

            <!-- Transform 카드 -->
            <div class="card">
                <div class="card-header"><h3 class="card-title" data-i18n="transform_title">Transform & Speed</h3></div>
                <div class="card-content">
                    <div class="btn-group-grid">
                        <button id="rotate-btn" class="btn-outline" data-i18n="rotate_btn">Rotate (90°)</button>
                        <button id="flip-btn" class="btn-outline" data-i18n="flip_btn">Flip Horizontal</button>
                    </div>
                    <div class="setting-row" style="margin-top: 20px;">
                        <span class="setting-label" data-i18n="speed_label">Playback Speed</span>
                        <select id="speed-select" class="speed-select">
                            <option value="0.5">0.5x</option>
                            <option value="1.0" selected>1.0x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2.0">2.0x</option>
                        </select>
                    </div>
                    <div class="setting-row">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" id="mute-check">
                            <span class="setting-label" data-i18n="mute_label">Mute Audio</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Actions 카드 -->
            <div class="card">
                <div class="card-header"><h3 class="card-title" data-i18n="actions_title">Actions</h3></div>
                <div class="card-content action-card-content">
                    <div class="setting-row" style="flex-direction: column; align-items: flex-start;">
                        <span class="setting-label" data-i18n="format_label">Export Format</span>
                        <div class="radio-group">
                            <label class="radio-item"><input type="radio" name="format" value="mp4" checked> MP4</label>
                            <label class="radio-item"><input type="radio" name="format" value="gif"> GIF</label>
                        </div>
                    </div>
                    <button id="capture-frame-btn" class="btn-secondary" data-i18n="capture_btn">Capture Frame (PNG)</button>
                    <button id="audio-extract-btn" class="btn-secondary" data-i18n="audio_extract_btn">Extract Audio (MP3)</button>
                    <button id="export-btn" class="btn-primary btn-full" data-i18n="export_trim_btn">Export Video</button>
                </div>
            </div>
        </div>

        <!-- Progress -->
        <div id="progress-container" class="progress-section hidden">
            <div class="progress-info">
                <span id="progress-text" data-i18n="progress_processing">Processing...</span>
                <span id="progress-percent">0%</span>
            </div>
            <div class="progress-bar-bg"><div id="progress-fill" class="progress-fill"></div></div>
        </div>

        <!-- Download -->
        <div id="download-container" class="download-section hidden">
            <div class="result-preview-card">
                <span class="result-preview-title" data-i18n="result_preview">Result Preview</span>
                <div class="result-video-wrapper">
                    <video id="result-video-preview" controls></video>
                </div>
            </div>
            <a id="download-link" href="#" download="edited.mp4" class="btn-download" data-i18n="download_btn">Download Result</a>
        </div>
    </section>
</main>
```

### js/main.js
```js
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' });

const elements = {
    uploader: document.getElementById('uploader'),
    videoPreview: document.getElementById('video-preview'),
    editorContainer: document.getElementById('editor-container'),
    status: document.getElementById('status'),
    exportBtn: document.getElementById('export-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    downloadContainer: document.getElementById('download-container'),
    downloadLink: document.getElementById('download-link'),
    startTime: document.getElementById('start-time'),
    endTime: document.getElementById('end-time'),
    rangeStart: document.getElementById('range-start'),
    rangeEnd: document.getElementById('range-end'),
    timelineRange: document.getElementById('timeline-range'),
    setStartBtn: document.getElementById('set-start-btn'),
    setEndBtn: document.getElementById('set-end-btn'),
    currentTimeVal: document.getElementById('current-time-val'),
    currentFrameVal: document.getElementById('current-frame-val'),
    captureFrameBtn: document.getElementById('capture-frame-btn'),
    dropZone: document.getElementById('drop-zone'),
    themeToggle: document.getElementById('theme-toggle'),
    rotateBtn: document.getElementById('rotate-btn'),
    flipBtn: document.getElementById('flip-btn'),
    speedSelect: document.getElementById('speed-select'),
    muteCheck: document.getElementById('mute-check'),
    audioExtractBtn: document.getElementById('audio-extract-btn'),
    resultVideoPreview: document.getElementById('result-video-preview')
};

let videoFile = null;
let isFFmpegLoaded = false;
let videoFPS = 30;
let rotation = 0;
let isFlipped = false;

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
if (elements.themeToggle) {
    elements.themeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };
}

async function initFFmpeg() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || {};
    try {
        if (elements.status) elements.status.innerText = t.status_init;
        await ffmpeg.load();
        isFFmpegLoaded = true;
        if (elements.status) elements.status.innerText = t.status_ready;
    } catch (error) {
        if (elements.status) elements.status.innerText = t.status_error + error.message;
    }
}
initFFmpeg();

if (elements.videoPreview) {
    elements.videoPreview.ontimeupdate = () => {
        const time = elements.videoPreview.currentTime;
        if (elements.currentTimeVal) elements.currentTimeVal.innerText = time.toFixed(2) + 's';
        if (elements.currentFrameVal) elements.currentFrameVal.innerText = `(Frame: ${Math.floor(time * videoFPS)})`;
    };
}

ffmpeg.setLogger(({ message }) => {
    const m = message.match(/(\d+(?:\.\d+)?)\s+fps/);
    if (m) videoFPS = parseFloat(m[1]);
});

async function handleFile(file) {
    if (!file || !elements.videoPreview) return;
    videoFile = file;
    elements.videoPreview.src = URL.createObjectURL(file);
    if (elements.editorContainer) elements.editorContainer.classList.remove('hidden');
    if (elements.dropZone) elements.dropZone.classList.add('hidden');
    elements.videoPreview.onloadedmetadata = () => {
        const duration = elements.videoPreview.duration;
        if (elements.startTime) elements.startTime.value = "0.00";
        if (elements.endTime) elements.endTime.value = duration.toFixed(2);
        if (elements.rangeStart) { elements.rangeStart.max = duration; elements.rangeStart.value = 0; }
        if (elements.rangeEnd) { elements.rangeEnd.max = duration; elements.rangeEnd.value = duration; }
        updateTimelineVisual();
    };
    ffmpeg.FS('writeFile', 'tmp.mp4', await fetchFile(file));
    await ffmpeg.run('-i', 'tmp.mp4');
}

function updateTimelineVisual() {
    if (!elements.rangeStart || !elements.rangeEnd || !elements.videoPreview) return;
    const start = parseFloat(elements.rangeStart.value);
    const end = parseFloat(elements.rangeEnd.value);
    const duration = elements.videoPreview.duration;
    if (start > end) elements.rangeStart.value = end;
    if (elements.startTime) elements.startTime.value = parseFloat(elements.rangeStart.value).toFixed(2);
    if (elements.endTime) elements.endTime.value = parseFloat(elements.rangeEnd.value).toFixed(2);
    if (elements.timelineRange) {
        elements.timelineRange.style.left = (elements.rangeStart.value / duration * 100) + '%';
        elements.timelineRange.style.right = (100 - elements.rangeEnd.value / duration * 100) + '%';
    }
}

if (elements.rangeStart) {
    elements.rangeStart.oninput = () => {
        if (parseFloat(elements.rangeStart.value) > parseFloat(elements.rangeEnd.value))
            elements.rangeStart.value = elements.rangeEnd.value;
        elements.videoPreview.currentTime = elements.rangeStart.value;
        updateTimelineVisual();
    };
}
if (elements.rangeEnd) {
    elements.rangeEnd.oninput = () => {
        if (parseFloat(elements.rangeEnd.value) < parseFloat(elements.rangeStart.value))
            elements.rangeEnd.value = elements.rangeStart.value;
        elements.videoPreview.currentTime = elements.rangeEnd.value;
        updateTimelineVisual();
    };
}

if (elements.setStartBtn) elements.setStartBtn.onclick = () => { elements.rangeStart.value = elements.videoPreview.currentTime; updateTimelineVisual(); };
if (elements.setEndBtn) elements.setEndBtn.onclick = () => { elements.rangeEnd.value = elements.videoPreview.currentTime; updateTimelineVisual(); };

if (elements.rotateBtn) elements.rotateBtn.onclick = () => {
    rotation = (rotation + 90) % 360;
    elements.videoPreview.style.transform = `rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
};
if (elements.flipBtn) elements.flipBtn.onclick = () => {
    isFlipped = !isFlipped;
    elements.videoPreview.style.transform = `rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
};

window.onkeydown = (e) => {
    if (!videoFile || document.activeElement.tagName === 'INPUT') return;
    const step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === 'ArrowLeft') { elements.videoPreview.currentTime = Math.max(0, elements.videoPreview.currentTime - step); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { elements.videoPreview.currentTime = Math.min(elements.videoPreview.duration, elements.videoPreview.currentTime + step); e.preventDefault(); }
    else if (e.key === ' ') { elements.videoPreview.paused ? elements.videoPreview.play() : elements.videoPreview.pause(); e.preventDefault(); }
};

if (elements.dropZone) elements.dropZone.onclick = () => elements.uploader.click();
if (elements.uploader) elements.uploader.onchange = (e) => handleFile(e.target.files[0]);
if (elements.dropZone) {
    elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop = (e) => { e.preventDefault(); elements.dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
}

if (elements.captureFrameBtn) {
    elements.captureFrameBtn.onclick = () => {
        if (!elements.videoPreview.src) return;
        const canvas = document.createElement('canvas');
        canvas.width = elements.videoPreview.videoWidth;
        canvas.height = elements.videoPreview.videoHeight;
        canvas.getContext('2d').drawImage(elements.videoPreview, 0, 0);
        const a = document.createElement('a');
        a.download = `output_frame_${elements.videoPreview.currentTime.toFixed(2)}s.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    };
}

async function runFFmpeg(args, outName) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || {};
    if (elements.exportBtn) elements.exportBtn.disabled = true;
    if (elements.audioExtractBtn) elements.audioExtractBtn.disabled = true;
    if (elements.progressContainer) elements.progressContainer.classList.remove('hidden');
    if (elements.downloadContainer) elements.downloadContainer.classList.add('hidden');
    ffmpeg.setProgress(({ ratio }) => {
        const p = Math.round(ratio * 100);
        if (elements.progressFill) elements.progressFill.style.width = `${p}%`;
        if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
    });
    try {
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
        await ffmpeg.run(...args);
        const data = ffmpeg.FS('readFile', outName);
        const url = URL.createObjectURL(new Blob([data.buffer]));
        if (elements.downloadLink) { elements.downloadLink.href = url; elements.downloadLink.download = outName; }
        if ((outName.endsWith('.mp4') || outName.endsWith('.gif')) && elements.resultVideoPreview)
            elements.resultVideoPreview.src = url;
        if (elements.downloadContainer) elements.downloadContainer.classList.remove('hidden');
        if (elements.progressText) elements.progressText.innerText = t.encoding_done;
    } catch (err) {
        if (elements.progressText) elements.progressText.innerText = t.status_error + err.message;
    } finally {
        if (elements.exportBtn) elements.exportBtn.disabled = false;
        if (elements.audioExtractBtn) elements.audioExtractBtn.disabled = false;
    }
}

if (elements.audioExtractBtn) {
    elements.audioExtractBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        const start = elements.startTime.value, end = elements.endTime.value;
        await runFFmpeg(['-ss', start, '-to', end, '-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output_audio.mp3'], 'output_audio.mp3');
    };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        const start = elements.startTime.value, end = elements.endTime.value;
        const speed = parseFloat(elements.speedSelect.value);
        const isMuted = elements.muteCheck.checked;
        const format = document.querySelector('input[name="format"]:checked').value;

        const vf = [];
        if (isFlipped) vf.push('hflip');
        if (rotation === 90) vf.push('transpose=1');
        else if (rotation === 180) vf.push('transpose=1,transpose=1');
        else if (rotation === 270) vf.push('transpose=2');
        if (speed !== 1.0) vf.push(`setpts=${1/speed}*PTS`);

        let args = ['-ss', start, '-to', end, '-i', 'input.mp4'];

        if (format === 'gif') {
            const vfStr = vf.length ? vf.join(',') + ',' : '';
            args.push('-vf', `${vfStr}fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, 'output_trim.gif');
            await runFFmpeg(args, 'output_trim.gif');
        } else {
            if (vf.length) args.push('-vf', vf.join(','));
            if (isMuted) args.push('-an');
            else if (speed !== 1.0) args.push('-filter:a', `atempo=${speed}`);
            args.push('output_trim.mp4');
            await runFFmpeg(args, 'output_trim.mp4');
        }
    };
}
```

---

## 9. 도구 2: Crop (tools/crop/)

### index.html 추가 main 구조
```html
<!-- 미리보기 (crop overlay 포함) -->
<div class="card video-preview-card">
    <div class="card-content">
        <div class="video-wrapper" id="video-wrapper">
            <video id="video-preview" controls></video>
            <div id="crop-overlay" class="crop-overlay">
                <div id="crop-box" class="crop-box">
                    <div class="crop-handle nw"></div>
                    <div class="crop-handle ne"></div>
                    <div class="crop-handle sw"></div>
                    <div class="crop-handle se"></div>
                </div>
            </div>
        </div>
        <div class="current-info">
            <span id="video-res-val" class="time-val">0 x 0</span>
        </div>
    </div>
</div>

<!-- Crop 설정 카드 -->
<div class="card">
    <div class="card-content">
        <div class="input-grid">
            <div class="input-box"><label data-i18n="x_offset">X Offset</label><input type="number" id="crop-x" value="0"></div>
            <div class="input-box"><label data-i18n="y_offset">Y Offset</label><input type="number" id="crop-y" value="0"></div>
            <div class="input-box"><label data-i18n="width_label">Width</label><input type="number" id="crop-w" value="0"></div>
            <div class="input-box"><label data-i18n="height_label">Height</label><input type="number" id="crop-h" value="0"></div>
        </div>
        <div class="button-group">
            <button id="reset-crop-btn" class="btn-outline" data-i18n="reset_btn">Reset to Full</button>
            <button id="preset-16-9" class="btn-outline">16:9</button>
            <button id="preset-9-16" class="btn-outline">9:16</button>
            <button id="preset-1-1" class="btn-outline">1:1</button>
        </div>
    </div>
</div>
<!-- Transform 카드, Actions 카드, Progress, Download — Trim과 동일 구조 -->
```

### crop.js 핵심 로직
```js
// Trim과 동일한 FFmpeg 초기화/실행 패턴 사용

async function handleFile(file) {
    videoFile = file;
    elements.videoPreview.src = URL.createObjectURL(file);
    elements.videoPreview.onloadedmetadata = () => {
        originalWidth = elements.videoPreview.videoWidth;
        originalHeight = elements.videoPreview.videoHeight;
        if (elements.videoResVal) elements.videoResVal.innerText = `${originalWidth} x ${originalHeight}`;
        resetCrop();
    };
}

function resetCrop() {
    elements.cropX.value = 0; elements.cropY.value = 0;
    elements.cropW.value = originalWidth; elements.cropH.value = originalHeight;
    updateCropBoxFromInputs();
}

function updateCropBoxFromInputs() {
    // 비디오 표시 크기 대비 원본 해상도 비율로 crop box 위치/크기 계산
    const scaleX = elements.videoPreview.clientWidth / originalWidth;
    const scaleY = elements.videoPreview.clientHeight / originalHeight;
    elements.cropBox.style.left   = (parseInt(elements.cropX.value) * scaleX) + 'px';
    elements.cropBox.style.top    = (parseInt(elements.cropY.value) * scaleY) + 'px';
    elements.cropBox.style.width  = (parseInt(elements.cropW.value) * scaleX) + 'px';
    elements.cropBox.style.height = (parseInt(elements.cropH.value) * scaleY) + 'px';
}

// 드래그/리사이즈: window.addEventListener('mousemove'/'mouseup') 사용 (onmousemove 직접 할당 금지)
// crop box onmousedown → isDragging/isResizing 플래그 → mousemove에서 위치 업데이트

// 비율 프리셋
// 16:9: cropW=originalWidth, cropH=round(originalWidth*9/16) (또는 반대)
// 9:16: cropW=round(originalHeight*9/16), cropH=originalHeight
// 1:1:  size=min(originalWidth,originalHeight), 중앙 정렬

// FFmpeg 내보내기
const vf = [`crop=${w}:${h}:${x}:${y}`];
// + hflip, transpose=1/2, setpts 등 추가 가능
await runFFmpeg(['-i', 'input.mp4', '-vf', vf.join(','), 'output_crop.mp4'], 'output_crop.mp4');
```

---

## 10. 도구 3: Merge (tools/merge/)

### index.html 주요 구조
```html
<section class="upload-area" id="drop-zone">
    <input type="file" id="uploader" accept="video/mp4" multiple class="hidden">
    <!-- multiple 속성 필수 -->
</section>

<section id="editor-container" class="editor-main hidden">
    <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h3 class="card-title" data-i18n="merge_list_title">Video List for Merging</h3>
            <div style="display:flex; gap:8px;">
                <button id="add-more-btn" class="btn-outline">+ Add More</button>
                <button id="clear-list-btn" class="btn-secondary" data-i18n="clear_list_btn">Clear List</button>
            </div>
        </div>
        <div class="card-content">
            <ul id="file-list" class="file-list"></ul>
            <p id="no-files-msg" class="empty-msg hidden" data-i18n="no_files_msg">No files selected.</p>
            <button id="export-btn" class="btn-primary btn-full" data-i18n="merge_btn">Merge Videos</button>
        </div>
    </div>
    <!-- Progress, Download (result-preview 포함) -->
</section>
```

### merge.js 핵심 로직
```js
let selectedFiles = [];
let draggedItemIndex = null;

// 파일 목록 UI 업데이트 (드래그앤드롭 정렬 포함)
function updateFileListUI() {
    elements.fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.draggable = true;
        li.innerHTML = `
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatSize(file.size)}</span>
            </div>
            <div class="file-controls">
                <button onclick="moveUp(${index})" ${index===0?'disabled':''}>↑</button>
                <button onclick="moveDown(${index})" ${index===selectedFiles.length-1?'disabled':''}>↓</button>
                <button onclick="removeFile(${index})">×</button>
            </div>`;

        // HTML5 드래그앤드롭으로 순서 변경
        li.ondragstart = (e) => { draggedItemIndex = index; li.classList.add('dragging'); };
        li.ondragend   = () => { li.classList.remove('dragging'); draggedItemIndex = null; };
        li.ondragover  = (e) => { e.preventDefault(); li.style.borderTop = '2px solid var(--primary)'; };
        li.ondragleave = () => { li.style.borderTop = ''; };
        li.ondrop      = (e) => {
            e.preventDefault(); li.style.borderTop = '';
            if (draggedItemIndex !== null && draggedItemIndex !== index) {
                const moved = selectedFiles.splice(draggedItemIndex, 1)[0];
                selectedFiles.splice(index, 0, moved);
                updateFileListUI();
            }
        };
        elements.fileList.appendChild(li);
    });
}

// FFmpeg concat demuxer 방식으로 병합
async function runFFmpegMerge() {
    const inputNames = [];
    let concatContent = '';
    for (let i = 0; i < selectedFiles.length; i++) {
        const name = `input${i}.mp4`;
        inputNames.push(name);
        ffmpeg.FS('writeFile', name, await fetchFile(selectedFiles[i]));
        concatContent += `file ${name}\n`;
    }
    ffmpeg.FS('writeFile', 'concat.txt', concatContent);
    await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output_merged.mp4');
    // 결과 읽기 후 cleanup
    inputNames.forEach(name => ffmpeg.FS('unlink', name));
    ffmpeg.FS('unlink', 'concat.txt');
}
```

### file-list CSS (merge/index.html 인라인 또는 style.css에 추가)
```css
.file-list { list-style: none; padding: 0; margin: 0; }
.file-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--secondary); border-radius: var(--radius); margin-bottom: 8px; font-size: 0.875rem; }
.file-item.dragging { opacity: 0.5; border: 2px dashed var(--primary); }
.file-info { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.file-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-size { font-size: 0.75rem; color: var(--muted-foreground); }
.file-controls { display: flex; align-items: center; gap: 8px; }
.control-btn { background: var(--background); border: 1px solid var(--border); color: var(--foreground); border-radius: 4px; width: 28px; height: 28px; cursor: pointer; }
.control-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.remove-file { background: none; border: none; color: var(--muted-foreground); cursor: pointer; font-size: 1.25rem; }
.empty-msg { text-align: center; color: var(--muted-foreground); padding: 20px; font-size: 0.875rem; }
```

---

## 11. 도구 4: Sync (tools/sync/)

### index.html 주요 구조
```html
<!-- 비디오/오디오 두 개 업로드 영역 (2컬럼 그리드) -->
<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
    <section class="upload-area" id="drop-zone-video">
        <input type="file" id="video-uploader" accept="video/mp4" class="hidden">
        <div class="upload-content">
            <span class="upload-icon">🎥</span>
            <p class="upload-label" data-i18n="upload_label_sync_video">Select Video File</p>
            <div id="video-file-info" class="file-badge hidden">
                Video Loaded: <span id="v-duration">0s</span>
            </div>
        </div>
    </section>
    <section class="upload-area" id="drop-zone-audio">
        <input type="file" id="audio-uploader" accept="audio/*" class="hidden">
        <div class="upload-content">
            <span class="upload-icon">🎵</span>
            <p class="upload-label" data-i18n="upload_label_sync_audio">Select Audio File</p>
            <div id="audio-file-info" class="file-badge hidden">
                Audio Loaded: <span id="a-duration">0s</span>
            </div>
        </div>
    </section>
</div>

<section id="editor-container" class="editor-main hidden">
    <div class="card">
        <div class="card-content">
            <!-- 정보 표시 -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:var(--secondary); padding:20px; border-radius:var(--radius); margin-bottom:24px;">
                <div>
                    <p style="font-size:0.75rem; color:var(--muted-foreground);" data-i18n="video_info_label">Video Info</p>
                    <p>Total Frames: <span id="v-frames">0</span></p>
                </div>
                <div>
                    <p style="font-size:0.75rem; color:var(--muted-foreground);">Speed Ratio</p>
                    <p id="target-fps" style="font-weight:600; color:var(--primary);">-</p>
                </div>
            </div>
            <button id="export-btn" class="btn-primary btn-full" data-i18n="sync_btn">Sync Video Speed to Audio Length</button>
        </div>
    </div>
    <!-- Progress, Download -->
</section>
```

### sync.js 핵심 로직
```js
let videoFile = null, audioFile = null;
let videoDuration = 0, audioDuration = 0;
let videoFPS = 30;

// FPS는 ffmpeg.setLogger로 감지 후, ffmpeg.run('-i', ...) 완료 시점에 확정
ffmpeg.setLogger(({ message }) => {
    if (!isProcessing) {
        const m = message.match(/(\d+(?:\.\d+)?)\s+fps/);
        if (m) videoFPS = parseFloat(m[1]);
    }
});

async function handleVideoFile(file) {
    videoFile = file; videoFPS = 30;
    // duration: HTML video element onloadedmetadata로 파악
    // FPS: ffmpeg.run('-i', file) 실행 후 logger에서 감지
    ffmpeg.FS('writeFile', 'input_v.mp4', await fetchFile(file));
    await ffmpeg.run('-i', 'input_v.mp4'); // FPS 파싱용 (에러 무시)
    updateSyncInfo(); // ffmpeg.run 완료 후 FPS 확정된 시점에 호출
}

async function handleAudioFile(file) {
    audioFile = file;
    // HTML audio element onloadedmetadata로 duration 파악
}

// 내보내기: ptsRatio = audioDuration / videoDuration
// setpts로 비디오 속도 조정, -map 0:v -map 1:a로 오디오 교체
// 오디오 파일 확장자는 audioFile.name에서 추출 (mp3 하드코딩 금지)
const ptsRatio = audioDuration / videoDuration;
const audioExt = audioFile.name.split('.').pop().toLowerCase() || 'mp3';
await ffmpeg.run(
    '-i', 'input_v.mp4', '-i', `input_a.${audioExt}`,
    '-vf', `setpts=${ptsRatio}*PTS`,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '25',
    '-c:a', 'aac', '-b:a', '128k',
    '-t', audioDuration.toFixed(2),
    'output_synced.mp4'
);
```

---

## 12. 도구 5: Frames (tools/frames/)

### index.html 주요 구조
```html
<!-- JSZip 추가 필요 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<section id="editor-container" class="editor-main hidden">
    <div class="card">
        <div class="card-content">
            <p data-i18n="extracting_msg">Analyzing frames...</p>
            <!-- 버튼 ID: export-btn (frames.js에서 getElementById('export-btn')으로 참조) -->
            <button id="export-btn" class="btn-primary btn-full" data-i18n="extract_btn">Extract All Frames</button>
        </div>
    </div>

    <!-- Progress -->
    <div id="progress-container" class="progress-section hidden">...</div>

    <!-- 결과: 반드시 id="frames-result-container" 로 숨김/표시 제어 -->
    <div id="frames-result-container" class="card hidden" style="margin-top:24px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h3 class="card-title" data-i18n="extracted_frames_title">Extracted Frames</h3>
            <button id="download-all-btn" class="btn-primary" data-i18n="download_all_btn">Download All Images</button>
        </div>
        <div class="card-content">
            <!-- 프레임 그리드: id="frames-grid" (frames.js에서 getElementById('frames-grid')으로 참조) -->
            <div id="frames-grid" class="frames-grid"></div>
        </div>
    </div>
</section>
```

### frames-grid CSS
```css
.frames-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding: 12px; background: var(--background); border-radius: var(--radius); border: 1px solid var(--border); }
.frame-item { aspect-ratio: 16/9; background: #000; border-radius: 4px; overflow: hidden; position: relative; }
.frame-item img { width: 100%; height: 100%; object-fit: cover; }
.frame-number { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 4px; border-radius: 2px; }
```

### frames.js 핵심 로직
```js
// ID 주의: extractBtn → getElementById('export-btn'), framesContainer → getElementById('frames-grid')
let extractedFrames = []; // { name, data(ArrayBuffer) } 배열 — ZIP용

// 추출
ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
await ffmpeg.run('-i', 'input.mp4', '-vsync', '0', '-an', 'out_%05d.png');

const files = ffmpeg.FS('readdir', '/');
const frameFiles = files.filter(f => f.startsWith('out_') && f.endsWith('.png')).sort();

frameFiles.forEach((filename, index) => {
    const data = ffmpeg.FS('readFile', filename);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'image/png' }));
    extractedFrames.push({ name: `frame_${index+1}.png`, data: data.buffer });
    // DOM에 img + frame number + 개별 다운로드 버튼 추가
    ffmpeg.FS('unlink', filename); // 즉시 정리
});

// frames-result-container 표시 (hidden 제거)
if (extractedFrames.length > 0) elements.framesResultContainer.classList.remove('hidden');

// ZIP 다운로드
const zip = new JSZip();
extractedFrames.forEach(f => zip.file(f.name, f.data));
const content = await zip.generateAsync({ type: 'blob' });
// a.download = 'frames.zip' 으로 다운로드
```

---

## 13. GitHub Pages 배포 시 주의사항

1. **coi-serviceworker.js 필수** — 모든 HTML `<head>` 최상단에 위치해야 SharedArrayBuffer 활성화됨. 첫 방문 후 새로고침 1회 필요.

2. **FFmpeg.wasm 버전 고정** — `@0.11.0` / `@ffmpeg/core@0.11.0` 이외 버전 사용 금지. 0.12.x는 Worker CORS 문제로 GitHub Pages에서 동작 불가.

3. **GitHub Actions 불필요** — 정적 파일만으로 구성되어 있으므로 Settings → Pages → Branch: main, folder: / (root) 설정만으로 배포 완료.

4. **robots.txt / sitemap.xml** — SEO용. sitemap.xml의 URL은 실제 배포 도메인으로 수정 필요.

---

## 14. 기능 요약표

| 도구 | 파일 | 주요 FFmpeg 명령 | 출력 |
|---|---|---|---|
| **Trim** | `index.html` + `js/main.js` | `-ss [start] -to [end] -i input.mp4 [-vf ...] output.mp4` | MP4 / GIF |
| **Crop** | `tools/crop/` | `-i input.mp4 -vf crop=W:H:X:Y output_crop.mp4` | MP4 / GIF |
| **Merge** | `tools/merge/` | `-f concat -safe 0 -i concat.txt -c copy output_merged.mp4` | MP4 |
| **Sync** | `tools/sync/` | `-vf setpts=R*PTS -map 0:v -map 1:a output_synced.mp4` | MP4 |
| **Frames** | `tools/frames/` | `-vsync 0 -an out_%05d.png` → ZIP | PNG × N + ZIP |

| 공통 기능 | 구현 위치 |
|---|---|
| 다크/라이트 테마 | CSS 변수 + `localStorage` |
| 4개 언어 (ko/en/zh/ja) | `js/i18n.js` + `data-i18n` 속성 |
| 드래그앤드롭 업로드 | 모든 도구 |
| 결과물 미리보기 | 모든 도구 (download-container 내 video 태그) |
| 키보드 단축키 | Trim: ←→ (0.05s), Shift+←→ (0.01s), Space |
