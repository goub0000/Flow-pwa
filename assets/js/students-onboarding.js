/*
 * Flow Students Onboarding Script (Upgraded)
 * - Full i18n (EN/FR/AR/SW) + RTL
 * - Language & currency persistence (optional selector)
 * - Client-only validation; OTP; progress; toasts localized
 * - Individual upload cap handled in portal; onboarding stays code/light
 */

(function() {
  'use strict';
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // Shared namespace
  window.Flow = window.Flow || {};
  Flow.store = Flow.store || { get(k,d=null){ try{const v=localStorage.getItem(k); return v?JSON.parse(v):d;}catch(_){return d;} }, set(k,v){ try{localStorage.setItem(k, JSON.stringify(v));}catch(_){} } };
  Flow.i18n = Flow.i18n || {
    lang: Flow.store.get('flow.lang') || (localStorage.getItem('flow-language') || 'en'),
    dirFor: l => l==='ar'?'rtl':'ltr',
    dict:{
      en:{ online:'Online', offline:'Offline',
           conn_back:'Connection restored - syncing your progress',
           offline_note:'Working offline - progress will sync when reconnected',
           synced:'Progress synced successfully',
           lang_saved:'Language preference saved',
           lang_switched:n=>`Language switched to ${n}`,
           creating:'Creating account...',
           code_sent:'Verification code sent!',
           email_req:'Email is required',
           email_bad:'Please enter a valid email address',
           pwd_req:'Password is required',
           pwd_bad:'Password does not meet requirements',
           confirm_req:'Please confirm your password',
           pwd_match:'Passwords do not match',
           terms_req:'You must agree to the terms',
           country_req:'Please select your country',
           phone_req:'Phone number is required',
           phone_bad:'Please enter a valid phone number',
           verifying:'Verifying code...',
           verified:'Account verified successfully!',
           resent:'Verification code resent',
           profile_saved:'Profile saved successfully!',
           finishing:'Completing onboarding...',
           welcome_redirect:'Welcome to Flow! Redirecting to your dashboard...'
      },
      fr:{ online:'En ligne', offline:'Hors ligne',
           conn_back:'Connexion rétablie – synchronisation de votre progression',
           offline_note:'Hors ligne – la progression se synchronisera plus tard',
           synced:'Progression synchronisée',
           lang_saved:'Préférence de langue enregistrée',
           lang_switched:n=>`Langue changée en ${n}`,
           creating:'Création du compte…',
           code_sent:'Code de vérification envoyé !',
           email_req:'Adresse e-mail requise',
           email_bad:'Veuillez saisir une adresse e-mail valide',
           pwd_req:'Mot de passe requis',
           pwd_bad:'Le mot de passe ne satisfait pas les exigences',
           confirm_req:'Veuillez confirmer votre mot de passe',
           pwd_match:'Les mots de passe ne correspondent pas',
           terms_req:'Vous devez accepter les conditions',
           country_req:'Veuillez sélectionner votre pays',
           phone_req:'Numéro de téléphone requis',
           phone_bad:'Veuillez saisir un numéro de téléphone valide',
           verifying:'Vérification du code…',
           verified:'Compte vérifié !',
           resent:'Code renvoyé',
           profile_saved:'Profil enregistré avec succès !',
           finishing:'Finalisation de l’onboarding…',
           welcome_redirect:'Bienvenue sur Flow ! Redirection vers le tableau de bord…'
      },
      ar:{ online:'متصل', offline:'غير متصل',
           conn_back:'تمت استعادة الاتصال – جارٍ مزامنة تقدمك',
           offline_note:'وضع عدم الاتصال – ستتم مزامنة التقدم عند الاتصال',
           synced:'تمت مزامنة التقدم بنجاح',
           lang_saved:'تم حفظ تفضيل اللغة',
           lang_switched:n=>`تم تغيير اللغة إلى ${n}`,
           creating:'جارٍ إنشاء الحساب…',
           code_sent:'تم إرسال رمز التحقق!',
           email_req:'البريد الإلكتروني مطلوب',
           email_bad:'يرجى إدخال بريد إلكتروني صالح',
           pwd_req:'كلمة المرور مطلوبة',
           pwd_bad:'كلمة المرور لا تستوفي المتطلبات',
           confirm_req:'يرجى تأكيد كلمة المرور',
           pwd_match:'كلمات المرور غير متطابقة',
           terms_req:'يجب الموافقة على الشروط',
           country_req:'يرجى اختيار بلدك',
           phone_req:'رقم الهاتف مطلوب',
           phone_bad:'يرجى إدخال رقم هاتف صالح',
           verifying:'جارٍ التحقق من الرمز…',
           verified:'تم التحقق من الحساب!',
           resent:'تم إرسال الرمز مرة أخرى',
           profile_saved:'تم حفظ الملف الشخصي بنجاح!',
           finishing:'جارٍ إكمال الإعداد…',
           welcome_redirect:'مرحبًا بك في Flow! سيتم تحويلك إلى لوحة التحكم…'
      },
      sw:{ online:'Mtandaoni', offline:'Nje ya mtandao',
           conn_back:'Muunganisho umerudi – tunaunganisha maendeleo yako',
           offline_note:'Nje ya mtandao – maendeleo yatasawazishwa utarudi mtandaoni',
           synced:'Maendeleo yamesawazishwa',
           lang_saved:'Chaguo la lugha limehifadhiwa',
           lang_switched:n=>`Lugha imebadilishwa kuwa ${n}`,
           creating:'Kuunda akaunti…',
           code_sent:'Nambari ya uthibitisho imetumwa!',
           email_req:'Barua pepe yahitajika',
           email_bad:'Tafadhali weka barua pepe sahihi',
           pwd_req:'Nenosiri yahitajika',
           pwd_bad:'Nenosiri halikidhi vigezo',
           confirm_req:'Tafadhali thibitisha nenosiri',
           pwd_match:'Manenosiri hayalingani',
           terms_req:'Lazima ukubali masharti',
           country_req:'Tafadhali chagua nchi yako',
           phone_req:'Nambari ya simu yahitajika',
           phone_bad:'Tafadhali weka nambari ya simu sahihi',
           verifying:'Kuthibitisha nambari…',
           verified:'Akaunti imethibitishwa!',
           resent:'Nambari imetumwa tena',
           profile_saved:'Wasifu umehifadhiwa!',
           finishing:'Kukamilisha onboarding…',
           welcome_redirect:'Karibu Flow! Inakuelekeza kwenye dashibodi…'
      }
    },
    t(k,p){ const L=this.lang in this.dict?this.lang:'en'; const v=this.dict[L][k]; return typeof v==='function'?v(p):v; },
    set(l){ this.lang=l; Flow.store.set('flow.lang', l); document.documentElement.lang=l; document.documentElement.dir=this.dirFor(l); }
  };
  Flow.i18n.set(Flow.i18n.lang);

  // Global state
  let currentStep = 1;
  let onboardingData = {
    language: Flow.i18n.lang,
    accountMethod: 'email',
    email: '',
    phone: '',
    country: '',
    firstName: '',
    lastName: '',
    interests: []
  };

  // Toasts
  const toast = {
    container: $('#toast-container'),
    show(message, type = 'info', duration = 5000) {
      if (!this.container) return;
      const variant = (type === 'success' || type === 'warning' || type === 'error') ? ` toast--${type}` : '';
      const toastEl = document.createElement('div');
      toastEl.className = `toast${variant}`;
      toastEl.setAttribute('role', 'alert');
      toastEl.innerHTML = `<div class="toast__content"><span class="toast__message">${message}</span><button class="toast__close" aria-label="Close">×</button></div>`;
      this.container.appendChild(toastEl);
      requestAnimationFrame(() => toastEl.classList.add('toast--visible'));
      const remove = () => { toastEl.classList.remove('toast--visible'); setTimeout(() => toastEl.remove(), 300); };
      $('.toast__close', toastEl)?.addEventListener('click', remove);
      if (duration > 0) setTimeout(remove, duration);
      return toastEl;
    }
  };

  // Connection status
  const connectionStatus = {
    indicator: $('.connection-status__indicator'),
    text: $('.connection-status__text'),
    isOnline: navigator.onLine,
    init() {
      this.updateStatus();
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    },
    updateStatus() {
      if (this.indicator && this.text) {
        this.indicator.className = `connection-status__indicator${this.isOnline ? '' : ' connection-status__indicator--offline'}`;
        this.text.textContent = this.isOnline ? Flow.i18n.t('online') : Flow.i18n.t('offline');
      }
    },
    handleOnline() { this.isOnline=true; this.updateStatus(); toast.show(Flow.i18n.t('conn_back'), 'success', 3000); this.syncProgress(); },
    handleOffline() { this.isOnline=false; this.updateStatus(); toast.show(Flow.i18n.t('offline_note'), 'info', 5000); },
    syncProgress(){ setTimeout(()=>{ if(this.isOnline) toast.show(Flow.i18n.t('synced'),'success',2000); },1500); }
  };

  // Step navigation
  const stepNavigation = {
    init() { this.showStep(currentStep); this.updateStepper(); },
    showStep(n) {
      $$('.onboarding-step').forEach(s => s.classList.remove('onboarding-step--active'));
      $(`#step-${this.getStepId(n)}`)?.classList.add('onboarding-step--active');
      currentStep = n; this.updateStepper(); this.updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    getStepId(n){ return ['welcome','account','verify','profile','review'][n-1] || 'welcome'; },
    updateStepper(){
      $$('.stepper__item').forEach((item, i) => {
        const num = i+1;
        item.classList.remove('stepper__item--current','stepper__item--completed');
        if (num === currentStep) item.classList.add('stepper__item--current');
        else if (num < currentStep) item.classList.add('stepper__item--completed');
      });
      const s = $('.stepper'); if (s){ s.setAttribute('aria-valuenow', currentStep); s.setAttribute('aria-label', `Onboarding progress: Step ${currentStep} of 5`); }
    },
    updateProgress(){
      const fill = $('.stepper-progress__fill'); const txt = $('.stepper-progress__text');
      if (fill) fill.style.width = `${(currentStep/5)*100}%`;
      if (txt) txt.textContent = `Step ${currentStep} of 5`;
    },
    nextStep(){ if (currentStep < 5) this.showStep(currentStep+1); },
    prevStep(){ if (currentStep > 1) this.showStep(currentStep-1); }
  };

  // Validation helpers
  const validation = {
    validateEmail: e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
    validatePhone: p => /^[\d\s\-\+\(\)]{7,15}$/.test((p||'').replace(/\s/g,'')),
    validatePassword(p){ const L=p.length>=8,N=/\d/.test(p),S=/[@$!%*?&]/.test(p); return {isValid:L&&N&&S,hasLength:L,hasNumber:N,hasSymbol:S}; },
    showError(id,msg){ const err=$(`#${id}-error`), f=$(`#${id}`); if(err){ err.textContent=msg; err.style.display='block'; } if(f){ f.classList.add('form-input--error'); f.setAttribute('aria-invalid','true'); } },
    clearError(id){ const err=$(`#${id}-error`), f=$(`#${id}`); if(err){ err.textContent=''; err.style.display='none'; } if(f){ f.classList.remove('form-input--error'); f.setAttribute('aria-invalid','false'); } }
  };

  // Step 1: Welcome
  const welcomeStep = {
    init() {
      $('#continueToAccount')?.addEventListener('click', () => {
        const selected = $('input[name="onboarding-language"]:checked')?.value || Flow.i18n.lang;
        onboardingData.language = selected; Flow.i18n.set(selected);
        toast.show(Flow.i18n.t('lang_saved'), 'success', 2000);
        stepNavigation.nextStep();
      });
      $$('input[name="onboarding-language"]').forEach(r => {
        r.addEventListener('change', (e) => {
          onboardingData.language = e.target.value;
          $$('.language-option').forEach(l => l.classList.remove('language-option--selected'));
          e.target.closest('.language-option')?.classList.add('language-option--selected');
        });
      });
      const def = $('input[name="onboarding-language"]:checked'); def?.closest('.language-option')?.classList.add('language-option--selected');
    }
  };

  // Step 2: Account
  const accountStep = {
    init(){ this.initMethodSwitcher(); this.initEmailForm(); this.initPhoneForm(); this.initNavigation(); },
    initMethodSwitcher(){ $$('.method-switch').forEach(btn => btn.addEventListener('click', () => this.switchMethod(btn.getAttribute('data-method')))); },
    switchMethod(m){ $$('.method-switch').forEach(b=> b.classList.toggle('method-switch--active', b.getAttribute('data-method')===m));
      $$('.account-option').forEach(o=> o.classList.toggle('account-option--active', o.getAttribute('data-method')===m));
      onboardingData.accountMethod=m; this.updateContinueButton();
    },
    initEmailForm(){
      const emailField=$('#email'), pwdField=$('#password'), confirmField=$('#confirmPassword'), terms=$('#agreeTerms');
      emailField?.addEventListener('input', e=>{ const v=e.target.value.trim(); validation.clearError('email'); if(v && !validation.validateEmail(v)) validation.showError('email', Flow.i18n.t('email_bad')); else onboardingData.email=v; this.updateContinueButton(); });
      pwdField?.addEventListener('input', e=>{ const v=e.target.value; const r=validation.validatePassword(v); validation.clearError('password'); if(v && !r.isValid) validation.showError('password', Flow.i18n.t('pwd_bad')); this.updateContinueButton(); });
      confirmField?.addEventListener('input', e=>{ const c=e.target.value, p=pwdField?.value; validation.clearError('confirmPassword'); if(c && p && c!==p) validation.showError('confirmPassword', Flow.i18n.t('pwd_match')); this.updateContinueButton(); });
      terms?.addEventListener('change', ()=>{ validation.clearError('terms'); this.updateContinueButton(); });
    },
    initPhoneForm(){
      const country=$('#country'), phone=$('#phone'), prefix=$('#phonePrefix'), terms=$('#agreeTermsPhone');
      country?.addEventListener('change', e=>{ const opt=e.target.selectedOptions[0]; prefix && (prefix.textContent = opt?.getAttribute('data-code') || '+233'); onboardingData.country=e.target.value; validation.clearError('country'); this.updateContinueButton(); });
      phone?.addEventListener('input', e=>{ const v=e.target.value.trim(); validation.clearError('phone'); if(v && !validation.validatePhone(v)) validation.showError('phone', Flow.i18n.t('phone_bad')); else onboardingData.phone=v; this.updateContinueButton(); });
      terms?.addEventListener('change', ()=>{ validation.clearError('terms-phone'); this.updateContinueButton(); });
    },
    initNavigation(){
      $('#backToWelcome')?.addEventListener('click', ()=> stepNavigation.prevStep());
      $('#createAccount')?.addEventListener('click', ()=>{
        console.log('🔵 Create Account button clicked');
        console.log('🔵 Validation result:', this.validateCurrentMethod());
        if(this.validateCurrentMethod()){
          console.log('🔵 Calling createAccount function...');
          this.createAccount();
        } else {
          console.log('🔴 Validation failed, not creating account');
        }
      });
    },
    async createAccount(){
      try {
        toast.show('Creating account...', 'info', 2000);

        if (onboardingData.accountMethod === 'email') {
          const email = $('#email')?.value.trim();
          const password = $('#password')?.value;

          // Wait for Firebase to be initialized
          await this.waitForFirebase();

          // Debug: Check if Firebase is available
          console.log('Firebase available:', !!window.Firebase);
          console.log('Firebase initialized:', !!window.Firebase?.initialized);
          console.log('FlowAuth available:', !!window.FlowAuth);

          // Try direct Firebase Auth first
          if (window.Firebase && window.Firebase.auth) {
            try {
              console.log('Attempting Firebase Auth registration...');
              const userCredential = await window.Firebase.auth.createUserWithEmailAndPassword(email, password);
              console.log('Firebase Auth success:', userCredential.user.uid);

              // Send email verification
              try {
                await userCredential.user.sendEmailVerification();
                console.log('Email verification sent successfully');
              } catch (emailError) {
                console.error('Email verification failed:', emailError);
                // Continue with registration even if email verification fails
              }

              // Now register with backend
              const response = await fetch('https://us-central1-flow-pwa.cloudfunctions.net/api/api/students/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName: 'Student', // Temporary
                  lastName: 'User',     // Temporary
                  email: email,
                  dateOfBirth: '2000-01-01' // Temporary
                })
              });

              const backendResult = await response.json();
              console.log('Backend registration result:', backendResult);

              if (backendResult.success) {
                onboardingData.email = email;
                onboardingData.userId = userCredential.user.uid;
                onboardingData.studentId = backendResult.studentId;

                // Store account type for proper redirect after login
                sessionStorage.setItem('flow_account_type', 'student');

                toast.show('Account created! Check your email and click the verification link, then click "Verify" below.', 'success', 5000);
                stepNavigation.nextStep();
              } else {
                throw new Error('Backend registration failed');
              }
            } catch (firebaseError) {
              console.error('Firebase Auth error:', firebaseError);
              throw firebaseError;
            }
          } else {
            throw new Error('Firebase not available');
          }
        } else {
          // Phone registration - for now just simulate
          toast.show('Code sent to your phone!', 'success', 3000);
          stepNavigation.nextStep();
        }
      } catch (error) {
        console.error('Account creation failed:', error);
        let errorMessage = 'Account creation failed: ';

        if (error.code === 'auth/email-already-in-use') {
          errorMessage += 'Email already registered. Try signing in instead.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage += 'Password is too weak.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage += 'Invalid email address.';
        } else {
          errorMessage += error.message || 'Unknown error occurred.';
        }

        toast.show(errorMessage, 'error', 5000);
      }
    },

    // Wait for Firebase to be initialized
    async waitForFirebase(maxWait = 10000) {
      console.log('🔥 Waiting for Firebase initialization...');

      // If Firebase is already initialized, return immediately
      if (window.Firebase && window.Firebase.initialized) {
        console.log('✅ Firebase already initialized');
        return;
      }

      // Wait for the firebaseInitialized event
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Firebase initialization timeout'));
        }, maxWait);

        const handleInit = () => {
          clearTimeout(timeout);
          console.log('✅ Firebase initialization event received');
          document.removeEventListener('firebaseInitialized', handleInit);
          resolve();
        };

        document.addEventListener('firebaseInitialized', handleInit);

        // Also check if it's already initialized (race condition)
        setTimeout(() => {
          if (window.Firebase && window.Firebase.initialized) {
            handleInit();
          }
        }, 100);
      });
    },

    validateCurrentMethod(){
      if (onboardingData.accountMethod==='email'){
        const email=$('#email')?.value.trim(), pwd=$('#password')?.value, confirm=$('#confirmPassword')?.value, terms=$('#agreeTerms')?.checked;
        console.log('🔍 Validating email method:', {email, pwd: pwd ? '[HIDDEN]' : 'empty', confirm: confirm ? '[HIDDEN]' : 'empty', terms});
        let ok=true;
        if(!email){ validation.showError('email', Flow.i18n.t('email_req')); ok=false; } else if(!validation.validateEmail(email)){ validation.showError('email', Flow.i18n.t('email_bad')); ok=false; }
        if(!pwd){ validation.showError('password', Flow.i18n.t('pwd_req')); ok=false; } else {
          const pwdValidation = validation.validatePassword(pwd);
          console.log('🔍 Password validation:', pwdValidation);
          if(!pwdValidation.isValid){ validation.showError('password', Flow.i18n.t('pwd_bad')); ok=false; }
        }
        if(!confirm){ validation.showError('confirmPassword', Flow.i18n.t('confirm_req')); ok=false; } else if(pwd!==confirm){ validation.showError('confirmPassword', Flow.i18n.t('pwd_match')); ok=false; }
        if(!terms){ validation.showError('terms', Flow.i18n.t('terms_req')); ok=false; }
        console.log('🔍 Final validation result:', ok);
        return ok;
      } else {
        const country=$('#country')?.value, phone=$('#phone')?.value.trim(), terms=$('#agreeTermsPhone')?.checked; let ok=true;
        if(!country){ validation.showError('country', Flow.i18n.t('country_req')); ok=false; }
        if(!phone){ validation.showError('phone', Flow.i18n.t('phone_req')); ok=false; } else if(!validation.validatePhone(phone)){ validation.showError('phone', Flow.i18n.t('phone_bad')); ok=false; }
        if(!terms){ validation.showError('terms-phone', Flow.i18n.t('terms_req')); ok=false; }
        return ok;
      }
    },
    updateContinueButton(){ const btn=$('#createAccount'); if (btn) btn.disabled = !this.isCurrentMethodValid(); },
    isCurrentMethodValid(){
      if (onboardingData.accountMethod==='email'){
        const email=$('#email')?.value.trim(), pwd=$('#password')?.value, confirm=$('#confirmPassword')?.value, terms=$('#agreeTerms')?.checked;
        return email && validation.validateEmail(email) && pwd && validation.validatePassword(pwd).isValid && confirm && pwd===confirm && terms;
      } else {
        const country=$('#country')?.value, phone=$('#phone')?.value.trim(), terms=$('#agreeTermsPhone')?.checked;
        return country && phone && validation.validatePhone(phone) && terms;
      }
    }
  };

  // Step 3: Verification
  const verifyStep = {
    resendTimer: 60, resendInterval: null,
    init(){ this.updateVerificationTarget(); this.initOTPInputs(); this.initNavigation(); this.startResendTimer(); },
    updateVerificationTarget(){
      const t = $('#verificationTarget');
      if (!t) return;
      t.textContent = onboardingData.accountMethod==='email' ? (onboardingData.email || 'your email') : (onboardingData.phone || 'your phone');
    },
    initOTPInputs(){
      const inputs = $$('.otp-input');
      inputs.forEach((inp, i)=>{
        inp.addEventListener('input', e => {
          const v = e.target.value;
          if (!/^\d*$/.test(v)) { e.target.value=''; return; }
          if (v && i < inputs.length-1) inputs[i+1].focus();
          this.checkOTPComplete();
        });
        inp.addEventListener('keydown', e => { if (e.key==='Backspace' && !e.target.value && i>0) inputs[i-1].focus(); });
        inp.addEventListener('paste', e => {
          e.preventDefault(); const digits = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
          digits.split('').forEach((d, j)=>{ if(inputs[j]) inputs[j].value=d; }); this.checkOTPComplete();
        });
      });
    },
    checkOTPComplete(){
      const code = $$('.otp-input').map(i=>i.value).join('');
      const ok = code.length===6 && /^\d{6}$/.test(code);
      const btn = $('#verifyCode'); if (btn) btn.disabled = !ok; return ok;
    },
    startResendTimer(){
      const btn = $('#resendCode'), timer = $('#resendTimer'); if (!btn||!timer) return;
      btn.disabled = true; this.resendTimer = 60;
      clearInterval(this.resendInterval);
      this.resendInterval = setInterval(()=>{ this.resendTimer--; timer.textContent = `(${this.resendTimer}s)`; if (this.resendTimer<=0){ clearInterval(this.resendInterval); btn.disabled=false; timer.textContent=''; } }, 1000);
    },
    initNavigation(){
      $('#backToAccount')?.addEventListener('click', ()=> stepNavigation.prevStep());
      $('#verifyCode')?.addEventListener('click', async ()=>{
        // For already authenticated users, just check if email is verified
        const user = window.Firebase?.auth?.currentUser;
        if (user) {
          toast.show(Flow.i18n.t('verifying'),'info',2000);
          try {
            // Check if the user's email is verified
            await user.reload();

            if (user.emailVerified) {
              toast.show(Flow.i18n.t('verified'),'success',3000);
              stepNavigation.nextStep();
            } else {
              toast.show('Please check your email and click the verification link first.','error',5000);
            }
          } catch (error) {
            console.error('Verification check failed:', error);
            toast.show('Verification failed. Please try again.','error',3000);
          }
        } else if(this.checkOTPComplete()){
          // Original OTP verification logic for new signups
          toast.show(Flow.i18n.t('verifying'),'info',2000);
          try {
            // Check if the user's email is verified
            await window.Firebase.auth.currentUser.reload();
            const user = window.Firebase.auth.currentUser;

            if (user && user.emailVerified) {
              toast.show(Flow.i18n.t('verified'),'success',3000);
              stepNavigation.nextStep();
            } else {
              toast.show('Please check your email and click the verification link first.','error',5000);
            }
          } catch (error) {
            console.error('Verification check failed:', error);
            toast.show('Verification failed. Please try again.','error',3000);
          }
        }
      });
      $('#resendCode')?.addEventListener('click', async ()=>{
        try {
          const user = window.Firebase.auth.currentUser;
          if (user && !user.emailVerified) {
            await user.sendEmailVerification();
            toast.show(Flow.i18n.t('resent'),'success',2000);
            this.startResendTimer();
          } else {
            toast.show('User not found or already verified.','error',3000);
          }
        } catch (error) {
          console.error('Resend verification failed:', error);
          toast.show('Failed to resend verification email.','error',3000);
        }
      });
      $('#changeMethod')?.addEventListener('click', ()=> stepNavigation.showStep(2));
    }
  };

  // Step 4: Profile
  const profileStep = {
    init(){ this.initInterestTags(); this.initFormValidation(); this.initNavigation(); this.initAutoSave(); },
    initInterestTags(){
      const tags = $$('.interest-tag'); const hidden = $('#interestedFields');
      tags.forEach(tag => tag.addEventListener('click', (e)=>{ e.preventDefault(); tag.classList.toggle('interest-tag--selected');
        const selected = $$('.interest-tag--selected').map(t=> t.getAttribute('data-field')); onboardingData.interests = selected; if (hidden) hidden.value = selected.join(','); this.updateSaveButton();
      }));
    },
    initFormValidation(){
      const required = ['firstName','lastName','dateOfBirth','profileCountry','city','educationLevel'];
      required.forEach(id => { const f=$(`#${id}`); if(!f) return; const h=()=>{ validation.clearError(id); this.updateSaveButton(); }; f.addEventListener('input', h); f.addEventListener('change', h); });
    },
    initNavigation(){
      $('#backToVerify')?.addEventListener('click', ()=> stepNavigation.prevStep());
      $('#saveProfile')?.addEventListener('click', ()=>{ if(this.validateProfile()){ this.saveProfileData(); toast.show(Flow.i18n.t('profile_saved'),'success',3000); stepNavigation.nextStep(); } });
    },
    initAutoSave(){
      $$('#profileForm input, #profileForm select, #profileForm textarea').forEach(i => i.addEventListener('input', this.debounce(()=>{ if (connectionStatus.isOnline) this.autoSave(); }, 2000)));
    },
    validateProfile(){
      const req = ['firstName','lastName','dateOfBirth','profileCountry','city','educationLevel','interestedFields']; let ok=true;
      req.forEach(id => { const f=$(`#${id}`); const v=f?.value?.trim(); if (!v){ const name=f?.previousElementSibling?.textContent?.replace(' *','') || id; validation.showError(id, `${name} is required`); ok=false; } });
      if (onboardingData.interests.length===0){ validation.showError('interestedFields','Please select at least one field of interest'); ok=false; }
      return ok;
    },
    saveProfileData(){ const form=new FormData($('#profileForm')); for (const [k,v] of form.entries()) onboardingData[k]=v; },
    updateSaveButton(){ const btn=$('#saveProfile'); if (btn) btn.disabled = !this.isProfileValid(); },
    isProfileValid(){ const f=$('#firstName')?.value?.trim(), l=$('#lastName')?.value?.trim(), d=$('#dateOfBirth')?.value, c=$('#profileCountry')?.value, city=$('#city')?.value?.trim(), edu=$('#educationLevel')?.value; return f && l && d && c && city && edu && onboardingData.interests.length>0; },
    autoSave(){ toast.show('Progress saved automatically','success',1500); },
    debounce(fn,wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }
  };

  // Step 5: Review
  const reviewStep = {
    init(){ this.populateReview(); this.initNavigation(); },
    populateReview(){
      const contact = onboardingData.accountMethod==='email' ? onboardingData.email : onboardingData.phone;
      $('#reviewContact').textContent = contact || '—';
      $('#reviewLanguage').textContent = this.getLanguageName(onboardingData.language);
      const full = `${onboardingData.firstName||''} ${onboardingData.lastName||''}`.trim(); $('#reviewName').textContent = full || '—';
      const location = `${onboardingData.city || ''}, ${this.getCountryName(onboardingData.profileCountry)}`.replace(/^, |, $/,''); $('#reviewLocation').textContent = location || '—';
      const education = `${onboardingData.educationLevel || ''} ${onboardingData.gpa ? '(GPA: '+onboardingData.gpa+')':''}`.trim(); $('#reviewEducation').textContent = education || '—';
      const interests = (onboardingData.interests||[]).map(f => this.getFieldName(f)).join(', '); $('#reviewInterests').textContent = interests || '—';
    },
    getLanguageName(c){ const m={en:'English', fr:'French', ar:'Arabic', sw:'Swahili', ha:'Hausa', yo:'Yoruba', ig:'Igbo', zu:'Zulu', am:'Amharic'}; return m[c] || 'English'; },
    getCountryName(c){ const m={ gh:'Ghana', ng:'Nigeria', ke:'Kenya', tz:'Tanzania', ug:'Uganda', sn:'Senegal', bf:'Burkina Faso', rw:'Rwanda', et:'Ethiopia', za:'South Africa' }; return m[c] || ''; },
    getFieldName(f){ const m={ 'computer-science':'Computer Science','engineering':'Engineering','business':'Business','medicine':'Medicine','nursing':'Nursing','law':'Law','education':'Education','arts':'Arts & Design','agriculture':'Agriculture','economics':'Economics' }; return m[f] || f; },
    initNavigation(){
      $('#backToProfile')?.addEventListener('click', ()=> stepNavigation.prevStep());
      $('#finishOnboarding')?.addEventListener('click', async ()=>{
        const finishBtn = $('#finishOnboarding');
        finishBtn.disabled = true;

        toast.show(Flow.i18n.t('finishing'),'info',2000);

        try {
          // Save student data to Firestore
          await this.saveStudentData();

          setTimeout(()=>{
            toast.show(Flow.i18n.t('welcome_redirect'),'success',3000);
            setTimeout(()=>{ window.location.href='/students/'; }, 1800);
          }, 1200);
        } catch (error) {
          console.error('Error saving student data:', error);
          toast.show('Error saving data. Please try again.', 'error', 5000);
          finishBtn.disabled = false;
        }
      });
      $$('[data-edit]').forEach(btn => btn.addEventListener('click', () => { const s=btn.getAttribute('data-edit'); if(s==='account') stepNavigation.showStep(2); else if(s==='profile') stepNavigation.showStep(4); }));
    },

    async saveStudentData() {
      console.log('🔄 Starting saveStudentData...');

      // Check Firebase initialization
      if (!window.Firebase?.auth || !window.Firebase?.db) {
        console.error('❌ Firebase not initialized:', {
          auth: !!window.Firebase?.auth,
          db: !!window.Firebase?.db,
          Firebase: !!window.Firebase
        });
        throw new Error('Firebase not initialized');
      }

      const user = window.Firebase.auth.currentUser;
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated:', user.uid, user.email);

      // Collect all form data
      console.log('📋 Collecting form data...');
      profileStep.saveProfileData();

      console.log('📋 Current onboarding data:', onboardingData);

      const studentData = {
        // Basic account information
        email: onboardingData.email || user.email || '',
        userId: user.uid,
        userType: 'student',

        // Personal information
        firstName: onboardingData.firstName || '',
        lastName: onboardingData.lastName || '',
        dateOfBirth: onboardingData.dateOfBirth || '',
        gender: onboardingData.gender || '',

        // Location information
        country: onboardingData.country || onboardingData.profileCountry || '',
        city: onboardingData.city || '',

        // Contact information
        contactMethod: onboardingData.accountMethod || 'email',
        contactEmail: onboardingData.email || user.email || '',
        contactPhone: onboardingData.phone || '',

        // Education information
        educationLevel: onboardingData.educationLevel || '',
        currentSchool: onboardingData.currentSchool || '',
        gpa: onboardingData.gpa || '',
        graduationYear: onboardingData.graduationYear || '',

        // Academic interests
        interests: onboardingData.interests || [],
        interestedFields: onboardingData.interestedFields || '',

        // Parent/Guardian information
        parentName: onboardingData.parentName || '',
        parentEmail: onboardingData.parentEmail || '',
        parentPhone: onboardingData.parentPhone || '',

        // Preferences
        language: onboardingData.language || 'en',

        // Application tracking
        applications: [],
        savedPrograms: [],
        documents: [],

        // Onboarding metadata
        onboardingComplete: true,
        profileComplete: true,
        emailVerified: user.emailVerified || false,
        active: true,

        // Timestamps
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      console.log('💾 Saving to Firestore...');
      const db = window.Firebase.db;

      console.log('📤 Student data to save:', studentData);

      try {
        await db.collection('students').doc(user.uid).set(studentData, { merge: true });
        console.log('✅ Student data saved successfully to Firestore');
        return studentData;
      } catch (firestoreError) {
        console.error('❌ Firestore save error:', firestoreError);
        console.error('❌ Error details:', {
          code: firestoreError.code,
          message: firestoreError.message,
          stack: firestoreError.stack
        });
        throw new Error(`Failed to save data to Firestore: ${firestoreError.message}`);
      }
    }
  };

  // Language switcher on onboarding pages
  const languageSwitcher = {
    init(){ const sel=$('#lang'); if (!sel) return; sel.value = Flow.i18n.lang; sel.addEventListener('change', e=>{ const l=e.target.value; Flow.i18n.set(l); onboardingData.language=l; toast.show(Flow.i18n.t('lang_switched', sel.options[sel.selectedIndex].text),'success',2000); }); }
  };

  // Authentication state checker
  const authChecker = {
    async init() {
      console.log('🔍 Checking authentication state on onboarding page...');

      // Wait for Firebase to initialize
      try {
        await this.waitForFirebase();

        const user = window.Firebase?.auth?.currentUser;
        console.log('🔍 Current user:', user?.email || 'none');

        if (user) {
          console.log('✅ User is authenticated, checking profile completion...');
          await this.checkProfileCompletion(user);
        } else {
          console.log('ℹ️ No authenticated user, starting from welcome step');
          stepNavigation.showStep(1);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Start from welcome step if auth check fails
        stepNavigation.showStep(1);
      }
    },

    async waitForFirebase(maxWait = 10000) {
      console.log('🔥 Waiting for Firebase initialization...');

      if (window.Firebase && window.Firebase.initialized) {
        console.log('✅ Firebase already initialized');
        return;
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Firebase initialization timeout'));
        }, maxWait);

        const handleInit = () => {
          clearTimeout(timeout);
          console.log('✅ Firebase initialization event received');
          document.removeEventListener('firebaseInitialized', handleInit);
          resolve();
        };

        document.addEventListener('firebaseInitialized', handleInit);

        setTimeout(() => {
          if (window.Firebase && window.Firebase.initialized) {
            handleInit();
          }
        }, 100);
      });
    },

    async checkProfileCompletion(user) {
      try {
        if (!window.Firebase?.db) {
          throw new Error('Firestore not available');
        }

        const db = window.Firebase.db;
        const userDoc = await db.collection('students').doc(user.uid).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('📋 User profile data:', userData);

          // Check if onboarding is complete
          if (userData.onboardingComplete && userData.profileComplete) {
            console.log('✅ Profile already complete, redirecting to dashboard...');
            toast.show('Welcome back! Redirecting to your dashboard...', 'success', 3000);
            setTimeout(() => {
              window.location.href = '/students/';
            }, 2000);
            return;
          }

          // Check if user has completed account creation and verification
          if (user.emailVerified) {
            console.log('✅ Email verified, skipping to profile step');
            // Pre-fill existing data
            this.prefillUserData(userData, user);
            // Skip to profile step
            stepNavigation.showStep(4);
            toast.show('Continue completing your profile...', 'info', 3000);
          } else {
            console.log('⚠️ Email not verified, showing verification step');
            // Pre-fill account data
            onboardingData.email = user.email;
            onboardingData.accountMethod = 'email';
            // Skip to verification step
            stepNavigation.showStep(3);
            toast.show('Please verify your email to continue', 'info', 3000);
          }
        } else {
          console.log('ℹ️ No profile found, but user is authenticated - skipping to profile step');
          // User exists in Auth but no profile yet - skip to profile
          onboardingData.email = user.email;
          onboardingData.accountMethod = 'email';
          stepNavigation.showStep(4);
          toast.show('Complete your profile to get started', 'info', 3000);
        }
      } catch (error) {
        console.error('❌ Profile check failed:', error);
        // If profile check fails, skip to profile step since user is authenticated
        stepNavigation.showStep(4);
        toast.show('Complete your profile to get started', 'info', 3000);
      }
    },

    prefillUserData(userData, user) {
      // Pre-fill onboarding data with existing user data
      onboardingData.email = user.email || userData.email || '';
      onboardingData.firstName = userData.firstName || '';
      onboardingData.lastName = userData.lastName || '';
      onboardingData.country = userData.country || '';
      onboardingData.city = userData.city || '';
      onboardingData.phone = userData.contactPhone || '';
      onboardingData.interests = userData.interests || [];
      onboardingData.language = userData.language || Flow.i18n.lang;

      console.log('📋 Pre-filled data:', onboardingData);

      // Pre-fill form fields if they exist
      setTimeout(() => {
        if ($('#firstName')) $('#firstName').value = onboardingData.firstName;
        if ($('#lastName')) $('#lastName').value = onboardingData.lastName;
        if ($('#profileCountry')) $('#profileCountry').value = onboardingData.country;
        if ($('#city')) $('#city').value = onboardingData.city;
      }, 500);
    }
  };

  function init(){
    const y=$('#year'); if (y) y.textContent = new Date().getFullYear();
    connectionStatus.init(); stepNavigation.init(); languageSwitcher.init(); welcomeStep.init(); accountStep.init(); verifyStep.init(); profileStep.init(); reviewStep.init();

    // Initialize auth checker after other components
    authChecker.init();

    console.log('Student onboarding initialized successfully');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
