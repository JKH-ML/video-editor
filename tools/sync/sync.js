const { createFFmpeg, fetchFile } = FFmpeg;

let isProcessing  = false;
let videoFPS      = 30;

const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    logger: ({ message }) => {
        // FPS 감지 (처리 중이 아닐 때)
        if (!isProcessing) {
            const m = message.match(/(\d+(?:\.\d+)?)\s+fps/);
            if (m) videoFPS = parseFloat(m[1]);
        }
        // 인코딩 진행률 (처리 중일 때)
        if (isProcessing && message.includes('time=')) {
            const m = message.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
            if (m && audioDuration > 0) {
                const current = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]) + parseInt(m[4]) / 100;
                const p = Math.min(Math.round((current / audioDuration) * 100), 99);
                if (elements.progressFill)    elements.progressFill.style.width = `${p}%`;
                if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
            }
        }
    },
});

const elements = {
    videoUploader:      document.getElementById('video-uploader'),
    audioUploader:      document.getElementById('audio-uploader'),
    status:             document.getElementById('status'),
    exportBtn:          document.getElementById('export-btn'),
    progressContainer:  document.getElementById('progress-container'),
    progressFill:       document.getElementById('progress-fill'),
    progressText:       document.getElementById('progress-text'),
    progressPercent:    document.getElementById('progress-percent'),
    downloadContainer:  document.getElementById('download-container'),
    downloadLink:       document.getElementById('download-link'),
    dropZoneVideo:      document.getElementById('drop-zone-video'),
    dropZoneAudio:      document.getElementById('drop-zone-audio'),
    editorContainer:    document.getElementById('editor-container'),
    vDuration:          document.getElementById('v-duration'),
    vFrames:            document.getElementById('v-frames'),
    aDuration:          document.getElementById('a-duration'),
    targetSpeed:        document.getElementById('target-fps'),
    videoFileInfo:      document.getElementById('video-file-info'),
    audioFileInfo:      document.getElementById('audio-file-info'),
    themeToggle:        document.getElementById('theme-toggle'),
    resultVideoPreview: document.getElementById('result-video-preview'),
};

let videoFile      = null;
let audioFile      = null;
let videoDuration  = 0;
let audioDuration  = 0;
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

function updateSyncInfo() {
    if (videoDuration <= 0 || audioDuration <= 0) return;
    const totalFrames = Math.round(videoDuration * videoFPS);
    const ptsRatio    = audioDuration / videoDuration;
    if (elements.vFrames)     elements.vFrames.innerText     = totalFrames;
    if (elements.targetSpeed) elements.targetSpeed.innerText = `${ptsRatio.toFixed(3)}x`;
    if (elements.editorContainer) elements.editorContainer.classList.remove('hidden');
    if (elements.exportBtn)   elements.exportBtn.disabled    = false;
}

// video duration을 Promise로 얻는 헬퍼
function getVideoDuration(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => resolve(0);
        video.src = URL.createObjectURL(file);
    });
}

// audio duration을 Promise로 얻는 헬퍼
function getAudioDuration(file) {
    return new Promise((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0);
        audio.src = URL.createObjectURL(file);
    });
}

async function handleVideoFile(file) {
    if (!file) return;
    videoFile = file;
    videoFPS  = 30;

    // duration을 await로 확실하게 얻은 뒤 진행
    videoDuration = await getVideoDuration(file);
    if (elements.vDuration)    elements.vDuration.innerText   = videoDuration.toFixed(2) + 's';
    if (elements.videoFileInfo) elements.videoFileInfo.classList.remove('hidden');

    // FPS 파싱: ffmpeg 완료 후 videoFPS 확정
    isProcessing = false;
    try {
        ffmpeg.FS('writeFile', 'input_v.mp4', await fetchFile(file));
        await ffmpeg.run('-i', 'input_v.mp4');
    } catch (_) {}

    updateSyncInfo();
}

async function handleAudioFile(file) {
    if (!file) return;
    audioFile = file;

    audioDuration = await getAudioDuration(file);
    if (elements.aDuration)    elements.aDuration.innerText    = audioDuration.toFixed(2) + 's';
    if (elements.audioFileInfo) elements.audioFileInfo.classList.remove('hidden');

    updateSyncInfo();
}

if (elements.videoUploader) elements.videoUploader.onchange = (e) => handleVideoFile(e.target.files[0]);
if (elements.audioUploader) elements.audioUploader.onchange = (e) => handleAudioFile(e.target.files[0]);

if (elements.dropZoneVideo) {
    elements.dropZoneVideo.onclick     = () => elements.videoUploader.click();
    elements.dropZoneVideo.ondragover  = (e) => { e.preventDefault(); elements.dropZoneVideo.classList.add('dragover'); };
    elements.dropZoneVideo.ondragleave = () => elements.dropZoneVideo.classList.remove('dragover');
    elements.dropZoneVideo.ondrop      = (e) => { e.preventDefault(); elements.dropZoneVideo.classList.remove('dragover'); handleVideoFile(e.dataTransfer.files[0]); };
}

if (elements.dropZoneAudio) {
    elements.dropZoneAudio.onclick     = () => elements.audioUploader.click();
    elements.dropZoneAudio.ondragover  = (e) => { e.preventDefault(); elements.dropZoneAudio.classList.add('dragover'); };
    elements.dropZoneAudio.ondragleave = () => elements.dropZoneAudio.classList.remove('dragover');
    elements.dropZoneAudio.ondrop      = (e) => { e.preventDefault(); elements.dropZoneAudio.classList.remove('dragover'); handleAudioFile(e.dataTransfer.files[0]); };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        if (!videoFile || !audioFile || !isFFmpegLoaded) return;
        if (videoDuration <= 0 || audioDuration <= 0) return;

        const t = getT();
        isProcessing = true;
        elements.exportBtn.disabled = true;
        if (elements.progressContainer) elements.progressContainer.classList.remove('hidden');
        if (elements.downloadContainer) elements.downloadContainer.classList.add('hidden');
        if (elements.progressFill)    elements.progressFill.style.width = '0%';
        if (elements.progressPercent) elements.progressPercent.innerText = '0%';

        const ptsRatio    = audioDuration / videoDuration;
        const audioExt    = (audioFile.name.split('.').pop() || 'mp3').toLowerCase();
        const audioFsName = `input_a.${audioExt}`;

        try {
            // 매번 새로 써줌 — 이전 run 후 FS 상태 불확실하므로
            ffmpeg.FS('writeFile', 'input_v.mp4', await fetchFile(videoFile));
            ffmpeg.FS('writeFile', audioFsName, await fetchFile(audioFile));

            // 단일스레드 강제 + 속도조정 + 오디오 합치기 한번에
            await ffmpeg.run(
                '-i', 'input_v.mp4',
                '-i', audioFsName,
                '-vf', `setpts=${ptsRatio}*PTS`,
                '-map', '0:v',
                '-map', '1:a',
                '-c:v', 'libx264',
                '-x264opts', 'threads=1:no-sliced-threads=1',
                '-preset', 'ultrafast',
                '-crf', '28',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-t', audioDuration.toFixed(2),
                'output_synced.mp4'
            );

            const data = ffmpeg.FS('readFile', 'output_synced.mp4');
            const url  = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

            if (elements.downloadLink) {
                elements.downloadLink.href = url;
                elements.downloadLink.download = 'output_synced.mp4';
            }
            if (elements.resultVideoPreview) elements.resultVideoPreview.src = url;
            if (elements.downloadContainer) elements.downloadContainer.classList.remove('hidden');
            if (elements.progressFill)    elements.progressFill.style.width = '100%';
            if (elements.progressPercent) elements.progressPercent.innerText = '100%';
            if (elements.progressText)    elements.progressText.innerText = t.encoding_done || 'Done!';
        } catch (err) {
            const msg = (t.status_error || 'Error: ') + err.message;
            if (elements.progressText) elements.progressText.innerText = msg;
            console.error('[Sync Error]', err);
            alert(msg);
        } finally {
            try { ffmpeg.FS('unlink', 'input_v.mp4'); } catch (_) {}
            try { ffmpeg.FS('unlink', audioFsName); } catch (_) {}
            try { ffmpeg.FS('unlink', 'output_synced.mp4'); } catch (_) {}
            isProcessing = false;
            elements.exportBtn.disabled = false;
        }
    };
}
