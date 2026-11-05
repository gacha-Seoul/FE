import type {
  ChatResponse,
  CreateUserRequest,
  DemoStartResponse,
  GachaResponse,
  HealthResponse,
  MapResponse,
  PhraseCard,
  RegionDetail,
  StageSummary,
  StartResponse,
  UserResponse,
} from './types'
import { ApiError } from './errors'
import { isMockMode, mockApi } from './mock'

export { ApiError }

/** 목 데이터 모드 (?mock 으로 켜기, ?mock=off 로 끄기) */
export const IS_MOCK = isMockMode()

/**
 * 기본은 같은 출처의 /api → vite dev 서버가 백엔드로 프록시 (vite.config.ts)
 * 배포 서버를 직접 부르려면 .env 에 VITE_API_BASE_URL=https://... 지정
 */
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해 주세요.')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new ApiError(res.status, data?.message ?? `요청 실패 (${res.status})`)
  return data as T
}

const get = <T>(path: string) => request<T>('GET', path)
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)

const realApi = {
  // 01. 사용자 · 지도 · 가챠
  createUser: (body: CreateUserRequest = {}) => post<UserResponse>('/api/users', body),
  getUser: (userId: number) => get<UserResponse>(`/api/users/${userId}`),
  getMap: (userId: number) => get<MapResponse>(`/api/users/${userId}/map`),
  /** requestId: 뽑기 버튼 1번당 UUID 1개. 통신 재시도에는 같은 값 */
  gacha: (userId: number, requestId: string) => post<GachaResponse>(`/api/users/${userId}/gacha`, { requestId }),

  // 02. 지역 상세
  getRegion: (regionId: number, userId: number) => get<RegionDetail>(`/api/regions/${regionId}?userId=${userId}`),

  // 03. 장소
  getStage: (stageId: number, userId: number) => get<StageSummary>(`/api/stages/${stageId}?userId=${userId}`),

  // 04. 퀘스트 · NPC 대화
  startQuest: (questId: number, userId: number) => post<StartResponse>(`/api/quests/${questId}/start`, { userId }),
  chat: (questId: number, userId: number, message: string) =>
    post<ChatResponse>(`/api/quests/${questId}/chat`, { userId, message }),
  phraseCard: (questId: number, userId: number) => post<PhraseCard>(`/api/quests/${questId}/phrase-card`, { userId }),

  // 05. 데모 · 서버 상태 (demo/reset 은 모든 기록 삭제라 일부러 넣지 않음)
  demoStart: (body: CreateUserRequest = {}) => post<DemoStartResponse>('/api/demo/start', body),
  health: () => get<HealthResponse>('/api/health'),
}

export const api: typeof realApi = IS_MOCK ? mockApi : realApi

/** crypto.randomUUID는 https/localhost에서만 있어서 IP로 접속할 때를 위한 대체 */
function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** 가챠 전용: 네트워크 오류(status 0)일 때만 같은 requestId로 재시도 */
export async function gachaWithRetry(userId: number, retries = 2): Promise<GachaResponse> {
  const requestId = uuid()
  for (let attempt = 0; ; attempt++) {
    try {
      return await api.gacha(userId, requestId)
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
}
