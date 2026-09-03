/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 실시간 시간 동기화(Live Time Synchronizer) & 통합 앱 컨트롤러
 */

let g_currentLiveDate = new Date(); // 실제 현재 시간
let g_liveTimeTimer = null;
let g_isLiveMode = true;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  startLiveClockEngine();
  bindNavigation();
  bindGlobalControls();
  bindTimeWarpChips();

  // 하위 모듈 초기화
  if (window.flowMap) window.flowMap.init();
  if (window.routesController) window.routesController.init();
  if (window.operatorController) window.operatorController.init();
  if (window.shuttleBis) window.shuttleBis.init();
  if (window.programSearch) window.programSearch.init();

  // 초기 브리핑 토스트
  setTimeout(() => {
    showToast("⚡ 현재 시각 기준 실시간 AI 교통·주차 분석 가동 중");
  }, 600);
}

// 1. 실제 시간 기준 매 초 실시간 동적 분석 엔진 (Live Clock Engine)
function startLiveClockEngine() {
  updateRealtimeAnalysis();

  if (g_liveTimeTimer) clearInterval(g_liveTimeTimer);
  g_liveTimeTimer = setInterval(() => {
    if (g_isLiveMode) {
      g_currentLiveDate = new Date();
      updateRealtimeAnalysis();
    }
  }, 1000);
}

function bindTimeWarpChips() {
  document.querySelectorAll(".time-warp-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      document.querySelectorAll(".time-warp-chip").forEach(c => {
        c.classList.remove("active");
        c.style.background = "#ffffff";
        c.style.color = "#475569";
        c.style.border = "1px solid #cbd5e1";
      });

      const target = e.currentTarget;
      target.classList.add("active");
      target.style.background = "#2563eb";
      target.style.color = "#ffffff";
      target.style.border = "none";

      const mode = target.dataset.mode;
      if (mode === "live") {
        g_isLiveMode = true;
        g_currentLiveDate = new Date();
        updateRealtimeAnalysis();
        showToast("⚡ 실제 현재 시각으로 실시간 동기화되었습니다.");
      } else if (mode === "peak-day") {
        g_isLiveMode = false;
        // 2026-09-25 14:30:00 (낮 피크)
        g_currentLiveDate = new Date(2026, 8, 25, 14, 30, 0);
        updateRealtimeAnalysis();
        showToast("☀️ 축제 3일차 한낮 피크(14:30) 시뮬레이션 적용됨");
      } else if (mode === "peak-night") {
        g_isLiveMode = false;
        // 2026-09-25 19:30:00 (야간 퍼레이드 피크)
        g_currentLiveDate = new Date(2026, 8, 25, 19, 30, 0);
        updateRealtimeAnalysis();
        showToast("🌙 축제 3일차 야간 퍼레이드 피크(19:30) 시뮬레이션 적용됨");
      }

      // 추천 동선 및 프로그램 타임테이블도 해당 시간 기준으로 재렌더링
      if (window.routesController && window.routesController.renderRoutes) {
        window.routesController.renderRoutes();
      }
      if (window.programSearch && window.programSearch.renderProgramsList) {
        window.programSearch.renderProgramsList();
      }
    });
  });
}

function updateRealtimeAnalysis() {
  const { FESTIVAL_DATA } = window;
  if (!FESTIVAL_DATA || !FESTIVAL_DATA.calculateRealtimeTraffic) return;

  // 현재 시각 기준 실시간 분석 데이터 동적 산출
  const liveAnalysis = FESTIVAL_DATA.calculateRealtimeTraffic(g_currentLiveDate);

  // 상단 시계 표출
  const dateEl = document.getElementById("festival-date-text");
  if (dateEl) {
    dateEl.innerText = `${liveAnalysis.dateString} ${liveAnalysis.timeString} (실시간)`;
  }

  // 1. 종합운동장(서북권) 실시간 반영
  const st = liveAnalysis.stadium;
  setElementText("home-stadium-load", st.currentLoad);
  setElementText("home-stadium-pred30", `${st.pred30}pt ⚠️`);
  setElementText("home-stadium-pred60", `${st.pred60}pt 🚨`);
  setElementText("home-stadium-wait-time", st.waitTimeText);
  setElementText("dist-to-stadium-wait", st.waitTimeText);

  const stBar = document.getElementById("home-stadium-bar");
  if (stBar) stBar.style.width = `${st.currentLoad}%`;

  const stTag = document.getElementById("home-stadium-status-tag");
  if (stTag) {
    stTag.className = `venue-status-tag ${st.level === 'danger' ? 'crowded' : st.level === 'warning' ? 'slow' : 'smooth'}`;
    stTag.innerText = `🅿️ ${st.waitTimeText}`;
  }

  // 2. 삼거리공원(동남권) 실시간 반영
  const sg = liveAnalysis.samgeori;
  setElementText("home-samgeori-load", sg.currentLoad);
  setElementText("home-samgeori-pred30", `${sg.pred30}pt 쾌적`);
  setElementText("home-samgeori-pred60", `${sg.pred60}pt 보통`);

  const sgBar = document.getElementById("home-samgeori-bar");
  if (sgBar) sgBar.style.width = `${sg.currentLoad}%`;

  // 3. 지도 탭 예측 버튼 시각 동적 라벨 (현재시각 +30분, +60분)
  const d30 = new Date(g_currentLiveDate.getTime() + 30 * 60000);
  const d60 = new Date(g_currentLiveDate.getTime() + 60 * 60000);
  const time30Str = `${String(d30.getHours()).padStart(2, '0')}:${String(d30.getMinutes()).padStart(2, '0')}`;
  const time60Str = `${String(d60.getHours()).padStart(2, '0')}:${String(d60.getMinutes()).padStart(2, '0')}`;

  const btn30 = document.getElementById("map-btn-pred30");
  const btn60 = document.getElementById("map-btn-pred60");
  if (btn30) btn30.innerText = `+30분 (${time30Str})`;
  if (btn60) btn60.innerText = `+60분 (${time60Str})`;

  // 지도 모듈에 실시간 교차로 데이터 공급
  if (window.flowMap && window.flowMap.updateDynamicIntersections) {
    window.flowMap.updateDynamicIntersections(liveAnalysis);
  }
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// 2. 탭 네비게이션 제어
function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      switchTab(targetTab);
    });
  });

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto-tab]");
    if (trigger) {
      const targetTab = trigger.dataset.gotoTab;
      switchTab(targetTab);
    }
  });

  document.getElementById("live-ticker-banner")?.addEventListener("click", () => {
    switchTab("tab-operator");
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const activeScreen = document.getElementById(tabId);
  if (activeScreen) {
    activeScreen.classList.add("active");
    const scrollContainer = document.querySelector(".app-content");
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }

  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.dataset.tab === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  if (tabId === "tab-map" && window.flowMap) {
    window.flowMap.invalidateSize();
  }
}

// 3. 글로벌 컨트롤 (데스크탑 프레임 토글, 타임테이블/검색 모달)
function bindGlobalControls() {
  const fullscreenBtn = document.getElementById("fullscreen-toggle-btn");
  const desktopWrapper = document.getElementById("desktop-wrapper");
  if (fullscreenBtn && desktopWrapper) {
    fullscreenBtn.addEventListener("click", () => {
      desktopWrapper.classList.toggle("fullscreen");
      const isFull = desktopWrapper.classList.contains("fullscreen");
      fullscreenBtn.innerHTML = isFull ? `<span>📱</span> 모바일 프레임 뷰` : `<span>🖥️</span> 전체화면 모드`;
      if (window.flowMap) window.flowMap.invalidateSize();
    });
  }

  const timetableBtn = document.getElementById("view-timetable-btn");
  const timetableModal = document.getElementById("timetable-modal-overlay");
  if (timetableBtn && timetableModal) {
    timetableBtn.addEventListener("click", () => {
      timetableModal.classList.add("active");
      if (window.programSearch) window.programSearch.renderProgramsList();
    });

    document.getElementById("close-timetable-btn")?.addEventListener("click", () => {
      timetableModal.classList.remove("active");
    });
  }

  // 홈 화면 GPS 카드 길안내 (네이버 100% 자동출발 & 카카오맵)
  document.querySelectorAll(".gps-navi-trigger-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget.dataset.target;
      const provider = e.currentTarget.dataset.provider;
      const { venues } = window.FESTIVAL_DATA;
      const venue = target === "stadium" ? venues.stadium : venues.samgeori;
      const startPos = window.NavigationUtils.getCurrentUserPos();

      if (provider === "naver") {
        showToast(`🧭 [${startPos.name}] ➔ [${venue.name}] 네이버 빠른 길찾기 연결`);
        window.open(window.NavigationUtils.getNaverMapUrl(venue.lat, venue.lng, venue.name, startPos), "_blank");
      } else {
        showToast(`🧭 [${venue.name}] 카카오맵 길찾기 연결`);
        window.open(window.NavigationUtils.getKakaoMapUrl(venue.lat, venue.lng, venue.name), "_blank");
      }
    });
  });
}

// 4. 전역 토스트 알림 헬퍼
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span>📢</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

window.showToast = showToast;
window.switchTab = switchTab;
