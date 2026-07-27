/* ═══════════════════════════════════════════════════════
   auth.js — JWT management and role-based redirects
═══════════════════════════════════════════════════════ */

const Auth = {
  // Save login data
  login(token, user) {
    localStorage.setItem('hc_token', token);
    localStorage.setItem('hc_user', JSON.stringify(user));
  },

  // Helper to get correct path regardless of file:// or http://
  getClientUrl(path) {
    const href = window.location.href;
    const idx = href.indexOf('/client/');
    if (idx !== -1) {
      return href.substring(0, idx + 8) + path;
    }
    return '/' + path; // fallback
  },

  // Get stored user object
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('hc_user'));
    } catch {
      return null;
    }
  },

  // Get token
  getToken() {
    return localStorage.getItem('hc_token');
  },

  // Clear session and redirect to login
  logout() {
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_user');
    window.location.href = this.getClientUrl('login.html');
  },

  // Require auth — call at top of every protected page
  // role: 'patient' | 'doctor' | 'staff' — if null, any authenticated user passes
  require(role = null) {
    const token = this.getToken();
    const user  = this.getUser();
    if (!token || !user) {
      window.location.href = this.getClientUrl('login.html');
      return null;
    }
    if (role && user.role !== role) {
      // Wrong portal — redirect to correct one
      this.redirectToPortal(user.role);
      return null;
    }
    return user;
  },

  // Redirect based on role
  redirectToPortal(role) {
    const map = {
      patient:  'patient/dashboard.html',
      doctor:   'doctor/dashboard.html',
      staff:    'reception/dashboard.html',
    };
    const path = map[role] || 'login.html';
    window.location.href = this.getClientUrl(path);
  },

  // If already logged in, redirect away from auth pages
  redirectIfLoggedIn() {
    const token = this.getToken();
    const user  = this.getUser();
    if (token && user) {
      this.redirectToPortal(user.role);
    }
  },

  // Initials from name for avatar
  getInitials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },
};

window.Auth = Auth;
