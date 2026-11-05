/**
 * 로드맵(2-1) 화면 고정 좌표 — Figma 최종 GUI 164:4693 (1280x832 프레임 기준)
 * 장소 아이콘은 스프라이트(roadmap-places.png)를 잘라서 씀: crop 값은 Figma 이미지 채우기 설정 그대로
 */
export type RoadmapSpot = {
  icon: { left: number; top: number; w: number; h: number }
  crop: { w: string; h: string; left: string; top: string }
  badge: { left: number; top: number }
  label: { left: number; top: number }
  lock: { left: number; top: number } | null
  /** 현재 진행 중일 때 캐릭터 위치 / 크기 배율 (디자인은 1번만 있어서 2~4번은 겹치지 않게 배치) */
  character: { left: number; top: number; scale: number }
}

export const ROADMAP_SPOTS: RoadmapSpot[] = [
  {
    icon: { left: 673, top: 641, w: 153, h: 105.312 },
    crop: { w: '948.05%', h: '895.28%', left: '-476.62%', top: '-625%' },
    badge: { left: 639, top: 620 },
    label: { left: 677, top: 747 },
    lock: null,
    character: { left: 655, top: 425, scale: 1 },
  },
  {
    icon: { left: 941, top: 451, w: 149, h: 135 },
    crop: { w: '973.5%', h: '698.4%', left: '-731.73%', top: '-398.76%' },
    badge: { left: 941, top: 436 },
    label: { left: 951, top: 590 },
    lock: { left: 996, top: 482 },
    character: { left: 745, top: 380, scale: 0.8 },
  },
  {
    icon: { left: 1015, top: 242, w: 149, h: 107 },
    crop: { w: '973.5%', h: '881.16%', left: '-786.01%', top: '-250.48%' },
    badge: { left: 1001, top: 213 },
    label: { left: 1029, top: 349 },
    lock: { left: 1076, top: 249 },
    character: { left: 860, top: 280, scale: 0.7 },
  },
  {
    icon: { left: 748, top: 158, w: 126, h: 100 },
    crop: { w: '1151.21%', h: '942.84%', left: '-731.14%', top: '-160.7%' },
    badge: { left: 711, top: 122 },
    label: { left: 746, top: 264 },
    lock: { left: 790, top: 164 },
    character: { left: 890, top: 80, scale: 0.7 },
  },
]

/** 로드맵 왼쪽 지역 지도 (459 x 482.1, 테두리 15.076). 디자인 있는 지역만, 나머지는 서울 전체 지도 */
export const ROADMAP_MAPS: Record<string, { image: string; pin: { x: number; y: number } | null }> = {
  서대문구: { image: '/assets/roadmap-map-seodaemun.webp', pin: { x: 181.79, y: 152.67 } },
}

/** 로드맵 장소 이름 (디자인 라벨). 디자인 없는 지역은 서버 stage 이름 사용 */
export const ROADMAP_LABELS: Record<string, string[]> = {
  서대문구: ['전통시장', '대학가', '뷰티 스토어', '느좋 카페'],
}
