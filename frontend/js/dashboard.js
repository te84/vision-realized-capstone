const API_BASE_URL = 'http://127.0.0.1:5000';

function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

function logout() {
  clearSession();
  window.location.href = '/pages/login.html';
}

const token = localStorage.getItem('access_token');
const user  = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location.href = '/pages/login.html';
}

document.addEventListener('DOMContentLoaded', () => {

  const avatarEl = document.getElementById('dashAvatar');
  if (avatarEl && user) {
    const initials = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase()
                     || user.username?.[0]?.toUpperCase()
                     || '?';
    avatarEl.textContent = initials;
  }

  const nameEl = document.getElementById('dashUserName');
  if (nameEl && user) {
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username;
    nameEl.textContent = fullName;
  }

  const roleEl = document.getElementById('dashRoleBadge');
  if (roleEl && user) {
    roleEl.textContent = user.role || 'User';
    roleEl.classList.add(user.role?.toLowerCase() === 'owner' ? 'owner' : 'client');
  }

  const greetingNameEl = document.getElementById('greetingName');
  if (greetingNameEl && user) {
    greetingNameEl.textContent = user.firstname || user.username || 'there';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
