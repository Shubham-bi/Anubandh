/**
 * modals.js - Centralized Dialogs, Custom Confirm & Popups Manager
 * संवाद, कस्टम पुष्टीकरण डायलॉग (Confirm Modal), फोन ॲक्शन व मॉडल्स मॅनेजर
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhModals = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ==========================================
  // 1. CUSTOM CONFIRM MODAL (replaces confirm())
  // ==========================================
  let confirmResolveCallback = null;

  function showCustomConfirm({ title, message, confirmText = 'होय, पुष्टी करा', cancelText = 'रद्द करा', type = 'danger' }) {
    return new Promise((resolve) => {
      confirmResolveCallback = resolve;
      const modal = document.getElementById('customConfirmModal');
      if (!modal) {
        resolve(window.confirm ? window.confirm(`${title}\n${message}`) : true);
        return;
      }
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const okBtn = document.getElementById('confirmOkBtn');
      const cancelBtn = document.getElementById('confirmCancelBtn');
      const iconContainer = document.getElementById('confirmIconContainer');

      if (titleEl) titleEl.textContent = title || 'पुष्टीकरण';
      if (msgEl) msgEl.textContent = message || '';
      if (okBtn) okBtn.textContent = confirmText;
      if (cancelBtn) cancelBtn.textContent = cancelText;

      if (iconContainer && okBtn) {
        if (type === 'danger') {
          iconContainer.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
          iconContainer.style.background = '#fee2e2';
          okBtn.style.background = '#dc2626';
          okBtn.style.borderColor = '#dc2626';
        } else {
          iconContainer.innerHTML = '⚠️';
          iconContainer.style.background = '#fef3c7';
          okBtn.style.background = '#d97706';
          okBtn.style.borderColor = '#d97706';
        }
      }

      modal.classList.add('open');
    });
  }

  function handleCustomConfirmOk() {
    const modal = document.getElementById('customConfirmModal');
    if (modal) modal.classList.remove('open');
    if (confirmResolveCallback) {
      confirmResolveCallback(true);
      confirmResolveCallback = null;
    }
  }

  function handleCustomConfirmCancel() {
    const modal = document.getElementById('customConfirmModal');
    if (modal) modal.classList.remove('open');
    if (confirmResolveCallback) {
      confirmResolveCallback(false);
      confirmResolveCallback = null;
    }
  }

  function closeCustomConfirmModal() {
    handleCustomConfirmCancel();
  }

  // ==========================================
  // 2. PHONE ACTION MODAL
  // ==========================================
  let activePhoneAction = null;

  function openPhoneActionPrompt(cleanDigits, displayPhone, candName, srNo, roleName, contactPersonName) {
    activePhoneAction = { cleanDigits, displayPhone, candName, srNo, roleName, contactPersonName };

    const subEl = document.getElementById('phoneModalSubtitle');
    if (subEl) subEl.textContent = `${candName} (अ.क्र. ${srNo}) • ${roleName || 'पालक'}`;

    const nameEl = document.getElementById('phoneModalContactName');
    if (nameEl) {
      if (contactPersonName && contactPersonName !== '-' && contactPersonName !== 'फोन क्रमांक') {
        nameEl.innerHTML = `👤 <strong>${contactPersonName}</strong>`;
        nameEl.style.display = 'inline-flex';
      } else {
        nameEl.style.display = 'none';
      }
    }

    const numEl = document.getElementById('phoneModalDisplayNumber');
    if (numEl) numEl.textContent = `📞 ${displayPhone}`;

    const callBtn = document.getElementById('phoneModalCallBtn');
    if (callBtn) callBtn.href = `tel:${cleanDigits}`;

    const modal = document.getElementById('phoneActionModal');
    if (modal) modal.classList.add('open');
  }

  function closePhoneActionModal(event) {
    if (event && event.target && event.target !== event.currentTarget) return;
    const modal = document.getElementById('phoneActionModal');
    if (modal) modal.classList.remove('open');
  }

  function executeModalWhatsApp() {
    if (!activePhoneAction) return;
    const { cleanDigits, candName, srNo, contactPersonName } = activePhoneAction;
    closePhoneActionModal();
    if (typeof openWhatsAppChat === 'function') {
      openWhatsAppChat(cleanDigits, candName, srNo, contactPersonName);
    }
  }

  function executeModalCopy() {
    if (!activePhoneAction) return;
    const num = activePhoneAction.cleanDigits || activePhoneAction.displayPhone;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num).then(() => {
        if (typeof showToast === 'function') showToast(`नंबर ${activePhoneAction.displayPhone} कॉपी केला!`);
        closePhoneActionModal();
      });
    } else {
      closePhoneActionModal();
    }
  }

  // ==========================================
  // 3. CANDIDATE ADDITIONAL DETAIL MODAL (+ Button)
  // ==========================================
  function openAddCandidateDetailModal(candId, event) {
    if (event) event.stopPropagation();
    const cList = (typeof window !== 'undefined' ? window.candidates : []) || [];
    const cand = cList.find(c => c.id === candId);
    if (!cand) return;

    const targetIdEl = document.getElementById('candDetailTargetId');
    const titleEl = document.getElementById('candDetailModalTitle');
    const subEl = document.getElementById('candDetailModalSubtitle');
    const keyInp = document.getElementById('candDetailKeyInput');
    const valInp = document.getElementById('candDetailValInput');

    if (targetIdEl) targetIdEl.value = candId;
    if (titleEl) titleEl.textContent = `➕ [अ.क्र. ${cand.sr}] ${cand.name} - माहिती जोडा`;
    if (subEl) subEl.textContent = `उमेदवार: ${cand.name} (अ.क्र. ${cand.sr}) साठी नवीन तपशील जोडा`;

    if (keyInp) keyInp.value = '';
    if (valInp) valInp.value = '';

    renderExistingDetails(cand);
    const modal = document.getElementById('candidateDetailModal');
    if (modal) modal.classList.add('open');
    setTimeout(() => {
      if (keyInp) keyInp.focus();
    }, 150);
  }

  function closeCandidateDetailModal() {
    const modal = document.getElementById('candidateDetailModal');
    if (modal) modal.classList.remove('open');
  }

  function selectQuickKey(key) {
    const keyInp = document.getElementById('candDetailKeyInput');
    const valInp = document.getElementById('candDetailValInput');
    if (keyInp) keyInp.value = key;
    if (valInp) valInp.focus();
  }

  function renderExistingDetails(cand) {
    const listEl = document.getElementById('existingDetailsList');
    if (!listEl) return;
    const details = cand.extraDetails || [];

    if (details.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px; color:#94a3b8; font-style:italic;">कोणतीही अतिरिक्त माहिती जोडलेली नाही. वरील फॉर्ममधून नवीन माहिती जोडा.</div>';
      return;
    }

    listEl.innerHTML = details.map(d => `
      <div style="display:flex; justify-content:space-between; align-items:baseline; background:#fff; padding:7px 10px; border-radius:8px; border:1px solid #e2e8f0; font-size:12.5px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
        <div style="flex:1; word-break:break-word;">
          <span style="font-weight:700; color:#0f172a; margin-right:6px;">${d.key}:</span>
          <span style="color:#334155;">${d.value}</span>
        </div>
        <button type="button" onclick="deleteCandidateDetail('${cand.id}', '${d.id}', event)" style="background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer; padding:0 4px; line-height:1; margin-left:8px;" title="माहिती हटवा">&times;</button>
      </div>
    `).join('');
  }

  function saveCandidateDetail() {
    const targetIdEl = document.getElementById('candDetailTargetId');
    const candId = targetIdEl ? targetIdEl.value : null;
    const keyInp = document.getElementById('candDetailKeyInput');
    const valInp = document.getElementById('candDetailValInput');
    const key = keyInp ? keyInp.value.trim() : '';
    const val = valInp ? valInp.value.trim() : '';

    if (!key) {
      if (typeof showToast === 'function') showToast('कृपया शीर्षक किंवा माहितीचे नाव (Key Name) टाका.');
      if (keyInp) keyInp.focus();
      return;
    }
    if (!val) {
      if (typeof showToast === 'function') showToast('कृपया सविस्तर तपशील (Details) टाका.');
      if (valInp) valInp.focus();
      return;
    }

    const cList = (typeof window !== 'undefined' ? window.candidates : []) || [];
    const cand = cList.find(c => c.id === candId);
    if (!cand) return;

    if (!Array.isArray(cand.extraDetails)) {
      cand.extraDetails = [];
    }

    cand.extraDetails.push({
      id: 'ed_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      key: key,
      value: val,
      createdAt: new Date().toISOString()
    });

    if (keyInp) keyInp.value = '';
    if (valInp) valInp.value = '';
    renderExistingDetails(cand);

    if (typeof persistData === 'function') persistData();
    if (typeof renderView === 'function') renderView();
    if (typeof showToast === 'function') showToast(`✅ माहिती जतन झाली!`);
  }

  function deleteCandidateDetail(candId, detailId, event) {
    if (event) event.stopPropagation();
    const cList = (typeof window !== 'undefined' ? window.candidates : []) || [];
    const cand = cList.find(c => c.id === candId);
    if (!cand || !Array.isArray(cand.extraDetails)) return;

    cand.extraDetails = cand.extraDetails.filter(d => d.id !== detailId);
    renderExistingDetails(cand);

    if (typeof persistData === 'function') persistData();
    if (typeof renderView === 'function') renderView();
    if (typeof showToast === 'function') showToast('माहिती हटवली.');
  }

  // ==========================================
  // 4. FULL PHOTO & BIO VIEW MODAL
  // ==========================================
  function openFullPhoto(imgSrc, candName) {
    const modal = document.getElementById('bioViewModal');
    const img = document.getElementById('fullBioImg');
    const title = document.getElementById('bioViewTitle');
    if (!modal) return;
    if (img) img.src = imgSrc;
    if (title) title.textContent = candName || 'बायोडाटा / फोटो';
    modal.classList.add('open');
  }

  function closeFullPhoto() {
    const modal = document.getElementById('bioViewModal');
    if (modal) modal.classList.remove('open');
  }

  function openAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) modal.classList.add('open');
  }

  function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) modal.classList.remove('open');
  }

  function openBiodataModal() {
    const modal = document.getElementById('biodataModal');
    if (modal) modal.classList.add('open');
  }

  function closeBiodataModal() {
    const modal = document.getElementById('biodataModal');
    if (modal) modal.classList.remove('open');
  }

  // ==========================================
  // 5. BACK BUTTON & MODAL STACK MANAGER
  // ==========================================
  let lastBackPressTime = 0;
  const BACK_EXIT_DELAY_MS = 2000;

  function getOpenModal() {
    const modalList = [
      { id: 'candidateDetailModal', close: closeCandidateDetailModal },
      { id: 'customConfirmModal', close: closeCustomConfirmModal },
      { id: 'canvasCardModal', close: () => (typeof closeCanvasCardModal === 'function' ? closeCanvasCardModal() : null) },
      { id: 'biodataModal', close: closeBiodataModal },
      { id: 'sideMenuOverlay', close: () => (typeof closeSideMenu === 'function' ? closeSideMenu() : null) },
      { id: 'phoneActionModal', close: () => closePhoneActionModal() },
      { id: 'aboutModal', close: closeAboutModal },
      { id: 'bioViewModal', close: closeFullPhoto },
      { id: 'trackModal', close: () => (typeof closeTrackModal === 'function' ? closeTrackModal() : null) },
      { id: 'pwdModal', close: () => (typeof closePwdModal === 'function' ? closePwdModal() : null) },
      { id: 'adminSettingsModal', close: () => (typeof closeAdminSettingsModal === 'function' ? closeAdminSettingsModal() : null) }
    ];
    for (const m of modalList) {
      const el = document.getElementById(m.id);
      if (el && el.classList.contains('open')) {
        return m;
      }
    }
    return null;
  }

  function initBackButtonHandler() {
    try {
      history.pushState({ page: 'anubandh_app' }, '', window.location.href);
    } catch (e) {}

    window.addEventListener('popstate', (e) => {
      const openModal = getOpenModal();
      if (openModal) {
        openModal.close();
        history.pushState({ page: 'anubandh_app' }, '', window.location.href);
        return;
      }

      const now = Date.now();
      if (now - lastBackPressTime < BACK_EXIT_DELAY_MS) {
        history.back();
      } else {
        lastBackPressTime = now;
        if (typeof showToast === 'function') {
          showToast('ॲपमधून बाहेर पडण्यासाठी पुन्हा मागे दाबा (Press Back again to exit)');
        }
        history.pushState({ page: 'anubandh_app' }, '', window.location.href);
      }
    });
  }

  return {
    showCustomConfirm,
    handleCustomConfirmOk,
    handleCustomConfirmCancel,
    closeCustomConfirmModal,
    openPhoneActionPrompt,
    closePhoneActionModal,
    executeModalWhatsApp,
    executeModalCopy,
    openAddCandidateDetailModal,
    closeCandidateDetailModal,
    selectQuickKey,
    renderExistingDetails,
    saveCandidateDetail,
    deleteCandidateDetail,
    openFullPhoto,
    closeFullPhoto,
    openAboutModal,
    closeAboutModal,
    openBiodataModal,
    closeBiodataModal,
    getOpenModal,
    initBackButtonHandler,
    BACK_EXIT_DELAY_MS,
    get lastBackPressTime() { return lastBackPressTime; }
  };
});
