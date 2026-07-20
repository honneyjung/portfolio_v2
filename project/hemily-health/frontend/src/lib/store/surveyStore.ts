import { create } from 'zustand'
import type { SurveyState, CancerDetail, ChronicDetail } from '../../types'

// ── 초기값 ────────────────────────────────────────────────
const initialState: SurveyState = {
  gender:          undefined,
  birthDate:       undefined,
  ageGroup:        undefined,
  selectedCancers:  [],
  selectedChronics: [],
  cancerDetails:   {},
  chronicDetails:  {},
  healthGoals:     [],
  hasCancer:       null,
  hasChronic:      null,
  symptoms:        [],
  hasMedication:   null,
  medications:     '',
}

// ── 나이대 자동 계산 유틸 ──────────────────────────────────
export function calcAgeGroup(birthDate: string): string {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const notYetBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (notYetBirthday) age -= 1

  if (age < 20)  return '10s'
  if (age < 30)  return '20s'
  if (age < 40)  return '30s'
  if (age < 50)  return '40s'
  if (age < 60)  return '50s'
  return '60s+'
}

// ── 스토어 타입 ───────────────────────────────────────────
interface SurveyStore extends SurveyState {
  // STEP 1
  setGender:    (gender: SurveyState['gender']) => void
  setBirthDate: (date: string) => void              // YYYY-MM-DD, ageGroup 자동 계산

  // STEP 2
  toggleCancer:  (value: string) => void            // 암종 선택 토글
  toggleChronic: (value: string) => void            // 만성질환 선택 토글
  clearCancers:  () => void                         // 해당없음 선택
  clearChronics: () => void                         // 해당없음 선택

  // STEP 3-A
  setCancerDetail: (cancer: string, detail: Partial<CancerDetail>) => void

  // STEP 3-B
  setChronicDetail: (chronic: string, detail: Partial<ChronicDetail>) => void

  // STEP 3-C
  toggleHealthGoal: (value: string) => void

  // NEW FLOW
  wantsGeneralCare: boolean          // "개인 건강관리" 선택 → 일반인 유형, 바로 목표로
  setWantsGeneralCare: (v: boolean) => void
  setHasCancer:    (v: boolean) => void
  setHasChronic:   (v: boolean) => void
  setSymptoms:     (v: string[]) => void
  toggleSymptom:   (v: string) => void
  setHasMedication:(v: boolean) => void
  setMedications:  (v: string) => void

  // 유틸
  reset: () => void

  // 분기 판단 헬퍼
  hasAnyCancer:  () => boolean
  hasAnyChronic: () => boolean
  isGeneralUser: () => boolean   // 암·만성 모두 해당없음
}

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  ...initialState,

  // ── STEP 1 ───────────────────────────────────────────
  setGender: (gender) => set({ gender }),

  setBirthDate: (birthDate) =>
    set({ birthDate, ageGroup: calcAgeGroup(birthDate) }),

  // ── STEP 2 ───────────────────────────────────────────
  toggleCancer: (value) =>
    set((s) => {
      const exists = s.selectedCancers.includes(value)
      return {
        selectedCancers: exists
          ? s.selectedCancers.filter((v) => v !== value)
          : [...s.selectedCancers, value],
      }
    }),

  toggleChronic: (value) =>
    set((s) => {
      const exists = s.selectedChronics.includes(value)
      return {
        selectedChronics: exists
          ? s.selectedChronics.filter((v) => v !== value)
          : [...s.selectedChronics, value],
      }
    }),

  clearCancers:  () => set({ selectedCancers: [],  cancerDetails: {} }),
  clearChronics: () => set({ selectedChronics: [], chronicDetails: {} }),

  // ── STEP 3-A ─────────────────────────────────────────
  setCancerDetail: (cancer, detail) =>
    set((s) => ({
      cancerDetails: {
        ...s.cancerDetails,
        [cancer]: {
          treatmentStage: '',
          symptoms: [],
          goals: [],
          ...(s.cancerDetails[cancer] as Partial<CancerDetail> | undefined),
          ...detail,
        },
      },
    })),

  // ── STEP 3-B ─────────────────────────────────────────
  setChronicDetail: (chronic, detail) =>
    set((s) => ({
      chronicDetails: {
        ...s.chronicDetails,
        [chronic]: {
          managementStage: '',
          hasMedication: false,
          symptoms: [],
          ...(s.chronicDetails[chronic] as Partial<ChronicDetail> | undefined),
          ...detail,
        },
      },
    })),

  // ── STEP 3-C ─────────────────────────────────────────
  toggleHealthGoal: (value) =>
    set((s) => {
      const exists = s.healthGoals.includes(value)
      return {
        healthGoals: exists
          ? s.healthGoals.filter((v) => v !== value)
          : [...s.healthGoals, value],
      }
    }),

  // ── NEW FLOW ─────────────────────────────────────────
  wantsGeneralCare: false,
  setWantsGeneralCare: (v) => set({ wantsGeneralCare: v }),
  setHasCancer:    (v) => set({ hasCancer: v }),
  setHasChronic:   (v) => set({ hasChronic: v }),
  setSymptoms:     (v) => set({ symptoms: v }),
  toggleSymptom:   (v) =>
    set((s) => {
      const exists = s.symptoms.includes(v)
      return { symptoms: exists ? s.symptoms.filter((x) => x !== v) : [...s.symptoms, v] }
    }),
  setHasMedication:(v) => set({ hasMedication: v }),
  setMedications:  (v) => set({ medications: v }),

  // ── 유틸 ─────────────────────────────────────────────
  reset: () => set({ ...initialState, wantsGeneralCare: false }),

  hasAnyCancer:  () => get().selectedCancers.length > 0,
  hasAnyChronic: () => get().selectedChronics.length > 0,
  isGeneralUser: () =>
    get().selectedCancers.length === 0 && get().selectedChronics.length === 0,
}))
