// 암 치료 단계별 제품 권장 용량표
// - stage code(value)는 백엔드 treatment_stages.stage_code(cancer) / CANCER_STAGE_LIST와 일치
// - 값: 숫자(권장 정/포 수) · 범위(예: 4~6) · 'O'(권장) · '-'(해당 없음)
// ⚠️ 자료(이미지)에서 옮긴 값이므로 원본과 한 번 더 대조 필요

export interface CancerDosageStage {
  code: string
  label: string
}

// 컬럼 순서 = CANCER_DOSAGE_ROWS.values 인덱스 순서와 1:1 대응
export const CANCER_DOSAGE_STAGES: CancerDosageStage[] = [
  { code: 'PRE_SURGERY',           label: '수술 전' },
  { code: 'POST_SURGERY',          label: '수술 후' },
  { code: 'CHEMO_PERIOD',          label: '항암 전·중·후-3개월' },
  { code: 'RADIO_PERIOD',          label: '방사선 전·중·후-3개월' },
  { code: 'POST_CHEMO_3_6M',       label: '항암 후 3-6개월' },
  { code: 'POST_CHEMO_6_12M',      label: '항암 후 6-12개월' },
  { code: 'IMMUNE_CARE_1_5Y',      label: '1-5년' },
  { code: 'LIFELONG_CARE_5Y_PLUS', label: '5년 이후 평생' },
  { code: 'ADVANCED_METASTASIS',   label: '전이/재발·말기암' },
  { code: 'MARKER_ELEVATION_ONLY', label: '종양수치만 높음' },
]

export interface CancerDosageRow {
  product: string
  values: string[] // length === CANCER_DOSAGE_STAGES.length (10)
}

export const CANCER_DOSAGE_ROWS: CancerDosageRow[] = [
  { product: '생식',       values: ['2',   '2',   '2',   '2',   '2',   '2',   '1',   '1',   '2',   '2'] },
  { product: '이뮨푸드',    values: ['4~6', '4~6', '4~6', '6~8', '4~6', '4',   '2~4', '2',   '4~8', '6'] },
  { product: '휴젠푸드',    values: ['2~3', '2~3', '3',   '3',   '3',   '3',   '2',   '2',   '3',   '3'] },
  { product: '효소환',     values: ['2',   '3',   '3',   '3',   '3',   '2',   '2',   '1',   '3',   '2'] },
  { product: '유산균',     values: ['2',   '3',   '3',   '3',   '3',   '2',   '2',   '2',   '3',   '3'] },
  { product: '뼈건강',     values: ['2~4', '2~4', '2~4', '2~4', '2~4', '2~4', '2~4', '2',   '4',   '2~4'] },
  { product: '알칼리수',    values: ['O',   'O',   'O',   'O',   'O',   'O',   'O',   'O',   'O',   'O'] },
  { product: '미슬토',     values: ['O',   'O',   'O',   'O',   'O',   'O',   'O',   '-',   'O',   'O'] },
  { product: '자닥신',     values: ['O',   'O',   'O',   'O',   'O',   'O',   'O',   '-',   'O',   'O'] },
  { product: '칵테일주사',  values: ['O',   'O',   'O',   'O',   '-',   '-',   '-',   '-',   'O',   '-'] },
  { product: 'T세포치료',   values: ['O',   'O',   'O',   'O',   '-',   '-',   '-',   '-',   'O',   '-'] },
  { product: '고주파',     values: ['O',   '-',   'O',   '-',   '-',   '-',   '-',   '-',   'O',   '-'] },
  { product: '전신온열',    values: ['O',   'O',   'O',   '-',   'O',   '-',   '-',   '-',   'O',   '-'] },
  { product: '고압산소',    values: ['O',   'O',   'O',   'O',   'O',   '-',   '-',   '-',   'O',   '-'] },
  { product: '운동',       values: ['O',   '-',   'O',   'O',   'O',   'O',   'O',   'O',   'O',   'O'] },
]

// 표 상단 안내 문구
export const CANCER_DOSAGE_NOTE =
  '※ 항생제 섭취 이후에는 2시간 후 유산균 섭취하기 / 유산균 1일 6~10포   ※ 효소환과 뼈건강은 영양면역관리 시 도움이 된다.'
