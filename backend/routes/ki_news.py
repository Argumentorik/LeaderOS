"""Daily KI-Business News & Insights for Leaders — curated content."""
from fastapi import APIRouter, Request
from datetime import datetime, timezone
from services import get_current_user

router = APIRouter(prefix="/api", tags=["ki-news"])

# Curated AI Leader Quotes with context
AI_LEADER_QUOTES = [
    {"author": "Sam Altman", "role": "CEO, OpenAI", "quote": "AI will be the most transformative technology in human history.", "insight": "Jede Führungsentscheidung muss AI-Impact berücksichtigen.", "coach_prompt": "Wie verändert AI meine Branche in den nächsten 3 Jahren?"},
    {"author": "Jensen Huang", "role": "CEO, NVIDIA", "quote": "AI is the new electricity.", "insight": "AI wird so fundamental wie Strom — unsichtbar aber in allem.", "coach_prompt": "Wo in meinem Unternehmen könnte AI wie 'Strom' wirken — unsichtbar aber überall?"},
    {"author": "Satya Nadella", "role": "CEO, Microsoft", "quote": "AI is the defining technology of our time.", "insight": "Microsoft stieg von 300 Mrd. auf 3 Bio. durch All-in auf AI.", "coach_prompt": "Was wäre mein All-in auf AI Move wie Nadella bei Microsoft?"},
    {"author": "Sundar Pichai", "role": "CEO, Google", "quote": "AI is more profound than fire or electricity.", "insight": "AI entwickelt sich exponentiell. Wer 2 Jahre wartet, ist 10 Jahre zurück.", "coach_prompt": "Was passiert wenn mein Unternehmen 2 Jahre mit AI wartet?"},
    {"author": "Elon Musk", "role": "CEO, Tesla & SpaceX", "quote": "AI is far more dangerous than nukes. Mark my words.", "insight": "AI-Ethik ist CEO-Aufgabe, nicht IT-Aufgabe.", "coach_prompt": "Welche AI-Ethik-Fragen muss ich als Leader jetzt beantworten?"},
    {"author": "Bill Gates", "role": "Co-Founder, Microsoft", "quote": "AI agents are the next platform revolution.", "insight": "AI Agents handeln autonom — wie digitale Mitarbeiter.", "coach_prompt": "Wie würde ich AI Agents in meinem Team einsetzen?"},
    {"author": "Mustafa Suleyman", "role": "CEO, Microsoft AI", "quote": "The new Turing question is not whether AI can think, but whether it can ACT.", "insight": "Delegation an AI wird zur Kernkompetenz von Leadern.", "coach_prompt": "Welche Aufgaben in meinem Alltag könnte ich an einen AI Agent delegieren?"},
    {"author": "Marc Andreessen", "role": "Co-Founder, a16z", "quote": "AI is eating software, just as software ate the world.", "insight": "SaaS wird zu GaaS — Generation as a Service.", "coach_prompt": "Wie bedroht der SaaS-zu-GaaS Shift mein Geschäftsmodell?"},
    {"author": "Dario Amodei", "role": "CEO, Anthropic", "quote": "AI safety is not about slowing down. It's about getting it right.", "insight": "Responsible AI ist Wettbewerbsvorteil, nicht Bremse.", "coach_prompt": "Wie baue ich Responsible AI als Wettbewerbsvorteil auf?"},
    {"author": "Arvind Krishna", "role": "CEO, IBM", "quote": "AI won't replace managers. Managers who use AI will replace those who don't.", "insight": "AI-Kompetenz wird zur Leadership-Grundvoraussetzung.", "coach_prompt": "Was muss ich JETZT lernen um nicht von AI-nativen Managern überholt zu werden?"},
    {"author": "Andrew Ng", "role": "Founder, DeepLearning.AI", "quote": "AI is the new electricity. Just as electricity transformed every industry 100 years ago, AI will now do the same.", "insight": "Jede Branche wird transformiert — ausnahmslos.", "coach_prompt": "Welche 3 Bereiche in meiner Branche wird AI als erstes transformieren?"},
    {"author": "Fei-Fei Li", "role": "Stanford HAI, Ex-Google", "quote": "If we want machines to think, we need to teach them to see.", "insight": "Multimodale AI versteht Text, Bilder und Video — das verändert Analyse.", "coach_prompt": "Wie nutze ich multimodale AI (Text+Bild+Video) für bessere Entscheidungen?"},
    {"author": "Demis Hassabis", "role": "CEO, Google DeepMind", "quote": "AI will be the most beneficial technology ever created by humanity.", "insight": "AI für Wissenschaft: Proteinstruktur, Medizin, Klimamodelle.", "coach_prompt": "Wo hat AI das größte Potenzial für positiven Impact in meinem Bereich?"},
    {"author": "Reed Hastings", "role": "Co-Founder, Netflix", "quote": "The companies that win will be the ones that learn fastest.", "insight": "AI beschleunigt Lernen um 10x — für Personen und Organisationen.", "coach_prompt": "Wie kann mein Team mit AI 10x schneller lernen?"},
]

# Curated KI-Business Trends with coach prompts
KI_TRENDS = [
    {"title": "SaaS wird zu GaaS", "category": "Geschäftsmodell", "summary": "Generation as a Service: Statt Software-Tools zu bedienen, generiert KI direkt das Ergebnis. Das verändert jedes SaaS-Geschäftsmodell.", "impact": "Hoch", "coach_prompt": "Analysiere wie der GaaS-Trend mein Geschäftsmodell bedroht und welche Chancen er bietet."},
    {"title": "AI Agents ersetzen Workflows", "category": "Automatisierung", "summary": "Autonome AI-Agenten übernehmen komplette Arbeitsprozesse: Recherche, Analyse, Entscheidungsvorlagen — ohne menschliches Micromanagement.", "impact": "Hoch", "coach_prompt": "Welche Workflows in meinem Unternehmen könnten AI Agents komplett übernehmen?"},
    {"title": "AI-First vs. AI-Augmented", "category": "Strategie", "summary": "AI-First Firmen bauen Produkte die ohne AI unmöglich wären. AI-Augmented nutzt AI nur als Add-on. Der Unterschied entscheidet über Marktdominanz.", "impact": "Kritisch", "coach_prompt": "Ist mein Unternehmen AI-Augmented oder AI-First? Was müsste sich ändern?"},
    {"title": "Prompt Engineering als C-Level Skill", "category": "Leadership", "summary": "CEOs die AI strategisch befragen, bekommen 10x bessere Analysen als die, die es delegieren. Prompt Engineering ist die neue Executive-Kompetenz.", "impact": "Mittel", "coach_prompt": "Zeig mir 3 C-Level Prompts die meine strategische Entscheidungsfindung verbessern."},
    {"title": "AI Readiness Gap", "category": "Organisation", "summary": "McKinsey: 90% experimentieren mit AI, nur 10% skalieren erfolgreich. Der Engpass ist Leadership, nicht Technologie.", "impact": "Kritisch", "coach_prompt": "Wie schließe ich den AI Readiness Gap in meinem Unternehmen?"},
    {"title": "Multimodale AI Revolution", "category": "Technologie", "summary": "GPT-5, Gemini 3, Claude 4: AI versteht Text, Bilder, Audio, Video gleichzeitig. Völlig neue Analyse- und Entscheidungsmöglichkeiten.", "impact": "Hoch", "coach_prompt": "Welche Use Cases für multimodale AI sind in meiner Branche am wirkungsvollsten?"},
    {"title": "AI Governance als Wettbewerbsvorteil", "category": "Compliance", "summary": "EU AI Act, DSGVO und AI-Ethik: Wer Governance früh aufbaut, gewinnt Vertrauen bei Kunden und Regulatoren.", "impact": "Mittel", "coach_prompt": "Erstelle mir einen AI Governance Quickstart-Plan für mein Unternehmen."},
    {"title": "Knowledge Worker Transformation", "category": "Arbeitswelt", "summary": "AI übernimmt 40-60% der Routine-Wissensarbeit. Leader müssen Teams auf kreative, strategische und menschliche Aufgaben umstellen.", "impact": "Hoch", "coach_prompt": "Welche Rollen in meinem Team werden sich durch AI am stärksten verändern?"},
    {"title": "AI-Native Startups vs. Incumbents", "category": "Wettbewerb", "summary": "AI-Native Startups brauchen 10x weniger Mitarbeiter für gleichen Output. Incumbents müssen ihre Kostenstruktur radikal überdenken.", "impact": "Kritisch", "coach_prompt": "Was wäre wenn ein AI-Native Startup morgen mein Kerngeschäft angreift?"},
    {"title": "Personal AI Coaches", "category": "Entwicklung", "summary": "AI-gestütztes 1:1 Coaching wird Standard für Führungskräfte. 24/7 verfügbar, personalisiert, datengetrieben.", "impact": "Mittel", "coach_prompt": "Wie kann ich AI-Coaching am effektivsten in meinen Führungsalltag integrieren?"},
]

# Daily AI Facts — hard-hitting daily insights
DAILY_AI_FACTS = [
    {"fact": "GitHub Copilot schreibt bereits 46% des Codes bei Unternehmen die es nutzen.", "source": "GitHub 2025", "category": "Produktivität"},
    {"fact": "McKinsey schätzt: AI könnte die globale Wirtschaftsleistung um $13 Billionen bis 2030 steigern.", "source": "McKinsey Global Institute", "category": "Wirtschaft"},
    {"fact": "72% der Fortune-500-CEOs nennen AI als ihre #1 strategische Priorität.", "source": "Fortune CEO Survey 2025", "category": "Leadership"},
    {"fact": "AI-native Startups erreichen $1M ARR im Durchschnitt 3x schneller als traditionelle SaaS.", "source": "a16z Research", "category": "Geschäftsmodell"},
    {"fact": "Die Kosten für AI-Training sind in 5 Jahren um 99% gefallen — exponentiell, nicht linear.", "source": "Stanford AI Index", "category": "Technologie"},
    {"fact": "Nur 8% der Unternehmen haben eine formale AI-Governance. Die restlichen 92% riskieren Regulierung.", "source": "Deloitte AI Survey", "category": "Compliance"},
    {"fact": "Führungskräfte die AI nutzen, treffen Entscheidungen 40% schneller bei gleicher oder besserer Qualität.", "source": "BCG Henderson Institute", "category": "Entscheidung"},
    {"fact": "Der globale AI-Markt wächst von $150 Mrd. (2024) auf $1.8 Bio. (2030) — 12x in 6 Jahren.", "source": "Grand View Research", "category": "Markt"},
    {"fact": "Teams mit AI-Coaching zeigen 25% höheres Engagement als ohne — messbar in 90 Tagen.", "source": "BetterUp Research", "category": "Coaching"},
    {"fact": "China investiert $15 Mrd. pro Jahr in AI-Forschung. Europa nur $3 Mrd. Der AI-Race ist real.", "source": "OECD AI Policy", "category": "Geopolitik"},
    {"fact": "70% der C-Level sagen: Ihr größtes AI-Problem ist nicht Technik, sondern Change Management.", "source": "Accenture Technology Vision", "category": "Change"},
    {"fact": "AI-generierte Inhalte machen bereits 30% des Internet-Contents aus — Tendenz exponentiell.", "source": "Europol Innovation Lab", "category": "Content"},
    {"fact": "Unternehmen mit AI-Skills im Vorstand performen 15% besser als ohne.", "source": "Harvard Business Review", "category": "Board"},
    {"fact": "Der durchschnittliche Wissensarbeiter spart 2.5 Stunden pro Tag durch AI-Tools.", "source": "Microsoft Work Trend Index", "category": "Produktivität"},
]


@router.get("/ki-news/daily")
async def get_daily_ki_news(request: Request):
    """Get daily AI business briefing for leaders."""
    await get_current_user(request)

    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    quote = AI_LEADER_QUOTES[day_of_year % len(AI_LEADER_QUOTES)]
    trend_idx = day_of_year % len(KI_TRENDS)
    trends = [KI_TRENDS[(trend_idx + i) % len(KI_TRENDS)] for i in range(3)]
    fact = DAILY_AI_FACTS[day_of_year % len(DAILY_AI_FACTS)]

    return {
        "date": datetime.now(timezone.utc).strftime("%d. %B %Y"),
        "quote_of_the_day": quote,
        "trends": trends,
        "fact_of_the_day": fact,
        "total_trends": len(KI_TRENDS),
    }
