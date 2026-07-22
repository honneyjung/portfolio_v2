import apiClient from './client'
import type {
  ApiResponse,
  Challenge,
  ChallengeLog,
  ChallengeHistoryItem,
  Team,
  TeamInvitation,
  TeamListItem,
  TeamProgress,
  TeamComment,
  TeamCommentListResponse,
  ChallengeTimelineResponse,
  ReactionType,
} from '../../types'

export interface CreateChallengeRequest {
  title: string
  duration_months: number
  selected_routines: string[]
  product_ids?: string[] | null
  report_id?: string | null
  goal_description?: string | null
}

export interface ChallengeCheckRequest {
  challenge_id: string
  team_id?: string | null
  water_cups?: number
  sleep_hours?: number
  body_checks?: unknown[]
}

export interface DailyLogResponse {
  log_date: string
  submitted: boolean
  item_rates: Record<string, number>
  daily_rate: number
  calculation_source: string
}

// 일일 루틴 개별 체크 (PATCH /challenges/{id}/daily-logs/{date}/{routine})
export interface ExercisePayload {
  walk_steps?: string | null
  exercise_strength?: boolean | null
  exercise_stretching?: boolean | null
}
export interface RoutineCheckResult {
  log_date: string
  item_rates: Record<string, number>
  daily_rate: number
  overall_rate: number
  updated_at: string
}
const dailyLogBase = (id: string, date: string) => `/challenges/${id}/daily-logs/${date}`
const noAutoLogout = { validateStatus: (s: number) => s < 500 }

export const challengeApi = {
  create: (data: CreateChallengeRequest) =>
    apiClient.post<ApiResponse<{ challenge_id: string; status: string }>>('/challenges', data),

  getCurrent: () =>
    apiClient.get<ApiResponse<Challenge>>('/challenges/current'),

  getToday: (challenge_id?: string) =>
    apiClient.get<ApiResponse<ChallengeLog>>('/challenges/today', { params: { challenge_id } }),

  submitCheck: (data: ChallengeCheckRequest) =>
    apiClient.post<ApiResponse<{ challenge_log_id: string; completion_rate: number }>>('/challenge-checks', data),

  updateCheck: (id: string, data: Partial<ChallengeCheckRequest>) =>
    apiClient.patch<ApiResponse<{ id: string; updated: boolean }>>(`/challenge-checks/${id}`, data),

  // ── 일일 루틴 개별 체크 ──
  checkProductRoutine: (id: string, date: string, productIds: string[]) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/product`, { checked_product_ids: productIds }),

  checkWaterRoutine: (id: string, date: string, cups: number) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/water`, { water_cups: cups }),

  checkMealRoutine: (id: string, date: string) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/meal`, { meal_done: true }),

  checkExerciseRoutine: (id: string, date: string, exercise: ExercisePayload) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/exercise`, { exercise }),

  checkSleepRoutine: (id: string, date: string, sleepBand: string) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/sleep`, { sleep_band: sleepBand }),

  checkConditionRoutine: (id: string, date: string, bodyStatus: string) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/condition`, { body_status: bodyStatus }),

  checkGratitudeRoutine: (id: string, date: string, gratitudes: string[]) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/gratitude`, { gratitudes }),

  checkReflectionRoutine: (id: string, date: string) =>
    apiClient.patch<RoutineCheckResult>(`${dailyLogBase(id, date)}/reflection`, { reflection_done: true }),

  getDailyLog: (id: string, date: string) =>
    apiClient.get<DailyLogResponse>(dailyLogBase(id, date), noAutoLogout),

  getHistory: (params?: { from?: string; to?: string }) =>
    apiClient.get<ApiResponse<{ items: ChallengeHistoryItem[] }>>('/challenges/history', { params }),

  complete: (challenge_id: string) =>
    apiClient.post<ApiResponse<{ challenge_id: string; status: string }>>(
      `/challenges/${challenge_id}/complete`,
      { completed_at: new Date().toISOString() }
    ),

  // 팀 관련
  getMyTeams: () =>
    apiClient.get<ApiResponse<{ items: Team[] }>>('/challenges/teams/mine'),

  createTeam: (data: { team_name: string; challenge_title: string }) =>
    apiClient.post<ApiResponse<{ team_id: string; invite_code: string }>>('/challenges/teams', data),

  getTeam: (team_id: string) =>
    apiClient.get<ApiResponse<Team>>(`/challenges/teams/${team_id}`),

  getInvitation: (code: string) =>
    apiClient.get<ApiResponse<TeamInvitation>>(`/challenges/invitations/${code}`),

  joinTeam: (team_id: string, invite_code?: string | null) =>
    apiClient.post<ApiResponse<{ team_id: string; joined: boolean }>>(
      `/challenges/teams/${team_id}/join`,
      { invite_code: invite_code ?? null }
    ),

  // 함께 챌린지 탈퇴 (기록 삭제·포인트 미지급, 진행 중에만 가능)
  leaveTeam: (team_id: string) =>
    apiClient.post<ApiResponse<{ team_id: string; left: boolean; team_deleted: boolean }>>(
      `/challenges/teams/${team_id}/leave`,
      {}
    ),

  getTeamProgress: (team_id: string) =>
    apiClient.get<ApiResponse<TeamProgress>>(`/challenges/teams/${team_id}/progress`),

  reactToTeam: (team_id: string, reaction_type: ReactionType) =>
    apiClient.post<ApiResponse<{ created: boolean; reaction_count: number }>>(
      `/challenges/teams/${team_id}/reactions`,
      { reaction_type }
    ),

  // 일자별 타임라인 (달성률·루틴·인증샷)
  getChallengeTimeline: (challenge_id: string) =>
    apiClient.get<ChallengeTimelineResponse>(`/challenges/${challenge_id}/timeline`, noAutoLogout),

  getTeamTimeline: (team_id: string) =>
    apiClient.get<ChallengeTimelineResponse>(`/challenges/teams/${team_id}/timeline`, noAutoLogout),

  // 함께 챌린지 댓글 (이모지 포함 가능, 본인 댓글만 수정·삭제)
  listTeamComments: (team_id: string) =>
    apiClient.get<TeamCommentListResponse>(`/challenges/teams/${team_id}/comments`, noAutoLogout),

  createTeamComment: (team_id: string, content: string) =>
    apiClient.post<TeamComment>(`/challenges/teams/${team_id}/comments`, { content }),

  updateTeamComment: (team_id: string, comment_id: string, content: string) =>
    apiClient.patch<TeamComment>(`/challenges/teams/${team_id}/comments/${comment_id}`, { content }),

  deleteTeamComment: (team_id: string, comment_id: string) =>
    apiClient.delete<{ comment_id: string; deleted: boolean }>(`/challenges/teams/${team_id}/comments/${comment_id}`),

  // ── Dev B 추가: 함께 챌린지 ──
  // 참여 가능한 팀 목록 (백엔드는 래퍼 없이 { items } 반환)
  getTeams: () =>
    apiClient.get<{ items: TeamListItem[] }>('/challenges/teams', noAutoLogout),

  // 멤버 제품 등록 / 조회
  registerTeamProducts: (team_id: string, product_ids: string[]) =>
    apiClient.post(`/challenges/teams/${team_id}/members/products`, { product_ids }),

  getTeamMemberProducts: (team_id: string) =>
    apiClient.get(`/challenges/teams/${team_id}/members/products`, noAutoLogout),

  // 팀 챌린지 루틴 개별 체크 (개인 챌린지와 동일 경로 패턴)
  checkTeamProductRoutine: (team_id: string, date: string, productIds: string[]) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/product`, { checked_product_ids: productIds }),

  checkTeamWaterRoutine: (team_id: string, date: string, cups: number) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/water`, { water_cups: cups }),

  checkTeamMealRoutine: (team_id: string, date: string) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/meal`, { meal_done: true }),

  checkTeamExerciseRoutine: (team_id: string, date: string, exercise: ExercisePayload) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/exercise`, { exercise }),

  checkTeamSleepRoutine: (team_id: string, date: string, sleepBand: string) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/sleep`, { sleep_band: sleepBand }),

  checkTeamConditionRoutine: (team_id: string, date: string, bodyStatus: string) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/condition`, { body_status: bodyStatus }),

  checkTeamGratitudeRoutine: (team_id: string, date: string, gratitudes: string[]) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/gratitude`, { gratitudes }),

  checkTeamReflectionRoutine: (team_id: string, date: string) =>
    apiClient.patch<RoutineCheckResult>(`/challenges/teams/${team_id}/daily-logs/${date}/reflection`, { reflection_done: true }),

  createTeamFull: (data: {
    team_name: string
    challenge_title: string
    selected_routines: string[]
    duration_type: string  // 1week | 2weeks | 1month
    product_ids?: string[] | null
  }) => apiClient.post<{ team_id: string; team_name: string; challenge_title: string; start_date: string; end_date: string }>('/challenges/teams', data),
}
