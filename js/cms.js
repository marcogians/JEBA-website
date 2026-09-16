/* ============================================================
   CMS ADAPTER
   ------------------------------------------------------------
   In questa demo i dati arrivano da file JSON statici
   (data/news.json, data/events.json) che replicano ESATTAMENTE
   la forma della risposta che ci si aspetta da un CMS reale.

   Per collegare un CMS vero è sufficiente riscrivere le due
   funzioni fetchNews()/fetchEvents() qui sotto in modo che
   restituiscano un array con la stessa shape — nient'altro nel
   sito deve cambiare. Esempi di endpoint alternativi sono
   commentati sotto ogni funzione. Vedi README.md per lo schema
   completo dei content-type consigliati (Strapi / Sanity / WP).
   ============================================================ */
(function () {
    "use strict";

    const t = (field) => window.JEBA_I18N.pick(field);

    /* ---------------- DATA SOURCE ---------------- */

    async function fetchNews() {
        const res = await fetch("data/news.json");
        if (!res.ok) throw new Error("news fetch failed");
        const json = await res.json();
        return json.items.filter((item) => item.status === "published");

        // --- Strapi (headless) ---
        // const res = await fetch("https://cms.jebari.it/api/articles?populate=cover&sort=publishedAt:desc");
        // const { data } = await res.json();
        // return data.map(mapStrapiArticle);

        // --- Sanity (headless) ---
        // const query = encodeURIComponent(`*[_type == "article" && status == "published"] | order(publishedAt desc)`);
        // const res = await fetch(`https://<project>.api.sanity.io/v2024-01-01/data/query/production?query=${query}`);
        // const { result } = await res.json();
        // return result;

        // --- WordPress (REST API, custom post type "jeba_news") ---
        // const res = await fetch("https://jebari.it/wp-json/wp/v2/jeba_news?_embed");
        // const posts = await res.json();
        // return posts.map(mapWpPost);
    }

    async function fetchEvents() {
        const res = await fetch("data/events.json");
        if (!res.ok) throw new Error("events fetch failed");
        const json = await res.json();
        return json.items;
    }

    /* ---------------- RENDER: NEWS ---------------- */

    function newsCardHTML(item) {
        const date = new Date(item.publishedAt).toLocaleDateString(
            window.JEBA_I18N.current === "en" ? "en-GB" : "it-IT",
            { day: "2-digit", month: "long", year: "numeric" }
        );
        return `
            <article class="news-card">
                <div class="news-image">
                    <img src="${item.cover.url}" alt="${t(item.cover.alt)}" loading="lazy">
                </div>
                <div class="news-content">
                    <span class="news-date">${date} · ${t(item.category)}</span>
                    <h3>${t(item.title)}</h3>
                    <p>${t(item.excerpt)}</p>
                </div>
            </article>`;
    }

    async function renderNews({ limit } = {}) {
        const containers = document.querySelectorAll("[data-cms='news']");
        if (!containers.length) return;

        containers.forEach((c) => c.setAttribute("aria-busy", "true"));

        try {
            let items = await fetchNews();
            items = items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            if (limit) items = items.slice(0, limit);

            containers.forEach((container) => {
                container.innerHTML = items.length
                    ? items.map(newsCardHTML).join("")
                    : `<p class="cms-empty" data-i18n="news.empty"></p>`;
            });
        } catch (err) {
            console.error(err);
            containers.forEach((container) => {
                container.innerHTML = `<p class="cms-error" data-i18n="news.error"></p>`;
            });
        } finally {
            containers.forEach((c) => c.removeAttribute("aria-busy"));
            window.JEBA_I18N && document.dispatchEvent(new Event("jeba:cms-rendered"));
            if (window.lucide) window.lucide.createIcons();
        }
    }

    /* ---------------- RENDER: EVENTI ---------------- */

    function eventCardHTML(item) {
        const d = new Date(item.startDate);
        const day = d.toLocaleDateString(window.JEBA_I18N.current === "en" ? "en-GB" : "it-IT", { day: "2-digit" });
        const month = d.toLocaleDateString(window.JEBA_I18N.current === "en" ? "en-GB" : "it-IT", { month: "short" }).toUpperCase();

        const posterNumber = String(Number(item.id.match(/(\d{2})/)?.[1] || 1)).padStart(2, "0");
        const posterHTML = item.cover?.url && !/^images\/loc[1-3]\.jpg$/i.test(item.cover.url)
            ? `<img src="${item.cover.url}" alt="${t(item.cover.alt)}" loading="lazy">`
            : `<div class="event-poster-fallback" aria-hidden="true"><span class="event-number">${posterNumber}</span><span class="event-word">JEBA · EVENT</span></div>`;
        return `
            <article class="event-card">
                <div class="event-poster">
                    ${posterHTML}
                    <span class="event-type-badge">${t(item.type)}</span>
                </div>
                <div class="event-body">
                    <div class="event-date">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                    <div class="event-details">
                        <h3>${t(item.title)}</h3>
                        <p>${t(item.excerpt)}</p>
                        <span class="event-location"><i data-lucide="map-pin"></i>${t(item.location)}</span>
                        ${item.registrationUrl && item.registrationUrl !== "#" ? `<a class="event-register" href="${item.registrationUrl}" target="_blank" rel="noopener"><span data-i18n="events.register">Iscriviti</span><i data-lucide="arrow-up-right"></i></a>` : ""}
                    </div>
                </div>
            </article>`;
    }

    async function renderEvents({ limit, status } = {}) {
        const containers = document.querySelectorAll("[data-cms='events']");
        if (!containers.length) return;

        containers.forEach((c) => c.setAttribute("aria-busy", "true"));

        try {
            let items = await fetchEvents();
            if (status) items = items.filter((e) => e.status === status);
            items = items.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            if (status === "past") items.reverse();
            if (limit) items = items.slice(0, limit);

            containers.forEach((container) => {
                container.innerHTML = items.length
                    ? items.map(eventCardHTML).join("")
                    : `<p class="cms-empty" data-i18n="events.empty"></p>`;
            });
        } catch (err) {
            console.error(err);
        } finally {
            containers.forEach((c) => c.removeAttribute("aria-busy"));
            // Mancava qui: renderNews() lo dispatcha, renderEvents() no.
            // Senza questo evento le card eventi non venivano mai
            // intercettate da js/reveal.js (restavano semplicemente
            // visibili di colpo, senza l'animazione d'ingresso).
            window.JEBA_I18N && document.dispatchEvent(new Event("jeba:cms-rendered"));
            if (window.lucide) window.lucide.createIcons();
        }
    }

    /* ---------------- EVENTI PAGE: TAB upcoming/past ---------------- */

    function initEventTabs() {
        const tabs = document.querySelectorAll("[data-event-tab]");
        if (!tabs.length) return;
        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((t2) => t2.classList.remove("active"));
                tab.classList.add("active");
                renderEvents({ status: tab.getAttribute("data-event-tab") });
            });
        });
    }

    /* ---------------- BOOT ---------------- */

    window.JEBA_CMS = { renderNews, renderEvents };

    document.addEventListener("DOMContentLoaded", () => {
        const newsLimit = document.querySelector("[data-cms='news']")?.getAttribute("data-limit");
        const eventsLimit = document.querySelector("[data-cms='events']")?.getAttribute("data-limit");
        const defaultStatus = document.querySelector("[data-cms='events']")?.getAttribute("data-status") || "upcoming";

        renderNews({ limit: newsLimit ? Number(newsLimit) : undefined });
        renderEvents({ limit: eventsLimit ? Number(eventsLimit) : undefined, status: defaultStatus });
        initEventTabs();
    });

    // Ri-renderizza i contenuti dinamici quando l'utente cambia lingua,
    // così i testi vengono presi dal campo giusto ({it}/{en}) del JSON.
    document.addEventListener("jeba:langchange", () => {
        const newsLimit = document.querySelector("[data-cms='news']")?.getAttribute("data-limit");
        const eventsLimit = document.querySelector("[data-cms='events']")?.getAttribute("data-limit");
        const activeTab = document.querySelector("[data-event-tab].active")?.getAttribute("data-event-tab");

        renderNews({ limit: newsLimit ? Number(newsLimit) : undefined });
        renderEvents({ limit: eventsLimit ? Number(eventsLimit) : undefined, status: activeTab || "upcoming" });
    });
})();
