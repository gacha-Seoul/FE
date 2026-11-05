import { Fragment } from 'react'
import type { RegionDetail, StageSummary } from '../api/types'
import {
  DEFAULT_POPUP_MAP,
  POPUP_MAPS,
  POPUP_PLACES,
  DESIGN_CATEGORY,
  regionMessage,
  splitPlace,
} from '../data/regions'

type Props = {
  region: RegionDetail
  /** 장소 카드 클릭 → 장소 화면 */
  onSelectStage: (stage: StageSummary) => void
  onClose: () => void
}

// node 141:1286 (오버레이) + 146:1688 (말풍선 팝업) — 데이터는 RegionDetail (가챠 응답 / GET /api/regions/{id})
export default function QuestPopup({ region, onSelectStage, onClose }: Props) {
  const stages = [...region.stages].sort((a, b) => a.orderNo - b.orderNo)
  const firstOpen = stages.find((s) => !s.cleared)
  const mapInfo = POPUP_MAPS[region.name] ?? DEFAULT_POPUP_MAP
  const category = DESIGN_CATEGORY[region.name] ?? (firstOpen ?? stages[0])?.categoryLabel
  // 디자인 카드가 있으면 그대로, 없으면 서버 stage로 같은 모양 카드 생성
  const cards =
    POPUP_PLACES[region.name] ??
    stages.map((st) => {
      const { title, spot } = splitPlace(st.place)
      return { type: title, spots: [spot ?? st.place] }
    })

  const message = regionMessage(region)

  return (
    <div className="overlay" role="dialog" aria-modal aria-label={`${region.name} 퀘스트`} onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <img className="popup__bubble" src="/assets/popup-bubble.svg" alt="" />

        <div className="popup__map">
          <img className="popup__map-img" src={mapInfo.image} alt={`${region.name} 지도`} />
          <span className="map__dim" />
          {mapInfo.pin && (
            <img
              className="popup__pin"
              src="/assets/popup-pin.svg"
              alt=""
              style={{ left: mapInfo.pin.x, top: mapInfo.pin.y }}
            />
          )}
        </div>

        <div className="popup__text">
          <p className="popup__message">{message}</p>
          <div className="popup__title">
            <span className="popup__region">{region.name}</span>
            {category && <span className="popup__category">-{category}-</span>}
          </div>
        </div>

        <div className="places">
          {cards.length === 0 && <p className="places__empty">아직 등록된 장소가 없어요</p>}
          {cards.map((card, i) => {
            const stage: StageSummary | undefined = stages[i]
            const selectable = !!stage && (stage.cleared || stage === firstOpen)
            return (
              <Fragment key={card.type}>
                {i > 0 && (
                  <span className="places__arrow" aria-hidden>
                    <span className="places__arrow-inner">
                      <img src="/assets/popup-arrow.svg" alt="" />
                    </span>
                  </span>
                )}
                <button
                  className="place"
                  onClick={() => stage && onSelectStage(stage)}
                  disabled={!selectable}
                  title={!stage ? '준비 중인 장소예요' : selectable ? undefined : '앞 장소를 먼저 완료해 주세요'}
                >
                  <span className="place__type">{card.type}</span>
                  <span className="place__divider">
                    <img src="/assets/popup-divider.svg" alt="" />
                  </span>
                  <ul className="place__spots">
                    {card.spots.map((spot) => (
                      <li key={spot}>{spot}</li>
                    ))}
                  </ul>
                </button>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
