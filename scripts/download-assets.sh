#!/usr/bin/env bash
# Figma 에셋 다운로드 스크립트
# Figma MCP가 준 임시 URL이라 약 7일 뒤(2026-11-13쯤) 만료돼요. 그 전에 한 번 실행해서 public/assets에 저장해 두세요.
# 사용법: 프로젝트 루트에서  bash scripts/download-assets.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/assets"
mkdir -p "$DIR"
B="https://www.figma.com/api/mcp/asset"

dl() { # dl <파일명> <에셋ID+확장자>  (이미 받은 파일은 건너뜀)
  if [ -s "$DIR/$1" ]; then echo "= $1"; return; fi
  echo "↓ $1"
  curl -f -sS -L -o "$DIR/$1" "$B/$2"
}

# ── 메인 가챠 화면 (node 68:137) ──────────────────────────
dl machine.png            02144deb-cf80-464c-8409-e93c8502ce65.png   # 가챠 기계 (103:926)
dl capsule-27.svg         0affb703-8bdd-459a-9d96-5cac5448bd3c.svg
dl capsule-30.svg         498aa379-d14c-41c6-8757-71cfb1033484.svg
dl capsule-28.svg         9451fd5e-687a-415e-a789-15000c06c009.svg
dl capsule-35.svg         40f867da-3b6b-4a92-8a8f-3be0642f597d.svg
dl capsule-34.svg         1d5742b3-f0a9-4530-8f2e-3a5f1dddcb0b.svg
dl capsule-36.svg         38a5d9c7-4e02-476e-a452-8470ba2469d6.svg
dl capsule-38.svg         dd70c907-030e-4213-ac97-7358496eccda.svg
dl capsule-32.svg         19d23b60-a452-48dd-8398-4642ae12208d.svg
dl capsule-31.svg         c2cf9d70-e346-41f1-8e2a-4032cf139900.svg
dl machine-shadow.svg     c16429d6-a293-4266-bc03-b27756c067a0.svg   # Ellipse 35
dl cloud-11.svg           8f8be98b-d7e4-420d-84f3-b8e7c1d38700.svg
dl cloud-10.svg           3a8809d6-4531-4cea-b807-82943abc2aec.svg
dl cloud-13.svg           d87e1737-23b9-48ef-bb54-7f80be12e95f.svg
dl deco-left.png          c289985d-48e8-4f01-9f59-edc24952dd6f.png   # 141:1285 전통문양 좌측
dl deco-right.png         91628018-7780-4541-89e9-c2b25f6209a6.png   # 141:1284 전통문양 우측
dl gacha-button-bg.png    4b38bd30-470e-4bbc-8997-b3717a3fd61d.png   # 126:192 가챠 뽑기 버튼 배경
dl coin.png               35ceac25-563a-48a4-82a6-11c07e6ed0c0.png   # 103:995 엽전 아이콘
dl card-seodaemun.png     808ea85d-2b8d-46a4-9bf6-b35069d69d1b.png
dl card-dongdaemun.png    ab59692c-411e-47a7-8d2f-1d4a98bb3f4d.png
dl card-mapo.png          02be9159-782c-44ae-90a9-edc13fbfd061.png
dl card-jongno.png        9d62055a-2955-4d6a-bce5-34f6b3b1b61d.png
dl card-junggu.png        6cd759be-85ae-47c3-ae5f-043e37882f84.png
dl seoul-map.png          49e00d8d-e68d-47ca-af05-3f6914a657f7.png
dl map-pin.svg            00d9ac3c-47b7-4e8e-ade7-e727ff80ed0d.svg
dl character.svg          c0ee9960-2a3e-4991-8469-761f7b346349.svg   # 도깨비불 캐릭터 (126:677)

# ── 가챠 결과 팝업 (node 146:1688) ─────────────────────────
dl popup-bubble.svg       6fc9dd34-36fa-4af6-9e92-e16a44b81709.svg
dl popup-map-seodaemun.png 23ac34a2-9f5e-4686-b966-6c6e3e42794b.png
dl popup-pin.svg          9cc0dd7d-e5dc-4be9-8bf6-05d885e94e41.svg
dl popup-divider.svg      ff3e0bf5-c4a8-4ccb-af5b-136aa7fb0801.svg
dl popup-arrow.svg        cd6481fc-669d-464b-afd6-742ed86f2ba1.svg

# ── 로드맵 (최종 GUI 164:4693) ─────────────────────────────
dl roadmap-road.png        148760a1-a2a5-4dd4-baf8-dcaff933582b.png   # image 14 (길)
dl roadmap-places.png      8d6bb195-fe37-4751-b060-d625aff86672.png   # image 13 (장소 아이콘 스프라이트)
dl roadmap-lock.svg        01810d79-7f82-4626-9cfc-b9727ce1d22e.svg   # Group 62 (자물쇠)
# roadmap-map-seodaemun.webp 는 원본(4df4cfbb...png, 1024px)을 918px webp로 줄여서 저장소에 직접 넣음
dl roadmap-pin.svg         24ac7d9e-20be-4cbc-b0c0-964035d74c41.svg
dl roadmap-banner.png      5ae9cb24-6837-40ea-bec0-af51f37da4fd.png   # 164:4708 (@2x)
dl roadmap-back.png        41acbc71-245c-4fc2-9059-db46da6b5e7e.png   # 164:4798 "가챠 화면으로" (@2x)

echo "✅ 완료: $DIR"
