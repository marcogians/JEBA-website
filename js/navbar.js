/* ============================================================
   JEBA NAVBAR
   - Desktop: la barra si contrae in modo continuo mentre si
     scorre, diventando una barra flottante in vetro smerigliato.
     Non c'è uno swap tra due elementi né due stati discreti:
     una sola variabile CSS (--nav-progress, 0→1) interpola
     margini, raggio, altezza, sfocatura e trasparenza.
   - Il valore viene inseguito con un lerp (SMOOTHING), così anche
     uno scroll a scatti resta morbido.
   - Gestisce anche progress bar e menu mobile.
   ============================================================ */
(function () {
    "use strict";

    const START_AT = 8;    // px di scroll da cui inizia la contrazione
    const RANGE = 190;     // px di scroll in cui si completa (0 → 1)
    const SMOOTHING = .16; // quanto la barra "insegue" il valore target per frame
    const DESKTOP_MIN = 900;

    document.addEventListener("DOMContentLoaded", () => {
        const navbar = document.querySelector(".navbar");
        if (!navbar) return;

        /* ---- Contrazione "liquid glass" guidata dallo scroll ----
           Nessuno swap tra due elementi: si scrive una sola variabile
           CSS (--nav-progress, 0→1) che il CSS interpola su margini,
           raggio, altezza, sfocatura e trasparenza. Il valore viene
           inseguito con un lerp, così anche uno scroll a scatti (rotella,
           tastiera) produce un movimento morbido invece che a gradini. */
        let navProgress = 0;
        let target = 0;
        let navFrame = null;

        function computeTarget() {
            if (window.innerWidth < DESKTOP_MIN) return 0;
            return Math.min(1, Math.max(0, (window.scrollY - START_AT) / RANGE));
        }

        function applyProgress(value) {
            navbar.style.setProperty("--nav-progress", value.toFixed(4));
        }

        function animate() {
            const delta = target - navProgress;
            if (Math.abs(delta) < 0.001) {
                navProgress = target;
                applyProgress(navProgress);
                navFrame = null;
                return;
            }
            navProgress += delta * SMOOTHING;
            applyProgress(navProgress);
            navFrame = requestAnimationFrame(animate);
        }

        function requestNavUpdate() {
            target = computeTarget();
            if (navFrame === null) navFrame = requestAnimationFrame(animate);
        }

        window.addEventListener("scroll", requestNavUpdate, { passive: true });
        window.addEventListener("resize", requestNavUpdate);
        // Stato iniziale (es. ricarica a metà pagina): applicato senza inseguimento.
        navProgress = target = computeTarget();
        applyProgress(navProgress);

        /* ---- Reading progress ---- */
        const progress = document.querySelector("[data-site-progress]");
        const progressBar = document.querySelector("[data-site-progress-bar]");

        function updateReadingProgress() {
            if (!progress || !progressBar) return;

            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percentage = scrollableHeight > 0
                ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100))
                : 100;

            progressBar.style.width = `${percentage}%`;
            progress.setAttribute("aria-valuenow", Math.round(percentage));
        }

        let progressTicking = false;
        function requestProgressUpdate() {
            if (progressTicking) return;
            progressTicking = true;
            window.requestAnimationFrame(() => {
                updateReadingProgress();
                progressTicking = false;
            });
        }

        window.addEventListener("scroll", requestProgressUpdate, { passive: true });
        window.addEventListener("resize", requestProgressUpdate, { passive: true });
        window.addEventListener("load", requestProgressUpdate);
        updateReadingProgress();

        /* ---- Menu mobile ---- */
        const menuToggle = document.querySelector("[data-menu-toggle]");
        const mobileMenu = document.querySelector("[data-mobile-menu]");

        function openMobileMenu() {
            mobileMenu?.classList.add("is-open");
            menuToggle?.setAttribute("aria-expanded", "true");
            document.body.classList.add("menu-open");
        }

        function closeMobileMenu() {
            mobileMenu?.classList.remove("is-open");
            menuToggle?.setAttribute("aria-expanded", "false");
            document.body.classList.remove("menu-open");
        }

        menuToggle?.addEventListener("click", () => {
            mobileMenu?.classList.contains("is-open") ? closeMobileMenu() : openMobileMenu();
        });

        mobileMenu?.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMobileMenu);
        });

        /* Escape closes the menu without requiring a tap on the toggle. */
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeMobileMenu();
        });

        /* If the viewport becomes desktop-sized, reset the mobile state. */
        const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
        const handleViewportChange = (event) => {
            if (event.matches) closeMobileMenu();
            requestNavUpdate();
        };
        desktopQuery.addEventListener?.("change", handleViewportChange);
    });
})();
