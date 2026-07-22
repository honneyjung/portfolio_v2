import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
import type { User } from '../../types'

// ── 타입 ─────────────────────────────────────────────────

interface MemberChallenge {
  id: string
  title: string
  status: 'active' | 'completed'
  progress_rate: number
  duration_days?: number
  consecutive_days?: number
  completed_count?: number
  start_date?: string
  end_date?: string
}

interface MemberReport {
  id: string
  report_number: number
  created_at: string
  dna_stage?: string
  product_count?: number
  prev_stage?: string
}

interface MemberMemo {
  id: string
  content: string
  created_at: string
}

interface MemberDetailData {
  member: User & { latest_report_date?: string; care_type?: string | null }
  info_share_agreed: boolean
  reports: MemberReport[]
  challenges: MemberChallenge[]
  memos: MemberMemo[]
}

// ── 유틸 ──────────────────────────────────────────────────

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

// ── 공용 서브컴포넌트 ──────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-[14px] border-b border-[#F1F5F9] last:border-0">
      <span className="text-[14px] font-medium text-[#94A3B8] tracking-[-0.28px]">{label}</span>
      <div className="text-[14px] font-medium tracking-[-0.28px] text-right">{children}</div>
    </div>
  )
}

function LockBox() {
  return (
    <div className="bg-[#F1F5F9] border border-[#D2DEEA] rounded-[10px] px-[90px] py-[34px]">
      <div className="flex flex-col items-center gap-[4px]">
        {/* 자물쇠 아이콘 */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="6" y="14" width="20" height="14" rx="3" stroke="#C5C5C5" strokeWidth="1.8" />
          <path d="M11 14v-4a5 5 0 0 1 10 0v4" stroke="#C5C5C5" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16" cy="21" r="1.5" fill="#C5C5C5" />
        </svg>
        <p className="text-[16px] font-medium text-[#C5C5C5] text-center tracking-[-0.32px] whitespace-nowrap">
          동의 완료 후 열람 가능합니다.
        </p>
      </div>
    </div>
  )
}

// ── 동의 완료 화면 서브컴포넌트 ───────────────────────────

function ActiveChallengeCard({ challenge }: { challenge: MemberChallenge }) {
  return (
    <div className="bg-[#DBEAFE] rounded-[14px] p-4">
      <p className="text-[13px] font-semibold text-[#003E7F] mb-3 tracking-[-0.26px]">{challenge.title}</p>
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-[12px] font-medium text-[#003E7F]">달성률</span>
          <span className="text-[12px] font-bold text-[#003E7F]">{challenge.progress_rate}%</span>
        </div>
        <div className="h-[6px] rounded-full bg-[#D2DEEA]">
          <div className="h-full rounded-full bg-[#003E7F]" style={{ width: `${Math.min(challenge.progress_rate, 100)}%` }} />
        </div>
      </div>
      <div className="bg-[#F1F5F9] border border-[#D2DEEA] rounded-[10px] px-4 py-3">
        <div className="flex items-center justify-around text-center">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[11px] font-medium text-[#94A3B8]">참여기간</span>
            <span className="text-[15px] font-bold text-[#003E7F]">{challenge.duration_days ?? 0}<span className="text-[11px] font-medium ml-[2px]">일</span></span>
          </div>
          <div className="w-px h-8 bg-[#D2DEEA]" />
          <div className="flex flex-col gap-[2px]">
            <span className="text-[11px] font-medium text-[#94A3B8]">연속달성</span>
            <span className="text-[15px] font-bold text-[#003E7F]">{challenge.consecutive_days ?? 0}<span className="text-[11px] font-medium ml-[2px]">일</span></span>
          </div>
          <div className="w-px h-8 bg-[#D2DEEA]" />
          <div className="flex flex-col gap-[2px]">
            <span className="text-[11px] font-medium text-[#94A3B8]">완료항목</span>
            <span className="text-[15px] font-bold text-[#003E7F]">{challenge.completed_count ?? 0}<span className="text-[11px] font-medium ml-[2px]">개</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompletedChallengeCard({ challenge }: { challenge: MemberChallenge }) {
  const period = challenge.start_date && challenge.end_date
    ? `${formatDate(challenge.start_date)} ~ ${formatDate(challenge.end_date)}`
    : ''
  return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[14px] p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-semibold text-[#1E40AF] tracking-[-0.26px]">{challenge.title}</p>
        <span className="text-[12px] font-medium text-[#94A3B8]">종료</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[5px] rounded-full bg-[#BFDBFE]">
          <div className="h-full rounded-full bg-[#1E40AF]" style={{ width: `${Math.min(challenge.progress_rate, 100)}%` }} />
        </div>
        <span className="text-[12px] font-bold text-[#1E40AF]">{challenge.progress_rate}%</span>
      </div>
      {period && <p className="text-[11px] text-[#94A3B8] mt-1">{period}</p>}
    </div>
  )
}

function ReportCard({ report }: { report: MemberReport }) {
  return (
    <div className="bg-[#003E7F] rounded-[14px] p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold tracking-[-0.26px]">리포트 #{report.report_number}</span>
        <span className="text-[12px] text-[#A0B6CE]">{formatDate(report.created_at)}</span>
      </div>
      <div className="flex items-center justify-around text-center">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[11px] text-[#A0B6CE]">추천제품</span>
          <span className="text-[15px] font-bold">{report.product_count ?? 0}개</span>
        </div>
        <div className="w-px h-7 bg-[#1E5A9E]" />
        <div className="flex flex-col gap-[2px]">
          <span className="text-[11px] text-[#A0B6CE]">현재단계</span>
          <span className="text-[15px] font-bold">{report.dna_stage ?? '-'}</span>
        </div>
        <div className="w-px h-7 bg-[#1E5A9E]" />
        <div className="flex flex-col gap-[2px]">
          <span className="text-[11px] text-[#A0B6CE]">이전대비</span>
          <span className="text-[15px] font-bold">{report.prev_stage ?? '-'}</span>
        </div>
      </div>
    </div>
  )
}

function MemoItem({ memo }: { memo: MemberMemo }) {
  return (
    <div className="bg-[#F8FAFF] border border-[#D2DEEA] rounded-[10px] px-4 py-3">
      <p className="text-[13px] text-[#191919] leading-[1.6] whitespace-pre-wrap">{memo.content}</p>
      <p className="text-[11px] text-[#94A3B8] mt-2">{formatDate(memo.created_at)}</p>
    </div>
  )
}

// ── 동의 완료 전용 콘텐츠 ─────────────────────────────────

function AgreedContent({
  challenges,
  reports,
  memos,
  memoText,
  onMemoChange,
  onMemoSave,
  isSaving,
}: {
  challenges: MemberChallenge[]
  reports: MemberReport[]
  memos: MemberMemo[]
  memoText: string
  onMemoChange: (v: string) => void
  onMemoSave: () => void
  isSaving: boolean
}) {
  const activeChallenges = challenges.filter((c) => c.status === 'active')
  const completedChallenges = challenges.filter((c) => c.status === 'completed')

  return (
    <>
      {/* 진행 중 챌린지 */}
      {activeChallenges.length > 0 && (
        <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
          <p className="text-[16px] font-bold text-[#1E293B] mb-4">진행 중 챌린지</p>
          <div className="flex flex-col gap-3">
            {activeChallenges.map((c) => <ActiveChallengeCard key={c.id} challenge={c} />)}
          </div>
        </div>
      )}

      {/* 종료된 챌린지 */}
      {completedChallenges.length > 0 && (
        <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
          <p className="text-[16px] font-bold text-[#1E293B] mb-4">종료된 챌린지</p>
          <div className="flex flex-col gap-3">
            {completedChallenges.map((c) => <CompletedChallengeCard key={c.id} challenge={c} />)}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
          <p className="text-[16px] font-bold text-[#1E293B] mb-4">챌린지</p>
          <p className="text-[14px] text-[#94A3B8] text-center py-6">참여 중인 챌린지가 없어요.</p>
        </div>
      )}

      {/* 리포트 */}
      <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[16px] font-bold text-[#1E293B]">리포트</p>
          {reports.length > 1 && (
            <button type="button" className="text-[13px] font-medium text-[#003E7F]">
              리포트 비교 보기
            </button>
          )}
        </div>
        {reports.length === 0 ? (
          <p className="text-[14px] text-[#94A3B8] text-center py-6">생성된 리포트가 없어요.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>

      {/* 상담 메모 */}
      <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
        <p className="text-[16px] font-bold text-[#1E293B] mb-4">상담 메모</p>
        {memos.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {memos.map((m) => <MemoItem key={m.id} memo={m} />)}
          </div>
        )}
        <textarea
          value={memoText}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="오늘 상담 내용을 입력하세요."
          rows={4}
          className="w-full rounded-[10px] bg-[#F8FAFF] border border-[#D2DEEA] px-4 py-3 text-[14px] text-[#191919] placeholder:text-[#C5C5C5] outline-none focus:border-[#003E7F] resize-none leading-[1.6] tracking-[-0.28px]"
        />
        <button
          type="button"
          onClick={onMemoSave}
          disabled={isSaving || !memoText.trim()}
          className="mt-3 w-full h-[48px] rounded-[10px] bg-[#003E7F] text-white text-[15px] font-semibold tracking-[-0.3px] disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 철회 시 처리 기준 */}
      <div className="flex flex-col gap-2">
        <div className="h-[2px] bg-[#9D0006] rounded-full" />
        <p className="text-[16px] font-medium text-[#9D0006] tracking-[-0.32px]">철회 시 처리 기준</p>
        <p className="text-[14px] text-[#555] tracking-[-0.14px] leading-[1.6]">
          동의 철회 시 기존 열람 데이터 접근이 즉시 차단되며, 기본 정보만 유지됩니다.
        </p>
      </div>
    </>
  )
}

// ── 동의 미완료 전용 콘텐츠 ───────────────────────────────

function NotAgreedContent() {
  return (
    <>
      {/* 경고 콜아웃 */}
      <div className="bg-[#FFF5F2] border-2 border-dashed border-[#9D0006] rounded-[20px] px-6 py-3">
        <div className="flex items-center gap-5">
          {/* 경고 아이콘 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-none">
            <path d="M12 9v4M12 16.5v.5" stroke="#9D0006" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#9D0006" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col gap-[4px]">
            <p className="text-[14px] font-bold text-[#9D0006] tracking-[-0.14px]">정보 공유 동의 미완료</p>
            <p className="text-[12px] text-black tracking-[-0.24px] leading-[1.5]">
              회원의 동의가 완료되어야 리포트 ∙ 챌린지 ∙ 상담 메모를 열람할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 챌린지 진행률 */}
      <div className="flex flex-col gap-3">
        <p className="text-[16px] font-medium text-black tracking-[-0.32px]">챌린지 진행률</p>
        <div className="bg-[#DBEAFE] rounded-[10px] overflow-hidden">
          {/* 잠금 카드 */}
          <LockBox />
          {/* 통계 행 */}
          <div className="flex items-center justify-around py-4 px-4">
            <div className="flex flex-col items-center gap-[4px] w-[52px]">
              <span className="text-[18px] font-bold text-[#003E7F]">-</span>
              <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">참여 기간</span>
            </div>
            <div className="w-px h-14 bg-[#A0B6CE]" />
            <div className="flex flex-col items-center gap-[4px] w-[52px]">
              <span className="text-[18px] font-bold text-[#003E7F]">-</span>
              <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">연속 달성</span>
            </div>
            <div className="w-px h-14 bg-[#A0B6CE]" />
            <div className="flex flex-col items-center gap-[4px] w-[52px]">
              <span className="text-[18px] font-bold text-[#003E7F]">-</span>
              <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">완료 항목</span>
            </div>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-[#E2E8F0]" />

      {/* 상담 메모 */}
      <div className="flex flex-col gap-3">
        <p className="text-[16px] font-medium text-black tracking-[-0.32px]">상담 메모</p>
        <LockBox />
      </div>

    </>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────

export default function MemberDetailPage() {
  const navigate = useNavigate()
  const { memberId } = useParams<{ memberId: string }>()
  const [memoText, setMemoText] = useState('')
  const queryClient = useQueryClient()

  const { data: res, isLoading, isError, error } = useQuery({
    queryKey: ['hemilian-member-detail', memberId],
    queryFn: () => hemilianApi.getMemberDetail(memberId!),
    enabled: !!memberId,
  })

  const saveMemoMutation = useMutation({
    mutationFn: (content: string) => hemilianApi.saveMemo(memberId!, content),
    onSuccess: () => {
      setMemoText('')
      queryClient.invalidateQueries({ queryKey: ['hemilian-member-detail', memberId] })
    },
  })

  const detail = unwrap<MemberDetailData>(res)
  const member = detail?.member
  const agreed = detail?.info_share_agreed ?? false
  const challenges = (detail?.challenges ?? []) as MemberChallenge[]
  const reports = (detail?.reports ?? []) as MemberReport[]
  const memos = (detail?.memos ?? []) as MemberMemo[]

  const initial = member?.name?.charAt(0) ?? '?'
  const healthLabel = HEALTH_TYPE_LABEL[member?.care_type ?? ''] ?? member?.care_type ?? '-'

  const pageContent = (
    <div className="flex flex-col bg-[#F1F5F9] min-h-screen">
      <div className="mx-auto w-full max-w-[480px] pt-5 pb-24 md:pb-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 px-5">
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
          <p className="text-[18px] font-bold text-[#1E293B]">담당 회원 상세보기</p>
          <div className="w-[32px]" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-[14px] text-[#94A3B8]">불러오는 중...</p>
          </div>
        ) : isError ? (
          <div className="mx-5 bg-red-50 border border-red-200 rounded-[12px] p-4">
            <p className="text-[13px] font-bold text-red-600 mb-1">API 오류</p>
            <p className="text-[12px] text-red-500 font-mono break-all">
              memberId: {String(memberId)}<br />
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        ) : !member ? (
          <div className="flex items-center justify-center py-24 px-5">
            <p className="text-[14px] text-[#94A3B8]">회원 정보를 불러올 수 없어요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-5">

            {/* 프로필 카드 */}
            <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-5 py-5">
              {/* 아바타 + 이름 + 배지 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="flex-none size-[58px] rounded-full bg-[#D2DEEA] flex items-center justify-center">
                    <span className="text-[20px] font-bold text-[#003E7F]">{initial}</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#191919]">{member.name}</span>
                </div>
                <div className="flex items-center gap-[4px]">
                  {member.care_type && (
                    <span className="h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium text-[#F8FAFF] bg-[#003E7F] tracking-[-0.14px]">
                      {healthLabel}
                    </span>
                  )}
                  {agreed ? (
                    <span className="h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium text-[#F8FAFF] bg-[#2B8E43] tracking-[-0.14px]">
                      동의 완료
                    </span>
                  ) : (
                    <span className="h-[26px] px-2 flex items-center rounded-full text-[14px] font-medium text-[#F8FAFF] bg-[#FF8E3C] tracking-[-0.14px]">
                      동의 미완
                    </span>
                  )}
                </div>
              </div>

              {/* 정보 행 */}
              <div className="divide-y divide-[#F1F5F9] text-[16px] tracking-[-0.32px]">
                <InfoRow label="건강관리 유형">
                  <span className="font-bold text-[#191919]">{healthLabel}</span>
                </InfoRow>
                <InfoRow label="최근 리포트">
                  {agreed
                    ? member.latest_report_date
                      ? <span className="font-medium text-[#003E7F]">{formatDate(member.latest_report_date)}</span>
                      : <span className="font-medium text-[#94A3B8]">없음</span>
                    : <span className="font-medium text-[#9D0006]">열람 불가</span>
                  }
                </InfoRow>
                <InfoRow label="챌린지 여부">
                  {agreed
                    ? challenges.filter(c => c.status === 'active').length > 0
                      ? <span className="font-medium text-[#003E7F]">진행 중 ({challenges.find(c => c.status === 'active')?.progress_rate ?? 0}%)</span>
                      : <span className="font-medium text-[#94A3B8]">없음</span>
                    : <span className="font-medium text-[#9D0006]">열람 불가</span>
                  }
                </InfoRow>
                <InfoRow label="정보 공유 동의">
                  {agreed ? (
                    <div className="flex items-center gap-1">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="#2B8E43" />
                        <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-medium text-[#2B8E43]">동의 완료</span>
                    </div>
                  ) : (
                    <span className="font-medium text-[#9D0006]">동의 미완</span>
                  )}
                </InfoRow>
              </div>
            </div>

            {/* 동의 여부에 따른 콘텐츠 분기 */}
            {agreed ? (
              <AgreedContent
                challenges={challenges}
                reports={reports}
                memos={memos}
                memoText={memoText}
                onMemoChange={setMemoText}
                onMemoSave={() => saveMemoMutation.mutate(memoText)}
                isSaving={saveMemoMutation.isPending}
              />
            ) : (
              <NotAgreedContent />
            )}

          </div>
        )}
      </div>
      <HemilianBottomNav />
    </div>
  )

  // ── 데스크탑 전용: 프로필 카드 내부 공통 ─────────────────
  const desktopProfile = !member ? null : (
    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
      {/* 아바타 + 이름 + 배지 */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#F1F5F9]">
        <div className="flex-none size-[72px] rounded-full bg-[#D2DEEA] flex items-center justify-center">
          <span className="text-[24px] font-bold text-[#003E7F]">{initial}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[20px] font-bold text-[#191919] tracking-[-0.4px]">{member.name}</span>
          <div className="flex items-center gap-[4px] flex-wrap">
            {member.care_type && (
              <span className="h-[22px] px-2 flex items-center rounded-full text-[12px] font-medium text-white bg-[#003E7F]">
                {healthLabel}
              </span>
            )}
            {agreed ? (
              <span className="h-[22px] px-2 flex items-center rounded-full text-[12px] font-medium text-white bg-[#2B8E43]">동의 완료</span>
            ) : (
              <span className="h-[22px] px-2 flex items-center rounded-full text-[12px] font-medium text-white bg-[#FF8E3C]">동의 미완</span>
            )}
          </div>
        </div>
      </div>

      {/* 정보 행 */}
      <div className="flex flex-col gap-3">
        {[
          { label: '건강관리 유형', value: <span className="font-semibold text-[#191919]">{healthLabel}</span> },
          {
            label: '최근 리포트',
            value: agreed
              ? member.latest_report_date
                ? <span className="text-[#003E7F]">{formatDate(member.latest_report_date)}</span>
                : <span className="text-[#94A3B8]">없음</span>
              : <span className="text-[#9D0006]">열람 불가</span>,
          },
          {
            label: '챌린지 여부',
            value: agreed
              ? challenges.filter(c => c.status === 'active').length > 0
                ? <span className="text-[#003E7F]">진행 중 ({challenges.find(c => c.status === 'active')?.progress_rate ?? 0}%)</span>
                : <span className="text-[#94A3B8]">없음</span>
              : <span className="text-[#9D0006]">열람 불가</span>,
          },
          {
            label: '정보 공유 동의',
            value: agreed ? (
              <div className="flex items-center gap-1">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#2B8E43" />
                  <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[#2B8E43]">동의 완료</span>
              </div>
            ) : <span className="text-[#9D0006]">동의 미완</span>,
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <span className="flex-none w-[96px] text-[13px] font-medium text-[#94A3B8] tracking-[-0.13px]">{label}</span>
            <span className="flex-1 text-[13px] font-medium text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ── 데스크탑 전용: 미동의 우측 카드 ──────────────────────
  const desktopWarning = (
    <div className="bg-[#FFF5F2] border-2 border-dashed border-[#9D0006] rounded-[20px] p-5">
      <div className="flex items-start gap-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-none mt-0.5">
          <path d="M12 9v4M12 16.5v.5" stroke="#9D0006" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#9D0006" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-[13px] font-bold text-[#9D0006] mb-1">정보 공유 동의 미완료</p>
          <p className="text-[12px] text-[#333] leading-[1.6]">
            회원의 동의가 완료되어야 리포트 · 챌린지 · 상담 메모를 열람할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )

  const desktopWithdrawal = (
    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5">
      <div className="h-[2px] bg-[#9D0006] rounded-full mb-3" />
      <p className="text-[14px] font-semibold text-[#9D0006] mb-2">철회 시 처리 기준</p>
      <p className="text-[13px] text-[#555] leading-[1.6]">
        동의 철회 시 기존 열람 데이터 접근이 즉시 차단되며, 기본 정보만 유지됩니다.
      </p>
    </div>
  )

  return (
    <AppShell active="home" topbarLeft={
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="flex-none size-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <p className="text-[17px] font-bold text-[#1E293B]">담당 회원 상세보기</p>
      </div>
    }>
      {/* ── 모바일 ──────────────────────────────────────────── */}
      <div className="md:hidden">{pageContent}</div>

      {/* ── 데스크탑 ────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* 로딩 */}
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <p className="text-[14px] text-[#94A3B8]">불러오는 중...</p>
            </div>
          )}

          {/* 에러 */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-[16px] p-5 max-w-[500px]">
              <p className="text-[13px] font-bold text-red-600 mb-1">API 오류</p>
              <p className="text-[12px] text-red-500 font-mono break-all">
                memberId: {String(memberId)}<br />
                {error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          )}

          {/* 콘텐츠 */}
          {!isLoading && !isError && member && (
            <div className="flex gap-6 items-start max-w-[1100px]">

              {/* 좌측 컬럼 */}
              <div className="flex-1 min-w-0 flex flex-col gap-4">
                {agreed ? (
                  <>
                    {/* 챌린지 */}
                    {(() => {
                      const active = challenges.filter(c => c.status === 'active')
                      const completed = challenges.filter(c => c.status === 'completed')
                      return (
                        <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                          <p className="text-[16px] font-bold text-[#1E293B] mb-4">챌린지</p>
                          {challenges.length === 0 ? (
                            <p className="text-[13px] text-[#94A3B8] text-center py-6">참여 중인 챌린지가 없어요.</p>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {active.map(c => <ActiveChallengeCard key={c.id} challenge={c} />)}
                              {completed.map(c => <CompletedChallengeCard key={c.id} challenge={c} />)}
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* 리포트 */}
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[16px] font-bold text-[#1E293B]">리포트</p>
                        {reports.length > 1 && (
                          <button type="button" className="text-[13px] font-medium text-[#003E7F] hover:underline">
                            리포트 비교 보기
                          </button>
                        )}
                      </div>
                      {reports.length === 0 ? (
                        <p className="text-[13px] text-[#94A3B8] text-center py-6">생성된 리포트가 없어요.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {reports.map(r => <ReportCard key={r.id} report={r} />)}
                        </div>
                      )}
                    </div>

                    {/* 상담 메모 */}
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <p className="text-[16px] font-bold text-[#1E293B] mb-4">상담 메모</p>
                      {memos.length > 0 && (
                        <div className="flex flex-col gap-2 mb-4">
                          {memos.map(m => <MemoItem key={m.id} memo={m} />)}
                        </div>
                      )}
                      <textarea
                        value={memoText}
                        onChange={e => setMemoText(e.target.value)}
                        placeholder="오늘 상담 내용을 입력하세요."
                        rows={4}
                        className="w-full rounded-[10px] bg-[#F8FAFF] border border-[#D2DEEA] px-4 py-3 text-[14px] text-[#191919] placeholder:text-[#C5C5C5] outline-none focus:border-[#003E7F] resize-none leading-[1.6]"
                      />
                      <button
                        type="button"
                        onClick={() => saveMemoMutation.mutate(memoText)}
                        disabled={saveMemoMutation.isPending || !memoText.trim()}
                        className="mt-3 w-full h-[44px] rounded-[10px] bg-[#003E7F] text-white text-[14px] font-semibold disabled:opacity-50"
                      >
                        {saveMemoMutation.isPending ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 잠금 챌린지 */}
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <p className="text-[16px] font-bold text-[#1E293B] mb-4">챌린지 진행률</p>
                      <div className="bg-[#DBEAFE] rounded-[10px] overflow-hidden">
                        <LockBox />
                        <div className="flex items-center justify-around py-4">
                          {['참여 기간', '연속 달성', '완료 항목'].map((label, i) => (
                            <div key={label} className="flex items-center gap-8">
                              {i > 0 && <div className="w-px h-10 bg-[#A0B6CE]" />}
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[18px] font-bold text-[#003E7F]">-</span>
                                <span className="text-[13px] font-medium text-[#555]">{label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 잠금 메모 */}
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <p className="text-[16px] font-bold text-[#1E293B] mb-4">상담 메모</p>
                      <LockBox />
                    </div>
                  </>
                )}
              </div>

              {/* 우측 컬럼 */}
              <div className="w-[300px] lg:w-[320px] flex-none flex flex-col gap-4">
                {desktopProfile}
                {!agreed && desktopWarning}
                {agreed && desktopWithdrawal}
              </div>

            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
