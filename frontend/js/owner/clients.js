function openClient(clientId) {
  var c = clientsMap[clientId];
  if (!c) return;
  activeClientId = clientId;
  document.getElementById("clients-list-view").style.display = "none";
  document.getElementById("client-detail-view").style.display = "";

  // Reset to overview tab
  var btns = document.querySelectorAll(".client-subtab");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  btns[0].classList.add("active");
  var tabs = document.querySelectorAll(".client-subtab-content");
  for (var i = 0; i < tabs.length; i++) tabs[i].style.display = i === 0 ? "" : "none";

  // Client header
  var hdr = document.getElementById("client-header");
  hdr.innerHTML = '<div style="margin-bottom:8px;">' +
    '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.8rem;color:#2e1547;font-style:italic;margin-bottom:4px;">' + c.firstname + ' ' + c.lastname + '</h2>' +
    '<div style="font-size:0.88rem;color:#7a6e5e;">' + (c.email || '') + (c.phone ? ' &middot; ' + c.phone : '') + '</div>' +
    '</div>';

  // Load all event details for this client
  var eventIds = c.events.map(function(e) { return e.id; });
  var fetches = eventIds.map(function(eid) {
    return fetch(API + "/owner/event-detail/" + eid, { headers: { Authorization: "Bearer " + token } })
      .then(function(r) { return r.json(); });
  });

  Promise.all(fetches).then(function(details) {
    clientDetailCache = {};
    for (var i = 0; i < details.length; i++) {
      if (details[i].success) clientDetailCache[eventIds[i]] = details[i];
    }
    renderClientOverview(c);
    renderClientEvents(c);
    renderClientTasks(c);
    renderClientMessages(c);
    renderClientDocuments(c);
    renderClientQuotes(c);
  });
}

// ── Overview Tab ──
var journeySteps = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];

function buildJourney(status) {
  var cur = status || 'Quote Submitted';
  var idx = 0;
  for (var i = 0; i < journeySteps.length; i++) { if (journeySteps[i] === cur) { idx = i; break; } }
  var result = [];
  for (var i = 0; i < journeySteps.length; i++) {
    var st = i < idx ? 'done' : i === idx ? 'current' : 'pending';
    result.push({ name: journeySteps[i], status: st });
  }
  return result;
}

function renderJourneyBar(journey) {
  var html = '<div style="display:flex;gap:4px;align-items:center;margin:12px 0 4px;">';
  for (var i = 0; i < journey.length; i++) {
    var s = journey[i];
    var bg = s.status === 'done' ? '#4a2772' : s.status === 'current' ? '#6b3fa0' : '#e8e0f0';
    var color = s.status === 'pending' ? '#7a6e5e' : '#fff';
    var opacity = s.status === 'pending' ? '0.5' : '1';
    html += '<div style="flex:1;text-align:center;opacity:' + opacity + ';">';
    html += '<div style="height:6px;background:' + bg + ';border-radius:3px;margin-bottom:4px;"></div>';
    html += '<div style="font-size:0.62rem;color:' + (s.status === 'pending' ? '#7a6e5e' : '#4a2772') + ';letter-spacing:0.02em;">' + statusLabel(s.name) + '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderClientOverview(c) {
  var html = '';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px;">';
  var active = 0, completed = 0, totalTasks = 0, doneTasks = 0, totalMsgs = 0, totalDocs = 0;
  for (var i = 0; i < c.events.length; i++) {
    var ev = c.events[i];
    if (ev.status === "Completed") completed++; else active++;
    var detail = clientDetailCache[ev.id];
    if (detail) {
      totalTasks += detail.tasks.length;
      for (var t = 0; t < detail.tasks.length; t++) { if (detail.tasks[t].completed) doneTasks++; }
      totalMsgs += detail.messages.length;
      totalDocs += detail.documents.length;
    }
  }
  html += '<div class="stat-box"><div class="num">' + active + '</div><div class="label">Active Events</div></div>';
  html += '<div class="stat-box"><div class="num">' + completed + '</div><div class="label">Completed</div></div>';
  html += '<div class="stat-box"><div class="num">' + doneTasks + '/' + totalTasks + '</div><div class="label">Tasks Done</div></div>';
  html += '<div class="stat-box"><div class="num">' + totalMsgs + '</div><div class="label">Messages</div></div>';
  html += '</div>';

  // Event summary cards with journey
  for (var i = 0; i < c.events.length; i++) {
    var ev = c.events[i];
    var journey = buildJourney(ev.status);
    var detail = clientDetailCache[ev.id];
    var tasksDone = 0, tasksTotal = 0;
    if (detail) { tasksTotal = detail.tasks.length; for (var t = 0; t < detail.tasks.length; t++) { if (detail.tasks[t].completed) tasksDone++; } }

    html += '<div class="panel" style="margin-bottom:16px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    html += '<div>';
    html += '<h3 style="margin-bottom:2px;">' + (ev.event_name || 'Untitled Event') + '</h3>';
    html += '<div style="font-size:0.8rem;color:#7a6e5e;">' + (ev.event_type || '') + (ev.event_date ? ' &middot; ' + ev.event_date : ' &middot; TBD') + (ev.location ? ' &middot; ' + ev.location : '') + '</div>';
    html += '</div>';
    html += '<span class="status-badge ' + badgeClass(ev.status) + '">' + statusLabel(ev.status) + '</span>';
    html += '</div>';
    html += renderJourneyBar(journey);
    // Quick stats row
    html += '<div style="display:flex;gap:16px;margin-top:10px;font-size:0.78rem;color:#7a6e5e;">';
    html += '<span>Tasks: ' + tasksDone + '/' + tasksTotal + '</span>';
    if (detail) html += '<span>Messages: ' + detail.messages.length + '</span>';
    if (detail) html += '<span>Documents: ' + detail.documents.length + '</span>';
    if (ev.planner && ev.planner !== 'TBD') html += '<span>Planner: ' + ev.planner + '</span>';
    html += '</div>';
    html += '</div>';
  }
  document.getElementById("ctab-overview").innerHTML = html;
}

// ── Events Tab (edit/manage) ──
function renderClientEvents(c) {
  var html = '';
  if (c.events.length > 1) {
    html += '<div style="margin-bottom:16px;">';
    html += '<select id="client-event-select" onchange="selectClientEvent(this.value)" style="width:100%;padding:12px 16px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:\'Cormorant Garamond\',serif;font-size:1.05rem;color:#2e1547;outline:none;border-radius:2px;">';
    for (var i = 0; i < c.events.length; i++) {
      html += '<option value="' + c.events[i].id + '">' + (c.events[i].event_name || 'Event') + ' — ' + (c.events[i].event_date || 'TBD') + '</option>';
    }
    html += '</select></div>';
  }
  html += '<div id="client-event-edit-area"></div>';
  document.getElementById("ctab-events").innerHTML = html;
  selectClientEvent(c.events[0].id);
}

function selectClientEvent(eventId) {
  eventId = parseInt(eventId);
  currentEditEventId = eventId;
  var ev = null;
  for (var i = 0; i < allEvents.length; i++) {
    if (allEvents[i].id === eventId) { ev = allEvents[i]; break; }
  }
  var data = clientDetailCache[eventId] || { tasks: [], messages: [], documents: [], quote: null };
  var statuses = ["Quote Submitted","Consultation","Planning","Vendors Set","Event Day","Completed"];
  var curStatus = ev && ev.status ? ev.status : "Quote Submitted";

  var html = '';
  html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;">';
  html += '<h4 style="margin:0 0 14px;font-size:0.9rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Edit Event</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;">';
  html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Event Name</label>';
  html += '<input id="edit-name" value="' + (ev && ev.event_name ? ev.event_name.replace(/"/g, "&quot;") : "") + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Status</label>';
  html += '<select id="edit-status" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;">';
  for (var s = 0; s < statuses.length; s++) {
    html += '<option value="' + statuses[s] + '"' + (statuses[s] === curStatus ? " selected" : "") + '>' + statusLabel(statuses[s]) + '</option>';
  }
  html += '</select></div>';
  html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Event Date</label>';
  html += '<input id="edit-date" type="date" value="' + (ev && ev.event_date ? ev.event_date : "") + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Location</label>';
  html += '<input id="edit-location" value="' + (ev && ev.location ? ev.location.replace(/"/g, "&quot;") : "") + '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Event Type</label>';
  html += '<input id="edit-event-type" value="' + (ev && ev.event_type ? ev.event_type.replace(/"/g, "&quot;") : "") + '" placeholder="e.g. Birthday Party" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Guests</label>';
  html += '<input id="edit-guests" value="' + (ev && ev.guests ? ev.guests : "") + '" placeholder="e.g. 50-100" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  html += '<div style="grid-column:1/-1"><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Planner</label>';
  html += '<input id="edit-planner" value="' + (ev && ev.planner ? ev.planner.replace(/"/g, "&quot;") : "") + '" placeholder="Assign a planner name" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  html += '</div>';
  html += '<div style="margin-top:14px;text-align:right;">';
  html += '<button id="save-event-btn" onclick="saveEventChanges()" style="padding:9px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;">Save Changes</button>';
  html += '</div></div>';

  // ── Invoices ──
  html += '<h4 style="margin-top:28px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Invoices</h4>';
  html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:16px 20px;margin-bottom:24px;">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:16px;align-items:end;">';
  html += '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Status</label>';
  html += '<select id="new-invoice-status" style="width:100%;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"><option value="Pending">Pending</option><option value="Sent">Sent</option><option value="Paid">Paid</option><option value="Overdue">Overdue</option><option value="Cancelled">Cancelled</option></select></div>';
  html += '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Amount ($)</label>';
  html += '<input id="new-invoice-amount" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"></div>';
  html += '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Due Date</label>';
  html += '<input id="new-invoice-due" type="date" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"></div>';
  html += '<button onclick="ownerAddInvoice(' + eventId + ',' + (ev ? ev.client_id : 0) + ')" style="padding:8px 18px;background:#555;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;align-self:end;">+ Add</button>';
  html += '</div>';
  html += '<div id="owner-invoice-list"><p style="color:#7A6E5E;font-size:0.85rem;">Loading invoices...</p></div>';
  html += '</div>';

  document.getElementById("client-event-edit-area").innerHTML = html;
  loadInvoices(eventId);
}

// ── Tasks Tab ──
function renderClientTasks(c) {
  var html = '';
  for (var i = 0; i < c.events.length; i++) {
    var ev = c.events[i];
    var detail = clientDetailCache[ev.id];
    if (!detail) continue;

    html += '<div class="panel" style="margin-bottom:16px;">';
    html += '<h3 style="margin-bottom:4px;">' + (ev.event_name || 'Event') + '</h3>';
    html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:14px;">' + (ev.event_type || '') + (ev.event_date ? ' &middot; ' + ev.event_date : '') + '</div>';

    // Add task form
    html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:14px 16px;margin-bottom:14px;">';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += '<input id="new-task-title-' + ev.id + '" placeholder="Task title..." style="flex:2;min-width:140px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
    html += '<input id="new-task-date-' + ev.id + '" type="date" style="flex:1;min-width:120px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
    html += '<button onclick="ownerAddTaskForEvent(' + ev.id + ')" style="padding:8px 18px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;">+ Assign</button>';
    html += '</div></div>';

    html += '<div id="owner-task-list-' + ev.id + '">';
    if (detail.tasks.length === 0) {
      html += '<p style="color:#7A6E5E;">No tasks yet.</p>';
    } else {
      for (var t = 0; t < detail.tasks.length; t++) {
        var task = detail.tasks[t];
        html += '<div class="task-item' + (task.completed ? " done" : "") + '" id="task-row-' + task.id + '" style="display:flex;align-items:center;justify-content:space-between;">';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<div class="task-toggle" onclick="ownerToggleTask(' + task.id + ')" style="cursor:pointer;">' + (task.completed ? "✓" : "") + '</div>';
        html += '<span>' + task.title + '</span>';
        if (task.due_date) html += '<span style="color:#7A6E5E;font-size:0.8rem;">— ' + task.due_date + '</span>';
        html += '</div>';
        html += '<button onclick="ownerDeleteTask(' + task.id + ')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;" title="Delete task">✕</button>';
        html += '</div>';
      }
    }
    html += '</div></div>';
  }
  document.getElementById("ctab-tasks").innerHTML = html;
}

function ownerAddTaskForEvent(eventId) {
  currentEditEventId = eventId;
  var titleEl = document.getElementById("new-task-title-" + eventId);
  var dateEl = document.getElementById("new-task-date-" + eventId);
  var title = titleEl.value.trim();
  var due = dateEl.value || null;
  if (!title) { titleEl.focus(); return; }
  fetch(API + "/owner/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, title: title, due_date: due }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      titleEl.value = ""; dateEl.value = "";
      var list = document.getElementById("owner-task-list-" + eventId);
      var emptyMsg = list.querySelector("p");
      if (emptyMsg) emptyMsg.remove();
      var tid = data.task_id || Date.now();
      var row = document.createElement("div");
      row.className = "task-item";
      row.id = "task-row-" + tid;
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;";
      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div class="task-toggle" onclick="ownerToggleTask(' + tid + ')" style="cursor:pointer;"></div>' +
        '<span>' + title + '</span>' +
        (due ? '<span style="color:#7A6E5E;font-size:0.8rem;">— ' + due + '</span>' : '') +
        '</div>' +
        '<button onclick="ownerDeleteTask(' + tid + ')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;" title="Delete task">✕</button>';
      list.appendChild(row);
    });
}

// ── Messages Tab ──
function renderClientMessages(c) {
  var html = '';
  for (var i = 0; i < c.events.length; i++) {
    var ev = c.events[i];
    var detail = clientDetailCache[ev.id];
    if (!detail) continue;

    html += '<div class="panel" style="margin-bottom:16px;">';
    html += '<h3 style="margin-bottom:4px;">' + (ev.event_name || 'Event') + '</h3>';
    html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:14px;">' + (ev.event_type || '') + (ev.event_date ? ' &middot; ' + ev.event_date : '') + '</div>';

    html += '<div id="owner-chat-history-' + ev.id + '" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:320px;overflow-y:auto;">';
    if (!detail.messages || detail.messages.length === 0) {
      html += '<p style="color:#7A6E5E;font-size:0.85rem;">No messages yet.</p>';
    } else {
      var msgsChron = detail.messages.slice().reverse();
      for (var m = 0; m < msgsChron.length; m++) {
        var msg = msgsChron[m];
        var isOwner = msg.sender === "Vision Realized";
        var bubbleStyle = isOwner
          ? "margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;"
          : "margin-right:auto;background:#fff;color:#1A1208;border:1px solid rgba(74,39,114,0.15);border-radius:12px 12px 12px 2px;";
        html += '<div style="max-width:75%;padding:10px 14px;' + bubbleStyle + '">';
        html += '<div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">' + (msg.sender || "") + '</div>';
        html += '<div style="font-size:0.88rem;line-height:1.5;">' + (msg.text || "") + '</div>';
        html += '</div>';
      }
    }
    html += '</div>';
    html += '<div style="display:flex;gap:8px;align-items:flex-end;">';
    html += '<textarea id="owner-msg-input-' + ev.id + '" placeholder="Type a message..." rows="2" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendMsgForEvent(' + ev.id + ');}" style="flex:1;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:none;outline:none;border-radius:2px;"></textarea>';
    html += '<button onclick="sendMsgForEvent(' + ev.id + ')" style="padding:10px 20px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;white-space:nowrap;border-radius:2px;">Send</button>';
    html += '</div></div>';
  }
  document.getElementById("ctab-messages").innerHTML = html;
}

function sendOwnerEventMsg(eventId) {
  var input = document.getElementById("owner-event-msg-input");
  var text = input ? input.value.trim() : "";
  if (!text) { if (input) input.focus(); return; }
  fetch(API + "/owner/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, sender: "Vision Realized", text: text }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      var history = document.getElementById("owner-chat-history");
      if (history) {
        var empty = history.querySelector("p");
        if (empty) empty.remove();
        var bubble = document.createElement("div");
        bubble.style.cssText = "max-width:75%;padding:10px 14px;margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;";
        bubble.innerHTML =
          '<div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">Vision Realized</div>' +
          '<div style="font-size:0.88rem;line-height:1.5;">' + text + '</div>';
        history.appendChild(bubble);
        history.scrollTop = history.scrollHeight;
      }
      input.value = "";
    });
}

function sendMsgForEvent(eventId) {
  var input = document.getElementById("owner-msg-input-" + eventId);
  var text = input ? input.value.trim() : "";
  if (!text) { if (input) input.focus(); return; }
  fetch(API + "/owner/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, sender: "Vision Realized", text: text }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      var history = document.getElementById("owner-chat-history-" + eventId);
      var empty = history.querySelector("p");
      if (empty) empty.remove();
      var bubble = document.createElement("div");
      bubble.style.cssText = "max-width:75%;padding:10px 14px;margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;";
      bubble.innerHTML =
        '<div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">Vision Realized</div>' +
        '<div style="font-size:0.88rem;line-height:1.5;">' + text + '</div>';
      history.appendChild(bubble);
      history.scrollTop = history.scrollHeight;
      input.value = "";
    });
}

// ── Documents Tab ──
function renderClientDocuments(c) {
  var html = '';
  for (var i = 0; i < c.events.length; i++) {
    var ev = c.events[i];
    var detail = clientDetailCache[ev.id];
    if (!detail) continue;

    html += '<div class="panel" style="margin-bottom:16px;">';
    html += '<h3 style="margin-bottom:4px;">' + (ev.event_name || 'Event') + '</h3>';
    html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:14px;">' + (ev.event_type || '') + (ev.event_date ? ' &middot; ' + ev.event_date : '') + '</div>';

    // add document form
    html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:14px 16px;margin-bottom:14px;">';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += '<input id="new-doc-name-' + ev.id + '" placeholder="Document name..." style="flex:2;min-width:140px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
    html += '<select id="new-doc-type-' + ev.id + '" style="padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
    html += '<option value="PDF">PDF</option><option value="DOC">DOC</option><option value="IMG">IMG</option><option value="XLS">XLS</option><option value="OTHER">OTHER</option>';
    html += '</select>';
    html += '<select id="new-doc-status-' + ev.id + '" style="padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
    html += '<option value="Uploaded">Uploaded</option><option value="Pending Signature">Pending Signature</option><option value="Signed">Signed</option><option value="Final">Final</option>';
    html += '</select>';
    html += '<button onclick="addDocForEvent(' + ev.id + ')" style="padding:8px 18px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;">+ Add</button>';
    html += '</div></div>';

    html += '<div id="doc-list-' + ev.id + '">';
    if (detail.documents.length === 0) {
      html += '<p style="color:#7A6E5E;">No documents yet.</p>';
    } else {
      for (var d = 0; d < detail.documents.length; d++) {
        var doc = detail.documents[d];
        html += '<div class="doc-row">';
        html += '<span class="doc-type">' + (doc.file_type || "FILE") + '</span>';
        html += '<span>' + doc.name + '</span>';
        if (doc.status) html += '<span style="color:#7A6E5E;font-size:0.8rem;margin-left:auto;">' + doc.status + '</span>';
        html += '</div>';
      }
    }
    html += '</div></div>';
  }
  document.getElementById("ctab-documents").innerHTML = html;
}

function addDocForEvent(eventId) {
  var nameEl = document.getElementById("new-doc-name-" + eventId);
  var typeEl = document.getElementById("new-doc-type-" + eventId);
  var statusEl = document.getElementById("new-doc-status-" + eventId);
  var name = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  fetch(API + "/owner/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, name: name, file_type: typeEl.value, status: statusEl.value }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      nameEl.value = "";
      var list = document.getElementById("doc-list-" + eventId);
      var emptyP = list.querySelector("p");
      if (emptyP) emptyP.remove();
      var row = document.createElement("div");
      row.className = "doc-row";
      row.innerHTML = '<span class="doc-type">' + typeEl.value + '</span><span>' + name + '</span><span style="color:#7A6E5E;font-size:0.8rem;margin-left:auto;">' + statusEl.value + '</span>';
      list.appendChild(row);
    });
}

// ── Quote Details Tab ──
function renderClientQuotes(c) {
  var html = '';
  var hasAny = false;
  for (var i = 0; i < c.events.length; i++) {
    var ev = c.events[i];
    var detail = clientDetailCache[ev.id];
    if (!detail || !detail.quote) continue;
    hasAny = true;
    var q = detail.quote;

    html += '<div class="panel" style="margin-bottom:16px;">';
    html += '<h3 style="margin-bottom:4px;">' + (ev.event_name || 'Event') + '</h3>';
    html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:16px;">' + (ev.event_type || '') + (ev.event_date ? ' &middot; ' + ev.event_date : '') + '</div>';

    // read-only submitted request
    html += '<h4 style="margin:0 0 12px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Client\'s Submitted Request</h4>';
    html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;margin-bottom:20px;">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Event Type</span><span class="info-val">' + (q.event_type || 'Not specified') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Service Requested</span><span class="info-val">' + (q.service_type || 'Not specified') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Event Date</span><span class="info-val">' + (q.event_date || ev.event_date || 'TBD') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Guest Count</span><span class="info-val">' + (q.guests || 'Not specified') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Budget Range</span><span class="info-val">' + (q.budget || 'Not specified') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Location</span><span class="info-val">' + (ev.location || q.location || 'Not specified') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">Venue Status</span><span class="info-val">' + (q.venue_status || 'Not specified') + '</span></div>';
    html += '<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">How They Found Us</span><span class="info-val">' + (q.source || 'Not specified') + '</span></div>';
    html += '</div>';
    if (q.vision) {
      html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(74,39,114,0.1);">';
      html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:4px;">Client\'s Vision</div>';
      html += '<div style="font-size:0.88rem;color:#2e1547;line-height:1.6;">' + q.vision + '</div>';
      html += '</div>';
    }
    if (q.vibes) {
      html += '<div style="margin-top:10px;"><span style="font-size:0.78rem;color:#7a6e5e;">Vibes: </span><span style="font-size:0.85rem;color:#2e1547;">' + q.vibes + '</span></div>';
    }
    if (q.budget_notes) {
      html += '<div style="margin-top:6px;"><span style="font-size:0.78rem;color:#7a6e5e;">Budget Notes: </span><span style="font-size:0.85rem;color:#2e1547;">' + q.budget_notes + '</span></div>';
    }
    if (q.final_notes) {
      html += '<div style="margin-top:6px;"><span style="font-size:0.78rem;color:#7a6e5e;">Additional Notes: </span><span style="font-size:0.85rem;color:#2e1547;">' + q.final_notes + '</span></div>';
    }
    html += '</div>';

    // Before We Meet — Internal Notes
    html += '<h4 style="margin:20px 0 12px 0;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Before We Meet — Internal Notes</h4>';
    html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;margin-bottom:20px;">';
    html += '<p style="font-size:0.78rem;color:#7a6e5e;margin-bottom:10px;">Private notes to prepare for the consultation. Only visible to you.</p>';
    var savedNotes = localStorage.getItem("quote-notes-" + ev.id) || '';
    html += '<textarea id="quote-notes-' + ev.id + '" rows="4" placeholder="Research notes, pricing ideas, venue options, questions to ask..." style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:vertical;outline:none;border-radius:2px;margin-bottom:10px;">' + savedNotes + '</textarea>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span id="notes-saved-' + ev.id + '" style="font-size:0.78rem;color:#3a7d44;display:none;">Saved</span>';
    html += '<button onclick="saveQuoteNotes(' + ev.id + ')" style="padding:8px 20px;background:#555;color:#fff;border:none;font-family:inherit;font-size:0.82rem;cursor:pointer;border-radius:2px;">Save Notes</button>';
    html += '</div></div>';

    // respond prompt
    html += '<div style="background:#f3eef9;border:1px solid rgba(74,39,114,0.2);border-radius:4px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">';
    html += '<div><div style="font-size:0.88rem;color:#2e1547;font-weight:500;">Ready to respond to this quote?</div>';
    html += '<div style="font-size:0.78rem;color:#7a6e5e;margin-top:2px;">Go to Messages to send pricing, ask questions, or schedule a call.</div></div>';
    html += '<button onclick="var btns=document.querySelectorAll(\'.client-subtab\');switchClientTab(btns[3],\'ctab-messages\')" style="padding:10px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;border-radius:2px;white-space:nowrap;">Go to Messages</button>';
    html += '</div>';

    // schedule consultation quick action
    html += '<h4 style="margin:20px 0 12px 0;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Schedule Consultation</h4>';
    html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;">';
    html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Date</label>';
    html += '<input type="date" id="consult-date-' + ev.id + '" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;outline:none;border-radius:2px;"></div>';
    html += '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Time</label>';
    html += '<select id="consult-time-' + ev.id + '" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;outline:none;border-radius:2px;">';
    html += '<option value="">Select a time</option>';
    var times = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
    for (var ti = 0; ti < times.length; ti++) { html += '<option value="' + times[ti] + '">' + formatTime12(times[ti]) + '</option>'; }
    html += '</select></div>';
    html += '<button onclick="scheduleConsultation(' + ev.id + ',\'' + (c.firstname || '').replace(/'/g, "\\'") + '\')" style="padding:10px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.88rem;cursor:pointer;white-space:nowrap;border-radius:2px;letter-spacing:0.03em;">Schedule</button>';
    html += '</div></div>';

    html += '</div>';
  }
  if (!hasAny) html = '<p style="color:#7A6E5E;">No quote requests found for this client.</p>';
  document.getElementById("ctab-quotes").innerHTML = html;
}

function saveQuoteNotes(eventId) {
  var textarea = document.getElementById("quote-notes-" + eventId);
  if (!textarea) return;
  localStorage.setItem("quote-notes-" + eventId, textarea.value);
  var saved = document.getElementById("notes-saved-" + eventId);
  if (saved) {
    saved.style.display = "inline";
    setTimeout(function() { saved.style.display = "none"; }, 2000);
  }
}

function sendQuoteResponse(eventId) {
  var input = document.getElementById("quote-response-" + eventId);
  var text = input ? input.value.trim() : '';
  if (!text) { if (input) input.focus(); return; }
  var btn = input.parentElement.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  // send the message
  fetch(API + "/owner/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, sender: "Vision Realized", text: text }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) { btn.textContent = 'Error'; btn.disabled = false; return; }

      // auto-advance status to Consultation if still at Quote Submitted
      var ev = null;
      for (var i = 0; i < allEvents.length; i++) { if (allEvents[i].id === eventId) { ev = allEvents[i]; break; } }
      var needsStatusUpdate = ev && ev.status === 'Quote Submitted';

      var afterSend = function() {
        // reload data then re-open the client with Quote Details tab active
        fetch(API + "/owner/events", { headers: { Authorization: "Bearer " + token } })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (!d.success) return;
            allEvents = d.events;
            clientsMap = groupEventsByClient(allEvents);
            var clientCount = Object.keys(clientsMap).length;
            var needsQuote = 0;
            for (var i = 0; i < allEvents.length; i++) { if (allEvents[i].status === 'Quote Submitted') needsQuote++; }
            document.getElementById("stat-events").textContent = allEvents.length;
            document.getElementById("stat-quotes").textContent = needsQuote;
            document.getElementById("stat-clients").textContent = clientCount;
            document.getElementById("clients-badge").textContent = clientCount;
            if (activeClientId) openClient(activeClientId);
            // switch to Quote Details tab after re-render
            setTimeout(function() {
              var btns = document.querySelectorAll(".client-subtab");
              if (btns[5]) { switchClientTab(btns[5], 'ctab-quotes'); }
            }, 300);
          });
      };

      if (needsStatusUpdate) {
        fetch(API + "/owner/events/" + eventId, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ status: "Consultation" }),
        }).then(afterSend);
      } else {
        afterSend();
      }

      btn.textContent = 'Sent!';
      btn.style.background = '#3a7d44';
      input.value = '';
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = 'Send Quote to Client';
        btn.style.background = '';
      }, 2000);
    })
    .catch(function () { btn.textContent = 'Error'; btn.disabled = false; });
}

// ── Event Actions ──
function saveEventChanges() {
  if (!currentEditEventId) return;
  var payload = {
    status: document.getElementById("edit-status").value,
    event_date: document.getElementById("edit-date").value || null,
    location: document.getElementById("edit-location").value,
    planner: document.getElementById("edit-planner").value,
    event_name: document.getElementById("edit-name").value,
    guests: document.getElementById("edit-guests").value,
    event_type: document.getElementById("edit-event-type").value,
  };
  var btn = document.getElementById("save-event-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  fetch(API + "/owner/events/" + currentEditEventId, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify(payload),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.success) {
        btn.textContent = "Saved!";
        btn.style.background = "#3a7d44";
        loadAll();
        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = "Save Changes";
          btn.style.background = "";
        }, 2000);
      } else {
        btn.textContent = "Error";
        btn.disabled = false;
      }
    })
    .catch(function () {
      btn.textContent = "Error — try again";
      btn.disabled = false;
    });
}

