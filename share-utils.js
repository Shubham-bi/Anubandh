/**
 * share-utils.js - Multi-Attachment WhatsApp Sharing & Clipboard Utilities
 * व्हॉट्सॲप शेअरिंग, इमेज क्लिपबोर्ड कॉपी व फोन नंबर फॉरमॅटिंग युटिलिटीज
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhShareUtils = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Robust digit converter (handles Devanagari ०-९ and English 0-9)
  function toEnglishDigits(str) {
    if (!str) return '';
    const devanagari = ['०','१','२','३','४','५','६','७','८','९'];
    let res = String(str);
    for (let i = 0; i < 10; i++) {
      res = res.split(devanagari[i]).join(String(i));
    }
    return res.replace(/\D/g, '');
  }

  // Multi-format Image to Clipboard (handles Blob, DataURL, and Image URLs)
  async function copyImageToClipboard(input) {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) return false;
      let pngBlob = null;
      if (input instanceof Blob) {
        if (input.type === 'image/png') {
          pngBlob = input;
        } else {
          pngBlob = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const cvs = document.createElement('canvas');
              cvs.width = img.naturalWidth || img.width;
              cvs.height = img.naturalHeight || img.height;
              const ctx = cvs.getContext('2d');
              ctx.drawImage(img, 0, 0);
              cvs.toBlob(resolve, 'image/png');
            };
            img.src = URL.createObjectURL(input);
          });
        }
      } else if (typeof input === 'string' && input.startsWith('data:image/')) {
        const res = await fetch(input);
        pngBlob = await res.blob();
      } else if (typeof input === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = input;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      }
      if (pngBlob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        return true;
      }
    } catch (err) {
      console.warn('copyImageToClipboard error:', err);
    }
    return false;
  }

  function buildWhatsAppText(candidateName, srNo, guardianName) {
    let cleanGuardian = '';
    if (guardianName && typeof guardianName === 'string') {
      cleanGuardian = guardianName.replace(/^[-\s:;]+|[-\s:;]+$/g, '').trim();
      if (cleanGuardian === 'फोन क्रमांक' || cleanGuardian === '-' || cleanGuardian === 'पालक') {
        cleanGuardian = '';
      }
    }

    const settings = (typeof waSettings !== 'undefined' && waSettings) ? waSettings : {};
    const msgHandler = (typeof AnubandhMessages !== 'undefined') 
      ? AnubandhMessages 
      : ((typeof window !== 'undefined' ? window.AnubandhMessages : null));

    if (msgHandler && msgHandler.buildCandidateProposalMessage) {
      return msgHandler.buildCandidateProposalMessage({
        girlFatherName: cleanGuardian,
        girlName: candidateName,
        listNumber: srNo,
        groomName: settings.groomName,
        groomEdu: settings.groomEdu,
        groomJob: settings.groomJob,
        groomCompany: settings.groomCompany,
        groomSalary: settings.groomSalary,
        groomDob: settings.groomDob,
        groomGotra: settings.groomGotra,
        customTemplate: settings.customProposalTemplate
      });
    }
    return '';
  }

  async function openWhatsAppChat(phone, candidateName, srNo, guardianName) {
    const text = buildWhatsAppText(candidateName, srNo, guardianName);
    let digits = toEnglishDigits(phone);
    if (digits.length === 10) {
      digits = '91' + digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = '91' + digits.slice(1);
    }

    const waUrl = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // On mobile devices, always open WhatsApp directly with candidate's number
    if (isMobile) {
      window.location.href = waUrl;
      return;
    }

    // Desktop: Copy dynamic canvas image to clipboard for easy Ctrl+V pasting into WhatsApp Web
    let imgCopied = false;
    try {
      const getCard = (typeof getLiveBiodataCardBlob === 'function') 
        ? getLiveBiodataCardBlob 
        : (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.getLiveBiodataCardBlob : null);
      if (getCard) {
        const card = await getCard();
        if (card && card.blob) {
          imgCopied = await copyImageToClipboard(card.blob);
        }
      }
    } catch(e) {
      console.warn('Live card copy error, trying fallback:', e);
    }
    if (!imgCopied) {
      const photoSrc = './shubham_biodata_redesigned.png';
      imgCopied = await copyImageToClipboard(photoSrc);
    }
    window.open(waUrl, '_blank');
    if (typeof showToast === 'function') {
      if (imgCopied) {
        showToast('📸 पत्रिका फोटो क्लिपबोर्डवर कॉपी झाला! WhatsApp चॅटमध्ये फक्त Paste (Ctrl+V) करा.');
      } else {
        showToast('WhatsApp चॅट उघडले आहे!');
      }
    }
  }

  function getShareableProfileFullMessage() {
    const settings = (typeof waSettings !== 'undefined' && waSettings) ? waSettings : {};
    const msgHandler = (typeof AnubandhMessages !== 'undefined') ? AnubandhMessages : (typeof window !== 'undefined' ? window.AnubandhMessages : null);
    const profileUrl = (typeof AnubandhConfig !== 'undefined' && AnubandhConfig.PROFILE_URL) 
      ? AnubandhConfig.PROFILE_URL 
      : 'https://anubandh-shubham-kharche.vercel.app/profile';

    if (msgHandler && msgHandler.buildGenericShareMessage) {
      return msgHandler.buildGenericShareMessage({
        groomName: settings.groomName,
        groomEdu: settings.groomEdu,
        groomJob: settings.groomJob,
        groomCompany: settings.groomCompany,
        groomSalary: settings.groomSalary,
        groomDob: settings.groomDob,
        customTemplate: settings.customShareTemplate,
        biodataUrl: profileUrl
      });
    }
    return '';
  }

  async function shareProfileOnWhatsApp() {
    const msg = getShareableProfileFullMessage();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const getCard = (typeof getLiveBiodataCardBlob === 'function') 
      ? getLiveBiodataCardBlob 
      : (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.getLiveBiodataCardBlob : null);

    // Level 1: Mobile Native Web Share API with live dynamic canvas card attachment
    if (navigator.canShare && getCard) {
      try {
        const card = await getCard();
        if (card && card.blob) {
          const file = new File([card.blob], 'shubham_biodata_redesigned.png', { type: card.blob.type || 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'चि. शुभम अनिल खर्चे - विवाह परिचय पत्रिका',
              text: msg
            });
            if (typeof showToast === 'function') showToast('✅ पत्रिका फोटो व बायोडाटा मेसेज यशस्वीरित्या शेअर झाला!');
            return;
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.warn('Native share error:', e);
      }
    }

    // Level 2: Native text-only share fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'चि. शुभम अनिल खर्चे - विवाह परिचय पत्रिका',
          text: msg
        });
        if (typeof showToast === 'function') showToast('शेअर यशस्वी!');
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    // Level 3: Direct WhatsApp URL fallback
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      let imgCopied = false;
      try {
        if (getCard) {
          const card = await getCard();
          if (card && card.blob) {
            imgCopied = await copyImageToClipboard(card.blob);
          }
        }
      } catch (e) {}
      if (!imgCopied) {
        imgCopied = await copyImageToClipboard('./shubham_biodata_redesigned.png');
        if (!imgCopied) {
          imgCopied = await copyImageToClipboard('./shubham_kharche_biodata.jpg');
        }
      }
      window.open(waUrl, '_blank');
      if (typeof showToast === 'function') {
        if (imgCopied) {
          showToast('📸 पत्रिका फोटो क्लिपबोर्डवर कॉपी झाला! WhatsApp चॅटमध्ये फक्त Paste (Ctrl+V) करा.');
        } else {
          showToast('WhatsApp उघडले आहे!');
        }
      }
    }
  }

  async function copyProfileHyperlink() {
    const fullMsg = getShareableProfileFullMessage();
    let imgCopied = false;
    try {
      const getCard = (typeof getLiveBiodataCardBlob === 'function') 
        ? getLiveBiodataCardBlob 
        : (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.getLiveBiodataCardBlob : null);
      if (getCard) {
        const card = await getCard();
        if (card && card.blob) {
          imgCopied = await copyImageToClipboard(card.blob);
        }
      }
    } catch (e) {}
    if (!imgCopied) {
      imgCopied = await copyImageToClipboard('./shubham_biodata_redesigned.png');
    }
    if (imgCopied) {
      if (typeof showToast === 'function') showToast('📸 बायोडाटा पत्रिका इमेज क्लिपबोर्डवर कॉपी झाली! (चॅटमध्ये Paste करा)');
      return;
    }

    // Level 2: Fallback text copy
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullMsg).then(() => {
        if (typeof showToast === 'function') showToast('✅ बायोडाटा संदेश कॉपी झाला!');
      }).catch(() => {
        fallbackCopyProfileLink();
      });
    } else {
      fallbackCopyProfileLink();
    }
  }

  function fallbackCopyProfileLink() {
    const fullMsg = getShareableProfileFullMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullMsg).then(() => {
        if (typeof showToast === 'function') showToast('✅ बायोडाटा लिंक व संदेश कॉपी झाला!');
      }).catch(() => {
        prompt('बायोडाटा संदेश कॉपी करा:', fullMsg);
      });
    } else {
      prompt('बायोडाटा संदेश कॉपी करा:', fullMsg);
    }
  }

  function downloadGeneratedCard() {
    const dataUrl = window.generatedCardDataUrl || (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.generatedCardDataUrl : null);
    const blob = window.generatedCardBlob || (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.generatedCardBlob : null);
    if (!dataUrl && !blob) return;
    const link = document.createElement('a');
    link.href = dataUrl || URL.createObjectURL(blob);
    link.download = 'shubham_biodata_redesigned.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof showToast === 'function') showToast('इमेज कार्ड डाऊनलोड झाले!');
  }

  async function shareGeneratedCardWhatsApp() {
    const shareMsg = getShareableProfileFullMessage();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
    const blob = window.generatedCardBlob || (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.generatedCardBlob : null);

    if (navigator.canShare && blob) {
      try {
        const file = new File([blob], 'shubham_biodata_redesigned.png', { type: blob.type || 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'चि. शुभम अनिल खर्चे - विवाह परिचय पत्रिका',
            text: shareMsg
          });
          if (typeof showToast === 'function') showToast('शेअर यशस्वी!');
          return;
        }
      } catch(e) {
        if (e.name === 'AbortError') return;
        console.warn('Share error with file:', e);
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'चि. शुभम अनिल खर्चे - विवाह परिचय पत्रिका',
          text: shareMsg
        });
        if (typeof showToast === 'function') showToast('शेअर यशस्वी!');
        return;
      } catch (e3) {
        if (e3.name === 'AbortError') return;
      }
    }

    if (isMobile) {
      window.location.href = waUrl;
    } else {
      const imgCopied = await copyImageToClipboard('./shubham_biodata_redesigned.png');
      window.open(waUrl, '_blank');
      if (typeof showToast === 'function') {
        if (imgCopied) {
          showToast('📸 कार्ड क्लिपबोर्डवर कॉपी झाले! WhatsApp मध्ये Paste (Ctrl+V) करा.');
        } else {
          showToast('WhatsApp उघडले आहे!');
        }
      }
    }
  }

  async function shareGeneratedCardNative() {
    const shareMsg = getShareableProfileFullMessage();
    const blob = window.generatedCardBlob || (typeof AnubandhCardGenerator !== 'undefined' ? AnubandhCardGenerator.generatedCardBlob : null);
    if (navigator.canShare && blob) {
      try {
        const file = new File([blob], 'shubham_biodata_redesigned.png', { type: blob.type || 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'चि. शुभम अनिल खर्चे - विवाह परिचय पत्रिका',
            text: shareMsg
          });
          if (typeof showToast === 'function') showToast('शेअर यशस्वी!');
          return;
        }
      } catch(e) {
        if (e.name === 'AbortError') return;
      }
    }
    shareGeneratedCardWhatsApp();
  }

  return {
    toEnglishDigits,
    copyImageToClipboard,
    buildWhatsAppText,
    openWhatsAppChat,
    getShareableProfileFullMessage,
    shareProfileOnWhatsApp,
    copyProfileHyperlink,
    fallbackCopyProfileLink,
    downloadGeneratedCard,
    shareGeneratedCardWhatsApp,
    shareGeneratedCardNative
  };
});
