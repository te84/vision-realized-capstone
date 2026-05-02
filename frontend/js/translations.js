(function () {
  var API = window.location.origin;
  var translations = null;
  var currentLang = localStorage.getItem('lang') || 'en';

  function applyTranslations(lang) {
    if (!translations || !translations[lang]) return;
    var t = translations[lang];
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (t[key] !== undefined) {
        if (els[i].tagName === 'INPUT' || els[i].tagName === 'TEXTAREA') {
          els[i].placeholder = t[key];
        } else {
          els[i].textContent = t[key];
        }
      }
    }
    var btns = document.querySelectorAll('.nav-lang button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
      if (btns[i].textContent.trim().toLowerCase() === lang) {
        btns[i].classList.add('active');
      }
    }
  }

  function loadTranslations(callback) {
    if (translations) { callback(); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API + '/api/translations');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        if (data.success) {
          translations = data.translations;
        }
      }
      callback();
    };
    xhr.onerror = function () { callback(); };
    xhr.send();
  }

  window.setLang = function (lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    loadTranslations(function () {
      applyTranslations(lang);
    });
  };

  if (currentLang !== 'en') {
    loadTranslations(function () {
      applyTranslations(currentLang);
    });
  }
})();
