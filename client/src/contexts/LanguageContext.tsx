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
    'nav.back': 'Back to Home',
    
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
    'features.fast.desc': 'Get your video transcriptions in seconds, not minutes. Our optimized AI processes videos up to 10x faster than competitors.',
    'features.accurate.title': '99% Accuracy',
    'features.accurate.desc': 'Industry-leading accuracy with support for multiple languages and accents. Perfect transcriptions every time.',
    'features.secure.title': 'Secure & Private',
    'features.secure.desc': 'Your data is encrypted and never stored. We process your videos securely and delete them immediately after transcription.',
    
    // Pricing
    'pricing.title': 'Simple, Transparent Pricing',
    'pricing.subtitle': 'Start free, upgrade when you need more. No hidden fees, cancel anytime.',
    'pricing.free.title': 'Free',
    'pricing.free.subtitle': 'Perfect for trying out',
    'pricing.free.transcriptions': '3 transcriptions per day',
    'pricing.free.duration': 'Up to 2 minutes per video',
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

    'auth.verify.title': 'Verify Email',
    'auth.verify.description': 'We sent a verification code to',
    'auth.verify.code': 'Verification Code',
    'auth.verify.codePlaceholder': '123456',
    'auth.verify.submit': 'Verify Email',
    'auth.verify.noCode': "Didn't receive the code?",
    'auth.verify.backToRegister': 'Back to Register',
    'auth.verify.success.title': 'Email Verified',
    'auth.verify.success.description': 'Welcome to VideoScript!',
    'auth.verify.error': 'Invalid verification code',

    'auth.login.title': 'Welcome Back',
    'auth.login.description': 'Sign in to your VideoScript account',
    'auth.login.email': 'Email',
    'auth.login.emailPlaceholder': 'Enter your email',
    'auth.login.password': 'Password',
    'auth.login.passwordPlaceholder': 'Enter your password',
    'auth.login.submit': 'Sign In',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.signUp': 'Sign up',
    'auth.login.success.title': 'Welcome Back',
    'auth.login.success.description': 'Successfully signed in',
    'auth.login.error': 'Invalid email or password',
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
    'nav.back': 'Volver al Inicio',
    
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
    'features.fast.desc': 'Obtén tus transcripciones de video en segundos, no minutos. Nuestra IA optimizada procesa videos hasta 10 veces más rápido que la competencia.',
    'features.accurate.title': '99% Precisión',
    'features.accurate.desc': 'Precisión líder en la industria con soporte para múltiples idiomas y acentos. Transcripciones perfectas cada vez.',
    'features.secure.title': 'Seguro y Privado',
    'features.secure.desc': 'Tus datos están encriptados y nunca almacenados. Procesamos tus videos de forma segura y los eliminamos inmediatamente después de la transcripción.',
    
    // Pricing
    'pricing.title': 'Precios Simples y Transparentes',
    'pricing.subtitle': 'Comienza gratis, actualiza cuando necesites más. Sin tarifas ocultas, cancela en cualquier momento.',
    'pricing.free.title': 'Gratis',
    'pricing.free.subtitle': 'Perfecto para probar',
    'pricing.free.transcriptions': '3 transcripciones por día',
    'pricing.free.duration': 'Hasta 2 minutos por video',
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

    'auth.verify.title': 'Verificar Email',
    'auth.verify.description': 'Enviamos un código de verificación a',
    'auth.verify.code': 'Código de Verificación',
    'auth.verify.codePlaceholder': '123456',
    'auth.verify.submit': 'Verificar Email',
    'auth.verify.noCode': '¿No recibiste el código?',
    'auth.verify.backToRegister': 'Volver a Registro',
    'auth.verify.success.title': 'Email Verificado',
    'auth.verify.success.description': '¡Bienvenido a VideoScript!',
    'auth.verify.error': 'Código de verificación inválido',

    'auth.login.title': 'Bienvenido de Vuelta',
    'auth.login.description': 'Inicia sesión en tu cuenta de VideoScript',
    'auth.login.email': 'Email',
    'auth.login.emailPlaceholder': 'Ingresa tu email',
    'auth.login.password': 'Contraseña',
    'auth.login.passwordPlaceholder': 'Ingresa tu contraseña',
    'auth.login.submit': 'Iniciar Sesión',
    'auth.login.noAccount': '¿No tienes una cuenta?',
    'auth.login.signUp': 'Registrarse',
    'auth.login.success.title': 'Bienvenido de Vuelta',
    'auth.login.success.description': 'Sesión iniciada exitosamente',
    'auth.login.error': 'Email o contraseña inválidos',
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