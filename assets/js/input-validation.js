// Input Validation and Sanitization Utility
// Comprehensive client-side validation and sanitization for security

/* eslint-env browser */

(function() {
  'use strict';

  // XSS Protection - Sanitize HTML content
  const sanitizeHTML = (str) => {
    if (typeof str !== 'string') return str;

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  };

  // SQL Injection Protection - Sanitize database queries
  const sanitizeSQL = (str) => {
    if (typeof str !== 'string') return str;

    return str
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '\\;') // Escape semicolons
      .replace(/--/g, '\\--') // Escape SQL comments
      .replace(/\/\*/g, '\\/*') // Escape block comments
      .replace(/\*\//g, '\\*/');
  };

  // Path Traversal Protection
  const sanitizePath = (path) => {
    if (typeof path !== 'string') return path;

    return path
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/^\//g, '') // Remove leading slash
      .replace(/\/$/g, ''); // Remove trailing slash
  };

  // Email validation with comprehensive checks
  const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    // Basic format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Length check
    if (email.length > 254) {
      return { isValid: false, error: 'Email address too long' };
    }

    // Local part length check
    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      return { isValid: false, error: 'Email local part too long' };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /on\w+\s*=/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(email)) {
        return { isValid: false, error: 'Invalid characters in email' };
      }
    }

    return { isValid: true, error: null };
  };

  // Password validation with security requirements
  const validatePassword = (password) => {
    const errors = [];

    if (!password || typeof password !== 'string') {
      return { isValid: false, errors: ['Password is required'] };
    }

    // Length requirements
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters');
    }

    // Character requirements
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Security checks
    const commonPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty',
      'abc123', 'password1', 'admin', 'letmein', 'welcome'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more secure password');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 repeated characters');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      strength: calculatePasswordStrength(password)
    };
  };

  // Calculate password strength score
  const calculatePasswordStrength = (password) => {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[@$!%*?&]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 1; // Other special chars

    // Pattern variety bonus
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated chars
    if (!/^(.{1,3})\1+$/.test(password)) score += 1; // No simple patterns

    // Normalize to 1-5 scale
    const strength = Math.min(Math.floor((score / 10) * 5) + 1, 5);

    const strengthLabels = {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Fair',
      4: 'Good',
      5: 'Strong'
    };

    return {
      score: score,
      level: strength,
      label: strengthLabels[strength]
    };
  };

  // Name validation (first name, last name)
  const validateName = (name, fieldName = 'Name') => {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: `${fieldName} is required` };
    }

    // Length check
    if (name.trim().length < 1) {
      return { isValid: false, error: `${fieldName} cannot be empty` };
    }

    if (name.length > 50) {
      return { isValid: false, error: `${fieldName} cannot exceed 50 characters` };
    }

    // Character validation
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: `${fieldName} contains invalid characters` };
    }

    // Security checks
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(name)) {
        return { isValid: false, error: `${fieldName} contains invalid content` };
      }
    }

    return { isValid: true, error: null };
  };

  // Phone number validation
  const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Remove formatting
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

    // Basic length check (7-15 digits)
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return { isValid: false, error: 'Phone number must be 7-15 digits' };
    }

    // Digits only
    if (!/^\d+$/.test(cleanPhone)) {
      return { isValid: false, error: 'Phone number must contain only digits' };
    }

    return { isValid: true, error: null };
  };

  // URL validation
  const validateURL = (url) => {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);

      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
      }

      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (dangerousProtocols.includes(urlObj.protocol)) {
        return { isValid: false, error: 'Invalid URL protocol' };
      }

      // Length check
      if (url.length > 2048) {
        return { isValid: false, error: 'URL too long' };
      }

      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  };

  // File validation
  const validateFile = (file, options = {}) => {
    const defaultOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      maxFiles: 5
    };

    const config = { ...defaultOptions, ...options };

    if (!file) {
      return { isValid: false, error: 'File is required' };
    }

    // Size validation
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      return { isValid: false, error: `File size cannot exceed ${maxSizeMB}MB` };
    }

    // Type validation
    if (!config.allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    // File name validation
    const safeName = sanitizePath(file.name);
    if (safeName !== file.name) {
      return { isValid: false, error: 'File name contains invalid characters' };
    }

    // Extension validation
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.txt', '.doc', '.docx'
    ];

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return { isValid: false, error: 'File extension not allowed' };
    }

    return { isValid: true, error: null };
  };

  // Date validation
  const validateDate = (dateString, fieldName = 'Date') => {
    if (!dateString) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
    }

    // Check reasonable date range
    const minYear = 1900;
    const maxYear = new Date().getFullYear() + 10;

    if (date.getFullYear() < minYear || date.getFullYear() > maxYear) {
      return { isValid: false, error: `${fieldName} must be between ${minYear} and ${maxYear}` };
    }

    return { isValid: true, error: null };
  };

  // Generic text validation
  const validateText = (text, options = {}) => {
    const defaultOptions = {
      required: true,
      minLength: 1,
      maxLength: 1000,
      allowHTML: false,
      fieldName: 'Text'
    };

    const config = { ...defaultOptions, ...options };

    if (config.required && (!text || typeof text !== 'string')) {
      return { isValid: false, error: `${config.fieldName} is required` };
    }

    if (!text) {
      return { isValid: true, error: null }; // Not required and empty
    }

    // Length validation
    if (text.length < config.minLength) {
      return { isValid: false, error: `${config.fieldName} must be at least ${config.minLength} characters` };
    }

    if (text.length > config.maxLength) {
      return { isValid: false, error: `${config.fieldName} cannot exceed ${config.maxLength} characters` };
    }

    // HTML validation
    if (!config.allowHTML) {
      const htmlRegex = /<[^>]*>/;
      if (htmlRegex.test(text)) {
        return { isValid: false, error: `${config.fieldName} cannot contain HTML tags` };
      }
    }

    // XSS validation
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i,
      /vbscript:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        return { isValid: false, error: `${config.fieldName} contains potentially dangerous content` };
      }
    }

    return { isValid: true, error: null };
  };

  // Form validation helper
  const validateForm = (formData, validationRules) => {
    const errors = {};
    let isValid = true;

    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const value = formData[fieldName];
      const fieldErrors = [];

      for (const rule of rules) {
        const result = rule(value);
        if (!result.isValid) {
          fieldErrors.push(result.error);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
      }
    }

    return {
      isValid,
      errors,
      hasErrors: Object.keys(errors).length > 0
    };
  };

  // Real-time validation setup
  const setupRealTimeValidation = (formElement) => {
    if (!formElement) return;

    const inputs = formElement.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      const validationRules = getValidationRulesForInput(input);

      if (validationRules.length > 0) {
        // Validate on blur
        input.addEventListener('blur', () => {
          validateInput(input, validationRules);
        });

        // Validate on input (debounced)
        let timeoutId;
        input.addEventListener('input', () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            validateInput(input, validationRules);
          }, 500);
        });
      }
    });

    // Validate on form submit
    formElement.addEventListener('submit', (e) => {
      if (!validateAllInputs(formElement)) {
        e.preventDefault();
      }
    });
  };

  // Get validation rules for an input element
  const getValidationRulesForInput = (input) => {
    const rules = [];
    const type = input.type;
    const required = input.required;

    switch (type) {
      case 'email':
        rules.push(validateEmail);
        break;
      case 'password':
        rules.push(validatePassword);
        break;
      case 'tel':
        if (required) rules.push(validatePhone);
        break;
      case 'url':
        if (required) rules.push(validateURL);
        break;
      case 'date':
        if (required) rules.push((value) => validateDate(value, input.name || 'Date'));
        break;
      default:
        if (input.classList.contains('validate-name')) {
          rules.push((value) => validateName(value, input.name || 'Name'));
        } else if (required || input.value) {
          rules.push((value) => validateText(value, {
            required: required,
            maxLength: input.maxLength || 1000,
            fieldName: input.name || 'Field'
          }));
        }
    }

    return rules;
  };

  // Validate individual input
  const validateInput = (input, rules) => {
    const value = input.value;
    const errorContainer = input.parentNode.querySelector('.validation-error');

    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        showValidationError(input, result.error, errorContainer);
        return false;
      }
    }

    clearValidationError(input, errorContainer);
    return true;
  };

  // Validate all inputs in form
  const validateAllInputs = (formElement) => {
    const inputs = formElement.querySelectorAll('input, textarea, select');
    let allValid = true;

    inputs.forEach(input => {
      const rules = getValidationRulesForInput(input);
      if (rules.length > 0 && !validateInput(input, rules)) {
        allValid = false;
      }
    });

    return allValid;
  };

  // Show validation error
  const showValidationError = (input, errorMessage, errorContainer) => {
    input.classList.add('validation-error');
    input.setAttribute('aria-invalid', 'true');

    if (errorContainer) {
      errorContainer.textContent = errorMessage;
      errorContainer.style.display = 'block';
    } else {
      // Create error element if it doesn't exist
      const errorElement = document.createElement('div');
      errorElement.className = 'validation-error text-red-500 text-sm mt-1';
      errorElement.textContent = errorMessage;
      errorElement.setAttribute('role', 'alert');
      input.parentNode.appendChild(errorElement);
    }
  };

  // Clear validation error
  const clearValidationError = (input, errorContainer) => {
    input.classList.remove('validation-error');
    input.removeAttribute('aria-invalid');

    if (errorContainer) {
      errorContainer.style.display = 'none';
      errorContainer.textContent = '';
    }
  };

  // Export validation utilities
  window.FlowValidation = {
    // Sanitization
    sanitizeHTML,
    sanitizeSQL,
    sanitizePath,

    // Validation functions
    validateEmail,
    validatePassword,
    validateName,
    validatePhone,
    validateURL,
    validateFile,
    validateDate,
    validateText,

    // Form validation
    validateForm,
    setupRealTimeValidation,

    // Password utilities
    calculatePasswordStrength,

    // Utilities
    showValidationError,
    clearValidationError
  };

  console.log('🛡️ Input validation and sanitization module loaded');

})();