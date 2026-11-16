# 📖 अनुबंध (Anubandh) - डेव्हलपमेंट व वापर मार्गदर्शक (Maintenance & Operations Guidelines)

> **"दोन मनांचे आणि दोन घराण्यांचे रेशीमबंध जुळवणारे व्यासपीठ"**  
> *खर्चे परिवार • सुरक्षित वधू संशोधन, संपर्क व संभाषण नोंद पोर्टल*

---

## 📁 १. प्रोजेक्ट फाईल रचना (Project Structure)

| फाईल | वर्णन व उद्देश |
| :--- | :--- |
| **`index.html`** | 🌐 **एकमेव Single Source of Truth व मुख्य वेब ॲप** (लाईव्ह URL: `https://shubham-bi.github.io/Anubandh/`). |
| **`datalab-convert-Suchi-SHortlist.html`** | 📄 ऐतिहासिक बॅकअप फाईल (Single Source धोरणानुसार आता सक्रिय कोड किंवा कॅशमध्ये वापरली जात नाही). |
| **`matrimonial-tracker-app.html`** | 💻 ऐतिहासिक बॅकअप फाईल. |
| **`manifest.json`** | 📱 PWA (Progressive Web App) कॉन्फिगरेशन (नाव: अनुबंध, थीम: `#be123c`, आयकॉन्स). |
| **`sw.js`** | ⚡ Service Worker (ऑफलाइन कॅशिंगसाठी; नेट नसतानाही ॲप चालू ठेवते). |
| **`icon.svg`** | 🎨 अनुबंधचा अधिकृत सुवर्ण-कुंकुम आयकॉन (देवनागरी 'अ' व रेशीमगाठ). |
| **`shubham_kharche_biodata.jpg`** | 🖼️ शुभम अनिल खर्चे यांच्या मूळ परिचय पत्रकाचा हाय-रिझोल्यूशन स्कॅन फोटो. |
| **`verify_app_health.js`** | 🩺 **स्वयंचलित ३२-पॉईंट हेल्थ चेक टेस्ट सूट** (एरर तपासण्यासाठी). |
| **`server.js` & `start-pwa.bat`** | 🚀 स्थानिक पातळीवर PWA चालवण्यासाठी १-क्लिक बॅच फाईल व सर्व्हर. |

---

## 🛡️ २. भविष्यात कोणतीही त्रुटी (Error) न येण्यासाठी महत्त्वाचे नियम (Golden Rules)

### नियम १: अ.क्र. सॉर्टिंग (Strict Ascending Order)
- मराठी आकडे (`०, १, २, ३, ४, ५, ६, ७, ८, ९`) आणि इंग्रजी आकडे सामान्य `.sort()` ने बरोबर सॉर्ट होत नाहीत.
- यासाठी नेहमी **`parseSrNo(srStr)`** या फंक्शनचाच वापर करावा, जे मराठी आकड्यांचे योग्य पूर्णांकात (Integer) रूपांतर करून `१ ते ८३` चढत्या क्रमाने लावते.

### नियम २: फोन कॉल व WhatsApp बटणे कधीही एकत्र करू नका
- **फोन नंबरवर क्लिक केल्यास WhatsApp चालू होता कामा नये!**
- प्रत्येक फोन नंबरसाठी नेहमी **दोन स्वतंत्र बटणे** ठेवा:
  1. `[ 📞 कॉल ]`: `href="tel:${cleanNumber}"` (थेट फोन डायलर उघडतो).
  2. `[ 💬 WA ]`: `onclick="openWhatsAppChat(...)"` (WhatsApp मध्ये Method B मेसेज उघडतो).

### नियम ३: अ‍ॅडमिन पासवर्ड संरक्षण (`ekdant`)
- मेसेज कस्टमायझर किंवा डेटाबेस बदलण्यासाठीचा पासवर्ड **`ekdant`** आहे.
- पासवर्ड तपासताना नेहमी केस-इन्सेंसिटिव्ह (`.toLowerCase() === 'ekdant'`) ठेवावा, जेणेकरून `ekdant`, `Ekdant` किंवा `EKDANT` तिन्ही स्वीकारले जातील.

### नियम ४: Service Worker कॅश व्हर्जनिंग (sw.js)
- जेव्हा जेव्हा `index.html` मध्ये नवीन बदल केले जातील, तेव्हा **`sw.js`** मधील कॅशचे नाव (उदा. `v2` चे `v3`) बदलावे.
- यामुळे वापरकर्त्याच्या मोबाईल ब्राऊझरला कळते की नवीन अपडेट आले आहे आणि जुनी कॅश न वापरता नवीन कोड लगेच लोड होतो.

### नियम ५: `index.html` हाच एकमेव Single Source of Truth
- सर्व नवीन फीचर्स, बग फिक्स आणि कोड बदल फक्त **`index.html`** मध्येच केले जातात.
- जुन्या बॅकअप फाईल्स सुरक्षित ठेवल्या आहेत, परंतु ॲपचा मुख्य कोड व PWA कॅश आता पूर्णपणे `index.html` वर केंद्रित आहे.

---

## 📋 ३. डेटा स्ट्रक्चर व नवीन उमेदवार जोडणे (Candidate Data Schema)

प्रत्येक उमेदवाराचा डेटा खालील फॉरमॅटमध्ये असतो:
```javascript
{
  "id": "cand_84",                  // युनिक आयडी
  "sr": "१८४.",                    // अ.क्र.
  "name": "कु. नाव",                // मुलीचे संपूर्ण नाव
  "mulgaon": "गाव",                 // मूळगाव
  "height": "५'४''",                // उंची
  "complexion": "गोरा",             // वर्ण
  "gotra": "शांडिल्य",              // गोत्र
  "mamkul": "पाटील",                // मामकुळ
  "time": "स. १० वा.",              // जन्म वेळ
  "date": "०१-०१-२००१",             // जन्म तारीख
  "blood": "B+",                    // रक्तगट
  "edu": "शिक्षण व नोकरी",          // शिक्षण, नोकरी व उत्पन्न
  "fam": "भाऊ- १, बहिण- १",         // कौटुंबिक माहिती
  "exp": "अनुरूप",                  // अपेक्षा
  "contact": "पालक नाव व पत्ता",    // पत्ता व संपर्क माहिती
  "phones": ["९८XXXXXXXX"],         // फोन नंबर ॲरे
  "status": "pending",              // स्थिती: pending / contacted / interested / followup / not_interested / matched
  "logs": []                        // कॉल हिस्ट्री नोंदी
}
```

---

## 🩺 ४. ऑटोमॅटिक टेस्ट (Health Check) कसा चालवायचा?

कोणताही बदल केल्यानंतर सिस्टीममध्ये काही बिघाड झाला नाही ना, हे तपासण्यासाठी टर्मिनलमध्ये फक्त ही कमांड चालवा:

```powershell
node verify_app_health.js
```

**अपेक्षित निकाल:**
```text
=== RUNNING COMPREHENSIVE VERIFICATION SUITE ===
✅ PASS: All files exist
✅ PASS: All 83 candidate records loaded
✅ PASS: parseSrNo() sorted 100% accurately
✅ PASS: WhatsApp Method B message verified
✅ PASS: Security password (ekdant) verified
=== SUMMARY: 32 PASSED, 0 FAILED ===
🎉 ALL SYSTEMS OPERATIONAL AND ERROR-FREE!
```

---

## 🚀 ५. बदल GitHub Pages वर पुश करण्याची सोपी पद्धत:

```powershell
git add .
git commit -m "Updates"
git push origin main
```
*पुश केल्यावर १ मिनिटात https://shubham-bi.github.io/Anubandh/ वर बदल आपोआप लाईव्ह होतात.*
