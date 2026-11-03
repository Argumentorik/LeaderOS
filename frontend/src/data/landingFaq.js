/**
 * landingFaq · die Fragen der Startseite (FAQSection) als Daten.
 *
 * Antwort-zuerst geschrieben: der erste Satz beantwortet die Frage
 * vollständig, der Rest begründet. Genau dieser Absatz wird von Google
 * (Featured Snippet) und Antwort-Maschinen übernommen. Alle Zahlen aus
 * docs/gtm/WLAD_CANON.md bzw. llms.txt (Preise, Kurs-Katalog); nichts,
 * was nicht belegbar ist (keine „noch nie zurückgefordert“-Aussagen).
 *
 * Pure ES-Modul ohne Imports, damit ein Prerender-Skript es direkt in
 * Node laden kann. `links` sind interne Verweise unter der Antwort —
 * Crawl-Pfade zu den statischen Antwortseiten.
 */
export const LANDING_FAQ_KICKER = 'Häufige Fragen · Was du wissen musst';
export const LANDING_FAQ_TITLE = 'Häufige Fragen zu LeaderOS';

export const FAQS = [
  {
    q: 'Was ist LeaderOS?',
    a:
      'LeaderOS ist ein Trainingssystem für Führungskräfte: zehn Kurse mit der Methodik von Wlad Jachtchenko, der KI-Coach WladBot, Simulationen mit einem Gegenüber, das zurückredet, und tägliche 15-Minuten-Drills an deinem echten Fall. Führung wird nicht gelernt, sie wird trainiert. Deshalb heißt es Operating System, nicht Kurs.',
    links: [['/kurse', 'Alle Kurse und der Zugang'], ['/fragen', 'Fragen & Frameworks']],
  },
  {
    q: 'Für wen ist LeaderOS gedacht?',
    a:
      'Für Teamleads, die zum ersten Mal Menschen führen, für erfahrene Führungskräfte, die ihre Reflexe auffrischen wollen, und für alle, die wissen, was sie tun sollten, und es nicht tun. Nicht gedacht ist es für alle, die ein Zertifikat ohne Training wollen oder 15 Minuten am Tag nicht aufbringen.',
  },
  {
    q: 'Welche Kurse sind enthalten?',
    a:
      'Sechs Grundlagen-Kurse in jedem Account: Rhetorik-Grundlagen, Schwierige Gespräche meistern, Delegation wie ein Profi, Feedback-Formate, Storytelling im Boardroom und Meeting-Rhetorik. Vier Master-Programme im OS-Jahr: KI-First Leadership, Change Management Master, Executive Presence und Boardroom-Strategie. Dazu elf Framework-Drills, etwa die Feedbackformel, die Harvard-Verhandlungsmethode und die 10 Stufen des Zuhörens.',
    links: [['/kurse', 'Kurs-Katalog ansehen']],
  },
  {
    q: 'Wie hilft mir WladBot in einer echten Situation?',
    a:
      'WladBot gibt dir vor dem Gespräch den nächsten Satz, nicht zehn Tipps. Beispiel: Dienstag, 22:47 Uhr, morgen früh zum dritten Mal dasselbe Feedback an einen Senior-Mitarbeiter. Du beschreibst die Situation, er antwortet mit der Feedbackformel (Beobachtung, Wirkung, Wunsch), abgestimmt auf deine bisherigen Drills. Du gehst mit einem Skript ins Gespräch, nicht mit Bauchschmerzen.',
    links: [['/fragen#f04', 'WladBot vs. ChatGPT']],
  },
  {
    q: 'Wie unterscheidet sich das von ChatGPT oder einem Coaching?',
    a:
      'ChatGPT kennt das halbe Internet, aber nicht dich und nicht die Methodik. Ein 1:1-Coach kennt dich, ist aber nicht um 22:47 Uhr erreichbar. WladBot ist beides: trainiert auf 2 212 authentische Wlad-Chunks aus Büchern, Podcasts und Trainings, mit einer Kontext-Schicht, die deine Challenge-Historie und deine letzten Drills kennt.',
  },
  {
    q: 'Wie viel Zeit brauche ich pro Tag?',
    a:
      '15 Minuten am Tag: eine kurze Lektion, ein Drill an deinem Fall, eine Frage an WladBot oder eine Simulation, dann die Auswertung. Die 30-Tage-Challenge ist so gebaut, dass sie in jeden Arbeitstag passt, statt zwei Tage im Jahr aus dem Kalender zu schneiden.',
  },
  {
    q: 'Was bekomme ich am Ende der 30 Tage?',
    a:
      'Reflexe statt Notizen: dreißig Drills an deinen echten Fällen, elf Frameworks, die du in jedem 1:1, jeder Verhandlung und jeder Rede abrufen kannst, einen WladBot, der deine Historie kennt, und ein persönliches Zertifikat mit deiner Startnummer für LinkedIn.',
  },
  {
    q: 'Was kostet LeaderOS?',
    a:
      'Der Einstieg ist 14 Tage kostenlos, ohne Karte, jederzeit kündbar, mit allen sechs Grundlagen-Kursen, WladBot und den Drills. Danach die 30-Tage-Challenge mit 12 Monaten Mitgliedschaft für 997 € einmalig oder das OS-Jahr Leadership Plus Pro mit monatlichen Live-Sessions für 4 797 € einmalig (oder drei Raten). Kein Abo, keine automatische Verlängerung. Die Diagnose auf leadercheck.de bleibt kostenlos.',
    links: [['/fragen#f08', 'Preise im Detail']],
  },
  {
    q: 'Was passiert nach den 30 Tagen?',
    a:
      'Die Mitgliedschaft läuft 12 Monate weiter: alle Frameworks, WladBot rund um die Uhr und die Kurs-Bibliothek bleiben offen. Die Challenge ist das Onboarding, das OS dein Werkzeug für das Jahr. Wer die volle Begleitung mit monatlichen Live-Sessions und Strategie-Call will, wechselt in Leadership Plus Pro.',
  },
  {
    q: 'Warum sollte ich für Leader-Check und LeaderOS dieselbe E-Mail nutzen?',
    a:
      'Weil die Diagnose auf leadercheck.de und die App auf leaderos.de dieselbe Identität über die E-Mail-Adresse erkennen. Deine Diagnose-Scores fließen in deinen Challenge-Plan ein, WladBot kennt ab Tag 1 deine Schwachstellen. Eine andere E-Mail bedeutet zwei Profile und keine Personalisierung.',
  },
  {
    q: 'Wie sicher sind meine Daten?',
    a:
      'DSGVO-konform, Datenbank und Analytics in der EU. Deine Chats werden verschlüsselt übertragen und gehören dir: kein Training auf deinen Daten, kein Verkauf an Dritte. Export und Löschung deines Kontos mit allen Daten sind jederzeit möglich.',
    links: [['/datenschutz', 'Datenschutzerklärung']],
  },
  {
    q: 'Was, wenn es nichts für mich ist?',
    a:
      'In den 14 Test-Tagen kündigst du mit einem Klick, ohne Karte und ohne Begründung. Wechselst du danach in die Challenge und es passt nicht, gilt zusätzlich die 14-Tage-Geld-zurück-Garantie, ohne Begründungspflicht.',
  },
  {
    q: 'Gibt es ein kostenloses Webinar?',
    a:
      'Ja. Am Donnerstag, 26. November 2026, 10:00 bis 11:30 Uhr, zeigt Wlad Jachtchenko live den Charisma-Code, das Leadership Operating System und einen echten Führungsfall, mit Q&A. Kostenlos, ohne Karte, bewusst ohne Aufzeichnung.',
    links: [['/webinar', 'Platz im Live-Webinar sichern']],
  },
];
