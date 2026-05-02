/* ── Portal Actions — tasks, messages, reviews, invoices ─────────── */

function completeTask(tid) {
  fetch(API + "/client/tasks/" + tid + "/complete", {
    method: "PUT",
    headers: { Authorization: "Bearer " + token },
  })
    .then(function (r) { return r.json(); })
    .then(function () { loadDashboard(); });
}

function acceptConsultation(eventId, msgId, selectedTime) {
  fetch(API + "/client/consultation/" + eventId + "/accept", {
    method: "PUT",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ time: selectedTime }),
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.success) {
        localStorage.setItem('consult_accepted_' + eventId + '_' + msgId, 'true');
        loadDashboard();
      }
    });
}

function showCounterPropose(eventId) {
  var card = document.getElementById('consult-request-card');
  card.innerHTML =
    '<div style="font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;font-weight:600;margin-bottom:12px;">Suggest Your Preferred Times</div>' +
    '<p style="font-size:0.85rem;color:#7a6e5e;margin-bottom:12px;">Let us know what times work better for you:</p>' +
    '<textarea id="counter-times" rows="3" placeholder="e.g. Monday after 2pm, Tuesday morning, or Friday anytime..." style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:vertical;outline:none;border-radius:2px;margin-bottom:12px;"></textarea>' +
    '<div style="display:flex;gap:10px;">' +
      '<button onclick="sendCounterProposal(' + eventId + ')" style="padding:10px 24px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;border-radius:2px;">Send</button>' +
      '<button onclick="loadDashboard()" style="padding:10px 24px;background:none;border:1px solid #7a6e5e;color:#7a6e5e;font-family:inherit;font-size:0.85rem;cursor:pointer;border-radius:2px;">Cancel</button>' +
    '</div>';
}

function sendCounterProposal(eventId) {
  var text = document.getElementById('counter-times').value.trim();
  if (!text) { document.getElementById('counter-times').focus(); return; }
  fetch(API + "/client/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId, text: "These times don't work for me. Here's what works better: " + text }),
  })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d.success) loadDashboard(); });
}

function sendReply() {
  var txt = document.getElementById("reply-input").value;
  if (!txt || !currentEventId) return;
  fetch(API + "/client/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: currentEventId, text: txt }),
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.success) {
        document.getElementById("reply-input").value = "";
        loadDashboard();
      }
    });
}

var userRating = 5;
function setRating(n) {
  userRating = n;
  var stars = document.querySelectorAll("#star-row span");
  for (var i = 0; i < stars.length; i++) {
    stars[i].style.opacity = i < n ? "1" : "0.3";
  }
}

function loadExistingRating() {
  if (!currentEventId) return;
  fetch(API + "/client/ratings/" + currentEventId, {
    headers: { Authorization: "Bearer " + token }
  })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success && d.rating) {
        setRating(d.rating.stars);
        document.getElementById("review-text").value = d.rating.comment || "";
        var msg = document.getElementById("review-msg");
        msg.style.display = "block";
        msg.style.color = "#7a6e5e";
        msg.textContent = "You already submitted a review. You can update it below.";
      }
    })
    .catch(function() {});
}

function submitReview() {
  var text = document.getElementById("review-text").value.trim();
  if (!text) { document.getElementById("review-text").focus(); return; }
  fetch(API + "/client/ratings", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: currentEventId, stars: userRating, comment: text }),
  })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var msg = document.getElementById("review-msg");
      msg.style.display = "block";
      if (d.success) {
        msg.style.color = "#3a7d44";
        msg.textContent = "Thank you for your review!";
      } else {
        msg.style.color = "#c0392b";
        msg.textContent = d.message || "Something went wrong.";
      }
    });
}

function loadInvoices(eventId) {
  var el = document.getElementById('invoices-list');
  el.innerHTML = '<p style="color:#7A6E5E;font-size:0.9rem;padding:24px;">Loading...</p>';
  fetch(API + '/client/invoices/' + eventId, {
    headers: { Authorization: 'Bearer ' + token }
  })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.success || !d.invoices.length) {
        el.innerHTML = '<p style="color:#7A6E5E;font-size:0.9rem;padding:24px;">No invoices have been issued for this event yet.</p>';
        return;
      }
      var html = '';
      for (var i = 0; i < d.invoices.length; i++) {
        var inv = d.invoices[i];
        var statusColor = inv.status === 'Paid' ? '#3a7d44' : inv.status === 'Overdue' ? '#c0392b' : '#4A2772';
        var amountStr = inv.amount != null ? '$' + inv.amount.toFixed(2) : 'TBD';
        var dueStr = inv.due_date ? fmtDate(inv.due_date) : 'TBD';
        html += '<div style="background:#FFFDF9;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;margin-bottom:12px;display:flex;align-items:center;gap:20px;">';
        html += '<div style="flex:1;">';
        html += '<div style="font-size:1.1rem;font-weight:600;color:#2E1547;">' + amountStr + '</div>';
        html += '<div style="font-size:0.8rem;color:#7A6E5E;margin-top:4px;">Due: ' + dueStr + '</div>';
        html += '</div>';
        html += '<div style="font-size:0.78rem;font-weight:600;color:' + statusColor + ';background:rgba(74,39,114,0.06);padding:6px 14px;border-radius:20px;border:1px solid ' + statusColor + '33;">' + (inv.status || 'Pending') + '</div>';
        html += '</div>';
      }
      el.innerHTML = html;
    })
    .catch(function() {
      el.innerHTML = '<p style="color:#c0392b;font-size:0.9rem;padding:24px;">Could not load invoices.</p>';
    });
}
