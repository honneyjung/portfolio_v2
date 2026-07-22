import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../lib/api/auth'
import type { RegisterRequest } from '../lib/api/auth'
import { useAuthStore } from '../lib/store/authStore'
import apiClient from '../lib/api/client'

const DEMO_USER = 'hemily_test'
const DEMO_PASS = 'Hemily123!'

// ── useLogin ────────────────────────────────────────────
export function useLogin() {
  const navigate     = useNavigate()
  const setAuth      = useAuthStore((s) => s.setAuth)
  const queryClient  = useQueryClient()

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => {
      if (username === DEMO_USER && password === DEMO_PASS) {
        return Promise.resolve({ access_token: '__demo__', refresh_token: '' })
      }
      return authApi.login({ userid: username, password }).then((r) => r.data)
    },

    onSuccess: async (tokens) => {
      if (tokens.access_token === '__demo__') {
        setAuth(
          { id: DEMO_USER, name: '테스트 계정', email: '', userType: 'cancer', pointCfw: 0, createdAt: '2026-07-20' },
          tokens.access_token,
        )
        queryClient.clear()
        navigate('/', { replace: true })
        return
      }
      let careType: string | null = null
      let isHemilian = false
      try {
        // 토큰이 아직 스토어에 저장되기 전이므로 헤더에 직접 전달
        const headers = { Authorization: `Bearer ${tokens.access_token}` }
        const [meRes, profileRes] = await Promise.all([
          apiClient.get('/auth/me', { headers }).then((r) => r.data),
          apiClient.get('/users/me', { headers }).then((r) => r.data).catch(() => null),
        ])
        // /users/me 는 ApiResponse<User> 구조 { success, data: User } 로 반환
        // data 안쪽을 우선 접근하고 없으면 최상위 fallback
        const profile = profileRes?.data ?? profileRes
        careType = profile?.care_type ?? null
        const accountType: string = profile?.account_type ?? 'general'
        isHemilian = accountType === 'hemilian'
        const userType =
          accountType === 'hemilian' ? 'hemilian'
          : careType === 'cancer'   ? 'cancer'
          : careType === 'chronic'  ? 'chronic'
          : 'normal'
        setAuth(
          { ...meRes, id: meRes.user_id, name: profile?.name ?? meRes.name ?? '', userType },
          tokens.access_token,
          tokens.refresh_token,
        )
      } catch {
        setAuth(
          { id: '', name: '', email: '', userType: 'normal', pointCfw: 0, createdAt: '' },
          tokens.access_token,
          tokens.refresh_token,
        )
      }
      // 이전 사용자의 캐시가 남아있을 수 있으므로 전체 초기화
      queryClient.clear()
      // care_type 설정 또는 hemilian 계정 → 홈, 미설정 → 설문
      navigate(careType || isHemilian ? '/' : '/survey', { replace: true })
    },
  })
}

// ── useLogout ───────────────────────────────────────────
export function useLogout() {
  const navigate     = useNavigate()
  const logout       = useAuthStore((s) => s.logout)
  const queryClient  = useQueryClient()

  return useMutation({
    mutationFn: () => {
      // refresh_token은 Zustand persist에서 꺼내거나 없으면 빈 문자열로 처리
      const raw          = localStorage.getItem('hemily-auth')
      const refreshToken = raw ? (JSON.parse(raw)?.state?.refreshToken ?? '') : ''
      return authApi.logout(refreshToken).catch(() => {})  // 실패해도 로컬 초기화는 진행
    },
    onSettled: () => {
      queryClient.clear()
      logout()
      navigate('/login', { replace: true })
    },
  })
}

// ── useRegister ─────────────────────────────────────────
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      authApi.register(data).then((r) => r.data),
  })
}
