import type { MapRegion } from '../api/types'
import { REGION_CARDS } from '../data/regions'

type Props = {
  coins: number
  highlightIdx: number | null
  /** 이름 → 서버 지도 상태 (GET /api/users/{id}/map) */
  regionsByName: Record<string, MapRegion>
  spinning: boolean
  /** 해금된 지역 카드를 누르면 지역 팝업 다시 열기 */
  onOpenRegion: (region: MapRegion) => void
}

// node 135:1027 — 카피 + 코인 + 후보 카드 5개 + 서울 지도
export default function RegionBoard({ coins, highlightIdx, regionsByName, spinning, onOpenRegion }: Props) {
  return (
    <section className="board">
      <div className="board__top">
        <div className="board__head">
          <p className="board__copy">
            “서울에서 만나는 K-문화,
            <br />
            어디에서 시작할지 랜덤으로 뽑아보세요”
          </p>
          <div className="coin">
            <img src="/assets/coin.png" alt="" width={26} height={26} />
            <span>{coins}냥</span>
          </div>
        </div>

        <ul className="cards">
          {REGION_CARDS.map((c, i) => {
            const server = regionsByName[c.name]
            const status = server?.status ?? 'LOCKED'
            const openable = !spinning && status !== 'LOCKED'
            return (
              <li
                key={c.name}
                className={`card ${highlightIdx === i ? 'is-active' : ''} ${server && !server.playable ? 'is-unplayable' : ''}`}
              >
                <button
                  className="card__btn"
                  disabled={!openable}
                  onClick={() => server && onOpenRegion(server)}
                  aria-label={`${c.category} ${c.name}`}
                >
                  <img className="card__bg" src={c.cardImage} alt="" />
                  <span className="card__dim" />
                  <span className="card__category">{c.category}</span>
                  <span className="card__name">{c.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="map">
        <img className="map__img" src="/assets/seoul-map.png" alt="서울 지도" />
        <span className="map__dim" />
        {REGION_CARDS.map((c, i) => {
          return (
            <img
              key={c.name}
              className={`map__pin ${highlightIdx === i ? 'is-active' : ''}`}
              src="/assets/map-pin.svg"
              alt={c.name}
              style={{ left: c.pin.x, top: c.pin.y }}
            />
          )
        })}
      </div>
    </section>
  )
}
