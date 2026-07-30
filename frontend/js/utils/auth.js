// auth.js
// Handles login, register, logout, profile UI, and Last.fm connect.
// Depends on: api.js

import {
  apiLogin, apiRegister, apiFetchMe,
  apiGetLastfmConnectUrl, apiScanLibrary,
  isLoggedIn, getToken, apiFetch
} from '../api/api.js';

// DOM elements 

const loggedOutView   = document.getElementById('logged-out-view');
const loggedInView    = document.getElementById('logged-in-view');
const profileUsername = document.getElementById('profile-username');
const profileToggle   = document.getElementById('profile-toggle');
const profileDropdown = document.getElementById('profile-dropdown');
const profileChevron  = document.getElementById('profile-chevron');
const lastfmStatus    = document.getElementById('lastfm-status');
const lastfmBtn       = document.getElementById('btn-lastfm');
const logoutBtn       = document.getElementById('btn-logout');
const scanBtn         = document.getElementById('btn-scan');
const loginBtn        = document.getElementById('btn-login');
const authModal       = document.getElementById('auth-modal');
const modalClose      = document.getElementById('close-modal');
const tabBtns         = document.querySelectorAll('.tab-btn');
const tabContents     = document.querySelectorAll('.tab-content');

// Modal open / close 

loginBtn.addEventListener('click', () => { authModal.hidden = false; });
modalClose.addEventListener('click', () => { authModal.hidden = true; });
authModal.addEventListener('click', e => {
  if (e.target === authModal) authModal.hidden = true;
});

// Tab switching 

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabContents.forEach(t => t.hidden = true);
    document.getElementById(`${btn.dataset.tab}-tab`).hidden = false;
  });
});

// Register 

document.getElementById('submit-register').addEventListener('click', async () => {
  const username = document.getElementById('register-username').value.trim();
  const email    = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const errorEl  = document.getElementById('register-error');

  errorEl.textContent = '';
  if (!username || !email || !password) {
    errorEl.textContent = 'All fields are required';
    return;
  }

  const { data, ok } = await apiRegister(username, email, password);
  if (!ok) { errorEl.textContent = data.error || 'Registration failed'; return; }
  await performLogin(username, password, errorEl);
});

// Login 

document.getElementById('submit-login').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  errorEl.textContent = '';
  await performLogin(username, password, errorEl);
});

async function performLogin(username, password, errorEl) {
  const { data, ok } = await apiLogin(username, password);
  if (!ok) { errorEl.textContent = data.error || 'Login failed'; return; }

  localStorage.setItem('token', data.token);
  localStorage.setItem('username', data.username);
  authModal.hidden = true;
  await updateProfileUI();

  // refresh playlists after login — sidebar.js listens for this event
  document.dispatchEvent(new CustomEvent('userLoggedIn'));
}

// Logout 

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  updateProfileUI();
  document.dispatchEvent(new CustomEvent('userLoggedOut'));
});

// Profile dropdown 

profileToggle.addEventListener('click', () => {
  const isOpen = !profileDropdown.hidden;
  profileDropdown.hidden = isOpen;
  profileChevron.classList.toggle('rotated', !isOpen);
});

// Scan library 

scanBtn.addEventListener('click', async () => {
  const originalHtml = scanBtn.innerHTML;
  scanBtn.innerHTML  = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Scanning...';
  scanBtn.disabled   = true;

  try {
    const data = await apiScanLibrary();
    alert(`Scan complete!\nAdded: ${data.added} | Removed: ${data.removed || 0}`);
    document.dispatchEvent(new CustomEvent('libraryScanned'));
  } catch (err) {
    alert('Scan failed — check console');
    console.error(err);
  } finally {
    scanBtn.innerHTML = originalHtml;
    scanBtn.disabled  = false;
  }
});

// Last.fm connect 

lastfmBtn.addEventListener('click', async () => {
  if (lastfmStatus.textContent === 'Connected') return;
  const url = await apiGetLastfmConnectUrl();
  if (url) window.location.href = url;
});

async function checkLastfmStatus() {
  const me = await apiFetchMe();
  if (me?.lastfm_connected) {
    lastfmStatus.textContent = 'Connected';
    lastfmBtn.classList.add('connected');
  } else {
    lastfmStatus.textContent = 'Connect Last.fm';
    lastfmBtn.classList.remove('connected');
  }
}

// Update sidebar based on login state 

export async function updateProfileUI() {
  if (isLoggedIn()) {
    loggedOutView.hidden = true;
    loggedInView.hidden  = false;
    profileUsername.textContent = localStorage.getItem('username') || 'User';
    await checkLastfmStatus();
  } else {
    loggedOutView.hidden = false;
    loggedInView.hidden  = true;
    profileDropdown.hidden = true;
    profileChevron.classList.remove('rotated');
  }
}

// Handle Last.fm redirect back 

const params = new URLSearchParams(window.location.search);
if (params.get('lastfm') === 'connected') {
  checkLastfmStatus();
  window.history.replaceState({}, '', window.location.pathname);
}

document.addEventListener('authExpired', () => {
  updateProfileUI();
  document.dispatchEvent(new CustomEvent('userLoggedOut'));
  // show modal so user knows they need to log in
  authModal.hidden = false;
  document.getElementById('login-error').textContent =
    'Your session expired — please log in again';
});

// Run on page load 

updateProfileUI();