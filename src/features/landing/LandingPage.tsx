import { useState } from 'react'
import { Link } from 'react-router-dom'
import GachaMachine from '../gacha/components/GachaMachine'
import { REGION_CARDS } from '../gacha/data/regions'
import { COPY, type Lang } from './copy'
import '../gacha/gacha.css'
import './landing.css'

const LANG_KEY = 'gacha-seoul:lang'
const loadLang = (): Lang => {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ko'
  } catch {
    return 'ko'
  }
}

/**
 * 랜딩 페이지. Figma에 랜딩 프레임이 없어서 gui 페이지(1-1, 1-2)의
 * 색·폰트·전통 문양·가챠 기계·도깨비불 캐릭터를 재사용해 구성
 */
export default function LandingPage() {
  const [lang, setLangState] = useState<Lang>(loadLang)
  const [shaking, setShaking] = useState(false)
  const t = COPY[lang]

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="gacha-app lp" lang={lang}>
      {/* ── 상단 바 (gui 68:175 헤더와 같은 톤) ── */}
      <header className="lp-nav">
        <Link to="/" className="lp-nav__logo">
          가챠 서울
        </Link>
        <nav className="lp-nav__links">
          <a href="#how">{t.nav.how}</a>
          <a href="#regions">{t.nav.regions}</a>
          <a href="#quest">{t.nav.quest}</a>
        </nav>
        <div className="lp-nav__right">
          <div className="lp-lang">
            <button className={lang === 'ko' ? 'is-active' : ''} onClick={() => setLang('ko')}>
              한국어
            </button>
            <span>|</span>
            <button className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>
              EN
            </button>
          </div>
          <Link to="/gacha" className="lp-btn lp-btn--small">
            {t.nav.start}
          </Link>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section className="lp-hero">
        <img className="lp-deco lp-deco--left" src="/assets/deco-left.png" alt="" aria-hidden />
        <img className="lp-deco lp-deco--right" src="/assets/deco-right.png" alt="" aria-hidden />
        <img className="lp-cloud lp-cloud--a" src="/assets/cloud-10.svg" alt="" aria-hidden />
        <img className="lp-cloud lp-cloud--b" src="/assets/cloud-13.svg" alt="" aria-hidden />

        <div className="lp-hero__text">
          <p className="lp-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="lp-hero__title">
            {t.hero.title[0]}
            <br />
            <em>{t.hero.title[1]}</em>
          </h1>
          <p className="lp-hero__body">{t.hero.body}</p>
          <div className="lp-hero__actions">
            <Link
              to="/gacha"
              className="lp-btn"
              onMouseEnter={() => setShaking(true)}
              onMouseLeave={() => setShaking(false)}
            >
              {t.hero.cta}
            </Link>
          </div>
          <p className="lp-coin">
            <img src="/assets/coin.png" alt="" width={22} height={22} />
            {t.hero.coin}
          </p>
        </div>

        <div className="lp-hero__machine" aria-hidden>
          {/* GachaMachine은 1280x832 프레임 좌표를 쓰므로 기계 위치(201,170)만큼 당겨서 배치 */}
          <div className="lp-hero__machine-inner">
            <GachaMachine spinning={shaking} />
          </div>
          <img className="lp-hero__character" src="/assets/character.svg" alt="" />
        </div>
      </section>

      {/* ── 플레이 방법 ── */}
      <section id="how" className="lp-section">
        <h2 className="lp-h2">{t.how.title}</h2>
        <ol className="lp-steps">
          {t.how.steps.map((s, i) => (
            <li key={s.title} className="lp-paper">
              <span className="lp-steps__no">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 지역 (gui 1-1 카드 + 지도) ── */}
      <section id="regions" className="lp-section lp-regions">
        <div className="lp-regions__text">
          <h2 className="lp-h2">{t.regions.title}</h2>
          <p className="lp-lead">{t.regions.body}</p>
          <ul className="lp-region-cards">
            {REGION_CARDS.map((c) => (
              <li key={c.name}>
                <img src={c.cardImage} alt="" />
                <span className="lp-region-cards__dim" />
                <span className="lp-region-cards__cat">{c.category}</span>
                <span className="lp-region-cards__name">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lp-map">
          <img className="lp-map__img" src="/assets/seoul-map.png" alt="서울 지도" />
          {REGION_CARDS.map((c, i) => (
            <img
              key={c.name}
              className="lp-map__pin"
              src="/assets/map-pin.svg"
              alt={c.name}
              style={{
                left: `${((c.pin.x - 11.679 + 10.3) / 457.45) * 100}%`,
                top: `${((c.pin.y - 11.679 + 24) / 417.64) * 100}%`,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── 퀘스트 미리보기 (API 전통시장 Q01~Q04) ── */}
      <section id="quest" className="lp-section lp-quest">
        <div>
          <h2 className="lp-h2">{t.quest.title}</h2>
          <p className="lp-lead">{t.quest.body}</p>
          <ol className="lp-quest__list">
            {t.quest.steps.map((s, i) => (
              <li key={s} className="lp-paper">
                <span>Q0{i + 1}</span>
                {s}
                <span className="lp-quest__reward">
                  <img src="/assets/coin.png" alt="" width={16} height={16} />
                  +1
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lp-chat" aria-label="대화 예시">
          <p className="lp-chat__name">{t.quest.npc}</p>
          <p className="lp-chat__bubble is-npc">{t.quest.chat.npc}</p>
          <p className="lp-chat__bubble is-me">{t.quest.chat.me}</p>
          <div className="lp-chat__fix">
            <s>{t.quest.chat.me}</s> → <b>{t.quest.chat.better}</b>
          </div>
          <p className="lp-chat__tip">
            <strong>TIP</strong> {t.quest.chat.tip}
          </p>
        </div>
      </section>

      {/* ── 마지막 CTA ── */}
      <section className="lp-final">
        <img className="lp-final__character" src="/assets/character.svg" alt="" aria-hidden />
        <h2>{t.final.title}</h2>
        <Link to="/gacha" className="lp-btn">
          {t.final.cta}
        </Link>
      </section>

      <footer className="lp-footer">{t.footer}</footer>
    </div>
  )
}
