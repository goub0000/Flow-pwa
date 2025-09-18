const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting
const counselorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many counselor requests, please try again later.' }
});

// Validation rules
const counselorValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('specialization').isIn(['college_applications', 'career_guidance', 'academic_planning', 'financial_aid']).withMessage('Invalid specialization'),
  body('experience').isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
  body('licenseNumber').optional().trim().isLength({ max: 50 }).withMessage('License number must be less than 50 characters')
];

// @route   POST /api/counselors/register
// @desc    Register a new counselor
// @access  Public
router.post('/register', counselorLimiter, counselorValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      email,
      specialization,
      experience,
      licenseNumber,
      organization,
      phone,
      bio
    } = req.body;

    const counselor = {
      id: 'counselor_' + Date.now(),
      name,
      email,
      specialization,
      experience,
      licenseNumber,
      organization,
      phone,
      bio,
      status: 'active',
      registrationDate: new Date(),
      students: [],
      rating: 0,
      reviewCount: 0
    };

    res.status(201).json({
      success: true,
      message: 'Counselor registered successfully',
      counselor: {
        id: counselor.id,
        name: counselor.name,
        email: counselor.email,
        specialization: counselor.specialization,
        status: counselor.status
      }
    });

  } catch (error) {
    console.error('Counselor registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register counselor'
    });
  }
});

// @route   GET /api/counselors/profile
// @desc    Get counselor profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = {
      id: req.user.id,
      name: 'Jane Smith',
      email: 'jane.smith@counselor.com',
      specialization: 'college_applications',
      experience: 8,
      organization: 'Elite Guidance Center',
      phone: '+1-555-0123',
      bio: 'Experienced college counselor specializing in helping students navigate the application process.',
      students: [
        { id: 'student_1', name: 'John Doe', status: 'active' },
        { id: 'student_2', name: 'Jane Wilson', status: 'completed' }
      ],
      rating: 4.8,
      reviewCount: 47,
      totalStudentsHelped: 156,
      successRate: 92
    };

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get counselor profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile'
    });
  }
});

// @route   GET /api/counselors/students
// @desc    Get counselor's students
// @access  Private
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const students = [
      {
        id: 'student_1',
        name: 'John Doe',
        email: 'john.doe@student.com',
        grade: '12',
        gpa: 3.8,
        status: 'active',
        applicationCount: 5,
        lastContact: '2024-01-15',
        goals: ['Computer Science', 'Engineering']
      },
      {
        id: 'student_2',
        name: 'Jane Wilson',
        email: 'jane.wilson@student.com',
        grade: '11',
        gpa: 3.9,
        status: 'active',
        applicationCount: 2,
        lastContact: '2024-01-12',
        goals: ['Medicine', 'Biology']
      }
    ];

    res.json({
      success: true,
      students,
      total: students.length
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve students'
    });
  }
});

// @route   POST /api/counselors/sessions
// @desc    Schedule a counseling session
// @access  Private
router.post('/sessions', authMiddleware, async (req, res) => {
  try {
    const {
      studentId,
      date,
      time,
      duration,
      type,
      notes
    } = req.body;

    const session = {
      id: 'session_' + Date.now(),
      counselorId: req.user.id,
      studentId,
      date,
      time,
      duration,
      type,
      notes,
      status: 'scheduled',
      createdDate: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully',
      session
    });

  } catch (error) {
    console.error('Session scheduling error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to schedule session'
    });
  }
});

// @route   GET /api/counselors/sessions
// @desc    Get counselor's sessions
// @access  Private
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = [
      {
        id: 'session_1',
        studentName: 'John Doe',
        date: '2024-01-20',
        time: '10:00 AM',
        duration: 60,
        type: 'college_planning',
        status: 'scheduled'
      },
      {
        id: 'session_2',
        studentName: 'Jane Wilson',
        date: '2024-01-18',
        time: '2:00 PM',
        duration: 45,
        type: 'application_review',
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      sessions,
      total: sessions.length
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve sessions'
    });
  }
});

// @route   PUT /api/counselors/profile
// @desc    Update counselor profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    const updatedProfile = {
      id: req.user.id,
      ...updates,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;