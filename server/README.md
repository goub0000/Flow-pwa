# Flow PWA Authentication Server

A secure Node.js/Express authentication server for the Flow PWA application.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication with refresh tokens
- 🛡️ **Role-Based Access Control** - Different permission levels for students, institutions, counselors, parents, and recommenders
- 🔒 **Password Security** - Bcrypt hashing with strong password requirements
- 🚫 **Rate Limiting** - Protection against brute force attacks
- 📧 **Email Verification** - Account verification system (email sending to be implemented)
- 🔄 **Password Reset** - Secure password reset flow
- 👥 **User Management** - Complete user profile and preference management
- 📊 **Admin Dashboard** - Statistics and user management for administrators
- 🛡️ **Security Headers** - Helmet.js for security best practices
- 🍪 **Secure Cookies** - HTTP-only cookies for token storage

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your configuration:**
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/flow_pwa
   JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-in-production
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Run the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/logout` | User logout | Private |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/verify-email/:token` | Verify email address | Public |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| POST | `/auth/reset-password/:token` | Reset password with token | Public |
| GET | `/auth/me` | Get current user info | Private |

### User Management Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Private/Admin |
| PUT | `/api/users/profile` | Update user profile | Private |
| PUT | `/api/users/preferences` | Update user preferences | Private |
| POST | `/api/users/change-password` | Change password | Private |
| DELETE | `/api/users/account` | Delete user account | Private |
| PUT | `/api/users/:id/permissions` | Update user permissions | Admin |

### Protected Routes (`/api/protected`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/protected/student-dashboard` | Student dashboard data | Student |
| GET | `/api/protected/institution-dashboard` | Institution dashboard data | Institution |
| GET | `/api/protected/counselor-dashboard` | Counselor dashboard data | Counselor |
| GET | `/api/protected/parent-dashboard` | Parent dashboard data | Parent |
| GET | `/api/protected/recommender-dashboard` | Recommender dashboard data | Recommender |
| GET | `/api/protected/admin/stats` | Admin statistics | Admin |
| GET | `/api/protected/settings` | User settings | Private (Email verified) |
| POST | `/api/protected/verify-institution` | Request institution verification | Institution |
| GET | `/api/protected/user-permissions` | Get user permissions | Private |

## Account Types

The system supports five distinct account types:

1. **Student** - Individual students applying to institutions
2. **Institution** - Universities, colleges, and educational institutions
3. **Counselor** - Academic counselors helping students
4. **Parent** - Parents/guardians of students
5. **Recommender** - Teachers, professors providing recommendations

## Security Features

### Password Requirements
- Minimum 8 characters
- Must contain:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character (@$!%*?&)

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Registration: 3 registrations per hour
- Password reset: 3 requests per hour

### Account Security
- Account lockout after 5 failed login attempts (2 hours)
- JWT tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Password reset tokens expire after 1 hour
- Email verification tokens expire after 24 hours

## Database Schema

### User Model Fields

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  accountType: String (enum: student|institution|counselor|parent|recommender),
  profile: {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    avatar: String,
    // Account-type specific fields...
  },
  preferences: {
    language: String (default: 'en'),
    notifications: { email, sms, push },
    privacy: { profileVisibility }
  },
  verification: {
    email: { verified, verificationToken, verificationExpires }
  },
  security: {
    lastLogin: Date,
    loginAttempts: Number,
    lockoutUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  permissions: {
    roles: [String],
    customPermissions: [String]
  },
  timestamps: { createdAt, updatedAt }
}
```

## Frontend Integration

The authentication system integrates seamlessly with the Flow PWA frontend:

```javascript
// Register a new user
const result = await window.FlowAuth.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  accountType: 'student'
});

// Login
const result = await window.FlowAuth.login('user@example.com', 'SecurePass123!');

// Check authentication
if (window.FlowAuth.isAuthenticated()) {
  const user = window.FlowAuth.getCurrentUser();
  console.log('Welcome,', user.fullName);
}

// Make authenticated API calls
const data = await window.FlowAuth.apiRequest('/api/protected/student-dashboard');
```

## Development

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for auto-reloading on file changes.

### Environment Variables

All environment variables are documented in `.env.example`. Key variables:

- `JWT_SECRET`: Secret for signing access tokens (change in production!)
- `JWT_REFRESH_SECRET`: Secret for signing refresh tokens (change in production!)
- `MONGODB_URI`: MongoDB connection string
- `FRONTEND_URL`: Frontend URL for CORS configuration
- `NODE_ENV`: Set to 'production' for production deployment

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT keys
3. Enable HTTPS
4. Use a production MongoDB instance
5. Configure proper CORS origins
6. Set up email service for verification emails
7. Configure reverse proxy (nginx) for load balancing

## Todo

- [ ] Implement email sending service
- [ ] Add two-factor authentication
- [ ] Add OAuth integration (Google, GitHub)
- [ ] Add API documentation with Swagger
- [ ] Add comprehensive test suite
- [ ] Add user session management UI
- [ ] Add audit logging
- [ ] Add Redis for session storage and caching

## License

MIT License - see LICENSE file for details.