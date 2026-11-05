#!/usr/bin/env bash
# 원본 에셋은 public/assets에 저장되어 있습니다. 만료되는 URL을 다시 사용하지 않습니다.
# 갱신 시 Figma MCP의 최신 원본을 curl -L로 저장하고 manifest도 갱신합니다.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/check-figma-assets.mjs
