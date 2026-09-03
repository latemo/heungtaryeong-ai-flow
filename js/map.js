/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 실시간 GPS 연동 & 시설물(화장실/부스/주차장) 인터랙티브 지도 모듈 (Leaflet.js)
 */

class FlowMapController {
  constructor() {
    this.map = null;
    this.currentMode = "now"; // "now" | "pred30" | "pred60"
    this.activeFilter = "traffic"; // "traffic" | "toilets" | "parkings" | "booths"
    
    this.userLocation = {
      lat: 36.8090, // 기본값: 천안역
      lng: 127.1475,
      name: "천안역 (기본 위치)",
      isLiveGps: false
    };

    this.markers = {
      user: null,
      venues: [],
      intersections: [],
      toilets: [],
      parkings: [],
      booths: [],
      shuttle: null
    };
    this.shuttleRouteLine = null;
    this.shuttleIndex = 0;
    this.shuttleTimer = null;
  }

  init() {
    const mapElement = document.getElementById("leaflet-map");
    if (!mapElement) return;

    // 천안 중심 좌표
    const centerLat = 36.8050;
    const centerLng = 127.1450;

    this.map = L.map("leaflet-map", {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // 기본 OpenStreetMap 타일 레이어
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      minZoom: 11
    }).addTo(this.map);

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    this.renderVenues();
    this.renderShuttleRoute();
    this.renderIntersections();
    this.renderFacilityMarkers();
    this.startShuttleAnimation();
    this.requestUserGps();
    this.bindEvents();
  }

  // 1. 실제 스마트폰 GPS 위치 획득
  requestUserGps() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: "내 현재 위치 (실시간 GPS)",
            isLiveGps: true
          };
          this.updateUserMarker();
          this.calculateDistances();
          if (window.showToast) {
            window.showToast("📍 실제 GPS 위치가 감지되어 지도에 연결되었습니다.");
          }
        },
        (err) => {
          console.log("GPS 권한 거부 또는 사용 불가:", err.message);
          this.updateUserMarker();
          this.calculateDistances();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      this.updateUserMarker();
      this.calculateDistances();
    }
  }

  // 모의 위치 수동 변경 (천안역, 아산역, 종합터미널)
  setMockLocation(mockType) {
    const presets = {
      station: { lat: 36.8090, lng: 127.1475, name: "천안역 동부광장" },
      terminal: { lat: 36.8198, lng: 127.1565, name: "천안종합고속터미널" },
      asan: { lat: 36.7938, lng: 127.1042, name: "KTX 천안아산역" }
    };

    if (presets[mockType]) {
      this.userLocation = {
        ...presets[mockType],
        isLiveGps: false
      };
      this.updateUserMarker();
      this.calculateDistances();
      if (this.map) {
        this.map.setView([this.userLocation.lat, this.userLocation.lng], 14);
      }
      if (window.showToast) {
        window.showToast(`📍 위치가 [${presets[mockType].name}]으로 설정되었습니다.`);
      }
    }
  }

  // 내 위치 마커 렌더링
  updateUserMarker() {
    if (!this.map) return;
    if (this.markers.user) {
      this.map.removeLayer(this.markers.user);
    }

    const userIcon = L.divIcon({
      className: "custom-user-pin",
      html: `
        <div style="position:relative; display:flex; align-items:center; justify-content:center;">
          <div style="width:20px; height:20px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 0 10px rgba(37,99,235,0.8); z-index:2;"></div>
          <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(37,99,235,0.25); animation:pulse-user 2s infinite; z-index:1;"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    this.markers.user = L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-inner-card">
          <div class="popup-title">
            <span>📍 ${this.userLocation.name}</span>
            <span class="card-badge ai">${this.userLocation.isLiveGps ? '실시간 GPS' : '기준 위치'}</span>
          </div>
          <div class="popup-metric">현재 위치 기반 양대 행사장 거리 분석 중</div>
        </div>
      `);
  }

  // 내 위치에서 양대 거점까지의 거리 & 소요시간 실시간 계산
  calculateDistances() {
    const { venues } = window.FESTIVAL_DATA;
    const distToStadium = window.NavigationUtils.getDistanceKm(
      this.userLocation.lat, this.userLocation.lng,
      venues.stadium.lat, venues.stadium.lng
    );
    const distToSamgeori = window.NavigationUtils.getDistanceKm(
      this.userLocation.lat, this.userLocation.lng,
      venues.samgeori.lat, venues.samgeori.lng
    );

    // 자가용 및 셔틀 예상 소요시간 (도심 평균 25km/h 가정)
    const timeToStadiumMin = Math.round(distToStadium / 25 * 60) + 10; // 주차 대기 10분 추가
    const timeToSamgeoriMin = Math.round(distToSamgeori / 25 * 60) + 2;

    // UI 엘리먼트 갱신
    const stadiumDistEl = document.getElementById("dist-to-stadium");
    const samgeoriDistEl = document.getElementById("dist-to-samgeori");
    if (stadiumDistEl) stadiumDistEl.innerText = `${distToStadium}km (약 ${timeToStadiumMin}분 소요)`;
    if (samgeoriDistEl) samgeoriDistEl.innerText = `${distToSamgeori}km (약 ${timeToSamgeoriMin}분 소요)`;

    const userLocNameEl = document.getElementById("gps-current-location-text");
    if (userLocNameEl) userLocNameEl.innerText = this.userLocation.name;
  }

  // 2. 행사장 양대 거점 핀 렌더링
  renderVenues() {
    const { venues } = window.FESTIVAL_DATA;

    // 종합운동장
    const stadium = venues.stadium;
    const stadiumKakaoUrl = window.NavigationUtils.getKakaoMapUrl(stadium.lat, stadium.lng, stadium.name);
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
            <span style="color:#e11d48; font-size:11px; font-weight:800;">서북권 중심</span>
          </div>
          <div class="popup-metric">현재 접근 부하: <strong>${stadium.currentLoad}</strong> (혼잡)</div>
          <div class="popup-metric">주차 포화율: <strong>${stadium.parkingStatus.estimatedOccupancyRate}%</strong></div>
          <div class="popup-recommend" style="background:#fee2e2; color:#991b1b; border:1px solid #fca5a5;">
            ⚠️ 30분 뒤 극심 혼잡 예상. 삼거리공원 분산 권장
          </div>
          <div style="margin-top:10px;">
            <a href="${stadiumKakaoUrl}" target="_blank" style="display:block; text-align:center; background:#fee500; color:#191919; font-size:11.5px; font-weight:800; padding:7px; border-radius:6px; text-decoration:none;">
              💛 카카오맵 길찾기 시작 ➔
            </a>
          </div>
        </div>
      `);
    this.markers.venues.push(stadiumMarker);

    // 삼거리공원
    const samgeori = venues.samgeori;
    const samgeoriKakaoUrl = window.NavigationUtils.getKakaoMapUrl(samgeori.lat, samgeori.lng, samgeori.name);
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
            <span style="color:#059669; font-size:11px; font-weight:800;">동남권 분산 거점</span>
          </div>
          <div class="popup-metric">현재 접근 부하: <strong>${samgeori.currentLoad}</strong> (쾌적)</div>
          <div class="popup-metric">주차 포화율: <strong>${samgeori.parkingStatus.estimatedOccupancyRate}%</strong></div>
          <div class="popup-recommend" style="background:#dcfce7; color:#166534; border:1px solid #86efac;">
            ✨ 대기 없는 즉시 주차 + 전통춤 경연 & 남산시장 혜택 코스
          </div>
          <div style="margin-top:10px;">
            <a href="${samgeoriKakaoUrl}" target="_blank" style="display:block; text-align:center; background:#fee500; color:#191919; font-size:11.5px; font-weight:800; padding:7px; border-radius:6px; text-decoration:none;">
              💛 카카오맵 길찾기 시작 ➔
            </a>
          </div>
        </div>
      `);
    this.markers.venues.push(samgeoriMarker);
  }

  // 3. 교차로 부하 마커 렌더링
  renderIntersections() {
    if (!this.map) return;
    const intersections = this.liveIntersections || window.FESTIVAL_DATA.calculateRealtimeTraffic(new Date()).intersections;
    this.markers.intersections.forEach(m => this.map.removeLayer(m));
    this.markers.intersections = [];

    if (this.activeFilter !== "traffic") return; // 교통 필터가 아닐 때는 숨김

    intersections.forEach(item => {
      let loadValue = item.current;
      if (this.currentMode === "pred30") loadValue = item.pred30;
      if (this.currentMode === "pred60") loadValue = item.pred60;

      let levelClass = "smooth";
      if (loadValue >= 70) levelClass = "heavy";
      else if (loadValue >= 50) levelClass = "slow";

      const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(item.lat, item.lng, item.name);

      const nodeIcon = L.divIcon({
        className: "custom-node-icon",
        html: `
          <div class="load-node-marker">
            <div class="node-circle ${levelClass}">${loadValue}</div>
            <div class="node-pulse"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
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
            <div class="popup-metric">시간당 통과량: <strong>${item.throughput}</strong></div>
            <div class="popup-recommend">${item.recommendation}</div>
            <div style="margin-top:8px;">
              <a href="${kakaoUrl}" target="_blank" style="display:block; text-align:center; background:#f1f5f9; color:#2563eb; font-size:11px; font-weight:700; padding:5px; border-radius:6px; text-decoration:none;">
                카카오맵으로 교차로 길찾기 ➔
              </a>
            </div>
          </div>
        `);

      this.markers.intersections.push(marker);
    });
  }

  // 4. 기획서 기반 축제 시설물 마커 렌더링 (화장실, 부스, 주차장)
  renderFacilityMarkers() {
    if (!this.map) return;
    const { toilets, booths, parkings } = window.FESTIVAL_DATA;

    // 기존 시설물 마커 초기화
    [...this.markers.toilets, ...this.markers.booths, ...this.markers.parkings].forEach(m => this.map.removeLayer(m));
    this.markers.toilets = [];
    this.markers.booths = [];
    this.markers.parkings = [];

    // 화장실 154개소 레이어
    if (this.activeFilter === "toilets") {
      toilets.forEach(t => {
        const icon = L.divIcon({
          className: "facility-icon",
          html: `<div style="background:#0284c7; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.25); font-size:13px;">🚻</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(t.lat, t.lng, t.name);
        const m = L.marker([t.lat, t.lng], { icon })
          .addTo(this.map)
          .bindPopup(`
            <div class="popup-inner-card">
              <div class="popup-title"><span>🚻 ${t.name}</span></div>
              <div class="popup-metric">편의: ${t.handicap ? '휠체어 경사로 ✓ ' : ''}${t.babyCare ? '기저귀 교환대 ✓' : ''}</div>
              <div style="margin-top:8px;"><a href="${kakaoUrl}" target="_blank" style="display:block; text-align:center; background:#f0f9ff; color:#0284c7; font-size:11px; font-weight:700; padding:6px; border-radius:6px; text-decoration:none;">가장 빠른 도보 길찾기 ➔</a></div>
            </div>
          `);
        this.markers.toilets.push(m);
      });
    }

    // 주차장 레이어
    if (this.activeFilter === "parkings") {
      parkings.forEach(p => {
        const icon = L.divIcon({
          className: "facility-icon",
          html: `<div style="background:#ea580c; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.25); font-size:13px; font-weight:800;">🅿️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(p.lat, p.lng, p.name);
        const m = L.marker([p.lat, p.lng], { icon })
          .addTo(this.map)
          .bindPopup(`
            <div class="popup-inner-card">
              <div class="popup-title"><span>🅿️ ${p.name}</span></div>
              <div class="popup-metric">총 주차면수: <strong>${p.capacity}</strong> (${p.fee})</div>
              <div class="popup-metric">현재 포화율: <strong>${p.rate}%</strong></div>
              <div style="margin-top:8px;"><a href="${kakaoUrl}" target="_blank" style="display:block; text-align:center; background:#fff7ed; color:#ea580c; font-size:11px; font-weight:700; padding:6px; border-radius:6px; text-decoration:none;">주차장 내비게이션 시작 ➔</a></div>
            </div>
          `);
        this.markers.parkings.push(m);
      });
    }

    // 공식 부스 81개소 레이어
    if (this.activeFilter === "booths") {
      booths.forEach(b => {
        const icon = L.divIcon({
          className: "facility-icon",
          html: `<div style="background:#7c3aed; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.25); font-size:13px;">🎪</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(b.lat, b.lng, b.name);
        const m = L.marker([b.lat, b.lng], { icon })
          .addTo(this.map)
          .bindPopup(`
            <div class="popup-inner-card">
              <div class="popup-title"><span>🎪 ${b.name}</span></div>
              <div class="popup-metric">분류: <strong>${b.category}</strong></div>
              <div class="popup-metric">${b.desc}</div>
              <div style="margin-top:8px;"><a href="${kakaoUrl}" target="_blank" style="display:block; text-align:center; background:#f5f3ff; color:#7c3aed; font-size:11px; font-weight:700; padding:6px; border-radius:6px; text-decoration:none;">부스 위치 길찾기 ➔</a></div>
            </div>
          `);
        this.markers.booths.push(m);
      });
    }
  }

  // 시설물 필터 전환
  setFacilityFilter(filterType) {
    this.activeFilter = filterType;
    this.renderIntersections();
    this.renderFacilityMarkers();

    const filterNames = {
      traffic: "교차로 접근 부하",
      toilets: "안심 화장실 154개소",
      parkings: "임시 주차장 & 셔틀",
      booths: "공식 체험/푸드 부스"
    };

    if (window.showToast) {
      window.showToast(`🗺️ 지도 레이어가 [${filterNames[filterType]}]로 변경되었습니다.`);
    }
  }

  // 5. 순환 셔틀 노선
  renderShuttleRoute() {
    const { shuttleRoute } = window.FESTIVAL_DATA;
    const latlngs = shuttleRoute.stops.map(s => [s.lat, s.lng]);

    this.shuttleRouteLine = L.polyline(latlngs, {
      color: "#f59e0b",
      weight: 4,
      opacity: 0.85,
      dashArray: "8, 6"
    }).addTo(this.map);

    const shuttleIcon = L.divIcon({
      className: "custom-shuttle-icon",
      html: `<div class="shuttle-marker">🚍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    this.markers.shuttle = L.marker(latlngs[0], { icon: shuttleIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-inner-card">
          <div class="popup-title">🚍 흥타령 AI 안심 순환 셔틀</div>
          <div class="popup-metric">배차 간격: <strong>${shuttleRoute.intervalMin}분</strong> (8대 순환 운행)</div>
          <div class="popup-recommend">서북(종합운동장) ↔ 동남(삼거리공원·중앙시장) 급행</div>
        </div>
      `);
  }

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

  updateDynamicIntersections(liveAnalysis) {
    if (!liveAnalysis) return;
    this.liveIntersections = liveAnalysis.intersections;
    this.liveAnalysis = liveAnalysis;
    this.renderIntersections();
    this.updateLoadSummaryCards(this.currentMode);
  }

  setTimeMode(mode) {
    this.currentMode = mode;
    this.renderIntersections();
    this.updateLoadSummaryCards(mode);
  }

  updateLoadSummaryCards(mode) {
    if (!this.liveAnalysis) {
      this.liveAnalysis = window.FESTIVAL_DATA.calculateRealtimeTraffic(new Date());
    }
    const st = this.liveAnalysis.stadium;
    const sg = this.liveAnalysis.samgeori;
    const stadiumVal = mode === "now" ? st.currentLoad : mode === "pred30" ? st.pred30 : st.pred60;
    const samgeoriVal = mode === "now" ? sg.currentLoad : mode === "pred30" ? sg.pred30 : sg.pred60;

    const mapStadiumEl = document.getElementById("map-stadium-load");
    const mapSamgeoriEl = document.getElementById("map-samgeori-load");
    if (mapStadiumEl) mapStadiumEl.innerText = stadiumVal;
    if (mapSamgeoriEl) mapSamgeoriEl.innerText = samgeoriVal;
  }

  bindEvents() {
    // 세그먼트 시간 버튼
    document.querySelectorAll(".map-time-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".map-time-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.setTimeMode(e.currentTarget.dataset.mode);
      });
    });

    // 시설물 레이어 필터 칩 클릭
    document.querySelectorAll(".map-filter-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        document.querySelectorAll(".map-filter-chip").forEach(c => c.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.setFacilityFilter(e.currentTarget.dataset.filter);
      });
    });

    // 줌 리셋
    document.getElementById("map-reset-btn")?.addEventListener("click", () => {
      this.map.setView([36.8050, 127.1450], 13);
    });

    // 내 위치로 지도 중심 이동 버튼
    document.getElementById("map-my-location-btn")?.addEventListener("click", () => {
      if (this.map) {
        this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
        if (this.markers.user) this.markers.user.openPopup();
      }
    });

    // 모의 위치 셀렉트 변경
    document.getElementById("mock-location-select")?.addEventListener("change", (e) => {
      this.setMockLocation(e.target.value);
    });
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 100);
    }
  }
}

window.flowMap = new FlowMapController();
