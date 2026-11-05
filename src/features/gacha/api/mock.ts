/**
 * 목(mock) 백엔드. 서버 없이 화면 흐름을 확인하기 위한 가짜 API
 * - 켜기: 주소에 ?mock (브라우저에 기억됨) 또는 .env 에 VITE_API_MOCK=true
 * - 끄기: 주소에 ?mock=off
 * 응답 모양·오류 코드는 서울 가챠 API 명세(2026-11-06)와 같게 맞춤. 서대문구 전통시장 퀘스트 내용은 BE data.sql 기준
 */
import type {
  ChatResponse,
  CreateUserRequest,
  DemoStartResponse,
  GachaResponse,
  HealthResponse,
  MapRegion,
  MapResponse,
  MissionStatus,
  PhraseCard,
  QuestStatus,
  QuestSummary,
  RegionDetail,
  StageSummary,
  StartResponse,
  Suggestion,
  UserResponse,
} from './types'
import { ApiError } from './errors'

/* ───────────── 설정 ───────────── */
const INITIAL_COINS = 10
const GACHA_COST = 1
const CONQUER_BONUS = 2
const FIRST_REGION = 'SEODAEMUN'
const STORE_KEY = 'gacha-seoul:mock-db'

/* ───────────── 콘텐츠 ───────────── */
type QuestDef = {
  id: number
  code: string
  title: string
  npcRole: string
  situation: string
  missions: string[]
  opening: string
  suggestions: string[]
  /** 미션을 하나 달성할 때마다 순서대로 쓰는 NPC 대사 (마지막이 완료 대사) */
  replies: string[]
  tip?: string
}
type StageDef = {
  id: number
  category: StageSummary['category']
  categoryLabel: string
  place: string
  introStory: string
  quests: QuestDef[]
}
type RegionDef = { id: number; code: string; name: string; nameEn: string; description: string; stages: StageDef[] }

const q = (d: QuestDef) => d

const REGIONS: RegionDef[] = [
  {
    id: 13,
    code: 'SEODAEMUN',
    name: '서대문구',
    nameEn: 'Seodaemun-gu',
    description: '독립문과 서대문형무소역사관, 신촌·이대 거리, 연희동, 홍제천이 있는 동네.',
    stages: [
      {
        id: 5,
        category: 'CULTURE',
        categoryLabel: '문화',
        place: '영천시장 · 전통시장 퀘스트',
        introStory:
          '친구랑 먹을 간식을 사러 왔어요. 사진 속 전집을 찾아 전을 맛보고, 두 팩을 9천 원에 살 수 있는지 물어봐요. 돌아오는 길엔 간을 뺀 순대 한 팩도 포장해요. 친구는 시장 입구에서 기다리고 있어요.',
        quests: [
          q({
            id: 501,
            code: 'Q01',
            title: '사진 속 전집 찾기',
            npcRole: '시장 입구 채소 좌판 상인',
            situation: '시장 입구에서 사진 속 전집 위치를 묻는다.',
            missions: ['전집 위치 묻기', '전집 도착하기'],
            opening: '뭐 찾으세요?',
            suggestions: ['전집이 어디예요?', '사진 속 가게를 찾고 있어요'],
            replies: [
              '아, 그 전집! 저기 빨간 천막 지나서 방앗간 옆이에요. 고소한 냄새 나면 거기예요.',
              '맞아요, 거기예요! 맛있게 드세요~',
            ],
          }),
          q({
            id: 502,
            code: 'Q02',
            title: '갓 부친 전, 한 입 먼저',
            npcRole: '전집 상인',
            situation: '전집 진열대에서 호박전을 추천하고 한 조각 시식을 권한다.',
            missions: ['호박전 시식 수락하기'],
            opening: '호박전이에요. 방금 부쳤어요. 여기 잘라 놓은 거 드셔 보세요.',
            suggestions: ['먹어봐도 돼요?', '네, 먹어볼게요'],
            replies: ['그럼요, 드셔 보세요. 어때요, 고소하죠?'],
            tip: '시장에서는 시식을 권하면 사양하지 않고 맛보는 게 자연스러워요.',
          }),
          q({
            id: 503,
            code: 'Q03',
            title: '만 원인데, 가진 돈은 구천 원',
            npcRole: '전집 상인',
            situation: '호박전 두 팩은 10,000원. 예산은 9,000원. 흥정해서 9,000원에 산다.',
            missions: ['호박전 두 팩 선택하기', '가격 흥정하기', '9,000원 구매 확정하기'],
            opening: '두 팩에 만 원이에요.',
            suggestions: ['조금 깎아 주세요', '구천 원에 될까요?'],
            replies: [
              '두 팩이요? 네, 호박전 두 팩이요.',
              '아이고, 학생이네~ 그럼 구천 원에 해 줄게요.',
              '네, 구천 원! 하나씩 따로 담아 줄게요. 순대는 입구 쪽 분식집 가 봐요.',
            ],
            tip: '전통시장에서는 "조금 깎아 주세요"처럼 가볍게 흥정하는 문화가 있어요.',
          }),
          q({
            id: 504,
            code: 'Q04',
            title: '친구가 부탁한 순대',
            npcRole: '시장 입구 분식집 상인',
            situation: '순대 한 팩, 간 제외, 포장을 모두 확인한다.',
            missions: ['순대 한 팩 주문하기', '간 빼 달라고 하기', '포장 주문 확정하기'],
            opening: '간도 넣어드려요?',
            suggestions: ['순대 한 팩 주세요', '간은 빼 주세요', '포장해 주세요'],
            replies: ['순대 한 팩이요~', '간은 빼고요, 알겠어요.', '포장 다 됐어요! 친구분 기다리겠다, 얼른 가 봐요.'],
          }),
        ],
      },
      {
        id: 2,
        category: 'CULTURE',
        categoryLabel: '문화',
        place: '신촌 · 이대 거리 카페',
        introStory: '대학가 카페에서 음료를 주문한다. 직원이 온도, 사이즈, 매장/포장, 결제를 차례로 묻는다.',
        quests: [
          q({
            id: 2,
            code: 'Q01',
            title: '신촌 카페에서 주문하기',
            npcRole: '카페 아르바이트생',
            situation: '음료를 주문하고 온도, 매장/포장, 결제를 말한다.',
            missions: ['음료 주문하기', '아이스/따뜻한 것 말하기', '매장 또는 포장 말하기', '결제 방법 말하기'],
            opening: '어서 오세요! 주문 도와드릴까요?',
            suggestions: ['아메리카노 주세요', '아이스로 주세요', '여기서 먹을게요', '카드로 할게요'],
            replies: [
              '아메리카노요! 아이스로 드릴까요?',
              '네~ 드시고 가세요?',
              '결제는 어떻게 하시겠어요?',
              '감사합니다! 진동벨 울리면 오세요.',
            ],
          }),
        ],
      },
    ],
  },
  {
    id: 1,
    code: 'JONGNO',
    name: '종로구',
    nameEn: 'Jongno-gu',
    description: '경복궁과 광화문, 인사동, 광장시장이 있는 서울 역사 문화의 중심.',
    stages: [
      {
        id: 9,
        category: 'TOURISM',
        categoryLabel: '관광',
        place: '광화문 한복 대여점',
        introStory: '광화문 근처 한복 대여점에서 한복을 고르고 대여 시간과 가격을 정한다.',
        quests: [
          q({
            id: 9,
            code: 'Q01',
            title: '한복 빌리기',
            npcRole: '한복 대여점 직원',
            situation: '한복을 고르고 대여 시간과 가격을 정한다.',
            missions: ['인사하기', '원하는 한복 색 말하기', '대여 시간 정하기'],
            opening: '안녕하세요! 한복 대여하러 오셨어요? 원하는 색 있으세요?',
            suggestions: ['안녕하세요', '빨간색 한복 있어요?', '두 시간 빌리고 싶어요'],
            replies: [
              '어서 오세요~',
              '빨간색 예쁜 거 있어요! 입어 보세요.',
              '두 시간에 이만 원이에요. 경복궁 무료 입장도 돼요!',
            ],
            tip: '한복을 입으면 경복궁 등 고궁에 무료로 들어갈 수 있어요.',
          }),
        ],
      },
    ],
  },
  {
    id: 14,
    code: 'MAPO',
    name: '마포구',
    nameEn: 'Mapo-gu',
    description: '홍대, 망원동, 연남동의 예술과 골목 문화.',
    stages: [
      {
        id: 101,
        category: 'ART',
        categoryLabel: '예술',
        place: '연남동 독립 서점',
        introStory: '연남동 작은 서점에서 추천 책을 묻고 엽서를 산다. (목 데이터)',
        quests: [
          q({
            id: 1011,
            code: 'Q01',
            title: '서점에서 책 추천받기',
            npcRole: '서점 주인',
            situation: '추천 책을 묻고 계산한다.',
            missions: ['책 추천 부탁하기', '계산하기'],
            opening: '천천히 구경하세요~',
            suggestions: ['책 추천해 주세요', '이거 얼마예요?'],
            replies: ['이 시집 요즘 인기 많아요.', '만 이천 원이에요. 책갈피 하나 드릴게요!'],
          }),
        ],
      },
    ],
  },
  {
    id: 6,
    code: 'DONGDAEMUN',
    name: '동대문구',
    nameEn: 'Dongdaemun-gu',
    description: '경동시장과 약령시가 있는 동네.',
    stages: [
      {
        id: 102,
        category: 'LIVING',
        categoryLabel: '생활자원',
        place: '경동시장 약초 골목',
        introStory: '약초 가게에서 차로 마실 약재를 묻고 산다. (목 데이터)',
        quests: [
          q({
            id: 1021,
            code: 'Q01',
            title: '약초 차 고르기',
            npcRole: '약초 가게 사장님',
            situation: '차로 마실 약재를 추천받는다.',
            missions: ['차 추천 부탁하기', '양 말하기'],
            opening: '뭐 찾으러 왔어요?',
            suggestions: ['차 추천해 주세요', '조금만 주세요'],
            replies: ['감기엔 생강, 피곤하면 대추가 좋아요.', '한 봉지 담아 줄게요~'],
          }),
        ],
      },
    ],
  },
  {
    id: 2,
    code: 'JUNG',
    name: '중구',
    nameEn: 'Jung-gu',
    description: '덕수궁과 명동, 남산이 있는 서울의 중심.',
    stages: [
      {
        id: 103,
        category: 'HISTORY',
        categoryLabel: '역사',
        place: '덕수궁 돌담길',
        introStory: '덕수궁 매표소에서 표를 사고 수문장 교대식 시간을 묻는다. (목 데이터)',
        quests: [
          q({
            id: 1031,
            code: 'Q01',
            title: '덕수궁 입장하기',
            npcRole: '매표소 직원',
            situation: '입장권을 사고 교대식 시간을 묻는다.',
            missions: ['입장권 사기', '교대식 시간 묻기'],
            opening: '안녕하세요, 덕수궁입니다.',
            suggestions: ['표 한 장 주세요', '수문장 교대식 언제예요?'],
            replies: ['천 원입니다.', '11시, 2시, 3시 반에 해요!'],
          }),
        ],
      },
    ],
  },
]

/* ───────────── 저장소 ───────────── */
type Progress = { status: 'IN_PROGRESS' | 'COMPLETED'; done: boolean[]; log: string[] }
type MockUser = UserResponse & {
  unlocked: number[]
  quests: Record<number, Progress>
  gachaRequests: Record<string, { regionId: number; coinsLeft: number }>
}
type Db = { nextId: number; users: Record<number, MockUser> }

const load = (): Db => {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* noop */
  }
  return { nextId: 1, users: {} }
}
const db = load()
const save = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db))
  } catch {
    /* noop */
  }
}

const delay = <T>(v: () => T, ms = 250 + Math.random() * 350) =>
  new Promise<T>((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(v())
        save()
      } catch (e) {
        reject(e)
      }
    }, ms),
  )

const getUser = (id: number) => {
  const u = db.users[id]
  if (!u) throw new ApiError(404, '사용자를 찾을 수 없어요.')
  return u
}
const allStages = () => REGIONS.flatMap((r) => r.stages.map((s) => ({ region: r, stage: s })))
const findQuest = (questId: number) => {
  for (const { region, stage } of allStages()) {
    const quest = stage.quests.find((x) => x.id === questId)
    if (quest) return { region, stage, quest }
  }
  throw new ApiError(404, '퀘스트를 찾을 수 없어요.')
}
const userView = (u: MockUser): UserResponse => ({
  id: u.id,
  nickname: u.nickname,
  language: u.language,
  level: u.level,
  coins: u.coins,
})

/* ───────────── 상태 계산 ───────────── */
const questStatus = (u: MockUser, stage: StageDef, idx: number, unlocked: boolean): QuestStatus => {
  const p = u.quests[stage.quests[idx].id]
  if (p?.status === 'COMPLETED') return 'COMPLETED'
  if (!unlocked) return 'LOCKED'
  const prevDone = stage.quests.slice(0, idx).every((x) => u.quests[x.id]?.status === 'COMPLETED')
  if (!prevDone) return 'LOCKED'
  return p ? 'IN_PROGRESS' : 'AVAILABLE'
}
const missionsOf = (def: QuestDef, p?: Progress): MissionStatus[] =>
  def.missions.map((text, index) => ({ index, text, done: p?.status === 'COMPLETED' || !!p?.done[index] }))

const stageView = (u: MockUser, region: RegionDef, stage: StageDef, orderNo: number): StageSummary => {
  const unlocked = u.unlocked.includes(region.id)
  const quests: QuestSummary[] = stage.quests.map((def, i) => ({
    id: def.id,
    code: def.code,
    title: def.title,
    orderNo: i + 1,
    npcRole: def.npcRole,
    situation: def.situation,
    rewardCoin: 1,
    status: questStatus(u, stage, i, unlocked),
    missions: missionsOf(def, u.quests[def.id]),
  }))
  const completed = quests.filter((x) => x.status === 'COMPLETED').length
  return {
    id: stage.id,
    category: stage.category,
    categoryLabel: stage.categoryLabel,
    orderNo,
    place: stage.place,
    introStory: stage.introStory,
    imageUrl: null,
    cleared: completed === quests.length,
    completedQuests: completed,
    totalQuests: quests.length,
    quests,
  }
}
const regionStatus = (u: MockUser, r: RegionDef): MapRegion['status'] => {
  if (!u.unlocked.includes(r.id)) return 'LOCKED'
  const cleared = r.stages.every((s) => s.quests.every((x) => u.quests[x.id]?.status === 'COMPLETED'))
  return cleared ? 'CONQUERED' : 'UNLOCKED'
}
const regionView = (u: MockUser, r: RegionDef): RegionDetail => ({
  id: r.id,
  code: r.code,
  name: r.name,
  nameEn: r.nameEn,
  description: r.description,
  status: regionStatus(u, r),
  stages: r.stages.map((s, i) => stageView(u, r, s, i + 1)),
})

/* ───────────── 대화 판정 (아주 단순한 규칙) ───────────── */
const POLITE = /(요|요\?|니다|니까\?|세요|해요|주세요)[.!?~]*$/
const politeForm = (msg: string) => {
  const base = msg.trim().replace(/[.!?~]+$/, '')
  if (/줘$/.test(base)) return `${base.slice(0, -1)}주세요`
  const last = base.charCodeAt(base.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return `${base}요`
  return (last - 0xac00) % 28 === 0 ? `${base}예요?` : `${base}이에요?` // 받침 없으면 -예요, 있으면 -이에요
}
const correct = (msg: string) =>
  POLITE.test(msg.trim())
    ? null
    : {
        original: msg,
        better: politeForm(msg),
        reason: '가게 주인에게는 끝에 "-요"를 붙여 존댓말로 말하면 더 자연스러워요.',
      }
const suggestionsFor = (def: QuestDef, p: Progress): Suggestion[] => {
  const next = p.done.findIndex((d) => !d)
  const list = next < 0 ? def.suggestions : def.suggestions.slice(Math.min(next, def.suggestions.length - 1))
  return list.slice(0, 3).map((korean) => ({ korean, romanization: null, meaning: null }))
}

/* ───────────── API ───────────── */
export const mockApi = {
  createUser: (body: CreateUserRequest = {}) =>
    delay(() => {
      const id = db.nextId++
      db.users[id] = {
        id,
        nickname: body.nickname ?? 'Traveler',
        language: body.language ?? 'English',
        level: body.level ?? 'BEGINNER',
        coins: INITIAL_COINS,
        unlocked: [],
        quests: {},
        gachaRequests: {},
      }
      return userView(db.users[id])
    }),

  getUser: (userId: number) => delay(() => userView(getUser(userId))),

  getMap: (userId: number) =>
    delay((): MapResponse => {
      const u = getUser(userId)
      return {
        userId,
        coins: u.coins,
        gachaCost: GACHA_COST,
        conqueredCount: REGIONS.filter((r) => regionStatus(u, r) === 'CONQUERED').length,
        regions: REGIONS.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          nameEn: r.nameEn,
          status: regionStatus(u, r),
          playable: true,
          clearedStages: r.stages.filter((s) => s.quests.every((x) => u.quests[x.id]?.status === 'COMPLETED')).length,
          totalStages: r.stages.length,
        })),
      }
    }),

  gacha: (userId: number, requestId: string) =>
    delay((): GachaResponse => {
      const u = getUser(userId)
      if (!requestId) throw new ApiError(400, 'requestId가 필요해요.')
      const prev = u.gachaRequests[requestId]
      if (prev) {
        const r = REGIONS.find((x) => x.id === prev.regionId)!
        return { region: regionView(u, r), coinsLeft: prev.coinsLeft, requestId }
      }
      if (u.coins < GACHA_COST) throw new ApiError(400, '코인이 부족해요.')
      const candidates = REGIONS.filter((r) => !u.unlocked.includes(r.id))
      if (candidates.length === 0) throw new ApiError(400, '뽑을 수 있는 지역을 모두 열었어요.')
      const pick =
        (u.unlocked.length === 0 && candidates.find((r) => r.code === FIRST_REGION)) ||
        candidates[Math.floor(Math.random() * candidates.length)]
      u.coins -= GACHA_COST
      u.unlocked.push(pick.id)
      u.gachaRequests[requestId] = { regionId: pick.id, coinsLeft: u.coins }
      return { region: regionView(u, pick), coinsLeft: u.coins, requestId }
    }, 900),

  getRegion: (regionId: number, userId: number) =>
    delay(() => {
      const u = getUser(userId)
      const r = REGIONS.find((x) => x.id === regionId)
      if (!r) throw new ApiError(404, '지역을 찾을 수 없어요.')
      return regionView(u, r)
    }),

  getStage: (stageId: number, userId: number) =>
    delay(() => {
      const u = getUser(userId)
      const found = allStages().find((x) => x.stage.id === stageId)
      if (!found) throw new ApiError(404, '장소를 찾을 수 없어요.')
      return stageView(u, found.region, found.stage, found.region.stages.indexOf(found.stage) + 1)
    }),

  startQuest: (questId: number, userId: number) =>
    delay((): StartResponse => {
      const u = getUser(userId)
      const { region, stage, quest } = findQuest(questId)
      if (!u.unlocked.includes(region.id)) throw new ApiError(403, '아직 해금되지 않은 지역이에요.')
      const idx = stage.quests.indexOf(quest)
      if (questStatus(u, stage, idx, true) === 'LOCKED') throw new ApiError(409, '이전 퀘스트를 먼저 완료해 주세요.')
      const done = u.quests[questId]?.status === 'COMPLETED'
      if (!done) u.quests[questId] = { status: 'IN_PROGRESS', done: quest.missions.map(() => false), log: [] }
      const p = u.quests[questId]
      return {
        npcReply: quest.opening,
        suggestions: quest.suggestions.map((korean) => ({ korean, romanization: null, meaning: null })),
        missions: missionsOf(quest, p),
        questId,
        status: p.status,
        context: {},
      }
    }),

  chat: (questId: number, userId: number, message: string) =>
    delay((): ChatResponse => {
      const u = getUser(userId)
      const { region, stage, quest } = findQuest(questId)
      const msg = message.trim()
      if (!msg || msg.length > 300) throw new ApiError(400, '메시지는 1~300자로 보내 주세요.')
      const p = u.quests[questId]
      if (!p) throw new ApiError(409, '퀘스트를 먼저 시작해 주세요.')
      if (p.status === 'COMPLETED') throw new ApiError(409, '이미 완료한 퀘스트예요.')

      p.log.push(msg)
      const next = p.done.findIndex((d) => !d)
      p.done[next] = true
      const completed = p.done.every(Boolean)
      let coinsEarned = 0
      let stageCleared = false
      let regionConquered = false
      if (completed) {
        p.status = 'COMPLETED'
        coinsEarned += 1
        stageCleared = stage.quests.every((x) => u.quests[x.id]?.status === 'COMPLETED')
        regionConquered = stageCleared && regionStatus(u, region) === 'CONQUERED'
        if (regionConquered) coinsEarned += CONQUER_BONUS
        u.coins += coinsEarned
      }
      return {
        npcReply: quest.replies[Math.min(next, quest.replies.length - 1)],
        correction: correct(msg),
        culturalTip: p.log.length === 1 ? (quest.tip ?? null) : null,
        suggestions: completed ? [] : suggestionsFor(quest, p),
        missions: missionsOf(quest, p),
        stageCleared,
        regionConquered,
        coinsEarned,
        coins: u.coins,
        questId,
        questCompleted: completed,
        context: {},
      }
    }, 700),

  phraseCard: (questId: number, userId: number) =>
    delay((): PhraseCard => {
      const u = getUser(userId)
      const { quest } = findQuest(questId)
      const p = u.quests[questId]
      if (!p) throw new ApiError(409, '퀘스트를 먼저 시작해 주세요.')
      const phrases = [...new Set([...p.log.map((m) => correct(m)?.better ?? m), ...quest.suggestions])]
        .slice(0, 5)
        .map((korean) => ({
          korean,
          romanization: null,
          meaning: null,
          whenToUse: `${quest.npcRole}와(과) 대화할 때`,
        }))
      return { title: `${quest.title} · 표현 복습`, phrases }
    }, 800),

  demoStart: (body: CreateUserRequest = {}) =>
    mockApi.createUser(body).then(async (user): Promise<DemoStartResponse> => {
      const gacha = await mockApi.gacha(user.id, `demo-${user.id}`)
      return { user: { ...user, coins: gacha.coinsLeft }, gacha }
    }),

  health: () => delay((): HealthResponse => ({ status: 'UP', llmMode: 'mock' })),
}

/** 목 모드 여부. ?mock 로 켜고 ?mock=off 로 끔 (localStorage에 기억) */
export function isMockMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mock') === 'off') localStorage.removeItem('gacha-seoul:mock-on')
    else if (params.has('mock')) localStorage.setItem('gacha-seoul:mock-on', '1')
    return import.meta.env.VITE_API_MOCK === 'true' || localStorage.getItem('gacha-seoul:mock-on') === '1'
  } catch {
    return import.meta.env.VITE_API_MOCK === 'true'
  }
}
