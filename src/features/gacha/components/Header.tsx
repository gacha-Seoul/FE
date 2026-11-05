import { Link } from 'react-router-dom'

type Props = { lang: 'ko' | 'en'; onChangeLang: (l: 'ko' | 'en') => void }

// node 68:175
export default function Header({ lang, onChangeLang }: Props) {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        Logo
      </Link>
      <div className="header__lang">
        <button className={lang === 'ko' ? 'is-active' : ''} onClick={() => onChangeLang('ko')}>
          한국어
        </button>
        <span className="header__sep">|</span>
        <button className={lang === 'en' ? 'is-active' : ''} onClick={() => onChangeLang('en')}>
          EN
        </button>
      </div>
    </header>
  )
}
