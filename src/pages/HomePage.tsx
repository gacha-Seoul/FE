import { Link } from 'react-router-dom'

export default function HomePage() {
  return <main className="shell">
    <header className="topbar"><span>가챠 서울</span><span className="tag">프로젝트 시작 화면</span></header>
    <section className="intro"><p className="eyebrow">LOCAL TO GLOBAL</p>
      <h1>서울의 이야기를<br />따라 걷다.</h1>
      <p>지역의 공간에서 만나고, 이야기하고, 경험하는 K-문화.</p>
      <Link className="button" to="/play/myongji">3D 연결 확인하기 →</Link>
      <p><Link to="/play/market">전통시장 3D 게임 플레이 →</Link></p>
      <p><Link to="/review/market">Q5 · 전통시장 회화 복습하기 →</Link></p>
    </section>
    <section className="cards" aria-label="구현 준비 상태">
      <article><span>01</span><h2>화면</h2><p>Figma를 기준으로 가챠·지역 지도·퀘스트 화면을 구현할 자리입니다.</p></article>
      <article><span>02</span><h2>게임 공간</h2><p>Three.js 연결을 확인하는 테스트 장면입니다. 실제 지역 맵은 아직 연결하지 않았습니다.</p></article>
      <article><span>03</span><h2>퀘스트</h2><p>이동·NPC 대화·완료·보상을 연결할 상태와 데이터 형식을 준비했습니다.</p></article>
    </section>
  </main>
}
