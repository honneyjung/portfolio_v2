import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// ── 한국어 (기본) ──────────────────────────────────────
import koCommon   from '../locales/ko/common.json'
import koAuth     from '../locales/ko/auth.json'
import koSurvey   from '../locales/ko/survey.json'
import koReport   from '../locales/ko/report.json'
import koChallenge from '../locales/ko/challenge.json'
import koHemilian from '../locales/ko/hemilian.json'
import koMypage   from '../locales/ko/mypage.json'
import koHome     from '../locales/ko/home.json'
import koNotification from '../locales/ko/notification.json'

// ── 영어 ───────────────────────────────────────────────
import enCommon from '../locales/en/common.json'
import enAuth   from '../locales/en/auth.json'

// ── 지원 언어 목록 ─────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'zh', label: '中文', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'pt', label: 'Português', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },  // RTL
] as const

export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]['code']

export const isRTL = (lang: string) =>
  SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.dir === 'rtl'

// ── i18n 초기화 ────────────────────────────────────────
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'ko',           // 기본 언어: 한국어
    fallbackLng: 'ko',   // 번역 없을 때 한국어로 폴백
    defaultNS: 'common',
    ns: ['common', 'auth', 'survey', 'report', 'challenge', 'hemilian', 'mypage', 'home', 'notification'],

    resources: {
      ko: {
        common:    koCommon,
        auth:      koAuth,
        survey:    koSurvey,
        report:    koReport,
        challenge: koChallenge,
        hemilian:  koHemilian,
        mypage:    koMypage,
        home:      koHome,
        notification: koNotification,
      },
      en: {
        common: enCommon,
        auth:   enAuth,
        // 나머지 네임스페이스는 번역 작업 후 추가
      },
    },

    interpolation: {
      escapeValue: false, // React는 XSS 처리 내장
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'hemily_lang',
    },
  })

export default i18n
