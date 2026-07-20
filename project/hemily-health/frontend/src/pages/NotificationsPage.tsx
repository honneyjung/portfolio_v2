import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import AppShell from '../components/layout/AppShell'
import Header from '../components/layout/Header'
import { notificationApi } from '../lib/api/notification'
import type { Notification } from '../types'

// { success, data } 래퍼 / flat 모두 방어적으로 언랩
function unwrap<T>(res: { data: unknown }): T | undefined {
  const body = res?.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

// 상대 시간 (방금 / N분 전 / N시간 전 / 어제 / N일 전 / 날짜)
function relativeTime(iso: string, t: TFunction<'notification'>): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return t('time.now')
  if (min < 60) return t('time.minute', { n: min })
  const hour = Math.floor(min / 60)
  if (hour < 24) return t('time.hour', { n: hour })
  const day = Math.floor(hour / 24)
  if (day === 1) return t('time.yesterday')
  if (day < 7) return t('time.day', { n: day })
  return iso.slice(0, 10).replace(/-/g, '.')
}

// 알림 제목/본문 추출 (백엔드 flat 필드 우선, 구버전 data/type 폴백)
function getTitle(n: Notification, t: TFunction<'notification'>): string {
  if (n.title) return n.title
  const data = (n.data ?? {}) as Record<string, unknown>
  if (typeof data.title === 'string' && data.title) return data.title
  const mapped = t(`type.${n.notification_type ?? n.type}`, { defaultValue: '' })
  return mapped || t('type.default')
}
function getBody(n: Notification): string {
  if (n.body) return n.body
  const data = (n.data ?? {}) as Record<string, unknown>
  for (const k of ['message', 'body', 'content']) {
    if (typeof data[k] === 'string' && data[k]) return data[k] as string
  }
  return ''
}

export default function NotificationsPage() {
  const { t } = useTranslation('notification')
  const qc = useQueryClient()
  const navigate = useNavigate()

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // 알림 클릭 — 읽음 처리 후 link_url이 있으면 이동
  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id)
    if (n.link_url) navigate(n.link_url)
  }

  const { data: res } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getList(),
  })
  const notifications = res ? unwrap<{ items: Notification[] }>(res)?.items ?? [] : []

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadBtn = (
    <button
      type="button"
      onClick={() => markAllRead.mutate()}
      disabled={markAllRead.isPending || notifications.every((n) => n.is_read)}
      className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] disabled:opacity-40 md:text-[13px] md:text-[#64748B]"
    >
      {t('markAllRead')}
    </button>
  )

  return (
    <AppShell
      active="mypage"
      topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('title')}</p>}
      topbarRight={markAllReadBtn}
    >
      <div className="flex-1 flex flex-col bg-[#F1F5F9] md:overflow-visible">
        {/* 헤더 — 모바일만 (스크롤 시 최상단 고정) */}
        <div className="md:hidden">
          <Header
            showBack
            title={<span className="text-[18px] font-bold text-[#1E293B]">{t('title')}</span>}
            right={
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || notifications.every((n) => n.is_read)}
                className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] disabled:opacity-40"
              >
                {t('markAllRead')}
              </button>
            }
          />
        </div>

        {/* 목록 */}
        {notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-[14px] text-[#94A3B8]">{t('empty')}</p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto px-5 pt-1 pb-6 flex flex-col gap-3 md:overflow-visible md:px-8 md:pt-8 md:max-w-[912px]">
            {notifications.map((n) => {
              const body = getBody(n)
              return (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`bg-[#F8FAFF] rounded-[10px] p-4 md:bg-white md:rounded-[12px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:p-5 ${
                    n.link_url ? 'cursor-pointer' : ''
                  } ${n.is_read ? '' : 'border-[0.5px] border-[#5BA3D9]'}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[16px] font-bold text-[#191919] tracking-[-0.32px] md:text-[13px]">{getTitle(n, t)}</p>
                    <p className="text-[14px] font-normal text-[#C5C5C5] tracking-[-0.14px] flex-none ml-2 md:text-[11px] md:text-[#94A3B8]">
                      {relativeTime(n.created_at, t)}
                    </p>
                  </div>
                  {body && (
                    <p className="mt-2 text-[16px] font-medium text-[#191919] tracking-[-0.32px] line-clamp-2 md:mt-1.5 md:text-[12px] md:font-normal md:text-[#64748B]">
                      {body}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
