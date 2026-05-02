function openEvent(eventId) {
  currentEditEventId = eventId;
  var ev = null;
  for (var i = 0; i < allEvents.length; i++) {
    if (allEvents[i].id === eventId) {
      ev = allEvents[i];
      break;
    }
  }

  fetch(API + "/owner/event-detail/" + eventId, {
    headers: { Authorization: "Bearer " + token },
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.success) return;

      var eventBox = document.getElementById("event-detail");
      var html = "";

      html += '<div class="panel">';
      html += "<h3>Event Details</h3>";

      var statuses = [
        "Quote Submitted",
        "Consultation",
        "Planning",
        "Vendors Set",
        "Event Day",
        "Completed",
      ];
      var curStatus = ev && ev.status ? ev.status : "Quote Submitted";

      html +=
        '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;margin-bottom:24px;">';
      html +=
        '<h4 style="margin:0 0 14px;font-size:0.9rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Edit Event</h4>';
      html +=
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;">';

      html +=
        '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Event Name</label>';
      html +=
        '<input id="edit-name" value="' +
        (ev && ev.event_name
          ? ev.event_name.replace(/"/g, "&quot;")
          : "") +
        '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

      html +=
        '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Status</label>';
      html +=
        '<select id="edit-status" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;">';
      for (var s = 0; s < statuses.length; s++) {
        var sel = statuses[s] === curStatus ? " selected" : "";
        html +=
          '<option value="' +
          statuses[s] +
          '"' +
          sel +
          ">" +
          statuses[s] +
          "</option>";
      }
      html += "</select></div>";

      html +=
        '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Event Date</label>';
      html +=
        '<input id="edit-date" type="date" value="' +
        (ev && ev.event_date ? ev.event_date : "") +
        '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

      html +=
        '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Location</label>';
      html +=
        '<input id="edit-location" value="' +
        (ev && ev.location ? ev.location.replace(/"/g, "&quot;") : "") +
        '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

      html +=
        '<div style="grid-column:1/-1"><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Planner</label>';
      html +=
        '<input id="edit-planner" value="' +
        (ev && ev.planner ? ev.planner.replace(/"/g, "&quot;") : "") +
        '" placeholder="Assign a planner name" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

      html += "</div>";
      html += '<div style="margin-top:14px;text-align:right;">';
      html +=
        '<button id="save-event-btn" onclick="saveEventChanges()" style="padding:9px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;">Save Changes</button>';
      html += "</div>";
      html += "</div>";

      html += "<h4>Quote Details</h4>";
      if (!data.quote) {
        html +=
          '<p style="color:#7A6E5E;">No quote details found for this event.</p>';
      } else {
        html +=
          '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;margin-bottom:24px;">';
        html +=
          '<h4 style="margin:0 0 14px;font-size:0.9rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Edit Quote Details</h4>';
        html +=
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;">';

        html +=
          '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Budget</label>';
        html +=
          '<input id="edit-quote-budget" value="' +
          (data.quote.budget || "") +
          '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

        html +=
          '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Source</label>';
        html +=
          '<input id="edit-quote-source" value="' +
          (data.quote.source || "") +
          '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

        html +=
          '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Guests</label>';
        html +=
          '<input id="edit-quote-guests" value="' +
          (data.quote.guests || "") +
          '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

        html +=
          '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Event Type</label>';
        html +=
          '<input id="edit-quote-event-type" value="' +
          (data.quote.event_type || "") +
          '" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';

        html += "</div>";
        html += '<div style="margin-top:14px;text-align:right;">';
        html +=
          '<button onclick="saveQuoteDetails(' +
          eventId +
          ')" style="padding:9px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;">Save Quote Details</button>';
        html += "</div>";
        html += "</div>";
      }

      html += "<h4>Tasks</h4>";

      html +=
        '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:14px 16px;margin-bottom:14px;">';
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
      html +=
        '<input id="new-task-title" placeholder="Task title…" style="flex:2;min-width:140px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
      html +=
        '<input id="new-task-date" type="date" style="flex:1;min-width:120px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">';
      html +=
        '<button onclick="ownerAddTask()" style="padding:8px 18px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;">+ Assign</button>';
      html += "</div></div>";

      html += '<div id="owner-task-list">';
      if (data.tasks.length === 0) {
        html += '<p style="color:#7A6E5E;">No tasks yet.</p>';
      } else {
        for (var i = 0; i < data.tasks.length; i++) {
          var t = data.tasks[i];
          html +=
            '<div class="task-item' +
            (t.completed ? " done" : "") +
            '" id="task-row-' +
            t.id +
            '" style="display:flex;align-items:center;justify-content:space-between;">';
          html +=
            '<div style="display:flex;align-items:center;gap:8px;">';
          html +=
            '<div class="task-toggle" onclick="ownerToggleTask(' +
            t.id +
            ')" style="cursor:pointer;">' +
            (t.completed ? "✓" : "") +
            "</div>";
          html += "<span>" + t.title + "</span>";
          if (t.due_date) {
            html +=
              '<span style="color:#7A6E5E;font-size:0.8rem;">— ' +
              t.due_date +
              "</span>";
          }
          html += "</div>";
          html +=
            '<button onclick="ownerDeleteTask(' +
            t.id +
            ')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;" title="Delete task">✕</button>';
          html += "</div>";
        }
      }

      html += "</div>";

      html += '<h4 style="margin-top:28px;">Message Client</h4>';
      html +=
        '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:16px 20px;margin-bottom:24px;">';

      html +=
        '<div id="owner-chat-history" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:280px;overflow-y:auto;">';
      if (!data.messages || data.messages.length === 0) {
        html +=
          '<p style="color:#7A6E5E;font-size:0.85rem;">No messages yet. Start the conversation below.</p>';
      } else {
        for (var m = 0; m < data.messages.length; m++) {
          var msg = data.messages[m];
          var isOwner = msg.sender === "Vision Realized";
          var bubbleStyle = isOwner
            ? "margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;"
            : "margin-right:auto;background:#fff;color:#1A1208;border:1px solid rgba(74,39,114,0.15);border-radius:12px 12px 12px 2px;";
          html +=
            '<div style="max-width:75%;padding:10px 14px;' +
            bubbleStyle +
            '">';
          html +=
            '<div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">' +
            (msg.sender || "") +
            "</div>";
          html +=
            '<div style="font-size:0.88rem;line-height:1.5;">' +
            (msg.text || "") +
            "</div>";
          html += "</div>";
        }
      }
      html += "</div>";

      html += '<div style="display:flex;gap:8px;align-items:flex-end;">';
      html +=
        '<textarea id="owner-event-msg-input" placeholder="Type a message to the client…" rows="2" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendOwnerEventMsg(' + eventId + ');}" style="flex:1;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:none;outline:none;border-radius:2px;"></textarea>';
      html +=
        '<button onclick="sendOwnerEventMsg(' +
        eventId +
        ')" style="padding:10px 20px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;white-space:nowrap;border-radius:2px;">Send</button>';
      html += "</div>";
      html += "</div>";
      // ────────────────────────────────────────────────────────
      html += '</div>';

      // ── Invoices ─────────────────────────────────────────────
      html += '<h4 style="margin-top:28px;">Invoices</h4>';
      html += '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:16px 20px;margin-bottom:24px;">';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:16px;align-items:end;">';
      html += '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Status</label>';
      html += '<select id="new-invoice-status" style="width:100%;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"><option value="Pending">Pending</option><option value="Sent">Sent</option><option value="Paid">Paid</option><option value="Overdue">Overdue</option><option value="Cancelled">Cancelled</option></select></div>';
      html += '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Amount ($)</label>';
      html += '<input id="new-invoice-amount" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"></div>';
      html += '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Due Date</label>';
      html += '<input id="new-invoice-due" type="date" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"></div>';
      html += '<button onclick="ownerAddInvoice(' + eventId + ',' + (ev ? ev.client_id : 0) + ')" style="padding:8px 18px;background:#555;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;align-self:end;">+ Assign</button>';
      html += '</div>';
      html += '<div id="owner-invoice-list"><p style="color:#7A6E5E;font-size:0.85rem;">Loading invoices...</p></div>';
      html += '</div>';
      // ─────────────────────────────────────────────────────────

      html += "</div>";

      eventBox.innerHTML = html;
      loadInvoices(eventId);
    });
}

function ownerAddTask() {
  var title = document.getElementById("new-task-title").value.trim();
  var due = document.getElementById("new-task-date").value || null;
  if (!title) {
    document.getElementById("new-task-title").focus();
    return;
  }

  fetch(API + "/owner/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      event_id: currentEditEventId,
      title: title,
      due_date: due,
    }),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.success) return;
      document.getElementById("new-task-title").value = "";
      document.getElementById("new-task-date").value = "";

      var list = document.getElementById("owner-task-list");
      var emptyMsg = list.querySelector("p");
      if (emptyMsg) emptyMsg.remove();

      var row = document.createElement("div");
      row.className = "task-item";
      row.id = "task-row-" + (data.task_id || Date.now());
      row.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;";
      var tid = data.task_id || 0;
      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div class="task-toggle" onclick="ownerToggleTask(' +
        tid +
        ')" style="cursor:pointer;"></div>' +
        "<span>" +
        title +
        "</span>" +
        (due
          ? '<span style="color:#7A6E5E;font-size:0.8rem;">— ' +
            due +
            "</span>"
          : "") +
        "</div>" +
        '<button onclick="ownerDeleteTask(' +
        tid +
        ')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;" title="Delete task">✕</button>';
      list.appendChild(row);
    });
}

function ownerToggleTask(taskId) {
  fetch(API + "/owner/tasks/" + taskId, { method: "PUT", headers: { Authorization: "Bearer " + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      var row = document.getElementById("task-row-" + taskId);
      if (!row) return;
      var toggle = row.querySelector(".task-toggle");
      if (row.classList.contains("done")) {
        row.classList.remove("done");
        toggle.textContent = "";
      } else {
        row.classList.add("done");
        toggle.textContent = "✓";
      }
    });
}

function ownerDeleteTask(taskId) {
  fetch(API + "/owner/tasks/" + taskId, { method: "DELETE", headers: { Authorization: "Bearer " + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      var row = document.getElementById("task-row-" + taskId);
      if (row) row.remove();
      var list = document.getElementById("owner-task-list");
      if (list && list.children.length === 0)
        list.innerHTML = '<p style="color:#7A6E5E;">No tasks yet.</p>';
    });
}


function renderQuotes(quotes) {
  var box = document.getElementById("quotes-list");
  if (quotes.length === 0) {
    box.innerHTML =
      '<p style="color:#7A6E5E;">No matching quote requests.</p>';
    return;
  }
  var html = "";
  for (var i = 0; i < quotes.length; i++) {
    var q = quotes[i];
    html += '<div class="panel" style="margin-bottom:12px;">';
    html += '<div class="info-row"><span class="info-label">Name</span>';
    html +=
      '<span class="info-val">' +
      (q.first_name || "") +
      " " +
      (q.last_name || "") +
      "</span></div>";
    html += '<div class="info-row"><span class="info-label">Email</span>';
    html += '<span class="info-val">' + (q.email || "") + "</span></div>";
    if (q.phone) {
      html +=
        '<div class="info-row"><span class="info-label">Phone</span>';
      html += '<span class="info-val">' + q.phone + "</span></div>";
    }
    html += '<div class="info-row"><span class="info-label">Event</span>';
    html +=
      '<span class="info-val">' +
      (q.event_type || "Event") +
      (q.event_date ? " — " + q.event_date : "") +
      "</span></div>";
    if (q.location) {
      html +=
        '<div class="info-row"><span class="info-label">Location</span>';
      html += '<span class="info-val">' + q.location + "</span></div>";
    }
    html += "</div>";
  }
  box.innerHTML = html;
}

function filterQuotes() {
  var term = document
    .getElementById("quote-search")
    .value.trim()
    .toLowerCase();
  if (!term) {
    renderQuotes(allQuotes);
    return;
  }
  var filtered = allQuotes.filter(function (q) {
    return (
      ((q.first_name || "") + " " + (q.last_name || ""))
        .toLowerCase()
        .indexOf(term) > -1 ||
      (q.email || "").toLowerCase().indexOf(term) > -1 ||
      (q.event_type || "").toLowerCase().indexOf(term) > -1 ||
      (q.location || "").toLowerCase().indexOf(term) > -1
    );
  });
  renderQuotes(filtered);
}

function saveQuoteDetails(eventId) {
  fetch(API + "/owner/event-detail/" + eventId + "/quote", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      budget: document.getElementById("edit-quote-budget").value,
      source: document.getElementById("edit-quote-source").value,
      guests: document.getElementById("edit-quote-guests").value,
      event_type: document.getElementById("edit-quote-event-type").value,
    }),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.success && activeClientId) openClient(activeClientId);
    });
}


var invoiceStatusColors = {
  "Pending":   { bg: "#fff8e1", color: "#b8860b", border: "#f9c84e" },
  "Sent":      { bg: "#e3f0fb", color: "#1565c0", border: "#90caf9" },
  "Paid":      { bg: "#e8f5e9", color: "#2e7d32", border: "#81c784" },
  "Overdue":   { bg: "#fdecea", color: "#c62828", border: "#ef9a9a" },
  "Cancelled": { bg: "#f5f5f5", color: "#616161", border: "#bdbdbd" }
};

function invoiceStatusBadge(status) {
  var c = invoiceStatusColors[status] || { bg:"#f5f5f5", color:"#555", border:"#ccc" };
  return '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:0.72rem;font-family:DM Sans,sans-serif;' +
         'background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + ';">' + status + '</span>';
}

function loadInvoices(eventId) {
  fetch(API + "/owner/invoices/" + eventId, {
    headers: { Authorization: "Bearer " + token }
  })
  .then(function(r){ return r.json(); })
  .then(function(data) {
    var box = document.getElementById("owner-invoice-list");
    if (!box) return;
    if (!data.success || data.invoices.length === 0) {
      box.innerHTML = '<p style="color:#7A6E5E;font-size:0.85rem;">No invoices assigned yet.</p>';
      return;
    }
    var html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(74,39,114,0.15);">';
    html += '<th style="text-align:left;padding:6px 8px;color:#7a6e5e;font-weight:500;">#</th>';
    html += '<th style="text-align:left;padding:6px 8px;color:#7a6e5e;font-weight:500;">Amount</th>';
    html += '<th style="text-align:left;padding:6px 8px;color:#7a6e5e;font-weight:500;">Due Date</th>';
    html += '<th style="text-align:left;padding:6px 8px;color:#7a6e5e;font-weight:500;">Status</th>';
    html += '<th style="text-align:left;padding:6px 8px;color:#7a6e5e;font-weight:500;">Change Status</th>';
    html += '<th style="padding:6px 8px;"></th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < data.invoices.length; i++) {
      var inv = data.invoices[i];
      var amountDisplay = inv.amount != null ? "$" + parseFloat(inv.amount).toFixed(2) : "<span style=\"color:#bbb;\">—</span>";
      var dueDateDisplay = inv.due_date ? inv.due_date : "<span style=\"color:#bbb;\">—</span>";
      html += '<tr style="border-bottom:1px solid rgba(74,39,114,0.08);">';
      html += '<td style="padding:8px;color:#7a6e5e;">#' + inv.invoice_id + '</td>';
      html += '<td style="padding:8px;font-weight:500;">' + amountDisplay + '</td>';
      html += '<td style="padding:8px;">' + dueDateDisplay + '</td>';
      html += '<td style="padding:8px;">' + invoiceStatusBadge(inv.status) + '</td>';
      html += '<td style="padding:8px;"><select onchange="ownerUpdateInvoiceStatus(' + inv.invoice_id + ',this.value,' + eventId + ')" style="padding:5px 8px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.82rem;outline:none;">';
      var statuses = ["Pending","Sent","Paid","Overdue","Cancelled"];
      for (var s = 0; s < statuses.length; s++) {
        html += '<option value="' + statuses[s] + '"' + (statuses[s] === inv.status ? ' selected' : '') + '>' + statuses[s] + '</option>';
      }
      html += '</select></td>';
      html += '<td style="padding:8px;text-align:right;"><button onclick="ownerDeleteInvoice(' + inv.invoice_id + ',' + eventId + ')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;" title="Delete">✕</button></td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    box.innerHTML = html;
  });
}

function ownerAddInvoice(eventId, clientId) {
  var status  = document.getElementById("new-invoice-status").value;
  var amount  = document.getElementById("new-invoice-amount").value || null;
  var dueDate = document.getElementById("new-invoice-due").value || null;
  fetch(API + "/owner/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, client_id: clientId, status: status, amount: amount, due_date: dueDate })
  })
  .then(function(r){ return r.json(); })
  .then(function(data) {
    if (data.success) {
      document.getElementById("new-invoice-amount").value = "";
      document.getElementById("new-invoice-due").value = "";
      loadInvoices(eventId);
    }
  });
}

function ownerUpdateInvoiceStatus(invoiceId, status, eventId) {
  fetch(API + "/owner/invoices/" + invoiceId + "/status", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ status: status })
  })
  .then(function(r){ return r.json(); })
  .then(function(data) {
    if (data.success) loadInvoices(eventId);
  });
}

function ownerDeleteInvoice(invoiceId, eventId) {
  if (!confirm("Delete this invoice?")) return;
  fetch(API + "/owner/invoices/" + invoiceId, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  })
  .then(function(r){ return r.json(); })
  .then(function(data) {
    if (data.success) loadInvoices(eventId);
  });
}
function loadQuotes() {
  fetch(API + "/quotes")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (!data.success) return;
      allQuotes = data.quotes;
      document.getElementById("stat-quotes").textContent =
        allQuotes.length;
      if (allQuotes.length === 0) {
        document.getElementById("quotes-list").innerHTML =
          '<p style="color:#7A6E5E;">No quote requests yet.</p>';
        return;
      }
      renderQuotes(allQuotes);
    });
}

var activeMessageEventId = null;
var activeContactEmail = null;

function loadInbox() {
  fetch(API + "/owner/contact-conversations", { headers: { Authorization: "Bearer " + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      var convos = data.conversations || [];
      document.getElementById("stat-messages").textContent = convos.length;
      var box = document.getElementById("inbox-list");
      if (convos.length === 0) {
        box.innerHTML = '<p style="color:#7A6E5E;">No contact messages yet.</p>';
        return;
      }
      var html = '<input id="inbox-search" type="text" placeholder="Search by name or email..." oninput="filterInbox()" style="width:100%;box-sizing:border-box;padding:10px 14px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;color:#2e1547;outline:none;border-radius:2px;margin-bottom:16px;" />';
      html += '<div id="inbox-items">';
      for (var i = 0; i < convos.length; i++) {
        var c = convos[i];
        var preview = c.message ? (c.message.length > 80 ? c.message.substring(0, 80) + '...' : c.message) : '';
        var isReply = c.sender === 'Vision Realized';
        html += '<div class="msg-bubble" style="cursor:pointer;" onclick="openContactThread(\'' + c.email.replace(/'/g, "\\'") + '\',\'' + (c.name || '').replace(/'/g, "\\'") + '\')" data-name="' + (c.name || '').toLowerCase() + '" data-email="' + (c.email || '').toLowerCase() + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<span class="from">' + (c.name || 'Unknown') + '</span>';
        if (isReply) html += '<span style="font-size:0.68rem;color:#3a7d44;font-weight:500;">Replied</span>';
        html += '</div>';
        html += '<span class="when">' + (c.email || '') + (c.created_at ? ' &middot; ' + c.created_at.split(' ')[0] : '') + '</span>';
        html += '<div class="body">' + preview + '</div>';
        html += '</div>';
      }
      html += '</div>';
      box.innerHTML = html;
    });
}

function filterInbox() {
  var term = document.getElementById("inbox-search").value.trim().toLowerCase();
  var items = document.querySelectorAll("#inbox-items .msg-bubble");
  for (var i = 0; i < items.length; i++) {
    var name = items[i].getAttribute("data-name") || '';
    var email = items[i].getAttribute("data-email") || '';
    if (!term || name.indexOf(term) > -1 || email.indexOf(term) > -1) {
      items[i].style.display = '';
    } else {
      items[i].style.display = 'none';
    }
  }
}

function openContactThread(email, name) {
  activeContactEmail = email;
  fetch(API + "/owner/contact-conversation/" + encodeURIComponent(email), { headers: { Authorization: "Bearer " + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      var box = document.getElementById("inbox-list");
      var html = '<div class="panel">';
      html += '<h3>' + (name || email) + '</h3>';
      html += '<p style="color:#7A6E5E;margin-bottom:18px;">' + email + '</p>';
      html += '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;max-height:400px;overflow-y:auto;">';
      for (var i = 0; i < data.messages.length; i++) {
        var m = data.messages[i];
        var isOwner = m.sender === 'Vision Realized';
        var bubbleStyle = isOwner
          ? 'margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;'
          : 'margin-right:auto;background:#fff;color:#1A1208;border:1px solid rgba(74,39,114,0.15);border-radius:12px 12px 12px 2px;';
        html += '<div style="max-width:75%;padding:10px 14px;' + bubbleStyle + '">';
        html += '<div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">' + (m.sender || m.name || '') + '</div>';
        html += '<div style="font-size:0.88rem;line-height:1.5;">' + (m.message || '') + '</div>';
        if (m.created_at) html += '<div style="font-size:0.65rem;opacity:0.5;margin-top:4px;">' + m.created_at + '</div>';
        html += '</div>';
      }
      html += '</div>';
      html += '<div style="display:flex;gap:8px;align-items:flex-end;">';
      html += '<textarea id="contact-reply-text" placeholder="Type your reply..." rows="3" style="flex:1;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:none;outline:none;border-radius:2px;"></textarea>';
      html += '<button onclick="sendContactReply(\'' + email.replace(/'/g, "\\'") + '\',\'' + (name || '').replace(/'/g, "\\'") + '\')" style="padding:10px 20px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;border-radius:2px;">Send</button>';
      html += '</div>';
      html += '<div style="margin-top:12px;">';
      html += '<button class="action-btn" onclick="loadInbox()">Back to Inbox</button>';
      html += '</div></div>';
      box.innerHTML = html;
    });
}

function sendContactReply(email, name) {
  var input = document.getElementById("contact-reply-text");
  var text = input ? input.value.trim() : '';
  if (!text) { if (input) input.focus(); return; }
  fetch(API + "/owner/contact-conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ email: email, name: name, message: text }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.success) openContactThread(email, name);
    });
}

// ── Schedule Consultation ──
function scheduleConsultation(eventId, clientName) {
  var dateEl = document.getElementById("consult-date-" + eventId);
  var timeEl = document.getElementById("consult-time-" + eventId);
  var date = dateEl.value;
  var time = timeEl.value;
  if (!date) { dateEl.focus(); return; }

  var displayTime = time ? formatTime12(time) : '';
  var title = "Consultation";
  if (displayTime) title += " at " + displayTime;

  fetch(API + "/owner/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: eventId, title: title, due_date: date }),
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) return;
      dateEl.value = '';
      timeEl.value = '';
      // also send a message to the client about the consultation
      fetch(API + "/owner/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ event_id: eventId, sender: "Vision Realized", text: "Your consultation has been scheduled for " + date + (displayTime ? " at " + displayTime : "") + ". We look forward to speaking with you!" }),
      });
      alert("Consultation scheduled for " + date + (displayTime ? " at " + displayTime : "") + "! A task has been created and the client has been notified.");
      if (activeClientId) openClient(activeClientId);
    });
}

// ── Calendar Tab ──
var calDate = new Date();
var calTasks = [];
var calEvents = [];

function calNav(dir) {
  calDate.setMonth(calDate.getMonth() + dir);
  renderCalendar();
}

function renderCalendar() {
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var year = calDate.getFullYear();
  var month = calDate.getMonth();
  document.getElementById("cal-month-label").textContent = months[month] + ' ' + year;

  // collect tasks and events with dates
  calTasks = [];
  calEvents = [];
  for (var i = 0; i < allEvents.length; i++) {
    var ev = allEvents[i];
    if (ev.event_date) calEvents.push({ date: ev.event_date, title: ev.event_name || 'Event', client: (ev.firstname || '') + ' ' + (ev.lastname || ''), type: 'event', status: ev.status });
  }

  // fetch all tasks for all events to show on calendar
  var eventIds = allEvents.map(function(e) { return e.id; });
  var fetches = eventIds.map(function(eid) {
    return fetch(API + "/owner/event-detail/" + eid, { headers: { Authorization: "Bearer " + token } })
      .then(function(r) { return r.json(); });
  });

  Promise.all(fetches).then(function(details) {
    calTasks = [];
    for (var i = 0; i < details.length; i++) {
      if (!details[i].success) continue;
      for (var t = 0; t < details[i].tasks.length; t++) {
        var task = details[i].tasks[t];
        if (task.due_date) {
          calTasks.push({ date: task.due_date, title: task.title, completed: task.completed, type: 'task' });
        }
      }
    }
    drawCalGrid(year, month);
  });
}

function drawCalGrid(year, month) {
  var grid = document.getElementById("cal-grid");
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var html = '';

  // header row
  for (var d = 0; d < 7; d++) {
    html += '<div style="background:#4a2772;color:white;padding:8px;text-align:center;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;">' + days[d] + '</div>';
  }

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

  // empty cells before first day
  for (var i = 0; i < firstDay; i++) {
    html += '<div style="background:#faf7f2;padding:8px;min-height:80px;"></div>';
  }

  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    var isToday = dateStr === todayStr;
    var bg = isToday ? '#f0e6f6' : 'white';

    // find items for this day
    var dayItems = [];
    for (var e = 0; e < calEvents.length; e++) {
      if (calEvents[e].date === dateStr) dayItems.push(calEvents[e]);
    }
    for (var t = 0; t < calTasks.length; t++) {
      if (calTasks[t].date === dateStr) dayItems.push(calTasks[t]);
    }

    html += '<div style="background:' + bg + ';padding:6px 8px;min-height:80px;cursor:pointer;" onclick="showCalDay(\'' + dateStr + '\')">';
    html += '<div style="font-size:0.82rem;font-weight:' + (isToday ? '600' : '400') + ';color:' + (isToday ? '#4a2772' : '#2e1547') + ';margin-bottom:4px;">' + day + '</div>';

    for (var di = 0; di < dayItems.length && di < 3; di++) {
      var item = dayItems[di];
      var dotColor = item.type === 'event' ? '#4a2772' : (item.completed ? '#3a7d44' : '#e65100');
      html += '<div style="font-size:0.62rem;color:#2e1547;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">';
      html += '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + dotColor + ';margin-right:4px;vertical-align:middle;"></span>';
      html += item.title;
      html += '</div>';
    }
    if (dayItems.length > 3) html += '<div style="font-size:0.6rem;color:#7a6e5e;">+' + (dayItems.length - 3) + ' more</div>';
    html += '</div>';
  }

  grid.innerHTML = html;
}

function showCalDay(dateStr) {
  var detail = document.getElementById("cal-day-detail");
  var items = [];
  for (var e = 0; e < calEvents.length; e++) {
    if (calEvents[e].date === dateStr) items.push(calEvents[e]);
  }
  for (var t = 0; t < calTasks.length; t++) {
    if (calTasks[t].date === dateStr) items.push(calTasks[t]);
  }

  if (items.length === 0) {
    var noParts = dateStr.split('-');
    var noDate = new Date(noParts[0], noParts[1]-1, noParts[2]);
    var noLabel = noDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    detail.innerHTML = '<div class="panel"><p style="color:#7a6e5e;">Nothing scheduled for ' + noLabel + '</p></div>';
    return;
  }

  var dateParts = dateStr.split('-');
  var dateObj = new Date(dateParts[0], dateParts[1]-1, dateParts[2]);
  var dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  var html = '<div class="panel">';
  html += '<h3 style="margin-bottom:14px;">' + dateLabel + '</h3>';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.type === 'event') {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(74,39,114,0.08);">';
      html += '<span style="width:8px;height:8px;border-radius:50%;background:#4a2772;flex-shrink:0;"></span>';
      html += '<div>';
      html += '<div style="font-weight:500;color:#2e1547;">' + item.title + '</div>';
      html += '<div style="font-size:0.78rem;color:#7a6e5e;">' + item.client + ' &middot; <span class="status-badge ' + badgeClass(item.status) + '" style="font-size:0.65rem;">' + statusLabel(item.status) + '</span></div>';
      html += '</div></div>';
    } else {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(74,39,114,0.08);">';
      html += '<span style="width:8px;height:8px;border-radius:50%;background:' + (item.completed ? '#3a7d44' : '#e65100') + ';flex-shrink:0;"></span>';
      html += '<div>';
      html += '<div style="font-weight:500;color:#2e1547;' + (item.completed ? 'text-decoration:line-through;opacity:0.6;' : '') + '">' + item.title + '</div>';
      html += '<div style="font-size:0.78rem;color:#7a6e5e;">' + (item.completed ? 'Completed' : 'Task') + '</div>';
      html += '</div></div>';
    }
  }
  html += '</div>';
  detail.innerHTML = html;
}

// ── Gallery Tab ──
var galleryPhotoData = '';

function previewGalleryPhoto(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    galleryPhotoData = e.target.result;
    document.getElementById("gallery-preview").style.display = "block";
    document.getElementById("gallery-preview-img").src = galleryPhotoData;
    document.getElementById("gallery-upload-text").textContent = input.files[0].name;
  };
  reader.readAsDataURL(input.files[0]);
}

function addGalleryItem() {
  var title = document.getElementById("gallery-title").value.trim();
  var category = document.getElementById("gallery-category").value;
  var desc = document.getElementById("gallery-desc").value.trim();

  if (!title) { document.getElementById("gallery-title").focus(); return; }
  if (!galleryPhotoData) { alert("Please select a photo to upload."); return; }

  var btn = document.getElementById("gallery-add-btn");
  btn.disabled = true;
  btn.textContent = "Uploading...";

  fetch(API + "/owner/gallery", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({
      title: title,
      category: category,
      description: desc,
      image_url: galleryPhotoData,
    }),
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        btn.textContent = "Added!";
        btn.style.background = "#3a7d44";
        document.getElementById("gallery-title").value = "";
        document.getElementById("gallery-desc").value = "";
        document.getElementById("gallery-file-input").value = "";
        document.getElementById("gallery-preview").style.display = "none";
        document.getElementById("gallery-upload-text").textContent = "Click to select a photo";
        galleryPhotoData = "";
        loadGalleryAdmin();
        setTimeout(function() {
          btn.disabled = false;
          btn.textContent = "Add to Gallery";
          btn.style.background = "";
        }, 2000);
      } else {
        btn.textContent = "Error";
        btn.disabled = false;
      }
    })
    .catch(function() { btn.textContent = "Error"; btn.disabled = false; });
}

function deleteGalleryItem(id) {
  if (!confirm("Remove this photo from the gallery?")) return;
  fetch(API + "/owner/gallery/" + id, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) loadGalleryAdmin();
    });
}

function loadGalleryAdmin() {
  fetch(API + "/gallery")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var grid = document.getElementById("gallery-admin-grid");
      var carGrid = document.getElementById("carousel-admin-grid");
      if (!data.success || !data.items) {
        grid.innerHTML = '<p style="color:#7a6e5e;">No gallery photos yet.</p>';
        carGrid.innerHTML = '<p style="color:#7a6e5e;">No carousel photos yet.</p>';
        return;
      }
      var featured = data.items.filter(function(i) { return !i.is_carousel; });
      var carousel = data.items.filter(function(i) { return i.is_carousel; });

      if (featured.length === 0) {
        grid.innerHTML = '<p style="color:#7a6e5e;">No gallery photos yet. Add your first one above.</p>';
      } else {
        var html = '';
        for (var i = 0; i < featured.length; i++) {
          var item = featured[i];
          html += '<div style="width:220px;background:white;border:1px solid rgba(74,39,114,0.1);border-radius:4px;overflow:hidden;">';
          html += '<img src="' + item.image_url + '" style="width:100%;height:150px;object-fit:cover;" />';
          html += '<div style="padding:12px;">';
          html += '<div style="font-weight:500;font-size:0.88rem;color:#2e1547;margin-bottom:4px;">' + item.title + '</div>';
          html += '<span style="font-size:0.7rem;padding:2px 8px;background:rgba(74,39,114,0.08);color:#4a2772;border-radius:10px;">' + (item.category || '') + '</span>';
          html += '<button onclick="deleteGalleryItem(' + item.id + ')" style="margin-top:10px;display:block;background:none;border:1px solid #c0392b;color:#c0392b;padding:4px 12px;font-size:0.75rem;cursor:pointer;font-family:inherit;border-radius:2px;">Remove</button>';
          html += '</div></div>';
        }
        grid.innerHTML = html;
      }

      if (carousel.length === 0) {
        carGrid.innerHTML = '<p style="color:#7a6e5e;">No carousel photos yet. Upload some above.</p>';
      } else {
        var html = '';
        for (var i = 0; i < carousel.length; i++) {
          var item = carousel[i];
          html += '<div style="width:100px;height:100px;position:relative;border-radius:4px;overflow:hidden;border:1px solid rgba(74,39,114,0.1);">';
          html += '<img src="' + item.image_url + '" style="width:100%;height:100%;object-fit:cover;" />';
          html += '<button onclick="deleteGalleryItem(' + item.id + ')" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:white;border:none;width:20px;height:20px;font-size:0.7rem;cursor:pointer;border-radius:50;line-height:20px;text-align:center;">✕</button>';
          html += '</div>';
        }
        carGrid.innerHTML = html;
      }
    });
}

var carouselPendingPhotos = [];

function previewCarouselPhotos(input) {
  carouselPendingPhotos = [];
  var preview = document.getElementById("carousel-preview");
  preview.innerHTML = '';
  if (!input.files || input.files.length === 0) {
    document.getElementById("carousel-upload-btn").style.display = "none";
    document.getElementById("carousel-count").textContent = "";
    return;
  }
  document.getElementById("carousel-count").textContent = input.files.length + " photo" + (input.files.length !== 1 ? "s" : "") + " selected";
  document.getElementById("carousel-upload-btn").style.display = "";
  for (var i = 0; i < input.files.length; i++) {
    (function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        carouselPendingPhotos.push(e.target.result);
        var img = document.createElement("img");
        img.src = e.target.result;
        img.style.cssText = "width:80px;height:80px;object-fit:cover;border-radius:4px;border:1px solid #efe6dc;";
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    })(input.files[i]);
  }
}

function uploadCarouselPhotos() {
  if (carouselPendingPhotos.length === 0) return;
  var btn = document.getElementById("carousel-upload-btn");
  btn.disabled = true;
  btn.textContent = "Uploading " + carouselPendingPhotos.length + "...";
  var category = document.getElementById("carousel-category").value;
  var images = carouselPendingPhotos.map(function(url) {
    return { image_url: url, category: category, title: '' };
  });
  fetch(API + "/owner/gallery/carousel", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ images: images }),
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        btn.textContent = "Uploaded!";
        btn.style.background = "#3a7d44";
        document.getElementById("carousel-file-input").value = "";
        document.getElementById("carousel-preview").innerHTML = "";
        document.getElementById("carousel-count").textContent = "";
        carouselPendingPhotos = [];
        loadGalleryAdmin();
        setTimeout(function() { btn.disabled = false; btn.textContent = "Upload All"; btn.style.background = ""; btn.style.display = "none"; }, 2000);
      } else {
        btn.textContent = "Error"; btn.disabled = false;
      }
    })
    .catch(function() { btn.textContent = "Error"; btn.disabled = false; });
}

// ── Load All ──
function loadAll() {
  fetch(API + "/owner/events", { headers: { Authorization: "Bearer " + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) return;
      allEvents = data.events;
      clientsMap = groupEventsByClient(allEvents);
      var clientCount = Object.keys(clientsMap).length;
      var needsQuote = 0;
      for (var i = 0; i < allEvents.length; i++) {
        if (allEvents[i].status === 'Quote Submitted') needsQuote++;
      }
      document.getElementById("stat-events").textContent = allEvents.length;
      document.getElementById("stat-quotes").textContent = needsQuote;
      document.getElementById("stat-clients").textContent = clientCount;
      document.getElementById("clients-badge").textContent = clientCount;
      renderClientCards();
    });
  // Load inbox count for badge (lightweight)
  fetch(API + "/owner/contact-conversations", { headers: { Authorization: "Bearer " + token } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        var count = (data.conversations || []).length;
        document.getElementById("stat-messages").textContent = count;
      }
    });
}

loadAll();
