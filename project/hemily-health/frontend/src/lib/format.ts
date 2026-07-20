/**
 * 날짜·숫자·통화를 현재 언어에 맞게 포맷합니다.
 * 브라우저 내장 Intl API를 사용하여 별도 라이브러리 불필요.
 */

export const formatDate = (
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(d)
}

export const formatNumber = (n: number, locale: string) =>
  new Intl.NumberFormat(locale).format(n)

export const formatPercent = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value / 100)
