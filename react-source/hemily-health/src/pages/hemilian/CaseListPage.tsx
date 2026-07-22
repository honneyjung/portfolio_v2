import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
import type { HemilianCaseListItem } from '../../types'

// ── helpers ─────────────────────────────────────────────
function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 14) return '1주 전'
  if (diffDays < 21) return '2주 전'
  if (diffDays < 28) return '3주 전'
  return `${Math.floor(diffDays / 30)}개월 전`
}

const MEMBER_STYLE: Record<string, string> = {
  member:     'bg-[#003E7F] text-[#F8FAFF]',
  non_member: 'bg-[#69BBE4] text-[#F8FAFF]',
}
const MEMBER_LABEL: Record<string, string> = {
  member:     '회원',
  non_member: '비회원',
}

const CATEGORY_LABEL: Record<string, string> = {
  cancer:  '암 환우',
  chronic: '만성질환',
  general: '일반 건강관리',
}

type FilterType = '전체' | '암환우' | '만성질환' | '일반'
const FILTERS: { label: FilterType; category?: string }[] = [
  { label: '전체' },
  { label: '암환우',   category: 'cancer' },
  { label: '만성질환', category: 'chronic' },
  { label: '일반',     category: 'general' },
]

// ── 케이스 카드 ─────────────────────────────────────────
function CaseCard({ c, onClick }: { c: HemilianCaseListItem; onClick: () => void }) {
  const initial = c.case_label?.charAt(0) ?? '?'
  const memberStyle = MEMBER_STYLE[c.case_type] ?? 'bg-[#94A3B8] text-[#F8FAFF]'
  const memberLabel = MEMBER_LABEL[c.case_type] ?? c.case_type
  const categoryLabel = c.case_category ? (CATEGORY_LABEL[c.case_category] ?? c.case_category) : '미분류'
  const lastConsult = formatRelativeDate(c.created_at)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-[#F8FAFF] border border-[#5BA3D9]/50 rounded-[10px] px-3 py-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-[14px]">
        <div className="flex-none size-[58px] rounded-full bg-[#D2DEEA] flex items-center justify-center">
          <span className="text-[18px] font-bold text-[#003E7F]">{initial}</span>
        </div>
        <div className="flex flex-col gap-[7px] items-start">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold text-[#191919]">{c.case_label ?? '이름 없음'}</span>
            <span className={`h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium tracking-[-0.14px] ${memberStyle}`}>
              {memberLabel}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{categoryLabel}</span>
            {lastConsult && (
              <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">최근 등록 ∙ {lastConsult}</span>
            )}
          </div>
        </div>
      </div>
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-none">
        <path d="M1 1L7 7L1 13" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ── 검색 바 ─────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="이름 또는 질환 검색"
        className="w-full h-[49px] pl-6 pr-12 rounded-full bg-[#F8FAFF] border border-[#003E7F]/30 text-[16px] font-medium text-[#191919] placeholder:text-[#C5C5C5] tracking-[-0.32px] outline-none focus:border-[#003E7F]"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="7.5" cy="7.5" r="6" stroke="#555" strokeWidth="1.5" />
          <path d="M12 12L16 16" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

// ── 필터 칩 ─────────────────────────────────────────────
function FilterChips({ active, onChange }: { active: FilterType; onChange: (f: FilterType) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={() => onChange(f.label)}
          className={`h-[28px] px-3 rounded-full text-[14px] font-medium tracking-[-0.14px] transition-colors ${
            active === f.label
              ? 'bg-[#003E7F] text-[#F8FAFF]'
              : 'bg-[#F8FAFF] border border-[#5BA3D9]/50 text-[#555]'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

// ── CaseListPage ─────────────────────────────────────────
export default function CaseListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('hemilian')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('전체')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const activeFilter = FILTERS.find((f) => f.label === filter)

  const { data: casesRes, isLoading } = useQuery({
    queryKey: ['hemilian-cases', debouncedSearch, activeFilter?.category],
    queryFn: () =>
      hemilianApi.getCases({
        keyword: debouncedSearch || undefined,
        category: activeFilter?.category,
        limit: 100,
      }),
  })

  const cases = unwrap<{ items: HemilianCaseListItem[]; total: number }>(casesRes)?.items ?? []

  const topbarLeft = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => navigate(-1)} className="flex-none size-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <p className="text-[17px] font-bold text-[#1E293B]">{t('caseList.title')}</p>
    </div>
  )

  const topbarRight = (
    <button
      type="button"
      onClick={() => navigate('/hemilian/cases/new')}
      className="h-[34px] px-4 rounded-[8px] text-white text-[13px] font-medium flex items-center gap-1.5"
      style={{ backgroundImage: 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)' }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2V12M2 7H12" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
      {t('caseList.register')}
    </button>
  )

  const emptyContent = (
    <p className="text-center text-[14px] text-[#94A3B8] py-12">{t('caseList.empty')}</p>
  )

  return (
    <AppShell active="home" topbarLeft={topbarLeft} topbarRight={topbarRight}>
      {/* ── 모바일 (md 미만) ────────────────────────────── */}
      <div className="md:hidden flex flex-col bg-[#F1F5F9] min-h-screen">
        <div className="mx-auto w-full max-w-[480px] pt-5 pb-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-[33px]">
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
            <p className="text-[18px] font-bold text-[#1E293B]">{t('caseList.title')}</p>
            <button type="button" onClick={() => navigate('/hemilian/cases/new')} aria-label={t('caseList.register')} className="flex items-center justify-center size-8">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="#191919" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 검색 + 필터 */}
          <div className="flex flex-col gap-2 mb-6">
            <SearchBar value={search} onChange={setSearch} />
            <FilterChips active={filter} onChange={setFilter} />
          </div>

          {/* 케이스 목록 */}
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <p className="text-center text-[14px] text-[#94A3B8] py-12">불러오는 중...</p>
            ) : cases.length === 0 ? emptyContent : (
              cases.map((c) => (
                <CaseCard
                  key={c.case_id}
                  c={c}
                  onClick={() => navigate(`/hemilian/cases/${c.case_id}`, { state: { createdAt: c.created_at } })}
                />
              ))
            )}
          </div>
        </div>
        <HemilianBottomNav />
      </div>

      {/* ── 데스크탑 (md 이상) ──────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">

          <div className="flex items-center gap-4 mb-5">
            <div className="w-[320px]">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <FilterChips active={filter} onChange={setFilter} />
          </div>

          {isLoading ? (
            <p className="text-[14px] text-[#94A3B8] py-12 text-center">불러오는 중...</p>
          ) : cases.length === 0 ? (
            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-12 text-center">
              {emptyContent}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {cases.map((c) => (
                <CaseCard
                  key={c.case_id}
                  c={c}
                  onClick={() => navigate(`/hemilian/cases/${c.case_id}`, { state: { createdAt: c.created_at } })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
