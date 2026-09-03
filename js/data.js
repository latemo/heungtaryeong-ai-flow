/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 실시간 시간 동기화(Live Time Engine) 및 시간대별 동적 교통/주차 분석 알고리즘
 */

const FESTIVAL_DATA = {
  meta: {
    title: "천안흥타령춤축제 2026",
    subTitle: "흥타령 AI FLOW (천안 J3D LAB)",
    slogan: "종합운동장에 몰리는 차량 흐름을 읽고, 삼거리공원과 동남권 상권으로 나누는 지능형 교통 운영",
    date: "2026.09.23(수) ~ 09.27(일)",
    weather: {
      temp: 25.4,
      condition: "맑음",
      icon: "☀️",
      humidity: 52,
      airQuality: "좋음 (18㎍/㎥)"
    },
    aiModelMetrics: {
      modelName: "시간 순서 검증 (9.02~9.21 학습, 9.22~9.30 테스트)",
      wape: "9.29%",
      baselineWape: "19.63%",
      improvement: "52.67%",
      notes: "천안시 교차로 174,960행 기반 시간대별 차량 통과량 실시간 예측"
    }
  },

  // 양대 행사장 기본 메타
  venues: {
    stadium: {
      id: "stadium",
      name: "천안종합운동장",
      subName: "서북권 메인 거점 (주무대 5곳)",
      lat: 36.8227,
      lng: 127.1192,
      color: "#e11d48",
      totalParking: 2450,
      currentLoad: 72,
      predictedLoad30: 84,
      predictedLoad60: 93,
      parkingStatus: {
        totalSpaces: 2450,
        estimatedOccupancyRate: 88,
        statusText: "혼잡 (입차 대기 35분 이상)",
        level: "danger"
      },
      stages: ["흥타령극장(주무대)", "천안극장", "신명극장", "버드나무극장", "스트릿댄스파크"]
    },
    samgeori: {
      id: "samgeori",
      name: "천안삼거리공원",
      subName: "동남권 분산 거점 (문화·상권 연계축)",
      lat: 36.7885,
      lng: 127.1698,
      color: "#059669",
      totalParking: 1800,
      currentLoad: 38,
      predictedLoad30: 45,
      predictedLoad60: 52,
      parkingStatus: {
        totalSpaces: 1800,
        estimatedOccupancyRate: 42,
        statusText: "원활 (즉시 입차 가능, 임시 셔틀 운영)",
        level: "success"
      },
      stages: ["삼거리전통극장", "능소호수무대", "흥마당버스킹존", "청년문화광장"]
    }
  },

  // 8대 관측 교차로 기준 메타
  baseIntersections: [
    { id: "INT-01", name: "종합운동장사거리", zone: "서북권", lat: 36.8248, lng: 127.1180, baseLoad: 78, weight: 1.25, rec: "번영로 방면 우회 권장" },
    { id: "INT-02", name: "천안시청앞 교차로", zone: "서북권", lat: 36.8155, lng: 127.1136, baseLoad: 71, weight: 1.18, rec: "남부대로 이용 권장" },
    { id: "INT-03", name: "불당대로사거리", zone: "서북권", lat: 36.8068, lng: 127.1152, baseLoad: 65, weight: 1.10, rec: "서행 유지" },
    { id: "INT-04", name: "봉명역사거리 (연결축)", zone: "도심연결", lat: 36.8010, lng: 127.1350, baseLoad: 54, weight: 0.95, rec: "동남권 직통 진입로 권장" },
    { id: "INT-05", name: "천안역 동부광장교차로", zone: "원도심", lat: 36.8090, lng: 127.1475, baseLoad: 48, weight: 0.88, rec: "원도심 상권 방문 최적" },
    { id: "INT-06", name: "남부대로교차로 (청수)", zone: "동남권", lat: 36.7865, lng: 127.1440, baseLoad: 42, weight: 0.82, rec: "삼거리공원 진입 추천" },
    { id: "INT-07", name: "천안삼거리 입구삼거리", zone: "동남권", lat: 36.7892, lng: 127.1655, baseLoad: 36, weight: 0.72, rec: "공원 임시주차장 즉시 주차 가능" },
    { id: "INT-08", name: "구성동사거리", zone: "동남권", lat: 36.7970, lng: 127.1680, baseLoad: 39, weight: 0.75, rec: "소통 원활" }
  ],

  // 시설물 데이터
  toilets: [
    { id: "T-01", name: "종합운동장 주경기장 1층 안심화장실", zone: "서북권", lat: 36.8232, lng: 127.1188, handicap: true, babyCare: true },
    { id: "T-02", name: "흥타령극장 광장 이동형 안심화장실 A", zone: "서북권", lat: 36.8220, lng: 127.1205, handicap: true, babyCare: false },
    { id: "T-03", name: "천안시청 민원실 개방 화장실", zone: "서북권", lat: 36.8152, lng: 127.1142, handicap: true, babyCare: true },
    { id: "T-04", name: "삼거리공원 능소호수 정자 화장실", zone: "동남권", lat: 36.7880, lng: 127.1702, handicap: true, babyCare: true },
    { id: "T-05", name: "삼거리공원 제2임시주차장 안심화장실", zone: "동남권", lat: 36.7895, lng: 127.1670, handicap: true, babyCare: false },
    { id: "T-06", name: "남산중앙시장 고객지원센터 화장실", zone: "원도심", lat: 36.8025, lng: 127.1532, handicap: true, babyCare: true },
    { id: "T-07", name: "천안역 동부광장 공중화장실", zone: "원도심", lat: 36.8092, lng: 127.1478, handicap: true, babyCare: false }
  ],

  booths: [
    { id: "B-01", name: "삼거리공원 천안 명품 호두과자 체험 부스", category: "체험/특산물", zone: "동남권", lat: 36.7878, lng: 127.1685, desc: "전통 가마솥 호두과자 굽기 체험 & 할인 판매" },
    { id: "B-02", name: "삼거리 능소 청년 푸드트럭 빌리지 (12종)", category: "푸드/미식", zone: "동남권", lat: 36.7890, lng: 127.1710, desc: "스테이크, 팟타이, 츄러스, 지역 수제맥주" },
    { id: "B-03", name: "남산중앙시장 전통 막걸리 & 전 페스타 부스", category: "푸드/미식", zone: "원도심", lat: 36.8020, lng: 127.1538, desc: "천안 쌀막걸리와 녹두빈대떡 특별 시식회" },
    { id: "B-04", name: "종합운동장 공식 종합안내 & 미아보호소", category: "안내/안전", zone: "서북권", lat: 36.8225, lng: 127.1195, desc: "미아방지 팔찌 배부, 휠체어/유모차 무료 대여" },
    { id: "B-05", name: "삼거리공원 응급의료지원센터 & 수유실", category: "의료/편의", zone: "동남권", lat: 36.7882, lng: 127.1695, desc: "간호사 상주, 냉온정수기 및 전자레인지 완비" }
  ],

  parkings: [
    { id: "P-01", name: "천안종합운동장 주차장", capacity: "2,450면", lat: 36.8235, lng: 127.1210, fee: "무료" },
    { id: "P-02", name: "천안시청 임시주차장", capacity: "1,200면", lat: 36.8148, lng: 127.1130, fee: "무료 (셔틀 연계)" },
    { id: "P-03", name: "천안삼거리공원 대형 임시주차장", capacity: "1,800면", lat: 36.7898, lng: 127.1660, fee: "무료 (즉시 입차)" }
  ],

  shuttleRoute: {
    name: "흥타령 AI 안심 셔틀 (서북 ↔ 동남 급행)",
    intervalMin: 10,
    totalBuses: 8,
    stops: [
      { id: "ST-01", name: "천안종합운동장(북문)", lat: 36.8245, lng: 127.1190 },
      { id: "ST-02", name: "천안시청 정류장", lat: 36.8150, lng: 127.1140 },
      { id: "ST-03", name: "봉명역 셔틀스톱", lat: 36.8010, lng: 127.1350 },
      { id: "ST-04", name: "천안역 동부광장(상권연계)", lat: 36.8090, lng: 127.1475 },
      { id: "ST-05", name: "남산중앙시장(먹거리골목)", lat: 36.8020, lng: 127.1530 },
      { id: "ST-06", name: "천안삼거리공원(정문)", lat: 36.7885, lng: 127.1698 }
    ]
  },

  // 상권 제휴 데이터
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
      address: "천안시 동남구 대흥로 233",
      lat: 36.8098,
      lng: 127.1482
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
      address: "천안시 동남구 사직로 7",
      lat: 36.8022,
      lng: 127.1534
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
      address: "천안시 동남구 충절로 380",
      lat: 36.7875,
      lng: 127.1688
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
      address: "천안시 동남구 버들로 18",
      lat: 36.8082,
      lng: 127.1495
    }
  ],

  // 102개 공식 프로그램 중 12대 프로그램 (시작/종료 시간 내장)
  programs: [
    { id: "P-01", title: "전국대학 무용경연대회 결선", startHour: 14, startMin: 30, endHour: 16, endMin: 30, venue: "종합운동장", stage: "흥타령극장(주무대)", tag: "경연/현대무용", isHot: true },
    { id: "P-02", title: "명인명무 전통춤 한마당 & 흥타령 마당극", startHour: 14, startMin: 30, endHour: 16, endMin: 0, venue: "삼거리공원", stage: "삼거리전통극장", tag: "전통춤/마당극", isHot: false },
    { id: "P-03", title: "능소 호수 가족 피크닉 & 어쿠스틱 버스킹", startHour: 15, startMin: 0, endHour: 18, endMin: 0, venue: "삼거리공원", stage: "능소호수무대", tag: "가족/버스킹", isHot: true },
    { id: "P-04", title: "거리댄스 퍼레이드 사전 리허설", startHour: 15, startMin: 0, endHour: 17, endMin: 0, venue: "종합운동장", stage: "종합운동장 광장", tag: "퍼레이드", isHot: false },
    { id: "P-05", title: "국제 댄스 배틀 16강 (스트릿 댄스 파크)", startHour: 16, startMin: 30, endHour: 19, endMin: 0, venue: "종합운동장", stage: "스트릿댄스파크", tag: "스트릿댄스", isHot: true },
    { id: "P-06", title: "삼거리 청년 플래시몹 & K-POP 커버댄스", startHour: 17, startMin: 0, endHour: 18, endMin: 30, venue: "삼거리공원", stage: "청년문화광장", tag: "K-POP/참여형", isHot: false },
    { id: "P-07", title: "거리댄스 퍼레이드 본선 (1부)", startHour: 18, startMin: 30, endHour: 20, endMin: 0, venue: "종합운동장", stage: "종합운동장 특설대로", tag: "퍼레이드/하이라이트", isHot: true },
    { id: "P-08", title: "능소 호수 미디어 파사드 & 드론 라이트쇼", startHour: 20, startMin: 0, endHour: 20, endMin: 40, venue: "삼거리공원", stage: "능소호수 상공", tag: "드론쇼/야경", isHot: true },
    { id: "P-09", title: "전국 읍면동 춤경연 본선 (시민 한마당)", startHour: 20, startMin: 30, endHour: 22, endMin: 0, venue: "삼거리공원", stage: "삼거리전통극장", tag: "시민참여", isHot: false },
    { id: "P-10", title: "세계 민속춤 갈라쇼 & 폐막 애프터 DJ 파티", startHour: 21, startMin: 0, endHour: 23, endMin: 0, venue: "종합운동장", stage: "흥타령극장", tag: "DJ파티/야간", isHot: true }
  ],

  // --------------------------------------------------------------------------
  // [핵심 실시간 분석 엔진] 현재 시각 기준 교통 부하 및 대기시간 실시간 동적 산출식
  // --------------------------------------------------------------------------
  calculateRealtimeTraffic(currentDate = new Date()) {
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const timeDec = hours + minutes / 60; // 예: 14:30 -> 14.5

    // 기획서 8p 천안시 17.4만 건 교통량 기반 시간대별 부하 계수 (0.0 ~ 1.0)
    let timeFactor = 0.25; // 기본 심야 (00~06시)
    if (timeDec >= 6 && timeDec < 9) {
      timeFactor = 0.25 + (timeDec - 6) * 0.1; // 0.25 -> 0.55 (아침)
    } else if (timeDec >= 9 && timeDec < 12) {
      timeFactor = 0.55 + (timeDec - 9) * 0.05; // 0.55 -> 0.70 (오전 개장)
    } else if (timeDec >= 12 && timeDec < 17) {
      timeFactor = 0.70 + (timeDec - 12) * 0.04; // 0.70 -> 0.90 (오후 메인 피크)
    } else if (timeDec >= 17 && timeDec < 21) {
      timeFactor = 0.90 + Math.sin((timeDec - 17) * Math.PI / 4) * 0.08; // 0.90 -> 0.98 (야간 퍼레이드 최정점)
    } else if (timeDec >= 21 && timeDec < 23) {
      timeFactor = 0.85 - (timeDec - 21) * 0.2; // 0.85 -> 0.45 (퇴장 분산)
    } else if (timeDec >= 23 || timeDec < 6) {
      timeFactor = 0.2; // 심야
    }

    // 30분 뒤 및 60분 뒤 시간 계수
    const timeDec30 = (timeDec + 0.5) % 24;
    const timeDec60 = (timeDec + 1.0) % 24;
    const factor30 = this._getTimeFactor(timeDec30);
    const factor60 = this._getTimeFactor(timeDec60);

    // 1. 종합운동장 실시간 산출
    const stadiumCurrent = Math.min(98, Math.max(18, Math.round(timeFactor * 78)));
    const stadiumPred30 = Math.min(99, Math.max(20, Math.round(factor30 * 88)));
    const stadiumPred60 = Math.min(99, Math.max(22, Math.round(factor60 * 94)));

    // 주차 포화율 & 대기시간 실시간 산출 공식
    const stadiumOccupancy = Math.min(98, Math.max(15, Math.round(timeFactor * 92)));
    let stadiumWaitTime = "대기 없음 (자유 입차)";
    let stadiumLevel = "success";

    if (stadiumOccupancy >= 85) {
      const waitMin = Math.round((stadiumOccupancy - 80) * 4) + 15; // 35~45분
      stadiumWaitTime = `주차 대기 ${waitMin}분 이상 소요 ⚠️`;
      stadiumLevel = "danger";
    } else if (stadiumOccupancy >= 65) {
      const waitMin = Math.round((stadiumOccupancy - 60) * 1.5);
      stadiumWaitTime = `주차 대기 약 ${waitMin}분`;
      stadiumLevel = "warning";
    }

    // 2. 삼거리공원 실시간 산출 (분산 정책으로 안정적 유지)
    const samgeoriCurrent = Math.min(65, Math.max(12, Math.round(timeFactor * 42)));
    const samgeoriPred30 = Math.min(70, Math.max(15, Math.round(factor30 * 48)));
    const samgeoriPred60 = Math.min(75, Math.max(18, Math.round(factor60 * 55)));
    const samgeoriOccupancy = Math.min(70, Math.max(10, Math.round(timeFactor * 45)));

    // 3. 8개 교차로 실시간 산출
    const intersections = this.baseIntersections.map(base => {
      const current = Math.min(98, Math.max(15, Math.round(timeFactor * base.baseLoad)));
      const pred30 = Math.min(99, Math.max(18, Math.round(factor30 * base.baseLoad * 1.12)));
      const pred60 = Math.min(99, Math.max(20, Math.round(factor60 * base.baseLoad * 1.22)));
      
      const throughputNum = Math.round(current * 31);
      let status = "원활";
      if (current >= 70) status = "혼잡";
      else if (current >= 50) status = "서행";

      return {
        ...base,
        current,
        pred30,
        pred60,
        status,
        throughput: `${throughputNum.toLocaleString()}대/h`
      };
    });

    return {
      timeString: currentDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateString: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`,
      stadium: {
        currentLoad: stadiumCurrent,
        pred30: stadiumPred30,
        pred60: stadiumPred60,
        occupancy: stadiumOccupancy,
        waitTimeText: stadiumWaitTime,
        level: stadiumLevel
      },
      samgeori: {
        currentLoad: samgeoriCurrent,
        pred30: samgeoriPred30,
        pred60: samgeoriPred60,
        occupancy: samgeoriOccupancy,
        waitTimeText: "즉시 주차 가능 (여유 1,000면+)",
        level: "success"
      },
      intersections
    };
  },

  _getTimeFactor(timeDec) {
    if (timeDec >= 12 && timeDec < 17) return 0.70 + (timeDec - 12) * 0.04;
    if (timeDec >= 17 && timeDec < 21) return 0.92;
    if (timeDec >= 21 && timeDec < 23) return 0.60;
    if (timeDec >= 9 && timeDec < 12) return 0.60;
    return 0.3;
  },

  // 현재 시각 기준 추천 동선 스케줄 동적 계산
  getDynamicRoutes(now = new Date()) {
    const curHour = now.getHours();
    const curMin = now.getMinutes();

    const formatTime = (addMin) => {
      const d = new Date(now.getTime() + addMin * 60000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return [
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
          { order: 1, time: formatTime(10), place: "천안삼거리공원 제2임시주차장", desc: "대기 없이 3분 내 여유로운 주차 완료", lat: 36.7898, lng: 127.1660 },
          { order: 2, time: formatTime(40), place: "능소호수 잔디광장 & 전통극장", desc: "명인명무 전통춤 관람 및 호수 피크닉 (잔디 쉼터 완비)", lat: 36.7880, lng: 127.1702 },
          { order: 3, time: formatTime(140), place: "남산중앙시장 전통 먹거리골목", desc: "순환 셔틀로 7분 이동, 천안 호두과자 & 칼국수 맛집 투어 (10% 할인 쿠폰)", lat: 36.8020, lng: 127.1530 }
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
          { order: 1, time: formatTime(15), place: "천안역 동부광장 & 명동 패션거리", desc: "청년 창업몰 플리마켓 구경 및 감성 카페 디저트 투어", lat: 36.8090, lng: 127.1475 },
          { order: 2, time: formatTime(90), place: "흥타령 셔틀 탑승 (동남권 직통)", desc: "지정 셔틀로 혼잡 정체 없이 삼거리공원 청년문화광장 이동", lat: 36.8090, lng: 127.1475 },
          { order: 3, time: formatTime(130), place: "삼거리공원 스트릿댄스 & DJ 버스킹", desc: "국제 댄서들과 함께하는 프리스타일 댄스 배틀 및 일몰 야경 감상", lat: 36.7885, lng: 127.1698 }
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
          { order: 1, time: formatTime(10), place: "종합운동장 흥타령극장", desc: "피크 시작 전 무용경연 관람 (혼잡 시작 전 이동 권고)", lat: 36.8227, lng: 127.1192 },
          { order: 2, time: formatTime(105), place: "남부대로 우회축 이동 (차량 15분)", desc: "AI FLOW 권고 우회도로를 통해 극심 정체 없이 동남권 이동", lat: 36.7865, lng: 127.1440 },
          { order: 3, time: formatTime(150), place: "삼거리공원 야간 댄스파티 & 천안맛집", desc: "여유로운 저녁 식사 후 능소호수 드론 라이트쇼 감상", lat: 36.7885, lng: 127.1698 }
        ],
        commerceBenefit: "동남권 지정 음식점 메밀막국수/석갈비 1인 2,000원 할인"
      }
    ];
  },

  // 시정 운영자 의사결정 시나리오
  operatorScenarios: [
    {
      id: "OP-ALERT-01",
      level: "warning",
      detectedTime: "14:25:10",
      title: "서북권 종합운동장 진입로 (번영로) 용량 88% 초과 임계점 도달",
      evidence: "ITS 검지기 2,410대/h 유입 중, 진입 대기시간 35분 급증 감지",
      action: "남부대로 우회 권고 및 삼거리공원 무료 임시주차장 분산 메시지 발송",
      expectedEffect: "서북권 부하 -14pt, 동남권 유입 +18% 전환"
    },
    {
      id: "OP-ALERT-02",
      level: "commerce",
      detectedTime: "14:18:40",
      title: "원도심 명동거리 & 남산중앙시장 유동인구 회복 유도",
      evidence: "메인무대 집중률 72% 대비 원도심 방문객 -35% 편중 발생",
      action: "천안사랑카드 10% 추가 캐시백 및 지정 셔틀 정류장 알림 푸시",
      expectedEffect: "원도심 상권 매출 +22% 견인, 대기시간 분산"
    },
    {
      id: "OP-ALERT-03",
      level: "info",
      detectedTime: "13:50:00",
      title: "삼거리공원 제2임시주차장 1,000면 여유 공간 확보 완료",
      evidence: "셔틀 순환 주기 10분 정상 유지, 정체 없이 진입 가능",
      action: "네이버/카카오 길안내 거점을 삼거리공원으로 변경 유도",
      expectedEffect: "초기 분산 유입률 28% 상승"
    }
  ]
};

// 실시간 내비게이션 딥링크 유틸리티 (출발지: 현재 내 위치 자동 연동)
const NavigationUtils = {
  getCurrentUserPos() {
    if (window.flowMap && window.flowMap.userLocation) {
      return window.flowMap.userLocation;
    }
    return { lat: 36.8090, lng: 127.1475, name: "천안역" };
  },

  // 카카오맵 길찾기 URL: 카카오 공식 link/to 포맷 (도착지 명칭 & 좌표 정확히 파싱)
  getKakaoMapUrl(destLat, destLng, destName) {
    const encDest = encodeURIComponent(destName);
    return `https://map.kakao.com/link/to/${encDest},${destLat},${destLng}`;
  },

  // 네이버 지도 길찾기 URL: 출발지(내 현재 위치) ➔ 도착지 둘 다 100% 자동 완성 및 경로 계산
  getNaverMapUrl(destLat, destLng, destName, customStart = null) {
    const start = customStart || this.getCurrentUserPos();
    const encodedDest = encodeURIComponent(destName);
    const encodedStart = encodeURIComponent(start.name || "내 현재 위치");
    return `https://map.naver.com/v5/directions/${start.lng},${start.lat},${encodedStart}/${destLng},${destLat},${encodedDest}/-/car`;
  },

  // 카카오 내비게이션 모바일 앱/웹 자동 분기
  openKakaoNavi(destLat, destLng, destName, customStart = null) {
    const start = customStart || this.getCurrentUserPos();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // 스마트폰에서는 카카오맵 앱 스킴으로 출발지와 도착지를 모두 전달하여 자동 길찾기
      const appUrl = `kakaomap://route?sp=${start.lat},${start.lng}&ep=${destLat},${destLng}&by=CAR`;
      window.location.href = appUrl;
      setTimeout(() => {
        window.open(this.getKakaoMapUrl(destLat, destLng, destName), "_blank");
      }, 1200);
    } else {
      // PC 웹 브라우저에서는 네이버 지도로 열면 출발지와 도착지가 100% 자동 완성되어 경로가 즉시 표시됨
      // 사용자 편의를 위해 카카오 공식 link/to를 열거나 네이버 자동완성을 지원
      window.open(this.getNaverMapUrl(destLat, destLng, destName, start), "_blank");
    }
  },

  getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return +(R * c).toFixed(1);
  }
};

if (typeof window !== "undefined") {
  window.FESTIVAL_DATA = FESTIVAL_DATA;
  window.NavigationUtils = NavigationUtils;
}
