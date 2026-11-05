# 3D assets

`market/`는 Covered Korean Traditional Market 게임 자산입니다.
`npm run assets:market`으로 원본 SPZ·충돌 GLB·파노라마를 그대로 복사합니다.
원본 192만 스플랫을 유지하며 세 파일 모두 SHA-256이 원본과 같아야 합니다.
조작·자산 구조는 `docs/MARKET_GAME.md` 참고.

맵 파일은 형식과 용량을 확인한 뒤 이 폴더 또는 별도 파일 호스팅에 배치합니다.
Map_1, Map_2 원본과 기존 미리보기는 상위 프로젝트에 보존되어 있으며 자동 복사하지 않았습니다.
Marble 결과물은 GLB/OBJ/스플랫 등 실제 내보내기 형식 확인 후 전용 렌더러를 연결합니다.
