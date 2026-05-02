var _calDate = new Date();

function calendarTabInit(container) {
  container.innerHTML =
    '<div class="owner-header"><h1>' + buildGreeting() + '</h1><p>View upcoming events and task deadlines.</p></div>' +
    '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.6rem;color:#2e1547;font-style:italic;margin-bottom:16px;">Calendar</h2>' +
    '<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">' +
      '<button onclick="_calNav(-1)" style="padding:6px 14px;background:none;border:1px solid rgba(74,39,114,0.2);font-family:inherit;font-size:0.85rem;cursor:pointer;color:#4a2772;">&larr;</button>' +
      '<span id="cal-month-label" style="font-family:\'Cormorant Garamond\',serif;font-size:1.3rem;color:#2e1547;font-style:italic;min-width:180px;text-align:center;"></span>' +
      '<button onclick="_calNav(1)"  style="padding:6px 14px;background:none;border:1px solid rgba(74,39,114,0.2);font-family:inherit;font-size:0.85rem;cursor:pointer;color:#4a2772;">&rarr;</button>' +
    '</div>' +
    '<div id="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:rgba(74,39,114,0.1);border:1px solid rgba(74,39,114,0.1);"></div>' +
    '<div id="cal-day-detail" style="margin-top:20px;"></div>';

  _drawCalGrid();
}

function _calNav(dir) {
  _calDate.setMonth(_calDate.getMonth() + dir);
  _drawCalGrid();
}

function _drawCalGrid() {
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var year = _calDate.getFullYear(), month = _calDate.getMonth();
  var label = document.getElementById('cal-month-label');
  if (label) label.textContent = MONTHS[month] + ' ' + year;

  // Build items directly from cache — zero extra fetches
  var calEvents = [], calTasks = [];
  allEvents.forEach(function (ev) {
    if (ev.event_date) calEvents.push({ date: ev.event_date, title: ev.event_name||'Event', client: (ev.firstname||'')+' '+(ev.lastname||''), type: 'event', status: ev.status });
    var d = _cache.details[ev.id];
    if (d) d.tasks.forEach(function (t) {
      if (t.due_date) calTasks.push({ date: t.due_date, title: t.title, completed: t.completed, type: 'task' });
    });
  });

  var grid = document.getElementById('cal-grid');
  if (!grid) return;
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();

  var html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function (d) {
    return '<div style="background:#4a2772;color:white;padding:8px;text-align:center;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;">' + d + '</div>';
  }).join('');

  for (var i = 0; i < firstDay; i++) html += '<div style="background:#faf7f2;padding:8px;min-height:80px;"></div>';

  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    var isToday = dateStr === todayStr;
    var items = calEvents.filter(function(e){return e.date===dateStr;}).concat(calTasks.filter(function(t){return t.date===dateStr;}));

    html += '<div style="background:' + (isToday?'#f0e6f6':'white') + ';padding:6px 8px;min-height:80px;cursor:pointer;" onclick="_showCalDay(\'' + dateStr + '\',JSON.parse(decodeURIComponent(\'' + encodeURIComponent(JSON.stringify({events:calEvents,tasks:calTasks})) + '\')))">';
    html += '<div style="font-size:0.82rem;font-weight:' + (isToday?'600':'400') + ';color:' + (isToday?'#4a2772':'#2e1547') + ';margin-bottom:4px;">' + day + '</div>';
    items.slice(0,3).forEach(function(item){
      var dot = item.type==='event'?'#4a2772':(item.completed?'#3a7d44':'#e65100');
      html += '<div style="font-size:0.62rem;color:#2e1547;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">' +
        '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:'+dot+';margin-right:4px;vertical-align:middle;"></span>' + item.title + '</div>';
    });
    if (items.length>3) html += '<div style="font-size:0.6rem;color:#7a6e5e;">+' + (items.length-3) + ' more</div>';
    html += '</div>';
  }
  grid.innerHTML = html;

  // Store for day-detail clicks
  grid._calData = { events: calEvents, tasks: calTasks };
}

function _showCalDay(dateStr, calData) {
  // calData passed inline to avoid global — fall back to grid attribute
  var grid = document.getElementById('cal-grid');
  var data = calData || (grid && grid._calData) || { events: [], tasks: [] };
  var detail = document.getElementById('cal-day-detail');
  if (!detail) return;

  var items = data.events.filter(function(e){return e.date===dateStr;})
    .concat(data.tasks.filter(function(t){return t.date===dateStr;}));

  var p = dateStr.split('-');
  var dateObj = new Date(p[0], p[1]-1, p[2]);
  var dateLabel = dateObj.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  if (!items.length) { detail.innerHTML='<div class="panel"><p style="color:#7a6e5e;">Nothing scheduled for ' + dateLabel + '</p></div>'; return; }

  var html = '<div class="panel"><h3 style="margin-bottom:14px;">' + dateLabel + '</h3>';
  items.forEach(function(item){
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(74,39,114,0.08);">';
    if (item.type==='event') {
      html += '<span style="width:8px;height:8px;border-radius:50%;background:#4a2772;flex-shrink:0;"></span>' +
        '<div><div style="font-weight:500;color:#2e1547;">' + item.title + '</div>' +
        '<div style="font-size:0.78rem;color:#7a6e5e;">' + item.client + ' &middot; <span class="status-badge ' + badgeClass(item.status) + '" style="font-size:0.65rem;">' + statusLabel(item.status) + '</span></div></div>';
    } else {
      html += '<span style="width:8px;height:8px;border-radius:50%;background:' + (item.completed?'#3a7d44':'#e65100') + ';flex-shrink:0;"></span>' +
        '<div><div style="font-weight:500;color:#2e1547;' + (item.completed?'text-decoration:line-through;opacity:0.6;':'') + '">' + item.title + '</div>' +
        '<div style="font-size:0.78rem;color:#7a6e5e;">' + (item.completed?'Completed':'Task') + '</div></div>';
    }
    html += '</div>';
  });
  detail.innerHTML = html + '</div>';
}
