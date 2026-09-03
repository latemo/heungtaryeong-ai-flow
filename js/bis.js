/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 실시간 셔틀버스 운행정보시스템 (Live Shuttle BIS Engine)
 * 
 * 실제 시스템 시각(Date.now)을 기반으로 매 초마다 다음 셔틀 도착 카운트다운 및 정류소 현황 갱신
 */

class ShuttleBisController {
  constructor() {
    this.intervalMin = 10; // 배차 간격 10분
    this.timer = null;
    this.selectedStopId = "ST-01";
  }

  init() {
    this.renderBisWidget();
    this.startCountdown();
    this.bindEvents();
  }

  // 셔틀 BIS 상단 요약 위젯 및 정류소별 카드 렌더링
  renderBisWidget() {
    const container = document.getElementById("shuttle-bis-container");
    if (!container) return;

    const { shuttleRoute } = window.FESTIVAL_DATA;
    const now = new Date();
    const currentSeconds = now.getMinutes() * 60 + now.getSeconds();

    container.innerHTML = `
      <div class="glass-card" style="background: linear-gradient(135deg, #ffffff 0%, #fffbf0 100%); border-color: #fde68a; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:18px;">🚍</span>
            <strong style="font-size:14px; color:#0f172a;">흥타령 안심 순환 셔틀 실시간 BIS</strong>
          </div>
          <span class="card-badge live" style="background:#fef3c7; color:#b45309; border-color:#fde68a;">
            실시간 8대 순환
          </span>
        </div>

        <!-- 다음 셔틀 실시간 카운트다운 박스 -->
        <div style="background:#ffffff; border:1px solid #fed7aa; border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; box-shadow:0 2px 8px rgba(245,158,11,0.08);">
          <div>
            <div style="font-size:11px; color:#9a3412; font-weight:700;">다음 셔틀 도착까지</div>
            <div style="font-size:22px; font-weight:900; color:#ea580c; font-family:var(--font-display); letter-spacing:-0.5px;" id="bis-main-countdown">
              계산 중...
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:#64748b; font-weight:600;">배차 간격 10분</div>
            <div style="font-size:12px; color:#059669; font-weight:800; margin-top:2px;">서북 ↔ 동남 급행</div>
          </div>
        </div>

        <!-- 정류장 선택 셀렉터 & 타임라인 -->
        <div style="font-size:11.5px; font-weight:800; color:#334155; margin-bottom:8px;">
          📍 정류장별 실시간 도착 예정 정보
        </div>
        <div class="bis-stops-scroll" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:6px;">
          ${shuttleRoute.stops.map((stop, idx) => {
            // 각 정류장별 가중치 적용 실시간 오프셋
            const stopOffset = (idx * 160) % 600;
            const stopRemaining = (600 - ((currentSeconds + stopOffset) % 600));
            const stopMin = Math.floor(stopRemaining / 60);
            const stopSec = stopRemaining % 60;
            const isSelected = stop.id === this.selectedStopId;

            return `
              <div class="bis-stop-card ${isSelected ? 'active' : ''}" data-stop-id="${stop.id}" data-lat="${stop.lat}" data-lng="${stop.lng}" data-name="${stop.name}" style="flex-shrink:0; width:130px; background:${isSelected ? '#eff6ff' : '#f8fafc'}; border:1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}; border-radius:10px; padding:10px; cursor:pointer; transition:all 0.2s;">
                <div style="font-size:10px; color:${isSelected ? '#2563eb' : '#64748b'}; font-weight:700;">정류소 0${idx + 1}</div>
                <div style="font-size:12px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:3px 0;">
                  ${stop.name}
                </div>
                <div style="font-size:12px; font-weight:900; color:#ea580c;" class="stop-time-text" data-stop-id="${stop.id}">
                  ${stopMin}분 ${stopSec < 10 ? '0' : ''}${stopSec}초
                </div>
                <button class="bis-navi-btn" data-lat="${stop.lat}" data-lng="${stop.lng}" data-name="${stop.name}" style="margin-top:6px; width:100%; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; font-size:10px; font-weight:700; color:#2563eb; padding:3px 0; cursor:pointer;">
                  길찾기 ➔
                </button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // 매 초 카운트다운 타이머
  startCountdown() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      const now = new Date();
      const currentSeconds = now.getMinutes() * 60 + now.getSeconds();
      
      // 메인 정류소(종합운동장/삼거리) 카운트다운
      const remainingSec = 600 - (currentSeconds % 600);
      const min = Math.floor(remainingSec / 60);
      const sec = remainingSec % 60;
      
      const countdownEl = document.getElementById("bis-main-countdown");
      if (countdownEl) {
        countdownEl.innerText = `${min}분 ${sec < 10 ? '0' : ''}${sec}초 뒤 도착`;
      }

      // 각 개별 정류장 시간 업데이트
      const { shuttleRoute } = window.FESTIVAL_DATA;
      shuttleRoute.stops.forEach((stop, idx) => {
        const stopOffset = (idx * 160) % 600;
        const stopRemaining = (600 - ((currentSeconds + stopOffset) % 600));
        const stopMin = Math.floor(stopRemaining / 60);
        const stopSec = stopRemaining % 60;

        const stopEl = document.querySelector(`.stop-time-text[data-stop-id="${stop.id}"]`);
        if (stopEl) {
          stopEl.innerText = `${stopMin}분 ${stopSec < 10 ? '0' : ''}${stopSec}초`;
        }
      });
    }, 1000);
  }

  bindEvents() {
    // 정류소 카드 및 길찾기 버튼 이벤트
    document.getElementById("shuttle-bis-container")?.addEventListener("click", (e) => {
      const naviBtn = e.target.closest(".bis-navi-btn");
      if (naviBtn) {
        e.stopPropagation();
        const lat = naviBtn.dataset.lat;
        const lng = naviBtn.dataset.lng;
        const name = naviBtn.dataset.name;
        const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(lat, lng, name);
        window.open(kakaoUrl, "_blank");
        return;
      }

      const stopCard = e.target.closest(".bis-stop-card");
      if (stopCard) {
        this.selectedStopId = stopCard.dataset.stopId;
        const lat = parseFloat(stopCard.dataset.lat);
        const lng = parseFloat(stopCard.dataset.lng);

        // 지도 탭으로 전환하고 해당 정류소로 뷰 이동
        if (window.switchTab) window.switchTab("tab-map");
        if (window.flowMap && window.flowMap.map) {
          window.flowMap.map.setView([lat, lng], 16);
        }
        if (window.showToast) {
          window.showToast(`🚍 [${stopCard.dataset.name}] 정류소 위치로 지도를 이동했습니다.`);
        }
      }
    });
  }
}

window.shuttleBis = new ShuttleBisController();
