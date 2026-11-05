export interface Scenario {
  id: string
  title: string
  situation: string
  npcReply: string
  criteria: { id: string; text: string }[]
}
export interface ReviewSession {
  sessionId: string
  round: number
  totalRounds: number
  scenario: Scenario
}
export interface ReviewResult {
  round: number
  evaluation: {
    criteria: { id: string; met: boolean; evidence: string }[]
    feedback: string
    improvedAnswer: string
  }
  satisfactory: boolean
  reviewFinished: boolean
  next: ReviewSession | null
}

async function post<T>(path: string, body?: object): Promise<T> {
  const base = (import.meta.env.VITE_REVIEW_API_BASE_URL ?? '').replace(/\/$/, '')
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    throw new Error('복습 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? '복습 요청을 처리하지 못했어요.')
  if (!data) throw new Error('복습 응답을 읽지 못했어요.')
  return data as T
}

export const startReview = () => post<ReviewSession>('/api/review/sessions')
export const answerReview = (session: ReviewSession, message: string, requestId: string) =>
  post<ReviewResult>(`/api/review/sessions/${encodeURIComponent(session.sessionId)}/answers`, {
    round: session.round, message, requestId,
  })
