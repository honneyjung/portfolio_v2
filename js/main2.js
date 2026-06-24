// style.scss is compiled to style.css (see style.scss for SCSS source)
// style.css is linked directly in index.html

document.addEventListener("DOMContentLoaded", function () {
  // ============================================================
  // MOBILE SIDEBAR TOGGLE
  // ============================================================
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const hamburger = document.getElementById("hamburger");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
  }

  hamburger && hamburger.addEventListener("click", openSidebar);
  sidebarClose && sidebarClose.addEventListener("click", closeSidebar);
  overlay && overlay.addEventListener("click", closeSidebar);

  // ============================================================
  // SMOOTH SCROLL + ACTIVE NAV
  // ============================================================
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".nav-link");

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        const offset = window.innerWidth <= 768 ? 64 : 0;
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
        if (window.innerWidth <= 768) closeSidebar();
      }
    });
  });

  // Intersection observer for active nav
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === "#" + id,
            );
          });
        }
      });
    },
    { rootMargin: "-30% 0px -60% 0px" },
  );

  sections.forEach((sec) => observer.observe(sec));

  // ============================================================
  // TESTIMONIALS SLIDER
  // ============================================================
  const track = document.getElementById("testimonialTrack");
  const dotsContainer = document.getElementById("testimonialDots");

  if (track && dotsContainer) {
    const items = track.querySelectorAll(".testimonial-item");
    let current = 0;

    // Create dots
    items.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(index) {
      current = index;
      track.style.transform = `translateX(-${current * 100}%)`;
      document.querySelectorAll(".testimonial-dots .dot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
      });
    }

    // Auto-play
    setInterval(() => goTo((current + 1) % items.length), 5000);
  }

  // ============================================================
  // PORTFOLIO FILTER
  // ============================================================
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const filter = this.dataset.filter;

      portfolioItems.forEach((item) => {
        if (filter === "all") {
          item.classList.remove("hidden");
        } else {
          const cats = item.dataset.category.split(" ");
          item.classList.toggle("hidden", !cats.includes(filter));
        }
      });
    });
  });

  // ============================================================
  // SKILL BARS ANIMATION (on scroll)
  // ============================================================
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
    { threshold: 0.3 },
  );

  skillFills.forEach((fill) => skillObserver.observe(fill));

  // ============================================================
  // FUN FACTS COUNTER ANIMATION
  // ============================================================
  const factNumbers = document.querySelectorAll(".fact-number");

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function update(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
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
    { threshold: 0.5 },
  );

  factNumbers.forEach((el) => counterObserver.observe(el));

  // ============================================================
  // CONTACT FORM
  // ============================================================
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

  // ============================================================
  // SCROLL REVEAL ANIMATION
  // ============================================================
  const revealEls = document.querySelectorAll(
    ".service-card, .blog-card, .portfolio-item, .timeline-item, .fact-item, .pricing-card, .certificate-card",
  );

  const style = document.createElement("style");
  style.textContent = `
    .reveal-el { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .reveal-el.visible { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);

  revealEls.forEach((el, i) => {
    el.classList.add("reveal-el");
    el.style.transitionDelay = (i % 4) * 0.1 + "s";
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  // ============================================================
  // TYPING EFFECT for hero labels
  // ============================================================
  const labels = document.querySelectorAll(".typing-label");
  labels.forEach((label, i) => {
    label.style.animationDelay = i * 0.3 + "s";
  });

  const typingStyle = document.createElement("style");
  typingStyle.textContent = `
    .typing-label {
      animation: fadeSlideIn 0.6s ease forwards;
      opacity: 0;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(typingStyle);
});
