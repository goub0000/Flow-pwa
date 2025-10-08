// Universal Dashboard Loader
// Loads appropriate data for each user type's dashboard

(function() {
  'use strict';

  // Wait for all dependencies
  async function waitForDependencies() {
    // Wait for Firebase
    if (!window.Firebase || !window.Firebase.initialized) {
      await new Promise(resolve => {
        document.addEventListener('firebaseInitialized', resolve, { once: true });
      });
    }

    // Wait for Data Service
    while (!window.DataService || !window.DataService.isReady()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for Auth
    while (!window.FlowAuth) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // =============================================================================
  // INSTITUTION DASHBOARD
  // =============================================================================

  async function loadInstitutionDashboard() {
    console.log('📊 Loading institution dashboard...');

    try {
      const user = window.FlowAuth.getCurrentUser();
      const profile = window.FlowAuth.getUserProfile();

      if (!user || !profile) {
        console.error('No user or profile found');
        return;
      }

      // Update profile information
      const institutionName = profile.institutionName || profile.displayName || 'Institution';
      const email = user.email || profile.email || 'email@institution.edu';

      updateElement('headerInstitutionName', institutionName);
      updateElement('profileInstitutionName', institutionName);
      updateElement('profileEmail', email);
      updateElement('dashTitle', `Welcome, ${institutionName}`);
      updateValue('institutionName', institutionName);

      // Load application statistics
      const appStats = await window.DataService.Application.getInstitutionStats(user.uid);
      updateElement('totalApplications', appStats.total.toLocaleString());
      updateElement('pendingReviews', appStats.pending.toLocaleString());
      updateElement('acceptedApplications', appStats.accepted.toLocaleString());
      updateElement('completionRate', appStats.completionRate + '%');

      // Load program statistics
      const progStats = await window.DataService.Program.getProgramStats(user.uid);
      updateElement('activePrograms', progStats.activePrograms.toLocaleString());
      updateElement('totalPrograms', progStats.totalPrograms.toLocaleString());
      updateElement('availableSpots', progStats.availableSpots.toLocaleString());
      updateElement('fillRate', progStats.fillRate + '%');

      // Load recent applications (if element exists)
      if (document.getElementById('recentApplicationsList')) {
        await loadRecentApplications(user.uid);
      }

      console.log('✅ Institution dashboard loaded');
    } catch (error) {
      console.error('❌ Error loading institution dashboard:', error);
    }
  }

  // =============================================================================
  // STUDENT DASHBOARD
  // =============================================================================

  async function loadStudentDashboard() {
    console.log('📊 Loading student dashboard...');

    try {
      const user = window.FlowAuth.getCurrentUser();
      let profile = window.FlowAuth.getUserProfile();

      if (!user || !profile) {
        console.error('No user or profile found');
        return;
      }

      // Ensure we have the latest profile from Firestore, not cached Firebase Auth data
      if (!profile.onboardingCompleted) {
        console.log('⏳ Profile not fully loaded, reloading from Firestore...');
        try {
          profile = await window.FlowAuth.reloadUserProfile();
          console.log('✅ Fresh profile loaded:', profile);
        } catch (error) {
          console.warn('⚠️ Failed to reload profile, using cached data');
        }
      }

      // Update profile information - ONLY use Firestore profile data, NOT Firebase Auth displayName
      // This prevents showing old cached name before fresh data loads
      const studentName = profile.displayName ||
                         `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
                         'Student';
      const email = user.email || profile.email || 'email@student.edu';

      console.log('📝 Updating dashboard with:', { studentName, email, profile });

      updateElement('headerStudentName', studentName);
      updateElement('profileStudentName', studentName);
      updateElement('profileEmail', email);
      updateElement('dashTitle', `Welcome, ${studentName}`);

      // Load application statistics
      const applications = await window.DataService.Application.getApplicationsByStudent(user.uid);

      const stats = {
        total: applications.length,
        draft: applications.filter(a => a.status === 'draft').length,
        submitted: applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
        accepted: applications.filter(a => a.status === 'accepted').length
      };

      updateElement('totalApplications', stats.total.toLocaleString());
      updateElement('draftApplications', stats.draft.toLocaleString());
      updateElement('submittedApplications', stats.submitted.toLocaleString());
      updateElement('acceptedApplications', stats.accepted.toLocaleString());

      // Load applications list (if element exists)
      if (document.getElementById('applicationsList')) {
        await loadStudentApplications(user.uid, applications);
      }

      // Load upcoming deadlines (if element exists)
      if (document.getElementById('deadlinesList')) {
        await loadUpcomingDeadlines(user.uid);
      }

      console.log('✅ Student dashboard loaded');
    } catch (error) {
      console.error('❌ Error loading student dashboard:', error);
    }
  }

  // =============================================================================
  // COUNSELOR DASHBOARD
  // =============================================================================

  async function loadCounselorDashboard() {
    console.log('📊 Loading counselor dashboard...');

    try {
      const user = window.FlowAuth.getCurrentUser();
      const profile = window.FlowAuth.getUserProfile();

      if (!user || !profile) {
        console.error('No user or profile found');
        return;
      }

      // Update profile information
      const counselorName = profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Counselor';
      const email = user.email || profile.email || 'email@counselor.edu';

      updateElement('headerCounselorName', counselorName);
      updateElement('profileCounselorName', counselorName);
      updateElement('profileEmail', email);
      updateElement('dashTitle', `Welcome, ${counselorName}`);

      // Load students
      const students = await window.DataService.User.getStudentsByCounselor(user.uid);
      updateElement('totalStudents', students.length.toLocaleString());

      // Calculate stats from students' applications
      let totalApplications = 0;
      let acceptedCount = 0;

      for (const student of students) {
        const apps = await window.DataService.Application.getApplicationsByStudent(student.id);
        totalApplications += apps.length;
        acceptedCount += apps.filter(a => a.status === 'accepted').length;
      }

      updateElement('totalApplications', totalApplications.toLocaleString());
      updateElement('acceptedApplications', acceptedCount.toLocaleString());

      const successRate = totalApplications > 0
        ? ((acceptedCount / totalApplications) * 100).toFixed(1)
        : 0;
      updateElement('successRate', successRate + '%');

      // Load students list (if element exists)
      if (document.getElementById('studentsList')) {
        await loadStudentsList(students);
      }

      console.log('✅ Counselor dashboard loaded');
    } catch (error) {
      console.error('❌ Error loading counselor dashboard:', error);
    }
  }

  // =============================================================================
  // PARENT DASHBOARD
  // =============================================================================

  async function loadParentDashboard() {
    console.log('📊 Loading parent dashboard...');

    try {
      const user = window.FlowAuth.getCurrentUser();
      const profile = window.FlowAuth.getUserProfile();

      if (!user || !profile) {
        console.error('No user or profile found');
        return;
      }

      // Update profile information
      const parentName = profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Parent';
      const email = user.email || profile.email || 'email@parent.com';

      updateElement('headerParentName', parentName);
      updateElement('profileParentName', parentName);
      updateElement('profileEmail', email);
      updateElement('dashTitle', `Welcome, ${parentName}`);

      // Load children
      const children = await window.DataService.User.getChildrenByParent(user.uid);
      updateElement('totalChildren', children.length.toLocaleString());

      // Calculate stats from children's applications
      let totalApplications = 0;
      let acceptedCount = 0;

      for (const child of children) {
        const apps = await window.DataService.Application.getApplicationsByStudent(child.id);
        totalApplications += apps.length;
        acceptedCount += apps.filter(a => a.status === 'accepted').length;
      }

      updateElement('totalApplications', totalApplications.toLocaleString());
      updateElement('acceptedApplications', acceptedCount.toLocaleString());

      // Load children list (if element exists)
      if (document.getElementById('childrenList')) {
        await loadChildrenList(children);
      }

      console.log('✅ Parent dashboard loaded');
    } catch (error) {
      console.error('❌ Error loading parent dashboard:', error);
    }
  }

  // =============================================================================
  // RECOMMENDER DASHBOARD
  // =============================================================================

  async function loadRecommenderDashboard() {
    console.log('📊 Loading recommender dashboard...');

    try {
      const user = window.FlowAuth.getCurrentUser();
      const profile = window.FlowAuth.getUserProfile();

      if (!user || !profile) {
        console.error('No user or profile found');
        return;
      }

      // Update profile information
      const recommenderName = profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Recommender';
      const email = user.email || profile.email || 'email@recommender.edu';

      updateElement('headerRecommenderName', recommenderName);
      updateElement('profileRecommenderName', recommenderName);
      updateElement('profileEmail', email);
      updateElement('dashTitle', `Welcome, ${recommenderName}`);

      console.log('✅ Recommender dashboard loaded');
    } catch (error) {
      console.error('❌ Error loading recommender dashboard:', error);
    }
  }

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function updateValue(id, value) {
    const element = document.getElementById(id);
    if (element && element.tagName === 'INPUT') {
      element.value = value;
    }
  }

  async function loadRecentApplications(institutionId) {
    try {
      const applications = await window.DataService.Application.getApplicationsByInstitution(institutionId);
      const recent = applications.slice(0, 10);

      // TODO: Render applications list
      console.log('Recent applications:', recent.length);
    } catch (error) {
      console.error('Error loading recent applications:', error);
    }
  }

  async function loadStudentApplications(studentId, applications) {
    // TODO: Render student applications list
    console.log('Student applications:', applications.length);
  }

  async function loadUpcomingDeadlines(studentId) {
    // TODO: Load and render deadlines
    console.log('Loading deadlines for student:', studentId);
  }

  async function loadStudentsList(students) {
    // TODO: Render students list
    console.log('Students:', students.length);
  }

  async function loadChildrenList(children) {
    // TODO: Render children list
    console.log('Children:', children.length);
  }

  // =============================================================================
  // MAIN LOADER
  // =============================================================================

  async function loadDashboard() {
    console.log('🚀 Initializing dashboard loader...');

    try {
      await waitForDependencies();

      const user = window.FlowAuth.getCurrentUser();
      let profile = window.FlowAuth.getUserProfile();

      if (!user || !profile) {
        console.log('⏳ Waiting for user authentication and profile...');
        // Wait for auth state change event instead of giving up
        return;
      }

      // Force reload profile to ensure we have latest Firestore data
      console.log('🔄 Reloading profile to ensure fresh data...');
      try {
        profile = await window.FlowAuth.reloadUserProfile();
        console.log('✅ Fresh profile reloaded');
      } catch (error) {
        console.warn('⚠️ Failed to reload profile:', error);
      }

      console.log('✅ User and profile loaded:', {
        email: user.email,
        accountType: profile.accountType,
        displayName: profile.displayName || profile.institutionName || 'Unknown',
        firstName: profile.firstName,
        lastName: profile.lastName
      });

      const accountType = profile.accountType;
      console.log('📊 Loading dashboard for account type:', accountType);

      switch (accountType) {
        case 'institution':
          await loadInstitutionDashboard();
          break;
        case 'student':
          await loadStudentDashboard();
          break;
        case 'counselor':
          await loadCounselorDashboard();
          break;
        case 'parent':
          await loadParentDashboard();
          break;
        case 'recommender':
          await loadRecommenderDashboard();
          break;
        default:
          console.warn('Unknown account type:', accountType);
      }
    } catch (error) {
      console.error('❌ Error in dashboard loader:', error);
    }
  }

  // Auto-load dashboard when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboard);
  } else {
    loadDashboard();
  }

  // Listen for auth state changes and reload dashboard
  // Setup listener after dependencies are ready
  waitForDependencies().then(() => {
    if (window.FlowAuth && window.FlowAuth.on) {
      console.log('📡 Setting up auth state change listener for dashboard...');
      window.FlowAuth.on('authStateChanged', async (authState) => {
        console.log('📡 Dashboard loader received auth state change:', authState.isAuthenticated);
        if (authState.isAuthenticated && authState.profile) {
          console.log('🔄 Auth state changed with profile, reloading dashboard...');
          await loadDashboard();
        }
      });
    }
  });

  // Expose reload function with cache clearing
  window.reloadDashboard = async function() {
    console.log('🔄 Reloading dashboard and clearing cache...');

    // Clear data service cache
    if (window.DataService && window.DataService.clearCache) {
      window.DataService.clearCache();
    }

    // Reload the dashboard
    await loadDashboard();
  };

  console.log('📊 Dashboard Loader initialized');

})();
