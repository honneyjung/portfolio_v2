import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import { pointApi } from '../../lib/api/point'
import type { PointWallet, PointTransaction } from '../../types'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

// 타입에 없는 표시 필드(title/subtitle)는 응답에 있으면 방어적으로 추출
function pick(obj: PointTransaction, keys: string[]): string {
  const rec = obj as unknown as Record<string, unknown>
  for (const k of keys) {
    if (typeof rec[k] === 'string' && rec[k]) return rec[k] as string
  }
  return ''
}

export default function PointHistoryPage() {
  const { t } = useTranslation('mypage')

  const { data: walletRes } = useQuery({
    queryKey: ['point', 'wallet'],
    queryFn: () => pointApi.getWallet(),
  })
  const balance = unwrap<PointWallet>(walletRes)?.crm_point_balance ?? 0

  const { data: txRes } = useQuery({
    queryKey: ['point', 'transactions'],
    queryFn: () => pointApi.getTransactions(),
  })
  const txs = unwrap<{ items: PointTransaction[] }>(txRes)?.items ?? []

  const ym = new Date().toISOString().slice(0, 7) // YYYY-MM
  const pendingSum = txs.filter((x) => x.status === 'pending').reduce((s, x) => s + (x.amount ?? 0), 0)
  const monthSum = txs
    .filter((x) => x.status === 'earned' && (x.created_at ?? '').slice(0, 7) === ym)
    .reduce((s, x) => s + (x.amount ?? 0), 0)

  return (
    <AppShell active="mypage" topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('pointHistory.title')}</p>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        {/* 헤더 — 모바일만 (스크롤 시 최상단 고정) */}
        <div className="md:hidden">
          <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{t('pointHistory.title')}</span>} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 md:overflow-visible md:px-8 md:pt-8 md:max-w-[612px]">
          {/* 보유 포인트 — 데스크탑: 네이비 카드 */}
          <div className="md:bg-[#003E7F] md:rounded-[20px] md:px-8 md:py-6 md:flex md:items-center md:justify-between md:text-white">
            <div>
              <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] md:text-[12px] md:font-normal md:text-white/70">{t('pointHistory.balance')}</p>
              <p className="text-[32px] font-bold text-[#191919] mt-1 md:text-[28px] md:text-white md:mt-1">{t('pointHistory.point', { n: balance })}</p>
            </div>

            <div className="border-t border-[#E2E8F0] my-4 md:hidden" />

            {/* 요약 */}
            <div className="flex flex-col gap-[6px] mb-7 md:mb-0 md:gap-1 md:text-right">
              <div className="flex items-center justify-between md:gap-3">
                <span className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] md:text-[12px] md:text-white/60">{t('pointHistory.pending')}</span>
                <span className="text-[18px] font-bold text-[#003E7F] md:text-[13px] md:font-medium md:text-white/80">{t('pointHistory.amount', { n: pendingSum })}</span>
              </div>
              <div className="flex items-center justify-between md:gap-3">
                <span className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] md:text-[12px] md:text-white/60">{t('pointHistory.thisMonth')}</span>
                <span className="text-[18px] font-bold text-[#003E7F] md:text-[13px] md:font-medium md:text-white/80">{t('pointHistory.amount', { n: monthSum })}</span>
              </div>
            </div>
          </div>

          {/* 적립 내역 */}
          <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] mb-3 md:mt-7 md:text-[14px] md:font-bold">{t('pointHistory.historyLabel')}</p>

          {txs.length === 0 ? (
            <p className="text-[14px] text-[#94A3B8] text-center py-8">{t('pointHistory.empty')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {txs.map((tx) => {
                const title = pick(tx, ['title', 'reason', 'description'])
                const subtitle = pick(tx, ['detail', 'source_name', 'challenge_name', 'source'])
                const date = tx.created_at ? tx.created_at.slice(0, 10).replace(/-/g, '.') : ''
                return (
                  <li key={tx.id} className="bg-[#F8FAFF] rounded-[10px] px-5 py-3 md:bg-white md:rounded-[12px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:px-5 md:py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-3 md:gap-1">
                        <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px] md:order-2 md:text-[12px] md:text-[#94A3B8]">{date}</p>
                        <div className="flex flex-col gap-1 md:order-1">
                          {title && <p className="text-[16px] font-bold text-[#191919] tracking-[-0.32px] md:text-[13px]">{title}</p>}
                          {subtitle && <p className="text-[16px] font-medium text-[#555] tracking-[-0.32px] md:text-[12px] md:font-normal md:text-[#64748B]">{subtitle}</p>}
                        </div>
                      </div>
                      <p className="text-[18px] font-bold text-[#003E7F] md:text-[15px] md:text-[#16A34A]">{t('pointHistory.amount', { n: tx.amount ?? 0 })}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  )
}
