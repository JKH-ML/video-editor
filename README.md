# 🎬 insta-cut

**Fast, Private, and Browser-based MP4 Video Trimmer.**

[![GitHub license](https://img.shields.io/github/license/JKH-ML/insta-cut)](https://github.com/JKH-ML/insta-cut/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/JKH-ML/insta-cut)](https://github.com/JKH-ML/insta-cut/stargazers)

`insta-cut`은 서버 업로드 없이 브라우저에서 즉시 실행되는 고성능 MP4 편집 도구입니다. **FFmpeg.wasm**을 사용하여 모든 영상 처리가 사용자의 로컬 환경에서 이루어지므로, 데이터 유출 걱정 없이 안전하고 빠르게 영상을 자를 수 있습니다.

[**🚀 Live Demo 바로가기**](https://jkh-ml.github.io/insta-cut/){:target="_blank"}

또는 HTML 형식을 지원하는 경우:
<a href="https://jkh-ml.github.io/insta-cut/" target="_blank">**🚀 Live Demo 바로가기**</a>

---

## ✨ 주요 기능 (Key Features)

- **⚡ 서버리스 인코딩**: 영상 파일을 서버에 업로드하지 않습니다. 브라우저 내부에서 즉시 처리됩니다.
- **✂️ 초정밀 컷 편집**: 0.01초 단위의 미세 조절 및 프레임 단위 탐색이 가능합니다.
- **🖼️ 고화질 프레임 캡처**: 원하는 장면을 즉시 PNG 이미지로 추출합니다.
- **⌨️ 키보드 단축키 지원**: 방향키(←, →)와 Space바를 이용한 효율적인 타임라인 제어.
- **🎨 Modern UI/UX**: shadcn/ui 스타일의 미니멀하고 세련된 디자인.
- **🔒 개인정보 보호**: 모든 작업이 로컬에서 완료되므로 민감한 영상도 안심하고 편집하세요.

## 🛠️ 기술 스택 (Tech Stack)

- **Engine**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) (WebAssembly)
- **Frontend**: Vanilla HTML5, CSS3 (Modern Zinc Theme), JavaScript (ES6+)
- **SEO**: Meta Tags, robots.txt, sitemap.xml optimized
- **Deployment**: GitHub Pages (SharedArrayBuffer support via COI Service Worker)

## 📖 사용 방법 (Quick Start)

1. **파일 업로드**: MP4 파일을 드래그하거나 클릭하여 선택합니다.
2. **구간 설정**: 하단 슬라이더 또는 키보드 방향키를 이용해 시작/종료 지점을 잡습니다.
    - `← / →`: 0.05초 이동
    - `Shift + ← / →`: 0.01초 이동 (프레임 단위)
3. **캡처/저장**:
    - `현재 프레임 캡처`: 현재 장면을 PNG로 저장합니다.
    - `비디오 자르기 및 저장`: 설정한 구간을 잘라 새 파일로 다운로드합니다.

## 📄 라이선스 (License)

이 프로젝트는 MIT License를 따릅니다.

---

**Developed with ❤️ by [JKH-ML](https://github.com/JKH-ML)**
