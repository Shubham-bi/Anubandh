/**
 * candidate-renderer.js - Centralized Candidate Data Processing, Filtering, Sorting & Rendering Helpers
 * उमेदवारांची माहिती प्रक्रिया, फिल्टर, क्रमवारी आणि रेंडरिंग सहाय्यक
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhCandidateRenderer = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function convertDevanagariDigits(str) {
    if (!str) return '';
    const devanagari = ['०','१','२','३','४','५','६','७','८','९'];
    let res = String(str);
    for (let i = 0; i < 10; i++) {
      res = res.split(devanagari[i]).join(String(i));
    }
    return res;
  }

  function formatDevanagariNumber(num) {
    if (num === null || num === undefined) return '';
    const dev = ['०','१','२','३','४','५','६','७','८','९'];
    return String(num).replace(/[0-9]/g, d => dev[parseInt(d, 10)]);
  }

  function parseSrNo(srStr) {
    if (!srStr) return 0;
    const devanagari = ['०','१','२','३','४','५','६','७','८','९'];
    let clean = String(srStr).replace(/[^\d०-९]/g, '');
    for (let i = 0; i < 10; i++) {
      clean = clean.split(devanagari[i]).join(String(i));
    }
    const val = parseInt(clean, 10);
    return isNaN(val) ? 0 : val;
  }

  function calculateAge(dateStr) {
    if (!dateStr) return null;
    const eng = convertDevanagariDigits(dateStr).trim();
    const parts = eng.split(/[-/.]/);
    if (parts.length < 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (year < 1900 || year > 2050) return null;
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return (age > 0 && age < 120) ? age : null;
  }

  function getStarSvg(active, size = 16) {
    if (active) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }

  function sortCandidates(candidatesList, ascending = true) {
    if (!Array.isArray(candidatesList)) return [];
    return [...candidatesList].sort((a, b) => {
      const aSr = parseSrNo(a.sr);
      const bSr = parseSrNo(b.sr);
      return ascending ? (aSr - bSr) : (bSr - aSr);
    });
  }

  function filterCandidates(candidatesList, { searchTerm = '', filterStatus = 'all', listTab = 'all', showTestProfile = true } = {}) {
    if (!Array.isArray(candidatesList)) return [];
    const term = searchTerm.toLowerCase().trim();

    return candidatesList.filter(c => {
      // Hide test profile if expired
      if (!showTestProfile && parseSrNo(c.sr) === 0) {
        return false;
      }

      // Tab filter (shortlisted vs all)
      if (listTab === 'shortlisted' && !c.shortlisted) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && c.status !== filterStatus) {
        return false;
      }

      // Search query
      if (term) {
        const srMatch = String(c.sr).toLowerCase().includes(term);
        const nameMatch = (c.name || '').toLowerCase().includes(term);
        const mulgaonMatch = (c.mulgaon || '').toLowerCase().includes(term);
        const eduMatch = (c.edu || '').toLowerCase().includes(term);
        const gotraMatch = (c.gotra || '').toLowerCase().includes(term);
        const phoneMatch = (c.phones || []).some(p => p.includes(term));
        if (!srMatch && !nameMatch && !mulgaonMatch && !eduMatch && !gotraMatch && !phoneMatch) {
          return false;
        }
      }

      return true;
    });
  }

  return {
    convertDevanagariDigits,
    formatDevanagariNumber,
    parseSrNo,
    calculateAge,
    getStarSvg,
    sortCandidates,
    filterCandidates
  };
});
