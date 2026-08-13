import { Brain, Sparkles, HeartHandshake } from 'lucide-react';

export const WLAD_AVATAR = '/wladbot-avatar-clean.png';

// 3-Layer Leadership System (Iter 92.35 — Mert: high-converting landing copy)
// KI · Rhetorik · EQ → user-supplied final headlines + bullets.
export const getLayers = (de) => [
  {
    number: '01',
    title: de ? 'KI — Klar denken' : 'AI — Think Clearly',
    description: de
      ? 'Strukturierte Analyse deiner Kommunikation in Echtzeit.'
      : 'Real-time structured analysis of your communication.',
    features: de
      ? [
          'Erkennung deiner Denk- & Sprachmuster',
          'Sofort-Feedback auf Klarheit & Struktur',
          'Adaptive Lernpfade basierend auf Verhalten',
          'Kontextbasierte Coaching-Impulse',
          'RAG-gestützte Wlad-Wissensintegration',
        ]
      : [
          'Detect your thought & speech patterns',
          'Instant feedback on clarity & structure',
          'Adaptive learning paths from behavior',
          'Context-aware coaching impulses',
          'RAG-grounded Wlad knowledge integration',
        ],
    gradient: '#6366F1, #8B5CF6',
    icon: Brain,
  },
  {
    number: '02',
    title: de ? 'Rhetorik — Klar sprechen' : 'Rhetoric — Speak Clearly',
    description: de
      ? 'Deine Worte werden zu einem Werkzeug für Einfluss.'
      : 'Your words become tools of influence.',
    features: de
      ? [
          'Verbesserung deiner Argumentationslogik',
          'Storytelling-Optimierung in Echtzeit',
          'Reduktion von Unsicherheit & Füllsprache',
          'Strukturierte Rede-Frameworks (SEXIER)',
          'Live Speech- & Video-Feedback',
        ]
      : [
          'Sharpen your argumentation logic',
          'Real-time storytelling optimization',
          'Cut uncertainty & filler language',
          'Structured speech frameworks (SEXIER)',
          'Live speech & video feedback',
        ],
    gradient: '#EC4899, #F43F5E',
    icon: Sparkles,
  },
  {
    number: '03',
    title: de ? 'EQ — Klar führen' : 'EQ — Lead Clearly',
    description: de
      ? 'Menschen lesen, Dynamiken verstehen, Vertrauen aufbauen.'
      : 'Read people, understand dynamics, build trust.',
    features: de
      ? [
          'Emotionale Muster in Gesprächen erkennen',
          'Konflikt- & Drucksituationen meistern',
          'Führungskommunikation auf C-Level Niveau',
          'Wahrnehmung von Raum & Energie',
          'Entscheidungsstärke unter Unsicherheit',
        ]
      : [
          'Detect emotional patterns in conversations',
          'Master conflict & pressure situations',
          'C-level grade leadership communication',
          'Room & energy awareness',
          'Decision strength under uncertainty',
        ],
    gradient: '#10B981, #14B8A6',
    icon: HeartHandshake,
  },
];

// Legacy paths grid — kept for back-compat (CoachingPathCard usage). The hero
// + TierPricingGrid are now the dominant CTAs.
export const getCoachingPaths = () => [];

export const getPremiumFeatures = (de) => de
  ? ['12× Einzelcoaching mit Argumentorik-Coaches', 'Persönliche Strategie-Session', 'Individuelle Coaching-Pfade', 'Priority AI Feedback System', 'Erweiterte Wlad-Frameworks', 'Mastermind-Gruppe Zugang', 'Quartals-Reviews (4×/Jahr)', '30-Tage Geld-zurück-Garantie']
  : ['12× 1:1 coaching with Argumentorik coaches', 'Personal strategy session', 'Custom coaching paths', 'Priority AI feedback', 'Extended Wlad frameworks', 'Mastermind group access', 'Quarterly reviews (4×/year)', '30-day money-back guarantee'];

// FAQ — user-supplied final copy (5 questions).
export const getFaqs = (de) => de ? [
  { q: 'Für wen ist das System?', a: 'Für alle, die klarer führen, sprechen und entscheiden wollen — von Foundern bis Executives.' },
  { q: 'Brauche ich Vorkenntnisse?', a: 'Nein, das System passt sich deinem Level automatisch an.' },
  { q: 'Wie schnell sehe ich Ergebnisse?', a: 'Erste Veränderungen meist innerhalb der ersten 7 Tage.' },
  { q: 'Ist das nur ein Coaching oder Software?', a: 'Es ist ein hybrides System aus KI, Coaching und Frameworks.' },
  { q: 'Was unterscheidet es von anderen Coachings?', a: 'Es arbeitet mit deinem echten Verhalten (Speech, Video, Entscheidungen) — nicht mit Theorie.' },
] : [
  { q: 'Who is this system for?', a: 'For anyone who wants to lead, speak and decide more clearly — from founders to executives.' },
  { q: 'Do I need prior experience?', a: 'No. The system adapts to your level automatically.' },
  { q: 'How fast will I see results?', a: 'First shifts typically within the first 7 days.' },
  { q: 'Is this just coaching or software?', a: 'It is a hybrid system: AI, coaching and frameworks.' },
  { q: "What sets it apart from other coachings?", a: 'It works with your real behavior (speech, video, decisions) — not theory.' },
];

// Social-proof testimonials (Iter 92.35 — user-supplied copy).
export const getTestimonials = (de) => de ? [
  { quote: 'Ich habe meine Art zu sprechen komplett verändert.', author: 'Founder', role: 'Berlin' },
  { quote: 'Das System zwingt dich zu Klarheit.', author: 'Team Lead', role: 'Tech' },
  { quote: 'Wie ein Spiegel für mein Denken.', author: 'Consultant', role: 'Strategy' },
] : [
  { quote: 'I completely changed the way I speak.', author: 'Founder', role: 'Berlin' },
  { quote: 'The system forces you to be clear.', author: 'Team Lead', role: 'Tech' },
  { quote: 'Like a mirror for my thinking.', author: 'Consultant', role: 'Strategy' },
];
