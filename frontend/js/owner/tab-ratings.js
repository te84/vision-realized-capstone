function ratingsTabInit(container) {
  container.innerHTML =
    '<div class="owner-header"><h1>' + buildGreeting() + '</h1><p>View all client ratings and reviews.</p></div>' +
    '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.6rem;color:#2e1547;font-style:italic;margin-bottom:16px;">Client Ratings</h2>' +
    '<div id="ratings-summary-bar" style="display:none;"></div>' +
    '<div id="ratings-list"></div>';

  // Pull ratings straight from cache — no fetch
  var rated = [];
  allEvents.forEach(function (ev) {
    var d = _cache.details[ev.id];
    if (d && d.rating) rated.push({ event: ev, rating: d.rating });
  });
  _renderRatings(rated);
}

function _renderRatings(rated) {
  var summaryBar = document.getElementById('ratings-summary-bar');
  var list       = document.getElementById('ratings-list');
  if (!summaryBar || !list) return;

  if (!rated.length) {
    summaryBar.style.display = 'none';
    list.innerHTML = '<div style="text-align:center;padding:48px 24px;"><div style="font-size:2.5rem;margin-bottom:12px;">⭐</div><p style="color:#7a6e5e;font-size:0.92rem;">No client ratings have been submitted yet.</p></div>';
    return;
  }

  var total = rated.reduce(function (s,r){return s+r.rating.stars;},0);
  var avg   = (total/rated.length).toFixed(1);
  var avgR  = Math.round(parseFloat(avg));
  var starHTML = function(n,sz){return[1,2,3,4,5].map(function(s){return'<span style="font-size:'+sz+';color:'+(s<=n?'#c49a2a':'#ddd')+';">&#9733;</span>';}).join('');};

  summaryBar.style.cssText = 'display:flex;align-items:center;gap:20px;flex-wrap:wrap;background:#fff;border:1px solid rgba(74,39,114,0.12);padding:20px 24px;margin-bottom:24px;';
  summaryBar.innerHTML =
    '<div style="text-align:center;min-width:72px;"><div style="font-size:2.6rem;font-family:\'Cormorant Garamond\',serif;color:#4a2772;font-weight:700;line-height:1;">'+avg+'</div><div style="font-size:0.72rem;color:#7a6e5e;margin-top:2px;">avg rating</div></div>' +
    '<div>'+starHTML(avgR,'1.8rem')+'<div style="font-size:0.8rem;color:#7a6e5e;margin-top:4px;">'+rated.length+' review'+(rated.length!==1?'s':'')+'</div></div>';

  rated.sort(function(a,b){return new Date(b.rating.created_at)-new Date(a.rating.created_at);});

  list.innerHTML = rated.map(function(item){
    var ev=item.event, rt=item.rating;
    var dateStr=rt.created_at?new Date(rt.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'';
    return '<div class="panel" style="margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px;">' +
        '<div><div style="font-size:1rem;font-weight:600;color:#2e1547;margin-bottom:2px;">'+(ev.firstname||'')+' '+(ev.lastname||'')+'</div>' +
          '<div style="font-size:0.78rem;color:#7a6e5e;">'+(ev.event_name||'Event')+(ev.event_type?' &middot; '+ev.event_type:'')+(ev.event_date?' &middot; '+ev.event_date:'')+'</div></div>' +
        '<div style="text-align:right;">'+starHTML(rt.stars,'1.3rem')+'<div style="font-size:0.7rem;color:#9a8e7e;margin-top:2px;">'+rt.stars+' / 5</div></div>' +
      '</div>' +
      (rt.comment?'<blockquote style="margin:0;padding:12px 16px;background:#faf7f2;border-left:3px solid #4a2772;font-size:0.88rem;color:#3a2e22;line-height:1.6;font-style:italic;">'+rt.comment+'</blockquote>':'')+
      (dateStr?'<div style="font-size:0.7rem;color:#9a8e7e;margin-top:8px;text-align:right;">Submitted '+dateStr+'</div>':'')+
    '</div>';
  }).join('');
}
