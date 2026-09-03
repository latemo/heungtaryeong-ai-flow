/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 실기능 추천 동선 & 상권 쿠폰/스탬프 영구 저장(LocalStorage) & Web Share 엔진
 */

class RoutesController {
  constructor() {
    this.selectedRouteId = null;
    this.currentNavStep = 0;

    // LocalStorage 기반 실제 상태 영구 로드
    this.claimedCoupons = new Set(this.loadFromStorage("heungtaryeong_claimed_coupons", []));
    this.usedCoupons = new Set(this.loadFromStorage("heungtaryeong_used_coupons", []));
    this.collectedStamps = new Set(this.loadFromStorage("heungtaryeong_stamps", ["samgeori", "market"]));
    this.userConversionsCount = parseInt(localStorage.getItem("heungtaryeong_conversions") || "1420", 10);
  }

  loadFromStorage(key, defaultVal) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  saveToStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  init() {
    this.renderRoutes();
    this.renderMerchants();
    this.renderStamps();
    this.updateConversionStats();
    this.bindEvents();
  }

  // 1. 추천 동선 카드 렌더링
  renderRoutes() {
    const container = document.getElementById("routes-list-container");
    if (!container) return;

    const { recommendedRoutes } = window.FESTIVAL_DATA;

    container.innerHTML = recommendedRoutes.map((route, idx) => {
      const isSelected = this.selectedRouteId === route.id || idx === 0;

      return `
        <article class="route-card ${isSelected ? 'selected' : ''}" data-route-id="${route.id}">
          <div class="route-badge-row">
            <span class="card-badge ${route.badgeType === 'best' ? 'success' : route.badgeType === 'hot' ? 'live' : 'ai'}">
              ${route.badge}
            </span>
            <span style="font-size:11.5px; color:#64748b; font-weight:700;">${route.duration}</span>
          </div>

          <h3 class="route-title">${route.title}</h3>
          <div class="route-target">
            <span>🎯 ${route.target}</span>
          </div>

          <div class="route-meta-pills">
            <span class="meta-pill highlight">✨ ${route.savedWaitTime}</span>
            <span class="meta-pill">부하: ${route.congestionScore}</span>
            ${route.tags.map(t => `<span class="meta-pill">#${t}</span>`).join("")}
          </div>

          <!-- 단계별 타임라인 -->
          <div class="route-timeline">
            ${route.steps.map(step => {
              const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(step.lat, step.lng, step.place);
              return `
                <div class="timeline-step">
                  <div class="step-marker"></div>
                  <div class="step-content">
                    <div class="step-time-place">
                      <span style="color:#2563eb;">${step.time}</span>
                      <span>${step.place}</span>
                    </div>
                    <div class="step-desc">${step.desc}</div>
                    <div style="margin-top:4px;">
                      <a href="${kakaoUrl}" target="_blank" style="font-size:11px; color:#2563eb; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:2px;">
                        길안내 시작 ➔
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <!-- 상권 혜택 박스 -->
          <div class="commerce-benefit-box">
            <span>🎁</span>
            <span>${route.commerceBenefit}</span>
          </div>

          <!-- 액션 버튼 그룹 (스마트 안내 & 친구 공유) -->
          <div style="display:flex; gap:8px; margin-top:12px;">
            <button class="btn-primary start-nav-btn" data-route-id="${route.id}" style="margin-top:0; flex:3;">
              <span>🧭</span> 실시간 스마트 안내 시작
            </button>
            <button class="share-route-btn" data-route-id="${route.id}" style="flex:1; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:12px; color:#334155; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
              <span>📤</span> 공유
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  // 2. 상권 제휴 쿠폰 카드 렌더링 (LocalStorage 영구 연동 & 현장 사용 처리)
  renderMerchants() {
    const container = document.getElementById("merchants-list-container");
    if (!container) return;

    const { merchants } = window.FESTIVAL_DATA;

    container.innerHTML = merchants.map(m => {
      const isClaimed = this.claimedCoupons.has(m.id);
      const isUsed = this.usedCoupons.has(m.id);
      const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(m.lat, m.lng, m.name);

      return `
        <div class="merchant-card" data-merchant-id="${m.id}">
          <div class="merchant-top">
            <div>
              <div class="merchant-name">${m.name}</div>
              <div class="merchant-cat">${m.category} · ${m.zone}</div>
            </div>
            <span class="card-badge ai">${m.badge}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin:4px 0;">
            <span style="color:#0284c7; font-weight:700;">📍 ${m.distance}</span>
            <a href="${kakaoUrl}" target="_blank" style="color:#2563eb; font-weight:800; text-decoration:none;">매장 길찾기 ➔</a>
          </div>

          <!-- 티켓형 쿠폰 박스 -->
          <div class="coupon-box" style="background:${isUsed ? '#f1f5f9' : '#fffbeb'}; border-color:${isUsed ? '#e2e8f0' : '#fde68a'};">
            <div class="coupon-info" style="color:${isUsed ? '#94a3b8' : '#92400e'};">
              <div style="font-size:12.5px; font-weight:800;">${m.benefit}</div>
              <div style="font-size:10.5px; margin-top:2px;">
                ${isUsed ? '❌ 사용 완료된 쿠폰입니다' : isClaimed ? '✓ 스마트폰 보관함 저장됨 (클릭하여 바코드 제시)' : '현장 제시 시 즉시 할인 적용'}
              </div>
            </div>
            
            ${isUsed ? `
              <button class="coupon-claim-btn" disabled style="background:#cbd5e1; color:#64748b; cursor:default;">
                사용완료
              </button>
            ` : isClaimed ? `
              <button class="coupon-claim-btn show-barcode-btn" data-merchant-id="${m.id}" data-name="${m.name}" style="background:#059669;">
                바코드 사용 ➔
              </button>
            ` : `
              <button class="coupon-claim-btn claim-action-btn" data-merchant-id="${m.id}">
                쿠폰받기
              </button>
            `}
          </div>

          <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#64748b; padding-top:4px;">
            <span>조회 <strong>${m.views.toLocaleString()}회</strong></span>
            <span>실제 전환 <strong>${m.conversions.toLocaleString()}건</strong></span>
          </div>
        </div>
      `;
    }).join("");
  }

  // 3. 스탬프 투어 실동작 렌더링
  renderStamps() {
    const stampStatusEl = document.getElementById("stamp-status-count");
    if (stampStatusEl) {
      stampStatusEl.innerText = `${this.collectedStamps.size} / 3 달성`;
    }

    const samgeoriStampEl = document.getElementById("stamp-samgeori");
    const marketStampEl = document.getElementById("stamp-market");
    const myeongdongStampEl = document.getElementById("stamp-myeongdong");

    if (samgeoriStampEl) {
      const active = this.collectedStamps.has("samgeori");
      samgeoriStampEl.style.opacity = active ? "1" : "0.4";
      samgeoriStampEl.innerHTML = active ? `🌳<div style="font-size:10px; font-weight:800; color:#059669;">완료 ✓</div>` : `🌳<div style="font-size:10px; color:#94a3b8;">미방문</div>`;
    }
    if (marketStampEl) {
      const active = this.collectedStamps.has("market");
      marketStampEl.style.opacity = active ? "1" : "0.4";
      marketStampEl.innerHTML = active ? `🥟<div style="font-size:10px; font-weight:800; color:#059669;">완료 ✓</div>` : `🥟<div style="font-size:10px; color:#94a3b8;">미방문</div>`;
    }
    if (myeongdongStampEl) {
      const active = this.collectedStamps.has("myeongdong");
      myeongdongStampEl.style.opacity = active ? "1" : "0.4";
      myeongdongStampEl.innerHTML = active ? `☕<div style="font-size:10px; font-weight:800; color:#059669;">완료 ✓</div>` : `☕<div style="font-size:10px; color:#94a3b8;">미방문</div>`;
    }

    // 3개 모두 달성 시 경품 응모 박스 활성화
    const rewardBox = document.getElementById("stamp-reward-box");
    if (rewardBox) {
      if (this.collectedStamps.size >= 3) {
        rewardBox.style.display = "block";
      } else {
        rewardBox.style.display = "none";
      }
    }
  }

  // 스탬프 수동/자동 인증
  claimStamp(stampKey, spotName) {
    if (this.collectedStamps.has(stampKey)) {
      if (window.showToast) window.showToast(`이미 [${spotName}] 스탬프를 획득하셨습니다!`);
      return;
    }

    this.collectedStamps.add(stampKey);
    this.saveToStorage("heungtaryeong_stamps", [...this.collectedStamps]);
    this.renderStamps();

    if (window.showToast) {
      window.showToast(`🎉 축하합니다! [${spotName}] 모바일 스탬프를 획득했습니다! (${this.collectedStamps.size}/3)`);
    }

    if (this.collectedStamps.size === 3) {
      setTimeout(() => {
        alert("🎊 모든 스탬프(3개)를 완주하셨습니다! 천안사랑 상품권 5,000원 추첨 응모권 번호가 발급되었습니다.");
      }, 500);
    }
  }

  // 4. 모바일 바코드 팝업 & 현장 사용 완료 처리
  showBarcodeModal(merchantId, merchantName) {
    const modalOverlay = document.getElementById("nav-modal-overlay");
    const modalContent = document.getElementById("nav-modal-content");
    if (!modalOverlay || !modalContent) return;

    const barcodeNumber = `CH-2026-${merchantId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    modalContent.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="card-badge success">모바일 현장 할인 쿠폰</span>
        <button id="close-nav-modal-btn" style="background:none; border:none; color:#64748b; font-size:22px; cursor:pointer;">&times;</button>
      </div>

      <h2 style="font-size:16px; font-weight:900; color:#0f172a; margin-bottom:4px;">${merchantName}</h2>
      <p style="font-size:12px; color:#475569; margin-bottom:16px;">
        결제 시 점원에게 아래 바코드를 제시해 주세요.
      </p>

      <!-- 바코드 디스플레이 -->
      <div style="background:#ffffff; border:2px dashed #cbd5e1; border-radius:14px; padding:20px; text-align:center; margin-bottom:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="font-size:11px; color:#64748b; margin-bottom:8px;">천안사랑 제휴 스마트 인증코드</div>
        <div style="font-family:monospace; font-size:26px; letter-spacing:6px; font-weight:900; color:#0f172a; padding:10px 0;">
          ||||| | |||| || |||
        </div>
        <div style="font-size:13px; font-weight:800; color:#4f46e5; letter-spacing:1px;">
          ${barcodeNumber}
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        <button id="confirm-use-coupon-btn" class="btn-primary" data-merchant-id="${merchantId}" style="background:#059669; margin-top:0;">
          직원 확인 및 사용 완료 처리 ✓
        </button>
        <button id="close-step-btn" style="background:#f1f5f9; border:1px solid #e2e8f0; color:#334155; padding:10px; border-radius:8px; font-weight:700; cursor:pointer;">
          닫기
        </button>
      </div>
    `;

    modalOverlay.classList.add("active");

    document.getElementById("confirm-use-coupon-btn")?.addEventListener("click", () => {
      this.usedCoupons.add(merchantId);
      this.saveToStorage("heungtaryeong_used_coupons", [...this.usedCoupons]);
      modalOverlay.classList.remove("active");
      this.renderMerchants();
      if (window.showToast) {
        window.showToast(`✓ [${merchantName}] 쿠폰이 정상 사용 완료 처리되었습니다.`);
      }
    });
  }

  // 5. 동선 안내 시작 모달
  startRouteNavigation(routeId) {
    const { recommendedRoutes } = window.FESTIVAL_DATA;
    const route = recommendedRoutes.find(r => r.id === routeId);
    if (!route) return;

    this.selectedRouteId = routeId;
    this.currentNavStep = 0;

    // 전환 기록 증가
    this.userConversionsCount++;
    localStorage.setItem("heungtaryeong_conversions", this.userConversionsCount.toString());
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
    const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(currentStep.lat, currentStep.lng, currentStep.place);

    modalContent.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="card-badge live">실시간 분산 안내 중</span>
        <button id="close-nav-modal-btn" style="background:none; border:none; color:#64748b; font-size:22px; cursor:pointer;">&times;</button>
      </div>

      <h2 style="font-size:16px; font-weight:900; color:#0f172a; margin-bottom:4px;">${route.title}</h2>
      <p style="font-size:12px; color:#475569; margin-bottom:14px;">
        예측 기반 최적 분산 경로를 실시간으로 안내하고 있습니다.
      </p>

      <!-- 현재 경유지 카드 -->
      <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:14px; padding:16px; margin-bottom:14px;">
        <div style="font-size:11px; color:#4f46e5; font-weight:800; margin-bottom:2px;">
          경유 단계 [${this.currentNavStep + 1} / ${route.steps.length}]
        </div>
        <div style="font-size:17px; font-weight:900; color:#0f172a; margin-bottom:4px;">
          📍 ${currentStep.place}
        </div>
        <div style="font-size:13px; color:#334155; margin-bottom:10px; line-height:1.45;">
          ${currentStep.desc}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11.5px; color:#059669; font-weight:800;">
            권장 방문 시각: ${currentStep.time}
          </div>
          <a href="${kakaoUrl}" target="_blank" style="background:#fee500; color:#191919; font-size:11.5px; font-weight:800; padding:6px 12px; border-radius:8px; text-decoration:none; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
            카카오 길안내 ➔
          </a>
        </div>
      </div>

      <!-- 상권 혜택 바코드 미리보기 -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; text-align:center; margin-bottom:14px;">
        <div style="font-size:11px; color:#64748b; margin-bottom:4px;">현장 제시용 통합 모바일 바코드</div>
        <div style="font-family:monospace; font-size:20px; letter-spacing:4px; font-weight:800; color:#0f172a; padding:6px 0;">
          ||||| | |||| || |||
        </div>
        <div style="font-size:11.5px; color:#ea580c; font-weight:800;">
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

    document.getElementById("close-nav-modal-btn")?.addEventListener("click", () => {
      document.getElementById("nav-modal-overlay")?.classList.remove("active");
    });
    document.getElementById("close-step-btn")?.addEventListener("click", () => {
      document.getElementById("nav-modal-overlay")?.classList.remove("active");
    });

    document.getElementById("next-step-btn")?.addEventListener("click", () => {
      if (this.currentNavStep < route.steps.length - 1) {
        this.currentNavStep++;
        this.updateNavModalStep(route);
      }
    });

    document.getElementById("finish-step-btn")?.addEventListener("click", () => {
      document.getElementById("nav-modal-overlay")?.classList.remove("active");
      this.claimStamp("samgeori", "삼거리공원");
      if (window.showToast) {
        window.showToast("🎉 동선 완주 성공! 삼거리공원 방문 스탬프가 자동 적립되었습니다.");
      }
    });
  }

  // 6. Web Share API 기반 공유
  shareRoute(routeId) {
    const { recommendedRoutes } = window.FESTIVAL_DATA;
    const route = recommendedRoutes.find(r => r.id === routeId);
    if (!route) return;

    const shareData = {
      title: "흥타령 AI FLOW 스마트 분산 동선",
      text: `[천안흥타령춤축제 2026] 종합운동장 정체 피하고 ${route.savedWaitTime} 줄이는 '${route.title}' 함께 가요!`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log("공유 취소:", err));
    } else {
      // Web Share API 미지원 시 클립보드 복사
      navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`).then(() => {
        if (window.showToast) {
          window.showToast("📋 추천 동선 초대 링크가 클립보드에 복사되었습니다. 카카오톡에 붙여넣으세요!");
        }
      });
    }
  }

  updateConversionStats() {
    const countEl = document.getElementById("live-conversion-count");
    if (countEl) {
      countEl.innerText = this.userConversionsCount.toLocaleString();
    }
  }

  bindEvents() {
    // 동선 안내 시작 & 공유 버튼 위임
    document.getElementById("routes-list-container")?.addEventListener("click", (e) => {
      const navBtn = e.target.closest(".start-nav-btn");
      if (navBtn) {
        this.startRouteNavigation(navBtn.dataset.routeId);
        return;
      }

      const shareBtn = e.target.closest(".share-route-btn");
      if (shareBtn) {
        this.shareRoute(shareBtn.dataset.routeId);
      }
    });

    // 쿠폰 발급 & 바코드 버튼 위임
    document.getElementById("merchants-list-container")?.addEventListener("click", (e) => {
      const claimBtn = e.target.closest(".claim-action-btn");
      if (claimBtn) {
        const merchantId = claimBtn.dataset.merchantId;
        this.claimedCoupons.add(merchantId);
        this.saveToStorage("heungtaryeong_claimed_coupons", [...this.claimedCoupons]);
        this.renderMerchants();
        if (window.showToast) {
          window.showToast("🎟️ 쿠폰이 내 보관함에 발급되었습니다! 결제 시 바코드를 제시하세요.");
        }
        return;
      }

      const barcodeBtn = e.target.closest(".show-barcode-btn");
      if (barcodeBtn) {
        this.showBarcodeModal(barcodeBtn.dataset.merchantId, barcodeBtn.dataset.name);
      }
    });

    // 스탬프 수동 인증 버튼
    document.getElementById("stamp-samgeori-btn")?.addEventListener("click", () => {
      this.claimStamp("samgeori", "삼거리공원");
    });
    document.getElementById("stamp-market-btn")?.addEventListener("click", () => {
      this.claimStamp("market", "남산중앙시장");
    });
    document.getElementById("stamp-myeongdong-btn")?.addEventListener("click", () => {
      this.claimStamp("myeongdong", "명동거리 카페");
    });

    // 경품 응모권 복사
    document.getElementById("copy-reward-coupon-btn")?.addEventListener("click", () => {
      const couponCode = `CHEONAN-GIFT-${Math.floor(100000 + Math.random() * 900000)}`;
      navigator.clipboard.writeText(couponCode).then(() => {
        if (window.showToast) {
          window.showToast(`🎁 상품권 응모코드 [${couponCode}]가 복사되었습니다!`);
        }
      });
    });
  }
}

window.routesController = new RoutesController();
