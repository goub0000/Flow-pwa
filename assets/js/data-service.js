// Flow Data Service Layer
// Professional CRUD operations with proper error handling and caching

(function() {
  'use strict';

  // Service initialization flag
  let serviceReady = false;
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Wait for Firebase to be ready
  function waitForFirebase() {
    return new Promise((resolve) => {
      if (window.Firebase && window.Firebase.initialized) {
        resolve();
      } else {
        document.addEventListener('firebaseInitialized', resolve, { once: true });
      }
    });
  }

  // Cache helper
  function getCached(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  function clearCache(pattern) {
    if (pattern) {
      for (const [key] of cache) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }

  // =============================================================================
  // USER SERVICES
  // =============================================================================

  const UserService = {
    /**
     * Get user profile by ID
     */
    async getUser(userId) {
      const cacheKey = `user:${userId}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
          const user = { id: doc.id, ...doc.data() };
          setCache(cacheKey, user);
          return user;
        }
        return null;
      } catch (error) {
        console.error('Error getting user:', error);
        throw error;
      }
    },

    /**
     * Update user profile
     */
    async updateUser(userId, updates) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        await db.collection('users').doc(userId).update({
          ...updates,
          updatedAt: window.FirebaseUtils.getTimestamp()
        });
        clearCache(`user:${userId}`);
        return { success: true };
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },

    /**
     * Get students by counselor ID
     */
    async getStudentsByCounselor(counselorId) {
      const cacheKey = `counselor:${counselorId}:students`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('users')
          .where('accountType', '==', 'student')
          .where('counselorId', '==', counselorId)
          .get();

        const students = [];
        snapshot.forEach(doc => {
          students.push({ id: doc.id, ...doc.data() });
        });

        setCache(cacheKey, students);
        return students;
      } catch (error) {
        console.error('Error getting students:', error);
        throw error;
      }
    },

    /**
     * Get children by parent ID
     */
    async getChildrenByParent(parentId) {
      const cacheKey = `parent:${parentId}:children`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('users')
          .where('accountType', '==', 'student')
          .where('parentIds', 'array-contains', parentId)
          .get();

        const children = [];
        snapshot.forEach(doc => {
          children.push({ id: doc.id, ...doc.data() });
        });

        setCache(cacheKey, children);
        return children;
      } catch (error) {
        console.error('Error getting children:', error);
        throw error;
      }
    }
  };

  // =============================================================================
  // PROGRAM SERVICES
  // =============================================================================

  const ProgramService = {
    /**
     * Get all programs for an institution
     */
    async getProgramsByInstitution(institutionId) {
      const cacheKey = `institution:${institutionId}:programs`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('programs')
          .where('institutionId', '==', institutionId)
          .where('isActive', '==', true)
          .get();

        const programs = [];
        snapshot.forEach(doc => {
          programs.push({ id: doc.id, ...doc.data() });
        });

        setCache(cacheKey, programs);
        return programs;
      } catch (error) {
        console.error('Error getting programs:', error);
        throw error;
      }
    },

    /**
     * Get program by ID
     */
    async getProgram(programId) {
      const cacheKey = `program:${programId}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const doc = await db.collection('programs').doc(programId).get();
        if (doc.exists) {
          const program = { id: doc.id, ...doc.data() };
          setCache(cacheKey, program);
          return program;
        }
        return null;
      } catch (error) {
        console.error('Error getting program:', error);
        throw error;
      }
    },

    /**
     * Create new program
     */
    async createProgram(programData) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const docRef = await db.collection('programs').add({
          ...programData,
          isActive: true,
          stats: {
            totalSpots: programData.stats?.totalSpots || 0,
            availableSpots: programData.stats?.availableSpots || 0,
            applicantsCount: 0,
            acceptedCount: 0,
            enrolledCount: 0
          },
          createdAt: window.FirebaseUtils.getTimestamp(),
          updatedAt: window.FirebaseUtils.getTimestamp()
        });

        clearCache(`institution:${programData.institutionId}:programs`);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('Error creating program:', error);
        throw error;
      }
    },

    /**
     * Update program
     */
    async updateProgram(programId, updates) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        await db.collection('programs').doc(programId).update({
          ...updates,
          updatedAt: window.FirebaseUtils.getTimestamp()
        });

        const program = await this.getProgram(programId);
        clearCache(`program:${programId}`);
        clearCache(`institution:${program.institutionId}:programs`);
        return { success: true };
      } catch (error) {
        console.error('Error updating program:', error);
        throw error;
      }
    },

    /**
     * Get program statistics
     */
    async getProgramStats(institutionId) {
      const programs = await this.getProgramsByInstitution(institutionId);

      const stats = {
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.isActive).length,
        totalSpots: programs.reduce((sum, p) => sum + (p.stats?.totalSpots || 0), 0),
        availableSpots: programs.reduce((sum, p) => sum + (p.stats?.availableSpots || 0), 0),
        totalApplicants: programs.reduce((sum, p) => sum + (p.stats?.applicantsCount || 0), 0)
      };

      stats.fillRate = stats.totalSpots > 0
        ? ((stats.totalSpots - stats.availableSpots) / stats.totalSpots * 100).toFixed(1)
        : 0;

      return stats;
    }
  };

  // =============================================================================
  // APPLICATION SERVICES
  // =============================================================================

  const ApplicationService = {
    /**
     * Get applications for a student
     */
    async getApplicationsByStudent(studentId) {
      const cacheKey = `student:${studentId}:applications`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('applications')
          .where('studentId', '==', studentId)
          .orderBy('createdAt', 'desc')
          .get();

        const applications = [];
        snapshot.forEach(doc => {
          applications.push({ id: doc.id, ...doc.data() });
        });

        setCache(cacheKey, applications);
        return applications;
      } catch (error) {
        console.error('Error getting student applications:', error);
        throw error;
      }
    },

    /**
     * Get applications for an institution
     */
    async getApplicationsByInstitution(institutionId) {
      const cacheKey = `institution:${institutionId}:applications`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('applications')
          .where('targetInstitutionId', '==', institutionId)
          .orderBy('submittedAt', 'desc')
          .get();

        const applications = [];
        snapshot.forEach(doc => {
          applications.push({ id: doc.id, ...doc.data() });
        });

        setCache(cacheKey, applications);
        return applications;
      } catch (error) {
        console.error('Error getting institution applications:', error);
        throw error;
      }
    },

    /**
     * Get application statistics for institution
     */
    async getInstitutionStats(institutionId) {
      const applications = await this.getApplicationsByInstitution(institutionId);

      const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        waitlisted: applications.filter(a => a.status === 'waitlisted').length
      };

      stats.completionRate = stats.total > 0
        ? ((stats.accepted / stats.total) * 100).toFixed(1)
        : 0;

      return stats;
    },

    /**
     * Create new application
     */
    async createApplication(applicationData) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const docRef = await db.collection('applications').add({
          ...applicationData,
          status: 'draft',
          completionPercentage: 0,
          createdAt: window.FirebaseUtils.getTimestamp(),
          updatedAt: window.FirebaseUtils.getTimestamp()
        });

        clearCache(`student:${applicationData.studentId}:applications`);
        clearCache(`institution:${applicationData.targetInstitutionId}:applications`);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('Error creating application:', error);
        throw error;
      }
    },

    /**
     * Update application
     */
    async updateApplication(applicationId, updates) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        await db.collection('applications').doc(applicationId).update({
          ...updates,
          updatedAt: window.FirebaseUtils.getTimestamp()
        });

        const app = await db.collection('applications').doc(applicationId).get();
        const appData = app.data();
        clearCache(`student:${appData.studentId}:applications`);
        clearCache(`institution:${appData.targetInstitutionId}:applications`);
        return { success: true };
      } catch (error) {
        console.error('Error updating application:', error);
        throw error;
      }
    }
  };

  // =============================================================================
  // MESSAGE SERVICES
  // =============================================================================

  const MessageService = {
    /**
     * Get messages for a user
     */
    async getMessages(userId, limit = 50) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('messages')
          .where('recipientId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();

        const messages = [];
        snapshot.forEach(doc => {
          messages.push({ id: doc.id, ...doc.data() });
        });

        return messages;
      } catch (error) {
        console.error('Error getting messages:', error);
        throw error;
      }
    },

    /**
     * Get unread message count
     */
    async getUnreadCount(userId) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('messages')
          .where('recipientId', '==', userId)
          .where('read', '==', false)
          .get();

        return snapshot.size;
      } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }
    },

    /**
     * Send a message
     */
    async sendMessage(messageData) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const docRef = await db.collection('messages').add({
          ...messageData,
          read: false,
          createdAt: window.FirebaseUtils.getTimestamp()
        });

        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        await db.collection('messages').doc(messageId).update({
          read: true,
          readAt: window.FirebaseUtils.getTimestamp()
        });

        return { success: true };
      } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }
    }
  };

  // =============================================================================
  // NOTIFICATION SERVICES
  // =============================================================================

  const NotificationService = {
    /**
     * Get notifications for a user
     */
    async getNotifications(userId, limit = 20) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('notifications')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();

        const notifications = [];
        snapshot.forEach(doc => {
          notifications.push({ id: doc.id, ...doc.data() });
        });

        return notifications;
      } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
      }
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        const snapshot = await db.collection('notifications')
          .where('userId', '==', userId)
          .where('read', '==', false)
          .get();

        return snapshot.size;
      } catch (error) {
        console.error('Error getting unread notification count:', error);
        return 0;
      }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
      await waitForFirebase();
      const db = window.Firebase.db;

      try {
        await db.collection('notifications').doc(notificationId).update({
          read: true,
          readAt: window.FirebaseUtils.getTimestamp()
        });

        return { success: true };
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    }
  };

  // Initialize service
  async function init() {
    await waitForFirebase();
    serviceReady = true;
    console.log('✅ Data Service Layer initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export services globally
  window.DataService = {
    User: UserService,
    Program: ProgramService,
    Application: ApplicationService,
    Message: MessageService,
    Notification: NotificationService,
    clearCache,
    isReady: () => serviceReady
  };

  console.log('📊 Data Service Layer loaded');

})();
