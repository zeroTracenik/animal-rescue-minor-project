/**
 * Animal Rescue Connect - Report Controller
 * Handles report submission, nearest NGO matching, status updates, and tracking.
 */

const fs = require('fs');
const path = require('path');
const db = require('../data/db');
const geoUtils = require('../utils/geoUtils');
const { sanitizeReportForPublic } = require('../middleware/authMiddleware');

// Fallback high-quality real animal rescue & injury photos if no photo is uploaded
const FALLBACK_IMAGES = {
  Dog: "/public/images/cases/case-1021.jpg",
  Cat: "/public/images/cases/case-1022.jpg",
  Cow: "/public/images/cases/case-1023.jpg",
  Bird: "/public/images/cases/case-1024.jpg",
  Other: "/public/images/cases/case-1029.jpg"
};

exports.createReport = (req, res) => {
  try {
    const {
      animalType,
      animalCondition,
      priority,
      description,
      locationText,
      latitude,
      longitude,
      reporterName,
      reporterPhone,
      photoUrl
    } = req.body;

    // Validation
    if (!animalType || !animalCondition || !description || !locationText) {
      return res.status(400).json({
        success: false,
        message: 'Animal type, condition, description, and location are required.'
      });
    }

    const lat = latitude ? parseFloat(latitude) : null;
    const lon = longitude ? parseFloat(longitude) : null;

    // Process multiple uploaded photos & camera captures
    const uploadedPhotos = [];

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(f => uploadedPhotos.push(`/uploads/${f.filename}`));
      } else {
        if (Array.isArray(req.files.photos)) {
          req.files.photos.forEach(f => uploadedPhotos.push(`/uploads/${f.filename}`));
        }
        if (Array.isArray(req.files.photo)) {
          req.files.photo.forEach(f => uploadedPhotos.push(`/uploads/${f.filename}`));
        }
      }
    } else if (req.file) {
      uploadedPhotos.push(`/uploads/${req.file.filename}`);
    }

    // Process direct camera base64 snaps if transmitted
    let cameraPhotos = req.body.cameraPhotos;
    if (cameraPhotos) {
      if (!Array.isArray(cameraPhotos)) {
        try {
          cameraPhotos = JSON.parse(cameraPhotos);
        } catch (e) {
          cameraPhotos = [cameraPhotos];
        }
      }
      if (Array.isArray(cameraPhotos)) {
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cameraPhotos.forEach((dataUrl, idx) => {
          if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
            const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
              const buffer = Buffer.from(matches[2], 'base64');
              const filename = `camera-${Date.now()}-${idx + 1}.${ext}`;
              fs.writeFileSync(path.join(uploadDir, filename), buffer);
              uploadedPhotos.push(`/uploads/${filename}`);
            }
          }
        });
      }
    }

    // Assemble final photo list
    let finalPhotos = [...uploadedPhotos];

    if (photoUrl && photoUrl.trim()) {
      finalPhotos.push(photoUrl.trim());
    }

    if (finalPhotos.length === 0) {
      finalPhotos = [FALLBACK_IMAGES[animalType] || FALLBACK_IMAGES.Other];
    }

    const primaryPhotoUrl = finalPhotos[0];

    // Determine nearest NGO based on coordinates
    const ngos = db.getNgos();
    const nearestResult = geoUtils.findNearestNgo(lat, lon, ngos);

    const nearestNgo = nearestResult ? nearestResult.ngo : (ngos[0] || null);
    const distanceKm = nearestResult ? nearestResult.distanceKm : 2.5;

    // Normalize priority (must be one of 4 defined categories)
    const validPriorities = ['Critical', 'Urgent', 'Moderate', 'Low / Shelter Care', 'Low'];
    const assignedPriority = validPriorities.includes(priority) ? priority : 'Urgent';

    const report = db.addReport({
      animalType: animalType.trim(),
      animalCondition: animalCondition.trim(),
      priority: assignedPriority,
      description: description.trim(),
      locationText: locationText.trim(),
      latitude: lat,
      longitude: lon,
      photoUrl: primaryPhotoUrl,
      photos: finalPhotos,
      reporterName: reporterName ? reporterName.trim() : 'Anonymous Citizen',
      reporterPhone: reporterPhone ? reporterPhone.trim() : 'Not Provided',
      assignedNgoId: nearestNgo ? nearestNgo.id : null,
      assignedNgoName: nearestNgo ? nearestNgo.name : null,
      assignedVolunteerId: null,
      assignedVolunteerName: null,
      nearestDistanceKm: distanceKm
    });

    return res.status(201).json({
      success: true,
      message: 'Rescue report submitted successfully! Search for nearest NGO completed.',
      report,
      nearestNgo: nearestNgo ? {
        id: nearestNgo.id,
        name: nearestNgo.name,
        phone: nearestNgo.phone,
        address: nearestNgo.address,
        distanceKm: distanceKm,
        operatingHours: nearestNgo.operatingHours
      } : null
    });
  } catch (err) {
    console.error('Error creating report:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating rescue report.'
    });
  }
};

exports.getAllReports = (req, res) => {
  try {
    const { status, priority, search, ngoId, volunteerId } = req.query;
    let reports = db.getReports();

    // Filters
    if (status && status !== 'All') {
      reports = reports.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    if (priority && priority !== 'All') {
      reports = reports.filter(r => {
        if (priority === 'Low') {
          return r.priority.toLowerCase().includes('low');
        }
        return r.priority.toLowerCase() === priority.toLowerCase();
      });
    }

    if (ngoId) {
      reports = reports.filter(r => r.assignedNgoId === ngoId);
    }

    if (volunteerId) {
      reports = reports.filter(r => r.assignedVolunteerId === volunteerId);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      reports = reports.filter(r =>
        (r.caseId && r.caseId.toLowerCase().includes(q)) ||
        (r.animalType && r.animalType.toLowerCase().includes(q)) ||
        (r.animalCondition && r.animalCondition.toLowerCase().includes(q)) ||
        (r.locationText && r.locationText.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Apply data privacy filter
    const sanitizedReports = reports.map(r => sanitizeReportForPublic(r, req.user));

    return res.json({
      success: true,
      count: sanitizedReports.length,
      reports: sanitizedReports
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching rescue reports.'
    });
  }
};

exports.getReportById = (req, res) => {
  try {
    const { id } = req.params;
    const report = db.getReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Case ID or Report "${id}" was not found in the system.`
      });
    }

    const sanitized = sanitizeReportForPublic(report, req.user);

    return res.json({
      success: true,
      report: sanitized
    });
  } catch (err) {
    console.error('Error fetching report by id:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching rescue case.'
    });
  }
};

exports.updateReportStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = [
      'Reported',
      'Assigned',
      'On the Way',
      'Rescued',
      'Treatment',
      'Completed'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Case ${id} not found.`
      });
    }

    // Check if points should be awarded to the assigned volunteer
    let creditsEarned = 0;
    let updatedVol = null;
    const volId = report.assignedVolunteerId || (req.user && req.user.volunteerId);

    if (volId && report.status !== status) {
      if (status === 'Rescued') {
        creditsEarned = 75;
        updatedVol = db.addVolunteerCredits(volId, 75, false);
      } else if (status === 'Treatment') {
        creditsEarned = 50;
        updatedVol = db.addVolunteerCredits(volId, 50, false);
      } else if (status === 'Completed') {
        creditsEarned = 150;
        updatedVol = db.addVolunteerCredits(volId, 150, true);
      }
    }

    const updated = db.updateReport(id, {
      status,
      statusNote: note || `Status transitioned to "${status}" by ${req.user ? req.user.name : 'Rescue Team'}.`
    });

    let message = `Case ${updated.caseId} status successfully updated to "${status}".`;
    if (creditsEarned > 0) {
      message += ` You earned +${creditsEarned} Rescue Credits!`;
    }

    return res.json({
      success: true,
      message,
      creditsEarned,
      volunteer: updatedVol,
      report: sanitizeReportForPublic(updated, req.user)
    });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating case status.'
    });
  }
};

exports.assignReport = (req, res) => {
  try {
    const { id } = req.params;
    const { ngoId, volunteerId, note } = req.body;

    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Case ${id} not found.`
      });
    }

    const updates = {};

    if (ngoId) {
      const ngo = db.getNgoById(ngoId);
      if (ngo) {
        updates.assignedNgoId = ngo.id;
        updates.assignedNgoName = ngo.name;
      }
    }

    if (volunteerId) {
      const vol = db.getVolunteerById(volunteerId);
      if (vol) {
        updates.assignedVolunteerId = vol.id;
        updates.assignedVolunteerName = vol.name;
        // Also update volunteer status to On Field
        db.updateVolunteer(vol.id, { status: 'On Field' });
      }
    }

    // If still in 'Reported' status, automatically advance to 'Assigned'
    if (report.status === 'Reported') {
      updates.status = 'Assigned';
      updates.statusNote = note || `Assigned to ${updates.assignedNgoName || 'rescue team'}${updates.assignedVolunteerName ? ' & responder ' + updates.assignedVolunteerName : ''}.`;
    }

    const updated = db.updateReport(id, updates);

    return res.json({
      success: true,
      message: `Case ${updated.caseId} assignment updated successfully.`,
      report: sanitizeReportForPublic(updated, req.user)
    });
  } catch (err) {
    console.error('Error assigning report:', err);
    return res.status(500).json({
      success: false,
      message: 'Error assigning case.'
    });
  }
};

exports.deleteReport = (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteReport(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    return res.json({ success: true, message: 'Case removed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting case.' });
  }
};

exports.acceptReportByVolunteer = (req, res) => {
  try {
    const { id } = req.params;
    let volunteerId = req.body.volunteerId;
    let volunteerName = req.body.volunteerName;

    if (req.user && req.user.volunteerId) {
      volunteerId = req.user.volunteerId;
      volunteerName = req.user.name;
    }

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer ID is required to accept a rescue case.'
      });
    }

    const report = db.getReportById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Case ${id} not found.`
      });
    }

    if (['Completed', 'Cancelled'].includes(report.status)) {
      return res.status(400).json({
        success: false,
        message: `Case ${id} is already ${report.status}.`
      });
    }

    const vol = db.getVolunteerById(volunteerId);
    const assignedName = vol ? vol.name : (volunteerName || 'Field Responder');

    // Update volunteer status to On Field
    if (vol) {
      db.updateVolunteer(vol.id, { status: 'On Field' });
    }

    // Award +50 Credit Points for stepping up & accepting the rescue!
    const updatedVol = db.addVolunteerCredits(volunteerId, 50, false);

    // Update report to On the Way
    const updated = db.updateReport(id, {
      assignedVolunteerId: volunteerId,
      assignedVolunteerName: assignedName,
      status: 'On the Way',
      statusNote: `Rescue case accepted by field volunteer ${assignedName}. Volunteer is dispatched and on the way.`
    });

    return res.json({
      success: true,
      message: `Case ${updated.caseId} accepted! You earned +50 Rescue Credits.`,
      creditsEarned: 50,
      report: sanitizeReportForPublic(updated, req.user),
      volunteer: updatedVol
    });
  } catch (err) {
    console.error('Error accepting report by volunteer:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while accepting rescue case.'
    });
  }
};
