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

    // ── Update arrow disabled state (5번: 무한루프이므로 항상 활성화) ──
    function updateArrows() {
      btnPrev.disabled = false;
      btnNext.disabled = false;
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
      const cloneCount = visibleCards.length;
      currentIndex = idx;

      const cardEl = track.querySelector(".pf-card");
      if (!cardEl) return;
      const gap = 20;
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

      rebuildTrack();
      buildDots();
      // 6번: 클론 재생성 + 위치 초기화 + 오토플레이 리셋
      setupClones();
      goTo(0, false);
      startAuto();
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
    track.addEventListener("transitionend", () => {
      const total = visibleCards.length;
      if (currentIndex < 0) {
        currentIndex = total - perPage;
        goTo(currentIndex, false);
      } else if (currentIndex + perPage > total) {
        currentIndex = 0;
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
        currentIndex = 0;
        buildDots();
        setupClones();
        goTo(0, false);
        updateArrows();
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
