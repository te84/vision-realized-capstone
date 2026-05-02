/* ── Portal Core — globals, utilities, tab switching ─────────────── */
var API = "http://localhost:5001";
var user = JSON.parse(localStorage.getItem("user"));
var token = localStorage.getItem("token");
var currentEventId = null;
var allEventsData = [];

if (!user || !token) window.location.href = "login.html";

if (user) {
  var navEl = document.querySelector(".nav-portal");
  navEl.textContent = user.firstname + "'s Portal";
  navEl.href = "portal.html";
}

function switchTab(el, id) {
  var items = document.querySelectorAll(".portal-nav-item");
  for (var i = 0; i < items.length; i++)
    items[i].classList.remove("active");
  if (el) el.classList.add("active");
  var tabIds = ['tab-overview','tab-progress','tab-checklist','tab-messages','tab-invoices','tab-after'];
  for (var i = 0; i < tabIds.length; i++) {
    var t = document.getElementById(tabIds[i]);
    if (t) t.style.display = 'none';
  }
  document.getElementById(id).style.display = "block";
  localStorage.setItem('portal_active_tab', id);
  window.scrollTo(0, 0);
  if (id === 'tab-messages' && currentEventId) {
    fetch(API + "/client/messages/" + currentEventId + "/read", {
      method: "PUT",
      headers: { Authorization: "Bearer " + token },
    }).then(function() {
      var badge = document.getElementById("msg-badge");
      if (badge) { badge.style.display = "none"; badge.textContent = "0"; }
    });
  }
  if (id === 'tab-after') {
    loadExistingRating();
  }
  if (id === 'tab-invoices' && currentEventId) {
    loadInvoices(currentEventId);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function statusLabel(s) {
  if (s === 'Quote Submitted') return 'Quote Request Received';
  if (s === 'Pending Consultation') return 'Pending Consultation';
  return s;
}

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function daysUntil(d) {
  if (!d) return null;
  var ev = new Date(d + "T00:00:00");
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((ev - now) / 86400000);
}

function fmtDate(d) {
  if (!d) return "TBD";
  var dt = new Date(d + "T00:00:00");
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear();
}

function fmtMsgDate(d) {
  if (!d) return '';
  var dt = new Date(d.replace(' ', 'T') + 'Z');
  if (isNaN(dt.getTime())) return d;
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = dt.getHours(); var m = dt.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  var min = m < 10 ? '0' + m : m;
  return months[dt.getMonth()] + ' ' + (dt.getDate() < 10 ? '0' : '') + dt.getDate() + ', ' + dt.getFullYear() + ' at ' + (h < 10 ? '0' : '') + h + ':' + min + ' ' + ampm;
}
