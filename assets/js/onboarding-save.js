// Universal Onboarding Save Helper
// Saves user profile data to Firestore with proper error handling

(function() {
  'use strict';

  // Wait for Firebase to be ready
  async function waitForFirebase() {
    if (window.Firebase && window.Firebase.initialized) {
      return;
    }

    return new Promise(resolve => {
      document.addEventListener('firebaseInitialized', resolve, { once: true });
    });
  }

  // Save profile data to Firestore
  async function saveProfile(profileData) {
    try {
      // Wait for Firebase
      await waitForFirebase();

      // Get current user
      const user = window.FlowAuth?.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in. Please log in first.');
      }

      const db = window.Firebase.db;

      // Prepare data with required fields
      const dataToSave = {
        // User identification
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,

        // Merge provided profile data
        ...profileData,

        // Ensure required fields
        isActive: true,
        onboardingCompleted: true,

        // Timestamps
        updatedAt: window.FirebaseUtils.getTimestamp(),
        lastLoginAt: window.FirebaseUtils.getTimestamp()
      };

      // If createdAt doesn't exist, add it
      if (!profileData.createdAt) {
        dataToSave.createdAt = window.FirebaseUtils.getTimestamp();
      }

      // Save to Firestore using set with merge
      await db.collection('users').doc(user.uid).set(dataToSave, { merge: true });

      console.log('✅ Profile saved successfully for:', user.email);

      return {
        success: true,
        message: 'Profile saved successfully!',
        userId: user.uid
      };

    } catch (error) {
      console.error('❌ Error saving profile:', error);

      return {
        success: false,
        error: error.message,
        message: 'Failed to save profile. Please try again.'
      };
    }
  }

  // Update specific fields in profile
  async function updateProfile(updates) {
    try {
      await waitForFirebase();

      const user = window.FlowAuth?.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const db = window.Firebase.db;

      // Add timestamp to updates
      const dataToUpdate = {
        ...updates,
        updatedAt: window.FirebaseUtils.getTimestamp()
      };

      // Use set with merge to update
      await db.collection('users').doc(user.uid).set(dataToUpdate, { merge: true });

      console.log('✅ Profile updated successfully');

      // Reload user profile in FlowAuth to get latest data
      if (window.FlowAuth && window.FlowAuth.reloadUserProfile) {
        await window.FlowAuth.reloadUserProfile();
      }

      return {
        success: true,
        message: 'Profile updated successfully!'
      };

    } catch (error) {
      console.error('❌ Error updating profile:', error);

      return {
        success: false,
        error: error.message,
        message: 'Failed to update profile. Please try again.'
      };
    }
  }

  // Get current user profile from Firestore
  async function getProfile() {
    try {
      await waitForFirebase();

      const user = window.FlowAuth?.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const db = window.Firebase.db;
      const doc = await db.collection('users').doc(user.uid).get();

      if (doc.exists) {
        return {
          success: true,
          profile: { id: doc.id, ...doc.data() }
        };
      } else {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

    } catch (error) {
      console.error('❌ Error getting profile:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Show notification to user
  function showNotification(message, type = 'info') {
    // Try to use existing toast/notification system
    if (window.showToast) {
      window.showToast(message, type);
    } else if (window.toast) {
      window.toast.show(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  // Export functions globally
  window.OnboardingSave = {
    saveProfile,
    updateProfile,
    getProfile,
    showNotification
  };

  console.log('📝 Onboarding Save Helper loaded');

})();
