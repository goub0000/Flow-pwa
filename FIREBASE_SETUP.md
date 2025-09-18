# 🔥 Firebase Setup Guide for Flow PWA

## Overview
This guide will help you set up Firebase for your Flow PWA, including authentication, Firestore database, Storage, and hosting.

## Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google account for Firebase Console access

---

## 🚀 Quick Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project (e.g., `flow-college-app`)
4. Enable Google Analytics (recommended)
5. Wait for project creation

### 2. Enable Firebase Services

#### Authentication
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional but recommended)
   - Add your domain to authorized domains
   - Configure OAuth consent screen

#### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll deploy security rules later)
4. Select a region close to your users

#### Storage
1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select the same region as Firestore

#### Hosting
1. Go to **Hosting**
2. Click **Get started**
3. Follow the setup wizard (we'll configure via CLI)

### 3. Configure Project Locally

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
cd /path/to/flow-pwa
firebase init

# Select these features:
# ☑ Firestore: Configure security rules and indexes files
# ☑ Storage: Configure a security rules file for Cloud Storage  
# ☑ Hosting: Configure files for Firebase Hosting
# ☑ Emulators: Set up local emulators

# Use existing project and select your created project
# Accept default file names (firestore.rules, storage.rules, etc.)
```

### 4. Update Firebase Configuration

1. Go to **Project Settings** > **General** > **Your apps**
2. Click **Add app** > **Web app** (</>) 
3. Register app with nickname (e.g., "Flow PWA")
4. Copy the Firebase configuration object

5. Update `assets/js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEFGHIJ"
};
```

### 5. Deploy Security Rules and Indexes

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage

# Test locally first (optional)
firebase emulators:start
```

### 6. Deploy to Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Your app will be live at:
# https://your-project-id.web.app
```

---

## 🔧 Development Workflow

### Local Development with Emulators
```bash
# Start all emulators
firebase emulators:start

# Access:
# - Firestore: http://localhost:8080
# - Auth: http://localhost:9099  
# - Storage: http://localhost:9199
# - Hosting: http://localhost:5000
# - Emulator UI: http://localhost:4000
```

### Testing Authentication
1. Visit your local app: `http://localhost:5000`
2. Try registering a new account
3. Check Firebase Console > Authentication > Users
4. Test login/logout flows

### Testing Database Operations
1. Register/login as different user types
2. Check Firestore Console for created documents
3. Test real-time updates by opening multiple tabs
4. Verify security rules are working

---

## 📊 Firestore Data Structure

### Collections Overview
```
users/{userId}
├── uid: string
├── email: string  
├── displayName: string
├── accountType: 'student'|'institution'|'counselor'|'parent'|'recommender'
├── firstName: string
├── lastName: string
├── createdAt: timestamp
└── preferences: object

applications/{applicationId}
├── studentId: string (ref to users)
├── targetInstitutionId: string (ref to users)
├── programId: string (ref to programs)
├── status: 'draft'|'submitted'|'under_review'|'accepted'|'rejected'
├── submittedAt: timestamp
└── documents: array

programs/{programId}  
├── institutionId: string (ref to users)
├── name: string
├── description: string
├── requirements: array
├── deadline: timestamp
├── isActive: boolean
└── createdAt: timestamp

messages/{messageId}
├── senderId: string (ref to users)
├── recipientId: string (ref to users) 
├── content: string
├── read: boolean
├── createdAt: timestamp
└── type: 'text'|'file'|'system'
```

---

## 🔐 Security Configuration

### Firestore Rules Summary
- Users can read/write their own profile
- Students can read/write their applications
- Institutions can read applications sent to them
- Messages are private between sender/recipient
- Documents are owned by the uploader

### Storage Rules Summary
- Users can upload to their own folders
- File size limits enforced (10MB max)
- File type restrictions for security
- Profile images limited to 2MB

---

## 🚀 Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only storage

# Deploy with custom message
firebase deploy -m "Updated authentication flow"
```

---

## 📱 PWA Features

### Offline Support
- Service Worker caches static assets
- Firestore offline persistence enabled
- Background sync for queued operations
- Offline queue processing

### Push Notifications
1. Enable **Cloud Messaging** in Firebase Console
2. Add your domain to authorized origins
3. Users will be prompted to allow notifications
4. Notifications work offline and show as badges

### Installation
- Web App Manifest configured
- Install prompts on supported browsers
- App shortcuts for common actions
- File associations for documents

---

## 🔧 Troubleshooting

### Common Issues

**Authentication not working:**
- Check API key in firebase-config.js
- Verify domain in Firebase Console authorized domains
- Check browser console for CORS errors

**Firestore permission denied:**
- Verify security rules are deployed
- Check user is authenticated
- Ensure user has correct accountType

**Storage uploads failing:**
- Check storage rules
- Verify file size and type limits
- Ensure user is authenticated

**Offline not working:**
- Clear browser cache and reload
- Check Service Worker registration
- Verify Firestore offline persistence

### Debug Commands
```bash
# View deployed rules
firebase firestore:rules:get

# Check project configuration  
firebase projects:list
firebase use --add

# View hosting URLs
firebase hosting:sites:list

# Stream function logs
firebase functions:log
```

---

## 📈 Monitoring & Analytics

### Firebase Console Monitoring
- **Authentication:** Track user signups/logins
- **Firestore:** Monitor read/write operations  
- **Storage:** Track upload/download usage
- **Hosting:** View visitor analytics
- **Performance:** Monitor app performance metrics

### Custom Analytics Events
The app automatically tracks:
- `sign_up` - User registration
- `login` - User login  
- `logout` - User logout
- `application_created` - New application
- `document_uploaded` - File upload
- `message_sent` - New message

---

## 🎯 Production Checklist

### Before Going Live
- [ ] Update Firebase project to Blaze plan (pay-as-you-go)
- [ ] Configure custom domain in Hosting
- [ ] Set up proper backup strategy
- [ ] Review and tighten security rules
- [ ] Enable audit logs
- [ ] Set up monitoring alerts
- [ ] Test all user flows thoroughly
- [ ] Verify offline functionality
- [ ] Test on multiple devices/browsers
- [ ] Set up CI/CD pipeline

### Security Hardening
- [ ] Review Firestore security rules
- [ ] Review Storage security rules  
- [ ] Enable App Check (recommended)
- [ ] Set up Security Rules testing
- [ ] Review IAM permissions
- [ ] Enable audit logging

---

## 🆘 Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker Guide](https://developers.google.com/web/fundamentals/primers/service-workers)

---

## 🎉 You're All Set!

Your Flow PWA is now fully configured with Firebase! The app includes:

✅ **Authentication** - Email/password + Google signin
✅ **Real-time Database** - Firestore with offline support  
✅ **File Storage** - Document uploads with security
✅ **Hosting** - Fast global CDN
✅ **PWA Features** - Offline, installable, push notifications
✅ **Security** - Comprehensive rules and validation
✅ **Analytics** - User behavior tracking
✅ **Monitoring** - Performance and error tracking

Your users can now register, login, manage applications, upload documents, send messages, and collaborate in real-time with full offline support!