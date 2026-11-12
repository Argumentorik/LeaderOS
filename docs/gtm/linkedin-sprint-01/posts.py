"""Zweiter LinkedIn-Post pro Tag, 13.11. bis 25.11.2026, jeweils 17:15 Uhr.
   Erzeugt POSTS.md (lesbar) und plan.json (für Metricool). Aufruf: python3 -I posts.py <commit-sha>
   Regeln: Produktaussagen nur, was die 14 Tage enthalten. Zahlen nur aus dem verifizierten Set.
   WLAD AI spricht in der ersten Person. Kein Webinar, keine Platzzahl."""
import json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__)); G = os.path.dirname(H)
SHA = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
RAW = f'https://raw.githubusercontent.com/Argumentorik/LeaderOS/{SHA}/docs/gtm/'
TAGS = '#Leadership #Führung #KI #LeaderOS'
link = lambda k: f'https://leaderos.de/signup?trial=14&utm_source=linkedin&utm_medium=social&utm_campaign=wlad-ai&utm_content={k.lower()}'
TEST = lambda k: f'14 Tage kostenlos, ohne Karte: {link(k)}'
KEY = 'Ich bin WLAD AI. Kommentiere WLAD AI, dann schicke ich dir den Link zum Test. 14 Tage kostenlos, ohne Karte.'

T = {}
T['F01'] = ('ads-fokus-01/AD-F01-4x5-a.jpg', None, f'''Das schwierigste Gespräch der Woche übst du meistens gar nicht. Du gehst rein und hoffst.

In LeaderOS spielst du es vorher durch.

So läuft eine Simulation:
1 Du beschreibst dein Gegenüber in drei Sätzen.
2 Ich übernehme die Rolle. Mit den Einwänden, die du fürchtest.
3 Danach schauen wir, wo dein Argument gewackelt hat.

Am nächsten Morgen hast du die Sätze schon einmal gesagt.

LeaderOS ist die Coaching-App für Führungskräfte: Kurse, Simulationen, tägliche Drills und ich, WLAD AI, per Text und Stimme. Alles mit Wlads Methodik.

{TEST('F01')}''')
T['F02'] = ('ads-fokus-01/AD-F02-4x5-a.jpg', None, f'''23:10 Uhr. Das Gespräch von heute Nachmittag läuft noch im Kopf. Dein Coach schläft. Dein Mentor auch.

Ich nicht.

Ich bin WLAD AI, der KI-Coach in LeaderOS. Du kannst mir schreiben oder mit mir sprechen.

Was du dann von mir bekommst:
1 Eine Rückfrage, bevor ich antworte. Ich will deinen Fall verstehen.
2 Einen Vorschlag mit Wlads Methodik. Keine zwölf allgemeinen Tipps.
3 Auf Wunsch die Probe: Ich spiele dein Gegenüber.

Coaching war bisher ein Termin. Jetzt ist es da, wenn du es brauchst.

{TEST('F02')}''')
T['F03'] = ('ads-fokus-01/AD-F03-4x5-a.jpg', None, f'''Führung lernt man nicht an einem Tag. Man lernt sie wie eine Sprache: jeden Tag ein bisschen.

Deshalb gibt es in LeaderOS den täglichen Drill.

15 Minuten. Ein Werkzeug. Zum Beispiel die Feedbackformel: Beobachtung, Wirkung, Wunsch.

Was in der App noch drin ist:
1 Kurse mit den Grundlagen von Wlad.
2 Simulationen für schwierige Gespräche.
3 Elf Frameworks, von SEXIER bis zu den fünf Rollen.
4 WLAD AI als Coach, per Text und Stimme.

Was du einmal hörst, verblasst. Was du jeden Tag übst, bleibt.

{TEST('F03')}''')
T['F04'] = ('ads-fokus-01/AD-F04-4x5-a.jpg', None, f'''Was bekommst du, wenn du Wlads Methodik in eine App packst?

Wlad ist dreifacher SPIEGEL-Bestseller-Autor und coacht seit 2007. 400.000+ Klienten in 20+ Ländern.

LeaderOS macht daraus ein Training für jeden Tag:

1 Kurse. Die Grundlagen für den Führungsalltag.
2 WLAD AI. Das bin ich, dein Coach per Text und Stimme.
3 Simulationen. Du probst das Gespräch, bevor es zählt.
4 Tägliche Drills. 15 Minuten, ein Werkzeug.
5 Elf Frameworks. SEXIER, Feedbackformel, fünf Rollen und mehr.

Für wen: für alle, die Menschen führen und dabei besser argumentieren, zuhören und Kritik geben wollen.

{TEST('F04')}''')
T['K01'] = ('ads-kino-01/AD-K01-4x5-a.jpg', None, f'''Niemand geht ohne Probe auf eine Bühne. Aber fast jeder geht ohne Probe ins Gehaltsgespräch, ins Kritikgespräch, in die Verhandlung.

Warum eigentlich?

Weil bisher niemand da war, der die Gegenseite spielt.

Jetzt schon. In LeaderOS übernehme ich dein Gegenüber: deinen Chef, deine Mitarbeiterin, deinen Kunden. Ich bringe Einwände. Du antwortest. Danach schauen wir, was getragen hat.

Proben statt hoffen.

{TEST('K01')}''')
T['K04'] = ('ads-kino-01/AD-K04-4x5-a.jpg', None, f'''15 Tage lang habe ich mich hier gemeldet. Heute ist der letzte.

Was du in dieser Zeit von mir gesehen hast:

Ein Argument hat sechs Teile.
Zuhören hat zehn Stufen.
Eine Rückfrage schlägt jede Rechtfertigung.
Feedback ist Beobachtung, Wirkung, Wunsch.

Das alles ist Wlads Methodik. Der Unterschied: Bei mir übst du sie. An deinem Fall, jeden Tag, per Text und Stimme.

Ich bin WLAD AI. Du findest mich in LeaderOS, zusammen mit den Kursen, den Simulationen und den täglichen Drills.

{TEST('K04')}''')
T['X04'] = ('spickzettel-01/P04-02.jpg', None, f'''„Du bist immer unzuverlässig.“

Ein Satz, drei Fehler.

1 „Du bist“: Du bewertest die Person, nicht die Sache.
2 „Immer“: Eine Verallgemeinerung. Dein Gegenüber sucht sofort das Gegenbeispiel.
3 „Unzuverlässig“: Eine Wertung. Keine Beobachtung.

Besser mit der Feedbackformel:
Beobachtung: „Der Bericht kam zweimal nach der Frist.“
Wirkung: „Ich konnte ihn nicht mehr prüfen.“
Wunsch: „Ich brauche ihn künftig am Vortag.“

Hart in der Sache, weich zur Person.

Welchen Satz würdest du gern einmal scannen lassen? Schreib ihn in die Kommentare.

{KEY}''')
T['X01'] = ('spickzettel-01/P01-02.jpg', None, f'''„Wir sollten das Tool einführen, weil es Zeit spart.“

Klingt nach einem Argument. Hat 2 von 6 Teilen.

Nach dem SEXIER-Modell fehlen:
Das Beispiel. Wo genau spart es Zeit?
Die Auswirkung. Was passiert mit der gesparten Zeit?
Die Erklärung. Warum zählt das für dein Gegenüber?
Die Widerlegung. Welcher Einwand kommt, und was sagst du dann?

Die meisten Vorschläge scheitern nicht an der Idee. Sie scheitern an Teil 3 bis 6.

Genau das mache ich in LeaderOS mit deinem Argument: Ich zeige dir, welcher Teil fehlt.

Schreib dein Argument in einem Satz in die Kommentare. Wie viele Teile hat es?

{KEY}''')
T['X02'] = ('spickzettel-01/P02-02.jpg', None, f'''„Dafür ist kein Budget da.“

Die meisten hören: Nein. Ich höre drei offene Stellen.

„Dafür“: Für dieses Vorhaben nicht. Für ein anderes vielleicht.
„Kein Budget“: Oder keine Priorität.
„Da“: Jetzt nicht. Später vielleicht.

Jede Stelle ist eine Rückfrage:
Wofür wäre Budget da?
Was müsste es lösen, damit es Priorität bekommt?
Was müsste passieren, damit es im nächsten Quartal geht?

Hinter einem Nein steckt fast immer ein Interesse. Wer nachfragt, findet es.

In LeaderOS spiele ich deinen Chef, bis dir die Rückfrage von allein einfällt.

{KEY}''')
md = open(os.path.join(G, 'sammlung-01', 'CAPTIONS.md'), encoding='utf-8').read()
for m in re.finditer(r'## (M\d\d) ·[^\n]*\n\nLinkedIn-Titel: ([^\n]+)\n\n```text\n(.*?)\n```', md, re.S):
    T[m.group(1)] = (f'sammlung-01/{m.group(1)}.pdf', m.group(2).strip(), m.group(3))

PLAN = [('13', 'F01'), ('14', 'M01'), ('15', 'X04'), ('16', 'F02'), ('17', 'M02'), ('18', 'F04'), ('19', 'X01'), ('20', 'M03'), ('21', 'K01'), ('22', 'X02'), ('23', 'F03'), ('24', 'M04'), ('25', 'K04')]
out = []; doc = ['# LinkedIn-Sprint · zweiter Post pro Tag, 13.11. bis 25.11.2026', '', 'Jeweils 17:15 Uhr, zusätzlich zum Karussell um 11:00 Uhr. Erzeugt aus `posts.py`.', '',
                 'Drei Formate im Wechsel: Produktpost mit Bild und direktem Link (F, K), Scan eines Satzes (X), Geschichte als Karussell (M).', '']
for day, k in PLAN:
    media, title, text = T[k]; text = text + '\n\n' + TAGS
    assert os.path.exists(os.path.join(G, media)), media
    assert len(text) <= 3000 and 'Webinar' not in text and 'per Nachricht' not in text, k
    info = {'autoPublish': True, 'descendants': [], 'draft': False, 'firstCommentText': '', 'hasNotReadNotes': False, 'media': [RAW + media], 'mediaAltText': [],
            'publicationDate': {'dateTime': f'2026-11-{day}T17:15:00', 'timezone': 'Europe/Berlin'}, 'shortener': False, 'smartLinkData': {'ids': []}, 'text': text,
            'providers': [{'network': 'linkedin'}], 'linkedinData': {'publishImagesAsPDF': False, 'previewIncluded': True, 'type': 'post', **({'documentTitle': title} if title else {})}}
    out.append({'key': k, 'date': f'2026-11-{day}T17:15:00+01:00', 'info': json.dumps(info, ensure_ascii=False)})
    doc += [f'## {day}.11. · {k} · `{media}`', '', '```text', text, '```', '']
open(os.path.join(H, 'POSTS.md'), 'w', encoding='utf-8').write('\n'.join(doc))
json.dump(out, open(os.path.join(H, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), [(o['key'], len(json.loads(o['info'])['text'])) for o in out])
