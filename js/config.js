/**
 * config.js - Centralized Single Source of Truth for Anubandh App Configuration & URLs
 * सर्व मुख्य URL आणि ॲप सेटिंग्जसाठी एकच मध्यवर्ती फाईल
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnubandhConfig = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const APP_URL = 'https://anubandh-shubham-kharche.vercel.app';
  const PROFILE_PATH = '/profile';
  const PROFILE_FILE = 'profile.html';
  const PROFILE_URL = `${APP_URL}${PROFILE_PATH}`;
  const BIODATA_IMG_URL = `${APP_URL}/assets/shubham_kharche_biodata.jpg`;
  const REDESIGNED_PNG_URL = `${APP_URL}/assets/shubham_biodata_redesigned.png`;

  return {
    APP_URL,
    PROFILE_PATH,
    PROFILE_FILE,
    PROFILE_URL,
    BIODATA_IMG_URL,
    REDESIGNED_PNG_URL
  };
});
