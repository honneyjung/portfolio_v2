import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
import { queryClient } from '../../lib/queryClient'
import type { CaseUserType } from '../../types'
import { CANCER_TYPES_NEW, CHRONIC_TYPES_NEW, CANCER_STAGE_LIST, CHRONIC_STAGE_LIST, GENERAL_GOAL_LIST } from '../../constants'

const NAVY = '#003E7F'

type Category = 'cancer' | 'chronic' | 'general'

const DISEASE_LABEL: Record<string, string> = {
  cancer:  '암 환우',
  chronic: '만성질환',
  general: '일반 건강관리',
}

interface MemberResult {
  id: string
  name: string
  email: string
  info_share_agreed?: boolean
}

function unwrapMembers(res: unknown): MemberResult[] {
  const body = (res as { data?: unknown })?.data
  return (
    (body as { data?: { items: MemberResult[] } })?.data?.items ??
    (body as { items?: MemberResult[] })?.items ??
    []
  )
}

const CATEGORIES = [
  { key: 'cancer',  labelKey: 'caseCreate.categoryCancer' },
  { key: 'chronic', labelKey: 'caseCreate.categoryChronic' },
  { key: 'general', labelKey: 'caseCreate.categoryGeneral' },
] as const satisfies { key: Category; labelKey: string }[]

function CategoryChips({ active, onSelect }: { active: Category | null; onSelect: (c: Category) => void }) {
  const { t } = useTranslation('hemilian')
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onSelect(c.key)}
          className={`h-[36px] px-4 rounded-full text-[14px] font-medium border transition-colors ${
            active === c.key
              ? 'bg-[#003E7F] border-[#003E7F] text-white'
              : 'bg-white border-[#D2DEEA] text-[#64748B]'
          }`}
        >
          {t(c.labelKey)}
        </button>
      ))}
    </div>
  )
}

// ── 비회원 질환별 추가 항목 ──────────────────────────────────
function NonMemberSubFields({
  disease,
  subType, onSubType,
  stage, onStage,
  goals, onGoals,
}: {
  disease: string
  subType: string
  onSubType: (v: string) => void
  stage: string
  onStage: (v: string) => void
  goals: string[]
  onGoals: (v: string) => void
}) {
  const chipBase = 'h-[36px] px-4 rounded-full text-[14px] font-medium transition-colors border'
  const chipOn   = 'bg-[#003E7F] border-[#003E7F] text-white'
  const chipOff  = 'bg-white border-[#D2DEEA] text-[#64748B]'

  if (disease === 'cancer') return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col gap-2">
        <p className="text-[18px] font-bold text-black">암 유형</p>
        <div className="flex flex-wrap gap-1.5">
          {CANCER_TYPES_NEW.map(({ value, label }) => (
            <button key={value} type="button"
              onClick={() => onSubType(subType === value ? '' : value)}
              className={`${chipBase} ${subType === value ? chipOn : chipOff}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {subType && (
        <div className="flex flex-col gap-2">
          <p className="text-[18px] font-bold text-black">치료 단계</p>
          <div className="relative">
            <select value={stage} onChange={(e) => onStage(e.target.value)}
              className="w-full h-[40px] pl-4 pr-10 rounded-full bg-white border border-[#DBEAFE] text-[13px] text-[#191919] outline-none appearance-none focus:border-[#003E7F] transition-colors">
              <option value="">선택해주세요</option>
              {CANCER_STAGE_LIST.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )

  if (disease === 'chronic') return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col gap-2">
        <p className="text-[18px] font-bold text-black">만성질환 종류</p>
        <div className="flex flex-wrap gap-1.5">
          {CHRONIC_TYPES_NEW.map(({ value, label }) => (
            <button key={value} type="button"
              onClick={() => onSubType(subType === value ? '' : value)}
              className={`${chipBase} ${subType === value ? chipOn : chipOff}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {subType && (
        <div className="flex flex-col gap-2">
          <p className="text-[18px] font-bold text-black">관리 단계</p>
          <div className="flex flex-wrap gap-1.5">
            {CHRONIC_STAGE_LIST.map(({ value, label }) => (
              <button key={value} type="button"
                onClick={() => onStage(stage === value ? '' : value)}
                className={`${chipBase} ${stage === value ? chipOn : chipOff}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (disease === 'general') return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-[18px] font-bold text-black">건강 목표</p>
      <div className="flex flex-wrap gap-1.5">
        {GENERAL_GOAL_LIST.map(({ value, label }) => {
          const on = goals.includes(value)
          return (
            <button key={value} type="button" onClick={() => onGoals(value)}
              className={`${chipBase} ${on ? chipOn : chipOff}`}>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )

  return null
}

function MemoBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="bg-[#F8FAFF] border border-[#D2DEEA] rounded-[10px] w-full px-5 py-4 min-h-[98px]">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] font-medium text-[#191919] placeholder:text-[#94A3B8] tracking-[-0.14px] outline-none resize-none min-h-[60px]"
      />
    </div>
  )
}

export default function CaseCreatePage() {
  const navigate = useNavigate()
  const { t } = useTranslation('hemilian')

  const [caseType, setCaseType] = useState<CaseUserType>('member')
  const [searchInput, setSearchInput] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null)
  const [memberConfirmed, setMemberConfirmed] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientDisease, setClientDisease] = useState('')
  const [diseaseSubType, setDiseaseSubType] = useState('')
  const [diseaseStage, setDiseaseStage] = useState('')
  const [generalGoals, setGeneralGoals] = useState<string[]>([])
  const [nonMemberConfirmed, setNonMemberConfirmed] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [memo, setMemo] = useState('')
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)

  const { data: searchRes } = useQuery({
    queryKey: ['hemilian-member-search', searchInput],
    queryFn: () => hemilianApi.searchMembers(searchInput),
    enabled: caseType === 'member' && searchInput.length >= 1,
  })
  const memberResults = unwrapMembers(searchRes)

  const mutation = useMutation({
    mutationFn: () =>
      hemilianApi.createCase({
        case_type: caseType,
        ...(caseType === 'member'
          ? { member_id: selectedMember!.id }
          : { customer_name: clientName.trim(), customer_phone: clientPhone.trim() || undefined }),
        case_category: caseType === 'non_member' ? (clientDisease || undefined) : (category ?? undefined),
        ...(diseaseSubType ? { disease_type: diseaseSubType } : {}),
        ...(diseaseStage ? { treatment_stage: diseaseStage } : {}),
        memo: memo.trim() || undefined,
      }),
    onSuccess: (res) => {
      const body = (res as { data?: unknown })?.data
      const caseId =
        (body as { data?: { case_id?: string; id?: string } })?.data?.case_id ??
        (body as { data?: { case_id?: string; id?: string } })?.data?.id ??
        (body as { case_id?: string; id?: string })?.case_id ??
        (body as { case_id?: string; id?: string })?.id
      queryClient.invalidateQueries({ queryKey: ['hemilian-cases'] })
      setShowToast(true)
      setTimeout(() => {
        navigate(caseId ? `/hemilian/cases/${caseId}` : '/hemilian/cases')
      }, 1500)
    },
    onError: (err) => {
      console.error('[createCase] error', err)
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || '케이스 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
    },
  })

  function handleTypeChange(type: CaseUserType) {
    setCaseType(type)
    setSelectedMember(null)
    setMemberConfirmed(false)
    setSearchInput('')
    setClientName('')
    setClientPhone('')
    setClientDisease('')
    setDiseaseSubType('')
    setDiseaseStage('')
    setGeneralGoals([])
    setNonMemberConfirmed(false)
    setError('')
  }

  function handleConfirmMember() {
    setError('')
    const target = selectedMember ?? (memberResults.length > 0 ? memberResults[0] : null)
    if (!target) { setError(t('caseCreate.memberSearchEmpty')); return }
    setSelectedMember(target)
    setMemberConfirmed(true)
  }

  function handleConfirmNonMember() {
    setError('')
    if (!clientName.trim()) { setError('이름을 입력해주세요'); return }
    setNonMemberConfirmed(true)
  }

  function handleSubmit() {
    setError('')
    if (caseType === 'member' && !memberConfirmed) { setError(t('caseCreate.errorMemberRequired')); return }
    if (caseType === 'non_member' && !clientName.trim()) { setError(t('caseCreate.errorClientNameRequired')); return }
    mutation.mutate()
  }

  const initial = selectedMember?.name?.charAt(0) ?? '?'

  // ── 모바일 폼 ────────────────────────────────────────────
  const mobileForm = (
    <div className="flex flex-col gap-10 items-end w-full">
      {/* 닫기 버튼 */}
      <button type="button" onClick={() => navigate(-1)} aria-label="닫기">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="#191919" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex flex-col gap-6 items-start w-full">
        <div className="flex flex-col gap-9 items-start w-full">
          {/* 타이틀 */}
          <div className="text-[24px] font-bold text-[#191919] tracking-[-0.24px] leading-snug">
            <p>담당 회원을</p>
            <p>연결해주세요</p>
          </div>

          <div className="flex flex-col gap-8 items-start w-full">
            {/* 회원 유형 선택 + 검색 */}
            <div className="flex flex-col gap-3 items-start w-full">
              <div className="flex flex-col gap-3 items-start w-full">
                <p className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">회원 유형 선택</p>
                <div className="flex items-center gap-[10px] w-full">
                  {/* 일반회원 */}
                  <button
                    type="button"
                    onClick={() => handleTypeChange('member')}
                    className="flex-1 h-[65px] rounded-[10px] flex items-center justify-center text-[16px] font-medium tracking-[-0.32px] transition-colors"
                    style={
                      caseType === 'member'
                        ? { background: NAVY, color: '#F8FAFF' }
                        : { background: '#F8FAFF', border: '1px solid #94A3B8', color: '#191919' }
                    }
                  >
                    일반회원
                  </button>
                  {/* 비회원 */}
                  <button
                    type="button"
                    onClick={() => handleTypeChange('non_member')}
                    className="flex-1 h-[65px] rounded-[10px] flex items-center justify-center text-[16px] font-medium tracking-[-0.32px] transition-colors"
                    style={
                      caseType === 'non_member'
                        ? { background: NAVY, color: '#F8FAFF' }
                        : { background: '#F8FAFF', border: '1px solid #94A3B8', color: '#191919' }
                    }
                  >
                    {t('caseCreate.typeNonMember')}
                  </button>
                </div>
              </div>

              {/* 일반회원 검색 카드 */}
              {caseType === 'member' && (
                <div className="bg-[#DBEAFE] rounded-[10px] w-full px-[17px] py-4">
                  <div className="flex flex-col gap-3 items-start w-full">
                    <p className="text-[16px] font-semibold text-[#003E7F] tracking-[-0.32px]">담당 회원 검색하기</p>
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => { setSearchInput(e.target.value); setSelectedMember(null); if (memberConfirmed) setMemberConfirmed(false) }}
                        placeholder={t('caseCreate.memberSearchPlaceholder')}
                        className="w-full h-[45px] pl-4 pr-10 rounded-full bg-[#F8FAFF] border border-[#DBEAFE] text-[16px] text-[#191919] placeholder:text-[#94A3B8] tracking-[-0.32px] outline-none"
                      />
                    </div>
                    {/* 검색 결과 드롭다운 */}
                    {searchInput.length >= 1 && (
                      <div className={`w-full bg-white rounded-[10px] overflow-hidden border ${selectedMember ? 'border-[#003E7F]' : 'border-[#DBEAFE]'}`}>
                        {memberResults.length === 0 ? (
                          <p className="text-[14px] text-[#94A3B8] text-center py-3">{t('caseCreate.memberSearchEmpty')}</p>
                        ) : (
                          memberResults.map((m) => {
                            const isSelected = selectedMember?.id === m.id
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => { setSelectedMember(m); setSearchInput(m.name) }}
                                className={`w-full flex items-center justify-between px-4 py-3 border-b last:border-0 transition-colors ${
                                  isSelected
                                    ? 'bg-white hover:bg-[#F8FAFF] border-b-[#F1F5F9]'
                                    : 'bg-white hover:bg-[#F8FAFF] border-b-[#F1F5F9]'
                                }`}
                              >
                                <div className="flex flex-col items-start">
                                  <span className={`text-[15px] font-medium ${isSelected ? 'text-[#003E7F]' : 'text-[#191919]'}`}>{m.name}</span>
                                  <span className="text-[13px] text-[#64748B]">{m.email}</span>
                                </div>
                                {isSelected && (
                                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-none">
                                    <circle cx="9" cy="9" r="9" fill="#003E7F" />
                                    <path d="M5 9L7.5 11.5L13 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 비회원 정보 입력 카드 */}
              {caseType === 'non_member' && (
                <div className="bg-[#DBEAFE] rounded-[10px] w-full px-[17px] py-4">
                  <div className="flex flex-col gap-3 items-start w-full">
                    <p className="text-[16px] font-semibold text-[#003E7F] tracking-[-0.32px]">회원 정보 직접 입력하기</p>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-col gap-1 w-full">
                        <p className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">이름</p>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => { setClientName(e.target.value); if (nonMemberConfirmed) setNonMemberConfirmed(false) }}
                          placeholder="홍길동"
                          className="w-full h-[45px] pl-4 rounded-full bg-[#F8FAFF] border border-[#DBEAFE] text-[16px] text-[#191919] placeholder:text-[#94A3B8] tracking-[-0.32px] outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <p className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">전화번호</p>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="010 - 1234-5678"
                          className="w-full h-[45px] pl-4 rounded-full bg-[#F8FAFF] border border-[#DBEAFE] text-[16px] text-[#191919] placeholder:text-[#94A3B8] tracking-[-0.32px] outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <p className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">보유 질환</p>
                        <div className="relative w-full">
                          <select
                            value={clientDisease}
                            onChange={(e) => { setClientDisease(e.target.value); setDiseaseSubType(''); setDiseaseStage(''); setGeneralGoals([]) }}
                            className="w-full h-[45px] pl-4 pr-10 rounded-full bg-[#F8FAFF] border border-[#DBEAFE] text-[16px] text-[#191919] tracking-[-0.32px] outline-none appearance-none"
                          >
                            <option value="">선택해주세요</option>
                            <option value="cancer">암 환우</option>
                            <option value="chronic">만성질환</option>
                            <option value="general">일반 건강관리</option>
                          </select>
                          <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1L6 6L11 1" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      {clientDisease && (
                        <NonMemberSubFields
                          disease={clientDisease}
                          subType={diseaseSubType} onSubType={setDiseaseSubType}
                          stage={diseaseStage} onStage={setDiseaseStage}
                          goals={generalGoals} onGoals={(v) => setGeneralGoals(prev => prev.includes(v) ? prev.filter(g => g !== v) : [...prev, v])}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 회원 확인하기 버튼 */}
              {caseType === 'member' && !memberConfirmed && (
                <button
                  type="button"
                  onClick={handleConfirmMember}
                  disabled={!searchInput.trim()}
                  className="w-full h-[52px] rounded-full text-[#F1F5F9] text-[16px] font-medium tracking-[-0.32px] transition-opacity disabled:opacity-50"
                  style={{ background: NAVY }}
                >
                  회원 확인하기
                </button>
              )}

              {/* 정보 저장하기 버튼 (비회원) */}
              {caseType === 'non_member' && !nonMemberConfirmed && (
                <button
                  type="button"
                  onClick={handleConfirmNonMember}
                  disabled={!clientName.trim()}
                  className="w-full h-[52px] rounded-full text-[#F1F5F9] text-[16px] font-medium tracking-[-0.32px] transition-opacity disabled:opacity-50"
                  style={{ background: NAVY }}
                >
                  정보 저장하기
                </button>
              )}
            </div>

            {/* 일반회원 프로필 (확인 후) */}
            {caseType === 'member' && memberConfirmed && selectedMember && (
              <div className="flex flex-col gap-7 items-start w-full">
                {/* 아바타 + 이름 + 동의 여부 */}
                <div className="flex flex-col gap-5 items-start w-full">
                  <div className="flex items-center gap-5 w-full">
                    <div
                      className="flex-none size-[58px] rounded-[29px] flex items-center justify-center text-white text-[18px] font-bold"
                      style={{ background: '#5BA3D9' }}
                    >
                      {initial}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[18px] font-bold text-black">{selectedMember.name}님</p>
                      <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{selectedMember.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMemberConfirmed(false); setSelectedMember(null); setSearchInput('') }}
                      className="ml-auto text-[13px] font-medium text-[#94A3B8]"
                    >
                      변경
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 items-start w-full">
                    <div className="flex items-center justify-between w-full">
                      <p className="text-[18px] font-medium text-[#191919]">상담 동의 여부</p>
                      <p className="text-[18px] font-bold text-[#003E7F]">
                        {selectedMember.info_share_agreed ? '동의' : '미동의'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 상담 유형 + 메모 */}
                <div className="flex flex-col gap-3 items-start w-full">
                  <div className="flex flex-col gap-3 items-start w-full">
                    <p className="text-[18px] font-bold text-black">{t('caseCreate.sectionCategory')}</p>
                    <CategoryChips active={category} onSelect={(c) => { setCategory(c); setDiseaseSubType(''); setDiseaseStage(''); setGeneralGoals([]) }} />
                    {category && (
                      <NonMemberSubFields
                        disease={category}
                        subType={diseaseSubType} onSubType={setDiseaseSubType}
                        stage={diseaseStage} onStage={setDiseaseStage}
                        goals={generalGoals} onGoals={(v) => setGeneralGoals(prev => prev.includes(v) ? prev.filter(g => g !== v) : [...prev, v])}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-3 items-start w-full">
                    <p className="text-[18px] font-bold text-black">{t('caseCreate.sectionMemo')}</p>
                    <MemoBox
                      value={memo}
                      onChange={setMemo}
                      placeholder={t('caseCreate.memoPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 비회원 프로필 + 메모 (저장 후) */}
            {caseType === 'non_member' && nonMemberConfirmed && (
              <div className="flex flex-col gap-7 items-start w-full">
                <div className="flex items-center gap-5 w-full">
                  <div
                    className="flex-none size-[58px] rounded-[29px] flex items-center justify-center text-white text-[18px] font-bold"
                    style={{ background: '#5BA3D9' }}
                  >
                    {clientName.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[18px] font-bold text-black">{clientName}님</p>
                    {clientDisease && (
                      <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{DISEASE_LABEL[clientDisease]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNonMemberConfirmed(false)}
                    className="ml-auto text-[13px] font-medium text-[#94A3B8]"
                  >
                    변경
                  </button>
                </div>
                {clientDisease && (
                  <div className="flex flex-col gap-3 items-start w-full">
                    <p className="text-[18px] font-bold text-black">보유 질환</p>
                    <span className="h-[36px] px-4 rounded-full text-[14px] font-medium bg-[#003E7F] text-white flex items-center">
                      {DISEASE_LABEL[clientDisease]}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-3 items-start w-full">
                  <p className="text-[18px] font-bold text-black">{t('caseCreate.sectionMemo')}</p>
                  <MemoBox
                    value={memo}
                    onChange={setMemo}
                    placeholder={t('caseCreate.memoPlaceholder')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-[13px] text-red-500">{error}</p>}

        {/* 케이스 등록하기 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full h-[52px] rounded-full text-[#F1F5F9] text-[16px] font-medium tracking-[-0.32px] transition-opacity disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {mutation.isPending ? t('caseCreate.submitting') : t('caseCreate.submit')}
        </button>
      </div>
    </div>
  )

  const topbarLeft = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => navigate(-1)} className="flex-none size-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <p className="text-[17px] font-bold text-[#1E293B]">{t('caseCreate.title')}</p>
    </div>
  )

  return (
    <>
    {showToast && (
      <div className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] text-white text-[14px] font-medium px-6 py-3 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
        상담 케이스가 등록되었습니다.
      </div>
    )}
    <AppShell active="home" topbarLeft={topbarLeft}>
      {/* ── 모바일 (md 미만) ────────────────────────────── */}
      <div className="md:hidden flex flex-col bg-[#F1F5F9] min-h-screen">
        <div className="mx-auto w-full max-w-[480px] px-5 pt-5 pb-24">
          {mobileForm}
        </div>
        <HemilianBottomNav />
      </div>

      {/* ── 데스크탑 (md 이상) ──────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {(() => {
            const showForm = memberConfirmed || (caseType === 'non_member' && nonMemberConfirmed)
            return (
              <div className="flex gap-6 items-start max-w-[900px]">

                {/* 좌측: 검색 + 확인 + 프로필 카드 */}
                <div className={`flex flex-col gap-4 ${showForm ? 'flex-[3] min-w-0' : 'flex-1 max-w-[560px]'}`}>

                  {/* 회원 유형 + 검색 카드 */}
                  <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                    <p className="text-[15px] font-semibold text-[#1E293B] mb-4">회원 유형 선택</p>

                    {/* 유형 토글 */}
                    <div className="flex items-center gap-[10px] mb-4">
                      {(['member', 'non_member'] as CaseUserType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTypeChange(type)}
                          className="flex-1 h-[44px] rounded-[10px] text-[14px] font-medium transition-colors"
                          style={
                            caseType === type
                              ? { background: NAVY, color: '#F8FAFF' }
                              : { background: '#F8FAFF', border: '1px solid #D2DEEA', color: '#64748B' }
                          }
                        >
                          {type === 'member' ? '일반회원' : t('caseCreate.typeNonMember')}
                        </button>
                      ))}
                    </div>

                    {/* 일반회원 검색 */}
                    {caseType === 'member' && (
                      <div className="flex flex-col gap-3">
                        <div className="bg-[#DBEAFE] rounded-[12px] px-4 py-4">
                          <p className="text-[13px] font-semibold text-[#003E7F] mb-3">담당 회원 검색하기</p>
                          <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => { setSearchInput(e.target.value); setSelectedMember(null); if (memberConfirmed) setMemberConfirmed(false) }}
                            placeholder={t('caseCreate.memberSearchPlaceholder')}
                            className="w-full h-[40px] pl-4 rounded-full bg-white border border-[#DBEAFE] text-[14px] text-[#191919] placeholder:text-[#94A3B8] outline-none focus:border-[#003E7F] transition-colors"
                          />
                          {searchInput.length >= 1 && (
                            <div className={`mt-2 bg-white rounded-[10px] overflow-hidden border ${selectedMember ? 'border-[#003E7F]' : 'border-[#DBEAFE]'}`}>
                              {memberResults.length === 0 ? (
                                <p className="text-[13px] text-[#94A3B8] text-center py-3">{t('caseCreate.memberSearchEmpty')}</p>
                              ) : (
                                memberResults.map((m) => {
                                  const isSelected = selectedMember?.id === m.id
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => { setSelectedMember(m); setSearchInput(m.name) }}
                                      className="w-full flex items-center justify-between px-4 py-3 border-b border-b-[#F1F5F9] last:border-0 bg-white hover:bg-[#F8FAFF] transition-colors"
                                    >
                                      <div className="flex flex-col items-start">
                                        <span className={`text-[13px] font-medium ${isSelected ? 'text-[#003E7F]' : 'text-[#191919]'}`}>{m.name}</span>
                                        <span className="text-[12px] text-[#64748B]">{m.email}</span>
                                      </div>
                                      {isSelected && (
                                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="flex-none">
                                          <circle cx="9" cy="9" r="9" fill="#003E7F" />
                                          <path d="M5 9L7.5 11.5L13 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </button>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                        {error && <p className="text-[13px] text-red-500">{error}</p>}
                        {!memberConfirmed && (
                          <button
                            type="button"
                            onClick={handleConfirmMember}
                            disabled={!searchInput.trim()}
                            className="w-full h-[44px] rounded-[10px] text-white text-[14px] font-semibold transition-opacity disabled:opacity-40"
                            style={{ background: NAVY }}
                          >
                            회원 확인하기
                          </button>
                        )}
                      </div>
                    )}

                    {/* 비회원 정보 입력 카드 */}
                    {caseType === 'non_member' && (
                      <div className="flex flex-col gap-3">
                        <div className="bg-[#DBEAFE] rounded-[12px] px-4 py-4">
                          <p className="text-[13px] font-semibold text-[#003E7F] mb-3">회원 정보 직접 입력하기</p>
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                              <p className="text-[13px] font-medium text-[#191919]">이름</p>
                              <input
                                type="text"
                                value={clientName}
                                onChange={(e) => { setClientName(e.target.value); if (nonMemberConfirmed) setNonMemberConfirmed(false) }}
                                placeholder="홍길동"
                                className="w-full h-[40px] pl-4 rounded-full bg-white border border-[#DBEAFE] text-[14px] text-[#191919] placeholder:text-[#94A3B8] outline-none focus:border-[#003E7F] transition-colors"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[13px] font-medium text-[#191919]">전화번호</p>
                              <input
                                type="tel"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder="010 - 1234-5678"
                                className="w-full h-[40px] pl-4 rounded-full bg-white border border-[#DBEAFE] text-[14px] text-[#191919] placeholder:text-[#94A3B8] outline-none focus:border-[#003E7F] transition-colors"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[13px] font-medium text-[#191919]">보유 질환</p>
                              <div className="relative">
                                <select
                                  value={clientDisease}
                                  onChange={(e) => { setClientDisease(e.target.value); setDiseaseSubType(''); setDiseaseStage(''); setGeneralGoals([]) }}
                                  className="w-full h-[40px] pl-4 pr-10 rounded-full bg-white border border-[#DBEAFE] text-[14px] text-[#191919] outline-none appearance-none focus:border-[#003E7F] transition-colors"
                                >
                                  <option value="">선택해주세요</option>
                                  <option value="cancer">암 환우</option>
                                  <option value="chronic">만성질환</option>
                                  <option value="general">일반 건강관리</option>
                                </select>
                                <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="8" viewBox="0 0 12 8" fill="none">
                                  <path d="M1 1L6 6L11 1" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>
                            {clientDisease && (
                              <NonMemberSubFields
                                disease={clientDisease}
                                subType={diseaseSubType} onSubType={setDiseaseSubType}
                                stage={diseaseStage} onStage={setDiseaseStage}
                                goals={generalGoals} onGoals={(v) => setGeneralGoals(prev => prev.includes(v) ? prev.filter(g => g !== v) : [...prev, v])}
                              />
                            )}
                          </div>
                        </div>
                        {error && <p className="text-[13px] text-red-500">{error}</p>}
                        {!nonMemberConfirmed && (
                          <button
                            type="button"
                            onClick={handleConfirmNonMember}
                            disabled={!clientName.trim()}
                            className="w-full h-[44px] rounded-[10px] text-white text-[14px] font-semibold transition-opacity disabled:opacity-40"
                            style={{ background: NAVY }}
                          >
                            정보 저장하기
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 프로필 카드 (확인 후) */}
                  {caseType === 'member' && memberConfirmed && selectedMember && (
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      {/* 아바타 + 이름 */}
                      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#F1F5F9]">
                        <div
                          className="flex-none size-[56px] rounded-full flex items-center justify-center text-white text-[20px] font-bold"
                          style={{ background: '#5BA3D9' }}
                        >
                          {initial}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <p className="text-[16px] font-bold text-[#191919]">{selectedMember.name}님</p>
                          <p className="text-[12px] text-[#64748B] truncate">{selectedMember.email}</p>
                        </div>
                      </div>

                      {/* 정보 행 */}
                      <div className="flex flex-col gap-3 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-medium text-[#94A3B8]">유형</span>
                          <span className="text-[14px] font-semibold text-[#003E7F]">일반회원</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-medium text-[#94A3B8]">상담 동의 여부</span>
                          <span className={`text-[14px] font-semibold ${selectedMember.info_share_agreed ? 'text-[#2B8E43]' : 'text-[#FF8E3C]'}`}>
                            {selectedMember.info_share_agreed ? '동의' : '미동의'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setMemberConfirmed(false); setSelectedMember(null); setSearchInput('') }}
                        className="w-full h-[36px] rounded-[8px] border border-[#D2DEEA] text-[13px] font-medium text-[#64748B] hover:border-[#003E7F] hover:text-[#003E7F] transition-colors"
                      >
                        회원 변경
                      </button>
                    </div>
                  )}

                  {/* 비회원 프로필 카드 (저장 후) */}
                  {caseType === 'non_member' && nonMemberConfirmed && (
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#F1F5F9]">
                        <div
                          className="flex-none size-[56px] rounded-full flex items-center justify-center text-white text-[20px] font-bold"
                          style={{ background: '#5BA3D9' }}
                        >
                          {clientName.charAt(0)}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <p className="text-[16px] font-bold text-[#191919]">{clientName}님</p>
                          <p className="text-[12px] text-[#94A3B8]">비회원</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-medium text-[#94A3B8]">유형</span>
                          <span className="text-[14px] font-semibold text-[#64748B]">{t('caseCreate.typeNonMember')}</span>
                        </div>
                        {clientDisease && (
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-medium text-[#94A3B8]">보유 질환</span>
                            <span className="text-[14px] font-semibold text-[#003E7F]">{DISEASE_LABEL[clientDisease]}</span>
                          </div>
                        )}
                        {clientPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-medium text-[#94A3B8]">전화번호</span>
                            <span className="text-[14px] font-semibold text-[#191919]">{clientPhone}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNonMemberConfirmed(false)}
                        className="w-full h-[36px] rounded-[8px] border border-[#D2DEEA] text-[13px] font-medium text-[#64748B] hover:border-[#003E7F] hover:text-[#003E7F] transition-colors"
                      >
                        정보 변경
                      </button>
                    </div>
                  )}

                </div>

                {/* 우측: 상담 유형 + 메모 + 제출 (확인 후 표시) */}
                {showForm && (
                  <div className="flex-[4] min-w-0 flex flex-col gap-4">
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <p className="text-[16px] font-bold text-[#1E293B] mb-4">보유 질환</p>
                      {caseType === 'non_member' ? (
                        clientDisease ? (
                          <span className="h-[36px] px-4 rounded-full text-[14px] font-medium bg-[#003E7F] text-white flex items-center w-fit">
                            {DISEASE_LABEL[clientDisease]}
                          </span>
                        ) : (
                          <p className="text-[14px] text-[#94A3B8]">입력한 보유 질환이 없습니다</p>
                        )
                      ) : (
                        <>
                          <CategoryChips active={category} onSelect={(c) => { setCategory(c); setDiseaseSubType(''); setDiseaseStage(''); setGeneralGoals([]) }} />
                          {category && (
                            <div className="mt-4">
                              <NonMemberSubFields
                                disease={category}
                                subType={diseaseSubType} onSubType={setDiseaseSubType}
                                stage={diseaseStage} onStage={setDiseaseStage}
                                goals={generalGoals} onGoals={(v) => setGeneralGoals(prev => prev.includes(v) ? prev.filter(g => g !== v) : [...prev, v])}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                      <p className="text-[16px] font-bold text-[#1E293B] mb-4">{t('caseCreate.sectionMemo')}</p>
                      <MemoBox value={memo} onChange={setMemo} placeholder={t('caseCreate.memoPlaceholder')} />
                    </div>
                    {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={mutation.isPending}
                      className="w-full h-[48px] rounded-[12px] text-white text-[15px] font-semibold transition-opacity disabled:opacity-50"
                      style={{ background: NAVY }}
                    >
                      {mutation.isPending ? t('caseCreate.submitting') : t('caseCreate.submit')}
                    </button>
                  </div>
                )}

              </div>
            )
          })()}

        </div>
      </div>
    </AppShell>
    </>
  )
}
