/**
 * Wlad-kuratierte Prep-Templates für den ArgumentationPrepModal.
 * Jedes Template füllt Kontext + Argumente + antizipierte Einwände vor —
 * Coaching-Focus bleibt leer, damit der User seine eigene Frage ergänzt.
 *
 * Kein LLM-Call — reine Client-Daten, sofortige Vorbelegung.
 */
import { Handshake, LogOut, Presentation, Users2, Target } from 'lucide-react';

export const PREP_TEMPLATES = [
  {
    id: 'salary_negotiation',
    icon: Handshake,
    label: 'Gehaltsverhandlung',
    hint: 'Für die nächste Runde — nicht bitten, verhandeln.',
    accent: '#BFFF00',
    data: {
      background: 'Ich bin seit 2 Jahren im Unternehmen, habe zuletzt zwei größere Projekte erfolgreich geliefert und einen neuen Verantwortungsbereich übernommen. Mein aktuelles Gehalt liegt unter Marktdurchschnitt für vergleichbare Rollen.',
      goal: '+12% Gehalt zum nächsten Quartal, plus ein klar definierter Bonus-Plan.',
      relationship: 'Direkter Vorgesetzter, Zahlen-getrieben, kurzer Ton, hat mich schon 2× vertröstet.',
      main_points:
        '1. Marktbenchmark: Kienbaum/Stepstone-Daten belegen 15% Gap zur Rolle · ' +
        '2. Impact: Projekt A brachte 380k Zusatzumsatz, Projekt B senkte Kosten um 90k p.a. · ' +
        '3. Verantwortung erweitert: neues Team + Budget seit Q2 · ' +
        '4. Retention-Signal: aktive Angebote vom Wettbewerb ohne aktive Suche.',
      evidence: 'Kienbaum Gehaltsreport 2026 · interne Projekt-Metrics Q1-Q3 · schriftliches Angebot von Wettbewerber (nur als Anker).',
      prioritised: 'Zuerst Impact-Zahlen (er liebt Zahlen), dann Marktbenchmark (unangreifbar), zuletzt Verantwortungserweiterung (fairer Anspruch).',
      expected_objections:
        '1. "Budget ist eingefroren" · ' +
        '2. "Andere warten auch" · ' +
        '3. "Aktuell schlechter Zeitpunkt" · ' +
        '4. "Wir haben dir doch letztens den Titel gegeben".',
      counterarguments:
        'Budget-Freeze gilt nicht für Retention-cases, ROI in unter 6 Monaten — ' +
        'Vergleich mit anderen ist irrelevant für individuelle Marktrate — ' +
        'Timing: je später, desto mehr Fluktuationsrisiko — ' +
        'Titel ohne Gehalt = Symbol ohne Substanz.',
      hidden_interests: 'Er will nicht als "zu großzügig" beim CFO/Vorstand gelten. Frame ihn als klugen Talent-Investor, nicht als "gibt nach". Er will Zahlen, mit denen er nach oben präsentieren kann.',
      coaching_focus: 'Framing so, dass mein Chef die Erhöhung nach oben verkaufen kann.',
    },
  },
  {
    id: 'termination',
    icon: LogOut,
    label: 'Kündigungsgespräch',
    hint: 'Empathisch, klar, ohne Drama — professionell trennen.',
    accent: '#FF6B6B',
    data: {
      background: 'Mitarbeiter im Team seit 3 Jahren, letzte 2 Quartale performt trotz mehrfachem Feedback und PIP unter Erwartung. Der Impact aufs Team wird spürbar, andere kompensieren zunehmend.',
      goal: 'Klare, faire Trennung — der Mitarbeiter geht mit Würde, das Team versteht die Entscheidung.',
      relationship: 'Direktes Team-Mitglied, gute persönliche Beziehung, kämpft privat mit Themen. Emotional aufgeladen.',
      main_points:
        '1. Wiederholt vereinbarte Ziele nicht erreicht (dokumentiert Q2 + Q3) · ' +
        '2. PIP durchlaufen, kein Improvement · ' +
        '3. Impact aufs Team: 2 Kollegen kompensieren, Frustration steigt · ' +
        '4. Fairness gegenüber allen: gleiches Standard-Level nötig.',
      evidence: 'PIP-Protokoll, Ziel-Reviews Q2 + Q3, dokumentierte 1:1s, Team-Klimadaten.',
      prioritised: 'Zuerst Menschlichkeit anerkennen · dann Fakten sachlich · dann klare Trennung — keine "vielleicht"-Signale.',
      expected_objections:
        '1. "Ich bin gerade in einer schwierigen Phase" · ' +
        '2. "Gib mir noch eine Chance" · ' +
        '3. "Das ist unfair" · ' +
        '4. Emotionaler Ausbruch.',
      counterarguments:
        'Empathie zeigen, aber Entscheidung ist final. PIP war die letzte Chance und wurde nicht genutzt. ' +
        'Fair für IHN heißt Klarheit — nicht falsche Hoffnung. ' +
        'Bei Ausbruch: Pause anbieten, aber Kernbotschaft bleibt.',
      hidden_interests: 'Er will Würde bewahren und praktische Sicherheit (Abfindung, Referenz, Kündigungsfrist). Frame die Lösung als Chance, nicht als Scheitern.',
      coaching_focus: 'Wortwahl für den entscheidenden Moment — wie beginne ich, ohne herumzueiern?',
    },
  },
  {
    id: 'board_presentation',
    icon: Presentation,
    label: 'Board-Präsentation',
    hint: 'Vorstand überzeugen — in 20 Minuten Buy-In holen.',
    accent: '#7B3FE4',
    data: {
      background: 'Wir wollen 800k in ein neues Produkt-Team investieren. Der Vorstand hat 20 Min Slot gegeben. Vorherige zwei Anläufe wurden vertagt ("nicht überzeugend").',
      goal: 'Verbindliches Go + Budget-Freigabe in dieser Sitzung — kein weiteres "denken wir drüber nach".',
      relationship: 'CEO (Vision-getrieben), CFO (Zahlen), COO (skeptisch). Mixed Board — jeder tickt anders.',
      main_points:
        '1. Marktchance: TAM 45M€, aktuell 0% Marktanteil, 3 Jahre Fenster · ' +
        '2. Wettbewerber-Move: Konkurrent X hat vor 2 Monaten gestartet · ' +
        '3. Team: 4 Senior-Kandidaten identifiziert, bereit einzusteigen · ' +
        '4. ROI-Case: Break-even Monat 14, IRR 47%.',
      evidence: 'McKinsey-Report zum Markt · Screenshot Wettbewerber-Launch · CVs der Kandidaten · Finanzmodell mit Sensitivitäten.',
      prioritised: 'Erst das Wettbewerber-Momentum (schafft Dringlichkeit), dann Zahlen (holt CFO), dann Team-Plan (macht es real).',
      expected_objections:
        '1. "Warum jetzt und nicht in 6 Monaten?" · ' +
        '2. "Können wir das nicht mit dem bestehenden Team stemmen?" · ' +
        '3. "800k ist viel — was ist die Down-side?" · ' +
        '4. "Habt ihr das validiert?".',
      counterarguments:
        'Fenster schließt: jeden Monat Delay = 8% Marktanteil weg. ' +
        'Bestehendes Team ist maxed — Split würde Kern gefährden. ' +
        'Down-side: 800k = 2% Jahresbudget, upside 10× drin. ' +
        'Validiert durch 12 Kunden-Interviews + Letter of Intent von 3 Prospects.',
      hidden_interests: 'CEO will Wachstums-Narrative fürs nächste Investoren-Update. CFO will nicht als Bremser gelten aber auch nicht als Risikojäger. COO will keine Kapazitäts-Kannibalisierung.',
      coaching_focus: 'Der erste Satz — wie fange ich an, dass alle drei Board-Persönlichkeiten sofort andocken?',
    },
  },
  {
    id: 'customer_escalation',
    icon: Target,
    label: 'Kunden-Eskalation',
    hint: 'Wichtigen Kunden zurückgewinnen ohne Preisrabatt.',
    accent: '#FF9500',
    data: {
      background: 'Key-Account (12% Jahresumsatz) droht mit Vertragskündigung wegen SLA-Verletzungen im letzten Quartal. Escalation-Meeting mit dem CIO des Kunden ist morgen.',
      goal: 'Vertrag retten — ohne Rabatt zu geben. Neue Vereinbarung mit Trust-Rebuild.',
      relationship: 'CIO des Kunden, 6 Jahre Historie, wurde bisher immer geschätzt. Aktuell verärgert, hat schriftlich eskaliert.',
      main_points:
        '1. Anerkennung: SLA-Bruch war real, wir übernehmen Verantwortung · ' +
        '2. Root-Cause: identifiziert und strukturell gefixt (Prozess-Doku bereit) · ' +
        '3. Kompensation ohne Preisrabatt: 3 Monate Premium-Support gratis + Executive-Sponsor · ' +
        '4. Erweiterung: neuer Feature-Access den er länger anfragt.',
      evidence: 'Root-Cause Analyse-Dokument · neuer Monitoring-Plan · Referenz-Cases wo wir SLAs wieder eingehalten haben.',
      prioritised: 'Zuerst Verantwortung übernehmen (menschlich zuhören) · dann Fix zeigen (kompetent) · dann Zukunft anbieten (partnerschaftlich).',
      expected_objections:
        '1. "Woher soll ich wissen, dass es diesmal anders wird?" · ' +
        '2. "Wir haben schon Angebote vom Wettbewerber" · ' +
        '3. "Wir brauchen 20% Rabatt als Ausgleich" · ' +
        '4. "Ich habe intern schon die Reißleine angekündigt".',
      counterarguments:
        'Trust-Rebuild durch objektives Monitoring das ER selbst sieht (Dashboard-Access). ' +
        'Wettbewerber-Angebote: Switch-Cost + 6-Monats-Downtime > jede Preisdifferenz. ' +
        'Kein Rabatt weil das Signal falsch ist — stattdessen mehr Value (Premium-Support hat Listenwert 60k). ' +
        'Interne Positionierung: gib ihm eine "Story" die er drinnen erzählen kann.',
      hidden_interests: 'Er will intern nicht als der dastehen der einen Fail zugelassen hat. Gib ihm eine gemeinsame Story: "Wir haben strukturell was verändert" — dann kann er das oben verkaufen.',
      coaching_focus: 'Wie zeige ich Reue ohne kriecherisch zu wirken?',
    },
  },
  {
    id: 'team_alignment',
    icon: Users2,
    label: 'Team auf Kurs bringen',
    hint: 'Skeptisches Team hinter eine unbequeme Entscheidung holen.',
    accent: '#00CC77',
    data: {
      background: 'Wir müssen ein internes Projekt einstellen, in das das Team viel Herzblut gesteckt hat. Die strategische Entscheidung ist gefallen, jetzt muss das Team mit — nicht als Statisten, sondern committed.',
      goal: 'Team versteht das Warum, akzeptiert die Entscheidung und blickt konstruktiv nach vorn — kein passiver Widerstand.',
      relationship: '8 Personen, 3 Senior + 5 Mid, teils schon lange dabei. 2 werden emotional reagieren, 1 ist Meinungsführer.',
      main_points:
        '1. Fakten: warum das Projekt strategisch nicht mehr passt (Markt/Fokus) · ' +
        '2. Respect: Anerkennung der geleisteten Arbeit — mit konkreten Beispielen · ' +
        '3. Was bleibt: Learnings, IP, Prozesse werden übertragen · ' +
        '4. Vorwärts: neuer Fokus + wie jeder darin eine Rolle findet.',
      evidence: 'Strategie-Deck vom Board · Kunden-Feedback-Daten · konkrete Learnings-Liste zum Weitergeben.',
      prioritised: 'Zuerst das Warum (Kontext) · dann Wertschätzung (Emotion) · dann Zukunft (Momentum) · Fragen als letztes NICHT als erstes.',
      expected_objections:
        '1. "Warum jetzt, nachdem wir so viel investiert haben?" · ' +
        '2. "War das nicht klar von Anfang an?" · ' +
        '3. "Was heißt das für meinen Job?" · ' +
        '4. Stiller Widerstand / Zynismus.',
      counterarguments:
        'Sunk-Cost darf nicht die nächste Entscheidung diktieren — das Investment war richtig für damalige Info-Lage. ' +
        'Retrospektive ist zu 100% berechtigt — Kommittment wir machen eine ehrliche Post-Mortem in 2 Wochen. ' +
        'Job-Sicherheit direkt und namentlich adressieren, nicht ausweichen. ' +
        'Stiller Widerstand: nach dem Meeting persönliche 1:1s planen — nicht in der Gruppe erzwingen.',
      hidden_interests: 'Das Team will wissen: bin ich noch geschätzt? War meine Arbeit wertvoll? Habe ich noch eine Zukunft? Wenn du diese 3 Fragen implizit beantwortest, hast du sie.',
      coaching_focus: 'Wie hole ich den Meinungsführer emotional ab, ohne dass es manipulativ wirkt?',
    },
  },
];

export default PREP_TEMPLATES;
