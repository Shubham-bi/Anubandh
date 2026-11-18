/**
 * storage.js - Centralized Local Storage, Persistence & Export Utilities
 * डेटा संचयन, स्थानिक स्टोरेज (localStorage), बॅकअप आणि निर्यात युटिलिटीज
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhStorage = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'anubandh_candidates_v4';
  const SHORTLIST_STORAGE_KEY = 'anubandh_shortlist_v1';
  const USER_NAME_KEY = 'anubandh_user_name';
  const FIREBASE_CONFIG_KEY = 'anubandh_fb_config';
  const WA_SETTINGS_KEY = 'anubandh_wa_settings_v1';
  const PROFILE_STORAGE_KEY = 'anubandh_shareable_profile_data_v1';
  const APP_INSTALL_DATE_KEY = 'anubandh_app_install_date';

  function getStoredCandidates() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Error reading stored candidates:', e);
      return null;
    }
  }

  function setStoredCandidates(candidates) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
      return true;
    } catch (e) {
      console.warn('Error saving candidates to storage:', e);
      return false;
    }
  }

  function getStoredShortlist() {
    try {
      const stored = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function setStoredShortlist(list) {
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getStoredWaSettings() {
    try {
      const stored = localStorage.getItem(WA_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredWaSettings(settings) {
    try {
      localStorage.setItem(WA_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  }

  function downloadJsonFile(data, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = filename || ("anubandh_backup_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function exportDataJson(candidatesList) {
    const dataToExport = candidatesList || (typeof window !== 'undefined' ? window.candidates : []);
    downloadJsonFile(dataToExport, "anubandh_backup_" + new Date().toISOString().slice(0, 10) + ".json");
    if (typeof showToast === 'function') {
      showToast('JSON डाऊनलोड झाले!');
    }
  }

  function exportDataCsv(candidatesList) {
    const list = candidatesList || (typeof window !== 'undefined' ? window.candidates : []) || [];
    const headers = ["अ.क्र.", "नाव", "जन्म ठिकाण", "उंची", "वर्ण", "गोत्र", "मामकुळ", "जन्म तारीख", "वेळ", "रक्त", "शिक्षण", "कुटुंब", "अपेक्षा", "संपर्क", "फोन", "स्थिती"];
    const rows = list.map(c => [
      `"${c.sr}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.mulgaon || '').replace(/"/g, '""')}"`,
      `"${(c.height || '').replace(/"/g, '""')}"`,
      `"${(c.complexion || '').replace(/"/g, '""')}"`,
      `"${(c.gotra || '').replace(/"/g, '""')}"`,
      `"${(c.mamkul || '').replace(/"/g, '""')}"`,
      `"${(c.date || '').replace(/"/g, '""')}"`,
      `"${(c.time || '').replace(/"/g, '""')}"`,
      `"${(c.blood || '').replace(/"/g, '""')}"`,
      `"${(c.edu || '').replace(/"/g, '""')}"`,
      `"${(c.fam || '').replace(/"/g, '""')}"`,
      `"${(c.exp || '').replace(/"/g, '""')}"`,
      `"${(c.contact || '').replace(/"/g, '""')}"`,
      `"${(c.phones || []).join(', ')}"`,
      `"${c.status || 'pending'}"`
    ].join(','));

    const csvContent = "\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "anubandh_candidates_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (typeof showToast === 'function') {
      showToast('CSV डाऊनलोड झाली!');
    }
  }

  return {
    STORAGE_KEY,
    SHORTLIST_STORAGE_KEY,
    USER_NAME_KEY,
    FIREBASE_CONFIG_KEY,
    WA_SETTINGS_KEY,
    PROFILE_STORAGE_KEY,
    APP_INSTALL_DATE_KEY,
    getStoredCandidates,
    setStoredCandidates,
    getStoredShortlist,
    setStoredShortlist,
    getStoredWaSettings,
    setStoredWaSettings,
    downloadJsonFile,
    exportDataJson,
    exportDataCsv
  };
});
