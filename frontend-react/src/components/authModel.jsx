import { useState } from 'react';

export default function AuthModal({ auth, onClose }) {
  const [tab,      setTab]      = useState('login');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [loginForm,    setLoginForm]    = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await auth.login(loginForm.username, loginForm.password);
    if (err) setError(err);
    else onClose();
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await auth.register(registerForm.username, registerForm.email, registerForm.password);
    if (err) setError(err);
    else onClose();
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            Login
          </button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <form className="tab-content" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
            />
            <button className="modal-submit" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {error && <p className="modal-error">{error}</p>}
          </form>
        ) : (
          <form className="tab-content" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={registerForm.username}
              onChange={e => setRegisterForm(p => ({ ...p, username: e.target.value }))}
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
            />
            <input
              type="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
            />
            <button className="modal-submit" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            {error && <p className="modal-error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}