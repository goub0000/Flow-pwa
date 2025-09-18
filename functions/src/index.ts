import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for Firebase Functions
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: express.Request) => req.ip,
  points: 100, // Number of requests
  duration: 900, // Per 15 minutes
});

const authRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: express.Request) => req.ip,
  points: 5, // Number of requests
  duration: 900, // Per 15 minutes
});

// Rate limiting middleware
const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
};

const authRateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await authRateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
};

// Authentication middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Apply rate limiting
app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Firebase Functions',
    version: '1.0.0'
  });
});

// ========================================
// AUTHENTICATION ROUTES
// ========================================

// Custom token creation for additional claims
app.post('/auth/create-custom-token', authRateLimitMiddleware, async (req, res) => {
  try {
    const { uid, claims } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const customToken = await admin.auth().createCustomToken(uid, claims);
    res.json({ customToken });
  } catch (error) {
    console.error('Custom token creation failed:', error);
    res.status(500).json({ error: 'Failed to create custom token' });
  }
});

// Set custom user claims
app.post('/auth/set-claims', authRateLimitMiddleware, authenticateToken, async (req, res) => {
  try {
    const { uid, claims } = req.body;
    const user = (req as any).user;

    // Only allow admins to set claims for other users
    if (uid !== user.uid && !user.admin) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await admin.auth().setCustomUserClaims(uid || user.uid, claims);
    res.json({ success: true, message: 'Claims updated successfully' });
  } catch (error) {
    console.error('Set claims failed:', error);
    res.status(500).json({ error: 'Failed to set user claims' });
  }
});

// ========================================
// STUDENT ROUTES
// ========================================

// Student registration
app.post('/api/students/register', async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, grade, schoolName, parentEmail } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !dateOfBirth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create student document
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
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get student profile
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const studentDoc = await db.collection('students').doc(id).get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = studentDoc.data();

    // Check if user has permission to view this student
    if (studentData?.email !== user.email && !user.admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: studentDoc.id,
      ...studentData,
      createdAt: studentData?.createdAt?.toDate(),
      updatedAt: studentData?.updatedAt?.toDate()
    });
  } catch (error) {
    console.error('Get student failed:', error);
    res.status(500).json({ error: 'Failed to retrieve student data' });
  }
});

// Update student profile
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const updateData = req.body;

    // Get current student data to check permissions
    const studentDoc = await db.collection('students').doc(id).get();

    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = studentDoc.data();

    // Check permissions
    if (studentData?.email !== user.email && !user.admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove sensitive fields from update
    delete updateData.email;
    delete updateData.createdAt;

    // Add timestamp
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('students').doc(id).update(updateData);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Student update failed:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Submit application
app.post('/api/students/:id/applications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { institutionId, programId, documents, personalStatement } = req.body;

    // Validate required fields
    if (!institutionId || !programId) {
      return res.status(400).json({ error: 'Institution and program are required' });
    }

    // Check student exists and user has permission
    const studentDoc = await db.collection('students').doc(id).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = studentDoc.data();
    if (studentData?.email !== user.email && !user.admin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create application
    const applicationData = {
      studentId: id,
      institutionId,
      programId,
      documents: documents || [],
      personalStatement: personalStatement || '',
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const appRef = await db.collection('applications').add(applicationData);

    // Update student's applications array
    await db.collection('students').doc(id).update({
      applications: admin.firestore.FieldValue.arrayUnion(appRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      applicationId: appRef.id,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Application submission failed:', error);
    res.status(500).json({ error: 'Application submission failed' });
  }
});

// Search programs
app.get('/api/students/programs/search', async (req, res) => {
  try {
    const { q, level, field, location, limit = 20 } = req.query;

    let query = db.collection('programs');

    // Apply filters
    if (level) {
      query = query.where('level', '==', level);
    }
    if (field) {
      query = query.where('field', '==', field);
    }
    if (location) {
      query = query.where('location', '==', location);
    }

    // Execute query
    const snapshot = await query.limit(parseInt(limit as string)).get();

    let programs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply text search if query provided
    if (q) {
      const searchTerm = (q as string).toLowerCase();
      programs = programs.filter(program =>
        program.name?.toLowerCase().includes(searchTerm) ||
        program.description?.toLowerCase().includes(searchTerm) ||
        program.field?.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      programs,
      total: programs.length,
      query: { q, level, field, location, limit }
    });
  } catch (error) {
    console.error('Program search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ========================================
// INSTITUTION ROUTES
// ========================================

// Institution registration
app.post('/api/institutions/register', async (req, res) => {
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
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Update onboarding step
app.put('/api/institutions/:id/onboarding', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { step, data, completed } = req.body;

    const updateData: any = {
      onboardingStep: step,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (data) {
      updateData.onboardingData = data;
    }

    if (completed !== undefined) {
      updateData.onboardingComplete = completed;
    }

    await db.collection('institutions').doc(id).update(updateData);

    res.json({ success: true, message: 'Onboarding updated successfully' });
  } catch (error) {
    console.error('Onboarding update failed:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Get institution applications
app.get('/api/institutions/:id/applications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50 } = req.query;

    let query = db.collection('applications').where('institutionId', '==', id);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(parseInt(limit as string)).get();

    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    res.json({ applications, total: applications.length });
  } catch (error) {
    console.error('Get applications failed:', error);
    res.status(500).json({ error: 'Failed to retrieve applications' });
  }
});

// ========================================
// COUNSELOR ROUTES
// ========================================

// Counselor registration
app.post('/api/counselors/register', async (req, res) => {
  try {
    const { name, email, specialization, experience, certification } = req.body;

    if (!name || !email || !specialization) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const counselorData = {
      name,
      email,
      specialization,
      experience: experience || 0,
      certification: certification || '',
      userType: 'counselor',
      students: [],
      sessions: [],
      availability: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('counselors').add(counselorData);

    res.status(201).json({
      success: true,
      counselorId: docRef.id,
      message: 'Counselor registered successfully'
    });
  } catch (error) {
    console.error('Counselor registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Schedule session
app.post('/api/counselors/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, date, time, duration, type, notes } = req.body;

    const sessionData = {
      counselorId: id,
      studentId,
      date,
      time,
      duration: duration || 60,
      type: type || 'general',
      notes: notes || '',
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const sessionRef = await db.collection('sessions').add(sessionData);

    // Update counselor's sessions
    await db.collection('counselors').doc(id).update({
      sessions: admin.firestore.FieldValue.arrayUnion(sessionRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      sessionId: sessionRef.id,
      message: 'Session scheduled successfully'
    });
  } catch (error) {
    console.error('Session scheduling failed:', error);
    res.status(500).json({ error: 'Session scheduling failed' });
  }
});

// ========================================
// PARENT ROUTES
// ========================================

// Parent registration
app.post('/api/parents/register', async (req, res) => {
  try {
    const { name, email, relationship, children } = req.body;

    if (!name || !email || !relationship) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parentData = {
      name,
      email,
      relationship,
      children: children || [],
      userType: 'parent',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('parents').add(parentData);

    res.status(201).json({
      success: true,
      parentId: docRef.id,
      message: 'Parent registered successfully'
    });
  } catch (error) {
    console.error('Parent registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Link child
app.post('/api/parents/:id/children/link', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { childEmail, relationshipCode } = req.body;

    // Verify relationship code (in real app, this would be more secure)
    if (!relationshipCode || relationshipCode.length < 6) {
      return res.status(400).json({ error: 'Valid relationship code required' });
    }

    // Find student by email
    const studentQuery = await db.collection('students').where('email', '==', childEmail).get();

    if (studentQuery.empty) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentDoc = studentQuery.docs[0];
    const studentId = studentDoc.id;

    // Link child to parent
    await db.collection('parents').doc(id).update({
      children: admin.firestore.FieldValue.arrayUnion(studentId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add parent to student
    await db.collection('students').doc(studentId).update({
      parentId: id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Child linked successfully' });
  } catch (error) {
    console.error('Child linking failed:', error);
    res.status(500).json({ error: 'Failed to link child' });
  }
});

// ========================================
// RECOMMENDER ROUTES
// ========================================

// Recommender registration
app.post('/api/recommenders/register', async (req, res) => {
  try {
    const { name, email, position, institution, relationship } = req.body;

    if (!name || !email || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const recommenderData = {
      name,
      email,
      position,
      institution: institution || '',
      relationship: relationship || '',
      userType: 'recommender',
      requests: [],
      completed: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('recommenders').add(recommenderData);

    res.status(201).json({
      success: true,
      recommenderId: docRef.id,
      message: 'Recommender registered successfully'
    });
  } catch (error) {
    console.error('Recommender registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Submit recommendation
app.post('/api/recommenders/:id/recommendations', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { requestId, content, ratings } = req.body;

    const recommendationData = {
      recommenderId: id,
      requestId,
      content,
      ratings: ratings || {},
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const recRef = await db.collection('recommendations').add(recommendationData);

    // Update recommender's completed list
    await db.collection('recommenders').doc(id).update({
      completed: admin.firestore.FieldValue.arrayUnion(recRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      recommendationId: recRef.id,
      message: 'Recommendation submitted successfully'
    });
  } catch (error) {
    console.error('Recommendation submission failed:', error);
    res.status(500).json({ error: 'Recommendation submission failed' });
  }
});

// ========================================
// ANALYTICS AND REPORTING ROUTES
// ========================================

// Get application analytics
app.get('/api/analytics/applications', authenticateToken, async (req, res) => {
  try {
    const { institutionId, startDate, endDate } = req.query;

    let query = db.collection('applications');

    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }

    if (startDate) {
      query = query.where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate as string)));
    }

    if (endDate) {
      query = query.where('submittedAt', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate as string)));
    }

    const snapshot = await query.get();

    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate()
    }));

    // Calculate analytics
    const analytics = {
      total: applications.length,
      byStatus: {},
      byMonth: {},
      trends: []
    };

    // Group by status
    applications.forEach(app => {
      const status = app.status || 'unknown';
      analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
    });

    res.json({ analytics, applications: applications.slice(0, 100) }); // Limit response size
  } catch (error) {
    console.error('Analytics failed:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Cloud Function to handle user creation
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user profile document
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      userType: 'pending', // Will be updated when they complete registration
      profile: {},
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'en'
      }
    });

    console.log('User profile created for:', user.email);
  } catch (error) {
    console.error('Failed to create user profile:', error);
  }
});

// Cloud Function to handle user deletion
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user profile document
    await db.collection('users').doc(user.uid).delete();

    // Clean up related documents based on user type
    // This would need to be more sophisticated in a real app
    console.log('User profile deleted for:', user.email);
  } catch (error) {
    console.error('Failed to delete user profile:', error);
  }
});

// Scheduled function to send daily reports
export const dailyReports = functions.pubsub.schedule('0 9 * * *').timeZone('America/New_York').onRun(async (context) => {
  try {
    // Generate and send daily reports
    console.log('Generating daily reports...');

    // Implementation would go here
    // - Aggregate application data
    // - Generate reports
    // - Send via email/notifications

    return null;
  } catch (error) {
    console.error('Daily reports failed:', error);
    return null;
  }
});