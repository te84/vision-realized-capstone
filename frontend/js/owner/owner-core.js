// ── Config & auth ─────────────────────────────────────────────────
var API   = 'http://localhost:5001';
var token = localStorage.getItem('token');
var user  = JSON.parse(localStorage.getItem('user') || 'null');

if (!user || !token || user.role !== 'Owner') {
  window.location.href = 'login.html';
}

// ── Global data (populated once by _loadBulk) ────────────────────
var allEvents  = [];
var clientsMap = {};
var _cache     = { details: {}, loaded: false };

// ── Accent colour ─────────────────────────────────────────────────
(function () {
  var saved = localStorage.getItem('ownerAccentColor');
  if (saved) document.body.style.setProperty('--accent', saved);
}());

// ── Greeting / logout ─────────────────────────────────────────────
function buildGreeting() {
  var h = new Date().getHours();
  return (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') +
         ', ' + (user.firstname || 'Admin');
}
function doLogout() {
  if (!confirm('Are you sure you want to sign out?')) return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}

// ── Badge / label helpers ─────────────────────────────────────────
function badgeClass(status) {
  return { 'Quote Submitted':'badge-qs', 'Consultation':'badge-co', 'Planning':'badge-pl',
           'Vendors Set':'badge-vs', 'Event Day':'badge-ed', 'Completed':'badge-cm' }[status] || 'badge-qs';
}
function statusLabel(s) { return s === 'Quote Submitted' ? 'Quote Request Received' : s; }
function formatTime12(t) {
  if (!t) return '';
  var p = t.split(':'), h = parseInt(p[0], 10), m = p[1] || '00';
  return (h % 12 || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
}

// ── Stats bar ─────────────────────────────────────────────────────
function statsHeaderHTML(subtitle) {
  return '<div class="owner-header"><h1>' + buildGreeting() + '</h1><p>' + subtitle + '</p></div>' +
    '<div class="stats-row">' +
      '<div class="stat-box"><div class="num" id="stat-events">-</div><div class="label">Active Events</div></div>' +
      '<div class="stat-box"><div class="num" id="stat-quotes">-</div><div class="label">Needs Quote</div></div>' +
      '<div class="stat-box"><div class="num" id="stat-messages">-</div><div class="label">Contact Messages</div></div>' +
      '<div class="stat-box"><div class="num" id="stat-clients">-</div><div class="label">Total Clients</div></div>' +
    '</div>';
}
function updateStatsBar() {
  var count = Object.keys(clientsMap).length;
  var needsQ = allEvents.filter(function (e) { return e.status === 'Quote Submitted'; }).length;
  var el;
  if ((el = document.getElementById('stat-events')))  el.textContent = allEvents.length;
  if ((el = document.getElementById('stat-quotes')))  el.textContent = needsQ;
  if ((el = document.getElementById('stat-clients'))) el.textContent = count;
  var badge = document.getElementById('clients-badge');
  if (badge) badge.textContent = count;
}

// ── Bulk data loader — ONE fetch, then cached ─────────────────────
function _loadBulk(cb) {
  if (_cache.loaded) { cb(); return; }

  fetch(API + '/owner/bulk', { headers: { Authorization: 'Bearer ' + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      allEvents = data.events;
      _cache.details = data.details || {};
      _cache.loaded  = true;

      clientsMap = {};
      allEvents.forEach(function (ev) {
        var k = ev.client_id;
        if (!clientsMap[k]) clientsMap[k] = { client_id: k, firstname: ev.firstname, lastname: ev.lastname, email: ev.email, phone: ev.phone_number, events: [] };
        clientsMap[k].events.push(ev);
      });
      cb();
    })
    .catch(function (e) { console.error('Bulk load failed', e); });
}

function _invalidateCache() { _cache.loaded = false; }

function _reload(cb) {
  _invalidateCache();
  _loadBulk(cb || function () {});
}

// ── Invoice helpers ───────────────────────────────────────────────
var _INV_COLORS = {
  Pending:   { bg:'#fff8e1', color:'#b8860b', border:'#f9c84e' },
  Sent:      { bg:'#e3f0fb', color:'#1565c0', border:'#90caf9' },
  Paid:      { bg:'#e8f5e9', color:'#2e7d32', border:'#81c784' },
  Overdue:   { bg:'#fdecea', color:'#c62828', border:'#ef9a9a' },
  Cancelled: { bg:'#f5f5f5', color:'#616161', border:'#bdbdbd' }
};
function invoiceStatusBadge(status) {
  var c = _INV_COLORS[status] || { bg:'#f5f5f5', color:'#555', border:'#ccc' };
  return '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:0.72rem;background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + ';">' + status + '</span>';
}

function renderInvoicesFromCache(eventId) {
  var box = document.getElementById('owner-invoice-list');
  if (!box) return;
  var invs = (_cache.details[eventId] || {}).invoices || [];
  if (!invs.length) { box.innerHTML = '<p style="color:#7A6E5E;font-size:0.85rem;">No invoices assigned yet.</p>'; return; }
  var statuses = ['Pending','Sent','Paid','Overdue','Cancelled'];
  var html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;"><thead><tr style="border-bottom:1px solid rgba(74,39,114,0.15);">' +
    ['Amount','Due Date','Status','Change Status',''].map(function (h) { return '<th style="text-align:left;padding:6px 8px;color:#7a6e5e;font-weight:500;">' + h + '</th>'; }).join('') +
    '</tr></thead><tbody>';
  invs.forEach(function (inv) {
    html += '<tr style="border-bottom:1px solid rgba(74,39,114,0.08);">' +
      '<td style="padding:8px;font-weight:500;">' + (inv.amount != null ? '$' + parseFloat(inv.amount).toFixed(2) : '<span style="color:#bbb;">—</span>') + '</td>' +
      '<td style="padding:8px;">' + (inv.due_date || '<span style="color:#bbb;">—</span>') + '</td>' +
      '<td style="padding:8px;">' + invoiceStatusBadge(inv.status) + '</td>' +
      '<td style="padding:8px;"><select onchange="ownerUpdateInvoiceStatus(' + inv.invoice_id + ',this.value,' + eventId + ')" style="padding:5px 8px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.82rem;outline:none;">' +
        statuses.map(function (s) { return '<option value="' + s + '"' + (s === inv.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
      '</select></td>' +
      '<td style="padding:8px;text-align:right;"><button onclick="ownerDeleteInvoice(' + inv.invoice_id + ',' + eventId + ')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;">✕</button></td>' +
      '</tr>';
  });
  box.innerHTML = html + '</tbody></table>';
}

function ownerAddInvoice(eventId, clientId) {
  var status  = document.getElementById('new-invoice-status').value;
  var amount  = document.getElementById('new-invoice-amount').value || null;
  var dueDate = document.getElementById('new-invoice-due').value || null;
  fetch(API + '/owner/invoices', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ event_id: eventId, client_id: clientId, status: status, amount: amount, due_date: dueDate })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.success) return;
    document.getElementById('new-invoice-amount').value = '';
    document.getElementById('new-invoice-due').value = '';
    var inv = { invoice_id: d.invoice_id, client_id: clientId, status: status, amount: amount ? parseFloat(amount) : null, due_date: dueDate };
    _cache.details[eventId] = _cache.details[eventId] || {};
    _cache.details[eventId].invoices = _cache.details[eventId].invoices || [];
    _cache.details[eventId].invoices.unshift(inv);
    renderInvoicesFromCache(eventId);
  });
}

function ownerUpdateInvoiceStatus(invoiceId, status, eventId) {
  fetch(API + '/owner/invoices/' + invoiceId + '/status', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ status: status })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.success) return;
    ((_cache.details[eventId] || {}).invoices || []).forEach(function (i) { if (i.invoice_id === invoiceId) i.status = status; });
    renderInvoicesFromCache(eventId);
  });
}

function ownerDeleteInvoice(invoiceId, eventId) {
  if (!confirm('Delete this invoice?')) return;
  fetch(API + '/owner/invoices/' + invoiceId, {
    method: 'DELETE', headers: { Authorization: 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.success) return;
    var det = _cache.details[eventId];
    if (det) det.invoices = (det.invoices || []).filter(function (i) { return i.invoice_id !== invoiceId; });
    renderInvoicesFromCache(eventId);
  });
}

// ── Task helpers ──────────────────────────────────────────────────
function ownerToggleTask(taskId, eventId) {
  fetch(API + '/owner/tasks/' + taskId, { method: 'PUT', headers: { Authorization: 'Bearer ' + token } })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.success) return;
      var row = document.getElementById('task-row-' + taskId);
      if (!row) return;
      var done = row.classList.toggle('done');
      var toggle = row.querySelector('.task-toggle');
      if (toggle) toggle.textContent = done ? '✓' : '';
      if (eventId) {
        ((_cache.details[eventId] || {}).tasks || []).forEach(function (t) { if (t.id === taskId) t.completed = done; });
      }
    });
}

function ownerDeleteTask(taskId, listId, eventId) {
  fetch(API + '/owner/tasks/' + taskId, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.success) return;
      var row = document.getElementById('task-row-' + taskId);
      if (row) row.remove();
      var list = document.getElementById(listId);
      if (list && !list.children.length) list.innerHTML = '<p style="color:#7A6E5E;">No tasks yet.</p>';
      if (eventId) {
        var det = _cache.details[eventId];
        if (det) det.tasks = (det.tasks || []).filter(function (t) { return t.id !== taskId; });
      }
    });
}

// ── Tab router ────────────────────────────────────────────────────
var _activeTab = null;

function showTab(name) {
  ['clients','calendar','gallery','ratings'].forEach(function (t) {
    var el = document.getElementById('nav-' + t);
    if (el) el.classList.toggle('active', t === name);
  });
  _activeTab = name;
  var container = document.getElementById('main-content');
  container.innerHTML = '<div style="color:#7a6e5e;padding:40px 0;">Loading…</div>';

  var TAB_FNS = {
    clients:  typeof clientsTabInit  === 'function' ? clientsTabInit  : null,
    calendar: typeof calendarTabInit === 'function' ? calendarTabInit : null,
    gallery:  typeof galleryTabInit  === 'function' ? galleryTabInit  : null,
    ratings:  typeof ratingsTabInit  === 'function' ? ratingsTabInit  : null
  };
  var fn = TAB_FNS[name];
  if (!fn) { container.innerHTML = '<p style="color:#c0392b;">Tab not found.</p>'; return; }

  // Gallery manages its own fetch; everything else uses bulk cache
  if (name === 'gallery') { fn(container); return; }
  _loadBulk(function () { fn(container); });
}
