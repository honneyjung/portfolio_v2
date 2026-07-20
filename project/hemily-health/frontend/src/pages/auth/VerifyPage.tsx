import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '../../lib/api/users'
import MobileShell from '../../components/layout/MobileShell'

export default function VerifyPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  const [code,      setCode]      = useState('')
  const [codeError, setCodeError] = useState('')
  const [found,     setFound]     = useState<{ name: string; code: string } | null>(null)

  const checkMutation = useMutation({
    mutationFn: () => usersApi.connectHemilianManager(code.trim()),
    onSuccess: (res) => {
      const h = res.data?.data?.hemilian
      if (h) { setFound({ name: h.name, code: h.code }); setCodeError('') }
      else     setCodeError(t('verifyPage.error.notFound'))
    },
    onError: () => setCodeError(t('verifyPage.error.notFound')),
  })

  const handleCheck   = () => {
    if (!code.trim()) { setCodeError(t('verifyPage.error.codeRequired')); return }
    setCodeError('')
    checkMutation.mutate()
  }
  const handleReenter = () => { setFound(null); setCode(''); setCodeError('') }
  const handleSave    = () => navigate('/consent', { replace: true })

  const initial = found?.name?.[0] ?? ''

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col bg-onboarding">

        {/* 헤더 — × 닫기 */}
        <header className="flex-none flex justify-end px-5 pt-[68px] pb-0">
          <button
            type="button"
            onClick={() => navigate('/consent', { replace: true })}
            className="p-1 text-gray-700"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="17" y2="17"/>
              <line x1="17" y1="1" x2="1" y2="17"/>
            </svg>
          </button>
        </header>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-[40px]">

          {/* 섹션 1 — 코드 입력 */}
          <div className="flex flex-col gap-[36px]">

            {/* 타이틀 24px, 하단 gap 36px */}
            <p className="text-[24px] font-bold text-[#191919] leading-snug tracking-[-0.24px] whitespace-pre-line">
              {t('verifyPage.connectTitle')}
            </p>

            <div className="flex flex-col gap-[12px]">
              {/* 코드 입력 카드 — bg #DBEAFE, h-[106px], rounded-[10px], no border */}
              <div className="bg-[#dbeafe] rounded-[10px] px-[17px] py-[16px] h-[106px] flex flex-col gap-[12px]">
                <p className="text-[16px] font-semibold text-blue tracking-[-0.32px]">
                  {t('verifyPage.codeLabel')}
                </p>
                <input
                  type="text"
                  placeholder={t('verifyPage.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!!found}
                  className="w-full h-[43px] flex-shrink-0 bg-[#f1f5f9] border-[0.5px] border-[#5ba3d9]
                             rounded-full pl-3 text-[16px] text-gray-900 tracking-[-0.32px]
                             placeholder:text-[#64748b] focus:outline-none disabled:opacity-60
                             transition-colors"
                />
              </div>

              {codeError && (
                <p className="text-red text-caption px-1">{codeError}</p>
              )}

              {/* 코드 확인 버튼 */}
              {!found && (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={checkMutation.isPending}
                  className="w-full h-[52px] rounded-full bg-blue text-[#f1f5f9] text-[16px]
                             font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {checkMutation.isPending ? t('verifyPage.checking') : t('verifyPage.codeCheck')}
                </button>
              )}
            </div>
          </div>

          {/* 구분선 */}
          {found && <div className="border-t border-gray-200 -mt-[40px]" />}

          {/* 섹션 2 — 확인 결과 */}
          {found && (
            <div className="flex flex-col gap-[20px]">

              {/* 타이틀 */}
              <p className="text-[24px] font-bold text-[#191919] leading-snug tracking-[-0.24px]">
                {t('verifyPage.confirmTitle')}
              </p>

              <div className="flex flex-col gap-[12px]">
                {/* 해밀리안 카드 — bg #F1F5F9, border #5BA3D9, rounded-[10px], h-[100px] */}
                <div className="bg-[#f1f5f9] border border-[#5ba3d9] rounded-[10px]
                                h-[100px] pl-5 py-5 flex items-center">
                  <div className="flex items-center gap-[12px]">
                    {/* 아바타 — size 60px, rounded-[30px] */}
                    <div className="w-[60px] h-[60px] rounded-[30px] bg-blue flex items-center
                                    justify-center flex-shrink-0">
                      <span className="text-[24px] font-bold text-[#f1f5f9] tracking-[-0.24px]">
                        {initial}
                      </span>
                    </div>
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[18px] font-semibold text-[#191919]">
                        {found.name} 해밀리안님
                      </p>
                      <p className="text-[14px] font-medium text-[#64748b] tracking-[-0.14px]">
                        {found.code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 다시 입력 / 저장하기 — 각 w-[176px] h-[52px], gap-[8px] */}
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={handleReenter}
                    className="w-[176px] h-[52px] rounded-full bg-[#94a3b8] text-[#f1f5f9]
                               text-[18px] font-medium active:scale-[0.98] transition-all"
                  >
                    {t('verifyPage.reenter')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-[176px] h-[52px] rounded-full bg-blue text-[#f1f5f9]
                               text-[18px] font-medium active:scale-[0.98] transition-all"
                  >
                    {t('verifyPage.save')}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </MobileShell>
  )
}
