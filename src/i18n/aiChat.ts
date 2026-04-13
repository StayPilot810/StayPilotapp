import type { Locale } from './navbar'

export type AiChatCopy = {
  aiChatFabLabel: string
  aiChatTitle: string
  aiChatSubtitle: string
  aiChatWelcome: string
  aiChatPlaceholder: string
  aiChatSend: string
  aiChatClose: string
  aiChatThinking: string
  aiChatErrorGeneric: string
  aiChatErrorUnavailable: string
  aiChatFooterHint: string
  aiChatAttachPhoto: string
  aiChatRemovePhoto: string
  aiChatImageOnlyPrompt: string
  aiChatPastePhotoHint: string
}

const fr: AiChatCopy = {
  aiChatFabLabel: 'Parler avec Agent StayPilot',
  aiChatTitle: 'Agent StayPilot',
  aiChatSubtitle:
    'Comptes connectés — argumentaire serré, offre adaptée, prochaine étape tout de suite, dans votre langue.',
  aiChatWelcome:
    'Ravi de vous lire — je suis là pour vous faire gagner du temps et du chiffre. Dites-moi : combien de logements, votre plus grosse friction aujourd’hui (calendrier, charges, stats, veille…) ? Je vous propose l’offre Starter, Pro ou Scale qui colle, avec un plan d’action clair — tarifs sur le site, deal sur mesure par mail à contail@staypilot.fr. C’est parti ?',
  aiChatPlaceholder: 'Votre situation, votre objectif, ou votre objection…',
  aiChatSend: 'Envoyer',
  aiChatClose: 'Fermer',
  aiChatThinking: 'Agent StayPilot prépare votre réponse…',
  aiChatErrorGeneric: 'Une erreur est survenue. Réessayez ou écrivez-nous par e-mail.',
  aiChatErrorUnavailable:
    'Agent StayPilot n’est pas configuré sur ce serveur (clé API manquante). Écrivez-nous à contail@staypilot.fr pour être aidé.',
  aiChatFooterHint: 'IA générative — vérifiez les informations importantes.',
  aiChatAttachPhoto: 'Joindre une photo ou une capture d’écran',
  aiChatRemovePhoto: 'Retirer l’image',
  aiChatImageOnlyPrompt: 'Que pensez-vous de cette capture ? Comment StayPilot peut m’aider ?',
  aiChatPastePhotoHint: 'Astuce : collez une capture avec Ctrl+V (ou Cmd+V).',
}

const en: AiChatCopy = {
  aiChatFabLabel: 'Talk to Agent StayPilot',
  aiChatTitle: 'Agent StayPilot',
  aiChatSubtitle:
    'Signed-in only — sharp recommendations, plan fit, and a clear next step in your language.',
  aiChatWelcome:
    'Great to meet you — I’m here to save you time and sharpen your operations. How many listings do you run, and what’s your biggest bottleneck (calendar, costs, stats, intel…)? I’ll map you to Starter, Pro, or Scale with a concrete next move — pricing on the site; tailored terms via contail@staypilot.fr. What should we tackle first?',
  aiChatPlaceholder: 'Your context, goal, or objection…',
  aiChatSend: 'Send',
  aiChatClose: 'Close',
  aiChatThinking: 'Agent StayPilot is preparing your reply…',
  aiChatErrorGeneric: 'Something went wrong. Try again or email us.',
  aiChatErrorUnavailable:
    'Agent StayPilot is not configured on this server (missing API key). Email contail@staypilot.fr for help.',
  aiChatFooterHint: 'Generative AI — double-check important details.',
  aiChatAttachPhoto: 'Attach a photo or screenshot',
  aiChatRemovePhoto: 'Remove image',
  aiChatImageOnlyPrompt: 'What do you see in this screenshot? How can StayPilot help?',
  aiChatPastePhotoHint: 'Tip: paste a screenshot with Ctrl+V (or Cmd+V).',
}

export const aiChatTranslations: Record<Locale, AiChatCopy> = {
  fr,
  en,
  es: {
    ...en,
    aiChatFabLabel: 'Hablar con Agent StayPilot',
    aiChatTitle: 'Agent StayPilot',
    aiChatSubtitle:
      'Solo conectados — recomendaciones claras, plan adecuado y siguiente paso inmediato.',
    aiChatWelcome:
      'Encantado — estoy para ahorrarle tiempo y ordenar su negocio. ¿Cuántos alojamientos y cuál es su mayor fricción (calendario, costes, estadísticas, inteligencia…)? Le encajo Starter, Pro o Scale con un plan de acción — precios en la web; propuestas a medida en contail@staypilot.fr. ¿Por dónde empezamos?',
    aiChatPlaceholder: 'Su contexto, objetivo u objeción…',
    aiChatSend: 'Enviar',
    aiChatClose: 'Cerrar',
    aiChatThinking: 'Agent StayPilot prepara su respuesta…',
    aiChatErrorGeneric: 'Ha ocurrido un error. Inténtelo de nuevo o escríbanos.',
    aiChatErrorUnavailable:
      'Agent StayPilot no está configurado (falta clave API). Escríbanos a contail@staypilot.fr.',
    aiChatFooterHint: 'IA generativa — verifique lo importante.',
    aiChatAttachPhoto: 'Adjuntar foto o captura de pantalla',
    aiChatRemovePhoto: 'Quitar imagen',
    aiChatImageOnlyPrompt: '¿Qué ve en esta captura? ¿Cómo puede ayudarle StayPilot?',
    aiChatPastePhotoHint: 'Consejo: pegue una captura con Ctrl+V (o Cmd+V).',
  },
  de: {
    ...en,
    aiChatFabLabel: 'Mit Agent StayPilot sprechen',
    aiChatTitle: 'Agent StayPilot',
    aiChatSubtitle:
      'Nur angemeldet — klare Empfehlung, passender Tarif, sofortiger nächster Schritt.',
    aiChatWelcome:
      'Schön, Sie zu sehen — ich helfe Ihnen, Zeit zu sparen und Ihre Vermietung zu steuern. Wie viele Unterkünfte, und wo brennt es am meisten (Kalender, Kosten, Statistiken, Monitoring…)? Ich mappe Starter, Pro oder Scale mit konkretem Next Step — Preise auf der Website; individuelle Angebote über contail@staypilot.fr. Womit starten wir?',
    aiChatPlaceholder: 'Ihr Kontext, Ziel oder Einwand…',
    aiChatSend: 'Senden',
    aiChatClose: 'Schließen',
    aiChatThinking: 'Agent StayPilot bereitet Ihre Antwort vor…',
    aiChatErrorGeneric: 'Fehler. Bitte erneut versuchen oder mailen.',
    aiChatErrorUnavailable:
      'Agent StayPilot ist nicht konfiguriert (API-Schlüssel fehlt). Schreiben Sie an contail@staypilot.fr.',
    aiChatFooterHint: 'Generative KI — Wichtiges bitte prüfen.',
    aiChatAttachPhoto: 'Foto oder Screenshot anhängen',
    aiChatRemovePhoto: 'Bild entfernen',
    aiChatImageOnlyPrompt: 'Was sehen Sie auf dieser Aufnahme? Wie kann StayPilot helfen?',
    aiChatPastePhotoHint: 'Tipp: Screenshot mit Strg+V (oder Cmd+V) einfügen.',
  },
  it: {
    ...en,
    aiChatFabLabel: 'Parla con Agent StayPilot',
    aiChatTitle: 'Agent StayPilot',
    aiChatSubtitle:
      'Solo utenti connessi — consigli netti, piano giusto, passo successivo subito.',
    aiChatWelcome:
      'Piacere — sono qui per farvi risparmiare tempo e dare ordine al business. Quanti alloggi e dove sentite più attrito (calendario, costi, statistiche, intelligence…)? Vi propongo Starter, Pro o Scale con un piano d’azione — prezzi sul sito; offerte su misura via contail@staypilot.fr. Da cosa iniziamo?',
    aiChatPlaceholder: 'Contesto, obiettivo o obiezione…',
    aiChatSend: 'Invia',
    aiChatClose: 'Chiudi',
    aiChatThinking: 'Agent StayPilot prepara la risposta…',
    aiChatErrorGeneric: 'Errore. Riprovate o scriveteci.',
    aiChatErrorUnavailable:
      'Agent StayPilot non è configurato (manca chiave API). Scrivete a contail@staypilot.fr.',
    aiChatFooterHint: 'IA generativa — verificate le informazioni importanti.',
    aiChatAttachPhoto: 'Allega foto o screenshot',
    aiChatRemovePhoto: 'Rimuovi immagine',
    aiChatImageOnlyPrompt: 'Cosa vedi in questa schermata? Come può aiutarti StayPilot?',
    aiChatPastePhotoHint: 'Suggerimento: incolla uno screenshot con Ctrl+V (o Cmd+V).',
  },
}
