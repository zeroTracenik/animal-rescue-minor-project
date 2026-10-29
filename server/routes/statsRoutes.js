const express = require('express');
const router = express.Router();
const db = require('../data/db');

router.get('/', (req, res) => {
  try {
    const stats = db.getStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve stats.' });
  }
});

router.post('/reset', (req, res) => {
  try {
    const result = db.resetDatabase();
    return res.json({ success: true, message: 'Demo data has been reset to defaults.', result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
});

module.exports = router;
