import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import GameCanvas from '../features/game/components/GameCanvas'
import { useGameStore } from '../features/game/store/gameStore'
import { places } from '../features/game/data/places'

export default function GamePage() {
  const { placeId = '' } = useParams()
  const place = places[placeId]
  const phase = useGameStore(s => s.phase)
  const prepare = useGameStore(s => s.prepare)
  const start = useGameStore(s => s.start)
  const leave = useGameStore(s => s.leave)
  useEffect(() => { if (place) prepare(place.id); return leave }, [place, prepare, leave])
  if (!place) return <main className="shell"><h1>아직 준비되지 않은 장소예요.</h1><Link to="/">돌아가기</Link></main>
  return <main className="game-page">
    <GameCanvas active={phase === 'exploring'} />
    <header className="game-header"><Link to="/">← 돌아가기</Link><span>{place.name}</span></header>
    <div className="scene-label">3D 연결 테스트 · 실제 지역 맵 연결 전</div>
    {phase === 'ready' && <section className="game-dialog" aria-labelledby="game-title">
      <p className="eyebrow">SCENE PREVIEW</p><h1 id="game-title">게임 공간 준비 완료</h1>
      <p>테스트 장면에서 화면과 3D 연결을 확인하세요. 시작한 뒤 드래그로 회전하고 스크롤로 확대할 수 있어요.</p>
      <button className="button" onClick={start}>시작하기</button>
    </section>}
    {phase === 'exploring' && <p className="game-help">드래그: 회전 · 스크롤: 확대 / 축소</p>}
  </main>
}
