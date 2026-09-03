# 천안 J3D LAB - 흥타령 AI FLOW 💃🚍
> **2026 천안시 AI·데이터 기반 정책 아이디어 경진대회 (지정과제 03: 지역균형발전)**  
> **"종합운동장에 몰리는 차량 흐름을 읽고, 삼거리공원과 동남권 상권으로 나누는 지능형 교통·관광 운영 모바일 웹앱"**

![흥타령 AI FLOW](https://img.shields.io/badge/천안흥타령춤축제-2026-6366f1?style=for-the-badge)
![WAPE 오차 9.29%](https://img.shields.io/badge/AI%20모델%20WAPE-9.29%25-10b981?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-0ea5e9?style=for-the-badge)

---

## 📌 프로젝트 소개 (Why Heungtaryeong AI FLOW?)

천안흥타령춤축제는 연간 89.2만 명의 시민과 관광객이 방문하는 대한민국 대표 축제입니다. 하지만 축제 기간 중 **서북권 천안종합운동장 진입로와 주차장에 극심한 차량 정체**가 발생하는 반면, 분산 거점인 **동남권 천안삼거리공원 및 원도심 상권(남산중앙시장, 명동거리)으로의 연결 흐름은 부족**했습니다.

**흥타령 AI FLOW**는 단순한 축제 안내 앱이 아닙니다:
1. **몰림 감지**: 천안시 교차로 교통량 실데이터(17.4만 행)를 기반으로 **30분·60분 뒤 접근 부하**를 예측합니다. (WAPE 9.29% 고신뢰 기준선 모델)
2. **선택지 제시**: 덜 붐비는 시간과 대안 동선(삼거리공원 무대, 호수 피크닉, 로컬 맛집)을 시민 맞춤형으로 안내합니다.
3. **전환 기록 & 의사결정**: 시민의 경로 전환을 데이터로 집계하고, 시정 운영자(City Operator)가 AI 권고 시나리오를 검토 후 현장 채널(VMS, 푸시 알림)에 반영하는 **Human-in-the-loop 체계**를 구현합니다.

---

## 📱 4대 핵심 화면 및 기능

1. **홈·상황 (Live Status)**
   - 실시간 날씨, 축제 D-Day 및 양대 행사장 접근 부하 비교 (종합운동장 vs 삼거리공원)
   - 지금 추천하는 '덜 붐비는 스마트 분산 동선' 및 퀵 바로가기
   - 기획서 Page 11의 Data Trust 원칙 준수 안내

2. **지도·부하 (Traffic & Load Map)**
   - Leaflet 기반 인터랙티브 지도 (종합운동장, 삼거리공원, 주요 8개 교차로 노드)
   - `실시간 현재` / `+30분 뒤 예측` / `+60분 뒤 예측` 타임 슬라이더 컨트롤
   - 서북 ↔ 동남 순환 급행 안심 셔틀 노선 및 실시간 위치 애니메이션

3. **스마트 분산 동선 (Recommended Routes)**
   - 가족 힐링(가족 방문객 61.8% 취향 저격), 청년 스트릿 댄스, 시간차 메인무대 공략 등 3대 테마 코스
   - '동선 안내 시작' 모바일 바텀시트 및 통합 모바일 바코드 시뮬레이터

4. **상권 혜택 & 시정 운영자 대시보드 (City Operator Mode)**
   - 남산중앙시장, 학화호두과자, 감성 카페 등 동남권 상권 쿠폰 및 천안사랑카드 10% 캐시백 연계
   - 01 관측 ❯ 02 비교 ❯ 03 검토 ❯ 04 현장 실행의 4단계 의사결정 패널
   - AI 권고 시나리오 승인 시 시민 화면 상단 라이브 티커로 즉시 브로드캐스팅

---

## 🛠️ 기술 스택

- **Frontend**: HTML5, Vanilla CSS3 (Clean Modern Light Theme, Pretendard 웹폰트), Modern JavaScript (ES6+)
- **Map Engine**: Leaflet.js (OpenStreetMap)
- **Deployment**: GitHub Pages, Cloudflare Tunnel

---

## 🚀 로컬 실행 방법

1. 저장소를 클론합니다:
   ```bash
   git clone https://github.com/latemo/heungtaryeong-ai-flow.git
   cd heungtaryeong-ai-flow
   ```
2. Windows 환경에서는 `실행하기.cmd` 파일을 더블클릭하면 브라우저에서 즉시 실행됩니다.
3. 또는 로컬 웹 서버 구동:
   ```bash
   python -m http.server 8080
   # 브라우저에서 http://localhost:8080 접속
   ```

---

## 👥 제작
- **소속**: 천안 J3D LAB
- **과제**: 2026 천안시 AI·데이터 기반 정책 아이디어 경진대회 지정과제 03 (지역균형발전)
