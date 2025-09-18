const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireEmailVerification,
  requireRole,
  requireAccountType 
} = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('institutionName').optional().isLength({ min: 1, max: 100 }).withMessage('Institution name must be between 1 and 100 characters'),
  body('institutionType').optional().isIn(['university', 'college', 'community_college', 'vocational', 'other']).withMessage('Invalid institution type'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('grade').optional().isIn(['9th', '10th', '11th', '12th', 'graduate']).withMessage('Invalid grade')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user._id;
    const updateData = {};

    // Extract profile fields from request body
    const profileFields = [
      'firstName', 'lastName', 'phoneNumber', 'avatar',
      'institutionName', 'institutionType', 'dateOfBirth', 'grade'
    ];

    profileFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[`profile.${field}`] = req.body[field];
      }
    });

    // Handle children array for parents
    if (req.user.accountType === 'parent' && req.body.children) {
      updateData['profile.children'] = req.body.children;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        accountType: user.accountType,
        profile: user.profile,
        fullName: user.fullName
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      error: 'Profile update failed'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  body('language').optional().isIn(['en', 'fr', 'ar', 'pt', 'sw']).withMessage('Invalid language'),
  body('notifications.email').optional().isBoolean().withMessage('Email notifications must be true or false'),
  body('notifications.sms').optional().isBoolean().withMessage('SMS notifications must be true or false'),
  body('notifications.push').optional().isBoolean().withMessage('Push notifications must be true or false'),
  body('privacy.profileVisibility').optional().isIn(['public', 'private', 'limited']).withMessage('Invalid profile visibility')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user._id;
    const updateData = {};

    // Handle nested preference updates
    if (req.body.language !== undefined) {
      updateData['preferences.language'] = req.body.language;
    }

    if (req.body.notifications) {
      Object.keys(req.body.notifications).forEach(key => {
        if (req.body.notifications[key] !== undefined) {
          updateData[`preferences.notifications.${key}`] = req.body.notifications[key];
        }
      });
    }

    if (req.body.privacy) {
      Object.keys(req.body.privacy).forEach(key => {
        if (req.body.privacy[key] !== undefined) {
          updateData[`preferences.privacy.${key}`] = req.body.privacy[key];
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      error: 'Preferences update failed'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Password change failed'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  body('password').notEmpty().withMessage('Password confirmation is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Password is incorrect'
      });
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    // TODO: Clean up related data (applications, messages, etc.)

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Account deletion failed'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private - Admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Filter by account type
    if (req.query.accountType) {
      filter.accountType = req.query.accountType;
    }
    
    // Filter by verification status
    if (req.query.verified !== undefined) {
      filter['verification.email.verified'] = req.query.verified === 'true';
    }

    const users = await User.find(filter)
      .select('-password -security.passwordResetToken -verification.email.verificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only or own profile)
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user._id.toString();
    const isAdmin = req.user.permissions.roles.includes('admin');

    // Users can only view their own profile unless they're admin
    if (id !== requestingUserId && !isAdmin) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const user = await User.findById(id)
      .select('-password -security.passwordResetToken -verification.email.verificationToken');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user'
    });
  }
});

// @route   PUT /api/users/:id/permissions
// @desc    Update user permissions (admin only)
// @access  Private - Admin only
router.put('/:id/permissions', requireRole('admin'), [
  body('roles').optional().isArray().withMessage('Roles must be an array'),
  body('roles.*').optional().isIn(['user', 'admin', 'moderator', 'institution_admin', 'counselor_verified']).withMessage('Invalid role'),
  body('customPermissions').optional().isArray().withMessage('Custom permissions must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { roles, customPermissions } = req.body;

    const updateData = {};
    if (roles !== undefined) {
      updateData['permissions.roles'] = roles;
    }
    if (customPermissions !== undefined) {
      updateData['permissions.customPermissions'] = customPermissions;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'User permissions updated successfully',
      user: {
        id: user._id,
        email: user.email,
        permissions: user.permissions
      }
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      error: 'Failed to update user permissions'
    });
  }
});

module.exports = router;