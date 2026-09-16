// -----------------------------
// DARE Lab - Main Interactive Logic
// -----------------------------

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeBtn = document.getElementById("themeBtn");
    const menuBtn = document.getElementById("menuBtn");
    const drawer = document.getElementById("drawer");
    const yearEl = document.getElementById("year");

    // Set current year in footer
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Theme Management
    const savedTheme = localStorage.getItem("dare_theme");
    if (savedTheme) {
        body.setAttribute("data-theme", savedTheme);
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const currentTheme = document.body.getAttribute("data-theme") || "dark";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.body.setAttribute("data-theme", newTheme);
            localStorage.setItem("dare_theme", newTheme);
        });
    }

    // Mobile Menu Toggle
    if (menuBtn && drawer) {
        menuBtn.addEventListener("click", () => {
            const expanded = menuBtn.getAttribute("aria-expanded") === "true";
            menuBtn.setAttribute("aria-expanded", String(!expanded));
            drawer.style.display = expanded ? "none" : "block";
        });

        const closeBtn = document.getElementById("closeDrawer");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                drawer.style.display = "none";
                menuBtn.setAttribute("aria-expanded", "false");
            });
        }

        // Close drawer when clicking a link
        drawer.querySelectorAll("a").forEach(a => {
            a.addEventListener("click", () => {
                drawer.style.display = "none";
                menuBtn.setAttribute("aria-expanded", "false");
            });
        });
    }

    // Latest updates: show a fixed grid and page through the remaining posts.
    const updateCards = Array.from(document.querySelectorAll('[data-update-card]'));
    const updateButtons = Array.from(document.querySelectorAll('[data-updates-direction]'));
    if (updateCards.length && updateButtons.length) {
        let updateStart = 0;

        const visibleUpdateCount = () => {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        };

        const renderUpdates = () => {
            const visibleCount = visibleUpdateCount();
            const maxStart = Math.max(0, updateCards.length - visibleCount);
            updateStart = Math.min(updateStart, maxStart);

            updateCards.forEach((card, index) => {
                const visible = index >= updateStart && index < updateStart + visibleCount;
                card.hidden = !visible;
                card.setAttribute('aria-hidden', String(!visible));
            });

            updateButtons.forEach(button => {
                const previous = button.dataset.updatesDirection === 'previous';
                button.disabled = previous ? updateStart === 0 : updateStart === maxStart;
            });
        };

        updateButtons.forEach(button => {
            button.addEventListener('click', () => {
                const direction = button.dataset.updatesDirection === 'next' ? 1 : -1;
                updateStart += direction;
                renderUpdates();
            });
        });

        window.addEventListener('resize', renderUpdates);
        renderUpdates();
    }

    // Form Handling (Demo)
    window.fakeSubmit = (e) => {
        e.preventDefault();
        const s = document.getElementById("formStatus");
        if (s) {
            s.textContent = "Thanks! This is a demo form. Connect it to your backend to receive submissions.";
            s.style.color = "var(--good)";
        }
        return false;
    };

    window.fakeSubmitContact = (e) => {
        e.preventDefault();
        const s = document.getElementById("contactStatus");
        if (s) {
            s.textContent = "Message queued (demo). Wire this form to your email/API provider.";
            s.style.color = "var(--brand)";
        }
        return false;
    };

    // Membership Form Consent Validation
    const consentCheckbox = document.querySelector('input[name="agree_policies"]');
    const submitBtn = document.querySelector('form[action*="formspree"] button[type="submit"]');

    if (consentCheckbox && submitBtn) {
        // Set custom English validation message
        consentCheckbox.setCustomValidity("Please check this box to proceed.");

        // Initially disable submit button
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";

        // Enable/disable based on checkbox state
        consentCheckbox.addEventListener('change', () => {
            if (consentCheckbox.checked) {
                consentCheckbox.setCustomValidity(""); // Clear when checked
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
                submitBtn.style.cursor = "pointer";
            } else {
                consentCheckbox.setCustomValidity("Please check this box to proceed.");
                submitBtn.disabled = true;
                submitBtn.style.opacity = "0.5";
                submitBtn.style.cursor = "not-allowed";
            }
        });
    }

    // Scroll Reveal Animation
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('section, .card, .stat').forEach(el => {
        el.classList.add('reveal-on-scroll');
        revealObserver.observe(el);
    });
});
