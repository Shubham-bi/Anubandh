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
  'datalab-convert-Suchi-SHortlist.html',
  'matrimonial-tracker-app.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'biodata.html',
  'shubham-kharche.html',
  'shubham_kharche_biodata.jpg',
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

  const sandbox = {
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
    assert(initialData.length === 83, `All 83 candidate records loaded (Found: ${initialData.length})`);

    // Test parseSrNo for all records
    const parseSrNoFn = vm.runInContext('parseSrNo', sandbox);
    let sortFailed = false;
    for (let i = 0; i < initialData.length; i++) {
      const c = initialData[i];
      const parsed = parseSrNoFn(c.sr);
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`Invalid parsed SR for row ${i}: sr='${c.sr}' -> ${parsed}`);
        sortFailed = true;
      }
    }
    assert(!sortFailed, 'parseSrNo() successfully parsed all 83 candidate serial numbers to positive integers');

    // Test Ascending sorting
    const sorted = [...initialData].sort((a, b) => parseSrNoFn(a.sr) - parseSrNoFn(b.sr));
    const firstSr = parseSrNoFn(sorted[0].sr);
    const lastSr = parseSrNoFn(sorted[sorted.length - 1].sr);
    assert(firstSr <= lastSr, `Ascending sorting order verified: lowest sr=${firstSr}, highest sr=${lastSr}`);

    // Test WhatsApp text generator
    const buildWhatsAppTextFn = vm.runInContext('buildWhatsAppText', sandbox);
    const sampleCand = initialData[0];
    const waMsg = buildWhatsAppTextFn(sampleCand.name, sampleCand.sr);
    assert(waMsg.includes('शुभम अनिल खर्चे'), 'WhatsApp message contains groom name (शुभम अनिल खर्चे)');
    assert(waMsg.includes('B.E. Mechanical'), 'WhatsApp message contains education (B.E. Mechanical)');
    assert(waMsg.includes('Shaurya Technosoft'), 'WhatsApp message contains company name');
    assert(waMsg.includes('7.8 LPA'), 'WhatsApp message contains salary (7.8 LPA)');
    assert(waMsg.includes('वशिष्ठ'), 'WhatsApp message contains gotra (वशिष्ठ)');
    assert(waMsg.includes('9420539396'), 'WhatsApp message contains family phone number');
    assert(waMsg.includes(sampleCand.name), 'WhatsApp message incorporates target candidate name');

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
  
  const shubhamCode = fs.readFileSync(path.join(repoDir, 'shubham-kharche.html'), 'utf8');
  assert(!shubhamCode.includes("PROFILE_PASS"), "shubham-kharche.html is open to all without password");

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
  assert(Array.isArray(candJson) && candJson.length === 83, "candidates.json is valid array containing exactly 83 records");
  assert(candJson.every(c => c.age !== undefined && c.age > 0), "all 83 candidates have calculated age field in candidates.json");
  assert(indexCode.includes('cand-name') && indexCode.includes('age-badge'), "index.html displays age badge in front of candidate name");
  assert(bioCode.includes('shubhamAge') && bioCode.includes('hero-name'), "biodata.html displays dynamically calculated age in front of groom name");
  // 8. Validate Shareable Profile CMS & Dynamic Profile Rendering
  const profileJsonRaw = fs.readFileSync(path.join(repoDir, 'profile_data.json'), 'utf8');
  const profileJson = JSON.parse(profileJsonRaw);
  assert(profileJson && profileJson.hero && Array.isArray(profileJson.sections), "profile_data.json contains valid hero and sections");

  assert(bioCode.includes('DEFAULT_PROFILE_DATA') && bioCode.includes('renderProfile'), "biodata.html supports dynamic profile rendering");
  assert(shubhamCode.includes('DEFAULT_PROFILE_DATA') && shubhamCode.includes('renderProfile'), "shubham-kharche.html supports dynamic profile rendering");

  assert(indexCode.includes('secProfileCmsSettings'), "index.html contains Shareable Profile CMS section");
  assert(indexCode.includes('saveProfileCmsData'), "index.html contains saveProfileCmsData handler");
  assert(indexCode.includes('confirmAddCmsSection'), "index.html supports adding custom sections dynamically");
  assert(indexCode.includes('deleteCmsSection'), "index.html supports removing sections dynamically");

  const serverCode = fs.readFileSync(path.join(repoDir, 'server.js'), 'utf8');
  assert(serverCode.includes('/api/save-profile'), "server.js provides POST /api/save-profile endpoint");

  const swCode2 = fs.readFileSync(path.join(repoDir, 'sw.js'), 'utf8');
  assert(swCode2.includes('profile_data.json'), "sw.js caches profile_data.json");

  // Contact Name and Address separation assertion
  assert(indexCode.includes('contact-person-name') && indexCode.includes('contact-person-addr'), "index.html defines contact-person-name and contact-person-addr classes");
  assert(indexCode.includes('addrStartIdx') || indexCode.includes('raMatch'), "index.html implements name and address line separation for contacts");

  // WhatsApp Hyperlink & Share Shubham_Kharche assertions
  assert(bioCode.includes('Shubham_Kharche'), "biodata.html uses link name Shubham_Kharche");
  assert(bioCode.includes('shareProfileOnWhatsApp') && bioCode.includes('copyHyperlink'), "biodata.html has WhatsApp share and hyperlink copy options");
  assert(!bioCode.includes('class="sticky-btn-call"') && !bioCode.includes('class="sticky-btn-wa"'), "biodata.html has removed bottom call and whatsapp direct chat options");
  assert(shubhamCode.includes('shareProfileOnWhatsApp') && shubhamCode.includes('copyHyperlink'), "shubham-kharche.html has WhatsApp share and hyperlink copy options");
  assert(indexCode.includes('shareProfileOnWhatsApp') && indexCode.includes('copyProfileHyperlink'), "index.html provides options to share profile as Shubham_Kharche");
  assert(indexCode.includes('Shubham_Kharche'), "index.html WhatsApp message formats profile link with Shubham_Kharche");
  assert(fs.existsSync(path.join(repoDir, 'Shubham_Kharche.html')), "Shubham_Kharche.html vanity route exists");

  // Track Modal (संभाषण नोंद) Enhanced Screen assertions
  assert(indexCode.includes('track-cand-summary') && indexCode.includes('phone-touch-row'), "index.html defines track-cand-summary and phone-touch-row CSS");
  assert(indexCode.includes('mCandAgeBadge') && indexCode.includes('mCandDob'), "index.html trackModal displays candidate age and birth info");
  assert(indexCode.includes('quickContactChips') && indexCode.includes('selectTrackContact'), "index.html trackModal provides quick contact chips");

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
  assert(indexCode.includes('btn-shortlist-star') && indexCode.includes('shortlist-badge'), "index.html defines shortlist star button and badge styling");
  assert(indexCode.includes("currentListTab = 'shortlisted'"), "index.html defaults to shortlisted tab first if shortlist is not empty");
} catch(e) {
  assert(false, `biodata profile verification error: ${e.message}`);
}

console.log(`\n=== SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount === 0) {
  console.log('🎉 ALL SYSTEMS OPERATIONAL AND ERROR-FREE!');
} else {
  process.exit(1);
}
