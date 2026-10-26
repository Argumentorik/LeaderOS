import {
  Mail, Scale, PartyPopper,
  LayoutList, BarChart3, ListTodo
} from 'lucide-react';

export const toolsDe = [
  { id: 'decision-maker', title: 'Entscheidungshilfe', desc: 'Strukturierte Entscheidungsanalyse mit Bias-Erkennung', icon: Scale, gradient: 'from-[#BFFF00] to-[#9ACC00]',
    steps: [
      { q: 'Was entscheidest du?', placeholder: 'Beschreibe die Entscheidung, Optionen und was auf dem Spiel steht...' },
      { q: 'Wie hoch ist die Auswirkung?', options: ['Hoch — betrifft Team/Unternehmen', 'Mittel — betrifft meine Abteilung', 'Niedrig — betrifft nur mich', 'Dringend — muss heute entschieden werden'] },
      { q: 'Welche Informationen hast du?', options: ['Alle Daten verfügbar', 'Teilweise — einige Unbekannte', 'Sehr begrenzt — eher Bauchgefühl', 'Widersprüchliche Daten'] }
    ]
  },
  { id: 'email-optimizer', title: 'E-Mail Optimierer', desc: 'E-Mails klar, professionell und wirkungsvoll umschreiben', icon: Mail, gradient: 'from-[#00CC77] to-[#00AA66]',
    steps: [
      { q: 'Welche Art von E-Mail?', options: ['Follow-up', 'Anfrage / Bitte', 'Schlechte Nachricht', 'Ankündigung', 'Feedback', 'Vorstellung', 'Eskalation'] },
      { q: 'Welcher Tonfall?', options: ['Direkt & Professionell', 'Diplomatisch & Sanft', 'Empathisch & Warm', 'Autoritär', 'Locker & Freundlich'] },
      { q: 'Füge deinen E-Mail-Entwurf ein', placeholder: 'Füge die E-Mail ein, die du optimieren möchtest...' }
    ]
  },
  { id: 'team-event-planner', title: 'Team Event Planner', desc: 'Kreative Event-Ideen mit Agenda, Location-Tipps & Logistik', icon: PartyPopper, gradient: 'from-emerald-500 to-green-500',
    steps: [
      { q: 'Welche Art von Event?', options: ['Teambuilding', 'Strategie-Offsite', 'Feier / Meilenstein', 'Workshop / Training', 'Kickoff-Meeting', 'Social / Spaß'] },
      { q: 'Teamgröße?', options: ['2-5 Personen', '6-15 Personen', '16-30 Personen', '30+ Personen'] },
      { q: 'Wo soll das Event stattfinden?', placeholder: 'Stadt, Region oder Vorliebe z.B. "München", "Remote", "In der Nähe vom Büro Berlin"...' },
      { q: 'Besondere Anforderungen?', placeholder: 'Budget, spezielle Wünsche, Ernährungseinschränkungen, Tageszeit...' }
    ]
  },
  { id: 'meeting-builder', title: 'Meeting und Agenda', desc: 'Strukturierte Agenden mit Zeitblöcken & Zielen', icon: LayoutList, gradient: 'from-orange-500 to-amber-500',
    steps: [
      { q: 'Welche Art von Meeting?', options: ['1:1 Check-in', 'Team Standup', 'Strategie / Planung', 'Brainstorming', 'Entscheidungs-Meeting', 'Retrospektive', 'All-Hands'] },
      { q: 'Meeting-Dauer?', options: ['15 Minuten', '30 Minuten', '45 Minuten', '1 Stunde', '90 Minuten', '2+ Stunden'] },
      { q: 'Themen die besprochen werden müssen', placeholder: 'Was muss besprochen oder entschieden werden? Wer sollte teilnehmen?' }
    ]
  },
  { id: 'performance-analysis', title: 'Leistungsanalyse', desc: 'Stärken/Schwächen-Profile mit Entwicklungsplänen', icon: BarChart3, gradient: 'from-pink-500 to-rose-500',
    steps: [
      { q: 'Wen analysierst du?', options: ['Einen bestimmten Mitarbeiter', 'Mein gesamtes Team', 'Mich selbst', 'Einen Kandidaten zur Beförderung'] },
      { q: 'Was ist der Kontext?', options: ['Regulärer Review-Zyklus', 'PIP / Verbesserungsplan', 'Beförderungsbewertung', 'Neuer Rollen-Fit', 'Nachfolgeplanung'] },
      { q: 'Beschreibe die Leistung', placeholder: 'Beschreibe den Mitarbeiter: Rolle, Leistungsbeobachtungen, Verhaltensmuster, Stärken und Bedenken...' }
    ]
  },
  { id: 'priority-planner', title: 'Prioritätenplaner', desc: 'Impact-basierte Priorisierung für deinen Führungsalltag', icon: ListTodo, gradient: 'from-amber-500 to-yellow-500',
    steps: [
      { q: 'Was ist deine größte Herausforderung?', options: ['Zu viele Prioritäten', 'Unklare Strategie', 'Team-Kapazitätsprobleme', 'Zusammenarbeit & Abstimmung', 'Wachstum & Skalierung', 'Persönliche Entwicklung'] },
      { q: 'Zeithorizont?', options: ['Diese Woche', 'Dieser Monat', 'Dieses Quartal (90 Tage)', 'Dieses Jahr'] },
      { q: 'Liste deine aktuellen Aufgaben und Projekte', placeholder: 'Liste alles auf, was auf deinem Tisch liegt. Inklusive Deadlines und Team-Kapazität...' }
    ]
  },
];

export const toolsEn = [
  { id: 'decision-maker', title: 'Decision Maker', desc: 'Structured decision analysis with bias detection', icon: Scale, gradient: 'from-[#BFFF00] to-[#9ACC00]',
    steps: [
      { q: 'What are you deciding?', placeholder: 'Describe the decision, options, and stakes...' },
      { q: 'What is the impact level?', options: ['High — affects whole team/company', 'Medium — affects my department', 'Low — affects only me', 'Urgent — needs decision today'] },
      { q: 'What information do you have?', options: ['All data available', 'Partial information — some unknowns', 'Very limited — mostly gut feeling', 'Conflicting data'] }
    ]
  },
  { id: 'email-optimizer', title: 'Email Optimizer', desc: 'Rewrite emails to be clear, professional, and impactful', icon: Mail, gradient: 'from-[#00CC77] to-[#00AA66]',
    steps: [
      { q: 'What type of email?', options: ['Follow-up', 'Request / Ask', 'Bad News', 'Announcement', 'Feedback', 'Introduction', 'Escalation'] },
      { q: 'What tone do you need?', options: ['Direct & Professional', 'Diplomatic & Soft', 'Empathetic & Warm', 'Authoritative', 'Casual & Friendly'] },
      { q: 'Paste your current email draft', placeholder: 'Paste the email you want to optimize...' }
    ]
  },
  { id: 'team-event-planner', title: 'Team Event Planner', desc: 'Creative event ideas with location tips, agenda & logistics', icon: PartyPopper, gradient: 'from-emerald-500 to-green-500',
    steps: [
      { q: 'What kind of event?', options: ['Team Building', 'Strategy Offsite', 'Celebration / Milestone', 'Workshop / Training', 'Kickoff Meeting', 'Social / Fun'] },
      { q: 'Team size?', options: ['2-5 people', '6-15 people', '16-30 people', '30+ people'] },
      { q: 'Where should the event take place?', placeholder: 'City, region or preference e.g. "Munich", "Remote", "Near Berlin office"...' },
      { q: 'Any special requirements?', placeholder: 'Budget range, special wishes, dietary restrictions, time of day...' }
    ]
  },
  { id: 'meeting-builder', title: 'Meeting and Agenda', desc: 'Structured agendas with time blocks & goals', icon: LayoutList, gradient: 'from-orange-500 to-amber-500',
    steps: [
      { q: 'What type of meeting?', options: ['1:1 Check-in', 'Team Standup', 'Strategy / Planning', 'Brainstorming', 'Decision Meeting', 'Retrospective', 'All-Hands'] },
      { q: 'Meeting duration?', options: ['15 minutes', '30 minutes', '45 minutes', '1 hour', '90 minutes', '2+ hours'] },
      { q: 'Key topics to cover', placeholder: 'What needs to be discussed or decided? Who should attend?' }
    ]
  },
  { id: 'performance-analysis', title: 'Performance Analysis', desc: 'Strength/weakness profiles with development plans', icon: BarChart3, gradient: 'from-pink-500 to-rose-500',
    steps: [
      { q: 'Who are you analyzing?', options: ['A specific team member', 'My entire team', 'Myself', 'A candidate for promotion'] },
      { q: 'What is the context?', options: ['Regular Review Cycle', 'PIP / Improvement Plan', 'Promotion Assessment', 'New Role Fit', 'Succession Planning'] },
      { q: 'Describe their performance', placeholder: 'Describe the employee: role, performance observations, behavior patterns, key strengths and concerns...' }
    ]
  },
  { id: 'priority-planner', title: 'Priority Planner', desc: 'Impact-based prioritization for your leadership day', icon: ListTodo, gradient: 'from-amber-500 to-yellow-500',
    steps: [
      { q: 'What is your main challenge right now?', options: ['Too many priorities', 'Unclear strategy', 'Team capacity issues', 'Collaboration & alignment', 'Growth & Scaling', 'Personal development'] },
      { q: 'Time horizon?', options: ['This week', 'This month', 'This quarter (90 days)', 'This year'] },
      { q: 'List your current tasks and projects', placeholder: 'List everything on your plate. Include deadlines and team capacity...' }
    ]
  },
];
