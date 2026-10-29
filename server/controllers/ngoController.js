/**
 * Animal Rescue Connect - NGO & Volunteer Controller
 */

const db = require('../data/db');

exports.getAllNgos = (req, res) => {
  try {
    const ngos = db.getNgos();
    return res.json({ success: true, count: ngos.length, ngos });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving NGOs.' });
  }
};

exports.getNgoById = (req, res) => {
  try {
    const ngo = db.getNgoById(req.params.id);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'NGO not found.' });
    }
    return res.json({ success: true, ngo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving NGO.' });
  }
};

exports.getAllVolunteers = (req, res) => {
  try {
    const { ngoId } = req.query;
    let volunteers = db.getVolunteers();
    if (ngoId) {
      volunteers = volunteers.filter(v => v.ngoId === ngoId);
    }
    return res.json({ success: true, count: volunteers.length, volunteers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving volunteers.' });
  }
};

exports.getVolunteerById = (req, res) => {
  try {
    let id = req.params.id;
    if (id === 'me' || id === 'current') {
      id = (req.user && req.user.volunteerId) ? req.user.volunteerId : 'VOL-01';
    }
    const vol = db.getVolunteerById(id);
    if (!vol) {
      return res.status(404).json({ success: false, message: 'Volunteer not found.' });
    }
    return res.json({ success: true, volunteer: vol });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving volunteer.' });
  }
};

exports.updateVolunteerStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Available', 'On Field', 'Off Duty'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = db.updateVolunteer(id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Volunteer not found.' });
    }
    return res.json({ success: true, message: 'Status updated.', volunteer: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating volunteer.' });
  }
};
