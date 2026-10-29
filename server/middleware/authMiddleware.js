/**
 * Animal Rescue Connect - Authentication & Authorization Middleware
 * Provides JWT verification, role-based access control, and reporter privacy protection.
 */

const jwt = require('jsonwebtoken');
const db = require('../data/db');

const JWT_SECRET = process.env.JWT_SECRET || 'arc-animal-rescue-secret-key-2026';

// Extracts and validates JWT token (optional: does not reject if token is missing)
function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}

// Strict authentication - requires valid token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

// Role-based access control (RBAC)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation.'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
}

// Data Privacy Filter: Hides private citizen details from general public
function sanitizeReportForPublic(report, currentUser) {
  if (!report) return null;

  // If user is Admin, NGO assigned to this report, or assigned Volunteer, allow full details
  const isAuthorized = currentUser && (
    currentUser.role === 'admin' ||
    (currentUser.role === 'ngo' && currentUser.ngoId === report.assignedNgoId) ||
    (currentUser.role === 'volunteer' && currentUser.volunteerId === report.assignedVolunteerId)
  );

  if (isAuthorized) {
    return report;
  }

  // Sanitize for public / citizen view
  const sanitized = { ...report };
  if (sanitized.reporterPhone) {
    // Mask phone number (e.g., +91 98101 •••••)
    const phone = String(sanitized.reporterPhone);
    sanitized.reporterPhone = phone.length > 5 ? phone.substring(0, phone.length - 5) + '•••••' : '••••••••••';
  }
  // Reporter note
  sanitized.isReporterConfidential = true;
  return sanitized;
}

module.exports = {
  JWT_SECRET,
  authenticateOptional,
  authenticate,
  requireRole,
  sanitizeReportForPublic
};
