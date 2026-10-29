/**
 * Animal Rescue Connect - Case Tracking Script
 * Renders 6-step progress timeline, NGO/Volunteer dispatch details, and audit history.
 */

const STATUS_STEPS = [
  { key: 'Reported', label: 'Reported', icon: 'bi-file-earmark-text' },
  { key: 'Assigned', label: 'Assigned', icon: 'bi-person-check' },
  { key: 'On the Way', label: 'On the Way', icon: 'bi-truck' },
  { key: 'Rescued', label: 'Rescued', icon: 'bi-heart-pulse' },
  { key: 'Treatment', label: 'Treatment', icon: 'bi-hospital' },
  { key: 'Completed', label: 'Completed', icon: 'bi-check2-circle' }
];

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const caseIdFromUrl = urlParams.get('id');

  if (caseIdFromUrl) {
    const input = document.getElementById('trackCaseInput');
    if (input) input.value = caseIdFromUrl;
    fetchCaseDetails(caseIdFromUrl);
  }

  // Bind Enter key in search box
  const searchInput = document.getElementById('trackCaseInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        trackCaseFromInput();
      }
    });
  }
});

function trackCaseFromInput() {
  const input = document.getElementById('trackCaseInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    showToast('Please enter a valid Case ID (e.g. ARC-1021)', 'error', 'Case ID Required');
    return;
  }
  fetchCaseDetails(val);
}

function quickTrackChip(id) {
  const input = document.getElementById('trackCaseInput');
  if (input) input.value = id;
  fetchCaseDetails(id);
}

async function fetchCaseDetails(caseId) {
  const resultContainer = document.getElementById('trackResultContainer');
  const notFoundContainer = document.getElementById('trackNotFoundContainer');

  if (resultContainer) resultContainer.classList.add('d-none');
  if (notFoundContainer) notFoundContainer.classList.add('d-none');

  const btn = document.getElementById('btnSearchTrack');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Searching...';
  }

  try {
    const res = await apiRequest(`/api/reports/${encodeURIComponent(caseId)}`);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-search me-1"></i> Track Case';
    }

    if (res.ok && res.data.success && res.data.report) {
      renderTrackDetails(res.data.report);
      if (resultContainer) resultContainer.classList.remove('d-none');

      // Update URL without page reload
      window.history.replaceState({}, '', `/pages/track.html?id=${encodeURIComponent(caseId)}`);
    } else {
      if (notFoundContainer) notFoundContainer.classList.remove('d-none');
      showToast(res.data.message || `Case ID "${caseId}" was not found.`, 'error', 'Case Not Found');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-search me-1"></i> Track Case';
    }
    showToast('Failed to connect to tracking server.', 'error', 'Network Error');
  }
}

function renderTrackDetails(c) {
  // Case ID and Meta
  document.getElementById('trackDisplayCaseId').innerText = c.caseId;
  document.getElementById('trackPriorityContainer').innerHTML = getPriorityBadge(c.priority);
  document.getElementById('trackStatusContainer').innerHTML = getStatusBadge(c.status);
  document.getElementById('trackDate').innerText = formatDate(c.createdAt);

  // Core Info
  document.getElementById('trackAnimalType').innerText = `${c.animalType} (${c.animalCondition})`;
  document.getElementById('trackLocation').innerText = c.locationText;
  document.getElementById('trackDescription').innerText = c.description;

  const photoEl = document.getElementById('trackPhoto');
  if (photoEl) {
    photoEl.src = c.photoUrl;
    photoEl.alt = `${c.animalType} - ${c.caseId}`;
    photoEl.onerror = () => { photoEl.src = '/public/images/cases/case-1021.jpg'; };
  }

  const galleryEl = document.getElementById('trackPhotosGallery');
  if (galleryEl) {
    const photosList = Array.isArray(c.photos) && c.photos.length > 0 ? c.photos : (c.photoUrl ? [c.photoUrl] : []);
    if (photosList.length > 1) {
      let gHtml = '<div class="w-100 small text-muted fw-semibold mb-1"><i class="bi bi-images me-1"></i>All Evidence Photos (' + photosList.length + '):</div>';
      photosList.forEach((pUrl, idx) => {
        gHtml += `<img src="${pUrl}" alt="Photo ${idx + 1}" class="rounded border" style="width: 48px; height: 48px; object-fit: cover; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('trackPhoto').src='${pUrl}'" title="Click to view photo ${idx + 1}">`;
      });
      galleryEl.innerHTML = gHtml;
    } else {
      galleryEl.innerHTML = '';
    }
  }

  // Render 6-Step Visual Timeline
  renderProgressStepper(c.status);

  // NGO & Volunteer Details Card
  const ngoEl = document.getElementById('trackNgoName');
  const ngoPhoneEl = document.getElementById('trackNgoPhone');
  const volEl = document.getElementById('trackVolunteerName');
  const volPhoneEl = document.getElementById('trackVolunteerPhone');

  if (c.assignedNgoName) {
    ngoEl.innerText = c.assignedNgoName;
    ngoPhoneEl.innerText = 'Dispatched from nearest regional center';
  } else {
    ngoEl.innerText = 'Awaiting NGO Assignment';
    ngoPhoneEl.innerText = 'Case is in regional review queue';
  }

  if (c.assignedVolunteerName) {
    volEl.innerText = c.assignedVolunteerName;
    volPhoneEl.innerText = 'Field Responder Assigned';
  } else {
    volEl.innerText = 'Pending Dispatch';
    volPhoneEl.innerText = 'Nearest volunteer will be notified upon acceptance';
  }

  // Activity Log List
  const logContainer = document.getElementById('trackActivityLogs');
  if (logContainer) {
    const timeline = Array.isArray(c.timeline) ? c.timeline : [];
    if (timeline.length === 0) {
      logContainer.innerHTML = '<li class="list-group-item text-muted small">No logs recorded yet.</li>';
    } else {
      let logsHtml = '';
      timeline.forEach((item, idx) => {
        logsHtml += `
          <div class="d-flex mb-3">
            <div class="me-3 text-center" style="width: 24px;">
              <i class="bi bi-circle-fill text-primary" style="font-size: 0.65rem;"></i>
              ${idx < timeline.length - 1 ? '<div class="h-100 border-start mx-auto mt-1" style="width: 2px;"></div>' : ''}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fw-bold small text-dark">${item.status}</span>
                <span class="text-muted" style="font-size: 0.78rem;">${formatDate(item.timestamp)}</span>
              </div>
              <div class="small text-secondary">${item.note || 'Status transitioned'}</div>
            </div>
          </div>
        `;
      });
      logContainer.innerHTML = logsHtml;
    }
  }
}

function renderProgressStepper(currentStatus) {
  const stepperContainer = document.getElementById('trackProgressStepper');
  if (!stepperContainer) return;

  const currentIdx = STATUS_STEPS.findIndex(s => s.key.toLowerCase() === (currentStatus || '').toLowerCase());
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;

  let html = '';
  STATUS_STEPS.forEach((step, idx) => {
    let stepClass = '';
    let iconContent = `<i class="bi ${step.icon}"></i>`;

    if (idx < activeIndex) {
      stepClass = 'completed';
      iconContent = '<i class="bi bi-check-lg"></i>';
    } else if (idx === activeIndex) {
      stepClass = 'active';
    }

    html += `
      <div class="timeline-step ${stepClass}">
        <div class="timeline-step-icon">
          ${iconContent}
        </div>
        <div class="timeline-step-label">${step.label}</div>
      </div>
    `;
  });

  stepperContainer.innerHTML = html;
}
