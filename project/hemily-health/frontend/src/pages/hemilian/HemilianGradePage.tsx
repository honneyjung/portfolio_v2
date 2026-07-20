import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../lib/store/authStore'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { HEMILIAN_GRADES } from '../../constants'

const GRADE_DESCRIPTIONS: Record<string, string> = {
  '크리스탈':          '건강 솔루션을 체험하며 고객에게 건강한 라이프스타일을 제안하는 단계 (순결)',
  '에메랄드':          '건강 솔루션을 체험하며 고객에게 건강한 라이프스타일을 제안하는 단계 (행복)',
  '사파이어':          '건강 솔루션을 체험하며 고객에게 건강한 라이프스타일을 제안하는 단계 (진실)',
  '다이아몬드':        '건강 솔루션을 체험하며 고객에게 건강한 라이프스타일을 제안하는 단계 (사랑)',
  '뉴웨이브 리더':     '멤버에서 신규 리더로 첫 진입한 사업자. 전문성을 겸비하여 새로운 물결을 일으키는 리더',
  '비전 리더':         '본인의 확실한 꿈과 비전이 세워져 하위 사업자들에게 꿈과 비전을 제시할 수 있는 리더',
  '파이오니아 리더':   '전문성·열정·개척 정신으로 새로운 건강 분야 및 유통 현장을 선도하는 리더',
  '이노베이티브 리더': '혁신적인 사고로 어려운 환경을 돌파해 내는 핵심 중간 리더. 착한 경제를 선도',
  '프렌드 리더':       '같은 꿈과 비전을 가진 리더들로 하위 사업자들과 동고동락. 선한 관계의 롤 모델',
  '크리에이티브 리더': '탄탄한 기반 역량을 확보하여 신체적·경제적·사회적 건강을 완성하고 영역 확장을 주도',
  '서번트 리더':       '사랑과 겸손, 섬김의 덕목을 갖춘 글로벌 리더. 이롬헬스케어가 추구하는 최고 리더의 모델',
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="4" fill="#2B8E43" />
      <path d="M5 11L9 15L17 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="4" fill="#9D0006" />
      <path d="M7 7L15 15M15 7L7 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const GRID = '60px 72px 1fr 36px'

export default function HemilianGradePage() {
  const { t } = useTranslation('hemilian')
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)

  const userGrade = (authUser as { grade?: string } | null)?.grade
  const currentGrade = userGrade
    ? HEMILIAN_GRADES.find((g) => g.key === userGrade || g.name === userGrade)
    : null

  const pageTitle = t('gradeInfo.title')

  return (
    <AppShell active="mypage" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{pageTitle}</span>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">

        {/* 모바일 헤더 */}
        <div
          className="md:hidden flex-none px-5 pt-[52px] pb-5 flex items-center gap-3"
          style={{ background: 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)' }}
        >
          <button type="button" onClick={() => navigate(-1)} className="flex-none" aria-label="뒤로">
            <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
              <path d="M8 1L1 8L8 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-[18px] font-bold text-white tracking-[-0.36px]">{pageTitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto md:overflow-visible">
          <div className="pb-[89px] md:pb-10 md:px-8 md:pt-8 md:max-w-[804px]">
        {/* 현재 등급 카드 */}
        {currentGrade ? (
          <div className="mx-5 mt-5 rounded-[14px] bg-white border border-[#D2DEEA] px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-[12px] text-[#64748B] tracking-[-0.24px]">{t('gradeInfo.myGrade')}</p>
              <p className="text-[20px] font-bold text-[#003E7F] tracking-[-0.4px]">{currentGrade.name}</p>
              <p className="text-[13px] text-[#475569] tracking-[-0.26px]">{currentGrade.level}</p>
            </div>
            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #003E7F, #052649)' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4L17.5 10.5L25 11.5L19.5 16.5L21 24L14 20.5L7 24L8.5 16.5L3 11.5L10.5 10.5L14 4Z"
                  fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : null}

        {/* 등급 테이블 */}
        <div className="mx-5 mt-5 mb-5 rounded-[14px] overflow-hidden border border-[#D2DEEA]">
          {/* 테이블 헤더 */}
          <div
            className="grid text-white text-[11px] font-semibold tracking-[-0.22px]"
            style={{
              gridTemplateColumns: GRID,
              background: 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)',
            }}
          >
            <div className="px-2 py-[10px]">{t('gradeInfo.colGrade')}</div>
            <div className="px-2 py-[10px]">{t('gradeInfo.colLevel')}</div>
            <div className="px-2 py-[10px]">{t('gradeInfo.colDescription')}</div>
            <div className="px-1 py-[10px] text-center leading-tight">{t('gradeInfo.colTeamChallenge')}</div>
          </div>

          {/* 멤버 섹션 구분 바 */}
          <div className="px-3 py-[6px] bg-[#EAF0F7] border-b border-[#D2DEEA]">
            <p className="text-[11px] font-bold text-[#003E7F] tracking-[-0.22px]">
              {t('gradeInfo.memberSection')}
            </p>
          </div>

          {HEMILIAN_GRADES.filter((g) => !g.isLeader).map((grade, idx, arr) => {
            const isCurrent = currentGrade?.key === grade.key
            return (
              <div
                key={grade.key}
                className={`grid items-start ${idx < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''} ${isCurrent ? 'bg-[#EAF0F7]' : 'bg-white'}`}
                style={{ gridTemplateColumns: GRID }}
              >
                <div className="px-2 py-3 flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold tracking-[-0.24px] leading-snug" style={{ color: grade.color }}>
                    {grade.name}
                  </span>
                  {isCurrent && (
                    <span className="mt-1 self-start text-[9px] font-semibold text-white bg-[#003E7F] rounded-full px-1.5 py-0.5 leading-tight">
                      {t('gradeInfo.currentBadge')}
                    </span>
                  )}
                </div>
                <div className="px-2 py-3">
                  <span className="text-[10px] text-[#94A3B8] tracking-[-0.2px] leading-snug">{grade.level}</span>
                </div>
                <div className="px-2 py-3">
                  <p className="text-[11px] text-[#475569] tracking-[-0.22px] leading-relaxed">{GRADE_DESCRIPTIONS[grade.key]}</p>
                </div>
                <div className="px-1 py-3 flex items-start justify-center pt-4">
                  <CrossIcon />
                </div>
              </div>
            )
          })}

          {/* 리더 섹션 구분 바 */}
          <div className="px-3 py-[6px] bg-[#EAF0F7] border-t border-b border-[#D2DEEA]">
            <p className="text-[11px] font-bold text-[#003E7F] tracking-[-0.22px]">
              {t('gradeInfo.leaderSection')}
            </p>
          </div>

          {HEMILIAN_GRADES.filter((g) => g.isLeader).map((grade, idx, arr) => {
            const isCurrent = currentGrade?.key === grade.key
            return (
              <div
                key={grade.key}
                className={`grid items-start ${idx < arr.length - 1 ? 'border-b border-[#E2E8F0]' : ''} ${isCurrent ? 'bg-[#EAF0F7]' : 'bg-white'}`}
                style={{ gridTemplateColumns: GRID }}
              >
                <div className="px-2 py-3 flex flex-col gap-0.5">
                  <span className="text-[12px] font-bold text-[#003E7F] tracking-[-0.24px] leading-snug">
                    {grade.name}
                  </span>
                  {isCurrent && (
                    <span className="mt-1 self-start text-[9px] font-semibold text-white bg-[#003E7F] rounded-full px-1.5 py-0.5 leading-tight">
                      {t('gradeInfo.currentBadge')}
                    </span>
                  )}
                </div>
                <div className="px-2 py-3">
                  <span className="text-[10px] text-[#94A3B8] tracking-[-0.2px] leading-snug">{grade.level}</span>
                </div>
                <div className="px-2 py-3">
                  <p className="text-[11px] text-[#475569] tracking-[-0.22px] leading-relaxed">{GRADE_DESCRIPTIONS[grade.key]}</p>
                </div>
                <div className="px-1 py-3 flex items-start justify-center pt-4">
                  <CheckIcon />
                </div>
              </div>
            )
          })}
        </div>
          </div>
        </div>

        <div className="md:hidden">
          <HemilianBottomNav />
        </div>
      </div>
    </AppShell>
  )
}
