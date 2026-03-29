const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ 
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    uploader: document.getElementById('uploader'),
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
    fileList: document.getElementById('file-list'),
    noFilesMsg: document.getElementById('no-files-msg'),
    clearListBtn: document.getElementById('clear-list-btn'),
    addMoreBtn: document.getElementById('add-more-btn'),
    themeToggle: document.getElementById('theme-toggle')
};

let selectedFiles = [];
let isFFmpegLoaded = false;

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

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateFileListUI() {
    elements.fileList.innerHTML = '';
    if (selectedFiles.length === 0) {
        elements.noFilesMsg.classList.remove('hidden');
        elements.editorContainer.classList.add('hidden');
        elements.dropZone.classList.remove('hidden');
    } else {
        elements.noFilesMsg.classList.add('hidden');
        elements.editorContainer.classList.remove('hidden');
        elements.dropZone.classList.add('hidden');
        
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatSize(file.size)}</span>
                </div>
                <div class="file-controls">
                    <button class="control-btn" onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">↑</button>
                    <button class="control-btn" onclick="moveDown(${index})" ${index === selectedFiles.length - 1 ? 'disabled' : ''} title="Move Down">↓</button>
                    <button class="remove-file" onclick="removeFile(${index})" title="Remove">×</button>
                </div>
            `;
            elements.fileList.appendChild(li);
        });
    }
}

window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    updateFileListUI();
};

window.moveUp = (index) => {
    if (index === 0) return;
    const temp = selectedFiles[index];
    selectedFiles[index] = selectedFiles[index - 1];
    selectedFiles[index - 1] = temp;
    updateFileListUI();
};

window.moveDown = (index) => {
    if (index === selectedFiles.length - 1) return;
    const temp = selectedFiles[index];
    selectedFiles[index] = selectedFiles[index + 1];
    selectedFiles[index + 1] = temp;
    updateFileListUI();
};

elements.clearListBtn.onclick = () => {
    selectedFiles = [];
    updateFileListUI();
};

elements.addMoreBtn.onclick = () => elements.uploader.click();

function handleFiles(files) {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
        selectedFiles.push(files[i]);
    }
    updateFileListUI();
}

elements.uploader.onchange = (e) => handleFiles(e.target.files);

elements.dropZone.onclick = () => elements.uploader.click();
elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
};

async function runFFmpegMerge() {
    if (selectedFiles.length < 2) {
        alert("Please select at least 2 files to merge.");
        return;
    }

    const lang = getCurrentLang();
    elements.exportBtn.disabled = true;
    elements.progressContainer.classList.remove('hidden');
    elements.downloadContainer.classList.add('hidden');

    ffmpeg.setProgress(({ ratio }) => {
        const p = Math.round(ratio * 100);
        elements.progressFill.style.width = `${p}%`;
        elements.progressPercent.innerText = `${p}%`;
    });

    try {
        const inputNames = [];
        let concatContent = "";

        for (let i = 0; i < selectedFiles.length; i++) {
            const name = `input${i}.mp4`;
            inputNames.push(name);
            ffmpeg.FS('writeFile', name, await fetchFile(selectedFiles[i]));
            concatContent += `file ${name}\n`;
        }

        ffmpeg.FS('writeFile', 'concat.txt', concatContent);

        // We use the concat demuxer for fastest merging without re-encoding
        // Note: This works best if all files have the same resolution/codec.
        // If they differ, a more complex filter_complex approach would be needed.
        await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output_merged.mp4');

        const data = ffmpeg.FS('readFile', 'output_merged.mp4');
        const url = URL.createObjectURL(new Blob([data.buffer]));
        elements.downloadLink.href = url;
        elements.downloadLink.download = 'output_merged.mp4';
        elements.downloadContainer.classList.remove('hidden');
        elements.progressText.innerText = translations[lang].encoding_done;

        // Cleanup FS
        inputNames.forEach(name => ffmpeg.FS('unlink', name));
        ffmpeg.FS('unlink', 'concat.txt');

    } catch (err) {
        console.error(err);
        elements.progressText.innerText = translations[lang].status_error + err.message;
    } finally {
        elements.exportBtn.disabled = false;
    }
}

elements.exportBtn.onclick = runFFmpegMerge;
