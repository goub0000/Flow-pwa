// Student bundle - Student dashboard and functionality
import '../styles/dashboard.css';
import '../styles/students.css';

// Core utilities
import '@/js/firebase-config-secure';
import '@/js/input-validation';
import '@assets/js/firebase-auth';
import '@assets/js/firebase-api';

// Student-specific functionality
import '@assets/js/students-onboarding';

// Dashboard components
const loadDashboardComponents = async () => {
  const { default: ApplicationTracker } = await import('@/components/ApplicationTracker');
  const { default: DocumentManager } = await import('@/components/DocumentManager');
  const { default: MessageCenter } = await import('@/components/MessageCenter');

  // Initialize components
  if (document.getElementById('application-tracker')) {
    new ApplicationTracker('#application-tracker');
  }

  if (document.getElementById('document-manager')) {
    new DocumentManager('#document-manager');
  }

  if (document.getElementById('message-center')) {
    new MessageCenter('#message-center');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!window.FlowAuth.isAuthenticated()) {
    window.FlowAuth.redirectToLogin();
    return;
  }

  // Load dashboard components
  loadDashboardComponents();

  // Setup student-specific event listeners
  setupStudentEventListeners();
});

function setupStudentEventListeners() {
  // Application form submissions
  const applicationForms = document.querySelectorAll('.application-form');
  applicationForms.forEach(form => {
    form.addEventListener('submit', handleApplicationSubmit);
  });

  // Document uploads
  const uploadInputs = document.querySelectorAll('input[type="file"]');
  uploadInputs.forEach(input => {
    input.addEventListener('change', handleDocumentUpload);
  });

  // Real-time notifications
  setupNotificationListeners();
}

async function handleApplicationSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  try {
    // Validate form data
    const validation = window.FlowValidation.validateForm(
      Object.fromEntries(formData),
      getApplicationValidationRules()
    );

    if (!validation.isValid) {
      showFormErrors(validation.errors);
      return;
    }

    // Submit application
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await window.FlowAuth.getCurrentUser().getIdToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (response.ok) {
      showSuccess('Application submitted successfully!');
      form.reset();
    } else {
      throw new Error('Failed to submit application');
    }
  } catch (error) {
    console.error('Application submission error:', error);
    showError('Failed to submit application. Please try again.');
  }
}

async function handleDocumentUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file
  const validation = window.FlowValidation.validateFile(file);
  if (!validation.isValid) {
    showError(validation.error);
    e.target.value = '';
    return;
  }

  try {
    // Upload to Firebase Storage
    const uploadPath = `documents/${window.FlowAuth.getCurrentUser().uid}/${Date.now()}_${file.name}`;
    const result = await window.SecureFirebaseUtils.uploadFile(file, uploadPath);

    showSuccess('Document uploaded successfully!');

    // Update UI or save reference to Firestore
    updateDocumentList(result.downloadURL, file.name);
  } catch (error) {
    console.error('Upload error:', error);
    showError('Failed to upload document. Please try again.');
  }
}

function setupNotificationListeners() {
  if (!window.Firebase.messaging) return;

  window.Firebase.messaging.onMessage((payload) => {
    console.log('Message received:', payload);

    // Show notification
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png'
      });
    }
  });
}

function getApplicationValidationRules() {
  return {
    programId: [(value) => value ? { isValid: true } : { isValid: false, error: 'Program is required' }],
    personalStatement: [(value) => window.FlowValidation.validateText(value, {
      minLength: 100,
      maxLength: 5000,
      fieldName: 'Personal Statement'
    })],
    gpa: [(value) => {
      const gpaNum = parseFloat(value);
      return (gpaNum >= 0 && gpaNum <= 4.0)
        ? { isValid: true }
        : { isValid: false, error: 'GPA must be between 0.0 and 4.0' };
    }]
  };
}

function showFormErrors(errors) {
  // Implementation for showing validation errors
  console.error('Form validation errors:', errors);
}

function showSuccess(message) {
  if (window.toast) {
    window.toast.show(message, 'success');
  }
}

function showError(message) {
  if (window.toast) {
    window.toast.show(message, 'error');
  }
}

function updateDocumentList(url, fileName) {
  // Implementation for updating document list in UI
  console.log('Document uploaded:', { url, fileName });
}

console.log('🎓 Flow Student Bundle Loaded');