/**
 * 마이페이지 프리뷰 (개발용 — 인증 없이 mock 데이터로 확인)
 * 확인 후 삭제 예정. HomePagePreview의 시드(queryClient + authStore)를 재사용한다.
 */
import { Navigate } from 'react-router-dom'
import '../HomePagePreview'

export default function MyPagePreview() {
  return <Navigate to="/preview/mypage/view" replace />
}
