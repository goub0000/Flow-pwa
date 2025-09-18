const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting
const recommenderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many recommender requests, please try again later.' }
});

// Validation rules
const recommenderValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('position').trim().isLength({ min: 2, max: 100 }).withMessage('Position must be between 2 and 100 characters'),
  body('institution').trim().isLength({ min: 2, max: 100 }).withMessage('Institution must be between 2 and 100 characters'),
  body('relationship').isIn(['teacher', 'professor', 'counselor', 'supervisor', 'mentor', 'coach', 'other']).withMessage('Invalid relationship type')
];

// @route   POST /api/recommenders/register
// @desc    Register a new recommender
// @access  Public
router.post('/register', recommenderLimiter, recommenderValidation, async (req, res) => {
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
      position,
      institution,
      relationship,
      department,
      phone,
      yearsKnownStudent,
      subjects
    } = req.body;

    const recommender = {
      id: 'recommender_' + Date.now(),
      name,
      email,
      position,
      institution,
      relationship,
      department,
      phone,
      yearsKnownStudent,
      subjects,
      status: 'active',
      registrationDate: new Date(),
      recommendationsWritten: 0,
      rating: 0
    };

    res.status(201).json({
      success: true,
      message: 'Recommender registered successfully',
      recommender: {
        id: recommender.id,
        name: recommender.name,
        email: recommender.email,
        position: recommender.position,
        institution: recommender.institution,
        status: recommender.status
      }
    });

  } catch (error) {
    console.error('Recommender registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register recommender'
    });
  }
});

// @route   GET /api/recommenders/profile
// @desc    Get recommender profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = {
      id: req.user.id,
      name: 'Dr. Emily Wilson',
      email: 'emily.wilson@teacher.com',
      position: 'Professor of Mathematics',
      institution: 'Lagos State University',
      department: 'Mathematics Department',
      phone: '+1-555-0456',
      yearsOfExperience: 12,
      subjects: ['Mathematics', 'Statistics', 'Calculus'],
      recommendationsWritten: 47,
      rating: 4.9,
      students: [
        {
          id: 'student_1',
          name: 'John Doe',
          status: 'pending',
          requestDate: '2024-01-15',
          deadline: '2024-02-15'
        },
        {
          id: 'student_2',
          name: 'Jane Smith',
          status: 'completed',
          submittedDate: '2024-01-10',
          institution: 'University of Lagos'
        }
      ]
    };

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get recommender profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile'
    });
  }
});

// @route   GET /api/recommenders/requests
// @desc    Get recommendation requests
// @access  Private
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = [
      {
        id: 'request_1',
        studentName: 'John Doe',
        studentEmail: 'john.doe@student.com',
        institution: 'University of Lagos',
        program: 'Computer Science',
        deadline: '2024-02-15',
        status: 'pending',
        requestDate: '2024-01-15',
        priority: 'high',
        personalStatement: 'John has been an exceptional student in my Advanced Mathematics class...',
        requiredFields: [
          'academic_performance',
          'character_assessment',
          'leadership_qualities',
          'communication_skills'
        ]
      },
      {
        id: 'request_2',
        studentName: 'Jane Smith',
        studentEmail: 'jane.smith@student.com',
        institution: 'University of Ibadan',
        program: 'Engineering',
        deadline: '2024-03-01',
        status: 'in_progress',
        requestDate: '2024-01-10',
        priority: 'medium',
        personalStatement: 'Jane has consistently demonstrated excellence in problem-solving...',
        requiredFields: [
          'academic_performance',
          'technical_skills',
          'teamwork',
          'innovation'
        ]
      },
      {
        id: 'request_3',
        studentName: 'Michael Brown',
        studentEmail: 'michael.brown@student.com',
        institution: 'Covenant University',
        program: 'Business Administration',
        deadline: '2024-01-20',
        status: 'completed',
        requestDate: '2024-01-05',
        submittedDate: '2024-01-18',
        priority: 'low'
      }
    ];

    const { status, priority } = req.query;
    let filteredRequests = requests;

    if (status) {
      filteredRequests = filteredRequests.filter(r => r.status === status);
    }
    if (priority) {
      filteredRequests = filteredRequests.filter(r => r.priority === priority);
    }

    res.json({
      success: true,
      requests: filteredRequests,
      total: filteredRequests.length,
      summary: {
        pending: requests.filter(r => r.status === 'pending').length,
        in_progress: requests.filter(r => r.status === 'in_progress').length,
        completed: requests.filter(r => r.status === 'completed').length
      }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve requests'
    });
  }
});

// @route   POST /api/recommenders/recommendations
// @desc    Submit a recommendation
// @access  Private
router.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const {
      requestId,
      studentId,
      content,
      ratings,
      additionalComments,
      confidential
    } = req.body;

    const recommendation = {
      id: 'rec_' + Date.now(),
      requestId,
      studentId,
      recommenderId: req.user.id,
      content,
      ratings: {
        academicPerformance: ratings?.academicPerformance || 5,
        character: ratings?.character || 5,
        leadership: ratings?.leadership || 5,
        communication: ratings?.communication || 5,
        overall: ratings?.overall || 5
      },
      additionalComments,
      confidential: Boolean(confidential),
      submittedDate: new Date(),
      status: 'submitted'
    };

    res.status(201).json({
      success: true,
      message: 'Recommendation submitted successfully',
      recommendation: {
        id: recommendation.id,
        requestId: recommendation.requestId,
        status: recommendation.status,
        submittedDate: recommendation.submittedDate
      }
    });

  } catch (error) {
    console.error('Recommendation submission error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit recommendation'
    });
  }
});

// @route   PUT /api/recommenders/requests/:id/status
// @desc    Update request status
// @access  Private
router.put('/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: ' + validStatuses.join(', ')
      });
    }

    const updatedRequest = {
      id,
      status,
      notes,
      lastUpdated: new Date(),
      updatedBy: req.user.id
    };

    res.json({
      success: true,
      message: 'Request status updated successfully',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update request status'
    });
  }
});

// @route   GET /api/recommenders/forms/:requestId
// @desc    Get recommendation form for specific request
// @access  Private
router.get('/forms/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const form = {
      requestId,
      studentName: 'John Doe',
      institution: 'University of Lagos',
      program: 'Computer Science',
      deadline: '2024-02-15',
      fields: [
        {
          id: 'academic_performance',
          label: 'Academic Performance',
          type: 'rating_with_comment',
          required: true,
          description: 'Please rate the student\'s academic performance and provide specific examples'
        },
        {
          id: 'character_assessment',
          label: 'Character Assessment',
          type: 'rating_with_comment',
          required: true,
          description: 'Please assess the student\'s character, integrity, and personal qualities'
        },
        {
          id: 'leadership_qualities',
          label: 'Leadership Qualities',
          type: 'rating_with_comment',
          required: false,
          description: 'Please comment on any leadership experience or potential'
        },
        {
          id: 'communication_skills',
          label: 'Communication Skills',
          type: 'rating_with_comment',
          required: true,
          description: 'Please assess the student\'s written and verbal communication abilities'
        },
        {
          id: 'overall_recommendation',
          label: 'Overall Recommendation',
          type: 'long_text',
          required: true,
          description: 'Please provide an overall assessment and recommendation'
        }
      ],
      instructions: [
        'Please be honest and specific in your assessment',
        'Provide concrete examples where possible',
        'Your recommendation will be kept confidential',
        'All ratings are on a scale of 1-5 (1=Poor, 5=Excellent)'
      ]
    };

    res.json({
      success: true,
      form
    });

  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve form'
    });
  }
});

// @route   GET /api/recommenders/templates
// @desc    Get recommendation letter templates
// @access  Private
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const templates = [
      {
        id: 'template_1',
        name: 'Academic Recommendation',
        category: 'academic',
        description: 'Standard template for academic recommendations',
        fields: ['academic_performance', 'character', 'potential'],
        sample: 'I am pleased to recommend [Student Name] for admission to your [Program Name] program...'
      },
      {
        id: 'template_2',
        name: 'Character Reference',
        category: 'character',
        description: 'Template focusing on personal character and integrity',
        fields: ['character', 'leadership', 'community_service'],
        sample: 'I have known [Student Name] for [Duration] and can attest to their outstanding character...'
      },
      {
        id: 'template_3',
        name: 'Leadership Recommendation',
        category: 'leadership',
        description: 'Template highlighting leadership experience and potential',
        fields: ['leadership', 'teamwork', 'initiative'],
        sample: '[Student Name] has demonstrated exceptional leadership qualities in...'
      }
    ];

    res.json({
      success: true,
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve templates'
    });
  }
});

// @route   PUT /api/recommenders/profile
// @desc    Update recommender profile
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