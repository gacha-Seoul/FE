import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Stage from './components/Stage'
import Header from './components/Header'
import Decorations from './components/Decorations'
import GachaMachine from './components/GachaMachine'
import DrawPanel from './components/DrawPanel'
import RegionBoard from './components/RegionBoard'
import Character from './components/Character'
import QuestPopup from './components/QuestPopup'
import Roadmap from './components/Roadmap'
import GameScreen from './components/GameScreen'
import Toast, { type ToastMsg } from './components/Toast'
import { api, gachaWithRetry, IS_MOCK } from './api/client'
import type { MapRegion, RegionDetail, StageSummary } from './api/types'
import { REGION_CARDS, regionMessage, splitPlace } from './data/regions'
import { ROADMAP_LABELS } from './data/roadmap'
import { useSession } from './hooks/useSession'
import { useSpinner } from './hooks/useSpinner'
import './gacha.css'

/** 냥 표시값 (고정) */
const COIN_DISPLAY = 1
/** 뽑기 횟수(뽑기 기회). 냥과 별개로 관리, 새로고침하면 다시 채워짐 */
const DRAW_TICKETS = 10

type Screen =
  | { name: 'gacha' }
  | { name: 'roadmap'; regionId: number }
  | { name: 'game'; stage: StageSummary; placeLabel: string }

export default function GachaApp() {
  const session = useSession()
  const { user, map } = session
  const spinner = useSpinner(REGION_CARDS.length)

  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [screen, setScreen] = useState<Screen>({ name: 'gacha' })
  const [draws, setDraws] = useState(DRAW_TICKETS)
  const [popupRegion, setPopupRegion] = useState<RegionDetail | null>(null)
  const [roadmapRegion, setRoadmapRegion] = useState<RegionDetail | null>(null)
  const [toast, setToast] = useState<ToastMsg | null>(null)

  const notify = useCallback(
    (text: string, kind: ToastMsg['kind'] = 'error') => setToast({ id: Date.now(), text, kind }),
    [],
  )
  const clearToast = useCallback(() => setToast(null), [])

  // demo/start 로 시작했으면 첫 가챠 결과 팝업 바로 띄우기
  useEffect(() => {
    if (session.demoRegion) {
      setPopupRegion(session.demoRegion)
      spinner.setHighlightIdx(REGION_CARDS.findIndex((c) => c.name === session.demoRegion!.name))
      session.clearDemoRegion()
    }
  }, [session, spinner])

  useEffect(() => {
    if (session.error) notify(session.error)
  }, [session.error, notify])

  const regionsByName = useMemo(
    () => Object.fromEntries((map?.regions ?? []).map((r) => [r.name, r])) as Record<string, MapRegion>,
    [map],
  )

  // ── 가챠 가능 여부 ─────────────────────────────
  // 냥(화폐)과 뽑기 횟수(뽑기 기회)는 서로 다른 값. 냥은 지금은 1냥 고정 표시
  const coins = COIN_DISPLAY
  const remaining = draws
  const challenging = map?.regions.find((r) => r.status === 'UNLOCKED') // 도전 중인 지역
  const candidatesLeft = map ? map.regions.some((r) => r.playable && r.status === 'LOCKED') : true

  let reason: string | undefined
  if (!user) reason = '서버 연결 중…'
  else if (challenging && !IS_MOCK)
    reason = `${challenging.name} 퀘스트를 완료하면 다시 뽑을 수 있어요` // 기획 1-1: 재뽑기 불가
  else if (!candidatesLeft && !IS_MOCK) reason = '뽑을 수 있는 지역을 모두 열었어요'
  else if (remaining < 1) reason = '뽑기 횟수를 다 썼어요'
  const canDraw = !!user && !spinner.spinning && !reason

  const draw = async () => {
    if (!user || !canDraw) return
    try {
      const res = await spinner.spin(gachaWithRetry(user.id), (r) =>
        REGION_CARDS.findIndex((c) => c.name === r.region.name),
      )
      session.setCoins(res.coinsLeft)
      // 뽑기 횟수 1회 차감 (목 모드는 다 쓰면 다시 채워서 계속 뽑을 수 있게)
      setDraws((d) => (d - 1 <= 0 && IS_MOCK ? DRAW_TICKETS : d - 1))
      setPopupRegion(res.region)
      void session.refreshMap()
    } catch (e) {
      notify(e instanceof Error ? e.message : '뽑기 실패')
    }
  }

  const openRegion = async (r: MapRegion) => {
    if (!user) return
    try {
      setPopupRegion(await api.getRegion(r.id, user.id))
    } catch (e) {
      notify(e instanceof Error ? e.message : '지역 정보를 불러오지 못했어요')
    }
  }

  const goGacha = () => {
    setScreen({ name: 'gacha' })
    void session.refreshMap()
  }

  /** 로드맵(2-1) 열기: 진행률이 바뀌었을 수 있어서 매번 지역 상세를 새로 조회 */
  const goRoadmap = async (regionId: number) => {
    if (!user) return
    try {
      const region = await api.getRegion(regionId, user.id)
      setRoadmapRegion(region)
      setScreen({ name: 'roadmap', regionId })
      setPopupRegion(null)
    } catch (e) {
      notify(e instanceof Error ? e.message : '지역 정보를 불러오지 못했어요')
    }
  }

  return (
    <Stage>
      {screen.name === 'gacha' && (
        <>
          <Decorations />
          <GachaMachine spinning={spinner.spinning} />
          <DrawPanel
            remaining={remaining}
            canDraw={canDraw}
            spinning={spinner.spinning}
            reason={reason}
            onDraw={draw}
          />
          <RegionBoard
            coins={coins}
            highlightIdx={spinner.highlightIdx}
            regionsByName={regionsByName}
            spinning={spinner.spinning}
            onOpenRegion={openRegion}
          />
          {popupRegion && (
            <QuestPopup
              region={popupRegion}
              onClose={() => setPopupRegion(null)}
              onSelectStage={() => void goRoadmap(popupRegion.id)}
            />
          )}
          <Character raised={!!popupRegion} />
          {!popupRegion && <Link className="market-game-entry" to="/play/market">전통시장 3D로 둘러보기 ↗</Link>}
        </>
      )}

      {screen.name === 'roadmap' && roadmapRegion && (
        <>
          <Decorations clouds={false} />
          <Roadmap
            region={roadmapRegion}
            coins={coins}
            message={regionMessage(roadmapRegion)}
            onBackToGacha={goGacha}
            onSelectStage={(s) => {
              const idx = [...roadmapRegion.stages].sort((a, b) => a.orderNo - b.orderNo).indexOf(s)
              const label = ROADMAP_LABELS[roadmapRegion.name]?.[idx] ?? splitPlace(s.place).title
              setScreen({ name: 'game', stage: s, placeLabel: label })
            }}
          />
        </>
      )}

      {screen.name === 'game' && roadmapRegion && (
        <>
          <Decorations clouds={false} />
          <GameScreen
            regionName={roadmapRegion.name}
            stage={screen.stage}
            placeLabel={screen.placeLabel}
            onBack={() => void goRoadmap(roadmapRegion.id)}
            onGacha={goGacha}
          />
        </>
      )}

      <Toast toast={toast} onDone={clearToast} />
      {IS_MOCK && <span className="mock-badge">목 데이터 모드 · 서버 없이 동작 중 (?mock=off 로 끄기)</span>}

      {/* 헤더는 팝업 오버레이보다 위 (디자인 141:1286) */}
      <Header lang={lang} onChangeLang={setLang} />
    </Stage>
  )
}
