import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
const GamePage = lazy(() => import('../pages/GamePage'))
const ReviewPage = lazy(() => import('../pages/ReviewPage'))

export default function App() {
  return <Suspense fallback={<main className="loading">장면을 불러오고 있어요…</main>}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/play/:placeId" element={<GamePage />} />
      <Route path="/review/market" element={<ReviewPage />} />
      <Route path="*" element={<main className="shell"><h1>길을 다시 찾아볼까요?</h1><Link to="/">처음으로</Link></main>} />
    </Routes>
  </Suspense>
}
