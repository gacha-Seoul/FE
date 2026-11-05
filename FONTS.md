# 한컴 훈민정음 가로쓰기

`public/fonts/`에 다운로드한 원본 TTF와 전체 글리프를 유지한 웹용 WOFF2를 준비했습니다. Figma의 `Hancom Hoonminjeongeum_H`와 같은 패밀리 이름을 사용합니다.

웹앱의 HTML head에 다음을 추가하면 기본 본문과 입력 요소에 적용됩니다.

```html
<link rel="stylesheet" href="/fonts/fonts.css" />
```

개별 요소에는 `font-family: var(--font-hancom);`을 사용합니다. 제공된 파일은 Regular(400) 한 종류이며, 별도의 굵은 폰트 파일은 없습니다. WOFF2 우선, 원본 TTF 대체 순서로 불러옵니다. 폰트 적용 미리보기는 `/fonts/preview.html`입니다.

앱 전역 스타일에서 폰트 CSS를 불러오도록 연결했습니다. Regular(400)를 기본으로 사용하고 브라우저의 임의 굵기 합성은 끕니다.
