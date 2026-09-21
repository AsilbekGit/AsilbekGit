(() => {
  "use strict";

  const initialize = () => {
    const root = document.documentElement;
    // Clear the previous design's theme attribute on a restored page.
    root.removeAttribute("data-theme");

    const reducedMotionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const motionButton = document.querySelector("[data-motion-toggle]");
    const motionLabel = motionButton?.querySelector("[data-motion-label]");
    const revealElements = [...document.querySelectorAll("[data-reveal]")];
    const motionStorageKey = "portfolio-motion";
    let userPausedMotion = false;
    let revealObserver;

    try {
      userPausedMotion =
        window.localStorage.getItem(motionStorageKey) === "reduce";
    } catch {
      // Motion controls also work when browser storage is unavailable.
    }

    const showAllReveals = () => {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      revealObserver?.disconnect();
    };

    const updateMotionPreference = () => {
      const systemPausedMotion = Boolean(reducedMotionQuery?.matches);
      const paused = systemPausedMotion || userPausedMotion;
      root.classList.toggle("reduce-motion", paused);

      if (motionButton) {
        const label = systemPausedMotion
          ? "Animations paused by your system setting"
          : paused
            ? "Resume animations"
            : "Pause animations";
        motionButton.setAttribute("aria-pressed", String(paused));
        motionButton.setAttribute("aria-label", label);
        motionButton.setAttribute("title", label);
        motionButton.disabled = systemPausedMotion;
        if (motionLabel) {
          motionLabel.textContent = systemPausedMotion
            ? "Motion off · system"
            : paused
              ? "Motion off"
              : "Motion on";
        }
      }

      if (paused) showAllReveals();
    };

    updateMotionPreference();

    motionButton?.addEventListener("click", () => {
      if (reducedMotionQuery?.matches) return;
      userPausedMotion = !userPausedMotion;
      try {
        window.localStorage.setItem(
          motionStorageKey,
          userPausedMotion ? "reduce" : "full",
        );
      } catch {
        // The current page still honors the user's choice.
      }
      updateMotionPreference();
    });

    if (reducedMotionQuery?.addEventListener) {
      reducedMotionQuery.addEventListener("change", updateMotionPreference);
    } else if (reducedMotionQuery?.addListener) {
      reducedMotionQuery.addListener(updateMotionPreference);
    }

    if (
      "IntersectionObserver" in window &&
      !root.classList.contains("reduce-motion")
    ) {
      try {
        revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
        );
        revealElements.forEach((element) => revealObserver.observe(element));
        root.classList.add("motion-ready");
      } catch {
        showAllReveals();
      }
    } else {
      showAllReveals();
    }

    const menuButton = document.querySelector("[data-menu-toggle]");
    const navigation = document.getElementById("primary-navigation");
    const closeMenu = (restoreFocus = false) => {
      navigation?.classList.remove("is-open");
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "Open navigation");
      if (restoreFocus) menuButton?.focus();
    };

    if (menuButton && navigation) {
      menuButton.setAttribute("aria-controls", navigation.id);
      closeMenu();
      menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") !== "true";
        navigation.classList.toggle("is-open", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute(
          "aria-label",
          isOpen ? "Close navigation" : "Open navigation",
        );
      });
      navigation.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a[href]"))
          closeMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (
          event.key === "Escape" &&
          menuButton.getAttribute("aria-expanded") === "true"
        ) {
          event.preventDefault();
          closeMenu(true);
        }
      });
      document.addEventListener("click", (event) => {
        if (
          event.target instanceof Node &&
          !navigation.contains(event.target) &&
          !menuButton.contains(event.target)
        ) {
          closeMenu();
        }
      });
    }

    const copyButton = document.querySelector("[data-copy-email]");
    const copyStatus = document.getElementById("copy-status");
    copyButton?.addEventListener("click", async () => {
      const email = (copyButton.dataset.copyEmail || "").trim();
      if (!email) return;
      copyButton.disabled = true;
      if (copyStatus) copyStatus.textContent = "";
      try {
        if (!navigator.clipboard?.writeText)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(email);
        if (copyStatus) copyStatus.textContent = "Email address copied.";
      } catch {
        if (copyStatus)
          copyStatus.textContent = `Copy this email address: ${email}`;
      } finally {
        copyButton.disabled = false;
      }
    });

    document.querySelectorAll("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });

    const header = document.querySelector(".site-header");
    const progress = document.getElementById("reading-progress");
    const sectionLinks = [...document.querySelectorAll(".nav-link[href^='#']")]
      .map((link) => {
        try {
          return {
            link,
            section: document.getElementById(
              decodeURIComponent(link.hash.slice(1)),
            ),
          };
        } catch {
          return { link, section: null };
        }
      })
      .filter(({ section }) => section);
    let currentSection = null;
    let pageUpdatePending = false;

    const updateActiveSection = () => {
      if (!sectionLinks.length) return;
      const activationLine = Math.max(100, window.innerHeight * 0.32);
      let activeSection = sectionLinks[0].section;
      sectionLinks.forEach(({ section }) => {
        if (section.getBoundingClientRect().top <= activationLine)
          activeSection = section;
      });
      if (activeSection === currentSection) return;
      currentSection = activeSection;
      sectionLinks.forEach(({ link, section }) => {
        const isActive = section === activeSection;
        link.classList.toggle("is-active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const updatePage = () => {
      pageUpdatePending = false;
      const scrollingElement = document.scrollingElement || root;
      const scrollTop = Math.max(
        0,
        window.scrollY || scrollingElement.scrollTop || 0,
      );
      const scrollableHeight = Math.max(
        0,
        scrollingElement.scrollHeight - window.innerHeight,
      );
      const ratio = scrollableHeight
        ? Math.min(1, scrollTop / scrollableHeight)
        : 0;
      if (progress) progress.style.transform = `scaleX(${ratio})`;
      header?.classList.toggle("is-scrolled", scrollTop > 16);
      updateActiveSection();
    };

    function schedulePageUpdate() {
      if (pageUpdatePending) return;
      pageUpdatePending = true;
      if (typeof window.requestAnimationFrame === "function")
        window.requestAnimationFrame(updatePage);
      else window.setTimeout(updatePage, 16);
    }

    window.addEventListener("scroll", schedulePageUpdate, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth >= 800) closeMenu();
        schedulePageUpdate();
      },
      { passive: true },
    );
    window.addEventListener("load", schedulePageUpdate, { once: true });
    if ("ResizeObserver" in window) {
      const layoutObserver = new ResizeObserver(schedulePageUpdate);
      layoutObserver.observe(document.body);
    }

    updatePage();
    root.classList.remove("no-js");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
