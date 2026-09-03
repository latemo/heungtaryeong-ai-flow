/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 메인 앱 컨트롤러 (탭 전환, GPS, BIS 셔틀, 프로그램 검색, 글로벌 토스트)
 */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  renderHomeData();
  bindNavigation();
  bindGlobalControls();

  // 하위 모듈 초기화
  if (window.flowMap) window.flowMap.init();
  if (window.routesController) window.routesController.init();
  if (window.operatorController) window.operatorController.init();
  if (window.shuttleBis) window.shuttleBis.init();
  if (window.programSearch) window.programSearch.init();

  // 초기 브리핑 토스트
  setTimeout(() => {
    showToast("🎉 천안흥타령춤축제 2026 AI FLOW 가동 중");
  }, 600);
}

// 1. 홈 화면 데이터 바인딩
function renderHomeData() {
  const { meta, venues } = window.FESTIVAL_DATA;

  // 날씨 및 일시
  const tempEl = document.getElementById("weather-temp");
  if (tempEl) tempEl.innerText = `${meta.weather.temp}°C`;

  const weatherPillEl = document.getElementById("weather-condition");
  if (weatherPillEl) weatherPillEl.innerText = `${meta.weather.icon} ${meta.weather.condition}`;

  const dateEl = document.getElementById("festival-date-text");
  if (dateEl) dateEl.innerText = meta.currentTimestamp;

  // 종합운동장(서북권)
  const st = venues.stadium;
  setElementText("home-stadium-name", st.name);
  setElementText("home-stadium-load", st.currentLoad);
  setElementText("home-stadium-pred30", `${st.predictedLoad30}pt`);
  setElementText("home-stadium-pred60", `${st.predictedLoad60}pt`);
  const stBar = document.getElementById("home-stadium-bar");
  if (stBar) stBar.style.width = `${st.currentLoad}%`;

  // 삼거리공원(동남권)
  const sg = venues.samgeori;
  setElementText("home-samgeori-name", sg.name);
  setElementText("home-samgeori-load", sg.currentLoad);
  setElementText("home-samgeori-pred30", `${sg.predictedLoad30}pt`);
  setElementText("home-samgeori-pred60", `${sg.predictedLoad60}pt`);
  const sgBar = document.getElementById("home-samgeori-bar");
  if (sgBar) sgBar.style.width = `${sg.currentLoad}%`;
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// 2. 탭 네비게이션 제어
function bindNavigation() {
  // 하단 탭 버튼 클릭 이벤트
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      switchTab(targetTab);
    });
  });

  // 본문 내 바로가기 링크/버튼 이벤트 (data-goto-tab 속성 활용)
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto-tab]");
    if (trigger) {
      const targetTab = trigger.dataset.gotoTab;
      switchTab(targetTab);
    }
  });

  // 상단 티커 클릭 시 운영자 탭으로 이동
  document.getElementById("live-ticker-banner")?.addEventListener("click", () => {
    switchTab("tab-operator");
  });
}

function switchTab(tabId) {
  // 탭 화면 활성화
  document.querySelectorAll(".tab-screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const activeScreen = document.getElementById(tabId);
  if (activeScreen) {
    activeScreen.classList.add("active");
    // 스크롤 상단 리셋
    const scrollContainer = document.querySelector(".app-content");
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }

  // 하단 탭바 활성화 표시
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.dataset.tab === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // 지도 탭 활성화 시 맵 크기 리프레시
  if (tabId === "tab-map" && window.flowMap) {
    window.flowMap.invalidateSize();
  }
}

// 3. 글로벌 컨트롤 (데스크탑 프레임 토글, 타임테이블/검색 모달)
function bindGlobalControls() {
  // 데스크탑 풀스크린 토글
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

  // 축제 타임테이블 & 프로그램 검색 모달 토글
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

// 전역 공개
window.showToast = showToast;
window.switchTab = switchTab;
