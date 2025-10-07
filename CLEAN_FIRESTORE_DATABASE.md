# Clean Firestore Database - Remove Sample Data

## Issue
The Flow PWA codebase is now 100% clean of hardcoded data, but **sample data exists in your Firestore database** from testing. This needs to be deleted.

## What You're Seeing
- Fake programs (University of Accra, Cape Town, Nairobi, etc.)
- Fake applications
- These are coming from your **Firestore database**, not the code

## How to Clean Your Database

### Option 1: Firebase Console (Recommended)
1. Go to https://console.firebase.google.com/project/flow-pwa/firestore
2. Delete these collections or their documents:
   - **programs** collection - Delete all fake program documents
   - **applications** collection - Delete all test applications
   - **users** collection - Delete any test user accounts
3. Refresh your app - you'll see empty states

### Option 2: Using Firebase CLI
```bash
# Install Firebase tools if not installed
npm install -g firebase-tools

# Login
firebase login

# Use the Firebase console instead - safer for selective deletion
```

### Option 3: Firestore Rules (Temporary)
You can temporarily make the programs collection read-only to prevent the init script from running:

```javascript
// In firestore.rules
match /programs/{programId} {
  allow read: if request.auth != null;
  allow write: if false; // Temporarily disable writes
}
```

## What Happened

Earlier in development, we created `assets/js/init-sample-data.js` which added sample programs to Firestore for testing. We've now:
- ✅ Deleted the init-sample-data.js file
- ✅ Removed ALL hardcoded data from code
- ❌ BUT sample data still exists in your Firestore database

## After Cleaning Database

Once you delete the sample data from Firestore, you'll see:
- **Empty programs page** with message: "No Programs Available"
- **Empty applications page**
- **Empty dashboards** with professional empty states

This is the correct, professional state until real institutions add their programs.

## For Production

Real workflow:
1. Institutions sign up → Complete onboarding → Add their programs
2. Students sign up → Browse real programs → Apply
3. No fake data anywhere

## Important
The **code is clean** - the issue is only in your **database**. Clean the database and your app will be 100% professional!
