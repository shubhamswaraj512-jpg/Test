// ==UserScript==
// @name         X & Reddit Silent Top Banner
// @version      1.3
// @match        *://*.x.com/*
// @match        *://*.reddit.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  let hideTimer = null;
  let removeTimer = null;
  let lastShown = 0;

  function showBanner() {
    const now = Date.now();
    if (now - lastShown < 1000) return;
    lastShown = now;

    clearTimeout(hideTimer);
    clearTimeout(removeTimer);

    const existing = document.getElementById('cod-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'cod-banner';
    banner.textContent = 'Tap to open alternative';
    Object.assign(banner.style, {
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top, 12px) + 8px)',
      left: '50%',
      transform: 'translate(-50%, -140%)',
      background: 'rgba(28, 28, 30, 0.94)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '999px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      border: '1px solid rgba(255,255,255,0.12)',
      zIndex: '2147483647',
      transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      cursor: 'pointer'
    });

    banner.addEventListener('click', () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
      banner.remove();
      window.location.href = 'shortcuts://run-shortcut?name=OpenCOD';
    });

    document.body.appendChild(banner);
    requestAnimationFrame(() => {
      banner.style.transform = 'translate(-50%, 0)';
    });

    hideTimer = setTimeout(() => {
      banner.style.transform = 'translate(-50%, -140%)';
      removeTimer = setTimeout(() => banner.remove(), 400);
    }, 5000);
  }

  // Trigger on initial page load
  showBanner();

  // Trigger whenever switching back to Safari / tab from another app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      showBanner();
    }
  });
})();
