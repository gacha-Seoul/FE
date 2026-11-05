type Props = {
  remaining: number
  canDraw: boolean
  spinning: boolean
  /** 버튼이 꺼진 이유 (툴팁) */
  reason?: string
  onDraw: () => void
}

// node 103:1121 — 뽑기 횟수 + 가챠 뽑기 버튼
export default function DrawPanel({ remaining, canDraw, spinning, reason, onDraw }: Props) {
  return (
    <div className="draw-panel">
      <p className="draw-panel__count">뽑기 횟수: {remaining}회</p>
      <button className="draw-button" onClick={onDraw} disabled={!canDraw} title={reason}>
        <img src="/assets/gacha-button-bg.png" alt="" />
        <span>{spinning ? '뽑는 중…' : '가챠 뽑기'}</span>
      </button>
      {reason && !spinning && <p className="draw-panel__reason">{reason}</p>}
    </div>
  )
}
