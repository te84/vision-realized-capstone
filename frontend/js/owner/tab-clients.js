var _currentEditEventId = null;
var _activeClientId     = null;

function clientsTabInit(container) {
  container.innerHTML =
    statsHeaderHTML('Manage client events, view quotes, and communicate with clients.') +
    _listViewHTML() + _detailViewHTML();
  updateStatsBar();
  _filterClientCards();
}

/* ── HTML shells ─────────────────────────────────────────────────── */
function _listViewHTML() {
  return '<div id="clients-list-view">' +
    '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.6rem;color:#2e1547;font-style:italic;margin-bottom:16px;">Clients</h2>' +
    '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">' +
      '<input id="client-search" type="text" placeholder="Search clients…" oninput="_filterClientCards()" style="flex:2;min-width:200px;padding:10px 14px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;color:#2e1547;outline:none;border-radius:2px;" />' +
      '<select id="client-stage-filter" onchange="_filterClientCards()" style="padding:10px 14px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;color:#2e1547;outline:none;border-radius:2px;min-width:180px;">' +
        '<option value="">All Stages</option><option value="Quote Submitted">Needs Quote</option>' +
        '<option value="Consultation">In Consultation</option><option value="Planning">Planning</option>' +
        '<option value="Vendors Set">Vendors Set</option><option value="Event Day">Event Day</option>' +
        '<option value="Completed">Completed</option>' +
      '</select>' +
    '</div>' +
    '<div id="clients-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;"><p style="color:#7a6e5e;">Loading…</p></div>' +
  '</div>';
}

function _detailViewHTML() {
  var tabs = [['overview','Overview'],['events','Events'],['tasks','Tasks'],['messages','Messages'],['documents','Documents'],['quotes','Quote Details'],['reviews','Reviews']];
  return '<div id="client-detail-view" style="display:none;">' +
    '<button onclick="_backToClients()" style="background:none;border:none;color:#4a2772;font-family:inherit;font-size:0.88rem;cursor:pointer;padding:0;margin-bottom:16px;display:flex;align-items:center;gap:6px;">&larr; Back to Clients</button>' +
    '<div id="client-header"></div>' +
    '<div class="client-subtabs" style="display:flex;gap:0;border-bottom:2px solid rgba(74,39,114,0.15);margin-bottom:24px;">' +
      tabs.map(function (t, i) { return '<button class="client-subtab' + (i===0?' active':'') + '" onclick="_switchSubtab(this,\'ctab-' + t[0] + '\')">' + t[1] + '</button>'; }).join('') +
    '</div>' +
    tabs.map(function (t, i) { return '<div id="ctab-' + t[0] + '" class="client-subtab-content"' + (i>0?' style="display:none;"':'') + '></div>'; }).join('') +
  '</div>';
}

/* ── Client helpers ──────────────────────────────────────────────── */
function _clientStage(c) {
  var order = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];
  var best = 5;
  c.events.forEach(function (ev) { var i = order.indexOf(ev.status); if (i>=0 && i<best) best=i; });
  return order[best] || 'Quote Submitted';
}

function _buildClientCard(c) {
  var stage = _clientStage(c);
  var nextDate = c.events.reduce(function (acc, ev) {
    return (!acc && ev.event_date) ? ev.event_date : (ev.event_date && ev.event_date < acc ? ev.event_date : acc);
  }, null);
  return '<div class="client-card" onclick="_openClient(' + c.client_id + ')" style="background:white;border:1px solid rgba(74,39,114,0.15);padding:20px 24px;cursor:pointer;border-radius:4px;transition:box-shadow 0.2s;">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">' +
      '<div><div style="font-weight:500;font-size:1rem;color:#2e1547;">' + c.firstname + ' ' + c.lastname + '</div>' +
      '<div style="font-size:0.78rem;color:#7a6e5e;margin-top:2px;">' + (c.email||'') + '</div>' +
      (c.phone ? '<div style="font-size:0.78rem;color:#7a6e5e;">' + c.phone + '</div>' : '') + '</div>' +
      '<span class="status-badge ' + badgeClass(stage) + '" style="font-size:0.68rem;white-space:nowrap;">' + statusLabel(stage) + '</span>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
      c.events.map(function (ev) { return '<span style="font-size:0.72rem;color:#7a6e5e;background:#f5f0eb;padding:2px 8px;border-radius:10px;">' + (ev.event_type||ev.event_name||'Event') + '</span>'; }).join('') +
    '</div>' +
    (nextDate ? '<div style="font-size:0.75rem;color:#7a6e5e;margin-top:8px;">Next: ' + nextDate + '</div>' : '') +
  '</div>';
}

function _filterClientCards() {
  var term  = (document.getElementById('client-search').value||'').trim().toLowerCase();
  var stage = document.getElementById('client-stage-filter').value || '';
  var grid  = document.getElementById('clients-grid');
  var keys  = Object.keys(clientsMap);
  if (!keys.length) { grid.innerHTML = '<p style="color:#7a6e5e;">No clients yet.</p>'; return; }

  var filtered = keys.map(function (k) { return clientsMap[k]; }).filter(function (c) {
    var name = (c.firstname+' '+c.lastname).toLowerCase();
    if (term && name.indexOf(term)===-1 && (c.email||'').toLowerCase().indexOf(term)===-1) return false;
    if (stage && !c.events.some(function (ev) { return ev.status===stage; })) return false;
    return true;
  });
  if (!filtered.length) { grid.innerHTML = '<p style="color:#7a6e5e;">No matching clients.</p>'; return; }

  if (stage) { grid.innerHTML = filtered.map(_buildClientCard).join(''); return; }

  var ORDER  = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];
  var LABELS = { 'Quote Submitted':'Needs Quote','Consultation':'In Consultation','Planning':'Planning in Progress','Vendors Set':'Vendors Confirmed','Event Day':'Event Day','Completed':'Completed' };
  var groups = {}; ORDER.forEach(function (g) { groups[g]=[]; });
  filtered.forEach(function (c) { (groups[_clientStage(c)]||groups['Quote Submitted']).push(c); });
  var html = '';
  ORDER.forEach(function (gk, gi) {
    if (!groups[gk].length) return;
    html += '<div style="grid-column:1/-1;margin-top:' + (gi>0?'20px':'0') + ';margin-bottom:8px;">' +
      '<div style="display:flex;align-items:center;gap:10px;"><span class="status-badge ' + badgeClass(gk) + '" style="font-size:0.7rem;">' + LABELS[gk] + '</span>' +
      '<span style="font-size:0.78rem;color:#7a6e5e;">' + groups[gk].length + ' client' + (groups[gk].length!==1?'s':'') + '</span></div></div>';
    html += groups[gk].map(_buildClientCard).join('');
  });
  grid.innerHTML = html;
}

function _backToClients() {
  document.getElementById('clients-list-view').style.display = '';
  document.getElementById('client-detail-view').style.display = 'none';
}

function _switchSubtab(el, tabId) {
  document.querySelectorAll('.client-subtab-content').forEach(function (t) { t.style.display='none'; });
  document.getElementById(tabId).style.display = '';
  document.querySelectorAll('.client-subtab').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
}

/* ── Open client — reads from cache, no fetch ────────────────────── */
function _openClient(clientId) {
  var c = clientsMap[clientId];
  if (!c) return;
  _activeClientId = clientId;
  document.getElementById('clients-list-view').style.display = 'none';
  document.getElementById('client-detail-view').style.display = '';
  document.querySelectorAll('.client-subtab').forEach(function (b,i) { b.classList.toggle('active',i===0); });
  document.querySelectorAll('.client-subtab-content').forEach(function (t,i) { t.style.display=i===0?'':'none'; });
  document.getElementById('client-header').innerHTML =
    '<div style="margin-bottom:8px;"><h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.8rem;color:#2e1547;font-style:italic;margin-bottom:4px;">' + c.firstname + ' ' + c.lastname + '</h2>' +
    '<div style="font-size:0.88rem;color:#7a6e5e;">' + (c.email||'') + (c.phone?' &middot; '+c.phone:'') + '</div></div>';

  // All data already in _cache.details — render immediately
  _renderOverview(c);
  _renderEvents(c);
  _renderTasks(c);
  _renderMessages(c);
  _renderDocuments(c);
  _renderQuotes(c);
  _renderReviews(c);
}

/* ── Journey bar ─────────────────────────────────────────────────── */
var _STEPS = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];
function _journeyBarHTML(status) {
  var idx = Math.max(0, _STEPS.indexOf(status||'Quote Submitted'));
  return '<div style="display:flex;gap:4px;align-items:center;margin:12px 0 4px;">' +
    _STEPS.map(function (name,i) {
      var st = i<idx?'done':i===idx?'current':'pending';
      var bg = st==='done'?'#4a2772':st==='current'?'#6b3fa0':'#e8e0f0';
      return '<div style="flex:1;text-align:center;opacity:' + (st==='pending'?'0.5':'1') + ';">' +
        '<div style="height:6px;background:' + bg + ';border-radius:3px;margin-bottom:4px;"></div>' +
        '<div style="font-size:0.62rem;color:' + (st==='pending'?'#7a6e5e':'#4a2772') + ';letter-spacing:0.02em;">' + statusLabel(name) + '</div></div>';
    }).join('') + '</div>';
}

/* ── Overview ────────────────────────────────────────────────────── */
function _renderOverview(c) {
  var active=0,completed=0,doneTasks=0,totalTasks=0,totalMsgs=0;
  c.events.forEach(function (ev) {
    ev.status==='Completed'?completed++:active++;
    var d = _cache.details[ev.id];
    if (d) { totalTasks+=d.tasks.length; d.tasks.forEach(function(t){if(t.completed)doneTasks++;}); totalMsgs+=d.messages.length; }
  });
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px;">' +
    [['Active Events',active],['Completed',completed],['Tasks Done',doneTasks+'/'+totalTasks],['Messages',totalMsgs]].map(function(p){
      return '<div class="stat-box"><div class="num">'+p[1]+'</div><div class="label">'+p[0]+'</div></div>';
    }).join('') + '</div>';
  c.events.forEach(function (ev) {
    var d = _cache.details[ev.id]; var td=0,tt=0;
    if (d) { tt=d.tasks.length; d.tasks.forEach(function(t){if(t.completed)td++;}); }
    html += '<div class="panel" style="margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px;">' +
        '<div><h3 style="margin-bottom:2px;">'+(ev.event_name||'Untitled')+'</h3>' +
        '<div style="font-size:0.8rem;color:#7a6e5e;">'+(ev.event_type||'')+(ev.event_date?' &middot; '+ev.event_date:' &middot; TBD')+(ev.location?' &middot; '+ev.location:'')+'</div></div>' +
        '<span class="status-badge '+badgeClass(ev.status)+'">'+statusLabel(ev.status)+'</span>' +
      '</div>'+_journeyBarHTML(ev.status)+
      '<div style="display:flex;gap:16px;margin-top:10px;font-size:0.78rem;color:#7a6e5e;align-items:center;">' +
        '<span>Tasks: '+td+'/'+tt+'</span>' +
        (d?'<span>Messages: '+d.messages.length+'</span>':'') +
        (d?'<span>Documents: '+d.documents.length+'</span>':'') +
        (ev.planner&&ev.planner!=='TBD'?'<span>Planner: '+ev.planner+'</span>':'') +
        (d&&d.rating?'<span>'+[1,2,3,4,5].map(function(s){return'<span style="color:'+(s<=d.rating.stars?'#c49a2a':'#ddd')+';">&#9733;</span>';}).join('')+' ('+d.rating.stars+'/5)</span>':'') +
      '</div></div>';
  });
  document.getElementById('ctab-overview').innerHTML = html;
}

/* ── Events (edit) ───────────────────────────────────────────────── */
function _renderEvents(c) {
  var html = '';
  if (c.events.length>1) {
    html += '<div style="margin-bottom:16px;"><select id="client-event-select" onchange="_selectEvent(parseInt(this.value))" style="width:100%;padding:12px 16px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:\'Cormorant Garamond\',serif;font-size:1.05rem;color:#2e1547;outline:none;border-radius:2px;">' +
      c.events.map(function(ev){return'<option value="'+ev.id+'">'+(ev.event_name||'Event')+' — '+(ev.event_date||'TBD')+'</option>';}).join('') +
      '</select></div>';
  }
  html += '<div id="client-event-edit-area"></div>';
  document.getElementById('ctab-events').innerHTML = html;
  _selectEvent(c.events[0].id);
}

function _selectEvent(eventId) {
  _currentEditEventId = eventId;
  var ev = allEvents.find(function(e){return e.id===eventId;})||null;
  var curStatus = (ev&&ev.status)||'Quote Submitted';
  var STATUSES = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed'];
  function inp(label,id,type,val,placeholder,full) {
    return '<div'+(full?' style="grid-column:1/-1"':'')+'>'+
      '<label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">'+label+'</label>'+
      '<input id="'+id+'" type="'+(type||'text')+'" value="'+(val||'').replace(/"/g,'&quot;')+'" placeholder="'+(placeholder||'')+'" '+
      'style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;"></div>';
  }
  var html = '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;">' +
    '<h4 style="margin:0 0 14px;font-size:0.9rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Edit Event</h4>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;">' +
      inp('Event Name','edit-name','text',ev&&ev.event_name) +
      '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Status</label>' +
        '<select id="edit-status" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;">' +
          STATUSES.map(function(s){return'<option value="'+s+'"'+(s===curStatus?' selected':'')+'>'+statusLabel(s)+'</option>';}).join('') +
        '</select></div>' +
      inp('Event Date','edit-date','date',ev&&ev.event_date) +
      inp('Location','edit-location','text',ev&&ev.location) +
      inp('Event Type','edit-event-type','text',ev&&ev.event_type,'e.g. Birthday Party') +
      inp('Guests','edit-guests','text',ev&&ev.guests,'e.g. 50-100') +
      inp('Planner','edit-planner','text',ev&&ev.planner,'Assign a planner name',true) +
    '</div>' +
    '<div style="margin-top:14px;text-align:right;"><button id="save-event-btn" onclick="_saveEvent()" style="padding:9px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;">Save Changes</button></div></div>' +
    '<h4 style="margin-top:28px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Invoices</h4>' +
    '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:16px 20px;margin-bottom:24px;">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:16px;align-items:end;">' +
        '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Status</label><select id="new-invoice-status" style="width:100%;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"><option>Pending</option><option>Sent</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></div>' +
        '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Amount ($)</label><input id="new-invoice-amount" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"></div>' +
        '<div><label style="font-size:0.75rem;color:#7a6e5e;display:block;margin-bottom:3px;">Due Date</label><input id="new-invoice-due" type="date" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"></div>' +
        '<button onclick="ownerAddInvoice('+eventId+','+(ev?ev.client_id:0)+')" style="padding:8px 18px;background:#555;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;align-self:end;">+ Add</button>' +
      '</div>' +
      '<div id="owner-invoice-list"></div>' +
    '</div>';
  document.getElementById('client-event-edit-area').innerHTML = html;
  renderInvoicesFromCache(eventId);
}

function _saveEvent() {
  if (!_currentEditEventId) return;
  var btn = document.getElementById('save-event-btn');
  btn.disabled=true; btn.textContent='Saving…';
  var payload = { status:document.getElementById('edit-status').value, event_date:document.getElementById('edit-date').value||null, location:document.getElementById('edit-location').value, planner:document.getElementById('edit-planner').value, event_name:document.getElementById('edit-name').value, guests:document.getElementById('edit-guests').value, event_type:document.getElementById('edit-event-type').value };
  fetch(API+'/owner/events/'+_currentEditEventId, {
    method:'PUT', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body:JSON.stringify(payload)
  }).then(function(r){return r.json();}).then(function(d){
    if (d.success) {
      btn.textContent='Saved!'; btn.style.background='#3a7d44';
      // Update cache locally
      allEvents.forEach(function(ev){if(ev.id===_currentEditEventId)Object.assign(ev,payload);});
      _invalidateCache(); // force re-fetch next tab switch so calendar etc. stay consistent
      setTimeout(function(){btn.disabled=false;btn.textContent='Save Changes';btn.style.background='';},2000);
    } else { btn.textContent='Error'; btn.disabled=false; }
  }).catch(function(){btn.textContent='Error';btn.disabled=false;});
}

/* ── Tasks ───────────────────────────────────────────────────────── */
function _renderTasks(c) {
  document.getElementById('ctab-tasks').innerHTML = c.events.map(function(ev){
    var d = _cache.details[ev.id]; if(!d) return '';
    var rows = d.tasks.length ? d.tasks.map(function(t){
      return '<div class="task-item'+(t.completed?' done':'')+'" id="task-row-'+t.id+'" style="display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="display:flex;align-items:center;gap:8px;"><div class="task-toggle" onclick="ownerToggleTask('+t.id+','+ev.id+')" style="cursor:pointer;">'+(t.completed?'✓':'')+'</div>' +
        '<span>'+t.title+'</span>'+(t.due_date?'<span style="color:#7A6E5E;font-size:0.8rem;">— '+t.due_date+'</span>':'')+
        '</div><button onclick="ownerDeleteTask('+t.id+',\'owner-task-list-'+ev.id+'\','+ev.id+')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;">✕</button></div>';
    }).join('') : '<p style="color:#7A6E5E;">No tasks yet.</p>';
    return '<div class="panel" style="margin-bottom:16px;"><h3 style="margin-bottom:4px;">'+(ev.event_name||'Event')+'</h3>' +
      '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:14px;">'+(ev.event_type||'')+(ev.event_date?' &middot; '+ev.event_date:'')+'</div>' +
      '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:14px 16px;margin-bottom:14px;"><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<input id="new-task-title-'+ev.id+'" placeholder="Task title…" style="flex:2;min-width:140px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">' +
        '<input id="new-task-date-'+ev.id+'" type="date" style="flex:1;min-width:120px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">' +
        '<button onclick="_addTask('+ev.id+')" style="padding:8px 18px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;">+ Assign</button>' +
      '</div></div><div id="owner-task-list-'+ev.id+'">'+rows+'</div></div>';
  }).join('');
}

function _addTask(eventId) {
  var titleEl = document.getElementById('new-task-title-'+eventId);
  var dateEl  = document.getElementById('new-task-date-'+eventId);
  var title = titleEl.value.trim(), due = dateEl.value||null;
  if (!title){titleEl.focus();return;}
  fetch(API+'/owner/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({event_id:eventId,title:title,due_date:due})})
    .then(function(r){return r.json();}).then(function(d){
      if(!d.success)return;
      titleEl.value='';dateEl.value='';
      var tid = d.task_id||Date.now();
      // Update cache
      (_cache.details[eventId]=_cache.details[eventId]||{});
      (_cache.details[eventId].tasks=_cache.details[eventId].tasks||[]).push({id:tid,title:title,due_date:due,completed:false});
      var list = document.getElementById('owner-task-list-'+eventId);
      var empty=list.querySelector('p');if(empty)empty.remove();
      var row=document.createElement('div');row.className='task-item';row.id='task-row-'+tid;
      row.style.cssText='display:flex;align-items:center;justify-content:space-between;';
      row.innerHTML='<div style="display:flex;align-items:center;gap:8px;"><div class="task-toggle" onclick="ownerToggleTask('+tid+','+eventId+')" style="cursor:pointer;"></div><span>'+title+'</span>'+(due?'<span style="color:#7A6E5E;font-size:0.8rem;">— '+due+'</span>':'')+
        '</div><button onclick="ownerDeleteTask('+tid+',\'owner-task-list-'+eventId+'\','+eventId+')" style="background:none;border:none;color:#c0392b;font-size:1rem;cursor:pointer;padding:2px 6px;">✕</button>';
      list.appendChild(row);
    });
}

/* ── Messages ────────────────────────────────────────────────────── */
function _renderMessages(c) {
  document.getElementById('ctab-messages').innerHTML = c.events.map(function(ev){
    var d=_cache.details[ev.id];if(!d)return'';
    var bubbles=(d.messages||[]).map(function(msg){
      var isOwner=msg.sender==='Vision Realized';
      var style=isOwner?'margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;':'margin-right:auto;background:#fff;color:#1A1208;border:1px solid rgba(74,39,114,0.15);border-radius:12px 12px 12px 2px;';
      return '<div style="max-width:75%;padding:10px 14px;'+style+'"><div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">'+(msg.sender||'')+'</div><div style="font-size:0.88rem;line-height:1.5;">'+(msg.text||'')+'</div></div>';
    }).join('')||'<p style="color:#7A6E5E;font-size:0.85rem;">No messages yet.</p>';
    return '<div class="panel" style="margin-bottom:16px;"><h3 style="margin-bottom:4px;">'+(ev.event_name||'Event')+'</h3>' +
      '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:14px;">'+(ev.event_type||'')+(ev.event_date?' &middot; '+ev.event_date:'')+'</div>' +
      '<div id="owner-chat-history-'+ev.id+'" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:320px;overflow-y:auto;">'+bubbles+'</div>' +
      '<div style="display:flex;gap:8px;align-items:flex-end;">' +
        '<textarea id="owner-msg-input-'+ev.id+'" placeholder="Type a message…" rows="2" style="flex:1;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:none;outline:none;border-radius:2px;"></textarea>' +
        '<button onclick="_sendMsg('+ev.id+')" style="padding:10px 20px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;white-space:nowrap;border-radius:2px;">Send</button>' +
      '</div></div>';
  }).join('');
}

function _sendMsg(eventId) {
  var input=document.getElementById('owner-msg-input-'+eventId);
  var text=input?input.value.trim():'';if(!text){if(input)input.focus();return;}
  fetch(API+'/owner/messages',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({event_id:eventId,sender:'Vision Realized',text:text})})
    .then(function(r){return r.json();}).then(function(d){
      if(!d.success)return;
      var msg={sender:'Vision Realized',text:text};
      (_cache.details[eventId]=_cache.details[eventId]||{});
      (_cache.details[eventId].messages=_cache.details[eventId].messages||[]).push(msg);
      var history=document.getElementById('owner-chat-history-'+eventId);
      var empty=history.querySelector('p');if(empty)empty.remove();
      var bubble=document.createElement('div');
      bubble.style.cssText='max-width:75%;padding:10px 14px;margin-left:auto;background:#4a2772;color:white;border-radius:12px 12px 2px 12px;';
      bubble.innerHTML='<div style="font-size:0.7rem;opacity:0.7;margin-bottom:3px;">Vision Realized</div><div style="font-size:0.88rem;line-height:1.5;">'+text+'</div>';
      history.appendChild(bubble);history.scrollTop=history.scrollHeight;input.value='';
    });
}

/* ── Documents ───────────────────────────────────────────────────── */
function _renderDocuments(c) {
  document.getElementById('ctab-documents').innerHTML = c.events.map(function(ev){
    var d=_cache.details[ev.id];if(!d)return'';
    var docRows=d.documents.length?d.documents.map(function(doc){
      return '<div class="doc-row"><span class="doc-type">'+(doc.file_type||'FILE')+'</span><span>'+doc.name+'</span>'+(doc.status?'<span style="color:#7A6E5E;font-size:0.8rem;margin-left:auto;">'+doc.status+'</span>':'')+'</div>';
    }).join(''):'<p style="color:#7A6E5E;">No documents yet.</p>';
    return '<div class="panel" style="margin-bottom:16px;"><h3 style="margin-bottom:4px;">'+(ev.event_name||'Event')+'</h3>' +
      '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:14px;">'+(ev.event_type||'')+(ev.event_date?' &middot; '+ev.event_date:'')+'</div>' +
      '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:14px 16px;margin-bottom:14px;"><div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<input id="new-doc-name-'+ev.id+'" placeholder="Document name…" style="flex:2;min-width:140px;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;">' +
        '<select id="new-doc-type-'+ev.id+'" style="padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"><option>PDF</option><option>DOC</option><option>IMG</option><option>XLS</option><option>OTHER</option></select>' +
        '<select id="new-doc-status-'+ev.id+'" style="padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.85rem;outline:none;"><option>Uploaded</option><option>Pending Signature</option><option>Signed</option><option>Final</option></select>' +
        '<button onclick="_addDoc('+ev.id+')" style="padding:8px 18px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;cursor:pointer;white-space:nowrap;">+ Add</button>' +
      '</div></div><div id="doc-list-'+ev.id+'">'+docRows+'</div></div>';
  }).join('');
}

function _addDoc(eventId) {
  var nameEl=document.getElementById('new-doc-name-'+eventId);
  var typeEl=document.getElementById('new-doc-type-'+eventId);
  var statEl=document.getElementById('new-doc-status-'+eventId);
  var name=nameEl.value.trim();if(!name){nameEl.focus();return;}
  fetch(API+'/owner/documents',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({event_id:eventId,name:name,file_type:typeEl.value,status:statEl.value})})
    .then(function(r){return r.json();}).then(function(d){
      if(!d.success)return;
      nameEl.value='';
      (_cache.details[eventId]=_cache.details[eventId]||{});
      (_cache.details[eventId].documents=_cache.details[eventId].documents||[]).unshift({name:name,file_type:typeEl.value,status:statEl.value});
      var list=document.getElementById('doc-list-'+eventId);
      var empty=list.querySelector('p');if(empty)empty.remove();
      var row=document.createElement('div');row.className='doc-row';
      row.innerHTML='<span class="doc-type">'+typeEl.value+'</span><span>'+name+'</span><span style="color:#7A6E5E;font-size:0.8rem;margin-left:auto;">'+statEl.value+'</span>';
      list.prepend(row);
    });
}

/* ── Quote Details ───────────────────────────────────────────────── */
function _renderQuotes(c) {
  var hasAny=false;
  var html=c.events.map(function(ev){
    var d=_cache.details[ev.id];if(!d||!d.quote)return'';
    hasAny=true;var q=d.quote;
    var sentMsgs=(d.messages||[]).filter(function(m){return m.sender==='Vision Realized';});
    var TIMES=['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
    var fields=[['Event Type',q.event_type],['Service Requested',q.service_type],['Event Date',q.event_date||ev.event_date||'TBD'],['Guest Count',q.guests],['Budget Range',q.budget],['Location',ev.location||q.location],['Venue Status',q.venue_status],['How They Found Us',q.source]];
    return '<div class="panel" style="margin-bottom:16px;"><h3 style="margin-bottom:4px;">'+(ev.event_name||'Event')+'</h3>' +
      '<div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:16px;">'+(ev.event_type||'')+(ev.event_date?' &middot; '+ev.event_date:'')+'</div>' +
      '<h4 style="margin:0 0 12px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Client\'s Submitted Request</h4>' +
      '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;margin-bottom:20px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">'+
          fields.map(function(f){return'<div class="info-row" style="border:none;padding:4px 0;"><span class="info-label">'+f[0]+'</span><span class="info-val">'+(f[1]||'Not specified')+'</span></div>';}).join('')+
        '</div>'+
        (q.vision?'<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(74,39,114,0.1);"><div style="font-size:0.78rem;color:#7a6e5e;margin-bottom:4px;">Client\'s Vision</div><div style="font-size:0.88rem;color:#2e1547;line-height:1.6;">'+q.vision+'</div></div>':'')+
        (q.vibes?'<div style="margin-top:10px;"><span style="font-size:0.78rem;color:#7a6e5e;">Vibes: </span><span style="font-size:0.85rem;color:#2e1547;">'+q.vibes+'</span></div>':'')+
        (q.budget_notes?'<div style="margin-top:6px;"><span style="font-size:0.78rem;color:#7a6e5e;">Budget Notes: </span><span style="font-size:0.85rem;color:#2e1547;">'+q.budget_notes+'</span></div>':'')+
        (q.final_notes?'<div style="margin-top:6px;"><span style="font-size:0.78rem;color:#7a6e5e;">Additional Notes: </span><span style="font-size:0.85rem;color:#2e1547;">'+q.final_notes+'</span></div>':'')+
      '</div>'+
      (sentMsgs.length?'<h4 style="margin:0 0 12px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Sent Quotes / Messages</h4>'+sentMsgs.map(function(m){return'<div style="background:#4a2772;color:white;border-radius:8px;padding:14px 18px;margin-bottom:10px;"><div style="font-size:0.7rem;opacity:0.6;margin-bottom:4px;">Vision Realized'+(m.created_at?' — '+m.created_at:'')+'</div><div style="font-size:0.88rem;line-height:1.6;">'+(m.text||'')+'</div></div>';}).join(''):'')+
      '<h4 style="margin:20px 0 12px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">'+(sentMsgs.length?'Send Another Message':'Send a Quote')+'</h4>' +
      '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;">' +
        '<p style="font-size:0.82rem;color:#7a6e5e;margin-bottom:14px;">Write a quote or response to send to this client.</p>' +
        '<textarea id="quote-response-'+ev.id+'" rows="5" placeholder="Hi '+(c.firstname||'')+', thank you for your interest!…" style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;resize:vertical;outline:none;border-radius:2px;margin-bottom:12px;"></textarea>' +
        '<div style="text-align:right;"><button onclick="_sendQuoteResponse('+ev.id+')" style="padding:9px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;">Send Quote to Client</button></div></div>' +
      '<h4 style="margin:20px 0 12px;font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:#4a2772;">Schedule Consultation</h4>' +
      '<div style="background:#faf7f2;border:1px solid rgba(74,39,114,0.15);border-radius:4px;padding:20px 24px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;">' +
          '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Date</label><input type="date" id="consult-date-'+ev.id+'" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;outline:none;border-radius:2px;"></div>' +
          '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Time</label><select id="consult-time-'+ev.id+'" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;outline:none;border-radius:2px;"><option value="">Select a time</option>'+TIMES.map(function(t){return'<option value="'+t+'">'+formatTime12(t)+'</option>';}).join('')+'</select></div>' +
          '<button onclick="_scheduleConsult('+ev.id+',\''+(c.firstname||'').replace(/'/g,"\\'")+'\')" style="padding:10px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.88rem;cursor:pointer;white-space:nowrap;border-radius:2px;letter-spacing:0.03em;">Schedule</button>' +
        '</div></div>' +
    '</div>';
  }).join('');
  document.getElementById('ctab-quotes').innerHTML = hasAny?html:'<p style="color:#7A6E5E;">No quote requests found for this client.</p>';
}

function _sendQuoteResponse(eventId) {
  var input=document.getElementById('quote-response-'+eventId);
  var text=input?input.value.trim():'';if(!text){if(input)input.focus();return;}
  var btn=input.parentElement.querySelector('button');
  btn.disabled=true;btn.textContent='Sending…';
  fetch(API+'/owner/messages',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({event_id:eventId,sender:'Vision Realized',text:text})})
    .then(function(r){return r.json();}).then(function(d){
      if(!d.success){btn.textContent='Error';btn.disabled=false;return;}
      var msg={sender:'Vision Realized',text:text};
      (_cache.details[eventId]=_cache.details[eventId]||{});
      (_cache.details[eventId].messages=_cache.details[eventId].messages||[]).push(msg);
      var ev=allEvents.find(function(e){return e.id===eventId;});
      if(ev&&ev.status==='Quote Submitted'){
        fetch(API+'/owner/events/'+eventId,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({status:'Consultation'})})
          .then(function(){ev.status='Consultation';updateStatsBar();if(_activeClientId)_openClient(_activeClientId);});
      } else { if(_activeClientId)_openClient(_activeClientId); }
      btn.textContent='Sent!';btn.style.background='#3a7d44';input.value='';
      setTimeout(function(){btn.disabled=false;btn.textContent='Send Quote to Client';btn.style.background='';},2000);
      setTimeout(function(){var btns=document.querySelectorAll('.client-subtab');if(btns[5])_switchSubtab(btns[5],'ctab-quotes');},300);
    }).catch(function(){btn.textContent='Error';btn.disabled=false;});
}

function _scheduleConsult(eventId,clientName){
  var dateEl=document.getElementById('consult-date-'+eventId);
  var timeEl=document.getElementById('consult-time-'+eventId);
  var date=dateEl.value,time=timeEl.value;if(!date){dateEl.focus();return;}
  var displayTime=time?formatTime12(time):'';
  var title='Consultation with '+(clientName||'client')+(displayTime?' at '+displayTime:'');
  fetch(API+'/owner/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({event_id:eventId,title:title,due_date:date})})
    .then(function(r){return r.json();}).then(function(d){
      if(!d.success)return;
      dateEl.value='';timeEl.value='';
      fetch(API+'/owner/messages',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({event_id:eventId,sender:'Vision Realized',text:'Your consultation has been scheduled for '+date+(displayTime?' at '+displayTime:'')+'. We look forward to speaking with you!'})});
      alert('Consultation scheduled! A task has been created and the client has been notified.');
      if(_activeClientId)_openClient(_activeClientId);
    });
}

/* ── Reviews ─────────────────────────────────────────────────────── */
function _renderReviews(c) {
  var reviews=c.events.reduce(function(acc,ev){
    var d=_cache.details[ev.id];
    if(d&&d.rating)acc.push({stars:d.rating.stars,comment:d.rating.comment||'',eventName:ev.event_name||'Event',eventType:ev.event_type||'',eventDate:ev.event_date||'',createdAt:d.rating.created_at||''});
    return acc;
  },[]);
  if(!reviews.length){document.getElementById('ctab-reviews').innerHTML='<div style="text-align:center;padding:48px 24px;"><div style="font-size:2.5rem;margin-bottom:12px;">⭐</div><p style="color:#7a6e5e;font-size:0.92rem;">No reviews submitted yet.</p></div>';return;}
  var total=reviews.reduce(function(s,r){return s+r.stars;},0);
  var avg=(total/reviews.length).toFixed(1),avgR=Math.round(parseFloat(avg));
  var stars=function(n,sz){return[1,2,3,4,5].map(function(s){return'<span style="font-size:'+sz+';color:'+(s<=n?'#c49a2a':'#ddd')+';">&#9733;</span>';}).join('');};
  var html='<div class="panel" style="margin-bottom:20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;">' +
    '<div style="text-align:center;min-width:72px;"><div style="font-size:2.2rem;font-family:\'Cormorant Garamond\',serif;color:#4a2772;font-weight:700;line-height:1;">'+avg+'</div><div style="font-size:0.72rem;color:#7a6e5e;margin-top:2px;">avg rating</div></div>' +
    '<div>'+stars(avgR,'1.6rem')+'<div style="font-size:0.78rem;color:#7a6e5e;margin-top:4px;">'+reviews.length+' review'+(reviews.length!==1?'s':'')+'</div></div></div>';
  html+=reviews.map(function(rev){
    return '<div class="panel" style="margin-bottom:14px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:10px;">' +
        '<div><div style="font-size:0.9rem;font-weight:600;color:#2e1547;margin-bottom:2px;">'+rev.eventName+'</div>' +
        '<div style="font-size:0.72rem;color:#7a6e5e;">'+rev.eventType+(rev.eventDate?' &middot; '+rev.eventDate:'')+'</div></div>' +
        '<div style="text-align:right;">'+stars(rev.stars,'1.15rem')+'<div style="font-size:0.7rem;color:#9a8e7e;margin-top:2px;">'+rev.stars+' / 5</div></div>' +
      '</div>' +
      (rev.comment?'<blockquote style="margin:0;padding:12px 16px;background:#faf7f2;border-left:3px solid #4a2772;font-size:0.88rem;color:#3a2e22;line-height:1.6;font-style:italic;">'+rev.comment+'</blockquote>':'')+
      (rev.createdAt?'<div style="font-size:0.68rem;color:#9a8e7e;margin-top:8px;text-align:right;">'+rev.createdAt+'</div>':'')+
    '</div>';
  }).join('');
  document.getElementById('ctab-reviews').innerHTML = html;
}
