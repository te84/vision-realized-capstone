var _galleryPhotoData = '';

/* ── Entry point ─────────────────────────────────────────────────── */
function galleryTabInit(container) {
  container.innerHTML =
    '<div class="owner-header"><h1>' + buildGreeting() + '</h1><p>Add and manage your event gallery photos.</p></div>' +
    '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.6rem;color:#2e1547;font-style:italic;margin-bottom:16px;">Gallery Management</h2>' +

    // Add photo panel
    '<div class="panel" style="margin-bottom:24px;">' +
      '<h3 style="margin-bottom:14px;">Add New Photo</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;">' +
        '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Title</label>' +
          '<input id="gallery-title" placeholder="e.g. Johnson Corporate Gala" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;" /></div>' +
        '<div><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Category</label>' +
          '<select id="gallery-category" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;">' +
            '<option>Corporate</option><option>Social</option><option>Gala</option><option>Party</option>' +
          '</select></div>' +
        '<div style="grid-column:1/-1;"><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Description (optional)</label>' +
          '<input id="gallery-desc" placeholder="Brief description of the event" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1.5px solid rgba(74,39,114,0.2);background:#fffdf9;font-family:inherit;font-size:0.88rem;" /></div>' +
        '<div style="grid-column:1/-1;"><label style="font-size:0.78rem;color:#7a6e5e;display:block;margin-bottom:4px;">Upload Photo</label>' +
          '<div id="gallery-upload-area" style="border:2px dashed rgba(74,39,114,0.25);border-radius:4px;padding:24px;text-align:center;cursor:pointer;background:#fffdf9;" onclick="document.getElementById(\'gallery-file-input\').click()">' +
            '<input type="file" id="gallery-file-input" accept="image/*" style="display:none;" onchange="_previewGalleryPhoto(this)" />' +
            '<div id="gallery-upload-text" style="font-size:0.85rem;color:#7a6e5e;">Click to select a photo</div>' +
            '<div style="font-size:0.75rem;color:#9a8fb5;margin-top:4px;">JPG or PNG</div>' +
          '</div>' +
          '<div id="gallery-preview" style="margin-top:10px;display:none;">' +
            '<img id="gallery-preview-img" style="max-width:200px;max-height:150px;border-radius:4px;border:1px solid #efe6dc;" />' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:14px;text-align:right;">' +
        '<button id="gallery-add-btn" onclick="_addGalleryItem()" style="padding:9px 22px;background:#4a2772;color:#fff;border:none;font-family:inherit;font-size:0.85rem;letter-spacing:0.05em;cursor:pointer;">Add to Gallery</button>' +
      '</div>' +
    '</div>' +

    '<h3 style="font-family:\'Cormorant Garamond\',serif;font-size:1.3rem;color:#2e1547;font-style:italic;margin-bottom:14px;">Current Gallery</h3>' +
    '<div id="gallery-admin-grid" style="display:flex;flex-wrap:wrap;gap:16px;"><p style="color:#7a6e5e;">Loading…</p></div>';

  _loadGalleryAdmin();
}

/* ── Preview ─────────────────────────────────────────────────────── */
function _previewGalleryPhoto(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    _galleryPhotoData = e.target.result;
    document.getElementById('gallery-preview').style.display = 'block';
    document.getElementById('gallery-preview-img').src = _galleryPhotoData;
    document.getElementById('gallery-upload-text').textContent = input.files[0].name;
  };
  reader.readAsDataURL(input.files[0]);
}

/* ── Add ─────────────────────────────────────────────────────────── */
function _addGalleryItem() {
  var title    = document.getElementById('gallery-title').value.trim();
  var category = document.getElementById('gallery-category').value;
  var desc     = document.getElementById('gallery-desc').value.trim();
  if (!title) { document.getElementById('gallery-title').focus(); return; }
  if (!_galleryPhotoData) { alert('Please select a photo to upload.'); return; }

  var btn = document.getElementById('gallery-add-btn');
  btn.disabled = true; btn.textContent = 'Uploading…';

  fetch(API + '/owner/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ title: title, category: category, description: desc, image_url: _galleryPhotoData })
  }).then(function (r) { return r.json(); }).then(function (data) {
    if (data.success) {
      btn.textContent = 'Added!'; btn.style.background = '#3a7d44';
      document.getElementById('gallery-title').value = '';
      document.getElementById('gallery-desc').value = '';
      document.getElementById('gallery-file-input').value = '';
      document.getElementById('gallery-preview').style.display = 'none';
      document.getElementById('gallery-upload-text').textContent = 'Click to select a photo';
      _galleryPhotoData = '';
      _loadGalleryAdmin();
      setTimeout(function () { btn.disabled = false; btn.textContent = 'Add to Gallery'; btn.style.background = ''; }, 2000);
    } else { btn.textContent = 'Error'; btn.disabled = false; }
  }).catch(function () { btn.textContent = 'Error'; btn.disabled = false; });
}

/* ── Delete ──────────────────────────────────────────────────────── */
function _deleteGalleryItem(id) {
  if (!confirm('Remove this photo from the gallery?')) return;
  fetch(API + '/owner/gallery/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (r) { return r.json(); })
    .then(function (data) { if (data.success) _loadGalleryAdmin(); });
}

/* ── Load & render ───────────────────────────────────────────────── */
function _loadGalleryAdmin() {
  fetch(API + '/gallery')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var grid = document.getElementById('gallery-admin-grid');
      if (!grid) return;
      if (!data.success || !data.items || !data.items.length) {
        grid.innerHTML = '<p style="color:#7a6e5e;">No gallery photos yet. Add your first one above.</p>';
        return;
      }
      grid.innerHTML = data.items.map(function (item) {
        return '<div style="width:220px;background:white;border:1px solid rgba(74,39,114,0.1);border-radius:4px;overflow:hidden;">' +
          '<img src="' + item.image_url + '" style="width:100%;height:150px;object-fit:cover;" onerror="this.style.background=\'#e8e0d4\'" />' +
          '<div style="padding:12px;">' +
            '<div style="font-weight:500;font-size:0.88rem;color:#2e1547;margin-bottom:4px;">' + item.title + '</div>' +
            '<span style="font-size:0.7rem;padding:2px 8px;background:rgba(74,39,114,0.08);color:#4a2772;border-radius:10px;">' + (item.category || '') + '</span>' +
            (item.description ? '<div style="font-size:0.78rem;color:#7a6e5e;margin-top:6px;">' + item.description + '</div>' : '') +
            '<button onclick="_deleteGalleryItem(' + item.id + ')" style="margin-top:10px;background:none;border:1px solid #c0392b;color:#c0392b;padding:4px 12px;font-size:0.75rem;cursor:pointer;font-family:inherit;border-radius:2px;">Remove</button>' +
          '</div></div>';
      }).join('');
    });
}
