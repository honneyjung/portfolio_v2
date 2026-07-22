import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import icBack from '../../assets/images/ic_back.svg'

interface HeaderProps {
  title?: ReactNode
  showBack?: boolean
  onBack?: () => void
  left?: ReactNode   // 좌측 슬롯 (지정 시 showBack 대신 사용)
  right?: ReactNode  // 우측 기능 슬롯 (예: PDF 다운)
  className?: string // header 요소 추가 클래스 (예: 배경색)
}

/**
 * 공통 헤더 — 스크롤과 무관하게 화면 최상단에 고정(fixed).
 * - 높이 50px (모바일 기준)
 * - 좌/우 기능 요소(뒤로가기·액션 등)는 고정 상태에서도 함께 노출
 * - fixed 가 가리는 만큼 같은 높이의 스페이서로 본문 자리를 확보 (콘텐츠 잘림 방지)
 * - 스크롤되어 본문 위에 떠 있을 때(= fixed 상태)만 하단 보더(1px #C5C5C5) 노출
 *
 * 데스크탑에서 AppShell 상단바를 쓰는 화면은 호출부에서 `<div className="md:hidden">` 으로 감싼다.
 */
export default function Header({ title, showBack, onBack, left, right, className = '' }: HeaderProps) {
  const navigate = useNavigate()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  // 최상단 센티넬이 뷰포트를 벗어나면(스크롤되면) fixed 상태로 간주
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />
      <header
        className={`fixed top-0 inset-x-0 z-40 h-[50px] bg-[#F1F5F9] flex items-center gap-2 px-5 ${
          scrolled ? 'border-b border-[#C5C5C5]' : ''
        } ${className}`}
      >
        <div className="flex-none min-w-[28px] flex items-center">
          {left ?? (showBack && (
            <button
              type="button"
              onClick={onBack ?? (() => navigate(-1))}
              aria-label="뒤로가기"
              className="p-1 -ml-1"
            >
              <img src={icBack} width={8} height={14} alt="뒤로가기" />
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-center text-center">{title}</div>
        <div className="flex-none min-w-[28px] flex items-center justify-end">{right}</div>
      </header>
      {/* 고정 헤더 높이만큼 본문 자리 확보 */}
      <div className="h-[50px] flex-none" aria-hidden="true" />
    </>
  )
}
