// Comprehensive Translation System for Flow PWA
// Supports multiple languages with dynamic switching and localStorage persistence

/* eslint-env browser */

(function() {
  'use strict';

  // Supported languages
  const SUPPORTED_LANGUAGES = {
    'en': { name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
    'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
    'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
    'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
    'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
    'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
    'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
    'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false }
  };

  // Translation data
  const TRANSLATIONS = {
    en: {
      // Common UI
      'common.loading': 'Loading...',
      'common.error': 'Error',

      // Navigation
      'nav.students': 'Students',
      'nav.institutions': 'Institutions', 
      'nav.counselors': 'Counselors',
      'nav.parents': 'Parents',
      'nav.recommenders': 'Recommenders',
      'nav.signUp': 'Sign Up',
      'nav.signIn': 'Sign In',
      'nav.studentPortal': 'Student Portal',
      'nav.parentPortal': 'Parent Portal',
      'nav.counselorPortal': 'Counselor Portal',

      // Accessibility
      'accessibility.skipToContent': 'Skip to content',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.view': 'View',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      'common.download': 'Download',
      'common.upload': 'Upload',
      'common.send': 'Send',
      'common.submit': 'Submit',
      'common.confirm': 'Confirm',
      'common.yes': 'Yes',
      'common.no': 'No',

      // Navigation
      'nav.home': 'Home',
      'nav.students': 'Students',
      'nav.institutions': 'Institutions', 
      'nav.counselors': 'Counselors',
      'nav.parents': 'Parents',
      'nav.recommenders': 'Recommenders',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.help': 'Help',
      'nav.signIn': 'Sign In',
      'nav.signUp': 'Sign Up',
      'nav.logout': 'Logout',
      'nav.profile': 'Profile',
      'nav.settings': 'Settings',
      'nav.dashboard': 'Dashboard',

      // Home Page
      'home.title': 'Flow - Streamline Your College Journey',
      'home.subtitle': 'The comprehensive platform connecting students, institutions, counselors, parents, and recommenders in the college application process.',
      'home.cta.primary': 'Get Started',
      'home.cta.secondary': 'Learn More',
      'home.hero.title': 'Transform Your College Application Experience',
      'home.hero.description': 'Join thousands of students, institutions, and counselors using Flow to streamline the college application process with real-time collaboration and intelligent tools.',

      // Hero section
      'hero.title': 'Apply once. Track everywhere.',
      'hero.subtitle': 'One profile to apply to 50+ universities across Africa. Real-time status, documents, messaging, and financial tools.',
      'hero.howItWorks': 'How it works',
      'hero.badge1': 'Multi-institution applications',
      'hero.badge2': 'Offline-friendly workflows',
      'hero.badge3': 'Multi-language',

      // Features
      'features.title': 'Everything You Need to Succeed',
      'features.students.title': 'For Students',
      'features.students.description': 'Organize applications, track deadlines, collaborate with counselors, and manage documents all in one place.',
      'features.institutions.title': 'For Institutions', 
      'features.institutions.description': 'Streamline admissions, review applications efficiently, and communicate with prospective students.',
      'features.counselors.title': 'For Counselors',
      'features.counselors.description': 'Support multiple students, track their progress, and collaborate with families and institutions.',
      'features.parents.title': 'For Parents',
      'features.parents.description': 'Stay informed about your child\'s applications, provide support, and track important milestones.',
      'features.recommenders.title': 'For Recommenders',
      'features.recommenders.description': 'Manage recommendation requests, submit letters securely, and track submission status.',

      // Authentication
      'auth.signIn.title': 'Sign In',
      'auth.signIn.subtitle': 'Welcome back to Flow',
      'auth.signUp.title': 'Sign Up',
      'auth.signUp.subtitle': 'Create your Flow account',
      'auth.forgotPassword.title': 'Reset Password',
      'auth.forgotPassword.subtitle': 'We\'ll send you a reset link',
      'auth.email': 'Email Address',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.account': 'Account',
      'auth.signOut': 'Sign Out',
      'auth.firstName': 'First Name',
      'auth.lastName': 'Last Name',
      'auth.accountType': 'Account Type',
      'auth.accountType.student': 'Student',
      'auth.accountType.institution': 'Institution',
      'auth.accountType.counselor': 'Counselor',
      'auth.accountType.parent': 'Parent',
      'auth.accountType.recommender': 'Recommender',
      'auth.signIn.button': 'Sign In',
      'auth.signUp.button': 'Create Account',
      'auth.signIn.google': 'Continue with Google',
      'auth.forgotPassword.button': 'Send Reset Link',
      'auth.noAccount': 'Don\'t have an account?',
      'auth.hasAccount': 'Already have an account?',
      'auth.forgotPasswordLink': 'Forgot your password?',
      'auth.backToHome': '← Back to Home',

      // Account Types
      'accountType.student.title': 'Student',
      'accountType.student.description': 'Apply to colleges, track applications, and collaborate with counselors.',
      'accountType.institution.title': 'Institution',
      'accountType.institution.description': 'Review applicants, manage programs, and analyze admissions metrics.',
      'accountType.counselor.title': 'Counselor',
      'accountType.counselor.description': 'Support multiple students and track their application progress.',
      'accountType.parent.title': 'Parent / Guardian',
      'accountType.parent.description': 'View your child\'s progress and approve key application steps.',
      'accountType.recommender.title': 'Recommender',
      'accountType.recommender.description': 'Securely upload and manage recommendation letters.',

      // Portal Sections
      'portal.student.signUp': 'Sign Up as Student',
      'portal.institution.signUp': 'Sign Up as Institution',
      'portal.counselor.signUp': 'Sign Up as Counselor',
      'portal.parent.signUp': 'Sign Up as Parent',
      'portal.recommender.signUp': 'Sign Up as Recommender',

      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.overview': 'Overview',
      'dashboard.recentActivity': 'Recent Activity',
      'dashboard.quickActions': 'Quick Actions',

      // Applications
      'applications.title': 'My Applications',
      'applications.new': 'New Application',
      'applications.draft': 'Draft',
      'applications.submitted': 'Submitted',
      'applications.underReview': 'Under Review',
      'applications.accepted': 'Accepted',
      'applications.rejected': 'Rejected',
      'applications.deadline': 'Deadline',
      'applications.status': 'Status',
      'applications.institution': 'Institution',
      'applications.program': 'Program',

      // Messages
      'messages.title': 'Messages',
      'messages.new': 'New Message',
      'messages.compose': 'Compose Message',
      'messages.recipient': 'Recipient',
      'messages.subject': 'Subject',
      'messages.message': 'Message',
      'messages.send': 'Send Message',
      'messages.inbox': 'Inbox',
      'messages.sent': 'Sent',
      'messages.archive': 'Archive',

      // Profile
      'profile.title': 'Profile',
      'profile.editProfile': 'Edit Profile',
      'profile.personalInfo': 'Personal Information',
      'profile.contactInfo': 'Contact Information',
      'profile.academicInfo': 'Academic Information',
      'profile.preferences': 'Preferences',
      'profile.privacy': 'Privacy Settings',

      // Settings
      'settings.title': 'Settings',
      'settings.account': 'Account Settings',
      'settings.notifications': 'Notifications',
      'settings.privacy': 'Privacy',
      'settings.security': 'Security',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.deleteAccount': 'Delete Account',

      // Footer
      'footer.aboutUs': 'About Us',
      'footer.contactUs': 'Contact Us',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'footer.help': 'Help Center',
      'footer.support': 'Support',
      'footer.careers': 'Careers',
      'footer.blog': 'Blog',
      'footer.socialMedia': 'Follow Us',
      'footer.copyright': '© 2024 Flow. All rights reserved.',

      // Error Messages
      'error.network': 'Network error. Please check your connection.',
      'error.auth.invalidEmail': 'Please enter a valid email address.',
      'error.auth.weakPassword': 'Password should be at least 8 characters long.',
      'error.auth.emailExists': 'An account with this email already exists.',
      'error.auth.userNotFound': 'No account found with this email address.',
      'error.auth.wrongPassword': 'Incorrect password. Please try again.',
      'error.auth.tooManyAttempts': 'Too many failed attempts. Please try again later.',

      // Success Messages
      'success.accountCreated': 'Account created successfully!',
      'success.loginSuccessful': 'Login successful!',
      'success.passwordReset': 'Password reset email sent!',
      'success.profileUpdated': 'Profile updated successfully!',
      'success.messageSent': 'Message sent successfully!',

      // Language Selection
      'language.select': 'Select Language',
      'language.current': 'Current Language'
    },

    es: {
      // Common UI
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      'common.cancel': 'Cancelar',
      'common.save': 'Guardar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.view': 'Ver',
      'common.close': 'Cerrar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.sort': 'Ordenar',
      'common.download': 'Descargar',
      'common.upload': 'Subir',
      'common.send': 'Enviar',
      'common.submit': 'Enviar',
      'common.confirm': 'Confirmar',
      'common.yes': 'Sí',
      'common.no': 'No',

      // Navigation
      'nav.home': 'Inicio',
      'nav.students': 'Estudiantes',
      'nav.institutions': 'Instituciones',
      'nav.counselors': 'Consejeros',
      'nav.parents': 'Padres',
      'nav.recommenders': 'Recomendadores',
      'nav.about': 'Acerca de',
      'nav.contact': 'Contacto',
      'nav.help': 'Ayuda',
      'nav.signIn': 'Iniciar Sesión',
      'nav.signUp': 'Registrarse',
      'nav.logout': 'Cerrar Sesión',
      'nav.profile': 'Perfil',
      'nav.settings': 'Configuración',
      'nav.studentPortal': 'Portal Estudiantil',
      'nav.parentPortal': 'Portal de Padres',
      'nav.counselorPortal': 'Portal de Consejeros',
      'nav.dashboard': 'Panel',

      // Home Page
      'home.title': 'Flow - Optimiza tu Viaje Universitario',
      'home.subtitle': 'La plataforma integral que conecta estudiantes, instituciones, consejeros, padres y recomendadores en el proceso de solicitud universitaria.',
      'home.cta.primary': 'Comenzar',
      'home.cta.secondary': 'Saber Más',
      'home.hero.title': 'Transforma tu Experiencia de Solicitud Universitaria',
      'home.hero.description': 'Únete a miles de estudiantes, instituciones y consejeros que usan Flow para optimizar el proceso de solicitud universitaria con colaboración en tiempo real y herramientas inteligentes.',

      // Hero section
      'hero.title': 'Aplica una vez. Rastrea en todas partes.',
      'hero.subtitle': 'Un perfil para aplicar a más de 50 universidades en África. Estado en tiempo real, documentos, mensajería y herramientas financieras.',
      'hero.howItWorks': 'Cómo funciona',
      'hero.badge1': 'Aplicaciones multi-institucionales',
      'hero.badge2': 'Flujos de trabajo sin conexión',
      'hero.badge3': 'Multiidioma',

      // Accessibility
      'accessibility.skipToContent': 'Ir al contenido',

      // Features
      'features.title': 'Todo lo que Necesitas para Tener Éxito',
      'features.students.title': 'Para Estudiantes',
      'features.students.description': 'Organiza solicitudes, rastrea fechas límite, colabora con consejeros y gestiona documentos todo en un lugar.',
      'features.institutions.title': 'Para Instituciones',
      'features.institutions.description': 'Optimiza las admisiones, revisa solicitudes eficientemente y comunícate con estudiantes prospectivos.',
      'features.counselors.title': 'Para Consejeros',
      'features.counselors.description': 'Apoya a múltiples estudiantes, rastrea su progreso y colabora con familias e instituciones.',
      'features.parents.title': 'Para Padres',
      'features.parents.description': 'Mantente informado sobre las solicitudes de tu hijo, brinda apoyo y rastrea hitos importantes.',
      'features.recommenders.title': 'Para Recomendadores',
      'features.recommenders.description': 'Gestiona solicitudes de recomendación, envía cartas de forma segura y rastrea el estado de envío.',

      // Authentication
      'auth.signIn.title': 'Iniciar Sesión',
      'auth.signIn.subtitle': 'Bienvenido de vuelta a Flow',
      'auth.signUp.title': 'Registrarse',
      'auth.signUp.subtitle': 'Crea tu cuenta de Flow',
      'auth.forgotPassword.title': 'Restablecer Contraseña',
      'auth.forgotPassword.subtitle': 'Te enviaremos un enlace de restablecimiento',
      'auth.email': 'Dirección de Correo',
      'auth.password': 'Contraseña',
      'auth.confirmPassword': 'Confirmar Contraseña',
      'auth.account': 'Cuenta',
      'auth.signOut': 'Cerrar Sesión',
      'auth.firstName': 'Nombre',
      'auth.lastName': 'Apellido',
      'auth.accountType': 'Tipo de Cuenta',
      'auth.accountType.student': 'Estudiante',
      'auth.accountType.institution': 'Institución',
      'auth.accountType.counselor': 'Consejero',
      'auth.accountType.parent': 'Padre',
      'auth.accountType.recommender': 'Recomendador',
      'auth.signIn.button': 'Iniciar Sesión',
      'auth.signUp.button': 'Crear Cuenta',
      'auth.signIn.google': 'Continuar con Google',
      'auth.forgotPassword.button': 'Enviar Enlace de Restablecimiento',
      'auth.noAccount': '¿No tienes cuenta?',
      'auth.hasAccount': '¿Ya tienes cuenta?',
      'auth.forgotPasswordLink': '¿Olvidaste tu contraseña?',
      'auth.backToHome': '← Volver al Inicio',

      // Account Types
      'accountType.student.title': 'Estudiante',
      'accountType.student.description': 'Solicita a universidades, rastrea solicitudes y colabora con consejeros.',
      'accountType.institution.title': 'Institución',
      'accountType.institution.description': 'Revisa solicitantes, gestiona programas y analiza métricas de admisión.',
      'accountType.counselor.title': 'Consejero',
      'accountType.counselor.description': 'Apoya a múltiples estudiantes y rastrea el progreso de sus solicitudes.',
      'accountType.parent.title': 'Padre / Tutor',
      'accountType.parent.description': 'Ve el progreso de tu hijo y aprueba pasos clave de la solicitud.',
      'accountType.recommender.title': 'Recomendador',
      'accountType.recommender.description': 'Sube y gestiona cartas de recomendación de forma segura.',

      // Portal Sections
      'portal.student.signUp': 'Registrarse como Estudiante',
      'portal.institution.signUp': 'Registrarse como Institución',
      'portal.counselor.signUp': 'Registrarse como Consejero',
      'portal.parent.signUp': 'Registrarse como Padre',
      'portal.recommender.signUp': 'Registrarse como Recomendador',

      // Error Messages
      'error.network': 'Error de red. Por favor verifica tu conexión.',
      'error.auth.invalidEmail': 'Por favor ingresa una dirección de correo válida.',
      'error.auth.weakPassword': 'La contraseña debe tener al menos 8 caracteres.',
      'error.auth.emailExists': 'Ya existe una cuenta con este correo.',
      'error.auth.userNotFound': 'No se encontró cuenta con este correo.',
      'error.auth.wrongPassword': 'Contraseña incorrecta. Inténtalo de nuevo.',
      'error.auth.tooManyAttempts': 'Demasiados intentos fallidos. Inténtalo más tarde.',

      // Success Messages
      'success.accountCreated': '¡Cuenta creada exitosamente!',
      'success.loginSuccessful': '¡Inicio de sesión exitoso!',
      'success.passwordReset': '¡Correo de restablecimiento enviado!',
      'success.profileUpdated': '¡Perfil actualizado exitosamente!',
      'success.messageSent': '¡Mensaje enviado exitosamente!',

      // Language Selection
      'language.select': 'Seleccionar Idioma',
      'language.current': 'Idioma Actual'
    },

    fr: {
      // Common UI
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      'common.cancel': 'Annuler',
      'common.save': 'Enregistrer',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.view': 'Voir',
      'common.close': 'Fermer',
      'common.back': 'Retour',
      'common.next': 'Suivant',
      'common.previous': 'Précédent',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.sort': 'Trier',
      'common.download': 'Télécharger',
      'common.upload': 'Téléverser',
      'common.send': 'Envoyer',
      'common.submit': 'Soumettre',
      'common.confirm': 'Confirmer',
      'common.yes': 'Oui',
      'common.no': 'Non',

      // Navigation
      'nav.home': 'Accueil',
      'nav.students': 'Étudiants',
      'nav.institutions': 'Institutions',
      'nav.counselors': 'Conseillers',
      'nav.parents': 'Parents',
      'nav.recommenders': 'Recommandants',
      'nav.about': 'À propos',
      'nav.contact': 'Contact',
      'nav.help': 'Aide',
      'nav.signIn': 'Se connecter',
      'nav.signUp': 'S\'inscrire',
      'nav.logout': 'Déconnexion',
      'nav.profile': 'Profil',
      'nav.settings': 'Paramètres',
      'nav.dashboard': 'Tableau de bord',

      // Home Page
      'home.title': 'Flow - Optimisez votre Parcours Universitaire',
      'home.subtitle': 'La plateforme complète qui connecte étudiants, institutions, conseillers, parents et recommandants dans le processus de candidature universitaire.',
      'home.cta.primary': 'Commencer',
      'home.cta.secondary': 'En savoir plus',
      'home.hero.title': 'Transformez votre Expérience de Candidature Universitaire',
      'home.hero.description': 'Rejoignez des milliers d\'étudiants, institutions et conseillers qui utilisent Flow pour optimiser le processus de candidature universitaire avec collaboration en temps réel et outils intelligents.',

      // Hero section
      'hero.title': 'Postulez une fois. Suivez partout.',
      'hero.subtitle': 'Un profil pour postuler à plus de 50 universités en Afrique. Statut en temps réel, documents, messagerie et outils financiers.',
      'hero.howItWorks': 'Comment ça marche',
      'hero.badge1': 'Applications multi-institutionnelles',
      'hero.badge2': 'Flux de travail hors ligne',
      'hero.badge3': 'Multilingue',

      // Navigation
      'nav.students': 'Étudiants',
      'nav.institutions': 'Institutions',
      'nav.counselors': 'Conseillers',
      'nav.parents': 'Parents',
      'nav.recommenders': 'Recommandeurs',
      'nav.signUp': 'S\'inscrire',
      'nav.signIn': 'Se connecter',
      'nav.studentPortal': 'Portail Étudiant',
      'nav.parentPortal': 'Portail Parents',
      'nav.counselorPortal': 'Portail Conseillers',

      // Accessibility
      'accessibility.skipToContent': 'Aller au contenu',

      // Features
      'features.title': 'Tout ce dont vous avez besoin pour réussir',
      'features.students.title': 'Pour les Étudiants',
      'features.students.description': 'Organisez les candidatures, suivez les échéances, collaborez avec les conseillers et gérez les documents en un seul endroit.',
      'features.institutions.title': 'Pour les Institutions',
      'features.institutions.description': 'Optimisez les admissions, examinez les candidatures efficacement et communiquez avec les étudiants prospectifs.',
      'features.counselors.title': 'Pour les Conseillers',
      'features.counselors.description': 'Soutenez plusieurs étudiants, suivez leurs progrès et collaborez avec les familles et institutions.',
      'features.parents.title': 'Pour les Parents',
      'features.parents.description': 'Restez informé des candidatures de votre enfant, apportez votre soutien et suivez les étapes importantes.',
      'features.recommenders.title': 'Pour les Recommandants',
      'features.recommenders.description': 'Gérez les demandes de recommandation, soumettez les lettres en toute sécurité et suivez le statut de soumission.',

      // Authentication
      'auth.signIn.title': 'Se connecter',
      'auth.signIn.subtitle': 'Bienvenue sur Flow',
      'auth.signUp.title': 'S\'inscrire',
      'auth.signUp.subtitle': 'Créez votre compte Flow',
      'auth.forgotPassword.title': 'Réinitialiser le mot de passe',
      'auth.forgotPassword.subtitle': 'Nous vous enverrons un lien de réinitialisation',
      'auth.email': 'Adresse e-mail',
      'auth.password': 'Mot de passe',
      'auth.confirmPassword': 'Confirmer le mot de passe',
      'auth.firstName': 'Prénom',
      'auth.lastName': 'Nom',
      'auth.accountType': 'Type de compte',
      'auth.accountType.student': 'Étudiant',
      'auth.accountType.institution': 'Institution',
      'auth.accountType.counselor': 'Conseiller',
      'auth.accountType.parent': 'Parent',
      'auth.accountType.recommender': 'Recommandant',
      'auth.signIn.button': 'Se connecter',
      'auth.signUp.button': 'Créer un compte',
      'auth.signIn.google': 'Continuer avec Google',
      'auth.forgotPassword.button': 'Envoyer le lien de réinitialisation',
      'auth.noAccount': 'Pas de compte ?',
      'auth.hasAccount': 'Déjà un compte ?',
      'auth.forgotPasswordLink': 'Mot de passe oublié ?',
      'auth.backToHome': '← Retour à l\'accueil',
      'auth.account': 'Compte',
      'auth.signOut': 'Se déconnecter',

      // Language Selection
      'language.select': 'Sélectionner la langue',
      'language.current': 'Langue actuelle'
    },

    // Add other languages with key translations...
    de: {
      'nav.home': 'Startseite',
      'nav.students': 'Studenten',
      'nav.institutions': 'Institutionen',
      'auth.signIn.title': 'Anmelden',
      'auth.signUp.title': 'Registrieren',
      'language.select': 'Sprache auswählen',
      'language.current': 'Aktuelle Sprache'
    },

    it: {
      'nav.home': 'Home',
      'nav.students': 'Studenti', 
      'nav.institutions': 'Istituzioni',
      'auth.signIn.title': 'Accedi',
      'auth.signUp.title': 'Registrati',
      'language.select': 'Seleziona lingua',
      'language.current': 'Lingua corrente'
    },

    pt: {
      'nav.home': 'Início',
      'nav.students': 'Estudantes',
      'nav.institutions': 'Instituições',
      'auth.signIn.title': 'Entrar',
      'auth.signUp.title': 'Cadastrar',
      'language.select': 'Selecionar idioma',
      'language.current': 'Idioma atual'
    },

    ru: {
      'nav.home': 'Главная',
      'nav.students': 'Студенты',
      'nav.institutions': 'Учреждения',
      'auth.signIn.title': 'Войти',
      'auth.signUp.title': 'Регистрация',
      'language.select': 'Выбрать язык',
      'language.current': 'Текущий язык'
    },

    zh: {
      'nav.home': '首页',
      'nav.students': '学生',
      'nav.institutions': '机构',
      'auth.signIn.title': '登录',
      'auth.signUp.title': '注册',
      'language.select': '选择语言',
      'language.current': '当前语言'
    },

    ja: {
      'nav.home': 'ホーム',
      'nav.students': '学生',
      'nav.institutions': '機関',
      'auth.signIn.title': 'ログイン',
      'auth.signUp.title': '登録',
      'language.select': '言語を選択',
      'language.current': '現在の言語'
    },

    ko: {
      'nav.home': '홈',
      'nav.students': '학생',
      'nav.institutions': '기관',
      'auth.signIn.title': '로그인',
      'auth.signUp.title': '회원가입',
      'language.select': '언어 선택',
      'language.current': '현재 언어'
    },

    ar: {
      'nav.home': 'الرئيسية',
      'nav.students': 'الطلاب',
      'nav.institutions': 'المؤسسات',
      'auth.signIn.title': 'تسجيل الدخول',
      'auth.signUp.title': 'إنشاء حساب',
      'language.select': 'اختر اللغة',
      'language.current': 'اللغة الحالية'
    },

    hi: {
      'nav.home': 'होम',
      'nav.students': 'छात्र',
      'nav.institutions': 'संस्थाएं',
      'auth.signIn.title': 'साइन इन',
      'auth.signUp.title': 'साइन अप',
      'language.select': 'भाषा चुनें',
      'language.current': 'वर्तमान भाषा'
    }
  };

  // Translation system state
  let currentLanguage = 'en';
  let translationsLoaded = false;
  let rtlEnabled = false;

  // Initialize translation system
  function initTranslations() {
    console.log('🌍 Initializing translation system...');

    // Load saved language preference
    const savedLanguage = localStorage.getItem('flow_language');
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      currentLanguage = savedLanguage;
    } else {
      // Detect browser language
      const browserLanguage = navigator.language || navigator.userLanguage;
      const languageCode = browserLanguage.split('-')[0];
      if (SUPPORTED_LANGUAGES[languageCode]) {
        currentLanguage = languageCode;
      }
    }

    // Set RTL if needed
    rtlEnabled = SUPPORTED_LANGUAGES[currentLanguage].rtl;
    
    // Apply language
    applyLanguage(currentLanguage);

    translationsLoaded = true;
    console.log('✅ Translation system initialized with language:', currentLanguage);

    // Emit event
    document.dispatchEvent(new CustomEvent('translationsReady', {
      detail: { language: currentLanguage, rtl: rtlEnabled }
    }));
  }

  // Apply language to the page
  function applyLanguage(languageCode) {
    const langInfo = SUPPORTED_LANGUAGES[languageCode];
    if (!langInfo) return;

    // Update HTML lang attribute
    document.documentElement.lang = languageCode;

    // Update text direction
    document.documentElement.dir = langInfo.rtl ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', langInfo.rtl);

    // Update all translatable elements
    updateTranslations();

    // Update language selector displays
    updateLanguageSelectors(languageCode);

    currentLanguage = languageCode;
    rtlEnabled = langInfo.rtl;

    // Save preference
    localStorage.setItem('flow_language', languageCode);

    console.log('🌍 Language applied:', languageCode);
  }

  // Update all translatable elements on the page
  function updateTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = getTranslation(key);
      
      if (translation) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          if (element.type === 'submit' || element.type === 'button') {
            element.value = translation;
          } else {
            element.placeholder = translation;
          }
        } else {
          element.textContent = translation;
        }
      }
    });

    // Update elements with data-i18n-html (for HTML content)
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const translation = getTranslation(key);
      
      if (translation) {
        element.innerHTML = translation;
      }
    });

    // Update title attribute translations
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = getTranslation(key);
      
      if (translation) {
        element.title = translation;
      }
    });

    // Update aria-label translations
    const ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      const translation = getTranslation(key);
      
      if (translation) {
        element.setAttribute('aria-label', translation);
      }
    });
  }

  // Get translation for a key
  function getTranslation(key, languageCode = currentLanguage) {
    const langTranslations = TRANSLATIONS[languageCode];
    if (!langTranslations) {
      // Fallback to English
      return TRANSLATIONS.en[key] || key;
    }

    return langTranslations[key] || TRANSLATIONS.en[key] || key;
  }

  // Update language selector dropdowns
  function updateLanguageSelectors(selectedLanguage) {
    const selectors = document.querySelectorAll('.language-selector');
    
    selectors.forEach(selector => {
      // Update current language display
      const currentDisplay = selector.querySelector('.current-language');
      if (currentDisplay) {
        const langInfo = SUPPORTED_LANGUAGES[selectedLanguage];
        currentDisplay.innerHTML = `
          <span class="flag">${langInfo.flag}</span>
          <span class="name">${langInfo.nativeName}</span>
        `;
      }

      // Update dropdown options
      const dropdown = selector.querySelector('.language-dropdown');
      if (dropdown) {
        dropdown.innerHTML = Object.entries(SUPPORTED_LANGUAGES)
          .map(([code, info]) => `
            <a href="#" class="language-option ${code === selectedLanguage ? 'active' : ''}" data-language="${code}">
              <span class="flag">${info.flag}</span>
              <span class="name">${info.nativeName}</span>
              <span class="native-name">${info.name}</span>
            </a>
          `).join('');
      }
    });
  }

  // Create language selector HTML
  function createLanguageSelector(className = '') {
    const currentLang = SUPPORTED_LANGUAGES[currentLanguage];
    
    return `
      <div class="language-selector ${className}">
        <button type="button" class="language-trigger" aria-haspopup="true" aria-expanded="false">
          <span class="current-language">
            <span class="flag">${currentLang.flag}</span>
            <span class="name">${currentLang.nativeName}</span>
          </span>
          <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <div class="language-dropdown" role="menu">
          ${Object.entries(SUPPORTED_LANGUAGES)
            .map(([code, info]) => `
              <a href="#" class="language-option ${code === currentLanguage ? 'active' : ''}" 
                 data-language="${code}" role="menuitem">
                <span class="flag">${info.flag}</span>
                <span class="name">${info.nativeName}</span>
                <span class="native-name">${info.name}</span>
              </a>
            `).join('')}
        </div>
      </div>
    `;
  }

  // Handle language selection
  function handleLanguageSelection() {
    document.addEventListener('click', (event) => {
      const languageOption = event.target.closest('.language-option');
      if (languageOption) {
        event.preventDefault();
        const selectedLanguage = languageOption.getAttribute('data-language');
        if (selectedLanguage && selectedLanguage !== currentLanguage) {
          changeLanguage(selectedLanguage);
        }
        
        // Close dropdown
        const selector = languageOption.closest('.language-selector');
        if (selector) {
          selector.classList.remove('open');
        }
      }

      // Handle dropdown toggle
      const languageTrigger = event.target.closest('.language-trigger');
      if (languageTrigger) {
        event.preventDefault();
        const selector = languageTrigger.closest('.language-selector');
        selector.classList.toggle('open');
      }

      // Close dropdowns when clicking outside
      if (!event.target.closest('.language-selector')) {
        document.querySelectorAll('.language-selector.open').forEach(selector => {
          selector.classList.remove('open');
        });
      }
    });
  }

  // Change language
  function changeLanguage(languageCode) {
    if (!SUPPORTED_LANGUAGES[languageCode]) {
      console.warn('Unsupported language:', languageCode);
      return;
    }

    console.log('🌍 Changing language to:', languageCode);
    applyLanguage(languageCode);

    // Emit language change event
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { 
        oldLanguage: currentLanguage, 
        newLanguage: languageCode,
        rtl: SUPPORTED_LANGUAGES[languageCode].rtl 
      }
    }));
  }

  // Public API
  const FlowTranslations = {
    // Core methods
    init: initTranslations,
    changeLanguage,
    getTranslation,
    updateTranslations,

    // Getters
    getCurrentLanguage: () => currentLanguage,
    getSupportedLanguages: () => SUPPORTED_LANGUAGES,
    isRTL: () => rtlEnabled,
    isReady: () => translationsLoaded,

    // Utilities
    createLanguageSelector,
    
    // Shortcuts for common translations
    t: getTranslation,
    
    // Add translation at runtime
    addTranslation(languageCode, key, value) {
      if (!TRANSLATIONS[languageCode]) {
        TRANSLATIONS[languageCode] = {};
      }
      TRANSLATIONS[languageCode][key] = value;
    },

    // Add multiple translations
    addTranslations(languageCode, translations) {
      if (!TRANSLATIONS[languageCode]) {
        TRANSLATIONS[languageCode] = {};
      }
      Object.assign(TRANSLATIONS[languageCode], translations);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTranslations();
      handleLanguageSelection();
    });
  } else {
    initTranslations();
    handleLanguageSelection();
  }

  // Export globally
  window.FlowTranslations = FlowTranslations;

  console.log('🌍 Translation system loaded');

})();