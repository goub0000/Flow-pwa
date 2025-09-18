const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting
const parentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many parent requests, please try again later.' }
});

// Validation rules
const parentValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('relationship').isIn(['mother', 'father', 'guardian', 'other']).withMessage('Invalid relationship type')
];

// @route   POST /api/parents/register
// @desc    Register a new parent
// @access  Public
router.post('/register', parentLimiter, parentValidation, async (req, res) => {
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
      phone,
      relationship,
      address,
      occupation,
      children
    } = req.body;

    const parent = {
      id: 'parent_' + Date.now(),
      name,
      email,
      phone,
      relationship,
      address,
      occupation,
      children: children || [],
      status: 'active',
      registrationDate: new Date(),
      notificationPreferences: {
        email: true,
        sms: false,
        push: true
      }
    };

    res.status(201).json({
      success: true,
      message: 'Parent registered successfully',
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        relationship: parent.relationship,
        status: parent.status
      }
    });

  } catch (error) {
    console.error('Parent registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register parent'
    });
  }
});

// @route   GET /api/parents/profile
// @desc    Get parent profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = {
      id: req.user.id,
      name: 'Robert Johnson',
      email: 'robert.johnson@parent.com',
      phone: '+1-555-0789',
      relationship: 'father',
      occupation: 'Software Engineer',
      address: {
        street: '123 Main St',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
        zipCode: '100001'
      },
      children: [
        {
          id: 'student_1',
          name: 'Michael Johnson',
          grade: '12',
          school: 'Lagos International School',
          applications: 5,
          status: 'active'
        },
        {
          id: 'student_2',
          name: 'Sarah Johnson',
          grade: '10',
          school: 'Lagos International School',
          applications: 0,
          status: 'active'
        }
      ],
      notificationPreferences: {
        email: true,
        sms: false,
        push: true
      }
    };

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get parent profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile'
    });
  }
});

// @route   GET /api/parents/children
// @desc    Get parent's children information
// @access  Private
router.get('/children', authMiddleware, async (req, res) => {
  try {
    const children = [
      {
        id: 'student_1',
        name: 'Michael Johnson',
        email: 'michael.johnson@student.com',
        grade: '12',
        school: 'Lagos International School',
        gpa: 3.7,
        applications: [
          {
            id: 'app_1',
            institution: 'University of Lagos',
            program: 'Engineering',
            status: 'submitted',
            deadline: '2024-03-01'
          },
          {
            id: 'app_2',
            institution: 'University of Ibadan',
            program: 'Computer Science',
            status: 'under_review',
            deadline: '2024-02-28'
          }
        ],
        upcomingDeadlines: [
          {
            institution: 'Covenant University',
            program: 'Business Administration',
            deadline: '2024-02-15',
            daysRemaining: 10
          }
        ],
        recentActivity: [
          {
            date: '2024-01-15',
            action: 'Submitted application to University of Lagos',
            type: 'application'
          },
          {
            date: '2024-01-12',
            action: 'Completed essay for Computer Science program',
            type: 'document'
          }
        ]
      }
    ];

    res.json({
      success: true,
      children,
      total: children.length
    });

  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve children information'
    });
  }
});

// @route   GET /api/parents/notifications
// @desc    Get parent notifications
// @access  Private
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = [
      {
        id: 'notif_1',
        type: 'deadline_reminder',
        title: 'Application Deadline Approaching',
        message: 'Michael\'s application to Covenant University is due in 10 days',
        childName: 'Michael Johnson',
        date: '2024-01-16',
        read: false,
        priority: 'high'
      },
      {
        id: 'notif_2',
        type: 'application_update',
        title: 'Application Status Update',
        message: 'Application to University of Lagos has been received and is under review',
        childName: 'Michael Johnson',
        date: '2024-01-15',
        read: true,
        priority: 'medium'
      },
      {
        id: 'notif_3',
        type: 'document_required',
        title: 'Document Upload Required',
        message: 'Please upload official transcript for University of Ibadan application',
        childName: 'Michael Johnson',
        date: '2024-01-14',
        read: false,
        priority: 'medium'
      }
    ];

    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve notifications'
    });
  }
});

// @route   POST /api/parents/children/link
// @desc    Link a child to parent account
// @access  Private
router.post('/children/link', authMiddleware, async (req, res) => {
  try {
    const { childEmail, relationshipCode } = req.body;

    // Simulate child linking process
    const linkedChild = {
      id: 'student_' + Date.now(),
      name: 'New Child',
      email: childEmail,
      linkedDate: new Date(),
      status: 'pending_verification'
    };

    res.status(201).json({
      success: true,
      message: 'Child linked successfully. Verification email sent.',
      child: linkedChild
    });

  } catch (error) {
    console.error('Child linking error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to link child'
    });
  }
});

// @route   PUT /api/parents/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/notifications/preferences', authMiddleware, async (req, res) => {
  try {
    const { email, sms, push, frequency } = req.body;

    const preferences = {
      email: Boolean(email),
      sms: Boolean(sms),
      push: Boolean(push),
      frequency: frequency || 'immediate',
      updatedDate: new Date()
    };

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update preferences'
    });
  }
});

// @route   GET /api/parents/resources
// @desc    Get parental resources and guides
// @access  Private
router.get('/resources', authMiddleware, async (req, res) => {
  try {
    const resources = [
      {
        id: 'resource_1',
        title: 'College Application Timeline Guide',
        description: 'A comprehensive guide to help your child navigate the college application process',
        type: 'guide',
        category: 'application_process',
        url: '/resources/application-timeline.pdf',
        lastUpdated: '2024-01-10'
      },
      {
        id: 'resource_2',
        title: 'Financial Aid and Scholarship Guide',
        description: 'Everything you need to know about financial aid options and scholarship opportunities',
        type: 'guide',
        category: 'financial_aid',
        url: '/resources/financial-aid-guide.pdf',
        lastUpdated: '2024-01-08'
      },
      {
        id: 'resource_3',
        title: 'Supporting Your Child Through College Applications',
        description: 'Tips for parents on how to provide emotional and practical support',
        type: 'article',
        category: 'parental_guidance',
        url: '/resources/supporting-your-child.html',
        lastUpdated: '2024-01-05'
      }
    ];

    res.json({
      success: true,
      resources,
      total: resources.length
    });

  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve resources'
    });
  }
});

// @route   PUT /api/parents/profile
// @desc    Update parent profile
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