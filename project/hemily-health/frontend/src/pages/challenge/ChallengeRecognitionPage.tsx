import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import apiClient from '../../lib/api/client'
import { ROUTINE_POINTS } from '../../constants'
import { challengeApi } from '../../lib/api/challenge'
import { useRecognitionResultStore } from '../../lib/store/recognitionResultStore'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'
const MAX_FILES_WEB = 3

type FileEntry = { file: File; preview: string }

// ── 아이콘 ──────────────────────────────────────────────────
function GalleryIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="3" y="5" width="28" height="24" rx="3" stroke="#003E7F" strokeWidth="1.8" />
      <circle cx="12" cy="14" r="3" stroke="#003E7F" strokeWidth="1.6" />
      <path d="M3 23L10 16L16 22L21 17L31 26" stroke="#003E7F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="32" height="29" viewBox="0 0 32 29" fill="none">
      <path d="M11 4H21L24 8H29C30.1 8 31 8.9 31 10V25C31 26.1 30.1 27 29 27H3C1.9 27 1 26.1 1 25V10C1 8.9 1.9 8 3 8H8L11 4Z" stroke="#003E7F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="17" r="5" stroke="#003E7F" strokeWidth="1.8" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <div className="w-[60px] h-[60px] rounded-full bg-[#DBEAFE] flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 18V8M14 8L10 12M14 8L18 12" stroke="#003E7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 20H22" stroke="#003E7F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function CheckCircle() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="13" fill="#16A34A" />
      <path d="M7 13L11 17L19 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── 메인 ────────────────────────────────────────────────────
export default function ChallengeRecognitionPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routine = searchParams.get('routine') ?? ''
  const productId = searchParams.get('product_id') ?? ''
  const productChallengeId = searchParams.get('challenge_id') ?? ''
  const productTeamId = searchParams.get('team_id') ?? ''
  const productLogDate = searchParams.get('log_date') ?? ''
  const productName = searchParams.get('product_name') ?? ''
  const productImage = searchParams.get('product_image') ?? ''
  const isProductMode = !!(productId && (productChallengeId || productTeamId) && productLogDate)

  const [entries, setEntries] = useState<FileEntry[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [description, setDescription] = useState('')

  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const webFileRef = useRef<HTMLInputElement>(null)

  // Object URL 정리
  useEffect(() => {
    return () => { entries.forEach((e) => URL.revokeObjectURL(e.preview)) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith('image/'))
    setEntries((prev) => {
      const combined = [...prev, ...valid.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))].slice(0, MAX_FILES_WEB)
      return combined
    })
  }

  const removeFile = (index: number) => {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const setJobs = useRecognitionResultStore((s) => s.setJobs)

  const handleSubmit = async () => {
    if (entries.length === 0) { setError(t('recognition.noFileError')); return }
    setError('')
    setUploading(true)
    try {
      if (isProductMode) {
        // 인증샷을 S3에 저장하고 타임라인(챌린지·날짜)에 연결
        const linkType = productTeamId ? 'together' : 'self'
        const linkId = productTeamId || productChallengeId
        for (const entry of entries) {
          const fd = new FormData()
          fd.append('image', entry.file)
          fd.append('challenge_type', linkType)
          fd.append('challenge_id', linkId)
          fd.append('log_date', productLogDate)
          const res = await apiClient.post('/recognitions', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            validateStatus: (s: number) => s < 500,
          })
          if (res.status !== 200 && res.status !== 201) throw new Error('upload failed')
        }
        // 함께 챌린지는 팀 전용 체크 API, 개인 챌린지는 기존 API 사용
        if (productTeamId) {
          await challengeApi.checkTeamProductRoutine(productTeamId, productLogDate, [productId])
        } else {
          await challengeApi.checkProductRoutine(productChallengeId, productLogDate, [productId])
        }
        const key = productTeamId
          ? `supplement_checked_team_${productTeamId}_${productLogDate}`
          : `supplement_checked_${productChallengeId}_${productLogDate}`
        const stored = sessionStorage.getItem(key)
        const ids: string[] = stored ? JSON.parse(stored) : []
        if (!ids.includes(productId)) ids.push(productId)
        sessionStorage.setItem(key, JSON.stringify(ids))
        navigate('/challenge/recognition/product-result', {
          state: {
            productName,
            productImage,
            logDate: productLogDate,
            returnTo: productTeamId ? `/challenge/teams/${productTeamId}` : undefined,
          },
        })
      } else {
        const today = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        const uploadedAt = `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())}`

        // 일자별 타임라인 연결: 챌린지 컨텍스트(쿼리)로 들어온 경우 챌린지·날짜 첨부
        const linkLogDate = productLogDate || new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
        const linkType = productTeamId ? 'together' : productChallengeId ? 'self' : ''
        const linkId = productTeamId || productChallengeId

        const collected: { jobId: string; file: File; uploadedAt: string }[] = []
        for (const entry of entries) {
          const fd = new FormData()
          fd.append('image', entry.file)
          if (linkType && linkId) {
            fd.append('challenge_type', linkType)
            fd.append('challenge_id', linkId)
            fd.append('log_date', linkLogDate)
          }
          const res = await apiClient.post('/recognitions', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            validateStatus: (s: number) => s < 500,
          })
          if (res.status !== 200 && res.status !== 201) throw new Error('upload failed')
          const data = res.data as { job_id: string; job_status: string }
          collected.push({ jobId: data.job_id, file: entry.file, uploadedAt })
        }
        setJobs(collected)
        navigate('/challenge/recognition/result')
      }
    } catch {
      setError(t('recognition.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  const points = ROUTINE_POINTS[routine] ?? 0
  const sectionTitle = routine
    ? t(`recognition.routineTitle.${routine}`, { defaultValue: t('recognition.pageTitle') })
    : t('recognition.pageTitle')
  const sectionSubtitle = routine
    ? t(`recognition.routineSubtitle.${routine}`, { defaultValue: '' })
    : ''

  const mobileFile = entries[0] ?? null

  return (
    <AppShell
      active="challenge"
      topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('recognition.pageTitle')}</span>}
    >
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header showBack title={<span className="text-[17px] font-bold text-[#1E293B]">{t('recognition.pageTitle')}</span>} />
      </div>

      {/* ── 모바일 ── */}
      <div className="md:hidden flex flex-col flex-1 bg-[#F1F5F9] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 flex flex-col gap-5">

          {/* 사진 선택 버튼 2개 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center justify-center gap-[13px] h-[103px] bg-[#F8FAFF] border border-[#5BA3D9] rounded-[10px]"
              style={{ borderWidth: '0.5px', boxShadow: '0px 4px 2px rgba(0,0,0,0.02)' }}
            >
              <GalleryIcon />
              <span className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">
                {t('recognition.addPhoto')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center justify-center gap-[13px] h-[103px] bg-[#F8FAFF] border border-[#5BA3D9] rounded-[10px]"
              style={{ borderWidth: '0.5px', boxShadow: '0px 4px 2px rgba(0,0,0,0.02)' }}
            >
              <CameraIcon />
              <span className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">
                {t('recognition.takePhoto')}
              </span>
            </button>
          </div>

          {/* 드롭 존 / 선택된 파일 */}
          {mobileFile === null ? (
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 h-[219px] bg-[#D2DEEA] border-2 border-dashed border-[#5BA3D9] rounded-[10px]"
            >
              <p className="text-[18px] font-bold text-[#003E7F] text-center leading-snug px-6">
                {t('recognition.dropzoneTitle')}
              </p>
              <p className="text-[14px] font-medium text-[#555555] tracking-[-0.14px]">
                {t('recognition.dropzoneHint')}
              </p>
            </button>
          ) : (
            <div
              className="w-full flex items-center justify-between h-[71px] bg-[#F8FAFF] rounded-[10px] px-5"
              style={{ border: '0.5px solid #5BA3D9' }}
            >
              <div className="flex flex-col gap-0.5 min-w-0 mr-3">
                <p className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">
                  {t('recognition.selectedFile')}
                </p>
                <p className="text-[14px] font-medium text-[#555555] tracking-[-0.14px] truncate">
                  {mobileFile.file.name}
                </p>
              </div>
              <CheckCircle />
            </div>
          )}

          {error && (
            <p className="text-[13px] text-[#EF4444] text-center">{error}</p>
          )}

          {/* 업로드 하기 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || entries.length === 0}
            className="h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px] disabled:opacity-60"
            style={{ backgroundImage: NAVY_GRADIENT }}
          >
            {uploading ? t('recognition.uploading') : t('recognition.submitBtn')}
          </button>
        </div>

        <BottomNav active="challenge" />
      </div>

      {/* ── 웹 ── */}
      <div className="hidden md:flex md:flex-col bg-[#F1F5F9] px-8 py-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 max-w-[640px] w-full">

          {/* 섹션 제목 */}
          <div>
            <p className="text-[15px] font-bold text-[#1E293B]">{sectionTitle}</p>
            {(sectionSubtitle || points > 0) && (
              <p className="text-[13px] text-[#64748B] mt-1">
                {sectionSubtitle}{sectionSubtitle && points > 0 ? ' · ' : ''}{points > 0 ? `+${points}P` : ''}
              </p>
            )}
          </div>

          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`w-full h-[280px] bg-white rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
              isDragOver ? 'border-[#003E7F] bg-[#EAF0F7]' : 'border-[#003E7F66]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => webFileRef.current?.click()}
          >
            <UploadIcon />
            <p className="text-[14px] font-bold text-[#1E293B]">{t('recognition.webDropzoneTitle')}</p>
            <p className="text-[12px] text-[#94A3B8]">{t('recognition.webDropzoneHint')}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); webFileRef.current?.click() }}
              className="mt-1 h-[44px] w-[200px] rounded-full bg-[#003E7F] text-white text-[14px] font-bold"
            >
              {t('recognition.selectFile')}
            </button>
          </div>

          {/* 업로드된 사진 미리보기 */}
          {entries.length > 0 && (
            <div>
              <p className="text-[13px] font-bold text-[#1E293B] mb-3">{t('recognition.uploadedPhotos')}</p>
              <div className="flex gap-4">
                {entries.map((e, i) => (
                  <div key={i} className="relative w-[120px] h-[120px] rounded-[10px] overflow-hidden flex-shrink-0">
                    <img src={e.preview} alt={e.file.name} className="w-full h-full object-cover" />
                    {/* 체크 오버레이 */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#16A34A] flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7L5.5 10.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {/* 추가 슬롯 */}
                {entries.length < MAX_FILES_WEB && (
                  <button
                    type="button"
                    onClick={() => webFileRef.current?.click()}
                    className="w-[120px] h-[120px] rounded-[10px] border border-[#94A3B8] bg-[#F1F5F9] flex items-center justify-center opacity-50 flex-shrink-0"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 사진 설명 (선택) */}
          <div>
            <p className="text-[13px] font-bold text-[#1E293B] mb-2">{t('recognition.descriptionLabel')}</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('recognition.descriptionPlaceholder')}
              className="w-full h-[80px] bg-white border border-[#94A3B8] rounded-[12px] px-4 py-3 text-[13px] text-[#1E293B] placeholder-[#94A3B8] outline-none resize-none focus:border-[#003E7F]"
            />
          </div>

          {error && <p className="text-[13px] text-[#EF4444]">{error}</p>}

          {/* 인증샷 제출하기 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || entries.length === 0}
            className="h-[52px] rounded-full bg-[#003E7F] text-white text-[14px] font-bold disabled:opacity-60"
          >
            {uploading ? t('recognition.uploading') : t('recognition.webSubmitBtn')}
          </button>
        </div>
      </div>

      {/* hidden file inputs */}
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
      <input ref={webFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
    </AppShell>
  )
}
