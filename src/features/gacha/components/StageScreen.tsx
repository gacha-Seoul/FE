import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { QuestSummary, StageSummary } from '../api/types'
import { DEFAULT_POPUP_MAP, POPUP_MAPS, splitPlace } from '../data/regions'

type Props = {
  userId: number
  stageId: number
  regionName: string
  /** 퀘스트에서 돌아올 때마다 바뀌는 값 → 진행률 다시 조회 */
  refreshKey: number
  onSelectQuest: (quest: QuestSummary, stage: StageSummary) => void
  onBackToGacha: () => void
  onError: (msg: string) => void
}

const STATUS_LABEL: Record<QuestSummary['status'], string> = {
  LOCKED: '잠김',
  AVAILABLE: '시작 가능',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
}

/**
 * 장소 입장 화면 (GET /api/stages/{stageId}?userId=)
 * Figma 2-1이 아직 와이어프레임이라 기존 디자인 톤(한지색 카드, 훈민정음체)으로 구성
 */
export default function StageScreen({
  userId,
  stageId,
  regionName,
  refreshKey,
  onSelectQuest,
  onBackToGacha,
  onError,
}: Props) {
  const [stage, setStage] = useState<StageSummary | null>(null)

  useEffect(() => {
    let alive = true
    api
      .getStage(stageId, userId)
      .then((s) => alive && setStage(s))
      .catch((e) => onError(e.message))
    return () => {
      alive = false
    }
  }, [stageId, userId, refreshKey, onError])

  if (!stage) return <div className="screen-loading">장소 불러오는 중…</div>

  const { title, spot } = splitPlace(stage.place)
  const quests = [...stage.quests].sort((a, b) => a.orderNo - b.orderNo)
  const image = stage.imageUrl ?? (POPUP_MAPS[regionName] ?? DEFAULT_POPUP_MAP).image
  const pct = stage.totalQuests ? (stage.completedQuests / stage.totalQuests) * 100 : 0

  return (
    <div className="stage-screen">
      <aside className="stage-screen__intro">
        <div className="photo-frame">
          <img src={image} alt={stage.place} />
        </div>
        <p className="stage-screen__region">
          {regionName} <span>-{stage.categoryLabel}-</span>
        </p>
        <h1 className="stage-screen__title">
          {title}
          {spot && <small> · {spot}</small>}
        </h1>
        <p className="stage-screen__story">{stage.introStory}</p>
        <div className="progress" aria-label="장소 진행률">
          <div className="progress__bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="progress__text">
            {stage.completedQuests}/{stage.totalQuests} 완료
          </span>
        </div>
      </aside>

      <ol className="quest-list">
        {quests.map((q) => (
          <li key={q.id}>
            <button
              className={`quest-card is-${q.status.toLowerCase()}`}
              disabled={q.status === 'LOCKED'}
              onClick={() => onSelectQuest(q, stage)}
            >
              <span className="quest-card__code">{q.code}</span>
              <span className="quest-card__body">
                <span className="quest-card__title">{q.title}</span>
                <span className="quest-card__npc">{q.npcRole}</span>
                <span className="quest-card__situation">{q.situation}</span>
              </span>
              <span className="quest-card__side">
                <span className="quest-card__status">{STATUS_LABEL[q.status]}</span>
                <span className="quest-card__reward">
                  <img src="/assets/coin.png" alt="" width={18} height={18} />+{q.rewardCoin}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <button className="back-to-gacha" onClick={onBackToGacha}>
        가챠 &gt;
      </button>
    </div>
  )
}
