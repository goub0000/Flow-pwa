# Flow PWA - Complete Setup and Deployment Guide

## Overview
This guide will walk you through setting up the Flow PWA with real Firebase data, testing it, and deploying it to production.

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project already created
- Git installed

## Step 1: Deploy Firestore Security Rules

The Firestore rules have been updated to allow proper querying of programs and applications.

```bash
# Deploy the security rules
firebase deploy --only firestore:rules
```

Expected output:
```
✔  firestore: deployed firestore rules successfully
✔  Deploy complete!
```

## Step 2: Deploy Application Files

Deploy all the updated files to Firebase Hosting:

```bash
# Deploy all files
firebase deploy
```

Or deploy only hosting:
```bash
firebase deploy --only hosting
```

Expected output:
```
✔  hosting: deployed successfully
✔  Deploy complete!
```

## Step 3: Initialize Sample Data

After deployment, you need to add sample programs to your database. Follow these steps:

### 3.1 Login as Institution

1. Go to your deployed app: `https://your-project.web.app/auth/`
2. Login with an institution account (e.g., `ogouba3@gmail.com`)
3. Navigate to the institution dashboard

### 3.2 Run the Data Initialization Script

1. Open browser Developer Tools (F12)
2. Go to the Console tab
3. Run the initialization script:

```javascript
// Load the initialization script
const script = document.createElement('script');
script.src = '/assets/js/init-sample-data.js';
document.head.appendChild(script);

// Wait 2 seconds for it to load, then create programs
setTimeout(() => {
  FlowInitializer.initializePrograms();
}, 2000);
```

You should see output like:
```
✅ Created: Computer Science - Bachelor of Science (ID: abc123)
✅ Created: Business Administration - MBA (ID: def456)
...
✅ Created 6 out of 6 programs
```

### 3.3 Verify Programs Were Created

```javascript
FlowInitializer.viewMyPrograms();
```

You should see a table with all your programs.

## Step 4: Test the Application

### 4.1 Test as Institution

**Dashboard:**
- Go to `/institutions/`
- You should see:
  - Total Applications: 0
  - Pending Reviews: 0
  - Active Programs: 6
  - Fill Rate: 0%

**Programs Page:**
- Go to `/institutions/programs.html`
- You should see your 6 programs listed

### 4.2 Test as Student

**Create/Login as Student:**
1. Logout from institution account
2. Register a new student account at `/auth/register.html`
   - Email: `student@example.com`
   - Password: (your choice)
   - Account Type: Student
3. Complete the onboarding process

**Browse Programs:**
1. Go to `/students/programs.html`
2. You should see all 6 programs from the institution
3. Programs should show:
   - Institution name
   - Program details (duration, tuition, GPA requirements)
   - Apply button

**Apply to a Program:**
1. Click "Apply Now" on any program
2. Confirm the application creation
3. You'll be redirected to `/students/applications.html`

**Check Dashboard:**
1. Go to `/students/`
2. You should see:
   - Total Applications: 1
   - Draft Applications: 1
   - Submitted Applications: 0
   - Accepted Applications: 0

### 4.3 Verify in Institution Dashboard

1. Logout and login as institution again
2. Go to `/institutions/`
3. You should now see:
   - Total Applications: 1
   - Pending Reviews: 0 (because it's still a draft)

## Step 5: Understanding the Data Flow

### Programs
- **Created by**: Institutions
- **Stored in**: `programs` collection in Firestore
- **Viewed by**: All authenticated users (students see them in browse page)
- **Fields**: name, degree, department, description, tuition, requirements, etc.

### Applications
- **Created by**: Students (when they click "Apply Now")
- **Stored in**: `applications` collection in Firestore
- **Viewed by**:
  - Students: their own applications
  - Institutions: applications to their programs
  - Counselors: their students' applications
  - Parents: their children's applications

### Users
- **Created by**: Firebase Auth + registration flow
- **Stored in**: `users` collection in Firestore
- **Types**: student, institution, counselor, parent, recommender

## Step 6: Common Commands

### View Your Data

**As Institution:**
```javascript
// View programs
FlowInitializer.viewMyPrograms()

// View statistics
FlowInitializer.viewStats()

// Reload dashboard
window.reloadDashboard()
```

**As Student:**
```javascript
// View your applications
const user = window.FlowAuth.getCurrentUser();
const apps = await window.DataService.Application.getApplicationsByStudent(user.uid);
console.table(apps);

// Reload dashboard
window.reloadDashboard()
```

### Delete Sample Data (if needed)

**Delete all programs:**
```javascript
// Only works if logged in as institution
FlowInitializer.deleteAllPrograms()
```

**Delete all applications (manual):**
```javascript
// Be careful with this - it deletes ALL applications
const db = window.Firebase.db;
const user = window.FlowAuth.getCurrentUser();
const apps = await db.collection('applications')
  .where('studentId', '==', user.uid)
  .get();

const batch = db.batch();
apps.forEach(doc => batch.delete(doc.ref));
await batch.commit();
console.log(`Deleted ${apps.size} applications`);
```

## Step 7: Troubleshooting

### Programs Not Showing

**Problem**: Student can't see any programs on browse page

**Solutions**:
1. Check if you're logged in: `window.FlowAuth.isAuthenticated()`
2. Check if programs exist: Open Firestore console, check `programs` collection
3. Check browser console for errors (F12)
4. Clear cache: `window.DataService.clearCache()`
5. Check Firestore rules were deployed: `firebase deploy --only firestore:rules`

### Applications Not Creating

**Problem**: Student clicks "Apply Now" but application doesn't create

**Solutions**:
1. Check browser console for errors
2. Verify you're logged in as a student
3. Check Firestore rules: Applications collection should allow create for students
4. Verify the program exists and is active

### Dashboard Shows 0s

**Problem**: Dashboard shows all zeros even though data exists

**Solutions**:
1. Wait 5 minutes (cache TTL) or clear cache: `window.DataService.clearCache()`
2. Reload dashboard: `window.reloadDashboard()`
3. Check browser console for errors
4. Verify Firebase is initialized: `window.Firebase.initialized`
5. Verify DataService is ready: `window.DataService.isReady()`

### Permission Denied Errors

**Problem**: Getting "permission denied" in console

**Solutions**:
1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Wait a few minutes for rules to propagate
3. Check you're logged in with correct account type
4. Verify your account has correct `accountType` field in Firestore `users` collection

## Step 8: Production Checklist

Before going live:

- [ ] Deploy Firestore rules
- [ ] Deploy application files
- [ ] Create institution accounts
- [ ] Have institutions create real programs
- [ ] Test student registration flow
- [ ] Test application creation flow
- [ ] Test all dashboards (student, institution, counselor, parent)
- [ ] Verify email verification works
- [ ] Test on mobile devices
- [ ] Check all pages load correctly
- [ ] Verify no hardcoded data remains

## Step 9: Maintenance

### Adding More Sample Data

To add more programs, use the initialization script or manually:

```javascript
await window.DataService.Program.createProgram({
  institutionId: window.FlowAuth.getCurrentUser().uid,
  name: 'Your Program Name',
  degree: 'bachelor',  // bachelor, master, doctorate, certificate, associate
  department: 'Department Name',
  description: 'Program description...',
  duration: 4,  // years
  tuitionPerYear: 25000,
  isActive: true,
  requirements: {
    minGPA: 3.0,
    minSAT: 1200,
    minACT: 24,
    requiredDocuments: ['transcript', 'essays']
  },
  stats: {
    totalSpots: 100,
    availableSpots: 100,
    applicantsCount: 0,
    acceptedCount: 0,
    enrolledCount: 0
  },
  deadlines: {
    regularDecision: new Date('2026-03-01')
  }
});
```

### Monitoring

Check Firestore usage:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check the Usage tab

Check hosting usage:
1. Go to Firebase Console
2. Navigate to Hosting
3. Check usage metrics

## Support

For issues or questions:
1. Check browser console (F12) for errors
2. Check Firestore rules in Firebase Console
3. Verify data exists in Firestore Database
4. Review `DATA_MODEL.md` for data structure
5. Review `IMPLEMENTATION_GUIDE.md` for architecture details

## Summary

The Flow PWA now works with **real data from Firestore**:

✅ **No hardcoded data** - Everything is fetched from database
✅ **Students see real institutions** - Browse actual programs from actual institutions
✅ **Institutions see real applications** - Track real student applications
✅ **Dynamic dashboards** - All stats calculated from real data
✅ **Professional architecture** - Service layer, caching, proper error handling
✅ **Scalable** - Can handle hundreds of institutions and thousands of programs

If students don't see programs, it means no institutions have created them yet. This is the correct, professional behavior!
