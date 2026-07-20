import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/api/client'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

export default function ReportIndexPage() {
  const navigate = useNavigate()

  const { data, isError } = useQuery({
    queryKey: ['reports-latest'],
    queryFn: () => apiClient.get('/reports/me', { params: { limit: 1 }, ...noAutoLogout }),
    retry: false,
  })

  useEffect(() => {
    if (data === undefined && !isError) return
    const reportId = data?.status === 200
      ? (data.data as unknown as { items: { id: string }[] })?.items?.[0]?.id
      : null
    navigate(reportId ? `/report/${reportId}` : '/survey', { replace: true })
  }, [data, isError, navigate])

  return <div className="min-h-screen bg-[#F1F5F9]" />
}
