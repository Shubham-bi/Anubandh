/**
 * voice-logger.js - Speech-to-Text Voice Logging Module in Marathi (mr-IN)
 * मराठी व्हॉइस स्पीच-टू-टेक्स्ट संभाषण नोंदणी युटिलिटी
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhVoiceLogger = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let activeVoiceRecognition = null;
  let activeVoiceTargetId = null;
  let activeVoiceBtn = null;

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isSpeechRecognitionSupported() {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function toggleVoiceSpeechRecognition(textareaId, btnEl) {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      if (typeof showToast === 'function') {
        showToast('⚠️ आपल्या ब्राउझरमध्ये व्हॉइस स्पीच रेकग्निशन उपलब्ध नाही.');
      }
      return;
    }

    const statusEl = document.getElementById(`voiceStatus_${textareaId}`);

    if (activeVoiceRecognition) {
      try { activeVoiceRecognition.stop(); } catch(e) {}
      activeVoiceRecognition = null;
      if (activeVoiceBtn) {
        activeVoiceBtn.classList.remove('listening');
        const lbl = activeVoiceBtn.querySelector('.voice-label');
        if (lbl) lbl.textContent = 'बोलून लिहा';
      }
      if (statusEl) statusEl.style.display = 'none';
      if (activeVoiceTargetId === textareaId) {
        activeVoiceTargetId = null;
        activeVoiceBtn = null;
        if (typeof showToast === 'function') showToast('🛑 व्हॉइस रेकॉर्डिंग थांबवले.');
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'mr-IN'; // Marathi
      recognition.continuous = true;
      recognition.interimResults = true;

      activeVoiceRecognition = recognition;
      activeVoiceTargetId = textareaId;
      activeVoiceBtn = btnEl;

      if (btnEl) {
        btnEl.classList.add('listening');
        const lbl = btnEl.querySelector('.voice-label');
        if (lbl) lbl.textContent = '🔴 ऐकत आहे (थांबवा)';
      }

      if (statusEl) {
        statusEl.style.display = 'flex';
        statusEl.innerHTML = `<span>🎙️ ऐकत आहे... मराठीत बोला. [पूर्ण झाल्यावर पुन्हा टॅप करा]</span>`;
      }

      const textarea = document.getElementById(textareaId);

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && textarea) {
          const curVal = textarea.value.trim();
          textarea.value = curVal ? (curVal + ' ' + finalTranscript.trim()) : finalTranscript.trim();
        }

        if (statusEl) {
          if (interimTranscript) {
            statusEl.innerHTML = `<span>🗣️ <em>"${escapeHtml(interimTranscript)}"</em></span>`;
          } else {
            statusEl.innerHTML = `<span>🎙️ ऐकत आहे... मराठीत बोला. [पूर्ण झाल्यावर पुन्हा टॅप करा]</span>`;
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (typeof showToast === 'function') {
          if (event.error === 'not-allowed') {
            showToast('⚠️ मायक्रोफोन परवानगी नाकारली आहे. कृपया ब्राउझरमध्ये Allow करा.');
          } else if (event.error !== 'no-speech') {
            showToast(`व्हॉइस त्रुटी: ${event.error}`);
          }
        }
      };

      recognition.onend = () => {
        if (activeVoiceRecognition === recognition) {
          activeVoiceRecognition = null;
          activeVoiceTargetId = null;
          if (btnEl) {
            btnEl.classList.remove('listening');
            const lbl = btnEl.querySelector('.voice-label');
            if (lbl) lbl.textContent = 'बोलून लिहा';
          }
          if (statusEl) statusEl.style.display = 'none';
        }
      };

      recognition.start();
      if (typeof showToast === 'function') showToast('🎙️ माईक सुरू झाला! मराठीत बोला.');
    } catch (err) {
      console.error('Speech recognition start error:', err);
      if (typeof showToast === 'function') showToast('व्हॉइस रेकॉर्डिंग सुरू करताना त्रुटी आली.');
    }
  }

  return {
    isSpeechRecognitionSupported,
    toggleVoiceSpeechRecognition,
    get activeVoiceRecognition() { return activeVoiceRecognition; }
  };
});
