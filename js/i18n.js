/* ============================================================
   I18N — toggle italiano / inglese
   Dizionari in data/i18n/{it,en}.json. Applica le traduzioni a
   ogni elemento con [data-i18n="chiave"]. Espone window.JEBA_I18N
   così che js/cms.js possa leggere la lingua corrente e i18n.js
   possa ri-renderizzare le collezioni al cambio lingua.
   ============================================================ */
(function () {
    "use strict";

    const STORAGE_KEY = "jeba-lang";
    const DEFAULT_LANG = "it";
    const dictionaries = {};

    async function loadDictionary(lang) {
        if (dictionaries[lang]) return dictionaries[lang];
        const res = await fetch(`data/i18n/${lang}.json`);
        if (!res.ok) throw new Error(`Impossibile caricare il dizionario "${lang}"`);
        dictionaries[lang] = await res.json();
        return dictionaries[lang];
    }

    function translateStaticNodes(dict) {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (dict[key] !== undefined) el.textContent = dict[key];
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
        });

        document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
            const key = el.getAttribute("data-i18n-aria");
            if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
        });

        if (dict["meta.title"]) document.title = dict["meta.title"];
    }

    function updateSwitchUI(lang) {
        document.querySelectorAll("[data-lang-option]").forEach((el) => {
            const active = el.getAttribute("data-lang-option") === lang;
            el.classList.toggle("active", active);
            el.setAttribute("aria-pressed", String(active));
        });
        document.documentElement.setAttribute("lang", lang);
    }

    async function setLanguage(lang) {
        const dict = await loadDictionary(lang);
        translateStaticNodes(dict);
        updateSwitchUI(lang);
        localStorage.setItem(STORAGE_KEY, lang);
        window.JEBA_I18N.current = lang;
        // Notifica gli altri moduli (es. cms.js) che la lingua è cambiata,
        // così possono ri-renderizzare i contenuti dinamici nella lingua giusta.
        document.dispatchEvent(new CustomEvent("jeba:langchange", { detail: { lang } }));
    }

    window.JEBA_I18N = {
        current: localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG,
        setLanguage,
        /** Helper per estrarre il campo localizzato da un oggetto CMS {it, en} */
        pick(field) {
            if (field == null) return "";
            if (typeof field === "string") return field;
            return field[window.JEBA_I18N.current] || field[DEFAULT_LANG] || "";
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const initialLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

        document.querySelectorAll("[data-lang-option]").forEach((el) => {
            el.addEventListener("click", () => {
                const lang = el.getAttribute("data-lang-option");
                if (lang !== window.JEBA_I18N.current) setLanguage(lang);
            });
        });

        setLanguage(initialLang);
    });
})();
