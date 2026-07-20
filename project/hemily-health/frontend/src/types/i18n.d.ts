/**
 * i18next TypeScript 타입 확장
 * 번역 키를 잘못 쓰면 컴파일 에러로 잡힙니다.
 *
 * NOTE: survey 네임스페이스는 동적 키(cancerType.${x}, chronicType.${x} 등)를
 * 많이 사용하므로 느슨한 타입으로 설정합니다.
 */
import type koCommon    from '../locales/ko/common.json'
import type koAuth      from '../locales/ko/auth.json'
import type koReport    from '../locales/ko/report.json'
import type koChallenge from '../locales/ko/challenge.json'
import type koHemilian  from '../locales/ko/hemilian.json'
import type koMypage    from '../locales/ko/mypage.json'
import type koHome      from '../locales/ko/home.json'
import type koNotification from '../locales/ko/notification.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false
    returnEmptyString: false
    defaultNS: 'common'
    resources: {
      common:       typeof koCommon
      auth:         typeof koAuth
      survey:       Record<string, unknown>
      report:       typeof koReport
      challenge:    typeof koChallenge
      hemilian:     typeof koHemilian
      mypage:       typeof koMypage
      home:         typeof koHome
      notification: typeof koNotification
    }
  }
}
