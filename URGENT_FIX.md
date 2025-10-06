# URGENT FIX - Data Not Saving Issue

## Problem Identified

**ALL onboarding pages** were only saving data to `localStorage`, NOT to Firestore database. This means:
- Institution profiles not saved to database
- Student profiles not saved to database
- Counselor profiles not saved to database
- Parent profiles not saved to database
- Settings changes not persisted

## Root Cause

The onboarding pages were using `localStorage.setItem()` for temporary storage but never calling Firestore `set()` or `update()` methods to persist data to the database.

Additionally, the institution onboarding was using `.update()` instead of `.set({...}, {merge: true})`, which would fail if the document didn't exist yet.

## Fixes Applied

### 1. Created Universal Save Helper ✅
- **File**: `assets/js/onboarding-save.js`
- **Functions**:
  - `OnboardingSave.saveProfile(data)` - Saves complete profile
  - `OnboardingSave.updateProfile(updates)` - Updates specific fields
  - `OnboardingSave.getProfile()` - Retrieves profile from Firestore

### 2. Fixed Institution Onboarding ✅
- Changed from `.update()` to `.set({...}, {merge: true})`
- Now properly saves to Firestore
- Includes all required fields

### 3. Added Script References
- All onboarding pages now include `onboarding-save.js`

## Still Need To Fix

### Student Onboarding (`students/onboarding.html`)
**Current**: Only saves to localStorage
**Need**: Add Firestore save on completion

```javascript
// Add to student onboarding completion
const result = await window.OnboardingSave.saveProfile({
  accountType: 'student',
  firstName: formData.firstName,
  lastName: formData.lastName,
  dateOfBirth: formData.dateOfBirth,
  phone: formData.phone,
  address: {
    street: formData.street,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
    country: formData.country
  },
  academicInfo: {
    currentGrade: formData.grade,
    gpa: parseFloat(formData.gpa),
    schoolName: formData.schoolName,
    graduationYear: parseInt(formData.graduationYear)
  }
});
```

### Counselor Onboarding (`counselors/onboarding.html`)
**Current**: No Firestore save at all
**Need**: Add Firestore save

```javascript
await window.OnboardingSave.saveProfile({
  accountType: 'counselor',
  firstName: formData.firstName,
  lastName: formData.lastName,
  schoolName: formData.schoolName,
  schoolDistrict: formData.schoolDistrict,
  licenseNumber: formData.licenseNumber,
  phone: formData.phone,
  specializations: formData.specializations || []
});
```

### Parent Onboarding (`parents/onboarding.html`)
**Current**: No Firestore save at all
**Need**: Add Firestore save

```javascript
await window.OnboardingSave.saveProfile({
  accountType: 'parent',
  firstName: formData.firstName,
  lastName: formData.lastName,
  phone: formData.phone,
  relationship: formData.relationship,
  studentIds: [] // Will be linked later
});
```

### Recommender Onboarding (`recommenders/onboarding.html`)
**Current**: No Firestore save at all
**Need**: Add Firestore save

```javascript
await window.OnboardingSave.saveProfile({
  accountType: 'recommender',
  firstName: formData.firstName,
  lastName: formData.lastName,
  title: formData.title,
  organization: formData.organization,
  phone: formData.phone,
  relationship: formData.relationship
});
```

## Quick Test

After deploying, test each account type:

1. **Login/Register** with new account
2. **Complete onboarding** with test data
3. **Check Firestore Console**:
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Check `users` collection
   - Verify your user document exists with all fields

4. **Check Dashboard**:
   - Navigate to your dashboard
   - Open browser console
   - Run: `window.FlowAuth.getUserProfile()`
   - Should show your saved data

## Settings Pages

Settings pages also need fixing to use:
```javascript
await window.OnboardingSave.updateProfile({
  // only the fields being updated
});
```

## Deploy Command

```bash
firebase deploy --only hosting
```

## Priority Order

1. ✅ Institution onboarding - FIXED
2. ⚠️ Student onboarding - URGENT
3. ⚠️ Counselor onboarding - HIGH
4. ⚠️ Parent onboarding - HIGH
5. ⚠️ Settings pages - MEDIUM

## Notes

- All fixes use `set({...}, {merge: true})` to avoid "document doesn't exist" errors
- Helper script handles Firebase initialization waiting
- Timestamps automatically added
- Error handling included

---

**Status**: Institution onboarding fixed, others pending
**Next Step**: Apply same fix pattern to all other onboarding pages
