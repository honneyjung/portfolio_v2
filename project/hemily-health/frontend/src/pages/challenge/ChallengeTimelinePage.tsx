import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import { challengeApi } from '../../lib/api/challenge'
import { recognitionApi } from '../../lib/api/recognition'
import type { ChallengeTimelineResponse, ChallengeTimelineItem } from '../../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

const ROUTINE_LABELS: Record<string, string> = {
  PRODUCT: '영양제',
  WATER: '물',
  MEAL: '식사',
  EXERCISE: '운동',
  SLEEP: '수면',
  CONDITION: '컨디션',
  GRATITUDE: '감사일기',
  INNER_REFLECTION: '내면성찰',
}

function formatDate(d: string): string {
  return d.slice(0, 10).replace(/-/g, '.')
}

// 인증 필요한 이미지 → blob으로 받아 objectURL로 표시
function RecognitionPhoto({ jobId }: { jobId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    recognitionApi
      .getImageBlob(jobId)
      .then((res) => {
        if (!active) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [jobId])

  return (
    <div className="w-[72px] h-[72px] rounded-[8px] bg-[#E2E8F0] overflow-hidden flex-shrink-0">
      {url && <img src={url} alt="인증샷" className="w-full h-full object-cover" />}
    </div>
  )
}

function DayCard({ item }: { item: ChallengeTimelineItem }) {
  const rateColor = item.daily_rate >= 100 ? '#16A34A' : item.daily_rate >= 50 ? '#003E7F' : '#94A3B8'
  const routines = Object.entries(item.item_rates ?? {})
  return (
    <div className="bg-white rounded-[12px] p-4 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-[#1E293B]">{formatDate(item.log_date)}</span>
        <span className="text-[14px] font-bold" style={{ color: rateColor }}>
          {item.daily_rate}%
        </span>
      </div>

      {/* 인증샷 */}
      {item.photo_job_ids.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {item.photo_job_ids.map((id) => (
            <RecognitionPhoto key={id} jobId={id} />
          ))}
        </div>
      )}

      {/* 완료 루틴 상세 */}
      {routines.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {routines.map(([code, rate]) => (
            <span
              key={code}
              className="px-2.5 h-[28px] inline-flex items-center rounded-full bg-[#EEF2F7] text-[12px] text-[#334155]"
            >
              {ROUTINE_LABELS[code] ?? code} {rate}%
            </span>
          ))}
        </div>
      ) : (
        !item.submitted && <p className="text-[13px] text-[#94A3B8]">기록 없음</p>
      )}
    </div>
  )
}

export default function ChallengeTimelinePage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const isTeam = type === 'team'

  const { data, isLoading } = useQuery({
    queryKey: ['challenge-timeline', type, id],
    queryFn: () => (isTeam ? challengeApi.getTeamTimeline(id!) : challengeApi.getChallengeTimeline(id!)),
    enabled: !!id,
    ...noAutoLogout,
  })
  const items = (data?.data as ChallengeTimelineResponse | undefined)?.items ?? []

  const title = <span className="text-[17px] font-bold text-[#1E293B]">인증·루틴 타임라인</span>

  return (
    <AppShell active="challenge" topbarLeft={title}>
      <div className="md:hidden">
        <Header showBack onBack={() => navigate(-1)} title={title} />
      </div>

      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-6 flex flex-col gap-3 md:max-w-[720px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[#003E7F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-[14px] text-[#94A3B8] text-center py-20">아직 기록이 없어요</p>
          ) : (
            items.map((it) => <DayCard key={it.log_date} item={it} />)
          )}
        </div>
        <div className="md:hidden">
          <BottomNav active="challenge" />
        </div>
      </div>
    </AppShell>
  )
}
