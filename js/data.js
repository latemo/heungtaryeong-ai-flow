/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 핵심 데이터 및 AI 예측 시뮬레이션 모델 데이터셋
 * 
 * [데이터 출처 및 기준]
 * - 2025.09 천안시 교차로 교통량 원문 174,960행
 * - 2025-2026 천안흥타령춤축제 공식 프로그램 102건, 부스 81건, 화장실 154건
 * - AI 모델: 요일·시간 중앙값 기반 예측 (WAPE 9.29%, 베이스라인 대비 52.67% 오차 개선)
 * 
 * [Data Trust 원칙 - 용어 정의]
 * - 접근 부하: 교차로 차량 통과량 기반 상대 지수 (0~100)
 * - 예상 포화: 정적 면수 · 거리 · 유입 시나리오 기반 포화율 (%)
 * - 보행 혼잡: 프로그램 · 무대 배치 기반 대리 지표
 * - 상권 분산: 후보 노출 · 열람 · 전환 클릭 기반 지표
 */

const FESTIVAL_DATA = {
  meta: {
    title: "천안흥타령춤축제 2026",
    subTitle: "흥타령 AI FLOW (천안 J3D LAB)",
    slogan: "종합운동장에 몰리는 차량 흐름을 읽고, 삼거리공원과 동남권 상권으로 나누는 지능형 교통 운영",
    date: "2026.09.23(수) ~ 09.27(일)",
    currentTimestamp: "2026-09-25 14:30:00 KST (축제 3일차)",
    weather: {
      temp: 25.4,
      condition: "맑음",
      icon: "☀️",
      humidity: 52,
      airQuality: "좋음 (18㎍/㎥)"
    },
    metrics2025: {
      totalVisitors: "89.2만명",
      familyRatio: "61.8%",
      satisfaction: "5.8 / 7.0",
      trafficRows: "174,960행",
      programs: "102건",
      booths: "81건",
      toilets: "154건"
    },
    aiModelMetrics: {
      modelName: "시간 순서 검증 (9.02~9.21 학습, 9.22~9.30 테스트)",
      wape: "9.29%",
      baselineWape: "19.63%",
      improvement: "52.67%",
      notes: "교차로 차량 통과량 예측치이며, 행사장 내부 인원수 집계가 아닙니다."
    }
  },

  // 양대 행사장 거점 정보
  venues: {
    stadium: {
      id: "stadium",
      name: "천안종합운동장",
      subName: "서북권 메인 거점 (주무대 5곳)",
      lat: 36.8227,
      lng: 127.1192,
      color: "#ff4d4f",
      description: "접근 수요가 집중되는 전통적 중심축. 주차 대기 발생 빈도 높음",
      stages: ["흥타령극장(주무대)", "천안극장", "신명극장", "버드나무극장", "스트릿댄스파크"],
      currentLoad: 72,      // 현재 접근 부하
      predictedLoad30: 84,  // 30분 뒤
      predictedLoad60: 93,  // 60분 뒤 (초혼잡)
      parkingStatus: {
        totalSpaces: 2450,
        estimatedOccupancyRate: 88, // 예상 포화율
        statusText: "혼잡 (입차 대기 25~35분 소요 예상)",
        level: "danger"
      },
      eventsNow: [
        { time: "14:30 - 16:30", title: "전국대학 무용경연대회 결선", stage: "흥타령극장", crowd: "매우 혼잡" },
        { time: "15:00 - 17:00", title: "거리댄스 퍼레이드 사전 리허설", stage: "종합운동장 광장", crowd: "혼잡" }
      ]
    },
    samgeori: {
      id: "samgeori",
      name: "천안삼거리공원",
      subName: "동남권 분산 거점 (문화·상권 연계축)",
      lat: 36.7885,
      lng: 127.1698,
      color: "#52c41a",
      description: "추진 중인 분산 거점. 능소호수 피크닉, 전통춤 경연 및 원도심 상권 연결축",
      stages: ["삼거리전통극장", "능소호수무대", "흥마당버스킹존", "청년문화광장"],
      currentLoad: 38,      // 현재 접근 부하 (여유)
      predictedLoad30: 45,  // 30분 뒤
      predictedLoad60: 52,  // 60분 뒤 (원활)
      parkingStatus: {
        totalSpaces: 1800,
        estimatedOccupancyRate: 42, // 예상 포화율
        statusText: "원활 (즉시 입차 가능, 임시 셔틀 운영)",
        level: "success"
      },
      eventsNow: [
        { time: "14:30 - 16:00", title: "명인명무 전통춤 한마당 & 흥타령 마당극", stage: "삼거리전통극장", crowd: "쾌적" },
        { time: "15:00 - 18:00", title: "능소 호수 가족 피크닉 & 버스킹 페스타", stage: "능소호수무대", crowd: "여유" }
      ]
    }
  },

  // 8대 주요 교차로 관측 노드 (서북권~동남권 축)
  intersections: [
    {
      id: "INT-01",
      name: "종합운동장사거리",
      zone: "서북권",
      lat: 36.8248,
      lng: 127.1180,
      current: 78,
      pred30: 88,
      pred60: 96,
      throughput: "2,410대/h",
      status: "혼잡",
      recommendation: "번영로 방면 우회 권장"
    },
    {
      id: "INT-02",
      name: "천안시청앞 교차로",
      zone: "서북권",
      lat: 36.8155,
      lng: 127.1136,
      current: 71,
      pred30: 82,
      pred60: 91,
      throughput: "2,150대/h",
      status: "혼잡",
      recommendation: "남부대로 이용 권장"
    },
    {
      id: "INT-03",
      name: "불당대로사거리",
      zone: "서북권",
      lat: 36.8068,
      lng: 127.1152,
      current: 65,
      pred30: 74,
      pred60: 83,
      throughput: "1,980대/h",
      status: "서행",
      recommendation: "우회 불필요"
    },
    {
      id: "INT-04",
      name: "봉명역사거리 (연결축)",
      zone: "도심연결",
      lat: 36.8010,
      lng: 127.1350,
      current: 54,
      pred30: 61,
      pred60: 68,
      throughput: "1,620대/h",
      status: "보통",
      recommendation: "동남권 직통 진입로 권장"
    },
    {
      id: "INT-05",
      name: "천안역 동부광장교차로",
      zone: "원도심",
      lat: 36.8090,
      lng: 127.1475,
      current: 48,
      pred30: 53,
      pred60: 59,
      throughput: "1,450대/h",
      status: "원활",
      recommendation: "원도심 상권 방문 최적"
    },
    {
      id: "INT-06",
      name: "남부대로교차로 (청수)",
      zone: "동남권",
      lat: 36.7865,
      lng: 127.1440,
      current: 42,
      pred30: 48,
      pred60: 55,
      throughput: "1,310대/h",
      status: "원활",
      recommendation: "삼거리공원 진입 추천"
    },
    {
      id: "INT-07",
      name: "천안삼거리 입구삼거리",
      zone: "동남권",
      lat: 36.7892,
      lng: 127.1655,
      current: 36,
      pred30: 44,
      pred60: 51,
      throughput: "1,120대/h",
      status: "쾌적",
      recommendation: "공원 임시주차장 즉시 주차 가능"
    },
    {
      id: "INT-08",
      name: "구성동사거리",
      zone: "동남권",
      lat: 36.7970,
      lng: 127.1680,
      current: 39,
      pred30: 45,
      pred60: 50,
      throughput: "1,190대/h",
      status: "쾌적",
      recommendation: "원활"
    }
  ],

  // 순환 셔틀버스 노선 (서북권 ~ 동남권 분산 지원)
  shuttleRoute: {
    name: "흥타령 AI 안심 셔틀 (서북 ↔ 동남 급행)",
    interval: "10분 간격 (총 8대 순환 운행)",
    stops: [
      { name: "천안종합운동장(북문)", lat: 36.8245, lng: 127.1190 },
      { name: "천안시청정류장", lat: 36.8150, lng: 127.1140 },
      { name: "봉명역 셔틀스톱", lat: 36.8010, lng: 127.1350 },
      { name: "천안역 동부광장(상권연계)", lat: 36.8090, lng: 127.1475 },
      { name: "남산중앙시장(먹거리골목)", lat: 36.8020, lng: 127.1530 },
      { name: "천안삼거리공원(정문)", lat: 36.7885, lng: 127.1698 }
    ]
  },

  // 시민 추천 분산 동선 3선
  recommendedRoutes: [
    {
      id: "route-1",
      title: "코스 A. [가족 힐링] 삼거리공원 전통춤 & 호수 피크닉",
      badge: "대기시간 45분 절약",
      badgeType: "best",
      target: "가족 단위 방문객 (61.8% 취향 저격)",
      duration: "약 3시간 30분",
      congestionScore: "원활 (지수 35)",
      savedWaitTime: "45분 절약",
      tags: ["가족추천", "쾌적한 주차", "호수 피크닉", "천안사랑카드 혜택"],
      steps: [
        {
          order: 1,
          time: "14:30",
          place: "천안삼거리공원 제2임시주차장",
          desc: "대기 없이 3분 내 여유로운 주차 완료",
          type: "parking"
        },
        {
          order: 2,
          time: "15:00",
          place: "능소호수 잔디광장 & 전통극장",
          desc: "명인명무 전통춤 관람 및 호수 피크닉 (잔디 쉼터 완비)",
          type: "event"
        },
        {
          order: 3,
          time: "16:40",
          place: "남산중앙시장 전통 먹거리골목",
          desc: "순환 셔틀로 7분 이동, 천안 호두과자 & 칼국수 맛집 투어 (10% 할인 쿠폰)",
          type: "commerce"
        }
      ],
      commerceBenefit: "남산중앙시장 10% 추가할인 + 천안사랑카드 10% 캐시백"
    },
    {
      id: "route-2",
      title: "코스 B. [스트릿 댄스 & 원도심 카페거리] 청년 감성 투어",
      badge: "청년 추천 인기",
      badgeType: "hot",
      target: "친구·연인 및 스트릿 댄스 팬",
      duration: "약 4시간",
      congestionScore: "보통 (지수 48)",
      savedWaitTime: "30분 절약",
      tags: ["청년몰", "명동거리", "거리버스킹", "야간라이팅"],
      steps: [
        {
          order: 1,
          time: "15:00",
          place: "천안역 동부광장 & 명동 패션거리",
          desc: "청년 창업몰 플리마켓 구경 및 감성 카페 디저트 투어",
          type: "commerce"
        },
        {
          order: 2,
          time: "16:30",
          place: "흥타령 셔틀 탑승 (동남권 직통)",
          desc: "지정 셔틀로 혼잡 정체 없이 삼거리공원 청년문화광장 이동",
          type: "shuttle"
        },
        {
          order: 3,
          time: "17:00",
          place: "삼거리공원 스트릿댄스 & DJ 버스킹",
          desc: "국제 댄서들과 함께하는 프리스타일 댄스 배틀 및 일몰 야경 감상",
          type: "event"
        }
      ],
      commerceBenefit: "명동거리 청년카페 음료 1,000원 즉시 할인권 증정"
    },
    {
      id: "route-3",
      title: "코스 C. [시간차 스마트 관람] 메인무대 + 삼거리 분산",
      badge: "피크 분산 최적",
      badgeType: "smart",
      target: "메인무대도 보고 여유도 챙기는 알뜰족",
      duration: "약 5시간",
      congestionScore: "혼잡회피 (지수 58)",
      savedWaitTime: "50분 절약",
      tags: ["시간차 공략", "전국무용경연", "남부우회도로", "야간드론쇼"],
      steps: [
        {
          order: 1,
          time: "14:30",
          place: "종합운동장 흥타령극장 (낮 시간)",
          desc: "피크 시작 전 전국대학 무용경연 관람 (혼잡 시작 16시 전 퇴장)",
          type: "event"
        },
        {
          order: 2,
          time: "16:15",
          place: "남부대로 우회축 이동 (차량 15분)",
          desc: "AI FLOW 권고 우회도로를 통해 극심 정체 없이 동남권 이동",
          type: "route"
        },
        {
          order: 3,
          time: "17:00",
          place: "삼거리공원 야간 댄스파티 & 천안맛집",
          desc: "여유로운 저녁 식사 후 능소호수 드론 라이트쇼 감상",
          type: "event"
        }
      ],
      commerceBenefit: "동남권 지정 음식점 메밀막국수/석갈비 1인 2,000원 할인"
    }
  ],

  // 동남권 및 원도심 상권 제휴 데이터 (상권 분산 지표 연동)
  merchants: [
    {
      id: "m-1",
      name: "원조 할머니학화호두과자 본점",
      category: "천안 명물 / 디저트",
      zone: "천안역 앞 원도심",
      distance: "삼거리공원에서 셔틀 8분",
      benefit: "흥타령 AI FLOW 방문객 10% 추가할인 + 선물용 박스 증정",
      views: 3420,
      conversions: 890,
      badge: "천안 1호 명물",
      address: "천안시 동남구 대흥로 233"
    },
    {
      id: "m-2",
      name: "남산중앙시장 원조 손칼국수 & 전골목",
      category: "전통시장 먹거리",
      zone: "남산중앙시장",
      distance: "삼거리공원에서 셔틀 6분",
      benefit: "천안사랑카드 결제 시 10% 페이백 + 튀김 1개 무료 쿠폰",
      views: 4150,
      conversions: 1120,
      badge: "가성비 최고",
      address: "천안시 동남구 사직로 7"
    },
    {
      id: "m-3",
      name: "삼거리 능소 메밀막국수 & 석갈비",
      category: "한식 / 패밀리 레스토랑",
      zone: "삼거리공원 인근",
      distance: "삼거리공원 정문 도보 3분",
      benefit: "가족 세트 주문 시 3,000원 할인권",
      views: 2890,
      conversions: 740,
      badge: "가족 식사 추천",
      address: "천안시 동남구 충절로 380"
    },
    {
      id: "m-4",
      name: "카페 어반브릭스 (명동 감성카페)",
      category: "베이커리 & 로스터리 카페",
      zone: "명동거리",
      distance: "천안역 도보 4분",
      benefit: "전 메뉴 음료 1,000원 할인 + 쿠키 증정",
      views: 1980,
      conversions: 520,
      badge: "인스타 감성",
      address: "천안시 동남구 버들로 18"
    }
  ],

  // 기획서 6~7p City Operator (시정 운영자) 시나리오 데이터
  operatorScenarios: [
    {
      id: "OP-ALERT-01",
      level: "warning",
      title: "종합운동장사거리 30분 뒤 극심 혼잡 (지수 88 예측)",
      detectedTime: "14:25:00",
      reason: "교차로 유입량 급증 + 전국대학 무용경연 결선 관람객 집중",
      evidence: "교차로 통과량 2,410대/h (전주 대비 +34%), WAPE 9.29% 신뢰도",
      recommendedAction: "VMS 전광판 삼거리공원 우회 표출 및 시민앱 삼거리 무대 추천 푸시 발송",
      channelTargets: ["VMS 전광판 4개소", "흥타령 시민앱 긴급 브리핑", "모바일 웹 상단 공지"],
      status: "pending", // pending -> approved
      impactProjection: "종합운동장 유입 차량 약 18% 동남권 전환 유도 가능"
    },
    {
      id: "OP-ALERT-02",
      level: "info",
      title: "동남권 삼거리공원 주차면 여유 (예상 포화율 42%)",
      detectedTime: "14:28:00",
      reason: "삼거리공원 주차 여력 1,000면 이상 확보 상태 유지",
      evidence: "정적 면수 대비 진입 차량 비율 안정권",
      recommendedAction: "서북구청-삼거리공원 급행 안심 셔틀 2대 긴급 추가 투입",
      channelTargets: ["셔틀 운행 관리 시스템", "시민앱 셔틀 탑승 알림"],
      status: "pending",
      impactProjection: "셔틀 대기시간 10분 -> 6분으로 단축"
    },
    {
      id: "OP-ALERT-03",
      level: "commerce",
      title: "남산중앙시장 & 동남권 상권 스탬프 참여율 급증",
      detectedTime: "14:15:00",
      reason: "시민 전환 코스 A 선택률 44% 기록, 상권 쿠폰 클릭 1,120건 돌파",
      evidence: "전환 기록 로그 집계 실시간 분석",
      recommendedAction: "천안사랑카드 10% 추가 캐시백 연계 부스 안내 유지",
      channelTargets: ["행사장 안내방송", "시민앱 혜택 탭"],
      status: "approved",
      impactProjection: "동남권 소상공인 매출 연계 지표 가시화"
    }
  ]
};

// 전역 내보내기
if (typeof window !== "undefined") {
  window.FESTIVAL_DATA = FESTIVAL_DATA;
}
