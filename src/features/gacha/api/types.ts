// 서울 가챠 API 명세서(2026-11-06 04:39 KST, /v3/api-docs 스냅샷) 기준 타입

export type RegionStatus = 'LOCKED' | 'UNLOCKED' | 'CONQUERED'
export type QuestStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'
export type Category = 'HISTORY' | 'CULTURE' | 'ART' | 'TOURISM' | 'LIVING'

export type CreateUserRequest = {
  nickname?: string
  language?: string
  level?: string
}

export type UserResponse = {
  id: number
  nickname: string
  language: string
  level: string
  coins: number
}

export type MissionStatus = { index: number; text: string; done: boolean }

export type QuestSummary = {
  id: number
  code: string // Q01~Q04
  title: string
  orderNo: number
  npcRole: string
  situation: string
  rewardCoin: number
  status: QuestStatus
  missions: MissionStatus[]
}

export type StageSummary = {
  id: number
  category: Category
  categoryLabel: string
  orderNo: number
  place: string
  introStory: string
  imageUrl: string | null
  cleared: boolean
  completedQuests: number
  totalQuests: number
  quests: QuestSummary[]
}

export type RegionDetail = {
  id: number
  code: string
  name: string
  nameEn: string
  description: string
  status: RegionStatus
  stages: StageSummary[]
}

export type GachaRequest = { requestId: string }
export type GachaResponse = { region: RegionDetail; coinsLeft: number; requestId: string }

export type MapRegion = {
  id: number
  code: string
  name: string
  nameEn: string
  status: RegionStatus
  playable: boolean
  clearedStages: number
  totalStages: number
}

export type MapResponse = {
  userId: number
  coins: number
  gachaCost: number
  conqueredCount: number
  regions: MapRegion[]
}

export type Suggestion = { korean: string; romanization: string | null; meaning: string | null }
export type Correction = { original: string; better: string; reason: string }

export type StartResponse = {
  npcReply: string
  suggestions: Suggestion[]
  missions: MissionStatus[]
  questId: number
  status: 'IN_PROGRESS' | 'COMPLETED'
  context: Record<string, unknown>
}

export type ChatRequest = { userId: number; message: string }

export type ChatResponse = {
  npcReply: string
  correction: Correction | null
  culturalTip: string | null
  suggestions: Suggestion[]
  missions: MissionStatus[]
  stageCleared: boolean
  regionConquered: boolean
  coinsEarned: number
  coins: number
  questId: number
  questCompleted: boolean
  context: Record<string, unknown>
}

export type Phrase = {
  korean: string
  romanization: string | null
  meaning: string | null
  whenToUse: string
}
export type PhraseCard = { title: string; phrases: Phrase[] }

export type DemoStartResponse = { user: UserResponse; gacha: GachaResponse }
export type HealthResponse = { status: 'UP'; llmMode: 'mock' | 'real' }
