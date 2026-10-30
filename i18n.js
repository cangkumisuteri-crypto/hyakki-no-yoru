/* i18n.js - tiny helper. Every UI string is written as T(ja, en); data text is [ja, en] arrays (use L()). */
(function () {
  const I = { lang: 'en' };
  I.detect = function (saved, portalLocale) {
    const qs = new URLSearchParams(location.search).get('lang');
    const raw = (qs || saved || portalLocale || (navigator.languages && navigator.languages[0]) || navigator.language || 'en') + '';
    return /^ja/i.test(raw) ? 'ja' : 'en';
  };
  I.set = function (l) { I.lang = l === 'ja' ? 'ja' : 'en'; document.documentElement.lang = I.lang; };
  window.I18N = I;
  window.T = (ja, en) => (I.lang === 'ja' ? ja : en);
  window.L = (a) => (Array.isArray(a) ? (I.lang === 'ja' ? a[0] : a[1]) : a);
})();
