/* ═══════════════════════════════════════════════════════
   ui.js — Shared UI: Sidebar, Topbar, Toast, Modals,
           formatters, and utility helpers
═══════════════════════════════════════════════════════ */

// Toast 
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.id = 'toast-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = 'info', duration = 4000) {
    const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;
    this._getContainer().appendChild(el);
    if (duration > 0) setTimeout(() => el.remove(), duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  info:    (msg) => Toast.show(msg, 'info'),
  warning: (msg) => Toast.show(msg, 'warning'),
};
window.Toast = Toast;

// Sidebar renderer 
function renderSidebar(navItems, portalClass = '') {
  const user = Auth.getUser();
  if (!user) return;

  const currentPage = window.location.pathname;

  const navHTML = navItems.map(item => `
    <a href="${item.href}" class="nav-item ${currentPage.includes(item.match) ? 'active' : ''}">
      ${item.label}
    </a>
  `).join('');

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.className = `sidebar ${portalClass}`;
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div>
        <div class="logo-text">HealthCare<span style="font-size:0.65em;font-weight:400;color:var(--text-muted);margin-left:4px;vertical-align:middle;">portal</span></div>
        <div class="logo-sub">${capitalizeRole(user.role)} Portal</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${navHTML}
    </nav>
    <div class="sidebar-user">
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-role">${capitalizeRole(user.role)}</div>
      </div>
      <button class="logout-btn" title="Logout" onclick="Auth.logout()">&#9211;</button>
    </div>
  `;
}
window.renderSidebar = renderSidebar;

// Topbar renderer 
function renderTopbar(title, subtitle = '') {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  topbar.innerHTML = `
    <div>
      <div class="topbar-title">${title}</div>
      ${subtitle ? `<div class="topbar-subtitle">${subtitle}</div>` : `<div class="topbar-subtitle">${today}</div>`}
    </div>
    </div>
  `;
}
window.renderTopbar = renderTopbar;

// Modal helpers 
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  document.body.style.overflow = '';
}
// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('show');
    document.body.style.overflow = '';
  }
});
window.openModal = openModal;
window.closeModal = closeModal;

// Loading helpers 
function setLoading(container, show) {
  if (show) {
    container.innerHTML = `<div class="loading-center"><div class="spinner spinner-lg"></div></div>`;
  }
}
window.setLoading = setLoading;

// Formatters 
function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function capitalizeRole(role) {
  return role === 'staff' ? 'Reception' : role ? (role.charAt(0).toUpperCase() + role.slice(1)) : '';
}

function statusBadge(status) {
  const map = {
    pending:    'badge-pending',
    waiting:    'badge-waiting',
    inProgress: 'badge-inprogress',
    done:       'badge-done',
    cancelled:  'badge-cancelled',
  };
  const labels = {
    pending: 'Pending', waiting: 'Waiting', inProgress: 'In Progress', done: 'Done', cancelled: 'Cancelled'
  };
  return `<span class="badge ${map[status] || ''}">${labels[status] || status}</span>`;
}

function feeBadge(feePaid) {
  return feePaid
    ? `<span class="badge badge-paid">Paid</span>`
    : `<span class="badge badge-unpaid">Unpaid</span>`;
}

function uploadTypeLabel(type) {
  const map = { labReport: 'Lab Report', scan: 'Scan', prescription: 'Prescription', other: 'Other' };
  return map[type] || type;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.capitalizeRole = capitalizeRole;
window.statusBadge = statusBadge;
window.feeBadge = feeBadge;
window.uploadTypeLabel = uploadTypeLabel;
window.formatFileSize = formatFileSize;
window.timeAgo = timeAgo;

// Empty state renderer 
function emptyState(icon, title, subtitle = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-text">${title}</div>
      ${subtitle ? `<div class="empty-state-sub">${subtitle}</div>` : ''}
    </div>
  `;
}
window.emptyState = emptyState;

// Confirm dialog helper 
function confirmAction(message, onConfirm) {
  // Simple native confirm for now; can be replaced with custom modal
  if (window.confirm(message)) onConfirm();
}
window.confirmAction = confirmAction;

// Markdown-lite renderer (for AI chat) 
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}
window.renderMarkdown = renderMarkdown;

console.log('HealthCare Portal UI helpers loaded');
