const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const reportController = require('../controllers/reportController');
const { authenticateOptional, authenticate, requireRole } = require('../middleware/authMiddleware');

// Configure multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `report-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
  }
});

// Support multiple photos under 'photos' and single photo under 'photo'
const uploadMiddleware = upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'photo', maxCount: 1 }
]);

// Citizen can report without login
router.post('/', uploadMiddleware, reportController.createReport);

// Public query routes (sensitive info masked unless authorized)
router.get('/', authenticateOptional, reportController.getAllReports);
router.get('/:id', authenticateOptional, reportController.getReportById);

// Status updates & assignments
router.put('/:id/status', authenticateOptional, reportController.updateReportStatus);
router.post('/:id/assign', authenticateOptional, reportController.assignReport);
router.post('/:id/accept', authenticateOptional, reportController.acceptReportByVolunteer);

// Admin-only deletion
router.delete('/:id', authenticate, requireRole(['admin']), reportController.deleteReport);

module.exports = router;
