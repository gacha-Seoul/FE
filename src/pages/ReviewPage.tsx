import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { answerReview, startReview } from '../features/review/api'
import type { ReviewResult, ReviewSession } from '../features/review/api'

export default function ReviewPage() {
  const [session, setSession] = useState<ReviewSession | null>(null)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const retry = useRef<{ message: string; requestId: string } | null>(null)

  async function begin() {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const next = await startReview()
      setSession(next)
      setResult(null)
      setMessage('')
      retry.current = null
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '복습을 시작하지 못했어요.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !message.trim() || inFlight.current || result?.satisfactory) return
    inFlight.current = true
    setBusy(true)
    setError('')
    const answer = message.trim()
    if (retry.current?.message !== answer) retry.current = { message: answer, requestId: crypto.randomUUID() }
    try {
      setResult(await answerReview(session, answer, retry.current.requestId))
      retry.current = null
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '답변을 평가하지 못했어요.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  function advance() {
    if (!result?.next) return
    setSession(result.next)
    setResult(null)
    setMessage('')
    setError('')
    retry.current = null
  }

  return <main className="shell review-page">
    <header className="topbar"><Link to="/">← 처음으로</Link><span className="tag">서대문구 · 문화</span></header>
    <p className="eyebrow">Q5 · REVIEW</p>
    <h1>시장에서 다시 말해 봐요</h1>
    <p>길 묻기부터 포장 주문까지, 배운 표현으로 답해 보세요. 코치가 잘한 점과 더 자연스러운 표현을 알려드려요.</p>
    {error && <p role="alert" className="review-error">{error}</p>}
    {!session && <section className="review-card">
      <h2>전통시장 회화 복습</h2>
      <p>네 가지 상황을 차례로 연습해요. 뜻이 통하면 표현이 조금 달라도 괜찮아요.</p>
      <button className="button" onClick={begin} disabled={busy}>{busy ? '준비하고 있어요…' : 'Q5 복습 시작'}</button>
    </section>}
    {session && <>
      <section className="review-card" aria-labelledby="scenario-title" aria-busy={busy}>
        <p className="eyebrow">복습 {session.round} / {session.totalRounds} · {session.scenario.id}</p>
        <h2 id="scenario-title">{session.scenario.title}</h2>
        <p>{session.scenario.situation}</p>
        <blockquote>{session.scenario.npcReply}</blockquote>
        {!result?.satisfactory && <form onSubmit={submit}>
          <label htmlFor="review-answer">한국어로 답해 보세요</label>
          <textarea id="review-answer" value={message} onChange={event => setMessage(event.target.value)}
            maxLength={300} required rows={3} disabled={busy} placeholder="여기에 답변을 적어 주세요." />
          <p className="review-count">{message.length} / 300</p>
          <button className="button" type="submit" disabled={busy || !message.trim()}>
            {busy ? '코치가 답변을 살펴보고 있어요…' : result ? '다시 답해 보기' : '답변 보내기'}
          </button>
        </form>}
      </section>
      <div aria-live="polite" aria-atomic="true">
        {result && <section className="review-card">
          <h2>{result.satisfactory ? '좋았어요!' : '한 번 더 연습해 볼까요?'}</h2>
          <p>{result.evaluation.feedback}</p>
          <ul>{result.evaluation.criteria.map(criterion => <li key={criterion.id}>
            {criterion.met ? '✓ 전달됐어요' : '더 말해 보세요'} · {session.scenario.criteria.find(item => item.id === criterion.id)?.text}
            <p>{criterion.evidence}</p>
          </li>)}</ul>
          <h3>이렇게도 말할 수 있어요</h3>
          <p>{result.evaluation.improvedAnswer}</p>
          {result.next && <button className="button" onClick={advance}>다음 상황 →</button>}
          {result.reviewFinished && <><p>네 가지 상황을 모두 복습했어요!</p>
            <button className="button" onClick={begin} disabled={busy}>처음부터 다시 연습</button></>}
        </section>}
      </div>
      {!result?.reviewFinished && <button className="review-restart" onClick={begin} disabled={busy}>복습 처음부터 다시 시작</button>}
    </>}
    <p className="tag">Q5는 표현을 연습하는 복습이에요. 코인 보상은 지급되지 않아요.</p>
  </main>
}
