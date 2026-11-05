import { Fragment } from 'react'
import type { RegionDetail, StageSummary } from '../api/types'
import { DEFAULT_POPUP_MAP, POPUP_MAPS, splitPlace } from '../data/regions'

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
  const category = (firstOpen ?? stages[0])?.categoryLabel

  const message =
    region.status === 'CONQUERED' || !firstOpen
      ? `“${region.name}를 모두 정복했어! 다시 둘러봐도 좋아”`
      : firstOpen === stages[0]
        ? `“${region.name}의 ${firstOpen.categoryLabel} 퀘스트가 열렸어. 첫 장소를 확인해 봐”`
        : `“다음은 ${splitPlace(firstOpen.place).title}! 계속 가 보자”`

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
          {stages.length === 0 && <p className="places__empty">아직 등록된 장소가 없어요</p>}
          {stages.map((s, i) => {
            const { title, spot } = splitPlace(s.place)
            const selectable = s.cleared || s === firstOpen
            return (
              <Fragment key={s.id}>
                {i > 0 && (
                  <span className="places__arrow" aria-hidden>
                    <span className="places__arrow-inner">
                      <img src="/assets/popup-arrow.svg" alt="" />
                    </span>
                  </span>
                )}
                <button
                  className={`place ${s.cleared ? 'is-cleared' : ''}`}
                  onClick={() => onSelectStage(s)}
                  disabled={!selectable}
                  title={selectable ? undefined : '앞 장소를 먼저 완료해 주세요'}
                >
                  <span className="place__type">{title}</span>
                  <span className="place__divider">
                    <img src="/assets/popup-divider.svg" alt="" />
                  </span>
                  <ul className="place__spots">
                    {spot && <li className="place__spot-main">{spot}</li>}
                    {s.quests
                      .slice()
                      .sort((a, b) => a.orderNo - b.orderNo)
                      .map((q) => (
                        <li key={q.id} className={q.status === 'COMPLETED' ? 'is-done' : ''}>
                          {q.title}
                        </li>
                      ))}
                  </ul>
                  <span className="place__progress">
                    {s.cleared ? '완료' : `${s.completedQuests}/${s.totalQuests}`}
                  </span>
                </button>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
