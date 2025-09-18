const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Institution = require('../models/Institution');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting for institution operations
const institutionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 institution requests per windowMs
  message: {
    error: 'Too many institution requests, please try again later.'
  }
});

// Validation rules for institution registration
const institutionValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution name must be between 2 and 100 characters'),
  body('type')
    .isIn(['university', 'college', 'technical', 'community'])
    .withMessage('Invalid institution type'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('accreditation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Accreditation must be less than 100 characters')
];

// @route   POST /api/institutions/register
// @desc    Register a new institution
// @access  Public (for onboarding)
router.post('/register', institutionLimiter, institutionValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      type,
      country,
      city,
      website,
      email,
      phone,
      accreditation,
      programs,
      teamMembers,
      settings
    } = req.body;

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({
      $or: [
        { email: email },
        { name: { $regex: new RegExp(`^${name}$`, 'i') } }
      ]
    });

    if (existingInstitution) {
      return res.status(409).json({
        error: 'Institution already exists',
        message: 'An institution with this name or email already exists'
      });
    }

    // Create new institution
    const institution = new Institution({
      name,
      type,
      location: {
        country,
        city
      },
      website,
      email,
      phone,
      accreditation,
      programs: programs || [],
      teamMembers: teamMembers || [],
      settings: settings || {},
      onboardingComplete: false,
      status: 'pending_verification',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await institution.save();

    // Return success response (without sensitive data)
    res.status(201).json({
      success: true,
      message: 'Institution registered successfully',
      institution: {
        id: institution._id,
        name: institution.name,
        type: institution.type,
        email: institution.email,
        status: institution.status,
        onboardingComplete: institution.onboardingComplete
      }
    });

  } catch (error) {
    console.error('Institution registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register institution'
    });
  }
});

// @route   PUT /api/institutions/:id/onboarding
// @desc    Update institution onboarding progress
// @access  Private (institution admin)
router.put('/:id/onboarding', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      step,
      data,
      completed = false
    } = req.body;

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({
        error: 'Institution not found'
      });
    }

    // Update onboarding data
    institution.onboardingData = {
      ...institution.onboardingData,
      [`step${step}`]: data
    };

    if (completed) {
      institution.onboardingComplete = true;
      institution.status = 'active';
    }

    institution.updatedAt = new Date();
    await institution.save();

    res.json({
      success: true,
      message: 'Onboarding updated successfully',
      onboardingComplete: institution.onboardingComplete,
      status: institution.status
    });

  } catch (error) {
    console.error('Onboarding update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update onboarding'
    });
  }
});

// @route   GET /api/institutions/:id
// @desc    Get institution details
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await Institution.findById(id).select('-__v');
    if (!institution) {
      return res.status(404).json({
        error: 'Institution not found'
      });
    }

    res.json({
      success: true,
      institution
    });

  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve institution'
    });
  }
});

// @route   GET /api/institutions
// @desc    Get all institutions (admin only)
// @access  Private (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const institutions = await Institution.find()
      .select('name type email status onboardingComplete createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Institution.countDocuments();

    res.json({
      success: true,
      institutions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve institutions'
    });
  }
});

module.exports = router;