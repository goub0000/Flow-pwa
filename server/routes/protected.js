const express = require('express');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireEmailVerification,
  requireRole,
  requireAccountType,
  requirePermission
} = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/protected/student-dashboard
// @desc    Get student dashboard data
// @access  Private - Students only
router.get('/student-dashboard', requireAccountType('student'), async (req, res) => {
  try {
    // This would typically fetch student-specific data like applications, deadlines, etc.
    const dashboardData = {
      applications: {
        total: 5,
        submitted: 3,
        pending: 2,
        accepted: 1
      },
      deadlines: [
        {
          university: 'University of Ghana',
          program: 'Computer Science',
          deadline: '2024-03-15',
          status: 'upcoming'
        }
      ],
      recommendations: {
        requested: 2,
        received: 1,
        pending: 1
      },
      profile_completion: 85
    };

    res.json({
      message: 'Student dashboard data retrieved successfully',
      data: dashboardData,
      user: {
        id: req.user._id,
        name: req.user.fullName,
        accountType: req.user.accountType
      }
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load student dashboard'
    });
  }
});

// @route   GET /api/protected/institution-dashboard
// @desc    Get institution dashboard data
// @access  Private - Institutions only
router.get('/institution-dashboard', requireAccountType('institution'), async (req, res) => {
  try {
    const dashboardData = {
      applications: {
        total: 150,
        pending_review: 45,
        accepted: 80,
        rejected: 25
      },
      programs: {
        active: 15,
        popular: [
          { name: 'Computer Science', applications: 45 },
          { name: 'Business Administration', applications: 38 },
          { name: 'Engineering', applications: 32 }
        ]
      },
      deadlines: {
        upcoming: 3,
        overdue: 0
      },
      statistics: {
        acceptance_rate: 53.3,
        avg_gpa: 3.2
      }
    };

    res.json({
      message: 'Institution dashboard data retrieved successfully',
      data: dashboardData,
      user: {
        id: req.user._id,
        name: req.user.fullName || req.user.profile.institutionName,
        accountType: req.user.accountType
      }
    });

  } catch (error) {
    console.error('Institution dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load institution dashboard'
    });
  }
});

// @route   GET /api/protected/counselor-dashboard
// @desc    Get counselor dashboard data
// @access  Private - Counselors only
router.get('/counselor-dashboard', requireAccountType('counselor'), async (req, res) => {
  try {
    const dashboardData = {
      students: {
        total: 25,
        active: 18,
        graduated: 7
      },
      applications: {
        assisted: 45,
        in_progress: 12,
        submitted: 33
      },
      appointments: {
        today: 3,
        this_week: 8,
        upcoming: 15
      },
      success_rate: {
        acceptance: 78.5,
        scholarship: 34.2
      }
    };

    res.json({
      message: 'Counselor dashboard data retrieved successfully',
      data: dashboardData,
      user: {
        id: req.user._id,
        name: req.user.fullName,
        accountType: req.user.accountType
      }
    });

  } catch (error) {
    console.error('Counselor dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load counselor dashboard'
    });
  }
});

// @route   GET /api/protected/parent-dashboard
// @desc    Get parent dashboard data
// @access  Private - Parents only
router.get('/parent-dashboard', requireAccountType('parent'), async (req, res) => {
  try {
    const dashboardData = {
      children: req.user.profile.children || [],
      applications_overview: {
        total: 8,
        submitted: 6,
        pending: 2,
        accepted: 3
      },
      financial_aid: {
        applied: 4,
        awarded: 2,
        total_amount: 15000
      },
      deadlines: [
        {
          child: 'John Doe',
          university: 'University of Cape Town',
          deadline: '2024-02-28',
          status: 'urgent'
        }
      ]
    };

    res.json({
      message: 'Parent dashboard data retrieved successfully',
      data: dashboardData,
      user: {
        id: req.user._id,
        name: req.user.fullName,
        accountType: req.user.accountType
      }
    });

  } catch (error) {
    console.error('Parent dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load parent dashboard'
    });
  }
});

// @route   GET /api/protected/recommender-dashboard
// @desc    Get recommender dashboard data
// @access  Private - Recommenders only
router.get('/recommender-dashboard', requireAccountType('recommender'), async (req, res) => {
  try {
    const dashboardData = {
      recommendations: {
        total: 35,
        pending: 8,
        completed: 27,
        overdue: 2
      },
      students: {
        current: 12,
        past: 23
      },
      deadlines: [
        {
          student: 'Jane Smith',
          university: 'University of Nairobi',
          deadline: '2024-03-10',
          status: 'upcoming'
        }
      ],
      templates: 5
    };

    res.json({
      message: 'Recommender dashboard data retrieved successfully',
      data: dashboardData,
      user: {
        id: req.user._id,
        name: req.user.fullName,
        accountType: req.user.accountType
      }
    });

  } catch (error) {
    console.error('Recommender dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load recommender dashboard'
    });
  }
});

// @route   GET /api/protected/admin/stats
// @desc    Get admin statistics
// @access  Private - Admin only
router.get('/admin/stats', requireRole('admin'), async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        students: await User.countDocuments({ accountType: 'student' }),
        institutions: await User.countDocuments({ accountType: 'institution' }),
        counselors: await User.countDocuments({ accountType: 'counselor' }),
        parents: await User.countDocuments({ accountType: 'parent' }),
        recommenders: await User.countDocuments({ accountType: 'recommender' })
      },
      verification: {
        verified: await User.countDocuments({ 'verification.email.verified': true }),
        unverified: await User.countDocuments({ 'verification.email.verified': false })
      },
      activity: {
        new_users_today: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        new_users_this_week: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        active_users: await User.countDocuments({
          'security.lastLogin': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      }
    };

    res.json({
      message: 'Admin statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to load admin statistics'
    });
  }
});

// @route   GET /api/protected/settings
// @desc    Get user settings (requires email verification)
// @access  Private - Email verification required
router.get('/settings', requireEmailVerification, async (req, res) => {
  try {
    const settings = {
      profile: req.user.profile,
      preferences: req.user.preferences,
      security: {
        twoFactorEnabled: req.user.security.twoFactorAuth.enabled,
        lastLogin: req.user.security.lastLogin
      },
      subscription: req.user.subscription
    };

    res.json({
      message: 'Settings retrieved successfully',
      settings
    });

  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({
      error: 'Failed to load settings'
    });
  }
});

// @route   POST /api/protected/verify-institution
// @desc    Request institution verification (institutions only)
// @access  Private - Institutions only
router.post('/verify-institution', requireAccountType('institution'), async (req, res) => {
  try {
    // This would typically start a verification process
    // For now, just return success
    
    res.json({
      message: 'Institution verification request submitted successfully',
      status: 'pending_review'
    });

  } catch (error) {
    console.error('Institution verification error:', error);
    res.status(500).json({
      error: 'Failed to submit verification request'
    });
  }
});

// @route   GET /api/protected/user-permissions
// @desc    Get current user's permissions
// @access  Private
router.get('/user-permissions', async (req, res) => {
  try {
    const permissions = {
      accountType: req.user.accountType,
      roles: req.user.permissions.roles,
      customPermissions: req.user.permissions.customPermissions,
      emailVerified: req.user.verification.email.verified,
      subscription: req.user.subscription
    };

    res.json({
      message: 'User permissions retrieved successfully',
      permissions
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      error: 'Failed to get user permissions'
    });
  }
});

module.exports = router;