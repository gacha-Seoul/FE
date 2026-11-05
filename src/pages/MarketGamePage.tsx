import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import MarketScene from '../features/game/components/MarketScene'
import type { MarketInput } from '../features/game/components/MarketScene'
import { MARKET_ASSETS, MARKET_NPCS, MARKET_SPAWN, MARKET_STOPS, marketMapPoint } from '../features/game/data/market'
import { api } from '../features/gacha/api/client'
import type { MissionStatus, QuestSummary, StageSummary, Suggestion } from '../features/gacha/api/types'
import { useSession } from '../features/gacha/hooks/useSession'
import '../features/game/market.css'

interface Line { who: 'npc' | 'me' | 'tip'; text: string }
const errorText = (error: unknown) => error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'

export default function MarketGamePage() {
  const session = useSession()
  const { user, map, setCoins } = session
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [sceneError, setSceneError] = useState('')
  const [error, setError] = useState('')
  const [stage, setStage] = useState<StageSummary | null>(null)
  const [selected, setSelected] = useState(0)
  const [position, setPosition] = useState({ ...MARKET_SPAWN, near: false })
  const [dialogue, setDialogue] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [missions, setMissions] = useState<MissionStatus[]>([])
  const [chatQuestId, setChatQuestId] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [reward, setReward] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)
  const inFlight = useRef(false)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<MarketInput>({ forward: 0, side: 0, turn: 0, reset: 0 })
  const quests = [...(stage?.quests ?? [])].sort((a, b) => a.orderNo - b.orderNo)
  const quest: QuestSummary | undefined = quests[selected]
  const stop = MARKET_STOPS[selected]
  const cleared = !!stage?.cleared
  const canReview = quests.some(q => q.code === 'Q04' && q.status === 'COMPLETED')
  const region = map?.regions.find(r => r.code === 'SEODAEMUN')
  const userId = user?.id
  const regionId = region?.id
  const unlocked = region?.status === 'UNLOCKED' || region?.status === 'CONQUERED'
  const active = started && ready && !sceneError && !dialogue && !paused
  const distance = Math.hypot(position.x - stop.x, position.z - stop.z)
  const done = stage?.completedQuests ?? 0
  const mapRoute = [MARKET_SPAWN, ...MARKET_NPCS].map(point => {
    const mapped = marketMapPoint(point.x, point.z)
    return `${mapped.x},${mapped.y}`
  }).join(' ')
  const mapPlayer = marketMapPoint(position.x, position.z)

  const connectStage = useCallback(async () => {
    if (!userId || !regionId || !unlocked) return
    try {
      const detail = await api.getRegion(regionId, userId)
      const market = detail.stages.find(s => s.place.includes('전통시장'))
      if (!market) throw new Error('전통시장 퀘스트가 아직 준비되지 않았어요.')
      setStage(market)
      const ordered = [...market.quests].sort((a, b) => a.orderNo - b.orderNo)
      const next = ordered.findIndex(q => q.status !== 'COMPLETED')
      setSelected(next < 0 ? 3 : next)
      setError('')
    } catch (cause) { setError(errorText(cause)) }
    finally { setConnecting(false) }
  }, [userId, regionId, unlocked])

  useEffect(() => {
    const timer = window.setTimeout(() => { void connectStage() }, 0)
    return () => window.clearTimeout(timer)
  }, [connectStage])
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [lines, busy])
  useEffect(() => {
    if (active) return
    input.current.forward = 0
    input.current.side = 0
    input.current.turn = 0
  }, [active])
  useEffect(() => {
    function onBlur() { setPaused(true) }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.code !== 'Escape' || !started) return
      if (dialogue && !inFlight.current) setDialogue(false)
      else if (!dialogue) setPaused(value => !value)
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [dialogue, started])

  const onReady = useCallback(() => { setReady(true); setSceneError('') }, [])
  const onPosition = useCallback((x: number, z: number, near: boolean) => setPosition({ x, z, near }), [])

  async function talk() {
    if (!position.near || !quest || quest.status === 'LOCKED' || inFlight.current) return
    setDialogue(true)
    if (chatQuestId === quest.id) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const response = await api.startQuest(quest.id, user!.id)
      setChatQuestId(quest.id)
      setLines([{ who: 'npc', text: response.npcReply }])
      setSuggestions(response.suggestions ?? [])
      setMissions(response.missions)
      setCompleted(response.status === 'COMPLETED')
      setReward(null)
    } catch (cause) { setError(errorText(cause)) }
    finally { setBusy(false); inFlight.current = false }
  }

  async function send(raw: string) {
    const answer = raw.trim()
    if (!answer || answer.length > 300 || !quest || chatQuestId !== quest.id || !user || inFlight.current || completed) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const response = await api.chat(quest.id, user.id, answer)
      setLines(previous => [...previous, { who: 'me', text: answer }, { who: 'npc', text: response.npcReply },
        ...(response.correction ? [{ who: 'tip' as const, text: `${response.correction.better} · ${response.correction.reason}` }] : []),
        ...(response.culturalTip ? [{ who: 'tip' as const, text: response.culturalTip }] : []),
      ])
      setMessage('')
      setMissions(response.missions)
      setSuggestions(response.suggestions ?? [])
      setCoins(response.coins)
      if (response.questCompleted) {
        setCompleted(true)
        setReward(response.coinsEarned)
        // Progress and rewards are read back from Spring; never inferred from text or position.
        setStage(await api.getStage(stage!.id, user.id))
      }
    } catch (cause) { setError(errorText(cause)) }
    finally { inFlight.current = false; setBusy(false) }
  }

  async function nextQuest() {
    if (!stage || !user || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try {
      const fresh = await api.getStage(stage.id, user.id)
      setStage(fresh)
      const ordered = [...fresh.quests].sort((a, b) => a.orderNo - b.orderNo)
      const next = ordered.findIndex(q => q.orderNo > (quest?.orderNo ?? 0) && q.status !== 'LOCKED')
      if (next >= 0) {
        setSelected(next)
        setChatQuestId(null)
        setLines([])
        setCompleted(false)
        setMessage('')
        setError('')
        setDialogue(false)
      }
    } catch (cause) { setError(errorText(cause)) }
    finally { inFlight.current = false; setBusy(false) }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void send(message) }
  function hold(axis: 'forward' | 'side' | 'turn', value: number) { input.current[axis] = value }
  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)'))
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {
      event.preventDefault(); last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus()
    }
  }

  return <main className="market-game">
    <MarketScene active={active} target={selected} input={input} onReady={onReady}
      onError={setSceneError} onPosition={onPosition} onProgress={setProgress} />
    <div className="market-vignette" />
    <header className="market-header" inert={dialogue || paused}>
      <Link className="market-back" to="/gacha" aria-label="지도로 돌아가기">← <span>서울 지도</span></Link>
      <div className="market-brand">서울 가챠 <span>SEOUL GACHA</span></div>
      <div className="market-wallet"><span aria-hidden="true">◉</span> {user ? user.coins : '—'} <small>냥</small></div>
    </header>

    {started && <div className="market-hud" inert={dialogue || paused}>
      <aside className="market-objective">
        <p className="market-kicker">SEODAEMUN · CULTURE</p>
        <h1>시장 간식,<br />두 사람 몫</h1>
        <p className="market-objective__intro">친구를 위한 간식을 사며<br />시장 사람들과 이야기해 보세요.</p>
        <div className="market-progress"><span style={{ width: `${done / 4 * 100}%` }} /></div>
        <div className="market-progress-label"><span>전통시장 퀘스트</span><b>{done}<span> / 4</span></b></div>
        <ol className="market-quests">{MARKET_STOPS.map((item, index) => {
          const status = quests[index]?.status
          return <li key={item.code} className={`${index === selected ? 'is-current' : ''} ${status === 'COMPLETED' ? 'is-done' : ''}`}>
            <button onClick={() => { setSelected(index); setDialogue(false); setError('') }}
              disabled={dialogue || busy || status === 'LOCKED' || (!stage && index !== 0)}>
              <span className="market-step">{status === 'COMPLETED' ? '✓' : String(index + 1).padStart(2, '0')}</span>
              <span><small>{item.short}</small><strong>{item.title}</strong></span>
              <span className="market-quest-arrow">{index === selected ? '↗' : status === 'LOCKED' ? '·' : ''}</span>
            </button>
          </li>
        })}</ol>
        {!stage && <div className="market-connection">
          <p>{connecting ? '퀘스트를 불러오고 있어요…' : session.error ? '퀘스트 서버 연결이 필요해요. 지금은 시장을 둘러볼 수 있어요.' : !unlocked ? '서울 지도에서 서대문구를 뽑으면 퀘스트를 시작할 수 있어요.' : '퀘스트 정보를 불러오지 못했어요.'}</p>
          {unlocked && <button disabled={connecting} onClick={() => { setConnecting(true); void connectStage() }}>다시 연결 ↗</button>}
          {session.error && <button onClick={() => void session.reconnect()}>서버 연결 다시 시도 ↗</button>}
          {!unlocked && <Link to="/gacha">서울 지도로 →</Link>}
        </div>}
        {canReview && <Link className="market-review-link" to="/review/market">Q5 · 배운 표현 복습하기 ↗</Link>}
      </aside>

      <aside className="market-map" aria-label="시장 동선 지도">
        <div><span>시장 안내도</span><small>YOU ARE HERE</small></div>
        <svg viewBox="0 0 150 180" role="img" aria-label={`현재 목표 ${stop.name}, 거리 ${distance.toFixed(1)}미터`}>
          <polyline points={mapRoute} stroke="#5a695d" strokeWidth="27" strokeLinejoin="round" fill="none" />
          <polyline points={mapRoute} stroke="#b8c1ab" strokeWidth="1" strokeDasharray="3 5" fill="none" />
          <rect x="14" y="129" width="16" height="24" rx="3" /><rect x="68" y="125" width="22" height="17" rx="3" />
          <rect x="20" y="82" width="20" height="25" rx="3" /><rect x="89" y="81" width="29" height="24" rx="3" />
          <rect x="38" y="32" width="24" height="23" rx="3" /><rect x="111" y="23" width="18" height="25" rx="3" />
          {MARKET_NPCS.map((npc, index) => {
            const point = marketMapPoint(npc.x, npc.z)
            return <g key={npc.code}>
              <circle cx={point.x} cy={point.y} r="7" fill={index === (selected === 0 ? 0 : selected === 3 ? 2 : 1) ? '#efbe70' : '#8c9b84'} />
              <text x={point.x} y={point.y + 3}>{index + 1}</text>
            </g>
          })}
          <circle cx={mapPlayer.x} cy={mapPlayer.y} r="5" fill="#fff8e7" stroke="#294c3a" strokeWidth="2" />
        </svg>
        <p><i />내 위치 <span>● 다음 대화</span></p>
      </aside>

      {!dialogue && <>
        <div className="market-crosshair" aria-hidden="true">+</div>
        <div className="market-destination"><span className="market-destination__icon">◇</span>
          <div><small>{cleared ? '시장 산책' : '다음 목적지'}</small><strong>{stop.name}</strong></div><b>{distance.toFixed(1)}<small> m</small></b>
        </div>
        {position.near && quest && <button className="market-interact" onClick={() => void talk()} disabled={busy || quest.status === 'LOCKED'}>
          <span>대화</span> {stop.name} 상인에게 말 걸기 <b>↗</b>
        </button>}
        {!position.near && <p className="market-wayfinding">금빛 표식을 따라 상인에게 다가가 보세요.</p>}
        <div className="market-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동</span><span>드래그 · 둘러보기</span><span><kbd>ESC</kbd> 쉬어가기</span></div>
        <div className="market-pad" aria-label="이동 버튼">
          {([
            ['앞으로 이동', '↑', 'forward', 1], ['왼쪽으로 이동', '←', 'side', -1],
            ['뒤로 이동', '↓', 'forward', -1], ['오른쪽으로 이동', '→', 'side', 1],
          ] as const).map(([label, symbol, axis, value]) => <button key={label} aria-label={label} disabled={!active}
            onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); hold(axis, value) }}
            onPointerUp={() => hold(axis, 0)} onPointerCancel={() => hold(axis, 0)} onLostPointerCapture={() => hold(axis, 0)}
            onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); hold(axis, value) } }}
            onKeyUp={() => hold(axis, 0)} onBlur={() => hold(axis, 0)}>{symbol}</button>)}
        </div>
        <button className="market-reset" onClick={() => { input.current.reset += 1 }} disabled={!active}>입구로 돌아오기 ↺</button>
      </>}
      <button className="market-pause" aria-label="일시 정지" onClick={() => setPaused(true)} disabled={busy}>Ⅱ</button>
    </div>}

    {error && <div className="market-error" role="alert">{error}<button onClick={() => setError('')} aria-label="오류 안내 닫기">×</button></div>}

    {dialogue && <section className="market-dialogue" role="dialog" aria-modal="true" aria-labelledby="market-speaker" inert={paused} onKeyDown={trapFocus}>
      <header><div className="market-avatar" aria-hidden="true">人</div><div><small>{quest?.code} · {quest?.title}</small><h2 id="market-speaker">{quest?.npcRole}</h2></div>
        <button onClick={() => setDialogue(false)} disabled={busy} aria-label="대화 닫기">×</button></header>
      <div className="market-missions">{missions.map(mission => <span className={mission.done ? 'is-done' : ''} key={mission.index}>{mission.done ? '✓' : '○'} {mission.text}</span>)}</div>
      <div className="market-chatlog" ref={log} role="log" aria-live="polite">
        {lines.map((line, index) => <p key={index} className={`market-line is-${line.who}`}>{line.text}</p>)}
        {busy && <p className="market-line is-npc market-typing">이야기를 듣고 있어요<span>…</span></p>}
      </div>
      {completed ? <div className="market-complete">
        <div><small>{cleared ? 'MARKET COMPLETE' : 'QUEST COMPLETE'}</small><h3>{cleared ? '친구와 나눌 간식, 준비 끝!' : '잘했어요. 다음 이야기를 만나볼까요?'}</h3>
          {reward !== null && reward > 0 && <p>퀘스트 보상 +{reward}냥</p>}</div>
        <div className="market-complete__actions">{selected < 3 ? <button className="market-primary" onClick={() => void nextQuest()} disabled={busy}>다음 퀘스트로 →</button> : <>
          {canReview && <Link className="market-primary" to="/review/market">Q5 · 배운 표현 복습하기 ↗</Link>}
          {!canReview && <button className="market-primary" onClick={() => void connectStage()} disabled={connecting}>완료 상태 다시 불러오기</button>}
          <Link className="market-secondary" to="/gacha">지도로 돌아가기</Link>
        </>}</div>
      </div> : <>
        <div className="market-suggestions">{suggestions.map(suggestion => <button key={suggestion.korean} disabled={busy} onClick={() => void send(suggestion.korean)}>{suggestion.korean}</button>)}</div>
        {chatQuestId !== quest?.id && !busy ? <button className="market-primary" onClick={() => void talk()}>대화 다시 연결</button> : <form className="market-chat-input" onSubmit={submit}>
          <label className="sr-only" htmlFor="market-message">상인에게 할 말</label>
          <input id="market-message" placeholder="한국어로 이야기해 보세요…" value={message} maxLength={300} onChange={event => setMessage(event.target.value)} disabled={busy} autoFocus />
          <span>{message.length}/300</span><button type="submit" disabled={busy || !message.trim()}>보내기 ↗</button>
        </form>}
      </>}
    </section>}

    {(!started || sceneError) && <section className="market-intro" style={{ backgroundImage: `linear-gradient(90deg,rgba(15,29,22,.96),rgba(15,29,22,.48) 65%,rgba(15,29,22,.15)),url('${MARKET_ASSETS.panorama}')` }}>
      <div className="market-intro__content"><p className="market-kicker">SEOUL STORIES / 01</p><span className="market-location">서대문구 · 문화</span>
        <h1>시장 간식,<br /><em>두 사람 몫.</em></h1>
        <p>갓 부친 전의 고소한 냄새,<br />골목마다 오가는 다정한 인사.<br />한국어로 주문하고, 친구에게 간식을 건네보세요.</p>
        <div className="market-intro__meta"><span>01—04 <small>네 가지 이야기</small></span><span>자유롭게 걷는 <small>3D 전통시장</small></span></div>
        {sceneError ? <><p role="alert" className="market-load-error">{sceneError}</p><button className="market-primary" onClick={() => window.location.reload()}>다시 불러오기 ↻</button></> : <button className="market-primary" disabled={!ready} onClick={() => { setStarted(true); setPaused(false) }}>
          {ready ? '시장 들어가기' : `시장을 준비하고 있어요 · ${progress}%`} <span>→</span>
        </button>}
        <p className="market-intro__hint">W A S D로 이동 · 드래그로 둘러보기<br />퀘스트를 시작하려면 서울 지도에서 서대문구를 열어 주세요.</p>
      </div>
      <div className="market-intro__caption"><span>영천시장</span><small>COVERED KOREAN TRADITIONAL MARKET</small></div>
    </section>}
    {started && paused && !sceneError && <section className="market-pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" onKeyDown={trapFocus}>
      <p className="market-kicker">TAKE A BREATH</p><h2 id="pause-title">잠시 쉬어갈까요?</h2><p>시장의 이야기는 여기서 기다리고 있어요.</p>
      <button className="market-primary" onClick={() => setPaused(false)} autoFocus>이어서 걷기 →</button><Link to="/gacha">서울 지도로 돌아가기</Link>
    </section>}
  </main>
}
