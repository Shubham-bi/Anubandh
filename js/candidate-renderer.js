/**
 * candidate-renderer.js - Centralized Candidate Data Processing, Filtering, Sorting & Rendering Helpers
 * उमेदवारांची माहिती प्रक्रिया, कार्ड व टेबल रेंडरिंग, फिल्टर आणि क्रमवारी नियंत्रक
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

  const STATUS_MAP = {
    pending: { label: 'बाकी', cls: 'status-pending', icon: '⏳' },
    contacted: { label: 'संपर्क झाला', cls: 'status-contacted', icon: '📞' },
    interested: { label: 'सकारात्मक', cls: 'status-interested', icon: '👍' },
    followup: { label: 'बोलायचे', cls: 'status-followup', icon: '⏰' },
    not_interested: { label: 'नकार', cls: 'status-not_interested', icon: '❌' },
    matched: { label: 'जुळले 💐', cls: 'status-matched', icon: '💍' }
  };

  function toMarathiDigits(num) {
    if (num === null || num === undefined) return '';
    const dev = ['०','१','२','३','४','५','६','७','८','९'];
    return String(num).replace(/[0-9]/g, d => dev[parseInt(d, 10)]);
  }

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
    return toMarathiDigits(num);
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

  function toDigitsHelper(str) {
    if (typeof toEnglishDigits === 'function') return toEnglishDigits(str);
    if (!str) return '';
    const devanagari = ['०','१','२','३','४','५','६','७','८','९'];
    let res = String(str);
    for (let i = 0; i < 10; i++) {
      res = res.split(devanagari[i]).join(String(i));
    }
    return res.replace(/\D/g, '');
  }

  function parseContactSections(contactStr, phonesList) {
    const text = contactStr || '';
    const phones = (phonesList || []).map(p => ({
      display: p,
      clean: toDigitsHelper(p)
    }));

    let sections = [];
    const s1Idx = text.search(/संपर्क[\s-]*[१1][\):]/);
    if (s1Idx !== -1) {
      sections.push({ role: 'पालक', raw: text.slice(0, s1Idx).trim() });
      const rest = text.slice(s1Idx);
      const s2Idx = rest.search(/[\n\r]\s*[२2][\):]/);
      if (s2Idx !== -1) {
        sections.push({ role: 'संपर्क १', raw: rest.slice(0, s2Idx).trim() });
        sections.push({ role: 'संपर्क २', raw: rest.slice(s2Idx).trim() });
      } else {
        sections.push({ role: 'संपर्क १', raw: rest.trim() });
      }
    } else {
      sections.push({ role: 'पालक', raw: text.trim() });
    }

    const contacts = sections.map((sec, idx) => {
      const rawLines = sec.raw.split('\n').map(l => l.trim()).filter(Boolean);
      let matchedPhone = null;
      let infoLines = [];

      rawLines.forEach(line => {
        const lineDigits = toDigitsHelper(line);
        const matched = phones.find(p => lineDigits.includes(p.clean) && p.clean.length >= 8);
        if (matched && !matchedPhone) {
          matchedPhone = matched;
        }
        
        const isPurePhone = line.startsWith('मो.') || line.startsWith('मो:') || line.startsWith('मो ') || /^[०-९0-9\s-]+$/.test(line);
        if (!isPurePhone) {
          const textWithoutPhone = line
            .replace(/[,，]?\s*मो[.:\s].*$/i, '')
            .replace(/[,，]?\s*[०-९0-9\s-]{8,}$/, '')
            .trim();
          if (textWithoutPhone) {
            infoLines.push(textWithoutPhone);
          }
        }
      });

      if (!matchedPhone && phones[idx]) {
        matchedPhone = phones[idx];
      }

      const cleanedLines = infoLines.map(l => {
        return l.replace(/^संपर्क-[१1२2][\):]\s*/, '')
                .replace(/^[१1२2][\):]\s*/, '')
                .trim();
      }).filter(Boolean);

      let namePart = '';
      let addrPart = '';

      const addrRegex = /^(?:रा\.|रा\s|ह\.मु\.|मु\.|मु\s|पत्ता[:\s])/;

      if (cleanedLines.length >= 2) {
        const addrStartIdx = cleanedLines.findIndex((l, i) => i > 0 && addrRegex.test(l));
        if (addrStartIdx !== -1) {
          namePart = cleanedLines.slice(0, addrStartIdx).join(', ');
          addrPart = cleanedLines.slice(addrStartIdx).join(', ');
        } else {
          namePart = cleanedLines[0];
          addrPart = cleanedLines.slice(1).join(', ');
        }
      } else if (cleanedLines.length === 1) {
        const l = cleanedLines[0];
        const raMatch = l.match(/^(.+?)[,，]?\s*((?:रा\.|रा\s|ह\.मु\.|मु\.|मु\s|पत्ता[:\s]).+)$/);
        if (raMatch) {
          namePart = raMatch[1].trim();
          addrPart = raMatch[2].trim();
        } else {
          namePart = l;
          addrPart = '';
        }
      }

      namePart = namePart.replace(/[,，\s]+$/, '').trim();

      let infoFormatted = '-';
      if (namePart && addrPart) {
        infoFormatted = `<div class="contact-person-name">${namePart},</div><div class="contact-person-addr">${addrPart}</div>`;
      } else if (namePart) {
        infoFormatted = `<div class="contact-person-name">${namePart}</div>`;
      } else if (addrPart) {
        infoFormatted = `<div class="contact-person-addr">${addrPart}</div>`;
      }

      return {
        role: sec.role,
        info: infoFormatted,
        namePart: namePart,
        addrPart: addrPart,
        phone: matchedPhone
      };
    });

    const attachedCleans = contacts.map(c => c.phone ? c.phone.clean : '').filter(Boolean);
    const remaining = phones.filter(p => !attachedCleans.includes(p.clean));
    remaining.forEach((rem, rIdx) => {
      contacts.push({
        role: 'अतिरिक्त संपर्क ' + (rIdx + 1),
        info: '<div class="contact-person-name">फोन क्रमांक</div>',
        namePart: 'फोन क्रमांक',
        addrPart: '',
        phone: rem
      });
    });

    return contacts;
  }

  function renderCards(list) {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(c => {
      const sInfo = STATUS_MAP[c.status || 'pending'] || STATUS_MAP.pending;
      const lastLog = c.logs && c.logs.length ? c.logs[c.logs.length - 1] : null;
      const escapedName = (c.name || '').replace(/'/g, "\\'");

      const contactSections = parseContactSections(c.contact, c.phones);
      const contactRowsHtml = contactSections.map(cs => {
        const contactName = (cs.namePart || cs.info || '').replace(/<[^>]*>/g, '').trim().replace(/'/g, "\\'");
        return `
          <div class="contact-table-row">
            <div class="contact-row-left">
              <span class="contact-role-badge">${cs.role}</span>
              <div class="contact-name-info">${cs.info || '-'}</div>
            </div>
            <div class="contact-row-right">
              ${cs.phone ? `
                <button type="button" class="phone-chip-single" onclick="openPhoneActionPrompt('${cs.phone.clean}', '${cs.phone.display}', '${escapedName}', '${c.sr}', '${cs.role}', '${contactName}')" title="कॉल किंवा WhatsApp पर्याय">
                  📞 ${cs.phone.display}
                </button>
              ` : '<span style="font-size:11px; color:#94a3b8;">फोन नाही</span>'}
            </div>
          </div>
        `;
      }).join('');

      const card = document.createElement('div');
      card.className = 'profile-card' + (c.shortlisted ? ' is-shortlisted' : '');

      card.innerHTML = `
        <div class="card-top">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="cand-sr-badge">अ.क्र. ${c.sr}</span>
            </div>
            <h3 class="cand-name">
              ${c.name}
              ${calculateAge(c.date) ? `<span class="age-badge">वय: ${toMarathiDigits(calculateAge(c.date))} वर्षे</span>` : ''}
            </h3>
            <div class="cand-village">📍 जन्म ठिकाण: <strong>${c.mulgaon || '-'}</strong></div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
            <button type="button" class="btn-shortlist-star ${c.shortlisted ? 'active' : ''}" onclick="toggleShortlist('${c.id}', event)" title="${c.shortlisted ? 'शॉर्टलिस्ट मधून काढा' : 'शॉर्टलिस्ट करा'}">
              ${getStarSvg(!!c.shortlisted, 15)}
            </button>
            <span class="status-badge ${sInfo.cls}">
              ${sInfo.icon} ${sInfo.label}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-lbl">उंची / वर्ण:</span>
              <span class="detail-val">${c.height || '-'} / ${c.complexion || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-lbl">जन्म तारीख / वेळ:</span>
              <span class="detail-val detail-dob-val">${c.date || '-'} (${c.time || '-'})</span>
            </div>
            <div class="detail-item">
              <span class="detail-lbl">गोत्र:</span>
              <span class="detail-val" style="color:var(--primary-dark); font-weight:700;">${c.gotra || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-lbl">मामकुळ:</span>
              <span class="detail-val">${c.mamkul || '-'}</span>
            </div>
          </div>

          <div class="edu-box">
            <div class="edu-row">
              <div class="edu-header-title">🎓 शिक्षण व नोकरी:</div>
              <div class="edu-text-body">${c.edu || '-'}</div>
            </div>

            <div class="fam-exp-row">
              <div class="edu-header-title">👨‍👩‍👧 कुटुंब व अपेक्षा:</div>
              <div class="fam-exp-content">
                <span class="fam-chip"><strong>भावंडे:</strong> ${c.fam ? c.fam.replace(/\n/g, ', ') : '-'}</span>
                <span class="fam-chip"><strong>अपेक्षा:</strong> ${c.exp || 'अनुरूप'}</span>
                ${c.blood ? `<span class="fam-chip"><strong>रक्तगट:</strong> ${c.blood}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="contact-box">
            <div class="contact-header-title">👨‍👩‍👧 संपर्क व पालक माहिती:</div>
            <div class="contact-table">
              ${contactRowsHtml || '<span style="font-size:12px; color:var(--text-muted);">संपर्क उपलब्ध नाही</span>'}
            </div>
          </div>

          ${lastLog ? `
            <div class="last-log-box">
              <div class="last-log-title">
                <span>📝 शेवटचा संवाद (${lastLog.contactPerson || 'पालक'}):</span>
                <span>${new Date(lastLog.timestamp).toLocaleDateString('mr-IN')}</span>
              </div>
              <div>${lastLog.discussion || lastLog.additionalInfo || 'नोंद सेव्ह केली'}</div>
              ${lastLog.nextDate ? `<div style="font-weight:700; color:#b45309; margin-top:2px;">⏰ पुढील कॉल: ${lastLog.nextDate}</div>` : ''}
            </div>
          ` : ''}

          ${(c.extraDetails && c.extraDetails.length > 0) ? `
            <div class="extra-details-box" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; margin-top:8px;">
              <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <span>📌 अतिरिक्त माहिती (Additional Details):</span>
                <button type="button" onclick="openAddCandidateDetailModal('${c.id}', event)" style="background:none; border:none; color:#0284c7; font-weight:800; cursor:pointer; font-size:12px;">+ जोडा</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:5px;">
                ${c.extraDetails.map(ed => `
                  <div style="display:flex; justify-content:space-between; align-items:baseline; background:#fff; padding:6px 10px; border-radius:6px; border:1px solid #f1f5f9; font-size:12.5px; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                    <span style="font-weight:700; color:#475569; min-width:85px; margin-right:8px;">${ed.key}:</span>
                    <span style="color:#0f172a; flex:1; font-weight:600; word-break:break-word;">${ed.value}</span>
                    <button type="button" onclick="deleteCandidateDetail('${c.id}', '${ed.id}', event)" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer; margin-left:8px; line-height:1;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'" title="हटवा">&times;</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <div class="card-footer" style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button class="btn-track" style="flex:1 1 120px;" onclick="openTrackModal('${c.id}')">
            ✍️ संभाषण नोंद (${(c.logs || []).length})
          </button>
          <button type="button" class="btn-not-interested btn-reject-quick ${c.status === 'not_interested' ? 'active' : ''}" onclick="toggleNotInterestedCandidate('${c.id}', event)" title="${c.status === 'not_interested' ? 'Not Interested मागे घ्या' : 'Not Interested म्हणून नोंदवा'}" style="${c.status === 'not_interested' ? 'background:#fef2f2; border:1.5px solid #f87171; color:#dc2626;' : 'background:#f8fafc; border:1px solid #cbd5e1; color:#64748b;'} border-radius:8px; padding:7px 10px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; transition:all 0.2s;">
            ${c.status === 'not_interested' ? '🚫 Not Interested' : 'Not Interested'}
          </button>
          <button type="button" class="btn-card-edit btn-card-add-detail" onclick="openAddCandidateDetailModal('${c.id}', event)" title="अतिरिक्त माहिती जोडा (Add Additional Details)" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#0f172a; border-radius:8px; padding:7px 11px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; transition:all 0.2s;" onmouseover="this.style.background='#e0f2fe'; this.style.borderColor='#7dd3fc';" onmouseout="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1';">
            ➕ माहिती जोडा
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function renderTable(list) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach(c => {
      const sInfo = STATUS_MAP[c.status || 'pending'] || STATUS_MAP.pending;
      const logCount = (c.logs || []).length;
      const escapedName = (c.name || '').replace(/'/g, "\\'");

      const contactSections = parseContactSections(c.contact, c.phones);
      const phoneButtons = contactSections.filter(cs => cs.phone).map(cs => {
        const contactName = (cs.namePart || cs.info || '').replace(/<[^>]*>/g, '').trim().replace(/'/g, "\\'");
        return `
          <div style="margin-bottom:4px;">
            <button type="button" class="phone-chip-single" style="font-size:12px; padding:4px 8px;" onclick="openPhoneActionPrompt('${cs.phone.clean}', '${cs.phone.display}', '${escapedName}', '${c.sr}', '${cs.role}', '${contactName}')" title="${cs.role}: ${contactName} - कॉल किंवा WhatsApp">
              📞 ${cs.phone.display}
            </button>
          </div>
        `;
      }).join('') || '<span style="font-size:11px; color:#94a3b8;">-</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space:nowrap;">
          <button type="button" class="btn-shortlist-star ${c.shortlisted ? 'active' : ''}" style="margin-right:4px;" onclick="toggleShortlist('${c.id}', event)" title="${c.shortlisted ? 'शॉर्टलिस्ट मधून काढा' : 'शॉर्टलिस्ट करा'}">
            ${getStarSvg(!!c.shortlisted, 13)}
          </button>
          <span style="font-weight:700; color:var(--primary);">${c.sr}</span>
        </td>
        <td style="font-weight:700; min-width:140px;">
          ${c.name}
          ${calculateAge(c.date) ? `<span class="age-badge" style="font-size:11px; padding:1px 6px; margin-left:4px; display:inline-block;">वय: ${toMarathiDigits(calculateAge(c.date))} वर्षे</span>` : ''}
        </td>
        <td>${c.mulgaon || '-'}</td>
        <td>${c.height || '-'}<br/><span style="color:var(--text-muted); font-size:11.5px;">${c.complexion || '-'}</span></td>
        <td><strong>${c.gotra || '-'}</strong><br/><span style="color:var(--text-muted); font-size:11.5px;">${c.mamkul || '-'}</span></td>
        <td style="white-space:nowrap; font-size:12.5px;">${c.date || '-'} <span style="color:var(--text-muted); font-size:11.5px;">(${c.time || '-'})</span></td>
        <td><span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-weight:700; font-size:11px;">${c.blood || '-'}</span></td>
        <td style="max-width:190px; font-size:12px;">${(c.edu || '-').replace(/\n/g, ' ')}</td>
        <td style="font-size:12px;">${(c.fam || '-').replace(/\n/g, ' ')}</td>
        <td style="font-size:12px; min-width:180px;">
          ${contactSections.map(cs => `
            <div style="margin-bottom:6px;">
              <span class="contact-role-badge" style="font-size:10px; padding:1px 5px; margin-bottom:2px; display:inline-block;">${cs.role}</span>
              ${cs.info || '-'}
            </div>
          `).join('')}
          <div style="margin-top:4px;">${phoneButtons}</div>
        </td>
        <td>
          <span class="status-badge ${sInfo.cls}" style="font-size:11px; padding:2px 7px;">
            ${sInfo.icon} ${sInfo.label}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:4px; align-items:center;">
            <button class="action-btn action-btn-primary" style="padding:5px 9px; font-size:12px;" onclick="openTrackModal('${c.id}')" title="संभाषण नोंद">
              ✍️ (${logCount})
            </button>
            <button type="button" class="action-btn action-btn-outline btn-card-edit" style="padding:5px 8px; font-size:12px; font-weight:800;" onclick="openAddCandidateDetailModal('${c.id}', event)" title="अतिरिक्त माहिती जोडा (Add Detail)">
              ➕
            </button>
            <button type="button" class="btn-not-interested ${c.status === 'not_interested' ? 'active' : ''}" style="padding:5px 7px; font-size:11.5px; border-radius:6px; cursor:pointer;" onclick="toggleNotInterestedCandidate('${c.id}', event)" title="${c.status === 'not_interested' ? 'Not Interested मागे घ्या' : 'Not Interested'}">
              ${c.status === 'not_interested' ? '🚫' : 'Not Int.'}
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function toggleNotInterestedCandidate(id, event) {
    if (event) event.stopPropagation();
    const candList = (typeof window !== 'undefined' ? window.candidates : []) || [];
    const cand = candList.find(c => c.id === id);
    if (!cand) return;

    if (cand.status === 'not_interested') {
      cand.status = (cand.logs && cand.logs.length > 0) ? (cand.logs[cand.logs.length - 1].statusOutcome || 'contacted') : (typeof isCandidateShortlisted === 'function' && isCandidateShortlisted(cand.id) ? 'shortlisted' : 'pending');
      if (typeof showToast === 'function') showToast(`अ.क्र. ${cand.sr} चा Not Interested स्टेटस काढला.`);
    } else {
      cand.status = 'not_interested';
      if (typeof showToast === 'function') showToast(`अ.क्र. ${cand.sr} ला Not Interested म्हणून नोंदवले.`);
    }
    if (typeof persistData === 'function') persistData();
    if (typeof renderView === 'function') renderView();
  }
  const toggleRejectCandidate = toggleNotInterestedCandidate;

  return {
    STATUS_MAP,
    toMarathiDigits,
    convertDevanagariDigits,
    formatDevanagariNumber,
    parseSrNo,
    calculateAge,
    getStarSvg,
    sortCandidates,
    filterCandidates,
    parseContactSections,
    renderCards,
    renderTable,
    toggleNotInterestedCandidate,
    toggleRejectCandidate
  };
});
