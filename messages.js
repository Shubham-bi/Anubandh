/**
 * messages.js - Single Source of Truth for Anubandh Proposal & Share Messages
 * सर्व मेसेज मसुद्यांसाठी मध्यवर्ती फाईल (Single Source of Truth)
 * 
 * १. उमेदवार प्रस्ताव मेसेज (मुलीच्या पालकांना पाठवताना - Candidate Proposal Message)
 * २. सामान्य शोध मेसेज (नातेवाईक व परिचितांना पाठवताना - Generic Share Message)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnubandhMessages = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BIODATA_URL = 'https://shubham-bi.github.io/Anubandh/biodata.html';

  const DEFAULT_GROOM = {
    name: 'शुभम अनिल खर्चे',
    edu: 'B.E. Mechanical',
    job: 'Sr. QA Engineer',
    company: 'Shaurya Technosoft Pvt. Ltd., Pune',
    salary: '7.8 LPA',
    dob: '25/08/1996',
    gotra: 'वशिष्ठ'
  };

  /**
   * १. उमेदवार प्रस्ताव मेसेज (मुलीच्या पालकांना पाठवताना - Candidate Proposal Message)
   * Parameters:
   * - girlFatherName / guardianName : मुलीच्या वडिलांचे/पालकांचे नाव (उदा. गजानन वामन वराडे)
   * - girlName / candidateName       : मुलीचे नाव (उदा. अनुष्का)
   * - listNumber / srNo              : सूचीमधील अ.क्र. (उदा. १७१)
   */
  function buildCandidateProposalMessage(params = {}) {
    const father = (params.girlFatherName || params.guardianName || '').trim();
    const girl = (params.girlName || params.candidateName || '').trim();
    const listNo = String(params.listNumber !== undefined && params.listNumber !== null ? params.listNumber : (params.srNo || '')).replace(/\.$/, '').trim();

    const candDisplay = girl ? (girl.startsWith('कु.') ? girl : `कु. ${girl}`) : '';
    const srPart = listNo ? ` (अ.क्र. ${listNo}.)` : '';

    let introLine = '';
    if (father) {
      let prefix = '';
      if (!father.startsWith('श्री') && !father.startsWith('सौ') && !father.startsWith('डॉ')) {
        prefix = 'श्री. ';
      }
      introLine = `आम्ही ${prefix}${father} यांची मुलगी ${candDisplay}${srPart} हिच्यासाठी आपल्याशी संपर्क साधत आहोत.`;
    } else if (candDisplay) {
      introLine = `आम्ही वधू-वर सूचीमधील मुलगी ${candDisplay}${srPart} हिच्यासाठी आपल्याशी संपर्क साधत आहोत.`;
    } else {
      introLine = `आम्ही वधू-वर सूचीमधील आपल्या स्थळासाठी संपर्क साधत आहोत.`;
    }

    const groomName = params.groomName || DEFAULT_GROOM.name;
    const groomEdu = params.groomEdu || DEFAULT_GROOM.edu;
    const groomJob = params.groomJob || DEFAULT_GROOM.job;
    const groomCompany = params.groomCompany || DEFAULT_GROOM.company;
    const groomSalary = params.groomSalary || DEFAULT_GROOM.salary;
    const groomDob = params.groomDob || DEFAULT_GROOM.dob;
    const groomGotra = params.groomGotra || DEFAULT_GROOM.gotra;
    const url = params.biodataUrl || BIODATA_URL;

    // Optional CMS Custom Template override
    if (params.customTemplate && params.customTemplate.trim()) {
      const vars = {
        candidate_name: girl,
        sr_no: listNo,
        guardian_name: father,
        intro_line: introLine,
        groom_name: groomName,
        groom_edu: groomEdu,
        groom_job: groomJob,
        groom_company: groomCompany,
        groom_salary: groomSalary,
        groom_dob: groomDob,
        groom_gotra: groomGotra,
        profile_url: url
      };
      return params.customTemplate.replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? vars[key] : match));
    }

    return `नमस्कार!

${introLine}

भट्रूमंडळ वधू-वर सूचीमध्ये आपल्या मुलीची विवाहासाठी दिलेली माहिती आम्ही वाचली. तिचे स्थळ आम्हाला योग्य वाटल्यामुळे आपणाशी संपर्क साधत आहोत.

मुलाचा बायोडाटा आणि अधिक माहिती खालील लिंकवर पाहता येईल:
${url}

*थोडक्यात माहिती:*
• नाव: चि. ${groomName}
• शिक्षण: ${groomEdu}
• नोकरी: ${groomJob}, ${groomCompany}
• वार्षिक पॅकेज: ${groomSalary}
• जन्मतारीख: ${groomDob}
• गोत्र: ${groomGotra}

आपणासही आमचे स्थळ अनुकूल वाटल्यास पुढील चर्चेसाठी कृपया संपर्क साधावा.

धन्यवाद! 🙏`;
  }

  /**
   * २. सामान्य शोध मेसेज (नातेवाईक व परिचितांना पाठवताना - Generic Share Message)
   */
  function buildGenericShareMessage(params = {}) {
    const groomName = params.groomName || DEFAULT_GROOM.name;
    const groomEdu = params.groomEdu || DEFAULT_GROOM.edu;
    const groomJob = params.groomJob || DEFAULT_GROOM.job;
    const groomCompany = params.groomCompany || DEFAULT_GROOM.company;
    const groomSalary = params.groomSalary || DEFAULT_GROOM.salary;
    const groomDob = params.groomDob || DEFAULT_GROOM.dob;
    const url = params.biodataUrl || BIODATA_URL;

    // Optional CMS Custom Template override
    if (params.customTemplate && params.customTemplate.trim()) {
      const vars = {
        groom_name: groomName,
        groom_edu: groomEdu,
        groom_job: groomJob,
        groom_company: groomCompany,
        groom_salary: groomSalary,
        groom_dob: groomDob,
        profile_url: url
      };
      return params.customTemplate.replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? vars[key] : match));
    }

    return `नमस्कार!

आम्ही आमचा मुलगा चि. ${groomName} याच्यासाठी योग्य वधूच्या शोधात आहोत.

मुलाचा (${groomName}) बायोडाटा सोबत जोडलेला आहे. अधिक माहिती खालील लिंकवर पाहता येईल:
${url}

*थोडक्यात माहिती:*
• नाव: चि. ${groomName}
• शिक्षण: ${groomEdu}
• नोकरी: ${groomJob}, ${groomCompany}
• वार्षिक पॅकेज: ${groomSalary}
• जन्मतारीख: ${groomDob}

आपल्या परिचयात योग्य स्थळ असल्यास कृपया आम्हाला कळवावे.

धन्यवाद! 🙏`;
  }

  return {
    BIODATA_URL,
    DEFAULT_GROOM,
    buildCandidateProposalMessage,
    buildGenericShareMessage
  };
});
