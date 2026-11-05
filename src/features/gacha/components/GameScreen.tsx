import { useState } from 'react'
import type { StageSummary } from '../api/types'
import MissionClear from './MissionClear'

type Props = {
  regionName: string
  stage: StageSummary
  placeLabel: string
  onBack: () => void
  onGacha: () => void
}

/**
 * 게임하기 화면 자리 (로드맵에서 장소를 누르면 들어옴)
 * 실제 게임(3D 장면·NPC 대화)은 아직 디자인/구현 전이라 비워 둠.
 * 퀘스트 API는 api/client.ts 의 startQuest / chat / phraseCard 로 이미 준비돼 있음
 */
export default function GameScreen({ regionName, stage, placeLabel, onBack, onGacha }: Props) {
  // 게임이 붙으면 미션(퀘스트) 완료 시점에 setCleared(true) 호출 (예: chat 응답 questCompleted === true)
  const [cleared, setCleared] = useState(false)

  return (
    <div className="game-screen" data-stage-id={stage.id}>
      <p className="game-screen__title">
        {regionName} · {placeLabel}
      </p>
      <p className="game-screen__empty">게임하기 화면 (준비 중)</p>
      {/* 임시: 게임 붙기 전까지 미션 완료 연출 확인용 */}
      <button className="abs game-screen__test" onClick={() => setCleared(true)}>
        미션 완료 테스트
      </button>
      <button className="abs game-screen__back" onClick={onBack}>
        ‹ 지도로
      </button>
      {cleared && <MissionClear onGacha={onGacha} />}
    </div>
  )
}
