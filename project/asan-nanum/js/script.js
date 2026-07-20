/* ==============================
         공통 유틸
      ============================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ==============================
         탑배너 닫기
      ============================== */
(function () {
  const topBan = $(".topBan");
  if (!topBan) return;
  const closeBtn = $("button", topBan);
  if (!closeBtn) return;

  closeBtn.addEventListener("click", () => {
    topBan.style.display = "none";
  });
})();

/* ==============================
         헤더 : 스크롤 감지
         – 최상단에서는 scroll 클래스 제거(투명 → 원래 스타일)
         – 스크롤 내려가면 scroll 클래스 추가(고정 + 다크)
      ============================== */
(function () {
  const header = $("header");
  if (!header) return;

  const SCROLL_CLASS = "scroll";
  const THRESHOLD = 68; // px — header 축소 전환점 (live 사이트 기준)

  function onScroll() {
    if (window.scrollY > THRESHOLD) {
      header.classList.add(SCROLL_CLASS);
    } else {
      header.classList.remove(SCROLL_CLASS);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // 초기 실행
})();

/* ==============================
         헤더 네비게이션
         – 이벤트는 1회만 등록, mq.matches 로 PC/모바일 동작 분기
         – 구 initPC/initMobile 분리 방식의 리스너 누적 & document.click 충돌 버그 수정
      ============================== */
(function () {
  const mq = window.matchMedia("(min-width: 1024px)");
  const header = $("header");
  const mobileBtn = $(".mobileBtn");
  const menuItems = $$(".headerWrap__menu > li");

  /* ── 모바일 햄버거 버튼 (1회 등록) ── */
  if (mobileBtn) {
    mobileBtn.addEventListener("click", () => {
      header.classList.toggle("openM");
    });
  }

  /* ── depth1 클릭: PC(active 토글) / 모바일(아코디언) 분기 (1회 등록) ── */
  menuItems.forEach((li) => {
    const depth1 = $(".depth1", li);
    const depth2 = $(".depth2", li);
    if (!depth1) return;

    depth1.addEventListener("click", (e) => {
      const hasSub = !!depth2;
      if (!hasSub && !mq.matches) return; // 모바일에서 서브메뉴 없으면 기본 링크 동작 허용

      e.preventDefault();
      const isActive = depth1.classList.contains("active");
      $$(".depth1").forEach((d) => d.classList.remove("active"));
      if (!isActive) depth1.classList.add("active");
    });

    /* ── PC 전용: hover → open (항상 등록, 모바일에선 no-op) ── */
    let leaveTimer = null;
    li.addEventListener("mouseenter", () => {
      if (!mq.matches) return;
      clearTimeout(leaveTimer);
      depth1.classList.add("open");
    });
    li.addEventListener("mouseleave", () => {
      if (!mq.matches) return;
      leaveTimer = setTimeout(() => {
        depth1.classList.remove("open");
      }, 100);
    });
    if (depth2) {
      depth2.addEventListener("mouseenter", () => {
        if (!mq.matches) return;
        clearTimeout(leaveTimer);
        depth1.classList.add("open");
      });
      depth2.addEventListener("mouseleave", () => {
        if (!mq.matches) return;
        leaveTimer = setTimeout(() => {
          depth1.classList.remove("open");
        }, 100);
      });
    }

    /* ── PC 전용: depth3 hover → depth2__menu active ── */
    if (depth2) {
      const depth2Menus = $$(".depth2__menu", depth2);
      const depth3Items = $$(".depth3 a", depth2);

      depth3Items.forEach((a) => {
        const parentDepth3 = a.closest(".depth3");
        const siblingMenu = parentDepth3
          ? parentDepth3.previousElementSibling
          : null;

        a.addEventListener("mouseenter", () => {
          if (!mq.matches) return;
          depth2Menus.forEach((m) => m.classList.remove("active"));
          if (siblingMenu && siblingMenu.classList.contains("depth2__menu")) {
            siblingMenu.classList.add("active");
          }
        });
      });
    }
  });

  /* ── PC 전용: 메뉴 외부 클릭 시 active 초기화 (모바일에선 no-op) ── */
  document.addEventListener("click", (e) => {
    if (!mq.matches) return;
    if (!e.target.closest(".headerWrap__menu")) {
      $$(".depth1").forEach((d) => d.classList.remove("active"));
    }
  });

  /* ── 모드 전환 시 잔여 상태 정리 ── */
  mq.addEventListener("change", () => {
    header.classList.remove("openM");
    $$(".depth1").forEach((d) => d.classList.remove("active", "open"));
  });
})();

/* ==============================
         centerInfo (아산나눔재단 소식) 슬라이드
         – 카드 4개씩 노출, 이전/다음 버튼, pager 업데이트
      ============================== */
(function () {
  const wrap = $(".cardSlideWrap");
  if (!wrap) return;

  const cards = $$(":scope > div", wrap); // news01~04
  const btnPrev = $(".centerInfo__arrowBtn button:first-child");
  const btnNext = $(".centerInfo__arrowBtn button:last-child");
  const pagerSpan = $(".centerInfo__pager span");
  const pagerTotal = $(".centerInfo__pager p");

  const VISIBLE = window.innerWidth >= 1024 ? 4 : 1;
  let current = 0;
  const total = cards.length;

  if (!total) return;

  /* 초기 세팅: 첫 번째만 표시 (PC는 모두 표시 → float 레이아웃 그대로) */
  function isMobile() {
    return window.innerWidth < 1024;
  }

  function showCard(idx) {
    if (!isMobile()) return; // PC 는 CSS float으로 처리
    cards.forEach((c, i) => {
      c.style.display = i === idx ? "" : "none";
    });
  }

  function updatePager(idx) {
    if (pagerSpan) pagerSpan.textContent = idx + 1;
    if (pagerTotal) {
      // total 텍스트가 "18" 이런 형태 → 유지, span만 교체
      const totalNum = pagerTotal.querySelector("span");
      if (totalNum) totalNum.textContent = idx + 1;
    }
  }

  function goTo(idx) {
    current = (idx + total) % total;
    showCard(current);
    if (pagerSpan) pagerSpan.textContent = current + 1;
  }

  btnPrev && btnPrev.addEventListener("click", () => goTo(current - 1));
  btnNext && btnNext.addEventListener("click", () => goTo(current + 1));

  /* 초기 실행 */
  goTo(0);

  /* 리사이즈 대응 */
  window.addEventListener(
    "resize",
    () => {
      if (!isMobile()) {
        cards.forEach((c) => (c.style.display = ""));
      } else {
        showCard(current);
      }
    },
    { passive: true },
  );
})();

/* ==============================
         leftInfo (사업 섹션) 슬라이드
         – hashCardWrap li 를 1개씩 슬라이드 (모바일)
         – PC 는 float 레이아웃(3개 동시 표시) 유지
      ============================== */
(function () {
  const leftInfoSections = $$(".leftInfo");

  leftInfoSections.forEach((section) => {
    const items = $$(".hashCardWrap > li", section);
    const btnPrev = $(".leftInfo__arrowBtn button:first-child", section);
    const btnNext = $(".leftInfo__arrowBtn button:last-child", section);
    const pagerSpan = $(".leftInfo__pager span", section);

    if (!items.length) return;

    let current = 0;
    const total = items.length;

    function isMobile() {
      return window.innerWidth < 1024;
    }

    function showItem(idx) {
      if (!isMobile()) {
        items.forEach((el) => (el.style.display = ""));
        return;
      }
      items.forEach((el, i) => {
        el.style.display = i === idx ? "" : "none";
      });
      if (pagerSpan) pagerSpan.textContent = idx + 1;
    }

    function goTo(idx) {
      current = (idx + total) % total;
      showItem(current);
    }

    btnPrev && btnPrev.addEventListener("click", () => goTo(current - 1));
    btnNext && btnNext.addEventListener("click", () => goTo(current + 1));

    /* 초기 실행 */
    goTo(0);

    window.addEventListener("resize", () => showItem(current), {
      passive: true,
    });
  });
})();

/* ==============================
         sub-tab-wrap — hash 기반 탭 활성화
         – 탭 클릭 → anchor href → URL hash 변경 → activeTab() 실행
         – 직접 URL hash 접근 시 load 이벤트로 초기 탭 설정
      ============================== */
(function () {
  if (!$(".sub-tab-wrap")) return;

  function activeTab() {
    const hash = window.location.hash;
    $$(".sub-tab li").forEach((li) => li.classList.remove("on"));

    if (!hash) {
      const first = $(".sub-tab li:first-child");
      if (first) first.classList.add("on");
    } else {
      const cleanHash = hash.slice(1);
      const target = $(`.sub-tab li[data-tab="${cleanHash}"]`);
      if (target) {
        target.classList.add("on");
      } else {
        const first = $(".sub-tab li:first-child");
        if (first) first.classList.add("on");
      }
    }
  }

  window.addEventListener("hashchange", activeTab);
  window.addEventListener("load", activeTab);
})();

/* ==============================
         topBtn (TOP 버튼) 클릭 → 페이지 최상단 이동
      ============================== */
(function () {
  const topBtn = $(".topBtn");
  if (!topBtn) return;

  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
