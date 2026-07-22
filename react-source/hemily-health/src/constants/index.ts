// ─────────────────────────────────────────────────────────
// Q3 · 질환 선택지 (암종 9종 / 만성질환 6종)
// ─────────────────────────────────────────────────────────

export const CANCER_TYPES = [
  { value: 'breast_cancer'          },
  { value: 'colon_cancer'           },
  { value: 'lung_cancer'            },
  { value: 'stomach_cancer'         },
  { value: 'thyroid_cancer'         },
  { value: 'liver_cancer'           },
  { value: 'uterine_ovarian_cancer' },
  { value: 'prostate_cancer'        },
  { value: 'other_cancer'           },
] as const

export const CHRONIC_TYPES = [
  { value: 'diabetes'        },
  { value: 'hypertension'    },
  { value: 'hyperlipidemia'  },
  { value: 'thyroid_disease' },
  { value: 'kidney_disease'  },
  { value: 'other_chronic'   },
] as const

export type CancerTypeValue  = typeof CANCER_TYPES[number]['value']
export type ChronicTypeValue = typeof CHRONIC_TYPES[number]['value']

// ─────────────────────────────────────────────────────────
// Q4-A · 암 치료 단계
// ─────────────────────────────────────────────────────────

export const CANCER_TREATMENT_STAGES = [
  { value: 'pre_surgery'        },
  { value: 'post_surgery_chemo' },
  { value: 'chemo_no_surgery'   },
  { value: 'followup'           },
  { value: 'remission'          },
  { value: 'recurrence'         },
  { value: 'tumor_marker_rise'  },
] as const

// '추적 관찰 중' 선택 시 세부 단계
export const CANCER_FOLLOWUP_STAGES = [
  { value: 'followup_under_1y' },
  { value: 'followup_1_5y'     },
  { value: 'followup_5y_plus'  },
] as const

// ─────────────────────────────────────────────────────────
// Q4-B · 만성질환 관리 단계
// ─────────────────────────────────────────────────────────

export const CHRONIC_MANAGEMENT_STAGES = [
  { value: 'initial'   },
  { value: 'managing'  },
  { value: 'intensive' },
] as const

// ─────────────────────────────────────────────────────────
// Q5-A · 암 증상·부작용 / 관리 목표
// ─────────────────────────────────────────────────────────

export const CANCER_SYMPTOMS = [
  { value: 'severe_fatigue'     },
  { value: 'appetite_loss'      },
  { value: 'weight_loss'        },
  { value: 'nausea_vomiting'    },
  { value: 'immune_weakness'    },
  { value: 'digestive_disorder' },
  { value: 'sleep_disorder'     },
  { value: 'pain_inflammation'  },
  { value: 'hair_loss'          },
  { value: 'none'               },
] as const

export const CANCER_GOALS = [
  { value: 'immunity'           },
  { value: 'antioxidant'        },
  { value: 'fatigue_recovery'   },
  { value: 'weight_maintenance' },
  { value: 'bone_health'        },
  { value: 'digestive_health'   },
  { value: 'hormone_balance'    },
] as const

// ─────────────────────────────────────────────────────────
// Q6-B · 만성질환별 증상 선택지 (질환마다 다름)
// ─────────────────────────────────────────────────────────

export const CHRONIC_SYMPTOMS: Record<ChronicTypeValue, { value: string }[]> = {
  diabetes: [
    { value: 'blood_sugar_instability' },
    { value: 'severe_fatigue'          },
    { value: 'polydipsia_polyuria'     },
    { value: 'weight_change'           },
    { value: 'peripheral_numbness'     },
    { value: 'vision_loss'             },
    { value: 'none'                    },
  ],
  hypertension: [
    { value: 'headache_dizziness' },
    { value: 'tinnitus'           },
    { value: 'dyspnea'            },
    { value: 'palpitation'        },
    { value: 'blurred_vision'     },
    { value: 'none'               },
  ],
  hyperlipidemia: [
    { value: 'fatigue'        },
    { value: 'xanthoma'       },
    { value: 'abdominal_pain' },
    { value: 'none'           },
  ],
  thyroid_disease: [
    { value: 'severe_fatigue'        },
    { value: 'weight_change'         },
    { value: 'temperature_sensitive' },
    { value: 'edema'                 },
    { value: 'hair_loss'             },
    { value: 'concentration_loss'    },
    { value: 'none'                  },
  ],
  kidney_disease: [
    { value: 'face_foot_edema' },
    { value: 'urine_abnormal'  },
    { value: 'fatigue'         },
    { value: 'blood_pressure'  },
    { value: 'appetite_loss'   },
    { value: 'none'            },
  ],
  other_chronic: [
    { value: 'fatigue'            },
    { value: 'pain'               },
    { value: 'digestive_disorder' },
    { value: 'sleep_disorder'     },
    { value: 'weight_change'      },
    { value: 'none'               },
  ],
}

// ─────────────────────────────────────────────────────────
// Q4-C · 일반 건강 목표 (암·만성 모두 해당없음 시)
// ─────────────────────────────────────────────────────────

export const GENERAL_HEALTH_GOALS = [
  { value: 'fatigue_energy'  },
  { value: 'immunity'        },
  { value: 'blood_sugar'     },
  { value: 'cardiovascular'  },
  { value: 'bone_joint'      },
  { value: 'muscle_protein'  },
  { value: 'skin_hair'       },
  { value: 'brain_focus'     },
  { value: 'liver_detox'     },
  { value: 'hormone',         femaleOnly: true },
  { value: 'omega3'          },
  { value: 'respiratory'     },
  { value: 'cell_repair'     },
] as const

// ─────────────────────────────────────────────────────────
// 기타
// ─────────────────────────────────────────────────────────

export const USER_TYPE_LABELS = {
  hemilian: '해밀리안',
  cancer:   '암환우',
  chronic:  '만성질환자',
  normal:   '일반인',
} as const

export const CHALLENGE_MIN_DAYS = 30

// ─────────────────────────────────────────────────────────
// Figma 설문 리디자인 — 새 상수
// ─────────────────────────────────────────────────────────

// value = DB diseases.system_name (cancer 전체 정의됨)
export const CANCER_TYPES_NEW = [
  { value: 'lung',        label: '폐암' },
  { value: 'liver',       label: '간암' },
  { value: 'stomach',     label: '위암' },
  { value: 'esophageal',  label: '식도암' },
  { value: 'pancreatic',  label: '췌장암' },
  { value: 'colorectal',  label: '대장암' },
  { value: 'gallbladder', label: '담낭·담도암' },
  { value: 'prostate',    label: '전립선암' },
  { value: 'cervical',    label: '자궁경부암' },
  { value: 'uterine',     label: '자궁내막암' },
  { value: 'ovarian',     label: '난소암' },
  { value: 'breast',      label: '유방암' },
  { value: 'thyroid',     label: '갑상선암' },
  { value: 'kidney',      label: '신장암' },
  { value: 'bladder',     label: '방광암' },
  { value: 'lymphoma',    label: '림프종' },
  { value: 'leukemia',    label: '백혈병' },
  { value: 'sarcoma',     label: '육종' },
  { value: 'brain',       label: '뇌종양' },
] as const

// value: system_name이 있는 경우 system_name, 없으면 disease_name(한글) 사용
// → SurveyPage의 findDisease()가 system_name 우선 → disease_name 순서로 조회
export const CHRONIC_TYPES_NEW = [
  { value: '당뇨',                             label: '당뇨' },
  { value: '고혈압',                           label: '고혈압' },
  { value: '고지혈증',                         label: '고지혈증' },
  { value: '심장질환',                         label: '심장질환' },
  { value: '뇌혈관질환',                       label: '뇌혈관질환' },
  { value: '간질환',                           label: '간질환' },
  { value: '신장질환',                         label: '신장질환' },
  { value: '갑상선질환',                       label: '갑상선질환' },
  { value: 'obesity',                          label: '비만' },
  { value: 'dementia',                         label: '치매' },
  { value: 'autoimmune_atopy',                 label: '자가면역질환(아토피·루푸스)' },
  { value: 'autoimmune_rheumatism',            label: '자가면역질환(류머티즘 관절염)' },
  { value: 'autoimmune_respiratory',           label: '자가면역질환(호흡기질환)' },
] as const

export const SYMPTOM_LIST = [
  { value: 'fatigue',        label: '피로·무기력' },
  { value: 'appetite_loss',  label: '식욕 저하' },
  { value: 'weight_change',  label: '체중 변화' },
  { value: 'digestive',      label: '소화장애' },
  { value: 'nausea',         label: '구역·구토' },
  { value: 'sleep',          label: '수면장애' },
  { value: 'immunity',       label: '면역력 저하' },
  { value: 'pain',           label: '통증·염증' },
  { value: 'headache',       label: '두통·어지러움' },
  { value: 'tinnitus',       label: '이명' },
  { value: 'breathing',      label: '호흡곤란' },
  { value: 'palpitation',    label: '가슴 두근거림' },
  { value: 'numbness',       label: '손발 저림' },
  { value: 'edema',          label: '부종' },
  { value: 'hair_loss',      label: '탈모' },
  { value: 'vision',         label: '시력저하' },
  { value: 'blood_sugar',    label: '혈당 불안정' },
  { value: 'concentration',  label: '집중력 저하' },
  { value: 'skin',           label: '피부 트러블' },
  { value: 'other',          label: '기타' },
] as const

export const HEALTH_GOAL_LIST = [
  { value: 'cancer_support',      label: '암 치료 지원' },
  { value: 'chronic_management',  label: '만성질환 관리' },
  { value: 'general_health',      label: '전반적 건강 개선' },
  { value: 'prevention',          label: '질병 예방' },
  { value: 'other',               label: '기타 (직접 입력)' },
] as const

// 일반인(개인 건강관리) 건강 목표 — 값(value)은 백엔드 일반인 추천 규칙의 goal_key와 일치,
// 라벨(label)은 화면 표시용. 복수 선택 가능 · 최대 3개 권장
export const GENERAL_GOAL_LIST = [
  { value: '세포수선DNA',   label: '세포수선·DNA' },
  { value: '뼈칼슘관절',     label: '뼈·칼슘·관절' },
  { value: '근육단백질',     label: '근육·단백질' },
  { value: '피부모발',       label: '피부·모발' },
  { value: '피로에너지',     label: '피로·에너지' },
  { value: '오메가3',        label: '오메가3' },
  { value: '뇌집중력',       label: '뇌·집중력' },
  { value: '면역강화',       label: '면역강화' },
  { value: '혈당당독소',     label: '혈당·당독소' },
  { value: '심혈관혈행',     label: '심혈관·혈행' },
  { value: '간해독',         label: '간·해독' },
  { value: '호르몬부인과',   label: '호르몬(여성)' },
  { value: '호흡기점막',     label: '호흡기·점막' },
] as const

// 암 치료 단계 — 값(value)은 백엔드 treatment_stages.stage_code(cancer)와 일치,
// 라벨(label)은 '암 치료 단계별 제품 용량표'의 컬럼명과 동일
export const CANCER_STAGE_LIST = [
  { value: 'PRE_SURGERY',           label: '수술 전' },
  { value: 'POST_SURGERY',          label: '수술 후' },
  { value: 'CHEMO_PERIOD',          label: '항암 전·중·후-3개월' },
  { value: 'RADIO_PERIOD',          label: '방사선 전·중·후-3개월' },
  { value: 'POST_CHEMO_3_6M',       label: '항암 후 3-6개월' },
  { value: 'POST_CHEMO_6_12M',      label: '항암 후 6-12개월' },
  { value: 'IMMUNE_CARE_1_5Y',      label: '1-5년' },
  { value: 'LIFELONG_CARE_5Y_PLUS', label: '5년 이후 평생' },
  { value: 'ADVANCED_METASTASIS',   label: '전이/재발·말기암' },
  { value: 'MARKER_ELEVATION_ONLY', label: '종양수치만 높음' },
] as const

export const CHRONIC_STAGE_LIST = [
  { value: 'initial',   label: '처음 진단받음' },
  { value: 'managing',  label: '꾸준히 관리 중' },
  { value: 'intensive', label: '집중 치료 중' },
] as const

export const HEMILIAN_GRADES = [
  { key: '크리스탈',        name: '크리스탈',        level: '멤버 1단계',       isLeader: false, color: '#8EC8E8' },
  { key: '에메랄드',        name: '에메랄드',        level: '멤버 2단계',       isLeader: false, color: '#50C878' },
  { key: '사파이어',        name: '사파이어',        level: '멤버 3단계',       isLeader: false, color: '#2253A2' },
  { key: '다이아몬드',      name: '다이아몬드(DM)',  level: '멤버 4단계(멤버 최고)', isLeader: false, color: '#A8C4D8' },
  { key: '뉴웨이브 리더',   name: '뉴웨이브 리더',   level: '리더 1단계',       isLeader: true,  color: '#003E7F' },
  { key: '비전 리더',       name: '비전 리더',       level: '리더 2단계',       isLeader: true,  color: '#003E7F' },
  { key: '파이오니아 리더', name: '파이오니아 리더', level: '리더 3단계',       isLeader: true,  color: '#003E7F' },
  { key: '이노베이티브 리더', name: '이노베이티브 리더', level: '리더 4단계',   isLeader: true,  color: '#003E7F' },
  { key: '프렌드 리더',     name: '프렌드 리더',     level: '리더 5단계',       isLeader: true,  color: '#003E7F' },
  { key: '크리에이티브 리더', name: '크리에이티브 리더', level: '리더 6단계',   isLeader: true,  color: '#003E7F' },
  { key: '서번트 리더',     name: '서번트 리더',     level: '리더 7단계(최고)', isLeader: true,  color: '#003E7F' },
] as const

// 챌린지 루틴별 포인트 (앱 표시용 단일 소스 — 챌린지 항목 배지·완료 화면 합산에 공통 사용)
export const ROUTINE_POINTS: Record<string, number> = {
  PRODUCT: 20,
  WATER: 10,
  EXERCISE: 10,
  MEAL: 10,
  GRATITUDE: 5,
  SLEEP: 10,
  CONDITION: 5,
  INNER_REFLECTION: 5,
}

