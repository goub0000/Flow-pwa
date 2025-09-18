const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting for student operations
const studentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 student requests per windowMs
  message: {
    error: 'Too many student requests, please try again later.'
  }
});

// Validation rules for student registration
const studentValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('dateOfBirth')
    .isDate()
    .withMessage('Please provide a valid date of birth'),
  body('grade')
    .optional()
    .isIn(['9', '10', '11', '12', 'graduated'])
    .withMessage('Grade must be 9, 10, 11, 12, or graduated'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

// @route   POST /api/students/register
// @desc    Register a new student
// @access  Public
router.post('/register', studentLimiter, studentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      grade,
      phone,
      address,
      parentContact
    } = req.body;

    // Simulate student registration
    const student = {
      id: 'student_' + Date.now(),
      firstName,
      lastName,
      email,
      dateOfBirth,
      grade,
      phone,
      address,
      parentContact,
      status: 'active',
      registrationDate: new Date(),
      applications: []
    };

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        status: student.status
      }
    });

  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register student'
    });
  }
});

// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Simulate profile retrieval
    const profile = {
      id: req.user.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@student.com',
      grade: '12',
      gpa: 3.8,
      applications: [
        {
          id: 'app_1',
          institution: 'University of Lagos',
          program: 'Computer Science',
          status: 'submitted',
          submittedDate: '2024-01-15'
        }
      ],
      documents: [
        { type: 'transcript', status: 'verified' },
        { type: 'essay', status: 'pending' }
      ]
    };

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile'
    });
  }
});

// @route   POST /api/students/applications
// @desc    Submit a new application
// @access  Private
router.post('/applications', authMiddleware, async (req, res) => {
  try {
    const {
      institutionId,
      programId,
      documents,
      personalStatement,
      additionalInfo
    } = req.body;

    // Simulate application submission
    const application = {
      id: 'app_' + Date.now(),
      studentId: req.user.id,
      institutionId,
      programId,
      documents,
      personalStatement,
      additionalInfo,
      status: 'submitted',
      submittedDate: new Date(),
      lastUpdated: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit application'
    });
  }
});

// @route   GET /api/students/applications
// @desc    Get student applications
// @access  Private
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    // Simulate applications retrieval
    const applications = [
      {
        id: 'app_1',
        institution: 'University of Lagos',
        program: 'Computer Science',
        status: 'under_review',
        submittedDate: '2024-01-15',
        deadline: '2024-03-01'
      },
      {
        id: 'app_2',
        institution: 'University of Ibadan',
        program: 'Medicine',
        status: 'submitted',
        submittedDate: '2024-01-20',
        deadline: '2024-02-28'
      }
    ];

    res.json({
      success: true,
      applications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve applications'
    });
  }
});

// @route   GET /api/students/programs/search
// @desc    Search available programs
// @access  Public
router.get('/programs/search', async (req, res) => {
  try {
    const { q, field, location, level } = req.query;

    // Simulate program search
    const programs = [
      {
        id: 'prog_1',
        name: 'Computer Science',
        institution: 'University of Lagos',
        level: 'bachelor',
        duration: '4 years',
        tuition: '$2000/year',
        location: 'Lagos, Nigeria',
        deadline: '2024-03-01'
      },
      {
        id: 'prog_2',
        name: 'Medicine',
        institution: 'University of Ibadan',
        level: 'professional',
        duration: '6 years',
        tuition: '$3000/year',
        location: 'Ibadan, Nigeria',
        deadline: '2024-02-28'
      },
      {
        id: 'prog_3',
        name: 'Business Administration',
        institution: 'Lagos Business School',
        level: 'master',
        duration: '2 years',
        tuition: '$5000/year',
        location: 'Lagos, Nigeria',
        deadline: '2024-04-15'
      }
    ];

    // Filter programs based on query parameters
    let filteredPrograms = programs;
    if (q) {
      filteredPrograms = filteredPrograms.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.institution.toLowerCase().includes(q.toLowerCase())
      );
    }
    if (field) {
      filteredPrograms = filteredPrograms.filter(p =>
        p.name.toLowerCase().includes(field.toLowerCase())
      );
    }
    if (location) {
      filteredPrograms = filteredPrograms.filter(p =>
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (level) {
      filteredPrograms = filteredPrograms.filter(p => p.level === level);
    }

    res.json({
      success: true,
      programs: filteredPrograms,
      total: filteredPrograms.length
    });

  } catch (error) {
    console.error('Program search error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search programs'
    });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    // Simulate profile update
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