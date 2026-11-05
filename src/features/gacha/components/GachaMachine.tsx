import MachineArtwork from './MachineArtwork'

/**
 * 가챠 기계 + 캡슐 (node 103:926 + 캡슐 Group 27~39)
 * 캡슐 위에 반투명 유리와 금속 레이어를 피그마 순서대로 배치
 * 좌표는 메인 프레임(1280x832) 기준 Figma 값 그대로
 */
type Capsule = {
  src: string
  left: number
  top: number
  boxW: number
  boxH: number
  rotate: number
}

const CAPSULES: Capsule[] = [
  { src: 'capsule-30', left: 215, top: 365, boxW: 100.482, boxH: 100.594, rotate: 34.84 },
  { src: 'capsule-28', left: 287.67, top: 424.95, boxW: 100.66, boxH: 100.55, rotate: -54.95 },
  { src: 'capsule-35', left: 347, top: 349, boxW: 96.981, boxH: 96.78, rotate: -116.53 },
  { src: 'capsule-35', left: 264, top: 259, boxW: 96.981, boxH: 96.78, rotate: -116.53 },
  { src: 'capsule-34', left: 285, top: 364, boxW: 96.037, boxH: 96.252, rotate: 154.73 },
  { src: 'capsule-36', left: 233, top: 305, boxW: 100.072, boxH: 99.943, rotate: 56.73 },
  { src: 'capsule-38', left: 379, top: 272, boxW: 104.921, boxH: 103.124, rotate: 56.73 },
  { src: 'capsule-34', left: 314, top: 293, boxW: 96.037, boxH: 96.252, rotate: 154.73 },
  { src: 'capsule-32', left: 341.25, top: 422.24, boxW: 99.272, boxH: 99.42, rotate: -148.43 },
  { src: 'capsule-32', left: 402, top: 339, boxW: 99.272, boxH: 99.42, rotate: -148.43 },
  { src: 'capsule-31', left: 391, top: 415, boxW: 100.66, boxH: 100.55, rotate: -54.95 },
]

export default function GachaMachine({ spinning }: { spinning: boolean }) {
  return (
    <>
      <img
        className="abs"
        src="/assets/machine-shadow.svg"
        alt=""
        style={{ left: 95, top: 739 }}
      />

      <div className={`capsules ${spinning ? 'is-spinning' : ''}`}>
        <img
          className="abs"
          src="/assets/capsule-27.svg"
          alt=""
          style={{ left: 238, top: 435 }}
        />
        {CAPSULES.map((c, i) => (
          <div
            key={i}
            className="abs capsule"
            style={{ left: c.left, top: c.top, width: c.boxW, height: c.boxH, animationDelay: `${i * 37}ms` }}
          >
            <img
              src={`/assets/${c.src}.svg`}
              alt=""
              style={{ transform: `rotate(${c.rotate}deg)` }}
            />
          </div>
        ))}
      </div>

      <div className={`machine-artwork ${spinning ? 'is-spinning' : ''}`} role="img" aria-label="가챠 기계">
        <MachineArtwork />
      </div>
    </>
  )
}
