(() => {
  "use strict";

  const root = document.documentElement;
  const storageKey = "portfolio-theme";
  const systemTheme =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  let userTheme = null;
  let themeButton;
  let themeLabel;

  try {
    const savedTheme = window.localStorage.getItem(storageKey);
    if (savedTheme === "dark" || savedTheme === "light") userTheme = savedTheme;
  } catch {
    // System defaults and the current page's toggle work without storage.
  }

  const applyTheme = () => {
    const theme = userTheme || (systemTheme?.matches ? "dark" : "light");
    root.dataset.theme = theme;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor)
      themeColor.content = theme === "dark" ? "#0b0b0e" : "#ffffff";

    if (themeButton) {
      const action = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
      themeButton.setAttribute("aria-label", action);
      themeButton.setAttribute("title", action);
    }
    if (themeLabel)
      themeLabel.textContent = theme === "dark" ? "Dark" : "Light";
  };

  // This script runs synchronously before the stylesheet to avoid a theme flash.
  applyTheme();

  const initialize = () => {
    themeButton = document.querySelector("[data-theme-toggle]");
    themeLabel = themeButton?.querySelector("[data-theme-label]");
    applyTheme();

    themeButton?.addEventListener("click", () => {
      userTheme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(storageKey, userTheme);
      } catch {
        // Keep the explicit choice for this page even when it cannot be saved.
      }
      applyTheme();
    });
  };

  const followSystemTheme = () => {
    if (!userTheme) applyTheme();
  };
  if (systemTheme?.addEventListener) {
    systemTheme.addEventListener("change", followSystemTheme);
  } else if (systemTheme?.addListener) {
    systemTheme.addListener(followSystemTheme);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
