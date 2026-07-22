// ── 유저 타입 ──────────────────────────────────────────
export type UserType =
  | 'hemilian'      // 해밀리안 (사업자)
  | 'cancer'        // 암환우
  | 'chronic'       // 만성질환자
  | 'normal'        // 일반인 (예방·관리)

export type HealthStatus = 'cancer' | 'chronic' | 'normal'

// ── 유저 ──────────────────────────────────────────────
export interface User {
  id: string
  name: string
  nickname?: string
  email: string
  userType: UserType
  referredByHemilianId?: string
  pointCfw: number
  grade?: string
  createdAt: string
  birth_date?: string   // YYYY-MM-DD
  gender?: string
  phone_number?: string // 회원가입 시 입력. /users/me 로 조회 (해밀리안 상담용 PDF 연락처)
}

// ── 설문 상태 (로컬 스토어용) ───────────────────────────

/** STEP 3-A: 암종별 상세 답변 */
export interface CancerDetail {
  treatmentStage: string    // Q4-A
  followupStage?: string    // 추적관찰 세부 단계
  symptoms: string[]        // Q5-A 증상·부작용
  goals: string[]           // Q5-A 관리 목표
}

/** STEP 3-B: 만성질환별 상세 답변 */
export interface ChronicDetail {
  managementStage: string   // Q4-B
  hasMedication: boolean    // Q5-B
  symptoms: string[]        // Q6-B
}

export interface SurveyState {
  // STEP 1 — 프로필 확인
  gender?: 'male' | 'female' | 'other'  // Q1
  birthDate?: string                     // Q2: YYYY-MM-DD
  ageGroup?: string                      // Q2 자동 계산

  // STEP 2 — 질환 선택
  selectedCancers: string[]              // Q3 선택한 암종 (빈 배열 = 해당없음)
  selectedChronics: string[]             // Q3 선택한 만성질환 (빈 배열 = 해당없음)

  // STEP 3-A — 암 상세 (암종마다 반복)
  cancerDetails: Record<string, CancerDetail>

  // STEP 3-B — 만성 상세 (질환마다 반복)
  chronicDetails: Record<string, ChronicDetail>

  // STEP 3-C — 일반 건강 목표
  healthGoals: string[]                  // Q4-C

  // NEW FLOW 추가 필드
  hasCancer:    boolean | null
  hasChronic:   boolean | null
  symptoms:     string[]
  hasMedication: boolean | null
  medications:  string
}

// ── 질병 / 치료 단계 ────────────────────────────────────
export interface Disease {
  id: string
  category: HealthStatus
  diseaseType: string
  label: string
}

export interface TreatmentStage {
  code: string
  label: string
}

// ── 동의 ───────────────────────────────────────────────
// 백엔드 _VALID_CONSENT_TYPES(schemas/users.py)와 일치
export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'sensitive_health_info'
  | 'hemilian_case_storage'
  | 'photo_upload'
  | 'marketing'
  | 'info_share_agreed'
  | 'marketing_push_agreed'
  | 'marketing_email_agreed'
  | 'marketing_sms_agreed'
  | 'night_push_agreed'

export interface ConsentItem {
  consent_type: ConsentType
  is_agreed: boolean
  version?: string
}

// ── 해밀리안 매니저 ────────────────────────────────────
export type HemilianManagerStatus = 'connected' | 'not_connected' | 'change_requested'

export interface HemilianManager {
  status: HemilianManagerStatus
  hemilian?: { id: string; name: string; code: string }
}

// ── 설문 ──────────────────────────────────────────────
export interface Survey {
  survey_id: string
  survey_round: number
  next_step?: string
}

// ── 리포트 ────────────────────────────────────────────
export interface Report {
  id: string
  userId: string
  userType: UserType
  diseaseType?: string
  treatmentStage?: string
  summary: unknown[]
  result_snapshot: unknown
  basicProducts: Product[]
  premiumProducts: Product[]
  createdAt: string
}

export interface ReportComparison {
  current_report_id: string
  previous_report_id: string
  diff: unknown
}

// ── 제품 ──────────────────────────────────────────────
export interface Product {
  // report_products 테이블
  product_id: string
  disease_id?: string | null   // 질환 카탈로그 id — 암/만성 탭 전환 시 제품 필터용
  tier_type: 'core' | 'support'
  plan_tier: 'basic' | 'standard' | 'premium'
  personalized_reason?: string | null
  daily_dosage_min?: number | null
  daily_dosage_max?: number | null
  display_order?: number

  // products 테이블 (마스터)
  product_name: string
  dna_stage: 'D' | 'N' | 'A' | 'DNA_ALL'
  stage_role?: string | null
  key_ingredients?: string | null
  summary?: string | null
  intake_timing?: string | null
  intake_method?: string | null
  package_image_url?: string | null
  homepage_url?: string | null
}

export interface UserProduct {
  id: string
  product_id: string
  product_name: string
  is_active: boolean
  intake_timing: string
}

// ── 챌린지 ────────────────────────────────────────────
export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'abandoned'
export type ChallengeType   = 'self' | 'together'
export type ReactionType    = 'like' | 'cheer' | 'together'

export interface Challenge {
  challenge_id: string
  status: ChallengeStatus
  type?: ChallengeType
  start_date?: string
  end_date?: string
  goal_description?: string
  routineItems: RoutineItem[]
  teamMembers?: TeamMember[]
}

export interface RoutineItem {
  id: string
  name: string
  category: 'supplement' | 'water' | 'exercise' | 'meal' | 'sleep' | 'gratitude' | 'custom'
  isChecked: boolean
}

export interface ChallengeLog {
  log_id: string
  log_date: string
  items: RoutineItem[]
}

export interface ChallengeHistoryItem {
  log_date: string
  completion_rate: number
}

// ── 챌린지 팀 ──────────────────────────────────────────
export interface Team {
  team_id: string
  team_name: string
  invite_code?: string
  progress?: number
  members?: TeamMember[]
}

export interface TeamMember {
  userId: string
  name: string
  achievementRate: number
}

export interface TeamInvitation {
  team_id: string
  team_name: string
  valid: boolean
}

export interface TeamProgress {
  team_progress: number
  completed_members: number
}

// ── 인증샷 ────────────────────────────────────────────
export type RecognitionStatus = 'uploaded' | 'processing' | 'confirmed' | 'rejected' | 'needs_review'

export interface Recognition {
  job_id: string
  status: RecognitionStatus
}

// ── 포인트 ────────────────────────────────────────────
export interface PointWallet {
  user_id: string
  crm_point_balance: number
}

export type PointTransactionStatus = 'pending' | 'earned' | 'rejected'

export interface PointTransaction {
  id: string
  amount: number
  status: PointTransactionStatus
  created_at: string
}

// ── 알림 ──────────────────────────────────────────────
export interface Notification {
  id: string
  notification_type: string
  title: string
  body?: string | null
  link_url?: string | null // 클릭 시 이동할 앱 내 경로 (예: /survey)
  is_read: boolean
  created_at: string
  // 백엔드 구버전/래핑 방어용 (현재 응답은 위 flat 필드 사용)
  type?: string
  data?: unknown
}

// ── 케이스 (해밀리안) ──────────────────────────────────
export type CaseUserType = 'member' | 'non_member'

export interface Case {
  case_id: string
  hemilianId: string
  case_type: CaseUserType
  case_profile: {
    clientName?: string
    diseaseType?: string
    treatmentStage?: string
    gender?: 'male' | 'female'
    ageGroup?: string
    memo?: string
  }
  report_link?: string
  followup_status?: string
  createdAt: string
}

// 케이스 목록 API 실제 응답 타입 (GET /hemilians/cases)
export interface HemilianCaseListItem {
  case_id: string
  case_type: string
  case_label: string | null
  case_category: string | null
  created_at: string | null
}

// 케이스 상세 API 실제 응답 타입 (GET /hemilians/cases/{case_id})
export interface HemilianCaseDetail {
  case_id: string
  case_profile: {
    case_type: string
    case_label: string
    case_category: string | null
    memo: string | null
    followup_status: string
  } | null
  report_links: unknown[]
  challenge_linked: null
  consult_logs: unknown[]
}

// ── 해밀리안 대시보드 ────────────────────────────────────
export interface HemilianDashboard {
  assigned_member_count: number
  active_challenge_count: number
}

// ── 마이페이지 ────────────────────────────────────────
export interface MypageSummary {
  me: User
  latest_report: Report | null
  latest_challenge: Challenge | null
}

// ── 챌린지 일자별 타임라인 ──────────────────────────────────────
export interface ChallengeTimelineItem {
  log_date: string
  daily_rate: number
  submitted: boolean
  item_rates: Record<string, number>
  photo_job_ids: string[]
}

export interface ChallengeTimelineResponse {
  items: ChallengeTimelineItem[]
}

// ── 함께 챌린지 댓글 ──────────────────────────────────────
export interface TeamComment {
  id: string
  user_id: string
  author_name: string
  content: string
  is_mine: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface TeamCommentListResponse {
  items: TeamComment[]
  total: number
}

// ── API 공통 응답 ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ── 팀 챌린지 (Dev B — 백엔드 실제 응답 스키마) ─────────────────
// GET /challenges/teams 응답 항목 (참여 가능한 팀 목록)
export interface TeamListItem {
  team_id: string
  team_name: string
  challenge_title: string
  start_date: string
  end_date: string
  total_members: number
  member_names: string[]
  joined: boolean
}

// GET /challenges/teams/mine 응답 항목
export interface TeamMineItem {
  team_id: string
  team_name: string
  team_status: string
  member_status: string | null
}

// GET /challenges/teams/{id} 응답의 멤버 항목
export interface TeamMemberDetail {
  user_id: string
  name: string | null
  member_role: 'owner' | 'member'
  progress_rate: number      // 전체 기간 평균
  today_rate: number         // 오늘 달성률
  today_completed: boolean
}

// GET /challenges/teams/{id} 응답
export interface TeamDetail {
  team_id: string
  team_name: string
  challenge_title: string
  selected_routines: string[]
  start_date: string
  end_date: string
  remaining_days: number
  team_progress: number          // 팀 전체 기간 평균
  team_today_progress: number    // 팀 오늘 달성률 평균
  my_today_rate: number          // 나의 오늘 달성률
  my_overall_rate: number        // 나의 전체 기간 평균
  leader_name: string | null
  total_members: number
  today_completed_count: number
  members: TeamMemberDetail[]
  recent_reactions: unknown[]
}
