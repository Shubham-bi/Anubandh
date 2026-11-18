/**
 * card-generator.js - Centralized HTML5 Canvas Biodata Card Generator
 * विवाह परिचय पत्रिकेचे रिअल-टाइम कॅनव्हास इमेज कार्ड जनरेटर
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const mod = factory();
    Object.assign(root, mod);
    root.AnubandhCardGenerator = mod;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let generatedCardBlob = null;
  let generatedCardDataUrl = null;

  function resetGeneratedCardCache() {
    generatedCardBlob = null;
    generatedCardDataUrl = null;
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y + width, x, y, radius);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function generateBiodataCardBlob() {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');

      // Background Gradient (Ivory Parchment)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1440);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.3, '#fffdf7');
      bgGrad.addColorStop(1, '#fef9ee');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1440);

      // Ornate Borders
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#881337'; // Maroon
      ctx.strokeRect(24, 24, 1080 - 48, 1440 - 48);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d97706'; // Gold
      ctx.strokeRect(36, 36, 1080 - 72, 1440 - 72);

      // Corner accents
      const drawCorner = (x, y, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = '#881337';
        ctx.fillRect(0, 0, 24, 6);
        ctx.fillRect(0, 0, 6, 24);
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(12, 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawCorner(44, 44, 0);
      drawCorner(1080 - 44, 44, Math.PI / 2);
      drawCorner(1080 - 44, 1440 - 44, Math.PI);
      drawCorner(44, 1440 - 44, -Math.PI / 2);

      // Header Top Invocation
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 26px "Mukta", serif';
      ctx.fillText('॥ श्री गणेशाय नमः ॥', 540, 85);

      // Header Ribbon Badge
      ctx.fillStyle = '#881337';
      roundRect(ctx, 320, 105, 440, 42, 21, true, false);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Mukta", sans-serif';
      ctx.fillText('विवाह प्रस्ताव • परिचय पत्रिका', 540, 133);

      // Family Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '600 18px "Mukta", sans-serif';
      ctx.fillText('खर्चे परिवार (जळगाव / पुणे)', 540, 172);

      // Data references
      const pData = (typeof shareableProfileData !== 'undefined' && shareableProfileData) 
        ? shareableProfileData 
        : ((typeof DEFAULT_PROFILE_DATA !== 'undefined') ? DEFAULT_PROFILE_DATA : null);
      const settings = (typeof waSettings !== 'undefined' && waSettings) ? waSettings : {};

      const findVal = (secId, keyPart) => {
        if (!pData?.sections) return '';
        const sec = pData.sections.find(s => s.id === secId);
        if (!sec?.fields) return '';
        const f = sec.fields.find(fld => fld.label && fld.label.includes(keyPart));
        return f ? f.value : '';
      };

      // Photo Source
      const photoSec = pData?.sections?.find(s => s.type === 'photo');
      const photoSrc = (photoSec && photoSec.photoUrl) ? photoSec.photoUrl : './shubham_kharche_biodata.jpg';

      const photoImg = new Image();
      if (photoSrc && !photoSrc.startsWith('data:image/')) {
        photoImg.crossOrigin = 'anonymous';
      }

      const continueDrawing = (imgObj, isFallback = false) => {
        const photoX = 540;
        const photoY = 285;
        const radius = 95;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;

        ctx.beginPath();
        ctx.arc(photoX, photoY, radius + 7, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(photoX, photoY, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#881337';
        ctx.fill();
        ctx.restore();

        if (imgObj && !isFallback) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(photoX, photoY, radius, 0, Math.PI * 2);
          ctx.clip();
          try {
            const aspect = imgObj.width / imgObj.height;
            let drawW = radius * 2;
            let drawH = radius * 2;
            let dx = photoX - radius;
            let dy = photoY - radius;
            if (aspect > 1) {
              drawW = drawH * aspect;
              dx = photoX - drawW / 2;
            } else {
              drawH = drawW / aspect;
              dy = photoY - drawH / 2;
            }
            ctx.drawImage(imgObj, dx, dy, drawW, drawH);
          } catch(e) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(photoX - radius, photoY - radius, radius * 2, radius * 2);
          }
          ctx.restore();
        } else {
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.arc(photoX, photoY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 70px "Mukta", sans-serif';
          ctx.fillText('🤵', photoX, photoY + 25);
        }

        // Name & Profession
        const name = pData?.hero?.name || settings.groomName || 'चि. शुभम अनिल खर्चे';
        const edu = pData?.hero?.role || settings.groomEdu || 'B.E. Mechanical Engineering';
        const job = (findVal('sec-job', 'पद') ? `${findVal('sec-job', 'पद')}, ${findVal('sec-job', 'कंपनी') || 'Pune'}` : `${settings.groomJob || 'Sr. QA Engineer'}, ${settings.groomCompany || 'Pune'}`);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#881337';
        ctx.font = 'bold 44px "Mukta", sans-serif';
        ctx.fillText(name.startsWith('चि.') ? name : 'चि. ' + name, 540, 435);

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 22px "Mukta", sans-serif';
        ctx.fillText(edu, 540, 472);

        ctx.fillStyle = '#334155';
        ctx.font = '600 20px "Mukta", sans-serif';
        ctx.fillText(job, 540, 502);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(120, 525);
        ctx.lineTo(960, 525);
        ctx.stroke();

        // 8 Vitals Cards Grid
        const vitals = [
          { label: 'जन्म तारीख व वेळ', val: (findVal('sec-personal', 'तारीख') || settings.groomDob || '२५/०८/१९९६') + ' • ' + (findVal('sec-personal', 'वेळ') || settings.groomTime || 'स. ११:५६') },
          { label: 'उंची व वर्ण', val: (findVal('sec-personal', 'उंची') || "५' ९\"") + ' • ' + (findVal('sec-personal', 'वर्ण') || 'गोरा') },
          { label: 'वार्षिक पॅकेज', val: (findVal('sec-job', 'उत्पन्न') || settings.groomSalary || '७.८ लाख (7.8 LPA)') },
          { label: 'गोत्र व रक्तगट', val: (findVal('sec-personal', 'गोत्र') || settings.groomGotra || 'वशिष्ठ') + ' • ' + (findVal('sec-personal', 'रक्तगट') || 'B+ve') },
          { label: 'मूळ गाव व वास्तव', val: (findVal('sec-personal', 'जन्म ठिकाण') ? findVal('sec-personal', 'जन्म ठिकाण').split(',')[0].trim() : (settings.groomPlace || 'शेलगाव बाजार')) + ' • ह. मु. पुणे' },
          { label: 'वडील व व्यवसाय', val: (findVal('sec-family', 'वडिलांचे') || settings.groomFather || 'कै. अनिल पुंजाजी खर्चे') + ' • ' + (findVal('sec-family', 'शेती') || 'शेती (५.५ एकर)') },
          { label: 'आई व भावंडे', val: (findVal('sec-family', 'आईचे') || settings.groomMother || 'सौ. अनिता खर्चे') + ' • ' + (findVal('sec-family', 'बहिणी') || '२ बहिणी (विवाहित)') },
          { label: 'मामाचे कुळ', val: findVal('sec-personal', 'मामा') || settings.groomMamkul || 'चोपडे, दाताळा' }
        ];

        const startY = 545;
        const colW = 445;
        const rowH = 88;
        const gapX = 30;
        const gapY = 14;

        vitals.forEach((v, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const vx = 80 + col * (colW + gapX);
          const vy = startY + row * (rowH + gapY);

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0,0,0,0.04)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          roundRect(ctx, vx, vy, colW, rowH, 10, true, false);
          ctx.shadowColor = 'transparent';

          ctx.strokeStyle = '#f1f5f9';
          ctx.lineWidth = 1.5;
          roundRect(ctx, vx, vy, colW, rowH, 10, false, true);

          ctx.fillStyle = col === 0 ? '#be123c' : '#0284c7';
          roundRect(ctx, vx, vy + 14, 4, rowH - 28, 2, true, false);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#64748b';
          ctx.font = '600 15px "Mukta", sans-serif';
          ctx.fillText(v.label, vx + 18, vy + 32);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 18.5px "Mukta", sans-serif';
          ctx.fillText(v.val, vx + 18, vy + 64);
        });

        // Family & Contacts
        const footY = 980;
        ctx.fillStyle = '#f8fafc';
        roundRect(ctx, 80, footY, 920, 160, 12, true, false);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        roundRect(ctx, 80, footY, 920, 160, 12, false, true);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#881337';
        ctx.font = 'bold 22px "Mukta", sans-serif';
        ctx.fillText('📞 संपर्क: खर्चे परिवार', 540, footY + 40);

        const elders = pData?.sections?.find(s => s.id === 'sec-contacts')?.elders || [];
        let contactLine1 = elders[0] ? `${elders[0].name}: ${elders[0].displayPhone || elders[0].phone}` : 'श्री. विजय खर्चे: ९४२०५३९३९६';
        if (elders[1]) contactLine1 += ` | ${elders[1].name}: ${elders[1].displayPhone || elders[1].phone}`;
        let contactLine2 = elders[2] ? `${elders[2].name}: ${elders[2].displayPhone || elders[2].phone}` : 'ह. मु. पुणे / मूळगाव: शेलगाव बाजार, ता. मोताळा, जि. बुलढाणा';
        if (elders[3]) contactLine2 += ` | ${elders[3].name}: ${elders[3].displayPhone || elders[3].phone}`;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Mukta", sans-serif';
        ctx.fillText(contactLine1, 540, footY + 80);

        ctx.fillStyle = '#64748b';
        ctx.font = '16px "Mukta", sans-serif';
        ctx.fillText(contactLine2, 540, footY + 120);

        // Digital Profile Link Banner
        const linkY = 1170;
        ctx.fillStyle = '#f0fdf4';
        roundRect(ctx, 80, linkY, 920, 130, 12, true, false);
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 80, linkY, 920, 130, 12, false, true);

        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 20px "Mukta", sans-serif';
        ctx.fillText('🌐 सविस्तर डिजिटल बायोडाटा व कुंडली पाहण्यासाठी लिंक:', 540, linkY + 42);

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 24px "Mukta", sans-serif';
        const profileBannerUrl = (typeof AnubandhConfig !== 'undefined' && AnubandhConfig.PROFILE_URL) 
          ? AnubandhConfig.PROFILE_URL 
          : 'https://anubandh-shubham-kharche.vercel.app/profile';
        ctx.fillText('👉 ' + profileBannerUrl, 540, linkY + 85);

        // Bottom Branding
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 16px "Mukta", sans-serif';
        ctx.fillText('अनुबंध (Anubandh) • दोन मनांचे आणि दोन घराण्यांचे रेशीमबंध', 540, 1375);

        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          if (canvas.toBlob) {
            canvas.toBlob((blob) => {
              generatedCardBlob = blob;
              generatedCardDataUrl = dataUrl;
              resolve({ blob, dataUrl });
            }, 'image/jpeg', 0.92);
          } else {
            generatedCardDataUrl = dataUrl;
            resolve({ blob: null, dataUrl });
          }
        } catch(taintErr) {
          console.warn('Canvas export failed, redrawing with clean avatar:', taintErr);
          if (!isFallback) {
            continueDrawing(null, true);
          } else {
            resolve({ blob: null, dataUrl: '' });
          }
        }
      };

      photoImg.onload = () => continueDrawing(photoImg);
      photoImg.onerror = () => continueDrawing(null);
      photoImg.src = photoSrc;
      setTimeout(() => {
        if (!photoImg.complete) continueDrawing(null);
      }, 1200);
    });
  }

  async function getLiveBiodataCardBlob() {
    if (generatedCardBlob && generatedCardDataUrl) {
      return { blob: generatedCardBlob, dataUrl: generatedCardDataUrl };
    }
    const res = await generateBiodataCardBlob();
    generatedCardBlob = res.blob;
    generatedCardDataUrl = res.dataUrl;
    return res;
  }

  async function openCanvasCardModal() {
    const modal = document.getElementById('canvasCardModal');
    if (!modal) return;
    modal.classList.add('open');
    const loader = document.getElementById('canvasCardLoading');
    const container = document.getElementById('canvasCardContainer');
    const img = document.getElementById('canvasCardPreviewImg');
    if (loader) loader.style.display = 'block';
    if (container) container.style.display = 'none';

    try {
      const result = await generateBiodataCardBlob();
      generatedCardBlob = result.blob;
      generatedCardDataUrl = result.dataUrl;
      if (img) img.src = result.dataUrl;
      if (loader) loader.style.display = 'none';
      if (container) container.style.display = 'block';
    } catch (err) {
      console.warn('Live canvas generation fallback, trying cached asset:', err);
      try {
        const preRenderedUrl = './shubham_biodata_redesigned.png';
        const resp = await fetch(preRenderedUrl);
        if (resp.ok) {
          generatedCardBlob = await resp.blob();
          generatedCardDataUrl = preRenderedUrl;
          if (img) img.src = preRenderedUrl;
          if (loader) loader.style.display = 'none';
          if (container) container.style.display = 'block';
          return;
        }
      } catch (e) {}
      if (loader) loader.innerHTML = '<div style="color:#ef4444;">इमेज कार्ड तयार करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.</div>';
    }
  }

  function closeCanvasCardModal() {
    const modal = document.getElementById('canvasCardModal');
    if (modal) modal.classList.remove('open');
  }

  return {
    roundRect,
    generateBiodataCardBlob,
    getLiveBiodataCardBlob,
    openCanvasCardModal,
    closeCanvasCardModal,
    resetGeneratedCardCache,
    get generatedCardBlob() { return generatedCardBlob; },
    get generatedCardDataUrl() { return generatedCardDataUrl; }
  };
});
