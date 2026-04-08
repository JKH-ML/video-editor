const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

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
    dropZone: document.getElementById('drop-zone'),
    videoResVal: document.getElementById('video-res-val'),
    cropX: document.getElementById('crop-x'),
    cropY: document.getElementById('crop-y'),
    cropW: document.getElementById('crop-w'),
    cropH: document.getElementById('crop-h'),
    cropBox: document.getElementById('crop-box'),
    videoWrapper: document.getElementById('video-wrapper'),
    resetBtn: document.getElementById('reset-crop-btn'),
    p169: document.getElementById('preset-16-9'),
    p916: document.getElementById('preset-9-16'),
    p11: document.getElementById('preset-1-1'),
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
let originalWidth = 0;
let originalHeight = 0;
let rotation = 0;
let isFlipped = false;

// Theme Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

if (elements.themeToggle) {
    elements.themeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    };
}

async function initFFmpeg() {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || translations[lang];
    
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

async function handleFile(file) {
    if (!file || !elements.videoPreview) return;
    videoFile = file;
    const url = URL.createObjectURL(file);
    elements.videoPreview.src = url;
    if (elements.editorContainer) elements.editorContainer.classList.remove('hidden');
    if (elements.dropZone) elements.dropZone.classList.add('hidden');
    
    elements.videoPreview.onloadedmetadata = () => {
        originalWidth = elements.videoPreview.videoWidth;
        originalHeight = elements.videoPreview.videoHeight;
        if (elements.videoResVal) elements.videoResVal.innerText = `${originalWidth} x ${originalHeight}`;
        resetCrop();
    };
}

function resetCrop() {
    if (!elements.cropX || !elements.cropY || !elements.cropW || !elements.cropH) return;
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
    const scaleX = vw / originalWidth;
    const scaleY = vh / originalHeight;

    elements.cropBox.style.left = (parseInt(elements.cropX.value) * scaleX) + 'px';
    elements.cropBox.style.top = (parseInt(elements.cropY.value) * scaleY) + 'px';
    elements.cropBox.style.width = (parseInt(elements.cropW.value) * scaleX) + 'px';
    elements.cropBox.style.height = (parseInt(elements.cropH.value) * scaleY) + 'px';
}

function updateInputsFromCropBox() {
    if (!elements.videoPreview || !elements.cropBox) return;
    const vw = elements.videoPreview.clientWidth;
    const vh = elements.videoPreview.clientHeight;
    const scaleX = originalWidth / vw;
    const scaleY = originalHeight / vh;

    elements.cropX.value = Math.round(elements.cropBox.offsetLeft * scaleX);
    elements.cropY.value = Math.round(elements.cropBox.offsetTop * scaleY);
    elements.cropW.value = Math.round(elements.cropBox.offsetWidth * scaleX);
    elements.cropH.value = Math.round(elements.cropBox.offsetHeight * scaleY);
}

if (elements.rotateBtn) {
    elements.rotateBtn.onclick = () => {
        rotation = (rotation + 90) % 360;
        elements.videoPreview.style.transform = `rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
    };
}

if (elements.flipBtn) {
    elements.flipBtn.onclick = () => {
        isFlipped = !isFlipped;
        elements.videoPreview.style.transform = `rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`;
    };
}

if (elements.cropBox) {
    let isDragging = false;
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startLeft, startTop, startWidth, startHeight;

    elements.cropBox.onmousedown = (e) => {
        if (e.target.classList.contains('crop-handle')) {
            isResizing = true;
            currentHandle = e.target;
        } else {
            isDragging = true;
        }
        startX = e.clientX;
        startY = e.clientY;
        startLeft = elements.cropBox.offsetLeft;
        startTop = elements.cropBox.offsetTop;
        startWidth = elements.cropBox.offsetWidth;
        startHeight = elements.cropBox.offsetHeight;
        e.preventDefault();
    };

    window.onmousemove = (e) => {
        if (!isDragging && !isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const vw = elements.videoPreview.clientWidth;
        const vh = elements.videoPreview.clientHeight;

        if (isDragging) {
            let newLeft = Math.max(0, Math.min(vw - startWidth, startLeft + dx));
            let newTop = Math.max(0, Math.min(vh - startHeight, startTop + dy));
            elements.cropBox.style.left = newLeft + 'px';
            elements.cropBox.style.top = newTop + 'px';
        } else if (isResizing) {
            if (currentHandle.classList.contains('se')) {
                elements.cropBox.style.width = Math.max(10, Math.min(vw - startLeft, startWidth + dx)) + 'px';
                elements.cropBox.style.height = Math.max(10, Math.min(vh - startTop, startHeight + dy)) + 'px';
            } else if (currentHandle.classList.contains('sw')) {
                let newWidth = Math.max(10, Math.min(startLeft + startWidth, startWidth - dx));
                elements.cropBox.style.left = (startLeft + startWidth - newWidth) + 'px';
                elements.cropBox.style.width = newWidth + 'px';
                elements.cropBox.style.height = Math.max(10, Math.min(vh - startTop, startHeight + dy)) + 'px';
            } else if (currentHandle.classList.contains('ne')) {
                elements.cropBox.style.width = Math.max(10, Math.min(vw - startLeft, startWidth + dx)) + 'px';
                let newHeight = Math.max(10, Math.min(startTop + startHeight, startHeight - dy));
                elements.cropBox.style.top = (startTop + startHeight - newHeight) + 'px';
                elements.cropBox.style.height = newHeight + 'px';
            } else if (currentHandle.classList.contains('nw')) {
                let newWidth = Math.max(10, Math.min(startLeft + startWidth, startWidth - dx));
                elements.cropBox.style.left = (startLeft + startWidth - newWidth) + 'px';
                elements.cropBox.style.width = newWidth + 'px';
                let newHeight = Math.max(10, Math.min(startTop + startHeight, startHeight - dy));
                elements.cropBox.style.top = (startTop + startHeight - newHeight) + 'px';
                elements.cropBox.style.height = newHeight + 'px';
            }
        }
        updateInputsFromCropBox();
    };

    window.onmouseup = () => {
        isDragging = false;
        isResizing = false;
    };
}

if (elements.p169) {
    elements.p169.onclick = () => {
        const h = originalWidth * (9/16);
        if (h <= originalHeight) {
            elements.cropW.value = originalWidth;
            elements.cropH.value = Math.round(h);
        } else {
            elements.cropH.value = originalHeight;
            elements.cropW.value = Math.round(originalHeight * (16/9));
        }
        elements.cropX.value = Math.round((originalWidth - elements.cropW.value) / 2);
        elements.cropY.value = Math.round((originalHeight - elements.cropH.value) / 2);
        updateCropBoxFromInputs();
    };
}

if (elements.p916) {
    elements.p916.onclick = () => {
        const w = originalHeight * (9/16);
        if (w <= originalWidth) {
            elements.cropH.value = originalHeight;
            elements.cropW.value = Math.round(w);
        } else {
            elements.cropW.value = originalWidth;
            elements.cropH.value = Math.round(originalWidth * (16/9));
        }
        elements.cropX.value = Math.round((originalWidth - elements.cropW.value) / 2);
        elements.cropY.value = Math.round((originalHeight - elements.cropH.value) / 2);
        updateCropBoxFromInputs();
    };
}

if (elements.p11) {
    elements.p11.onclick = () => {
        const size = Math.min(originalWidth, originalHeight);
        elements.cropW.value = size;
        elements.cropH.value = size;
        elements.cropX.value = Math.round((originalWidth - size) / 2);
        elements.cropY.value = Math.round((originalHeight - size) / 2);
        updateCropBoxFromInputs();
    };
}

if (elements.resetBtn) elements.resetBtn.onclick = resetCrop;
if (elements.cropX) elements.cropX.oninput = updateCropBoxFromInputs;
if (elements.cropY) elements.cropY.oninput = updateCropBoxFromInputs;
if (elements.cropW) elements.cropW.oninput = updateCropBoxFromInputs;
if (elements.cropH) elements.cropH.oninput = updateCropBoxFromInputs;

if (elements.dropZone) elements.dropZone.onclick = () => elements.uploader.click();
if (elements.uploader) elements.uploader.onchange = (e) => handleFile(e.target.files[0]);

if (elements.dropZone) {
    elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop = (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    };
}

async function runFFmpeg(args, outName) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || translations[lang];
    
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
        if (elements.audioExtractBtn) elements.audioExtractBtn.disabled = false;
    }
}

if (elements.audioExtractBtn) {
    elements.audioExtractBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        await runFFmpeg(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output_audio.mp3'], 'output_audio.mp3');
    };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        
        const x = elements.cropX.value;
        const y = elements.cropY.value;
        const w = elements.cropW.value;
        const h = elements.cropH.value;
        const speed = parseFloat(elements.speedSelect.value);
        const isMuted = elements.muteCheck.checked;
        const format = document.querySelector('input[name="format"]:checked').value;

        let videoFilters = [`crop=${w}:${h}:${x}:${y}`];
        if (isFlipped) videoFilters.push('hflip');
        if (rotation === 90) videoFilters.push('transpose=1');
        else if (rotation === 180) videoFilters.push('transpose=1,transpose=1');
        else if (rotation === 270) videoFilters.push('transpose=2');

        if (speed !== 1.0) {
            videoFilters.push(`setpts=${1/speed}*PTS`);
        }

        let args = ['-i', 'input.mp4'];
        
        if (format === 'gif') {
            const vf = videoFilters.join(',') + ',';
            args.push('-vf', `${vf}fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, 'output_crop.gif');
            await runFFmpeg(args, 'output_crop.gif');
        } else {
            args.push('-vf', videoFilters.join(','));
            
            if (isMuted) {
                args.push('-an');
            } else if (speed !== 1.0) {
                args.push('-filter:a', `atempo=${speed}`);
            }
            
            args.push('output_crop.mp4');
            await runFFmpeg(args, 'output_crop.mp4');
        }
    };
}
