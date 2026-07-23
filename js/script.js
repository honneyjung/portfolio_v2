// ================================================================
// main.js — Portfolio interactions
// ================================================================

document.addEventListener("DOMContentLoaded", function () {
  const mainPanel = document.getElementById("mainPanel");
  const sections = Array.from(document.querySelectorAll(".section"));
  const rnavBtns = document.querySelectorAll(".rnav-btn[data-section]");

  // ================================================================
  // SECTION NAVIGATION — scroll to section inside main panel
  // ================================================================
  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    mainPanel.scrollTo({
      top: target.offsetTop,
      behavior: "smooth",
    });
  }

  rnavBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToSection(this.dataset.section);
    });
  });

  // ================================================================
  // ACTIVE NAV — update rnav active state on scroll
  // ================================================================
  function updateActiveNav() {
    const scrollTop = mainPanel.scrollTop;
    const panelH = mainPanel.clientHeight;

    let activeId = sections[0].id;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      if (scrollTop >= top - panelH * 0.35) {
        activeId = sec.id;
      }
    });

    rnavBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === activeId);
    });
  }

  mainPanel.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  // ================================================================
  // PREV / NEXT section scroll
  // ================================================================
  const scrollPrev = document.getElementById("scrollPrev");
  const scrollNext = document.getElementById("scrollNext");

  function getCurrentSectionIndex() {
    const scrollTop = mainPanel.scrollTop;
    const panelH = mainPanel.clientHeight;
    let idx = 0;
    sections.forEach((sec, i) => {
      if (scrollTop >= sec.offsetTop - panelH * 0.3) idx = i;
    });
    return idx;
  }

  scrollPrev &&
    scrollPrev.addEventListener("click", () => {
      const idx = getCurrentSectionIndex();
      if (idx > 0) scrollToSection(sections[idx - 1].id);
    });

  scrollNext &&
    scrollNext.addEventListener("click", () => {
      const idx = getCurrentSectionIndex();
      if (idx < sections.length - 1) scrollToSection(sections[idx + 1].id);
    });

  // ================================================================
  // TESTIMONIALS SLIDER
  // ================================================================
  const track = document.getElementById("testimonialTrack");
  const dotsContainer = document.getElementById("testimonialDots");

  if (track && dotsContainer) {
    const items = track.querySelectorAll(".testimonial-item");
    let current = 0;

    items.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(index) {
      current = index;
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsContainer.querySelectorAll(".dot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
      });
    }

    setInterval(() => goTo((current + 1) % items.length), 5000);
  }

  // ================================================================
  // PORTFOLIO SLIDER — Mystory-style with filter integration
  // ================================================================
  (function () {
    const track = document.getElementById("pfTrack");
    const viewport = document.getElementById("pfViewport");
    const dotsWrap = document.getElementById("pfDots");
    const btnPrev = document.getElementById("pfPrev");
    const btnNext = document.getElementById("pfNext");
    const filterBtns = document.querySelectorAll(".filter-btn");

    if (!track) return;

    const allCards = Array.from(track.querySelectorAll(".pf-card"));
    let visibleCards = [...allCards]; // cards currently shown
    let currentIndex = 0; // index of first visible card in strip
    let perPage = getPerPage(); // cards visible at once
    // 카드가 한 화면에 다 들어오면(perPage 이하) 루프/클론/오토플레이를 끈다.
    let loopEnabled = visibleCards.length > perPage;

    function getPerPage() {
      const vw = viewport ? viewport.offsetWidth : window.innerWidth;
      if (vw < 560) return 1;
      if (vw < 860) return 2;
      return 3;
    }

    // ── Build dots based on number of "pages" ──────────────────
    function buildDots() {
      dotsWrap.innerHTML = "";
      const pages = Math.ceil(visibleCards.length / perPage);
      if (pages <= 1) {
        dotsWrap.style.display = "none"; // 한 페이지면 도트 숨김
        return;
      }
      dotsWrap.style.display = "";
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement("button");
        dot.className = "pf-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Page ${i + 1}`);
        dot.addEventListener("click", () => goTo(i * perPage));
        dotsWrap.appendChild(dot);
      }
    }

    // ── Update active dot ───────────────────────────────────────
    function updateDots() {
      const dots = dotsWrap.querySelectorAll(".pf-dot");
      const page = Math.round(currentIndex / perPage);
      dots.forEach((d, i) => d.classList.toggle("active", i === page));
    }

    // ── Update arrow disabled state (루프일 때만 활성화) ──
    function updateArrows() {
      btnPrev.disabled = !loopEnabled;
      btnNext.disabled = !loopEnabled;
    }

    // ── Reorder track so only visibleCards appear, in order ─────
    function rebuildTrack() {
      allCards.forEach((c) => {
        c.classList.remove("pf-hidden");
        c.style.display = "";
      });
      allCards.forEach((c) => {
        if (!visibleCards.includes(c)) {
          c.style.display = "none";
        }
      });
    }

    // ── 1번: 무한 루프를 위한 클론 생성 ────────────────────────
    function setupClones() {
      track.querySelectorAll(".pf-clone").forEach((c) => c.remove());
      if (!loopEnabled) return; // 루프가 아니면 클론을 만들지 않는다 (중복 방지)

      const clonesBefore = visibleCards.map((c) => {
        const cl = c.cloneNode(true);
        cl.classList.add("pf-clone");
        return cl;
      });
      const clonesAfter = visibleCards.map((c) => {
        const cl = c.cloneNode(true);
        cl.classList.add("pf-clone");
        return cl;
      });

      clonesBefore.reverse().forEach((cl) => track.prepend(cl));
      clonesAfter.forEach((cl) => track.append(cl));
    }

    // ── 2번: goTo — 무한 루프 버전 ─────────────────────────────
    function goTo(idx, animate = true) {
      const cloneCount = loopEnabled ? visibleCards.length : 0;
      currentIndex = idx;

      const cardEl = track.querySelector(".pf-card");
      if (!cardEl) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 20.5;
      const cardW = cardEl.offsetWidth;
      const offset = (currentIndex + cloneCount) * (cardW + gap);

      if (!animate) {
        track.style.transition = "none";
      } else {
        track.style.transition = "transform 0.45s cubic-bezier(.4,0,.2,1)";
      }
      track.style.transform = `translateX(-${offset}px)`;

      updateDots();
      updateArrows();
    }

    // ── Apply a filter ──────────────────────────────────────────
    function applyFilter(filter) {
      currentIndex = 0;
      visibleCards =
        filter === "all"
          ? [...allCards]
          : allCards.filter((c) =>
              c.dataset.category.split(" ").includes(filter),
            );
      loopEnabled = visibleCards.length > perPage;

      rebuildTrack();
      buildDots();
      // 6번: 클론 재생성 + 위치 초기화 + 오토플레이 리셋
      setupClones();
      goTo(0, false);
      startAuto(); // loopEnabled 아니면 내부에서 멈춘 상태 유지
    }

    // ── Filter buttons ──────────────────────────────────────────
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        filterBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        applyFilter(this.dataset.filter);
      });
    });

    // ── 3번: transitionend — 경계에서 순간이동 (무한루프 핵심) ──
    // 카드 수가 perPage 배수가 아니어도 화면상 동일 위치로 순간이동해야
    // 되감기 없이 매끄럽게 이어진다. 0으로 리셋하지 않고 total 만큼 감아준다.
    track.addEventListener("transitionend", (e) => {
      if (!loopEnabled) return;
      if (e.target !== track || e.propertyName !== "transform") return;
      const total = visibleCards.length;
      if (currentIndex < 0 || currentIndex >= total) {
        currentIndex = ((currentIndex % total) + total) % total;
        goTo(currentIndex, false);
      }
    });

    // ── Arrow buttons ───────────────────────────────────────────
    btnPrev.addEventListener("click", () => {
      goTo(currentIndex - perPage);
      stopAuto();
      startAuto();
    });
    btnNext.addEventListener("click", () => {
      goTo(currentIndex + perPage);
      stopAuto();
      startAuto();
    });

    // ── Recalculate on resize ───────────────────────────────────
    window.addEventListener("resize", () => {
      const newPP = getPerPage();
      if (newPP !== perPage) {
        perPage = newPP;
        loopEnabled = visibleCards.length > perPage;
        currentIndex = 0;
        buildDots();
        setupClones();
        goTo(0, false);
        updateArrows();
        startAuto(); // loopEnabled 아니면 내부에서 멈춤
      }
    });

    // ── Touch / swipe support ───────────────────────────────────
    let touchStartX = 0;
    viewport.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true },
    );
    viewport.addEventListener("touchend", (e) => {
      const dx = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 50) {
        dx > 0 ? goTo(currentIndex + perPage) : goTo(currentIndex - perPage);
        stopAuto();
        startAuto();
      }
    });

    // ── 4번: 자동 슬라이드 (5초) ───────────────────────────────
    let autoTimer = null;

    function startAuto() {
      stopAuto();
      if (!loopEnabled) return; // 루프가 아니면 오토플레이 안 함
      autoTimer = setInterval(() => {
        goTo(currentIndex + perPage);
      }, 5000);
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    viewport.addEventListener("mouseenter", stopAuto);
    viewport.addEventListener("mouseleave", startAuto);

    // ── 7번: Init ───────────────────────────────────────────────
    rebuildTrack();
    setupClones();
    buildDots();
    updateArrows();
    goTo(0, false);
    startAuto();
  })();

  // ================================================================
  // SKILL BARS — animate on scroll into view (inside scrollable panel)
  // ================================================================
  const skillFills = document.querySelectorAll(".skill-fill");

  const skillObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fill = entry.target;
          fill.style.width = fill.dataset.width + "%";
          skillObserver.unobserve(fill);
        }
      });
    },
    {
      root: mainPanel,
      threshold: 0.2,
    },
  );

  skillFills.forEach((fill) => {
    fill.style.width = "0%";
    skillObserver.observe(fill);
  });

  // ================================================================
  // COUNTER ANIMATION
  // ================================================================
  const factNumbers = document.querySelectorAll(".fact-number");

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    function update(ts) {
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target).toLocaleString();
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { root: mainPanel, threshold: 0.4 },
  );

  factNumbers.forEach((el) => counterObserver.observe(el));

  // ================================================================
  // SCROLL REVEAL — for elements inside main panel
  // ================================================================
  const revealTargets = document.querySelectorAll(
    ".service-card, .blog-card, .portfolio-item, .timeline-item, .fact-item, .pricing-card",
  );

  revealTargets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = (i % 4) * 0.08 + "s";
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { root: mainPanel, threshold: 0.1 },
  );

  revealTargets.forEach((el) => revealObserver.observe(el));

  // ================================================================
  // CONTACT FORM
  // ================================================================
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const btn = this.querySelector("button[type=submit]");
      const orig = btn.textContent;
      btn.textContent = "✓ Message Sent!";
      btn.style.background = "#2ecc71";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = "";
        btn.disabled = false;
        this.reset();
      }, 3000);
    });
  }

  // ================================================================
  // PORTFOLIO MODAL
  // ================================================================
  (function () {
    const MODAL_DATA = {
      hemily: {
        title: "해밀리 헬스",
        cat: "Frontend(React)",
        img: "./images/img_project1.png",
        imgAlt: "해밀리 헬스",
        meta: [
          { label: "역할", value: "Frontend Developer" },
          { label: "기여도", value: "38%" },
          { label: "기간", value: "2026.07" },
        ],
        desc: "헬스케어 스타트업 해밀리의 신규 앱 프론트엔드 개발에 참여했습니다. 설문 기반 건강 유형 분류 화면부터 DNA 단계별 챌린지·리포트 UI까지 컴포넌트 설계 및 API 연동을 직접 담당했습니다.",
        tags: ["React 19", "TypeScript", "TanStack Query", "Zustand", "Vite", "TailwindCSS"],
        link: "./projects/hemily-health/index.html",
        indexLink: "./projects/hemily-health/sitemap.html",
      },
      "carenation-web": {
        title: "케어네이션 홈페이지 리뉴얼",
        cat: "Web",
        img: "./images/img_project4.jpg",
        imgAlt: "케어네이션 홈페이지",
        meta: [
          { label: "역할", value: "Web Publisher" },
          { label: "기여도", value: "100%" },
          { label: "페이지 수", value: "13 pages" },
        ],
        desc: "신규 서비스 추가에 따른 케어네이션 홈페이지 전면 리뉴얼을 담당했습니다. 페이지 구조 설계부터 퍼블리싱까지 단독으로 진행했으며, 기존 CSS를 SCSS로 리팩토링하여 유지보수성을 개선했습니다.",
        tags: ["HTML5", "CSS3", "SCSS", "jQuery", "반응형"],
        link: "./projects/carenation_v2/html/0.html",
        indexLink: "./projects/carenation_v2/index.html",
      },
      asan: {
        title: "아산나눔재단 웹사이트",
        cat: "Web",
        img: "./images/img_project5.jpg",
        imgAlt: "아산나눔재단 웹사이트",
        meta: [
          { label: "역할", value: "Web Publisher" },
          { label: "기여도", value: "100%" },
          { label: "페이지 수", value: "16 pages" },
        ],
        desc: "아산나눔재단 공식 홈페이지 클론 코딩을 작업했습니다. 시맨틱 마크업과 웹 접근성 기준을 준수하며 1920px~280px 반응형 레이아웃을 구현했습니다.",
        tags: ["HTML5", "CSS3", "SCSS", "반응형", "웹접근성"],
        link: "./projects/asan-nanum/html/0.html",
        indexLink: "./projects/asan-nanum/index.html",
      },
      "carenation-app": {
        title: "케어네이션 앱 UI",
        cat: "App",
        img: "./images/img_project2.jpg",
        imgIcon: "fas fa-mobile-alt",
        meta: [
          { label: "역할", value: "Web Publisher" },
          { label: "기여도", value: "100%" },
          { label: "페이지 수", value: "14 pages" },
        ],
        desc: "요양·간병 매칭 서비스 케어네이션의 모바일 앱 UI를 퍼블리싱했습니다. 모바일 환경 기준으로 컴포넌트를 설계하고 공통 스타일을 구조화했습니다.",
        tags: ["HTML5", "CSS3", "SCSS", "모바일 UI"],
        link: "./projects/care/html/0.html",
        indexLink: "./projects/care/index.html",
      },
      backoffice: {
        title: "경영진 관리자 대시보드",
        cat: "Dashboard",
        img: "./images/img_project3.jpg",
        imgIcon: "fas fa-th-large",
        meta: [
          { label: "역할", value: "Web Publisher" },
          { label: "기여도", value: "100%" },
          { label: "페이지 수", value: "66 pages" },
        ],
        desc: "백오피스 경영진 전용 관리자 대시보드를 퍼블리싱했습니다. 테이블·차트·모달·폼 등 다양한 공통 컴포넌트를 구조화하고, 대규모 페이지 구성을 체계적으로 관리했습니다.",
        tags: ["HTML5", "CSS3", "SCSS", "Dashboard", "공통 컴포넌트"],
        link: "./projects/backoffice-executive/html/1.html",
        indexLink: "./projects/backoffice-executive/index.html",
      },
    };

    const overlay = document.getElementById("pfModalOverlay");
    const closeBtn = document.getElementById("pfModalClose");
    if (!overlay) return;

    function openModal(id) {
      const data = MODAL_DATA[id];
      if (!data) return;

      // 이미지 / 미리보기
      const imgWrap = document.getElementById("pfModalImg");
      if (data.previewUrl) {
        imgWrap.innerHTML = `<iframe class="pf-modal-iframe" src="${data.previewUrl}" title="${data.title} 미리보기" loading="lazy"></iframe>`;
      } else if (data.img) {
        imgWrap.innerHTML = `<img src="${data.img}" alt="${data.imgAlt || data.title}" />`;
      } else {
        imgWrap.innerHTML = `<div class="pf-modal-img-placeholder"><i class="${data.imgIcon}"></i><span>이미지 준비 중</span></div>`;
      }

      document.getElementById("pfModalTitle").textContent = data.title;
      document.getElementById("pfModalCat").textContent = data.cat;

      // 메타
      document.getElementById("pfModalMeta").innerHTML = data.meta
        .map((m) => `<div class="pf-modal-meta-item"><span>${m.label}</span><p>${m.value}</p></div>`)
        .join("");

      document.getElementById("pfModalDesc").textContent = data.desc;

      // 태그
      document.getElementById("pfModalTags").innerHTML = data.tags
        .map((t) => `<span>${t}</span>`)
        .join("");

      // 링크
      const link = document.getElementById("pfModalLink");
      if (data.link && data.link !== "#") {
        link.href = data.link;
        link.style.display = "inline-flex";
      } else {
        link.style.display = "none";
      }

      const indexLink = document.getElementById("pfModalIndexLink");
      if (data.indexLink) {
        indexLink.href = data.indexLink;
        indexLink.style.display = "inline-flex";
      } else {
        indexLink.style.display = "none";
      }

      overlay.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // 카드 클릭 — 클론 포함 이벤트 위임 (cloneNode(true)로 data-modal 복사됨)
    document.getElementById("pfTrack").addEventListener("click", function (e) {
      const card = e.target.closest(".pf-card");
      if (!card) return;
      const id = card.dataset.modal;
      if (id) openModal(id);
    });

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  })();

  // ================================================================
  // HERO CHIP ANIMATION
  // ================================================================
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip, i) => {
    chip.style.opacity = "0";
    chip.style.transform = "translateY(12px)";
    chip.style.transition = `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`;
    setTimeout(() => {
      chip.style.opacity = "1";
      chip.style.transform = "translateY(0)";
    }, 100);
  });
});
