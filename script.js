// ==========================================================================
// FreshRoot Farms - interactions
// ==========================================================================

const WHATSAPP_NUMBER = '919217468925'; // TODO: replace with your live number

// Paste the "Web app" URL you get from deploying the Apps Script (see the
// referral-logger.gs file that came with this site) between the quotes below.
// Leave it as-is and visit-logging is simply skipped - nothing else breaks.
const SHEET_LOGGER_URL = 'https://script.google.com/macros/s/AKfycbzp1Bif78U9v1Po2QgMhrcKArn_EO7uvRjkFGvz9mkz57RtRQ-6hgbHba3OwU4FWWqP7Q/exec';

// --------------------------------------------------------------------------
// Referral code: read ?ref= from the URL, show badge, and thread it into
// every WhatsApp click so the team knows where the lead came from.
// --------------------------------------------------------------------------
function getReferralCode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
}

// Logs one row per code per browser session (a page refresh won't double-count).
function logReferralVisit(code) {
    if (!code) return;
    if (!SHEET_LOGGER_URL || SHEET_LOGGER_URL.indexOf('PASTE_YOUR') === 0) return;

    const sessionKey = `frf_logged_${code}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const url = `${SHEET_LOGGER_URL}?ref=${encodeURIComponent(code)}&page=${encodeURIComponent(window.location.pathname)}`;
    fetch(url, { mode: 'no-cors' })
        .then(() => sessionStorage.setItem(sessionKey, '1'))
        .catch(() => {
            /* silent - a failed log should never block the visitor's experience */
        });
}

function initReferralBadge() {
    const code = getReferralCode();
    const badge = document.getElementById('referralBadge');
    const codeEl = document.getElementById('referralCode');
    if (code && badge && codeEl) {
        codeEl.textContent = code;
        badge.classList.add('active');
    }
    logReferralVisit(code);
    return code;

    function initReferralBadge() {
    const code = getReferralCode();
    const badge = document.getElementById('referralBadge');
    const codeEl = document.getElementById('referralCode');
    const heroCodeEl = document.getElementById('heroRefCode'); // add this

    if (code && badge && codeEl) {
        codeEl.textContent = code;
        badge.classList.add('active');
    }

    if (heroCodeEl && code) {
        heroCodeEl.textContent = code; // add this: overwrite VK001 with the real code
    }

    logReferralVisit(code);
    return code;
}
}

function buildWhatsAppUrl(refCode) {
    const base = `https://wa.me/${WHATSAPP_NUMBER}`;
    const message = refCode
        ? `Hi, I came from referral ${refCode} and want details`
        : `Hi, I'd like to know more about FreshRoot Farms`;
    return `${base}?text=${encodeURIComponent(message)}`;
}

function initWhatsAppButtons(refCode) {
    document.querySelectorAll('[data-whatsapp]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(buildWhatsAppUrl(refCode), '_blank', 'noopener');
        });
    });
}

function initCatalogButtons() {
    document.querySelectorAll('[data-catalog]').forEach((btn) => {
        btn.addEventListener('click', () => {
            window.open(btn.getAttribute('data-catalog'), '_blank', 'noopener');
        });
    });
}

// --------------------------------------------------------------------------
// Smooth scroll for in-page anchors (native CSS scroll-behavior already
// handles most of this; this covers browsers/edge cases where it doesn't).
// --------------------------------------------------------------------------
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.length < 2) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// --------------------------------------------------------------------------
// Scroll reveal, staggered by sibling order within each section.
// --------------------------------------------------------------------------
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.section-head, .service-card, .gallery-item, .dash__panel, .dash__caption'
    );
    targets.forEach((el) => el.classList.add('reveal'));

    const groups = new Map();
    targets.forEach((el) => {
        const parent = el.parentElement;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(el);
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const siblings = groups.get(el.parentElement) || [el];
                const index = siblings.indexOf(el);
                el.style.animationDelay = `${Math.min(index, 6) * 0.08}s`;
                el.classList.add('is-visible');
                observer.unobserve(el);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
}

// --------------------------------------------------------------------------
// Growth line: fills in sync with scroll progress down the page.
// --------------------------------------------------------------------------
function initGrowthLine() {
    const fill = document.getElementById('growthFill');
    if (!fill) return;
    const length = 2000;
    fill.style.strokeDasharray = String(length);

    function update() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
        fill.style.strokeDashoffset = String(length - length * progress);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
}

// --------------------------------------------------------------------------
// Gallery filter chips.
// --------------------------------------------------------------------------
function initGalleryFilters() {
    const chips = document.querySelectorAll('.filter-chip');
    const items = document.querySelectorAll('.gallery-item');

    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => {
                c.classList.remove('is-active');
                c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('is-active');
            chip.setAttribute('aria-selected', 'true');

            const filter = chip.getAttribute('data-filter');
            items.forEach((item) => {
                const match = filter === 'all' || item.getAttribute('data-category') === filter;
                item.classList.toggle('is-hidden', !match);
            });
        });
    });
}

// --------------------------------------------------------------------------
// Lightbox for gallery images.
// --------------------------------------------------------------------------
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lightbox) return;

    document.querySelectorAll('.gallery-item').forEach((item) => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.querySelector('figcaption span');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = caption ? caption.textContent : '';
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
        });
    });

    function close() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
    }

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}

// --------------------------------------------------------------------------
// Dashboard preview: animate the growth bar and percentage once visible.
// --------------------------------------------------------------------------
function initDashboardAnimation() {
    const fill = document.querySelector('.dash__growth-fill');
    const pct = document.querySelector('.dash__growth-pct');
    const panel = document.querySelector('.dash__panel');
    if (!fill || !panel) return;

    const target = Number(fill.getAttribute('data-target') || 0);
    let animated = false;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting || animated) return;
                animated = true;
                fill.style.width = `${target}%`;

                const duration = 1400;
                const start = performance.now();
                function step(now) {
                    const elapsed = Math.min((now - start) / duration, 1);
                    const value = Math.round(target * elapsed);
                    if (pct) pct.textContent = `${value}%`;
                    if (elapsed < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
                observer.unobserve(panel);
            });
        },
        { threshold: 0.3 }
    );

    observer.observe(panel);
}

// --------------------------------------------------------------------------
// Header: subtle solidify on scroll.
// --------------------------------------------------------------------------
function initHeaderOnScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    function update() {
        header.style.boxShadow = window.scrollY > 8 ? '0 2px 20px rgba(54,42,32,0.06)' : 'none';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
}

// --------------------------------------------------------------------------
// Boot
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const refCode = initReferralBadge();
    initWhatsAppButtons(refCode);
    initCatalogButtons();
    initSmoothScroll();
    initScrollReveal();
    initGrowthLine();
    initGalleryFilters();
    initLightbox();
    initDashboardAnimation();
    initHeaderOnScroll();
});