const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    uploader:           document.getElementById('uploader'),
    videoPreview:       document.getElementById('video-preview'),
    editorContainer:    document.getElementById('editor-container'),
    status:             document.getElementById('status'),
    exportBtn:          document.getElementById('export-btn'),
    progressContainer:  document.getElementById('progress-container'),
    progressFill:       document.getElementById('progress-fill'),
    progressText:       document.getElementById('progress-text'),
    progressPercent:    document.getElementById('progress-percent'),
    downloadContainer:  document.getElementById('download-container'),
    downloadLink:       document.getElementById('download-link'),
    dropZone:           document.getElementById('drop-zone'),
    videoResVal:        document.getElementById('video-res-val'),
    cropX:              document.getElementById('crop-x'),
    cropY:              document.getElementById('crop-y'),
    cropW:              document.getElementById('crop-w'),
    cropH:              document.getElementById('crop-h'),
    cropBox:            document.getElementById('crop-box'),
    videoWrapper:       document.getElementById('video-wrapper'),
    resetBtn:           document.getElementById('reset-crop-btn'),
    p169:               document.getElementById('preset-16-9'),
    p916:               document.getElementById('preset-9-16'),
    p11:                document.getElementById('preset-1-1'),
    themeToggle:        document.getElementById('theme-toggle'),
    rotateBtn:          document.getElementById('rotate-btn'),
    flipBtn:            document.getElementById('flip-btn'),
    speedSelect:        document.getElementById('speed-select'),
    muteCheck:          document.getElementById('mute-check'),
    audioExtractBtn:    document.getElementById('audio-extract-btn'),
    resultVideoPreview: document.getElementById('result-video-preview'),
};

let videoFile = null;
let originalWidth = 0, originalHeight = 0;
let rotation = 0, isFlipped = false;
let isFFmpegLoaded = false;

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
    if (!file || !elements.videoPreview) return;
    videoFile = file;
    elements.videoPreview.src = URL.createObjectURL(file);
    elements.editorContainer.classList.remove('hidden');
    elements.dropZone.classList.add('hidden');

    elements.videoPreview.onloadedmetadata = () => {
        originalWidth  = elements.videoPreview.videoWidth;
        originalHeight = elements.videoPreview.videoHeight;
        if (elements.videoResVal) elements.videoResVal.innerText = `${originalWidth} x ${originalHeight}`;
        resetCrop();
    };
}

function resetCrop() {
    if (!elements.cropX) return;
    elements.cropX.value = 0;
    elements.cropY.value = 0;
    elements.cropW.value = originalWidth;
    elements.cropH.value = originalHeight;
    updateCropBoxFromInputs();
}

function updateCropBoxFromInputs() {
    if (!elements.videoPreview || !elements.cropBox) return;
    const vw = elements.videoPreview.clientWidth;
    const vh = elements.videoPreview.clientHeight;
    const sx = vw / originalWidth;
    const sy = vh / originalHeight;
    elements.cropBox.style.left   = (parseInt(elements.cropX.value) * sx) + 'px';
    elements.cropBox.style.top    = (parseInt(elements.cropY.value) * sy) + 'px';
    elements.cropBox.style.width  = (parseInt(elements.cropW.value) * sx) + 'px';
    elements.cropBox.style.height = (parseInt(elements.cropH.value) * sy) + 'px';
}

function updateInputsFromCropBox() {
    if (!elements.videoPreview || !elements.cropBox) return;
    const vw = elements.videoPreview.clientWidth;
    const vh = elements.videoPreview.clientHeight;
    elements.cropX.value = Math.round(elements.cropBox.offsetLeft   * originalWidth  / vw);
    elements.cropY.value = Math.round(elements.cropBox.offsetTop    * originalHeight / vh);
    elements.cropW.value = Math.round(elements.cropBox.offsetWidth  * originalWidth  / vw);
    elements.cropH.value = Math.round(elements.cropBox.offsetHeight * originalHeight / vh);
}

// Crop box drag & resize
if (elements.cropBox) {
    let isDragging = false, isResizing = false, currentHandle = null;
    let startX, startY, startLeft, startTop, startWidth, startHeight;

    elements.cropBox.onmousedown = (e) => {
        if (e.target.classList.contains('crop-handle')) { isResizing = true; currentHandle = e.target; }
        else isDragging = true;
        startX = e.clientX; startY = e.clientY;
        startLeft = elements.cropBox.offsetLeft; startTop = elements.cropBox.offsetTop;
        startWidth = elements.cropBox.offsetWidth; startHeight = elements.cropBox.offsetHeight;
        e.preventDefault();
    };

    window.addEventListener('mousemove', (e) => {
        if (!isDragging && !isResizing) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        const vw = elements.videoPreview.clientWidth, vh = elements.videoPreview.clientHeight;

        if (isDragging) {
            elements.cropBox.style.left = Math.max(0, Math.min(vw - startWidth,  startLeft + dx)) + 'px';
            elements.cropBox.style.top  = Math.max(0, Math.min(vh - startHeight, startTop  + dy)) + 'px';
        } else if (isResizing) {
            const cls = currentHandle.classList;
            if (cls.contains('se')) {
                elements.cropBox.style.width  = Math.max(10, Math.min(vw - startLeft, startWidth  + dx)) + 'px';
                elements.cropBox.style.height = Math.max(10, Math.min(vh - startTop,  startHeight + dy)) + 'px';
            } else if (cls.contains('sw')) {
                const nw = Math.max(10, Math.min(startLeft + startWidth, startWidth - dx));
                elements.cropBox.style.left   = (startLeft + startWidth - nw) + 'px';
                elements.cropBox.style.width  = nw + 'px';
                elements.cropBox.style.height = Math.max(10, Math.min(vh - startTop, startHeight + dy)) + 'px';
            } else if (cls.contains('ne')) {
                elements.cropBox.style.width  = Math.max(10, Math.min(vw - startLeft, startWidth + dx)) + 'px';
                const nh = Math.max(10, Math.min(startTop + startHeight, startHeight - dy));
                elements.cropBox.style.top    = (startTop + startHeight - nh) + 'px';
                elements.cropBox.style.height = nh + 'px';
            } else if (cls.contains('nw')) {
                const nw = Math.max(10, Math.min(startLeft + startWidth, startWidth - dx));
                elements.cropBox.style.left   = (startLeft + startWidth - nw) + 'px';
                elements.cropBox.style.width  = nw + 'px';
                const nh = Math.max(10, Math.min(startTop + startHeight, startHeight - dy));
                elements.cropBox.style.top    = (startTop + startHeight - nh) + 'px';
                elements.cropBox.style.height = nh + 'px';
            }
        }
        updateInputsFromCropBox();
    });

    window.addEventListener('mouseup', () => { isDragging = false; isResizing = false; });
}

// Presets
if (elements.p169) elements.p169.onclick = () => {
    const h = originalWidth * (9 / 16);
    if (h <= originalHeight) { elements.cropW.value = originalWidth; elements.cropH.value = Math.round(h); }
    else { elements.cropH.value = originalHeight; elements.cropW.value = Math.round(originalHeight * (16 / 9)); }
    elements.cropX.value = Math.round((originalWidth  - parseInt(elements.cropW.value)) / 2);
    elements.cropY.value = Math.round((originalHeight - parseInt(elements.cropH.value)) / 2);
    updateCropBoxFromInputs();
};

if (elements.p916) elements.p916.onclick = () => {
    const w = originalHeight * (9 / 16);
    if (w <= originalWidth) { elements.cropH.value = originalHeight; elements.cropW.value = Math.round(w); }
    else { elements.cropW.value = originalWidth; elements.cropH.value = Math.round(originalWidth * (16 / 9)); }
    elements.cropX.value = Math.round((originalWidth  - parseInt(elements.cropW.value)) / 2);
    elements.cropY.value = Math.round((originalHeight - parseInt(elements.cropH.value)) / 2);
    updateCropBoxFromInputs();
};

if (elements.p11) elements.p11.onclick = () => {
    const size = Math.min(originalWidth, originalHeight);
    elements.cropW.value = size; elements.cropH.value = size;
    elements.cropX.value = Math.round((originalWidth  - size) / 2);
    elements.cropY.value = Math.round((originalHeight - size) / 2);
    updateCropBoxFromInputs();
};

if (elements.rotateBtn) elements.rotateBtn.onclick = () => {
    rotation = (rotation + 90) % 360;
    elements.videoPreview.style.transform = `rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
};
if (elements.flipBtn) elements.flipBtn.onclick = () => {
    isFlipped = !isFlipped;
    elements.videoPreview.style.transform = `rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
};

if (elements.resetBtn) elements.resetBtn.onclick = resetCrop;
if (elements.cropX) elements.cropX.oninput = updateCropBoxFromInputs;
if (elements.cropY) elements.cropY.oninput = updateCropBoxFromInputs;
if (elements.cropW) elements.cropW.oninput = updateCropBoxFromInputs;
if (elements.cropH) elements.cropH.oninput = updateCropBoxFromInputs;

if (elements.dropZone) elements.dropZone.onclick = () => elements.uploader.click();
if (elements.uploader) elements.uploader.onchange = (e) => handleFile(e.target.files[0]);
if (elements.dropZone) {
    elements.dropZone.ondragover  = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop      = (e) => { e.preventDefault(); elements.dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
}

async function runExport(args, outName) {
    const t = getT();
    if (elements.exportBtn)       elements.exportBtn.disabled = true;
    if (elements.audioExtractBtn) elements.audioExtractBtn && (elements.audioExtractBtn.disabled = true);
    if (elements.progressContainer) elements.progressContainer.classList.remove('hidden');
    if (elements.downloadContainer) elements.downloadContainer.classList.add('hidden');

    ffmpeg.setProgress(({ ratio }) => {
        const p = Math.min(Math.round(ratio * 100), 99);
        if (elements.progressFill)    elements.progressFill.style.width = `${p}%`;
        if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
    });

    try {
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
        await ffmpeg.run(...args);
        const data = ffmpeg.FS('readFile', outName);
        const mimeType = outName.endsWith('.gif') ? 'image/gif' : 'video/mp4';
        const url = URL.createObjectURL(new Blob([data.buffer], { type: mimeType }));

        if (elements.downloadLink) {
            elements.downloadLink.href = url;
            elements.downloadLink.download = outName;
        }
        if (elements.resultVideoPreview && (outName.endsWith('.mp4') || outName.endsWith('.gif'))) {
            elements.resultVideoPreview.src = url;
        }
        if (elements.downloadContainer) elements.downloadContainer.classList.remove('hidden');
        if (elements.progressFill)    elements.progressFill.style.width = '100%';
        if (elements.progressPercent) elements.progressPercent.innerText = '100%';
        if (elements.progressText)    elements.progressText.innerText = t.encoding_done || 'Done!';
    } catch (err) {
        if (elements.progressText) elements.progressText.innerText = (t.status_error || 'Error: ') + err.message;
        console.error(err);
    } finally {
        try { ffmpeg.FS('unlink', 'input.mp4'); } catch (_) {}
        try { ffmpeg.FS('unlink', outName); } catch (_) {}
        if (elements.exportBtn) elements.exportBtn.disabled = false;
        if (elements.audioExtractBtn) elements.audioExtractBtn && (elements.audioExtractBtn.disabled = false);
    }
}

if (elements.audioExtractBtn) {
    elements.audioExtractBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        await runExport(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output_audio.mp3'], 'output_audio.mp3');
    };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;

        const x = elements.cropX.value, y = elements.cropY.value;
        const w = elements.cropW.value, h = elements.cropH.value;
        const speed   = parseFloat(elements.speedSelect ? elements.speedSelect.value : '1.0');
        const isMuted = elements.muteCheck ? elements.muteCheck.checked : false;
        const formatEl = document.querySelector('input[name="format"]:checked');
        const format  = formatEl ? formatEl.value : 'mp4';

        const vf = [`crop=${w}:${h}:${x}:${y}`];
        if (isFlipped)         vf.push('hflip');
        if (rotation === 90)   vf.push('transpose=1');
        else if (rotation === 180) vf.push('transpose=1,transpose=1');
        else if (rotation === 270) vf.push('transpose=2');
        if (speed !== 1.0)     vf.push(`setpts=${1 / speed}*PTS`);

        let args = ['-i', 'input.mp4'];

        if (format === 'gif') {
            args.push('-vf', `${vf.join(',')},fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, 'output_crop.gif');
            await runExport(args, 'output_crop.gif');
        } else {
            args.push('-vf', vf.join(','));
            if (isMuted)            args.push('-an');
            else if (speed !== 1.0) args.push('-filter:a', `atempo=${speed}`);
            args.push('output_crop.mp4');
            await runExport(args, 'output_crop.mp4');
        }
    };
}
