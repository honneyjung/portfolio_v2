import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import ChallengeTopTabs from '../../components/challenge/ChallengeTopTabs'
import { challengeApi } from '../../lib/api/challenge'
import { useAuthStore } from '../../lib/store/authStore'
import { useChallengeDraftStore } from '../../lib/store/challengeDraftStore'
import { TEAM_CREATE_DRAFT_KEY } from './ChallengeTogetherCreatePage'
import { HEMILIAN_GRADES } from '../../constants'
import type { TeamListItem } from '../../types'

const AVATAR_COLORS = [
  'bg-[#FDEBD2] text-[#D9534F]',
  'bg-[#D6E6F7] text-[#2563EB]',
  'bg-[#DDEBF7] text-[#003E7F]',
  'bg-[#FCE3CF] text-[#EA8A3C]',
  'bg-[#FDF3D0] text-[#B8860B]',
]

function formatDate(d?: string) {
  return d ? d.slice(0, 10).replace(/-/g, '.') : ''
}

// ── 함께 챌린지 카드 ─────────────────────────────────────────
function TeamCard({ team, highlighted, onClick }: {
  team: TeamListItem; highlighted: boolean; onClick: () => void
}) {
  const { t } = useTranslation('challenge')
  const avatars = team.member_names.slice(0, 5)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[10px] px-5 py-4 flex items-center gap-3 ${
        highlighted ? 'bg-[#DBEAFE] border border-[#5BA3D9]' : 'bg-[#F8FAFF]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">
          {formatDate(team.start_date)} ~ {formatDate(team.end_date)}
        </p>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <p className="text-[16px] font-bold text-[#003E7F] tracking-[-0.32px] truncate">
            {team.challenge_title || team.team_name}
          </p>
          {team.joined && (
            <span className="text-[10px] font-bold text-white bg-[#003E7F] rounded-full px-2 py-[3px] flex-shrink-0">
              {t('together.isMember')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          {avatars.length > 0 && (
            <div className="flex">
              {avatars.map((name, idx) => (
                <div key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} ${idx > 0 ? '-ml-2' : ''}`}>
                  {name[0] ?? '?'}
                </div>
              ))}
            </div>
          )}
          <span className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">
            {t('together.participantsLabel', { count: team.total_members })}
          </span>
        </div>
      </div>
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-shrink-0">
        <path d="M1 1L7 7L1 13" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function ChallengeTogetherPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isHemilian = user?.userType === 'hemilian'
  // 팀 챌린지 생성은 리더 등급(뉴웨이브 리더 이상)부터 가능
  const userGrade = (user as { grade?: string } | null)?.grade
  const isLeaderGrade =
    !!userGrade && HEMILIAN_GRADES.some((g) => (g.key === userGrade || g.name === userGrade) && g.isLeader)
  const canCreateTeam = isHemilian && isLeaderGrade
  const resetDraft = useChallengeDraftStore((s) => s.reset)

  const { data, isLoading } = useQuery({
    queryKey: ['teams-available'],
    queryFn: () => challengeApi.getTeams(),
    retry: false,
  })
  // 참여 중인 함께 챌린지를 맨 위로 — 참여자는 한 번의 탭으로 진행 화면 진입
  const teams: TeamListItem[] = [...(data?.data?.items ?? [])].sort(
    (a, b) => Number(b.joined) - Number(a.joined)
  )
  const hasJoined = teams.some((tm) => tm.joined)
  const joinedTeam = teams.find((tm) => tm.joined)

  // 진행 중인 함께 챌린지가 있으면 목록 대신 상세(루틴 진행 화면)로 바로 이동
  useEffect(() => {
    if (joinedTeam) {
      navigate(`/challenge/teams/${joinedTeam.team_id}`, { replace: true })
    }
  }, [joinedTeam, navigate])

  // 함께 챌린지 만들기 — 새 폼이므로 영양제 draft·입력값 보존분 초기화
  const goCreate = () => {
    resetDraft()
    sessionStorage.removeItem(TEAM_CREATE_DRAFT_KEY)
    navigate('/challenge/teams/create')
  }

  const PlusButton = canCreateTeam ? (
    <button
      type="button"
      onClick={goCreate}
      aria-label={t('together.fabCreate')}
      className="flex-none size-9 rounded-full bg-[#003E7F] flex items-center justify-center"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2V14M2 8H14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  ) : null

  // ── 목록 콘텐츠 ──
  const ListContent = isLoading ? (
    <div className="flex flex-col gap-2 px-5 pt-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[103px] rounded-[10px] bg-[#E2E8F0] animate-pulse" />
      ))}
    </div>
  ) : teams.length === 0 ? (
    <div className="flex items-center justify-center px-5 h-48">
      <p className="text-[15px] text-[#64748B] text-center">{t('together.noTeams')}</p>
    </div>
  ) : (
    <div className="flex flex-col gap-2 px-5 pt-6 pb-6">
      {teams.map((team, i) => (
        <TeamCard
          key={team.team_id}
          team={team}
          highlighted={team.joined || (!hasJoined && i === 0)}
          onClick={() => navigate(`/challenge/teams/${team.team_id}`)}
        />
      ))}
    </div>
  )

  return (
    <AppShell
      active="challenge"
      topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('together.listTitle')}</span>}
      topbarRight={PlusButton ?? undefined}
    >
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header
          showBack
          title={<span className="text-[17px] font-bold text-[#1E293B]">{t('together.listTitle')}</span>}
          right={canCreateTeam ? (
            <button
              type="button"
              onClick={goCreate}
              aria-label={t('together.fabCreate')}
              className="flex items-center justify-center size-8 rounded-full bg-[#003E7F]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : undefined}
        />
      </div>

      {/* 모바일 본문 */}
      <div className="md:hidden flex flex-col flex-1 bg-[#F1F5F9] overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-2"><ChallengeTopTabs active="together" /></div>
          {ListContent}
        </div>
        <BottomNav active="challenge" />
      </div>

      {/* 웹 본문 */}
      <div className="hidden md:flex md:flex-col bg-[#F1F5F9] flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 max-w-[640px] w-full px-8 py-6">
          <ChallengeTopTabs active="together" />
          {ListContent}
        </div>
      </div>
    </AppShell>
  )
}
