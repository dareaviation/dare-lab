/* =====================================================================
   DARE Lab — site interactions
   Theme toggle · header state · mobile drawer · scroll-spy · reveal-on-
   scroll · card spotlight · stat counters · updates slider · membership
   form consent · copy-citation buttons
   ===================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* ---------- Theme ---------- */
    var themeBtn = document.getElementById('themeBtn');
    var metaTheme = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#f6f7f9' : '#060910');
        if (themeBtn) themeBtn.setAttribute('aria-pressed', String(theme === 'light'));
    }

    applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(next);
            try { localStorage.setItem('dare_theme', next); } catch (e) { /* storage unavailable */ }
        });
    }

    /* ---------- Header: scrolled state ---------- */
    var header = document.getElementById('siteHeader');
    function onScroll() {
        if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile drawer ---------- */
    var menuBtn = document.getElementById('menuBtn');
    var drawer = document.getElementById('drawer');

    function setDrawer(open) {
        if (!menuBtn || !drawer) return;
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        drawer.classList.toggle('is-open', open);
        if ('inert' in drawer) drawer.inert = !open;
        document.body.classList.toggle('is-locked', open);
    }

    if (menuBtn && drawer) {
        setDrawer(false);
        menuBtn.addEventListener('click', function () {
            setDrawer(menuBtn.getAttribute('aria-expanded') !== 'true');
        });
        drawer.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { setDrawer(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
                setDrawer(false);
                menuBtn.focus();
            }
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 960) setDrawer(false);
        });
    }

    /* ---------- Scroll-spy for the primary nav ---------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
    var spySections = Array.prototype.slice.call(document.querySelectorAll('main > section[id]'));
    if (navLinks.length && spySections.length && 'IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var id = '#' + entry.target.id;
                navLinks.forEach(function (a) {
                    if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
                    else a.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        spySections.forEach(function (s) { spy.observe(s); });
    }

    /* ---------- Reveal on scroll ---------- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

    function settle(el) {
        el.removeAttribute('data-reveal');
        el.style.removeProperty('--reveal-delay');
    }

    if (!reduceMotion && 'IntersectionObserver' in window) {
        var siblingIndex = new Map();
        revealEls.forEach(function (el) {
            var parent = el.parentElement;
            var idx = siblingIndex.get(parent) || 0;
            siblingIndex.set(parent, idx + 1);
            el.style.setProperty('--reveal-delay', Math.min(idx, 6) * 70 + 'ms');
        });

        var revealer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                obs.unobserve(el);
                el.classList.add('is-visible');
                el.addEventListener('transitionend', function () { settle(el); }, { once: true });
                // Safety net in case transitionend never fires
                setTimeout(function () { settle(el); }, 1800);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(function (el) { revealer.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); settle(el); });
    }

    /* ---------- Card spotlight (pointer devices only) ---------- */
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.card').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }

    /* ---------- Stat counters ---------- */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
        var counterObs = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                obs.unobserve(entry.target);
                var el = entry.target;
                var target = parseInt(el.getAttribute('data-count'), 10);
                if (!target) return;
                var start = null, duration = 1400;
                var tick = function (now) {
                    if (start === null) start = now;
                    var p = Math.min(1, (now - start) / duration);
                    el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
                    if (p < 1) requestAnimationFrame(tick);
                };
                el.textContent = '0';
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.6 });
        counters.forEach(function (c) { counterObs.observe(c); });
    }

    /* ---------- Latest updates: page through LinkedIn posts ---------- */
    var updateCards = Array.prototype.slice.call(document.querySelectorAll('[data-update-card]'));
    var updateButtons = Array.prototype.slice.call(document.querySelectorAll('[data-updates-direction]'));
    if (updateCards.length && updateButtons.length) {
        var updateStart = 0;

        var visibleUpdateCount = function () {
            if (window.innerWidth <= 680) return 1;
            if (window.innerWidth <= 1100) return 2;
            return 3;
        };

        var renderUpdates = function () {
            var visibleCount = visibleUpdateCount();
            var maxStart = Math.max(0, updateCards.length - visibleCount);
            updateStart = Math.min(updateStart, maxStart);

            updateCards.forEach(function (card, index) {
                var visible = index >= updateStart && index < updateStart + visibleCount;
                card.hidden = !visible;
                card.setAttribute('aria-hidden', String(!visible));
            });

            updateButtons.forEach(function (button) {
                var previous = button.getAttribute('data-updates-direction') === 'previous';
                button.disabled = previous ? updateStart === 0 : updateStart === maxStart;
            });
        };

        updateButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                updateStart += button.getAttribute('data-updates-direction') === 'next' ? 1 : -1;
                if (updateStart < 0) updateStart = 0;
                renderUpdates();
            });
        });

        window.addEventListener('resize', renderUpdates);
        renderUpdates();
    }

    /* ---------- Membership form: require policy consent ---------- */
    var form = document.querySelector('form[action*="formspree"]');
    if (form) {
        var consent = form.querySelector('input[name="agree_policies"]');
        var submit = form.querySelector('button[type="submit"]');
        if (consent && submit) {
            var syncConsent = function () {
                consent.setCustomValidity(consent.checked ? '' : 'Please check this box to proceed.');
                submit.disabled = !consent.checked;
            };
            consent.addEventListener('change', syncConsent);
            syncConsent();
        }
    }

    /* ---------- Copy APA citation ---------- */
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
        }
        return Promise.resolve(fallbackCopy(text));
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }

    document.querySelectorAll('[data-cite]').forEach(function (btn) {
        var label = btn.querySelector('span');
        var original = label ? label.textContent : '';
        btn.addEventListener('click', function () {
            copyText(btn.getAttribute('data-cite')).then(function (ok) {
                if (!label) return;
                label.textContent = ok ? 'Copied ✓' : 'Copy failed';
                setTimeout(function () { label.textContent = original; }, 1800);
            });
        });
    });
})();
