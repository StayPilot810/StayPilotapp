import type { Locale } from './navbar'

export type AuthDashboardCopy = {
  loginBack: string
  loginTitle: string
  loginAccountsDetectedNone: string
  loginAccountsDetectedSome: string
  loginAutoConnected: string
  loginConnected: string
  loginIdentifierLabel: string
  loginIdentifierPlaceholder: string
  loginPasswordLabel: string
  loginPasswordPlaceholder: string
  loginRemember: string
  loginForgot: string
  loginSubmit: string
  loginFreeAccess: string
  loginError: string
  loginTrust: string

  signupBack: string
  signupTitle: string
  signupTrialPrefix: string
  signupTrialSuffix: string
  signupAccountsNone: string
  signupAccountsSome: string
  signupPlanStarter: string
  signupPlanPro: string
  signupPlanScale: string
  signupFirstName: string
  signupLastName: string
  signupUsername: string
  signupEmail: string
  signupPassword: string
  signupCompanyOptional: string
  signupPhone: string
  signupCardTitle: string
  signupCardSubtitle: string
  signupCardHolder: string
  signupCardNumber: string
  signupCardExpiry: string
  signupCardCvc: string
  signupSubmit: string
  signupDuplicateError: string
  signupAlready: string
  signupLoginLink: string
  signupAdminTitle: string
  signupAdminReset: string
  signupAdminCount: string
  signupAdminNone: string
  signupTrustTitle: string
  signupTrustSubtitle: string
  signupTrustRevenue: string
  signupTrustCalendar: string
  signupTrustCleaning: string
  signupTrustSupplies: string
  signupTrustHours: string
  signupTrustUsers: string
  signupTrustQuote: string
  signupPlansTitle: string
  signupPlansSubtitle: string

  dashboardActiveOffer: string
  dashboardCurrentPlan: string
  dashboardTitle: string
  dashboardTabsTitle: string
  dashboardTabConnect: string
  dashboardTabCalendar: string
  dashboardTabStats: string
  dashboardTabIntel: string
  dashboardTabCleaning: string
  dashboardTabCompany: string
  dashboardTabExpenses: string
  dashboardTabSupplies: string
  dashboardTabWhatsApp: string
  dashboardTabEarlyAccess: string
  dashboardPremiumScale: string
  dashboardBackToHub: string
  dashboardConnectTitle: string
  dashboardConnectSubtitle: string
  dashboardConnectAirbnb: string
  dashboardConnectBooking: string
  dashboardConnectChannelManager: string
  dashboardConnectConnected: string
  dashboardConnectPending: string
  dashboardConnectAction: string
  dashboardConnectFailed: string
  dashboardChannelOptionalNote: string
  dashboardConnectEmailLabel: string
  dashboardConnectTokenLabel: string
  dashboardConnectPlaceholderEmail: string
  dashboardConnectPlaceholderToken: string
  dashboardConnectGlobalAction: string
  dashboardConnectHelper: string
  dashboardConnectionsOverviewTitle: string
  dashboardConnectionsOverviewSubtitle: string
  dashboardConnectionsColumnPlatform: string
  dashboardConnectionsColumnStatus: string
  dashboardConnectionsAllListings: string
  dashboardConnectionsGlobalSync: string
  dashboardReservationAccessTitle: string
  dashboardReservationAccessSubtitle: string
  dashboardIcalLabel: string
  dashboardApiLabel: string
  dashboardAccountIdLabel: string
  dashboardPlaceholderIcal: string
  dashboardPlaceholderApi: string
  dashboardPlaceholderAccountId: string
  dashboardRequiredLinksTitle: string
  dashboardRequiredLinksAirbnb: string
  dashboardRequiredLinksBooking: string
  dashboardRequiredLinksChannelManager: string
  dashboardSaveConnections: string
  dashboardChannelHelpTitle: string
  dashboardChannelHelpBody: string
  dashboardChannelPlanLimit: string
  dashboardSummaryTitle: string
  dashboardSummaryPlatform: string
  dashboardSummaryConnectedCount: string
  dashboardSummaryShowListings: string
  dashboardSummaryNoListings: string
  dashboardReservationsTitle: string
  dashboardReservationsSubtitle: string
  dashboardReservationId: string
  dashboardReservationPlatform: string
  dashboardReservationGuest: string
  dashboardReservationDates: string
  dashboardReservationAmount: string
  dashboardReservationStatus: string
  dashboardReservationListing: string
  planFreeLabel: string
}

export const authDashboardTranslations: Record<Locale, AuthDashboardCopy> = {
  fr: {
    loginBack: '← Retour au menu principal',
    loginTitle: 'Accédez à votre espace StayPilot',
    loginAccountsDetectedNone: "Aucun compte détecté. Créez d'abord un compte via Inscription.",
    loginAccountsDetectedSome: 'compte(s) détecté(s)',
    loginAutoConnected: 'Connexion automatique activée. Vous êtes déjà connecté.',
    loginConnected: 'Connecté. Vous pouvez continuer vers votre dashboard.',
    loginIdentifierLabel: "Email / nom d'utilisateur",
    loginIdentifierPlaceholder: "Email / nom d'utilisateur",
    loginPasswordLabel: 'Mot de passe',
    loginPasswordPlaceholder: 'Votre mot de passe',
    loginRemember: 'Rester connecté',
    loginForgot: 'Mot de passe oublié ?',
    loginSubmit: 'Accéder à mon dashboard',
    loginFreeAccess: 'Y accéder gratuitement',
    loginError: "Identifiants invalides ou aucun compte n'existe encore.",
    loginTrust: 'Accès sécurisé • Aucune donnée partagée',

    signupBack: '← Retour au menu principal',
    signupTitle: 'Commencez à optimiser vos locations',
    signupTrialPrefix: '14 jours gratuits puis',
    signupTrialSuffix: 'selon le plan choisi',
    signupAccountsNone: 'Aucun compte créé pour le moment',
    signupAccountsSome: 'compte(s) déjà créé(s) sur cette application',
    signupPlanStarter: 'Plan Starter',
    signupPlanPro: 'Plan Pro',
    signupPlanScale: 'Plan Scale',
    signupFirstName: 'Prénom',
    signupLastName: 'Nom',
    signupUsername: "Nom d'utilisateur",
    signupEmail: 'Email',
    signupPassword: 'Mot de passe',
    signupCompanyOptional: 'Société (facultatif)',
    signupPhone: 'Numéro de téléphone',
    signupCardTitle: 'Carte bancaire (activation après 14 jours gratuits)',
    signupCardSubtitle: "Votre carte est utilisée pour démarrer automatiquement l’abonnement à la fin de l’essai.",
    signupCardHolder: 'Nom sur la carte',
    signupCardNumber: 'Numéro de carte',
    signupCardExpiry: 'MM/AA',
    signupCardCvc: 'CVC',
    signupSubmit: 'Créer mon compte',
    signupDuplicateError: "Un compte existe déjà avec cet email ou ce nom d'utilisateur.",
    signupAlready: 'Déjà un compte ?',
    signupLoginLink: 'Se connecter',
    signupAdminTitle: 'Admin test — comptes créés',
    signupAdminReset: 'Reset page / données',
    signupAdminCount: 'compte(s) listé(s) pour vos tests',
    signupAdminNone: 'Aucun compte de test enregistré',
    signupTrustTitle: 'Pourquoi les clients restent ?',
    signupTrustSubtitle: 'Des résultats concrets, rapidement visibles sur le terrain.',
    signupTrustRevenue: '+18% de revenus en moyenne sur les périodes clés',
    signupTrustCalendar: 'Moins d’erreurs de calendrier et de doubles réservations',
    signupTrustCleaning: 'Gestion des ménages avec checklists, photos et suivi par logement',
    signupTrustSupplies: 'Gestion des consommables et achats pour éviter les ruptures',
    signupTrustHours: 'Jusqu’à 8h gagnées par semaine sur l’administratif et les relances',
    signupTrustUsers: '+500 propriétaires utilisent déjà StayPilot',
    signupTrustQuote: '“On a réduit les imprévus et gagné du temps chaque semaine. Enfin une vue claire sur notre rentabilité.”',
    signupPlansTitle: 'Choisissez votre plan',
    signupPlansSubtitle: 'Sélectionnez l’offre la plus adaptée avant de créer votre compte.',

    dashboardActiveOffer: 'Offre active : actuellement vous avez l’offre',
    dashboardCurrentPlan: 'Forfait actuel',
    dashboardTitle: 'Dashboard StayPilot',
    dashboardTabsTitle: 'Onglets principaux',
    dashboardTabConnect: 'Connecter vos logements',
    dashboardTabCalendar: 'Calendrier',
    dashboardTabStats: "Statistiques encaissement + taux d'occupation",
    dashboardTabIntel: 'Veille informationnelle sur votre logement',
    dashboardTabCleaning: 'Prestataire ménage',
    dashboardTabCompany: 'Société (facultatif)',
    dashboardTabExpenses: 'Tableau des charges',
    dashboardTabSupplies: 'Liste des consommables',
    dashboardTabWhatsApp: 'WhatsApp',
    dashboardTabEarlyAccess: 'Accès anticipé aux nouvelles fonctionnalités',
    dashboardPremiumScale: 'Premium exclusif • Scale',
    dashboardBackToHub: 'Retour au dashboard',
    dashboardConnectTitle: 'Connecter vos logements',
    dashboardConnectSubtitle: 'Connectez vos comptes Airbnb, Booking et votre Channel Manager.',
    dashboardConnectAirbnb: 'Connexion Airbnb',
    dashboardConnectBooking: 'Connexion Booking',
    dashboardConnectChannelManager: 'Connexion Channel Manager',
    dashboardConnectConnected: 'Connecte',
    dashboardConnectPending: 'Non connecte',
    dashboardConnectAction: 'Connecter',
    dashboardConnectFailed: 'Connexion echouee, verifiez les champs.',
    dashboardChannelOptionalNote: "ne pas prendre en compte si vous n'en avez pas",
    dashboardConnectEmailLabel: 'Email compte',
    dashboardConnectTokenLabel: 'Token API / mot de passe app',
    dashboardConnectPlaceholderEmail: 'email@exemple.com',
    dashboardConnectPlaceholderToken: 'Collez votre token ou mot de passe applicatif',
    dashboardConnectGlobalAction: 'Tout connecter en une fois',
    dashboardConnectHelper: 'Renseignez uniquement les plateformes que vous utilisez, puis lancez la connexion globale.',
    dashboardConnectionsOverviewTitle: 'Toutes les connexions',
    dashboardConnectionsOverviewSubtitle: 'Visualisez en un coup d oeil Airbnb, Booking et Channel Manager.',
    dashboardConnectionsColumnPlatform: 'Plateforme',
    dashboardConnectionsColumnStatus: 'Statut',
    dashboardConnectionsAllListings: 'Toutes les annonces connectees',
    dashboardConnectionsGlobalSync: 'Synchronisation globale',
    dashboardReservationAccessTitle: 'Connecter Airbnb et Booking',
    dashboardReservationAccessSubtitle: 'Renseignez vos accès pour récupérer automatiquement les réservations.',
    dashboardIcalLabel: 'Lien iCal',
    dashboardApiLabel: 'Token API',
    dashboardAccountIdLabel: 'Identifiant compte',
    dashboardPlaceholderIcal: 'https://.../calendar.ics',
    dashboardPlaceholderApi: 'api_xxx...',
    dashboardPlaceholderAccountId: 'account_id',
    dashboardRequiredLinksTitle: 'Liens et accès nécessaires',
    dashboardRequiredLinksAirbnb: 'Airbnb: lien iCal des annonces + token API (si disponible)',
    dashboardRequiredLinksBooking: 'Booking: API key + hotel ID / account ID',
    dashboardRequiredLinksChannelManager: 'Channel Manager: URL webhook + clé API de synchronisation',
    dashboardSaveConnections: 'Enregistrer les connexions',
    dashboardChannelHelpTitle: 'Comment ça fonctionne ?',
    dashboardChannelHelpBody:
      'Si vous avez un channel manager, connectez vos nouveaux logements à vos channels. Les logements remonteront ensuite automatiquement sur votre compte StayPilot.',
    dashboardChannelPlanLimit:
      'Si votre offre est inférieure au nombre de logements connectés sur votre channel manager, les derniers appartements ajoutés ne seront pas pris en compte.',
    dashboardSummaryTitle: 'Récapitulatif des logements connectés',
    dashboardSummaryPlatform: 'Plateforme',
    dashboardSummaryConnectedCount: 'Logements connectes',
    dashboardSummaryShowListings: 'Voir tous les logements connectes',
    dashboardSummaryNoListings: 'Aucun logement connecte pour le moment',
    dashboardReservationsTitle: 'Informations des réservations',
    dashboardReservationsSubtitle: 'Toutes les données récupérées pour chaque réservation connectée.',
    dashboardReservationId: 'Reservation ID',
    dashboardReservationPlatform: 'Plateforme',
    dashboardReservationGuest: 'Voyageur',
    dashboardReservationDates: 'Dates',
    dashboardReservationAmount: 'Montant',
    dashboardReservationStatus: 'Statut',
    dashboardReservationListing: 'Logement',
    planFreeLabel: 'Gratuit',
  },
  en: {
    loginBack: '← Back to main menu', loginTitle: 'Access your StayPilot space', loginAccountsDetectedNone: 'No account detected yet. Create one first via Sign up.',
    loginAccountsDetectedSome: 'account(s) detected', loginAutoConnected: 'Auto-login enabled. You are already connected.', loginConnected: 'Connected. You can continue to your dashboard.',
    loginIdentifierLabel: 'Email / username', loginIdentifierPlaceholder: 'Email / username', loginPasswordLabel: 'Password', loginPasswordPlaceholder: 'Your password',
    loginRemember: 'Keep me logged in', loginForgot: 'Forgot password?', loginSubmit: 'Access my dashboard', loginFreeAccess: 'Access for free', loginError: 'Invalid credentials or no account exists yet.', loginTrust: 'Secure access • No shared data',
    signupBack: '← Back to main menu', signupTitle: 'Start optimizing your rentals', signupTrialPrefix: '14 days free then', signupTrialSuffix: 'depending on selected plan',
    signupAccountsNone: 'No account created yet', signupAccountsSome: 'account(s) already created in this app', signupPlanStarter: 'Starter plan', signupPlanPro: 'Pro plan', signupPlanScale: 'Scale plan',
    signupFirstName: 'First name', signupLastName: 'Last name', signupUsername: 'Username', signupEmail: 'Email', signupPassword: 'Password', signupCompanyOptional: 'Company (optional)', signupPhone: 'Phone number',
    signupCardTitle: 'Card details (activation after 14-day free trial)', signupCardSubtitle: 'Your card starts billing automatically at trial end.', signupCardHolder: 'Name on card', signupCardNumber: 'Card number', signupCardExpiry: 'MM/YY', signupCardCvc: 'CVC',
    signupSubmit: 'Create my account', signupDuplicateError: 'An account already exists with this email or username.', signupAlready: 'Already have an account?', signupLoginLink: 'Sign in',
    signupAdminTitle: 'Test admin — created accounts', signupAdminReset: 'Reset page / data', signupAdminCount: 'account(s) listed for testing', signupAdminNone: 'No test account saved',
    signupTrustTitle: 'Why customers stay', signupTrustSubtitle: 'Concrete outcomes you can see quickly.', signupTrustRevenue: '+18% average revenue during peak periods',
    signupTrustCalendar: 'Fewer calendar errors and double bookings', signupTrustCleaning: 'Cleaning operations with checklists, photos and per-unit tracking',
    signupTrustSupplies: 'Supplies and purchases tracking to avoid stockouts', signupTrustHours: 'Up to 8h saved per week on admin and follow-ups', signupTrustUsers: '500+ owners already use StayPilot',
    signupTrustQuote: '"We reduced surprises and saved time every week. Finally a clear view of profitability."', signupPlansTitle: 'Choose your plan', signupPlansSubtitle: 'Select the best offer before creating your account.',
    dashboardActiveOffer: 'Active offer: you currently have', dashboardCurrentPlan: 'Current plan', dashboardTitle: 'StayPilot Dashboard', dashboardTabsTitle: 'Main tabs',
    dashboardTabConnect: 'Connect your properties', dashboardTabCalendar: 'Calendar', dashboardTabStats: 'Revenue stats + occupancy rate', dashboardTabIntel: 'Local intelligence for your property',
    dashboardTabCleaning: 'Cleaning provider', dashboardTabCompany: 'Company (optional)', dashboardTabExpenses: 'Expense table', dashboardTabSupplies: 'Supplies list', dashboardTabWhatsApp: 'WhatsApp',
    dashboardTabEarlyAccess: 'Early access to new features', dashboardPremiumScale: 'Exclusive premium • Scale', dashboardBackToHub: 'Back to dashboard', dashboardConnectTitle: 'Connect your properties', dashboardConnectSubtitle: 'Connect your Airbnb, Booking and Channel Manager accounts.', dashboardConnectAirbnb: 'Airbnb connection', dashboardConnectBooking: 'Booking connection', dashboardConnectChannelManager: 'Channel Manager connection', dashboardConnectConnected: 'Connected', dashboardConnectPending: 'Not connected', dashboardConnectAction: 'Connect', dashboardConnectFailed: 'Connection failed, please check the fields.', dashboardChannelOptionalNote: 'ignore this if you do not have one', dashboardConnectEmailLabel: 'Account email', dashboardConnectTokenLabel: 'API token / app password', dashboardConnectPlaceholderEmail: 'email@example.com', dashboardConnectPlaceholderToken: 'Paste your token or app password', dashboardConnectGlobalAction: 'Connect everything at once', dashboardConnectHelper: 'Fill only the platforms you use, then launch global connection.', dashboardConnectionsOverviewTitle: 'All connections', dashboardConnectionsOverviewSubtitle: 'See Airbnb, Booking and Channel Manager at a glance.', dashboardConnectionsColumnPlatform: 'Platform', dashboardConnectionsColumnStatus: 'Status', dashboardConnectionsAllListings: 'All listings connected', dashboardConnectionsGlobalSync: 'Global sync', dashboardReservationAccessTitle: 'Connect Airbnb and Booking', dashboardReservationAccessSubtitle: 'Enter your credentials to sync reservations automatically.', dashboardIcalLabel: 'iCal link', dashboardApiLabel: 'API token', dashboardAccountIdLabel: 'Account ID', dashboardPlaceholderIcal: 'https://.../calendar.ics', dashboardPlaceholderApi: 'api_xxx...', dashboardPlaceholderAccountId: 'account_id', dashboardRequiredLinksTitle: 'Required links and access', dashboardRequiredLinksAirbnb: 'Airbnb: listing iCal links + API token (if available)', dashboardRequiredLinksBooking: 'Booking: API key + hotel ID / account ID', dashboardRequiredLinksChannelManager: 'Channel Manager: webhook URL + sync API key', dashboardSaveConnections: 'Save connections', dashboardChannelHelpTitle: 'How does it work?', dashboardChannelHelpBody: 'If you use a channel manager, connect your new properties to your channels. They will then appear automatically in your StayPilot account.', dashboardChannelPlanLimit: 'If your plan limit is lower than the number of properties connected in your channel manager, the most recently added apartments will not be taken into account.', dashboardSummaryTitle: 'Connected listings summary', dashboardSummaryPlatform: 'Platform', dashboardSummaryConnectedCount: 'Connected listings', dashboardSummaryShowListings: 'Show all connected listings', dashboardSummaryNoListings: 'No listing connected yet', dashboardReservationsTitle: 'Reservation information', dashboardReservationsSubtitle: 'All data collected for each connected reservation.', dashboardReservationId: 'Reservation ID', dashboardReservationPlatform: 'Platform', dashboardReservationGuest: 'Guest', dashboardReservationDates: 'Dates', dashboardReservationAmount: 'Amount', dashboardReservationStatus: 'Status', dashboardReservationListing: 'Listing', planFreeLabel: 'Free',
  },
  es: {
    loginBack: '← Volver al menú principal', loginTitle: 'Accede a tu espacio StayPilot', loginAccountsDetectedNone: 'No hay cuentas detectadas. Crea una primero desde Registro.', loginAccountsDetectedSome: 'cuenta(s) detectada(s)',
    loginAutoConnected: 'Conexión automática activada. Ya estás conectado.', loginConnected: 'Conectado. Puedes continuar al dashboard.', loginIdentifierLabel: 'Email / usuario', loginIdentifierPlaceholder: 'Email / usuario',
    loginPasswordLabel: 'Contraseña', loginPasswordPlaceholder: 'Tu contraseña', loginRemember: 'Mantener sesión', loginForgot: '¿Olvidaste la contraseña?', loginSubmit: 'Acceder a mi dashboard', loginFreeAccess: 'Acceder gratis', loginError: 'Credenciales inválidas o no existe ninguna cuenta.', loginTrust: 'Acceso seguro • Sin datos compartidos',
    signupBack: '← Volver al menú principal', signupTitle: 'Empieza a optimizar tus alquileres', signupTrialPrefix: '14 días gratis y luego', signupTrialSuffix: 'según el plan elegido', signupAccountsNone: 'Aún no hay cuentas creadas', signupAccountsSome: 'cuenta(s) ya creada(s) en esta app',
    signupPlanStarter: 'Plan Starter', signupPlanPro: 'Plan Pro', signupPlanScale: 'Plan Scale', signupFirstName: 'Nombre', signupLastName: 'Apellido', signupUsername: 'Nombre de usuario', signupEmail: 'Email', signupPassword: 'Contraseña', signupCompanyOptional: 'Empresa (opcional)', signupPhone: 'Número de teléfono',
    signupCardTitle: 'Tarjeta bancaria (activación tras 14 días gratis)', signupCardSubtitle: 'Tu tarjeta inicia el cobro automático al final de la prueba.', signupCardHolder: 'Nombre en la tarjeta', signupCardNumber: 'Número de tarjeta', signupCardExpiry: 'MM/AA', signupCardCvc: 'CVC',
    signupSubmit: 'Crear mi cuenta', signupDuplicateError: 'Ya existe una cuenta con ese email o usuario.', signupAlready: '¿Ya tienes cuenta?', signupLoginLink: 'Iniciar sesión',
    signupAdminTitle: 'Admin test — cuentas creadas', signupAdminReset: 'Reset página / datos', signupAdminCount: 'cuenta(s) listada(s) para pruebas', signupAdminNone: 'No hay cuentas de prueba guardadas',
    signupTrustTitle: 'Por qué se quedan los clientes', signupTrustSubtitle: 'Resultados concretos visibles rápidamente.', signupTrustRevenue: '+18% de ingresos medios en periodos clave', signupTrustCalendar: 'Menos errores de calendario y dobles reservas',
    signupTrustCleaning: 'Gestión de limpieza con checklists, fotos y seguimiento por vivienda', signupTrustSupplies: 'Gestión de consumibles y compras para evitar faltantes',
    signupTrustHours: 'Hasta 8h ahorradas por semana en tareas administrativas', signupTrustUsers: '+500 propietarios ya usan StayPilot', signupTrustQuote: '"Reducimos imprevistos y ahorramos tiempo cada semana. Por fin una visión clara de rentabilidad."',
    signupPlansTitle: 'Elige tu plan', signupPlansSubtitle: 'Selecciona la mejor oferta antes de crear tu cuenta.',
    dashboardActiveOffer: 'Oferta activa: actualmente tienes', dashboardCurrentPlan: 'Plan actual', dashboardTitle: 'Dashboard StayPilot', dashboardTabsTitle: 'Pestañas principales',
    dashboardTabConnect: 'Conectar tus alojamientos', dashboardTabCalendar: 'Calendario', dashboardTabStats: 'Estadísticas de cobro + ocupación', dashboardTabIntel: 'Inteligencia local para tu alojamiento', dashboardTabCleaning: 'Proveedor de limpieza', dashboardTabCompany: 'Empresa (opcional)',
    dashboardTabExpenses: 'Tabla de gastos', dashboardTabSupplies: 'Lista de consumibles', dashboardTabWhatsApp: 'WhatsApp', dashboardTabEarlyAccess: 'Acceso anticipado a nuevas funcionalidades',
    dashboardPremiumScale: 'Premium exclusivo • Scale', dashboardBackToHub: 'Volver al dashboard', dashboardConnectTitle: 'Conectar tus alojamientos', dashboardConnectSubtitle: 'Conecta tus cuentas de Airbnb, Booking y tu Channel Manager.', dashboardConnectAirbnb: 'Conexion Airbnb', dashboardConnectBooking: 'Conexion Booking', dashboardConnectChannelManager: 'Conexion Channel Manager', dashboardConnectConnected: 'Conectado', dashboardConnectPending: 'No conectado', dashboardConnectAction: 'Conectar', dashboardConnectFailed: 'Conexion fallida, revisa los campos.', dashboardChannelOptionalNote: 'ignorar si no tienes uno', dashboardConnectEmailLabel: 'Email de cuenta', dashboardConnectTokenLabel: 'Token API / contrasena de app', dashboardConnectPlaceholderEmail: 'email@ejemplo.com', dashboardConnectPlaceholderToken: 'Pega tu token o contrasena de aplicacion', dashboardConnectGlobalAction: 'Conectar todo de una vez', dashboardConnectHelper: 'Completa solo las plataformas que usas y lanza la conexion global.', dashboardConnectionsOverviewTitle: 'Todas las conexiones', dashboardConnectionsOverviewSubtitle: 'Ve Airbnb, Booking y Channel Manager de un vistazo.', dashboardConnectionsColumnPlatform: 'Plataforma', dashboardConnectionsColumnStatus: 'Estado', dashboardConnectionsAllListings: 'Todos los anuncios conectados', dashboardConnectionsGlobalSync: 'Sincronizacion global', dashboardReservationAccessTitle: 'Conectar Airbnb y Booking', dashboardReservationAccessSubtitle: 'Introduce tus accesos para sincronizar reservas automaticamente.', dashboardIcalLabel: 'Enlace iCal', dashboardApiLabel: 'Token API', dashboardAccountIdLabel: 'ID de cuenta', dashboardPlaceholderIcal: 'https://.../calendar.ics', dashboardPlaceholderApi: 'api_xxx...', dashboardPlaceholderAccountId: 'account_id', dashboardRequiredLinksTitle: 'Enlaces y accesos necesarios', dashboardRequiredLinksAirbnb: 'Airbnb: enlaces iCal de anuncios + token API (si existe)', dashboardRequiredLinksBooking: 'Booking: API key + hotel ID / account ID', dashboardRequiredLinksChannelManager: 'Channel Manager: URL webhook + clave API de sincronizacion', dashboardSaveConnections: 'Guardar conexiones', dashboardChannelHelpTitle: 'Como funciona?', dashboardChannelHelpBody: 'Si tienes un channel manager, conecta tus nuevos alojamientos a tus channels. Los alojamientos se mostraran automaticamente en tu cuenta StayPilot.', dashboardChannelPlanLimit: 'Si tu plan es inferior al numero de alojamientos conectados en tu channel manager, los ultimos apartamentos integrados no se tendran en cuenta.', dashboardSummaryTitle: 'Resumen de alojamientos conectados', dashboardSummaryPlatform: 'Plataforma', dashboardSummaryConnectedCount: 'Alojamientos conectados', dashboardSummaryShowListings: 'Ver todos los alojamientos conectados', dashboardSummaryNoListings: 'No hay alojamientos conectados por ahora', dashboardReservationsTitle: 'Informacion de reservas', dashboardReservationsSubtitle: 'Todos los datos recuperados para cada reserva conectada.', dashboardReservationId: 'ID reserva', dashboardReservationPlatform: 'Plataforma', dashboardReservationGuest: 'Huesped', dashboardReservationDates: 'Fechas', dashboardReservationAmount: 'Importe', dashboardReservationStatus: 'Estado', dashboardReservationListing: 'Alojamiento', planFreeLabel: 'Gratis',
  },
  de: {
    loginBack: '← Zurück zum Hauptmenü', loginTitle: 'Greifen Sie auf Ihren StayPilot-Bereich zu', loginAccountsDetectedNone: 'Kein Konto erkannt. Erstellen Sie zuerst ein Konto über Registrierung.', loginAccountsDetectedSome: 'Konto/Konten erkannt',
    loginAutoConnected: 'Automatische Anmeldung aktiv. Sie sind bereits verbunden.', loginConnected: 'Verbunden. Sie können zum Dashboard weitergehen.', loginIdentifierLabel: 'E-Mail / Benutzername', loginIdentifierPlaceholder: 'E-Mail / Benutzername', loginPasswordLabel: 'Passwort', loginPasswordPlaceholder: 'Ihr Passwort',
    loginRemember: 'Angemeldet bleiben', loginForgot: 'Passwort vergessen?', loginSubmit: 'Zu meinem Dashboard', loginFreeAccess: 'Kostenlos zugreifen', loginError: 'Ungültige Anmeldedaten oder kein Konto vorhanden.', loginTrust: 'Sicherer Zugang • Keine geteilten Daten',
    signupBack: '← Zurück zum Hauptmenü', signupTitle: 'Starten Sie die Optimierung Ihrer Vermietungen', signupTrialPrefix: '14 Tage gratis, danach', signupTrialSuffix: 'je nach gewähltem Plan', signupAccountsNone: 'Noch kein Konto erstellt', signupAccountsSome: 'Konto/Konten bereits in dieser App erstellt',
    signupPlanStarter: 'Starter-Plan', signupPlanPro: 'Pro-Plan', signupPlanScale: 'Scale-Plan', signupFirstName: 'Vorname', signupLastName: 'Nachname', signupUsername: 'Benutzername', signupEmail: 'E-Mail', signupPassword: 'Passwort', signupCompanyOptional: 'Unternehmen (optional)', signupPhone: 'Telefonnummer',
    signupCardTitle: 'Kreditkarte (Aktivierung nach 14 Tagen Test)', signupCardSubtitle: 'Ihre Karte startet die automatische Abrechnung nach Ablauf des Tests.', signupCardHolder: 'Name auf der Karte', signupCardNumber: 'Kartennummer', signupCardExpiry: 'MM/JJ', signupCardCvc: 'CVC',
    signupSubmit: 'Mein Konto erstellen', signupDuplicateError: 'Es existiert bereits ein Konto mit dieser E-Mail oder diesem Benutzernamen.', signupAlready: 'Bereits ein Konto?', signupLoginLink: 'Anmelden',
    signupAdminTitle: 'Test-Admin — erstellte Konten', signupAdminReset: 'Seite / Daten zurücksetzen', signupAdminCount: 'Konto/Konten für Tests gelistet', signupAdminNone: 'Kein Testkonto gespeichert',
    signupTrustTitle: 'Warum Kunden bleiben', signupTrustSubtitle: 'Konkrete Ergebnisse, schnell sichtbar.', signupTrustRevenue: '+18% durchschnittlicher Umsatz in Spitzenzeiten', signupTrustCalendar: 'Weniger Kalenderfehler und Doppelbuchungen',
    signupTrustCleaning: 'Reinigungssteuerung mit Checklisten, Fotos und Objekt-Tracking', signupTrustSupplies: 'Verwaltung von Verbrauchsmaterialien und Einkäufen', signupTrustHours: 'Bis zu 8 Std. pro Woche bei Admin-Aufgaben gespart',
    signupTrustUsers: '500+ Eigentümer nutzen bereits StayPilot', signupTrustQuote: '"Wir haben Überraschungen reduziert und jede Woche Zeit gewonnen. Endlich klare Rentabilität."',
    signupPlansTitle: 'Wählen Sie Ihren Plan', signupPlansSubtitle: 'Wählen Sie das passende Angebot vor der Kontoerstellung.',
    dashboardActiveOffer: 'Aktives Angebot: Sie haben aktuell', dashboardCurrentPlan: 'Aktueller Tarif', dashboardTitle: 'StayPilot Dashboard', dashboardTabsTitle: 'Hauptbereiche',
    dashboardTabConnect: 'Unterkünfte verbinden', dashboardTabCalendar: 'Kalender', dashboardTabStats: 'Umsatzstatistik + Auslastung', dashboardTabIntel: 'Lokale Informationen für Ihre Unterkunft', dashboardTabCleaning: 'Reinigungsdienst', dashboardTabCompany: 'Unternehmen (optional)',
    dashboardTabExpenses: 'Kostenübersicht', dashboardTabSupplies: 'Verbrauchsmaterialliste', dashboardTabWhatsApp: 'WhatsApp', dashboardTabEarlyAccess: 'Frühzugang zu neuen Funktionen',
    dashboardPremiumScale: 'Exklusiv Premium • Scale', dashboardBackToHub: 'Zuruck zum Dashboard', dashboardConnectTitle: 'Unterkunfte verbinden', dashboardConnectSubtitle: 'Verbinden Sie Ihre Airbnb-, Booking- und Channel-Manager-Konten.', dashboardConnectAirbnb: 'Airbnb-Verbindung', dashboardConnectBooking: 'Booking-Verbindung', dashboardConnectChannelManager: 'Channel-Manager-Verbindung', dashboardConnectConnected: 'Verbunden', dashboardConnectPending: 'Nicht verbunden', dashboardConnectAction: 'Verbinden', dashboardConnectFailed: 'Verbindung fehlgeschlagen, bitte Felder prufen.', dashboardChannelOptionalNote: 'ignorieren, falls nicht vorhanden', dashboardConnectEmailLabel: 'Konto-E-Mail', dashboardConnectTokenLabel: 'API-Token / App-Passwort', dashboardConnectPlaceholderEmail: 'email@beispiel.de', dashboardConnectPlaceholderToken: 'Token oder App-Passwort einfugen', dashboardConnectGlobalAction: 'Alles auf einmal verbinden', dashboardConnectHelper: 'Nur genutzte Plattformen ausfullen und globale Verbindung starten.', dashboardConnectionsOverviewTitle: 'Alle Verbindungen', dashboardConnectionsOverviewSubtitle: 'Airbnb, Booking und Channel Manager auf einen Blick.', dashboardConnectionsColumnPlatform: 'Plattform', dashboardConnectionsColumnStatus: 'Status', dashboardConnectionsAllListings: 'Alle Inserate verbunden', dashboardConnectionsGlobalSync: 'Globale Synchronisierung', dashboardReservationAccessTitle: 'Airbnb und Booking verbinden', dashboardReservationAccessSubtitle: 'Zugangsdaten eingeben, um Reservierungen automatisch zu synchronisieren.', dashboardIcalLabel: 'iCal-Link', dashboardApiLabel: 'API-Token', dashboardAccountIdLabel: 'Konto-ID', dashboardPlaceholderIcal: 'https://.../calendar.ics', dashboardPlaceholderApi: 'api_xxx...', dashboardPlaceholderAccountId: 'account_id', dashboardRequiredLinksTitle: 'Erforderliche Links und Zugange', dashboardRequiredLinksAirbnb: 'Airbnb: iCal-Links der Inserate + API-Token (falls verfugbar)', dashboardRequiredLinksBooking: 'Booking: API key + hotel ID / account ID', dashboardRequiredLinksChannelManager: 'Channel Manager: Webhook-URL + Sync-API-Schlussel', dashboardSaveConnections: 'Verbindungen speichern', dashboardChannelHelpTitle: 'Wie funktioniert das?', dashboardChannelHelpBody: 'Wenn Sie einen Channel Manager haben, verbinden Sie neue Unterkunfte mit Ihren Channels. Die Unterkunfte erscheinen dann automatisch in Ihrem StayPilot-Konto.', dashboardChannelPlanLimit: 'Wenn Ihr Tarif niedriger ist als die Anzahl verbundener Unterkunfte im Channel Manager, werden die zuletzt hinzugefugten Apartments nicht berucksichtigt.', dashboardSummaryTitle: 'Zusammenfassung verbundener Unterkunfte', dashboardSummaryPlatform: 'Plattform', dashboardSummaryConnectedCount: 'Verbundene Unterkunfte', dashboardSummaryShowListings: 'Alle verbundenen Unterkunfte anzeigen', dashboardSummaryNoListings: 'Noch keine Unterkunft verbunden', dashboardReservationsTitle: 'Reservierungsinformationen', dashboardReservationsSubtitle: 'Alle erfassten Daten fur jede verbundene Reservierung.', dashboardReservationId: 'Reservierungs-ID', dashboardReservationPlatform: 'Plattform', dashboardReservationGuest: 'Gast', dashboardReservationDates: 'Daten', dashboardReservationAmount: 'Betrag', dashboardReservationStatus: 'Status', dashboardReservationListing: 'Unterkunft', planFreeLabel: 'Kostenlos',
  },
  it: {
    loginBack: '← Torna al menu principale', loginTitle: 'Accedi al tuo spazio StayPilot', loginAccountsDetectedNone: 'Nessun account rilevato. Crea prima un account dalla Registrazione.', loginAccountsDetectedSome: 'account rilevato/i',
    loginAutoConnected: 'Accesso automatico attivo. Sei già connesso.', loginConnected: 'Connesso. Puoi continuare verso la dashboard.', loginIdentifierLabel: 'Email / nome utente', loginIdentifierPlaceholder: 'Email / nome utente', loginPasswordLabel: 'Password', loginPasswordPlaceholder: 'La tua password',
    loginRemember: 'Resta connesso', loginForgot: 'Password dimenticata?', loginSubmit: 'Accedi alla mia dashboard', loginFreeAccess: 'Accedi gratis', loginError: 'Credenziali non valide o nessun account esistente.', loginTrust: 'Accesso sicuro • Nessun dato condiviso',
    signupBack: '← Torna al menu principale', signupTitle: 'Inizia a ottimizzare i tuoi affitti', signupTrialPrefix: '14 giorni gratis poi', signupTrialSuffix: 'in base al piano scelto', signupAccountsNone: 'Nessun account creato', signupAccountsSome: 'account già creato/i in questa app',
    signupPlanStarter: 'Piano Starter', signupPlanPro: 'Piano Pro', signupPlanScale: 'Piano Scale', signupFirstName: 'Nome', signupLastName: 'Cognome', signupUsername: 'Nome utente', signupEmail: 'Email', signupPassword: 'Password', signupCompanyOptional: 'Azienda (facoltativo)', signupPhone: 'Numero di telefono',
    signupCardTitle: 'Carta bancaria (attivazione dopo 14 giorni gratis)', signupCardSubtitle: "La tua carta avvia automaticamente l'abbonamento al termine della prova.", signupCardHolder: 'Nome sulla carta', signupCardNumber: 'Numero carta', signupCardExpiry: 'MM/AA', signupCardCvc: 'CVC',
    signupSubmit: 'Crea il mio account', signupDuplicateError: 'Esiste già un account con questa email o nome utente.', signupAlready: 'Hai già un account?', signupLoginLink: 'Accedi',
    signupAdminTitle: 'Admin test — account creati', signupAdminReset: 'Reset pagina / dati', signupAdminCount: 'account elencato/i per test', signupAdminNone: 'Nessun account di test salvato',
    signupTrustTitle: 'Perché i clienti restano', signupTrustSubtitle: 'Risultati concreti e rapidi.', signupTrustRevenue: '+18% di ricavi medi nei periodi chiave', signupTrustCalendar: 'Meno errori di calendario e doppie prenotazioni',
    signupTrustCleaning: 'Gestione pulizie con checklist, foto e monitoraggio per alloggio', signupTrustSupplies: 'Gestione consumabili e acquisti per evitare rotture', signupTrustHours: 'Fino a 8 ore risparmiate a settimana su attività amministrative',
    signupTrustUsers: '+500 proprietari usano già StayPilot', signupTrustQuote: '"Abbiamo ridotto gli imprevisti e risparmiato tempo ogni settimana. Finalmente visione chiara della redditività."',
    signupPlansTitle: 'Scegli il tuo piano', signupPlansSubtitle: "Seleziona l'offerta migliore prima di creare l'account.",
    dashboardActiveOffer: 'Offerta attiva: attualmente hai', dashboardCurrentPlan: 'Piano attuale', dashboardTitle: 'Dashboard StayPilot', dashboardTabsTitle: 'Schede principali',
    dashboardTabConnect: 'Collega i tuoi alloggi', dashboardTabCalendar: 'Calendario', dashboardTabStats: 'Statistiche incassi + tasso di occupazione', dashboardTabIntel: 'Monitoraggio locale del tuo alloggio', dashboardTabCleaning: 'Fornitore pulizie', dashboardTabCompany: 'Azienda (opzionale)',
    dashboardTabExpenses: 'Tabella costi', dashboardTabSupplies: 'Lista consumabili', dashboardTabWhatsApp: 'WhatsApp', dashboardTabEarlyAccess: 'Accesso anticipato alle nuove funzionalità',
    dashboardPremiumScale: 'Premium esclusivo • Scale', dashboardBackToHub: 'Torna alla dashboard', dashboardConnectTitle: 'Collega i tuoi alloggi', dashboardConnectSubtitle: 'Collega i tuoi account Airbnb, Booking e Channel Manager.', dashboardConnectAirbnb: 'Connessione Airbnb', dashboardConnectBooking: 'Connessione Booking', dashboardConnectChannelManager: 'Connessione Channel Manager', dashboardConnectConnected: 'Connesso', dashboardConnectPending: 'Non connesso', dashboardConnectAction: 'Collega', dashboardConnectFailed: 'Connessione fallita, controlla i campi.', dashboardChannelOptionalNote: 'ignora se non ne hai uno', dashboardConnectEmailLabel: 'Email account', dashboardConnectTokenLabel: 'Token API / password app', dashboardConnectPlaceholderEmail: 'email@esempio.it', dashboardConnectPlaceholderToken: 'Incolla il token o la password applicativa', dashboardConnectGlobalAction: 'Collega tutto in una volta', dashboardConnectHelper: 'Compila solo le piattaforme che usi, poi avvia la connessione globale.', dashboardConnectionsOverviewTitle: 'Tutte le connessioni', dashboardConnectionsOverviewSubtitle: 'Vedi Airbnb, Booking e Channel Manager a colpo d occhio.', dashboardConnectionsColumnPlatform: 'Piattaforma', dashboardConnectionsColumnStatus: 'Stato', dashboardConnectionsAllListings: 'Tutti gli annunci collegati', dashboardConnectionsGlobalSync: 'Sincronizzazione globale', dashboardReservationAccessTitle: 'Collega Airbnb e Booking', dashboardReservationAccessSubtitle: 'Inserisci gli accessi per sincronizzare automaticamente le prenotazioni.', dashboardIcalLabel: 'Link iCal', dashboardApiLabel: 'Token API', dashboardAccountIdLabel: 'ID account', dashboardPlaceholderIcal: 'https://.../calendar.ics', dashboardPlaceholderApi: 'api_xxx...', dashboardPlaceholderAccountId: 'account_id', dashboardRequiredLinksTitle: 'Link e accessi necessari', dashboardRequiredLinksAirbnb: 'Airbnb: link iCal degli annunci + token API (se disponibile)', dashboardRequiredLinksBooking: 'Booking: API key + hotel ID / account ID', dashboardRequiredLinksChannelManager: 'Channel Manager: URL webhook + chiave API di sincronizzazione', dashboardSaveConnections: 'Salva connessioni', dashboardChannelHelpTitle: 'Come funziona?', dashboardChannelHelpBody: 'Se hai un channel manager, collega i nuovi alloggi ai tuoi channels. Gli alloggi appariranno automaticamente sul tuo account StayPilot.', dashboardChannelPlanLimit: 'Se il tuo piano e inferiore al numero di alloggi connessi sul channel manager, gli ultimi appartamenti integrati non verranno presi in considerazione.', dashboardSummaryTitle: 'Riepilogo alloggi connessi', dashboardSummaryPlatform: 'Piattaforma', dashboardSummaryConnectedCount: 'Alloggi connessi', dashboardSummaryShowListings: 'Vedi tutti gli alloggi connessi', dashboardSummaryNoListings: 'Nessun alloggio connesso al momento', dashboardReservationsTitle: 'Informazioni prenotazioni', dashboardReservationsSubtitle: 'Tutti i dati raccolti per ogni prenotazione collegata.', dashboardReservationId: 'ID prenotazione', dashboardReservationPlatform: 'Piattaforma', dashboardReservationGuest: 'Ospite', dashboardReservationDates: 'Date', dashboardReservationAmount: 'Importo', dashboardReservationStatus: 'Stato', dashboardReservationListing: 'Alloggio', planFreeLabel: 'Gratis',
  },
}

