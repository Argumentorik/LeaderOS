"""Masterclass → LeaderOS conversion sequence (Iter 133).

8 approval-gated emails for the ~400-client cohort. NOTHING is sent
automatically: every email starts as `draft` and the cron only sends
emails whose approval status is `approved` (set by Wlad/admin in the
Conversion Center). Honest copy — no invented numbers, no fake urgency.
"""
import html as _html

from services_email import _base_layout, BRAND_COLOR

APP_URL = "https://leaderos.de"
COACHING_URL = f"{APP_URL}/coaching"
LOGIN_URL = f"{APP_URL}/login"
CALL_URL = "https://leadercheck.de/beratung"

# ── Sequence definition ──────────────────────────────────────────────────────
# timing_days: days after masterclass_started_at (None = state-triggered)
# segment: which computed segment receives it (see routes/conversion_center.py)
SEQUENCE = [
    {
        "id": "conv_01_intro",
        "n": 1,
        "purpose": "Einführung — warum es Leader-OS gibt und warum das für Masterclass-Kunden relevant ist.",
        "trigger": "Tag 0 nach Sequenz-Start (masterclass_started_at)",
        "timing_days": 0,
        "segment": "mc_all_not_purchased",
        "segment_label": "Alle Masterclass-Kunden (noch kein Leader-OS-Kauf)",
        "expected_next": "E-Mail öffnen, verstehen was Leader-OS ist. Kein Kauf-Druck.",
        "subject": "{name}, die Masterclass hat einen Trainingsraum bekommen",
        "preheader": "Wissen ist der Anfang. Anwendung ist der Unterschied — dafür gibt es jetzt Leader-OS.",
        "eyebrow": "Masterclass · Persönliche Nachricht von Wlad",
        "headline": "Die Masterclass hat einen Trainingsraum bekommen.",
        "paragraphs": [
            "in der Masterclass hast du meine Frameworks gelernt — SEXIER, die 10 Stufen des Zuhörens, Verhandlungstechniken. Was dabei immer die Lücke war: der Moment <b>zwischen</b> Wissen und Anwendung. Das schwierige Gespräch ist morgen um 9 Uhr, und kein Kurs der Welt sitzt dann neben dir.",
            "Deshalb habe ich <b>Leader-OS</b> gebaut: meine komplette Methodik als KI-System. Du bereitest echte Gespräche vor, bekommst Feedback auf echte Auftritte und hast meine Frameworks in dem Moment zur Hand, in dem du sie brauchst — nicht nur im Kursvideo.",
            "Als Masterclass-Kunde hast du bereits Zugang. Kein Kauf nötig, um es auszuprobieren — dein Account wartet auf dich.",
        ],
        "cta_label": "Leader-OS ansehen →",
        "cta_url": LOGIN_URL,
        "ps": "In den nächsten Tagen zeige ich dir konkret, was das im Führungsalltag ändert. Wenn du das nicht willst: unten abmelden, kein Problem.",
    },
    {
        "id": "conv_02_value",
        "n": 2,
        "purpose": "Wert zeigen — was Leader-OS im täglichen Führungsalltag konkret ändert.",
        "trigger": "Tag 3 nach Sequenz-Start",
        "timing_days": 3,
        "segment": "mc_all_not_purchased",
        "segment_label": "Alle Masterclass-Kunden (noch kein Kauf)",
        "expected_next": "Verstehen, welches konkrete Problem Leader-OS löst.",
        "subject": "Das Gespräch, das du vor dir herschiebst",
        "preheader": "Drei Minuten Vorbereitung statt drei Tage Grübeln — so sieht das konkret aus.",
        "eyebrow": "Leader-OS · Was sich konkret ändert",
        "headline": "Das Gespräch, das du vor dir herschiebst.",
        "paragraphs": [
            "jeder Leader hat gerade eins davon: die Gehaltsverhandlung, das Feedback an den schwierigen Mitarbeiter, den Pitch vor dem Vorstand. Man weiß, <i>dass</i> man es führen muss — und schiebt es, weil die Vorbereitung diffus ist.",
            "In Leader-OS gibst du die Situation in 3 Minuten ein: Worum geht es, wer sitzt gegenüber, was ist dein Ziel. Das System baut dir daraus eine komplette <b>SEXIER-Argumentationsstrategie</b> — deine 3 stärksten Argumente, die wahrscheinlichsten Einwände, deine Antworten darauf. Als PDF zum Mitnehmen ins Meeting.",
            "Das ist kein Chatbot, der nett plaudert. Es ist meine Methodik, angewendet auf <b>dein</b> Gespräch.",
        ],
        "cta_label": "Bereite dein nächstes Gespräch vor →",
        "cta_url": LOGIN_URL,
        "ps": None,
    },
    {
        "id": "conv_03_product",
        "n": 3,
        "purpose": "Produkt-Erlebnis konkret zeigen statt vager KI-Versprechen.",
        "trigger": "Tag 6 nach Sequenz-Start",
        "timing_days": 6,
        "segment": "mc_all_not_purchased",
        "segment_label": "Alle Masterclass-Kunden (noch kein Kauf)",
        "expected_next": "Konkretes Bild vom Produkt. Erster Login.",
        "subject": "So sieht Leader-OS von innen aus",
        "preheader": "Kein KI-Buzzword-Nebel — hier ist, was du nach dem Login wirklich siehst.",
        "eyebrow": "Leader-OS · Der Rundgang",
        "headline": "So sieht es von innen aus.",
        "paragraphs": [
            "keine vagen KI-Versprechen — hier ist, was du nach dem Login konkret vor dir hast:",
            "<b>1 · Gesprächsvorbereitung (SEXIER-Prep).</b> Situation rein, Strategie raus. Argumente, Einwände, Antworten — als Dokument fürs Meeting.<br><br><b>2 · WladBot.</b> Meine Bücher, Kurse und Live-Calls als durchsuchbares Coaching. Stell die Frage, die du mir im Seminar stellen würdest — er antwortet mit meiner Methodik, nicht mit Internet-Allgemeinplätzen.<br><br><b>3 · Video-Feedback.</b> Kamera an, 60 Sekunden sprechen — strukturiertes Feedback nach dem SEXIER-Schema. Wie ein 1:1 mit mir, jederzeit wiederholbar.<br><br><b>4 · Leader-Diagnose.</b> Standortbestimmung in 3 Minuten: wo du in Kommunikation, Führung und EQ gerade stehst.",
            "Dein Masterclass-Zugang deckt all das ab — mit 250 Credits, genug für Wochen echten Trainings.",
        ],
        "cta_label": "Jetzt einloggen und ansehen →",
        "cta_url": LOGIN_URL,
        "ps": None,
    },
    {
        "id": "conv_04_activation",
        "n": 4,
        "purpose": "Aktivierung — ein konkreter erster Schritt mit sofortigem Ergebnis.",
        "trigger": "Tag 9 nach Sequenz-Start",
        "timing_days": 9,
        "segment": "mc_all_not_purchased",
        "segment_label": "Alle Masterclass-Kunden (noch kein Kauf)",
        "expected_next": "Login + erste SEXIER-Prep abschließen (First Value Moment).",
        "subject": "Dein erster Schritt: 3 Minuten, ein Ergebnis",
        "preheader": "Nicht 'mal reinschauen' — ein konkretes Gespräch vorbereiten. Heute.",
        "eyebrow": "Leader-OS · Dein erster Schritt",
        "headline": "3 Minuten. Ein Ergebnis.",
        "paragraphs": [
            "der Unterschied zwischen Leuten, die von Tools profitieren, und Leuten, die sie nur installieren: der erste konkrete Anwendungsfall. Deshalb kein „schau mal rein“ — sondern eine klare Aufgabe:",
            "<b>Nimm das eine Gespräch, das diese Woche ansteht.</b> Logge dich ein, öffne „Gespräch vorbereiten“, gib die Situation ein. In 3 Minuten hältst du eine Strategie in der Hand, die du direkt verwenden kannst.",
            "Login geht ohne Passwort: E-Mail eingeben → Magic Link → drin. Diese E-Mail-Adresse ist bereits freigeschaltet.",
        ],
        "cta_label": "Gespräch jetzt vorbereiten →",
        "cta_url": LOGIN_URL,
        "ps": "Wenn du dich nicht einloggen kannst: antworte einfach auf diese Mail — wir kümmern uns.",
    },
    {
        "id": "conv_05_objections",
        "n": 5,
        "purpose": "Einwandbehandlung — die naheliegenden Gründe, warum ein Masterclass-Kunde zögert.",
        "trigger": "Tag 13 nach Sequenz-Start",
        "timing_days": 13,
        "segment": "mc_all_not_purchased",
        "segment_label": "Alle Masterclass-Kunden (noch kein Kauf)",
        "expected_next": "Bedenken ausgeräumt, erneuter Login oder Antwort auf die Mail.",
        "subject": "„Ich habe doch schon die Masterclass“ — stimmt.",
        "preheader": "Drei ehrliche Antworten auf drei berechtigte Einwände.",
        "eyebrow": "Leader-OS · Klartext",
        "headline": "Drei berechtigte Einwände — drei ehrliche Antworten.",
        "paragraphs": [
            "<b>„Ich habe doch schon die Masterclass.“</b><br>Stimmt. Die Masterclass ist das Wissen. Leader-OS ist der Ort, an dem du es auf <i>deine</i> Situationen anwendest — mit Vorbereitung, Feedback und Wiederholung. Das eine ersetzt das andere nicht, es macht es wirksam.",
            "<b>„Noch ein Tool, das ich nicht nutze.“</b><br>Verstehe ich. Deshalb ist der Einstieg bewusst ein einziger Use-Case: ein echtes Gespräch vorbereiten. Wenn dir das einmal geholfen hat, entscheidest du selbst, ob mehr dazukommt. Wenn nicht — auch okay.",
            "<b>„KI-Coaching ist doch generisch.“</b><br>Generische KI ja. Leader-OS antwortet aus meinen Büchern, Kursen und Live-Calls — über 7.000 Wissensbausteine meiner Methodik. Frag es nach dem SEXIER-Modell und vergleiche die Antwort mit ChatGPT. Der Unterschied ist der Punkt.",
        ],
        "cta_label": "Selbst vergleichen →",
        "cta_url": LOGIN_URL,
        "ps": None,
    },
    {
        "id": "conv_06_conversion",
        "n": 6,
        "purpose": "Conversion — ehrliche Einladung, Leader-OS-Kunde zu werden (Vollzugang).",
        "trigger": "Tag 17 nach Sequenz-Start",
        "timing_days": 17,
        "segment": "mc_all_not_purchased",
        "segment_label": "Alle Masterclass-Kunden (noch kein Kauf)",
        "expected_next": "Kauf Leadership OS ODER Beratungstermin buchen.",
        "subject": "Der nächste Schritt — wenn du ihn gehen willst",
        "preheader": "Vollzugang zu Leader-OS: was drin ist, was es kostet, wie du entscheidest.",
        "eyebrow": "Leader-OS · Die Einladung",
        "headline": "Der nächste Schritt — wenn du ihn gehen willst.",
        "paragraphs": [
            "dein Masterclass-Zugang bleibt, wie er ist. Aber wenn Leader-OS für dich arbeitet, gibt es die Stufe darüber: <b>Leadership OS</b> — Vollzugang ohne Credit-Limit, alle Lernvideos, das komplette 30-Tage-Programm und den KI-Coach ohne Grenzen. Ein Jahr, 997 €.",
            "Keine Countdown-Timer, keine künstliche Verknappung. Nur eine ehrliche Rechnung: Wenn dich das System vor <i>einem</i> wichtigen Gespräch besser dastehen lässt — was ist das wert?",
            "Wenn du unsicher bist, ob es zu deiner Situation passt: 30 Minuten mit meinem Team, kostenlos und unverbindlich. Wir sagen dir auch ehrlich, wenn es (noch) nicht passt.",
        ],
        "cta_label": "Leadership OS freischalten →",
        "cta_url": COACHING_URL,
        "cta2_label": "Lieber erst sprechen? Termin buchen",
        "cta2_url": CALL_URL,
        "ps": None,
    },
    {
        "id": "conv_07_followup",
        "n": 7,
        "purpose": "Follow-up für Interessierte, die aktiviert haben aber nicht gekauft/abgeschlossen haben.",
        "trigger": "Tag 22 nach Sequenz-Start — NUR an Kunden, die sich eingeloggt haben, aber nicht gekauft",
        "timing_days": 22,
        "segment": "mc_engaged_not_purchased",
        "segment_label": "Aktivierte Masterclass-Kunden ohne Kauf (eingeloggt, kein Upgrade)",
        "expected_next": "Antwort auf die Mail (Feedback) oder Kauf/Beratung.",
        "subject": "Kurzes Feedback zu Leader-OS?",
        "preheader": "Du warst drin. Eine ehrliche Frage — und ein Angebot.",
        "eyebrow": "Leader-OS · Eine ehrliche Frage",
        "headline": "Du warst drin. Was hat gefehlt?",
        "paragraphs": [
            "du hast dich in Leader-OS eingeloggt — danke, dass du es dir angesehen hast. Dass du (noch) nicht weitergegangen bist, ist ein Signal, das ich ernst nehme.",
            "Deshalb eine ehrliche Frage: <b>Was hat gefehlt?</b> War der Einstieg unklar? Hat ein Use-Case gefehlt? Passt das Timing nicht? Antworte einfach auf diese Mail — ich lese das.",
            "Und falls es nur am Anlass lag: Dein Zugang ist weiter aktiv. Das nächste wichtige Gespräch kommt bestimmt.",
        ],
        "cta_label": "Zurück ins System →",
        "cta_url": LOGIN_URL,
        "ps": None,
    },
    {
        "id": "conv_08_onboarding",
        "n": 8,
        "purpose": "Onboarding für Käufer — reibungsloser Übergang ins Produkt.",
        "trigger": "Status-basiert: Leader-OS gekauft, Onboarding noch nicht abgeschlossen",
        "timing_days": None,
        "segment": "purchased_not_onboarded",
        "segment_label": "Leader-OS-Käufer ohne abgeschlossenes Onboarding",
        "expected_next": "Onboarding abschließen, erste SEXIER-Prep (First Value Moment).",
        "subject": "Willkommen bei Leader-OS — dein Fahrplan für Woche 1",
        "preheader": "Drei Schritte, die aus dem Kauf ein System machen.",
        "eyebrow": "Leader-OS · Willkommen an Bord",
        "headline": "Dein Fahrplan für Woche 1.",
        "paragraphs": [
            "willkommen bei Leader-OS — schön, dass du dabei bist. Damit aus dem Kauf ein System wird, das für dich arbeitet, hier dein Fahrplan für die erste Woche:",
            "<b>Tag 1 · Onboarding abschließen (5 Min).</b> Rolle, Ziel, Ausgangslage — damit jede Antwort des Systems auf dich zugeschnitten ist.<br><br><b>Tag 2 · Erstes Gespräch vorbereiten.</b> Nimm einen echten Termin aus deinem Kalender. Die Strategie nimmst du mit ins Meeting.<br><br><b>Tag 3-7 · Eine Frage pro Tag an den WladBot.</b> Die Frage, die dich gerade wirklich beschäftigt — nicht die höfliche Version davon.",
            "Wenn irgendwo etwas hakt: antworte auf diese Mail. Ein Mensch liest das und hilft.",
        ],
        "cta_label": "Onboarding abschließen →",
        "cta_url": f"{APP_URL}/onboarding",
        "ps": None,
    },
]

SEQUENCE_BY_ID = {e["id"]: e for e in SEQUENCE}


def render_conversion_email(email: dict, name: str, unsubscribe_link: str | None = None) -> tuple[str, str]:
    """Render one sequence email → (subject, html). Name is HTML-escaped."""
    safe = _html.escape(name or "Leader")
    subject = email["subject"].replace("{name}", name or "Leader")

    paragraphs = "".join(
        f'<p style="font-size:14px;color:rgba(255,255,255,0.78);line-height:1.75;margin:0 0 18px;">{p}</p>'
        for p in email["paragraphs"]
    )
    cta2 = ""
    if email.get("cta2_label"):
        cta2 = f"""
<p style="margin:-12px 0 26px;text-align:center;">
  <a href="{email['cta2_url']}" style="font-size:13px;color:rgba(255,255,255,0.55);text-decoration:underline;">{email['cta2_label']}</a>
</p>"""
    ps = ""
    if email.get("ps"):
        ps = f'<p style="font-size:12.5px;color:rgba(255,255,255,0.45);line-height:1.6;margin:18px 0 0;">PS: {email["ps"]}</p>'
    unsub = ""
    if unsubscribe_link:
        unsub = f'<p style="font-size:11px;color:rgba(255,255,255,0.3);margin:22px 0 0;">Du willst diese Serie nicht? <a href="{unsubscribe_link}" style="color:rgba(255,255,255,0.45);">Hier abmelden</a> — dein Zugang bleibt davon unberührt.</p>'

    body = f"""
<div style="background:linear-gradient(135deg,rgba(191,255,0,0.16),rgba(154,204,0,0.04));border:1px solid rgba(191,255,0,0.24);border-radius:14px;padding:20px 24px;margin-bottom:26px;">
  <div style="font-size:10px;letter-spacing:0.22em;color:{BRAND_COLOR};font-weight:800;text-transform:uppercase;margin-bottom:8px;">{email['eyebrow']}</div>
  <div style="font-size:24px;font-weight:900;line-height:1.18;letter-spacing:-0.02em;">{email['headline']}</div>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.82);line-height:1.7;margin:0 0 18px;">Hi {safe},</p>
{paragraphs}
<p style="margin:26px 0 26px;text-align:center;">
  <a href="{email['cta_url']}" style="display:inline-block;padding:14px 30px;background:{BRAND_COLOR};color:#0A0A0A;font-weight:800;text-decoration:none;border-radius:10px;font-size:15px;">{email['cta_label']}</a>
</p>
{cta2}
<p style="font-size:14px;color:rgba(255,255,255,0.82);line-height:1.7;margin:24px 0 0;">Wlad</p>
<p style="font-size:11px;color:rgba(255,255,255,0.35);margin:4px 0 0;letter-spacing:0.06em;">WLAD JACHTCHENKO · GRÜNDER LEADEROS</p>
{ps}
{unsub}
"""
    badge = f"E-MAIL&nbsp;{email['n']}&nbsp;/&nbsp;8"
    return subject, _base_layout(body, preheader=email["preheader"], badge=badge)
