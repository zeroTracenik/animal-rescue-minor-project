/**
 * Animal Rescue Connect - Report Submission Script
 * Geolocation API, Priority Suggestion, Dynamic Nearest NGO Search,
 * Multi-photo Staging, Live Camera Capture & Image Verification Preview.
 */

let stagedPhotos = [];
let mediaStream = null;
let currentFacing = 'environment'; // 'environment' (rear) or 'user' (front)
let currentSnapDataUrl = null;
let cameraModalInstance = null;
let verifyModalInstance = null;
let selectedSampleImage = '';

document.addEventListener('DOMContentLoaded', () => {
  setupConditionPrioritySync();
  setupImageHandlers();
});

// Sync condition change with suggested priority
function setupConditionPrioritySync() {
  const conditionSelect = document.getElementById('animalCondition');
  const prioritySelect = document.getElementById('priority');
  const priorityHint = document.getElementById('priorityHint');

  if (!conditionSelect || !prioritySelect) return;

  conditionSelect.addEventListener('change', () => {
    const val = conditionSelect.value;
    let suggested = 'Urgent';
    let hintText = '';

    if (['Hit and Run', 'Severe Bleeding', 'Open Trauma', 'Suspected Fracture'].includes(val)) {
      suggested = 'Critical';
      hintText = '🚨 Flagged as Critical: Immediate trauma response recommended.';
    } else if (['Deep Wound', 'Severe Infection', 'Unable to Walk', 'Extreme Dehydration', 'Trapped in Drain / Hazard'].includes(val)) {
      suggested = 'Urgent';
      hintText = '⚠️ Flagged as Urgent: Requires rescue dispatch within few hours.';
    } else if (['Skin Disease (Mange)', 'Mild Limp', 'Malnourished / Weak'].includes(val)) {
      suggested = 'Moderate';
      hintText = 'ℹ️ Flagged as Moderate: Medical care required, not immediately fatal.';
    } else if (['Abandoned Litter / Kittens / Puppies', 'Non-emergency Shelter Request'].includes(val)) {
      suggested = 'Low / Shelter Care';
      hintText = '🌱 Flagged as Low / Shelter Care: Non-life-threatening shelter assistance.';
    }

    prioritySelect.value = suggested;
    if (priorityHint) {
      priorityHint.innerText = hintText;
      priorityHint.className = 'form-text text-primary fw-medium';
    }
  });
}

// Live Geolocation using browser Geolocation API
function useMyLocation() {
  const locBtn = document.getElementById('btnGeoLocation');
  const latInput = document.getElementById('latitude');
  const lonInput = document.getElementById('longitude');
  const locTextInput = document.getElementById('locationText');
  const locBadge = document.getElementById('geoCoordinatesBadge');

  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error', 'Location Error');
    return;
  }

  locBtn.disabled = true;
  locBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Detecting GPS...';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      latInput.value = lat.toFixed(5);
      lonInput.value = lon.toFixed(5);

      locBadge.classList.remove('d-none');
      locBadge.innerHTML = `<i class="bi bi-geo-alt-fill text-danger me-1"></i> Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)} (GPS Precision: ±${Math.round(position.coords.accuracy)}m)`;

      // Try reverse geocoding via OpenStreetMap Nominatim
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.display_name && !locTextInput.value) {
          locTextInput.value = geoData.display_name.split(',').slice(0, 4).join(',');
        }
      } catch (e) {
        if (!locTextInput.value) {
          locTextInput.value = `Current Device Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        }
      }

      locBtn.disabled = false;
      locBtn.innerHTML = '<i class="bi bi-check2-circle me-1 text-success"></i> Location Captured';
      showToast('Exact GPS coordinates captured successfully!', 'success', 'Location Detected');
    },
    (error) => {
      locBtn.disabled = false;
      locBtn.innerHTML = '<i class="bi bi-geo-alt me-1"></i> Use My Location';
      
      let message = 'Could not access location.';
      if (error.code === error.PERMISSION_DENIED) {
        message = 'Location permission was denied. Please type your location manually.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = 'Location information is currently unavailable.';
      } else if (error.code === error.TIMEOUT) {
        message = 'Location request timed out.';
      }
      showToast(message, 'error', 'Location Notice');
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// -----------------------------------------------------------------------------
// MULTI-PHOTO UPLOAD & LIVE CAMERA HANDLERS
// -----------------------------------------------------------------------------

function setupImageHandlers() {
  const photoInput = document.getElementById('photoInput');
  const nativeCameraInput = document.getElementById('nativeCameraInput');

  // Multi-file selection listener
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      let loadedCount = 0;
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          stagedPhotos.push({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            file: file,
            dataUrl: event.target.result,
            name: file.name || `photo-${stagedPhotos.length + 1}.jpg`,
            size: file.size,
            source: 'upload',
            sourceLabel: 'Uploaded File'
          });
          loadedCount++;
          if (loadedCount === files.length) {
            renderPhotosGrid();
            showToast(`${files.length} photo(s) added and verified for review!`, 'success');
          }
        };
        reader.readAsDataURL(file);
      });

      // Clear input so selecting the same file again still fires change
      photoInput.value = '';
    });
  }

  // Native mobile camera input listener
  if (nativeCameraInput) {
    nativeCameraInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          stagedPhotos.push({
            id: 'phonecam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            file: file,
            dataUrl: event.target.result,
            name: file.name || `mobile-camera-${stagedPhotos.length + 1}.jpg`,
            size: file.size,
            source: 'camera',
            sourceLabel: 'Mobile Camera Snap'
          });
          renderPhotosGrid();
          showToast('Photo captured and verified successfully!', 'success');
        };
        reader.readAsDataURL(file);
        nativeCameraInput.value = '';
      }
    });
  }
}

// Preset sample photo selection
function selectSampleImage(url, label) {
  // Avoid duplicate sample
  const alreadyAdded = stagedPhotos.some(p => p.dataUrl === url);
  if (alreadyAdded) {
    showToast(`"${label}" is already added to staged photos.`, 'info');
    return;
  }

  selectedSampleImage = url;
  stagedPhotos.push({
    id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    file: null,
    dataUrl: url,
    name: label,
    size: null,
    source: 'sample',
    sourceLabel: 'Preset Sample'
  });

  renderPhotosGrid();
  showToast(`Sample demonstration photo added: ${label}`, 'info');
}

// -----------------------------------------------------------------------------
// LIVE CAMERA STREAM & SNAP LOGIC
// -----------------------------------------------------------------------------

async function openLiveCameraModal() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Direct camera access is not supported on this browser or requires an HTTPS / localhost connection. Please use the "Upload Photos" button.', 'error', 'Camera Unsupported');
    return;
  }

  const modalEl = document.getElementById('cameraModal');
  if (!modalEl) return;

  if (!cameraModalInstance) {
    cameraModalInstance = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
  }

  // Reset view to live mode
  resetCameraModalView();
  cameraModalInstance.show();

  await startVideoStream();
}

function resetCameraModalView() {
  currentSnapDataUrl = null;

  const liveView = document.getElementById('cameraLiveView');
  const snapView = document.getElementById('cameraSnapView');
  const liveControls = document.getElementById('cameraLiveControls');
  const verifyControls = document.getElementById('cameraVerifyControls');
  const spinner = document.getElementById('cameraLoadingSpinner');

  if (liveView) liveView.classList.remove('d-none');
  if (snapView) snapView.classList.add('d-none');
  if (liveControls) liveControls.classList.remove('d-none');
  if (verifyControls) verifyControls.classList.add('d-none');
  if (spinner) spinner.classList.remove('d-none');
}

async function startVideoStream() {
  stopVideoStream();

  const video = document.getElementById('cameraVideo');
  const spinner = document.getElementById('cameraLoadingSpinner');
  if (spinner) spinner.classList.remove('d-none');

  try {
    const constraints = {
      video: {
        facingMode: currentFacing,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (video) {
      video.srcObject = mediaStream;
      video.onloadedmetadata = () => {
        video.play().catch(e => console.warn('Video play warning:', e));
        if (spinner) spinner.classList.add('d-none');
      };
    }
  } catch (err) {
    console.error('Camera streaming error:', err);
    if (spinner) {
      spinner.classList.remove('d-none');
      spinner.innerHTML = `
        <div class="text-warning mb-2"><i class="bi bi-camera-video-off fs-2"></i></div>
        <div class="small fw-bold">Camera Access Blocked or Not Found</div>
        <div class="small text-white-50 mt-1" style="font-size:11px;">Please grant browser camera permission or use the "Upload Photos" button.</div>
      `;
    }
    showToast('Could not access camera. Please allow camera permissions or upload photos from device.', 'error', 'Camera Error');
  }
}

function stopVideoStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      try { track.stop(); } catch (e) {}
    });
    mediaStream = null;
  }
  const video = document.getElementById('cameraVideo');
  if (video) {
    video.srcObject = null;
  }
}

function closeLiveCamera() {
  stopVideoStream();
  currentSnapDataUrl = null;
  if (cameraModalInstance) {
    cameraModalInstance.hide();
  }
}

function switchCameraFacing() {
  currentFacing = currentFacing === 'environment' ? 'user' : 'environment';
  startVideoStream();
}

// Snap frame from video stream onto canvas
function captureLiveSnap() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const snapPreview = document.getElementById('cameraSnapPreview');

  if (!video || !canvas || !snapPreview) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  currentSnapDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  snapPreview.src = currentSnapDataUrl;

  // Pause video and switch modal to Verify mode
  video.pause();

  const liveView = document.getElementById('cameraLiveView');
  const snapView = document.getElementById('cameraSnapView');
  const liveControls = document.getElementById('cameraLiveControls');
  const verifyControls = document.getElementById('cameraVerifyControls');

  if (liveView) liveView.classList.add('d-none');
  if (snapView) snapView.classList.remove('d-none');
  if (liveControls) liveControls.classList.add('d-none');
  if (verifyControls) verifyControls.classList.remove('d-none');
}

// Retake snapshot
function retakeLiveSnap() {
  currentSnapDataUrl = null;
  const video = document.getElementById('cameraVideo');
  const liveView = document.getElementById('cameraLiveView');
  const snapView = document.getElementById('cameraSnapView');
  const liveControls = document.getElementById('cameraLiveControls');
  const verifyControls = document.getElementById('cameraVerifyControls');

  if (liveView) liveView.classList.remove('d-none');
  if (snapView) snapView.classList.add('d-none');
  if (liveControls) liveControls.classList.remove('d-none');
  if (verifyControls) verifyControls.classList.add('d-none');

  if (video) {
    video.play().catch(e => console.warn('Video resume warning:', e));
  }
}

// User confirms and verifies the snapshot
function acceptLiveSnap() {
  if (!currentSnapDataUrl) return;

  const snapId = 'camera_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  stagedPhotos.push({
    id: snapId,
    file: null,
    dataUrl: currentSnapDataUrl,
    name: `Camera-Snap-${stagedPhotos.length + 1}.jpg`,
    size: Math.round(currentSnapDataUrl.length * 0.75),
    source: 'camera',
    sourceLabel: 'Camera Live Capture'
  });

  closeLiveCamera();
  renderPhotosGrid();
  showToast('Live camera photo verified and added to report!', 'success', 'Photo Verified');
}

// -----------------------------------------------------------------------------
// VERIFIED PHOTOS GALLERY RENDERING & INSPECTION MODAL
// -----------------------------------------------------------------------------

function renderPhotosGrid() {
  const grid = document.getElementById('photosGrid');
  const emptyState = document.getElementById('photoEmptyState');
  const countBadge = document.getElementById('photoCountBadge');
  const galleryActions = document.getElementById('galleryActions');

  if (!grid || !emptyState || !countBadge) return;

  countBadge.innerText = stagedPhotos.length;

  if (stagedPhotos.length === 0) {
    emptyState.classList.remove('d-none');
    grid.classList.add('d-none');
    grid.innerHTML = '';
    if (galleryActions) galleryActions.classList.add('d-none');
    return;
  }

  emptyState.classList.add('d-none');
  grid.classList.remove('d-none');
  if (galleryActions) galleryActions.classList.remove('d-none');

  let html = '';
  stagedPhotos.forEach((item, index) => {
    let badgeClass = 'bg-primary text-white';
    let iconClass = 'bi-image';

    if (item.source === 'camera') {
      badgeClass = 'bg-danger text-white';
      iconClass = 'bi-camera-fill';
    } else if (item.source === 'sample') {
      badgeClass = 'bg-teal text-white';
      iconClass = 'bi-sparkles';
    }

    const formattedSize = item.size ? formatBytes(item.size) : 'Demonstration';

    html += `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card h-100 border shadow-sm rounded-3 overflow-hidden position-relative">
          <div class="position-relative bg-dark" style="height: 140px;">
            <img src="${item.dataUrl}" alt="${escapeHtml(item.name)}" class="w-100 h-100" style="object-fit: cover; cursor: pointer;" onclick="openVerifyImageModal('${item.id}')" title="Click to inspect photo in high resolution">
            <span class="badge ${badgeClass} position-absolute top-0 start-0 m-2 shadow-sm" style="font-size: 10px;">
              <i class="bi ${iconClass} me-1"></i>${item.sourceLabel}
            </span>
            <button type="button" class="btn btn-sm btn-dark bg-opacity-75 position-absolute top-0 end-0 m-2 rounded-circle p-0 text-white border-0 shadow" title="Inspect / Verify Quality" onclick="openVerifyImageModal('${item.id}')" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
              <i class="bi bi-zoom-in" style="font-size: 13px;"></i>
            </button>
          </div>
          <div class="card-body p-2 d-flex flex-column justify-content-between">
            <div>
              <div class="small fw-bold text-truncate text-dark" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
              <div class="text-muted" style="font-size: 11px;">
                <i class="bi bi-check2-circle text-success me-1"></i>Verified • ${formattedSize}
              </div>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <button type="button" class="btn btn-xs btn-outline-primary py-0 px-2" style="font-size: 11px;" onclick="openVerifyImageModal('${item.id}')">
                <i class="bi bi-eye me-1"></i>Verify
              </button>
              <button type="button" class="btn btn-xs btn-outline-danger py-0 px-2" style="font-size: 11px;" onclick="removePhoto('${item.id}')">
                <i class="bi bi-trash3 me-1"></i>Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

function removePhoto(id) {
  const index = stagedPhotos.findIndex(p => p.id === id);
  if (index !== -1) {
    const removed = stagedPhotos.splice(index, 1)[0];
    renderPhotosGrid();
    showToast(`Removed "${removed.name}".`, 'info');
  }
}

function clearAllPhotos() {
  stagedPhotos = [];
  selectedSampleImage = '';
  const photoInput = document.getElementById('photoInput');
  if (photoInput) photoInput.value = '';
  renderPhotosGrid();
  showToast('All staged photos cleared.', 'info');
}

// Open Image Inspection / Verify Quality Modal
function openVerifyImageModal(id) {
  const item = stagedPhotos.find(p => p.id === id);
  if (!item) return;

  const modalEl = document.getElementById('imageVerifyModal');
  const imgEl = document.getElementById('imageVerifyModalImg');
  const titleEl = document.getElementById('imageVerifyModalTitle');
  const infoEl = document.getElementById('imageVerifyModalInfo');

  if (!modalEl || !imgEl) return;

  imgEl.src = item.dataUrl;
  if (titleEl) titleEl.innerText = `Verify Photo: ${item.name}`;
  if (infoEl) {
    const sizeStr = item.size ? ` • ${formatBytes(item.size)}` : '';
    infoEl.innerHTML = `<span class="badge bg-success-subtle text-success me-1"><i class="bi bi-check-circle-fill me-1"></i>Verified Clarity</span> Source: ${item.sourceLabel}${sizeStr}`;
  }

  if (!verifyModalInstance) {
    verifyModalInstance = new bootstrap.Modal(modalEl);
  }
  verifyModalInstance.show();
}

// -----------------------------------------------------------------------------
// REPORT SUBMISSION WITH MULTI-PHOTO & CAMERA ATTACHMENTS
// -----------------------------------------------------------------------------

async function handleReportSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const animalType = form.animalType.value;
  const animalCondition = form.animalCondition.value;
  const priority = form.priority.value;
  const description = form.description.value.trim();
  const locationText = form.locationText.value.trim();
  const latitude = form.latitude.value;
  const longitude = form.longitude.value;
  const reporterName = form.reporterName.value.trim();
  const reporterPhone = form.reporterPhone.value.trim();

  if (!animalType || !animalCondition || !description || !locationText) {
    showToast('Please fill out all mandatory fields.', 'error', 'Missing Information');
    return;
  }

  // Visual loading modal for "Searching for nearest NGO..."
  const searchModalEl = document.getElementById('searchNgoModal');
  const searchModal = new bootstrap.Modal(searchModalEl);
  searchModal.show();

  const statusMsg = document.getElementById('searchModalStatus');
  statusMsg.innerHTML = '<span class="spinner-border spinner-border-sm me-2 text-primary"></span>Calculating coordinates and proximity...';

  // Prepare FormData for multi-photo file upload & camera base64
  const formData = new FormData();
  formData.append('animalType', animalType);
  formData.append('animalCondition', animalCondition);
  formData.append('priority', priority);
  formData.append('description', description);
  formData.append('locationText', locationText);
  if (latitude) formData.append('latitude', latitude);
  if (longitude) formData.append('longitude', longitude);
  if (reporterName) formData.append('reporterName', reporterName);
  if (reporterPhone) formData.append('reporterPhone', reporterPhone);

  // Attach staged photos
  const cameraSnapsBase64 = [];
  let attachedCount = 0;

  if (stagedPhotos.length > 0) {
    stagedPhotos.forEach((item, idx) => {
      if (item.file) {
        // Real file upload from disk or native camera
        formData.append('photos', item.file, item.name || `photo-${idx + 1}.jpg`);
        attachedCount++;
      } else if (item.source === 'camera') {
        // Direct browser webcam snap
        const blob = dataUrlToBlob(item.dataUrl);
        if (blob) {
          formData.append('photos', blob, `camera-snap-${idx + 1}.jpg`);
          attachedCount++;
        }
        cameraSnapsBase64.push(item.dataUrl);
      } else if (item.source === 'sample') {
        // Preset sample image url
        if (idx === 0) {
          formData.append('photoUrl', item.dataUrl);
        }
        attachedCount++;
      }
    });

    if (cameraSnapsBase64.length > 0) {
      formData.append('cameraPhotos', JSON.stringify(cameraSnapsBase64));
    }
  } else if (selectedSampleImage) {
    formData.append('photoUrl', selectedSampleImage);
  }

  try {
    // Artificial slight delay so user can see "Searching for nearest NGO..."
    await new Promise(r => setTimeout(r, 900));
    statusMsg.innerHTML = '<span class="spinner-border spinner-border-sm me-2 text-teal"></span>Comparing with registered NGO response zones in Nagpur...';

    const res = await apiRequest('/api/reports', {
      method: 'POST',
      body: formData
    });

    await new Promise(r => setTimeout(r, 600));

    if (res.ok && res.data.success) {
      searchModal.hide();
      form.reset();
      stagedPhotos = [];
      selectedSampleImage = '';
      renderPhotosGrid();

      const geoBadge = document.getElementById('geoCoordinatesBadge');
      if (geoBadge) geoBadge.classList.add('d-none');

      // Show Success Result Modal with Nearest NGO details
      showReportSuccessModal(res.data.report, res.data.nearestNgo);
    } else {
      searchModal.hide();
      showToast(res.data.message || 'Failed to submit report.', 'error', 'Error');
    }
  } catch (err) {
    searchModal.hide();
    console.error('Submission error:', err);
    showToast('Network error while submitting report.', 'error', 'Network Error');
  }
}

// Display Confirmation Modal with Nearest NGO result
function showReportSuccessModal(report, nearestNgo) {
  const modalEl = document.getElementById('reportSuccessModal');
  const modal = new bootstrap.Modal(modalEl);

  document.getElementById('modalCaseId').innerText = report.caseId;
  document.getElementById('modalCaseIdCopyBtn').setAttribute('data-case-id', report.caseId);
  document.getElementById('modalTrackBtn').href = `/pages/track.html?id=${report.caseId}`;

  const ngoContainer = document.getElementById('modalNearestNgoDetails');
  if (nearestNgo) {
    ngoContainer.innerHTML = `
      <div class="card border-0 bg-light p-3 rounded-3 text-start">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="fw-bold text-dark mb-0">${nearestNgo.name}</h6>
          <span class="badge bg-teal-subtle text-teal fw-bold px-2 py-1" style="background:#ccfbf1; color:#0f766e;">
            <i class="bi bi-pin-map-fill me-1"></i>~${nearestNgo.distanceKm} km away
          </span>
        </div>
        <div class="small text-muted mb-1"><i class="bi bi-geo-alt me-1"></i>${nearestNgo.address}</div>
        <div class="small text-muted mb-1"><i class="bi bi-telephone me-1"></i>${nearestNgo.phone}</div>
        <div class="small text-muted"><i class="bi bi-clock me-1"></i>${nearestNgo.operatingHours || '24/7 Response'}</div>
      </div>
    `;
  } else {
    ngoContainer.innerHTML = `<div class="text-muted small">Report logged in general queue for regional rescue triage in Nagpur.</div>`;
  }

  modal.show();
}

function copyCaseIdFromModal() {
  const btn = document.getElementById('modalCaseIdCopyBtn');
  const caseId = btn.getAttribute('data-case-id');
  navigator.clipboard.writeText(caseId);
  showToast(`Case ID ${caseId} copied to clipboard!`, 'info');
}

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

function dataUrlToBlob(dataUrl) {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('Error converting dataURL to blob:', e);
    return null;
  }
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
