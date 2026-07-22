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
         – PC(≥1024px): 화면 폭에 맞춰 노출 개수 자동 계산, transform 슬라이드(기존과 동일)
         – 태블릿·모바일(<1024px): 1개만 노출, 무한 루프(양끝에서 순환), 가운데 정렬
      ============================== */
(function () {
  const viewport = $(".cardSlideWrap__viewport");
  const track = $(".cardSlideWrap__track");
  if (!viewport || !track) return;

  const cards = $$(":scope > div", track); // news01~08
  const btnPrev = $(".centerInfo__arrowBtn button:first-child");
  const btnNext = $(".centerInfo__arrowBtn button:last-child");
  const pagerSpan = $(".centerInfo__pager span");
  const total = cards.length;

  if (!total) return;

  let current = 0;
  let perView = 1;

  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  /* ── PC: 실측 폭 기준 개수 계산 후 transform 이동, 경계에서 정지 ── */
  function unitWidth() {
    const style = getComputedStyle(cards[0]);
    return cards[0].offsetWidth + parseFloat(style.marginRight || 0);
  }

  function getPerView() {
    const unit = unitWidth();
    if (!unit) return 1;
    return Math.max(
      1,
      Math.min(total, Math.floor((viewport.offsetWidth + 1) / unit)),
    );
  }

  function maxIndexPC() {
    return Math.max(0, total - perView);
  }

  function renderPC() {
    cards.forEach((c) => (c.style.display = ""));
    track.style.transform = `translateX(-${current * unitWidth()}px)`;
    if (pagerSpan) pagerSpan.textContent = current + 1;
    if (btnPrev) btnPrev.disabled = current <= 0;
    if (btnNext) btnNext.disabled = current >= maxIndexPC();
  }

  /* ── 태블릿/모바일: 1개만 표시, 양끝 순환(무한 루프) ── */
  function renderLoop() {
    track.style.transform = "";
    cards.forEach((c, i) => {
      c.style.display = i === current ? "" : "none";
    });
    if (pagerSpan) pagerSpan.textContent = current + 1;
    if (btnPrev) btnPrev.disabled = false;
    if (btnNext) btnNext.disabled = false;
  }

  function render() {
    isDesktop() ? renderPC() : renderLoop();
  }

  function goTo(idx) {
    current = isDesktop()
      ? Math.max(0, Math.min(idx, maxIndexPC()))
      : ((idx % total) + total) % total; // 무한 루프
    render();
  }

  btnPrev &&
    btnPrev.addEventListener("click", () =>
      goTo(current - (isDesktop() ? perView : 1)),
    );
  btnNext &&
    btnNext.addEventListener("click", () =>
      goTo(current + (isDesktop() ? perView : 1)),
    );

  function refresh() {
    perView = isDesktop() ? getPerView() : 1;
    goTo(current); // 브레이크포인트 전환/폭 변경 시 재계산
  }

  refresh();

  let resizeTimer;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 150);
    },
    { passive: true },
  );
})();

/* ==============================
         leftInfo 카드 슬라이드 — mainBiz / mainStartup / mainInno / mainEco
         – PC(≥1024px): 3개 고정 노출, 무한 루프(전체 세트를 앞뒤로 복제해
           경계를 넘어가면 transitionend 시점에 무애니메이션으로 순간이동)
         – 태블릿·모바일(<1024px): 1개만 노출, 무한 루프(양끝에서 순환),
           ul(.hashCardWrap)에 justify-content:center 로 가운데 정렬
      ============================== */
(function () {
  function initFixedCountSlider(section, perViewDesktop) {
    const viewport = $(".hashCardWrap__viewport", section);
    const track = $(".hashCardWrap", section);
    if (!viewport || !track) return;

    const realCards = $$(":scope > li", track);
    const btnPrev = $(".leftInfo__arrowBtn button:first-child", section);
    const btnNext = $(".leftInfo__arrowBtn button:last-child", section);
    const pagerSpan = $(".leftInfo__pager span", section);
    const total = realCards.length;

    if (!total) return;

    /* PC 무한 루프용: 전체 세트를 앞/뒤로 복제 → [클론][실제][클론] */
    const clonesBefore = realCards.map((c) => {
      const cl = c.cloneNode(true);
      cl.classList.add("pc-clone");
      return cl;
    });
    const clonesAfter = realCards.map((c) => {
      const cl = c.cloneNode(true);
      cl.classList.add("pc-clone");
      return cl;
    });
    clonesBefore
      .slice()
      .reverse()
      .forEach((cl) => track.prepend(cl));
    clonesAfter.forEach((cl) => track.append(cl));
    const allCards = $$(":scope > li", track);

    let pcIndex = total; // 실제 세트 시작 위치(앞쪽 클론 total개 다음)
    let mobileIndex = 0;

    function isDesktop() {
      return window.innerWidth >= 1024;
    }

    function unitWidth() {
      const style = getComputedStyle(realCards[0]);
      return realCards[0].offsetWidth + parseFloat(style.marginRight || 0);
    }

    /* ── PC: 실측 폭으로 transform 이동, 경계에서 순간이동(무한 루프) ── */
    function renderPC(animate) {
      allCards.forEach((c) => (c.style.display = ""));
      track.style.transition = animate
        ? "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)"
        : "none";
      track.style.transform = `translateX(-${pcIndex * unitWidth()}px)`;
      const realIdx = ((pcIndex - total) % total + total) % total;
      if (pagerSpan) pagerSpan.textContent = realIdx + 1;
      if (btnPrev) btnPrev.disabled = false;
      if (btnNext) btnNext.disabled = false;
    }

    let boundaryTimer = null;
    const TRANSITION_MS = 450;

    function goToPC(idx, animate = true) {
      pcIndex = idx;
      renderPC(animate);
      clearTimeout(boundaryTimer);
      if (animate) {
        /* 애니메이션 종료 시점(transitionend 대신 지속시간 기반)에
           클론 구간에 도달했으면 무애니메이션으로 실제 구간에 순간이동 */
        boundaryTimer = setTimeout(() => {
          if (pcIndex >= total * 2) {
            goToPC(pcIndex - total, false);
          } else if (pcIndex < 0) {
            goToPC(pcIndex + total, false);
          }
        }, TRANSITION_MS + 30);
      }
    }

    /* ── 태블릿/모바일: 1개만 표시, 양끝 순환(무한 루프) ── */
    function renderMobile() {
      track.style.transition = "none";
      track.style.transform = "";
      allCards.forEach((c) => (c.style.display = "none"));
      realCards[mobileIndex].style.display = "";
      if (pagerSpan) pagerSpan.textContent = mobileIndex + 1;
      if (btnPrev) btnPrev.disabled = false;
      if (btnNext) btnNext.disabled = false;
    }

    function goToMobile(idx) {
      mobileIndex = ((idx % total) + total) % total;
      renderMobile();
    }

    function render() {
      isDesktop() ? renderPC(false) : renderMobile();
    }

    btnPrev &&
      btnPrev.addEventListener("click", () => {
        if (isDesktop()) goToPC(pcIndex - perViewDesktop);
        else goToMobile(mobileIndex - 1);
      });
    btnNext &&
      btnNext.addEventListener("click", () => {
        if (isDesktop()) goToPC(pcIndex + perViewDesktop);
        else goToMobile(mobileIndex + 1);
      });

    render();

    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
      },
      { passive: true },
    );
  }

  [".mainBiz", ".mainStartup", ".mainInno", ".mainEco"].forEach((sel) => {
    const section = $(sel);
    if (section) initFixedCountSlider(section, 3);
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

/* ==============================
         main__pagenation : 스크롤 위치에 맞춰 active 버튼 전환
         – 뷰포트 중앙이 위치한 섹션을 찾아 해당 버튼에 active 부여
      ============================== */
(function () {
  const pagenation = $(".main__pagenation");
  if (!pagenation) return;

  const buttons = $$("button", pagenation);
  const sections = $$(
    ".main__visual, .mainNews, .mainBiz, .mainStartup, .mainInno, .mainEco, footer"
  );
  if (buttons.length !== sections.length) return;

  function setActive() {
    const centerY = window.scrollY + window.innerHeight / 2;
    let idx = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= centerY) idx = i;
    });
    buttons.forEach((btn) => btn.classList.remove("active"));
    buttons[idx].classList.add("active");
  }

  window.addEventListener("scroll", setActive, { passive: true });
  window.addEventListener("resize", setActive);
  setActive();
})();
