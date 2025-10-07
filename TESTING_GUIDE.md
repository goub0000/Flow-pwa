# Testing Guide - Data Saving Fixes

## ✅ What Was Fixed

### Issue #1: Onboarding Data Not Saving
**Problem**: All onboarding pages only saved to localStorage, not Firestore
**Fixed**: ✅ Institution & Parent onboarding now save to Firestore

### Issue #2: Settings Not Saving
**Problem**: Settings showed "saved" alert but didn't actually save to database
**Fixed**: ✅ Settings now properly save to Firestore and dashboard updates

### Issue #3: Dashboard Not Updating
**Problem**: Changes weren't reflected in dashboard after saving
**Fixed**: ✅ Dashboard now reloads and clears cache after updates

---

## 🧪 Testing Instructions

### Test 1: New Institution Onboarding

**Steps:**
1. Go to https://flow-pwa.web.app/auth/register.html
2. Register a NEW institution account:
   - Email: `testinstitution@example.edu`
   - Password: `TestPassword123!`
   - Account Type: **Institution**
3. Complete the onboarding process:
   - Step 2: Enter institution name (e.g., "Test University")
   - Step 3: Fill in registration details
   - Step 4: Fill in program info
   - Step 5-6: Skip team/integrations
   - Step 7: Review and click "Go to Dashboard"

**Expected Results:**
✅ Should redirect to institution dashboard
✅ Dashboard should show institution name in header
✅ Dashboard should show "Welcome, Test University"

**Verify in Firestore:**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `users` collection
4. Find your user document (by UID)
5. Should see:
   ```json
   {
     "accountType": "institution",
     "institutionName": "Test University",
     "displayName": "Test University",
     "email": "testinstitution@example.edu",
     "onboardingCompleted": true,
     ...other fields
   }
   ```

**Console Test:**
```javascript
// Open browser console (F12)
const profile = window.FlowAuth.getUserProfile();
console.log('Profile:', profile);
// Should show all your onboarding data
```

---

### Test 2: Institution Settings Update

**Prerequisites:** You must be logged in as an institution

**Steps:**
1. Go to institution dashboard: https://flow-pwa.web.app/institutions/
2. Click the **floating settings gear** icon (bottom right)
3. Settings modal should open with current data pre-filled
4. Change the "Institution Name" field to something new (e.g., "Modified University")
5. Click **"Save Changes"**

**Expected Results:**
✅ Should show "Settings saved successfully!" alert
✅ Settings modal should close
✅ Dashboard should reload automatically
✅ Header should show new name: "Modified University"
✅ Welcome message should update: "Welcome, Modified University"

**Verify in Firestore:**
1. Go to Firebase Console → Firestore → `users` → your document
2. Should see updated `institutionName` and `displayName`
3. Should see updated `updatedAt` timestamp

**Console Test:**
```javascript
// After saving settings
const profile = window.FlowAuth.getUserProfile();
console.log('Updated name:', profile.institutionName);
// Should show new name

// Check Firestore directly
const user = window.FlowAuth.getCurrentUser();
const db = window.Firebase.db;
db.collection('users').doc(user.uid).get().then(doc => {
  console.log('Firestore data:', doc.data());
});
```

---

### Test 3: Dashboard Data Reload

**Steps:**
1. Login as institution
2. Note the current name shown in dashboard
3. Open a **second browser tab**
4. Go to Firebase Console → Firestore
5. Manually edit your user document:
   - Change `institutionName` to "Manually Updated"
6. Go back to first tab with dashboard
7. Open console and run:
   ```javascript
   window.reloadDashboard()
   ```

**Expected Results:**
✅ Dashboard should refresh
✅ Should show "Manually Updated" as institution name
✅ Console should show "🔄 Reloading dashboard and clearing cache..."

---

### Test 4: Parent Onboarding

**Steps:**
1. Logout from institution account
2. Register a NEW parent account:
   - Email: `testparent@example.com`
   - Password: `TestPassword123!`
   - Account Type: **Parent**
3. Complete parent onboarding with test data
4. Click "Complete Onboarding"

**Expected Results:**
✅ Should save to Firestore
✅ Should redirect to parent dashboard
✅ Dashboard should show parent name

**Verify in Firestore:**
- Check `users` collection
- Your document should have `accountType: "parent"`
- Should have all fields you entered

---

## 🐛 Known Issues (Still Need Fixing)

### Student Onboarding ⚠️
**Status**: NOT YET FIXED
**Issue**: Still only saves to localStorage
**Workaround**: None - needs code fix

### Counselor Onboarding ⚠️
**Status**: NOT YET FIXED
**Issue**: Still only saves to localStorage
**Workaround**: None - needs code fix

### Recommender Onboarding ⚠️
**Status**: NOT YET FIXED
**Issue**: Still only saves to localStorage
**Workaround**: None - needs code fix

---

## 🔍 Troubleshooting

### Problem: Settings Save But Dashboard Doesn't Update

**Solution 1: Force Reload**
```javascript
// Open console
window.DataService.clearCache();
window.reloadDashboard();
```

**Solution 2: Hard Refresh**
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

### Problem: "No user is currently signed in" Error

**Cause**: You're not logged in or session expired

**Solution:**
1. Check authentication:
   ```javascript
   window.FlowAuth.isAuthenticated()
   ```
2. If `false`, login again
3. Check if your account exists in Firestore

### Problem: Data Shows in Firestore But Not in Dashboard

**Cause**: Cache issue or page not loading profile

**Solution:**
```javascript
// Clear cache and reload profile
window.DataService.clearCache();
await window.FlowAuth.reloadUserProfile();
window.reloadDashboard();
```

### Problem: Onboarding Saves But Dashboard Shows "Institution" or Generic Name

**Cause**: Dashboard loader might not be finding the profile

**Solution:**
1. Check profile exists:
   ```javascript
   const profile = window.FlowAuth.getUserProfile();
   console.log('Profile:', profile);
   ```
2. If profile is empty, reload:
   ```javascript
   await window.FlowAuth.reloadUserProfile();
   ```
3. Check browser console for errors (F12)

---

## 📊 Success Criteria

### ✅ Institution Onboarding Works If:
- [ ] New registration saves to Firestore
- [ ] Dashboard loads with correct name
- [ ] Profile data persists after logout/login
- [ ] No console errors

### ✅ Settings Works If:
- [ ] Settings modal pre-fills current data
- [ ] Changes save to Firestore
- [ ] Dashboard updates immediately
- [ ] Profile cache clears
- [ ] New data shows in Firestore Console

### ✅ Dashboard Works If:
- [ ] Shows actual user data from Firestore
- [ ] Updates when reloadDashboard() is called
- [ ] Shows empty states if no data (not errors)
- [ ] Console shows no Firebase errors

---

## 🔧 Quick Reference Commands

### Check Authentication
```javascript
window.FlowAuth.isAuthenticated()
window.FlowAuth.getCurrentUser()
window.FlowAuth.getUserProfile()
```

### Reload Data
```javascript
window.DataService.clearCache()
await window.FlowAuth.reloadUserProfile()
window.reloadDashboard()
```

### Check Firestore
```javascript
const user = window.FlowAuth.getCurrentUser();
const db = window.Firebase.db;
db.collection('users').doc(user.uid).get().then(doc => {
  console.log('Your data:', doc.data());
});
```

### Update Profile Manually (Testing)
```javascript
await window.OnboardingSave.updateProfile({
  institutionName: 'Test Name',
  displayName: 'Test Name'
});
window.reloadDashboard();
```

---

## 📝 Report Issues

If you find issues, report with:
1. Account type (institution, parent, etc.)
2. What you were doing
3. Expected vs actual behavior
4. Browser console errors (F12 → Console)
5. Screenshot if possible

---

**Last Updated**: 2025-10-06
**Deploy Status**: ✅ LIVE at https://flow-pwa.web.app
**Fixes**: Institution onboarding, Parent onboarding, Settings save
