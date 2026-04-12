import type { Locale } from './navbar'

export type ReviewEntry = {
  stars: 4 | 5
  quote: string
  name: string
  role: string
}

export type ReviewsCopy = {
  trustTitle: string
  trustSubtitle: string
  moreReviewsTitle: string
  featured: [ReviewEntry, ReviewEntry, ReviewEntry]
  /** Liste longue défilante : majoritairement 5★, exactement deux 4★ */
  more: ReviewEntry[]
}

const fr: ReviewsCopy = {
  trustTitle: 'Ils nous font confiance',
  trustSubtitle: 'Des retours simples et authentiques de gestionnaires satisfaits.',
  moreReviewsTitle: "Plus d'avis",
  featured: [
    {
      stars: 5,
      quote: 'Très facile à prendre en main.',
      name: 'Sophie Martin',
      role: 'Propriétaire – 4 logements',
    },
    {
      stars: 5,
      quote: 'Support client très réactif',
      name: 'Thomas Dubois',
      role: 'Conciergerie – 15 biens',
    },
    {
      stars: 5,
      quote: 'Gain de temps énorme sur les ménages.',
      name: 'Julie Rousseau',
      role: 'Gestionnaire Airbnb – 8 appartements',
    },
  ],
  more: [
    { stars: 5, quote: 'On comprend tout en quelques minutes', name: 'Marc Lefebvre', role: 'Propriétaire – 3 logements' },
    { stars: 5, quote: "Réponses rapides dès qu'on a une question.", name: 'Claire Renard', role: 'Conciergerie – 22 biens' },
    { stars: 5, quote: 'Interface simple et claire.', name: 'David Laurent', role: 'Gestionnaire – 6 appartements' },
    { stars: 5, quote: 'Pas besoin de formation, tout est intuitif.', name: 'Emma Bernard', role: 'Propriétaire – 5 logements' },
    { stars: 5, quote: 'Service client au top', name: 'Lucas Moreau', role: 'Conciergerie – 18 biens' },
    {
      stars: 4,
      quote: 'Très bon outil ; un mini tutoriel au démarrage aurait été le bienvenu.',
      name: 'Sarah Petit',
      role: 'Hôte – 2 studios',
    },
    { stars: 5, quote: 'Ultra pratique pour suivre les ménages et les équipes.', name: 'Antoine Girard', role: 'Conciergerie – 9 biens' },
    { stars: 5, quote: 'Prise en main immédiate, zéro prise de tête.', name: 'Camille Blanc', role: 'Propriétaire – 7 logements' },
    { stars: 5, quote: 'Le support répond vite, en général en moin d’une heure.', name: 'Hugo Marchand', role: 'Gestionnaire – 12 appartements' },
    { stars: 5, quote: 'Airbnb et Booking au même endroit : un vrai gain de temps.', name: 'Laura Petit', role: 'Conciergerie – 30 biens' },
    { stars: 5, quote: 'Même sans être à l’aise avec l’informatique, tout est limpide.', name: 'Nicolas Faure', role: 'Propriétaire – 1 loft' },
    { stars: 5, quote: 'Tableaux de bord clairs, on voit tout d’un coup d’œil.', name: 'Pauline Henry', role: 'Gestionnaire – 11 studios' },
    { stars: 5, quote: 'Équipe suport efficace et sympathique.', name: 'Maxime Robert', role: 'Conciergerie – 14 biens' },
    {
      stars: 4,
      quote: 'Quasi parfait ; deux petits bugs mineurs au début, corrigés très vite.',
      name: 'Élise Garnier',
      role: 'Propriétaire – 6 logements',
    },
    { stars: 5, quote: 'Gain de temps dingue sur les mails et la sinchro des calendriers.', name: 'Vincent Caron', role: 'Hôte – 4 chambres' },
    { stars: 5, quote: 'Fluide au quotidien, je recommande sans hésiter.', name: 'Manon Perez', role: 'Gestionnaire – 9 appartements' },
    { stars: 5, quote: 'On sent que le produit est pensé par des pros de la location.', name: 'Julien Masson', role: 'Conciergerie – 25 biens' },
    { stars: 5, quote: 'Simple, rapide, pro', name: 'Fanny Lemoine', role: 'Propriétaire – 3 biens' },
    { stars: 5, quote: 'L’équipe écoute vraiment nos retours.', name: 'Romain Diaz', role: 'Gestionnaire – 16 logements' },
    { stars: 5, quote: 'Moins de stress opérationnel, plus de temps pour nos voyageurs.', name: 'Inès Rolland', role: 'Conciergerie – 11 biens' },
    { stars: 5, quote: 'Très lisible sur mobile, parfait entre deux visites.', name: 'Khaled Benali', role: 'Propriétaire – 8 logements' },
    { stars: 5, quote: 'Support réactif et humain — de plus en plus rare.', name: 'Charlotte Meyer', role: 'Hôte – 5 appartements' },
    { stars: 5, quote: 'Indispensable dans notre façon de travailler.', name: 'Étienne Colin', role: 'Gestionnaire – 19 biens' },
    { stars: 5, quote: 'Toute l’équipe a adopté l’outil en une après-midi.', name: 'Amélie Roy', role: 'Conciergerie – 7 biens' },
  ],
}

const en: ReviewsCopy = {
  trustTitle: 'They trust us',
  trustSubtitle: 'Straightforward, genuine feedback from property managers who use StayManager.',
  moreReviewsTitle: 'More reviews',
  featured: [
    {
      stars: 5,
      quote: 'Very easy to get started.',
      name: 'Sophie Martin',
      role: 'Host – 4 properties',
    },
    {
      stars: 5,
      quote: 'Customer support is really responsive.',
      name: 'Thomas Dubois',
      role: 'Concierge – 15 units',
    },
    {
      stars: 5,
      quote: 'Huge time saver on turnovers and cleaning.',
      name: 'Julie Rousseau',
      role: 'Airbnb manager – 8 apartments',
    },
  ],
  more: [
    { stars: 5, quote: 'You get it in just a few minutes.', name: 'Marc Lefebvre', role: 'Host – 3 properties' },
    { stars: 5, quote: 'Quick answers whenever we have a question.', name: 'Claire Renard', role: 'Concierge – 22 units' },
    { stars: 5, quote: 'Clean, simple interface.', name: 'David Laurent', role: 'Property manager – 6 apartments' },
    { stars: 5, quote: 'No training needed — it feels intuitive.', name: 'Emma Bernard', role: 'Host – 5 properties' },
    { stars: 5, quote: 'Support team is outstanding.', name: 'Lucas Moreau', role: 'Concierge – 18 units' },
    {
      stars: 4,
      quote: 'Great tool; a short onboarding video at the start would help.',
      name: 'Sarah Petit',
      role: 'Host – 2 studios',
    },
    { stars: 5, quote: 'Super practical for tracking cleaning and staff.', name: 'Antoine Girard', role: 'Concierge – 9 units' },
    { stars: 5, quote: 'Immediate ramp-up, zero friction.', name: 'Camille Blanc', role: 'Host – 7 properties' },
    { stars: 5, quote: 'Support usually replies in under an hour.', name: 'Hugo Marchand', role: 'Manager – 12 apartments' },
    { stars: 5, quote: 'Airbnb and Booking in one place — major win.', name: 'Laura Petit', role: 'Concierge – 30 units' },
    { stars: 5, quote: 'Crystal clear even if you are not tech-savvy.', name: 'Nicolas Faure', role: 'Host – 1 loft' },
    { stars: 5, quote: 'Dashboards are easy to scan at a glance.', name: 'Pauline Henry', role: 'Manager – 11 studios' },
    { stars: 5, quote: 'Friendly, effective support team.', name: 'Maxime Robert', role: 'Concierge – 14 units' },
    {
      stars: 4,
      quote: 'Almost perfect; two tiny glitches at first, fixed very quickly.',
      name: 'Élise Garnier',
      role: 'Host – 6 properties',
    },
    { stars: 5, quote: 'Big time saver on email and calendar sync.', name: 'Vincent Caron', role: 'Host – 4 rooms' },
    { stars: 5, quote: 'Smooth day to day — highly recommend.', name: 'Manon Perez', role: 'Manager – 9 apartments' },
    { stars: 5, quote: 'Built by people who know short-term rental.', name: 'Julien Masson', role: 'Concierge – 25 units' },
    { stars: 5, quote: 'Simple, fast, professional.', name: 'Fanny Lemoine', role: 'Host – 3 units' },
    { stars: 5, quote: 'They genuinely listen to feedback.', name: 'Romain Diaz', role: 'Manager – 16 properties' },
    { stars: 5, quote: 'Less ops stress, more time for guests.', name: 'Inès Rolland', role: 'Concierge – 11 units' },
    { stars: 5, quote: 'Works great on mobile between viewings.', name: 'Khaled Benali', role: 'Host – 8 properties' },
    { stars: 5, quote: 'Responsive, human support — rare nowadays.', name: 'Charlotte Meyer', role: 'Host – 5 apartments' },
    { stars: 5, quote: 'Essential to how we operate.', name: 'Étienne Colin', role: 'Manager – 19 units' },
    { stars: 5, quote: 'The whole team was productive after one afternoon.', name: 'Amélie Roy', role: 'Concierge – 7 units' },
  ],
}

const es: ReviewsCopy = {
  trustTitle: 'Confían en nosotros',
  trustSubtitle: 'Opiniones sencillas y auténticas de gestores satisfechos.',
  moreReviewsTitle: 'Más opiniones',
  featured: [
    { stars: 5, quote: 'Muy fácil de empezar a usar.', name: 'Sophie Martin', role: 'Propietaria – 4 viviendas' },
    { stars: 5, quote: 'Atención al cliente muy rápida.', name: 'Thomas Dubois', role: 'Conciergerie – 15 inmuebles' },
    { stars: 5, quote: 'Ahorro enorme de tiempo en limpiezas.', name: 'Julie Rousseau', role: 'Gestora Airbnb – 8 apartamentos' },
  ],
  more: [
    { stars: 5, quote: 'Lo entiendes en pocos minutos.', name: 'Marc Lefebvre', role: 'Propietario – 3 viviendas' },
    { stars: 5, quote: 'Respuestas rápidas cuando tenemos dudas.', name: 'Claire Renard', role: 'Conciergerie – 22 inmuebles' },
    { stars: 5, quote: 'Interfaz simple y clara.', name: 'David Laurent', role: 'Gestor – 6 apartamentos' },
    { stars: 5, quote: 'Sin formación: todo es intuitivo.', name: 'Emma Bernard', role: 'Propietaria – 5 viviendas' },
    { stars: 5, quote: 'Servicio al cliente excelente.', name: 'Lucas Moreau', role: 'Conciergerie – 18 inmuebles' },
    {
      stars: 4,
      quote: 'Muy buena herramienta; un tutorial corto al inicio ayudaría.',
      name: 'Sarah Petit',
      role: 'Anfitriona – 2 estudios',
    },
    { stars: 5, quote: 'Súper práctico para seguir limpiezas y equipos.', name: 'Antoine Girard', role: 'Conciergerie – 9 inmuebles' },
    { stars: 5, quote: 'Puesta en marcha inmediata, sin complicaciones.', name: 'Camille Blanc', role: 'Propietaria – 7 viviendas' },
    { stars: 5, quote: 'El soporte suele responder en menos de una hora.', name: 'Hugo Marchand', role: 'Gestor – 12 apartamentos' },
    { stars: 5, quote: 'Airbnb y Booking en un solo sitio: gran ahorro de tiempo.', name: 'Laura Petit', role: 'Conciergerie – 30 inmuebles' },
    { stars: 5, quote: 'Muy claro aunque no seas experto en informática.', name: 'Nicolas Faure', role: 'Propietario – 1 loft' },
    { stars: 5, quote: 'Cuadros de mando fáciles de leer de un vistazo.', name: 'Pauline Henry', role: 'Gestora – 11 estudios' },
    { stars: 5, quote: 'Equipo de soporte eficaz y amable.', name: 'Maxime Robert', role: 'Conciergerie – 14 inmuebles' },
    {
      stars: 4,
      quote: 'Casi perfecto; dos fallos menores al principio, corregidos rápido.',
      name: 'Élise Garnier',
      role: 'Propietaria – 6 viviendas',
    },
    { stars: 5, quote: 'Mucho menos tiempo en correos y sincronización de calendarios.', name: 'Vincent Caron', role: 'Anfitrión – 4 habitaciones' },
    { stars: 5, quote: 'Fluidez en el día a día; lo recomiendo.', name: 'Manon Perez', role: 'Gestora – 9 apartamentos' },
    { stars: 5, quote: 'Se nota que lo han pensado profesionales del alquiler.', name: 'Julien Masson', role: 'Conciergerie – 25 inmuebles' },
    { stars: 5, quote: 'Simple, rápido, profesional.', name: 'Fanny Lemoine', role: 'Propietaria – 3 bienes' },
    { stars: 5, quote: 'Escuchan de verdad nuestros comentarios.', name: 'Romain Diaz', role: 'Gestor – 16 viviendas' },
    { stars: 5, quote: 'Menos estrés operativo, más tiempo para los huéspedes.', name: 'Inès Rolland', role: 'Conciergerie – 11 inmuebles' },
    { stars: 5, quote: 'Muy legible en móvil entre visitas.', name: 'Khaled Benali', role: 'Propietario – 8 viviendas' },
    { stars: 5, quote: 'Soporte rápido y humano — cada vez más raro.', name: 'Charlotte Meyer', role: 'Anfitriona – 5 apartamentos' },
    { stars: 5, quote: 'Imprescindible en nuestro día a día.', name: 'Étienne Colin', role: 'Gestor – 19 unidades' },
    { stars: 5, quote: 'Todo el equipo lo adoptó en una tarde.', name: 'Amélie Roy', role: 'Conciergerie – 7 inmuebles' },
  ],
}

const de: ReviewsCopy = {
  trustTitle: 'Sie vertrauen uns',
  trustSubtitle: 'Echte, klare Rückmeldungen zufriedener Vermieter und Manager.',
  moreReviewsTitle: 'Weitere Bewertungen',
  featured: [
    { stars: 5, quote: 'Sehr einfach einzurichten.', name: 'Sophie Martin', role: 'Eigentümerin – 4 Objekte' },
    { stars: 5, quote: 'Der Support antwortet sehr schnell.', name: 'Thomas Dubois', role: 'Concierge – 15 Einheiten' },
    { stars: 5, quote: 'Enorme Zeitersparnis bei Reinigung und Wechseln.', name: 'Julie Rousseau', role: 'Airbnb-Managerin – 8 Apartments' },
  ],
  more: [
    { stars: 5, quote: 'In wenigen Minuten verstanden.', name: 'Marc Lefebvre', role: 'Eigentümer – 3 Objekte' },
    { stars: 5, quote: 'Schnelle Antworten bei Fragen.', name: 'Claire Renard', role: 'Concierge – 22 Einheiten' },
    { stars: 5, quote: 'Schlichte, klare Oberfläche.', name: 'David Laurent', role: 'Manager – 6 Apartments' },
    { stars: 5, quote: 'Keine Schulung nötig, alles intuitiv.', name: 'Emma Bernard', role: 'Eigentümerin – 5 Objekte' },
    { stars: 5, quote: 'Kundenservice top.', name: 'Lucas Moreau', role: 'Concierge – 18 Einheiten' },
    {
      stars: 4,
      quote: 'Sehr gutes Tool; ein kurzes Einführungsvideo wäre hilfreich.',
      name: 'Sarah Petit',
      role: 'Gastgeberin – 2 Studios',
    },
    { stars: 5, quote: 'Praktisch für Reinigung und Teams.', name: 'Antoine Girard', role: 'Concierge – 9 Einheiten' },
    { stars: 5, quote: 'Sofort produktiv, ohne Umwege.', name: 'Camille Blanc', role: 'Eigentümerin – 7 Objekte' },
    { stars: 5, quote: 'Support meist in unter einer Stunde.', name: 'Hugo Marchand', role: 'Manager – 12 Apartments' },
    { stars: 5, quote: 'Airbnb und Booking an einem Ort — großer Vorteil.', name: 'Laura Petit', role: 'Concierge – 30 Einheiten' },
    { stars: 5, quote: 'Auch ohne IT-Kenntnisse verständlich.', name: 'Nicolas Faure', role: 'Eigentümer – 1 Loft' },
    { stars: 5, quote: 'Übersichtliche Dashboards.', name: 'Pauline Henry', role: 'Managerin – 11 Studios' },
    { stars: 5, quote: 'Freundliches, effektives Support-Team.', name: 'Maxime Robert', role: 'Concierge – 14 Einheiten' },
    {
      stars: 4,
      quote: 'Fast perfekt; zwei kleine Bugs am Anfang, schnell behoben.',
      name: 'Élise Garnier',
      role: 'Eigentümerin – 6 Objekte',
    },
    { stars: 5, quote: 'Viel weniger Aufwand für Mails und Kalender-Sync.', name: 'Vincent Caron', role: 'Gastgeber – 4 Zimmer' },
    { stars: 5, quote: 'Im Alltag sehr flüssig — klare Empfehlung.', name: 'Manon Perez', role: 'Managerin – 9 Apartments' },
    { stars: 5, quote: 'Von Profis fürs Kurzzeitmieten gebaut.', name: 'Julien Masson', role: 'Concierge – 25 Einheiten' },
    { stars: 5, quote: 'Einfach, schnell, professionell.', name: 'Fanny Lemoine', role: 'Eigentümerin – 3 Objekte' },
    { stars: 5, quote: 'Feedback wird ernst genommen.', name: 'Romain Diaz', role: 'Manager – 16 Einheiten' },
    { stars: 5, quote: 'Weniger Stress, mehr Zeit für Gäste.', name: 'Inès Rolland', role: 'Concierge – 11 Einheiten' },
    { stars: 5, quote: 'Auf dem Handy gut lesbar.', name: 'Khaled Benali', role: 'Eigentümer – 8 Objekte' },
    { stars: 5, quote: 'Schneller, menschlicher Support.', name: 'Charlotte Meyer', role: 'Gastgeberin – 5 Apartments' },
    { stars: 5, quote: 'Unverzichtbar für uns.', name: 'Étienne Colin', role: 'Manager – 19 Einheiten' },
    { stars: 5, quote: 'Das Team war nach einem Nachmittag dabei.', name: 'Amélie Roy', role: 'Concierge – 7 Einheiten' },
  ],
}

const it: ReviewsCopy = {
  trustTitle: 'Si fidano di noi',
  trustSubtitle: 'Feedback autentici e chiari da gestori soddisfatti.',
  moreReviewsTitle: 'Altre recensioni',
  featured: [
    { stars: 5, quote: 'Facilissimo da iniziare a usare.', name: 'Sophie Martin', role: 'Proprietaria – 4 immobili' },
    { stars: 5, quote: 'Assistenza clienti molto reattiva.', name: 'Thomas Dubois', role: 'Conciergerie – 15 unità' },
    { stars: 5, quote: 'Risparmio enorme di tempo sulle pulizie.', name: 'Julie Rousseau', role: 'Gestore Airbnb – 8 appartamenti' },
  ],
  more: [
    { stars: 5, quote: 'Si capisce tutto in pochi minuti.', name: 'Marc Lefebvre', role: 'Proprietario – 3 immobili' },
    { stars: 5, quote: 'Risposte rapide a ogni domanda.', name: 'Claire Renard', role: 'Conciergerie – 22 unità' },
    { stars: 5, quote: 'Interfaccia semplice e chiara.', name: 'David Laurent', role: 'Gestore – 6 appartamenti' },
    { stars: 5, quote: 'Niente formazione: tutto intuitivo.', name: 'Emma Bernard', role: 'Proprietaria – 5 immobili' },
    { stars: 5, quote: 'Servizio clienti al top.', name: 'Lucas Moreau', role: 'Conciergerie – 18 unità' },
    {
      stars: 4,
      quote: 'Ottimo strumento; un breve tutorial iniziale aiuterebbe.',
      name: 'Sarah Petit',
      role: 'Host – 2 monolocali',
    },
    { stars: 5, quote: 'Utilissimo per pulizie e team.', name: 'Antoine Girard', role: 'Conciergerie – 9 unità' },
    { stars: 5, quote: 'Immediato da usare, zero attriti.', name: 'Camille Blanc', role: 'Proprietaria – 7 immobili' },
    { stars: 5, quote: 'Il supporto risponde spesso in meno di un’ora.', name: 'Hugo Marchand', role: 'Gestore – 12 appartamenti' },
    { stars: 5, quote: 'Airbnb e Booking in un solo posto.', name: 'Laura Petit', role: 'Conciergerie – 30 unità' },
    { stars: 5, quote: 'Chiarissimo anche per chi non è tecnico.', name: 'Nicolas Faure', role: 'Proprietario – 1 loft' },
    { stars: 5, quote: 'Dashboard leggibili a colpo d’occhio.', name: 'Pauline Henry', role: 'Gestore – 11 monolocali' },
    { stars: 5, quote: 'Team di supporto efficace e gentile.', name: 'Maxime Robert', role: 'Conciergerie – 14 unità' },
    {
      stars: 4,
      quote: 'Quasi perfetto; due piccoli bug iniziali, risolti subito.',
      name: 'Élise Garnier',
      role: 'Proprietaria – 6 immobili',
    },
    { stars: 5, quote: 'Molto meno tempo su mail e sync calendari.', name: 'Vincent Caron', role: 'Host – 4 camere' },
    { stars: 5, quote: 'Fluido ogni giorno — consigliato.', name: 'Manon Perez', role: 'Gestore – 9 appartamenti' },
    { stars: 5, quote: 'Fatto da chi conosce gli affitti brevi.', name: 'Julien Masson', role: 'Conciergerie – 25 unità' },
    { stars: 5, quote: 'Semplice, veloce, professionale.', name: 'Fanny Lemoine', role: 'Proprietaria – 3 unità' },
    { stars: 5, quote: 'Ascoltano davvero i feedback.', name: 'Romain Diaz', role: 'Gestore – 16 immobili' },
    { stars: 5, quote: 'Meno stress operativo, più tempo per gli ospiti.', name: 'Inès Rolland', role: 'Conciergerie – 11 unità' },
    { stars: 5, quote: 'Ottimo su mobile tra un sopralluogo e l’altro.', name: 'Khaled Benali', role: 'Proprietario – 8 immobili' },
    { stars: 5, quote: 'Supporto reattivo e umano.', name: 'Charlotte Meyer', role: 'Host – 5 appartamenti' },
    { stars: 5, quote: 'Indispensabile per noi.', name: 'Étienne Colin', role: 'Gestore – 19 unità' },
    { stars: 5, quote: 'Tutto il team adottato in un pomeriggio.', name: 'Amélie Roy', role: 'Conciergerie – 7 unità' },
  ],
}

export const reviewsTranslations: Record<Locale, ReviewsCopy> = {
  fr,
  es,
  en,
  de,
  it,
}
