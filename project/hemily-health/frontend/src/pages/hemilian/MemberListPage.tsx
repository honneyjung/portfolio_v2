import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
// 백엔드 /hemilians/members 응답 스키마 (HemilianMemberItem)
interface MemberItem {
  member_id: string
  name: string
  care_type?: string | null
  last_report_date?: string | null
  info_share_agreed?: boolean | null   // null = 철회
  disease_label?: string | null
  active_challenge_description?: string | null
}

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

const HEALTH_TYPE_LABEL: Record<string, string> = {
  cancer:   '암 환우',
  chronic:  '만성질환',
  general:  '일반 건강관리',
  recovery: '회복 관리',
}

const CARE_TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  cancer:   { bg: 'bg-[#FEE2E2]', text: 'text-[#9D0006]' },
  chronic:  { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  general:  { bg: 'bg-[#D2DFED]', text: 'text-[#003E7F]' },
  recovery: { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' },
}

type ConsentFilter = '전체' | '동의 완료' | '동의 미완료' | '철회'

const CONSENT_FILTERS: ConsentFilter[] = ['전체', '동의 완료', '동의 미완료', '철회']

function getConsentStatus(m: MemberItem): ConsentFilter {
  if (m.info_share_agreed === null) return '철회'
  if (m.info_share_agreed === true) return '동의 완료'
  return '동의 미완료'
}

const CONSENT_BADGE: Record<ConsentFilter, { bg: string; text: string }> = {
  '전체':       { bg: 'bg-[#003E7F]', text: 'text-[#F8FAFF]' },
  '동의 완료':  { bg: 'bg-[#2B8E43]', text: 'text-[#F8FAFF]' },
  '동의 미완료': { bg: 'bg-[#FF8E3C]', text: 'text-[#F8FAFF]' },
  '철회':       { bg: 'bg-[#94A3B8]', text: 'text-[#F8FAFF]' },
}

// ── 회원 카드 ─────────────────────────────────────────────
function MemberCard({ m, onClick }: { m: MemberItem; onClick: () => void }) {
  const initial = m.name?.charAt(0) ?? '?'
  const consentStatus = getConsentStatus(m)
  const badge = CONSENT_BADGE[consentStatus]
  const isRevoked = consentStatus === '철회'
  const isNoConsent = consentStatus === '동의 미완료'

  const reportLine = m.last_report_date
    ? `최근 리포트 | ${formatDate(m.last_report_date)}`
    : '최근 리포트 | 없음'

  const careType = m.care_type ?? ''
  const healthLabel = HEALTH_TYPE_LABEL[careType] ?? (careType || '-')
  const careBadge = CARE_TYPE_BADGE[careType]
  const diseaseSubLabel = m.disease_label ? `∙ ${m.disease_label}` : ''

  let bottomLine: React.ReactNode
  if (isRevoked) {
    bottomLine = <span className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">데이터 접근 차단</span>
  } else if (isNoConsent) {
    bottomLine = <span className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">기본 정보만 열람 가능</span>
  } else if (m.active_challenge_description) {
    bottomLine = <span className="text-[14px] font-medium text-[#003E7F] tracking-[-0.14px]">{m.active_challenge_description}</span>
  } else {
    bottomLine = null
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-[#F8FAFF] border border-[#5BA3D9]/50 rounded-[10px] px-3 py-4 flex items-center justify-between"
    >
      <div className="flex items-start gap-[14px]">
        {/* 아바타 */}
        <div className="flex-none size-[58px] rounded-full bg-[#D2DEEA] flex items-center justify-center">
          <span className="text-[18px] font-bold text-[#003E7F]">{initial}</span>
        </div>

        {/* 정보 */}
        <div className="flex flex-col gap-3 items-start">
          {/* 이름 + 동의 배지 */}
          <div className="flex items-center gap-2 h-[26px]">
            <span className="text-[18px] font-bold text-[#191919]">{m.name}</span>
            <span className={`h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium tracking-[-0.14px] ${badge.bg} ${badge.text}`}>
              {consentStatus}
            </span>
          </div>

          {/* 리포트·질환·챌린지 */}
          <div className="flex flex-col gap-1 items-start">
            <div className="flex flex-col gap-[4px]">
              <span className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">{reportLine}</span>
              <div className="flex items-center gap-1.5">
                {careBadge ? (
                  <span className={`px-2 py-0.5 rounded-full text-[12px] font-medium ${careBadge.bg} ${careBadge.text}`}>
                    {healthLabel}
                  </span>
                ) : (
                  <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{healthLabel}</span>
                )}
                {diseaseSubLabel && (
                  <span className="text-[12px] text-[#64748B]">{diseaseSubLabel}</span>
                )}
              </div>
            </div>
            {bottomLine}
          </div>
        </div>
      </div>

      {/* 화살표 */}
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-none ml-2">
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
        placeholder="회원명 검색"
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

// ── 필터 칩 ─────────────────────────────────────────────
function FilterChips({ active, onChange }: { active: ConsentFilter; onChange: (f: ConsentFilter) => void }) {
  return (
    <div className="flex items-center gap-1">
      {CONSENT_FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`h-[28px] px-3 rounded-full text-[14px] font-medium tracking-[-0.14px] whitespace-nowrap ${
            active === f
              ? 'bg-[#003E7F] text-[#F8FAFF]'
              : 'bg-[#F8FAFF] border border-[#5BA3D9]/50 text-[#555]'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

// ── MemberListPage ────────────────────────────────────────
const PAGE_SIZE = 10

export default function MemberListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<ConsentFilter>('전체')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // 검색/필터 변경 시 첫 페이지로 초기화
  useEffect(() => { setPage(1) }, [debouncedSearch, filter])

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ['hemilian-members', debouncedSearch],
    queryFn: () =>
      hemilianApi.getMembers({
        keyword: debouncedSearch || undefined,
        limit: 100,
      }),
  })

  const allMembers = (unwrap<{ items: MemberItem[] }>(membersRes)?.items ?? []) as MemberItem[]

  const members = filter === '전체'
    ? allMembers
    : allMembers.filter((m) => getConsentStatus(m) === filter)

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE))
  const pagedMembers = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const topbarLeft = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => navigate(-1)} className="flex-none size-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <p className="text-[17px] font-bold text-[#1E293B]">담당 회원 목록</p>
    </div>
  )

  const emptyContent = (
    <p className="text-center text-[14px] text-[#94A3B8] py-12">연결된 회원이 없어요</p>
  )

  return (
    <AppShell active="home" topbarLeft={topbarLeft}>
      {/* ── 모바일 (md 미만) ────────────────────────────── */}
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
            <p className="text-[18px] font-bold text-[#1E293B]">담당 회원 목록</p>
            <div className="w-8" />
          </div>

          {/* 검색 + 필터 */}
          <div className="flex flex-col gap-2 mb-6 px-5">
            <SearchBar value={search} onChange={setSearch} />
            <FilterChips active={filter} onChange={setFilter} />
          </div>

          {/* 회원 목록 */}
          <div className="flex flex-col gap-3 px-5">
            {isLoading ? (
              <p className="text-center text-[14px] text-[#94A3B8] py-12">불러오는 중...</p>
            ) : members.length === 0 ? emptyContent : (
              members.map((m) => (
                <MemberCard
                  key={m.member_id}
                  m={m}
                  onClick={() => navigate(`/hemilian/members/${m.member_id}`)}
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

          {/* 검색 + 필터 + 총 인원 */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-[320px]">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <FilterChips active={filter} onChange={setFilter} />
            {!isLoading && (
              <span className="ml-auto text-[14px] font-medium text-[#94A3B8]">총 {members.length}명</span>
            )}
          </div>

          {isLoading ? (
            <p className="text-[14px] text-[#94A3B8] py-12 text-center">불러오는 중...</p>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-12 text-center">
              {emptyContent}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                {pagedMembers.map((m) => (
                  <MemberCard
                    key={m.member_id}
                    m={m}
                    onClick={() => navigate(`/hemilian/members/${m.member_id}`)}
                  />
                ))}
              </div>

              {/* 페이지 인디케이터 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="size-[34px] flex items-center justify-center rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                      <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`size-[34px] flex items-center justify-center rounded-[8px] text-[14px] font-medium transition-colors ${
                        n === page
                          ? 'bg-[#003E7F] text-white'
                          : 'text-[#64748B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="size-[34px] flex items-center justify-center rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                      <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </AppShell>
  )
}
