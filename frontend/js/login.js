
const API_BASE_URL = 'http://127.0.0.1:5000';

const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login`;

const loginForm   = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg    = document.getElementById('errorMsg');
const submitBtn   = document.getElementById('submitBtn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  setLoading(true);

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || data.error || 'Invalid credentials. Please try again.');
      setLoading(false);
      return;
    }

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    const role = data.user?.role?.toLowerCase();

    if (role === 'owner') {
      window.location.href = '/pages/dashboard-owner.html';
    } else {
      window.location.href = '/pages/dashboard-client.html';
    }

  } catch (err) {
    showError('Could not connect to the server. Please try again later.');
    setLoading(false);
  }
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('visible');
  usernameInput.classList.add('input-error');
  passwordInput.classList.add('input-error');
}

function clearError() {
  errorMsg.classList.remove('visible');
  usernameInput.classList.remove('input-error');
  passwordInput.classList.remove('input-error');
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('loading', isLoading);
}

(function checkAuth() {
  const token = localStorage.getItem('access_token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  if (token && user) {
    const role = user.role?.toLowerCase();
    if (role === 'owner') {
      window.location.href = '/pages/dashboard-owner.html';
    } else {
      window.location.href = '/pages/dashboard-client.html';
    }
  }
})();