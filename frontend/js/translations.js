var translations = {};
var currentLang = localStorage.getItem('lang') || 'en';

//fetch translations from backend
fetch('/api/translations')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) translations = data.translations;
    if (currentLang !== 'en') setLang(currentLang);
  });

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // toggle buttons
  var navBtns = document.querySelectorAll('.nav-lang button');
  if (navBtns[0]) navBtns[0].className = lang === 'en' ? 'active' : '';
  if (navBtns[1]) navBtns[1].className = lang === 'es' ? 'active' : '';

  var sideBtns = document.querySelectorAll('.lang-btn');
  if (sideBtns[0]) sideBtns[0].className = 'lang-btn' + (lang === 'en' ? ' active' : '');
  if (sideBtns[1]) sideBtns[1].className = 'lang-btn' + (lang === 'es' ? ' active' : '');

  var t = translations[lang];
  if (!t) return;

  // nav links
  var links = document.querySelectorAll('.nav-links a');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].href;
    if (href.indexOf('index.html') >= 0 && !links[i].classList.contains('nav-portal')) links[i].textContent = t.navHome;
    else if (href.indexOf('about') >= 0) links[i].textContent = t.navAbout;
    else if (href.indexOf('services') >= 0) links[i].textContent = t.navServices;
    else if (href.indexOf('gallery') >= 0) links[i].textContent = t.navGallery;
    else if (href.indexOf('testimonials') >= 0) links[i].textContent = t.navTestimonials;
    else if (href.indexOf('contact') >= 0) links[i].textContent = t.navContact;
    else if (links[i].classList.contains('nav-portal')) {
      var u = JSON.parse(localStorage.getItem('user'));
      if (!u) links[i].textContent = t.navLogin;
    }
  }
  var cta = document.querySelector('.nav-cta');
  if (cta) cta.textContent = t.navCta;

  // swap text for anything with data-i18n
  var els = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < els.length; i++) {
    var key = els[i].getAttribute('data-i18n');
    if (t[key]) els[i].textContent = t[key];
  }

  // quote form stuff
  if (document.querySelector('.quote-sidebar')) {
    document.querySelector('.quote-sidebar h2').textContent = t.sidebarTitle;
    document.querySelector('.quote-sidebar p').textContent = t.sidebarDesc;

    var feats = document.querySelectorAll('.feat-text');
    if (feats[0]) feats[0].innerHTML = '<strong>' + t.feat1 + '</strong>' + t.feat1d;
    if (feats[1]) feats[1].innerHTML = '<strong>' + t.feat2 + '</strong>' + t.feat2d;
    if (feats[2]) feats[2].innerHTML = '<strong>' + t.feat3 + '</strong>' + t.feat3d;

    var titles = document.querySelectorAll('.form-step-title');
    var subs = document.querySelectorAll('.form-step-sub');
    for (var i = 0; i < 5; i++) {
      if (titles[i]) titles[i].textContent = t['step' + (i+1) + 'title'];
      if (subs[i]) subs[i].textContent = t['step' + (i+1) + 'sub'];
    }

    var lbls = document.querySelectorAll('#step-0 .field label');
    var lblKeys = ['lblFirst','lblLast','lblEmail','lblPhone','lblPassword','lblSecQ','lblSecA','lblHear'];
    for (var i = 0; i < lblKeys.length; i++) {
      if (lbls[i]) lbls[i].textContent = t[lblKeys[i]];
    }

    var lbls2 = document.querySelectorAll('#step-2 .field label');
    var lblKeys2 = ['lblDate','lblGuests','lblLocation','lblVenue','lblVision'];
    for (var i = 0; i < lblKeys2.length; i++) {
      if (lbls2[i]) lbls2[i].textContent = t[lblKeys2[i]];
    }

    if (document.getElementById('prog-label') && typeof curStep !== 'undefined')
      document.getElementById('prog-label').textContent = t.stepOf.replace('{n}', curStep + 1);

    var nextBtns = document.querySelectorAll('.btn-next');
    for (var i = 0; i < nextBtns.length - 1; i++) nextBtns[i].textContent = t.btnContinue;
    if (nextBtns.length > 0) nextBtns[nextBtns.length - 1].textContent = t.btnSubmit;

    var backBtns = document.querySelectorAll('.btn-back');
    for (var i = 0; i < backBtns.length; i++) backBtns[i].textContent = t.btnBack;
  }
}
