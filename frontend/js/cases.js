/**
 * Animal Rescue Connect - Public Cases Explorer Script
 */

let allCases = [];
let currentFilterPriority = 'All';
let currentFilterStatus = 'All';
let currentSearch = '';
let currentViewMode = 'grid'; // 'grid' or 'table'

document.addEventListener('DOMContentLoaded', () => {
  loadCases();
  setupFilterListeners();
});

async function loadCases() {
  const container = document.getElementById('casesContainer');
  if (container) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Loading rescue cases...</div>
      </div>
    `;
  }

  try {
    const res = await apiRequest('/api/reports');
    if (res.ok && res.data.success) {
      allCases = res.data.reports;
      renderCases();
      updateFilterCounts();
    } else {
      if (container) container.innerHTML = `<div class="col-12 alert alert-danger">Failed to load cases.</div>`;
    }
  } catch (err) {
    if (container) container.innerHTML = `<div class="col-12 alert alert-danger">Error connecting to rescue database.</div>`;
  }
}

function setupFilterListeners() {
  // Search input
  const searchInput = document.getElementById('casesSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderCases();
    });
  }

  // Priority Filter Tabs
  const priorityBtns = document.querySelectorAll('.priority-filter-btn');
  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => b.classList.remove('active', 'btn-primary-custom'));
      priorityBtns.forEach(b => b.classList.add('btn-outline-custom'));
      
      btn.classList.add('active', 'btn-primary-custom');
      btn.classList.remove('btn-outline-custom');

      currentFilterPriority = btn.getAttribute('data-priority');
      renderCases();
    });
  });

  // Status Filter Select
  const statusSelect = document.getElementById('casesStatusFilter');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentFilterStatus = e.target.value;
      renderCases();
    });
  }
}

function setViewMode(mode) {
  currentViewMode = mode;
  document.getElementById('btnGridView').classList.toggle('active', mode === 'grid');
  document.getElementById('btnTableView').classList.toggle('active', mode === 'table');
  renderCases();
}

function getFilteredCases() {
  return allCases.filter(c => {
    // Priority filter
    if (currentFilterPriority !== 'All') {
      if (currentFilterPriority === 'Completed') {
        if (c.status !== 'Completed') return false;
      } else if (currentFilterPriority === 'Moderate') {
        if (c.priority !== 'Moderate') return false;
      } else if (currentFilterPriority === 'Low') {
        if (!c.priority.includes('Low')) return false;
      } else if (c.priority !== currentFilterPriority) {
        return false;
      }
    }

    // Status filter
    if (currentFilterStatus !== 'All' && c.status !== currentFilterStatus) {
      return false;
    }

    // Search query
    if (currentSearch) {
      const q = currentSearch;
      const match =
        (c.caseId && c.caseId.toLowerCase().includes(q)) ||
        (c.animalType && c.animalType.toLowerCase().includes(q)) ||
        (c.animalCondition && c.animalCondition.toLowerCase().includes(q)) ||
        (c.locationText && c.locationText.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

function updateFilterCounts() {
  const countAll = allCases.length;
  const countCritical = allCases.filter(c => c.priority === 'Critical' && c.status !== 'Completed').length;
  const countUrgent = allCases.filter(c => c.priority === 'Urgent' && c.status !== 'Completed').length;
  const countModerate = allCases.filter(c => c.priority === 'Moderate' && c.status !== 'Completed').length;
  const countCompleted = allCases.filter(c => c.status === 'Completed').length;

  const elAll = document.getElementById('countFilterAll');
  if (elAll) elAll.innerText = countAll;

  const elCrit = document.getElementById('countFilterCritical');
  if (elCrit) elCrit.innerText = countCritical;

  const elUrg = document.getElementById('countFilterUrgent');
  if (elUrg) elUrg.innerText = countUrgent;

  const elMod = document.getElementById('countFilterModerate');
  if (elMod) elMod.innerText = countModerate;

  const elComp = document.getElementById('countFilterCompleted');
  if (elComp) elComp.innerText = countCompleted;
}

function renderCases() {
  const container = document.getElementById('casesContainer');
  if (!container) return;

  const filtered = getFilteredCases();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="display-6 text-muted mb-3"><i class="bi bi-search"></i></div>
        <h5 class="fw-bold">No rescue cases match your search</h5>
        <p class="text-muted small">Try adjusting your filters or search keywords.</p>
      </div>
    `;
    return;
  }

  if (currentViewMode === 'table') {
    renderTableView(container, filtered);
  } else {
    renderGridView(container, filtered);
  }
}

function renderGridView(container, list) {
  let html = '<div class="row g-4">';
  list.forEach(c => {
    html += `
      <div class="col-md-6 col-lg-4">
        <div class="case-card">
          <div class="position-relative">
            <img src="${c.photoUrl}" class="case-card-img" alt="${c.animalType}" onerror="this.src='/public/images/cases/case-1021.jpg'">
            ${Array.isArray(c.photos) && c.photos.length > 1 ? `
              <div class="position-absolute bottom-0 end-0 m-2">
                <span class="badge bg-dark bg-opacity-75 text-white fw-medium py-1 px-2 rounded-2" style="font-size: 0.72rem;">
                  <i class="bi bi-images me-1"></i>${c.photos.length} photos
                </span>
              </div>
            ` : ''}
            <div class="position-absolute top-0 start-0 m-2">
              ${getPriorityBadge(c.priority)}
            </div>
            <div class="position-absolute top-0 end-0 m-2">
              <span class="badge text-white fw-bold py-1 px-2 rounded-2 shadow-sm font-monospace" style="background-color: rgba(15, 23, 42, 0.95); letter-spacing: 0.04em;">${c.caseId}</span>
            </div>
          </div>

          <div class="case-card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="fw-bold mb-0 text-dark">${c.animalType} <span class="fw-semibold fs-6" style="color: #475569;">(${c.animalCondition})</span></h5>
            </div>

            <p class="small mb-2 text-truncate-2" style="min-height: 2.6rem; color: #334155 !important; line-height: 1.5;">${c.description}</p>

            <div class="small mb-2 fw-medium" style="color: #475569;">
              <i class="bi bi-geo-alt-fill text-danger me-1"></i><span class="text-truncate d-inline-block align-bottom" style="max-width: 85%;">${c.locationText}</span>
            </div>

            <div class="small mb-3" style="color: #64748b;">
              <i class="bi bi-calendar3 me-1"></i>${formatDate(c.createdAt)}
            </div>

            <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
              <div>${getStatusBadge(c.status)}</div>
              <a href="/pages/track.html?id=${c.caseId}" class="btn btn-sm btn-outline-custom">
                Track <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderTableView(container, list) {
  let html = `
    <div class="card arc-card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Case ID</th>
              <th scope="col">Animal & Condition</th>
              <th scope="col">Location</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Date Reported</th>
              <th scope="col" class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
  `;

  list.forEach(c => {
    html += `
      <tr>
        <td><span class="fw-bold text-dark font-monospace">${c.caseId}</span></td>
        <td>
          <div class="fw-semibold">${c.animalType}</div>
          <div class="small text-muted">${c.animalCondition}</div>
        </td>
        <td>
          <div class="small text-secondary text-truncate" style="max-width: 220px;" title="${c.locationText}">
            <i class="bi bi-geo-alt text-danger me-1"></i>${c.locationText}
          </div>
        </td>
        <td>${getPriorityBadge(c.priority)}</td>
        <td>${getStatusBadge(c.status)}</td>
        <td><div class="small text-muted">${formatDate(c.createdAt)}</div></td>
        <td class="text-end">
          <a href="/pages/track.html?id=${c.caseId}" class="btn btn-sm btn-outline-custom">
            Track Case
          </a>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
}
