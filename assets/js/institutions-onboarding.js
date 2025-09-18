/*
 * Flow Institution Onboarding JavaScript (Upgraded)
 * - i18n (EN/FR/AR/SW) for validation + microcopy
 * - Arabic RTL handling
 * - Multiple-file verification upload (institutions: no count limit)
 * - A11y + minor UX polish
 */

(() => {
  'use strict';
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  // Namespace + store + i18n
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || {
    get(k, d=null){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch(_){ return d; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); } catch(_){} }
  };
  Flow.i18n = Flow.i18n || {
    lang: Flow.store.get('flow.lang', 'en'),
    dirFor(l){ return l === 'ar' ? 'rtl' : 'ltr'; },
    dict: {
      en: {
        err_email: 'Please enter a valid email address',
        err_pwd_len: 'at least 12 characters',
        err_pwd_num: 'a number',
        err_pwd_sym: 'a symbol',
        err_pwd_nomatch: 'Passwords do not match',
        err_file_big: 'File size must be less than 10MB',
        err_file_type: 'Please upload a PDF or image file',
        upload_ok: 'Upload successful',
        step_names: ['Welcome','Account','Verify','Profile','Programs','Team','Review']
      },
      fr: {
        err_email: 'Veuillez saisir une adresse e-mail valide',
        err_pwd_len: 'au moins 12 caractères',
        err_pwd_num: 'un chiffre',
        err_pwd_sym: 'un symbole',
        err_pwd_nomatch: 'Les mots de passe ne correspondent pas',
        err_file_big: 'La taille du fichier doit être inférieure à 10 Mo',
        err_file_type: 'Veuillez importer un fichier PDF ou image',
        upload_ok: 'Téléversement réussi',
        step_names: ['Bienvenue','Compte','Vérification','Profil','Programmes','Équipe','Revue']
      },
      ar: {
        err_email: 'يرجى إدخال بريد إلكتروني صالح',
        err_pwd_len: '12 حرفًا على الأقل',
        err_pwd_num: 'رقمًا واحدًا',
        err_pwd_sym: 'رمزًا',
        err_pwd_nomatch: 'كلمات المرور غير متطابقة',
        err_file_big: 'يجب أن يكون حجم الملف أقل من 10 ميغابايت',
        err_file_type: 'يرجى رفع ملف PDF أو صورة',
        upload_ok: 'تم الرفع بنجاح',
        step_names: ['الترحيب','الحساب','التحقق','الملف','البرامج','الفريق','المراجعة']
      },
      sw: {
        err_email: 'Tafadhali weka barua pepe sahihi',
        err_pwd_len: 'angalau herufi 12',
        err_pwd_num: 'nambari',
        err_pwd_sym: 'alama ya kipekee',
        err_pwd_nomatch: 'Nywila hazilingani',
        err_file_big: 'Kubwa kuliko 10MB hairuhusiwi',
        err_file_type: 'Tafadhali pakia PDF au picha',
        upload_ok: 'Upakiaji umefanikiwa',
        step_names: ['Karibu','Akaunti','Uthibitisho','Wasifu','Programu','Timu','Mapitio']
      }
    },
    t(k){ const l=this.lang in this.dict?this.lang:'en'; return this.dict[l][k]; },
    stepName(i){ const l=this.lang in this.dict?this.lang:'en'; return this.dict[l].step_names[i] || ''; },
    set(lang){ this.lang=lang; Flow.store.set('flow.lang', lang); document.documentElement.lang=lang; document.documentElement.dir=this.dirFor(lang); }
  };

  // Onboarding state
  let currentStep = 1;
  const totalSteps = 7;
  const onboardingData = {
    method: 'email',
    email: '',
    phone: '',
    documents: []
  };

  // Initialise when DOM ready
  function init() {
    setYear();
    initLang();
    stepNavigation.init();
    welcomeStep.init();
    accountStep.init();
    verifyStep.init();
    profileStep.init();
    programsStep.init();
    teamStep.init();
    reviewStep.init();
    console.log('Institution onboarding JS initialised');
  }

  // Set current year in footer
  function setYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // Language selector (if present globally)
  function initLang() {
    const select = $('#lang');
    if (!select) return;
    const saved = Flow.store.get('flow.lang', 'en');
    select.value = saved;
    Flow.i18n.set(saved);
    select.addEventListener('change', e => Flow.i18n.set(e.target.value));
  }

  /* Step navigation logic */
  const stepNavigation = {
    init() {
      this.showStep(currentStep);
      this.updateProgress();
    },
    showStep(step) {
      $$('.onboarding-step').forEach(stepEl => stepEl.classList.remove('onboarding-step--active'));
      const active = $(`.onboarding-step[data-step="${step}"]`);
      if (active) active.classList.add('onboarding-step--active');
      currentStep = step;
      this.updateProgress();
      this.updateStepper();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    updateProgress() {
      const percentage = (currentStep / totalSteps) * 100;
      const headerFill = $('.header-progress__fill');
      const headerStep = $('.header-progress__step');
      if (headerFill) headerFill.style.width = `${percentage}%`;
      if (headerStep) headerStep.textContent = `Step ${currentStep} of ${totalSteps}`;
      const stepperFill = $('.stepper-progress__fill');
      const stepperText = $('.stepper-progress__text');
      if (stepperFill) stepperFill.style.width = `${percentage}%`;
      if (stepperText) stepperText.textContent = `Step ${currentStep} of ${totalSteps} • ${Flow.i18n.stepName(currentStep-1)}`;
    },
    updateStepper() {
      $$('.stepper__item').forEach((item, idx) => {
        const number = idx + 1;
        item.classList.remove('stepper__item--current', 'stepper__item--completed');
        if (number === currentStep) item.classList.add('stepper__item--current');
        else if (number < currentStep) item.classList.add('stepper__item--completed');
      });
      const stepper = $('.stepper');
      if (stepper) stepper.setAttribute('aria-valuenow', String(currentStep));
    },
    nextStep() { if (currentStep < totalSteps) this.showStep(currentStep + 1); },
    prevStep() { if (currentStep > 1) this.showStep(currentStep - 1); }
  };

  /* Form validation helpers */
  const validation = {
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    validatePassword(password) {
      const hasLen = password.length >= 12;
      const hasNum = /\d/.test(password);
      const hasSym = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      return { isValid: hasLen && hasNum && hasSym, hasLen, hasNum, hasSym };
    },
    showError(fieldId, message) {
      const err = $(`#${fieldId}-error`);
      const field = $(`#${fieldId}`);
      if (err) { err.textContent = message; err.style.display = 'block'; }
      if (field) {
        field.classList.add('form-input--error');
        field.setAttribute('aria-invalid', 'true');
      }
    },
    clearError(fieldId) {
      const err = $(`#${fieldId}-error`);
      const field = $(`#${fieldId}`);
      if (err) { err.textContent = ''; err.style.display = 'none'; }
      if (field) {
        field.classList.remove('form-input--error');
        field.setAttribute('aria-invalid', 'false');
      }
    }
  };

  /* Step 1: Welcome */
  const welcomeStep = {
    init() {
      const startBtn = $('#startOnboarding');
      startBtn?.addEventListener('click', () => stepNavigation.nextStep());
    }
  };

  /* Step 2: Account creation */
  const accountStep = {
    init() {
      this.methodSwitcher();
      this.passwordToggle();
      this.formListeners();
      this.navListeners();
    },
    methodSwitcher() {
      $$('.method-switch').forEach(btn => {
        btn.addEventListener('click', () => {
          const method = btn.getAttribute('data-method');
          onboardingData.method = method;
          $$('.method-switch').forEach(b => b.classList.toggle('method-switch--active', b === btn));
          $$('.account-option').forEach(opt => {
            opt.classList.toggle('account-option--active', opt.getAttribute('data-method') === method);
          });
          this.updateCreateButton();
        });
      });
    },
    passwordToggle() {
      const pwdInput = $('#password');
      const toggle = $('.password-toggle');
      if (pwdInput && toggle) {
        toggle.addEventListener('click', () => {
          const isPwd = pwdInput.type === 'password';
          pwdInput.type = isPwd ? 'text' : 'password';
          const showIcon = $('.password-toggle__show', toggle);
          const hideIcon = $('.password-toggle__hide', toggle);
          if (showIcon && hideIcon) {
            showIcon.style.display = isPwd ? 'none' : 'block';
            hideIcon.style.display = isPwd ? 'block' : 'none';
          }
          toggle.setAttribute('aria-label', isPwd ? 'Hide password' : 'Show password');
        });
      }
    },
    formListeners() {
      const emailField = $('#institutionEmail');
      const pwdField = $('#password');
      const confirmField = $('#confirmPassword');
      const terms = $('#agreeTerms');
      const phoneField = $('#phoneNumber');
      const phoneTerms = $('#agreeTermsPhone');

      emailField?.addEventListener('input', e => {
        const email = e.target.value.trim();
        validation.clearError('institutionEmail');
        if (email && !validation.validateEmail(email)) {
          validation.showError('institutionEmail', Flow.i18n.t('err_email'));
        } else {
          onboardingData.email = email;
        }
        this.updateCreateButton();
      });

      pwdField?.addEventListener('input', e => {
        const pwd = e.target.value;
        const res = validation.validatePassword(pwd);
        validation.clearError('password');
        if (pwd && !res.isValid) {
          const msgs = [];
          if (!res.hasLen) msgs.push(Flow.i18n.t('err_pwd_len'));
          if (!res.hasNum) msgs.push(Flow.i18n.t('err_pwd_num'));
          if (!res.hasSym) msgs.push(Flow.i18n.t('err_pwd_sym'));
          validation.showError('password', 'Password must have ' + msgs.join(', '));
        }
        this.updateCreateButton();
      });

      confirmField?.addEventListener('input', e => {
        const confirm = e.target.value;
        const pwd = pwdField?.value;
        validation.clearError('confirmPassword');
        if (confirm && pwd && confirm !== pwd) {
          validation.showError('confirmPassword', Flow.i18n.t('err_pwd_nomatch'));
        }
        this.updateCreateButton();
      });

      terms?.addEventListener('change', () => { validation.clearError('agreeTerms'); this.updateCreateButton(); });
      phoneField?.addEventListener('input', e => { onboardingData.phone = e.target.value.trim(); this.updateCreateButton(); });
      phoneTerms?.addEventListener('change', () => { validation.clearError('agreeTermsPhone'); this.updateCreateButton(); });
    },
    navListeners() {
      const backBtn = $('#backToWelcome');
      const createBtn = $('#createAccount');
      backBtn?.addEventListener('click', () => stepNavigation.prevStep());
      if (createBtn) {
        createBtn.addEventListener('click', () => {
          if (!this.isValid()) return;
          createBtn.classList.add('btn--loading');
          setTimeout(() => {
            createBtn.classList.remove('btn--loading');
            this.updateVerificationTarget();
            stepNavigation.nextStep();
          }, 800);
        });
      }
    },
    updateVerificationTarget() {
      const target = $('#verificationTarget');
      const subtitle = $('#verifySubtitle');
      if (onboardingData.method === 'email') {
          if (target) target.textContent = onboardingData.email || 'your email';
          if (subtitle) subtitle.innerHTML = `We've sent a verification code to <strong>${onboardingData.email}</strong>`;
      } else {
          if (target) target.textContent = onboardingData.phone || 'your phone';
          if (subtitle) subtitle.innerHTML = `We've sent a verification code to <strong>${onboardingData.phone}</strong>`;
      }
    },
    isValid() {
      if (onboardingData.method === 'email') {
        const email = $('#institutionEmail')?.value?.trim();
        const password = $('#password')?.value;
        const confirm = $('#confirmPassword')?.value;
        const terms = $('#agreeTerms')?.checked;
        return email && validation.validateEmail(email) && password && validation.validatePassword(password).isValid && confirm && password === confirm && terms;
      } else {
        const phone = $('#phoneNumber')?.value?.trim();
        const phoneTerms = $('#agreeTermsPhone')?.checked;
        return phone && phoneTerms;
      }
    },
    updateCreateButton() {
      const btn = $('#createAccount');
      if (btn) btn.disabled = !this.isValid();
    }
  };

  /* Step 3: Enhanced Verification */
  const verifyStep = {
    resendTimer: 60,
    resendInterval: null,
    files: [],
    verificationState: {
      accountVerified: false,
      institutionVerified: false,
      securityVerified: false
    },
    selectedTier: null,
    cameraStream: null,
    init() {
      this.initOTP();
      this.initAdvancedVerification();
      this.initUpload();
      this.initCameraScanner();
      this.initSecurityChecks();
      this.initNav();
      this.startResendTimer();
      this.updateVerificationButton();
    },
    
    // Advanced verification tier selection
    initAdvancedVerification() {
      const tierOptions = $$('input[name="verificationTier"]');
      tierOptions.forEach(option => {
        option.addEventListener('change', (e) => {
          this.selectedTier = e.target.value;
          this.showVerificationRequirements(e.target.value);
          this.showDocumentVerificationSystem();
        });
      });
    },

    showVerificationRequirements(tier) {
      const requirementsDiv = $('#verificationRequirements');
      if (!requirementsDiv) return;

      const requirements = {
        premium: {
          title: 'Premium Verification Requirements',
          items: [
            'Official accreditation certificate (digitally signed preferred)',
            'Government registration documents',
            'Latest financial audit reports',
            'Board resolution authorizing Flow platform registration',
            'Domain ownership verification (automatic)',
            'Real-time database verification (automatic)'
          ]
        },
        standard: {
          title: 'Standard Verification Requirements', 
          items: [
            'Official accreditation certificate',
            'Government registration documents',
            'Institution logo and branding materials',
            'Contact verification documents',
            'Email domain verification (automatic)'
          ]
        },
        express: {
          title: 'Express Verification Requirements',
          items: [
            'Basic accreditation certificate',
            'Government registration certificate',
            'Contact verification',
            'Phone verification (automatic)'
          ]
        }
      };

      const req = requirements[tier];
      requirementsDiv.innerHTML = `
        <div class="verification-requirements-card">
          <h5>${req.title}</h5>
          <ul class="requirements-list">
            ${req.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
          <div class="requirements-note">
            <p><strong>Note:</strong> All documents will be processed using advanced AI verification and blockchain authentication.</p>
          </div>
        </div>
      `;
      requirementsDiv.style.display = 'block';
    },

    showDocumentVerificationSystem() {
      const docSystem = $('#documentVerificationSystem');
      if (docSystem) {
        docSystem.style.display = 'block';
      }
    },

    // Camera scanner functionality
    initCameraScanner() {
      const openBtn = $('#openCameraScanner');
      const closeBtn = $('#closeCameraScanner');
      const modal = $('#cameraScannerModal');
      const captureBtn = $('#captureDocument');
      const switchBtn = $('#switchCamera');
      
      let currentCamera = 0;
      let cameras = [];

      openBtn?.addEventListener('click', async () => {
        try {
          await this.startCamera();
          modal.style.display = 'flex';
        } catch (error) {
          console.error('Camera access denied:', error);
          this.showNotification('Camera access required for document scanning', 'error');
        }
      });

      closeBtn?.addEventListener('click', () => {
        this.stopCamera();
        modal.style.display = 'none';
      });

      captureBtn?.addEventListener('click', () => {
        this.captureDocument();
      });

      switchBtn?.addEventListener('click', async () => {
        currentCamera = (currentCamera + 1) % cameras.length;
        await this.switchCamera(cameras[currentCamera]);
      });

      // Get available cameras
      this.getCameras().then(cams => {
        cameras = cams;
        if (cameras.length > 1) {
          switchBtn.style.display = 'block';
        }
      });
    },

    async getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
      } catch (error) {
        console.error('Error getting cameras:', error);
        return [];
      }
    },

    async startCamera() {
      const video = $('#scannerVideo');
      if (!video) return;

      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment' // Use back camera if available
          }
        });
        video.srcObject = this.cameraStream;
      } catch (error) {
        throw error;
      }
    },

    async switchCamera(camera) {
      this.stopCamera();
      const video = $('#scannerVideo');
      
      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: camera.deviceId,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        video.srcObject = this.cameraStream;
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    },

    stopCamera() {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }
    },

    captureDocument() {
      const video = $('#scannerVideo');
      const canvas = $('#scannerCanvas');
      const modal = $('#cameraScannerModal');
      
      if (!video || !canvas) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob and process
      canvas.toBlob((blob) => {
        const fileName = `scanned-document-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        
        this.stopCamera();
        modal.style.display = 'none';
        
        // Process the captured document
        this.processDocument(file);
      }, 'image/jpeg', 0.9);
    },

    // Enhanced document processing
    async processDocument(file) {
      this.showProcessingDisplay();
      
      try {
        // Simulate AI processing steps
        await this.simulateProcessingSteps();
        
        // Simulate document analysis
        const analysisResult = await this.analyzeDocument(file);
        
        this.hideProcessingDisplay();
        this.showDocumentAnalysis(analysisResult);
        
        // Add to files array
        this.files.push({
          name: file.name,
          size: this.formatFileSize(file.size),
          confidence: analysisResult.confidence,
          data: analysisResult
        });
        
        this.updateVerificationButton();
      } catch (error) {
        console.error('Document processing failed:', error);
        this.hideProcessingDisplay();
        this.showNotification('Document processing failed. Please try again.', 'error');
      }
    },

    showProcessingDisplay() {
      const display = $('#processingDisplay');
      const uploadArea = $('#advancedUploadArea');
      
      if (display) display.style.display = 'block';
      if (uploadArea) uploadArea.style.display = 'none';
    },

    hideProcessingDisplay() {
      const display = $('#processingDisplay');
      const uploadArea = $('#advancedUploadArea');
      
      if (display) display.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'block';
    },

    async simulateProcessingSteps() {
      const steps = ['scan', 'ocr', 'validate', 'verify'];
      
      for (let i = 0; i < steps.length; i++) {
        const stepElements = $$('.processing-step');
        
        // Update current step
        stepElements.forEach((el, index) => {
          el.classList.remove('processing-step--active', 'processing-step--completed');
          if (index < i) {
            el.classList.add('processing-step--completed');
          } else if (index === i) {
            el.classList.add('processing-step--active');
          }
        });
        
        // Wait for step completion
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      }
      
      // Mark all steps as completed
      $$('.processing-step').forEach(el => {
        el.classList.remove('processing-step--active');
        el.classList.add('processing-step--completed');
      });
    },

    async analyzeDocument(file) {
      // Simulate AI document analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate realistic analysis results
      const confidence = 85 + Math.random() * 10; // 85-95%
      const documentType = this.detectDocumentType(file.name);
      
      return {
        confidence: Math.round(confidence),
        type: documentType,
        extractedData: this.generateExtractedData(documentType),
        flags: this.generateVerificationFlags(confidence)
      };
    },

    detectDocumentType(filename) {
      const types = [
        'Accreditation Certificate',
        'Government Registration',
        'Business License',
        'Tax Registration',
        'Educational License'
      ];
      return types[Math.floor(Math.random() * types.length)];
    },

    generateExtractedData(type) {
      const templates = {
        'Accreditation Certificate': {
          'Institution Name': 'University of Excellence',
          'Accreditation Body': 'National Education Authority',
          'Valid Until': '2025-12-31',
          'Registration ID': 'ACC-2024-001234'
        },
        'Government Registration': {
          'Business Name': 'University of Excellence Ltd.',
          'Registration Number': 'REG-789456123',
          'Date Issued': '2020-03-15',
          'Status': 'Active'
        }
      };
      return templates[type] || templates['Accreditation Certificate'];
    },

    generateVerificationFlags(confidence) {
      const flags = [];
      
      if (confidence < 90) {
        flags.push({
          type: 'warning',
          message: 'Document quality could be improved for better verification'
        });
      }
      
      if (Math.random() < 0.1) {
        flags.push({
          type: 'info',
          message: 'Cross-reference verification recommended'
        });
      }
      
      return flags;
    },

    showDocumentAnalysis(result) {
      const analysisDiv = $('#documentAnalysis');
      if (!analysisDiv) return;
      
      const confidenceFill = $('#confidenceFill');
      const confidenceValue = $('#confidenceValue');
      const extractedData = $('#extractedData');
      const verificationFlags = $('#verificationFlags');
      
      // Update confidence meter
      if (confidenceFill && confidenceValue) {
        setTimeout(() => {
          confidenceFill.style.width = `${result.confidence}%`;
          confidenceValue.textContent = `${result.confidence}%`;
        }, 100);
      }
      
      // Show extracted data
      if (extractedData) {
        let dataHTML = '<div class="extracted-data-grid">';
        Object.entries(result.extractedData).forEach(([key, value]) => {
          dataHTML += `
            <div class="data-item">
              <span class="data-label">${key}:</span>
              <span class="data-value">${value}</span>
            </div>
          `;
        });
        dataHTML += '</div>';
        extractedData.innerHTML = dataHTML;
      }
      
      // Show verification flags
      if (verificationFlags && result.flags.length > 0) {
        let flagsHTML = '<div class="flags-list">';
        result.flags.forEach(flag => {
          flagsHTML += `
            <div class="verification-flag verification-flag--${flag.type}">
              <span class="flag-icon">${flag.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <span class="flag-message">${flag.message}</span>
            </div>
          `;
        });
        flagsHTML += '</div>';
        verificationFlags.innerHTML = flagsHTML;
      }
      
      analysisDiv.style.display = 'block';
    },
    initOTP() {
      const inputs = $$('.otp-input');
      inputs.forEach((input, idx) => {
        input.addEventListener('input', e => {
          const val = e.target.value;
          if (!/^\d*$/.test(val)) { e.target.value = ''; return; }
          if (val && idx < inputs.length - 1) inputs[idx + 1].focus();
          this.updateVerificationButton();
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Backspace' && !e.target.value && idx > 0) inputs[idx - 1].focus();
        });
        input.addEventListener('paste', e => {
          e.preventDefault();
          const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
          text.split('').forEach((digit, i) => { if (inputs[i]) inputs[i].value = digit; });
          this.updateVerificationButton();
        });
      });
    },
    initUpload() {
      const fileInput = $('#verificationDocument');
      const uploadArea = $('#fileUploadArea');
      const list = $('#verificationList'); // optional <ul id="verificationList">
      if (!fileInput || !uploadArea) return;

      const handleMany = (fileList) => {
        Array.from(fileList).forEach(f => this.handleFile(f, list, uploadArea));
      };

      uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('file-upload-area--dragover'); });
      uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('file-upload-area--dragover'));
      uploadArea.addEventListener('drop', e => { e.preventDefault(); uploadArea.classList.remove('file-upload-area--dragover'); if (e.dataTransfer.files.length) handleMany(e.dataTransfer.files); });
      fileInput.addEventListener('change', e => { if (e.target.files.length) handleMany(e.target.files); });
    },
    handleFile(file, list, area) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) { validation.showError('document', Flow.i18n.t('err_file_big')); return; }
      const allowed = ['application/pdf','image/jpeg','image/png','image/jpg'];
      if (!allowed.includes(file.type)) { validation.showError('document', Flow.i18n.t('err_file_type')); return; }
      validation.clearError('document');

      this.showProgress();
      // Simulate upload
      setTimeout(() => {
        this.hideProgress();
        this.files.push(file.name);
        if (area) {
          area.classList.add('file-upload-area--success');
          const prim = $('.file-upload-primary', area);
          const sec = $('.file-upload-secondary', area);
          if (prim) prim.textContent = `✓ ${file.name}`;
          if (sec) sec.textContent = Flow.i18n.t('upload_ok');
        }
        if (list) {
          const li = document.createElement('li');
          li.textContent = file.name;
          list.appendChild(li);
        }
        this.updateVerificationButton();
      }, 700);
    },
    showProgress() {
      const progress = $('.file-upload-progress');
      const label = $('.file-upload-label');
      if (progress && label) { progress.style.display = 'block'; label.style.display = 'none'; }
    },
    hideProgress() {
      const progress = $('.file-upload-progress');
      const label = $('.file-upload-label');
      if (progress && label) { progress.style.display = 'none'; label.style.display = 'flex'; }
    },
    updateVerificationButton() {
      const btn = $('#completeVerification');
      if (!btn) return;
      const otpComplete = this.isOTPComplete();
      const docUploaded = this.files.length > 0 || $('#fileUploadArea')?.classList.contains('file-upload-area--success');
      const docTypeSelected = $('input[name="documentType"]:checked');
      btn.disabled = !(otpComplete && docUploaded && docTypeSelected);
      const verifyBtn = $('#verifyCode');
      if (verifyBtn) verifyBtn.disabled = !otpComplete;
    },
    isOTPComplete() {
      const inputs = $$('.otp-input');
      const code = inputs.map(i => i.value).join('');
      return code.length === 6 && /^\d{6}$/.test(code);
    },
    startResendTimer() {
      const resendBtn = $('#resendCode');
      const timer = $('#resendTimer');
      if (!resendBtn || !timer) return;
      resendBtn.disabled = true;
      this.resendTimer = 60;
      timer.textContent = `(60s)`;
      clearInterval(this.resendInterval);
      this.resendInterval = setInterval(() => {
        this.resendTimer--;
        timer.textContent = `(${this.resendTimer}s)`;
        if (this.resendTimer <= 0) {
          clearInterval(this.resendInterval);
          resendBtn.disabled = false;
          timer.textContent = '';
        }
      }, 1000);
    },
    initNav() {
      const back = $('#backToAccount');
      const complete = $('#completeVerification');
      const resend = $('#resendCode');
      const verifyBtn = $('#verifyCode');
      back?.addEventListener('click', () => stepNavigation.prevStep());
      complete?.addEventListener('click', () => {
        if (complete.disabled) return;
        complete.classList.add('btn--loading');
        setTimeout(() => {
          complete.classList.remove('btn--loading');
          stepNavigation.nextStep();
        }, 700);
      });
      verifyBtn?.addEventListener('click', () => {
        if (this.isOTPComplete()) {
          verifyBtn.classList.add('btn--loading');
          setTimeout(() => {
            verifyBtn.classList.remove('btn--loading');
            stepNavigation.nextStep();
          }, 500);
        }
      });
      resend?.addEventListener('click', () => this.startResendTimer());
      $$('input[name="documentType"]').forEach(radio => radio.addEventListener('change', () => this.updateVerificationButton()));
    },

    // New methods for advanced verification
    addFileToList(fileData, container) {
      const fileItem = document.createElement('div');
      fileItem.className = 'uploaded-file-item';
      fileItem.innerHTML = `
        <div class="uploaded-file-info">
          <div class="uploaded-file-icon">
            <svg width="16" height="16" fill="currentColor">
              <path d="M5.5 0A1.5 1.5 0 0 0 4 1.5v1A1.5 1.5 0 0 0 5.5 4h5A1.5 1.5 0 0 0 12 2.5v-1A1.5 1.5 0 0 0 10.5 0h-5z"/>
            </svg>
          </div>
          <div class="uploaded-file-details">
            <div class="uploaded-file-name">${fileData.name}</div>
            <div class="uploaded-file-size">${fileData.size}</div>
          </div>
        </div>
        <button type="button" class="uploaded-file-remove" aria-label="Remove file">
          <svg width="14" height="14" fill="currentColor">
            <path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z"/>
          </svg>
        </button>
      `;
      
      const removeBtn = fileItem.querySelector('.uploaded-file-remove');
      removeBtn.addEventListener('click', () => {
        this.removeFile(fileData.name, fileItem);
      });
      
      container.appendChild(fileItem);
    },

    removeFile(fileName, element) {
      this.files = this.files.filter(f => f.name !== fileName);
      element.remove();
      
      // Update upload area if no files left
      if (this.files.length === 0) {
        const area = $('#fileUploadArea');
        if (area) {
          area.classList.remove('file-upload-area--success');
          const prim = $('.file-upload-primary', area);
          const sec = $('.file-upload-secondary', area);
          if (prim) prim.textContent = 'Click to upload or drag and drop';
          if (sec) sec.textContent = 'PDF or image files (max 10MB each) • Multiple files supported';
        }
      } else {
        // Update file count
        const area = $('#fileUploadArea');
        if (area) {
          const prim = $('.file-upload-primary', area);
          if (prim) prim.textContent = `✓ ${this.files.length} file(s) uploaded`;
        }
      }
      
      this.updateVerificationButton();
      this.updateVerificationProgress();
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    initDomainVerification() {
      const copyBtn = $('#copyDnsRecord');
      const verifyBtn = $('#verifyDomainBtn');
      const dnsRecord = $('#dnsRecordValue');
      
      // Generate random DNS verification code
      if (dnsRecord) {
        const code = 'flow-verify=' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        dnsRecord.textContent = code;
      }
      
      copyBtn?.addEventListener('click', async () => {
        try {
          const text = dnsRecord?.textContent || '';
          await navigator.clipboard.writeText(text);
          copyBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            Copied!
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="16" height="16" fill="currentColor">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              </svg>
              Copy
            `;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy DNS record:', err);
        }
      });
      
      verifyBtn?.addEventListener('click', () => {
        verifyBtn.classList.add('btn--loading');
        // Simulate DNS verification
        setTimeout(() => {
          verifyBtn.classList.remove('btn--loading');
          this.completeInstitutionVerification();
        }, 2000);
      });
    },

    toggleDomainVerification(show) {
      const panel = $('#domainVerificationPanel');
      const uploadArea = $('#fileUploadArea');
      if (panel && uploadArea) {
        panel.style.display = show ? 'block' : 'none';
        uploadArea.style.display = show ? 'none' : 'block';
      }
    },

    // Advanced Security Checks
    initSecurityChecks() {
      const startBtn = $('#startSecurityCheck');
      startBtn?.addEventListener('click', () => {
        if (startBtn.disabled) return;
        this.runAdvancedSecurityChecks();
      });
    },

    async runAdvancedSecurityChecks() {
      // Initialize security dashboard
      this.initSecurityDashboard();
      
      // Run different security modules concurrently
      const securityModules = [
        this.runBehavioralAnalysis(),
        this.runBlockchainVerification(), 
        this.runWebReconnaissance(),
        this.runThreatIntelligence()
      ];

      try {
        await Promise.all(securityModules);
        this.completeSecurityVerification();
      } catch (error) {
        console.error('Security verification failed:', error);
        this.handleSecurityFailure();
      }
    },

    initSecurityDashboard() {
      const scoreElement = $('#securityScore');
      if (scoreElement) {
        scoreElement.textContent = '0';
      }
      
      // Reset all scores
      ['docAuthScore', 'digitalFootprintScore', 'networkReputationScore'].forEach(id => {
        const element = $(`#${id}`);
        if (element) element.style.width = '0%';
      });
      
      // Show monitoring status
      this.addMonitoringEvent('Security analysis initiated', 'info');
    },

    async runBehavioralAnalysis() {
      const statusElement = $('#behavioralAnalysisStatus');
      const checkItems = $$('#behavioralAnalysisStatus').closest('.security-check-card')?.querySelectorAll('.check-list li');
      
      this.updateSecurityStatus(statusElement, 'running', 'Analyzing behavioral patterns...');
      
      // Simulate checking individual items
      if (checkItems) {
        for (let i = 0; i < checkItems.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
          checkItems[i].setAttribute('data-status', Math.random() > 0.1 ? 'completed' : 'failed');
          
          if (i === 0) this.addMonitoringEvent('Registration patterns analyzed', 'success');
          if (i === 1) this.addMonitoringEvent('Document consistency verified', 'success');
          if (i === 2) this.addMonitoringEvent('Behavioral risk score calculated', 'info');
          if (i === 3) this.addMonitoringEvent('Anomaly detection completed', 'success');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.updateSecurityStatus(statusElement, 'completed', 'Analysis Complete');
      this.updateSecurityScore('docAuthScore', 92);
    },

    async runBlockchainVerification() {
      const statusElement = $('#blockchainVerificationStatus');
      const checkItems = $$('#blockchainVerificationStatus').closest('.security-check-card')?.querySelectorAll('.check-list li');
      
      this.updateSecurityStatus(statusElement, 'running', 'Verifying on blockchain...');
      
      if (checkItems) {
        for (let i = 0; i < checkItems.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
          checkItems[i].setAttribute('data-status', Math.random() > 0.05 ? 'completed' : 'failed');
          
          if (i === 0) this.addMonitoringEvent('Credential hash verified', 'success');
          if (i === 1) this.addMonitoringEvent('Institution registry lookup complete', 'success');
          if (i === 2) this.addMonitoringEvent('Accreditation chain validated', 'success');
          if (i === 3) this.addMonitoringEvent('Tampering detection complete', 'success');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.updateSecurityStatus(statusElement, 'completed', 'Blockchain Verified');
      this.updateSecurityScore('digitalFootprintScore', 88);
    },

    async runWebReconnaissance() {
      const statusElement = $('#webReconnaissanceStatus');
      const checkItems = $$('#webReconnaissanceStatus').closest('.security-check-card')?.querySelectorAll('.check-list li');
      
      this.updateSecurityStatus(statusElement, 'running', 'Scanning digital footprint...');
      
      if (checkItems) {
        for (let i = 0; i < checkItems.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 600));
          checkItems[i].setAttribute('data-status', Math.random() > 0.15 ? 'completed' : 'failed');
          
          if (i === 0) this.addMonitoringEvent('Domain history analyzed', 'success');
          if (i === 1) this.addMonitoringEvent('Social presence validated', 'info');
          if (i === 2) this.addMonitoringEvent('Academic networks verified', 'success');
          if (i === 3) this.addMonitoringEvent('Reputation score calculated', 'success');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      this.updateSecurityStatus(statusElement, 'completed', 'Reconnaissance Complete');
      this.updateSecurityScore('networkReputationScore', 95);
    },

    async runThreatIntelligence() {
      const statusElement = $('#threatIntelligenceStatus');
      const checkItems = $$('#threatIntelligenceStatus').closest('.security-check-card')?.querySelectorAll('.check-list li');
      
      this.updateSecurityStatus(statusElement, 'running', 'Cross-referencing threat databases...');
      
      if (checkItems) {
        for (let i = 0; i < checkItems.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 500));
          checkItems[i].setAttribute('data-status', Math.random() > 0.02 ? 'completed' : 'failed');
          
          if (i === 0) this.addMonitoringEvent('Blacklist screening complete', 'success');
          if (i === 1) this.addMonitoringEvent('Fraud database checked', 'success');
          if (i === 2) this.addMonitoringEvent('Sanctions verification complete', 'success');
          if (i === 3) this.addMonitoringEvent('Risk assessment finalized', 'success');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      this.updateSecurityStatus(statusElement, 'completed', 'Threat Check Complete');
    },

    updateSecurityStatus(element, status, message) {
      if (!element) return;
      
      const statusClasses = {
        running: 'status-indicator--pending',
        completed: 'status-indicator--completed', 
        failed: 'status-indicator--failed'
      };
      
      const statusIcons = {
        running: '🔄',
        completed: '✅',
        failed: '❌'
      };
      
      element.innerHTML = `<span class="status-indicator ${statusClasses[status]}">${statusIcons[status]} ${message}</span>`;
    },

    updateSecurityScore(scoreId, value) {
      const element = $(`#${scoreId}`);
      if (element) {
        setTimeout(() => {
          element.style.width = `${value}%`;
        }, 100);
      }
    },

    addMonitoringEvent(message, type) {
      const timeline = $('#monitoringTimeline');
      if (!timeline) return;
      
      const timestamp = new Date().toLocaleTimeString();
      const typeIcons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };
      
      const eventDiv = document.createElement('div');
      eventDiv.className = `monitoring-event monitoring-event--${type}`;
      eventDiv.innerHTML = `
        <div class="event-time">${timestamp}</div>
        <div class="event-content">
          <span class="event-icon">${typeIcons[type] || 'ℹ️'}</span>
          <span class="event-message">${message}</span>
        </div>
      `;
      
      timeline.insertBefore(eventDiv, timeline.firstChild);
      
      // Limit to last 10 events
      while (timeline.children.length > 10) {
        timeline.removeChild(timeline.lastChild);
      }
    },

    completeSecurityVerification() {
      // Calculate overall security score
      const overallScore = Math.round((92 + 88 + 95) / 3);
      const scoreElement = $('#securityScore');
      
      if (scoreElement) {
        let currentScore = 0;
        const scoreInterval = setInterval(() => {
          currentScore += 2;
          scoreElement.textContent = currentScore.toString();
          
          if (currentScore >= overallScore) {
            clearInterval(scoreInterval);
            scoreElement.textContent = overallScore.toString();
          }
        }, 50);
      }
      
      // Update security circle
      const scoreCircle = $('.score-circle');
      if (scoreCircle) {
        const angle = (overallScore / 100) * 360;
        scoreCircle.style.setProperty('--score-angle', `${angle}deg`);
      }
      
      this.addMonitoringEvent('Security verification completed successfully', 'success');
      this.addMonitoringEvent(`Overall security score: ${overallScore}/100`, 'info');
      
      // Mark security as verified
      this.verificationState.securityVerified = true;
      this.updateSectionStatus('securityVerificationSection', 'completed');
      this.updateVerificationProgress();
      this.updateVerificationButton();
      
      // Show threat indicators
      this.showThreatIndicators(overallScore);
    },

    showThreatIndicators(score) {
      const threatIndicators = $('#threatIndicators');
      if (!threatIndicators) return;
      
      let indicators = [];
      
      if (score >= 90) {
        indicators.push({
          type: 'success',
          text: 'Low Risk Profile',
          description: 'Institution shows excellent security posture'
        });
      } else if (score >= 75) {
        indicators.push({
          type: 'warning', 
          text: 'Medium Risk Profile',
          description: 'Some security concerns identified'
        });
      } else {
        indicators.push({
          type: 'error',
          text: 'High Risk Profile',
          description: 'Multiple security issues detected'
        });
      }
      
      if (Math.random() > 0.8) {
        indicators.push({
          type: 'info',
          text: 'Enhanced Monitoring',
          description: 'Continuous monitoring recommended'
        });
      }
      
      let indicatorHTML = '';
      indicators.forEach(indicator => {
        indicatorHTML += `
          <div class="threat-indicator threat-indicator--${indicator.type}">
            <div class="indicator-header">
              <span class="indicator-icon">${indicator.type === 'success' ? '🛡️' : indicator.type === 'warning' ? '⚠️' : indicator.type === 'error' ? '🚨' : 'ℹ️'}</span>
              <span class="indicator-text">${indicator.text}</span>
            </div>
            <div class="indicator-description">${indicator.description}</div>
          </div>
        `;
      });
      
      threatIndicators.innerHTML = indicatorHTML;
    },

    handleSecurityFailure() {
      this.addMonitoringEvent('Security verification failed', 'error');
      const scoreElement = $('#securityScore');
      if (scoreElement) {
        scoreElement.textContent = 'ERR';
      }
    },

    // Notification system
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close">×</button>
      `;
      
      document.body.appendChild(notification);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
      
      // Manual close
      notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
      });
    },

    updateSecurityCheckStatus(checkId, status) {
      const element = $(`#${checkId}`);
      if (!element) return;
      
      const statusMap = {
        running: { class: 'status-indicator--pending', text: 'Scanning...', icon: '🔄' },
        completed: { class: 'status-indicator--completed', text: 'Passed', icon: '✅' },
        failed: { class: 'status-indicator--failed', text: 'Attention Needed', icon: '⚠️' },
        pending: { class: 'status-indicator--pending', text: 'Pending', icon: '⏳' }
      };
      
      const config = statusMap[status] || statusMap.pending;
      element.innerHTML = `<span class="status-indicator ${config.class}">${config.icon} ${config.text}</span>`;
    },

    completeAccountVerification() {
      this.verificationState.accountVerified = true;
      this.updateSectionStatus('accountVerificationSection', 'completed');
      this.unlockSection('institutionVerificationSection');
      this.updateVerificationProgress();
      this.updateVerificationButton();
    },

    completeInstitutionVerification() {
      this.verificationState.institutionVerified = true;
      this.updateSectionStatus('institutionVerificationSection', 'completed');
      this.unlockSection('securityVerificationSection');
      this.updateVerificationProgress();
      this.updateVerificationButton();
    },

    updateSectionStatus(sectionId, status) {
      const section = $(`#${sectionId}`);
      if (!section) return;
      
      section.classList.remove('verification-section--locked', 'verification-section--completed');
      if (status === 'completed') {
        section.classList.add('verification-section--completed');
      }
      
      // Update badge
      const badgeId = sectionId.replace('Section', 'Badge');
      const badge = $(`#${badgeId}`);
      if (badge) {
        badge.className = `verification-badge verification-badge--${status}`;
        const statusMap = {
          completed: { icon: '✅', text: 'Verified' },
          pending: { icon: '⏳', text: 'Pending' },
          locked: { icon: '🔒', text: 'Locked' }
        };
        const config = statusMap[status] || statusMap.pending;
        badge.innerHTML = `
          <span class="verification-badge__icon">${config.icon}</span>
          <span class="verification-badge__text">${config.text}</span>
        `;
      }
    },

    unlockSection(sectionId) {
      const section = $(`#${sectionId}`);
      if (!section) return;
      
      section.classList.remove('verification-section--locked');
      const unlockMsg = section.querySelector('.verification-unlock-message');
      const content = section.querySelector('.verification-content');
      if (unlockMsg) unlockMsg.style.display = 'none';
      if (content) content.style.display = 'block';
      
      // Update badge to pending
      this.updateSectionStatus(sectionId, 'pending');
      
      // Enable security check button if this is the security section
      if (sectionId === 'securityVerificationSection') {
        const startBtn = $('#startSecurityCheck');
        if (startBtn) startBtn.disabled = false;
      }
    },

    updateVerificationProgress() {
      const { accountVerified, institutionVerified, securityVerified } = this.verificationState;
      const totalRequired = 2; // Account + Institution
      const totalOptional = 1; // Security
      const completedRequired = (accountVerified ? 1 : 0) + (institutionVerified ? 1 : 0);
      const completedOptional = securityVerified ? 1 : 0;
      
      // Calculate percentage (required worth 80%, optional worth 20%)
      const requiredPercent = (completedRequired / totalRequired) * 80;
      const optionalPercent = (completedOptional / totalOptional) * 20;
      const totalPercent = Math.round(requiredPercent + optionalPercent);
      
      const progressRing = $('#verificationProgress');
      if (progressRing) {
        progressRing.style.setProperty('--progress', `${totalPercent}%`);
        const text = progressRing.querySelector('.progress-ring__text');
        if (text) text.textContent = `${totalPercent}%`;
      }
      
      // Update checklist
      this.updateChecklistItem('checklistAccount', accountVerified);
      this.updateChecklistItem('checklistInstitution', institutionVerified);
      this.updateChecklistItem('checklistSecurity', securityVerified);
    },

    updateChecklistItem(itemId, completed) {
      const item = $(`#${itemId}`);
      if (!item) return;
      
      const icon = item.querySelector('.checklist-icon');
      if (icon) {
        icon.textContent = completed ? '✅' : '⏳';
      }
      
      item.style.opacity = completed ? '1' : '0.6';
    }
  };

  /* Step 4: Institution Profile */
  const profileStep = {
    init() {
      const backBtn = $('#backToVerifyInst');
      const saveBtn = $('#saveInstProfile');
      backBtn?.addEventListener('click', () => stepNavigation.prevStep());
      if (saveBtn) {
        const requiredFields = ['instName','instType','instCountry','instCity','instWebsite','instDesc'];
        requiredFields.forEach(id => {
          const field = $(`#${id}`);
          if (!field) return;
          field.addEventListener('input', () => this.updateButton());
          if (field.tagName === 'SELECT') field.addEventListener('change', () => this.updateButton());
        });
        saveBtn.addEventListener('click', () => {
          if (!this.isValid()) return;
          onboardingData.instName = $('#instName')?.value.trim();
          onboardingData.instType = $('#instType')?.value;
          onboardingData.instCountry = $('#instCountry')?.value;
          onboardingData.instCity = $('#instCity')?.value.trim();
          onboardingData.instWebsite = $('#instWebsite')?.value.trim();
          onboardingData.instDesc = $('#instDesc')?.value.trim();
          onboardingData.instFounded = $('#instFounded')?.value;
          saveBtn.classList.add('btn--loading');
          setTimeout(() => { saveBtn.classList.remove('btn--loading'); stepNavigation.nextStep(); }, 600);
        });
        this.updateButton();
      }
    },
    isValid() {
      return $('#instName')?.value.trim() && $('#instType')?.value && $('#instCountry')?.value &&
             $('#instCity')?.value.trim() && $('#instWebsite')?.value.trim() && $('#instDesc')?.value.trim();
    },
    updateButton() { const btn = $('#saveInstProfile'); if (btn) btn.disabled = !this.isValid(); }
  };

  /* Step 5: Programs */
  const programsStep = {
    init() {
      const backBtn = $('#backToProfileInst');
      const saveBtn = $('#savePrograms');
      backBtn?.addEventListener('click', () => stepNavigation.prevStep());
      if (saveBtn) {
        const requiredFields = ['programName','programLevel','programDuration'];
        requiredFields.forEach(id => {
          const field = $(`#${id}`);
          if (!field) return;
          field.addEventListener('input', () => this.updateButton());
          if (field.tagName === 'SELECT') field.addEventListener('change', () => this.updateButton());
        });
        saveBtn.addEventListener('click', () => {
          if (!this.isValid()) return;
          onboardingData.programName = $('#programName')?.value.trim();
          onboardingData.programLevel = $('#programLevel')?.value;
          onboardingData.programDuration = $('#programDuration')?.value;
          onboardingData.programTuition = $('#programTuition')?.value;
          saveBtn.classList.add('btn--loading');
          setTimeout(() => { saveBtn.classList.remove('btn--loading'); stepNavigation.nextStep(); }, 600);
        });
        this.updateButton();
      }
    },
    isValid() { return $('#programName')?.value.trim() && $('#programLevel')?.value && $('#programDuration')?.value; },
    updateButton() { const btn = $('#savePrograms'); if (btn) btn.disabled = !this.isValid(); }
  };

  /* Step 6: Team */
  const teamStep = {
    init() {
      const backBtn = $('#backToPrograms');
      const saveBtn = $('#saveTeam');
      backBtn?.addEventListener('click', () => stepNavigation.prevStep());
      if (saveBtn) {
        const requiredFields = ['teamName','teamEmail','teamRole'];
        requiredFields.forEach(id => {
          const field = $(`#${id}`);
          if (!field) return;
          field.addEventListener('input', () => this.updateButton());
          if (field.tagName === 'SELECT') field.addEventListener('change', () => this.updateButton());
        });
        saveBtn.addEventListener('click', () => {
          if (!this.isValid()) return;
          onboardingData.teamName = $('#teamName')?.value.trim();
          onboardingData.teamEmail = $('#teamEmail')?.value.trim();
          onboardingData.teamRole = $('#teamRole')?.value;
          saveBtn.classList.add('btn--loading');
          setTimeout(() => { saveBtn.classList.remove('btn--loading'); stepNavigation.nextStep(); }, 600);
        });
        this.updateButton();
      }
    },
    isValid() { return $('#teamName')?.value.trim() && $('#teamEmail')?.value.trim() && $('#teamRole')?.value; },
    updateButton() { const btn = $('#saveTeam'); if (btn) btn.disabled = !this.isValid(); }
  };

  /* Step 7: Review & Finish */
  const reviewStep = {
    init() {
      const backBtn = $('#backToTeam');
      const finishBtn = $('#finishOnboardingInst');
      backBtn?.addEventListener('click', () => stepNavigation.prevStep());
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          finishBtn.classList.add('btn--loading');
          setTimeout(() => {
            finishBtn.classList.remove('btn--loading');
            window.location.href = '/institutions/';
          }, 900);
        });
      }
      this.populateReview();
    },
    populateReview() {
      const contactEl = $('#reviewContact');
      if (contactEl) {
        if (onboardingData.method === 'email') contactEl.textContent = onboardingData.email || '—';
        else contactEl.textContent = onboardingData.phone || '—';
      }
      const instNameEl = $('#reviewInstName');
      const instLocEl = $('#reviewInstLocation');
      const instTypeEl = $('#reviewInstType');
      if (instNameEl) instNameEl.textContent = onboardingData.instName || '—';
      if (instLocEl) instLocEl.textContent = `${onboardingData.instCity || ''}${onboardingData.instCity && onboardingData.instCountry ? ', ' : ''}${onboardingData.instCountry || ''}` || '—';
      if (instTypeEl) instTypeEl.textContent = onboardingData.instType || '—';
      const progNameEl = $('#reviewProgramName');
      const progLevelEl = $('#reviewProgramLevel');
      const progDurEl = $('#reviewProgramDuration');
      if (progNameEl) progNameEl.textContent = onboardingData.programName || '—';
      if (progLevelEl) progLevelEl.textContent = onboardingData.programLevel || '—';
      if (progDurEl) progDurEl.textContent = onboardingData.programDuration || '—';
      const teamNameEl = $('#reviewTeamName');
      const teamEmailEl = $('#reviewTeamEmail');
      const teamRoleEl = $('#reviewTeamRole');
      if (teamNameEl) teamNameEl.textContent = onboardingData.teamName || '—';
      if (teamEmailEl) teamEmailEl.textContent = onboardingData.teamEmail || '—';
      if (teamRoleEl) teamRoleEl.textContent = onboardingData.teamRole || '—';
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
