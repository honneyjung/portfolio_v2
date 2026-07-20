import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
import type { HemilianCaseListItem } from '../../types'

interface UnverifiedCaseItem extends HemilianCaseListItem {
  followup_status?: string | null
}

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return `${diffDay}일 전`
  if (diffDay < 14) return '1주 전'
  return `${Math.floor(diffDay / 30)}개월 전`
}

const CATEGORY_LABEL: Record<string, string> = {
  cancer:  '암 환우',
  chronic: '만성질환',
  general: '일반 건강관리',
}

// ── 케이스 카드 ─────────────────────────────────────────
function CaseCard({ c, onStart }: { c: UnverifiedCaseItem; onStart: () => void }) {
  const navigate = useNavigate()
  const initial = c.case_label?.charAt(0) ?? '?'
  const isMember = c.case_type === 'member'
  const categoryLabel = c.case_category ? (CATEGORY_LABEL[c.case_category] ?? c.case_category) : ''

  return (
    <div className="bg-[#D2DEEA] rounded-[10px] overflow-hidden">
      {/* 상단 카드 */}
      <button
        type="button"
        onClick={() => navigate(`/hemilian/cases/${c.case_id}`)}
        className="w-full bg-[#F8FAFF] border border-[#5BA3D9]/50 rounded-[10px] px-3 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-[14px]">
          {/* 아바타 */}
          <div className="flex-none size-[58px] rounded-full bg-[#D2DEEA] flex items-center justify-center">
            <span className="text-[18px] font-bold text-[#003E7F]">{initial}</span>
          </div>

          {/* 정보 */}
          <div className="flex flex-col gap-[7px] items-start">
            {/* 이름 + 배지 */}
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-[#191919]">{c.case_label ?? '이름 없음'}</span>
              <div className="flex items-center gap-1">
                <span className={`h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium tracking-[-0.14px] ${isMember ? 'bg-[#003E7F] text-[#F8FAFF]' : 'bg-[#94A3B8] text-[#F8FAFF]'}`}>
                  {isMember ? '회원' : '비회원'}
                </span>
                <span className="h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium tracking-[-0.14px] bg-[#FFE3DD] text-[#9D0006]">
                  신규
                </span>
              </div>
            </div>

            {/* 질환 + 등록 시간 */}
            <div className="flex flex-col gap-1 items-start">
              {categoryLabel ? (
                <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{categoryLabel}</span>
              ) : null}
              <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">
                등록 ∙ {timeAgo(c.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* 화살표 */}
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-none">
          <path d="M1 1L7 7L1 13" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* 하단 액션 바 */}
      <div className="flex items-center justify-between px-3 py-[14px]">
        <span className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">첫 상담을 시작해보세요</span>
        <button
          type="button"
          onClick={onStart}
          className="h-[26px] px-2 flex items-center rounded-full bg-[#003E7F] text-[#F8FAFF] text-[14px] font-medium tracking-[-0.14px] whitespace-nowrap"
        >
          상담 시작하기
        </button>
      </div>
    </div>
  )
}

// ── SearchBar ────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="이름, 질환, 메모 검색"
        className="w-full h-[49px] pl-6 pr-12 rounded-full bg-[#F8FAFF] border border-[#003E7F]/30 text-[16px] font-medium text-[#191919] placeholder:text-[#C5C5C5] tracking-[-0.32px] outline-none focus:border-[#003E7F]"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="7.5" cy="7.5" r="6" stroke="#003E7F" strokeWidth="1.5" />
          <path d="M12 12L16 16" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

// ── UnverifiedCasesPage ──────────────────────────────────
export default function UnverifiedCasesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: casesRes, isLoading } = useQuery({
    queryKey: ['hemilian-unverified-cases', debouncedSearch],
    queryFn: () =>
      hemilianApi.getCases({
        keyword: debouncedSearch || undefined,
        limit: 100,
      }),
  })

  const allCases = (unwrap<{ items: UnverifiedCaseItem[]; total: number }>(casesRes)?.items ?? []) as UnverifiedCaseItem[]

  // 신규(followup_status === 'new') 케이스만 표시, 없으면 전체 표시
  const cases = allCases.filter((c) =>
    !c.followup_status || c.followup_status === 'new'
  )

  const topbarLeft = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => navigate(-1)} className="flex-none size-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <p className="text-[17px] font-bold text-[#1E293B]">상담 신청 확인</p>
    </div>
  )

  return (
    <AppShell active="home" topbarLeft={topbarLeft}>
      {/* ── 모바일 ────────────────────────────────────── */}
      <div className="md:hidden flex flex-col bg-[#F1F5F9] min-h-screen">
        <div className="mx-auto w-full max-w-[480px] pt-5 pb-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8 px-5">
            <div className="flex items-center gap-[9px]">
              <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
                <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                  <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => navigate('/hemilian')} aria-label="홈으로">
                <svg width="19" height="20" viewBox="0 0 17 18" fill="none">
                  <path d="M1 6.5L8.5 1L16 6.5V16.5C16 16.7652 15.8946 17.0196 15.7071 17.2071C15.5196 17.3946 15.2652 17.5 15 17.5H11V12.5H6V17.5H2C1.73478 17.5 1.48043 17.3946 1.29289 17.2071C1.10536 17.0196 1 16.7652 1 16.5V6.5Z"
                    stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-[18px] font-bold text-[#1E293B]">상담 신청 확인</p>
            <div className="w-8" />
          </div>

          {/* 검색 */}
          <div className="mb-7 px-5">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* 케이스 목록 */}
          <div className="flex flex-col gap-3 px-5">
            {isLoading ? (
              <p className="text-center text-[14px] text-[#94A3B8] py-12">불러오는 중...</p>
            ) : cases.length === 0 ? (
              <p className="text-center text-[14px] text-[#94A3B8] py-12">미확인 케이스가 없어요</p>
            ) : (
              cases.map((c) => (
                <CaseCard
                  key={c.case_id}
                  c={c}
                  onStart={() => navigate(`/hemilian/cases/${c.case_id}`)}
                />
              ))
            )}
          </div>
        </div>
        <HemilianBottomNav />
      </div>

      {/* ── 데스크탑 ──────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!isLoading && (
            <p className="text-[14px] font-medium text-[#94A3B8] mb-5">총 {cases.length}건</p>
          )}

          <div className="mb-5 max-w-[400px]">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {isLoading ? (
            <p className="text-[14px] text-[#94A3B8] py-12 text-center">불러오는 중...</p>
          ) : cases.length === 0 ? (
            <p className="text-[14px] text-[#94A3B8] py-12 text-center">미확인 케이스가 없어요</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-[900px]">
              {cases.map((c) => (
                <CaseCard
                  key={c.case_id}
                  c={c}
                  onStart={() => navigate(`/hemilian/cases/${c.case_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
