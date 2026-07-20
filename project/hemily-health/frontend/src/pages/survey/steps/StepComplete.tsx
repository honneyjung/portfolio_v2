import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reportApi } from '../../../lib/api/report'

interface Props {
  surveyId: string
}

export function StepComplete({ surveyId }: Props) {
  const navigate = useNavigate()

  const generateMutation = useMutation({
    // 반복 구조: 이전(최신) 리포트와 연결해 변화 비교가 가능하도록 previous_report_id 전달
    mutationFn: async () => {
      let previousReportId: string | null = null
      try {
        const r = await reportApi.getMyReports({ limit: 1 })
        previousReportId = (r.data as { items?: Array<{ id: string }> })?.items?.[0]?.id ?? null
      } catch {
        // 최초 설문 등 이전 리포트가 없으면 null
      }
      return reportApi.generate({ survey_id: surveyId, previous_report_id: previousReportId })
    },
    onSuccess: (res) => {
      // 백엔드는 ReportGenerateResponse flat: { report_id, status }
      navigate(`/report/${res.data.report_id}`, { replace: true })
    },
  })

  return (
    <div className="min-h-screen flex flex-col bg-onboarding md:bg-[#F1F5F9] md:items-center md:justify-center md:py-12">
      {/* 좌측 네이비 스트립 — 데스크탑/태블릿 */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-2 bg-[#003E7F]" />

      <div className="flex-1 flex flex-col bg-onboarding px-5 pb-10
                      md:flex-none md:bg-white md:rounded-[24px] md:shadow-[0_4px_24px_rgba(0,0,0,0.06)]
                      md:w-[560px] md:max-w-[calc(100vw-72px)] md:min-h-[480px] md:px-12 md:pb-12 md:pt-12">
        <div className="flex-1 flex flex-col items-center justify-center gap-24 md:gap-16">

          {/* 🎉 이모지 + 텍스트 */}
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="text-[56px] leading-none">🎉</span>
            <div className="flex flex-col gap-[9px] items-center w-[241px]">
              <p className="text-[24px] font-bold text-[#191919] tracking-[-0.24px] leading-normal">
                설문이 완료되었어요!
              </p>
              <p className="text-[16px] font-medium tracking-[-0.32px] leading-normal">
                홈으로 가서 리포트를 확인해보세요.
              </p>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full py-[17px] rounded-full bg-gradient-blue text-[#f8faff] text-[16px] font-medium tracking-[-0.32px] disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {generateMutation.isPending ? '리포트 생성 중...' : '해밀리헬스 시작하기'}
          </button>

        </div>
      </div>
    </div>
  )
}
