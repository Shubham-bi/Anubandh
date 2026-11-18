/**
 * auth-pwa.js - Application Authentication, PIN Lock & PWA Installation Controller
 * ॲप पासवर्ड/पिन सुरक्षा, लॉकआउट व्यवस्थापन आणि PWA इन्स्टॉलेशन नियंत्रक
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhAuthPWA = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const APP_PASS = '258';
  const APP_AUTH_KEY = 'anubandh_app_auth';
  const APP_ATTEMPTS_KEY = 'anubandh_app_auth_attempts';
  const APP_LOCKOUT_KEY = 'anubandh_app_auth_lockout_until';
  const LOCKOUT_MINUTES = 10;
  const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

  let appLockTimer = null;
  let deferredPrompt = null;

  function toMarathiDigits(num) {
    if (num === null || num === undefined) return '';
    const dev = ['०','१','२','३','४','५','६','७','८','९'];
    return String(num).replace(/[0-9]/g, d => dev[parseInt(d, 10)]);
  }

  function checkAppLockout() {
    const lockoutUntil = parseInt(localStorage.getItem(APP_LOCKOUT_KEY) || '0', 10);
    const now = Date.now();
    const inp = document.getElementById('appPassInput');
    const btn = document.getElementById('appPassBtn');
    const err = document.getElementById('appPassError');

    if (now < lockoutUntil) {
      if (inp) { inp.disabled = true; inp.value = ''; }
      if (btn) btn.disabled = true;

      const updateCountdown = () => {
        const remaining = lockoutUntil - Date.now();
        if (remaining <= 0) {
          if (appLockTimer) { clearInterval(appLockTimer); appLockTimer = null; }
          localStorage.removeItem(APP_LOCKOUT_KEY);
          localStorage.removeItem(APP_ATTEMPTS_KEY);
          if (inp) { inp.disabled = false; inp.focus(); }
          if (btn) btn.disabled = false;
          if (err) {
            err.style.display = 'block';
            err.style.color = '#15803d';
            err.innerHTML = '✅ ॲप अनलॉक झाले आहे. कृपया अचूक पिन टाका.';
          }
        } else {
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          const timeStr = `${toMarathiDigits(mins)}:${secs < 10 ? '०' : ''}${toMarathiDigits(secs)}`;
          if (err) {
            err.style.display = 'block';
            err.style.color = '#dc2626';
            err.innerHTML = `🔒 <strong>चुकीचा पिन टाकल्यामुळे ॲप लॉक झाले आहे.</strong><br/>कृपया <strong>${timeStr}</strong> मिनिटांनंतर पुन्हा प्रयत्न करा.`;
          }
        }
      };

      updateCountdown();
      if (!appLockTimer) {
        appLockTimer = setInterval(updateCountdown, 1000);
      }
      return true;
    }
    return false;
  }

  function checkAppAuth() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryPass = urlParams.get('pass') || urlParams.get('p');
      if (queryPass === APP_PASS) {
        localStorage.setItem(APP_AUTH_KEY, APP_PASS);
      }

      const saved = localStorage.getItem(APP_AUTH_KEY);
      if (saved === APP_PASS) {
        const gate = document.getElementById('appAuthGate');
        if (gate) gate.style.display = 'none';
        return true;
      }
    } catch (e) {
      console.error(e);
    }

    const gate = document.getElementById('appAuthGate');
    if (gate) gate.style.display = 'flex';

    if (!checkAppLockout()) {
      const inp = document.getElementById('appPassInput');
      if (inp) inp.focus();
    }
    return false;
  }

  function verifyAppPassword() {
    if (checkAppLockout()) return;

    const inp = document.getElementById('appPassInput');
    if (!inp) return;
    const val = (inp.value || '').trim();
    const err = document.getElementById('appPassError');

    if (val === APP_PASS) {
      try {
        localStorage.setItem(APP_AUTH_KEY, APP_PASS);
        localStorage.removeItem(APP_ATTEMPTS_KEY);
        localStorage.removeItem(APP_LOCKOUT_KEY);
      } catch (e) {}
      if (err) err.style.display = 'none';
      const gate = document.getElementById('appAuthGate');
      if (gate) gate.style.display = 'none';
      if (typeof showToast === 'function') showToast('स्वागत आहे! पासवर्ड सुरक्षितरित्या सेव्ह झाला.');
    } else {
      let attempts = parseInt(localStorage.getItem(APP_ATTEMPTS_KEY) || '0', 10) + 1;
      if (attempts >= 3) {
        const lockoutTime = Date.now() + LOCKOUT_MS;
        localStorage.setItem(APP_LOCKOUT_KEY, lockoutTime.toString());
        localStorage.removeItem(APP_ATTEMPTS_KEY);
        checkAppLockout();
      } else {
        localStorage.setItem(APP_ATTEMPTS_KEY, attempts.toString());
        const left = 3 - attempts;
        if (err) {
          err.style.display = 'block';
          err.style.color = '#dc2626';
          err.innerHTML = `❌ चुकीचा पिन! आपल्याकडे आणखी <strong>${toMarathiDigits(left)} संधी</strong> शिल्लक आहेत.<br/><small style="color:#64748b;">(३ वेळा चुकीचा पिन टाकल्यास ॲप १० मिनिटांसाठी लॉक होईल)</small>`;
        }
        inp.value = '';
        inp.focus();
      }
    }
  }

  // PWA Install Prompt Handlers
  function triggerPwaInstall() {
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          if (typeof showToast === 'function') showToast('अनुबंध ॲप यशस्वीरित्या इन्स्टॉल झाले!');
        }
        window.deferredPrompt = null;
        deferredPrompt = null;
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) banner.style.display = 'none';
        const mInstall = document.getElementById('menuInstallBtn');
        if (mInstall) mInstall.style.display = 'none';
      });
    } else {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        alert('अनुबंध ॲप आपल्या मोबाईलवर आधीच इन्स्टॉल झालेले आहे!');
      } else {
        alert('ॲप थेट इन्स्टॉल करण्यासाठी:\n१. मोबाईल ब्राऊझरच्या मेन्यूवर (⋮ किंवा Share) टॅप करा.\n२. "Install App" किंवा "Add to Home screen" निवडा.');
      }
    }
  }

  function dismissInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('anubandh_install_dismissed', 'true');
  }

  function setupInstallPromptBanner() {
    const isStandalone = (typeof window !== 'undefined') && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
    const banner = document.getElementById('pwaInstallBanner');
    const mInstall = document.getElementById('menuInstallBtn');

    if (isStandalone) {
      if (banner) banner.style.display = 'none';
      if (mInstall) mInstall.style.display = 'none';
      return;
    }

    if (sessionStorage.getItem('anubandh_install_dismissed') === 'true') {
      if (banner) banner.style.display = 'none';
      if (mInstall) mInstall.style.display = 'flex';
      return;
    }

    if (window.deferredPrompt || deferredPrompt) {
      if (banner) banner.style.display = 'flex';
      if (mInstall) mInstall.style.display = 'flex';
    }
  }

  // Smooth Scroll-to-Top Handler
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function handleScrollToTopVisibility() {
    const btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  return {
    APP_PASS,
    APP_AUTH_KEY,
    APP_ATTEMPTS_KEY,
    APP_LOCKOUT_KEY,
    LOCKOUT_MINUTES,
    LOCKOUT_MS,
    toMarathiDigits,
    checkAppLockout,
    checkAppAuth,
    verifyAppPassword,
    triggerPwaInstall,
    dismissInstallBanner,
    setupInstallPromptBanner,
    scrollToTop,
    handleScrollToTopVisibility,
    setDeferredPrompt: (p) => { deferredPrompt = p; window.deferredPrompt = p; }
  };
});
