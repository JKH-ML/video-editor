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
    themeToggle: document.getElementById('theme-toggle')
};

let videoFile = null;
let audioFile = null;
let isFFmpegLoaded = false;
let videoDuration = 0;
let audioDuration = 0;
let videoFPS = 30; // Default
let isProcessing = false;

// Theme Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

elements.themeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

async function initFFmpeg() {
    const lang = getCurrentLang();
    try {
        elements.status.innerText = translations[lang].status_init;
        await ffmpeg.load();
        isFFmpegLoaded = true;
        elements.status.innerText = translations[lang].status_ready;
    } catch (error) {
        elements.status.innerText = translations[lang].status_error + error.message;
    }
}

initFFmpeg();

// Logger to catch FPS from video metadata
ffmpeg.setLogger(({ message }) => {
    // Only capture FPS from metadata streams, NOT from encoding status lines
    if (!isProcessing && message.includes('Stream') && message.includes('fps')) {
        const fpsMatch = message.match(/(\d+(?:\.\d+)?)\s+fps/);
        if (fpsMatch) {
            videoFPS = parseFloat(fpsMatch[1]);
            updateSyncCalculation();
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
        elements.vDuration.innerText = videoDuration.toFixed(2) + 's';
        elements.videoFileInfo.classList.remove('hidden');
        updateSyncCalculation();
    };
    video.src = URL.createObjectURL(file);
    
    // Probe for FPS using FFmpeg (Pre-processing)
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
        elements.aDuration.innerText = audioDuration.toFixed(2) + 's';
        elements.audioFileInfo.classList.remove('hidden');
        updateSyncCalculation();
    };
    audio.src = URL.createObjectURL(file);
}

function updateSyncCalculation() {
    if (videoDuration > 0 && audioDuration > 0) {
        const totalFrames = videoDuration * videoFPS;
        const newFPS = totalFrames / audioDuration;
        elements.vFrames.innerText = Math.round(totalFrames);
        elements.targetFps.innerText = newFPS.toFixed(3) + ' FPS';
        elements.editorContainer.classList.remove('hidden');
        elements.exportBtn.disabled = false;
    }
}

elements.videoUploader.onchange = (e) => handleVideoFile(e.target.files[0]);
elements.audioUploader.onchange = (e) => handleAudioFile(e.target.files[0]);

elements.dropZoneVideo.onclick = () => elements.videoUploader.click();
elements.dropZoneAudio.onclick = () => elements.audioUploader.click();

elements.dropZoneVideo.ondragover = (e) => { e.preventDefault(); elements.dropZoneVideo.classList.add('dragover'); };
elements.dropZoneVideo.ondragleave = () => elements.dropZoneVideo.classList.remove('dragover');
elements.dropZoneVideo.ondrop = (e) => {
    e.preventDefault();
    elements.dropZoneVideo.classList.remove('dragover');
    handleVideoFile(e.dataTransfer.files[0]);
};

elements.dropZoneAudio.ondragover = (e) => { e.preventDefault(); elements.dropZoneAudio.classList.add('dragover'); };
elements.dropZoneAudio.ondragleave = () => elements.dropZoneAudio.classList.remove('dragover');
elements.dropZoneAudio.ondrop = (e) => {
    e.preventDefault();
    elements.dropZoneAudio.classList.remove('dragover');
    handleAudioFile(e.dataTransfer.files[0]);
};

elements.exportBtn.onclick = async () => {
    if (!videoFile || !audioFile || !isFFmpegLoaded) return;
    
    const lang = getCurrentLang();
    isProcessing = true; // Block FPS updates during encoding
    elements.exportBtn.disabled = true;
    elements.progressContainer.classList.remove('hidden');
    elements.downloadContainer.classList.add('hidden');

    ffmpeg.setProgress(({ ratio }) => {
        const p = Math.round(ratio * 100);
        elements.progressFill.style.width = `${p}%`;
        elements.progressPercent.innerText = `${p}%`;
    });

    try {
        const ptsRatio = audioDuration / videoDuration;
        
        ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(videoFile));
        ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audioFile));

        await ffmpeg.run(
            '-i', 'video.mp4',
            '-i', 'audio.mp3',
            '-filter_complex', `[0:v]setpts=${ptsRatio}*PTS[v]`,
            '-map', '[v]',
            '-map', '1:a',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            'output_synced.mp4'
        );

        const data = ffmpeg.FS('readFile', 'output_synced.mp4');
        const url = URL.createObjectURL(new Blob([data.buffer]));
        elements.downloadLink.href = url;
        elements.downloadLink.download = 'output_synced.mp4';
        elements.downloadContainer.classList.remove('hidden');
        elements.progressText.innerText = translations[lang].encoding_done;
        
    } catch (err) {
        console.error(err);
        elements.progressText.innerText = translations[lang].status_error + err.message;
    } finally {
        isProcessing = false;
        elements.exportBtn.disabled = false;
    }
};
