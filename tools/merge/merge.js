const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const elements = {
    uploader:           document.getElementById('uploader'),
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
    fileList:           document.getElementById('file-list'),
    noFilesMsg:         document.getElementById('no-files-msg'),
    clearListBtn:       document.getElementById('clear-list-btn'),
    addMoreBtn:         document.getElementById('add-more-btn'),
    themeToggle:        document.getElementById('theme-toggle'),
    resultVideoPreview: document.getElementById('result-video-preview'),
};

let selectedFiles = [];
let draggedItemIndex = null;
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

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateFileListUI() {
    if (!elements.fileList) return;
    elements.fileList.innerHTML = '';

    if (selectedFiles.length === 0) {
        if (elements.noFilesMsg)      elements.noFilesMsg.classList.remove('hidden');
        if (elements.editorContainer) elements.editorContainer.classList.add('hidden');
        if (elements.dropZone)        elements.dropZone.classList.remove('hidden');
        return;
    }

    if (elements.noFilesMsg)      elements.noFilesMsg.classList.add('hidden');
    if (elements.editorContainer) elements.editorContainer.classList.remove('hidden');
    if (elements.dropZone)        elements.dropZone.classList.add('hidden');

    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.draggable = true;
        li.innerHTML = `
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatSize(file.size)}</span>
            </div>
            <div class="file-controls">
                <button class="control-btn" onclick="event.stopPropagation(); moveUp(${index})"   ${index === 0 ? 'disabled' : ''} title="Move Up">↑</button>
                <button class="control-btn" onclick="event.stopPropagation(); moveDown(${index})" ${index === selectedFiles.length - 1 ? 'disabled' : ''} title="Move Down">↓</button>
                <button class="remove-file" onclick="event.stopPropagation(); removeFile(${index})" title="Remove">×</button>
            </div>`;

        li.ondragstart = (e) => { draggedItemIndex = index; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; };
        li.ondragend   = ()  => { li.classList.remove('dragging'); draggedItemIndex = null; document.querySelectorAll('.file-item').forEach(i => i.style.borderTop = ''); };
        li.ondragover  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (draggedItemIndex !== null && draggedItemIndex !== index) li.style.borderTop = '2px solid var(--primary)'; };
        li.ondragleave = ()  => { li.style.borderTop = ''; };
        li.ondrop      = (e) => {
            e.preventDefault(); li.style.borderTop = '';
            if (draggedItemIndex !== null && draggedItemIndex !== index) {
                selectedFiles.splice(index, 0, selectedFiles.splice(draggedItemIndex, 1)[0]);
                updateFileListUI();
            }
        };

        elements.fileList.appendChild(li);
    });
}

window.removeFile = (i) => { selectedFiles.splice(i, 1); updateFileListUI(); };
window.moveUp    = (i) => { if (i === 0) return; [selectedFiles[i], selectedFiles[i-1]] = [selectedFiles[i-1], selectedFiles[i]]; updateFileListUI(); };
window.moveDown  = (i) => { if (i === selectedFiles.length - 1) return; [selectedFiles[i], selectedFiles[i+1]] = [selectedFiles[i+1], selectedFiles[i]]; updateFileListUI(); };

if (elements.clearListBtn) elements.clearListBtn.onclick = () => { selectedFiles = []; updateFileListUI(); };
if (elements.addMoreBtn)   elements.addMoreBtn.onclick   = () => elements.uploader.click();

function handleFiles(files) {
    if (!files || files.length === 0) return;
    for (const f of files) selectedFiles.push(f);
    updateFileListUI();
}

if (elements.uploader) elements.uploader.onchange = (e) => handleFiles(e.target.files);
if (elements.dropZone) {
    elements.dropZone.onclick     = () => elements.uploader.click();
    elements.dropZone.ondragover  = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop      = (e) => { e.preventDefault(); elements.dropZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); };
}

if (elements.exportBtn) {
    elements.exportBtn.onclick = async () => {
        const t = getT();
        if (selectedFiles.length < 2) { alert(t.no_files_msg || 'Please select at least 2 files.'); return; }
        if (!isFFmpegLoaded) return;

        elements.exportBtn.disabled = true;
        if (elements.progressContainer) elements.progressContainer.classList.remove('hidden');
        if (elements.downloadContainer) elements.downloadContainer.classList.add('hidden');

        ffmpeg.setProgress(({ ratio }) => {
            const p = Math.min(Math.round(ratio * 100), 99);
            if (elements.progressFill)    elements.progressFill.style.width = `${p}%`;
            if (elements.progressPercent) elements.progressPercent.innerText = `${p}%`;
        });

        const inputNames = [];
        try {
            let concatContent = '';
            for (let i = 0; i < selectedFiles.length; i++) {
                const name = `input${i}.mp4`;
                inputNames.push(name);
                ffmpeg.FS('writeFile', name, await fetchFile(selectedFiles[i]));
                concatContent += `file '${name}'\n`;
            }
            ffmpeg.FS('writeFile', 'concat.txt', concatContent);
            await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output_merged.mp4');

            const data = ffmpeg.FS('readFile', 'output_merged.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

            if (elements.downloadLink) {
                elements.downloadLink.href = url;
                elements.downloadLink.download = 'output_merged.mp4';
            }
            if (elements.resultVideoPreview) elements.resultVideoPreview.src = url;
            if (elements.downloadContainer) elements.downloadContainer.classList.remove('hidden');
            if (elements.progressFill)    elements.progressFill.style.width = '100%';
            if (elements.progressPercent) elements.progressPercent.innerText = '100%';
            if (elements.progressText)    elements.progressText.innerText = t.encoding_done || 'Done!';
        } catch (err) {
            if (elements.progressText) elements.progressText.innerText = (t.status_error || 'Error: ') + err.message;
            console.error(err);
        } finally {
            for (const name of inputNames) { try { ffmpeg.FS('unlink', name); } catch (_) {} }
            try { ffmpeg.FS('unlink', 'concat.txt'); } catch (_) {}
            try { ffmpeg.FS('unlink', 'output_merged.mp4'); } catch (_) {}
            elements.exportBtn.disabled = false;
        }
    };
}
