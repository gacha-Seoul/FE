import { useCallback, useRef, useState } from 'react'

const TICK = 110
const MIN_SPIN = 1800
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 카드 하이라이트 돌리기.
 * API 응답(target 인덱스)이 올 때까지 계속 돌다가 최소 시간 지나면 감속해서 target에 멈춤.
 * target이 null이면(카드에 없는 지역, 실패) 그냥 멈춤.
 */
export function useSpinner(count: number) {
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const running = useRef(false)

  const spin = useCallback(
    async <T>(task: Promise<T>, toIndex: (result: T) => number | null): Promise<T> => {
      if (running.current) throw new Error('already spinning')
      running.current = true
      setSpinning(true)

      let settled = false
      let target: number | null = null
      const guarded = task.then(
        (r) => {
          target = toIndex(r)
          settled = true
          return r
        },
        (e) => {
          settled = true
          throw e
        },
      )
      guarded.catch(() => {}) // 아래에서 다시 await

      const start = Date.now()
      let i = 0
      try {
        while (!(settled && Date.now() - start >= MIN_SPIN)) {
          setHighlightIdx(i % count)
          i++
          await sleep(TICK)
        }
        const t = target as number | null
        if (t !== null && t >= 0) {
          const steps = ((((t - (i % count) + 1) % count) + count) % count) + count
          for (let k = 0; k < steps; k++) {
            setHighlightIdx(i % count)
            i++
            await sleep(TICK + k * 35)
          }
          await sleep(350)
        } else {
          setHighlightIdx(null)
        }
        return await guarded
      } catch (e) {
        setHighlightIdx(null)
        throw e
      } finally {
        running.current = false
        setSpinning(false)
      }
    },
    [count],
  )

  return { highlightIdx, setHighlightIdx, spinning, spin }
}
