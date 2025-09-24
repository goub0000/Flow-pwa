/**
 * Firebase API Service Layer
 * Provides centralized API methods for Flow PWA using Firebase Functions and Firestore
 */

(function() {
  'use strict';

  // Firebase API Service
  const FirebaseAPI = {
    // Base URL for Firebase Functions
    functionsBaseUrl: 'https://us-central1-flow-pwa.cloudfunctions.net/api',

    // For local development
    get baseUrl() {
      if (window.location.hostname === 'localhost' && window.Firebase?.app) {
        return 'http://localhost:5001/flow-pwa/us-central1/api';
      }
      return this.functionsBaseUrl;
    },

    // Helper method to get auth token
    async getAuthToken() {
      const user = window.FirebaseUtils?.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      return await user.getIdToken();
    },

    // Generic request method
    async request(endpoint, options = {}) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
          headers: {
            'Content-Type': 'application/json',
          },
        };

        // Add auth token if available
        try {
          const token = await this.getAuthToken();
          defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          // Continue without auth for public endpoints
          console.log('No auth token available for request');
        }

        const response = await fetch(url, {
          ...defaultOptions,
          ...options,
          headers: {
            ...defaultOptions.headers,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`API request failed for ${endpoint}:`, error);
        throw error;
      }
    },

    // GET request
    async get(endpoint, params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      return this.request(url, { method: 'GET' });
    },

    // POST request
    async post(endpoint, data = {}) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // PUT request
    async put(endpoint, data = {}) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // DELETE request
    async delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    },

    // ========================================
    // HEALTH CHECK
    // ========================================

    async healthCheck() {
      return this.get('/health');
    },

    // ========================================
    // AUTHENTICATION METHODS
    // ========================================

    async createCustomToken(uid, claims = {}) {
      return this.post('/auth/create-custom-token', { uid, claims });
    },

    async setUserClaims(uid, claims) {
      return this.post('/auth/set-claims', { uid, claims });
    },

    // ========================================
    // STUDENT METHODS
    // ========================================

    async registerStudent(studentData) {
      return this.post('/api/students/register', studentData);
    },

    async getStudent(studentId) {
      return this.get(`/api/students/${studentId}`);
    },

    async updateStudent(studentId, updateData) {
      return this.put(`/api/students/${studentId}`, updateData);
    },

    async submitApplication(studentId, applicationData) {
      return this.post(`/api/students/${studentId}/applications`, applicationData);
    },

    async searchPrograms(searchParams = {}) {
      return this.get('/api/students/programs/search', searchParams);
    },

    // ========================================
    // INSTITUTION METHODS
    // ========================================

    async registerInstitution(institutionData) {
      return this.post('/api/institutions/register', institutionData);
    },

    async getInstitution(institutionId) {
      return this.get(`/api/institutions/${institutionId}`);
    },

    async updateInstitution(institutionId, updateData) {
      return this.put(`/api/institutions/${institutionId}`, updateData);
    },

    async updateOnboarding(institutionId, onboardingData) {
      return this.put(`/api/institutions/${institutionId}/onboarding`, onboardingData);
    },

    async getInstitutionApplications(institutionId, filters = {}) {
      return this.get(`/api/institutions/${institutionId}/applications`, filters);
    },

    // ========================================
    // COUNSELOR METHODS
    // ========================================

    async registerCounselor(counselorData) {
      return this.post('/api/counselors/register', counselorData);
    },

    async getCounselor(counselorId) {
      return this.get(`/api/counselors/${counselorId}`);
    },

    async updateCounselor(counselorId, updateData) {
      return this.put(`/api/counselors/${counselorId}`, updateData);
    },

    async scheduleSession(counselorId, sessionData) {
      return this.post(`/api/counselors/${counselorId}/sessions`, sessionData);
    },

    async getCounselorSessions(counselorId, filters = {}) {
      return this.get(`/api/counselors/${counselorId}/sessions`, filters);
    },

    // ========================================
    // PARENT METHODS
    // ========================================

    async registerParent(parentData) {
      return this.post('/api/parents/register', parentData);
    },

    async getParent(parentId) {
      return this.get(`/api/parents/${parentId}`);
    },

    async updateParent(parentId, updateData) {
      return this.put(`/api/parents/${parentId}`, updateData);
    },

    async linkChild(parentId, linkData) {
      return this.post(`/api/parents/${parentId}/children/link`, linkData);
    },

    async getParentChildren(parentId) {
      return this.get(`/api/parents/${parentId}/children`);
    },

    // ========================================
    // RECOMMENDER METHODS
    // ========================================

    async registerRecommender(recommenderData) {
      return this.post('/api/recommenders/register', recommenderData);
    },

    async getRecommender(recommenderId) {
      return this.get(`/api/recommenders/${recommenderId}`);
    },

    async updateRecommender(recommenderId, updateData) {
      return this.put(`/api/recommenders/${recommenderId}`, updateData);
    },

    async submitRecommendation(recommenderId, recommendationData) {
      return this.post(`/api/recommenders/${recommenderId}/recommendations`, recommendationData);
    },

    async getRecommenderRequests(recommenderId, filters = {}) {
      return this.get(`/api/recommenders/${recommenderId}/requests`, filters);
    },

    // ========================================
    // ANALYTICS METHODS
    // ========================================

    async getApplicationAnalytics(filters = {}) {
      return this.get('/api/analytics/applications', filters);
    },

    async getEnrollmentAnalytics(filters = {}) {
      return this.get('/api/analytics/enrollments', filters);
    },

    async getPerformanceMetrics(filters = {}) {
      return this.get('/api/analytics/performance', filters);
    },

    // ========================================
    // DIRECT FIRESTORE METHODS
    // ========================================

    // For real-time operations using Firestore directly
    async getFirestoreReference(collection, documentId = null) {
      const db = window.firebaseDb();
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      if (documentId) {
        return db.collection(collection).doc(documentId);
      }
      return db.collection(collection);
    },

    // Get document with real-time updates
    async subscribeToDocument(collection, documentId, callback, errorCallback = null) {
      try {
        const docRef = await this.getFirestoreReference(collection, documentId);
        return docRef.onSnapshot(
          (doc) => {
            if (doc.exists) {
              callback({ id: doc.id, ...doc.data() });
            } else {
              callback(null);
            }
          },
          (error) => {
            console.error(`Error listening to ${collection}/${documentId}:`, error);
            if (errorCallback) errorCallback(error);
          }
        );
      } catch (error) {
        console.error(`Failed to subscribe to ${collection}/${documentId}:`, error);
        if (errorCallback) errorCallback(error);
        throw error;
      }
    },

    // Get collection with real-time updates
    async subscribeToCollection(collection, query = null, callback, errorCallback = null) {
      try {
        let collectionRef = await this.getFirestoreReference(collection);

        // Apply query if provided
        if (query) {
          if (query.where) {
            query.where.forEach(([field, operator, value]) => {
              collectionRef = collectionRef.where(field, operator, value);
            });
          }
          if (query.orderBy) {
            query.orderBy.forEach(([field, direction = 'asc']) => {
              collectionRef = collectionRef.orderBy(field, direction);
            });
          }
          if (query.limit) {
            collectionRef = collectionRef.limit(query.limit);
          }
        }

        return collectionRef.onSnapshot(
          (snapshot) => {
            const documents = [];
            snapshot.forEach((doc) => {
              documents.push({ id: doc.id, ...doc.data() });
            });
            callback(documents);
          },
          (error) => {
            console.error(`Error listening to ${collection}:`, error);
            if (errorCallback) errorCallback(error);
          }
        );
      } catch (error) {
        console.error(`Failed to subscribe to ${collection}:`, error);
        if (errorCallback) errorCallback(error);
        throw error;
      }
    },

    // Create document
    async createDocument(collection, data, documentId = null) {
      try {
        const db = window.firebaseDb();
        const timestamp = window.FirebaseUtils.getTimestamp();

        const documentData = {
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        if (documentId) {
          await db.collection(collection).doc(documentId).set(documentData);
          return { id: documentId, ...documentData };
        } else {
          const docRef = await db.collection(collection).add(documentData);
          return { id: docRef.id, ...documentData };
        }
      } catch (error) {
        console.error(`Failed to create document in ${collection}:`, error);
        throw error;
      }
    },

    // Update document
    async updateDocument(collection, documentId, updateData) {
      try {
        const db = window.firebaseDb();
        const timestamp = window.FirebaseUtils.getTimestamp();

        const data = {
          ...updateData,
          updatedAt: timestamp
        };

        await db.collection(collection).doc(documentId).update(data);
        return { success: true };
      } catch (error) {
        console.error(`Failed to update document ${collection}/${documentId}:`, error);
        throw error;
      }
    },

    // Delete document
    async deleteDocument(collection, documentId) {
      try {
        const db = window.firebaseDb();
        await db.collection(collection).doc(documentId).delete();
        return { success: true };
      } catch (error) {
        console.error(`Failed to delete document ${collection}/${documentId}:`, error);
        throw error;
      }
    },

    // ========================================
    // UTILITY METHODS
    // ========================================

    // Upload file to Firebase Storage
    async uploadFile(file, path, metadata = {}) {
      try {
        return await window.FirebaseUtils.uploadFile(file, path, metadata);
      } catch (error) {
        console.error('File upload failed:', error);
        throw error;
      }
    },

    // Delete file from Firebase Storage
    async deleteFile(path) {
      try {
        return await window.FirebaseUtils.deleteFile(path);
      } catch (error) {
        console.error('File deletion failed:', error);
        throw error;
      }
    },

    // Generate report data
    async generateReport(reportType, filters = {}) {
      return this.post('/api/reports/generate', { type: reportType, filters });
    },

    // Export data
    async exportData(dataType, format = 'csv', filters = {}) {
      return this.post('/api/export', { dataType, format, filters });
    }
  };

  // ========================================
  // ERROR HANDLING UTILITIES
  // ========================================

  const APIErrorHandler = {
    // Handle API errors with user-friendly messages
    handleError(error, context = '') {
      console.error(`API Error ${context}:`, error);

      // Check for specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'Network error. Please check your internet connection.';
      }

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return 'Authentication required. Please sign in again.';
      }

      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return 'You don\'t have permission to perform this action.';
      }

      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return 'The requested resource was not found.';
      }

      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return 'Too many requests. Please try again later.';
      }

      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        return 'Server error. Please try again later.';
      }

      // Return the original error message if it's user-friendly
      if (error.message && !error.message.includes('HTTP') && !error.message.includes('fetch')) {
        return error.message;
      }

      return 'An unexpected error occurred. Please try again.';
    },

    // Show error to user (integrate with your toast/notification system)
    showError(error, context = '') {
      const message = this.handleError(error, context);

      // Use your existing toast system
      if (window.showToast) {
        window.showToast(message, 'error', 5000);
      } else {
        console.error('Error:', message);
        alert(message); // Fallback
      }
    }
  };

  // Wait for Firebase to initialize before making API available
  document.addEventListener('firebaseInitialized', () => {
    console.log('🔥 Firebase API service ready');
  });

  // Make API service globally available
  window.FirebaseAPI = FirebaseAPI;
  window.APIErrorHandler = APIErrorHandler;

  console.log('📡 Firebase API service loaded');

})();