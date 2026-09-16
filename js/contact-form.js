/* ============================================================
   CONTACT FORM
   Validazione inline, campo azienda condizionale, contatore
   caratteri e pannello di conferma.
   ============================================================ */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("contact-form");
        if (!form) return;

        const fields = {
            name: document.getElementById("nome"),
            email: document.getElementById("email"),
            reason: document.getElementById("motivo"),
            company: document.getElementById("azienda"),
            message: document.getElementById("messaggio")
        };
        const companyField = document.getElementById("company-field");
        const confirmation = document.getElementById("form-confirmation");
        const confirmationClose = document.getElementById("confirmation-close");
        const charCount = document.getElementById("messaggio-count");

        const getText = (it, en) => window.JEBA_I18N
            ? window.JEBA_I18N.pick({ it, en })
            : it;

        const validators = {
            name: () => fields.name.value.trim().length >= 2
                ? ""
                : getText("Inserisci nome e cognome.", "Enter your full name."),
            email: () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.value.trim())
                ? ""
                : getText("Inserisci un indirizzo e-mail valido.", "Enter a valid email address."),
            reason: () => fields.reason.value
                ? ""
                : getText("Seleziona il motivo del contatto.", "Select a reason for contacting us."),
            company: () => fields.reason.value !== "company" || fields.company.value.trim().length >= 2
                ? ""
                : getText("Inserisci il nome dell'azienda.", "Enter your company name."),
            message: () => fields.message.value.trim().length >= 10
                ? ""
                : getText("Il messaggio deve contenere almeno 10 caratteri.", "Your message must contain at least 10 characters.")
        };

        function setError(field, message) {
            const wrapper = field.closest(".input-wrapper");
            const error = document.getElementById(`${field.id}-error`);
            if (!wrapper || !error) return;
            wrapper.classList.toggle("has-error", Boolean(message));
            field.setAttribute("aria-invalid", message ? "true" : "false");
            error.textContent = message;
        }

        function validate(key) {
            const message = validators[key]();
            setError(fields[key], message);
            return !message;
        }

        function updateCompanyField() {
            const isCompany = fields.reason.value === "company";
            companyField.hidden = !isCompany;
            fields.company.required = isCompany;
            if (!isCompany) {
                fields.company.value = "";
                setError(fields.company, "");
            }
        }

        function updateCharCount() {
            charCount.textContent = `${fields.message.value.length} / 1000`;
        }

        Object.entries(fields).forEach(([key, field]) => {
            field.addEventListener("input", () => validate(key));
            field.addEventListener("blur", () => validate(key));
        });

        fields.reason.addEventListener("change", () => {
            updateCompanyField();
            validate("reason");
            if (fields.reason.value === "company") fields.company.focus();
        });

        fields.message.addEventListener("input", updateCharCount);

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            updateCompanyField();
            const valid = Object.keys(validators).every(validate);
            if (!valid) {
                const firstInvalid = Object.keys(validators)
                    .map((key) => fields[key])
                    .find((field) => field.getAttribute("aria-invalid") === "true");
                firstInvalid?.focus();
                return;
            }

            form.querySelectorAll("input, select, textarea, #submit-btn").forEach((el) => { el.disabled = true; });
            confirmation.hidden = false;
            confirmation.classList.add("is-visible");
            if (window.lucide) window.lucide.createIcons();
        });

        confirmationClose?.addEventListener("click", () => {
            confirmation.hidden = true;
            confirmation.classList.remove("is-visible");
            form.reset();
            form.querySelectorAll("input, select, textarea, #submit-btn").forEach((el) => { el.disabled = false; });
            updateCompanyField();
            Object.keys(validators).forEach((key) => setError(fields[key], ""));
            updateCharCount();
            fields.name.focus();
        });

        updateCompanyField();
        updateCharCount();
    });
})();
