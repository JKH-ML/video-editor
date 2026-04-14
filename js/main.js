const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    logger: ({ message }) => {
        const m = message.match(/(\d+(?:\.\d+)?)\s+fps/);
        if (m) videoFPS = parseFloat(m[1]);
    },
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
    startTime:          document.getElementById('start-time'),
    endTime:            document.getElementById('end-time'),
    rangeStart:         document.getElementById('range-start'),
    rangeEnd:           document.getElementById('range-end'),
    timelineRange:      document.getElementById('timeline-range'),
    setStartBtn:        document.getElementById('set-start-btn'),
    setEndBtn:          document.getElementById('set-end-btn'),
    currentTimeVal:     document.getElementById('current-time-val'),
    currentFrameVal:    document.getElementById('current-frame-val'),
    captureFrameBtn:    document.getElementById('capture-frame-btn'),
    dropZone:           document.getElementById('drop-zone'),
    themeToggle:        document.getElementById('theme-toggle'),
    rotateBtn:          document.getElementById('rotate-btn'),
    flipBtn:            document.getElementById('flip-btn'),
    speedSelect:        document.getElementById('speed-select'),
    muteCheck:          document.getElementById('mute-check'),
    audioExtractBtn:    document.getElementById('audio-extract-btn'),
    resultVideoPreview: document.getElementById('result-video-preview'),
};

let videoFile = null;
let videoFPS  = 30;
let rotation  = 0;
let isFlipped = false;
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

// 비디오 시간 표시
if (elements.videoPreview) {
    elements.videoPreview.ontimeupdate = () => {
        const time = elements.videoPreview.currentTime;
        if (elements.currentTimeVal) elements.currentTimeVal.innerText = time.toFixed(2) + 's';
        if (elements.currentFrameVal) elements.currentFrameVal.innerText = `(Frame: ${Math.floor(time * videoFPS)})`;
    };
}

async function handleFile(file) {
    if (!file || !elements.videoPreview) return;
    videoFile = file;
    elements.videoPreview.src = URL.createObjectURL(file);
    elements.editorContainer.classList.remove('hidden');
    elements.dropZone.classList.add('hidden');

    elements.videoPreview.onloadedmetadata = () => {
        const dur = elements.videoPreview.duration;
        if (elements.startTime)  elements.startTime.value  = '0.00';
        if (elements.endTime)    elements.endTime.value    = dur.toFixed(2);
        if (elements.rangeStart) { elements.rangeStart.max = dur; elements.rangeStart.value = 0; }
        if (elements.rangeEnd)   { elements.rangeEnd.max   = dur; elements.rangeEnd.value   = dur; }
        updateTimeline();
    };

    // FPS 파싱용 (에러는 무시)
    try {
        ffmpeg.FS('writeFile', 'tmp.mp4', await fetchFile(file));
        await ffmpeg.run('-i', 'tmp.mp4');
    } catch (_) {}
    try { ffmpeg.FS('unlink', 'tmp.mp4'); } catch (_) {}
}

function updateTimeline() {
    if (!elements.rangeStart || !elements.rangeEnd || !elements.videoPreview) return;
    const start    = parseFloat(elements.rangeStart.value);
    const end      = parseFloat(elements.rangeEnd.value);
    const duration = elements.videoPreview.duration;

    if (start > end) elements.rangeStart.value = end;
    if (elements.startTime) elements.startTime.value = parseFloat(elements.rangeStart.value).toFixed(2);
    if (elements.endTime)   elements.endTime.value   = parseFloat(elements.rangeEnd.value).toFixed(2);

    if (elements.timelineRange) {
        elements.timelineRange.style.left  = (elements.rangeStart.value / duration * 100) + '%';
        elements.timelineRange.style.right = (100 - elements.rangeEnd.value / duration * 100) + '%';
    }
}

if (elements.rangeStart) {
    elements.rangeStart.oninput = () => {
        if (parseFloat(elements.rangeStart.value) > parseFloat(elements.rangeEnd.value))
            elements.rangeStart.value = elements.rangeEnd.value;
        elements.videoPreview.currentTime = elements.rangeStart.value;
        updateTimeline();
    };
}

if (elements.rangeEnd) {
    elements.rangeEnd.oninput = () => {
        if (parseFloat(elements.rangeEnd.value) < parseFloat(elements.rangeStart.value))
            elements.rangeEnd.value = elements.rangeStart.value;
        elements.videoPreview.currentTime = elements.rangeEnd.value;
        updateTimeline();
    };
}

if (elements.setStartBtn) elements.setStartBtn.onclick = () => { elements.rangeStart.value = elements.videoPreview.currentTime; updateTimeline(); };
if (elements.setEndBtn)   elements.setEndBtn.onclick   = () => { elements.rangeEnd.value   = elements.videoPreview.currentTime; updateTimeline(); };

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
    if (e.key === 'ArrowLeft')  { elements.videoPreview.currentTime = Math.max(0, elements.videoPreview.currentTime - step); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { elements.videoPreview.currentTime = Math.min(elements.videoPreview.duration, elements.videoPreview.currentTime + step); e.preventDefault(); }
    else if (e.key === ' ')     { elements.videoPreview.paused ? elements.videoPreview.play() : elements.videoPreview.pause(); e.preventDefault(); }
};

if (elements.dropZone) elements.dropZone.onclick = () => elements.uploader.click();
if (elements.uploader) elements.uploader.onchange = (e) => handleFile(e.target.files[0]);

if (elements.dropZone) {
    elements.dropZone.ondragover  = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop      = (e) => { e.preventDefault(); elements.dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
}

if (elements.captureFrameBtn) {
    elements.captureFrameBtn.onclick = () => {
        if (!elements.videoPreview.src) return;
        const canvas = document.createElement('canvas');
        canvas.width  = elements.videoPreview.videoWidth;
        canvas.height = elements.videoPreview.videoHeight;
        canvas.getContext('2d').drawImage(elements.videoPreview, 0, 0);
        const a = document.createElement('a');
        a.download = `output_frame_${elements.videoPreview.currentTime.toFixed(2)}s.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    };
}

async function runExport(args, outName) {
    const t = getT();
    if (elements.exportBtn)       elements.exportBtn.disabled = true;
    if (elements.audioExtractBtn) elements.audioExtractBtn.disabled = true;
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
        const mimeType = outName.endsWith('.gif') ? 'image/gif' : outName.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';
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
        if (elements.exportBtn)       elements.exportBtn.disabled = false;
        if (elements.audioExtractBtn) elements.audioExtractBtn.disabled = false;
    }
}

if (elements.audioExtractBtn) {
    elements.audioExtractBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        const start = elements.startTime.value;
        const end   = elements.endTime.value;
        await runExport(['-ss', start, '-to', end, '-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output_audio.mp3'], 'output_audio.mp3');
    };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;

        const start  = elements.startTime.value;
        const end    = elements.endTime.value;
        const speed  = parseFloat(elements.speedSelect.value);
        const isMuted = elements.muteCheck.checked;
        const format = document.querySelector('input[name="format"]:checked').value;

        const vf = [];
        if (isFlipped)         vf.push('hflip');
        if (rotation === 90)   vf.push('transpose=1');
        else if (rotation === 180) vf.push('transpose=1,transpose=1');
        else if (rotation === 270) vf.push('transpose=2');
        if (speed !== 1.0)     vf.push(`setpts=${1 / speed}*PTS`);

        let args = ['-ss', start, '-to', end, '-i', 'input.mp4'];

        if (format === 'gif') {
            const vfStr = vf.length ? vf.join(',') + ',' : '';
            args.push('-vf', `${vfStr}fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, 'output_trim.gif');
            await runExport(args, 'output_trim.gif');
        } else {
            if (vf.length) args.push('-vf', vf.join(','));
            if (isMuted)        args.push('-an');
            else if (speed !== 1.0) args.push('-filter:a', `atempo=${speed}`);
            args.push('output_trim.mp4');
            await runExport(args, 'output_trim.mp4');
        }
    };
}
