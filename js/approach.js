/* ============================================================
   OUR APPROACH — FULL-WIDTH PREVIEW SLIDER
   ============================================================ */
(function () {
    "use strict";
    function initApproach() {
        const carousel = document.querySelector("[data-approach-carousel]");
        if (!carousel) return;
        const stage = carousel.querySelector(".approach-stage");
        const track = carousel.querySelector(".approach-track");
        const slides = [...carousel.querySelectorAll(".approach-slide")];
        const tabs = [...carousel.querySelectorAll(".approach-progress-item")];
        const slider = carousel.querySelector("[data-approach-slider]");
        const toggle = carousel.querySelector("[data-approach-toggle]");
        if (!stage || !track || slides.length === 0 || tabs.length !== slides.length || !slider || !toggle) return;
        const duration = Number(carousel.dataset.duration) || 5500;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let current = 0;
        let paused = reducedMotion;
        let elapsed = 0;
        let startedAt = performance.now();
        let timerId = null;
        let inViewport = false;
        let rafId = null;
        let dragStartX = null;
        let dragMoved = false;

        function label(key, fallback) {
            const lang = window.JEBA_I18N?.current || "it";
            const values = {
                it: { pause: "Metti in pausa", play: "Avvia la presentazione" },
                en: { pause: "Pause presentation", play: "Start presentation" }
            };
            return values[lang]?.[key] || fallback;
        }
        function updateToggle() {
            toggle.classList.toggle("is-paused", paused);
            toggle.setAttribute("aria-pressed", String(paused));
            toggle.setAttribute("aria-label", paused ? label("play", "Avvia la presentazione") : label("pause", "Metti in pausa"));
        }
        function getElapsed() {
            return paused ? elapsed : Math.min(duration, elapsed + (performance.now() - startedAt));
        }
        function resetProgress() {
            elapsed = 0;
            startedAt = performance.now();
            carousel.style.setProperty("--approach-progress", "0%");
        }
        function centerSlide(animate = true) {
            const slide = slides[current];
            if (!slide) return;
            const offset = (stage.clientWidth - slide.offsetWidth) / 2 - slide.offsetLeft;
            if (!animate) track.style.transition = "none";
            track.style.transform = `translate3d(${offset}px, 0, 0)`;
            if (!animate) {
                track.offsetHeight;
                track.style.transition = "";
            }
        }
        function setSlide(index, restart = true, animate = true) {
            current = (index + slides.length) % slides.length;
            centerSlide(animate);
            slides.forEach((slide, i) => {
                const active = i === current;
                slide.classList.toggle("is-active", active);
                slide.setAttribute("aria-hidden", String(!active));
                /* Niente più [inert] sulle slide laterali: rendeva la card
                   completamente insensibile al puntatore, quindi il click
                   per cambiare slide non arrivava mai. Le slide non attive
                   diventano invece un controllo a tutti gli effetti. */
                slide.removeAttribute("inert");
                slide.setAttribute("role", active ? "group" : "button");
                slide.tabIndex = active ? -1 : 0;
                /* I link/bottoni dentro le slide nascoste restano però
                   fuori dal tab order. */
                slide.querySelectorAll("a, button").forEach((el) => {
                    el.tabIndex = active ? 0 : -1;
                });
            });
            tabs.forEach((tab, i) => {
                const active = i === current;
                tab.classList.toggle("is-active", active);
                tab.classList.toggle("is-complete", i < current);
                tab.setAttribute("aria-selected", String(active));
                tab.tabIndex = active ? 0 : -1;
            });
            if (restart) resetProgress();
            updateToggle();
        }
        function schedule() {
            clearTimeout(timerId);
            if (paused || !inViewport) return;
            const remaining = Math.max(0, duration - getElapsed());
            timerId = setTimeout(() => {
                if (paused || !inViewport) return;
                const next = current === slides.length - 1 ? 0 : current + 1;
                setSlide(next, true);
                schedule();
            }, remaining);
        }
        function togglePlayback() {
            if (paused) {
                paused = false;
                startedAt = performance.now();
                schedule();
            } else {
                elapsed = getElapsed();
                paused = true;
                clearTimeout(timerId);
            }
            updateToggle();
        }
        function selectSlide(index) {
            setSlide(index, true);
            if (!paused) schedule();
        }
        function tick() {
            if (!paused && inViewport) {
                const progress = Math.min(1, getElapsed() / duration);
                carousel.style.setProperty("--approach-progress", `${progress * 100}%`);
            }
            rafId = requestAnimationFrame(tick);
        }
        function selectFromPointer(clientX) {
            const rect = slider.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
            const index = Math.min(slides.length - 1, Math.floor((x / rect.width) * slides.length));
            selectSlide(index);
        }

        toggle.addEventListener("click", togglePlayback);

        /* ---- Click / tastiera sulle slide laterali ---- */
        slides.forEach((slide, index) => {
            slide.addEventListener("click", (event) => {
                if (index === current || stageDragged) return;
                event.preventDefault();
                selectSlide(index);
            });
            slide.addEventListener("keydown", (event) => {
                if (index === current) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                selectSlide(index);
            });
        });

        /* ---- Swipe sullo stage (mobile e trackpad) ---- */
        let stageStartX = null;
        let stageDragged = false;

        stage.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            stageStartX = event.clientX;
            stageDragged = false;
        });
        stage.addEventListener("pointermove", (event) => {
            if (stageStartX !== null && Math.abs(event.clientX - stageStartX) > 10) stageDragged = true;
        });
        stage.addEventListener("pointerup", (event) => {
            if (stageStartX === null) return;
            const delta = event.clientX - stageStartX;
            stageStartX = null;
            if (Math.abs(delta) > 60) selectSlide(delta < 0 ? current + 1 : current - 1);
            // Lascia passare il click solo se non era un drag.
            setTimeout(() => { stageDragged = false; }, 0);
        });
        stage.addEventListener("pointercancel", () => { stageStartX = null; stageDragged = false; });
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => {
                if (!dragMoved) selectSlide(index);
            });
            tab.addEventListener("keydown", event => {
                let next = null;
                if (event.key === "ArrowRight") next = current + 1;
                if (event.key === "ArrowLeft") next = current - 1;
                if (event.key === "Home") next = 0;
                if (event.key === "End") next = slides.length - 1;
                if (next === null) return;
                event.preventDefault();
                selectSlide(next);
                tabs[(next + slides.length) % slides.length].focus();
            });
        });
        slider.addEventListener("pointerdown", event => {
            dragStartX = event.clientX;
            dragMoved = false;
            slider.setPointerCapture?.(event.pointerId);
        });
        slider.addEventListener("pointermove", event => {
            if (dragStartX !== null && Math.abs(event.clientX - dragStartX) > 8) dragMoved = true;
        });
        slider.addEventListener("pointerup", event => {
            if (dragStartX === null) return;
            if (dragMoved) selectFromPointer(event.clientX);
            dragStartX = null;
            setTimeout(() => { dragMoved = false; }, 0);
        });
        slider.addEventListener("pointercancel", () => { dragStartX = null; dragMoved = false; });
        document.addEventListener("jeba:langchange", updateToggle);
        window.addEventListener("resize", () => centerSlide(false));
        setSlide(0, true, false);
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0];
            inViewport = entry.isIntersecting && entry.intersectionRatio >= 0.35;
            if (inViewport && !paused) {
                startedAt = performance.now();
                elapsed = 0;
                schedule();
            } else if (!inViewport && !paused) {
                elapsed = getElapsed();
                clearTimeout(timerId);
            }
        }, { threshold: [0, 0.35, 0.6] });
        observer.observe(carousel);
        rafId = requestAnimationFrame(tick);
        window.addEventListener("beforeunload", () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timerId);
            observer.disconnect();
        }, { once: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApproach, { once: true });
    else initApproach();
})();
