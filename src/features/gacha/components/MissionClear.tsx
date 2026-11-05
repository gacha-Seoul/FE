import { useMemo, type CSSProperties } from 'react'

type Props = {
  /** 가운데 문구. 기본 '미션 완료!' */
  title?: string
  onGacha: () => void
}

const COLORS = ['#f95452', '#e2cfa3', '#ffc93c', '#5aa9f8', '#8fd18a', '#c78bd8']

/**
 * 미션 완료 팡파레 — Figma 최종 GUI '미션 완료'(171:5776)
 * 어두운 오버레이 + 양쪽 색종이 + 갓 쓴 도깨비불 + '미션 완료!' + 가챠 화면으로
 * 디자인 색종이 이미지에 더해 떨어지는 색종이 조각을 CSS로 뿌려 팡파레 느낌을 줌
 */
export default function MissionClear({ title = '미션 완료!', onGacha }: Props) {
  // 떨어지는 색종이 조각 (매번 같은 배치가 되도록 렌더 시 한 번만 생성)
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 1280,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.8,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
        color: COLORS[i % COLORS.length],
        w: 8 + Math.random() * 8,
        h: 12 + Math.random() * 10,
      })),
    [],
  )

  return (
    <div className="mission-clear" role="dialog" aria-modal aria-label={title}>
      <div className="mission-clear__dim" />

      <div className="mission-clear__falling" aria-hidden>
        {pieces.map((p, i) => (
          <span
            key={i}
            style={
              {
                left: p.left,
                width: p.w,
                height: p.h,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                '--r': `${p.rotate}deg`,
                '--dx': `${p.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <img className="abs mission-clear__confetti is-left" src="/assets/clear-confetti-left.png" alt="" />
      <img className="abs mission-clear__confetti is-right" src="/assets/clear-confetti-right.png" alt="" />
      <img className="abs mission-clear__character" src="/assets/clear-character.png" alt="" />
      <p className="abs mission-clear__title">{title}</p>

      <button className="abs roadmap__back mission-clear__back" onClick={onGacha} aria-label="가챠 화면으로">
        <img src="/assets/roadmap-back.png" alt="" />
      </button>
    </div>
  )
}
