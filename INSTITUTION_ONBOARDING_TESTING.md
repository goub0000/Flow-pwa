# Institution Onboarding Testing Guide

This guide provides comprehensive instructions for testing the institution onboarding flow in the Flow PWA.

## 🏗️ Project Architecture

Flow PWA is a college application management system with the following architecture:

### Frontend
- **Technology**: Static HTML/CSS/JavaScript PWA
- **Hosting**: Firebase Hosting
- **Framework**: Vanilla JavaScript with modern ES6+ features
- **Styling**: Custom CSS with Inter font family
- **Assets**: Optimized images, icons, and service worker

### Backend
- **Technology**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh mechanism
- **Security**: Helmet, CORS, rate limiting, input validation
- **API**: RESTful endpoints for institutions, users, and auth

### Key Features
- **Institution Onboarding**: 7-step guided setup process
- **Dashboard Integration**: Seamless transition from onboarding to dashboard
- **Real-time Validation**: Frontend and backend validation
- **Progress Persistence**: Save and resume onboarding sessions
- **Responsive Design**: Mobile-first responsive design

## 🔧 Prerequisites

Before testing, ensure you have the following installed:

### Required Software
1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version
   ```

2. **MongoDB** (Community Edition)
   ```bash
   mongod --version
   ```

3. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase --version
   ```

4. **Git** (for version control)
   ```bash
   git --version
   ```

## 🚀 Quick Start

### Automated Setup (Recommended)
```bash
# Start all services with one command
node start-dev.js
```

This will:
- Check all prerequisites
- Install missing dependencies
- Start MongoDB (if running)
- Start the auth server on port 3001
- Start Firebase hosting on port 5000
- Display helpful URLs and instructions

### Manual Setup

#### 1. Start MongoDB
```bash
# Start MongoDB service
mongod --dbpath /data/db

# Or use your system's MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb  # macOS
```

#### 2. Install Dependencies
```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install
cd ..
```

#### 3. Configure Environment
```bash
# Copy and configure environment variables
cd server
cp .env.example .env
# Edit .env file with your settings
```

#### 4. Start Backend Server
```bash
cd server
npm start
# Server will run on http://localhost:3001
```

#### 5. Start Frontend
```bash
# In project root
firebase serve --only hosting --port 5000
# Frontend will be available at http://localhost:5000
```

## 🧪 Testing

### Automated Testing
```bash
# Run comprehensive test suite
node test-onboarding.js
```

This will test:
- Server health and connectivity
- Institution registration endpoint
- Onboarding step progression
- Data validation and persistence
- Frontend file accessibility

### Manual Testing

#### 1. Access the Onboarding Page
Navigate to: `http://localhost:5000/institutions/onboarding.html`

#### 2. Test the 7-Step Onboarding Process

**Step 1: Welcome**
- ✅ Welcome screen displays correctly
- ✅ "Begin Setup" button works
- ✅ Inter font family is applied
- ✅ No bold fonts anywhere

**Step 2: Institution Information**
- ✅ Form validation works (required fields)
- ✅ Data is saved to backend
- ✅ Success notification appears
- ✅ Institution ID is stored in localStorage

**Step 3: Verification**
- ✅ Additional institution details form
- ✅ Data updates existing institution record
- ✅ Progress indicator updates

**Step 4: Programs**
- ✅ Program configuration form
- ✅ Numeric validation for total programs
- ✅ Admission cycle selection

**Step 5: Team Members**
- ✅ Add/remove team member functionality
- ✅ Email validation for team members
- ✅ Role selection dropdown

**Step 6: Settings**
- ✅ Timezone selection
- ✅ Language preferences
- ✅ Notification settings

**Step 7: Review & Launch**
- ✅ Summary of all entered data
- ✅ Final submission to backend
- ✅ Onboarding completion status
- ✅ Success redirect or completion state

#### 3. Test Visual Consistency
- ✅ White background matches dashboard
- ✅ Blue gradient footer with white text
- ✅ Inter font family throughout
- ✅ No bold fonts anywhere
- ✅ Consistent button styles
- ✅ Proper hover effects

#### 4. Test API Integration
- ✅ Registration endpoint: `POST /api/institutions/register`
- ✅ Onboarding update: `PUT /api/institutions/:id/onboarding`
- ✅ Health check: `GET /health`
- ✅ Error handling and user feedback

### API Testing with cURL

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Register Institution
```bash
curl -X POST http://localhost:3001/api/institutions/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test University",
    "type": "university",
    "country": "Kenya",
    "city": "Nairobi",
    "email": "test@university.edu",
    "website": "https://test.edu"
  }'
```

#### Update Onboarding
```bash
curl -X PUT http://localhost:3001/api/institutions/INSTITUTION_ID/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "step": 3,
    "data": {"verified": true},
    "completed": false
  }'
```

## 🔍 Debugging

### Common Issues

#### 1. Server Won't Start
```bash
# Check if port 3001 is in use
netstat -an | findstr :3001  # Windows
lsof -i :3001                # macOS/Linux

# Kill process using port
taskkill /F /PID <PID>       # Windows
kill -9 <PID>               # macOS/Linux
```

#### 2. MongoDB Connection Errors
```bash
# Check MongoDB status
mongod --dbpath /data/db
# Or check if service is running
systemctl status mongod  # Linux
brew services list        # macOS
```

#### 3. Frontend Not Loading
```bash
# Check Firebase CLI
firebase --version

# Ensure you're in the project root
firebase serve --only hosting --port 5000
```

#### 4. CORS Errors
- Ensure backend server is running on port 3001
- Check that frontend is accessing http://localhost:5000
- Verify CORS configuration in server/.env

### Debug Logs

#### Backend Logs
Server logs will show:
- HTTP requests and responses
- Database operations
- Validation errors
- Authentication attempts

#### Frontend Logs
Open browser DevTools (F12) to see:
- API request/response data
- JavaScript errors
- Network requests
- Console logs

### Test Data

Use this sample data for testing:

```json
{
  "name": "African University of Technology",
  "type": "university",
  "country": "Nigeria",
  "city": "Lagos",
  "email": "admin@afrotech.edu.ng",
  "phone": "+234-1-234-5678",
  "website": "https://afrotech.edu.ng",
  "accreditation": "National Universities Commission",
  "programs": [
    {
      "name": "Computer Science",
      "level": "bachelor",
      "duration": 4
    }
  ],
  "teamMembers": [
    {
      "name": "Dr. Amina Hassan",
      "email": "amina.hassan@afrotech.edu.ng",
      "role": "admin"
    }
  ]
}
```

## 📊 Performance Monitoring

### Key Metrics to Monitor
- API response times (< 500ms)
- Database query performance
- Frontend load times
- User flow completion rates
- Error rates and types

### Database Queries
Monitor MongoDB operations:
```javascript
// Enable MongoDB logging
db.setLogLevel(2)

// Check slow operations
db.adminCommand({"currentOp": true, "secs_running": {"$gt": 1}})
```

## 🔒 Security Testing

### Test Security Features
1. **Input Validation**: Try invalid data in forms
2. **Rate Limiting**: Make rapid API requests
3. **XSS Prevention**: Test script injection
4. **CORS Policy**: Test cross-origin requests
5. **Data Sanitization**: Test malicious input

### Security Checklist
- ✅ All user inputs are validated
- ✅ Rate limiting is active
- ✅ CORS is properly configured
- ✅ No sensitive data in client-side logs
- ✅ Environment variables are secure

## 📱 Mobile Testing

### Responsive Design Testing
1. Open DevTools (F12)
2. Toggle device emulation
3. Test various screen sizes:
   - Mobile (320px - 768px)
   - Tablet (768px - 1024px)
   - Desktop (1024px+)

### Touch Interaction Testing
- ✅ Buttons are touch-friendly (44px minimum)
- ✅ Forms work with virtual keyboards
- ✅ Scrolling is smooth
- ✅ Hover effects work appropriately

## 🚨 Error Scenarios

Test these error conditions:

### Network Errors
1. Disconnect internet and test offline behavior
2. Simulate slow network connections
3. Test with intermittent connectivity

### Server Errors
1. Stop backend server and test frontend behavior
2. Test with invalid API responses
3. Test database connection failures

### Validation Errors
1. Submit empty forms
2. Enter invalid email addresses
3. Use excessively long text inputs

## 📈 Success Criteria

The onboarding flow is considered successful when:

### Functional Requirements
- ✅ All 7 steps complete without errors
- ✅ Data is properly saved to database
- ✅ User receives appropriate feedback
- ✅ Session persistence works correctly

### Visual Requirements
- ✅ Consistent styling with dashboard
- ✅ No bold fonts anywhere
- ✅ Proper Inter font family usage
- ✅ Responsive design on all devices

### Performance Requirements
- ✅ Page loads in < 3 seconds
- ✅ API responses in < 500ms
- ✅ Smooth animations and transitions
- ✅ No JavaScript errors in console

### Security Requirements
- ✅ Data validation on frontend and backend
- ✅ Rate limiting prevents abuse
- ✅ No sensitive data exposure
- ✅ Proper error handling

## 🛠️ Troubleshooting

### Reset Test Environment
```bash
# Clear localStorage
localStorage.clear()

# Drop test database
mongo flow_pwa_test --eval "db.dropDatabase()"

# Restart all services
node start-dev.js
```

### Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Verify Installation
```bash
# Check all required tools
node --version      # Should be v18+
mongod --version    # Should show MongoDB version
firebase --version  # Should show Firebase CLI version
npm --version       # Should show npm version
```

## 📞 Support

If you encounter issues:

1. Check the console logs for errors
2. Verify all prerequisites are installed
3. Ensure all services are running
4. Review the network tab in DevTools
5. Check MongoDB connection and data

For persistent issues, review the error logs in:
- Browser DevTools console
- Backend server terminal
- MongoDB logs
- Firebase hosting logs

Remember: The goal is a seamless, visually consistent onboarding experience that properly integrates with the backend API and matches the dashboard design perfectly.