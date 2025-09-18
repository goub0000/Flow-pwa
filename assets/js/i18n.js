/**
 * Flow i18n — multi-page, single-file (no fetch), safe fallbacks
 * Languages: en, fr, ar, sw (+ ha, yo, ig, zu, am fallback to en)
 *
 * Usage in HTML:
 *   data-i18n="key"                      -> sets textContent (or placeholder/value for inputs)
 *   data-i18n-attrs='aria-label:key;...' -> sets attributes (or JSON map)
 *   data-i18n-title="key"                -> sets document.title
 *   data-i18n-html                       -> if present OR value contains '<', innerHTML is used
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // TRANSLATIONS
  // ---------------------------------------------------------------------------
  const translations = {
    // ============================= ENGLISH =============================
    en: {
      // ----- Global / Nav / Chrome -----
      'nav.home': 'Home',
      'nav.students': 'Students',
      'nav.counselors': 'Counselors',
      'nav.parents': 'Parents',
      'nav.institutions': 'Institutions',
      'nav.recommenders': 'Recommenders',
      'nav.messages': 'Messages',
      'nav.getStarted': 'Get Started',
      'nav.studentPortal': 'Student Portal',
      'nav.parentPortal': 'Parent Portal',
      'nav.counselorPortal': 'Counselor Portal',
      'accessibility.skipToContent': 'Skip to content',
      'accessibility.selectLanguage': 'Language',
      'accessibility.toggleMenu': 'Toggle navigation menu',
      'accessibility.mainNav': 'Main navigation',
      'accessibility.breadcrumb': 'Breadcrumb',
      'brand.home': 'Flow home',
      'status.online': 'Online',

      // ----- Auth / Buttons / Common -----
      'auth.signIn': 'Sign In',
      'auth.signUp': 'Sign Up',
      'auth.signOut': 'Sign Out',
      'auth.account': 'Account',
      'btn.continue': 'Continue',
      'btn.save': 'Save',
      'btn.cancel': 'Cancel',
      'btn.submit': 'Submit',
      'btn.close': 'Close',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
      'common.learnMore': 'Learn more',
      'label.new': 'New',

      // ----- Home / Hero -----
      'hero.title': 'Apply once. Track everywhere.',
      'hero.subtitle':
        'One profile to apply to 50+ universities across Africa. Real-time status, documents, messaging, and financial tools.',
      'hero.howItWorks': 'How it works',
      'hero.badge1': 'Multi-institution applications',
      'hero.badge2': 'Offline-friendly workflows',
      'hero.badge3': 'Multi-language',

      // ----- Portal Sections -----
      'portal.students.title': 'Your Gateway to African Universities',
      'portal.students.description': 'Create one profile and apply to 50+ universities across Africa. Track your applications in real-time, manage documents, and get personalized recommendations.',
      'portal.institutions.title': 'Streamline Your Admissions Process',
      'portal.institutions.description': 'Efficiently manage thousands of applications, analyze student data, and make informed admission decisions with our comprehensive institutional platform.',
      'portal.counselors.title': 'Guide Multiple Students to Success',
      'portal.counselors.description': 'Support your students throughout their university application journey with comprehensive tracking, resources, and communication tools designed for education professionals.',
      'portal.parents.title': 'Support Your Child\'s University Journey',
      'portal.parents.description': 'Stay informed and involved in your child\'s university applications while maintaining their independence. Track progress, manage finances, and provide approvals when needed.',
      'portal.recommenders.title': 'Streamlined Recommendation Process',
      'portal.recommenders.description': 'Efficiently manage recommendation requests from your students with secure, user-friendly tools that save time while maintaining the highest standards of confidentiality.',

      // ----- Home / How it works -----
      'howItWorks.title': 'How it works',
      'howItWorks.step1.title': 'Create one profile',
      'howItWorks.step1.desc':
        'Add your personal info, academics, and documents once. Reuse across all applications.',
      'howItWorks.step2.title': 'Discover programs',
      'howItWorks.step2.desc':
        'Filter by country, field, tuition, and scholarships. Save favorites.',
      'howItWorks.step3.title': 'Apply & track',
      'howItWorks.step3.desc':
        'Submit to multiple institutions and track status in real time.',
      'howItWorks.step4.title': 'Collaborate',
      'howItWorks.step4.desc':
        'Invite parents, counselors, and recommenders to support your journey.',

      // ----- Home / Portals -----
      'portals.title': 'Choose your portal',
      'portals.students.title': 'Students',
      'portals.students.desc':
        'Build a single profile, apply to many programs, and track progress. Draft offline; sync when online.',
      'portals.students.feature1': 'Program discovery & recommendations',
      'portals.students.feature2': 'Unified application form',
      'portals.students.feature3': 'Status tracking & messaging',
      'portals.institutions.title': 'Institutions',
      'portals.institutions.desc':
        'Manage applicants, communicate decisions, and analyze trends from a unified dashboard.',
      'portals.institutions.feature1': 'Applicant list & review tools',
      'portals.institutions.feature2': 'Analytics & reporting',
      'portals.institutions.feature3': 'Bulk messaging',
      'portals.counselors.title': 'Counselors',
      'portals.counselors.desc':
        "Track your cohort's progress, manage tasks, and send announcements.",
      'portals.parents.title': 'Parents',
      'portals.parents.desc':
        "View-only access to your child's applications, approvals, and financial planner.",
      'portals.recommenders.title': 'Recommenders',
      'portals.recommenders.desc':
        'Receive requests and securely upload recommendation letters.',
      'portals.committee.title': 'Committee',
      'portals.committee.desc':
        'Metrics and oversight (access controlled). Not visible on public site in production.',
      'portals.openPortal': 'Open portal',

      // ----- Home / Stats, FAQ, Footer -----
      'stats.title': 'Built for Africa. At scale.',
      'stats.universities': 'universities',
      'stats.countries': 'countries',
      'stats.roles': 'roles',
      'stats.multiLanguage': 'Multi-language',
      'stats.languages': 'English • French • Arabic • Swahili',
      'faq.title': 'Frequently Asked Questions',
      'faq.q1.question': 'Is Flow free for students?',
      'faq.q1.answer':
        'Yes, browsing and applying are free. Some institutions may require their standard application fees.',
      'faq.q2.question': 'Can I apply offline?',
      'faq.q2.answer':
        'You can draft applications offline and sync when you reconnect. SMS/USSD features are coming.',
      'faq.q3.question': 'How do recommenders submit letters?',
      'faq.q3.answer':
        'Students send a secure link to recommenders who upload PDFs directly to Flow.',
      'footer.tagline': 'Connecting learners and institutions across Africa.',
      'footer.explore': 'Explore',
      'footer.legal': 'Legal',
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
      'footer.cookies': 'Cookies',
      'footer.ready': 'Ready to get started?',

      // ----- Get Started Modal -----
      'modal.title': 'Create your Flow account',
      'modal.chooseAccountType': 'Choose account type',
      'modal.subtitle': 'Select the option that best describes you',
      'modal.student': 'Student',
      'modal.student.desc':
        'Create a profile, discover programs, apply once, track everywhere.',
      'modal.counselor': 'Counselor',
      'modal.counselor.desc':
        'Support multiple students and track their progress.',
      'modal.parent': 'Parent / Guardian',
      'modal.parent.desc':
        "View your child's progress and approve key steps.",
      'modal.institution': 'Institution',
      'modal.institution.desc':
        'Review applicants, manage programs, analyze metrics.',
      'modal.recommender': 'Recommender',
      'modal.recommender.desc': 'Securely upload recommendation letters.',

      // ----- Messages / Status -----
      'msg.languageChanged': 'Language switched to',
      'msg.offline': 'Working offline — changes will sync when reconnected',
      'msg.online': 'Connection restored',

      // ----- Titles -----
      'page.home': 'Flow — Apply to Multiple Universities with One Profile',
      'page.getStarted': 'Flow — Choose your account type',

      // =======================================================================
      // STUDENT PORTAL (students/index.html)
      // =======================================================================
      'students.breadcrumb.portal': 'Student Portal',
      'students.subnav.aria': 'Student sections',
      'students.subnav.startOnboarding': 'Start Onboarding',
      'students.subnav.dashboard': 'Dashboard',
      'students.subnav.profile': 'Profile',
      'students.subnav.programs': 'Programs',
      'students.subnav.applications': 'Applications',
      'students.subnav.messages': 'Messages',
      'students.subnav.finance': 'Finance',
      'students.subnav.help': 'Help',
      'students.banner.title':
        'Complete your profile to unlock AI-powered program recommendations',
      'students.banner.body':
        'Your profile is <strong>25% complete</strong>. Add academic information and documents to get personalized university suggestions.',
      'students.banner.progressAria': 'Profile completion: 25%',
      'students.banner.progressText': '25% complete',
      'students.banner.ctaContinue': 'Continue Setup',
      'students.dashboard.title': 'Welcome back, Oumarou!',
      'students.dashboard.subtitle': "Here’s what's happening with your applications",
      'students.stats.activeApplications': 'Active Applications',
      'students.stats.pendingTasks': 'Pending Tasks',
      'students.stats.programsSaved': 'Programs Saved',
      'students.stats.feesDue': 'Fees Due',
      'students.apps.title': 'Active Applications',
      'students.apps.manage': 'Manage Applications',
      'status.underReview': 'Under Review',
      'status.draft': 'Draft',
      'status.submitted': 'Submitted',
      'time.updatedOneDayAgo': 'Updated 1 day ago',
      'time.lastEditedFiveDaysAgo': 'Last edited 5 days ago',
      'time.submittedElevenDaysAgo': 'Submitted 11 days ago',
      'students.tasks.title': 'Urgent Tasks',
      'students.tasks.pendingCount': '2 pending',
      'students.tasks.essayTitle': 'Essay Draft Due',
      'students.tasks.essayDesc': 'Personal statement for Abuja Tech Institute',
      'students.tasks.essayDue': 'Due Sept 1, 2025',
      'students.tasks.transcriptTitle': 'Upload Transcript',
      'students.tasks.transcriptDesc': 'Official transcript for École Polytechnique',
      'students.tasks.transcriptDue': 'Due Sept 5, 2025',
      'students.tasks.viewAll': 'View all tasks',
      'students.recs.title': 'AI Recommendations',
      'students.recs.intro':
        'Based on your Computer Science interest and 3.8 GPA, here are programs that match your profile:',
      'students.recs.match95': '95% match',
      'students.recs.match88': '88% match',
      'students.recs.scholarship': 'Scholarship available',
      'students.recs.deadlineOct15': 'Deadline: Oct 15',
      'students.recs.viewAll': 'View All Recommendations',
      'students.messages.title': 'Recent Messages',
      'students.messages.unreadCount': '2 unread',
      'messages.unread': 'Unread message',
      'time.twoHoursAgo': '2 hours ago',
      'time.oneDayAgo': '1 day ago',
      'students.finance.title': 'Financial Overview',
      'students.finance.feesDue': 'Fees Due',
      'students.finance.allPaid': 'All paid',
      'students.finance.appFees': 'Application fees',
      'students.finance.tuition': 'Estimated tuition',
      'students.finance.scholarshipPotential': 'Scholarship potential',
      'students.finance.mobileMoneyTitle': 'Mobile Money Ready',
      'students.finance.mobileMoneyDesc':
        'Pay fees instantly with M-Pesa, MTN MoMo, or Airtel Money',
      'students.finance.manage': 'Manage finances',
      'students.actions.title': 'Quick Actions',
      'students.actions.search.title': 'Search Programs',
      'students.actions.search.desc': 'Find universities and courses',
      'students.actions.upload.title': 'Upload Documents',
      'students.actions.upload.desc': 'Add transcripts and certificates',
      'students.actions.invite.title': 'Invite Recommender',
      'students.actions.invite.desc': 'Request recommendation letters',
      'students.actions.schedule.title': 'Schedule Interview',
      'students.actions.schedule.desc': 'Book admission interviews',
      'footer.students.resources': 'Student Resources',
      'footer.support': 'Support',
      'footer.helpCenter': 'Help Center',
      'footer.contactUs': 'Contact Us',
      'footer.systemStatus': 'System Status',
      'footer.accessibility': 'Accessibility',
      'footer.needHelp': 'Need help?',
      'footer.needHelpDesc': 'Our support team is here to help you succeed.',
      'footer.getSupport': 'Get Support',
      'footer.builtForAfrica': 'Built with ❤️ for Africa.',
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
      'footer.cookies': 'Cookies',

      // =======================================================================
      // STUDENT ONBOARDING (students/onboarding.html)
      // =======================================================================
      // Stepper / breadcrumb / progress
      'students.onboarding.stepper.welcome': 'Welcome',
      'students.onboarding.stepper.createAccount': 'Create Account',
      'students.onboarding.stepper.verify': 'Verify Identity',
      'students.onboarding.stepper.profile': 'Complete Profile',
      'students.onboarding.stepper.review': 'Review & Finish',
      'students.onboarding.progress.text1of5': 'Step 1 of 5',
      'students.onboarding.progress.text2of5': 'Step 2 of 5',
      'students.onboarding.progress.text3of5': 'Step 3 of 5',
      'students.onboarding.progress.text4of5': 'Step 4 of 5',
      'students.onboarding.progress.text5of5': 'Step 5 of 5',
      'students.onboarding.breadcrumb': 'Onboarding',

      // Step 1 — Welcome
      'students.onboarding.welcome.title': 'Welcome to Flow',
      'students.onboarding.welcome.subtitle':
        'Create your account in minutes and start applying to universities across Africa with one profile.',
      'students.onboarding.welcome.card1.title': 'One Profile, Multiple Applications',
      'students.onboarding.welcome.card1.desc':
        'Create your profile once and apply to multiple universities across Africa without repeating information.',
      'students.onboarding.welcome.card2.title': 'Real-time Application Tracking',
      'students.onboarding.welcome.card2.desc':
        'Track your application status in real-time and receive updates from universities directly.',
      'students.onboarding.welcome.card3.title': 'Mobile Money Integration',
      'students.onboarding.welcome.card3.desc':
        'Pay application fees seamlessly with M-Pesa, MTN MoMo, and other African mobile money services.',
      'students.onboarding.welcome.card4.title': 'Offline-First Design',
      'students.onboarding.welcome.card4.desc':
        'Work on your applications even without internet. Changes sync automatically when you reconnect.',
      'students.onboarding.welcome.lang.title': 'Choose your preferred language',
      'students.onboarding.welcome.lang.desc':
        'This will be used for all communications and can be changed later.',
      'students.onboarding.welcome.ctaContinue': 'Continue to Account Setup',
      'students.onboarding.welcome.ctaHaveAccount': 'I already have an account',

      // Step 2 — Account
      'students.onboarding.account.title': 'Create your account',
      'students.onboarding.account.subtitle':
        "Choose how you'd like to sign up. We'll send a verification code to confirm your identity.",
      'students.onboarding.account.method.email': 'Sign up with Email',
      'students.onboarding.account.method.email.rec': 'Recommended for most users',
      'students.onboarding.account.email.label': 'Email address',
      'students.onboarding.account.password.label': 'Password',
      'students.onboarding.account.password.help':
        'Must be at least 8 characters with a number and symbol',
      'students.onboarding.account.confirm.label': 'Confirm password',
      'students.onboarding.account.terms':
        'I agree to the <a href="/legal/terms.html" target="_blank">Terms of Service</a> and <a href="/legal/privacy.html" target="_blank">Privacy Policy</a>',
      'students.onboarding.account.method.phone': 'Sign up with Phone',
      'students.onboarding.account.method.phone.rec': 'Get instant SMS verification',
      'students.onboarding.account.country.label': 'Country',
      'students.onboarding.account.country.placeholder': 'Select your country',
      'students.onboarding.account.phone.label': 'Phone number',
      'students.onboarding.account.phone.help': "We'll send a verification code via SMS",
      'students.onboarding.account.methodSwitch.email': 'Email',
      'students.onboarding.account.methodSwitch.phone': 'Phone',
      'students.onboarding.account.back': 'Back',
      'students.onboarding.account.create': 'Create Account',

      // Step 3 — Verify
      'students.onboarding.verify.title': 'Verify your identity',
      'students.onboarding.verify.subtitle.prefix':
        "We've sent a 6-digit verification code to ",
      'students.onboarding.verify.subtitle.targetEmail': 'your email',
      'students.onboarding.verify.otp.label': 'Enter verification code',
      'students.onboarding.verify.resend': 'Resend code',
      'students.onboarding.verify.changeMethod': 'Change verification method',
      'students.onboarding.verify.waiting': 'Waiting for verification code...',
      'students.onboarding.verify.back': 'Back',
      'students.onboarding.verify.cta': 'Verify & Continue',

      // Step 4 — Profile
      'students.onboarding.profile.title': 'Complete your profile',
      'students.onboarding.profile.subtitle':
        'This information will be used to pre-fill your university applications',
      'students.onboarding.profile.section.personal': 'Personal Information',
      'students.onboarding.profile.firstName': 'First name *',
      'students.onboarding.profile.lastName': 'Last name *',
      'students.onboarding.profile.dob': 'Date of birth *',
      'students.onboarding.profile.gender': 'Gender (optional)',
      'students.onboarding.profile.gender.na': 'Prefer not to say',
      'students.onboarding.profile.gender.male': 'Male',
      'students.onboarding.profile.gender.female': 'Female',
      'students.onboarding.profile.gender.other': 'Other',
      'students.onboarding.profile.country': 'Country of residence *',
      'students.onboarding.profile.country.placeholder': 'Select your country',
      'students.onboarding.profile.city': 'City *',
      'students.onboarding.profile.section.education': 'Education Background',
      'students.onboarding.profile.educLevel': 'Highest education completed *',
      'students.onboarding.profile.educLevel.placeholder': 'Select education level',
      'students.onboarding.profile.educ.secondary': 'Secondary School',
      'students.onboarding.profile.educ.high': 'High School',
      'students.onboarding.profile.educ.ib': 'IB Diploma',
      'students.onboarding.profile.educ.foundation': 'Foundation Program',
      'students.onboarding.profile.educ.diploma': 'Diploma',
      'students.onboarding.profile.educ.bachProg': "Bachelor's (in progress)",
      'students.onboarding.profile.educ.bachelor': "Bachelor's Degree",
      'students.onboarding.profile.educ.master': "Master's Degree",
      'students.onboarding.profile.gpa': 'GPA / Grade average',
      'students.onboarding.profile.gpa.help':
        'Enter your grade average in any format (GPA, percentage, etc.)',
      'students.onboarding.profile.institution': 'Most recent institution',
      'students.onboarding.profile.gradYear': 'Graduation year',
      'students.onboarding.profile.gradYear.placeholder': 'Select year',
      'students.onboarding.profile.field': 'Field of study (if applicable)',
      'students.onboarding.profile.section.interests': 'Academic Interests',
      'students.onboarding.profile.fields': 'Fields of interest *',
      'students.onboarding.profile.fields.help': 'Select one or more fields that interest you',
      'students.onboarding.profile.academicGoals': 'Academic goals & aspirations',
      'students.onboarding.profile.academicGoals.placeholder':
        'Tell us about your academic goals, career aspirations, and what you hope to achieve through higher education...',
      'students.onboarding.profile.academicGoals.help':
        'This will help us provide better program recommendations (optional but recommended)',
      'students.onboarding.profile.back': 'Back',
      'students.onboarding.profile.save': 'Save & Continue',

      // Step 5 — Review
      'students.onboarding.review.title': 'Review & finish setup',
      'students.onboarding.review.subtitle':
        'Please review your information before completing the onboarding process',
      'students.onboarding.review.accountInfo': 'Account Information',
      'students.onboarding.review.profileInfo': 'Profile Information',
      'students.onboarding.review.edit': 'Edit',
      'students.onboarding.review.contact': 'Email / Phone:',
      'students.onboarding.review.language': 'Language:',
      'students.onboarding.review.verification': 'Verification:',
      'students.onboarding.review.verified': 'Verified',
      'students.onboarding.review.name': 'Name:',
      'students.onboarding.review.location': 'Location:',
      'students.onboarding.review.education': 'Education:',
      'students.onboarding.review.interests': 'Interests:',
      'students.onboarding.review.next.title': 'What happens next?',
      'students.onboarding.review.next.recs.title': 'Get AI-powered recommendations',
      'students.onboarding.review.next.recs.desc':
        "We'll analyze your profile and suggest relevant programs",
      'students.onboarding.review.next.browse.title': 'Browse university programs',
      'students.onboarding.review.next.browse.desc': 'Explore 50+ universities across Africa',
      'students.onboarding.review.next.apply.title': 'Start applying',
      'students.onboarding.review.next.apply.desc':
        'Use your profile to apply to multiple universities at once',
      'students.onboarding.review.back': 'Back',
      'students.onboarding.review.finish': 'Complete Setup & Go to Dashboard'
    },

    // ============================= FRENCH =============================
    fr: {
      // Global
      'nav.home': 'Accueil',
      'nav.students': 'Étudiants',
      'nav.counselors': 'Conseillers',
      'nav.parents': 'Parents',
      'nav.institutions': 'Institutions',
      'nav.recommenders': 'Référenceurs',
      'nav.messages': 'Messages',
      'nav.getStarted': 'Commencer',
      'nav.studentPortal': "Portail de l'étudiant",
      'nav.parentPortal': 'Portail des parents',
      'nav.counselorPortal': 'Portail du conseiller',
      'accessibility.skipToContent': 'Aller au contenu',
      'accessibility.selectLanguage': 'Langue',
      'accessibility.toggleMenu': 'Basculer le menu',
      'accessibility.mainNav': 'Navigation principale',
      'accessibility.breadcrumb': "Fil d’Ariane",
      'brand.home': 'Accueil de Flow',
      'status.online': 'En ligne',
      'auth.signIn': 'Se connecter',
      'auth.signUp': 'S\'inscrire',
      'auth.signOut': 'Se déconnecter',
      'auth.account': 'Compte',
      'btn.continue': 'Continuer',
      'btn.save': 'Enregistrer',
      'btn.cancel': 'Annuler',
      'btn.submit': 'Envoyer',
      'btn.close': 'Fermer',
      'common.loading': 'Chargement…',
      'common.error': 'Une erreur est survenue',
      'common.success': 'Succès',
      'common.learnMore': 'En savoir plus',
      'label.new': 'Nouveau',

      // Home / Hero
      'hero.title': 'Postulez une fois. Suivez partout.',
      'hero.subtitle':
        'Un seul profil pour candidater à 50+ universités en Afrique. Suivi en temps réel, documents, messagerie et outils financiers.',
      'hero.howItWorks': 'Comment ça marche',
      'hero.badge1': 'Candidatures multi-institutions',
      'hero.badge2': 'Fonctionne hors-ligne',
      'hero.badge3': 'Multilingue',

      // ----- Portal Sections -----
      'portal.students.title': 'Votre Passerelle vers les Universités Africaines',
      'portal.students.description': 'Créez un profil unique et postulez à plus de 50 universités en Afrique. Suivez vos candidatures en temps réel, gérez vos documents et obtenez des recommandations personnalisées.',
      'portal.institutions.title': 'Optimisez votre Processus d\'Admission',
      'portal.institutions.description': 'Gérez efficacement des milliers de candidatures, analysez les données des étudiants et prenez des décisions d\'admission éclairées avec notre plateforme institutionnelle complète.',
      'portal.counselors.title': 'Guidez Plusieurs Étudiants vers le Succès',
      'portal.counselors.description': 'Accompagnez vos étudiants tout au long de leur parcours de candidature universitaire avec des outils complets de suivi, de ressources et de communication conçus pour les professionnels de l\'éducation.',
      'portal.parents.title': 'Accompagnez le Parcours Universitaire de votre Enfant',
      'portal.parents.description': 'Restez informé et impliqué dans les candidatures universitaires de votre enfant tout en préservant son indépendance. Suivez les progrès, gérez les finances et donnez votre approbation quand nécessaire.',
      'portal.recommenders.title': 'Processus de Recommandation Optimisé',
      'portal.recommenders.description': 'Gérez efficacement les demandes de recommandation de vos étudiants avec des outils sécurisés et conviviaux qui font gagner du temps tout en maintenant les plus hauts standards de confidentialité.',

      // Home / How it works
      'howItWorks.title': 'Comment ça marche',
      'howItWorks.step1.title': 'Créez un profil unique',
      'howItWorks.step1.desc':
        'Ajoutez vos informations, vos études et vos documents une seule fois. Réutilisez-les partout.',
      'howItWorks.step2.title': 'Découvrez des programmes',
      'howItWorks.step2.desc':
        'Filtrez par pays, domaine, frais et bourses. Enregistrez vos favoris.',
      'howItWorks.step3.title': 'Postulez & suivez',
      'howItWorks.step3.desc':
        'Soumettez à plusieurs institutions et suivez le statut en temps réel.',
      'howItWorks.step4.title': 'Collaborez',
      'howItWorks.step4.desc':
        'Invitez parents, conseillers et référenceurs à vous accompagner.',

      // Home / Portals
      'portals.title': 'Choisissez votre portail',
      'portals.students.title': 'Étudiants',
      'portals.students.desc':
        'Un profil unique, plusieurs candidatures, suivi du progrès. Rédigez hors-ligne ; synchronisez en ligne.',
      'portals.students.feature1': 'Découverte & recommandations',
      'portals.students.feature2': 'Formulaire unifié',
      'portals.students.feature3': 'Suivi & messagerie',
      'portals.institutions.title': 'Institutions',
      'portals.institutions.desc':
        'Gérez les candidats, communiquez les décisions et analysez les tendances depuis un tableau de bord unifié.',
      'portals.institutions.feature1': 'Liste & outils d’évaluation',
      'portals.institutions.feature2': 'Analytique & rapports',
      'portals.institutions.feature3': 'Messagerie de masse',
      'portals.counselors.title': 'Conseillers',
      'portals.counselors.desc':
        "Suivez l'avancement de votre cohorte, gérez les tâches et envoyez des annonces.",
      'portals.parents.title': 'Parents',
      'portals.parents.desc':
        'Accès en lecture seule aux dossiers, validations et plan financier de votre enfant.',
      'portals.recommenders.title': 'Référenceurs',
      'portals.recommenders.desc':
        'Recevez des demandes et téléversez des lettres de recommandation en toute sécurité.',
      'portals.committee.title': 'Comité',
      'portals.committee.desc':
        'Métriques et supervision (accès contrôlé). Non visible en production.',
      'portals.openPortal': 'Ouvrir le portail',

      // Home / Stats, FAQ, Footer
      'stats.title': "Conçu pour l'Afrique. À l'échelle.",
      'stats.universities': 'universités',
      'stats.countries': 'pays',
      'stats.roles': 'rôles',
      'stats.multiLanguage': 'Multilingue',
      'stats.languages': 'Anglais • Français • Arabe • Swahili',
      'faq.title': 'Foire aux questions',
      'faq.q1.question': 'Flow est-il gratuit pour les étudiants ?',
      'faq.q1.answer':
        'Oui, explorer et postuler est gratuit. Certaines institutions peuvent demander leurs frais standard.',
      'faq.q2.question': 'Puis-je postuler hors-ligne ?',
      'faq.q2.answer':
        'Vous pouvez rédiger hors-ligne et synchroniser à la reconnexion. SMS/USSD arrivent.',
      'faq.q3.question': 'Comment les référenceurs envoient-ils les lettres ?',
      'faq.q3.answer':
        'Les étudiants envoient un lien sécurisé; les référenceurs téléversent le PDF directement sur Flow.',
      'footer.tagline': 'Relier les apprenants et les institutions à travers l’Afrique.',
      'footer.explore': 'Explorer',
      'footer.legal': 'Mentions légales',
      'footer.terms': 'Conditions',
      'footer.privacy': 'Confidentialité',
      'footer.cookies': 'Cookies',
      'footer.ready': 'Prêt à commencer ?',

      // Modal
      'modal.title': 'Créez votre compte Flow',
      'modal.chooseAccountType': 'Choisissez le type de compte',
      'modal.subtitle': 'Sélectionnez l’option qui vous décrit le mieux',
      'modal.student': 'Étudiant',
      'modal.student.desc':
        'Créez un profil, découvrez des programmes, postulez une fois, suivez partout.',
      'modal.counselor': 'Conseiller',
      'modal.counselor.desc': 'Accompagnez plusieurs étudiants et suivez leur progression.',
      'modal.parent': 'Parent / Tuteur',
      'modal.parent.desc': 'Consultez l’avancement de votre enfant et validez les étapes clés.',
      'modal.institution': 'Institution',
      'modal.institution.desc': 'Examinez les candidatures, gérez les programmes, analysez les métriques.',
      'modal.recommender': 'Référenceur',
      'modal.recommender.desc': 'Téléversez en toute sécurité des lettres de recommandation.',
      'msg.languageChanged': 'Langue changée en',
      'msg.offline': 'Mode hors-ligne — les changements seront synchronisés à la reconnexion',
      'msg.online': 'Connexion rétablie',
      'page.home': 'Flow — Candidature multi-universités avec un seul profil',
      'page.getStarted': 'Flow — Choisissez votre type de compte',

      // Student Portal
      'students.breadcrumb.portal': 'Portail Étudiant',
      'students.subnav.aria': 'Sections pour étudiants',
      'students.subnav.startOnboarding': "Commencer l’accueil",
      'students.subnav.dashboard': 'Tableau de bord',
      'students.subnav.profile': 'Profil',
      'students.subnav.programs': 'Programmes',
      'students.subnav.applications': 'Candidatures',
      'students.subnav.messages': 'Messages',
      'students.subnav.finance': 'Finances',
      'students.subnav.help': 'Aide',
      'students.banner.title':
        'Complétez votre profil pour débloquer des recommandations de programmes par IA',
      'students.banner.body':
        'Votre profil est <strong>complété à 25 %</strong>. Ajoutez des informations académiques et des documents pour obtenir des suggestions personnalisées.',
      'students.banner.progressAria': 'Progression du profil : 25 %',
      'students.banner.progressText': '25 % terminé',
      'students.banner.ctaContinue': 'Continuer la configuration',
      'students.dashboard.title': 'Bon retour, Oumarou !',
      'students.dashboard.subtitle': 'Voici l’état de vos candidatures',
      'students.stats.activeApplications': 'Candidatures actives',
      'students.stats.pendingTasks': 'Tâches en attente',
      'students.stats.programsSaved': 'Programmes enregistrés',
      'students.stats.feesDue': 'Frais dus',
      'students.apps.title': 'Candidatures actives',
      'students.apps.manage': 'Gérer les candidatures',
      'status.underReview': 'En cours d’examen',
      'status.draft': 'Brouillon',
      'status.submitted': 'Soumise',
      'time.updatedOneDayAgo': 'Mis à jour il y a 1 jour',
      'time.lastEditedFiveDaysAgo': 'Modifié il y a 5 jours',
      'time.submittedElevenDaysAgo': 'Soumise il y a 11 jours',
      'students.tasks.title': 'Tâches urgentes',
      'students.tasks.pendingCount': '2 en attente',
      'students.tasks.essayTitle': 'Brouillon d’essai à rendre',
      'students.tasks.essayDesc': 'Lettre personnelle pour Abuja Tech Institute',
      'students.tasks.essayDue': 'Échéance : 1 sept. 2025',
      'students.tasks.transcriptTitle': 'Téléverser le relevé de notes',
      'students.tasks.transcriptDesc': 'Relevé officiel pour École Polytechnique',
      'students.tasks.transcriptDue': 'Échéance : 5 sept. 2025',
      'students.tasks.viewAll': 'Voir toutes les tâches',
      'students.recs.title': 'Recommandations IA',
      'students.recs.intro':
        'Selon votre intérêt pour l’informatique et une moyenne de 3,8, voici des programmes adaptés :',
      'students.recs.match95': 'Correspondance 95 %',
      'students.recs.match88': 'Correspondance 88 %',
      'students.recs.scholarship': 'Bourse disponible',
      'students.recs.deadlineOct15': 'Date limite : 15 oct.',
      'students.recs.viewAll': 'Voir toutes les recommandations',
      'students.messages.title': 'Messages récents',
      'students.messages.unreadCount': '2 non lus',
      'messages.unread': 'Message non lu',
      'time.twoHoursAgo': 'Il y a 2 heures',
      'time.oneDayAgo': 'Il y a 1 jour',
      'students.finance.title': 'Vue financière',
      'students.finance.feesDue': 'Frais dus',
      'students.finance.allPaid': 'Tout est payé',
      'students.finance.appFees': 'Frais de candidature',
      'students.finance.tuition': 'Frais de scolarité estimés',
      'students.finance.scholarshipPotential': 'Potentiel de bourse',
      'students.finance.mobileMoneyTitle': 'Paiement mobile prêt',
      'students.finance.mobileMoneyDesc':
        'Payez instantanément avec M-Pesa, MTN MoMo ou Airtel Money',
      'students.finance.manage': 'Gérer les finances',
      'students.actions.title': 'Actions rapides',
      'students.actions.search.title': 'Rechercher des programmes',
      'students.actions.search.desc': 'Trouver universités et cours',
      'students.actions.upload.title': 'Téléverser des documents',
      'students.actions.upload.desc': 'Ajouter relevés et certificats',
      'students.actions.invite.title': 'Inviter un recommandant',
      'students.actions.invite.desc': 'Demander des lettres de recommandation',
      'students.actions.schedule.title': 'Planifier un entretien',
      'students.actions.schedule.desc': "Réserver des entretiens d’admission",
      'footer.students.resources': 'Ressources étudiant',
      'footer.support': 'Assistance',
      'footer.helpCenter': 'Centre d’aide',
      'footer.contactUs': 'Nous contacter',
      'footer.systemStatus': 'État du système',
      'footer.accessibility': 'Accessibilité',
      'footer.needHelp': 'Besoin d’aide ?',
      'footer.needHelpDesc': 'Notre équipe d’assistance est là pour vous.',
      'footer.getSupport': 'Obtenir de l’aide',
      'footer.builtForAfrica': 'Créé avec ❤️ pour l’Afrique.',
      'footer.terms': 'Conditions',
      'footer.privacy': 'Confidentialité',
      'footer.cookies': 'Cookies',

      // Onboarding
      'students.onboarding.stepper.welcome': 'Bienvenue',
      'students.onboarding.stepper.createAccount': 'Créer le compte',
      'students.onboarding.stepper.verify': "Vérifier l’identité",
      'students.onboarding.stepper.profile': 'Compléter le profil',
      'students.onboarding.stepper.review': 'Relire et terminer',
      'students.onboarding.progress.text1of5': 'Étape 1 sur 5',
      'students.onboarding.progress.text2of5': 'Étape 2 sur 5',
      'students.onboarding.progress.text3of5': 'Étape 3 sur 5',
      'students.onboarding.progress.text4of5': 'Étape 4 sur 5',
      'students.onboarding.progress.text5of5': 'Étape 5 sur 5',
      'students.onboarding.breadcrumb': 'Accueil',
      'students.onboarding.welcome.title': 'Bienvenue sur Flow',
      'students.onboarding.welcome.subtitle':
        'Créez votre compte en quelques minutes et postulez aux universités d’Afrique avec un seul profil.',
      'students.onboarding.welcome.card1.title': 'Un profil, plusieurs candidatures',
      'students.onboarding.welcome.card1.desc':
        'Créez votre profil une fois et postulez à plusieurs universités sans répéter les informations.',
      'students.onboarding.welcome.card2.title': 'Suivi en temps réel',
      'students.onboarding.welcome.card2.desc':
        'Suivez le statut de votre candidature et recevez les mises à jour des universités.',
      'students.onboarding.welcome.card3.title': 'Intégration au paiement mobile',
      'students.onboarding.welcome.card3.desc':
        'Payez facilement avec M-Pesa, MTN MoMo et d’autres services africains.',
      'students.onboarding.welcome.card4.title': 'Conçu hors-ligne d’abord',
      'students.onboarding.welcome.card4.desc':
        'Travaillez même sans internet. Les changements se synchronisent automatiquement.',
      'students.onboarding.welcome.lang.title': 'Choisissez votre langue préférée',
      'students.onboarding.welcome.lang.desc':
        'Elle sera utilisée pour les communications et peut être modifiée plus tard.',
      'students.onboarding.welcome.ctaContinue':
        'Continuer vers la configuration du compte',
      'students.onboarding.welcome.ctaHaveAccount': 'J’ai déjà un compte',
      'students.onboarding.account.title': 'Créez votre compte',
      'students.onboarding.account.subtitle':
        "Choisissez votre méthode d’inscription. Nous enverrons un code pour confirmer votre identité.",
      'students.onboarding.account.method.email': 'S’inscrire avec e-mail',
      'students.onboarding.account.method.email.rec':
        'Recommandé pour la plupart des utilisateurs',
      'students.onboarding.account.email.label': 'Adresse e-mail',
      'students.onboarding.account.password.label': 'Mot de passe',
      'students.onboarding.account.password.help':
        'Au moins 8 caractères avec un chiffre et un symbole',
      'students.onboarding.account.confirm.label': 'Confirmer le mot de passe',
      'students.onboarding.account.terms':
        'J’accepte les <a href="/legal/terms.html" target="_blank">Conditions</a> et la <a href="/legal/privacy.html" target="_blank">Confidentialité</a>',
      'students.onboarding.account.method.phone': 'S’inscrire avec téléphone',
      'students.onboarding.account.method.phone.rec': 'Vérification SMS instantanée',
      'students.onboarding.account.country.label': 'Pays',
      'students.onboarding.account.country.placeholder': 'Sélectionnez votre pays',
      'students.onboarding.account.phone.label': 'Numéro de téléphone',
      'students.onboarding.account.phone.help': 'Nous enverrons un code par SMS',
      'students.onboarding.account.methodSwitch.email': 'E-mail',
      'students.onboarding.account.methodSwitch.phone': 'Téléphone',
      'students.onboarding.account.back': 'Retour',
      'students.onboarding.account.create': 'Créer le compte',
      'students.onboarding.verify.title': 'Vérifiez votre identité',
      'students.onboarding.verify.subtitle.prefix': 'Nous avons envoyé un code à 6 chiffres à ',
      'students.onboarding.verify.subtitle.targetEmail': 'votre e-mail',
      'students.onboarding.verify.otp.label': 'Saisir le code de vérification',
      'students.onboarding.verify.resend': 'Renvoyer le code',
      'students.onboarding.verify.changeMethod': 'Changer de méthode',
      'students.onboarding.verify.waiting': 'En attente du code…',
      'students.onboarding.verify.back': 'Retour',
      'students.onboarding.verify.cta': 'Vérifier et continuer',
      'students.onboarding.profile.title': 'Complétez votre profil',
      'students.onboarding.profile.subtitle':
        'Ces informations serviront à préremplir vos candidatures',
      'students.onboarding.profile.section.personal': 'Informations personnelles',
      'students.onboarding.profile.firstName': 'Prénom *',
      'students.onboarding.profile.lastName': 'Nom *',
      'students.onboarding.profile.dob': 'Date de naissance *',
      'students.onboarding.profile.gender': 'Genre (facultatif)',
      'students.onboarding.profile.gender.na': 'Préférer ne pas préciser',
      'students.onboarding.profile.gender.male': 'Homme',
      'students.onboarding.profile.gender.female': 'Femme',
      'students.onboarding.profile.gender.other': 'Autre',
      'students.onboarding.profile.country': 'Pays de résidence *',
      'students.onboarding.profile.country.placeholder': 'Sélectionnez votre pays',
      'students.onboarding.profile.city': 'Ville *',
      'students.onboarding.profile.section.education': 'Parcours académique',
      'students.onboarding.profile.educLevel': 'Plus haut niveau atteint *',
      'students.onboarding.profile.educLevel.placeholder': 'Choisissez un niveau',
      'students.onboarding.profile.educ.secondary': 'Collège',
      'students.onboarding.profile.educ.high': 'Lycée',
      'students.onboarding.profile.educ.ib': 'Diplôme IB',
      'students.onboarding.profile.educ.foundation': 'Programme préparatoire',
      'students.onboarding.profile.educ.diploma': 'Diplôme',
      'students.onboarding.profile.educ.bachProg': 'Licence (en cours)',
      'students.onboarding.profile.educ.bachelor': 'Licence',
      'students.onboarding.profile.educ.master': 'Master',
      'students.onboarding.profile.gpa': 'Moyenne / GPA',
      'students.onboarding.profile.gpa.help':
        'Saisissez votre moyenne (GPA, pourcentage, etc.)',
      'students.onboarding.profile.institution': 'Établissement le plus récent',
      'students.onboarding.profile.gradYear': 'Année de diplomation',
      'students.onboarding.profile.gradYear.placeholder': 'Choisir une année',
      'students.onboarding.profile.field': 'Domaine d’études (le cas échéant)',
      'students.onboarding.profile.section.interests': 'Centres d’intérêt académiques',
      'students.onboarding.profile.fields': "Domaines d'intérêt *",
      'students.onboarding.profile.fields.help': 'Sélectionnez un ou plusieurs domaines',
      'students.onboarding.profile.academicGoals': 'Objectifs et ambitions académiques',
      'students.onboarding.profile.academicGoals.placeholder':
        'Parlez-nous de vos objectifs, de votre carrière visée, etc.',
      'students.onboarding.profile.academicGoals.help':
        'Aide à fournir de meilleures recommandations (facultatif)',
      'students.onboarding.profile.back': 'Retour',
      'students.onboarding.profile.save': 'Enregistrer et continuer',
      'students.onboarding.review.title': 'Relire et terminer',
      'students.onboarding.review.subtitle':
        'Veuillez vérifier vos informations avant de terminer le processus',
      'students.onboarding.review.accountInfo': 'Informations du compte',
      'students.onboarding.review.profileInfo': 'Informations du profil',
      'students.onboarding.review.edit': 'Modifier',
      'students.onboarding.review.contact': 'E-mail / Téléphone :',
      'students.onboarding.review.language': 'Langue :',
      'students.onboarding.review.verification': 'Vérification :',
      'students.onboarding.review.verified': 'Vérifié',
      'students.onboarding.review.name': 'Nom :',
      'students.onboarding.review.location': 'Localisation :',
      'students.onboarding.review.education': 'Études :',
      'students.onboarding.review.interests': 'Intérêts :',
      'students.onboarding.review.next.title': 'Et ensuite ?',
      'students.onboarding.review.next.recs.title': 'Recevez des recommandations IA',
      'students.onboarding.review.next.recs.desc':
        'Nous analyserons votre profil pour suggérer des programmes',
      'students.onboarding.review.next.browse.title': 'Parcourir les programmes',
      'students.onboarding.review.next.browse.desc': 'Découvrez 50+ universités en Afrique',
      'students.onboarding.review.next.apply.title': 'Commencer à postuler',
      'students.onboarding.review.next.apply.desc':
        'Utilisez votre profil pour postuler à plusieurs universités',
      'students.onboarding.review.back': 'Retour',
      'students.onboarding.review.finish': 'Terminer et aller au Tableau de bord'
    },

    // ============================= ARABIC =============================
    ar: {
      // Global (subset + core for onboarding/portal; rest fall back to EN)
      'nav.home': 'الرئيسية',
      'nav.students': 'الطلاب',
      'nav.counselors': 'المرشدون',
      'nav.parents': 'أولياء الأمور',
      'nav.institutions': 'المؤسسات',
      'nav.recommenders': 'الموصّون',
      'nav.getStarted': 'ابدأ',
      'auth.signIn': 'تسجيل الدخول',
      'auth.signUp': 'إنشاء حساب',
      'status.online': 'متصل',
      'accessibility.selectLanguage': 'اللغة',
      'accessibility.skipToContent': 'انتقل إلى المحتوى',

      // Student Portal (high-visibility strings)
      'students.breadcrumb.portal': 'بوابة الطالب',
      'students.subnav.aria': 'أقسام الطالب',
      'students.subnav.startOnboarding': 'ابدأ الإعداد',
      'students.subnav.dashboard': 'لوحة التحكم',
      'students.subnav.profile': 'الملف الشخصي',
      'students.subnav.programs': 'البرامج',
      'students.subnav.applications': 'الطلبات',
      'students.subnav.messages': 'الرسائل',
      'students.subnav.finance': 'المالية',
      'students.subnav.help': 'المساعدة',
      'students.banner.title':
        'أكمل ملفك لفتح توصيات البرامج المدعومة بالذكاء الاصطناعي',
      'students.banner.body':
        'ملفك <strong>مكتمل بنسبة 25%</strong>. أضف معلومات أكاديمية ومستندات للحصول على اقتراحات مخصّصة.',
      'students.banner.progressAria': 'اكتمال الملف: 25%',
      'students.banner.progressText': '25% مكتمل',
      'students.banner.ctaContinue': 'متابعة الإعداد',
      'students.dashboard.title': 'مرحبًا بعودتك يا عمارو!',
      'students.dashboard.subtitle': 'هذا ما يحدث في طلباتك',
      'students.stats.activeApplications': 'طلبات نشطة',
      'students.stats.pendingTasks': 'مهام معلّقة',
      'students.stats.programsSaved': 'برامج محفوظة',
      'students.stats.feesDue': 'رسوم مستحقة',
      'status.underReview': 'قيد المراجعة',
      'status.draft': 'مسودة',
      'status.submitted': 'مقدَّم',
      'students.tasks.title': 'مهام عاجلة',
      'students.tasks.pendingCount': '٢ معلّقة',
      'students.recs.title': 'توصيات الذكاء الاصطناعي',
      'students.recs.viewAll': 'عرض كل التوصيات',
      'students.messages.title': 'رسائل حديثة',
      'students.finance.title': 'نظرة مالية',
      'students.actions.title': 'إجراءات سريعة',

      // Onboarding
      'students.onboarding.stepper.welcome': 'مرحبًا',
      'students.onboarding.stepper.createAccount': 'إنشاء حساب',
      'students.onboarding.stepper.verify': 'التحقق من الهوية',
      'students.onboarding.stepper.profile': 'إكمال الملف',
      'students.onboarding.stepper.review': 'المراجعة والإنهاء',
      'students.onboarding.progress.text1of5': 'الخطوة 1 من 5',
      'students.onboarding.progress.text2of5': 'الخطوة 2 من 5',
      'students.onboarding.progress.text3of5': 'الخطوة 3 من 5',
      'students.onboarding.progress.text4of5': 'الخطوة 4 من 5',
      'students.onboarding.progress.text5of5': 'الخطوة 5 من 5',
      'students.onboarding.breadcrumb': 'البدء',
      'students.onboarding.welcome.title': 'مرحبًا بك في فلو',
      'students.onboarding.welcome.subtitle':
        'أنشئ حسابك خلال دقائق وابدأ التقديم إلى جامعات أفريقيا بملف واحد.',
      'students.onboarding.welcome.lang.title': 'اختر لغتك المفضّلة',
      'students.onboarding.welcome.lang.desc': 'ستُستخدم في جميع التواصل ويمكن تغييرها لاحقًا.',
      'students.onboarding.welcome.ctaContinue': 'المتابعة إلى إعداد الحساب',
      'students.onboarding.welcome.ctaHaveAccount': 'لدي حساب بالفعل',
      'students.onboarding.account.title': 'أنشئ حسابك',
      'students.onboarding.account.subtitle':
        'اختر طريقة التسجيل. سنرسل رمز تحقق لتأكيد هويتك.',
      'students.onboarding.account.method.email': 'التسجيل بالبريد الإلكتروني',
      'students.onboarding.account.method.phone': 'التسجيل بالهاتف',
      'students.onboarding.account.country.label': 'الدولة',
      'students.onboarding.account.country.placeholder': 'اختر دولتك',
      'students.onboarding.account.phone.label': 'رقم الهاتف',
      'students.onboarding.account.back': 'رجوع',
      'students.onboarding.account.create': 'إنشاء الحساب',
      'students.onboarding.verify.title': 'تحقق من هويتك',
      'students.onboarding.verify.otp.label': 'أدخل رمز التحقق',
      'students.onboarding.verify.resend': 'إعادة الإرسال',
      'students.onboarding.verify.changeMethod': 'تغيير طريقة التحقق',
      'students.onboarding.verify.back': 'رجوع',
      'students.onboarding.verify.cta': 'تحقق وتابع',
      'students.onboarding.profile.title': 'أكمل ملفك',
      'students.onboarding.profile.back': 'رجوع',
      'students.onboarding.profile.save': 'حفظ ومتابعة',
      'students.onboarding.review.title': 'المراجعة وإكمال الإعداد',
      'students.onboarding.review.back': 'رجوع',
      'students.onboarding.review.finish': 'إكمال والانتقال للوحة التحكم'
    },

    // ============================= SWAHILI =============================
    sw: {
      // Global (subset)
      'nav.home': 'Nyumbani',
      'nav.students': 'Wanafunzi',
      'nav.counselors': 'Washauri',
      'nav.parents': 'Wazazi',
      'nav.institutions': 'Taasisisi',
      'nav.recommenders': 'Wapendekeza',
      'nav.getStarted': 'Anza',
      'auth.signIn': 'Ingia',
      'auth.signUp': 'Jisajili',
      'status.online': 'Mtandaoni',
      'accessibility.selectLanguage': 'Lugha',
      'accessibility.skipToContent': 'Ruka hadi maudhui',

      // Student Portal (subset)
      'students.breadcrumb.portal': 'Kituo cha Mwanafunzi',
      'students.subnav.aria': 'Sehemu za mwanafunzi',
      'students.subnav.startOnboarding': 'Anza Usajili',
      'students.subnav.dashboard': 'Dashibodi',
      'students.subnav.profile': 'Wasifu',
      'students.subnav.programs': 'Programu',
      'students.subnav.applications': 'Maombi',
      'students.subnav.messages': 'Ujumbe',
      'students.subnav.finance': 'Fedha',
      'students.subnav.help': 'Msaada',
      'students.banner.title':
        'Kamilisha wasifu wako ili kupata mapendekezo ya programu yanayotumia AI',
      'students.banner.body':
        'Wasifu wako umekamilika kwa <strong>25%</strong>. Ongeza taarifa za masomo na nyaraka ili kupata mapendekezo binafsi.',
      'students.banner.progressAria': 'Ukamilifu wa wasifu: 25%',
      'students.banner.progressText': '25% kumaliza',
      'students.banner.ctaContinue': 'Endelea Kuseti',
      'students.dashboard.title': 'Karibu tena, Oumarou!',
      'students.dashboard.subtitle': 'Hivi ndivyo hali ya maombi yako',

      'students.stats.activeApplications': 'Maombi yanayoendelea',
      'students.stats.pendingTasks': 'Kazi zinazosubiri',
      'students.stats.programsSaved': 'Programu Zimehifadhiwa',
      'students.stats.feesDue': 'Ada Zinazodaiwa',
      'status.underReview': 'Inapitiwa',
      'status.draft': 'Rasimu',
      'status.submitted': 'Imewasilishwa',
      'students.tasks.title': 'Kazi za Haraka',
      'students.tasks.pendingCount': '2 zinangoja',
      'students.recs.title': 'Mapendekezo ya AI',
      'students.recs.viewAll': 'Tazama Mapendekezo Yote',
      'students.messages.title': 'Ujumbe wa Hivi Karibuni',
      'students.finance.title': 'Muhtasari wa Fedha',
      'students.actions.title': 'Vitendo vya Haraka',

      // Onboarding (subset)
      'students.onboarding.stepper.welcome': 'Karibu',
      'students.onboarding.stepper.createAccount': 'Unda Akaunti',
      'students.onboarding.stepper.verify': 'Thibitisha Utambulisho',
      'students.onboarding.stepper.profile': 'Kamilisha Wasifu',
      'students.onboarding.stepper.review': 'Kagua & Maliza',
      'students.onboarding.progress.text1of5': 'Hatua 1 kati ya 5',
      'students.onboarding.progress.text2of5': 'Hatua 2 kati ya 5',
      'students.onboarding.progress.text3of5': 'Hatua 3 kati ya 5',
      'students.onboarding.progress.text4of5': 'Hatua 4 kati ya 5',
      'students.onboarding.progress.text5of5': 'Hatua 5 kati ya 5',
      'students.onboarding.breadcrumb': 'Usajili',
      'students.onboarding.welcome.title': 'Karibu kwenye Flow',
      'students.onboarding.welcome.subtitle':
        'Unda akaunti yako kwa dakika chache na anza kuomba vyuo barani Afrika kwa wasifu mmoja.',
      'students.onboarding.welcome.lang.title': 'Chagua lugha unayopendelea',
      'students.onboarding.welcome.lang.desc': 'Itatumika katika mawasiliano na unaweza kubadilisha baadaye.',
      'students.onboarding.welcome.ctaContinue': 'Endelea kwa Kuunda Akaunti',
      'students.onboarding.welcome.ctaHaveAccount': 'Nina akaunti tayari',
      'students.onboarding.account.title': 'Unda akaunti yako',
      'students.onboarding.account.subtitle':
        'Chagua jinsi ya kujisajili. Tutatuma msimbo wa uthibitisho.',
      'students.onboarding.verify.title': 'Thibitisha utambulisho wako',
      'students.onboarding.verify.otp.label': 'Ingiza msimbo wa uthibitisho',
      'students.onboarding.verify.resend': 'Tuma tena',
      'students.onboarding.verify.changeMethod': 'Badili njia ya uthibitisho',
      'students.onboarding.verify.back': 'Rudi',
      'students.onboarding.verify.cta': 'Thibitisha & Endelea',
      'students.onboarding.profile.title': 'Kamilisha wasifu wako',
      'students.onboarding.profile.back': 'Rudi',
      'students.onboarding.profile.save': 'Hifadhi & Endelea',
      'students.onboarding.review.title': 'Kagua na maliza',
      'students.onboarding.review.back': 'Rudi',
      'students.onboarding.review.finish': 'Kamilisha & Nenda kwenye Dashibodi'
    },

    // ============================= FALLBACK-ONLY PACKS =============================
    ha: {}, yo: {}, ig: {}, zu: {}, am: {}
  };

  // ---------------------------------------------------------------------------
  // STATE / CONFIG
  // ---------------------------------------------------------------------------
  let currentLanguage = 'en';
  const supportedLanguages = ['en', 'fr', 'ar', 'sw', 'ha', 'yo', 'ig', 'zu', 'am'];
  const rtlLanguages = ['ar'];

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  // Return translation or null (never the raw key). Falls back to English.
  function t(key, params = {}) {
    const pack = translations[currentLanguage] || {};
    const en = translations.en;
    let value = (pack && Object.prototype.hasOwnProperty.call(pack, key)) ? pack[key] : undefined;
    if (value == null && Object.prototype.hasOwnProperty.call(en, key)) value = en[key];
    if (value == null) return null; // keep original DOM text if missing everywhere

    return Object.keys(params).reduce((str, p) => str.replace(new RegExp(`{{${p}}}`, 'g'), params[p]), value);
  }

  function setLanguage(lang, updateUI = true) {
    if (!supportedLanguages.includes(lang)) lang = 'en';
    currentLanguage = lang;

    document.documentElement.lang = lang;
    document.documentElement.dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr';

    // body classes
    document.body.classList.forEach(c => { if (c.startsWith('lang-') || c === 'rtl') document.body.classList.remove(c); });
    document.body.classList.add(`lang-${lang}`);
    if (rtlLanguages.includes(lang)) document.body.classList.add('rtl');

    try { localStorage.setItem('flow-language', lang); } catch (_) {}

    if (updateUI) {
      updateTranslations();
      updateLanguageSelector();
    }
  }

  // Parse data-i18n-attrs (JSON or "aria-label:key; title:key2")
  function parseAttrMap(str) {
    if (!str) return null;
    const s = str.trim();
    if (!s) return null;
    if (s.startsWith('{')) {
      try { return JSON.parse(s); } catch (e) { console.warn('[i18n] Bad JSON in data-i18n-attrs:', e); }
      return null;
    }
    const map = {};
    s.split(';').forEach(pair => {
      const [attr, key] = pair.split(':').map(x => x && x.trim());
      if (attr && key) map[attr] = key;
    });
    return Object.keys(map).length ? map : null;
  }

  function applyAttributes(el) {
    const spec = el.getAttribute('data-i18n-attrs');
    if (!spec) return;
    const map = parseAttrMap(spec);
    if (!map) return;
    Object.keys(map).forEach(attr => {
      const val = t(map[attr]);
      if (val != null) el.setAttribute(attr, val);
    });
  }

  function setNodeTextOrHTML(el, val) {
    // Allow markup either if developer opts in via data-i18n-html OR translation contains tags.
    if (el.hasAttribute('data-i18n-html') || (typeof val === 'string' && val.indexOf('<') !== -1)) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  }

  function translateElement(el) {
    if (!el) return;
    const key = el.getAttribute('data-i18n');
    if (key) {
      const val = t(key);
      if (val != null) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.type === 'submit' || el.type === 'button') el.value = val;
          else el.placeholder = val;
        } else {
          setNodeTextOrHTML(el, val);
        }
      }
      applyAttributes(el);
    } else if (el.hasAttribute('data-i18n-attrs')) {
      applyAttributes(el);
    }
  }

  function updateTranslations(root = document) {
    // Text / value / placeholder
    root.querySelectorAll('[data-i18n]').forEach(translateElement);

    // Title
    const titleEl = root.querySelector('[data-i18n-title]');
    if (titleEl) {
      const titleKey = titleEl.getAttribute('data-i18n-title');
      const val = t(titleKey);
      if (val != null) document.title = val;
    }

    // Attribute-only elements
    root.querySelectorAll('[data-i18n-attrs]').forEach(el => {
      if (!el.hasAttribute('data-i18n')) applyAttributes(el);
    });
  }

  function updateLanguageSelector() {
    const sel = document.getElementById('lang');
    if (sel && sel.value !== currentLanguage) sel.value = currentLanguage;
  }

  function setupLanguageSelector() {
    const sel = document.getElementById('lang');
    if (!sel) return;
    sel.addEventListener('change', e => {
      const newLang = e.target.value;
      setLanguage(newLang);
      if (window.toast) {
        const label = e.target.options[e.target.selectedIndex].textContent;
        const msg = translations[currentLanguage]?.['msg.languageChanged'] || translations.en['msg.languageChanged'];
        window.toast.show(`${msg} ${label}`, 'success', 3000);
      }
    });
  }

  // Optional: translate nodes that are added later (toasts, modals, etc.)
  function setupObserver() {
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute && (node.hasAttribute('data-i18n') || node.hasAttribute('data-i18n-attrs'))) {
            translateElement(node);
          }
          if (node.querySelectorAll) updateTranslations(node);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    let saved;
    try { saved = localStorage.getItem('flow-language'); } catch (_) {}
    const browser = (navigator.language || 'en').slice(0, 2);
    const initial = saved || (supportedLanguages.includes(browser) ? browser : 'en');
    setLanguage(initial, false);
    updateLanguageSelector();
    setupLanguageSelector();
    updateTranslations();
    setupObserver();

    // small API
    window.FlowI18n = {
      t,
      setLanguage,
      getCurrentLanguage: () => currentLanguage,
      updateTranslations,
      translateElement
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
