# Ein Satz Wörter (Iter 186)

Dieselben Begriffe für dieselbe Sache — in der App, in Mails und auf den öffentlichen Seiten.
Wer Text schreibt, nimmt die linke Spalte. Die rechte Spalte ist verbrannt.

| So heißt es | Nicht mehr |
|---|---|
| 30-Tage-Programm (auch: die 30 Tage) | Challenge, 30-Day Challenge, Bootcamp |
| Aufgabe des Tages | Mission, Daily Task, Tages-Challenge |
| Erledigt ist, wenn … | Abschlusskriterium, Definition of Done |
| begonnen | in progress, angefangen (uneinheitlich) |
| Leadership LAB | Weiterbildung, Kurs-Paket, Membership |
| Interesse eintragen | Warteliste, Lead-Formular |
| Anmeldung zum Start | Onboarding, Intake |
| Startgruppe | Kohorte, Batch |
| Live-Call | Zoom-Termin, Webinar |
| Kurse · Folge | Module, Lektion, Episode (deutschsprachig: Folge) |
| WladBot | der Coach, die KI, der Bot |
| Video-Erlebnis / Voll freigeschaltet | GODMODE |
| Gesprächs-Training | Simulationen, Simulations |
| Leitfäden | Playbooks |
| Werkzeuge | Tools, Workflows |
| Video-Analyse | Video-Mission, Mission |
| Kostenloser Zugang (nur im Konto) | FREE, Free-Tier-Badge am Namen |
| KI-Guthaben · Credits | Tokens, Kontingent |
| Leadership-Programm (öffentliche Seite) | Coaching-Seite |
| Mein Fortschritt | My Path, Journey |
| Check-in | Daily Check-in (englisch), Tagebuch |

## Farblogik (Entscheidung 10a)
- **Neongrün `#BFFF00`** — und nur das — heißt „hier geht's weiter" (Hauptknopf, Akzent, aktiver Menüpunkt).
  Im hellen Modus die dunklere Variante aus `lib/levelColors.js` (`#5A7A00`), damit Text lesbar bleibt.
- **Erledigt**: Smaragd (`emerald-600` / `emerald-400`).
- **Offen / neutral**: `muted-foreground`.
- **Gesperrt**: Grau + Schloss-Symbol, kein Farbakzent.
- **Warnung / Guthaben leer**: Amber (`amber-600` / `amber-400`).
- Bunte Wochen- und Level-Farben (blau/gelb/rot) entfallen — Level tragen den Marken-Akzent.

## Symbole
- Eine Familie: `lucide-react`. Keine zweite Icon-Bibliothek, keine Emoji als Funktionssymbole.
- Strichstärke 2 (Standard), 2.5–2.8 nur für Abzeichen. Größen: 13–16 px in Listen/Zeilen, 18–24 px in Karten-Köpfen.

## Noch offen
- Emoji-Reste in Kurs-Kategorien (`course_content.py`, Feld `emoji`) sind dekorativ und stehen nicht für eine Funktion — bei der nächsten Kurs-Überarbeitung ersetzen.
