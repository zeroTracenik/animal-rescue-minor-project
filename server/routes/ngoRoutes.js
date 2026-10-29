const express = require('express');
const router = express.Router();
const ngoController = require('../controllers/ngoController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/', ngoController.getAllNgos);
router.get('/:id', ngoController.getNgoById);
router.get('/volunteers/all', ngoController.getAllVolunteers);
router.get('/volunteers/:id', ngoController.getVolunteerById);
router.put('/volunteers/:id/status', authenticate, requireRole(['ngo', 'volunteer', 'admin']), ngoController.updateVolunteerStatus);

module.exports = router;
