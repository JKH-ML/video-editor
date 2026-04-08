const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    videoUploader: document.getElementById('video-uploader'),
    audioUploader: document.getElementById('audio-uploader'),
    status: document.getElementById('status'),
    exportBtn: document.getElementById('export-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    downloadContainer: document.getElementById('download-container'),
    downloadLink: document.getElementById('download-link'),
    dropZoneVideo: document.getElementById('drop-zone-video'),
    dropZoneAudio: document.getElementById('drop-zone-audio'),
    editorContainer: document.getElementById('editor-container'),
    vDuration: document.getElementById('v-duration'),
    vFrames: document.getElementById('v-frames'),
    aDuration: document.getElementById('a-duration'),
    targetFps: document.getElementById('target-fps'),
    videoFileInfo: document.getElementById('video-file-info'),
    audioFileInfo: document.getElementById('audio-file-info'),
    themeToggle: document.getElementById('theme-toggle'),
    resultVideoPreview: document.getElementById('result-video-preview')
};

let videoFile = null;
let audioFile = null;
let isFFmpegLoaded = false;
let videoDuration = 0;
let audioDuration = 0;
let videoFPS = 30; // Default
let isProcessing = false;
let calculatedNewFPS = 30;

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

// Helper to parse time string (00:00:00.00) to seconds
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length < 3) return 0;
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    return (hrs * 3600) + (mins * 60) + secs;
}

// Logger to catch FPS and track encoding progress
ffmpeg.setLogger(({ message }) => {
    // 1. Detect FPS from metadata
    if (!isProcessing && message.includes('Stream') && message.includes('fps')) {
        const fpsMatch = message.match(/(\d+(?:\.\d+)?)\s+fps/);
        if (fpsMatch) {
            videoFPS = parseFloat(fpsMatch[1]);
            updateSyncCalculation();
        }
    }
    
    // 2. Track real-time progress during encoding
    if (isProcessing && message.includes('time=')) {
        const timeMatch = message.match(/time=(\d{2}:\d{2}:\d{2}.\d{2})/);
        if (timeMatch && audioDuration > 0) {
            const currentTime = parseTimeToSeconds(timeMatch[1]);
            const p = Math.min(Math.round((currentTime / audioDuration) * 100), 99);
            if (elements.progressFill) elements.progressFill.style.width = `${p}%`;
            if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
        }
    }
});

async function handleVideoFile(file) {
    if (!file) return;
    videoFile = file;
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
        videoDuration = video.duration;
        if (elements.vDuration) elements.vDuration.innerText = videoDuration.toFixed(2) + 's';
        if (elements.videoFileInfo) elements.videoFileInfo.classList.remove('hidden');
        updateSyncCalculation();
    };
    video.src = URL.createObjectURL(file);
    
    isProcessing = false;
    ffmpeg.FS('writeFile', 'input_v.mp4', await fetchFile(file));
    await ffmpeg.run('-i', 'input_v.mp4');
}

async function handleAudioFile(file) {
    if (!file) return;
    audioFile = file;
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
        audioDuration = audio.duration;
        if (elements.aDuration) elements.aDuration.innerText = audioDuration.toFixed(2) + 's';
        if (elements.audioFileInfo) elements.audioFileInfo.classList.remove('hidden');
        updateSyncCalculation();
    };
    audio.src = URL.createObjectURL(file);
}

function updateSyncCalculation() {
    if (videoDuration > 0 && audioDuration > 0) {
        const totalFrames = videoDuration * videoFPS;
        calculatedNewFPS = totalFrames / audioDuration;
        if (elements.vFrames) elements.vFrames.innerText = Math.round(totalFrames);
        if (elements.targetFps) elements.targetFps.innerText = calculatedNewFPS.toFixed(3) + ' FPS';
        if (elements.editorContainer) elements.editorContainer.classList.remove('hidden');
        if (elements.exportBtn) elements.exportBtn.disabled = false;
    }
}

if (elements.videoUploader) elements.videoUploader.onchange = (e) => handleVideoFile(e.target.files[0]);
if (elements.audioUploader) elements.audioUploader.onchange = (e) => handleAudioFile(e.target.files[0]);

if (elements.dropZoneVideo) {
    elements.dropZoneVideo.onclick = () => elements.videoUploader.click();
    elements.dropZoneVideo.ondragover = (e) => { e.preventDefault(); elements.dropZoneVideo.classList.add('dragover'); };
    elements.dropZoneVideo.ondragleave = () => elements.dropZoneVideo.classList.remove('dragover');
    elements.dropZoneVideo.ondrop = (e) => {
        e.preventDefault();
        elements.dropZoneVideo.classList.remove('dragover');
        handleVideoFile(e.dataTransfer.files[0]);
    };
}

if (elements.dropZoneAudio) {
    elements.dropZoneAudio.onclick = () => elements.audioUploader.click();
    elements.dropZoneAudio.ondragover = (e) => { e.preventDefault(); elements.dropZoneAudio.classList.add('dragover'); };
    elements.dropZoneAudio.ondragleave = () => elements.dropZoneAudio.classList.remove('dragover');
    elements.dropZoneAudio.ondrop = (e) => {
        e.preventDefault();
        elements.dropZoneAudio.classList.remove('dragover');
        handleAudioFile(e.dataTransfer.files[0]);
    };
}

elements.exportBtn.onclick = async () => {
    if (!videoFile || !audioFile || !isFFmpegLoaded) return;
    
    const lang = (window.getCurrentLang && window.getCurrentLang()) || 'ko';
    const t = (window.translations && window.translations[lang]) || translations[lang];
    
    isProcessing = true;
    if (elements.exportBtn) elements.exportBtn.disabled = true;
    if (elements.progressContainer) elements.progressContainer.classList.remove('hidden');
    if (elements.downloadContainer) elements.downloadContainer.classList.add('hidden');

    const ptsRatio = audioDuration / videoDuration;

    try {
        ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(videoFile));
        ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audioFile));

        await ffmpeg.run(
            '-i', 'video.mp4',
            '-i', 'audio.mp3',
            '-filter_complex', `[0:v]setpts=${ptsRatio}*PTS[v]`,
            '-map', '[v]',
            '-map', '1:a',
            '-r', calculatedNewFPS.toFixed(3),
            '-c:v', 'libx264',
            '-preset', 'ultrafast', // CRITICAL: Maximum speed for browser environment
            '-tune', 'zerolatency', // Immediate feedback
            '-crf', '25', // Balance between speed and quality
            '-c:a', 'aac',
            '-b:a', '128k',
            '-t', audioDuration.toFixed(2),
            'output_synced.mp4'
        );

        const data = ffmpeg.FS('readFile', 'output_synced.mp4');
        const url = URL.createObjectURL(new Blob([data.buffer]));
        
        if (elements.downloadLink) {
            elements.downloadLink.href = url;
            elements.downloadLink.download = 'output_synced.mp4';
        }
        
        if (elements.resultVideoPreview) {
            elements.resultVideoPreview.src = url;
        }
        
        if (elements.downloadContainer) elements.downloadContainer.classList.remove('hidden');
        if (elements.progressText) {
            elements.progressText.innerText = t.encoding_done;
            elements.progressPercent.innerText = '100%';
            elements.progressFill.style.width = '100%';
        }
        
    } catch (err) {
        console.error(err);
        if (elements.progressText) elements.progressText.innerText = t.status_error + err.message;
    } finally {
        isProcessing = false;
        if (elements.exportBtn) elements.exportBtn.disabled = false;
    }
};
