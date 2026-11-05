import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import type { ChatResponse, Correction, MissionStatus, QuestSummary, Suggestion } from '../api/types'

type Line =
  | { who: 'npc'; text: string }
  | { who: 'me'; text: string; correction?: Correction | null }
  | { who: 'tip'; text: string }

type Props = {
  userId: number
  quest: QuestSummary
  /** 같은 장소의 다음 퀘스트 (없으면 null) */
  nextQuest: QuestSummary | null
  onCoins: (coins: number) => void
  onReward: (coinsEarned: number) => void
  onGoNext: (next: QuestSummary) => void
  onBackToStage: () => void
  /** 이번 턴에 장소 완료 / 지역 정복 */
  onStageCleared: (regionConquered: boolean) => void
  onError: (msg: string) => void
  onShowPhrases: (questId: number) => void
}

const MAX_LEN = 300

/**
 * 퀘스트 대화 화면
 * POST /api/quests/{id}/start → NPC 첫 대사 / POST /api/quests/{id}/chat → 한 턴씩
 */
export default function QuestChat({
  userId,
  quest,
  nextQuest,
  onCoins,
  onReward,
  onGoNext,
  onBackToStage,
  onStageCleared,
  onError,
  onShowPhrases,
}: Props) {
  const [lines, setLines] = useState<Line[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [missions, setMissions] = useState<MissionStatus[]>(quest.missions)
  const [completed, setCompleted] = useState(false)
  const [pending, setPending] = useState(true)
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  // 입장 시 start (미완료 과제는 대화가 초기화됨)
  useEffect(() => {
    let alive = true
    setLines([])
    setCompleted(false)
    setPending(true)
    api
      .startQuest(quest.id, userId)
      .then((r) => {
        if (!alive) return
        setLines([{ who: 'npc', text: r.npcReply }])
        setSuggestions(r.suggestions ?? [])
        setMissions(r.missions ?? [])
        setCompleted(r.status === 'COMPLETED')
      })
      .catch((e) => alive && onError(e.message))
      .finally(() => alive && setPending(false))
    return () => {
      alive = false
    }
  }, [quest.id, userId, onError])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [lines, pending])

  const send = async (raw: string) => {
    const message = raw.trim().slice(0, MAX_LEN)
    if (!message || pending || completed) return
    setInput('')
    setLines((l) => [...l, { who: 'me', text: message }])
    setSuggestions([])
    setPending(true)

    try {
      const r: ChatResponse = await api.chat(quest.id, userId, message)
      setLines((l) => {
        const copy = [...l]
        const last = copy[copy.length - 1]
        if (last?.who === 'me') copy[copy.length - 1] = { ...last, correction: r.correction }
        copy.push({ who: 'npc', text: r.npcReply })
        if (r.culturalTip) copy.push({ who: 'tip', text: r.culturalTip })
        return copy
      })
      setSuggestions(r.suggestions ?? [])
      setMissions(r.missions ?? [])
      onCoins(r.coins)
      if (r.coinsEarned > 0) onReward(r.coinsEarned)
      if (r.questCompleted) setCompleted(true)
      if (r.stageCleared) onStageCleared(r.regionConquered)
    } catch (e) {
      // 409 = 이미 완료된 과제
      if (e instanceof ApiError && e.status === 409) setCompleted(true)
      onError(e instanceof Error ? e.message : '전송 실패')
    } finally {
      setPending(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const doneCount = missions.filter((m) => m.done).length

  return (
    <div className="chat-screen">
      <aside className="chat-side">
        <button className="link-button" onClick={onBackToStage}>
          ‹ 장소로
        </button>
        <p className="chat-side__code">{quest.code}</p>
        <h1 className="chat-side__title">{quest.title}</h1>
        <p className="chat-side__npc">대화 상대 · {quest.npcRole}</p>
        <p className="chat-side__situation">{quest.situation}</p>

        <div className="missions">
          <p className="missions__head">
            미션{' '}
            <span>
              {doneCount}/{missions.length}
            </span>
          </p>
          <ul>
            {missions.map((m) => (
              <li key={m.index} className={m.done ? 'is-done' : ''}>
                <span className="missions__check" aria-hidden>
                  {m.done ? '✓' : ''}
                </span>
                {m.text}
              </li>
            ))}
          </ul>
        </div>

        <button
          className="paper-button"
          onClick={() => onShowPhrases(quest.id)}
          disabled={!completed && lines.length < 2}
        >
          표현 카드 만들기
        </button>
      </aside>

      <section className="chat-main">
        <div className="chat-log" ref={logRef}>
          {lines.map((l, i) =>
            l.who === 'tip' ? (
              <div key={i} className="tip">
                <strong>문화 팁</strong> {l.text}
              </div>
            ) : (
              <div key={i} className={`bubble-row is-${l.who}`}>
                {l.who === 'npc' && <span className="bubble-row__name">{quest.npcRole}</span>}
                <p className="bubble">{l.text}</p>
                {l.who === 'me' && l.correction && l.correction.better !== l.correction.original && (
                  <div className="correction">
                    <p>
                      <s>{l.correction.original}</s> → <b>{l.correction.better}</b>
                    </p>
                    <p className="correction__reason">{l.correction.reason}</p>
                  </div>
                )}
              </div>
            ),
          )}
          {pending && (
            <div className="bubble-row is-npc">
              <p className="bubble is-typing">
                <span />
                <span />
                <span />
              </p>
            </div>
          )}
        </div>

        {completed ? (
          <div className="quest-done">
            <p>퀘스트 완료!</p>
            <div className="quest-done__actions">
              <button className="paper-button" onClick={() => onShowPhrases(quest.id)}>
                표현 복습
              </button>
              {nextQuest ? (
                <button className="paper-button is-primary" onClick={() => onGoNext(nextQuest)}>
                  다음 퀘스트 ›
                </button>
              ) : (
                <button className="paper-button is-primary" onClick={onBackToStage}>
                  장소로 돌아가기
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button
                    key={s.korean}
                    className="chip"
                    onClick={() => send(s.korean)}
                    disabled={pending}
                    title={s.meaning ?? undefined}
                  >
                    <span className="chip__ko">{s.korean}</span>
                    {s.romanization && <span className="chip__rom">{s.romanization}</span>}
                    {s.meaning && <span className="chip__meaning">{s.meaning}</span>}
                  </button>
                ))}
              </div>
            )}
            <form className="chat-input" onSubmit={onSubmit}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_LEN}
                placeholder="한국어로 말해 보세요"
                disabled={pending}
                autoFocus
              />
              <button type="submit" disabled={pending || !input.trim()}>
                보내기
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
