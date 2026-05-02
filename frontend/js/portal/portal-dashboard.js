/* ── Portal Dashboard — data loading and rendering ───────────────── */

function loadDashboard() {
  fetch(API + "/client/dashboard", {
    headers: { Authorization: "Bearer " + token },
  })
    .then(function (res) {
      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        throw new Error("bad token");
      }
      return res.json();
    })
    .then(function (data) {
      try {
        renderDashboard(data);
      } catch (renderErr) {
        console.error("render error:", renderErr);
      }
    })
    .catch(function (err) {
      console.log("dashboard error:", err);
    });
}

function populateEventDropdown(events) {
  var switcher = document.getElementById("event-switcher");
  var select = document.getElementById("event-select");
  if (events.length <= 1) {
    switcher.style.display = "none";
    return;
  }
  switcher.style.display = "block";
  select.innerHTML = "";
  for (var i = 0; i < events.length; i++) {
    var ev = events[i].event;
    var label =
      (ev.name || ev.event_type || "Event") +
      (ev.date ? "  ·  " + fmtDate(ev.date) : "");
    var opt = document.createElement("option");
    opt.value = i;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

function switchEvent(idx) {
  idx = parseInt(idx);
  var bundle = allEventsData[idx];
  if (!bundle) return;
  localStorage.setItem('portal_selected_event', idx);
  renderEventBundle(bundle);
}

function renderEventBundle(bundle) {
  var ev = bundle.event;
  var tasks = bundle.tasks || [];
  var msgs = bundle.messages || [];
  var journey = bundle.journey || [];

  currentEventId = ev.id;

  // Sidebar event info
  var shortDate = ev.date ? fmtDate(ev.date) : "";
  document.getElementById("portal-user-event").textContent =
    (ev.event_type || "Event") + (shortDate ? " · " + shortDate : "");

  // Event status card
  document.getElementById("event-badge").textContent =
    statusLabel(ev.status) || "Pending";
  document.getElementById("event-name").textContent =
    ev.name || "Your Event";
  var metaHtml = "";
  metaHtml += '<div class="event-meta-item"><strong>' + fmtDate(ev.date) + "</strong></div>";
  metaHtml += '<div class="event-meta-item"><strong>' + (ev.location || "TBD") + "</strong></div>";
  metaHtml += '<div class="event-meta-item"><strong>~' + (ev.guests || "?") + " Guests</strong></div>";
  metaHtml += '<div class="event-meta-item"><strong>' + (ev.planner || "TBD") + "</strong></div>";
  document.getElementById("event-meta").innerHTML = metaHtml;
  var days = daysUntil(ev.date);
  document.getElementById("countdown-num").textContent =
    days !== null ? (days >= 0 ? days : "Past") : "--";

  // Journey steps
  var jEl = document.getElementById("journey-steps");
  var stepTabs = ['tab-overview','tab-overview','tab-overview','tab-checklist','tab-messages','tab-progress','tab-after'];
  var stepNavIdx = [0,0,0,2,3,1,5];
  if (journey.length > 0) {
    var html = "";
    for (var i = 0; i < journey.length; i++) {
      var s = journey[i];
      var dot = s.status === "done" ? "✓" : s.status === "current" ? "·" : s.step;
      html +=
        '<div class="j-step ' + s.status +
        '" data-step="' + i + '" style="cursor:pointer;" title="Go to ' + statusLabel(s.name) + '"><div class="j-dot">' +
        dot + '</div><div class="j-name">' + statusLabel(s.name) + "</div></div>";
    }
    jEl.innerHTML = html;
    var jSteps = jEl.querySelectorAll('.j-step');
    for (var i = 0; i < jSteps.length; i++) {
      (function(idx) {
        jSteps[idx].addEventListener('click', function() {
          switchTab(document.querySelectorAll('.portal-nav-item')[stepNavIdx[idx]], stepTabs[idx]);
        });
      })(i);
    }
  } else {
    jEl.innerHTML = '<p style="color:#7A6E5E;font-size:0.85rem;">No journey data yet.</p>';
  }

  // What's Next
  var nsCard = document.getElementById("next-steps-card");
  var nsText = document.getElementById("next-steps-text");
  var nsAction = document.getElementById("next-steps-action");
  var curStatus = ev.status || '';
  nsCard.style.display = 'block';
  nsCard.style.background = '#fffdf9';
  nsText.style.color = '#2e1547';
  nsAction.innerHTML = '';

  function nsBtn(label, navIdx, tabId) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'padding:10px 20px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.82rem;cursor:pointer;border-radius:2px;';
    b.addEventListener('click', function() { switchTab(document.querySelectorAll('.portal-nav-item')[navIdx], tabId); });
    nsAction.appendChild(b);
  }

  if (curStatus === 'Quote Submitted') {
    nsText.innerHTML = t('whatsNextQuote');
  } else if (curStatus === 'Pending Consultation') {
    nsText.innerHTML = 'We\'d like to schedule a consultation with you! Please pick a time that works from the options above.';
  } else if (curStatus === 'Consultation') {
    nsText.innerHTML = t('whatsNextConsult');
    nsBtn('View My Tasks', 2, 'tab-checklist');
  } else if (curStatus === 'Planning') {
    nsText.innerHTML = 'Your event is being planned! Your planner is coordinating vendors, venue, and logistics. Check your <strong>Tasks</strong> for anything that needs your input.';
    nsBtn('View My Tasks', 2, 'tab-checklist');
  } else if (curStatus === 'Vendors Set') {
    nsText.innerHTML = 'All vendors are booked and confirmed! Reach out to your planner with any questions.';
    nsBtn('Message Planner', 4, 'tab-messages');
  } else if (curStatus === 'Event Day') {
    nsText.innerHTML = 'Today is the day! Our team is handling everything on-site. Relax and enjoy your event.';
    nsCard.style.background = '#4a2772';
    nsText.style.color = 'white';
  } else if (curStatus === 'Completed') {
    nsText.innerHTML = 'Your event is complete! We\'d love to hear your feedback.';
    nsBtn('Leave a Review', 6, 'tab-after');
  } else {
    nsCard.style.display = 'none';
  }

  // Dashboard tasks
  var dashTasks = document.getElementById("dash-tasks");
  if (tasks.length > 0) {
    var html = "";
    for (var i = 0; i < tasks.length; i++) {
      var tk = tasks[i];
      var cls = tk.completed ? " done" : "";
      var chk = tk.completed ? "✓" : "";
      var due = tk.due_date && !tk.completed ? ' <span style="color:#4A2772;font-size:0.72rem;">Due ' + fmtDate(tk.due_date) + "</span>" : "";
      var click = ' onclick="completeTask(' + tk.id + ')" style="cursor:pointer;" title="' + (tk.completed ? 'Click to unmark' : 'Click to mark complete') + '"';
      html += '<div class="check-item' + cls + '"><div class="check-box"' + click + ">" + chk + '</div><span class="check-text">' + tk.title + due + "</span></div>";
    }
    dashTasks.innerHTML = html;
  } else {
    dashTasks.innerHTML = '<p style="color:#7A6E5E;font-size:0.85rem;">No tasks assigned yet.</p>';
  }

  // Consultation request card
  var consultCard = document.getElementById("consult-request-card");
  var pendingConsult = null;
  for (var i = 0; i < msgs.length; i++) {
    if (msgs[i].text && msgs[i].text.indexOf('[CONSULTATION_REQUEST]') === 0) {
      var accepted = localStorage.getItem('consult_accepted_' + currentEventId + '_' + msgs[i].id);
      if (!accepted) { pendingConsult = msgs[i]; break; }
    }
  }
  if (pendingConsult) {
    try {
      var cData = JSON.parse(pendingConsult.text.replace('[CONSULTATION_REQUEST]', ''));
      consultCard.style.display = 'block';
      var timesArr = cData.times || (cData.time ? [cData.time] : []);
      var formattedDate = fmtDate(cData.date);
      var timeButtons = timesArr.map(function(tm) {
        return '<button onclick="acceptConsultation(' + currentEventId + ',' + pendingConsult.id + ',\'' + tm.replace(/'/g,"\\'") + '\')" style="padding:14px 28px;background:white;border:1.5px solid rgba(74,39,114,0.2);color:#2e1547;font-family:inherit;font-size:0.9rem;font-weight:500;cursor:pointer;border-radius:4px;min-width:130px;transition:all 0.15s;" onmouseover="this.style.background=\'#4a2772\';this.style.color=\'white\';this.style.borderColor=\'#4a2772\';" onmouseout="this.style.background=\'white\';this.style.color=\'#2e1547\';this.style.borderColor=\'rgba(74,39,114,0.2)\';">' + tm + '</button>';
      }).join('');
      consultCard.innerHTML =
        '<div style="font-family:\'Cormorant Garamond\',serif;font-size:1.4rem;color:#2e1547;font-style:italic;margin-bottom:16px;">Consultation Request</div>' +
        '<div style="margin-bottom:16px;font-size:0.92rem;color:#2e1547;"><span style="color:#7a6e5e;">Proposed date:</span> <strong>' + formattedDate + '</strong></div>' +
        (cData.note ? '<div style="background:rgba(74,39,114,0.04);border-left:3px solid #4a2772;padding:12px 16px;margin-bottom:20px;font-size:0.88rem;color:#2e1547;line-height:1.6;font-style:italic;">' + cData.note + '</div>' : '') +
        '<div style="font-size:0.82rem;color:#7a6e5e;margin-bottom:12px;">Select a time that works best:</div>' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px;">' + timeButtons + '</div>' +
        '<div style="border-top:1px solid rgba(74,39,114,0.1);padding-top:14px;">' +
          '<button onclick="showCounterPropose(' + currentEventId + ')" style="padding:8px 20px;background:none;border:none;color:#7a6e5e;font-family:inherit;font-size:0.82rem;cursor:pointer;text-decoration:underline;">None of these work for me</button>' +
        '</div>';
    } catch(e) { consultCard.style.display = 'none'; }
  } else { consultCard.style.display = 'none'; }

  // Recent messages (planner only)
  var regularMsgs = msgs.filter(function(m) { return m.sender === 'Vision Realized' && (!m.text || m.text.indexOf('[CONSULTATION_REQUEST]') !== 0); });
  var dashMsgs = document.getElementById("dash-messages");
  if (regularMsgs.length > 0) {
    var html = "";
    var cnt = Math.min(regularMsgs.length, 3);
    for (var i = 0; i < cnt; i++) {
      var m = regularMsgs[i];
      var isUnread = !m.read && m.sender === 'Vision Realized';
      var unread = isUnread ? " msg-unread" : "";
      var ini = m.sender ? m.sender.split(" ").map(function(n){return n[0];}).join("").toUpperCase().slice(0,2) : "??";
      var prev = m.text.length > 60 ? m.text.substring(0, 60) + "..." : m.text;
      html += '<div class="msg-item' + unread + '" style="cursor:pointer;"><div class="msg-avatar">' + ini + '</div><div><div class="msg-name">' + m.sender + '</div><div class="msg-preview">' + prev + '</div></div><div class="msg-time">' + fmtMsgDate(m.date) + "</div></div>";
    }
    dashMsgs.innerHTML = html;
    var msgItems = dashMsgs.querySelectorAll('.msg-item');
    for (var i = 0; i < msgItems.length; i++) {
      msgItems[i].addEventListener('click', function() {
        switchTab(document.querySelectorAll('.portal-nav-item')[3], 'tab-messages');
      });
    }
  } else {
    dashMsgs.innerHTML = '<p style="color:#7A6E5E;font-size:0.85rem;">No messages yet.</p>';
  }

  // Unread badge
  var unreadCount = 0;
  for (var i = 0; i < msgs.length; i++) {
    if (!msgs[i].read && msgs[i].sender === 'Vision Realized' && (!msgs[i].text || msgs[i].text.indexOf('[CONSULTATION_REQUEST]') !== 0)) unreadCount++;
  }
  var badge = document.getElementById("msg-badge");
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = "inline";
  } else {
    badge.style.display = "none";
  }

  // Event Progress tab
  var progEl = document.getElementById("progress-steps");
  if (progEl) {
    if (journey.length > 0) {
      var html = "";
      for (var i = 0; i < journey.length; i++) {
        var s = journey[i];
        if (s.status === "done") {
          html += '<div style="display:flex;align-items:center;gap:20px;padding:24px 28px;background:rgba(74,39,114,0.06);border:1px solid rgba(74,39,114,0.2);border-radius:4px;">';
          html += '<span style="color:#4A2772;font-weight:500;">✓</span>';
          html += '<div><div style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#4A2772;opacity:0.7;">Completed</div>';
          html += '<div style="font-size:1.05rem;font-weight:500;color:#2E1547;">' + s.name + "</div></div></div>";
        } else if (s.status === "current") {
          html += '<div style="display:flex;align-items:center;gap:20px;padding:24px 28px;background:#4A2772;border-radius:4px;">';
          html += '<span style="color:white;">→</span>';
          html += '<div><div style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);">In Progress</div>';
          html += '<div style="font-size:1.05rem;font-weight:500;color:white;">' + s.name + "</div></div></div>";
        } else {
          html += '<div style="display:flex;align-items:center;gap:20px;padding:24px 28px;background:white;border:1px solid rgba(74,39,114,0.15);border-radius:4px;opacity:0.55;">';
          html += '<div><div style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#7A6E5E;">Upcoming</div>';
          html += '<div style="font-size:1.05rem;font-weight:500;color:#1A1208;">' + s.name + "</div></div></div>";
        }
      }
      progEl.innerHTML = html;
    } else {
      progEl.innerHTML = '<p style="color:#7A6E5E;font-size:0.9rem;padding:24px;">No progress data yet.</p>';
    }
  }

  // Tasks tab
  var tasksFull = document.getElementById("tasks-full");
  if (tasksFull) {
    if (tasks.length > 0) {
      var done = tasks.filter(function(tk){return tk.completed;}).length;
      var html = '<div style="display:flex;gap:10px;margin-bottom:24px;">';
      html += '<div style="background:rgba(74,39,114,0.08);color:#4A2772;padding:8px 16px;border-radius:20px;font-size:0.75rem;border:1px solid rgba(74,39,114,0.15);">' + done + " Completed</div>";
      html += '<div style="background:rgba(74,39,114,0.08);color:#4A2772;padding:8px 16px;border-radius:20px;font-size:0.75rem;border:1px solid rgba(74,39,114,0.15);">' + (tasks.length - done) + " Remaining</div></div>";
      for (var i = 0; i < tasks.length; i++) {
        var tk = tasks[i];
        var cls = tk.completed ? " done" : "";
        var chk = tk.completed ? "✓" : "";
        var click = ' onclick="completeTask(' + tk.id + ')" style="cursor:pointer;" title="' + (tk.completed ? 'Click to unmark' : 'Click to mark complete') + '"';
        var dateInfo = tk.due_date && !tk.completed ? ' <span style="color:#4A2772;font-size:0.72rem;">Due ' + fmtDate(tk.due_date) + "</span>" : "";
        html += '<div class="check-item' + cls + '"><div class="check-box"' + click + ">" + chk + '</div><span class="check-text">' + tk.title + dateInfo + "</span></div>";
      }
      tasksFull.innerHTML = html;
    } else {
      tasksFull.innerHTML = '<p style="color:#7A6E5E;font-size:0.9rem;">No tasks assigned yet. Your planner will add tasks as your event progresses.</p>';
    }
  }

  // Messages tab (chat bubbles)
  var msgsFull = document.getElementById("messages-full");
  var sortedMsgs = msgs.slice().reverse();
  if (sortedMsgs.length > 0) {
    var html = "";
    for (var i = 0; i < sortedMsgs.length; i++) {
      var m = sortedMsgs[i];
      if (m.text && m.text.indexOf('[CONSULTATION_REQUEST]') === 0) continue;
      var isPlanner = m.sender === 'Vision Realized';
      var bubbleStyle = isPlanner
        ? 'margin-right:auto;background:#fff;color:#1A1208;border:1px solid rgba(74,39,114,0.15);border-radius:12px 12px 12px 2px;'
        : 'margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;';
      var senderColor = isPlanner ? '#7a6e5e' : 'rgba(255,255,255,0.7)';
      html += '<div style="max-width:75%;padding:12px 16px;' + bubbleStyle + '">' +
        '<div style="font-size:0.68rem;color:' + senderColor + ';margin-bottom:4px;">' + fmtMsgDate(m.date) + '</div>' +
        '<div style="font-size:0.88rem;line-height:1.6;">' + m.text + '</div></div>';
    }
    msgsFull.innerHTML = html;
    msgsFull.scrollTop = msgsFull.scrollHeight;
  } else {
    msgsFull.innerHTML = '<p style="color:#7A6E5E;font-size:0.9rem;padding:24px;">No messages yet. Your planner will reach out here once your event is being planned.</p>';
  }

  var replyBox = document.getElementById("reply-box");
  if (replyBox && currentEventId) replyBox.style.display = "flex";

  // Always reload existing rating so tab-after reflects saved stars/comment on every render
  loadExistingRating();
}

function renderDashboard(data) {
  var u = data.user;
  var events = data.events || [];
  var ev = data.event;

  if (ev) currentEventId = ev.id;

  allEventsData = events;
  populateEventDropdown(events);
  if (events.length > 0) {
    var savedIdx = parseInt(localStorage.getItem('portal_selected_event') || '0');
    if (savedIdx >= events.length) savedIdx = 0;
    var select = document.getElementById('event-select');
    if (select) select.value = savedIdx;
    renderEventBundle(events[savedIdx]);
  }

  var fullName = u.firstname + " " + u.lastname;
  var initials = fullName.split(" ").map(function(n){return n[0];}).join("").toUpperCase().slice(0,2);
  document.getElementById("portal-avatar").textContent = initials;
  document.getElementById("portal-user-name").textContent = fullName;

  if (!ev) {
    document.getElementById("portal-user-event").textContent = "No event yet";
    document.getElementById("event-badge").textContent = "No Event";
    document.getElementById("event-name").textContent = "No event found";
    document.getElementById("event-meta").innerHTML = '<div class="event-meta-item">Submit a quote to get started</div>';
    document.getElementById("countdown-num").textContent = "--";
  }

  document.getElementById("portal-greeting-name").textContent = getGreeting() + ", " + u.firstname;
}