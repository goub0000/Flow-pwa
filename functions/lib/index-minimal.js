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
exports.apiMinimal = void 0;
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
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Firebase Functions',
        version: '1.0.0'
    });
});
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
            studentId: studentKey.id || studentKey.name,
            message: 'Student registered successfully'
        });
    }
    catch (error) {
        console.error('Student registration failed:', error);
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
exports.apiMinimal = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60
})
    .https.onRequest(app);
//# sourceMappingURL=index-minimal.js.map