/**
 * Excel Interactive Presentation — Main Script
 * Handles: navigation, progress bar, slide dots,
 *          keyboard arrows, hamburger menu, tab switching,
 *          and Intersection Observer animations.
 */

/* =========================================================
   CONSTANTS & STATE
   ========================================================= */
const TOTAL_SLIDES = 12;

/** Fraction of a slide that must be visible to mark it active (45%). */
const SLIDE_VISIBILITY_THRESHOLD = 0.45;

/** Minimum wheel delta magnitude to trigger slide navigation. */
const WHEEL_DELTA_THRESHOLD = 30;

/** Minimum vertical swipe distance (px) to trigger slide navigation. */
const SWIPE_THRESHOLD = 50;

/** Debounce window (ms) between successive scroll/swipe navigations. */
const SCROLL_DEBOUNCE_MS = 900;

/** Delay (ms) before hash-based scroll fires, ensuring layout is ready. */
const HASH_NAV_DELAY_MS = 100;

let currentSlide = 0;       // zero-based index of the active slide
let isScrolling  = false;   // debounce flag for wheel/touch navigation

/* =========================================================
   DOM REFERENCES
   ========================================================= */
const slides      = document.querySelectorAll('.slide');
const progressBar = document.getElementById('progress-bar');
const dotsNav     = document.getElementById('slide-dots');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');
const hamburger   = document.getElementById('hamburger');
const mainNav     = document.getElementById('main-nav');
const siteHeader  = document.getElementById('site-header');
const navLinks    = document.querySelectorAll('.nav-link');

/* =========================================================
   BUILD SLIDE DOTS
   ========================================================= */
slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', `Slide ${i + 1}`);
  dot.addEventListener('click', () => goToSlide(i));
  dotsNav.appendChild(dot);
});

const dots = document.querySelectorAll('.dot');

/* =========================================================
   NAVIGATION — go to a specific slide
   ========================================================= */
function goToSlide(index) {
  if (index < 0 || index >= TOTAL_SLIDES) return;

  currentSlide = index;
  slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateUI();
}

/* =========================================================
   UPDATE UI (progress, dots, nav links, buttons)
   ========================================================= */
function updateUI() {
  const progress = ((currentSlide) / (TOTAL_SLIDES - 1)) * 100;
  progressBar.style.width = progress + '%';

  // dots
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));

  // nav links
  navLinks.forEach((a, i) => a.classList.toggle('active', i === currentSlide));

  // arrow buttons
  btnPrev.disabled = currentSlide === 0;
  btnNext.disabled = currentSlide === TOTAL_SLIDES - 1;

  // header shadow when not on first slide
  siteHeader.classList.toggle('scrolled', currentSlide > 0);
}

/* =========================================================
   INTERSECTION OBSERVER — animate slides into view
   ========================================================= */
const slideObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // update current index based on which slide is visible
        const idx = parseInt(entry.target.dataset.index, 10);
        if (!isNaN(idx) && idx !== currentSlide) {
          currentSlide = idx;
          updateUI();
        }
      }
    });
  },
  {
    threshold: SLIDE_VISIBILITY_THRESHOLD,
  }
);

slides.forEach(slide => slideObserver.observe(slide));

/* =========================================================
   ARROW BUTTONS
   ========================================================= */
btnPrev.addEventListener('click', () => goToSlide(currentSlide - 1));
btnNext.addEventListener('click', () => goToSlide(currentSlide + 1));

/* =========================================================
   KEYBOARD NAVIGATION (← →, Page Up/Down, Home, End)
   ========================================================= */
document.addEventListener('keydown', (e) => {
  // Skip if focus is inside an interactive element
  const tag = document.activeElement.tagName.toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
      e.preventDefault();
      goToSlide(currentSlide + 1);
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      goToSlide(currentSlide - 1);
      break;
    case 'Home':
      e.preventDefault();
      goToSlide(0);
      break;
    case 'End':
      e.preventDefault();
      goToSlide(TOTAL_SLIDES - 1);
      break;
  }
});

/* =========================================================
   MOUSE WHEEL NAVIGATION
   ========================================================= */
document.addEventListener('wheel', (e) => {
  if (isScrolling) return;
  isScrolling = true;

  if (e.deltaY > WHEEL_DELTA_THRESHOLD) {
    goToSlide(currentSlide + 1);
  } else if (e.deltaY < -WHEEL_DELTA_THRESHOLD) {
    goToSlide(currentSlide - 1);
  }

  setTimeout(() => { isScrolling = false; }, SCROLL_DEBOUNCE_MS);
}, { passive: true });

/* =========================================================
   TOUCH SWIPE NAVIGATION
   ========================================================= */
let touchStartY = 0;
let touchStartX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (isScrolling) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  const dx = touchStartX - e.changedTouches[0].clientX;

  // Only act on predominantly vertical swipes
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
    isScrolling = true;
    goToSlide(dy > 0 ? currentSlide + 1 : currentSlide - 1);
    setTimeout(() => { isScrolling = false; }, SCROLL_DEBOUNCE_MS);
  }
}, { passive: true });

/* =========================================================
   HAMBURGER MENU
   ========================================================= */
hamburger.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// Close menu when a nav link is clicked
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const idx = parseInt(link.dataset.slide, 10);
    goToSlide(idx);
    mainNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
    mainNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});

/* =========================================================
   FORMAT TABS (Slide 8 — Formatarea celulelor)
   ========================================================= */
const ftabs   = document.querySelectorAll('.ftab');
const fpanels = document.querySelectorAll('.ftab-panel');

ftabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    // update tab buttons
    ftabs.forEach(t => t.classList.remove('ftab--active'));
    tab.classList.add('ftab--active');

    // update panels
    fpanels.forEach(p => p.classList.remove('ftab-panel--active'));
    const activePanel = document.getElementById('tab-' + target);
    if (activePanel) activePanel.classList.add('ftab-panel--active');
  });
});

/* =========================================================
   HASH NAVIGATION — support direct links like #slide-3
   ========================================================= */
function handleHash() {
  const hash = window.location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (target && target.classList.contains('slide')) {
    const idx = parseInt(target.dataset.index, 10);
    if (!isNaN(idx)) {
      setTimeout(() => goToSlide(idx), HASH_NAV_DELAY_MS);
    }
  }
}

window.addEventListener('hashchange', handleHash);

/* =========================================================
   INIT
   ========================================================= */
(function init() {
  updateUI();
  handleHash();

  // Make sure first slide is visible immediately
  if (slides[0]) slides[0].classList.add('visible');
})();
