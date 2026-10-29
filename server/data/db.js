/**
 * Animal Rescue Connect - JSON File Database Driver
 * High-performance, lightweight, file-based data persistence.
 */

const fs = require('fs');
const path = require('path');
const {
  initialNgos,
  initialVolunteers,
  initialUsers,
  initialReports
} = require('./initialData');

const DATA_DIR = __dirname;
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const NGOS_FILE = path.join(DATA_DIR, 'ngos.json');
const VOLUNTEERS_FILE = path.join(DATA_DIR, 'volunteers.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Helper to safely read JSON file
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, defaultValue);
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

// Helper to safely write JSON file
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Ensure database files exist and seed if missing
function initDatabase() {
  if (!fs.existsSync(USERS_FILE)) writeJson(USERS_FILE, initialUsers);
  if (!fs.existsSync(NGOS_FILE)) writeJson(NGOS_FILE, initialNgos);
  if (!fs.existsSync(VOLUNTEERS_FILE)) writeJson(VOLUNTEERS_FILE, initialVolunteers);
  if (!fs.existsSync(REPORTS_FILE)) writeJson(REPORTS_FILE, initialReports);
  console.log('✅ Local JSON database initialized successfully.');
}

// Reset database back to default seed data
function resetDatabase() {
  writeJson(USERS_FILE, initialUsers);
  writeJson(NGOS_FILE, initialNgos);
  writeJson(VOLUNTEERS_FILE, initialVolunteers);
  writeJson(REPORTS_FILE, initialReports);
  return { success: true, message: "Database reset to initial demo state" };
}

// Reports operations
function getReports() {
  return readJson(REPORTS_FILE, initialReports);
}

function getReportById(identifier) {
  const reports = getReports();
  const search = String(identifier).toUpperCase().trim();
  return reports.find(r => 
    String(r.id) === String(identifier) || 
    r.caseId.toUpperCase() === search
  ) || null;
}

function addReport(report) {
  const reports = getReports();
  
  // Calculate next ID
  const maxId = reports.reduce((max, r) => Math.max(max, Number(r.id) || 1000), 1000);
  const nextId = maxId + 1;
  const caseId = `ARC-${nextId}`;

  const newReport = {
    id: nextId,
    caseId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "Reported",
    timeline: [
      {
        status: "Reported",
        timestamp: new Date().toISOString(),
        note: "Case reported by citizen."
      }
    ],
    ...report
  };

  reports.unshift(newReport);
  writeJson(REPORTS_FILE, reports);
  return newReport;
}

function updateReport(identifier, updates) {
  const reports = getReports();
  const index = reports.findIndex(r => 
    String(r.id) === String(identifier) || 
    r.caseId.toUpperCase() === String(identifier).toUpperCase().trim()
  );

  if (index === -1) return null;

  const current = reports[index];
  const updatedReport = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // If status is updated, record into timeline
  if (updates.status && updates.status !== current.status) {
    const timeline = Array.isArray(updatedReport.timeline) ? [...updatedReport.timeline] : [];
    timeline.push({
      status: updates.status,
      timestamp: new Date().toISOString(),
      note: updates.statusNote || `Status updated to ${updates.status}`
    });
    updatedReport.timeline = timeline;
  }

  reports[index] = updatedReport;
  writeJson(REPORTS_FILE, reports);
  return updatedReport;
}

function deleteReport(identifier) {
  const reports = getReports();
  const filtered = reports.filter(r => 
    String(r.id) !== String(identifier) && 
    r.caseId.toUpperCase() !== String(identifier).toUpperCase().trim()
  );
  if (filtered.length === reports.length) return false;
  writeJson(REPORTS_FILE, filtered);
  return true;
}

// NGOs operations
function getNgos() {
  const ngos = readJson(NGOS_FILE, initialNgos);
  const reports = getReports();
  
  // Dynamically compute active rescues for each NGO
  return ngos.map(ngo => {
    const activeRescues = reports.filter(r => 
      r.assignedNgoId === ngo.id && 
      !['Completed', 'Cancelled'].includes(r.status)
    ).length;
    return {
      ...ngo,
      activeRescues
    };
  });
}

function getNgoById(id) {
  const ngos = getNgos();
  return ngos.find(n => n.id === id) || null;
}

function addNgo(ngoData) {
  const ngos = readJson(NGOS_FILE, initialNgos);
  const nextId = `NGO-${String(ngos.length + 1).padStart(2, '0')}`;
  const newNgo = {
    id: nextId,
    name: ngoData.name || 'Animal Rescue Center',
    regId: ngoData.ngoRegId || 'N/A',
    ownerName: ngoData.ngoOwnerName || '',
    email: ngoData.email,
    phone: ngoData.phone,
    address: ngoData.address || 'Nagpur, Maharashtra',
    latitude: ngoData.latitude ? Number(ngoData.latitude) : 21.1458,
    longitude: ngoData.longitude ? Number(ngoData.longitude) : 79.0882,
    operatingHours: ngoData.operatingHours || '24/7 Rescue',
    capacity: ngoData.capacity || 30,
    activeRescues: 0,
    description: ngoData.description || `Registered Animal Rescue NGO in Nagpur.`
  };
  ngos.push(newNgo);
  writeJson(NGOS_FILE, ngos);
  return newNgo;
}

// Volunteers operations
function getVolunteers() {
  const volunteers = readJson(VOLUNTEERS_FILE, initialVolunteers);
  const reports = getReports();

  return volunteers.map(vol => {
    const activeCases = reports.filter(r => 
      r.assignedVolunteerId === vol.id && 
      !['Completed', 'Cancelled'].includes(r.status)
    ).length;
    return {
      ...vol,
      currentActiveCases: activeCases
    };
  });
}

function getVolunteerById(id) {
  const volunteers = getVolunteers();
  return volunteers.find(v => v.id === id) || null;
}

function getVolunteersByNgo(ngoId) {
  const volunteers = getVolunteers();
  return volunteers.filter(v => v.ngoId === ngoId);
}

function updateVolunteer(id, updates) {
  const volunteers = readJson(VOLUNTEERS_FILE, initialVolunteers);
  const index = volunteers.findIndex(v => v.id === id);
  if (index === -1) return null;
  volunteers[index] = { ...volunteers[index], ...updates };
  writeJson(VOLUNTEERS_FILE, volunteers);
  return volunteers[index];
}

function addVolunteerCredits(id, points, isRescueCompleted = false) {
  const volunteers = readJson(VOLUNTEERS_FILE, initialVolunteers);
  const index = volunteers.findIndex(v => v.id === id);
  if (index === -1) return null;
  const current = volunteers[index];
  const newPoints = Math.max(0, (current.creditPoints || 0) + Number(points));
  const newCompleted = (current.rescuesCompleted || 0) + (isRescueCompleted ? 1 : 0);
  
  let newBadge = "Bronze Rescuer 🥉";
  if (newPoints >= 1000) newBadge = "Platinum Animal Champion 🏆";
  else if (newPoints >= 500) newBadge = "Gold Life Saver 🥇";
  else if (newPoints >= 200) newBadge = "Silver Guardian 🥈";

  volunteers[index] = {
    ...current,
    creditPoints: newPoints,
    rescuesCompleted: newCompleted,
    badge: newBadge
  };
  writeJson(VOLUNTEERS_FILE, volunteers);
  return volunteers[index];
}

// Users operations
function getUsers() {
  return readJson(USERS_FILE, initialUsers);
}

function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim()) || null;
}

function getUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

function addUser(user) {
  const users = getUsers();
  const nextId = `USR-${String(users.length + 1).padStart(2, '0')}`;
  const newUser = {
    id: nextId,
    createdAt: new Date().toISOString(),
    ...user
  };
  users.push(newUser);
  writeJson(USERS_FILE, users);
  return newUser;
}

// System Overview Statistics
function getStats() {
  const reports = getReports();
  const ngos = getNgos();
  const volunteers = getVolunteers();
  const users = getUsers();

  const totalReports = reports.length;
  const completedRescues = reports.filter(r => r.status === 'Completed').length;
  const activeRescues = reports.filter(r => !['Completed', 'Cancelled'].includes(r.status)).length;
  const criticalCases = reports.filter(r => r.priority === 'Critical' && r.status !== 'Completed').length;
  const urgentCases = reports.filter(r => r.priority === 'Urgent' && r.status !== 'Completed').length;

  return {
    totalReports,
    completedRescues,
    activeRescues,
    criticalCases,
    urgentCases,
    totalNgos: ngos.length,
    totalVolunteers: volunteers.length,
    totalUsers: users.length,
    networkOperational: true
  };
}

// Initialize on require
initDatabase();

module.exports = {
  initDatabase,
  resetDatabase,
  getReports,
  getReportById,
  addReport,
  updateReport,
  deleteReport,
  getNgos,
  getNgoById,
  addNgo,
  getVolunteers,
  getVolunteerById,
  getVolunteersByNgo,
  updateVolunteer,
  addVolunteerCredits,
  getUsers,
  getUserByEmail,
  getUserById,
  addUser,
  getStats
};
