/* ============================================================
   THEME TOGGLE — light / dark
   Applica [data-theme] su <html> e salva la preferenza in
   localStorage ("jeba-theme"). Se non esiste una preferenza
   salvata, viene rispettata la preferenza di sistema.
   ============================================================ */
(function () {
    "use strict";

    const STORAGE_KEY = "jeba-theme";
    const root = document.documentElement;

    function applyTheme(theme) {
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
        } else {
            root.removeAttribute("data-theme");
        }
        document
            .querySelectorAll('[data-theme-toggle]')
            .forEach((el) => { el.checked = theme === "dark"; });
    }

    function currentTheme() {
        return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Sincronizza lo stato dei toggle con il tema già applicato
        // dallo snippet anti-flash nell'head.
        applyTheme(currentTheme());

        document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => {
            toggle.addEventListener("change", () => {
                const next = toggle.checked ? "dark" : "light";
                applyTheme(next);
                localStorage.setItem(STORAGE_KEY, next);
            });
        });
    });
})();
