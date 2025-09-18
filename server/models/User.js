const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password) {
        // Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }
  },
  accountType: {
    type: String,
    required: [true, 'Account type is required'],
    enum: {
      values: ['student', 'institution', 'counselor', 'parent', 'recommender'],
      message: 'Account type must be one of: student, institution, counselor, parent, recommender'
    }
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot be longer than 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot be longer than 50 characters']
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    avatar: {
      type: String,
      default: null
    },
    // Institution-specific fields
    institutionName: {
      type: String,
      trim: true,
      maxlength: [100, 'Institution name cannot be longer than 100 characters']
    },
    institutionType: {
      type: String,
      enum: ['university', 'college', 'community_college', 'vocational', 'other']
    },
    // Student-specific fields
    dateOfBirth: {
      type: Date
    },
    grade: {
      type: String,
      enum: ['9th', '10th', '11th', '12th', 'graduate']
    },
    // Parent-specific fields
    children: [{
      name: String,
      email: String,
      relationshipType: {
        type: String,
        enum: ['parent', 'guardian', 'relative']
      }
    }]
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'fr', 'ar', 'pt', 'sw']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        default: 'private',
        enum: ['public', 'private', 'limited']
      }
    }
  },
  verification: {
    email: {
      verified: {
        type: Boolean,
        default: false
      },
      verificationToken: String,
      verificationExpires: Date
    },
    phone: {
      verified: {
        type: Boolean,
        default: false
      },
      verificationCode: String,
      verificationExpires: Date
    }
  },
  security: {
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockoutUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      secret: String,
      backupCodes: [String]
    }
  },
  permissions: {
    roles: [{
      type: String,
      enum: ['user', 'admin', 'moderator', 'institution_admin', 'counselor_verified']
    }],
    customPermissions: [String]
  },
  subscription: {
    plan: {
      type: String,
      default: 'free',
      enum: ['free', 'premium', 'institution', 'counselor_pro']
    },
    expiresAt: Date,
    features: [String]
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.passwordResetToken;
      delete ret.security.twoFactorAuth.secret;
      delete ret.verification.email.verificationToken;
      delete ret.verification.phone.verificationCode;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ accountType: 1 });
userSchema.index({ 'verification.email.verified': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || this.email;
});

// Virtual for account lockout check
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockoutUntil && this.security.lockoutUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockoutUntil && this.security.lockoutUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockoutUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockoutUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 
      'security.loginAttempts': 1, 
      'security.lockoutUntil': 1 
    },
    $set: { 'security.lastLogin': new Date() }
  });
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.verification.email.verificationToken = token;
  this.verification.email.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.security.passwordResetToken = token;
  this.security.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return token;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to find verified users
userSchema.statics.findVerified = function(query = {}) {
  return this.find({ ...query, 'verification.email.verified': true });
};

module.exports = mongoose.model('User', userSchema);