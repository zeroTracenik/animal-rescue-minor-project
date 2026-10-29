/**
 * Animal Rescue Connect - Auth Client Script
 * Handles Login, Registration, and Instant Demo Logins
 */

// Handle Registration Form
async function handleRegisterSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const password = form.password.value;
  const role = form.role.value;

  if (!name || !email || !password) {
    showToast('Please fill in all required fields.', 'error', 'Validation Error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error', 'Validation Error');
    return;
  }

  const payload = { name, email, phone, password, role };

  // If NGO role, collect NGO specific fields
  if (role === 'ngo') {
    const ngoRegId = form.ngoRegId ? form.ngoRegId.value.trim() : '';
    const ngoOwnerName = form.ngoOwnerName ? form.ngoOwnerName.value.trim() : '';
    const ngoAddress = form.ngoAddress ? form.ngoAddress.value.trim() : '';
    const ngoLatitude = form.ngoLatitude ? form.ngoLatitude.value : null;
    const ngoLongitude = form.ngoLongitude ? form.ngoLongitude.value : null;

    if (!ngoRegId || !ngoOwnerName || !ngoAddress) {
      showToast('Please provide NGO Registration ID, Owner Name, and Address.', 'error', 'NGO Info Missing');
      return;
    }

    payload.ngoRegId = ngoRegId;
    payload.ngoOwnerName = ngoOwnerName;
    payload.address = ngoAddress;
    payload.latitude = ngoLatitude ? parseFloat(ngoLatitude) : null;
    payload.longitude = ngoLongitude ? parseFloat(ngoLongitude) : null;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

  try {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok && res.data.success) {
      localStorage.setItem('arc_token', res.data.token);
      localStorage.setItem('arc_user', JSON.stringify(res.data.user));
      showToast('Welcome to Animal Rescue Connect!', 'success', 'Account Created');
      
      setTimeout(() => {
        redirectToDashboard(res.data.user.role);
      }, 1000);
    } else {
      showToast(res.data.message || 'Registration failed.', 'error', 'Error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Register Account';
    }
  } catch (err) {
    showToast('Failed to connect to the server.', 'error', 'Network Error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Register Account';
  }
}

// Handle Login Form
async function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    showToast('Please provide both email and password.', 'error', 'Validation Error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';

  try {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.ok && res.data.success) {
      localStorage.setItem('arc_token', res.data.token);
      localStorage.setItem('arc_user', JSON.stringify(res.data.user));
      showToast(`Welcome back, ${res.data.user.name}!`, 'success', 'Login Successful');

      setTimeout(() => {
        redirectToDashboard(res.data.user.role);
      }, 800);
    } else {
      showToast(res.data.message || 'Invalid credentials.', 'error', 'Login Failed');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  } catch (err) {
    showToast('Server connection failed.', 'error', 'Network Error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In';
  }
}


// Role-based redirector
function redirectToDashboard(role) {
  switch (role) {
    case 'admin':
      window.location.href = '/pages/admin-dashboard.html';
      break;
    case 'ngo':
      window.location.href = '/pages/ngo-dashboard.html';
      break;
    case 'volunteer':
      window.location.href = '/pages/volunteer-dashboard.html';
      break;
    default:
      window.location.href = '/pages/cases.html';
  }
}
