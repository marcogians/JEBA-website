/* ============================================================
   TEAM HOVER CARDS
   Su desktop l'overlay è gestito interamente in CSS (:hover /
   :focus-within, vedi style.css). Su touch, l'hover non esiste:
   il primo tocco apre l'overlay (mostrando i contatti), un
   secondo tocco sulla card stessa o un tocco fuori la richiude.
   ============================================================ */
(function () {
    "use strict";

    function isTouchDevice() {
        return window.matchMedia("(hover: none), (pointer: coarse)").matches;
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!isTouchDevice()) return; // su desktop basta il CSS

        const cards = document.querySelectorAll(".team-card");

        document.addEventListener("click", (e) => {
            const card = e.target.closest(".team-card");

            cards.forEach((c) => {
                if (c !== card) c.classList.remove("is-flipped");
            });

            if (card) {
                // primo tocco: apre. Se era già aperta e si tocca un link
                // dentro l'overlay, lascia che il link funzioni normalmente.
                if (!card.classList.contains("is-flipped")) {
                    e.preventDefault();
                    card.classList.add("is-flipped");
                }
            }
        });
    });
})();
