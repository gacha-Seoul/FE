/**
 * 디자인에 있는 고정 비주얼 데이터 (카드 이미지, 지도 핀 좌표)
 * 서버 데이터와는 지역 이름(name, 예: '서대문구')으로 매칭
 */
export type RegionCard = {
  name: string
  category: string // 디자인 카드에 적힌 분야
  cardImage: string
  /** 메인 지도(480.8 x 441) 안에서 핀의 left/top (Figma 값) */
  pin: { x: number; y: number }
}

export const REGION_CARDS: RegionCard[] = [
  { name: '서대문구', category: '문화', cardImage: '/assets/card-seodaemun.png', pin: { x: 158.4, y: 149 } },
  { name: '동대문구', category: '생활자원', cardImage: '/assets/card-dongdaemun.png', pin: { x: 291.4, y: 155 } },
  { name: '마포구', category: '예술', cardImage: '/assets/card-mapo.png', pin: { x: 130.4, y: 181 } },
  { name: '종로구', category: '관광', cardImage: '/assets/card-jongno.png', pin: { x: 220.4, y: 149 } },
  { name: '중구', category: '역사', cardImage: '/assets/card-junggu.png', pin: { x: 224.4, y: 187 } },
]

/** 결과 팝업 왼쪽 지도. 디자인이 있는 지역만, 나머지는 서울 전체 지도 */
export const POPUP_MAPS: Record<string, { image: string; pin: { x: number; y: number } }> = {
  서대문구: { image: '/assets/popup-map-seodaemun.png', pin: { x: 159, y: 133 } },
}
export const DEFAULT_POPUP_MAP = { image: '/assets/seoul-map.png', pin: null }

/** "영천시장 · 전통시장 퀘스트" → { title: "전통시장", spot: "영천시장" } */
export function splitPlace(place: string): { title: string; spot: string | null } {
  const [spot, rest] = place.split('·').map((s) => s.trim())
  if (!rest) return { title: place, spot: null }
  return { title: rest.replace(/\s*퀘스트$/, ''), spot }
}
