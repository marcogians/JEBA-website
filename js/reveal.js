/* ============================================================
   REVEAL ON SCROLL — sitewide
   Fa "apparire" i contenuti mentre si naviga la pagina, con la
   stessa firma di movimento ovunque: card di griglia (team, news,
   eventi), titoli di sezione, le due metà dei contatti, le colonne
   del footer e il contenuto dell'hero al primo caricamento.

   Come funziona
   - GROUPS elenca i selettori da animare. Ogni gruppo dichiara una
     "variante" (card | fade) che sceglie solo l'ampiezza del
     movimento in CSS (vedi [data-reveal="card"] in style.css): il
     ritmo — durata, curva — è lo stesso per tutti, così l'occhio
     riconosce un unico linguaggio invece di tanti componenti
     scoordinati.
   - I gruppi "corali" (griglie, colonne del footer, i due blocchi
     dei contatti, il contenuto dell'hero) entrano a cascata: lo
     stagger è calcolato per posizione dentro il contenitore
     (--reveal-delay). I gruppi "solisti" (titoli di sezione) non
     hanno stagger: sono un elemento solo, aspettare non aggiunge
     nulla.
   - Un IntersectionObserver aggiunge .is-revealed quando l'elemento
     entra nel viewport, poi smette subito di osservarlo (una
     tantum, non ad ogni passaggio). L'hero è già visibile al
     caricamento: lo stesso observer lo rivela pochi istanti dopo
     il primo paint, dando alla pagina un ingresso invece di un
     comparire di colpo.
   - Il contenuto caricato dal CMS (news/eventi) viene agganciato
     al volo ascoltando "jeba:cms-rendered".

   Accessibilità: con prefers-reduced-motion tutto resta visibile e
   statico (vedi style.css); se IntersectionObserver non è
   supportato si rivela tutto subito.
   ============================================================ */
(function () {
    "use strict";

    const STEP = 70;   // ms di ritardo per posizione, uguale per ogni gruppo corale
    const MAX_STAGGER = 5; // oltre il 5° elemento il ritardo non cresce più

    const GROUPS = [
        // Griglie di card — trigger allo scroll (osservate quando entrano)
        { selector: ".team-grid > .team-card", variant: "card", stagger: true, trigger: "scroll" },
        { selector: ".news-grid > .news-card", variant: "card", stagger: true, trigger: "scroll" },
        { selector: ".events-grid > .event-card", variant: "card", stagger: true, trigger: "scroll" },
        { selector: ".experience-grid > .experience-card", variant: "card", stagger: true, trigger: "scroll" },

        // Titoli di sezione: un elemento solo, nessuno stagger
        {
            selector: [
                ".section-header", ".section-title",
                ".approach-section-heading", ".contact-header", ".experience-heading", ".history-timeline-head"
            ].join(", "),
            variant: "fade", stagger: false, trigger: "scroll"
        },

        // Contatti: form e box informazioni entrano in sequenza
        { selector: ".contact-grid > *", variant: "fade", stagger: true, trigger: "scroll" },

        // Footer: le colonne entrano a cascata
        { selector: ".footer-grid > *", variant: "fade", stagger: true, trigger: "scroll" },

        // Hook generico per estensioni future (già usato altrove nel sito)
        { selector: "[data-reveal-item]", variant: "fade", stagger: true, trigger: "scroll" },

        // Contenuto dell'hero: è già a schermo al primo paint, quindi
        // NON passa dall'IntersectionObserver — con il margine negativo
        // usato per anticipare gli elementi sotto la piega, un elemento
        // ancorato in fondo alla viewport (la freccia "scorri") può
        // ricadere nella fascia esclusa e non intersecare mai finché non
        // si scorre, il che è assurdo per qualcosa che deve invitare
        // proprio a scorrere. Entra invece da sé, subito dopo il paint.
        { selector: ".hero-content > *", variant: "fade", stagger: true, trigger: "load" },
        { selector: ".hero-scroll", variant: "fade", stagger: false, trigger: "load" }
    ];

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supported = "IntersectionObserver" in window;

    let observer = null;

    if (supported && !reduceMotion) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add("is-revealed");
                observer.unobserve(el);
                markDone(el);
            });
        }, {
            // Parte poco prima che l'elemento sia realmente a schermo:
            // l'animazione risulta già in corso quando lo si guarda.
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.12
        });
    }

    function markDone(el) {
        el.addEventListener("transitionend", () => {
            el.classList.add("reveal-done");
        }, { once: true });
    }

    function prepare(el, variant, delay, trigger) {
        if (el.dataset.revealBound === "true") return;
        el.dataset.revealBound = "true";
        el.setAttribute("data-reveal", variant === "card" ? "card" : "");
        if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);

        if (!observer || reduceMotion) {
            // Nessun supporto (o motion ridotto): mostra e basta.
            el.classList.add("is-revealed", "reveal-disabled");
            return;
        }

        if (trigger === "load") {
            // Doppio rAF: il primo frame applica lo stato iniziale
            // (opacità 0 + traslazione) del CSS appena scritto sopra,
            // il secondo aggiunge .is-revealed — così la transizione
            // parte davvero da "nascosto" invece di saltare lo stato
            // di partenza (succederebbe aggiungendo la classe nello
            // stesso frame in cui viene applicato [data-reveal]).
            requestAnimationFrame(() => requestAnimationFrame(() => {
                el.classList.add("is-revealed");
                markDone(el);
            }));
            return;
        }

        observer.observe(el);
    }

    function scan(root) {
        const scope = root instanceof Element ? root : document;
        GROUPS.forEach(({ selector, variant, stagger, trigger }) => {
            scope.querySelectorAll(selector).forEach((el) => {
                if (!stagger) {
                    prepare(el, variant, 0, trigger);
                    return;
                }
                const siblings = el.parentElement
                    ? Array.from(el.parentElement.children).filter((s) => s.matches(selector))
                    : [el];
                const index = Math.min(siblings.indexOf(el), MAX_STAGGER);
                prepare(el, variant, Math.max(0, index) * STEP, trigger);
            });
        });
    }

    document.addEventListener("DOMContentLoaded", () => scan(document));
    // News/eventi arrivano dal "CMS" dopo il fetch: ri-scansiona.
    document.addEventListener("jeba:cms-rendered", () => scan(document));
    document.addEventListener("jeba:langchange", () => scan(document));

    window.JEBA_REVEAL = { scan };
})();
