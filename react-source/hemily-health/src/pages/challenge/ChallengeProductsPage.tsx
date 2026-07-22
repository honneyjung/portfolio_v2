import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Header from '../../components/layout/Header'
import apiClient from '../../lib/api/client'
import { useChallengeDraftStore, type DraftProduct } from '../../lib/store/challengeDraftStore'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'
const RECENT_KEY = 'challenge-recent-searches'

type CatalogProduct = {
  id: string
  product_name: string
  dna_stage: string
  tier_type: string
  key_ingredients?: string | null
  intake_timing?: string | null
  package_image_url?: string | null
  summary?: string | null
}

// 카탈로그 제품은 plan_tier가 없어 dna_stage를 칩으로 표시
function dnaBg(stage: string) {
  if (stage === 'D') return 'bg-[#0EA5E9]'
  if (stage === 'N') return 'bg-[#22C55E]'
  if (stage === 'A') return 'bg-[#F97316]'
  return 'bg-[#5BA3D9]'
}

function CheckCircle({ selected }: { selected: boolean }) {
  return selected ? (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="13" fill="#003E7F" />
      <path d="M7 13L11 17L19 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="12" stroke="#003E7F" strokeWidth="1.5" />
      <path d="M7 13L11 17L19 9" stroke="#C5D6E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export default function ChallengeProductsPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const { products: draftProducts, setProducts } = useChallengeDraftStore()

  const [search, setSearch] = useState('')
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(draftProducts.map((p) => p.product_id))
  )

  const { data, isLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => apiClient.get('/products', {
      params: { limit: 100 },
      validateStatus: (s) => s < 500,
    }),
    staleTime: 5 * 60 * 1000,
  })

  const allProducts: CatalogProduct[] = useMemo(() => {
    if (!data || data.status !== 200) return []
    // 백엔드가 List[ProductResponse] plain 배열로 반환
    return Array.isArray(data.data) ? (data.data as CatalogProduct[]) : []
  }, [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allProducts
    // 제품명 + 성분(key_ingredients) 모두 검색 (placeholder: "영양제 혹은 성분")
    return allProducts.filter((p) =>
      p.product_name.toLowerCase().includes(q) ||
      (p.key_ingredients?.toLowerCase().includes(q) ?? false)
    )
  }, [allProducts, search])

  const commitSearch = (term: string) => {
    const q = term.trim()
    if (!q) return
    setRecent((prev) => {
      const next = [q, ...prev.filter((r) => r !== q)].slice(0, 10)
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }

  const clearRecent = () => {
    setRecent([])
    try { localStorage.removeItem(RECENT_KEY) } catch { /* noop */ }
  }

  const toggle = (p: CatalogProduct) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(p.id)) next.delete(p.id)
      else next.add(p.id)
      return next
    })
  }

  const savedRef = useRef(false)

  const handleSave = () => {
    // 연속 클릭 시 navigate(-1)이 중복 실행되는 것 방지
    if (savedRef.current) return
    savedRef.current = true
    // 기존 draftProducts에서 선택된 항목 유지 + 새로 추가된 항목 병합
    const existing = draftProducts.filter((p) => selectedIds.has(p.product_id))
    const existingIds = new Set(existing.map((p) => p.product_id))

    const fromCatalog: DraftProduct[] = allProducts
      .filter((p) => selectedIds.has(p.id) && !existingIds.has(p.id))
      .map((p) => ({
        product_id: p.id,
        product_name: p.product_name,
        dna_stage: p.dna_stage,
        intake_timing: p.intake_timing,
        package_image_url: p.package_image_url,
      }))

    setProducts([...existing, ...fromCatalog])
    navigate(-1)
  }

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9]">
      <Header showBack title={<span className="text-[17px] font-bold text-[#191919]">{t('create.supplementsPageTitle')}</span>} />

      {/* 검색 */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 bg-[#F8FAFF] rounded-full border-[0.5px] border-[#003E7F] pl-6 pr-4 h-[49px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(search) }}
            placeholder={t('create.supplementsSearchPlaceholder')}
            className="flex-1 min-w-0 text-[16px] text-[#191919] placeholder-[#C5C5C5] outline-none tracking-[-0.32px] bg-transparent"
          />
          <button
            type="button"
            onClick={() => commitSearch(search)}
            className="flex-shrink-0"
            aria-label="검색"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="#003E7F" strokeWidth="1.5" />
              <path d="M15.5 15.5L20 20" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-[100px]">
        {/* 최근 검색어 */}
        {recent.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">{t('create.supplementsRecent')}</p>
              <button type="button" onClick={clearRecent} className="text-[16px] text-[#191919] tracking-[-0.32px] underline">
                {t('create.supplementsClearAll')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearch(term)}
                  className="h-[40px] px-5 rounded-full bg-[#F1F5F9] border-[1.5px] border-[#003E7F] text-[16px] font-medium text-[#003E7F] tracking-[-0.32px]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 제품 목록 */}
        {isLoading ? (
          <p className="text-center text-[14px] text-[#94A3B8] pt-10 tracking-[-0.28px]">
            {t('create.supplementsLoading')}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[14px] text-[#94A3B8] pt-10 tracking-[-0.28px]">
            {t('create.supplementsNoResults')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => {
              const selected = selectedIds.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  className="flex items-center gap-3 bg-[#F8FAFF] rounded-[12px] pl-[28px] pr-5 py-[18px] text-left"
                >
                  <span className="flex-shrink-0">
                    <CheckCircle selected={selected} />
                  </span>
                  {p.package_image_url ? (
                    <img
                      src={p.package_image_url}
                      alt={p.product_name}
                      className="w-[68px] h-[68px] object-cover rounded-[8px] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-[68px] h-[68px] rounded-[8px] bg-[#E2E8F0] flex-shrink-0" />
                  )}
                  <div className="flex flex-col gap-2 min-w-0">
                    <span className={`inline-flex items-center justify-center text-[#F8FAFF] text-[12px] px-2 py-1 rounded-[40px] w-fit ${dnaBg(p.dna_stage)}`}>
                      {p.dna_stage === 'DNA_ALL' ? 'DNA' : p.dna_stage}
                    </span>
                    <p className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px] leading-tight">{p.product_name}</p>
                    {p.intake_timing && (
                      <p className="text-[12px] text-[#64748B] tracking-[-0.24px]">{p.intake_timing}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-[#F1F5F9] px-5 py-4">
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
          style={{ backgroundImage: NAVY_GRADIENT }}
        >
          {t('create.supplementsConfirm')}
        </button>
      </div>
    </div>
  )
}
