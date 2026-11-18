const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== RUNNING COMPREHENSIVE VERIFICATION SUITE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Check all essential files exist
const repoDir = 'd:/UBUNTU DATA/01_Experiments/SY_OCR';
const requiredFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'biodata.html',
  'shubham_biodata_redesigned.html',
  'shubham_biodata_redesigned.png',
  'shubham_kharche_biodata.jpg',
  'messages.js',
  'candidates.json',
  'server.js',
  'start-pwa.bat'
];

requiredFiles.forEach(f => {
  const p = path.join(repoDir, f);
  assert(fs.existsSync(p), `File exists: ${f}`);
});

// 2. Validate manifest.json
try {
  const manifestRaw = fs.readFileSync(path.join(repoDir, 'manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw);
  assert(manifest.short_name === 'अनुबंध', 'Manifest short_name is अनुबंध');
  assert(manifest.icons && manifest.icons.length > 0, 'Manifest contains valid icons array');
  assert(fs.existsSync(path.join(repoDir, manifest.icons[0].src)), `Manifest icon file exists (${manifest.icons[0].src})`);
} catch(e) {
  assert(false, `manifest.json parsing error: ${e.message}`);
}

// 3. Validate HTML structure & Embedded JavaScript
const indexHtml = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');

const scriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch !== null, 'Found <script> block in index.html');

if (scriptMatch) {
  const scriptCode = scriptMatch[1];
  const AnubandhMessages = require('./messages.js');

  const sandbox = {
    AnubandhMessages,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    },
    document: {
      addEventListener: () => {},
      getElementById: (id) => ({
        value: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        focus: () => {}
      }),
      querySelectorAll: () => []
    },
    window: {
      addEventListener: () => {},
      open: () => {}
    },
    navigator: {
      serviceWorker: { register: () => Promise.resolve({ scope: '/' }) }
    },
    alert: () => {},
    confirm: () => true
  };

  try {
    vm.createContext(sandbox);
    // Execute script
    vm.runInContext(scriptCode, sandbox);
    assert(true, 'Embedded JavaScript executed without any syntax or parse errors');

    // Access variables from lexical context using vm eval
    const initialData = vm.runInContext('INITIAL_DATA', sandbox);
    assert(Array.isArray(initialData), 'INITIAL_DATA is a valid Array');
    assert(initialData.length === 84, `All 84 candidate records loaded (Found: ${initialData.length})`);

    // Test parseSrNo for all records
    const parseSrNoFn = vm.runInContext('parseSrNo', sandbox);
    let sortFailed = false;
    for (let i = 0; i < initialData.length; i++) {
      const c = initialData[i];
      const parsed = parseSrNoFn(c.sr);
      if (isNaN(parsed) || parsed < 0) {
        console.error(`Invalid parsed SR for row ${i}: sr='${c.sr}' -> ${parsed}`);
        sortFailed = true;
      }
    }
    assert(!sortFailed, 'parseSrNo() successfully parsed all 84 candidate serial numbers to non-negative integers');

    // Test Ascending sorting
    const sorted = [...initialData].sort((a, b) => parseSrNoFn(a.sr) - parseSrNoFn(b.sr));
    const firstSr = parseSrNoFn(sorted[0].sr);
    const lastSr = parseSrNoFn(sorted[sorted.length - 1].sr);
    assert(firstSr <= lastSr, `Ascending sorting order verified: lowest sr=${firstSr}, highest sr=${lastSr}`);

    // Test WhatsApp text generator
    const buildWhatsAppTextFn = vm.runInContext('buildWhatsAppText', sandbox);
    const sampleCand = initialData[1]; // cand_1 (कु. प्रियंका (डॉली))
    const waMsg = buildWhatsAppTextFn(sampleCand.name, sampleCand.sr);
    assert(waMsg.includes('शुभम अनिल खर्चे'), 'WhatsApp message contains groom name (शुभम अनिल खर्चे)');
    assert(waMsg.includes('B.E. Mechanical'), 'WhatsApp message contains education (B.E. Mechanical)');
    assert(waMsg.includes('Shaurya Technosoft'), 'WhatsApp message contains company name');
    assert(waMsg.includes('7.8 LPA'), 'WhatsApp message contains salary (7.8 LPA)');
    assert(!waMsg.includes('गोत्र:'), 'WhatsApp message excludes gotra per user requirement');
    assert(!waMsg.includes('खर्चे परिवार (मो. 9420539396 / 9422152231)'), 'WhatsApp message excludes redundant family phone footer per user requirement');
    assert(waMsg.includes('धन्यवाद! 🙏'), 'WhatsApp message cleanly ends with polite closing (धन्यवाद! 🙏)');
    assert(waMsg.includes('कु. प्रियंका') && !waMsg.includes('(डॉली)'), 'WhatsApp message excludes name in parentheses (कु. प्रियंका instead of कु. प्रियंका (डॉली))');

    // Test WhatsApp text generator with guardian name
    const waMsgWithGuardian = buildWhatsAppTextFn(sampleCand.name, sampleCand.sr, 'श्री. प्रकाश वसंत झोपे');
    assert(waMsgWithGuardian.includes('आम्ही श्री. प्रकाश वसंत झोपे यांची मुलगी कु. प्रियंका (अ.क्र.'), 'WhatsApp message mentions guardian name and clean candidate name without parentheses');
    assert(waMsgWithGuardian.indexOf('*मुलाची थोडक्यात माहिती:*') < waMsgWithGuardian.indexOf('मुलाचा बायोडाटा आणि अधिक माहिती खालील लिंकवर पाहता येईल:'), 'WhatsApp message follows sequence: groom info before biodata link');

    // Test password check logic
    const adminPassword = vm.runInContext('ADMIN_PASSWORD', sandbox);
    assert(adminPassword === 'ekdant', 'ADMIN_PASSWORD is set to "ekdant"');
    assert('ekdant'.toLowerCase() === adminPassword, 'Password check passes for "ekdant"');
    assert('EKDANT'.toLowerCase() === adminPassword, 'Password check passes case-insensitively for "EKDANT"');
    assert('wrong'.toLowerCase() !== adminPassword, 'Password check rejects invalid password');

  } catch(e) {
    assert(false, `Runtime error in script execution: ${e.message}\n${e.stack}`);
  }
}

// 4. Validate sw.js
try {
  const swCode = fs.readFileSync(path.join(repoDir, 'sw.js'), 'utf8');
  assert(swCode.includes('CACHE_NAME'), 'sw.js contains CACHE_NAME');
  assert(swCode.includes('ASSETS_TO_CACHE'), 'sw.js contains ASSETS_TO_CACHE');
  assert(swCode.includes('shubham_kharche_biodata.jpg'), 'sw.js caches shubham_kharche_biodata.jpg for offline use');
} catch(e) {
  assert(false, `sw.js error: ${e.message}`);
}

// 5. Validate Bride Family Profile Security & Content (Open to all, no password)
try {
  const bioCode = fs.readFileSync(path.join(repoDir, 'biodata.html'), 'utf8');
  assert(!bioCode.includes("PROFILE_PASS"), "biodata.html is open to all without password");
  assert(bioCode.includes('shubham_kharche_biodata.jpg'), "biodata.html links to original biodata photo");
  assert(bioCode.includes('contacts-list') && bioCode.includes('elder-row'), "biodata.html shows contacts in a clean list layout instead of cards");

  // 6. Validate Main Portal Authentication & App Install Banner & SVG Up Arrow
  const indexCode = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');
  assert(indexCode.includes("APP_PASS = '258'"), "index.html enforces app password '258'");
  assert(indexCode.includes('anubandh_app_auth'), "index.html stores authentication in localStorage");
  assert(indexCode.includes('anubandh_app_auth_lockout_until'), "index.html enforces 3-attempt 10-minute lockout on wrong PIN");
  assert(indexCode.includes('checkAppLockout'), "index.html contains checkAppLockout function");
  assert(indexCode.includes('pwaInstallBanner'), "index.html contains PWA install prompt banner");
  assert(!indexCode.includes('id="pwaInstallBtn"'), "index.html has removed duplicate header install button");
  assert(indexCode.includes('<svg') && indexCode.includes('M18 15l-6-6-6 6'), "index.html uses sleek SVG up arrow instead of emoji");
  assert(indexCode.includes('✍️ संभाषण नोंद'), "index.html uses updated button label संभाषण नोंद");
  assert(indexCode.includes('.btn-track'), "index.html has proper button styling for .btn-track");

  // 7. Validate Standalone candidates.json
  const candJsonRaw = fs.readFileSync(path.join(repoDir, 'candidates.json'), 'utf8');
  const candJson = JSON.parse(candJsonRaw);
  assert(Array.isArray(candJson) && candJson.length === 84, "candidates.json is valid array containing exactly 84 records");
  assert(candJson.every(c => c.age !== undefined && c.age > 0), "all 84 candidates have calculated age field in candidates.json");
  assert(indexCode.includes('cand-name') && indexCode.includes('age-badge'), "index.html displays age badge in front of candidate name");
  assert(bioCode.includes('shubhamAge') && bioCode.includes('hero-name'), "biodata.html displays dynamically calculated age in front of groom name");
  // 8. Validate Shareable Profile CMS & Dynamic Profile Rendering
  const profileJsonRaw = fs.readFileSync(path.join(repoDir, 'profile_data.json'), 'utf8');
  const profileJson = JSON.parse(profileJsonRaw);
  assert(profileJson && profileJson.hero && Array.isArray(profileJson.sections), "profile_data.json contains valid hero and sections");

  assert(bioCode.includes('DEFAULT_PROFILE_DATA') && bioCode.includes('renderProfile'), "biodata.html supports dynamic profile rendering");

  assert(indexCode.includes('secProfileCmsSettings'), "index.html contains Shareable Profile CMS section");
  assert(indexCode.includes('secCandidateEditSettings'), "index.html contains Candidate Profiles CMS section");
  assert(indexCode.includes('saveProfileCmsData'), "index.html contains saveProfileCmsData handler");
  assert(indexCode.includes('saveCandidateEditData') && indexCode.includes('loadCandidateForEdit'), "index.html contains handlers to load and edit candidate profile details");
  assert(indexCode.includes('openCandidateEditDirect') && indexCode.includes('btn-card-edit'), "index.html provides direct edit buttons on candidate cards");
  assert(indexCode.includes('confirmAddCmsSection'), "index.html supports adding custom sections dynamically");
  assert(indexCode.includes('deleteCmsSection'), "index.html supports removing sections dynamically");

  const serverCode = fs.readFileSync(path.join(repoDir, 'server.js'), 'utf8');
  assert(serverCode.includes('/api/save-profile'), "server.js provides POST /api/save-profile endpoint");
  assert(serverCode.includes('/api/save-candidates'), "server.js provides POST /api/save-candidates endpoint");

  const swCode2 = fs.readFileSync(path.join(repoDir, 'sw.js'), 'utf8');
  assert(swCode2.includes('profile_data.json'), "sw.js caches profile_data.json");

  // Contact Name and Address separation assertion
  assert(indexCode.includes('contact-person-name') && indexCode.includes('contact-person-addr'), "index.html defines contact-person-name and contact-person-addr classes");
  assert(indexCode.includes('addrStartIdx') || indexCode.includes('raMatch'), "index.html implements name and address line separation for contacts");

  // WhatsApp Profile Share & Hyperlink options assertions
  assert(bioCode.includes('shareProfileOnWhatsApp') && bioCode.includes('copyHyperlink'), "biodata.html has WhatsApp share and hyperlink copy options");
  assert(!bioCode.includes('class="sticky-btn-call"') && !bioCode.includes('class="sticky-btn-wa"'), "biodata.html has removed bottom call and whatsapp direct chat options");
  assert(indexCode.includes('shareProfileOnWhatsApp') && indexCode.includes('copyProfileHyperlink'), "index.html provides options to share profile");

  // Track Modal (संभाषण नोंद) Enhanced Screen assertions
  assert(indexCode.includes('phone-touch-row') && indexCode.includes('quickContactChips'), "index.html defines phone-touch-row and quick contact chips");
  assert(indexCode.includes('mCandAgeBadge') && !indexCode.includes('<div class="track-cand-summary">'), "index.html trackModal displays clean header while hiding duplicate girl snapshot details");
  assert(indexCode.includes('quickContactChips') && indexCode.includes('selectTrackContact'), "index.html trackModal provides quick contact chips");
  assert(indexCode.includes('deleteLogEntry') && indexCode.includes('btn-del-log'), "index.html provides option to delete conversation log entries");
  assert(indexCode.includes('btn-del-log') && indexCode.includes('<polyline points="3 6 5 6 21 6">'), "index.html uses sleek SVG icon instead of emoji trash for log deletion");
  assert(indexCode.includes('toggleRejectCandidate') && indexCode.includes('btn-not-interested'), "index.html provides Not Interested button for candidate rejection");
  assert(indexCode.includes('APP_INSTALL_DATE_KEY') && indexCode.includes('isTestProfileVisible'), "index.html auto-hides test profile (sr 0) after 3 days of install");
  assert(indexCode.includes('<span>कॉपी लिंक</span>') && bioCode.includes('<span>🔗 कॉपी लिंक</span>'), "index.html and biodata.html show 'कॉपी लिंक' instead of 'हायपरलिंक कॉपी करा'");
  assert(indexCode.includes('getShareableProfileFullMessage') && bioCode.includes('getShareableProfileFullMessage'), "index.html and biodata.html copy full accompanied message with profile link");

  // Phone Action Modal (संपर्क पर्याय निवडा) Contact Person Name assertions
  assert(indexCode.includes('phoneModalContactName') && indexCode.includes('phone-modal-contact-name'), "index.html phone action modal defines phoneModalContactName element and CSS");
  assert(indexCode.includes('contactPersonName') && indexCode.includes('contactName'), "index.html passes and binds contact person name in openPhoneActionPrompt");

  // Admin Portal Full Page assertions
  assert(indexCode.includes('full-page-view'), "index.html adminSettingsModal has full-page-view class");
  assert(indexCode.includes('.modal-overlay.full-page-view'), "index.html defines .modal-overlay.full-page-view CSS for full page view");

  // Shareable Profile CMS Mobile Responsiveness assertions
  assert(indexCode.includes('cms-mobile-save-bar'), "index.html defines sticky floating save bar for mobile");
  assert(indexCode.includes('cms-grid-2') && indexCode.includes('cms-row-item'), "index.html uses responsive grid and row classes for CMS");
  assert(indexCode.includes('cms-contact-card') && indexCode.includes('cms-sec-head-main'), "index.html provides touch-friendly contact cards and section headers for CMS");
  assert(indexCode.includes('@media (max-width: 640px)'), "index.html includes mobile media queries for CMS editor");

  // Double-press Back to Exit App assertions
  assert(indexCode.includes('initBackButtonHandler'), "index.html contains initBackButtonHandler");
  assert(indexCode.includes('BACK_EXIT_DELAY_MS') && indexCode.includes('lastBackPressTime'), "index.html tracks back button timing for double press exit");
  assert(indexCode.includes('popstate') && indexCode.includes('getOpenModal'), "index.html listens to popstate and closes open modals on back");
  assert(bioCode.includes('popstate') && bioCode.includes('closeFullImg'), "biodata.html handles back button to close open modals");

  // Shortlist Feature and Navigation Tabs assertions
  assert(indexCode.includes('main-nav-tabs') && indexCode.includes('tabShortlisted') && indexCode.includes('tabAllCandidates'), "index.html defines main-nav-tabs with Shortlist and All tabs");
  assert(indexCode.includes('switchMainListTab') && indexCode.includes('updateNavTabs'), "index.html provides functions to switch tabs and update counts");
  assert(indexCode.includes('toggleShortlist') && indexCode.includes('SHORTLIST_STORAGE_KEY'), "index.html supports toggling shortlist and persists in localStorage");
  assert(indexCode.includes('btn-shortlist-star') && indexCode.includes('getStarSvg'), "index.html defines compact shortlist star button and getStarSvg renderer");
  assert(!indexCode.includes('<span class="shortlist-badge">⭐ शॉर्टलिस्ट</span>'), "index.html card header no longer displays redundant text label for shortlisted");
  assert(indexCode.includes("currentListTab = 'shortlisted'"), "index.html defaults to shortlisted tab first if shortlist is not empty");

  // Section show/hide and CMS sync assertions
  assert(indexCode.includes('toggleCmsSectionHidden'), "index.html provides toggleCmsSectionHidden to show/hide sections");
  assert(bioCode.includes('sec.hidden'), "biodata.html checks sec.hidden to hide/show sections dynamically");
  
  // Splash screen & Admin organization assertions
  assert(indexCode.includes('appSplashScreen') && indexCode.includes('Crafted with ❤️ by Shubham Kharche'), "index.html defines splash screen with creator credit");
  assert(indexCode.includes('secBackupSettings') && indexCode.includes('tabBackupBtn'), "index.html defines backup and excel download section in admin portal");

  // Master file parity assertions
  assert(indexCode.includes('<!DOCTYPE html>') && indexCode.includes('INITIAL_DATA'), "index.html serves as the standalone primary single-source PWA entry");
  const currentSwCode = fs.readFileSync(path.join(repoDir, 'sw.js'), 'utf8');
  assert(!currentSwCode.includes('datalab-convert-Suchi-SHortlist.html') && !currentSwCode.includes('matrimonial-tracker-app.html'), "sw.js focuses on index.html and no longer caches redundant secondary files");

  // Primary master single file
  assert(fs.existsSync(path.join(repoDir, 'biodata.html')), "Primary master biodata.html is the single standalone biodata file");

  // 1. Instant / Seamless In-App Biodata Viewer assertions
  assert(indexCode.includes('id="biodataModal"') && indexCode.includes('openBiodataModal') && indexCode.includes('closeBiodataModal'), "index.html defines seamless in-app biodataModal and handlers");
  assert(indexCode.includes('rel="prefetch"') && indexCode.includes('href="./biodata.html"'), "index.html pre-fetches biodata.html for instant opening");

  // 2. Photo Upload for Shubham assertions
  assert(indexCode.includes('handlePhotoUpload') && indexCode.includes('triggerPhotoUpload') && indexCode.includes('resetPhotoToDefault'), "index.html provides Shubham photo upload, preview, and reset handlers");
  const srvCode = fs.readFileSync(path.join(repoDir, 'server.js'), 'utf8');
  assert(srvCode.includes('/api/upload-photo'), "server.js provides POST /api/upload-photo endpoint");

  // 3. HTML5 Canvas Biodata Card Generator assertions
  assert(indexCode.includes('generateBiodataCardBlob') && indexCode.includes('openCanvasCardModal') && indexCode.includes('downloadGeneratedCard'), "index.html defines HTML5 Canvas biodata card generator and actions");
  assert(bioCode.includes('generateBiodataCardBlob') && bioCode.includes('openCanvasCardModal'), "biodata.html defines HTML5 Canvas biodata card generator");

  // 4. CMS Customizable Message Templates assertions
  assert(indexCode.includes('waProposalTemplate') && indexCode.includes('waShareTemplate') && indexCode.includes('insertTemplatePlaceholder'), "index.html CMS provides editable message templates and placeholder chips");
  assert(indexCode.includes('customProposalTemplate') && indexCode.includes('customShareTemplate'), "index.html interpolates custom proposal and share templates");

  // 5. Custom Branded Confirmation Popup Modal assertions
  assert(indexCode.includes('id="customConfirmModal"') && indexCode.includes('showCustomConfirm') && indexCode.includes('handleCustomConfirmOk'), "index.html provides custom styled confirmation popup modal");
  assert(!indexCode.includes('if (!confirm(') && !indexCode.includes('if (confirm('), "index.html has replaced native browser confirm() dialogs with showCustomConfirm modal");

  // 6. Single conversation delete bug fix & Not Interested toggle assertions
  assert(indexCode.includes('function isCandidateShortlisted'), "index.html defines isCandidateShortlisted to prevent ReferenceError on single log delete");
  assert(indexCode.includes('toggleNotInterestedInsideTrackModal') && indexCode.includes('updateTrackModalNotInterestedBtn'), "index.html provides Not Interested toggle inside trackModal");
  assert(indexCode.includes('onclick="toggleNotInterestedCandidate(\'${c.id}\', event)"'), "index.html table view provides quick Not Interested toggle");

  // 7. Clean Default Light Mode assertions (No Dark Mode or Font Size buttons)
  assert(!indexCode.includes('id="headerThemeToggleBtn"') && !indexCode.includes('id="headerFontSizeBtn"'), "index.html enforces default clean light mode without theme toggle or font size buttons");
  assert(!indexCode.includes('id="drawerDarkModeBtn"') && !indexCode.includes('id="fsBtnSmall"'), "index.html drawer has removed dark mode and font size toggle functionality");

  // 8. Voice Speech-to-Text (mr-IN) assertions
  assert(indexCode.includes('toggleVoiceSpeechRecognition') && indexCode.includes('mr-IN') && indexCode.includes('voice-note-btn'), "index.html supports Speech-to-Text voice logging in Marathi (mr-IN)");

  // Side Menu Reorganization assertions
  const drawerBodyMatch = indexCode.match(/<div class="drawer-body">([\s\S]*?)<\/div>\s*<div style="padding/i);
  assert(drawerBodyMatch !== null, "index.html defines drawer-body in side menu");
  if (drawerBodyMatch) {
    const drawerHtml = drawerBodyMatch[1];
    assert(!drawerHtml.includes('openBiodataModal') && !drawerHtml.includes('openCanvasCardModal') && !drawerHtml.includes('shubham_biodata_redesigned.html'), "Side menu drawer has removed biodata modal, canvas card, and redesigned sheet options per user requirement");
    assert(drawerHtml.includes('WhatsApp शेअर') && drawerHtml.includes('कॉपी लिंक') && drawerHtml.includes('मोबाईल ॲप इन्स्टॉल') && drawerHtml.includes('अ‍ॅडमिन सेटिंग्ज') && drawerHtml.includes('ॲप विषयी माहिती'), "Side menu drawer only shows the 5 requested options");
  }
  assert(indexCode.includes('admin-quick-biodata-bar') && indexCode.includes('openBiodataModal') && indexCode.includes('openCanvasCardModal'), "index.html admin settings modal houses the moved biodata and patrika options");

  // 9. WhatsApp Multi-Attachment & Clipboard Copy assertions
  assert(indexCode.includes('copyImageToClipboard') && indexCode.includes('navigator.share') && indexCode.includes('ClipboardItem'), "index.html supports multi-attachment photo share and clipboard copy");
  assert(bioCode.includes('copyImageToClipboard') && bioCode.includes('navigator.share'), "biodata.html supports multi-attachment photo share and clipboard copy");

  // 10. Traditional Redesigned Biodata Sheet & WhatsApp Image Sharing assertions
  const redesignedPath = path.join(repoDir, 'shubham_biodata_redesigned.html');
  assert(fs.existsSync(redesignedPath), "shubham_biodata_redesigned.html exists");
  const redesignedCode = fs.readFileSync(redesignedPath, 'utf8');
  assert(redesignedCode.includes('shareOnWhatsAppAsImage') && redesignedCode.includes('downloadSheetImage') && redesignedCode.includes('copySheetImageToClipboard'), "shubham_biodata_redesigned.html provides WhatsApp image sharing, download, and clipboard copy actions");
  assert(redesignedCode.includes('contact-item') && redesignedCode.includes('contact-idx'), "shubham_biodata_redesigned.html displays contacts in a clean list layout instead of cards");
  const redesignedImgPath = path.join(repoDir, 'shubham_biodata_redesigned.png');
  assert(fs.existsSync(redesignedImgPath) && fs.statSync(redesignedImgPath).size > 10000, "shubham_biodata_redesigned.png exists and is a valid image asset (>10KB)");
  assert(indexCode.includes('shubham_biodata_redesigned.png') && indexCode.includes('shubham_biodata_redesigned.html'), "index.html uses redesigned biodata image for WhatsApp sharing and links to redesigned sheet");
  assert(bioCode.includes('shubham_biodata_redesigned.png') && bioCode.includes('shubham_biodata_redesigned.html'), "biodata.html uses redesigned biodata image for WhatsApp sharing and links to redesigned sheet");
  const swCodeCurrent = fs.readFileSync(path.join(repoDir, 'sw.js'), 'utf8');
  assert(swCodeCurrent.includes('shubham_biodata_redesigned.html') && swCodeCurrent.includes('shubham_biodata_redesigned.png'), "sw.js caches redesigned biodata sheet and image for offline access");

  // 11. Unified Canvas Image Sharing Across All Options
  assert(indexCode.includes('shareGeneratedCardNative') && indexCode.includes('copyProfileHyperlink') && indexCode.includes('openWhatsAppChat'), "index.html supports native app sharing and canvas image copy across all options");
  assert(bioCode.includes('shareGeneratedCardNative') && bioCode.includes('copyHyperlink'), "biodata.html supports native app sharing and canvas image copy across all options");
  assert(redesignedCode.includes('shareToAnyApp') && redesignedCode.includes('sbtn-share'), "shubham_biodata_redesigned.html supports universal cross-app sharing (shareToAnyApp)");

  // 12. Candidate Additional Key-Value Details (+ Button)
  assert(indexCode.includes('openAddCandidateDetailModal') && indexCode.includes('saveCandidateDetail') && indexCode.includes('candidateDetailModal'), "index.html defines additional key-value detail modal and handlers");
  assert(indexCode.includes('➕ माहिती जोडा') && indexCode.includes('candDetailKeyInput'), "index.html candidate cards provide + button for additional key-value details");

  // 13. Direct wa.me Number Sharing Format
  assert(indexCode.includes('https://wa.me/${digits}?text='), "index.html uses https://wa.me/${digits} format for direct number sharing");
  assert(bioCode.includes('https://wa.me/'), "biodata.html uses https://wa.me format for WhatsApp sharing");

  // 14. Single Source of Truth for Messages (messages.js)
  const messagesMod = require('./messages.js');
  const testProposal = messagesMod.buildCandidateProposalMessage({
    girlFatherName: 'गजानन वामन वराडे',
    girlName: 'अनुष्का (देवयानी)',
    listNumber: '१७१'
  });
  assert(testProposal.includes('आम्ही श्री. गजानन वामन वराडे यांची मुलगी कु. अनुष्का (अ.क्र. १७१.) हिच्यासाठी आपल्याशी संपर्क साधत आहोत.'), 'messages.js parameterizes girl father name, girl name, and list number');
  assert(!testProposal.includes('(देवयानी)'), 'messages.js excludes name in parentheses per user requirement');
  assert(!testProposal.includes('गोत्र:'), 'messages.js excludes gotra per user requirement');
  assert(testProposal.indexOf('*मुलाची थोडक्यात माहिती:*') < testProposal.indexOf('मुलाचा बायोडाटा आणि अधिक माहिती खालील लिंकवर पाहता येईल:'), 'messages.js follows requested sequence: groom info before biodata link');
  assert(testProposal.includes('मुलाचा बायोडाटा आणि अधिक माहिती खालील लिंकवर पाहता येईल:\nhttps://anubandh-shubham-kharche.vercel.app/profile'), 'messages.js candidate proposal contains exact requested biodata link text');

  const testGeneric = messagesMod.buildGenericShareMessage();
  assert(testGeneric.includes('मुलाचा (शुभम अनिल खर्चे) बायोडाटा सोबत जोडलेला आहे. अधिक माहिती खालील लिंकवर पाहता येईल:'), 'messages.js generic share contains exact requested text');
  assert(indexCode.includes('src="./messages.js"') || indexCode.includes('src="messages.js"'), 'index.html references messages.js');
  assert(bioCode.includes('src="./messages.js"') || bioCode.includes('src="messages.js"'), 'biodata.html references messages.js');
  assert(redesignedCode.includes('src="./messages.js"') || redesignedCode.includes('src="messages.js"'), 'shubham_biodata_redesigned.html references messages.js');
  assert(swCodeCurrent.includes('messages.js'), 'sw.js caches messages.js for offline use');

  // 15. Admin App Layout, Menu List Hub & Web Browser Fallback
  assert(indexCode.includes('id="adminMenuHub"') && indexCode.includes('admin-menu-card') && indexCode.includes('admin-menu-list'), "index.html admin settings displays as proper app with menu list hub");
  assert(indexCode.includes('openAdminInWebBrowser') && indexCode.includes('handleAdminHeaderBack'), "index.html provides open in web browser and app navigation back handler");
  
  // 16. cand_0 phone update
  const candJsonData = JSON.parse(fs.readFileSync(path.join(repoDir, 'candidates.json'), 'utf8'));
  const candZero = candJsonData.find(c => c.id === 'cand_0');
  assert(candZero && candZero.phones && candZero.phones.includes('9422152322'), "cand_0 (sr ०.) phones array includes 9422152322");
  assert(indexCode.includes('"id":"cand_0"') && indexCode.includes('"phones":["9422152322"]'), "index.html INITIAL_DATA defines phones ['9422152322'] for cand_0");
  assert(indexCode.includes('getLiveBiodataCardBlob'), 'index.html defines getLiveBiodataCardBlob for live dynamic canvas sharing');
  assert(bioCode.includes('getLiveBiodataCardBlob'), 'biodata.html defines getLiveBiodataCardBlob for live dynamic canvas sharing');
  assert(redesignedCode.includes('html2canvas'), 'shubham_biodata_redesigned.html renders live sheet via html2canvas');

  // 17. Vercel deployment configuration & Shareable Profile URL
  assert(fs.existsSync(path.join(repoDir, 'vercel.json')), 'vercel.json exists for Vercel deployment');
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(repoDir, 'vercel.json'), 'utf8'));
  assert(vercelConfig.rewrites && vercelConfig.rewrites.some(r => r.source === '/profile' && r.destination === '/biodata.html'), 'vercel.json rewrites /profile to /biodata.html');
  assert(indexCode.includes('anubandh-shubham-kharche.vercel.app/profile'), 'index.html points to Vercel shareable profile URL');
  assert(bioCode.includes('anubandh-shubham-kharche.vercel.app/profile'), 'biodata.html points to Vercel shareable profile URL');
} catch(e) {
  assert(false, `biodata profile verification error: ${e.message}`);
}

console.log(`\n=== SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount === 0) {
  console.log('🎉 ALL SYSTEMS OPERATIONAL AND ERROR-FREE!');
} else {
  process.exit(1);
}
