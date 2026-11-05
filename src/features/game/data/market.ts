export const MARKET_ASSETS = {
  splat: '/models/market/market.spz?v=original-1920000',
  collider: '/models/market/collider.glb',
  panorama: '/models/market/panorama.png',
}

export const MARKET_SPLAT_COUNT = 1_920_000

export const MARKET_STOPS = [
  { code: 'Q01', name: '채소 좌판', title: '사진 속 전집 찾기', short: '길 묻기', x: 1, z: -4, color: '#f2bd69' },
  { code: 'Q02', name: '방앗간 옆 전집', title: '갓 부친 전, 한 입 먼저', short: '시식하기', x: 2.5, z: -10, color: '#f2bd69' },
  { code: 'Q03', name: '전집 계산대', title: '만 원인데, 가진 돈은 구천 원', short: '흥정하기', x: 2.5, z: -10, color: '#f2bd69' },
  { code: 'Q04', name: '시장 분식집', title: '친구가 부탁한 순대', short: '포장 주문', x: 3.5, z: -18, color: '#f2bd69' },
] as const

// Start beside the snack counter, with room to approach the first merchant.
export const MARKET_SPAWN = { x: -2, z: -1 }
export const MARKET_START_VIEW = { yaw: -Math.PI / 4, pitch: -0.06 }
export const MARKET_NPCS = [MARKET_STOPS[0], MARKET_STOPS[1], MARKET_STOPS[3]]
export function marketMapPoint(x: number, z: number) {
  return { x: Math.min(140, Math.max(10, 34 + x * 13)), y: Math.min(170, Math.max(10, 164 + z * 7)) }
}
