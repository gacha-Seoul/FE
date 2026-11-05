import { useEffect, useState, type ReactNode } from 'react'

/** Figma 프레임(1280 x 832)을 그대로 두고 화면 크기에 맞춰 확대/축소 */
export const STAGE_W = 1280
export const STAGE_H = 832

export default function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="gacha-app stage-viewport">
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
