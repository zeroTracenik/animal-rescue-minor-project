/**
 * Animal Rescue Connect - Dashboard Management Script
 * Handles NGO, Volunteer, and Admin interactive dashboards
 */

let currentDashboardRole = 'ngo';
let currentNgoCases = [];
let currentVolunteers = [];
let selectedCaseForAction = null;

// Initialize dashboard based on role
async function initNgoDashboard() {
  currentDashboardRole = 'ngo';
  checkAuthAccess(['ngo', 'admin']);
  await loadNgoVolunteers();
  await loadNgoCases();
  loadStatsSummary();
}

async function initVolunteerDashboard() {
  currentDashboardRole = 'volunteer';
  checkAuthAccess(['volunteer', 'admin']);
  await loadVolunteerProfile();
  await loadVolunteerCases();
}

async function initAdminDashboard() {
  currentDashboardRole = 'admin';
  checkAuthAccess(['admin']);
  await loadAdminOverview();
}

function checkAuthAccess(allowedRoles) {
  const token = localStorage.getItem('arc_token');
  const userJson = localStorage.getItem('arc_user');

  if (!token || !userJson) {
    showToast('Please login to access the dashboard.', 'error', 'Auth Required');
    setTimeout(() => window.location.href = '/pages/login.html', 800);
    return;
  }

  const user = JSON.parse(userJson);
  if (!allowedRoles.includes(user.role)) {
    showToast(`Access denied. Role "${user.role}" cannot access this dashboard.`, 'error', 'Unauthorized');
    setTimeout(() => window.location.href = '/', 1000);
  }

  // Display user badge
  const userDisplayName = document.getElementById('dashUserName');
  if (userDisplayName) userDisplayName.innerText = user.name;
}

// -----------------------------------------------------------------------------
// NGO DASHBOARD LOGIC
// -----------------------------------------------------------------------------

async function loadNgoVolunteers() {
  try {
    const res = await apiRequest('/api/ngos/volunteers/all');
    if (res.ok && res.data.success) {
      currentVolunteers = res.data.volunteers;
      populateVolunteerSelect();
      renderVolunteerListTable();
    }
  } catch (err) {
    console.error('Error loading volunteers:', err);
  }
}

function populateVolunteerSelect() {
  const select = document.getElementById('assignVolunteerSelect');
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose Volunteer to Dispatch --</option>';
  currentVolunteers.forEach(v => {
    select.innerHTML += `
      <option value="${v.id}">${v.name} (${v.role} • ${v.status})</option>
    `;
  });
}

async function loadNgoCases() {
  const tableBody = document.getElementById('ngoCasesTableBody');
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><span class="spinner-border spinner-border-sm text-primary me-2"></span>Loading rescue cases...</td></tr>`;
  }

  try {
    const res = await apiRequest('/api/reports');
    if (res.ok && res.data.success) {
      currentNgoCases = res.data.reports;
      renderNgoCasesTable(currentNgoCases);
      updateNgoCounters(currentNgoCases);
    }
  } catch (err) {
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load cases.</td></tr>`;
  }
}

function updateNgoCounters(cases) {
  const newReports = cases.filter(c => c.status === 'Reported').length;
  const critical = cases.filter(c => c.priority === 'Critical' && c.status !== 'Completed').length;
  const activeRescues = cases.filter(c => !['Completed', 'Reported'].includes(c.status)).length;
  const completed = cases.filter(c => c.status === 'Completed').length;

  if (document.getElementById('ngoCountNew')) document.getElementById('ngoCountNew').innerText = newReports;
  if (document.getElementById('ngoCountCritical')) document.getElementById('ngoCountCritical').innerText = critical;
  if (document.getElementById('ngoCountActive')) document.getElementById('ngoCountActive').innerText = activeRescues;
  if (document.getElementById('ngoCountCompleted')) document.getElementById('ngoCountCompleted').innerText = completed;
}

function filterNgoTable(tab) {
  document.querySelectorAll('.ngo-nav-tab').forEach(t => t.classList.remove('active'));
  const clickedTab = document.getElementById(`tabNgo${tab}`);
  if (clickedTab) clickedTab.classList.add('active');

  let filtered = currentNgoCases;
  if (tab === 'New') {
    filtered = currentNgoCases.filter(c => c.status === 'Reported');
  } else if (tab === 'Active') {
    filtered = currentNgoCases.filter(c => !['Completed', 'Reported'].includes(c.status));
  } else if (tab === 'Completed') {
    filtered = currentNgoCases.filter(c => c.status === 'Completed');
  }

  renderNgoCasesTable(filtered);
}

function renderNgoCasesTable(cases) {
  const tbody = document.getElementById('ngoCasesTableBody');
  if (!tbody) return;

  if (cases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No cases in this queue.</td></tr>`;
    return;
  }

  let html = '';
  cases.forEach(c => {
    html += `
      <tr>
        <td>
          <span class="fw-bold text-dark font-monospace">${c.caseId}</span>
          <div class="small text-muted">${formatDate(c.createdAt)}</div>
        </td>
        <td>
          <div class="fw-semibold">${c.animalType}</div>
          <div class="small text-muted">${c.animalCondition}</div>
        </td>
        <td>
          <div class="small text-truncate" style="max-width:200px;" title="${c.locationText}">
            <i class="bi bi-geo-alt text-danger me-1"></i>${c.locationText}
          </div>
        </td>
        <td>${getPriorityBadge(c.priority)}</td>
        <td>${getStatusBadge(c.status)}</td>
        <td class="text-end">
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-custom dropdown-toggle" type="button" data-bs-toggle="dropdown">
              Actions
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              <li><a class="dropdown-item" href="javascript:void(0)" onclick="openCaseDetailsModal('${c.caseId}')"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>
              ${c.status === 'Reported' ? `<li><a class="dropdown-item text-success fw-semibold" href="javascript:void(0)" onclick="acceptReportDirectly('${c.caseId}')"><i class="bi bi-check-circle me-2"></i>Accept Case</a></li>` : ''}
              <li><a class="dropdown-item" href="javascript:void(0)" onclick="openAssignModal('${c.caseId}')"><i class="bi bi-person-plus me-2 text-info"></i>Assign Volunteer</a></li>
              <li><a class="dropdown-item" href="javascript:void(0)" onclick="openStatusModal('${c.caseId}', '${c.status}')"><i class="bi bi-arrow-repeat me-2 text-warning"></i>Update Status</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="/pages/track.html?id=${c.caseId}" target="_blank"><i class="bi bi-geo me-2"></i>Open Tracking Page</a></li>
            </ul>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function renderVolunteerListTable() {
  const tbody = document.getElementById('volunteersTableBody');
  if (!tbody) return;

  let html = '';
  currentVolunteers.forEach(v => {
    let statusClass = 'bg-success-subtle text-success';
    if (v.status === 'On Field') statusClass = 'bg-warning-subtle text-warning-emphasis';
    if (v.status === 'Off Duty') statusClass = 'bg-secondary-subtle text-secondary';

    html += `
      <tr>
        <td>
          <div class="fw-semibold">${v.name}</div>
          <div class="small text-muted font-monospace">${v.id}</div>
        </td>
        <td>${v.role}</td>
        <td><i class="bi bi-telephone me-1 text-muted"></i>${v.phone}</td>
        <td><span class="badge ${statusClass} px-2 py-1">${v.status}</span></td>
        <td><span class="badge bg-light text-dark border">${v.currentActiveCases || 0} active</span></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// Accept report directly
async function acceptReportDirectly(caseId) {
  try {
    const res = await apiRequest(`/api/reports/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Assigned',
        note: 'Report accepted by NGO response center triage.'
      })
    });

    if (res.ok && res.data.success) {
      showToast(`Case ${caseId} accepted into active triage!`, 'success', 'Case Accepted');
      await loadNgoCases();
    } else {
      showToast(res.data.message || 'Failed to accept case.', 'error', 'Error');
    }
  } catch (err) {
    showToast('Failed to connect to server.', 'error', 'Network Error');
  }
}

// Modal open helpers
function openAssignModal(caseId) {
  selectedCaseForAction = caseId;
  document.getElementById('assignModalCaseId').innerText = caseId;
  const modal = new bootstrap.Modal(document.getElementById('assignVolunteerModal'));
  modal.show();
}

async function submitVolunteerAssignment() {
  const select = document.getElementById('assignVolunteerSelect');
  const volunteerId = select.value;

  if (!volunteerId) {
    showToast('Please select a volunteer from the list.', 'error', 'Selection Required');
    return;
  }

  try {
    const res = await apiRequest(`/api/reports/${selectedCaseForAction}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        volunteerId,
        note: `Volunteer assigned for field rescue operation.`
      })
    });

    if (res.ok && res.data.success) {
      bootstrap.Modal.getInstance(document.getElementById('assignVolunteerModal')).hide();
      showToast(`Volunteer assigned to case ${selectedCaseForAction}!`, 'success', 'Assigned');
      await loadNgoCases();
      await loadNgoVolunteers();
    } else {
      showToast(res.data.message || 'Failed to assign volunteer.', 'error', 'Error');
    }
  } catch (err) {
    showToast('Network error while assigning.', 'error', 'Error');
  }
}

function openStatusModal(caseId, currentStatus) {
  selectedCaseForAction = caseId;
  document.getElementById('statusModalCaseId').innerText = caseId;
  document.getElementById('newStatusSelect').value = currentStatus;
  document.getElementById('statusUpdateNote').value = '';
  const modal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
  modal.show();
}

async function submitStatusUpdate() {
  const status = document.getElementById('newStatusSelect').value;
  const note = document.getElementById('statusUpdateNote').value.trim();

  try {
    const res = await apiRequest(`/api/reports/${selectedCaseForAction}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });

    if (res.ok && res.data.success) {
      bootstrap.Modal.getInstance(document.getElementById('updateStatusModal')).hide();
      showToast(`Status updated to "${status}" for ${selectedCaseForAction}!`, 'success', 'Status Updated');
      await loadNgoCases();
      if (currentDashboardRole === 'volunteer') await loadVolunteerCases();
    } else {
      showToast(res.data.message || 'Failed to update status.', 'error', 'Error');
    }
  } catch (err) {
    showToast('Network error while updating status.', 'error', 'Error');
  }
}

// -----------------------------------------------------------------------------
// VOLUNTEER DASHBOARD & CREDIT POINTS LOGIC
// -----------------------------------------------------------------------------

let currentVolunteerProfile = null;

async function loadVolunteerProfile() {
  const user = JSON.parse(localStorage.getItem('arc_user') || '{}');
  const volId = user.volunteerId || 'VOL-01';

  try {
    const res = await apiRequest(`/api/ngos/volunteers/${volId}`);
    if (res.ok && res.data.success && res.data.volunteer) {
      currentVolunteerProfile = res.data.volunteer;
      renderVolunteerProfileHeader(currentVolunteerProfile);
    }
  } catch (err) {
    console.error('Error loading volunteer profile:', err);
  }
}

function renderVolunteerProfileHeader(vol) {
  const credits = vol.creditPoints || 0;
  const rescues = vol.rescuesCompleted || 0;

  // Navbar elements
  const navPoints = document.getElementById('navCreditPoints');
  if (navPoints) navPoints.innerText = credits;

  const dashName = document.getElementById('dashUserName');
  if (dashName) dashName.innerText = vol.name;

  const dashAffiliation = document.getElementById('dashNgoAffiliation');
  if (dashAffiliation) dashAffiliation.innerText = `${vol.role} • ${vol.ngoName || 'SSAF Nagpur'}`;

  // Hero Card points
  const heroPoints = document.getElementById('heroCreditPoints');
  if (heroPoints) heroPoints.innerText = credits;

  // Calculate Rank Tier & Progress
  let tierName = 'Bronze Rescuer 🥉';
  let tierClass = 'badge-tier-bronze';
  let nextGoal = 200;
  let prevGoal = 0;

  if (credits >= 1000) {
    tierName = 'Platinum Animal Champion 🏆';
    tierClass = 'badge-tier-platinum';
    nextGoal = credits;
    prevGoal = 1000;
  } else if (credits >= 500) {
    tierName = 'Gold Life Saver 🥇';
    tierClass = 'badge-tier-gold';
    nextGoal = 1000;
    prevGoal = 500;
  } else if (credits >= 200) {
    tierName = 'Silver Guardian 🥈';
    tierClass = 'badge-tier-silver';
    nextGoal = 500;
    prevGoal = 200;
  }

  const heroBadge = document.getElementById('heroBadgeTier');
  if (heroBadge) {
    heroBadge.innerText = tierName;
    heroBadge.className = `badge px-3 py-2 rounded-pill fw-bold ${tierClass}`;
  }

  // Progress Bar
  const heroProgressLabel = document.getElementById('heroProgressLabel');
  const heroProgressPct = document.getElementById('heroProgressPct');
  const heroProgressBar = document.getElementById('heroProgressBar');

  if (heroProgressBar) {
    let pct = 100;
    if (nextGoal > prevGoal && credits < 1000) {
      const span = nextGoal - prevGoal;
      const progressInTier = credits - prevGoal;
      pct = Math.min(100, Math.max(0, Math.round((progressInTier / span) * 100)));
      if (heroProgressLabel) heroProgressLabel.innerText = `${credits} / ${nextGoal} Credits to ${nextGoal === 500 ? 'Gold' : (nextGoal === 200 ? 'Silver' : 'Platinum')}`;
    } else {
      pct = 100;
      if (heroProgressLabel) heroProgressLabel.innerText = `Maximum Tier Achieved! (${credits} Credits)`;
    }
    heroProgressBar.style.width = `${pct}%`;
    if (heroProgressPct) heroProgressPct.innerText = `${pct}%`;
  }
}

async function loadVolunteerCases() {
  const liveContainer = document.getElementById('liveIncomingCasesContainer');
  const activeContainer = document.getElementById('volunteerActiveCasesContainer');
  const completedContainer = document.getElementById('volunteerCompletedCasesContainer');

  if (liveContainer) {
    liveContainer.innerHTML = `<div class="col-12 text-center py-4 text-muted"><span class="spinner-border spinner-border-sm text-primary me-2"></span>Scanning Nagpur emergency rescue radar...</div>`;
  }

  try {
    const res = await apiRequest('/api/reports');
    if (res.ok && res.data.success) {
      const allReports = res.data.reports || [];
      const user = JSON.parse(localStorage.getItem('arc_user') || '{}');
      const volId = user.volunteerId || (currentVolunteerProfile ? currentVolunteerProfile.id : 'VOL-01');

      // 1. Live Cases / New Reports awaiting first responder
      const liveReports = allReports.filter(r => 
        (r.status === 'Reported' || !r.assignedVolunteerId) && 
        !['Completed', 'Cancelled'].includes(r.status)
      );

      // 2. Active dispatches assigned to this volunteer
      let activeReports = allReports.filter(r => 
        r.assignedVolunteerId === volId && 
        !['Completed', 'Cancelled'].includes(r.status)
      );

      // If this specific volunteer has no active dispatches yet, show other active demo cases for testing convenience
      if (activeReports.length === 0) {
        const demoActive = allReports.filter(r => ['Assigned', 'On the Way', 'Rescued', 'Treatment'].includes(r.status));
        if (demoActive.length > 0) {
          activeReports = [demoActive[0]];
        }
      }

      // 3. Completed rescues by this volunteer
      let completedReports = allReports.filter(r => 
        (r.assignedVolunteerId === volId || r.status === 'Completed') && 
        r.status === 'Completed'
      );

      // Update Metric Counters
      updateVolunteerStats(liveReports.length, activeReports.length, completedReports.length);

      // Render the 3 Tabs
      renderLiveCases(liveReports);
      renderVolunteerActiveCards(activeReports);
      renderVolunteerCompletedCards(completedReports);
    }
  } catch (err) {
    console.error('Error loading volunteer cases:', err);
    if (liveContainer) liveContainer.innerHTML = `<div class="col-12 alert alert-danger">Error loading radar alerts.</div>`;
  }
}

function updateVolunteerStats(liveCount, activeCount, completedCount) {
  if (document.getElementById('statNewAlerts')) document.getElementById('statNewAlerts').innerText = liveCount;
  if (document.getElementById('tabBadgeLive')) document.getElementById('tabBadgeLive').innerText = liveCount;

  if (document.getElementById('statActiveDispatches')) document.getElementById('statActiveDispatches').innerText = activeCount;
  if (document.getElementById('tabBadgeActive')) document.getElementById('tabBadgeActive').innerText = activeCount;

  if (document.getElementById('statCompletedRescues')) document.getElementById('statCompletedRescues').innerText = completedCount;
  if (document.getElementById('tabBadgeCompleted')) document.getElementById('tabBadgeCompleted').innerText = completedCount;
}

// Render Tab 1: Live Emergency Radar Cards
function renderLiveCases(cases) {
  const container = document.getElementById('liveIncomingCasesContainer');
  if (!container) return;

  if (cases.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="display-6 text-success mb-2"><i class="bi bi-shield-check"></i></div>
        <h5 class="fw-bold text-dark">Radar Clear! No Unassigned Emergency Alerts</h5>
        <p class="text-muted small">All current Nagpur cases are assigned to response teams. Stay on standby for live citizen reports.</p>
      </div>
    `;
    return;
  }

  let html = '';
  cases.forEach(c => {
    html += `
      <div class="col-md-6 mb-4">
        <div class="card live-radar-card h-100 shadow-sm">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center gap-2">
                  <span class="pulse-indicator"></span>
                  <span class="badge bg-danger text-white fw-bold font-monospace" style="font-size: 0.72rem;">LIVE ALERT</span>
                  <span class="badge bg-dark font-monospace">${c.caseId}</span>
                </div>
                <div>${getPriorityBadge(c.priority)}</div>
              </div>

              <div class="d-flex gap-3 mb-3 align-items-start">
                <img src="${c.photoUrl}" alt="${c.animalType}" class="rounded-2 border shadow-sm flex-shrink-0" style="width: 84px; height: 84px; object-fit: cover; cursor: pointer;" onclick="openCasePhotoModal('${c.photoUrl}', '${c.animalType} - ${c.caseId}', '${c.animalCondition}')" title="Click to inspect animal photo">
                <div>
                  <h5 class="fw-bold mb-1 text-dark">${c.animalType} <span class="text-danger fw-semibold fs-6">(${c.animalCondition})</span></h5>
                  <p class="small text-muted mb-0" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${c.description}</p>
                </div>
              </div>

              <div class="bg-light p-2 rounded-2 small mb-3">
                <div class="mb-1 text-dark fw-medium">
                  <i class="bi bi-geo-alt-fill text-danger me-1"></i><strong>Location:</strong> ${c.locationText}
                  ${c.latitude && c.longitude ? `<a href="https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}" target="_blank" class="ms-2 badge bg-white text-primary border text-decoration-none"><i class="bi bi-map me-1"></i>Map</a>` : ''}
                </div>
                <div class="text-muted" style="font-size: 0.78rem;">
                  <i class="bi bi-clock me-1"></i>Reported: ${formatDate(c.createdAt)} • Assigned NGO: ${c.assignedNgoName || 'Regional Center'}
                </div>
              </div>
            </div>

            <div class="pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span class="badge bg-warning-subtle text-dark border"><i class="bi bi-star-fill text-warning me-1"></i>Earn +50 Credits</span>
              <button class="btn btn-sm btn-primary-custom px-3 py-2 fw-semibold" onclick="acceptReportAsVolunteer('${c.caseId}')">
                <i class="bi bi-lightning-charge-fill me-1 text-warning"></i> Accept Rescue
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Render Tab 2: My Active Dispatches
function renderVolunteerActiveCards(cases) {
  const container = document.getElementById('volunteerActiveCasesContainer');
  if (!container) return;

  if (cases.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="display-6 text-muted mb-2"><i class="bi bi-truck"></i></div>
        <h5 class="fw-bold">No Active Dispatches Right Now</h5>
        <p class="text-muted small">Switch to the <strong>"Live Cases & New Reports"</strong> tab above to accept an emergency case.</p>
      </div>
    `;
    return;
  }

  let html = '';
  cases.forEach(c => {
    html += `
      <div class="col-md-6 mb-4">
        <div class="card arc-card h-100 shadow-sm border-2">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="badge bg-dark font-monospace me-2">${c.caseId}</span>
                  ${getPriorityBadge(c.priority)}
                </div>
                <div>${getStatusBadge(c.status)}</div>
              </div>

              <div class="d-flex gap-3 mb-3 align-items-start">
                <img src="${c.photoUrl}" alt="${c.animalType}" class="rounded-2 border shadow-sm flex-shrink-0" style="width: 84px; height: 84px; object-fit: cover; cursor: pointer;" onclick="openCasePhotoModal('${c.photoUrl}', '${c.animalType} - ${c.caseId}', '${c.animalCondition}')" title="Click to inspect animal photo">
                <div>
                  <h5 class="fw-bold mb-1 text-dark">${c.animalType} <span class="text-muted fw-normal fs-6">(${c.animalCondition})</span></h5>
                  <p class="small text-muted mb-0">${c.description}</p>
                </div>
              </div>

              <div class="bg-light p-2 rounded-2 small mb-3">
                <div class="mb-1 text-dark">
                  <i class="bi bi-geo-alt-fill text-danger me-1"></i><strong>Location:</strong> ${c.locationText}
                  ${c.latitude && c.longitude ? `<a href="https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}" target="_blank" class="ms-1 badge bg-white text-primary border text-decoration-none"><i class="bi bi-map me-1"></i>Open Maps</a>` : ''}
                </div>
                <div class="mb-1"><i class="bi bi-person me-1 text-primary"></i><strong>Reporter:</strong> ${c.reporterName || 'Anonymous Citizen'}</div>
                <div>
                  <i class="bi bi-telephone-fill me-1 text-success"></i><strong>Phone:</strong> 
                  <a href="tel:${c.reporterPhone}" class="fw-bold text-decoration-none text-success">${c.reporterPhone || 'Not provided'}</a>
                </div>
              </div>
            </div>

            <div class="pt-2 border-top">
              <div class="text-muted small fw-semibold mb-2">Advance Rescue Status:</div>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm ${c.status === 'On the Way' ? 'btn-primary' : 'btn-outline-primary'}" onclick="volunteerQuickUpdate('${c.caseId}', 'On the Way')">
                  <i class="bi bi-truck me-1"></i>On the Way
                </button>
                <button class="btn btn-sm ${c.status === 'Rescued' ? 'btn-teal text-white' : 'btn-outline-teal'}" style="color:#0f766e; border-color:#0f766e;" onclick="volunteerQuickUpdate('${c.caseId}', 'Rescued')">
                  <i class="bi bi-heart-pulse me-1"></i>Rescued (+75 pts)
                </button>
                <button class="btn btn-sm ${c.status === 'Treatment' ? 'btn-info text-white' : 'btn-outline-info'}" onclick="volunteerQuickUpdate('${c.caseId}', 'Treatment')">
                  <i class="bi bi-hospital me-1"></i>Treatment (+50 pts)
                </button>
                <button class="btn btn-sm btn-success text-white" onclick="volunteerQuickUpdate('${c.caseId}', 'Completed')">
                  <i class="bi bi-check2-circle me-1"></i>Complete (+150 pts)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Render Tab 3: Completed Rescues
function renderVolunteerCompletedCards(cases) {
  const container = document.getElementById('volunteerCompletedCasesContainer');
  if (!container) return;

  if (cases.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="bi bi-trophy fs-1 d-block mb-2 text-warning"></i>
        No completed rescues logged yet. Complete your active cases to build your rescue reward history!
      </div>
    `;
    return;
  }

  let html = '';
  cases.forEach(c => {
    html += `
      <div class="col-md-6 mb-4">
        <div class="card arc-card h-100 shadow-sm border-success-subtle">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span class="badge bg-dark font-monospace me-2">${c.caseId}</span>
                <span class="badge bg-success-subtle text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Successfully Saved</span>
              </div>
              <span class="badge bg-warning-subtle text-dark border fw-bold"><i class="bi bi-star-fill text-warning me-1"></i>+150 Credits Earned</span>
            </div>

            <div class="d-flex gap-3 mb-2 align-items-center">
              <img src="${c.photoUrl}" alt="${c.animalType}" class="rounded-2 border shadow-sm flex-shrink-0" style="width: 72px; height: 72px; object-fit: cover; cursor: pointer;" onclick="openCasePhotoModal('${c.photoUrl}', '${c.animalType} - ${c.caseId}', 'Case Completed')" title="Click to inspect photo">
              <div>
                <h5 class="fw-bold mb-1 text-dark">${c.animalType} <span class="text-muted fw-normal fs-6">(${c.animalCondition})</span></h5>
                <div class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${c.locationText}</div>
                <div class="small text-muted"><i class="bi bi-calendar3 me-1"></i>Saved on: ${formatDate(c.updatedAt || c.createdAt)}</div>
              </div>
            </div>

            <div class="p-2 bg-light rounded-2 small text-secondary mt-2">
              <i class="bi bi-info-circle me-1 text-success"></i>${c.statusNote || 'Animal stabilized and rehabilitated successfully.'}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Volunteer Action: Accept Incoming Case
async function acceptReportAsVolunteer(caseId) {
  const user = JSON.parse(localStorage.getItem('arc_user') || '{}');
  const volId = user.volunteerId || (currentVolunteerProfile ? currentVolunteerProfile.id : 'VOL-01');
  const volName = user.name || (currentVolunteerProfile ? currentVolunteerProfile.name : 'Field Responder');

  try {
    const res = await apiRequest(`/api/reports/${caseId}/accept`, {
      method: 'POST',
      body: JSON.stringify({
        volunteerId: volId,
        volunteerName: volName
      })
    });

    if (res.ok && res.data.success) {
      // Show celebration feedback
      showCreditCelebrationModal('+50 pts', 'Rescue Case Accepted!', `You claimed case ${caseId} and are dispatched. Proceed to the reported location in Nagpur!`);

      // Refresh Profile & Cases
      await loadVolunteerProfile();
      await loadVolunteerCases();

      // Automatically switch to Active Dispatches Tab
      const activeTabBtn = document.getElementById('tabActiveBtn');
      if (activeTabBtn) activeTabBtn.click();
    } else {
      showToast(res.data.message || 'Failed to accept case.', 'error', 'Error');
    }
  } catch (err) {
    showToast('Network error while accepting case.', 'error', 'Error');
  }
}

// Volunteer Action: Advance Status
async function volunteerQuickUpdate(caseId, newStatus) {
  try {
    const res = await apiRequest(`/api/reports/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: newStatus,
        note: `Status updated by Field Responder to "${newStatus}".`
      })
    });

    if (res.ok && res.data.success) {
      const earned = res.data.creditsEarned;
      if (earned && earned > 0) {
        showCreditCelebrationModal(`+${earned} pts`, `Status: ${newStatus}`, `Outstanding rescue dedication! You earned +${earned} Rescue Credits.`);
      } else {
        showToast(`Case ${caseId} marked as "${newStatus}"!`, 'success', 'Status Updated');
      }

      await loadVolunteerProfile();
      await loadVolunteerCases();
    } else {
      showToast(res.data.message || 'Status update failed.', 'error', 'Error');
    }
  } catch (err) {
    showToast('Network error while updating status.', 'error', 'Error');
  }
}

// Photo Preview Modal Helper
function openCasePhotoModal(imgUrl, title, subtitle) {
  const imgEl = document.getElementById('casePhotoModalImg');
  const titleEl = document.getElementById('casePhotoModalTitle');
  const subEl = document.getElementById('casePhotoModalSubtitle');

  if (imgEl) imgEl.src = imgUrl;
  if (titleEl) titleEl.innerText = title;
  if (subEl) subEl.innerText = subtitle;

  const modalEl = document.getElementById('casePhotoModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

// Celebration Reward Modal Helper
function showCreditCelebrationModal(pointsStr, title, message) {
  const modalEl = document.getElementById('creditCelebrationModal');
  if (!modalEl) {
    showToast(`${title} • ${message} (${pointsStr})`, 'success', 'Rescue Reward');
    return;
  }

  const pEl = document.getElementById('celebrationPoints');
  const tEl = document.getElementById('celebrationTitle');
  const mEl = document.getElementById('celebrationMessage');

  if (pEl) pEl.innerText = pointsStr;
  if (tEl) tEl.innerText = title;
  if (mEl) mEl.innerText = message;

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// -----------------------------------------------------------------------------
// ADMIN DASHBOARD LOGIC
// -----------------------------------------------------------------------------

async function loadAdminOverview() {
  try {
    const [statsRes, reportsRes, ngosRes, volsRes, usersRes] = await Promise.all([
      apiRequest('/api/stats'),
      apiRequest('/api/reports'),
      apiRequest('/api/ngos'),
      apiRequest('/api/ngos/volunteers/all'),
      apiRequest('/api/auth/users')
    ]);

    if (statsRes.ok && statsRes.data.success) {
      const s = statsRes.data.stats;
      document.getElementById('adminStatReports').innerText = s.totalReports;
      document.getElementById('adminStatActive').innerText = s.activeRescues;
      document.getElementById('adminStatCompleted').innerText = s.completedRescues;
      document.getElementById('adminStatNgos').innerText = s.totalNgos;
      document.getElementById('adminStatVolunteers').innerText = s.totalVolunteers;
      document.getElementById('adminStatUsers').innerText = s.totalUsers;
    }

    if (reportsRes.ok) renderAdminReportsTable(reportsRes.data.reports || []);
    if (ngosRes.ok) renderAdminNgosTable(ngosRes.data.ngos || []);
    if (volsRes.ok) renderAdminVolunteersTable(volsRes.data.volunteers || []);
    if (usersRes.ok) renderAdminUsersTable(usersRes.data.users || []);
  } catch (err) {
    console.error('Admin overview loading error:', err);
  }
}

function renderAdminReportsTable(reports) {
  const tbody = document.getElementById('adminReportsTableBody');
  if (!tbody) return;

  let html = '';
  reports.forEach(r => {
    html += `
      <tr>
        <td><span class="font-monospace fw-bold text-dark">${r.caseId}</span></td>
        <td>${r.animalType}</td>
        <td><div class="text-truncate" style="max-width:180px;">${r.locationText}</div></td>
        <td>${getPriorityBadge(r.priority)}</td>
        <td>${getStatusBadge(r.status)}</td>
        <td>${r.assignedNgoName || '<span class="text-muted">Unassigned</span>'}</td>
        <td class="text-end">
          <a href="/pages/track.html?id=${r.caseId}" class="btn btn-sm btn-outline-custom">Track</a>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function renderAdminNgosTable(ngos) {
  const tbody = document.getElementById('adminNgosTableBody');
  if (!tbody) return;

  let html = '';
  ngos.forEach(n => {
    html += `
      <tr>
        <td class="fw-bold">${n.name}</td>
        <td>${n.phone}</td>
        <td><div class="text-truncate" style="max-width:220px;">${n.address}</div></td>
        <td><span class="badge bg-info-subtle text-info-emphasis">${n.capacity} Capacity</span></td>
        <td><span class="badge bg-teal-subtle text-teal fw-bold">${n.activeRescues || 0} Cases</span></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function renderAdminVolunteersTable(vols) {
  const tbody = document.getElementById('adminVolunteersTableBody');
  if (!tbody) return;

  let html = '';
  vols.forEach(v => {
    html += `
      <tr>
        <td class="fw-bold">${v.name}</td>
        <td>${v.phone}</td>
        <td>${v.ngoName}</td>
        <td>${v.role}</td>
        <td><span class="badge bg-light text-dark border">${v.status}</span></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function renderAdminUsersTable(users) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  let html = '';
  users.forEach(u => {
    html += `
      <tr>
        <td class="fw-semibold">${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone || 'N/A'}</td>
        <td><span class="badge bg-secondary text-uppercase">${u.role}</span></td>
        <td class="small text-muted">${formatDate(u.createdAt)}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// System Database Reset
async function resetDemoData() {
  if (!confirm('Are you sure you want to reset all operational records back to initial state?')) {
    return;
  }

  try {
    const res = await apiRequest('/api/stats/reset', { method: 'POST' });
    if (res.ok) {
      showToast('Database reset to initial records.', 'success', 'System Reset');
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    showToast('Failed to reset database.', 'error', 'Error');
  }
}

// Case details modal
function openCaseDetailsModal(caseId) {
  const c = currentNgoCases.find(item => item.caseId === caseId);
  if (!c) return;

  document.getElementById('detailModalCaseId').innerText = c.caseId;
  document.getElementById('detailModalAnimal').innerText = `${c.animalType} (${c.animalCondition})`;
  document.getElementById('detailModalPriority').innerHTML = getPriorityBadge(c.priority);
  document.getElementById('detailModalStatus').innerHTML = getStatusBadge(c.status);
  document.getElementById('detailModalLocation').innerText = c.locationText;
  document.getElementById('detailModalDescription').innerText = c.description;
  const imgEl = document.getElementById('detailModalImg');
  if (imgEl) {
    imgEl.src = c.photoUrl;
    imgEl.onerror = () => { imgEl.src = '/public/images/cases/case-1021.jpg'; };
  }

  const reporterEl = document.getElementById('detailModalReporter');
  if (reporterEl) {
    reporterEl.innerText = `${c.reporterName || 'Anonymous Citizen'} (${c.reporterPhone || 'Not provided'})`;
  }

  const galleryEl = document.getElementById('detailModalPhotosGallery');
  if (galleryEl) {
    const photosList = Array.isArray(c.photos) && c.photos.length > 0 ? c.photos : (c.photoUrl ? [c.photoUrl] : []);
    if (photosList.length > 1) {
      let gHtml = '<div class="w-100 small text-muted fw-semibold mb-1"><i class="bi bi-images me-1"></i>All Evidence Photos (' + photosList.length + '):</div>';
      photosList.forEach((pUrl, idx) => {
        gHtml += `<img src="${pUrl}" alt="Evidence ${idx + 1}" class="rounded border" style="width: 44px; height: 44px; object-fit: cover; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('detailModalImg').src='${pUrl}'" title="Click to view photo ${idx + 1}">`;
      });
      galleryEl.innerHTML = gHtml;
    } else {
      galleryEl.innerHTML = '';
    }
  }

  const modal = new bootstrap.Modal(document.getElementById('caseDetailsModal'));
  modal.show();
}

function loadStatsSummary() {
  // Can be called to refresh sidebar / top badges if needed
}
