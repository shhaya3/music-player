const API_BASE = 'http://localhost:5000';

const loggedOutView   = document.getElementById('logged-out-view');
const loggedInView    = document.getElementById('logged-in-view');
const profileUsername = document.getElementById('profile-username');
const authModal        = document.getElementById('auth-modal');
const lastfmStatus     = document.getElementById('lastfm-status');
const loginBtn          = document.getElementById('btn-login');
const modalClose         = document.getElementById('close-modal');
const tabBtn            = document.querySelectorAll('.tab-btn');
const tabContent        = document.querySelectorAll('.tab-content');
const registerBtn        = document.getElementById('submit-register');
const scanBtn = document.getElementById('btn-scan');
const toggleProfile = document.getElementById('profile-toggle');

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// ── Open / close modal ──
loginBtn.addEventListener('click', () => {
    authModal.hidden = false;
});

modalClose.addEventListener('click', () => {
    authModal.hidden = true;
});

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.hidden = true;
});

// ── Tab switching ──
tabBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtn.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabContent.forEach(t => t.hidden = true);
        document.getElementById(`${btn.dataset.tab}-tab`).hidden = false;
    });
});

// ── Register ──
registerBtn.addEventListener('click', async () => {
    const username = document.getElementById('register-username').value.trim();
    const email    = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorEl  = document.getElementById('register-error');

    if (!username || !email || !password) {
        errorEl.textContent = 'All fields are required';
        return;
    }

    try {
        const res  = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error || 'Registration failed';
            return;
        }

        await loginUser(username, password);
    } catch (err) {
        errorEl.textContent = 'Could not reach server';
    }
});

// ── Login ──
document.getElementById('submit-login').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    await loginUser(username, password);
});

async function loginUser(username, password) {
    const errorEl = document.getElementById('login-error');
    try {
        const res  = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error || 'Login failed';
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);

        authModal.hidden = true;
        updateProfileUI();
    } catch (err) {
        errorEl.textContent = 'Could not reach server';
    }
}

// ── Logout ──
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    updateProfileUI();
});

// ── Update sidebar based on login state ──
function updateProfileUI() {
    if (isLoggedIn()) {
        loggedOutView.hidden = true;
        loggedInView.hidden  = false;
        profileUsername.textContent = localStorage.getItem('username');
        checkLastfmStatus();
    } else {
        loggedOutView.hidden = false;
        loggedInView.hidden  = true;
    }
}

// ── Last.fm connect ──
document.getElementById('btn-lastfm').addEventListener('click', async () => {
    if (lastfmStatus.textContent === 'Connected') return;

    const res  = await fetch(`${API_BASE}/api/lastfm/connect`, { headers: authHeaders() });
    const data = await res.json();
    if (data.auth_url) {
        window.location.href = data.auth_url;
    }
});

async function checkLastfmStatus() {
    try {
        const res  = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
        const data = await res.json();
        if (data.lastfm_connected) {
            lastfmStatus.textContent = 'Connected';
            document.getElementById('btn-lastfm').classList.add('connected');
        }
    } catch (err) {
        console.log('could not check lastfm status', err);
    }
}

// ── Run on page load ──
updateProfileUI();

// ── Handle redirect back from Last.fm ──
const params = new URLSearchParams(window.location.search);
if (params.get('lastfm') === 'connected') {
    checkLastfmStatus();
    window.history.replaceState({}, '', window.location.pathname);
}

scanBtn.addEventListener('click', async () => {
    const originalText = scanBtn.innerHTML;
    scanBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Scanning...';
    scanBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/admin/scan`, { headers: authHeaders() });
        const data = await res.json();

        alert(`Added: ${data.added} | Removed: ${data.removed}${data.errors.length ? `\nErrors: ${data.errors.length}` : ''}`);
        loadLibrary();
    } catch (err) {
        alert("Scan Failed - check console");
        console.log(err)
    } finally {
        scanBtn.innerHTML = originalText;
        scanBtn.disabled = false;
    }
});

toggleProfile.addEventListener('click', () => {
  const dropdown = document.getElementById('profile-dropdown');
  const chevron  = document.getElementById('profile-chevron');
  dropdown.hidden = !dropdown.hidden;
  chevron.classList.toggle('rotated', !dropdown.hidden);
});