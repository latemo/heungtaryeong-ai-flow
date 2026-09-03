/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 스마트 분산 동선 및 동남권 상권 연계 모듈
 */

class RoutesController {
  constructor() {
    this.selectedRouteId = "route-1";
    this.currentNavStep = 0;
    this.userConversionsCount = 1420; // 누적 시민 전환 참여 수
    this.claimedCoupons = new Set();
  }

  init() {
    this.renderRecommendedRoutes();
    this.renderMerchants();
    this.bindEvents();
    this.updateConversionStats();
  }

  // 1. 추천 동선 렌더링
  renderRecommendedRoutes() {
    const container = document.getElementById("routes-list-container");
    if (!container) return;

    const { recommendedRoutes } = window.FESTIVAL_DATA;

    container.innerHTML = recommendedRoutes.map(route => {
      const isSelected = route.id === this.selectedRouteId;
      return `
        <div class="route-card ${isSelected ? 'selected' : ''}" data-route-id="${route.id}">
          <div class="route-badge-row">
            <span class="card-badge ${route.badgeType === 'best' ? 'success' : route.badgeType === 'hot' ? 'live' : 'ai'}">
              ${route.badge}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight:600;">
              ⏱️ ${route.duration}
            </span>
          </div>

          <div class="route-title">${route.title}</div>
          <div class="route-target">🎯 ${route.target}</div>

          <div class="route-meta-pills">
            <span class="meta-pill highlight">혼잡도: ${route.congestionScore}</span>
            <span class="meta-pill">⏳ ${route.savedWaitTime}</span>
            ${route.tags.map(t => `<span class="meta-pill">#${t}</span>`).join("")}
          </div>

          <div class="route-timeline">
            ${route.steps.map(step => `
              <div class="timeline-step">
                <div class="step-marker"></div>
                <div class="step-content">
                  <div class="step-time-place">
                    <span>${step.time}</span>
                    <span>·</span>
                    <span>${step.place}</span>
                  </div>
                  <div class="step-desc">${step.desc}</div>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="commerce-benefit-box">
            <span>🎁</span>
            <span>${route.commerceBenefit}</span>
          </div>

          <button class="btn-primary start-route-btn" data-route-id="${route.id}">
            <span>🧭</span> 이 동선으로 스마트 안내 시작
          </button>
        </div>
      `;
    }).join("");
  }

  // 2. 동남권 상권 제휴 가맹점 렌더링
  renderMerchants() {
    const container = document.getElementById("merchants-list-container");
    if (!container) return;

    const { merchants } = window.FESTIVAL_DATA;

    container.innerHTML = merchants.map(m => {
      const isClaimed = this.claimedCoupons.has(m.id);
      return `
        <div class="merchant-card">
          <div class="merchant-top">
            <div>
              <div class="merchant-name">${m.name}</div>
              <div class="merchant-cat">${m.category} · ${m.zone}</div>
            </div>
            <span class="card-badge ai">${m.badge}</span>
          </div>

          <div class="merchant-dist">📍 ${m.distance}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${m.address}</div>

          <div class="coupon-box">
            <div class="coupon-info">🎟️ ${m.benefit}</div>
            <button class="coupon-claim-btn ${isClaimed ? 'claimed' : ''}" data-merchant-id="${m.id}" style="${isClaimed ? 'background: #00e676; color: #000;' : ''}">
              ${isClaimed ? '발급완료 ✓' : '쿠폰받기'}
            </button>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:4px;">
            <span>방문자 관심 <strong>${m.views.toLocaleString()}회</strong></span>
            <span>전환 확인 <strong>${m.conversions.toLocaleString()}건</strong></span>
          </div>
        </div>
      `;
    }).join("");
  }

  // 3. 동선 안내 시작 모달 시뮬레이터 (기획서 12p 우측 화면 구현)
  startRouteNavigation(routeId) {
    const { recommendedRoutes } = window.FESTIVAL_DATA;
    const route = recommendedRoutes.find(r => r.id === routeId);
    if (!route) return;

    this.selectedRouteId = routeId;
    this.currentNavStep = 0;

    // 전환 카운터 증가 (시민 선택 기록 집계)
    this.userConversionsCount++;
    this.updateConversionStats();

    const modalOverlay = document.getElementById("nav-modal-overlay");
    const modalContent = document.getElementById("nav-modal-content");
    if (!modalOverlay || !modalContent) return;

    this.updateNavModalStep(route);
    modalOverlay.classList.add("active");

    if (window.showToast) {
      window.showToast(`🧭 '${route.title.split('.')[1]}' 동선 안내가 시작되었습니다!`);
    }
  }

  updateNavModalStep(route) {
    const modalContent = document.getElementById("nav-modal-content");
    if (!modalContent) return;

    const currentStep = route.steps[this.currentNavStep];
    const isLastStep = this.currentNavStep === route.steps.length - 1;

    modalContent.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="card-badge live">실시간 분산 안내 중</span>
        <button id="close-nav-modal-btn" style="background:none; border:none; color:#64748b; font-size:22px; cursor:pointer;">&times;</button>
      </div>

      <h2 style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px;">${route.title}</h2>
      <p style="font-size:12px; color:#475569; margin-bottom:14px;">
        예측 기반 최적 분산 경로를 실시간으로 안내하고 있습니다.
      </p>

      <!-- 현재 경유지 카드 (밝고 정갈한 블루 틴트) -->
      <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:12px; padding:14px; margin-bottom:14px;">
        <div style="font-size:11px; color:#4f46e5; font-weight:700; margin-bottom:2px;">
          경유 단계 [${this.currentNavStep + 1} / ${route.steps.length}]
        </div>
        <div style="font-size:16.5px; font-weight:800; color:#0f172a; margin-bottom:4px;">
          📍 ${currentStep.place}
        </div>
        <div style="font-size:12.5px; color:#334155; margin-bottom:8px; line-height:1.4;">
          ${currentStep.desc}
        </div>
        <div style="font-size:11.5px; color:#059669; font-weight:700;">
          권장 방문 시각: ${currentStep.time}
        </div>
      </div>

      <!-- 상권 혜택 바코드 미리보기 -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; text-align:center; margin-bottom:14px;">
        <div style="font-size:11px; color:#64748b; margin-bottom:4px;">현장 제시용 통합 모바일 바코드</div>
        <div style="font-family:monospace; font-size:20px; letter-spacing:4px; font-weight:800; color:#0f172a; padding:6px 0;">
          ||||| | |||| || |||
        </div>
        <div style="font-size:11.5px; color:#ea580c; font-weight:700;">
          ${route.commerceBenefit}
        </div>
      </div>

      <div style="display:flex; gap:10px;">
        ${!isLastStep ? `
          <button id="next-step-btn" class="btn-primary" style="margin-top:0; flex:2;">
            다음 목적지로 이동 (${this.currentNavStep + 2}단계) →
          </button>
        ` : `
          <button id="finish-step-btn" class="btn-primary" style="margin-top:0; flex:2; background:#10b981;">
            동선 완주 및 스탬프 적립 완료 ✓
          </button>
        `}
        <button id="close-step-btn" style="flex:1; background:#f1f5f9; border:1px solid #e2e8f0; color:#334155; border-radius:8px; font-weight:700; cursor:pointer;">
          닫기
        </button>
      </div>
    `;

    // 모달 내부 이벤트 바인딩
    document.getElementById("close-nav-modal-btn")?.addEventListener("click", () => {
      document.getElementById("nav-modal-overlay").classList.remove("active");
    });
    document.getElementById("close-step-btn")?.addEventListener("click", () => {
      document.getElementById("nav-modal-overlay").classList.remove("active");
    });

    document.getElementById("next-step-btn")?.addEventListener("click", () => {
      if (this.currentNavStep < route.steps.length - 1) {
        this.currentNavStep++;
        this.updateNavModalStep(route);
        if (window.showToast) {
          window.showToast(`📍 다음 경유지 안내: ${route.steps[this.currentNavStep].place}`);
        }
      }
    });

    document.getElementById("finish-step-btn")?.addEventListener("click", () => {
      document.getElementById("nav-modal-overlay").classList.remove("active");
      if (window.showToast) {
        window.showToast("🎉 축하합니다! 동선 완주 및 천안사랑 상품권 혜택이 적용되었습니다!");
      }
    });
  }

  // 4. 쿠폰 다운로드 처리
  claimCoupon(merchantId) {
    this.claimedCoupons.add(merchantId);
    this.renderMerchants();

    const { merchants } = window.FESTIVAL_DATA;
    const merchant = merchants.find(m => m.id === merchantId);

    if (window.showToast && merchant) {
      window.showToast(`🎟️ [${merchant.name}] 모바일 쿠폰이 발급되었습니다!`);
    }
  }

  updateConversionStats() {
    const el = document.getElementById("live-conversion-count");
    if (el) {
      el.innerText = this.userConversionsCount.toLocaleString();
    }
  }

  bindEvents() {
    // 동선 카드 내 버튼 클릭 위임
    document.getElementById("routes-list-container")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".start-route-btn");
      if (btn) {
        const routeId = btn.dataset.routeId;
        this.startRouteNavigation(routeId);
      }
    });

    // 상권 쿠폰 발급 버튼 클릭 위임
    document.getElementById("merchants-list-container")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".coupon-claim-btn");
      if (btn && !btn.classList.contains("claimed")) {
        const merchantId = btn.dataset.merchantId;
        this.claimCoupon(merchantId);
      }
    });
  }
}

window.routesController = new RoutesController();
