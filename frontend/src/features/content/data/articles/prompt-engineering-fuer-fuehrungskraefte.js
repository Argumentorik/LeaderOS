export default {
  slug: 'prompt-engineering-fuer-fuehrungskraefte',
  type: 'guide',
  status: 'published',
  title: 'Prompt Engineering für Führungskräfte.',
  description:
    'Vier Prompt-Patterns für deinen Wochenfluss. Keine Token-Optimierung, ' +
    'kein API-Geschwafel · sondern Strukturen die deine KI-Antworten von ' +
    'generisch auf einsatzbereit heben.',
  author: 'Wlad Jachtchenko',
  publishedAt: '2026-07-03',
  cover: null,
  tags: ['KI', 'Prompts', 'Frameworks'],
  body: [
    { type: 'paragraph', text: 'Prompt Engineering klingt nach Tech-Disziplin. Für Führungskräfte ist es das nicht. Es ist die Fähigkeit, deine eigene Frage so zu formulieren dass das Modell weiß welche Methodik gerade dran ist, was die Form der Antwort sein soll und welche Anti-Patterns vermieden werden.' },
    { type: 'heading', level: 2, text: 'Pattern 01: Rolle + Methodik + Form.' },
    { type: 'paragraph', text: 'Schlechter Prompt: "Schreib mir ein Feedback für meinen Senior-Engineer." Besser: "Du bist ein erfahrener Engineering-Coach. Schreibe ein Feedback nach der B-W-W-Formel (Beobachtung, Wirkung, Wunsch). Drei Sätze, faktisch, ohne Vorwurfs-Ton. Beobachtung: [konkret]. Wirkung: [operativ]. Wunsch: [zukunftsgerichtet]."' },
    { type: 'heading', level: 2, text: 'Pattern 02: Antwort-Form vorgeben.' },
    { type: 'paragraph', text: 'Statt "fasse mir das zusammen", sage "fasse mir das in drei Bullets zusammen, jeweils maximal 12 Wörter". Du sparst dir das Nacharbeiten. Die Form steuert die Substanz.' },
    { type: 'heading', level: 2, text: 'Pattern 03: Anti-Patterns explizit verbieten.' },
    { type: 'paragraph', text: '"Antworte ohne KI-Buzzwords (synergize, leverage, paradigm shift). Antworte ohne den Satz \'das hängt davon ab\'. Antworte ohne mich zu fragen ob ich mehr Kontext brauche · ich habe oben den vollen Kontext gegeben."' },
    { type: 'heading', level: 2, text: 'Pattern 04: Iteration einbauen.' },
    { type: 'paragraph', text: 'Statt EINE Antwort zu erwarten, fordere drei Varianten an: "Gib mir drei Varianten der Eröffnung. Variante 1: härter und direkter. Variante 2: weicher und einladender. Variante 3: neutral und faktisch. Markiere für jede ihr Risiko."' },
    { type: 'framework', code: 'PROMPT', title: 'Vier Patterns', explanation: 'Rolle + Methodik + Form anweisen · Antwort-Form vorgeben · Anti-Patterns explizit verbieten · Iteration mit drei Varianten anfordern. Wer die vier Patterns beherrscht, bekommt aus jedem Modell brauchbare Antworten.' },
    { type: 'heading', level: 2, text: 'Was du NICHT in Prompts schreibst.' },
    { type: 'list', style: 'bullet', items: [
      'Keine personenidentifizierenden Daten. Vorname und Rolle reichen.',
      'Keine vertraulichen Geschäftsdaten in öffentliche Tools. Für sensible Cases nutze Enterprise-Setups oder WladBot (DSGVO-konform, EU-Server).',
      'Keine "schreibe mir 500 Wörter". Du bekommst Füllung, nicht Substanz.',
    ] },
    { type: 'callout', tone: 'lime', text: 'Wer mit den vier Patterns arbeitet, gewinnt typischerweise 60 Prozent Vorbereitungs-Zeit pro Skript. Wer ohne Patterns arbeitet, schreibt drei Versionen bevor er die brauchbare findet.' },
    { type: 'paragraph', text: 'In der Challenge trainierst du Prompt Engineering an deinen drei häufigsten Konversations-Typen. WladBot ist bereits mit den Patterns vorkonfiguriert · du übst sie an Cases aus deinem Backlog.' },
  ],
  seo: {
    title: 'Prompt Engineering für Führungskräfte · LeaderOS',
    description: 'Prompt Engineering für Führungskräfte: vier Patterns, die KI-Antworten von generisch auf einsatzbereit heben. Ohne API-Geschwafel. Von Wlad Jachtchenko.',
    keywords: ['Prompt Engineering deutsch', 'Prompt Engineering Manager', 'ChatGPT Prompts Führung', 'KI Prompts Leadership', 'Prompt Patterns'],
  },
  related: ['chatgpt-als-sparring-partner-fuenf-skripte', 'ki-im-fuehrungs-alltag-drei-use-cases'],
};
