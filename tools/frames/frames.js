const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    uploader: document.getElementById('uploader'),
    editorContainer: document.getElementById('editor-container'),
    status: document.getElementById('status'),
    extractBtn: document.getElementById('extract-btn'),
    downloadAllBtn: document.getElementById('download-all-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    dropZone: document.getElementById('drop-zone'),
    framesContainer: document.getElementById('frames-container'),
    themeToggle: document.getElementById('theme-toggle'),
};

let videoFile = null;
let isFFmpegLoaded = false;
let extractedFrames = []; // Store blob data for zipping

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

async function handleFile(file) {
    if (!file) return;
    videoFile = file;
    elements.editorContainer.classList.remove('hidden');
    elements.dropZone.classList.add('hidden');
    elements.framesContainer.innerHTML = '';
    elements.downloadAllBtn.classList.add('hidden');
    extractedFrames = [];
}

elements.dropZone.onclick = () => elements.uploader.click();
elements.uploader.onchange = (e) => handleFile(e.target.files[0]);
elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
};

elements.extractBtn.onclick = async () => {
    if (!videoFile || !isFFmpegLoaded) return;
    
    const lang = getCurrentLang();
    elements.extractBtn.disabled = true;
    elements.downloadAllBtn.classList.add('hidden');
    elements.progressContainer.classList.remove('hidden');
    elements.framesContainer.innerHTML = '';
    extractedFrames = [];

    ffmpeg.setProgress(({ ratio }) => {
        const p = Math.round(ratio * 100);
        elements.progressFill.style.width = `${p}%`;
        elements.progressPercent.innerText = `${p}%`;
    });

    try {
        const inputName = 'input.mp4';
        ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
        
        await ffmpeg.run('-i', inputName, '-vsync', '0', '-an', 'out_%05d.png');
        
        const files = ffmpeg.FS('readdir', '/');
        const frameFiles = files.filter(f => f.startsWith('out_') && f.endsWith('.png')).sort();

        if (frameFiles.length === 0) {
            alert('No frames found.');
        }

        frameFiles.forEach((filename, index) => {
            const data = ffmpeg.FS('readFile', filename);
            const blob = new Blob([data.buffer], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            
            // Store for zip
            extractedFrames.push({ name: `frame_${index + 1}.png`, data: data.buffer });

            const frameItem = document.createElement('div');
            frameItem.className = 'frame-item';
            
            const img = document.createElement('img');
            img.src = url;
            
            const label = document.createElement('div');
            label.className = 'frame-label';
            label.innerText = `Frame ${index + 1}`;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn-mini';
            downloadBtn.innerText = '↓';
            downloadBtn.onclick = (e) => {
                e.stopPropagation();
                const a = document.createElement('a');
                a.href = url;
                a.download = `frame_${index + 1}.png`;
                a.click();
            };

            frameItem.appendChild(img);
            frameItem.appendChild(label);
            frameItem.appendChild(downloadBtn);
            elements.framesContainer.appendChild(frameItem);
            
            ffmpeg.FS('unlink', filename);
        });

        if (extractedFrames.length > 0) {
            elements.downloadAllBtn.classList.remove('hidden');
        }
        elements.progressText.innerText = translations[lang].encoding_done;
    } catch (err) {
        console.error(err);
        elements.progressText.innerText = translations[lang].status_error + err.message;
    } finally {
        elements.extractBtn.disabled = false;
    }
};

elements.downloadAllBtn.onclick = async () => {
    if (extractedFrames.length === 0) return;
    
    const lang = getCurrentLang();
    elements.downloadAllBtn.disabled = true;
    const originalText = elements.downloadAllBtn.innerText;
    elements.downloadAllBtn.innerText = translations[lang].progress_processing;

    const zip = new JSZip();
    extractedFrames.forEach(frame => {
        zip.file(frame.name, frame.data);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = "frames.zip";
    a.click();
    
    elements.downloadAllBtn.disabled = false;
    elements.downloadAllBtn.innerText = originalText;
};
