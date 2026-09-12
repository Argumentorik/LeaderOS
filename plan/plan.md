# Plan (neu): Login-Video sparsam reparieren, saubere Enden, Thumbnails überall, Links & Navigation

Leitlinie: **Keine komplette Neuaufnahme.** Nur die Stellen neu rendern, die wirklich fehlerhaft sind; alles andere aus vorhandenem Material verbessern (kostenlos).

---

## 1. Login-Video (76 s, 3 Kapitel) – gezielte Reparatur

Befund: Kapitel 1 (Loft, Walk-in) ist gut und bleibt **unangetastet**. Zwei Fehler liegen in Kapitel 2 und 3:

| Fehler | Wo | Maßnahme | Kosten |
|---|---|---|---|
| „im echten Leben“ wird als „I-M“ buchstabiert | Kapitel 2 (Studio) – Satz „so unbequem wie im echten Leben“ | Satz umformulieren zu „so unbequem wie das echte Leben“ (kein „im“ mehr, das die Stimme als Abkürzung liest). Ton für Kapitel 2 neu erzeugen, Kapitel-2-Take neu rendern (~22 s) | ca. 6–8 $ |
| Lip-Sync wird zum Schluss schlechter | Kapitel 3 (Studio nah, ~15 s) | Kapitel-3-Take neu rendern, kurz gehalten (unter 20 s), ohne Verlängerung durch Standbild/Loop | ca. 5–7 $ |
| Ende abgehackt/abrupt | Übergang Kapitel 3 → Abschiedskarte | Ausklang beim Zusammensetzen: 0,5 s Ruhe nach dem letzten Wort, 0,8 s Bild- und Ton-Abblende, dann Karte | 0 $ |

- Zusatzregel gegen Lip-Sync-Drift: Kein Take wird durch Wiederholen oder Einfrieren von Bildern verlängert, um Ton zu füllen. Ton bestimmt die Länge; Video endet mit dem Ton.
- Musikbett, Abschiedskarte mit QR-Code, Untertitel und Kapitel 1 bleiben exakt wie freigegeben.
- Ablauf: Erst Kapitel 2 + 3 als Vorschau rendern, Sichtprüfung der letzten 10 Sekunden, dann zusammensetzen und freigeben. Das alte Video bleibt online, bis das neue freigegeben ist.
- **Gesamtkosten: ca. 12–15 $.** Günstigere Variante (nur Kapitel 3, ca. 5–7 $) ließe „I-M“ bestehen – daher nicht empfohlen.

## 2. Saubere Enden bei allen anderen Clips – ohne Neuaufnahme
- „So sprichst du mit der KI“ (Clip 2) und alle weiteren Erststart-, Missions- und Feature-Clips bekommen denselben Ausklang (0,5 s Ruhe, 0,8 s Blende) – zusammengesetzt aus den vorhandenen Takes, **0 $**.
- „Willkommen bei Leader-OS“ wird **nicht** neu aufgenommen (der Lip-Sync-Befund betraf das Login-Video).
- Wo ein Roh-Take nicht mehr vorliegt, bleibt der Clip unverändert (kein Render „aus Prinzip“); diese Fälle werden gelistet.

## 3. Thumbnails überall
- Jeder Clip bekommt ein echtes Vorschaubild aus dem fertigen Video (Standbild mit Wlads Gesicht, nicht die erste schwarze/Blenden-Sekunde). Erzeugung aus der vorhandenen Datei, **0 $**, einmalig gespeichert.
- Sichtbar an allen Stellen: Video-Guide-Kacheln, **Missions-Briefings in der 30-Tage-Challenge**, Dashboard-Video-Reihe, Login-Video (Vorschaubild vor dem Abspielen), Kurse-Bereich, Admin-Guide-Studio.
- Fehlt ein Bild, wird es beim ersten Aufruf automatisch aus dem Video gezogen – nie mehr eine leere/graue Kachel oder ein Platzhalter.
- Vorschaubilder werden wie die Videos mit einer Versionskennung ausgeliefert, damit nach einem Neu-Render nie ein altes Bild aus dem Browser-Cache erscheint.

## 4. Navigation
- „Video-Guide“ rückt in der linken Navigation direkt unter „Dashboard“ (Position 2), Desktop und mobil.

## 5. Links direkt unter den Videos (Video-Guide)
Unter dem Player eine sichtbare Zeile „Nächster Schritt“ mit einem Button – auch während das Video läuft:

| Clip | Button | Ziel |
|---|---|---|
| Willkommen bei Leader-OS | „Leader-Diagnose starten“ | Leader-Diagnose |
| Kontext ist alles | „Kontext zu dir & deiner Rolle eintragen“ | Profil, Abschnitt Kontext/Über mich (Rolle, Team, Baustellen) – scrollt direkt dorthin |
| Missions-Briefings Tag 1–7 | „Zur 30-Tage-Challenge“ | 30-Tage-Challenge-Werkzeug |

## 6. 30-Tage-Challenge ↔ Video-Guide
- Video-Guide: Sektion heißt „30-Tage-Challenge · Briefings Tag 1–7“; die Überschrift ist klickbar und führt zum Werkzeug.
- Werkzeug 30-Tage-Challenge: Das Tages-Briefing (mit Thumbnail) steht direkt unter der Tages-Aufgabe, mit Link „Alle Briefings im Video-Guide“.

## 7. Audio-Mode
- Der Kernfehler (Antwort bis 50 s → Abbruch) ist bereits behoben; wirkt auf leaderos.de nach dem nächsten Deploy (Stimme < 1 s, Gesprächsschritt 3–5 s).
- Zusätzlich: Sprechpause 5 s → 2 s (Tipp auf den Orb sendet sofort); Zustände „Ich höre zu“ → „WladBot denkt nach“ → „WladBot spricht“ sichtbar; Fehlerbild „ausgeloggt/eingeloggt“ wird auf leaderos.de mit Mikrofon nachgestellt und – falls noch vorhanden – behoben.

---

## Annahmen
- Login-Video: Kapitel 1 bleibt; Kapitel 2 + 3 werden neu gerendert (ca. 12–15 $). Sollen es nur ca. 5–7 $ sein, bitte „nur Kapitel 3“ sagen – dann bleibt „I-M“.
- Skripte bleiben unverändert bis auf den einen umformulierten Satz in Kapitel 2.
- Alle Renderkosten werden vor dem Start im Guide Studio angezeigt; nichts rendert ohne Klick auf „Rendern“.
- Änderungen gelten für Deutsch und Englisch gleich.
