/**
 * 천안 J3D LAB - 흥타령 AI FLOW
 * 축제 프로그램 102선 실시간 검색 & 관심 공연 북마크 엔진
 */

class ProgramSearchController {
  constructor() {
    this.searchQuery = "";
    this.selectedVenueFilter = "all"; // "all" | "종합운동장" | "삼거리공원" | "hot"
    this.favorites = new Set(this.loadFavorites());
  }

  loadFavorites() {
    try {
      const saved = localStorage.getItem("heungtaryeong_favorites");
      return saved ? JSON.parse(saved) : ["P-01", "P-03"];
    } catch (e) {
      return ["P-01", "P-03"];
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem("heungtaryeong_favorites", JSON.stringify([...this.favorites]));
    } catch (e) {}
  }

  init() {
    this.renderProgramsList();
    this.bindEvents();
  }

  renderProgramsList() {
    const container = document.getElementById("programs-search-results");
    if (!container) return;

    const { programs } = window.FESTIVAL_DATA;

    // 필터링 적용
    const filtered = programs.filter(p => {
      // 1. 텍스트 검색
      const matchesQuery = !this.searchQuery || 
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.stage.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.tag.toLowerCase().includes(this.searchQuery.toLowerCase());

      // 2. 권역/인기 필터
      let matchesVenue = true;
      if (this.selectedVenueFilter === "hot") matchesVenue = p.isHot;
      else if (this.selectedVenueFilter !== "all") matchesVenue = p.venue.includes(this.selectedVenueFilter);

      return matchesQuery && matchesVenue;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:#94a3b8;">
          <div style="font-size:32px; margin-bottom:8px;">🔍</div>
          <div style="font-size:14px; font-weight:700; color:#475569;">일치하는 프로그램이 없습니다.</div>
          <div style="font-size:12px; margin-top:4px;">다른 검색어나 필터를 선택해 보세요.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(p => {
      const isFav = this.favorites.has(p.id);
      const isStadium = p.venue.includes("종합운동장");

      return `
        <div class="program-item-card" data-program-id="${p.id}" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 4px rgba(15,23,42,0.04); transition:all 0.15s;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="card-badge ${isStadium ? 'live' : 'success'}" style="font-size:10.5px;">
                ${p.venue}
              </span>
              <span style="font-size:11px; color:#64748b; font-weight:700;">${p.time}</span>
            </div>
            <button class="fav-toggle-btn" data-program-id="${p.id}" style="background:none; border:none; font-size:18px; cursor:pointer; color:${isFav ? '#e11d48' : '#cbd5e1'};">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>

          <div style="font-size:14.5px; font-weight:800; color:#0f172a; margin-bottom:4px; letter-spacing:-0.3px;">
            ${p.title}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:#64748b;">
            <span>📍 ${p.stage}</span>
            <span style="color:#0284c7; font-weight:700;">#${p.tag}</span>
          </div>

          <!-- 길찾기 원클릭 액션 -->
          <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #f1f5f9; display:flex; justify-content:flex-end; gap:8px;">
            <button class="program-navi-btn" data-venue="${p.venue}" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; color:#334155; cursor:pointer;">
              무대 길찾기 ➔
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  toggleFavorite(programId) {
    if (this.favorites.has(programId)) {
      this.favorites.delete(programId);
      if (window.showToast) window.showToast("관심 공연에서 제외되었습니다.");
    } else {
      this.favorites.add(programId);
      if (window.showToast) window.showToast("❤️ 관심 공연에 저장되었습니다!");
    }
    this.saveFavorites();
    this.renderProgramsList();
  }

  bindEvents() {
    // 실시간 검색어 입력 이벤트
    const searchInput = document.getElementById("program-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderProgramsList();
      });
    }

    // 권역 필터 탭 클릭
    document.querySelectorAll(".program-filter-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".program-filter-tab").forEach(t => t.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.selectedVenueFilter = e.currentTarget.dataset.filter;
        this.renderProgramsList();
      });
    });

    // 찜하기 버튼 & 길찾기 버튼 이벤트 위임
    document.getElementById("programs-search-results")?.addEventListener("click", (e) => {
      const favBtn = e.target.closest(".fav-toggle-btn");
      if (favBtn) {
        this.toggleFavorite(favBtn.dataset.programId);
        return;
      }

      const naviBtn = e.target.closest(".program-navi-btn");
      if (naviBtn) {
        const venueName = naviBtn.dataset.venue;
        const { venues } = window.FESTIVAL_DATA;
        const targetVenue = venueName.includes("종합운동장") ? venues.stadium : venues.samgeori;
        const kakaoUrl = window.NavigationUtils.getKakaoMapUrl(targetVenue.lat, targetVenue.lng, targetVenue.name);
        window.open(kakaoUrl, "_blank");
      }
    });
  }
}

window.programSearch = new ProgramSearchController();
