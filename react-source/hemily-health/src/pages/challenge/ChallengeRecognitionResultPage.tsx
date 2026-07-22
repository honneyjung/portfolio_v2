import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import apiClient from '../../lib/api/client'
import { useRecognitionResultStore, type RecognitionJobEntry } from '../../lib/store/recognitionResultStore'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'
const noAutoLogout = { validateStatus: (s: number) => s < 500 }

type JobDetail = {
  job_id: string
  job_status: string
  matched_product?: { id: string; product_name: string } | null
  confidence?: number | null
}

function statusChip(status: string) {
  // 성공(succeeded)은 관리자 검수 완료 후에만 부여됨. 그 전까지는 검수 대기.
  if (status === 'succeeded')    return { label: '적립 완료', bg: '#69BBE4' }
  if (status === 'failed')       return { label: '인식 실패', bg: '#EF4444' }
  if (status === 'needs_review') return { label: '관리자 검수 대기', bg: '#F59E0B' }
  return { label: '처리 중', bg: '#2B8E43' } // pending / processing
}

// ── 잡 한 줄 (자체 폴링) ─────────────────────────────────────
function JobRow({ job, preview }: { job: RecognitionJobEntry; preview: string }) {
  const { data } = useQuery({
    queryKey: ['recognition-job', job.jobId],
    queryFn: () => apiClient.get(`/recognitions/${job.jobId}`, noAutoLogout),
    refetchInterval: (query) => {
      const s = (query.state.data as any)?.data?.job_status as string | undefined
      return (!s || s === 'pending' || s === 'processing') ? 2000 : false
    },
    retry: false,
  })

  const detail: JobDetail | null = data?.status === 200 ? (data.data as JobDetail) : null
  const chip = statusChip(detail?.job_status ?? 'pending')
  const productName = detail?.matched_product?.product_name

  return (
    <div className="flex items-center gap-3 py-5 border-b border-[#E2E8F0] last:border-0">
      <img
        src={preview}
        alt="인증샷"
        className="w-[68px] h-[68px] rounded-[8px] object-cover flex-shrink-0 bg-[#E2E8F0]"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#555555] tracking-[-0.14px]">{job.uploadedAt}</p>
        <p className="text-[16px] font-bold text-[#1E293B] mt-0.5 leading-snug truncate">
          {productName ?? '인식 중...'}
        </p>
        {detail?.confidence != null && (
          <p className="text-[12px] text-[#64748B] mt-0.5">
            신뢰도 {Math.round(detail.confidence * 100)}%
          </p>
        )}
      </div>
      <span
        className="flex-shrink-0 px-[8px] py-[4px] rounded-full text-[14px] font-medium text-[#F8FAFF] ml-2"
        style={{ backgroundColor: chip.bg }}
      >
        {chip.label}
      </span>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────
export default function ChallengeRecognitionResultPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const { jobs, clear } = useRecognitionResultStore()

  // 파일 → 미리보기 URL (마운트 시 생성, 언마운트 시 해제)
  const [previews, setPreviews] = useState<string[]>([])
  useEffect(() => {
    const urls = jobs.map((j) => URL.createObjectURL(j.file))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConfirm = () => {
    clear()
    navigate('/challenge')
  }

  // 직접 URL로 접근 시 (jobs 없음) → 챌린지로 리다이렉트
  if (jobs.length === 0) {
    navigate('/challenge', { replace: true })
    return null
  }

  // ── 공통 콘텐츠 ─────────────────────────────────────────
  const Header1 = (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-[56px] leading-none">📂</span>
      <p className="text-[24px] font-bold text-[#191919] tracking-[-0.24px] mt-2">
        {t('recognition.resultTitle')}
      </p>
      <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">
        {t('recognition.resultSubtitle')}
      </p>
    </div>
  )

  const ItemsCard = (
    <div className="bg-[#F8FAFF] rounded-[10px] px-5">
      {jobs.map((job, i) => (
        <JobRow key={job.jobId} job={job} preview={previews[i] ?? ''} />
      ))}
    </div>
  )

  const ConfirmBtn = (
    <button
      type="button"
      onClick={handleConfirm}
      className="w-full h-[52px] rounded-full text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
      style={{ backgroundImage: NAVY_GRADIENT }}
    >
      {t('recognition.resultConfirm')}
    </button>
  )

  return (
    <AppShell
      active="challenge"
      topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('recognition.pageTitle')}</span>}
    >
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header showBack title={<span className="text-[17px] font-bold text-[#1E293B]">{t('recognition.pageTitle')}</span>} />
      </div>

      {/* ── 모바일 ── */}
      <div className="md:hidden flex flex-col flex-1 bg-[#F1F5F9] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 flex flex-col gap-8">
          {Header1}
          {ItemsCard}
          {ConfirmBtn}
        </div>
        <BottomNav active="challenge" />
      </div>

      {/* ── 웹 ── */}
      <div className="hidden md:flex md:flex-col bg-[#F1F5F9] px-8 py-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 max-w-[640px] w-full">

          {/* 성공 배너 */}
          <div className="bg-[#003E7F] rounded-[20px] h-[140px] flex items-center px-8 gap-5">
            <div className="w-[56px] h-[56px] rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[22px] font-bold text-white">{t('recognition.resultTitle')}</p>
              <p className="text-[13px] text-white/75 mt-1">{t('recognition.resultSubtitle')}</p>
            </div>
          </div>

          {/* 업로드 항목 카드 */}
          <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-6">
            <p className="text-[13px] font-bold text-[#1E293B] pt-5 pb-3">
              {t('recognition.uploadedPhotos')}
            </p>
            {jobs.map((job, i) => (
              <JobRow key={job.jobId} job={job} preview={previews[i] ?? ''} />
            ))}
          </div>

          {/* 안내 카드 */}
          <div className="bg-[#DBEAFE] rounded-[12px] px-5 py-4 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="9" cy="9" r="8" stroke="#003E7F" strokeWidth="1.4" />
              <path d="M9 8V12" stroke="#003E7F" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="9" cy="5.5" r="0.8" fill="#003E7F" />
            </svg>
            <p className="text-[13px] text-[#003E7F] leading-relaxed">
              {t('recognition.resultGuide')}
            </p>
          </div>

          {/* 확인 버튼 */}
          <button
            type="button"
            onClick={handleConfirm}
            className="h-[52px] rounded-full bg-[#003E7F] text-white text-[14px] font-bold"
          >
            {t('recognition.resultConfirm')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
