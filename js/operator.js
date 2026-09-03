/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 시정 운영자 (City Operator) 의사결정 및 AI 권고 시뮬레이터 모듈
 * 
 * [기획서 핵심 철학]
 * "운영자는 값을 그대로 따르지 않습니다. 근거와 가정을 확인한 뒤 안내 여부를 정합니다."
 * 01 관측 -> 02 비교 -> 03 검토 -> 04 실행
 */

class OperatorController {
  constructor() {
    this.approvedScenarios = new Set(["OP-ALERT-03"]); // 기본 1건 승인 상태
    this.mitigationRate = 18.4; // 부하 완화율 (%)
  }

  init() {
    this.renderMetrics();
    this.renderScenarios();
    this.bindEvents();
  }

  // 1. 관측 및 모델 검증 지표 렌더링
  renderMetrics() {
    const { venues, meta } = window.FESTIVAL_DATA;
    const stadiumLoad = venues.stadium.currentLoad;
    const samgeoriLoad = venues.samgeori.currentLoad;
    const gap = stadiumLoad - samgeoriLoad;

    const gapEl = document.getElementById("op-venue-gap");
    if (gapEl) gapEl.innerText = `${gap} pt`;

    const wapeEl = document.getElementById("op-model-wape");
    if (wapeEl) wapeEl.innerText = meta.aiModelMetrics.wape;

    const improveEl = document.getElementById("op-model-improve");
    if (improveEl) improveEl.innerText = `+${meta.aiModelMetrics.improvement}`;

    const mitEl = document.getElementById("op-mitigation-rate");
    if (mitEl) mitEl.innerText = `${this.mitigationRate}%`;
  }

  // 2. AI 검토 권고 시나리오 카드 렌더링
  renderScenarios() {
    const container = document.getElementById("operator-scenarios-container");
    if (!container) return;

    const { operatorScenarios } = window.FESTIVAL_DATA;

    container.innerHTML = operatorScenarios.map(sc => {
      const isApproved = this.approvedScenarios.has(sc.id);

      return `
        <div class="operator-scenario-card ${sc.level}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="card-badge ${sc.level === 'warning' ? 'live' : sc.level === 'commerce' ? 'warning' : 'ai'}">
              ${sc.level === 'warning' ? '🚨 접근 부하 경고' : sc.level === 'commerce' ? '🎁 상권 분산 활성화' : 'ℹ️ 여유 자원 활용'}
            </span>
            <span style="font-size:11px; color:var(--text-muted); font-family:monospace;">
              관측: ${sc.detectedTime}
            </span>
          </div>

          <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:6px;">
            ${sc.title}
          </h4>

          <div class="scenario-evidence">
            <div>📊 <strong>감지 근거:</strong> ${sc.evidence}</div>
            <div style="margin-top:2px;">🔍 <strong>발생 사유:</strong> ${sc.reason}</div>
          </div>

          <div class="scenario-action-box">
            <div style="font-weight:700; color:#ba8fff; margin-bottom:4px;">💡 AI 추천 현장 조치안:</div>
            <div>${sc.recommendedAction}</div>
            <div style="font-size:11px; color:#9aa0b8; margin-top:6px;">
              연동 채널: ${sc.channelTargets.join(" · ")}
            </div>
          </div>

          <div style="font-size:11.5px; color:#00e676; font-weight:600; margin-bottom:10px;">
            📈 예상 효과: ${sc.impactProjection}
          </div>

          ${!isApproved ? `
            <button class="action-dispatch-btn op-dispatch-btn" data-scenario-id="${sc.id}">
              <span>📢</span> 담당자 확인 완료 및 현장 채널 전송
            </button>
          ` : `
            <div class="action-dispatch-btn done">
              <span>✓</span> 현장 채널 반영 완료 (송출 중)
            </div>
          `}
        </div>
      `;
    }).join("");
  }

  // 3. 담당자 승인 및 현장 채널 전송 처리
  dispatchScenario(scenarioId) {
    const { operatorScenarios } = window.FESTIVAL_DATA;
    const sc = operatorScenarios.find(s => s.id === scenarioId);
    if (!sc) return;

    this.approvedScenarios.add(scenarioId);
    this.mitigationRate = Math.min(32.5, +(this.mitigationRate + 4.8).toFixed(1));

    this.renderMetrics();
    this.renderScenarios();

    // 시민 화면 상단 라이브 브로드캐스트 티커 즉시 반영!
    const tickerEl = document.getElementById("live-broadcast-text");
    if (tickerEl) {
      tickerEl.innerText = `[천안시청 긴급] ${sc.recommendedAction}`;
    }

    // 홈 상단 배너 긴급 공지 변경
    const heroTitleEl = document.getElementById("hero-dynamic-notice");
    if (heroTitleEl) {
      heroTitleEl.innerText = `🚨 ${sc.recommendedAction}`;
    }

    if (window.showToast) {
      window.showToast(`✅ [${sc.id}] 현장 조치안이 VMS 및 시민 화면에 전송되었습니다!`);
    }
  }

  bindEvents() {
    document.getElementById("operator-scenarios-container")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".op-dispatch-btn");
      if (btn) {
        const id = btn.dataset.scenarioId;
        this.dispatchScenario(id);
      }
    });
  }
}

window.operatorController = new OperatorController();
