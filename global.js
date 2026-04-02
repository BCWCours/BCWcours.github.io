(() => {
  const header = document.querySelector("header");
  const burger = document.querySelector(".burger");
  const nav = document.querySelector("header nav");
  const year = document.getElementById("year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (burger && nav) {
    burger.addEventListener("click", () => {
      nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      if (nav) {
        nav.classList.remove("open");
      }
      if (burger) {
        burger.setAttribute("aria-expanded", "false");
      }
    });
  });

  function syncHeaderState() {
    if (!header) {
      return;
    }
    header.classList.toggle("is-hidden", window.scrollY > 10);
  }

  function initRevealAnimation() {
    if (!window.IntersectionObserver) {
      return;
    }

    const targets = document.querySelectorAll(
      ".card, .offer-card, .service-card, .testimonial-card, .faq-item, .contact-line, .contact-quick-btn, .contact-primary-card, .final-cta-card"
    );

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    targets.forEach((target) => {
      target.classList.add("reveal");
      observer.observe(target);
    });
  }

  function initHeroRotator() {
    const output = document.querySelector("[data-hero-rotator-output]");
    if (!output) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let words = [];
    let currentIndex = 0;
    let intervalId = null;

    function collectWords() {
      return Array.from(document.querySelectorAll("[data-hero-rotate-item]"))
        .map((node) => node.textContent.trim())
        .filter(Boolean);
    }

    function renderWord(nextWord, shouldAnimate) {
      if (!nextWord) {
        return;
      }

      if (!shouldAnimate || prefersReducedMotion) {
        output.textContent = nextWord;
        return;
      }

      output.classList.remove("is-entering");
      output.classList.add("is-leaving");

      window.setTimeout(() => {
        output.textContent = nextWord;
        output.classList.remove("is-leaving");
        output.classList.add("is-entering");
      }, 130);
    }

    function rotateOnce() {
      words = collectWords();
      if (words.length < 2) {
        return;
      }
      currentIndex = (currentIndex + 1) % words.length;
      renderWord(words[currentIndex], true);
    }

    function startRotation() {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(rotateOnce, 2200);
    }

    words = collectWords();
    if (!words.length) {
      return;
    }

    output.textContent = words[0];

    if (words.length > 1 && !prefersReducedMotion) {
      startRotation();
    }

    document.addEventListener("bcw:language-change", () => {
      words = collectWords();
      currentIndex = 0;
      renderWord(words[0], false);
      if (words.length > 1 && !prefersReducedMotion) {
        startRotation();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (prefersReducedMotion || words.length < 2) {
        return;
      }
      if (document.hidden) {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        startRotation();
      }
    });
  }

  function initMatiereTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    if (!tabBtns.length) return;

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("is-active"));
        const panel = document.getElementById("tab-" + btn.dataset.tab);
        if (panel) panel.classList.add("is-active");
      });
    });
  }

  function initYearField() {
    const niveauRadios = document.querySelectorAll('input[name="niveau"]');
    if (!niveauRadios.length) return;
    const wrap = document.getElementById("school-year-wrap");
    if (!wrap) return;

    const selects = {
      "Primaire": document.getElementById("select-primaire"),
      "Secondaire": document.getElementById("select-secondaire"),
      "Enseignement supérieur": document.getElementById("select-superieur"),
      "Autre": document.getElementById("input-autre"),
    };

    function showYearFor(niveau) {
      // hide + disable all
      Object.values(selects).forEach((el) => {
        if (!el) return;
        el.style.display = "none";
        el.disabled = true;
        el.value = el.tagName === "SELECT" ? "" : "";
      });
      wrap.style.display = "none";

      const target = selects[niveau];
      if (!target) return;
      wrap.style.display = "block";
      target.style.display = "block";
      target.disabled = false;
    }

    niveauRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) showYearFor(radio.value);
      });
    });
  }

  function initSourceOther() {
    const sel = document.getElementById("source-channel-select");
    const wrap = document.getElementById("source-other-wrap");
    const input = document.getElementById("source-channel-other");
    if (!sel || !wrap || !input) return;

    sel.addEventListener("change", () => {
      if (sel.value === "Autre") {
        wrap.style.display = "block";
        input.required = true;
      } else {
        wrap.style.display = "none";
        input.required = false;
        input.value = "";
      }
    });
  }

  initHeroRotator();
  initRevealAnimation();
  initMatiereTabs();
  initYearField();
  initSourceOther();
  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
})();
