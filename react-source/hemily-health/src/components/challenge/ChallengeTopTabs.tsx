import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// 셀프(나의)·함께 챌린지 화면을 오가는 상단 고정 탭.
// 화면이 라우트별로 분리돼 있어 네비게이션 기반으로 동작한다.
//  - 나의 → /challenge, 함께 → /challenge/teams
export default function ChallengeTopTabs({ active }: { active: 'mine' | 'together' }) {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()

  const pill = 'h-[37px] px-5 rounded-full text-[15px] font-medium tracking-[-0.3px] md:h-8 md:text-[13px] md:font-bold'

  return (
    <div className="sticky top-0 z-10 py-2 bg-[#F1F5F9]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/challenge')}
          className={`${pill} ${active === 'mine' ? 'bg-[#003E7F] text-white' : 'text-[#555] md:text-[#64748B]'}`}
        >
          {t('main.tabMine')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/challenge/teams')}
          className={`${pill} ${active === 'together' ? 'bg-[#003E7F] text-white' : 'text-[#555] md:text-[#64748B]'}`}
        >
          {t('main.tabTogether')}
        </button>
      </div>
    </div>
  )
}
