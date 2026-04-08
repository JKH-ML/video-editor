const translations = {
    ko: {
        title: "비디오 에디터",
        home: "홈",
        repo: "GitHub 저장소",
        meta_title: "온라인 MP4 비디오 에디터 | 빠르고 안전한 브라우저 기반 편집기",
        meta_description: "브라우저에서 직접 MP4 비디오를 자르고 크롭하세요. 서버 업로드 없이 100% 프라이버시가 보장되는 FFmpeg 기반 편집기입니다.",
        trim: "트림",
        crop: "크롭",
        merge: "병합",
        sync: "싱크",
        frames: "프레임",
        status_init: "FFmpeg 엔진 로딩 중...",
        status_ready: "준비 완료: 파일을 선택하세요.",
        status_error: "엔진 로드 실패: ",
        upload_label: "클릭하거나 비디오를 드래그하세요",
        upload_label_crop: "크롭할 비디오를 클릭하거나 드래그하세요",
        upload_label_merge: "병합할 비디오 파일들을 선택하세요 (여러 개 가능)",
        upload_label_sync_video: "비디오 파일을 선택하세요",
        upload_label_sync_audio: "오디오 파일을 선택하세요",
        upload_label_frames: "프레임을 추출할 비디오를 선택하세요",
        trim_card_title: "트림",
        start_label: "시작 (초)",
        end_label: "종료 (초)",
        set_start: "시작 설정",
        set_end: "종료 설정",
        actions_title: "작업",
        capture_btn: "프레임 추출 (PNG)",
        export_trim_btn: "비디오 내보내기",
        progress_processing: "처리 중...",
        encoding_done: "인코딩 완료!",
        download_btn: "결과 다운로드",
        result_preview: "결과물 미리보기",
        crop_settings_title: "크롭 설정",
        x_offset: "X 오프셋",
        y_offset: "Y 오프셋",
        width_label: "너비",
        height_label: "높이",
        reset_btn: "전체 화면으로 초기화",
        export_crop_btn: "크롭된 비디오 내보내기",
        // Merge
        merge_list_title: "병합할 파일 목록",
        merge_btn: "비디오 병합하기",
        clear_list_btn: "목록 비우기",
        no_files_msg: "선택된 파일이 없습니다.",
        // Sync
        sync_settings_title: "싱크 설정",
        video_info_label: "비디오 정보",
        audio_info_label: "오디오 정보",
        sync_btn: "오디오 길이에 맞춰 비디오 속도 조정",
        // Frames
        frames_settings_title: "프레임 추출",
        extract_btn: "비디오의 모든 프레임 추출하기",
        download_all_btn: "모든 이미지 다운로드",
        extracted_frames_title: "추출된 프레임 목록",
        extracting_msg: "모든 프레임을 분석하여 추출 중입니다. 잠시만 기다려 주세요...",
        // New Features
        transform_title: "변형 및 속도",
        rotate_btn: "회전 (90°)",
        flip_btn: "좌우 반전",
        speed_label: "재생 속도",
        mute_label: "음소거",
        format_label: "내보내기 형식",
        audio_extract_btn: "오디오만 추출 (MP3)"
    },
    en: {
        title: "Video Editor",
        home: "Home",
        repo: "GitHub Repository",
        meta_title: "Online MP4 Video Editor | Fast & Private Browser-based Tool",
        meta_description: "Trim and crop MP4 videos directly in your browser. No uploads required, 100% private and fast using FFmpeg.wasm.",
        trim: "Trim",
        crop: "Crop",
        merge: "Merge",
        sync: "Sync",
        frames: "Frames",
        status_init: "FFmpeg initializing...",
        status_ready: "Ready: Select a file.",
        status_error: "Engine load failed: ",
        upload_label: "Click or drag to upload video",
        upload_label_crop: "Click or drag to upload video for cropping",
        upload_label_merge: "Select MP4 files to merge (Multiple allowed)",
        upload_label_sync_video: "Select Video File",
        upload_label_sync_audio: "Select Audio File",
        upload_label_frames: "Select Video to Extract Frames",
        trim_card_title: "Trim",
        start_label: "Start (s)",
        end_label: "End (s)",
        set_start: "Set Start",
        set_end: "Set End",
        actions_title: "Actions",
        capture_btn: "Capture Frame (PNG)",
        export_trim_btn: "Export Video",
        progress_processing: "Processing...",
        encoding_done: "Encoding complete!",
        download_btn: "Download Result",
        crop_settings_title: "Crop Settings",
        x_offset: "X Offset",
        y_offset: "Y Offset",
        width_label: "Width",
        height_label: "Height",
        reset_btn: "Reset to Full",
        export_crop_btn: "Export Cropped Video",
        // Merge
        merge_list_title: "Video List for Merging",
        merge_btn: "Merge Videos",
        clear_list_btn: "Clear List",
        no_files_msg: "No files selected.",
        // Sync
        sync_settings_title: "Sync Settings",
        video_info_label: "Video Info",
        audio_info_label: "Audio Info",
        sync_btn: "Sync Video Speed to Audio Length",
        // Frames
        frames_settings_title: "Frames Extraction Settings",
        fps_label: "Extraction Frequency (FPS)",
        fps_hint: "Frames to extract per second (e.g., 1 for one frame/sec)",
        extract_btn: "Extract All Frames",
        download_all_btn: "Download All Images",
        extracted_frames_title: "Extracted Frames",
        // New Features
        transform_title: "Transform & Speed",
        rotate_btn: "Rotate (90°)",
        flip_btn: "Flip Horizontal",
        speed_label: "Playback Speed",
        mute_label: "Mute Audio",
        format_label: "Export Format",
        audio_extract_btn: "Extract Audio (MP3)"
    },
    zh: {
        title: "视频编辑器",
        home: "首页",
        repo: "GitHub 仓库",
        meta_title: "在线 MP4 视频编辑器 | 快速、私密的浏览器端工具",
        meta_description: "在浏览器中直接裁剪和切边 MP4 视频。无需上传，基于 FFmpeg.wasm 的 100% 私密快捷工具。",
        trim: "裁剪",
        crop: "切边",
        merge: "合并",
        sync: "同步",
        frames: "帧提取",
        status_init: "FFmpeg 引擎加载中...",
        status_ready: "准备就绪：请选择文件。",
        status_error: "引擎加载失败：",
        upload_label: "点击或拖拽上传视频",
        upload_label_crop: "点击或拖拽上传视频进行切边",
        upload_label_merge: "选择要合并的 MP4 文件（允许多选）",
        upload_label_sync_video: "选择视频文件",
        upload_label_sync_audio: "选择音频文件",
        upload_label_frames: "选择要提取帧的视频",
        trim_card_title: "裁剪",
        start_label: "开始 (秒)",
        end_label: "结束 (秒)",
        set_start: "设置起点",
        set_end: "设置终点",
        actions_title: "操作",
        capture_btn: "截取帧 (PNG)",
        export_trim_btn: "导出视频",
        progress_processing: "处理中...",
        encoding_done: "编码完成！",
        download_btn: "下载结果",
        crop_settings_title: "切边设置",
        x_offset: "X 偏移",
        y_offset: "Y 偏移",
        width_label: "宽度",
        height_label: "高度",
        reset_btn: "重置为全屏",
        export_crop_btn: "导出切边视频",
        // Merge
        merge_list_title: "合并视频列表",
        merge_btn: "合并视频",
        clear_list_btn: "清除列表",
        no_files_msg: "未选择文件。",
        // Sync
        sync_settings_title: "同步设置",
        video_info_label: "视频信息",
        audio_info_label: "音频信息",
        sync_btn: "调整视频速度以匹配音频长度",
        // Frames
        frames_settings_title: "帧提取设置",
        fps_label: "提取频率 (FPS)",
        fps_hint: "每秒提取的帧数（例如：1 表示每秒提取一帧）",
        extract_btn: "提取所有帧",
        download_all_btn: "下载所有图片",
        extracted_frames_title: "已提取的帧",
        // New Features
        transform_title: "变换与速度",
        rotate_btn: "旋转 (90°)",
        flip_btn: "水平翻转",
        speed_label: "播放速度",
        mute_label: "静音",
        format_label: "导出格式",
        audio_extract_btn: "仅提取音频 (MP3)"
    },
    ja: {
        title: "ビデオエディター",
        home: "ホーム",
        repo: "GitHub リポジトリ",
        meta_title: "オンライン MP4 ビデオエ디터 | 高速・安全なブラウザベースの편집ツール",
        meta_description: "ブラウザ上で直接 MP4 비디오를 트리밍・크롭. 업로드 불필요로 100% 프라이버시가 보호되는 FFmpeg 베이스의 편집기.",
        trim: "トリミング",
        crop: "クロップ",
        merge: "結合",
        sync: "同期",
        frames: "フレーム抽出",
        status_init: "FFmpegエンジン를 로딩 중...",
        status_ready: "준비 완료: 파일을 선택하세요.",
        status_error: "엔진 로드 실패: ",
        upload_label: "클릭하거나 비디오를 드래그하세요",
        upload_label_crop: "클릭하거나 비디오를 드래그하여 크롭하세요",
        upload_label_merge: "결합할 MP4 파일을 선택하세요 (여러 개 가능)",
        upload_label_sync_video: "비디오 파일 선택",
        upload_label_sync_audio: "오디오 파일 선택",
        upload_label_frames: "프레임을 추출할 비디오를 선택하세요",
        trim_card_title: "トリミング",
        start_label: "시작 (초)",
        end_label: "종료 (초)",
        set_start: "시작 설정",
        set_end: "종료 설정",
        actions_title: "작업",
        capture_btn: "프레임 캡처 (PNG)",
        export_trim_btn: "비디오 내보내기",
        progress_processing: "처리 중...",
        encoding_done: "인코딩 완료!",
        download_btn: "결과 다운로드",
        result_preview: "결과물 미리보기",
        crop_settings_title: "크롭 설정",
        x_offset: "X 오프셋",
        y_offset: "Y 오프셋",
        width_label: "너비",
        height_label: "높이",
        reset_btn: "풀 사이즈로 리셋",
        export_crop_btn: "크롭된 비디오 내보내기",
        // Merge
        merge_list_title: "결합할 비디오 목록",
        merge_btn: "비디오 결합하기",
        clear_list_btn: "목록 비우기",
        no_files_msg: "파일이 선택되지 않았습니다.",
        // Sync
        sync_settings_title: "싱크 설정",
        video_info_label: "비디오 정보",
        audio_info_label: "오디오 정보",
        sync_btn: "오디오 길이에 맞춰 비디오 속도 조정",
        // Frames
        frames_settings_title: "프레임 추출",
        extract_btn: "비디오의 모든 프레임 추출하기",
        download_all_btn: "모든 이미지 다운로드",
        extracted_frames_title: "추출된 프레임 목록",
        extracting_msg: "모든 프레임을 분석하여 추출 중입니다. 잠시만 기다려 주세요...",
        // New Features
        transform_title: "변형 및 속도",
        rotate_btn: "회전 (90°)",
        flip_btn: "좌우 반전",
        speed_label: "재생 속도",
        mute_label: "뮤트",
        format_label: "내보내기 형식",
        audio_extract_btn: "오디오만 추출 (MP3)"
    }
};

function setLanguage(lang) {
    localStorage.setItem('preferred_lang', lang);
    applyTranslations(lang);
}

function applyTranslations(lang) {
    const t = translations[lang];
    
    document.title = t.meta_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t.meta_description);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerText = t[key];
        }
    });
    
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = lang;
}

function getCurrentLang() {
    return localStorage.getItem('preferred_lang') || 'ko';
}

window.getCurrentLang = getCurrentLang;
window.translations = translations;

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = getCurrentLang();
    applyTranslations(savedLang);
    
    const selector = document.getElementById('lang-selector');
    if (selector) {
        selector.value = savedLang;
        selector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            window.dispatchEvent(new CustomEvent('langChanged', { detail: e.target.value }));
        });
    }
});
