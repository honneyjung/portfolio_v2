import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import { mypageApi } from '../../lib/api/mypage'
import { useAuthStore } from '../../lib/store/authStore'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

type ReportRow = { report_id?: string; id?: string; created_at?: string }

export default function ReportHistoryPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('mypage')
  const userType = useAuthStore((s) => s.user?.userType)

  const { data: res } = useQuery({
    queryKey: ['mypage', 'reports'],
    queryFn: () => mypageApi.getReports(),
  })
  const rawItems = unwrap<{ items: ReportRow[] }>(res)?.items ?? []

  const sorted = [...rawItems].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
  const items = sorted
    .map((r, i) => ({
      id: r.report_id ?? r.id ?? '',
      date: r.created_at ? r.created_at.slice(0, 10).replace(/-/g, '.') : '',
      no: i + 1,
      isLatest: i === sorted.length - 1,
    }))
    .reverse()

  const careLabel = userType ? t(`reportHistory.careType.${userType}`, { defaultValue: '' }) : ''
  const latestId = items.find((it) => it.isLatest)?.id
  const prevReportId = items.length >= 2 ? items[1]?.id : undefined

  const pageTitle = t('reportHistory.title')

  return (
    <AppShell active="mypage" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{pageTitle}</span>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">

        {/* 모바일 헤더 */}
        <div className="md:hidden">
          <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{pageTitle}</span>} />
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto md:overflow-visible">
          <div className="flex flex-col gap-3 px-5 pt-2 pb-4 md:px-8 md:pt-8 md:pb-8 md:max-w-[804px]">

            {items.length === 0 ? (
              <p className="text-[14px] text-[#94A3B8] text-center py-20">{t('reportHistory.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((it) => (
                  <li key={it.id || it.no}>
                    <button
                      type="button"
                      onClick={() => it.id && navigate(`/report/${it.id}`)}
                      className="w-full bg-[#F8FAFF] rounded-[10px] px-5 py-4 flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-[3px] items-start">
                        <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{it.date}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[16px] font-bold text-[#191919] tracking-[-0.32px]">
                            {it.isLatest
                              ? t('reportHistory.latestItem', { no: String(it.no).padStart(3, '0') })
                              : t('reportHistory.item', { no: String(it.no).padStart(3, '0') })}
                          </p>
                          {it.isLatest && (
                            <span className="bg-[#69BBE4] rounded-full px-2 py-1 text-[12px] text-[#F8FAFF] tracking-[-0.24px] leading-none">
                              {t('reportHistory.latestChip')}
                            </span>
                          )}
                        </div>
                        {careLabel && (
                          <p className="text-[16px] font-medium text-[#555] tracking-[-0.32px]">{careLabel}</p>
                        )}
                      </div>
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                        <path d="M1 1L7 7L1 13" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* 비교 버튼 */}
            {latestId && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/report/${latestId}/comparison${prevReportId ? `?prevId=${prevReportId}` : ''}`)}
                  className="w-full h-[52px] rounded-full text-[16px] font-medium text-[#F8FAFF] tracking-[-0.32px]"
                  style={{ background: 'linear-gradient(179deg, #003E7F 31.5%, #052649 96.7%)' }}
                >
                  {t('reportHistory.compare')}
                </button>
              </div>
            )}

          </div>
        </div>

        <div className="md:hidden">
          <BottomNav active="mypage" />
        </div>
      </div>
    </AppShell>
  )
}
