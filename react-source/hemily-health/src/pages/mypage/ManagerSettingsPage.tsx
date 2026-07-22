import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import { usersApi } from '../../lib/api/users'
import type { HemilianManager } from '../../types'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

export default function ManagerSettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('mypage')
  const qc = useQueryClient()
  const [code, setCode] = useState('')

  const { data: res } = useQuery({
    queryKey: ['users', 'hemilian-manager'],
    queryFn: () => usersApi.getHemilianManager(),
  })
  const manager = unwrap<HemilianManager>(res)
  const hemilian = manager?.hemilian as ({ id: string; name: string; code: string; email?: string }) | undefined
  // 연결일자는 타입에 없어 응답에 있으면 방어적으로 사용
  const connectedAt = (manager as { connected_at?: string } | undefined)?.connected_at

  const save = useMutation({
    mutationFn: () => usersApi.requestChangeHemilianManager(code.trim(), ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'hemilian-manager'] })
      navigate(-1)
    },
  })

  return (
    <AppShell active="mypage" topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('managerManage.title')}</p>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        {/* 헤더 — 모바일만 (스크롤 시 최상단 고정) */}
        <div className="md:hidden">
          <Header showBack title={<span className="text-[18px] font-bold text-[#191919]">{t('managerManage.title')}</span>} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 flex flex-col gap-9 md:overflow-visible md:px-8 md:pt-8 md:gap-6 md:max-w-[612px]">
          {/* 현재 담당 해밀리안 */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#DBEAFE] rounded-[10px] px-5 py-4 flex flex-col gap-2 md:bg-[#003E7F] md:rounded-[20px] md:px-8 md:py-6">
              <p className="text-[14px] font-bold text-[#555] tracking-[-0.14px] md:text-[12px] md:font-normal md:text-white/70">{t('managerManage.currentLabel')}</p>
              {hemilian ? (
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="flex-none size-[60px] rounded-full bg-[#003E7F] flex items-center justify-center md:size-[72px] md:bg-[#5BA3D9]">
                    <span className="text-[24px] font-bold text-[#F1F5F9] tracking-[-0.24px] md:text-[26px]">{hemilian.name?.[0] ?? ''}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[18px] font-semibold text-[#191919] md:text-white">
                      {t('managerManage.nameSuffix', { name: hemilian.name })}
                    </p>
                    {hemilian.email && (
                      <p className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px] md:text-white/75">{hemilian.email}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[16px] font-medium text-[#003E7F] md:text-white">{t('managerManage.none')}</p>
              )}
            </div>

            {hemilian && (
              <div className="flex flex-col gap-2 text-[14px] tracking-[-0.14px]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-black">{t('managerManage.currentCode')}</span>
                  <span className="font-semibold text-[#003E7F]">{hemilian.code}</span>
                </div>
                {connectedAt && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-black">{t('managerManage.connectedDate')}</span>
                    <span className="font-semibold text-[#003E7F]">{connectedAt.slice(0, 10).replace(/-/g, '.')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 담당 해밀리안 변경 */}
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-bold text-[#191919] tracking-[-0.14px]">{t('managerManage.changeSection')}</p>

            <div className="bg-[#DBEAFE] rounded-[10px] px-[17px] py-4 flex flex-col gap-3">
              <p className="text-[16px] font-semibold text-[#003E7F] tracking-[-0.32px]">{t('managerManage.codeInputLabel')}</p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('managerManage.codePlaceholder')}
                className="h-[45px] w-full rounded-full bg-[#F1F5F9] border border-[#DBEAFE] px-5 text-[16px] text-[#191919] placeholder:text-[#94A3B8] tracking-[-0.32px] outline-none"
              />
            </div>

            {/* 코드 확인 (검증 전용 엔드포인트 부재 → 입력값 보유 시 활성) */}
            <button
              type="button"
              disabled={!code.trim()}
              className="w-full h-[52px] rounded-full bg-[#003E7F] text-[16px] font-medium text-[#F1F5F9] tracking-[-0.32px] disabled:opacity-50"
            >
              {t('managerManage.checkCode')}
            </button>

            {/* 안내 */}
            <div className="flex items-center gap-3 bg-[#FFF5F2] border-2 border-dashed border-[#9D0006] rounded-[20px] pl-6 pr-[52px] py-3">
              <span className="flex-none size-[19px] rounded-full bg-[#9D0006] text-white text-[12px] tracking-[-0.24px] flex items-center justify-center leading-none">i</span>
              <span className="text-[12px] font-normal text-black tracking-[-0.24px]">{t('managerManage.notice')}</span>
            </div>
          </div>
        </div>

        {/* 변경 사항 저장 */}
        <div className="flex-none px-5 pb-6 pt-2 md:px-8 md:max-w-[612px]">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={!code.trim() || save.isPending}
            className="w-full h-[52px] rounded-full text-[16px] font-medium text-[#F8FAFF] tracking-[-0.32px] disabled:opacity-50 md:w-auto md:px-10 md:text-[14px]"
            style={{ background: 'linear-gradient(179deg, #003E7F 31.5%, #052649 96.7%)' }}
          >
            {t('managerManage.save')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
