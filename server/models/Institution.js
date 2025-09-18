const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    minlength: [2, 'Institution name must be at least 2 characters'],
    maxlength: [100, 'Institution name must be less than 100 characters'],
    index: true
  },

  type: {
    type: String,
    required: [true, 'Institution type is required'],
    enum: {
      values: ['university', 'college', 'technical', 'community'],
      message: 'Institution type must be university, college, technical, or community'
    }
  },

  location: {
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      minlength: [2, 'Country must be at least 2 characters'],
      maxlength: [50, 'Country must be less than 50 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City must be at least 2 characters'],
      maxlength: [50, 'City must be less than 50 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address must be less than 200 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code must be less than 20 characters']
    }
  },

  contact: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
    }
  },

  accreditation: {
    body: {
      type: String,
      trim: true,
      maxlength: [100, 'Accreditation body must be less than 100 characters']
    },
    number: {
      type: String,
      trim: true,
      maxlength: [50, 'Accreditation number must be less than 50 characters']
    },
    validUntil: {
      type: Date
    }
  },

  programs: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Program name must be less than 100 characters']
    },
    level: {
      type: String,
      enum: ['certificate', 'diploma', 'bachelor', 'master', 'doctorate'],
      required: true
    },
    duration: {
      type: Number, // in years
      min: [0.5, 'Duration must be at least 0.5 years'],
      max: [10, 'Duration must be less than 10 years']
    },
    tuition: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
        maxlength: [3, 'Currency code must be 3 characters']
      }
    },
    admissionRequirements: {
      type: String,
      maxlength: [1000, 'Admission requirements must be less than 1000 characters']
    },
    active: {
      type: Boolean,
      default: true
    }
  }],

  teamMembers: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Name must be less than 100 characters']
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'coordinator', 'staff'],
      default: 'staff'
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department must be less than 100 characters']
    }
  }],

  settings: {
    applicationDeadline: {
      type: Date
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en',
      maxlength: [5, 'Language code must be less than 5 characters']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true
      },
      dataSharing: {
        type: Boolean,
        default: false
      }
    }
  },

  onboarding: {
    completed: {
      type: Boolean,
      default: false
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 7
    },
    completedSteps: [{
      step: Number,
      completedAt: {
        type: Date,
        default: Date.now
      },
      data: mongoose.Schema.Types.Mixed
    }]
  },

  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: {
        type: String,
        required: true
      },
      filename: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  status: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'inactive'],
    default: 'pending_verification'
  },

  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    acceptedApplications: {
      type: Number,
      default: 0
    },
    rejectedApplications: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
institutionSchema.index({ 'contact.email': 1 });
institutionSchema.index({ name: 1 });
institutionSchema.index({ 'location.country': 1, 'location.city': 1 });
institutionSchema.index({ type: 1 });
institutionSchema.index({ status: 1 });
institutionSchema.index({ 'verification.status': 1 });

// Virtual for full institution name with location
institutionSchema.virtual('fullName').get(function() {
  return `${this.name}, ${this.location.city}, ${this.location.country}`;
});

// Virtual for acceptance rate
institutionSchema.virtual('acceptanceRate').get(function() {
  if (this.statistics.totalApplications === 0) return 0;
  return (this.statistics.acceptedApplications / this.statistics.totalApplications * 100).toFixed(2);
});

// Pre-save middleware to update statistics
institutionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.statistics.lastActivity = new Date();
  }
  next();
});

// Static method to find institutions by location
institutionSchema.statics.findByLocation = function(country, city) {
  const query = { 'location.country': new RegExp(country, 'i') };
  if (city) {
    query['location.city'] = new RegExp(city, 'i');
  }
  return this.find(query);
};

// Instance method to add team member
institutionSchema.methods.addTeamMember = function(memberData) {
  this.teamMembers.push(memberData);
  return this.save();
};

// Instance method to complete onboarding step
institutionSchema.methods.completeOnboardingStep = function(step, data) {
  const existingStep = this.onboarding.completedSteps.find(s => s.step === step);

  if (existingStep) {
    existingStep.data = data;
    existingStep.completedAt = new Date();
  } else {
    this.onboarding.completedSteps.push({
      step,
      data,
      completedAt: new Date()
    });
  }

  this.onboarding.currentStep = Math.max(this.onboarding.currentStep, step + 1);

  if (step === 7) { // Last step
    this.onboarding.completed = true;
    this.status = 'active';
  }

  return this.save();
};

module.exports = mongoose.model('Institution', institutionSchema);