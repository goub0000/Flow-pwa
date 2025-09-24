"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.handleCSPReport = exports.buildCSPHeader = exports.generateNonce = exports.securityHeaders = exports.validatePassword = exports.validateInput = exports.sanitizeInput = exports.uploadRateLimit = exports.apiRateLimit = exports.authRateLimit = exports.createRateLimiter = exports.cspConfig = void 0;
const express_rate_limit_1 = require("express-rate-limit");
// Content Security Policy configuration
exports.cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net"
        ],
        scriptSrc: [
            "'self'",
            "https://www.gstatic.com",
            "https://www.googleapis.com",
            "https://apis.google.com",
            "https://securetoken.googleapis.com",
            "https://www.google-analytics.com",
            "https://www.googletagmanager.com",
            "https://cdn.jsdelivr.net",
            // Allow inline scripts for Firebase initialization (remove in production)
            process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : "'nonce-{NONCE}'"
        ],
        imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "https://firebasestorage.googleapis.com",
            "https://lh3.googleusercontent.com",
            "https://www.gravatar.com"
        ],
        connectSrc: [
            "'self'",
            "https://firestore.googleapis.com",
            "https://firebase.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://identitytoolkit.googleapis.com",
            "https://www.googleapis.com",
            "https://fcm.googleapis.com",
            "https://firebasestorage.googleapis.com",
            "wss://s-usc1c-nss-2077.firebaseio.com",
            "https://www.google-analytics.com"
        ],
        fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdn.jsdelivr.net"
        ],
        objectSrc: ["'none'"],
        mediaSrc: [
            "'self'",
            "https://firebasestorage.googleapis.com"
        ],
        frameSrc: [
            "'self'",
            "https://flow-pwa.firebaseapp.com",
            "https://accounts.google.com" // Google Sign-In
        ],
        childSrc: [
            "'self'",
            "blob:"
        ],
        workerSrc: [
            "'self'",
            "blob:"
        ],
        manifestSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined
    },
    reportOnly: process.env.NODE_ENV === 'development',
    reportUri: '/api/csp-report'
};
// Rate limiting configurations
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return (0, express_rate_limit_1.rateLimit)({
        windowMs,
        max,
        message: {
            error: 'Too many requests',
            message: 'Please try again later',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many requests',
                message: 'Please try again later',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};
exports.createRateLimiter = createRateLimiter;
// Specific rate limiters for different endpoints
exports.authRateLimit = (0, exports.createRateLimiter)(15 * 60 * 1000, 5); // 5 requests per 15 minutes
exports.apiRateLimit = (0, exports.createRateLimiter)(15 * 60 * 1000, 100); // 100 requests per 15 minutes
exports.uploadRateLimit = (0, exports.createRateLimiter)(5 * 60 * 1000, 10); // 10 uploads per 5 minutes
// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Basic XSS protection - sanitize string inputs
    const sanitizeString = (str) => {
        if (typeof str !== 'string')
            return str;
        return str
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    };
    const sanitizeObject = (obj) => {
        if (obj === null || obj === undefined)
            return obj;
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                // Sanitize key names too
                const cleanKey = sanitizeString(key);
                sanitized[cleanKey] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
// Input validation middleware
const validateInput = (req, res, next) => {
    // Check for required Content-Type on POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType) {
            return res.status(400).json({
                error: 'Content-Type header required',
                message: 'Please specify Content-Type header'
            });
        }
        if (!contentType.includes('application/json') &&
            !contentType.includes('multipart/form-data')) {
            return res.status(400).json({
                error: 'Invalid Content-Type',
                message: 'Only application/json and multipart/form-data are supported'
            });
        }
    }
    // Validate request size (already handled by express.json limit, but double-check)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.get('Content-Length') && parseInt(req.get('Content-Length')) > maxSize) {
        return res.status(413).json({
            error: 'Request too large',
            message: 'Request body cannot exceed 10MB'
        });
    }
    // Validate common required fields
    if (['POST', 'PUT'].includes(req.method) && req.body) {
        const { email, password, firstName, lastName } = req.body;
        // Email validation
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                message: 'Please provide a valid email address'
            });
        }
        // Password validation (if present)
        if (password) {
            const passwordErrors = (0, exports.validatePassword)(password);
            if (passwordErrors.length > 0) {
                return res.status(400).json({
                    error: 'Invalid password',
                    message: passwordErrors[0]
                });
            }
        }
        // Name validation
        if (firstName && (firstName.length < 1 || firstName.length > 50)) {
            return res.status(400).json({
                error: 'Invalid first name',
                message: 'First name must be 1-50 characters'
            });
        }
        if (lastName && (lastName.length < 1 || lastName.length > 50)) {
            return res.status(400).json({
                error: 'Invalid last name',
                message: 'Last name must be 1-50 characters'
            });
        }
    }
    next();
};
exports.validateInput = validateInput;
// Password validation function
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return errors;
};
exports.validatePassword = validatePassword;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), fullscreen=(self), payment=()');
    // HSTS for production
    if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    // Generate nonce for CSP if needed
    if (process.env.NODE_ENV === 'production') {
        const nonce = (0, exports.generateNonce)();
        res.locals.cspNonce = nonce;
        // Set CSP header with nonce
        const csp = (0, exports.buildCSPHeader)(exports.cspConfig, nonce);
        res.setHeader('Content-Security-Policy', csp);
    }
    else {
        // Development CSP (less strict)
        const csp = (0, exports.buildCSPHeader)(Object.assign(Object.assign({}, exports.cspConfig), { reportOnly: true }));
        res.setHeader('Content-Security-Policy-Report-Only', csp);
    }
    next();
};
exports.securityHeaders = securityHeaders;
// Generate cryptographically secure nonce
const generateNonce = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
};
exports.generateNonce = generateNonce;
// Build CSP header string
const buildCSPHeader = (config, nonce) => {
    let csp = '';
    for (const [directive, sources] of Object.entries(config.directives)) {
        if (sources && Array.isArray(sources) && sources.length > 0) {
            let directiveValue = sources.join(' ');
            // Replace nonce placeholder
            if (nonce && directiveValue.includes('{NONCE}')) {
                directiveValue = directiveValue.replace('{NONCE}', nonce);
            }
            csp += `${directive.replace(/([A-Z])/g, '-$1').toLowerCase()} ${directiveValue}; `;
        }
    }
    return csp.trim();
};
exports.buildCSPHeader = buildCSPHeader;
// CSP violation reporting endpoint
const handleCSPReport = (req, res) => {
    const report = req.body;
    console.warn('CSP Violation Report:', {
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        report: report
    });
    // In production, you might want to send this to a monitoring service
    // like Sentry, LogRocket, or your own analytics system
    res.status(204).send(); // No content response
};
exports.handleCSPReport = handleCSPReport;
// Authentication middleware for protected routes
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication token required'
            });
        }
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid authentication token'
            });
        }
        // Verify Firebase ID token
        const admin = require('firebase-admin');
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Add user info to request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired authentication token'
        });
    }
};
exports.requireAuth = requireAuth;
// Role-based authorization middleware
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }
            // Get user document from Firestore to check roles
            const admin = require('firebase-admin');
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(req.user.uid).get();
            if (!userDoc.exists) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'User profile not found'
                });
            }
            const userData = userDoc.data();
            const userRoles = userData.roles || [userData.accountType];
            // Check if user has at least one of the required roles
            const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
            if (!hasRequiredRole) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
            }
            // Add role info to request
            req.userRoles = userRoles;
            next();
        }
        catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Authorization check failed'
            });
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=security.js.map