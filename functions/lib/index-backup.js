"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDelete = exports.onUserCreate = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Initialize Datastore (compatible with current setup)
const { Datastore } = require('@google-cloud/datastore');
const datastore = new Datastore();
// Initialize Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};
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
        // Create student entity for Datastore
        const studentKey = datastore.key(['Student']);
        const studentData = {
            firstName,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            grade: grade || '',
            schoolName: schoolName || '',
            parentEmail: parentEmail || '',
            userType: 'student',
            profileComplete: false,
            applications: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const entity = {
            key: studentKey,
            data: studentData
        };
        await datastore.save(entity);
        res.status(201).json({
            success: true,
            studentId: studentKey.id,
            message: 'Student registered successfully'
        });
    }
    catch (error) {
        console.error('Student registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Get student profile
app.get('/api/students/:id', authenticateToken, async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const user = req.user;
        const studentDoc = await db.collection('students').doc(id).get();
        if (!studentDoc.exists) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const studentData = studentDoc.data();
        // Check if user has permission to view this student
        if ((studentData === null || studentData === void 0 ? void 0 : studentData.email) !== user.email && !user.admin) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(Object.assign(Object.assign({ id: studentDoc.id }, studentData), { createdAt: (_a = studentData === null || studentData === void 0 ? void 0 : studentData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = studentData === null || studentData === void 0 ? void 0 : studentData.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate() }));
    }
    catch (error) {
        console.error('Get student failed:', error);
        res.status(500).json({ error: 'Failed to retrieve student data' });
    }
});
// Submit application
app.post('/api/students/:id/applications', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
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
        if ((studentData === null || studentData === void 0 ? void 0 : studentData.email) !== user.email && !user.admin) {
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
    }
    catch (error) {
        console.error('Application submission failed:', error);
        res.status(500).json({ error: 'Application submission failed' });
    }
});
// Search programs
app.get('/api/students/programs/search', async (req, res) => {
    try {
        const { q, level, field, location, limit = 20 } = req.query;
        let query = db.collection('programs');
        // Apply basic filters
        if (level) {
            query = query.where('level', '==', level);
        }
        // Execute query
        const snapshot = await query.limit(parseInt(limit)).get();
        let programs = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Apply text search if query provided
        if (q) {
            const searchTerm = q.toLowerCase();
            programs = programs.filter(program => {
                var _a, _b, _c;
                return ((_a = program.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                    ((_b = program.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm)) ||
                    ((_c = program.field) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(searchTerm));
            });
        }
        res.json({
            programs,
            total: programs.length,
            query: { q, level, field, location, limit }
        });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Institution registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Update onboarding step
app.put('/api/institutions/:id/onboarding', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { step, data, completed } = req.body;
        const updateData = {
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
    }
    catch (error) {
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
        const snapshot = await query.limit(parseInt(limit)).get();
        const applications = snapshot.docs.map(doc => {
            var _a, _b;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { submittedAt: (_a = doc.data().submittedAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate() }));
        });
        res.json({ applications, total: applications.length });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Counselor registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
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
    }
    catch (error) {
        console.error('Parent registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
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
    }
    catch (error) {
        console.error('Recommender registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// ========================================
// ANALYTICS ROUTES
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
            query = query.where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
        }
        if (endDate) {
            query = query.where('submittedAt', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
        }
        const snapshot = await query.get();
        const applications = snapshot.docs.map(doc => {
            var _a;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { submittedAt: (_a = doc.data().submittedAt) === null || _a === void 0 ? void 0 : _a.toDate() }));
        });
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
    }
    catch (error) {
        console.error('Analytics failed:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
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
// Export the Express app as a Firebase Function (2nd Gen)
exports.api = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60
})
    .https.onRequest(app);
// Cloud Function to handle user creation
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
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
            userType: 'pending',
            profile: {},
            preferences: {
                notifications: true,
                theme: 'light',
                language: 'en'
            }
        });
        console.log('User profile created for:', user.email);
    }
    catch (error) {
        console.error('Failed to create user profile:', error);
    }
});
// Cloud Function to handle user deletion
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    try {
        // Delete user profile document
        await db.collection('users').doc(user.uid).delete();
        console.log('User profile deleted for:', user.email);
    }
    catch (error) {
        console.error('Failed to delete user profile:', error);
    }
});
//# sourceMappingURL=index-backup.js.map