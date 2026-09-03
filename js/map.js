/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 지도 인터랙션 및 교차로 부하 시각화 모듈 (Leaflet.js)
 */

class FlowMapController {
  constructor() {
    this.map = null;
    this.currentMode = "now"; // "now" | "pred30" | "pred60"
    this.markers = {
      venues: [],
      intersections: [],
      shuttle: null
    };
    this.shuttleRouteLine = null;
    this.shuttleIndex = 0;
    this.shuttleTimer = null;
  }

  init() {
    const mapElement = document.getElementById("leaflet-map");
    if (!mapElement) return;

    // 천안 중심 좌표 (종합운동장과 삼거리공원의 중간 지점)
    const centerLat = 36.8050;
    const centerLng = 127.1450;

    this.map = L.map("leaflet-map", {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // 기본 타일 레이어 (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      minZoom: 11
    }).addTo(this.map);

    // 줌 컨트롤 우측 하단 배치
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    this.renderVenues();
    this.renderShuttleRoute();
    this.renderIntersections();
    this.startShuttleAnimation();
    this.bindEvents();
  }

  // 1. 행사장 양대 거점 핀 렌더링
  renderVenues() {
    const { venues } = window.FESTIVAL_DATA;

    // 종합운동장 마커
    const stadium = venues.stadium;
    const stadiumIcon = L.divIcon({
      className: "custom-venue-icon",
      html: `
        <div class="venue-marker">
          <div class="venue-marker-pin stadium">
            <span>🏟️</span> ${stadium.name}
          </div>
        </div>
      `,
      iconSize: [120, 30],
      iconAnchor: [60, 15]
    });

    const stadiumMarker = L.marker([stadium.lat, stadium.lng], { icon: stadiumIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-inner-card">
          <div class="popup-title">
            <span>🏟️ ${stadium.name}</span>
            <span style="color: #ff3366; font-size:11px; font-weight:800;">서북권 중심</span>
          </div>
          <div class="popup-metric">현재 접근 부하: <strong>${stadium.currentLoad}</strong> (혼잡)</div>
          <div class="popup-metric">주차 포화율: <strong>${stadium.parkingStatus.estimatedOccupancyRate}%</strong> (${stadium.parkingStatus.statusText})</div>
          <div class="popup-recommend">🚨 30분 뒤 극심 혼잡 예상. 삼거리공원 분산 권장</div>
        </div>
      `);
    this.markers.venues.push(stadiumMarker);

    // 삼거리공원 마커
    const samgeori = venues.samgeori;
    const samgeoriIcon = L.divIcon({
      className: "custom-venue-icon",
      html: `
        <div class="venue-marker">
          <div class="venue-marker-pin samgeori">
            <span>🌳</span> ${samgeori.name}
          </div>
        </div>
      `,
      iconSize: [120, 30],
      iconAnchor: [60, 15]
    });

    const samgeoriMarker = L.marker([samgeori.lat, samgeori.lng], { icon: samgeoriIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-inner-card">
          <div class="popup-title">
            <span>🌳 ${samgeori.name}</span>
            <span style="color: #00e676; font-size:11px; font-weight:800;">동남권 분산 거점</span>
          </div>
          <div class="popup-metric">현재 접근 부하: <strong>${samgeori.currentLoad}</strong> (쾌적)</div>
          <div class="popup-metric">주차 포화율: <strong>${samgeori.parkingStatus.estimatedOccupancyRate}%</strong> (${samgeori.parkingStatus.statusText})</div>
          <div class="popup-recommend" style="background: rgba(0, 230, 118, 0.15); color: #00e676;">
            ✨ 대기 없는 주차 + 전통춤 경연 & 남산시장 혜택 코스
          </div>
        </div>
      `);
    this.markers.venues.push(samgeoriMarker);
  }

  // 2. 8개 주요 교차로 노드 렌더링
  renderIntersections() {
    const { intersections } = window.FESTIVAL_DATA;

    // 기존 교차로 마커 제거
    this.markers.intersections.forEach(m => this.map.removeLayer(m));
    this.markers.intersections = [];

    intersections.forEach(item => {
      let loadValue = item.current;
      if (this.currentMode === "pred30") loadValue = item.pred30;
      if (this.currentMode === "pred60") loadValue = item.pred60;

      let levelClass = "smooth";
      if (loadValue >= 70) levelClass = "heavy";
      else if (loadValue >= 50) levelClass = "slow";

      const nodeIcon = L.divIcon({
        className: "custom-node-icon",
        html: `
          <div class="load-node-marker">
            <div class="node-circle ${levelClass}">${loadValue}</div>
            <div class="node-pulse"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([item.lat, item.lng], { icon: nodeIcon })
        .addTo(this.map)
        .bindPopup(`
          <div class="popup-inner-card">
            <div class="popup-title">
              <span>🚦 ${item.name}</span>
              <span class="card-badge ${levelClass === 'heavy' ? 'live' : levelClass === 'slow' ? 'warning' : 'success'}">${item.status}</span>
            </div>
            <div class="popup-metric">소속 권역: <strong>${item.zone}</strong></div>
            <div class="popup-metric">접근 부하 지수: <strong>${loadValue} / 100</strong></div>
            <div class="popup-metric">통과 통행량: <strong>${item.throughput}</strong></div>
            <div class="popup-recommend">${item.recommendation}</div>
            <div style="font-size:10px; color:#777; margin-top:6px;">* 교차로 차량 통과량 기반 상대 지표 (행사장 인원수 아님)</div>
          </div>
        `);

      this.markers.intersections.push(marker);
    });
  }

  // 3. 서북-동남 순환 셔틀 노선 폴리라인
  renderShuttleRoute() {
    const { shuttleRoute } = window.FESTIVAL_DATA;
    const latlngs = shuttleRoute.stops.map(s => [s.lat, s.lng]);

    // 노선 라인 그리기
    this.shuttleRouteLine = L.polyline(latlngs, {
      color: "#ffab00",
      weight: 4,
      opacity: 0.8,
      dashArray: "8, 6"
    }).addTo(this.map);

    // 셔틀 마커 초기 위치
    const shuttleIcon = L.divIcon({
      className: "custom-shuttle-icon",
      html: `<div class="shuttle-marker">🚌</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    this.markers.shuttle = L.marker(latlngs[0], { icon: shuttleIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-inner-card">
          <div class="popup-title">🚌 흥타령 AI 안심 순환 셔틀</div>
          <div class="popup-metric">배차 간격: <strong>${shuttleRoute.interval}</strong></div>
          <div class="popup-recommend">서북(종합운동장) ↔ 동남(삼거리공원·중앙시장) 급행 운행</div>
        </div>
      `);
  }

  // 셔틀버스 실시간 이동 애니메이션 시뮬레이션
  startShuttleAnimation() {
    const { shuttleRoute } = window.FESTIVAL_DATA;
    const stops = shuttleRoute.stops;

    if (this.shuttleTimer) clearInterval(this.shuttleTimer);

    this.shuttleTimer = setInterval(() => {
      this.shuttleIndex = (this.shuttleIndex + 1) % stops.length;
      const targetStop = stops[this.shuttleIndex];
      if (this.markers.shuttle) {
        this.markers.shuttle.setLatLng([targetStop.lat, targetStop.lng]);
      }
    }, 3500);
  }

  // 시간 모드 변경 (현재 / 30분 뒤 / 60분 뒤)
  setTimeMode(mode) {
    this.currentMode = mode;
    this.renderIntersections();
    
    // UI 텍스트 및 카드 동기화
    this.updateLoadSummaryCards(mode);
  }

  updateLoadSummaryCards(mode) {
    const { venues } = window.FESTIVAL_DATA;
    const stadiumVal = mode === "now" ? venues.stadium.currentLoad : mode === "pred30" ? venues.stadium.predictedLoad30 : venues.stadium.predictedLoad60;
    const samgeoriVal = mode === "now" ? venues.samgeori.currentLoad : mode === "pred30" ? venues.samgeori.predictedLoad30 : venues.samgeori.predictedLoad60;

    const mapStadiumEl = document.getElementById("map-stadium-load");
    const mapSamgeoriEl = document.getElementById("map-samgeori-load");
    if (mapStadiumEl) mapStadiumEl.innerText = stadiumVal;
    if (mapSamgeoriEl) mapSamgeoriEl.innerText = samgeoriVal;
  }

  bindEvents() {
    // 세그먼트 버튼 클릭 이벤트 바인딩
    const segmentBtns = document.querySelectorAll(".map-time-btn");
    segmentBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        segmentBtns.forEach(b => b.classList.remove("active"));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add("active");
        const mode = targetBtn.dataset.mode;
        this.setTimeMode(mode);

        if (window.showToast) {
          const modeNames = { now: "실시간 현재", pred30: "30분 뒤 예측", pred60: "60분 뒤 예측" };
          window.showToast(`📊 ${modeNames[mode]} 부하 데이터로 갱신되었습니다.`);
        }
      });
    });

    // 재정렬 및 천안 전역 줌 리셋 버튼
    const resetBtn = document.getElementById("map-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.map.setView([36.8050, 127.1450], 13);
      });
    }
  }

  // 탭 전환 시 Leaflet 맵 크기 재계산 (화면 깨짐 방지 필수)
  invalidateSize() {
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    }
  }
}

// 싱글톤 인스턴스 생성
window.flowMap = new FlowMapController();
