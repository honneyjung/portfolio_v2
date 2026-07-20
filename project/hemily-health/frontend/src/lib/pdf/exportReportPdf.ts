import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { TFunction } from 'i18next'
import logoUrl from '../../assets/images/img_logo.png'
import type { Product } from '../../types'
import { CANCER_DOSAGE_STAGES, CANCER_DOSAGE_ROWS, CANCER_DOSAGE_NOTE } from './cancerStageDosage'
import { CONSULT_GUIDE } from './consultGuide'

// ── 입력 타입 ──────────────────────────────────────────
export interface ExportReportPdfInput {
  t: TFunction<'report'>
  userName: string
  gender?: string
  diseases: string[]
  treatmentStage?: string  // 암 치료 단계 code (예: PRE_SURGERY)
  isCancer?: boolean       // 암 환우 케이스 → 단계별 용량표 추가
  issuedDate: string // 표시용 "2026.05.27"
  fileDate: string // 파일명용 "20260527"
  products: Product[]
  diseaseTypeMap?: Record<string, string>  // disease_id → 'cancer' | 'chronic'
  // 해밀리안 상담용 PDF 모드 (해밀리안 전용 화면에서 호출 — 트리거는 추후 연결)
  consultGuide?: boolean
  hemilianName?: string   // 로그인 해밀리안 이름
  hemilianPhone?: string  // 로그인 해밀리안 연락처 (회원가입 시 입력, /users/me phone_number)
}

// 암 치료 단계 code → 표시 라벨
function cancerStageLabel(codeOrLabel?: string): string {
  if (!codeOrLabel) return ''
  const hit = CANCER_DOSAGE_STAGES.find((s) => s.code === codeOrLabel || s.label === codeOrLabel)
  return hit ? hit.label : codeOrLabel
}

// ── HTML 이스케이프 ────────────────────────────────────
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c))
}

// ── 원형 알파벳 배지 ───────────────────────────────────
// html2canvas는 div+line-height/flex로 단일 글자를 세로 중앙정렬하면
// 글자를 아래로 치우치게 렌더한다. SVG <text dominant-baseline=central>로
// 정확히 중앙정렬한다. (그라디언트는 기존 배지와 동일)
let _badgeSeq = 0
// fill 미지정 시 기존 파란 그라디언트, 지정 시 단색 배경
function circleBadge(size: number, font: number, text: string, fill?: string): string {
  const id = `badgeGrad${_badgeSeq++}`
  const circleFill = fill
    ? fill
    : `url(#${id})`
  const def = fill
    ? ''
    : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0.044" y2="1">
        <stop offset="0.315" stop-color="#003E7F"/><stop offset="0.967" stop-color="#052649"/>
      </linearGradient></defs>`
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none;display:block;">
      ${def}
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${circleFill}"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${font}" font-weight="700" font-family="Pretendard,-apple-system,BlinkMacSystemFont,sans-serif" fill="#F8FAFF">${esc(text)}</text>
    </svg>`
}

// ── 이미지 로드 대기 (캡처 전 보장) ────────────────────
function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res()
            img.onerror = () => res()
          }),
    ),
  ).then(() => undefined)
}

// ── 커버 페이지 (① 커버) ──────────────────────────────
function coverHtml(input: ExportReportPdfInput): string {
  const { t } = input
  return `
  <div style="width:794px;height:1123px;box-sizing:border-box;background:linear-gradient(177deg,#003E7F 31%,#052649 97%);color:#F8FAFF;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 64px;text-align:center;">
    <img src="${logoUrl}" alt="" style="height:80px;width:auto;filter:brightness(0) invert(1);margin-bottom:40px;" />
    <div style="font-size:34px;font-weight:700;letter-spacing:-0.5px;margin-bottom:12px;">${esc(t('pdf.cover.brand'))}</div>
    <div style="font-size:26px;font-weight:700;letter-spacing:6px;margin-bottom:20px;">${esc(t('pdf.cover.tagline'))}</div>
    <div style="font-size:15px;font-weight:500;color:#C5D6E8;line-height:1.6;max-width:520px;margin-bottom:56px;">${esc(t('pdf.cover.subtitle'))}</div>
    <div style="width:64px;height:2px;background:rgba(248,250,255,0.5);margin-bottom:32px;"></div>
    <div style="font-size:22px;font-weight:700;margin-bottom:8px;">${esc(t('pdf.cover.reportFor', { name: input.userName }))}</div>
    <div style="font-size:14px;font-weight:500;color:#A0B6CE;margin-bottom:72px;">${esc(t('pdf.cover.issuedDate', { date: input.issuedDate }))}</div>
    <div style="border:1px solid rgba(248,250,255,0.4);border-radius:12px;padding:24px 28px;max-width:560px;">
      <div style="font-size:14px;font-weight:700;letter-spacing:2px;color:#69BBE4;margin-bottom:10px;">${esc(t('pdf.cover.visionLabel'))}</div>
      <div style="font-size:14px;font-weight:500;line-height:1.7;color:#F1F5F9;">${esc(t('pdf.cover.visionBody'))}</div>
    </div>
  </div>`
}

// ── 유저 정보 행 (② 유저 정보 요약) ───────────────────
function infoRow(label: string, value: string, withBorder: boolean): string {
  return `<div style="display:flex;${withBorder ? 'border-top:1px solid #E2E8F0;' : ''}">
    <div style="width:120px;flex:none;background:#F8FAFF;padding:12px 16px;font-size:13px;font-weight:600;color:#475569;">${esc(label)}</div>
    <div style="flex:1;padding:12px 16px;font-size:13px;color:#1E293B;">${esc(value)}</div>
  </div>`
}

// ── 제품 행 (③ 제품 목록 + ④ 섭취 시점·이유) ──────────
function productRow(input: ExportReportPdfInput, p: Product): string {
  const { t } = input
  const timing = p.intake_timing ? `${esc(t('pdf.products.intake'))} : ${esc(p.intake_timing)}` : ''
  const method = p.intake_method ? `${esc(t('pdf.products.method'))} : ${esc(p.intake_method)}` : ''
  const intake = [timing, method].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;')
  const reason = p.personalized_reason || p.summary || p.key_ingredients || ''
  // package_image_url이 blob: 또는 data: URL(사전 변환 성공)이면 img로, 실패·미존재면 placeholder
  const resolvedImgSrc = p.package_image_url
  const isLocalSrc = resolvedImgSrc?.startsWith('blob:') || resolvedImgSrc?.startsWith('data:')
  const img = isLocalSrc
    ? `<img src="${resolvedImgSrc}" style="width:56px;height:56px;border-radius:6px;object-fit:cover;flex:none;background:#EEF3F7;" />`
    : `<div style="width:56px;height:56px;border-radius:6px;background:#EEF3F7;flex:none;"></div>`
  return `
  <div data-pdf-block style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #F1F5F9;">
    ${img}
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:15px;font-weight:700;color:#1E293B;">${esc(p.product_name)}</span>
      </div>
      ${intake ? `<div style="font-size:12px;color:#64748B;margin-bottom:2px;">${intake}</div>` : ''}
      ${reason ? `<div style="font-size:12px;color:#475569;line-height:1.5;">${esc(t('pdf.products.reason'))} : ${esc(reason)}</div>` : ''}
    </div>
  </div>`
}

// ── HWANG'S 솔루션 (6가지 생활습관) ────────────────────
function hwangHtml(t: TFunction<'report'>): string {
  const letters = ['H', 'W', 'A', 'N', 'G', 'S'] as const
  const rows = letters
    .map((L, i) => {
      return `
      <div style="display:flex;gap:12px;align-items:center;padding:9px 0;${i > 0 ? 'border-top:1px solid #F1F5F9;' : ''}">
        ${circleBadge(28, 14, L)}
        <div style="flex:1;min-width:0;">
          <span style="font-size:14px;font-weight:700;color:#003E7F;">${esc(t(`pdf.hwang.items.${L}.name`))}</span>
          <div style="font-size:12px;color:#475569;margin-top:2px;line-height:1.5;">${esc(t(`pdf.hwang.items.${L}.desc`))}</div>
        </div>
      </div>`
    })
    .join('')
  return `
    <div data-pdf-block style="margin-bottom:36px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${esc(t('pdf.hwang.title'))}</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:14px;">${esc(t('pdf.hwang.subtitle'))}</div>
      <div style="border:1px solid #E2E8F0;border-radius:10px;padding:6px 16px;">${rows}</div>
    </div>`
}

// ── 암 치료 단계별 권장 용량표 (암 환우 케이스 전용) ──
function cancerStageDosageHtml(input: ExportReportPdfInput): string {
  const { t } = input
  const cur = (input.treatmentStage || '').trim()
  const curIdx = CANCER_DOSAGE_STAGES.findIndex((s) => s.code === cur || s.label === cur)

  const headCells = CANCER_DOSAGE_STAGES.map((s, i) => {
    const hl = i === curIdx
    return `<th style="padding:6px 3px;font-size:8.5px;font-weight:700;text-align:center;line-height:1.25;border-left:1px solid rgba(255,255,255,0.18);${hl ? 'background:#5BA3D9;' : ''}color:#F8FAFF;">${esc(s.label)}</th>`
  }).join('')

  const bodyRows = CANCER_DOSAGE_ROWS.map((row) => {
    const cells = row.values.map((v, i) => {
      const hl = i === curIdx
      return `<td style="padding:5px 3px;font-size:10px;text-align:center;color:#1E293B;border-bottom:1px solid #E2E8F0;border-left:1px solid #F1F5F9;${hl ? 'background:#EAF0F7;font-weight:700;' : ''}">${esc(v)}</td>`
    }).join('')
    return `<tr data-pdf-block>
      <td style="padding:5px 8px;font-size:10px;font-weight:700;color:#1E293B;border-bottom:1px solid #E2E8F0;white-space:nowrap;">${esc(row.product)}</td>
      ${cells}
    </tr>`
  }).join('')

  const curNote = curIdx >= 0
    ? `<div style="font-size:12px;color:#003E7F;font-weight:600;margin-bottom:10px;">${esc(t('pdf.cancerDosage.current', { stage: cancerStageLabel(cur) }))}</div>`
    : ''

  return `
  <div data-pdf-block style="margin-bottom:36px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${esc(t('pdf.cancerDosage.title'))}</div>
    <div style="font-size:11px;color:#9D0006;line-height:1.5;margin-bottom:12px;">${esc(CANCER_DOSAGE_NOTE)}</div>
    ${curNote}
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup><col style="width:11%;" />${CANCER_DOSAGE_STAGES.map(() => '<col style="width:8.9%;" />').join('')}</colgroup>
      <thead>
        <tr style="background:#003E7F;color:#F8FAFF;">
          <th style="padding:6px 8px;font-size:9px;font-weight:700;text-align:left;">${esc(t('pdf.cancerDosage.colProduct'))}</th>
          ${headCells}
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>`
}

// ── 상담 가이드 멘트 (해밀리안 상담용 전용) ───────────
function consultGuideHtml(t: TFunction<'report'>): string {
  const rows = CONSULT_GUIDE.map((g) => `
    <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid #F1F5F9;">
      ${circleBadge(36, 16, g.stage)}
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;color:#003E7F;margin-bottom:4px;">${esc(g.stageName)}</div>
        <div style="font-size:12px;color:#475569;line-height:1.6;">${esc(g.message)}</div>
        <div style="margin-top:6px;font-size:11px;color:#64748B;">${esc(t('pdf.consult.keyword'))} : <span style="font-weight:600;color:#003E7F;">${esc(g.keyword)}</span></div>
      </div>
    </div>`).join('')
  return `
    <div data-pdf-block style="margin-bottom:36px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${esc(t('pdf.consult.title'))}</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:8px;">${esc(t('pdf.consult.subtitle'))}</div>
      <div style="border:1px solid #E2E8F0;border-radius:10px;padding:4px 16px;">${rows}</div>
    </div>`
}

// ── 담당 해밀리안 연락처 (상담용 하단) ─────────────────
function hemilianFooterHtml(input: ExportReportPdfInput): string {
  const { t } = input
  const contact = [input.hemilianName, input.hemilianPhone].filter(Boolean).join('  ·  ')
  if (!contact) return ''
  return `
    <div data-pdf-block style="margin-top:24px;border-top:1px solid #E2E8F0;padding-top:14px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:12px;color:#64748B;">${esc(t('pdf.consult.managerLabel'))}</span>
      <span style="font-size:13px;font-weight:700;color:#003E7F;">${esc(contact)}</span>
    </div>`
}

// ── 등급 안내 테이블 (전 유저 공통) ───────────────────
function planGradeTableHtml(t: TFunction<'report'>): string {
  const TIERS = [
    { key: 'basic',    label: 'Basic',    color: '#69BBE4' },
    { key: 'standard', label: 'Standard', color: '#003E7F' },
    { key: 'premium',  label: 'Premium',  color: '#9D0006' },
  ] as const
  const rows = TIERS.map((tier, i) => `
    <tr style="${i > 0 ? 'border-top:1px solid #E2E8F0;' : ''}">
      <td style="padding:10px 12px;font-size:13px;font-weight:700;color:${tier.color};white-space:nowrap;">${esc(tier.label)}</td>
      <td style="padding:10px 12px;font-size:13px;color:#475569;line-height:1.6;">${esc(t(`planGrade.${tier.key}.concept`)).replace(/\n/g, '<br/>')}</td>
      <td style="padding:10px 12px;font-size:13px;color:#475569;line-height:1.6;">${esc(t(`planGrade.${tier.key}.target`)).replace(/\n/g, '<br/>')}</td>
    </tr>`).join('')
  return `
  <div data-pdf-block style="margin-bottom:36px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:14px;">${esc(t('planGrade.sectionTitle'))}</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #D2DEEA;border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:#003E7F;color:#F8FAFF;">
          <th style="padding:10px 12px;font-size:13px;font-weight:600;text-align:left;width:18%;">${esc(t('planGrade.colGrade'))}</th>
          <th style="padding:10px 12px;font-size:13px;font-weight:600;text-align:left;width:41%;">${esc(t('planGrade.colConcept'))}</th>
          <th style="padding:10px 12px;font-size:13px;font-weight:600;text-align:left;width:41%;">${esc(t('planGrade.colTarget'))}</th>
        </tr>
      </thead>
      <tbody style="background:#fff;">${rows}</tbody>
    </table>
  </div>`
}

// ── 본문 (②③④⑤ + HWANG'S + ⑥) ─────────────────────
function contentHtml(input: ExportReportPdfInput): string {
  const { t } = input
  const seenPdf = new Set<string>()
  const products = input.products.filter((p) => {
    const k = `${p.product_id}-${p.dna_stage}-${p.disease_id ?? ''}`
    if (seenPdf.has(k)) return false
    seenPdf.add(k)
    return true
  })

  const diseaseStr = input.diseases.length ? input.diseases.join(', ') : t('pdf.userInfo.none')
  const genderStr =
    input.gender === 'male'
      ? t('pdf.gender.male')
      : input.gender === 'female'
        ? t('pdf.gender.female')
        : input.gender
          ? t('pdf.gender.other')
          : t('pdf.userInfo.none')
  const stageStr = cancerStageLabel(input.treatmentStage) || t('pdf.userInfo.none')

  // ③④ 단계별 그룹 빌더 (재사용)
  const STAGES = ['D', 'N', 'A', 'DNA_ALL'] as const
  const PDF_TIERS = [
    { key: 'basic',    label: 'Basic',    color: '#69BBE4' },
    { key: 'standard', label: 'Standard', color: '#003E7F' },
    { key: 'premium',  label: 'Premium',  color: '#9D0006' },
  ]
  const TIER_CUMULATIVE: Record<string, string[]> = {
    basic:    ['basic'],
    standard: ['basic', 'standard'],
    premium:  ['basic', 'standard', 'premium'],
  }
  const buildStageGroupsHtml = (list: typeof products) =>
    STAGES.map((stage) => {
      const stageItems = list
        .filter((p) => p.dna_stage === stage)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      if (!stageItems.length) return ''
      const tierGroupsHtml = PDF_TIERS.map((tier) => {
        const tierItems = stageItems.filter((p) => (TIER_CUMULATIVE[tier.key] ?? [tier.key]).includes(p.plan_tier ?? ''))
        if (!tierItems.length) return ''
        const rows = tierItems.map((p) => productRow(input, p)).join('')
        return `
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:${tier.color};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #E2E8F0;">${esc(tier.label)} PLAN</div>
          ${rows}
        </div>`
      }).join('')
      return `
      <div data-pdf-block style="margin-bottom:24px;">
        <div style="font-size:15px;font-weight:700;color:#003E7F;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #C5D6E8;">${esc(t(`pdf.stageLabel.${stage}`))}</div>
        ${tierGroupsHtml}
      </div>`
    }).join('')

  // 암/만성 그룹 분리 (diseaseTypeMap 있을 때)
  let groupsHtml: string
  const dm = input.diseaseTypeMap
  if (dm && Object.keys(dm).length > 0) {
    const cancerList  = products.filter((p) => !p.disease_id || dm[p.disease_id] !== 'chronic')
    const chronicList = products.filter((p) => !!p.disease_id && dm[p.disease_id] === 'chronic')
    const sectionHeader = (label: string) =>
      `<div style="font-size:16px;font-weight:700;color:#003E7F;margin-bottom:14px;padding-bottom:8px;border-bottom:3px solid #003E7F;">${esc(label)}</div>`
    const cancerHtml  = cancerList.length  ? `<div style="margin-bottom:32px;">${sectionHeader('암 추천 제품')}${buildStageGroupsHtml(cancerList)}</div>` : ''
    const chronicHtml = chronicList.length ? `<div style="margin-bottom:32px;">${sectionHeader('만성질환 추천 제품')}${buildStageGroupsHtml(chronicList)}</div>` : ''
    groupsHtml = cancerHtml + chronicHtml
  } else {
    groupsHtml = buildStageGroupsHtml(products)
  }

  // ⑤ 복용량 표
  const th = 'padding:10px 12px;font-size:13px;font-weight:600;text-align:left;'
  const td = 'padding:10px 12px;font-size:13px;color:#1E293B;border-bottom:1px solid #E2E8F0;'
  const tableRows = products
    .map((p) => {
      const dosage = p.daily_dosage_min != null ? t('pdf.dosage.dosageUnit', { count: p.daily_dosage_min }) : t('pdf.dosage.empty')
      return `<tr data-pdf-block>
        <td style="${td}">${esc(p.product_name)}</td>
        <td style="${td}">${esc(dosage)}</td>
        <td style="${td}">${esc(p.intake_method || '-')}</td>
        <td style="${td}">${esc(p.intake_timing || '-')}</td>
      </tr>`
    })
    .join('')

  return `
  <div style="width:794px;box-sizing:border-box;background:#fff;color:#1E293B;padding:48px 56px;">
    <!-- ② 유저 정보 요약 -->
    <div data-pdf-block style="margin-bottom:36px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:14px;">${esc(t('pdf.userInfo.title'))}</div>
      <div style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
        ${infoRow(t('pdf.userInfo.disease'), diseaseStr, false)}
        ${infoRow(t('pdf.userInfo.gender'), genderStr, true)}
        ${infoRow(t('pdf.userInfo.stage'), stageStr, true)}
      </div>
    </div>

    <!-- 등급 안내 (전 유저 공통) -->
    ${planGradeTableHtml(t)}

    <!-- ③④ 추천 제품 -->
    <div data-pdf-block style="margin-bottom:36px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:14px;">${esc(t('pdf.products.title'))}</div>
      ${groupsHtml}
    </div>

    <!-- ⑤ 권장 복용량 표 -->
    <div data-pdf-block style="margin-bottom:36px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:14px;">${esc(t('pdf.dosage.title'))}</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#003E7F;color:#F8FAFF;">
            <th style="${th}">${esc(t('pdf.dosage.colProduct'))}</th>
            <th style="${th}">${esc(t('pdf.dosage.colDosage'))}</th>
            <th style="${th}">${esc(t('pdf.dosage.colMethod'))}</th>
            <th style="${th}">${esc(t('pdf.dosage.colTiming'))}</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <!-- 암 치료 단계별 권장 용량표 (암 환우 케이스 전용) -->
    ${input.isCancer ? cancerStageDosageHtml(input) : ''}

    <!-- HWANG'S 솔루션 -->
    ${hwangHtml(t)}

    <!-- 상담 가이드 멘트 (해밀리안 상담용 전용) -->
    ${input.consultGuide ? consultGuideHtml(t) : ''}

    <!-- ⑥ 하단 안내문 -->
    <div data-pdf-block style="border:1.5px dashed #9D0006;background:#FFF5F2;border-radius:12px;padding:16px 20px;display:flex;gap:10px;align-items:center;">
      ${circleBadge(20, 12, 'i', '#9D0006')}
      <div style="font-size:13px;color:#9D0006;font-weight:500;"><span style="position:relative;top:-7px;display:inline-block;">${esc(t('pdf.disclaimer'))}</span></div>
    </div>

    <!-- 담당 해밀리안 연락처 (상담용 하단) -->
    ${input.consultGuide ? hemilianFooterHtml(input) : ''}
  </div>`
}

// ── 이미지 URL → blob URL ──────────────────────────────
// fetch 성공 시 URL.createObjectURL(blob) 반환 — blob: URL은 same-origin이므로
// html2canvas가 CORS 없이 렌더링할 수 있다.
// fetch 실패(CORS/네트워크) 시 '' 반환 → productRow에서 placeholder 처리.
async function fetchAsBlobUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'no-store' })
    if (!res.ok) return ''
    const blob = await res.blob()
    // S3가 Content-Type을 application/octet-stream으로 내려줄 때 보정
    const mime = blob.type && blob.type !== 'application/octet-stream'
      ? blob.type
      : url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
    const typed = mime !== blob.type ? new Blob([blob], { type: mime }) : blob
    return URL.createObjectURL(typed)
  } catch {
    return ''
  }
}

// ── 메인: 리포트 → PDF 다운로드 ───────────────────────
export async function exportReportPdf(input: ExportReportPdfInput): Promise<void> {
  const { t } = input

  // 제품 이미지를 blob URL로 사전 변환 (html2canvas CORS 우회)
  // blob: URL은 same-origin이므로 html2canvas가 CORS 검사 없이 렌더링 가능
  const imageUrlSet = new Set(input.products.map((p) => p.package_image_url).filter(Boolean) as string[])
  const blobUrlCache: Record<string, string> = {}
  await Promise.all(
    [...imageUrlSet].map(async (url) => {
      const result = await fetchAsBlobUrl(url)
      if (result) blobUrlCache[url] = result
    })
  )
  const resolvedProducts = input.products.map((p) =>
    p.package_image_url && blobUrlCache[p.package_image_url]
      ? { ...p, package_image_url: blobUrlCache[p.package_image_url] }
      : { ...p, package_image_url: null }  // fetch 실패 → placeholder 표시
  )
  const resolvedInput = { ...input, products: resolvedProducts }

  // 화면 밖 호스트에 렌더 (캡처용)
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;font-family:Pretendard,-apple-system,BlinkMacSystemFont,sans-serif;'
  document.body.appendChild(host)

  const cover = document.createElement('div')
  cover.innerHTML = coverHtml(resolvedInput)
  host.appendChild(cover)

  const content = document.createElement('div')
  content.innerHTML = contentHtml(resolvedInput)
  host.appendChild(content)

  try {
    await waitForImages(host)

    const SCALE = 2
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    // 커버 → 1페이지 (전체)
    const coverCanvas = await html2canvas(cover, { scale: SCALE, useCORS: true, backgroundColor: '#003E7F' })
    pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, pageH)

    // 안전 분할점 수집 (각 블록 상단 = 페이지를 끊어도 되는 위치, 캔버스 px 기준)
    const contentTop = content.getBoundingClientRect().top
    const breakpoints = Array.from(content.querySelectorAll<HTMLElement>('[data-pdf-block]'))
      .map((el) => (el.getBoundingClientRect().top - contentTop) * SCALE)
      .filter((y) => y > 0)
      .sort((a, b) => a - b)

    // 본문 캡처 후, 행/표 중간이 잘리지 않도록 분할점에서만 페이지 분할
    const contentCanvas = await html2canvas(content, { scale: SCALE, useCORS: true, backgroundColor: '#ffffff' })
    const pxPerPt = contentCanvas.width / pageW
    const pageHpx = pageH * pxPerPt
    const totalH = contentCanvas.height

    let top = 0
    while (top < totalH) {
      const limit = top + pageHpx
      let cut = Math.min(limit, totalH)
      if (cut < totalH) {
        // limit 이하의 가장 큰 분할점에서 끊는다 (블록 중간 잘림 방지)
        const candidates = breakpoints.filter((y) => y > top + 1 && y <= limit)
        if (candidates.length) cut = candidates[candidates.length - 1]
        // 단일 블록이 한 페이지보다 큰 경우엔 강제로 limit에서 자른다 (무한루프 방지)
        if (cut <= top) cut = limit
      }
      const sliceH = cut - top
      const slice = document.createElement('canvas')
      slice.width = contentCanvas.width
      slice.height = sliceH
      const ctx = slice.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, slice.width, slice.height)
        ctx.drawImage(contentCanvas, 0, top, contentCanvas.width, sliceH, 0, 0, contentCanvas.width, sliceH)
      }
      pdf.addPage()
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, sliceH / pxPerPt)
      top = cut
    }

    const filename = `${t('pdf.filenamePrefix')}_${input.userName}_${input.fileDate}.pdf`
    pdf.save(filename)
  } finally {
    document.body.removeChild(host)
    // 생성한 blob URL 해제 (메모리 누수 방지)
    Object.values(blobUrlCache).forEach((u) => URL.revokeObjectURL(u))
  }
}
