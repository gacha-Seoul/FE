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

/**
 * 결과 팝업 장소 카드 (Figma 146:1688 그대로). 카드 순서 = 서버 stages 순서(orderNo)
 * 디자인이 없는 지역은 서버 stage 데이터로 같은 모양의 카드를 만듦
 */
export const POPUP_PLACES: Record<string, { type: string; spots: string[] }[]> = {
  서대문구: [
    { type: '전통 시장', spots: ['영천시장', '포방터시장', '인왕시장', '백련시장'] },
    { type: '대학가', spots: ['신촌 연세로', '명물거리', '이대 앞 이화여대길'] },
    { type: '뷰티 스토어', spots: ['이대 앞 쇼핑거리', '신촌 명물거리', '홍제역 상권'] },
    { type: '느좋 카페', spots: ['연희동 카페거리', '홍제폭포 일대', '이대 앞 카페골목'] },
  ],
}

/** 최종 GUI에 적힌 분야 표기 (팝업·로드맵 "-예술-"). 디자인 없는 지역은 서버 categoryLabel 사용 */
export const DESIGN_CATEGORY: Record<string, string> = { 서대문구: '예술' }

/** "영천시장 · 전통시장 퀘스트" → { title: "전통시장", spot: "영천시장" } */
export function splitPlace(place: string): { title: string; spot: string | null } {
  const [spot, rest] = place.split('·').map((s) => s.trim())
  if (!rest) return { title: place, spot: null }
  return { title: rest.replace(/\s*퀘스트$/, ''), spot }
}

/** 팝업·로드맵에 쓰는 캐릭터 안내 문구 */
export function regionMessage(region: {
  name: string
  status: string
  stages: { orderNo: number; cleared: boolean; categoryLabel: string; place: string }[]
}): string {
  const stages = [...region.stages].sort((a, b) => a.orderNo - b.orderNo)
  const firstOpen = stages.find((s) => !s.cleared)
  if (region.status === 'CONQUERED' || !firstOpen) return `“${region.name}를 모두 정복했어! 다시 둘러봐도 좋아”`
  if (firstOpen === stages[0])
    return `“${region.name}의 ${firstOpen.categoryLabel} 퀘스트가 열렸어. 첫 장소를 확인해 봐”`
  return `“다음은 ${splitPlace(firstOpen.place).title}! 계속 가 보자”`
}
