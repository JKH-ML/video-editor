# 🎬 insta-cut

**빠르고 안전한 브라우저 기반 MP4 비디오 트리머.**

> **무제한 무료 + 오픈소스**  
> **회원가입X · 광고X · 워터마크X · 데이터 수집X**

[English](README.md) | [한국어](README.ko.md) | [简体中文](README.zh.md) | [日本語](README.ja.md)

`insta-cut`은 서버 업로드 없이 브라우저에서 즉시 실행되는 고성능 MP4 편집 도구입니다. **FFmpeg.wasm**을 사용하여 모든 영상 처리가 사용자의 로컬 환경에서 이루어지므로, 데이터 유출 걱정 없이 안전하고 빠르게 영상을 자를 수 있습니다.

<div align="center">
  <a href="https://jkh-ml.github.io/insta-cut/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo%20바로가기-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo">
  </a>
</div>

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

## 🕒 버전 관리 (Version History)

### [v1.3.0] - 2026-03-25
- **🎞️ GIF 변환**: 비디오를 고품질 GIF 애니메이션으로 변환 기능 추가
- **🔄 회전 및 반전**: 영상 90도 회전 및 좌우 반전(Mirror) 기능 추가
- **⏩ 속도 조절**: 0.5x ~ 2.0x 재생 속도 조절 기능 (오디오 피치 자동 보정)
- **🔇 음소거 및 오디오 추출**: 음소거 저장 및 MP3 오디오 별도 추출 기능 추가
- **🌙 다크 모드**: 시력 보호를 위한 다크 테마 토글 및 설정 유지 기능 추가

### [v1.2.0] - 2026-03-25
- **🌐 다국어 지원**: 한국어, English, 中文, 日本語 선택 기능 추가 (i18n 적용)
- **🔍 SEO 최적화**: 언어별 메타 태그(Title, Description) 자동 전환 기능 추가
- **📂 파일명 통일**: 모든 다운로드 결과물 접두사를 `output_`으로 통일

### [v1.1.0] - 2026-03-25
- **✂️ 비디오 크롭(Crop)**: 영상 영역을 자유롭게 자를 수 있는 기능 추가
- **📐 크롭 프리셋**: 16:9, 9:16, 1:1 비율 즉시 설정 버튼 추가
- **🗺️ 네비게이션**: 트림(Trim)과 크롭(Crop) 페이지 간 이동 메뉴 추가

### [v1.0.0] - 2026-03-25
- **🚀 초기 출시**: FFmpeg.wasm 기반 서버리스 비디오 트리머 개발
- **✂️ 정밀 트림**: 0.01초 단위 구간 설정 및 내보내기 지원
- **🖼️ 프레임 캡처**: 현재 재생 중인 화면을 PNG로 저장 기능 지원
- **🎨 모던 UI**: 인터랙티브한 슬라이더 및 타임라인 디자인 적용

## 📄 라이선스 (License)

이 프로젝트는 MIT License를 따릅니다.

---

**Developed with ❤️ by [JKH-ML](https://github.com/JKH-ML)**
