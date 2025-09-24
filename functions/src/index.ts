import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import security middleware
import {
  securityHeaders,
  sanitizeInput,
  validateInput,
  apiRateLimit,
  authRateLimit,
  requireAuth,
  requireRole,
  handleCSPReport,
  cspConfig
} from './middleware/security';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Firestore (native mode)
const db = admin.firestore();

// Initialize Express app
const app = express();

// Apply security headers first
app.use(securityHeaders);

// Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? cspConfig : false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration - more restrictive for production
const allowedOrigins = [
  'https://flow-pwa.web.app',
  'https://flow-pwa.firebaseapp.com'
];

// Add localhost for development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5000', 'http://127.0.0.1:5000');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Body parsing middleware with size limits
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/', apiRateLimit);

// Apply input sanitization and validation
app.use(sanitizeInput);
app.use(validateInput);

// CSP violation reporting endpoint
app.post('/api/csp-report', handleCSPReport);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Firebase Functions',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Student registration with enhanced security
app.post('/api/students/register', authRateLimit, async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, grade, schoolName, parentEmail } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !dateOfBirth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create student document in Firestore
    const studentData = {
      firstName,
      lastName,
      email,
      dateOfBirth: admin.firestore.Timestamp.fromDate(new Date(dateOfBirth)),
      grade: grade || '',
      schoolName: schoolName || '',
      parentEmail: parentEmail || '',
      userType: 'student',
      profileComplete: false,
      applications: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('students').add(studentData);

    res.status(201).json({
      success: true,
      studentId: docRef.id,
      message: 'Student registered successfully'
    });
  } catch (error) {
    console.error('Student registration failed:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Institution registration with enhanced security
app.post('/api/institutions/register', authRateLimit, async (req, res) => {
  try {
    const { name, type, country, city, email, website, description } = req.body;

    // Validation
    if (!name || !type || !country || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const institutionData = {
      name,
      type,
      country,
      city: city || '',
      email,
      website: website || '',
      description: description || '',
      userType: 'institution',
      onboardingStep: 1,
      onboardingComplete: false,
      verified: false,
      programs: [],
      applications: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('institutions').add(institutionData);

    res.status(201).json({
      success: true,
      institutionId: docRef.id,
      message: 'Institution registered successfully'
    });
  } catch (error) {
    console.error('Institution registration failed:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Export the Express app as a Firebase Function
export const api = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60
  })
  .https.onRequest(app);