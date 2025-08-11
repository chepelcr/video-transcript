import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.contact': 'Contact',
    'nav.getStarted': 'Get Started',
    'nav.history': 'History',
    'nav.profile': 'Profile',
    'nav.back': 'Back to Home',
    
    // Common
    'common.back': 'Back',
    'common.backToHome': 'Back to Home',
    'common.logout': 'Sign Out',
    'common.upgrade': 'Upgrade',
    'common.upgradeForUnlimited': 'Upgrade for unlimited transcriptions.',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.refresh': 'Refresh',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.empty': 'No notifications',
    'notifications.emptyDescription': 'You\'re all caught up! New notifications will appear here.',
    'notifications.transcriptionCompleted': 'Transcription Completed',
    'notifications.transcriptionFailed': 'Transcription Failed',
    'notifications.system': 'System Notification',
    'notifications.timeAgo.justNow': 'Just now',
    'notifications.timeAgo.minutesAgo': '{minutes} minutes ago',
    'notifications.timeAgo.hoursAgo': '{hours} hours ago',
    'notifications.timeAgo.daysAgo': '{days} days ago',
    'notifications.unreadCount': '{count} unread notifications',
    
    // Hero Section
    'hero.title': 'Transform Videos to Text',
    'hero.subtitle': 'in Seconds',
    'hero.description': 'Powerful AI-driven video transcription service. Upload any video URL and get accurate transcripts instantly. Perfect for content creators, students, and professionals.',
    'hero.placeholder': 'Paste your video URL here (YouTube, Vimeo, etc.)',
    'hero.transcribe': 'Transcribe',
    'hero.processing': 'Processing...',
    'hero.remaining': 'free transcriptions remaining',
    
    // Features
    'features.title': 'Why Choose VideoScript?',
    'features.subtitle': 'Experience the fastest, most accurate video transcription service powered by advanced AI technology.',
    'features.fast.title': 'Lightning Fast',
    'features.fast.desc': 'Get your video transcriptions in seconds, not minutes. Our optimized AI processes videos up to 10x faster than competitors with instant access to your complete transcription history.',
    'features.accurate.title': '99% Accuracy',
    'features.accurate.desc': 'Industry-leading accuracy with support for multiple languages and accents. Perfect transcriptions every time, all saved in your personal history dashboard.',
    'features.secure.title': 'Complete History',
    'features.secure.desc': 'Access all your transcriptions anytime with our comprehensive history tracking. Search, organize, and manage your video transcripts with intelligent video title extraction.',
    
    // Pricing
    'pricing.title': 'Simple, Transparent Pricing',
    'pricing.subtitle': 'Start free, upgrade when you need more. No hidden fees, cancel anytime.',
    'pricing.free.title': 'Free',
    'pricing.free.subtitle': 'Perfect for trying out',
    'pricing.free.transcriptions': '3 transcriptions per day',
    'pricing.free.duration': 'Up to 3 minutes per video',
    'pricing.free.accuracy': 'Basic accuracy',
    'pricing.free.format': 'Download as TXT',
    'pricing.free.button': 'Current Plan',
    'pricing.pro.title': 'Pro',
    'pricing.pro.subtitle': 'per month',
    'pricing.pro.popular': 'Most Popular',
    'pricing.pro.unlimited': 'Unlimited transcriptions',
    'pricing.pro.duration': 'Up to 2 hours per video',
    'pricing.pro.accuracy': 'Premium accuracy (99%)',
    'pricing.pro.formats': 'Multiple formats (TXT, SRT, VTT)',
    'pricing.pro.priority': 'Priority processing',
    'pricing.pro.support': 'Email support',
    'pricing.pro.button': 'Upgrade to Pro',
    'pricing.enterprise.title': 'Enterprise',
    'pricing.enterprise.subtitle': 'For large teams',
    'pricing.enterprise.everything': 'Everything in Pro',
    'pricing.enterprise.api': 'Custom API integration',
    'pricing.enterprise.whitelabel': 'White-label options',
    'pricing.enterprise.phone': '24/7 phone support',
    'pricing.enterprise.sla': 'SLA guarantee',
    'pricing.enterprise.button': 'Contact Sales',
    'pricing.payment': 'Secure payment powered by',
    
    // Testimonials
    'testimonials.title': 'Trusted by Content Creators Worldwide',
    'testimonials.subtitle': 'Join thousands of satisfied users who rely on VideoScript for their transcription needs.',
    'testimonials.sarah.text': 'VideoScript has revolutionized my content creation workflow. The accuracy is incredible and it saves me hours of manual transcription work every week.',
    'testimonials.sarah.name': 'Sarah Johnson',
    'testimonials.sarah.role': 'YouTube Creator',
    
    // Authentication
    'auth.register.title': 'Create Account',
    'auth.register.description': 'Get started with VideoScript today',
    'auth.register.username': 'Username',
    'auth.register.usernamePlaceholder': 'Choose a unique username',
    'auth.register.firstName': 'First Name',
    'auth.register.firstNamePlaceholder': 'Enter your first name',
    'auth.register.lastName': 'Last Name',
    'auth.register.lastNamePlaceholder': 'Enter your last name',
    'auth.register.email': 'Email',
    'auth.register.emailPlaceholder': 'Enter your email address',
    'auth.register.password': 'Password',
    'auth.register.passwordPlaceholder': 'Create a secure password',
    'auth.register.confirmPassword': 'Confirm Password',
    'auth.register.confirmPasswordPlaceholder': 'Confirm your password',
    'auth.register.submit': 'Create Account',
    'auth.register.hasAccount': 'Already have an account?',
    'auth.register.signIn': 'Sign in',
    'auth.register.success.title': 'Account Created',
    'auth.register.success.description': 'Please check your email for verification code',
    'auth.register.error': 'Failed to create account',
    'auth.register.steps.personalInfo': 'Personal Info',
    'auth.register.steps.personalInfoDesc': 'Basic information',
    'auth.register.steps.security': 'Security',
    'auth.register.steps.securityDesc': 'Create password',
    'auth.register.steps.verify': 'Verify',
    'auth.register.steps.verifyDesc': 'Email verification',
    
    // Multi-step registration
    'auth.register.step1.title': 'Personal Info',
    'auth.register.step1.subtitle': 'Basic information',
    'auth.register.step2.title': 'Security',
    'auth.register.step2.subtitle': 'Create password',
    'auth.register.step3.title': 'Verify',
    'auth.register.step3.subtitle': 'Email verification',
    'auth.register.continue': 'Continue to Password',
    'auth.register.back': 'Back',
    'auth.register.createAccount': 'Create Account',

    'auth.verify.title': 'Verify Email',
    'auth.verify.description': 'We sent a verification code to',
    'auth.verify.code': 'Verification Code',
    'auth.verify.codePlaceholder': '123456',
    'auth.verify.submit': 'Verify Email',
    'auth.verify.noCode': "Didn't receive the code?",
    'auth.verify.resendCode': 'Resend Code',
    'auth.verify.backToRegister': 'Back to Register',
    'auth.verify.success.title': 'Email Verified',
    'auth.verify.success.description': 'Welcome to VideoScript!',
    'auth.verify.error': 'Invalid verification code',
    'auth.verify.resend.success.title': 'Code Sent',
    'auth.verify.resend.success.description': 'A new verification code has been sent to your email',
    'auth.verify.resend.error': 'Failed to resend verification code',

    'auth.login.title': 'Welcome Back',
    'auth.login.description': 'Sign in to your VideoScript account',
    'auth.login.email': 'Email',
    'auth.login.emailPlaceholder': 'Enter your email',
    'auth.login.password': 'Password',
    'auth.login.passwordPlaceholder': 'Enter your password',
    'auth.login.submit': 'Sign In',
    'auth.login.forgotPassword': 'Forgot Password',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.signUp': 'Sign up',
    'auth.login.success.title': 'Welcome Back',
    'auth.login.success.description': 'Successfully signed in',
    'auth.login.error': 'Invalid email or password',

    // Forgot Password
    'auth.forgot.title': 'Forgot Password',
    'auth.forgot.description': 'Enter your email address and we\'ll send you a link to reset your password',
    'auth.forgot.email': 'Email Address',
    'auth.forgot.emailPlaceholder': 'Enter your email address',
    'auth.forgot.submit': 'Send Reset Link',
    'auth.forgot.sending': 'Sending',
    'auth.forgot.backToLogin': 'Back to Login',
    'auth.forgot.success.title': 'Check Your Email',
    'auth.forgot.success.description': 'If an account with that email exists, a password reset link has been sent.',
    'auth.forgot.error': 'Failed to send reset link',

    // Reset Password
    'auth.reset.title': 'Reset Password',
    'auth.reset.description': 'Enter your new password',
    'auth.reset.newPassword': 'New Password',
    'auth.reset.newPasswordPlaceholder': 'Enter your new password',
    'auth.reset.confirmPassword': 'Confirm Password',
    'auth.reset.confirmPasswordPlaceholder': 'Confirm your new password',
    'auth.reset.submit': 'Reset Password',
    'auth.reset.resetting': 'Resetting',
    'auth.reset.backToLogin': 'Back to Login',
    'auth.reset.success.title': 'Password Reset Successfully',
    'auth.reset.success.description': 'Your password has been reset. You can now log in with your new password.',
    'auth.reset.loginNow': 'Login Now',
    'auth.reset.error': 'Failed to reset password',
    'auth.reset.invalidLink': 'Invalid or expired reset link',
    'auth.reset.requestNewLink': 'Request New Reset Link',
    'auth.reset.showPassword': 'Show password',
    'auth.reset.hidePassword': 'Hide password',
    'auth.loginRequired': 'Sign in required',
    'auth.loginMessage': 'Please sign in to start transcribing your videos',
    'auth.signIn': 'Sign In',
    'testimonials.mike.text': 'As a student, VideoScript helps me convert lecture videos to text for better studying. The free tier is perfect for my needs.',
    'testimonials.mike.name': 'Mike Chen',
    'testimonials.mike.role': 'University Student',
    'testimonials.lisa.text': 'The accuracy and speed are unmatched. We use VideoScript for all our corporate training materials and the results are consistently excellent.',
    'testimonials.lisa.name': 'Lisa Rodriguez',
    'testimonials.lisa.role': 'Training Manager',
    
    // Results
    'results.title': 'Your Transcription',
    'results.download': 'Download TXT',
    'results.copy': 'Copy Text',
    'results.duration': 'Duration',
    'results.words': 'Words',
    'results.accuracy': 'Accuracy',
    'results.processing': 'Processing',
    
    // Payment Modal
    'payment.title': 'Choose Payment Method',
    'payment.plan': 'Plan',
    'payment.description': 'Monthly subscription for unlimited transcriptions',
    'payment.stripe': 'Pay with Stripe',
    'payment.paypal': 'PayPal',
    'payment.secure': 'Secured by 256-bit SSL encryption',
    
    // Forms
    'form.email': 'Email Address',
    'form.emailPlaceholder': 'Enter your email address',
    'form.continue': 'Continue to Payment',
    'form.subscribe': 'Subscribe Now',
    'form.complete': 'Complete Payment',
    'form.setupError': 'Setup Error',
    'form.paymentError': 'Payment Setup Error',
    'form.tryAgain': 'Try Again',
    'form.backHome': 'Back to Home',
    'form.back': 'Back',
    
    // Messages
    'messages.success': 'Success',
    'messages.error': 'Error',
    'messages.transcribed': 'Video transcribed successfully!',
    'messages.failed': 'Failed to transcribe video. Please try again.',
    'messages.invalidUrl': 'Please enter a valid URL',
    'messages.enterUrl': 'Please enter a video URL',
    'messages.limitReached': 'You have reached your free tier limit. Please upgrade to continue.',
    'messages.paymentFailed': 'Payment Failed',
    'messages.paymentSuccess': 'Payment Successful',
    'messages.thankYou': 'Thank you for your purchase!',
    'messages.subscriptionSuccess': 'Welcome to VideoScript Pro!',
    'messages.welcomePro': 'Your subscription is now active. Enjoy unlimited transcriptions and premium features.',
    'messages.startTranscribing': 'Start Transcribing',
    'messages.copied': 'Transcription copied to clipboard!',
    'messages.downloadStarted': 'Your transcription has been downloaded as a text file.',
    'messages.copyFailed': 'Failed to copy to clipboard.',
    'messages.emailRequired': 'Please enter your email address',
    'messages.settingUp': 'Setting up...',
    'messages.returnHome': 'Return to Home',
    'messages.videoTooLong': 'Video is too long. Please use a video of maximum 3 minutes.',

    // Transcription History
    'history.title': 'Recent Transcriptions',
    'history.empty': 'No transcriptions yet',
    'history.empty.description': 'Your transcription history will appear here',
    'history.loading': 'Loading transcriptions...',
    'history.error': 'Failed to load transcriptions',
    'history.duration': 'Duration',
    'history.words': 'Words',
    'history.accuracy': 'Accuracy',
    'history.processing': 'Processing Time',
    'history.ago': 'ago',
    'history.copyText': 'Copy Text',
    'history.download': 'Download',
    'history.view': 'View Details',
    'history.createdAt': 'Created',
    'history.copied': 'Text copied to clipboard!',

    // Transcription Form
    'transcription.newTranscription': 'New Transcription',
    'transcription.enterVideoUrl': 'Enter a video URL to start transcribing',
    'transcription.videoUrl': 'Video URL',
    'transcription.videoUrlPlaceholder': 'https://www.youtube.com/watch?v=...',
    'transcription.processing': 'Processing...',
    'transcription.success.title': 'Transcription Complete',
    'transcription.success.description': 'Your video has been transcribed successfully!',
    'transcription.error.title': 'Transcription Failed',
    'transcription.error.description': 'There was an error processing your video. Please try again.',

    // Profile translations
    'profile.title': 'Profile',
    'profile.description': 'Manage your account information and preferences.',
    'profile.verified': 'Verified',
    'profile.plan': 'Plan',
    'profile.memberSince': 'Member since',
    'profile.transcriptionsUsed': 'transcriptions used',
    'profile.edit.title': 'Edit Profile',
    'profile.edit.description': 'Update your profile information. Note: Email cannot be changed.',
    'profile.edit.username': 'Username',
    'profile.edit.usernamePlaceholder': 'Enter your username',
    'profile.edit.firstName': 'First Name',
    'profile.edit.firstNamePlaceholder': 'Enter your first name',
    'profile.edit.lastName': 'Last Name',
    'profile.edit.lastNamePlaceholder': 'Enter your last name',
    'profile.edit.emailNote': 'Email cannot be changed',
    'profile.edit.submit': 'Update Profile',
    'profile.update.success.title': 'Profile Updated',
    'profile.update.success.description': 'Your profile has been updated successfully.',
    'profile.update.error': 'Failed to update profile',
    'profile.editProfile': 'Edit Profile',
    
    // Dashboard Page
    'dashboard.welcomeBack': 'Welcome back, {{name}}!',
    'dashboard.description': 'Manage your transcriptions and account settings',
    'dashboard.accountOverview': 'Account Overview',
    'dashboard.plan': 'Plan',
    'dashboard.free': 'Free',
    'dashboard.pro': 'Pro',
    'dashboard.upgrade': 'Upgrade',
    'dashboard.dailyUsage': 'Daily Usage',
    'dashboard.dailyLimitReached': 'Daily limit reached',
    'dashboard.totalTranscriptions': 'Total Transcriptions',
    'dashboard.memberSince': 'Member Since',
    
    // Transcription Status
    'transcription.status.processing': 'Processing',
    'transcription.status.completed': 'Completed',
    'transcription.status.failed': 'Failed',
    'transcription.words': 'words',
    'transcriptions.processing': 'Processing',
    'transcriptions.completed': 'Completed',
    'transcriptions.failed': 'Failed',
    'transcriptions.refreshed': 'History Refreshed',
    'transcriptions.refreshedDesc': 'Transcription history updated successfully',
    
    // Status translations
    'status.processing': 'Processing...',
    'status.completed': 'Completed',
    'status.failed': 'Failed',
    'status.pending': 'Pending...',
    
    // Transcription Queueing
    'transcription.queued.title': 'Transcription Queued',
    'transcription.queued.description': 'Your video "{{title}}" has been queued for processing. You\'ll see the results here soon.',
    
    // Notifications
    'notifications.completed.title': 'Transcription Completed!',
    'notifications.completed.description': 'Your video "{{title}}" has been successfully transcribed and is ready to view.',
    'notifications.failed.title': 'Transcription Failed',
    'notifications.failed.description': 'We couldn\'t process your video "{{title}}". Please try again.',
    'notifications.processing.title': 'Processing Started',
    'notifications.processing.description': 'Your video "{{title}}" is now being transcribed.',
    
    // Subscription Page
    'subscription.title': 'Subscribe to VideoScript Pro',
    'subscription.planTitle': 'Pro Plan',
    'subscription.month': '/month',
    'subscription.setupComplete': 'Complete Your Subscription',
    'subscription.setupError': 'Subscription Setup Error',
    'subscription.setupErrorDesc': 'Could not set up subscription. Please try again.',
    'subscription.welcomePro': 'Welcome to Pro!',
    'subscription.activeDesc': 'Your subscription is now active. Enjoy unlimited transcriptions and premium features.',
    'subscription.startTranscribing': 'Start Transcribing',
    'subscription.processing': 'Processing...',
    'subscription.subscribeNow': 'Subscribe Now',
    'subscription.tryAgain': 'Try Again',
    'subscription.subscriptionFor': 'Subscription for',
    'subscription.sslSecured': 'Secured by 256-bit SSL encryption',

    // Footer
    'footer.description': 'The fastest and most accurate AI-powered video transcription service. Transform your videos into editable and searchable text in seconds.',
    'footer.product': 'Product',
    'footer.support': 'Support',
    'footer.apiDocs': 'API Documentation',
    'footer.status': 'Status',
    'footer.helpCenter': 'Help Center',
    'footer.contact': 'Contact Us',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.copyright': '© 2024 VideoScript. All rights reserved. Made with ❤️ for content creators worldwide.',
    'footer.getStarted': 'Get Started',
    'footer.noCommitments': 'Cancel anytime. No long-term commitments.',
  },
  es: {
    // Navigation
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.contact': 'Contacto',
    'nav.getStarted': 'Comenzar',
    'nav.history': 'Historial',
    'nav.profile': 'Perfil',
    'nav.back': 'Volver al Inicio',
    
    // Common
    'common.back': 'Atrás',
    'common.backToHome': 'Volver al Inicio',
    'common.logout': 'Cerrar Sesión',
    'common.upgrade': 'Actualizar',
    'common.upgradeForUnlimited': 'Actualizar para transcripciones ilimitadas.',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.refresh': 'Actualizar',
    
    // Notifications Spanish
    'notifications.title': 'Notificaciones',
    'notifications.markAllRead': 'Marcar todo como leído',
    'notifications.empty': 'Sin notificaciones',
    'notifications.emptyDescription': '¡Estás al día! Las nuevas notificaciones aparecerán aquí.',
    'notifications.transcriptionCompleted': 'Transcripción Completada',
    'notifications.transcriptionFailed': 'Transcripción Falló',
    'notifications.system': 'Notificación del Sistema',
    'notifications.timeAgo.justNow': 'Justo ahora',
    'notifications.timeAgo.minutesAgo': 'hace {minutes} minutos',
    'notifications.timeAgo.hoursAgo': 'hace {hours} horas',
    'notifications.timeAgo.daysAgo': 'hace {days} días',
    'notifications.unreadCount': '{count} notificaciones no leídas',
    
    // Hero Section
    'hero.title': 'Convierte Videos a Texto',
    'hero.subtitle': 'en Segundos',
    'hero.description': 'Potente servicio de transcripción de video impulsado por IA. Sube cualquier URL de video y obtén transcripciones precisas al instante. Perfecto para creadores de contenido, estudiantes y profesionales.',
    'hero.placeholder': 'Pega la URL de tu video aquí (YouTube, Vimeo, etc.)',
    'hero.transcribe': 'Transcribir',
    'hero.processing': 'Procesando...',
    'hero.remaining': 'transcripciones gratuitas restantes',
    
    // Features
    'features.title': '¿Por qué elegir VideoScript?',
    'features.subtitle': 'Experimenta el servicio de transcripción de video más rápido y preciso impulsado por tecnología IA avanzada.',
    'features.fast.title': 'Súper Rápido',
    'features.fast.desc': 'Obtén tus transcripciones de video en segundos, no minutos. Nuestra IA optimizada procesa videos hasta 10 veces más rápido que la competencia con acceso instantáneo a tu historial completo.',
    'features.accurate.title': '99% Precisión',
    'features.accurate.desc': 'Precisión líder en la industria con soporte para múltiples idiomas y acentos. Transcripciones perfectas cada vez, todas guardadas en tu panel de historial personal.',
    'features.secure.title': 'Historial Completo',
    'features.secure.desc': 'Accede a todas tus transcripciones en cualquier momento con nuestro seguimiento integral del historial. Busca, organiza y gestiona tus transcripciones con extracción inteligente de títulos de video.',
    
    // Pricing
    'pricing.title': 'Precios Simples y Transparentes',
    'pricing.subtitle': 'Comienza gratis, actualiza cuando necesites más. Sin tarifas ocultas, cancela en cualquier momento.',
    'pricing.free.title': 'Gratis',
    'pricing.free.subtitle': 'Perfecto para probar',
    'pricing.free.transcriptions': '3 transcripciones por día',
    'pricing.free.duration': 'Hasta 3 minutos por video',
    'pricing.free.accuracy': 'Precisión básica',
    'pricing.free.format': 'Descarga como TXT',
    'pricing.free.button': 'Plan Actual',
    'pricing.pro.title': 'Pro',
    'pricing.pro.subtitle': 'por mes',
    'pricing.pro.popular': 'Más Popular',
    'pricing.pro.unlimited': 'Transcripciones ilimitadas',
    'pricing.pro.duration': 'Hasta 2 horas por video',
    'pricing.pro.accuracy': 'Precisión premium (99%)',
    'pricing.pro.formats': 'Múltiples formatos (TXT, SRT, VTT)',
    'pricing.pro.priority': 'Procesamiento prioritario',
    'pricing.pro.support': 'Soporte por email',
    'pricing.pro.button': 'Actualizar a Pro',
    'pricing.enterprise.title': 'Empresarial',
    'pricing.enterprise.subtitle': 'Para equipos grandes',
    'pricing.enterprise.everything': 'Todo en Pro',
    'pricing.enterprise.api': 'Integración API personalizada',
    'pricing.enterprise.whitelabel': 'Opciones de marca blanca',
    'pricing.enterprise.phone': 'Soporte telefónico 24/7',
    'pricing.enterprise.sla': 'Garantía SLA',
    'pricing.enterprise.button': 'Contactar Ventas',
    'pricing.payment': 'Pago seguro proporcionado por',
    
    // Testimonials
    'testimonials.title': 'Confiado por Creadores de Contenido Mundial',
    'testimonials.subtitle': 'Únete a miles de usuarios satisfechos que confían en VideoScript para sus necesidades de transcripción.',
    'testimonials.sarah.text': 'VideoScript ha revolucionado mi flujo de trabajo de creación de contenido. La precisión es increíble y me ahorra horas de trabajo de transcripción manual cada semana.',
    'testimonials.sarah.name': 'Sarah Johnson',
    'testimonials.sarah.role': 'Creadora de YouTube',
    'testimonials.mike.text': 'Como estudiante, VideoScript me ayuda a convertir videos de conferencias a texto para estudiar mejor. El nivel gratuito es perfecto para mis necesidades.',
    'testimonials.mike.name': 'Mike Chen',
    'testimonials.mike.role': 'Estudiante Universitario',
    'testimonials.lisa.text': 'La precisión y velocidad son incomparables. Usamos VideoScript para todos nuestros materiales de entrenamiento corporativo y los resultados son consistentemente excelentes.',
    'testimonials.lisa.name': 'Lisa Rodriguez',
    'testimonials.lisa.role': 'Gerente de Entrenamiento',
    
    // Authentication
    'auth.register.title': 'Crear Cuenta',
    'auth.register.description': 'Comienza con VideoScript hoy',
    'auth.register.username': 'Nombre de Usuario',
    'auth.register.usernamePlaceholder': 'Elige un nombre de usuario único',
    'auth.register.firstName': 'Nombre',
    'auth.register.firstNamePlaceholder': 'Ingresa tu nombre',
    'auth.register.lastName': 'Apellido',
    'auth.register.lastNamePlaceholder': 'Ingresa tu apellido',
    'auth.register.email': 'Email',
    'auth.register.emailPlaceholder': 'Ingresa tu dirección de email',
    'auth.register.password': 'Contraseña',
    'auth.register.passwordPlaceholder': 'Crea una contraseña segura',
    'auth.register.confirmPassword': 'Confirmar Contraseña',
    'auth.register.confirmPasswordPlaceholder': 'Confirma tu contraseña',
    'auth.register.submit': 'Crear Cuenta',
    'auth.register.hasAccount': '¿Ya tienes una cuenta?',
    'auth.register.signIn': 'Iniciar sesión',
    'auth.register.success.title': 'Cuenta Creada',
    'auth.register.success.description': 'Revisa tu email para el código de verificación',
    'auth.register.error': 'Error al crear la cuenta',
    'auth.register.steps.personalInfo': 'Información Personal',
    'auth.register.steps.personalInfoDesc': 'Información básica',
    'auth.register.steps.security': 'Seguridad',
    'auth.register.steps.securityDesc': 'Crear contraseña',
    'auth.register.steps.verify': 'Verificar',
    'auth.register.steps.verifyDesc': 'Verificación de email',
    
    // Multi-step registration
    'auth.register.step1.title': 'Información Personal',
    'auth.register.step1.subtitle': 'Información básica',
    'auth.register.step2.title': 'Seguridad',
    'auth.register.step2.subtitle': 'Crear contraseña',
    'auth.register.step3.title': 'Verificar',
    'auth.register.step3.subtitle': 'Verificación de email',
    'auth.register.continue': 'Continuar a Contraseña',
    'auth.register.back': 'Atrás',
    'auth.register.createAccount': 'Crear Cuenta',

    'auth.verify.title': 'Verificar Email',
    'auth.verify.description': 'Enviamos un código de verificación a',
    'auth.verify.code': 'Código de Verificación',
    'auth.verify.codePlaceholder': '123456',
    'auth.verify.submit': 'Verificar Email',
    'auth.verify.noCode': '¿No recibiste el código?',
    'auth.verify.resendCode': 'Reenviar Código',
    'auth.verify.backToRegister': 'Volver a Registro',
    'auth.verify.success.title': 'Email Verificado',
    'auth.verify.success.description': '¡Bienvenido a VideoScript!',
    'auth.verify.error': 'Código de verificación inválido',
    'auth.verify.resend.success.title': 'Código Enviado',
    'auth.verify.resend.success.description': 'Un nuevo código de verificación ha sido enviado a tu email',
    'auth.verify.resend.error': 'Error al reenviar código de verificación',

    'auth.login.title': 'Bienvenido de Vuelta',
    'auth.login.description': 'Inicia sesión en tu cuenta de VideoScript',
    'auth.login.email': 'Email',
    'auth.login.emailPlaceholder': 'Ingresa tu email',
    'auth.login.password': 'Contraseña',
    'auth.login.passwordPlaceholder': 'Ingresa tu contraseña',
    'auth.login.submit': 'Iniciar Sesión',
    'auth.login.forgotPassword': '¿Olvidaste tu Contraseña',
    'auth.login.noAccount': '¿No tienes una cuenta?',
    'auth.login.signUp': 'Registrarse',
    'auth.login.success.title': 'Bienvenido de Vuelta',
    'auth.login.success.description': 'Sesión iniciada exitosamente',
    'auth.login.error': 'Email o contraseña inválidos',

    // Forgot Password Spanish
    'auth.forgot.title': '¿Olvidaste tu Contraseña?',
    'auth.forgot.description': 'Ingresa tu dirección de email y te enviaremos un enlace para restablecer tu contraseña',
    'auth.forgot.email': 'Dirección de Email',
    'auth.forgot.emailPlaceholder': 'Ingresa tu dirección de email',
    'auth.forgot.submit': 'Enviar Enlace de Restablecimiento',
    'auth.forgot.sending': 'Enviando',
    'auth.forgot.backToLogin': 'Volver al Login',
    'auth.forgot.success.title': 'Revisa tu Email',
    'auth.forgot.success.description': 'Si existe una cuenta con ese email, se ha enviado un enlace de restablecimiento de contraseña.',
    'auth.forgot.error': 'Error al enviar enlace de restablecimiento',

    // Reset Password Spanish
    'auth.reset.title': 'Restablecer Contraseña',
    'auth.reset.description': 'Ingresa tu nueva contraseña',
    'auth.reset.newPassword': 'Nueva Contraseña',
    'auth.reset.newPasswordPlaceholder': 'Ingresa tu nueva contraseña',
    'auth.reset.confirmPassword': 'Confirmar Contraseña',
    'auth.reset.confirmPasswordPlaceholder': 'Confirma tu nueva contraseña',
    'auth.reset.submit': 'Restablecer Contraseña',
    'auth.reset.resetting': 'Restableciendo',
    'auth.reset.backToLogin': 'Volver al Login',
    'auth.reset.success.title': 'Contraseña Restablecida Exitosamente',
    'auth.reset.success.description': 'Tu contraseña ha sido restablecida. Ahora puedes iniciar sesión con tu nueva contraseña.',
    'auth.reset.loginNow': 'Iniciar Sesión Ahora',
    'auth.reset.error': 'Error al restablecer contraseña',
    'auth.reset.invalidLink': 'Enlace de restablecimiento inválido o expirado',
    'auth.reset.requestNewLink': 'Solicitar Nuevo Enlace de Restablecimiento',
    'auth.reset.showPassword': 'Mostrar contraseña',
    'auth.reset.hidePassword': 'Ocultar contraseña',
    'auth.loginRequired': 'Se requiere iniciar sesión',
    'auth.loginMessage': 'Por favor inicia sesión para comenzar a transcribir tus videos',
    'auth.signIn': 'Iniciar Sesión',
    
    // Results
    'results.title': 'Tu Transcripción',
    'results.download': 'Descargar TXT',
    'results.copy': 'Copiar Texto',
    'results.duration': 'Duración',
    'results.words': 'Palabras',
    'results.accuracy': 'Precisión',
    'results.processing': 'Procesamiento',
    
    // Payment Modal
    'payment.title': 'Elige Método de Pago',
    'payment.plan': 'Plan',
    'payment.description': 'Suscripción mensual para transcripciones ilimitadas',
    'payment.stripe': 'Pagar con Stripe',
    'payment.paypal': 'PayPal',
    'payment.secure': 'Asegurado con encriptación SSL de 256 bits',
    
    // Forms
    'form.email': 'Dirección de Email',
    'form.emailPlaceholder': 'Ingresa tu dirección de email',
    'form.continue': 'Continuar al Pago',
    'form.subscribe': 'Suscribirse Ahora',
    'form.complete': 'Completar Pago',
    'form.setupError': 'Error de Configuración',
    'form.paymentError': 'Error de Configuración de Pago',
    'form.tryAgain': 'Intentar de Nuevo',
    'form.backHome': 'Volver al Inicio',
    'form.back': 'Atrás',
    
    // Messages
    'messages.success': 'Éxito',
    'messages.error': 'Error',
    'messages.transcribed': '¡Video transcrito exitosamente!',
    'messages.failed': 'Error al transcribir video. Por favor intenta de nuevo.',
    'messages.invalidUrl': 'Por favor ingresa una URL válida',
    'messages.enterUrl': 'Por favor ingresa una URL de video',
    'messages.limitReached': 'Has alcanzado tu límite de nivel gratuito. Por favor actualiza para continuar.',
    'messages.paymentFailed': 'Pago Fallido',
    'messages.paymentSuccess': 'Pago Exitoso',
    'messages.thankYou': '¡Gracias por tu compra!',
    'messages.subscriptionSuccess': '¡Bienvenido a VideoScript Pro!',
    'messages.welcomePro': 'Tu suscripción está ahora activa. Disfruta transcripciones ilimitadas y características premium.',
    'messages.startTranscribing': 'Comenzar a Transcribir',
    'messages.copied': '¡Transcripción copiada al portapapeles!',
    'messages.downloadStarted': 'Tu transcripción ha sido descargada como archivo de texto.',
    'messages.copyFailed': 'Error al copiar al portapapeles.',
    'messages.emailRequired': 'Por favor ingresa tu dirección de email',
    'messages.settingUp': 'Configurando...',
    'messages.returnHome': 'Volver al Inicio',
    'messages.videoTooLong': 'El video tiene una duración muy larga. Por favor, usa un video de máximo 3 minutos.',

    // Transcription History
    'history.title': 'Transcripciones Recientes',
    'history.empty': 'No hay transcripciones aún',
    'history.empty.description': 'Tu historial de transcripciones aparecerá aquí',
    'history.loading': 'Cargando transcripciones...',
    'history.error': 'Error al cargar transcripciones',
    'history.duration': 'Duración',
    'history.words': 'Palabras',
    'history.accuracy': 'Precisión',
    'history.processing': 'Tiempo de Procesamiento',
    'history.ago': 'hace',
    'history.copyText': 'Copiar Texto',
    'history.download': 'Descargar',
    'history.view': 'Ver Detalles',
    'history.createdAt': 'Creado',
    'history.copied': '¡Texto copiado al portapapeles!',

    // Transcription Form Spanish
    'transcription.newTranscription': 'Nueva Transcripción',
    'transcription.enterVideoUrl': 'Ingresa una URL de video para comenzar a transcribir',
    'transcription.videoUrl': 'URL del Video',
    'transcription.videoUrlPlaceholder': 'https://www.youtube.com/watch?v=...',
    'transcription.processing': 'Procesando...',
    'transcription.success.title': 'Transcripción Completa',
    'transcription.success.description': '¡Tu video ha sido transcrito exitosamente!',
    'transcription.error.title': 'Error en Transcripción',
    'transcription.error.description': 'Hubo un error procesando tu video. Por favor, inténtalo de nuevo.',

    // Profile translations Spanish
    'profile.title': 'Perfil',
    'profile.description': 'Gestiona la información de tu cuenta y preferencias.',
    'profile.verified': 'Verificado',
    'profile.plan': 'Plan',
    'profile.memberSince': 'Miembro desde',
    'profile.transcriptionsUsed': 'transcripciones utilizadas',
    'profile.edit.title': 'Editar Perfil',
    'profile.edit.description': 'Actualiza la información de tu perfil. Nota: El email no se puede cambiar.',
    'profile.edit.username': 'Nombre de Usuario',
    'profile.edit.usernamePlaceholder': 'Ingresa tu nombre de usuario',
    'profile.edit.firstName': 'Nombre',
    'profile.edit.firstNamePlaceholder': 'Ingresa tu nombre',
    'profile.edit.lastName': 'Apellido',
    'profile.edit.lastNamePlaceholder': 'Ingresa tu apellido',
    'profile.edit.emailNote': 'El email no se puede cambiar',
    'profile.edit.submit': 'Actualizar Perfil',
    'profile.update.success.title': 'Perfil Actualizado',
    'profile.update.success.description': 'Tu perfil ha sido actualizado exitosamente.',
    'profile.update.error': 'Error al actualizar perfil',
    'profile.editProfile': 'Editar Perfil',
    
    // Dashboard Page
    'dashboard.welcomeBack': '¡Bienvenido de nuevo, {{name}}!',
    'dashboard.description': 'Gestiona tus transcripciones y configuración de cuenta',
    'dashboard.accountOverview': 'Resumen de Cuenta',
    'dashboard.plan': 'Plan',
    'dashboard.free': 'Gratuito',
    'dashboard.pro': 'Pro',
    'dashboard.upgrade': 'Actualizar',
    'dashboard.dailyUsage': 'Uso Diario',
    'dashboard.dailyLimitReached': 'Límite diario alcanzado',
    'dashboard.totalTranscriptions': 'Transcripciones Totales',
    'dashboard.memberSince': 'Miembro Desde',
    
    // Transcription Status Spanish
    'transcription.status.processing': 'Procesando',
    'transcription.status.completed': 'Completado',
    'transcription.status.failed': 'Fallido',
    'transcription.words': 'palabras',
    'transcriptions.processing': 'Procesando',
    'transcriptions.completed': 'Completado',
    'transcriptions.failed': 'Fallido',
    'transcriptions.refreshed': 'Historial Actualizado',
    'transcriptions.refreshedDesc': 'El historial de transcripciones se ha actualizado exitosamente',
    
    // Status translations Spanish
    'status.processing': 'Procesando...',
    'status.completed': 'Completado',
    'status.failed': 'Fallido',
    'status.pending': 'Pendiente...',
    
    // Transcription Queueing Spanish
    'transcription.queued.title': 'Transcripción en Cola',
    'transcription.queued.description': 'Tu video "{{title}}" ha sido puesto en cola para procesamiento. Verás los resultados aquí pronto.',
    
    // Notifications Spanish
    'notifications.completed.title': '¡Transcripción Completada!',
    'notifications.completed.description': 'Tu video "{{title}}" ha sido transcrito exitosamente y está listo para ver.',
    'notifications.failed.title': 'Transcripción Falló',
    'notifications.failed.description': 'No pudimos procesar tu video "{{title}}". Por favor, inténtalo de nuevo.',
    'notifications.processing.title': 'Procesamiento Iniciado',
    'notifications.processing.description': 'Tu video "{{title}}" está siendo transcrito ahora.',
    
    // Subscription Page
    'subscription.title': 'Suscríbete a VideoScript Pro',
    'subscription.planTitle': 'Plan Pro',
    'subscription.month': '/mes',
    'subscription.setupComplete': 'Completar tu Suscripción',
    'subscription.setupError': 'Error de Configuración de Suscripción',
    'subscription.setupErrorDesc': 'No se pudo configurar la suscripción. Por favor, inténtalo de nuevo.',
    'subscription.welcomePro': '¡Bienvenido a Pro!',
    'subscription.activeDesc': 'Tu suscripción está ahora activa. Disfruta de transcripciones ilimitadas y características premium.',
    'subscription.startTranscribing': 'Comenzar a Transcribir',
    'subscription.processing': 'Procesando...',
    'subscription.subscribeNow': 'Suscribirse Ahora',
    'subscription.tryAgain': 'Intentar de Nuevo',
    'subscription.subscriptionFor': 'Suscripción para',
    'subscription.sslSecured': 'Asegurado por encriptación SSL de 256 bits',
    
    // Footer
    'footer.description': 'El servicio de transcripción de video más rápido y preciso impulsado por IA. Transforma tus videos en texto editable y searchable en segundos.',
    'footer.product': 'Producto',
    'footer.support': 'Soporte',
    'footer.apiDocs': 'Documentación API',
    'footer.status': 'Estado',
    'footer.helpCenter': 'Centro de Ayuda',
    'footer.contact': 'Contáctanos',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Servicio',
    'footer.copyright': '© 2024 VideoScript. Todos los derechos reservados. Hecho con ❤️ para creadores de contenido en todo el mundo.',
    'footer.getStarted': 'Comenzar',
    'footer.noCommitments': 'Cancela en cualquier momento. Sin compromisos a largo plazo.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      // Always check URL first to determine language from route
      const pathname = window.location.pathname;
      if (pathname.includes('/es')) return 'es';
      if (pathname.includes('/en')) return 'en';
      
      // For GitHub Pages base URL access, default to English to prevent redirect loops
      const isGitHubPages = pathname.includes('/video-transcript');
      if (isGitHubPages && (pathname === '/video-transcript' || pathname === '/video-transcript/')) {
        return 'en';
      }
      
      // For base URL access (without language), use stored preference or browser language
      const saved = localStorage.getItem('language') as Language;
      if (saved) return saved;
      const browserLang = navigator.language.toLowerCase();
      return browserLang.startsWith('es') ? 'es' : 'en';
    }
    return 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    if (lang === language) {
      console.log(`Language already set to ${lang}, skipping update`);
      return;
    }
    console.log(`Language context: changing from ${language} to ${lang}`);
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}