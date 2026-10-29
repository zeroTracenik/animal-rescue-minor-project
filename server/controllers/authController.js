/**
 * Animal Rescue Connect - Auth Controller
 * Handles registration, login, password hashing, and user profile queries.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../data/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 10;

exports.register = (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      ngoId,
      volunteerId,
      ngoRegId,
      ngoOwnerName,
      address,
      latitude,
      longitude
    } = req.body;

    // Block public admin self-registration
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be self-registered.'
      });
    }

    // Basic Input Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const validRoles = ['citizen', 'ngo', 'volunteer'];
    const assignedRole = validRoles.includes(role) ? role : 'citizen';

    // Check if email already registered
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // If NGO role, create NGO profile record
    let linkedNgoId = ngoId || null;
    if (assignedRole === 'ngo') {
      const createdNgo = db.addNgo({
        name: name.trim(),
        ngoRegId: ngoRegId || 'MH/NGP/PENDING',
        ngoOwnerName: ngoOwnerName || name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : '',
        address: address || 'Nagpur, Maharashtra',
        latitude: latitude ? parseFloat(latitude) : 21.1458,
        longitude: longitude ? parseFloat(longitude) : 79.0882
      });
      linkedNgoId = createdNgo.id;
    }

    // Password Hashing (Cybersecurity Best Practice)
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

    const newUser = db.addUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: assignedRole,
      ngoId: linkedNgoId,
      volunteerId: volunteerId || null
    });

    // Create JWT Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Never return passwordHash in response
    const { passwordHash: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Animal Rescue Connect.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.'
      });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password combination.'
      });
    }

    // Compare with hashed password
    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password combination.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

exports.getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not logged in.' });
  }
  const { passwordHash: _, ...safeUser } = req.user;
  return res.json({ success: true, user: safeUser });
};

exports.getAllUsers = (req, res) => {
  const users = db.getUsers().map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });
  return res.json({ success: true, users });
};
