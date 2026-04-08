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

if (elements.videoPreview) {
    elements.videoPreview.ontimeupdate = () => {
        const time = elements.videoPreview.currentTime;
        if (elements.currentTimeVal) elements.currentTimeVal.innerText = time.toFixed(2) + 's';
        if (elements.currentFrameVal) elements.currentFrameVal.innerText = `(Frame: ${Math.floor(time * videoFPS)})`;
    };
}

ffmpeg.setLogger(({ message }) => {
    const fpsMatch = message.match(/(\d+(?:\.\d+)?)\s+fps/);
    if (fpsMatch) videoFPS = parseFloat(fpsMatch[1]);
});

async function handleFile(file) {
    if (!file || !elements.videoPreview) return;
    videoFile = file;
    const url = URL.createObjectURL(file);
    elements.videoPreview.src = url;
    if (elements.editorContainer) elements.editorContainer.classList.remove('hidden');
    if (elements.dropZone) elements.dropZone.classList.add('hidden');
    
    elements.videoPreview.onloadedmetadata = () => {
        const duration = elements.videoPreview.duration;
        if (elements.startTime) elements.startTime.value = "0.00";
        if (elements.endTime) elements.endTime.value = duration.toFixed(2);
        if (elements.rangeStart) {
            elements.rangeStart.max = duration;
            elements.rangeStart.value = 0;
        }
        if (elements.rangeEnd) {
            elements.rangeEnd.max = duration;
            elements.rangeEnd.value = duration;
        }
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
        const left = (elements.rangeStart.value / duration) * 100;
        const right = 100 - (elements.rangeEnd.value / duration) * 100;
        elements.timelineRange.style.left = left + '%';
        elements.timelineRange.style.right = right + '%';
    }
}

if (elements.rangeStart) {
    elements.rangeStart.oninput = () => {
        if (parseFloat(elements.rangeStart.value) > parseFloat(elements.rangeEnd.value)) {
            elements.rangeStart.value = elements.rangeEnd.value;
        }
        elements.videoPreview.currentTime = elements.rangeStart.value;
        updateTimelineVisual();
    };
}

if (elements.rangeEnd) {
    elements.rangeEnd.oninput = () => {
        if (parseFloat(elements.rangeEnd.value) < parseFloat(elements.rangeStart.value)) {
            elements.rangeEnd.value = elements.rangeStart.value;
        }
        elements.videoPreview.currentTime = elements.rangeEnd.value;
        updateTimelineVisual();
    };
}

if (elements.setStartBtn) {
    elements.setStartBtn.onclick = () => {
        elements.rangeStart.value = elements.videoPreview.currentTime;
        updateTimelineVisual();
    };
}

if (elements.setEndBtn) {
    elements.setEndBtn.onclick = () => {
        elements.rangeEnd.value = elements.videoPreview.currentTime;
        updateTimelineVisual();
    };
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

window.onkeydown = (e) => {
    if (!videoFile || document.activeElement.tagName === 'INPUT') return;
    let step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === 'ArrowLeft') {
        elements.videoPreview.currentTime = Math.max(0, elements.videoPreview.currentTime - step);
        e.preventDefault();
    } else if (e.key === 'ArrowRight') {
        elements.videoPreview.currentTime = Math.min(elements.videoPreview.duration, elements.videoPreview.currentTime + step);
        e.preventDefault();
    } else if (e.key === ' ') {
        elements.videoPreview.paused ? elements.videoPreview.play() : elements.videoPreview.pause();
        e.preventDefault();
    }
};

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

if (elements.captureFrameBtn) {
    elements.captureFrameBtn.onclick = () => {
        if (!elements.videoPreview.src) return;
        const canvas = document.createElement('canvas');
        canvas.width = elements.videoPreview.videoWidth;
        canvas.height = elements.videoPreview.videoHeight;
        canvas.getContext('2d').drawImage(elements.videoPreview, 0, 0);
        const link = document.createElement('a');
        link.download = `output_frame_${elements.videoPreview.currentTime.toFixed(2)}s.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
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
        const start = elements.startTime.value;
        const end = elements.endTime.value;
        await runFFmpeg(['-ss', start, '-to', end, '-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output_audio.mp3'], 'output_audio.mp3');
    };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        if (!videoFile || !isFFmpegLoaded) return;
        
        const start = elements.startTime.value;
        const end = elements.endTime.value;
        const speed = parseFloat(elements.speedSelect.value);
        const isMuted = elements.muteCheck.checked;
        const format = document.querySelector('input[name="format"]:checked').value;

        let videoFilters = [];
        if (isFlipped) videoFilters.push('hflip');
        if (rotation === 90) videoFilters.push('transpose=1');
        else if (rotation === 180) videoFilters.push('transpose=1,transpose=1');
        else if (rotation === 270) videoFilters.push('transpose=2');

        if (speed !== 1.0) {
            videoFilters.push(`setpts=${1/speed}*PTS`);
        }

        let args = ['-ss', start, '-to', end, '-i', 'input.mp4'];
        
        if (format === 'gif') {
            const vf = videoFilters.length > 0 ? videoFilters.join(',') + ',' : '';
            args.push('-vf', `${vf}fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, 'output_trim.gif');
            await runFFmpeg(args, 'output_trim.gif');
        } else {
            if (videoFilters.length > 0) {
                args.push('-vf', videoFilters.join(','));
            }
            
            if (isMuted) {
                args.push('-an');
            } else if (speed !== 1.0) {
                args.push('-filter:a', `atempo=${speed}`);
            }
            
            args.push('output_trim.mp4');
            await runFFmpeg(args, 'output_trim.mp4');
        }
    };
}
