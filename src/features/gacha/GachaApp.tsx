import { useCallback, useEffect, useMemo, useState } from 'react'
import Stage from './components/Stage'
import Header from './components/Header'
import Decorations from './components/Decorations'
import GachaMachine from './components/GachaMachine'
import DrawPanel from './components/DrawPanel'
import RegionBoard from './components/RegionBoard'
import Character from './components/Character'
import QuestPopup from './components/QuestPopup'
import StageScreen from './components/StageScreen'
import QuestChat from './components/QuestChat'
import Toast, { type ToastMsg } from './components/Toast'
import { ClearModal, PhraseCardModal } from './components/Modals'
import { api, gachaWithRetry, IS_MOCK } from './api/client'
import type { MapRegion, QuestSummary, RegionDetail, StageSummary } from './api/types'
import { REGION_CARDS, splitPlace } from './data/regions'
import { useSession } from './hooks/useSession'
import { useSpinner } from './hooks/useSpinner'
import './gacha.css'

type Screen =
  | { name: 'gacha' }
  | { name: 'stage'; stageId: number; regionName: string }
  | { name: 'quest'; stage: StageSummary; quest: QuestSummary; regionName: string }

export default function GachaApp() {
  const session = useSession()
  const { user, map } = session
  const spinner = useSpinner(REGION_CARDS.length)

  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [screen, setScreen] = useState<Screen>({ name: 'gacha' })
  const [popupRegion, setPopupRegion] = useState<RegionDetail | null>(null)
  const [phraseQuestId, setPhraseQuestId] = useState<number | null>(null)
  const [clear, setClear] = useState<{ title: string } | null>(null)
  const [stageRefresh, setStageRefresh] = useState(0)
  const [toast, setToast] = useState<ToastMsg | null>(null)

  const notify = useCallback(
    (text: string, kind: ToastMsg['kind'] = 'error') => setToast({ id: Date.now(), text, kind }),
    [],
  )
  const clearToast = useCallback(() => setToast(null), [])
  const closePhrases = useCallback(() => setPhraseQuestId(null), [])

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
  const coins = user?.coins ?? 0
  const cost = map?.gachaCost ?? 1
  const remaining = Math.floor(coins / cost)
  const challenging = map?.regions.find((r) => r.status === 'UNLOCKED') // 도전 중인 지역
  const candidatesLeft = map ? map.regions.some((r) => r.playable && r.status === 'LOCKED') : true

  let reason: string | undefined
  if (!user) reason = '서버 연결 중…'
  else if (challenging && !IS_MOCK)
    reason = `${challenging.name} 퀘스트를 완료하면 다시 뽑을 수 있어요` // 기획 1-1: 재뽑기 불가
  else if (!candidatesLeft) reason = '뽑을 수 있는 지역을 모두 열었어요'
  else if (remaining < 1) reason = '냥이 부족해요. 퀘스트를 완료하면 받을 수 있어요'
  const canDraw = !!user && !spinner.spinning && !reason

  const draw = async () => {
    if (!user || !canDraw) return
    try {
      const res = await spinner.spin(gachaWithRetry(user.id), (r) =>
        REGION_CARDS.findIndex((c) => c.name === r.region.name),
      )
      session.setCoins(res.coinsLeft)
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
    setClear(null)
    void session.refreshMap()
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
              onSelectStage={(s) => {
                setScreen({ name: 'stage', stageId: s.id, regionName: popupRegion.name })
                setPopupRegion(null)
              }}
            />
          )}
          <Character raised={!!popupRegion} />
        </>
      )}

      {screen.name === 'stage' && user && (
        <StageScreen
          userId={user.id}
          stageId={screen.stageId}
          regionName={screen.regionName}
          refreshKey={stageRefresh}
          onError={notify}
          onBackToGacha={goGacha}
          onSelectQuest={(quest, stage) => setScreen({ name: 'quest', stage, quest, regionName: screen.regionName })}
        />
      )}

      {screen.name === 'quest' && user && (
        <QuestChat
          key={screen.quest.id}
          userId={user.id}
          quest={screen.quest}
          nextQuest={
            [...screen.stage.quests]
              .sort((a, b) => a.orderNo - b.orderNo)
              .find((q) => q.orderNo > screen.quest.orderNo) ?? null
          }
          onCoins={session.setCoins}
          onReward={(n) => notify(`퀘스트 완료! +${n}냥`, 'reward')}
          onGoNext={(next) => setScreen({ ...screen, quest: next })}
          onBackToStage={() => {
            setStageRefresh((k) => k + 1)
            setScreen({ name: 'stage', stageId: screen.stage.id, regionName: screen.regionName })
          }}
          onStageCleared={(conquered) =>
            setClear({ title: conquered ? screen.regionName : splitPlace(screen.stage.place).title })
          }
          onError={notify}
          onShowPhrases={setPhraseQuestId}
        />
      )}

      {phraseQuestId !== null && user && (
        <PhraseCardModal userId={user.id} questId={phraseQuestId} onClose={closePhrases} onError={notify} />
      )}
      {clear && <ClearModal title={clear.title} onGacha={goGacha} onStay={() => setClear(null)} />}

      <Toast toast={toast} onDone={clearToast} />
      {IS_MOCK && <span className="mock-badge">목 데이터 모드 · 서버 없이 동작 중 (?mock=off 로 끄기)</span>}

      {/* 헤더는 팝업 오버레이보다 위 (디자인 141:1286) */}
      <Header lang={lang} onChangeLang={setLang} />
    </Stage>
  )
}
