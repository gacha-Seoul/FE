import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, IS_MOCK } from '../api/client'
import type { MapResponse, RegionDetail, UserResponse } from '../api/types'

// 목 모드와 실제 서버의 사용자 ID가 섞이지 않게 키를 나눔
const USER_KEY = IS_MOCK ? 'gacha-seoul:userId:mock' : 'gacha-seoul:userId'

const loadUserId = (): number | null => {
  try {
    const v = localStorage.getItem(USER_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}
const saveUserId = (id: number) => {
  try {
    localStorage.setItem(USER_KEY, String(id))
  } catch {
    /* noop */
  }
}

type Boot = { user: UserResponse; demoRegion: RegionDetail | null }

/** StrictMode에서 effect가 두 번 돌아도 사용자 생성·demo/start가 한 번만 호출되도록 모듈 단위로 공유 */
let bootPromise: Promise<Boot> | null = null

function boot(): Promise<Boot> {
  bootPromise ??= (async () => {
    let user: UserResponse
    let demoRegion: RegionDetail | null = null
    const params = new URLSearchParams(window.location.search)

    if (params.has('demo')) {
      const res = await api.demoStart()
      user = { ...res.user, coins: res.gacha.coinsLeft }
      demoRegion = res.gacha.region
      window.history.replaceState(null, '', window.location.pathname) // 새로고침 시 사용자 또 생기지 않게
    } else {
      if (params.has('new')) window.history.replaceState(null, '', window.location.pathname)
      // ?new : 저장된 사용자를 무시하고 새 사용자로 시작 (백엔드 initial-coins 바꾼 뒤 테스트할 때)
      const saved = params.has('new') || IS_MOCK ? null : loadUserId() // 목 모드는 매번 새 사용자
      try {
        if (saved === null) throw new ApiError(404, 'no user')
        user = await api.getUser(saved)
      } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 404) throw e
        user = await api.createUser()
      }
    }
    saveUserId(user.id)
    return { user, demoRegion }
  })().catch((e) => {
    bootPromise = null // 실패하면 다음 마운트에서 다시 시도
    throw e
  })
  return bootPromise
}

/**
 * 게임 진입 시 사용자 준비
 * - 저장된 userId가 있으면 GET /api/users/{id}로 확인, 404면 새로 생성 (demo/reset 후 등)
 * - 없으면 POST /api/users (코인 1개 지급)
 * - 주소에 ?demo 가 있으면 POST /api/demo/start (사용자 생성 + 첫 가챠, 발표용)
 */
export function useSession() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [map, setMap] = useState<MapResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** demo/start 로 시작했을 때 바로 띄울 첫 가챠 결과 */
  const [demoRegion, setDemoRegion] = useState<RegionDetail | null>(null)

  const refreshMap = useCallback(async (userId: number) => {
    const m = await api.getMap(userId)
    setMap(m)
    setUser((u) => (u ? { ...u, coins: m.coins } : u))
    return m
  }, [])

  useEffect(() => {
    let cancelled = false
    boot()
      .then(async ({ user: u, demoRegion: d }) => {
        if (cancelled) return
        if (d) bootPromise = Promise.resolve({ user: u, demoRegion: null }) // 데모 팝업은 한 번만
        setUser(u)
        if (d) setDemoRegion(d)
        await refreshMap(u.id)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '알 수 없는 오류')
      })
    return () => {
      cancelled = true
    }
  }, [refreshMap])

  const setCoins = useCallback((coins: number) => {
    setUser((u) => (u ? { ...u, coins } : u))
    setMap((m) => (m ? { ...m, coins } : m))
  }, [])

  return {
    user,
    map,
    error,
    demoRegion,
    clearDemoRegion: () => setDemoRegion(null),
    refreshMap: () => (user ? refreshMap(user.id) : Promise.resolve(null)),
    setCoins,
  }
}
