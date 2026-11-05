import type { RegionDetail, StageSummary } from '../api/types'
import { ROADMAP_LABELS, ROADMAP_MAPS, ROADMAP_SPOTS } from '../data/roadmap'
import { DESIGN_CATEGORY, splitPlace } from '../data/regions'

type Props = {
  region: RegionDetail
  coins: number
  message: string
  onSelectStage: (stage: StageSummary) => void
  onBackToGacha: () => void
}

/**
 * 로드맵(2-1) — Figma 최종 GUI 164:4693
 * - 장소 4개를 진행 순서대로 길 위에 배치, 완료했거나 지금 할 차례인 장소만 열림(나머지는 흐리게 + 자물쇠)
 * - 캐릭터는 지금 할 차례인 장소 옆에 표시
 */
export default function Roadmap({ region, coins, message, onSelectStage, onBackToGacha }: Props) {
  const stages = [...region.stages].sort((a, b) => a.orderNo - b.orderNo).slice(0, ROADMAP_SPOTS.length)
  const firstOpenIdx = stages.findIndex((s) => !s.cleared)
  const currentIdx = firstOpenIdx < 0 ? stages.length - 1 : firstOpenIdx
  const labels = ROADMAP_LABELS[region.name] ?? stages.map((s) => splitPlace(s.place).title)
  const mapInfo = ROADMAP_MAPS[region.name] ?? { image: '/assets/seoul-map.png', pin: null }
  const category = DESIGN_CATEGORY[region.name] ?? stages[currentIdx]?.categoryLabel ?? stages[0]?.categoryLabel
  const charPos = ROADMAP_SPOTS[Math.max(currentIdx, 0)].character

  return (
    <div className="roadmap">
      <div className="abs roadmap__road" aria-hidden>
        <img src="/assets/roadmap-road.png" alt="" />
      </div>
      <img
        className="abs"
        src="/assets/cloud-10.svg"
        alt=""
        style={{ left: 56.5, top: 310.5, width: 123.96, height: 49 }}
      />
      <img
        className="abs"
        src="/assets/cloud-11.svg"
        alt=""
        style={{ left: 578.84, top: 310.84, width: 107.06, height: 42.32 }}
      />
      <img
        className="abs"
        src="/assets/cloud-13.svg"
        alt=""
        style={{ left: 529.6, top: 561.2, width: 135.2, height: 50.8, transform: 'scaleX(-1)' }}
      />

      {/* 왼쪽: 지역명 + 안내 배너 + 지역 지도 */}
      <div className="roadmap__title">
        <span className="roadmap__region">{region.name}</span>
        {category && <span className="roadmap__category">-{category}-</span>}
      </div>
      <div className="roadmap__banner">
        <img src="/assets/roadmap-banner.png" alt="" />
        <p>{message}</p>
      </div>
      <div className="roadmap__map">
        <img className="roadmap__map-img" src={mapInfo.image} alt={`${region.name} 지도`} />
        <span className="map__dim" />
        {mapInfo.pin && (
          <img
            className="roadmap__pin"
            src="/assets/roadmap-pin.svg"
            alt=""
            style={{ left: mapInfo.pin.x, top: mapInfo.pin.y }}
          />
        )}
      </div>

      <div className="coin roadmap__coin">
        <img src="/assets/coin.png" alt="" width={26} height={26} />
        <span>{coins}냥</span>
      </div>

      {/* 장소 4개 */}
      {ROADMAP_SPOTS.map((spot, i) => {
        const stage = stages[i]
        const open = !!stage && (stage.cleared || i === firstOpenIdx)
        const label = labels[i] ?? '준비 중'
        return (
          <button
            key={i}
            className={`roadmap__spot ${open ? 'is-open' : 'is-locked'} ${stage?.cleared ? 'is-cleared' : ''}`}
            disabled={!open}
            onClick={() => stage && onSelectStage(stage)}
            aria-label={`${i + 1}. ${label}${open ? '' : ' (잠김)'}`}
          >
            <span
              className="abs roadmap__icon"
              style={{ left: spot.icon.left, top: spot.icon.top, width: spot.icon.w, height: spot.icon.h }}
            >
              <img
                src="/assets/roadmap-places.png"
                alt=""
                style={{ width: spot.crop.w, height: spot.crop.h, left: spot.crop.left, top: spot.crop.top }}
              />
            </span>
            <span className="abs roadmap__badge" style={{ left: spot.badge.left, top: spot.badge.top }}>
              {i + 1}
            </span>
            {!open && spot.lock && (
              <img
                className="abs roadmap__lock"
                src="/assets/roadmap-lock.svg"
                alt=""
                style={{ left: spot.lock.left, top: spot.lock.top }}
              />
            )}
            <span className="abs roadmap__label" style={{ left: spot.label.left, top: spot.label.top }}>
              {label}
            </span>
          </button>
        )
      })}

      {/* 캐릭터: 지금 할 차례인 장소 옆 (디자인은 좌우 반전) */}
      <img
        className="abs roadmap__character"
        src="/assets/character.svg"
        alt=""
        style={{
          left: charPos.left - 11.54,
          top: charPos.top - 18.78,
          width: 232.68,
          height: 223.78,
          transform: `scale(${charPos.scale}) scaleX(-1)`,
        }}
      />

      <button className="abs roadmap__back" onClick={onBackToGacha} aria-label="가챠 화면으로">
        <img src="/assets/roadmap-back.png" alt="" />
      </button>
    </div>
  )
}
