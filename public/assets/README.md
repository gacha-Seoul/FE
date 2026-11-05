# Figma 원본 에셋

원본: https://www.figma.com/design/DkGUSQuu3x644VG9qVmu4w?node-id=1-6

가챠 화면(68:137), 지역 팝업(141:1286), 완료 화면(164:4120)의 이미지와 SVG를 로컬에 저장했습니다. 글꼴은 기존 `public/fonts`의 한컴 훈민정음 H를 사용합니다.

- `figma-manifest.json`: 파일별 원본 노드, 원본 크기, SHA-256. 임시 다운로드 URL은 런타임에서 사용하지 않습니다.
- `machine/`: 기계의 유리·금속·손잡이 원본 레이어. `MachineArtwork.tsx`에서 조합하므로 캡슐이 반투명 유리 뒤로 보입니다.
- `machine.png`: Figma 그룹의 참고용 PNG 내보내기. 유리 영역이 불투명하게 합성되므로 실제 기계 렌더링에는 사용하지 않습니다.
- `popup-capsule.svg`: 결과 팝업의 캡슐 캐릭터.
- `complete-character.svg`, `complete-confetti.png`: 완료 화면의 갓 쓴 캐릭터와 좌우 축하 효과.

검증: `npm run assets`. 이미지 갱신 시 Figma MCP의 최신 원본을 다운로드한 뒤 manifest의 크기와 해시를 함께 갱신합니다.
