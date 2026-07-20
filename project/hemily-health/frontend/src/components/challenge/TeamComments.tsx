import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { challengeApi } from '../../lib/api/challenge'
import type { TeamComment, TeamCommentListResponse } from '../../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }
const QUICK_EMOJIS = ['👍', '🔥', '💪', '👏', '🙏', '❤️', '😊', '🎉']

function formatWhen(iso?: string | null): string {
  if (!iso) return ''
  // YYYY-MM-DDTHH:MM → MM.DD HH:MM
  const m = iso.slice(0, 16).match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}:\d{2})$/)
  return m ? `${m[1]}.${m[2]} ${m[3]}` : iso.slice(0, 10).replace(/-/g, '.')
}

export default function TeamComments({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const { data: res } = useQuery({
    queryKey: ['team-comments', teamId],
    queryFn: () => challengeApi.listTeamComments(teamId),
    ...noAutoLogout,
  })
  const comments: TeamComment[] = (res?.data as TeamCommentListResponse | undefined)?.items ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['team-comments', teamId] })

  const createMutation = useMutation({
    mutationFn: (content: string) => challengeApi.createTeamComment(teamId, content),
    onSuccess: () => { setDraft(''); invalidate() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      challengeApi.updateTeamComment(teamId, id, content),
    onSuccess: () => { setEditingId(null); setEditDraft(''); invalidate() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => challengeApi.deleteTeamComment(teamId, id),
    onSuccess: invalidate,
  })

  const submit = () => {
    const text = draft.trim()
    if (text) createMutation.mutate(text)
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px]">
        댓글 <span className="text-[#64748B] font-medium">{comments.length}</span>
      </h3>

      {/* 목록 */}
      <div className="flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-[13px] text-[#94A3B8] py-4 text-center">첫 댓글을 남겨 팀원을 응원해보세요</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-[12px] px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#1E293B]">{c.author_name}</span>
              <span className="text-[11px] text-[#94A3B8]">{formatWhen(c.updated_at ?? c.created_at)}</span>
            </div>

            {editingId === c.id ? (
              <div className="flex flex-col gap-2 mt-1">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={2}
                  className="w-full rounded-[8px] border border-[#D2DEEA] px-3 py-2 text-[14px] resize-none focus:outline-none focus:border-[#003E7F]"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setEditDraft('') }}
                    className="px-3 h-[34px] rounded-full text-[13px] text-[#64748B] border border-[#CBD5E1]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={updateMutation.isPending || !editDraft.trim()}
                    onClick={() => updateMutation.mutate({ id: c.id, content: editDraft.trim() })}
                    className="px-3 h-[34px] rounded-full text-[13px] text-white bg-[#003E7F] disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-[#334155] whitespace-pre-wrap break-words leading-relaxed">{c.content}</p>
            )}

            {c.is_mine && editingId !== c.id && (
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setEditingId(c.id); setEditDraft(c.content) }}
                  className="text-[12px] text-[#64748B] underline underline-offset-2"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => { if (window.confirm('댓글을 삭제할까요?')) deleteMutation.mutate(c.id) }}
                  className="text-[12px] text-[#EF4444] underline underline-offset-2"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 이모지 빠른 입력 */}
      <div className="flex flex-wrap gap-1">
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setDraft((d) => d + e)}
            className="w-8 h-8 rounded-full bg-white text-[16px] leading-none hover:bg-[#EEF2F7]"
          >
            {e}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="댓글을 입력하세요 (이모지 사용 가능)"
          maxLength={1000}
          className="flex-1 rounded-[10px] border border-[#D2DEEA] px-3 py-2 text-[14px] resize-none focus:outline-none focus:border-[#003E7F]"
        />
        <button
          type="button"
          disabled={createMutation.isPending || !draft.trim()}
          onClick={submit}
          className="h-[44px] px-4 rounded-full bg-[#003E7F] text-white text-[14px] font-medium disabled:opacity-50 flex-shrink-0"
        >
          등록
        </button>
      </div>
    </section>
  )
}
