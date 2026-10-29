/**
 * Animal Rescue Connect - Common Utilities & Helpers
 */

// Toast notification helper
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;

  let icon = 'bi-info-circle-fill text-primary';
  if (type === 'success') icon = 'bi-check-circle-fill text-success';
  if (type === 'error' || type === 'danger') icon = 'bi-exclamation-triangle-fill text-danger';

  toast.innerHTML = `
    <i class="bi ${icon} fs-4"></i>
    <div class="flex-grow-1">
      ${title ? `<div class="fw-bold mb-1">${title}</div>` : ''}
      <div class="small text-secondary">${message}</div>
    </div>
    <button type="button" class="btn-close btn-close-sm ms-2" onclick="this.parentElement.remove()"></button>
  `;

  container.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Format ISO date into readable friendly format
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

// Generate HTML for Status Badge
function getStatusBadge(status) {
  const safeStatus = status || 'Reported';
  let icon = 'bi-clock-history';
  if (safeStatus === 'Assigned') icon = 'bi-person-check';
  if (safeStatus === 'On the Way') icon = 'bi-truck';
  if (safeStatus === 'Rescued') icon = 'bi-heart-pulse-fill';
  if (safeStatus === 'Treatment') icon = 'bi-hospital';
  if (safeStatus === 'Completed') icon = 'bi-check-circle-fill';

  const classKey = safeStatus.replace(/\s+/g, '-');
  return `<span class="status-badge status-${classKey}" data-status="${safeStatus}">
    <i class="bi ${icon}"></i> ${safeStatus}
  </span>`;
}

// Generate HTML for Priority Badge
function getPriorityBadge(priority) {
  const safePriority = priority || 'Urgent';
  let pulseDot = 'urgent';
  let icon = 'bi-circle-fill';

  if (safePriority === 'Critical') {
    pulseDot = 'critical';
  } else if (safePriority.includes('Low')) {
    pulseDot = 'success';
  }

  const classKey = safePriority.replace(/[^a-zA-Z0-9]/g, '-');
  return `<span class="priority-badge priority-${classKey}">
    <span class="pulse-dot ${pulseDot}"></span> ${safePriority}
  </span>`;
}

// API request helper with auth token header automatically injected
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('arc_token');
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error(`API request error on ${endpoint}:`, err);
    return { ok: false, status: 500, data: { message: 'Network or server connection error.' } };
  }
}

// Render dynamic navbar state (User menu or Login/Register buttons)
function updateNavbarAuth() {
  const authContainer = document.getElementById('navbar-auth-section');
  if (!authContainer) return;

  const token = localStorage.getItem('arc_token');
  const userJson = localStorage.getItem('arc_user');

  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      let dashboardUrl = '/pages/ngo-dashboard.html';
      if (user.role === 'admin') dashboardUrl = '/pages/admin-dashboard.html';
      else if (user.role === 'volunteer') dashboardUrl = '/pages/volunteer-dashboard.html';
      else if (user.role === 'citizen') dashboardUrl = '/pages/cases.html';

      authContainer.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-custom dropdown-toggle py-1 px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle text-primary me-1"></i>
            <span class="fw-semibold">${user.name.split(' ')[0]}</span>
            <span class="badge bg-secondary-subtle text-secondary text-uppercase ms-1" style="font-size:0.68rem">${user.role}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
            <li><h6 class="dropdown-header text-truncate" style="max-width:200px;">${user.email}</h6></li>
            <li><a class="dropdown-item py-2" href="${dashboardUrl}"><i class="bi bi-speedometer2 me-2 text-primary"></i>My Dashboard</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item py-2 text-danger" href="javascript:void(0)" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </div>
      `;
      return;
    } catch (e) {}
  }

  // Not logged in
  authContainer.innerHTML = `
    <a href="/pages/login.html" class="btn btn-outline-custom py-1 px-3">Login</a>
    <a href="/pages/register.html" class="btn btn-primary-custom py-1 px-3">Register</a>
  `;
}

function handleLogout() {
  localStorage.removeItem('arc_token');
  localStorage.removeItem('arc_user');
  showToast('You have been logged out successfully.', 'info', 'Logged Out');
  setTimeout(() => {
    window.location.href = '/';
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavbarAuth();
});
