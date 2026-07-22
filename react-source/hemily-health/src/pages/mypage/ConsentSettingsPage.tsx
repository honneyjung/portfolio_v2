import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import { usersApi } from '../../lib/api/users'
import type { ConsentItem, ConsentType } from '../../types'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

// 토글 (ON: 파랑, OFF: 회색)
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`flex-none flex items-center h-[29px] w-[51px] rounded-full px-[3px] transition-colors ${
        on ? 'bg-[#003E7F] justify-end' : 'bg-[#94A3B8] justify-start'
      }`}
    >
      <span className="size-[19px] rounded-full bg-white" />
    </button>
  )
}

// 행 key ↔ 백엔드 consent_type
type RowKey = 'terms' | 'privacy' | 'sensitive' | 'infoShare' | 'marketing'
const TYPE_OF: Record<RowKey, ConsentType> = {
  terms: 'terms_of_service',
  privacy: 'privacy_policy',
  sensitive: 'sensitive_health_info',
  infoShare: 'info_share_agreed',
  marketing: 'marketing',
}

export default function ConsentSettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('mypage')

  const { data: res } = useQuery({
    queryKey: ['users', 'consents'],
    queryFn: () => usersApi.getConsents(),
  })

  const [state, setState] = useState<Record<RowKey, boolean>>({
    terms: true,
    privacy: true,
    sensitive: true,
    infoShare: true,
    marketing: false,
  })
  const [versions, setVersions] = useState<Partial<Record<RowKey, string>>>({})

  // 서버 동의 현황으로 초기화
  useEffect(() => {
    const items = unwrap<{ items: ConsentItem[] }>(res)?.items
    if (!items) return
    const byType = new Map(items.map((c) => [c.consent_type, c]))
    setState((prev) => ({
      ...prev,
      terms: byType.get('terms_of_service')?.is_agreed ?? prev.terms,
      privacy: byType.get('privacy_policy')?.is_agreed ?? prev.privacy,
      sensitive: byType.get('sensitive_health_info')?.is_agreed ?? prev.sensitive,
      infoShare: byType.get('info_share_agreed')?.is_agreed ?? prev.infoShare,
      marketing: byType.get('marketing')?.is_agreed ?? prev.marketing,
    }))
    setVersions({
      terms: byType.get('terms_of_service')?.version,
      privacy: byType.get('privacy_policy')?.version,
    })
  }, [res])

  const save = useMutation({
    mutationFn: () => {
      const items: ConsentItem[] = (Object.keys(TYPE_OF) as RowKey[]).map((k) => ({
        consent_type: TYPE_OF[k]!,
        is_agreed: state[k],
      }))
      return usersApi.saveConsents(items)
    },
    onSuccess: () => navigate(-1),
  })

  const toggle = (k: RowKey) => setState((p) => ({ ...p, [k]: !p[k] }))

  const requiredDesc = (k: RowKey) =>
    versions[k] ? t('consentSettings.desc.version', { v: versions[k] }) : t('consentSettings.desc.agreedDone')

  const required: { key: RowKey; label: string; desc: string }[] = [
    { key: 'terms', label: t('consentSettings.items.terms'), desc: requiredDesc('terms') },
    { key: 'privacy', label: t('consentSettings.items.privacy'), desc: requiredDesc('privacy') },
    { key: 'sensitive', label: t('consentSettings.items.sensitive'), desc: t('consentSettings.desc.agreedDone') },
  ]
  const share: { key: RowKey; label: string; desc: string }[] = [
    { key: 'infoShare', label: t('consentSettings.items.infoShare'), desc: t('consentSettings.desc.infoShareScope') },
    {
      key: 'marketing',
      label: t('consentSettings.items.marketing'),
      desc: state.marketing ? t('consentSettings.desc.agreed') : t('consentSettings.desc.denied'),
    },
  ]

  const Card = ({ rows }: { rows: { key: RowKey; label: string; desc: string }[] }) => (
    <div className="bg-[#F8FAFF] rounded-[10px] py-5 md:bg-transparent md:rounded-none md:py-0 md:flex md:flex-col md:gap-3">
      {rows.map((r, i) => (
        <div key={r.key} className="md:bg-white md:rounded-[12px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {i > 0 && <div className="border-t border-[#E2E8F0] my-5 md:hidden" />}
          <div className="flex items-center justify-between px-5 md:py-4">
            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px] md:text-[13px] md:font-normal">{r.label}</p>
              <p className="text-[12px] font-normal text-[#C5C5C5] tracking-[-0.24px] md:hidden">{r.desc}</p>
            </div>
            <Toggle on={state[r.key]} onToggle={() => toggle(r.key)} />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <AppShell active="mypage" topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('consentSettings.title')}</p>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        {/* 헤더 — 모바일만 (스크롤 시 최상단 고정) */}
        <div className="md:hidden">
          <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{t('consentSettings.title')}</span>} />
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 flex flex-col gap-6 md:overflow-visible md:px-8 md:pt-8 md:max-w-[612px]">
          <section className="flex flex-col gap-3">
            <h2 className="text-[16px] font-medium text-black tracking-[-0.32px] md:text-[13px] md:font-bold md:text-[#64748B]">{t('consentSettings.requiredSection')}</h2>
            <Card rows={required} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-[16px] font-medium text-black tracking-[-0.32px] md:text-[13px] md:font-bold md:text-[#64748B]">{t('consentSettings.shareSection')}</h2>
            <Card rows={share} />
          </section>
        </div>

        {/* 저장 */}
        <div className="flex-none px-5 pb-6 pt-2 md:px-8 md:pt-2 md:max-w-[612px]">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="w-full h-[52px] rounded-full text-[16px] font-medium text-[#F8FAFF] tracking-[-0.32px] disabled:opacity-60 md:w-auto md:px-10 md:text-[14px]"
            style={{ background: 'linear-gradient(179deg, #003E7F 31.5%, #052649 96.7%)' }}
          >
            {t('consentSettings.save')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
