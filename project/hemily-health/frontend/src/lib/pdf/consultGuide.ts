// 사업자(해밀리안) 상담 가이드 멘트 — D·N·A 단계별 고객 전달 핵심 메시지 + 비유 키워드
// 해밀리안 상담용 PDF(consultGuide 모드)에서만 사용

export interface ConsultGuideItem {
  stage: 'D' | 'N' | 'A'
  stageName: string
  message: string
  keyword: string
}

export const CONSULT_GUIDE: ConsultGuideItem[] = [
  {
    stage: 'D',
    stageName: 'Detox (비움/정화)',
    message:
      '아무리 좋은 영양소도 장이 오염되어 있고 혈액에 독소가 가득하면 흡수되지 않습니다. 유산균과 효소환은 장내 부패를 막아 영양소가 들어올 길을 닦는 청소기입니다.',
    keyword: '청소기',
  },
  {
    stage: 'N',
    stageName: 'Nutrition (채움/수선)',
    message:
      '세포가 병드는 것은 설계도가 망가졌기 때문입니다. 휴젠푸드는 단순 영양제가 아니라 손상된 유전자를 수선하는 세포 설계도 수선제이며, 라이프밀은 이 수선 작업이 이루어지는 가장 깨끗하고 풍요로운 살아있는 토양입니다.',
    keyword: '세포 설계도 수선제 / 살아있는 토양',
  },
  {
    stage: 'A',
    stageName: 'Activation (활성/방어)',
    message:
      '청소하고 재료를 채웠다면 이제 몸의 방어 시스템을 켜야 합니다. 이뮨푸드는 잠든 면역 세포를 깨워 변이 세포를 감시하게 만드는 정밀 면역 스위치입니다.',
    keyword: '정밀 면역 스위치',
  },
]
