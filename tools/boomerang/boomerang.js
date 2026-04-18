const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    uploader:           document.getElementById('uploader'),
    dropZone:           document.getElementById('drop-zone'),
    editorContainer:    document.getElementById('editor-container'),
    sourcePreview:      document.getElementById('source-preview'),
    muteToggle:         document.getElementById('mute-toggle'),
    exportBtn:          document.getElementById('export-btn'),
    reBoomerangBtn:     document.getElementById('re-boomerang-btn'),
    status:             document.getElementById('status'),
    progressContainer:  document.getElementById('progress-container'),
    progressFill:       document.getElementById('progress-fill'),
    progressText:       document.getElementById('progress-text'),
    progressPercent:    document.getElementById('progress-percent'),
    downloadContainer:  document.getElementById('download-container'),
    downloadLink:       document.getElementById('download-link'),
    resultVideoPreview: document.getElementById('result-video-preview'),
    themeToggle:        document.getElementById('theme-toggle'),
};

let selectedFile = null;
let lastResultBlob = null;
let isFFmpegLoaded = false;

function getT() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    return (window.translations && window.translations[lang]) || {};
}

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
if (elements.themeToggle) {
    elements.themeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };
}

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

function setupFile(file) {
    selectedFile = file;
    const url = URL.createObjectURL(file);
    elements.sourcePreview.src = url;
    elements.editorContainer.classList.remove('hidden');
    elements.downloadContainer.classList.add('hidden');
    elements.progressContainer.classList.add('hidden');
}

elements.dropZone.addEventListener('click', () => elements.uploader.click());
elements.dropZone.addEventListener('dragover', e => { e.preventDefault(); elements.dropZone.classList.add('drag-over'); });
elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('drag-over'));
elements.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    elements.dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'video/mp4') setupFile(file);
});
elements.uploader.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) setupFile(file);
});

function setProgress(pct, label) {
    elements.progressFill.style.width = pct + '%';
    elements.progressPercent.innerText = pct + '%';
    if (label) elements.progressText.innerText = label;
}

async function runBoomerang(sourceBlob) {
    if (!isFFmpegLoaded) return;
    const t = getT();
    const mute = elements.muteToggle.checked;

    elements.progressContainer.classList.remove('hidden');
    elements.downloadContainer.classList.add('hidden');
    elements.exportBtn.disabled = true;
    if (elements.reBoomerangBtn) elements.reBoomerangBtn.disabled = true;
    setProgress(0, t.progress_processing || 'Processing...');

    try {
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(sourceBlob));
        setProgress(15, t.progress_processing || 'Processing...');

        const audioArgs = mute ? ['-an'] : ['-c:a', 'aac', '-b:a', '128k'];
        await ffmpeg.run(
            '-i', 'input.mp4',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            ...audioArgs,
            '-movflags', '+faststart',
            'forward.mp4'
        );
        setProgress(40, t.progress_processing || 'Processing...');

        const reverseAudioArgs = mute
            ? ['-an']
            : ['-af', 'areverse', '-c:a', 'aac', '-b:a', '128k'];

        await ffmpeg.run(
            '-i', 'input.mp4',
            '-vf', 'reverse',
            ...reverseAudioArgs,
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-movflags', '+faststart',
            'reverse.mp4'
        );
        setProgress(70, t.progress_processing || 'Processing...');

        ffmpeg.FS('writeFile', 'concat.txt',
            new TextEncoder().encode("file 'forward.mp4'\nfile 'reverse.mp4'\n")
        );

        await ffmpeg.run(
            '-f', 'concat', '-safe', '0',
            '-i', 'concat.txt',
            '-c', 'copy',
            'boomerang.mp4'
        );
        setProgress(95, t.progress_processing || 'Processing...');

        const data = ffmpeg.FS('readFile', 'boomerang.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        lastResultBlob = blob;
        const url = URL.createObjectURL(blob);

        elements.resultVideoPreview.src = url;
        elements.downloadLink.href = url;
        elements.downloadLink.download = 'boomerang.mp4';
        elements.downloadContainer.classList.remove('hidden');
        setProgress(100, t.encoding_done || 'Done!');

        ['input.mp4', 'forward.mp4', 'reverse.mp4', 'concat.txt', 'boomerang.mp4'].forEach(f => {
            try { ffmpeg.FS('unlink', f); } catch (_) {}
        });
    } catch (err) {
        console.error(err);
        setProgress(0, (t.status_error || 'Error: ') + err.message);
    } finally {
        elements.exportBtn.disabled = false;
        if (elements.reBoomerangBtn) elements.reBoomerangBtn.disabled = false;
    }
}

elements.exportBtn.addEventListener('click', () => {
    if (selectedFile) runBoomerang(selectedFile);
});

elements.reBoomerangBtn.addEventListener('click', () => {
    if (lastResultBlob) runBoomerang(lastResultBlob);
});
