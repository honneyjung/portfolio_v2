import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Zustand persist 스토어에서 토큰 읽기 (localStorage 사용)
function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('hemily-auth')
    return raw ? (JSON.parse(raw)?.state?.accessToken ?? null) : null
  } catch {
    return null
  }
}

function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem('hemily-auth')
    return raw ? (JSON.parse(raw)?.state?.refreshToken ?? null) : null
  } catch {
    return null
  }
}

function saveNewTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem('hemily-auth')
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.state.accessToken = accessToken
    parsed.state.refreshToken = refreshToken
    localStorage.setItem('hemily-auth', JSON.stringify(parsed))
  } catch {
    // ignore
  }
}

function forceLogout() {
  localStorage.removeItem('hemily-auth')
  if (!window.location.hash.includes('/login')) {
    window.location.hash = '#/login'
  }
}

// 동시에 여러 요청이 401을 받을 때 refresh를 한 번만 시도하기 위한 플래그
let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  pendingQueue = []
}

// 요청 인터셉터 — 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token === '__demo__') {
    // 데모 모드: 백엔드 없이 즉시 404로 실패 처리 (로딩 상태 즉시 해제)
    return Promise.reject(
      Object.assign(new Error('demo-mode'), { response: { status: 404, data: null }, config })
    )
  }
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터 — 401 시 토큰 갱신 후 재시도
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig: InternalAxiosRequestConfig & { _retry?: boolean } = err.config

    const isAuthEndpoint = originalConfig?.url?.includes('/auth/login')
      || originalConfig?.url?.includes('/auth/refresh')

    if (err.response?.status !== 401 || isAuthEndpoint || !originalConfig) {
      return Promise.reject(err)
    }

    // 개발용 프리뷰(mock 토큰)에서는 리다이렉트하지 않음
    const tok = getAccessToken()
    if (tok === 'preview-token' || tok === '__demo__') return Promise.reject(err)

    // 이미 재시도한 요청이 또 401이면 강제 로그아웃
    if (originalConfig._retry) {
      forceLogout()
      return Promise.reject(err)
    }

    if (isRefreshing) {
      // 갱신 중이면 대기열에 추가하고 새 토큰이 오면 재시도
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalConfig.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalConfig))
          },
          reject,
        })
      })
    }

    originalConfig._retry = true
    isRefreshing = true

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      isRefreshing = false
      forceLogout()
      return Promise.reject(err)
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
      )
      const { access_token, refresh_token } = res.data
      saveNewTokens(access_token, refresh_token)
      processQueue(null, access_token)
      originalConfig.headers.Authorization = `Bearer ${access_token}`
      return apiClient(originalConfig)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      forceLogout()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
