var API = "http://localhost:5001";
var token = localStorage.getItem("token");
var user = JSON.parse(localStorage.getItem("user"));
if (!user || !token || user.role !== "Owner")
  window.location.href = "login.html";

var hour = new Date().getHours();
var timeGreeting =
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
document.getElementById("owner-greeting").textContent =
  timeGreeting + ", " + (user.firstname || "Admin");

var DEFAULT_ACCENT = "#4a2772";
function applyAccentColor(hex) {
  document.body.style.setProperty("--accent", hex);
  localStorage.setItem("ownerAccentColor", hex);
  var picker = document.getElementById("accent-color-picker");
  if (picker) picker.value = hex;
}
function resetAccentColor() { applyAccentColor(DEFAULT_ACCENT); }
(function initAccentColor() {
  var saved = localStorage.getItem("ownerAccentColor");
  if (saved) applyAccentColor(saved);
})();

var _tabLoaded = {};
function showTab(el, id) {
  var tabs = document.querySelectorAll(".tab-content");
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");
  document.getElementById(id).classList.add("active");
  var navs = document.querySelectorAll(".owner-nav-item");
  for (var i = 0; i < navs.length; i++) navs[i].classList.remove("active");
  el.classList.add("active");
  if (id === "tab-clients") backToClients();
  // Lazy-load tabs on first visit
  if (id === "tab-inbox" && !_tabLoaded.inbox) { _tabLoaded.inbox = true; loadInbox(); }
  if (id === "tab-calendar") renderCalendar();
  if (id === "tab-gallery" && !_tabLoaded.gallery) { _tabLoaded.gallery = true; loadGalleryAdmin(); }
  if (id === "tab-ratings") loadAllRatings();
}

function formatTime12(t) {
  if (!t) return '';
  var parts = t.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function doLogout() {
  if (!confirm("Are you sure you want to sign out?")) return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function badgeClass(status) {
  if (status === "Quote Submitted") return "badge-qs";
  if (status === "Consultation") return "badge-co";
  if (status === "Planning") return "badge-pl";
  if (status === "Vendors Set") return "badge-vs";
  if (status === "Event Day") return "badge-ed";
  if (status === "Completed") return "badge-cm";
  return "badge-qs";
}

function statusLabel(status) {
  if (status === "Quote Submitted") return "Quote Request Received";
  return status;
}

// ── Data ──
var allEvents = [];
var clientsMap = {};
var currentEditEventId = null;

// ── Clients Tab ──
function groupEventsByClient(events) {
  var map = {};
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var key = ev.client_id;
    if (!map[key]) {
      map[key] = {
        client_id: ev.client_id,
        firstname: ev.firstname,
        lastname: ev.lastname,
        email: ev.email,
        phone: ev.phone_number,
        events: []
      };
    }
    map[key].events.push(ev);
  }
  return map;
}

function getClientStage(c) {
  // return the highest-priority (earliest) status across all events
  var order = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];
  var best = 5;
  for (var j = 0; j < c.events.length; j++) {
    var idx = order.indexOf(c.events[j].status);
    if (idx >= 0 && idx < best) best = idx;
  }
  return order[best] || 'Quote Submitted';
}

function buildClientCard(c) {
  var nextDate = null;
  var stage = getClientStage(c);
  for (var j = 0; j < c.events.length; j++) {
    if (c.events[j].event_date) {
      if (!nextDate || c.events[j].event_date < nextDate)
        nextDate = c.events[j].event_date;
    }
  }
  var html = '';
  html += '<div class="client-card" onclick="openClient(' + c.client_id + ')" style="background:white;border:1px solid rgba(74,39,114,0.15);padding:20px 24px;cursor:pointer;border-radius:4px;transition:box-shadow 0.2s;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">';
  html += '<div>';
  html += '<div style="font-weight:500;font-size:1rem;color:#2e1547;">' + c.firstname + ' ' + c.lastname + '</div>';
  html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-top:2px;">' + (c.email || '') + '</div>';
  if (c.phone) html += '<div style="font-size:0.78rem;color:#7a6e5e;">' + c.phone + '</div>';
  html += '</div>';
  html += '<span class="status-badge ' + badgeClass(stage) + '" style="font-size:0.68rem;white-space:nowrap;">' + statusLabel(stage) + '</span>';
  html += '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
  for (var j = 0; j < c.events.length; j++) {
    html += '<span style="font-size:0.72rem;color:#7a6e5e;background:#f5f0eb;padding:2px 8px;border-radius:10px;">' + (c.events[j].event_type || c.events[j].event_name || 'Event') + '</span>';
  }
  html += '</div>';
  if (nextDate) {
    html += '<div style="font-size:0.75rem;color:#7a6e5e;margin-top:8px;">Next: ' + nextDate + '</div>';
  }
  html += '</div>';
  return html;
}

function renderClientCards() {
  filterClientCards();
}

function filterClientCards() {
  var term = (document.getElementById("client-search").value || '').trim().toLowerCase();
  var stageFilter = (document.getElementById("client-stage-filter").value || '');
  var grid = document.getElementById("clients-grid");
  var keys = Object.keys(clientsMap);

  if (keys.length === 0) {
    grid.innerHTML = '<p style="color:#7a6e5e;">No clients yet.</p>';
    return;
  }

  // filter clients
  var filtered = [];
  for (var i = 0; i < keys.length; i++) {
    var c = clientsMap[keys[i]];
    var name = (c.firstname + ' ' + c.lastname).toLowerCase();
    var email = (c.email || '').toLowerCase();
    if (term && name.indexOf(term) === -1 && email.indexOf(term) === -1) continue;
    if (stageFilter) {
      var hasStage = false;
      for (var j = 0; j < c.events.length; j++) {
        if (c.events[j].status === stageFilter) { hasStage = true; break; }
      }
      if (!hasStage) continue;
    }
    filtered.push(c);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:#7a6e5e;">No matching clients.</p>';
    return;
  }

  // group by stage if no specific filter is set
  if (!stageFilter) {
    var groups = {
      'Quote Submitted': [],
      'Consultation': [],
      'Planning': [],
      'Vendors Set': [],
      'Event Day': [],
      'Completed': []
    };
    for (var i = 0; i < filtered.length; i++) {
      var stage = getClientStage(filtered[i]);
      if (groups[stage]) groups[stage].push(filtered[i]);
      else groups['Quote Submitted'].push(filtered[i]);
    }

    var html = '';
    var groupLabels = {
      'Quote Submitted': 'Needs Quote',
      'Consultation': 'In Consultation',
      'Planning': 'Planning in Progress',
      'Vendors Set': 'Vendors Confirmed',
      'Event Day': 'Event Day',
      'Completed': 'Completed'
    };
    var groupKeys = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];
    // Sort each group so newest clients appear first
    for (var gk2 in groups) {
      groups[gk2].sort(function(a, b) {
        var aDate = a.events[0] && a.events[0].created_at ? a.events[0].created_at : '';
        var bDate = b.events[0] && b.events[0].created_at ? b.events[0].created_at : '';
        return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
      });
    }
    for (var g = 0; g < groupKeys.length; g++) {
      var gk = groupKeys[g];
      if (groups[gk].length === 0) continue;
      html += '<div style="grid-column:1/-1;margin-top:' + (g > 0 ? '20px' : '0') + ';margin-bottom:8px;">';
      html += '<div style="display:flex;align-items:center;gap:10px;">';
      html += '<span class="status-badge ' + badgeClass(gk) + '" style="font-size:0.7rem;">' + groupLabels[gk] + '</span>';
      html += '<span style="font-size:0.78rem;color:#7a6e5e;">' + groups[gk].length + ' client' + (groups[gk].length !== 1 ? 's' : '') + '</span>';
      html += '</div></div>';
      for (var i = 0; i < groups[gk].length; i++) {
        html += buildClientCard(groups[gk][i]);
      }
    }
    grid.innerHTML = html;
  } else {
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      html += buildClientCard(filtered[i]);
    }
    grid.innerHTML = html;
  }
}

function backToClients() {
  document.getElementById("clients-list-view").style.display = "";
  document.getElementById("client-detail-view").style.display = "none";
}

var activeClientId = null;
var clientDetailCache = {};

function switchClientTab(el, tabId) {
  var tabs = document.querySelectorAll(".client-subtab-content");
  for (var i = 0; i < tabs.length; i++) tabs[i].style.display = "none";
  document.getElementById(tabId).style.display = "";
  var btns = document.querySelectorAll(".client-subtab");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  el.classList.add("active");
}