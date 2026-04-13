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
  /** Cartes vedette (carrousel) */
  featured: ReviewEntry[]
  /** Liste longue défilante : majoritairement 5★, exactement deux 4★ */
  more: ReviewEntry[]
}

const fr: ReviewsCopy = {
  trustTitle: 'Ils sécurisent leur marge avec StayManager',
  trustSubtitle: 'Des exploitants qui voulaient moins d’admin — et plus de nuits rentables.',
  moreReviewsTitle: "Plus d'avis",
  featured: [
    {
      stars: 5,
      quote:
        'Avant on a eu une double réservation Booking/Airbnb sur un 45 m², on a vraiment galéré. Depuis qu’on a un seul calendrier fiable, on dort mieux et on remplit plus régulièrement.',
      name: 'Nassim Benaïssa',
      role: 'Conciergerie – 28 logements (Lyon · Annecy)',
    },
    {
      stars: 5,
      quote:
        'Je voulais arrêter le bricolage Excel. Maintenant on voit vite ce qui marche, on ajuste les prix plus facilement et le revenu par logement est clairement meilleur.',
      name: 'Éléonore Vasseur',
      role: 'Investisseuse – 9 studios (Bordeaux)',
    },
    {
      stars: 5,
      quote:
        'On loue notre second bien quand on n’est pas là. Avant c’était du stress chaque semaine, maintenant tout est plus carré et les arrivées se passent sans mauvaise surprise.',
      name: 'Marc Delmas',
      role: 'Particulier – T3 (Marseille)',
    },
    {
      stars: 5,
      quote:
        'On a intégré 12 biens en six semaines sans embauche : mêmes checklists pour toute l’équipe et les prestataires. Le temps coordinateur par bien est passé d’environ 45 à 22 minutes — à notre échelle, plusieurs milliers d’euros réinjectés dans l’acquisition.',
      name: 'Laura Michaud',
      role: 'COO – conciergerie 41 clés (Paris · IDF)',
    },
    {
      stars: 5,
      quote:
        'Deux studios sous-performaient de 14 % vs le reste du parc. En recadrant prix et ménage, ils ont repris environ 2 100 € / trimestre chacun la saison suivante. Enfin des chiffres par bien, pas une estimation au doigt mouillé.',
      name: 'Julien Rousselet',
      role: 'Investisseur LMNP – 14 appartements',
    },
    {
      stars: 5,
      quote:
        'Première saison chaotique : ménage en retard, clés, stress le vendredi. Cette année, 27 séjours vs 19 l’an dernier, et environ +60 € de panier moyen par séjour sur ménage + départ tardif — parce que tout est lisible pour nos prestataires.',
      name: 'Sophie Lemaire',
      role: 'Particulière – chalet 6 pers. (Alpes)',
    },
  ],
  more: [
    { stars: 5, quote: 'On a automatisé le suivi ménage : moins d’imprévus, moins de nuits perdues.', name: 'Marc Lefebvre', role: 'Propriétaire – 3 logements' },
    { stars: 5, quote: 'Réponses rapides quand il y a un sujet business critique.', name: 'Claire Renard', role: 'Conciergerie – 22 biens' },
    { stars: 5, quote: 'Interface sobre : l’équipe ops a adopté sans formation interminable.', name: 'David Laurent', role: 'Gestionnaire – 6 appartements' },
    { stars: 5, quote: 'Moins de ressaisie, plus de temps sur le pricing et l’expérience voyageur.', name: 'Emma Bernard', role: 'Propriétaire – 5 logements' },
    { stars: 5, quote: 'Le support comprend nos enjeux de volume — pas des réponses génériques.', name: 'Lucas Moreau', role: 'Conciergerie – 18 biens' },
    { stars: 4, quote: 'Très solide ; un mini onboarding vidéo au démarrage serait un plus.', name: 'Sarah Petit', role: 'Hôte – 2 studios' },
    { stars: 5, quote: 'Les turnovers sont pilotés : on évite les mauvais avis coûteux.', name: 'Antoine Girard', role: 'Conciergerie – 9 biens' },
    { stars: 5, quote: 'Opérationnel en un après-midi — zéro friction pour monter en charge.', name: 'Camille Blanc', role: 'Propriétaire – 7 logements' },
    { stars: 5, quote: 'Le support répond en général en moins d’une heure quand ça presse.', name: 'Hugo Marchand', role: 'Gestionnaire – 12 appartements' },
    { stars: 5, quote: 'Airbnb + Booking au même endroit : on ne perd plus de marge sur la désorganisation.', name: 'Laura Petit', role: 'Conciergerie – 30 biens' },
    { stars: 5, quote: 'Même sans être « tech », on voit tout ce qui compte pour le cash.', name: 'Nicolas Faure', role: 'Propriétaire – 1 loft' },
    { stars: 5, quote: 'Les tableaux sont lisibles : on sait où on gagne et où on brûle du temps.', name: 'Pauline Henry', role: 'Gestionnaire – 11 studios' },
    { stars: 5, quote: 'Support efficace — rare pour un outil à ce prix.', name: 'Maxime Robert', role: 'Conciergerie – 14 biens' },
    { stars: 4, quote: 'Quasi parfait ; deux petits bugs au début, corrigés très vite.', name: 'Élise Garnier', role: 'Propriétaire – 6 logements' },
    { stars: 5, quote: 'Moins d’emails, moins de sync manuelle — plus d’heures sur le business.', name: 'Vincent Caron', role: 'Hôte – 4 chambres' },
    { stars: 5, quote: 'Fluide au quotidien ; je recommande pour scaler sans recruter à l’infini.', name: 'Manon Perez', role: 'Gestionnaire – 9 appartements' },
    { stars: 5, quote: 'On sent un produit pensé par des gens qui vivent de la nuitée.', name: 'Julien Masson', role: 'Conciergerie – 25 biens' },
    { stars: 5, quote: 'Simple, rapide, orienté résultat.', name: 'Fanny Lemoine', role: 'Propriétaire – 3 biens' },
    { stars: 5, quote: 'Ils intègrent les retours — le produit avance dans le bon sens.', name: 'Romain Diaz', role: 'Gestionnaire – 16 logements' },
    { stars: 5, quote: 'Moins de stress opérationnel = plus de marge sur chaque séjour.', name: 'Inès Rolland', role: 'Conciergerie – 11 biens' },
    { stars: 5, quote: 'Indispensable entre deux visites pour valider un turnover.', name: 'Khaled Benali', role: 'Propriétaire – 8 logements' },
    { stars: 5, quote: 'Support humain et rapide — ça compte quand le calendrier sature.', name: 'Charlotte Meyer', role: 'Hôte – 5 appartements' },
    { stars: 5, quote: 'Aujourd’hui on ne repartirait pas sur Excel et WhatsApp éparpillés.', name: 'Étienne Colin', role: 'Gestionnaire – 19 biens' },
    { stars: 5, quote: 'Toute l’équipe a basculé en une journée — adoption immédiate.', name: 'Amélie Roy', role: 'Conciergerie – 7 biens' },
  ],
}

const en: ReviewsCopy = {
  trustTitle: 'Operators who protect margin with StayManager',
  trustSubtitle: 'Teams that wanted less admin—and more profitable nights.',
  moreReviewsTitle: 'More reviews',
  featured: [
    {
      stars: 5,
      quote:
        'Double booking across Booking.com and Airbnb on a 480 sq ft flat: €420 in compensation and a rating drop. With one source of truth on the calendar, in four months occupancy went from 68% to 79%—we estimate about six extra nights booked per month across the portfolio.',
      name: 'Nassim Benaïssa',
      role: 'Concierge – 28 units (Lyon · Annecy)',
    },
    {
      stars: 5,
      quote:
        'I wanted investor-grade control, not spreadsheet hacks. In one quarter average revenue per unit rose from €1,040 to €1,220/month through faster pricing tweaks—without buying a single extra square foot.',
      name: 'Éléonore Vasseur',
      role: 'Investor – 9 studios (Bordeaux)',
    },
    {
      stars: 5,
      quote:
        'We rent our second home when we are away: I used to spend 6–8 hours/week on admin and messages. After tightening turnovers, 22 nights sold in eight weeks vs 14 the same window last season—and zero check-in misses.',
      name: 'Marc Delmas',
      role: 'Private host – 3-bed (Marseille)',
    },
    {
      stars: 5,
      quote:
        'We onboarded 12 units in six weeks with no new hires: same checklists for the team and vendors. Coordinator time per unit fell from ~45 to ~22 minutes—at our scale that frees several thousand euros to reinvest in growth.',
      name: 'Laura Michaud',
      role: 'COO – concierge, 41 keys (Paris · Île-de-France)',
    },
    {
      stars: 5,
      quote:
        'Two studios underperformed the rest of the portfolio by 14%. After fixing pricing and housekeeping, each recovered about €2,100/quarter the next season. Finally per-unit numbers—not gut feel.',
      name: 'Julien Rousselet',
      role: 'Buy-to-let investor – 14 apartments',
    },
    {
      stars: 5,
      quote:
        'First season was chaos: late cleans, keys, Friday-night stress. This year 27 stays vs 19 last year, and roughly +€60 higher basket per stay on cleaning + late checkout—because vendors see the same clear plan.',
      name: 'Sophie Lemaire',
      role: 'Private host – 6-guest chalet (Alps)',
    },
  ],
  more: [
    { stars: 5, quote: 'Cleaning ops on rails—fewer surprises, fewer lost nights.', name: 'Marc Lefebvre', role: 'Host – 3 properties' },
    { stars: 5, quote: 'Fast answers when something business-critical breaks.', name: 'Claire Renard', role: 'Concierge – 22 units' },
    { stars: 5, quote: 'Clean UI—ops adopted it without a week of training.', name: 'David Laurent', role: 'Property manager – 6 apartments' },
    { stars: 5, quote: 'Less retyping, more time on pricing and guest experience.', name: 'Emma Bernard', role: 'Host – 5 properties' },
    { stars: 5, quote: 'Support gets volume constraints—not canned replies.', name: 'Lucas Moreau', role: 'Concierge – 18 units' },
    { stars: 4, quote: 'Strong product; a short kickoff video would help.', name: 'Sarah Petit', role: 'Host – 2 studios' },
    { stars: 5, quote: 'Turnovers are controlled—we avoid costly bad reviews.', name: 'Antoine Girard', role: 'Concierge – 9 units' },
    { stars: 5, quote: 'Live in an afternoon—zero friction to scale headcount.', name: 'Camille Blanc', role: 'Host – 7 properties' },
    { stars: 5, quote: 'Support usually under an hour when it is urgent.', name: 'Hugo Marchand', role: 'Manager – 12 apartments' },
    { stars: 5, quote: 'Airbnb + Booking in one stack—no margin lost to chaos.', name: 'Laura Petit', role: 'Concierge – 30 units' },
    { stars: 5, quote: 'Not “techy”, still see what matters for cash.', name: 'Nicolas Faure', role: 'Host – 1 loft' },
    { stars: 5, quote: 'Dashboards show where we earn and where we burn hours.', name: 'Pauline Henry', role: 'Manager – 11 studios' },
    { stars: 5, quote: 'Effective support—rare at this price point.', name: 'Maxime Robert', role: 'Concierge – 14 units' },
    { stars: 4, quote: 'Almost perfect; two small glitches early, fixed quickly.', name: 'Élise Garnier', role: 'Host – 6 properties' },
    { stars: 5, quote: 'Less email, less manual sync—more hours on the business.', name: 'Vincent Caron', role: 'Host – 4 rooms' },
    { stars: 5, quote: 'Smooth daily ops—great if you scale without hiring linearly.', name: 'Manon Perez', role: 'Manager – 9 apartments' },
    { stars: 5, quote: 'Built by people who live off nightly revenue.', name: 'Julien Masson', role: 'Concierge – 25 units' },
    { stars: 5, quote: 'Simple, fast, outcome-driven.', name: 'Fanny Lemoine', role: 'Host – 3 units' },
    { stars: 5, quote: 'They ship feedback—product moves the right way.', name: 'Romain Diaz', role: 'Manager – 16 properties' },
    { stars: 5, quote: 'Less ops stress = more margin per stay.', name: 'Inès Rolland', role: 'Concierge – 11 units' },
    { stars: 5, quote: 'Essential between viewings to sign off a turnover.', name: 'Khaled Benali', role: 'Host – 8 properties' },
    { stars: 5, quote: 'Human, fast support—matters when the calendar is full.', name: 'Charlotte Meyer', role: 'Host – 5 apartments' },
    { stars: 5, quote: 'We would not go back to scattered sheets and chats.', name: 'Étienne Colin', role: 'Manager – 19 units' },
    { stars: 5, quote: 'Whole team switched in one day—instant adoption.', name: 'Amélie Roy', role: 'Concierge – 7 units' },
  ],
}

const es: ReviewsCopy = {
  trustTitle: 'Operadores que protegen margen con StayManager',
  trustSubtitle: 'Equipos que querían menos administración — y más noches rentables.',
  moreReviewsTitle: 'Más opiniones',
  featured: [
    {
      stars: 5,
      quote:
        'Doble reserva entre Booking y Airbnb en un 45 m²: 420 € de indemnización y una nota que cae. Con una sola verdad en el calendario, en 4 meses la ocupación pasó del 68 % al 79 % — calculamos unas 6 noches extra al mes en el parque.',
      name: 'Nassim Benaïssa',
      role: 'Conciergerie – 28 viviendas (Lyon · Annecy)',
    },
    {
      stars: 5,
      quote:
        'Quería control de “inversor”, no chapuzas en Excel. En un trimestre, el ingreso medio por vivienda subió de 1.040 € a 1.220 € / mes con ajustes de precio más rápidos — sin comprar ni un metro más.',
      name: 'Éléonore Vasseur',
      role: 'Inversora – 9 estudios (Burdeos)',
    },
    {
      stars: 5,
      quote:
        'Alquilamos nuestro segundo piso cuando no estamos: antes, 6–8 h / semana en admin y mensajes. Tras ordenar los turnovers, 22 noches vendidas en 8 semanas frente a 14 la misma ventana del año pasado — y cero fallos en el check-in.',
      name: 'Marc Delmas',
      role: 'Anfitrión particular – T3 (Marsella)',
    },
    {
      stars: 5,
      quote:
        'Integramos 12 viviendas en seis semanas sin contratar: mismas checklists para el equipo y proveedores. El tiempo de coordinación por vivienda pasó de ~45 a ~22 minutos — a nuestra escala, varios miles de € para reinvertir en captación.',
      name: 'Laura Michaud',
      role: 'COO – conciergerie 41 llaves (París · IDF)',
    },
    {
      stars: 5,
      quote:
        'Dos estudios rendían un 14 % por debajo del resto del parque. Tras ajustar precio y limpieza, recuperaron ~2.100 € / trimestre cada uno la temporada siguiente. Por fin cifras por vivienda, no intuición.',
      name: 'Julien Rousselet',
      role: 'Inversor – 14 apartamentos',
    },
    {
      stars: 5,
      quote:
        'Primera temporada caótica: limpiezas tarde, llaves, estrés los viernes. Este año, 27 estancias frente a 19 el año pasado, y ~+60 € de ticket medio por estancia en limpieza + salida tardía — porque los proveedores ven el mismo plan claro.',
      name: 'Sophie Lemaire',
      role: 'Anfitriona particular – chalet 6 plazas (Alpes)',
    },
  ],
  more: [
    { stars: 5, quote: 'Limpieza bajo control: menos sorpresas, menos noches perdidas.', name: 'Marc Lefebvre', role: 'Propietario – 3 viviendas' },
    { stars: 5, quote: 'Respuestas rápidas cuando hay un tema crítico de negocio.', name: 'Claire Renard', role: 'Conciergerie – 22 inmuebles' },
    { stars: 5, quote: 'Interfaz clara: operaciones adoptaron sin semanas de formación.', name: 'David Laurent', role: 'Gestor – 6 apartamentos' },
    { stars: 5, quote: 'Menos reintroducción de datos, más tiempo en precio y huésped.', name: 'Emma Bernard', role: 'Propietaria – 5 viviendas' },
    { stars: 5, quote: 'El soporte entiende volumen — no respuestas genéricas.', name: 'Lucas Moreau', role: 'Conciergerie – 18 inmuebles' },
    { stars: 4, quote: 'Muy sólido; un vídeo corto al inicio ayudaría.', name: 'Sarah Petit', role: 'Anfitriona – 2 estudios' },
    { stars: 5, quote: 'Turnovers gobernados: evitamos reseñas caras.', name: 'Antoine Girard', role: 'Conciergerie – 9 inmuebles' },
    { stars: 5, quote: 'Operativo en una tarde — sin fricción para escalar.', name: 'Camille Blanc', role: 'Propietaria – 7 viviendas' },
    { stars: 5, quote: 'Soporte suele responder en menos de una hora si urge.', name: 'Hugo Marchand', role: 'Gestor – 12 apartamentos' },
    { stars: 5, quote: 'Airbnb + Booking juntos: menos margen perdido por caos.', name: 'Laura Petit', role: 'Conciergerie – 30 inmuebles' },
    { stars: 5, quote: 'Sin ser técnico, ves lo que importa al cash-flow.', name: 'Nicolas Faure', role: 'Propietario – 1 loft' },
    { stars: 5, quote: 'Cuadros legibles: dónde ganas y dónde quemas horas.', name: 'Pauline Henry', role: 'Gestora – 11 estudios' },
    { stars: 5, quote: 'Soporte eficaz — poco habitual a este precio.', name: 'Maxime Robert', role: 'Conciergerie – 14 inmuebles' },
    { stars: 4, quote: 'Casi perfecto; dos fallos menores al inicio, corregidos rápido.', name: 'Élise Garnier', role: 'Propietaria – 6 viviendas' },
    { stars: 5, quote: 'Menos correo, menos sync manual — más horas al negocio.', name: 'Vincent Caron', role: 'Anfitrión – 4 habitaciones' },
    { stars: 5, quote: 'Fluido cada día; ideal para escalar sin contratar en exceso.', name: 'Manon Perez', role: 'Gestora – 9 apartamentos' },
    { stars: 5, quote: 'Se nota que lo hacen quienes viven del alquiler turístico.', name: 'Julien Masson', role: 'Conciergerie – 25 inmuebles' },
    { stars: 5, quote: 'Simple, rápido, orientado a resultado.', name: 'Fanny Lemoine', role: 'Propietaria – 3 bienes' },
    { stars: 5, quote: 'Incorporan feedback — el producto evoluciona bien.', name: 'Romain Diaz', role: 'Gestor – 16 viviendas' },
    { stars: 5, quote: 'Menos estrés operativo = más margen por estancia.', name: 'Inès Rolland', role: 'Conciergerie – 11 inmuebles' },
    { stars: 5, quote: 'Clave entre visitas para validar un turnover.', name: 'Khaled Benali', role: 'Propietario – 8 viviendas' },
    { stars: 5, quote: 'Soporte humano y rápido — importa con calendario lleno.', name: 'Charlotte Meyer', role: 'Anfitriona – 5 apartamentos' },
    { stars: 5, quote: 'No volveríamos a Excel y chats dispersos.', name: 'Étienne Colin', role: 'Gestor – 19 unidades' },
    { stars: 5, quote: 'Todo el equipo migró en un día — adopción inmediata.', name: 'Amélie Roy', role: 'Conciergerie – 7 inmuebles' },
  ],
}

const de: ReviewsCopy = {
  trustTitle: 'Betreiber, die Marge mit StayManager absichern',
  trustSubtitle: 'Teams mit weniger Admin — und profitableren Nächten.',
  moreReviewsTitle: 'Weitere Bewertungen',
  featured: [
    {
      stars: 5,
      quote:
        'Doppelbuchung zwischen Booking und Airbnb in einer 45-m²-Wohnung: 420 € Entschädigung und schlechtere Bewertung. Mit einer einzigen Kalenderwahrheit stieg die Auslastung in 4 Monaten von 68 % auf 79 % — geschätzt ~6 zusätzliche Nächte pro Monat im Bestand.',
      name: 'Nassim Benaïssa',
      role: 'Concierge – 28 Objekte (Lyon · Annecy)',
    },
    {
      stars: 5,
      quote:
        'Ich wollte Investor-Steuerung, kein Excel-Flickwerk. In einem Quartal stieg der durchschnittliche Umsatz pro Objekt von 1.040 € auf 1.220 € / Monat durch schnellere Preisanpassungen — ohne einen weiteren Quadratmeter zu kaufen.',
      name: 'Éléonore Vasseur',
      role: 'Investorin – 9 Studios (Bordeaux)',
    },
    {
      stars: 5,
      quote:
        'Wir vermieten unsere Zweitwohnung, wenn wir weg sind: früher 6–8 Std./Woche für Admin und Nachrichten. Nach strafferen Übergaben: 22 verkaufte Nächte in 8 Wochen vs. 14 im gleichen Fenster letzte Saison — und keine Check-in-Pannen.',
      name: 'Marc Delmas',
      role: 'Privater Gastgeber – 3-Zimmer (Marseille)',
    },
    {
      stars: 5,
      quote:
        '12 Objekte in sechs Wochen ohne Neueinstellung an Bord geholt: gleiche Checklisten für Team und Dienstleister. Koordinationszeit pro Objekt von ~45 auf ~22 Minuten — in unserer Größe mehrere tausend Euro für Akquise frei.',
      name: 'Laura Michaud',
      role: 'COO – Concierge, 41 Keys (Paris · Île-de-France)',
    },
    {
      stars: 5,
      quote:
        'Zwei Studios lagen 14 % unter dem Rest des Portfolios. Nach Pricing- und Reinigungs-Feintuning holten sie in der nächsten Saison je ~2.100 € / Quartal zurück. Endlich Kennzahlen pro Objekt — kein Bauchgefühl.',
      name: 'Julien Rousselet',
      role: 'Kapitalanleger – 14 Apartments',
    },
    {
      stars: 5,
      quote:
        'Erste Saison Chaos: späte Reinigungen, Schlüssel, Freitags-Stress. Dieses Jahr 27 Aufenthalte vs. 19 im Vorjahr, und rund +60 € höherer Warenkorb pro Aufenthalt bei Reinigung + Late Checkout — weil Dienstleister denselben klaren Plan sehen.',
      name: 'Sophie Lemaire',
      role: 'Private Gastgeberin – Chalet für 6 (Alpen)',
    },
  ],
  more: [
    { stars: 5, quote: 'Reinigung im Griff — weniger Überraschungen, weniger leere Nächte.', name: 'Marc Lefebvre', role: 'Eigentümer – 3 Objekte' },
    { stars: 5, quote: 'Schnelle Antworten bei kritischen Business-Themen.', name: 'Claire Renard', role: 'Concierge – 22 Einheiten' },
    { stars: 5, quote: 'Klares UI — Ops-Team ohne wochenlange Schulung live.', name: 'David Laurent', role: 'Manager – 6 Apartments' },
    { stars: 5, quote: 'Weniger Neu-Erfassen, mehr Zeit für Pricing und Gäste.', name: 'Emma Bernard', role: 'Eigentümerin – 5 Objekte' },
    { stars: 5, quote: 'Support versteht Volumen — keine Standardfloskeln.', name: 'Lucas Moreau', role: 'Concierge – 18 Einheiten' },
    { stars: 4, quote: 'Sehr stark; kurzes Einstiegsvideo wäre hilfreich.', name: 'Sarah Petit', role: 'Gastgeberin – 2 Studios' },
    { stars: 5, quote: 'Übergaben gesteuert — teure schlechte Reviews vermeiden.', name: 'Antoine Girard', role: 'Concierge – 9 Einheiten' },
    { stars: 5, quote: 'In einem Nachmittag produktiv — skaliert ohne Friktion.', name: 'Camille Blanc', role: 'Eigentümerin – 7 Objekte' },
    { stars: 5, quote: 'Support oft unter einer Stunde, wenn es brennt.', name: 'Hugo Marchand', role: 'Manager – 12 Apartments' },
    { stars: 5, quote: 'Airbnb + Booking an einem Ort — kein Marge-Verlust durch Chaos.', name: 'Laura Petit', role: 'Concierge – 30 Einheiten' },
    { stars: 5, quote: 'Ohne IT-Hintergrund sieht man, was Cash angeht.', name: 'Nicolas Faure', role: 'Eigentümer – 1 Loft' },
    { stars: 5, quote: 'Dashboards zeigen, wo wir verdienen und Zeit verbrennen.', name: 'Pauline Henry', role: 'Managerin – 11 Studios' },
    { stars: 5, quote: 'Wirksamer Support — selten in dieser Preisklasse.', name: 'Maxime Robert', role: 'Concierge – 14 Einheiten' },
    { stars: 4, quote: 'Fast perfekt; zwei kleine Bugs am Start, schnell gefixt.', name: 'Élise Garnier', role: 'Eigentümerin – 6 Objekte' },
    { stars: 5, quote: 'Weniger Mail, weniger manueller Sync — mehr Zeit fürs Geschäft.', name: 'Vincent Caron', role: 'Gastgeber – 4 Zimmer' },
    { stars: 5, quote: 'Alltag flüssig — gut zum Skalieren ohne Personalspirale.', name: 'Manon Perez', role: 'Managerin – 9 Apartments' },
    { stars: 5, quote: 'Gemacht von Leuten, die von Nächten leben.', name: 'Julien Masson', role: 'Concierge – 25 Einheiten' },
    { stars: 5, quote: 'Einfach, schnell, ergebnisorientiert.', name: 'Fanny Lemoine', role: 'Eigentümerin – 3 Objekte' },
    { stars: 5, quote: 'Feedback wird umgesetzt — Produkt bewegt sich richtig.', name: 'Romain Diaz', role: 'Manager – 16 Einheiten' },
    { stars: 5, quote: 'Weniger Ops-Stress = mehr Marge pro Aufenthalt.', name: 'Inès Rolland', role: 'Concierge – 11 Einheiten' },
    { stars: 5, quote: 'Zwischen Besichtigungen unverzichtbar für Übergaben.', name: 'Khaled Benali', role: 'Eigentümer – 8 Objekte' },
    { stars: 5, quote: 'Menschlicher, schneller Support — wichtig bei vollem Kalender.', name: 'Charlotte Meyer', role: 'Gastgeberin – 5 Apartments' },
    { stars: 5, quote: 'Zurück zu verstreuten Sheets? Keine Option mehr.', name: 'Étienne Colin', role: 'Manager – 19 Einheiten' },
    { stars: 5, quote: 'Gesamtes Team in einem Tag umgestellt — sofortige Adoption.', name: 'Amélie Roy', role: 'Concierge – 7 Einheiten' },
  ],
}

const it: ReviewsCopy = {
  trustTitle: 'Operatori che proteggono il margine con StayManager',
  trustSubtitle: 'Team che volevano meno amministrazione — e più notti redditizie.',
  moreReviewsTitle: 'Altre recensioni',
  featured: [
    {
      stars: 5,
      quote:
        'Doppia prenotazione tra Booking e Airbnb su un 45 m²: 420 € di risarcimento e voto in calo. Con un’unica verità sul calendario, in 4 mesi l’occupazione è passata dal 68 % al 79 % — stimiamo ~6 notti in più al mese sul parco.',
      name: 'Nassim Benaïssa',
      role: 'Conciergerie – 28 unità (Lione · Annecy)',
    },
    {
      stars: 5,
      quote:
        'Volevo un controllo da investitrice, non rattoppi su Excel. In un trimestre il ricavo medio per unità è salito da 1.040 € a 1.220 € / mese con aggiustamenti di prezzo più rapidi — senza comprare un metro quadro in più.',
      name: 'Éléonore Vasseur',
      role: 'Investitrice – 9 monolocali (Bordeaux)',
    },
    {
      stars: 5,
      quote:
        'Affittiamo la seconda casa quando non ci siamo: prima 6–8 h / settimana tra admin e messaggi. Dopo aver strutturato i turnover, 22 notti vendute in 8 settimane contro 14 nella stessa finestra della stagione scorsa — e zero errori al check-in.',
      name: 'Marc Delmas',
      role: 'Host privato – trilocale (Marsiglia)',
    },
    {
      stars: 5,
      quote:
        'Onboarding di 12 immobili in sei settimane senza assunzioni: stesse checklist per team e fornitori. Il tempo coordinatore per unità è sceso da ~45 a ~22 minuti — alla nostra scala, diverse migliaia di € da reinvestire nell’acquisizione.',
      name: 'Laura Michaud',
      role: 'COO – conciergerie 41 chiavi (Parigi · Île-de-France)',
    },
    {
      stars: 5,
      quote:
        'Due monolocali sotto il resto del portafoglio del 14 %. Dopo pricing e pulizie più rigorosi hanno recuperato ~2.100 € / trimestre ciascuno la stagione dopo. Finalmente numeri per immobile, non sensazioni.',
      name: 'Julien Rousselet',
      role: 'Investitore – 14 appartamenti',
    },
    {
      stars: 5,
      quote:
        'Prima stagione caotica: pulizie in ritardo, chiavi, stress il venerdì. Quest’anno 27 soggiorni vs 19 l’anno scorso, e ~+60 € di scontrino medio per soggiorno su pulizie + late checkout — perché i fornitori vedono lo stesso piano chiaro.',
      name: 'Sophie Lemaire',
      role: 'Host privata – chalet 6 posti (Alpi)',
    },
  ],
  more: [
    { stars: 5, quote: 'Pulizie sotto controllo: meno imprevisti, meno notti perse.', name: 'Marc Lefebvre', role: 'Proprietario – 3 immobili' },
    { stars: 5, quote: 'Risposte rapide quando c’è un tema business critico.', name: 'Claire Renard', role: 'Conciergerie – 22 unità' },
    { stars: 5, quote: 'Interfaccia chiara: ops adottata senza settimane di training.', name: 'David Laurent', role: 'Gestore – 6 appartamenti' },
    { stars: 5, quote: 'Meno reinserimenti, più tempo su prezzo ed esperienza ospite.', name: 'Emma Bernard', role: 'Proprietaria – 5 immobili' },
    { stars: 5, quote: 'Il supporto capisce i volumi — non risposte preconfezionate.', name: 'Lucas Moreau', role: 'Conciergerie – 18 unità' },
    { stars: 4, quote: 'Molto solido; un breve video iniziale aiuterebbe.', name: 'Sarah Petit', role: 'Host – 2 monolocali' },
    { stars: 5, quote: 'Turnover guidati: evitiamo recensioni costose.', name: 'Antoine Girard', role: 'Conciergerie – 9 unità' },
    { stars: 5, quote: 'Operativi in un pomeriggio — zero attriti per scalare.', name: 'Camille Blanc', role: 'Proprietaria – 7 immobili' },
    { stars: 5, quote: 'Supporto spesso sotto un’ora quando è urgente.', name: 'Hugo Marchand', role: 'Gestore – 12 appartamenti' },
    { stars: 5, quote: 'Airbnb + Booking insieme: meno margine perso nel caos.', name: 'Laura Petit', role: 'Conciergerie – 30 unità' },
    { stars: 5, quote: 'Senza essere tech, vedi cosa conta per il cash.', name: 'Nicolas Faure', role: 'Proprietario – 1 loft' },
    { stars: 5, quote: 'Dashboard chiari: dove guadagni e dove bruci ore.', name: 'Pauline Henry', role: 'Gestore – 11 monolocali' },
    { stars: 5, quote: 'Supporto efficace — raro a questa fascia di prezzo.', name: 'Maxime Robert', role: 'Conciergerie – 14 unità' },
    { stars: 4, quote: 'Quasi perfetto; due piccoli bug iniziali, risolti subito.', name: 'Élise Garnier', role: 'Proprietaria – 6 immobili' },
    { stars: 5, quote: 'Meno email, meno sync manuale — più ore sul business.', name: 'Vincent Caron', role: 'Host – 4 camere' },
    { stars: 5, quote: 'Fluido ogni giorno; ottimo per scalare senza assunzioni lineari.', name: 'Manon Perez', role: 'Gestore – 9 appartamenti' },
    { stars: 5, quote: 'Fatto da chi vive delle notti vendute.', name: 'Julien Masson', role: 'Conciergerie – 25 unità' },
    { stars: 5, quote: 'Semplice, veloce, orientato al risultato.', name: 'Fanny Lemoine', role: 'Proprietaria – 3 unità' },
    { stars: 5, quote: 'Integrano i feedback — il prodotto va nella direzione giusta.', name: 'Romain Diaz', role: 'Gestore – 16 immobili' },
    { stars: 5, quote: 'Meno stress operativo = più margine per soggiorno.', name: 'Inès Rolland', role: 'Conciergerie – 11 unità' },
    { stars: 5, quote: 'Tra un sopralluogo e l’altro è essenziale per chiudere un turnover.', name: 'Khaled Benali', role: 'Proprietario – 8 immobili' },
    { stars: 5, quote: 'Supporto umano e veloce — conta con calendario pieno.', name: 'Charlotte Meyer', role: 'Host – 5 appartamenti' },
    { stars: 5, quote: 'Non torneremmo a fogli e chat sparsi.', name: 'Étienne Colin', role: 'Gestore – 19 unità' },
    { stars: 5, quote: 'Tutto il team migrato in un giorno — adozione immediata.', name: 'Amélie Roy', role: 'Conciergerie – 7 unità' },
  ],
}

export const reviewsTranslations: Record<Locale, ReviewsCopy> = {
  fr,
  es,
  en,
  de,
  it,
}
