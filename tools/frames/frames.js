const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    uploader:             document.getElementById('uploader'),
    editorContainer:      document.getElementById('editor-container'),
    status:               document.getElementById('status'),
    extractBtn:           document.getElementById('export-btn'),
    downloadAllBtn:       document.getElementById('download-all-btn'),
    progressContainer:    document.getElementById('progress-container'),
    progressFill:         document.getElementById('progress-fill'),
    progressText:         document.getElementById('progress-text'),
    progressPercent:      document.getElementById('progress-percent'),
    dropZone:             document.getElementById('drop-zone'),
    framesContainer:      document.getElementById('frames-grid'),
    framesResultContainer: document.getElementById('frames-result-container'),
    themeToggle:          document.getElementById('theme-toggle'),
};

let videoFile       = null;
let extractedFrames = [];
let isFFmpegLoaded  = false;

function getT() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    return (window.translations && window.translations[lang]) || {};
}

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
    const t = getT();
    if (elements.status) elements.status.innerText = t.status_init || 'FFmpeg initializing...';
    try {
        await ffmpeg.load();
        isFFmpegLoaded = true;
        if (elements.status) elements.status.innerText = t.status_ready || 'Ready';
    } catch (err) {
        if (elements.status) elements.status.innerText = (t.status_error || 'Error: ') + err.message;
        console.error('[FFmpeg init error]', err);
    }
}
initFFmpeg();

async function handleFile(file) {
    if (!file) return;
    videoFile = file;
    if (elements.editorContainer)       elements.editorContainer.classList.remove('hidden');
    if (elements.dropZone)              elements.dropZone.classList.add('hidden');
    if (elements.framesContainer)       elements.framesContainer.innerHTML = '';
    if (elements.framesResultContainer) elements.framesResultContainer.classList.add('hidden');
    extractedFrames = [];
}

if (elements.dropZone) elements.dropZone.onclick = () => elements.uploader.click();
if (elements.uploader) elements.uploader.onchange = (e) => handleFile(e.target.files[0]);
if (elements.dropZone) {
    elements.dropZone.ondragover  = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop      = (e) => { e.preventDefault(); elements.dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
}

if (elements.extractBtn) {
    elements.extractBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;

        const t = getT();
        elements.extractBtn.disabled = true;
        if (elements.framesResultContainer) elements.framesResultContainer.classList.add('hidden');
        if (elements.progressContainer)     elements.progressContainer.classList.remove('hidden');
        if (elements.framesContainer)       elements.framesContainer.innerHTML = '';
        extractedFrames = [];

        ffmpeg.setProgress(({ ratio }) => {
            const p = Math.min(Math.round(ratio * 100), 99);
            if (elements.progressFill)    elements.progressFill.style.width = `${p}%`;
            if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
        });

        try {
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
            await ffmpeg.run('-i', 'input.mp4', '-vsync', '0', '-an', 'out_%05d.png');

            // FS에서 추출된 PNG 파일 목록 조회
            const files = ffmpeg.FS('readdir', '/');
            const frameFiles = files
                .filter(f => f.startsWith('out_') && f.endsWith('.png'))
                .sort();

            if (frameFiles.length === 0) {
                alert('No frames found.');
                return;
            }

            for (let index = 0; index < frameFiles.length; index++) {
                const filename = frameFiles[index];
                const data = ffmpeg.FS('readFile', filename);
                const blob = new Blob([data.buffer], { type: 'image/png' });
                const url  = URL.createObjectURL(blob);

                extractedFrames.push({ name: `frame_${index + 1}.png`, data: data.buffer });

                const frameItem = document.createElement('div');
                frameItem.className = 'frame-item';

                const img = document.createElement('img');
                img.src = url;

                const label = document.createElement('div');
                label.className = 'frame-number';
                label.innerText = index + 1;

                const dlBtn = document.createElement('button');
                dlBtn.className = 'download-btn-mini';
                dlBtn.innerText = '↓';
                dlBtn.onclick = (e) => {
                    e.stopPropagation();
                    const a = document.createElement('a');
                    a.href = url; a.download = `frame_${index + 1}.png`; a.click();
                };

                frameItem.appendChild(img);
                frameItem.appendChild(label);
                frameItem.appendChild(dlBtn);
                elements.framesContainer.appendChild(frameItem);

                try { ffmpeg.FS('unlink', filename); } catch (_) {}
            }

            if (extractedFrames.length > 0 && elements.framesResultContainer) {
                elements.framesResultContainer.classList.remove('hidden');
            }
            if (elements.progressFill)    elements.progressFill.style.width = '100%';
            if (elements.progressPercent) elements.progressPercent.innerText = '100%';
            if (elements.progressText)    elements.progressText.innerText = t.encoding_done || 'Done!';
        } catch (err) {
            console.error(err);
            if (elements.progressText) elements.progressText.innerText = (t.status_error || 'Error: ') + err.message;
        } finally {
            try { ffmpeg.FS('unlink', 'input.mp4'); } catch (_) {}
            elements.extractBtn.disabled = false;
        }
    };
}

if (elements.downloadAllBtn) {
    elements.downloadAllBtn.onclick = async () => {
        if (extractedFrames.length === 0) return;
        const t = getT();
        elements.downloadAllBtn.disabled = true;
        const originalText = elements.downloadAllBtn.innerText;
        elements.downloadAllBtn.innerText = t.progress_processing || 'Processing...';

        const zip = new JSZip();
        extractedFrames.forEach(f => zip.file(f.name, f.data));
        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'frames.zip';
        a.click();

        elements.downloadAllBtn.disabled = false;
        elements.downloadAllBtn.innerText = originalText;
    };
}
