// Auth bundle - Authentication pages
import '../styles/auth.css';

// Core utilities
import '@/js/firebase-config-secure';
import '@/js/input-validation';
import '@assets/js/firebase-auth';

// Auth-specific functionality
import '@assets/js/auth-guards';

// Form validation setup
document.addEventListener('DOMContentLoaded', () => {
  // Setup real-time validation for auth forms
  const authForms = document.querySelectorAll('form[data-validate="true"]');
  authForms.forEach(form => {
    window.FlowValidation.setupRealTimeValidation(form);
  });

  // Password strength meter
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(setupPasswordStrengthMeter);
});

function setupPasswordStrengthMeter(passwordInput) {
  const strengthMeter = document.createElement('div');
  strengthMeter.className = 'password-strength-meter';
  strengthMeter.innerHTML = `
    <div class="strength-bar">
      <div class="strength-fill"></div>
    </div>
    <div class="strength-text">Password strength: <span class="strength-label">-</span></div>
  `;

  passwordInput.parentNode.appendChild(strengthMeter);

  passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    if (!password) {
      strengthMeter.style.display = 'none';
      return;
    }

    const validation = window.FlowValidation.validatePassword(password);
    const strength = validation.strength;

    strengthMeter.style.display = 'block';
    const fill = strengthMeter.querySelector('.strength-fill');
    const label = strengthMeter.querySelector('.strength-label');

    fill.style.width = `${(strength.level / 5) * 100}%`;
    fill.className = `strength-fill strength-${strength.level}`;
    label.textContent = strength.label;
  });
}

console.log('🔐 Flow Auth Bundle Loaded');