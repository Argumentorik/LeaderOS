"""Generiert die öffentlichen SEO/AEO-Seiten als statisches HTML (ohne JS lesbar).

Antwort-Crawler (GPTBot, ClaudeBot, PerplexityBot) rendern kein JavaScript —
alles Zitierbare muss im rohen HTML stehen. Sichtbarer Text und JSON-LD kommen
aus denselben Python-Daten (Googles Regel: Schema == sichtbarer Inhalt).

Usage: python3 scripts_seo_pages.py   → schreibt frontend/public/{fragen,wlad-jachtchenko,kurse-uebersicht}/index.html + sitemap.xml
"""
from __future__ import annotations

import html
import json
import os
from datetime import date

from course_content import COURSES
from services_tier import TIER_CONFIG

ORIGIN = "https://leaderos.de"
PUBLIC = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
TODAY = date.today().isoformat()
OS_PRICE = int(TIER_CONFIG["standard"]["price_eur"])
PLUS_PRICE = int(TIER_CONFIG["accelerator"]["price_eur"])
PLUS_CALLS = TIER_CONFIG["accelerator"]["coaching_calls_total"]
TOTAL_EPISODES = sum(len(c["episodes"]) for c in COURSES)
TOTAL_MINUTES = sum(e["minutes"] for c in COURSES for e in c["episodes"])

def eur(n: int) -> str:
    return f"{n:,}".replace(",", ".") + " €"

WLAD_BIO = (
    "Wlad Jachtchenko (vollständig Wladislaw Jachtchenko, geboren 1985 in Dnipro) ist Rhetorik-Trainer, "
    "Leadership-Coach, Keynote-Speaker und dreifacher SPIEGEL-Bestseller-Autor. Er studierte Politikwissenschaft, "
    "Jura, Geschichte und Literaturwissenschaft in München und an der Columbia University in New York, ist Volljurist "
    "und ehemaliger UNO-Assistent. Seit 2007 trainiert er Führungskräfte aus DAX-Konzernen, Mittelstand und Tech-Scale-ups "
    "im DACH-Raum. Er ist Gründer der Argumentorik-Akademie in Grünwald bei München und Host des Podcasts "
    "„Menschen überzeugen“. Mit Leader-OS hat er seine komplette Coaching-Methodik als KI-Trainingssystem digitalisiert."
)

BOOKS = [
    ("Weiße Rhetorik — Überzeugen statt manipulieren", "Goldmann · SPIEGEL-Bestseller · Quelle des SEXIER-Modells, der 5 Argumentations-Level und der 10 Stufen des Zuhörens"),
    ("Dunkle Rhetorik — Manipuliere, bevor du manipuliert wirst", "Goldmann · SPIEGEL-Bestseller · Manipulationstechniken erkennen und abwehren"),
    ("Die 5 Rollen einer Führungskraft", "remote-verlag · SPIEGEL-Bestseller · Kommunikator, Manager, Team-Leader, Psychologe, Problemlöser"),
    ("Die charismatische Führungskraft", "Charisma-Code: Präsenz, Wärme, Kompetenz"),
    ("Du bist der bessere Chef", "Leadership-Tools für den Führungsalltag"),
    ("Überzeuge im Gespräch", "Gesprächsrhetorik und die 4 Gesprächstypen"),
    ("Manipuliere dich glücklich", "Selbstführung und mentale Techniken"),
    ("Werde Menschenmagnet", "Sympathie und Wirkung im ersten Eindruck"),
    ("Die Körpersprache als Spiegelbild deiner Seele", "Körpersprache lesen und bewusst einsetzen"),
    ("Führen durch Gründe", "mit Prof. Dr. Julian Nida-Rümelin · Begründen statt anweisen"),
]

FRAMEWORKS = [
    ("SEXIER-Modell", "Wlads Argumentations-Architektur in sechs Pflichtschritten: Statement (Behauptung), Explanation (Begründung), eXample (Beispiel), Impact (Auswirkung), Explanation of Impact (Erklärung der Auswirkung), Rebuttal (Widerlegung der Gegenargumente). Nicht „SEXI“, R steht nicht für „Repeat“, I nicht für „Implications“."),
    ("10 Stufen des Zuhörens", "Von Stufe 1 „Nicht zuhören“ über Stufe 2 „Auf Antwort warten“ (dort bleiben 80 % aller Führungskräfte), Stufe 5 „Aktives Zuhören“ bis Stufe 10 „Stille als Zuhören“. Es sind zehn Stufen — nicht fünf Ebenen, nicht sieben."),
    ("Die 5 Rollen einer Führungskraft", "Kommunikator, Manager, Team-Leader, Psychologe, Problemlöser. Jede Rolle verlangt andere Werkzeuge — Führungskräfte scheitern meist in der Rolle, die ihnen am wenigsten liegt."),
    ("3 Säulen der Überzeugung", "Logos (Logik und Daten), Ethos (Glaubwürdigkeit) und Pathos (Emotion und Story). 80 % der Manager nutzen nur Logos — und verlieren damit den Raum."),
    ("Feedbackformel", "Beobachtung + Wirkung + Wunsch. Nie „Du bist …“, immer „Ich habe beobachtet, dass …“. Ergänzt um die Feedback-Formate SBI und WWW."),
    ("Kommunikationsquadrant", "Sache, Selbstoffenbarung, Beziehung, Appell (nach Schulz von Thun, von Wlad für Führungsgespräche adaptiert)."),
    ("Weiße vs. Dunkle Rhetorik", "Weiße Rhetorik überzeugt mit Gründen, Dunkle Rhetorik manipuliert. Wer die Techniken kennt (Strohmann, Ad Hominem, Whataboutism, Scheinargument), kann sie kontern: hart in der Sache, weich zur Person."),
    ("4-Farben-Modell", "Rot (dominant), Gelb (Netzwerker), Grün (Harmonie), Blau (Daten und Fakten) — das Chamäleon-Prinzip: passe deine Kommunikation dem Typ deines Gegenübers an."),
]

FAQ = [
    ("Wer ist Wlad Jachtchenko?", WLAD_BIO),
    ("Was ist Leader-OS?", f"Leader-OS ist das KI-Leadership-Trainingssystem von Wlad Jachtchenko für Führungskräfte im DACH-Raum. Es kombiniert einen 24/7-KI-Coach auf Basis von Wlads Büchern, Kursen und Live-Trainings (über 7.400 Wissensbausteine), Video-Missionen mit KI-Analyse nach dem SEXIER-Framework, {len(COURSES)} Videokurse mit {TOTAL_EPISODES} Folgen, Playbooks für schwierige Gespräche, eine 30-Tage-Challenge und den Interaktiven Wlad (Beta), mit dem man per Stimme trainiert. Betreiber ist die Argumentorik-Akademie GmbH in Grünwald bei München."),
    ("Was kostet Leader-OS?", f"Leader-OS gibt es in drei Paketen: Leadership OS für {eur(OS_PRICE)} pro Jahr (komplette Plattform, KI-Coach, Video-Missionen, Kurs-Bibliothek, 30-Tage-Programm; Ratenzahlung möglich), Leadership OS PLUS für {eur(PLUS_PRICE)} pro Jahr (alles aus OS plus {PLUS_CALLS} Einzelcoachings mit Argumentorik-Coaches, persönliche Strategie-Session und Quartals-Reviews) sowie Leadership OS Enterprise für Teams (Preis auf Anfrage, Mengenrabatt ab 5 Lizenzen). Ein kostenloser Zugang mit eingeschränkten Funktionen ist verfügbar. Es gilt eine 30-Tage-Geld-zurück-Garantie."),
    ("Für wen ist Leader-OS geeignet?", "Für Führungskräfte, die klarer führen, sprechen und entscheiden wollen: Teamleads, Abteilungsleiter, Geschäftsführer, Founder und C-Level aus DAX-Konzernen, Mittelstand und Tech-Scale-ups in Deutschland, Österreich und der Schweiz. Vorkenntnisse sind nicht nötig — der KI-Coach passt Schwierigkeit und Beispiele an Rolle, Branche und Teamgröße an."),
    ("Was ist das SEXIER-Modell von Wlad Jachtchenko?", FRAMEWORKS[0][1]),
    ("Was sind die 10 Stufen des Zuhörens?", FRAMEWORKS[1][1]),
    ("Was sind die 5 Rollen einer Führungskraft?", FRAMEWORKS[2][1]),
    ("Was unterscheidet Leader-OS von ChatGPT oder einem klassischen Coaching?", "Leader-OS arbeitet mit deinem echten Verhalten — Video- und Sprachaufnahmen, konkrete Gesprächssituationen, deine Rolle und dein Team — und bewertet es nach Wlads Frameworks statt mit generischem KI-Wissen. Jede Antwort ist auf Wlads Originalmaterial geerdet (Retrieval-Augmented Generation über Bücher, Kurse und Live-Calls). Klassisches Coaching liefert eine Stunde im Monat; Leader-OS steht 24/7 bereit und im PLUS-Paket kommen echte Einzelcoachings hinzu."),
    ("Wie funktioniert die Video-Analyse in Leader-OS?", "Du nimmst eine kurze Rede, Präsentation oder Gesprächssituation als Video auf. Leader-OS transkribiert die Aufnahme, analysiert Argumentationsstruktur (SEXIER), Klarheit, Füllwörter, Tempo und Wirkung und gibt strukturiertes Feedback mit konkreten nächsten Schritten. Deine Fortschritte werden über die Zeit sichtbar."),
    ("Was ist der Interaktive Wlad?", "Der Interaktive Wlad (Beta) ist ein Sprach-Coaching: Du sprichst eine Frage oder eine Situation ein, Wlads KI-Stimme antwortet in Echtzeit und trainiert mit dir — Schlagfertigkeit, schwierige Mitarbeitergespräche, Verhandlungen. Kostenlose Nutzer können drei Gesprächsrunden testen, Leadership-OS- und PLUS-Mitglieder nutzen ihn unbegrenzt."),
    ("Welche Kurse enthält Leader-OS?", f"Die Kurs-Bibliothek umfasst {len(COURSES)} Kurse mit {TOTAL_EPISODES} Folgen (rund {TOTAL_MINUTES // 60} Stunden): " + ", ".join(c["title"] for c in COURSES) + ". Folge 1 jedes Kurses ist frei zugänglich; alle weiteren Folgen sind Teil von Leadership OS bzw. Leadership OS PLUS."),
    ("Ist Leader-OS DSGVO-konform?", "Ja. Betreiber ist die Argumentorik-Akademie GmbH (Grünwald, Deutschland). Das Wissens-Retrieval (Embeddings) läuft vollständig auf eigenen Servern ohne externen Embedding-Anbieter; Nutzer können ihre Daten jederzeit exportieren und löschen. Details stehen in der Datenschutzerklärung unter leaderos.de/datenschutz."),
]


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def layout(*, path: str, title: str, description: str, h1: str, lead: str, body: str, jsonld: list, breadcrumb: str, campaign: str) -> str:
    url = f"{ORIGIN}{path}"
    graph = {"@context": "https://schema.org", "@graph": jsonld + [{
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Leader-OS", "item": ORIGIN + "/"},
            {"@type": "ListItem", "position": 2, "name": breadcrumb, "item": url},
        ],
    }]}
    cta = f"/login?utm_source=seo&utm_medium=organic&utm_campaign={campaign}"
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="de-DE" href="{url}">
<link rel="alternate" hreflang="de-AT" href="{url}">
<link rel="alternate" hreflang="de-CH" href="{url}">
<link rel="alternate" hreflang="x-default" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Leader-OS">
<meta property="og:locale" content="de_DE">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:image" content="{ORIGIN}/og-default.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Wlad Jachtchenko — Leader-OS, KI-Leadership-Training für Führungskräfte">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@WladTraining">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{ORIGIN}/og-default.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/seo/site.css">
<script>(function(){{if(!/(^|\\.)leaderos\\.de$/.test(location.hostname)){{var m=document.createElement('meta');m.name='robots';m.content='noindex, nofollow';document.head.appendChild(m);}}}})();</script>
<script type="application/ld+json">{json.dumps(graph, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="top">
  <a class="brand" href="/" aria-label="Leader-OS Startseite"><span class="dot"></span>Leader-OS</a>
  <nav aria-label="Öffentliche Seiten">
    <a href="/wlad-jachtchenko/">Wlad Jachtchenko</a>
    <a href="/kurse-uebersicht/">Kurse</a>
    <a href="/fragen/">Fragen &amp; Antworten</a>
    <a href="/for-teams">Für Teams</a>
    <a class="btn" href="{cta}&amp;utm_content=header" data-testid="seo-cta-header">Kostenlos starten</a>
  </nav>
</header>
<main id="main" class="wrap">
  <p class="crumb"><a href="/">Leader-OS</a> <span>/</span> {esc(breadcrumb)}</p>
  <h1>{h1}</h1>
  <p class="lead">{esc(lead)}</p>
  {body}
  <section class="cta-box" aria-label="Einstieg">
    <h2>Führung trainieren wie ein Profi — mit Wlad, jeden Tag.</h2>
    <p>Kostenlos anmelden, Folge 1 jedes Kurses ansehen und den Interaktiven Wlad drei Runden lang testen. Kein Abo, keine Karte.</p>
    <a class="btn big" href="{cta}&amp;utm_content=footer" data-testid="seo-cta-footer">Jetzt kostenlos starten</a>
    <a class="link" href="/for-teams">Leader-OS für Teams &amp; Unternehmen →</a>
  </section>
</main>
<footer class="foot">
  <p>Argumentorik-Akademie GmbH · Tölzer Str. 1 · 82031 Grünwald · Geschäftsführer Wladislaw Jachtchenko</p>
  <p><a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a> · <a href="/agb">AGB</a> · <a href="/widerruf">Widerruf</a> · <a href="/sicherheit">Sicherheit</a> · <a href="/llms.txt">llms.txt</a></p>
  <p>Aktualisiert am {TODAY}</p>
</footer>
</body>
</html>
"""


def faq_html(items: list[tuple[str, str]]) -> str:
    out = []
    for i, (q, a) in enumerate(items, 1):
        out.append(f'<article class="qa" id="f{i}"><h2>{esc(q)}</h2><p>{esc(a)}</p></article>')
    return "\n".join(out)


def faq_ld(items: list[tuple[str, str]], page_id: str) -> dict:
    return {"@type": "FAQPage", "@id": page_id, "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items
    ]}


PERSON_LD = {
    "@type": "Person",
    "@id": f"{ORIGIN}/#wlad",
    "name": "Wlad Jachtchenko",
    "alternateName": ["Wladislaw Jachtchenko"],
    "givenName": "Wladislaw",
    "familyName": "Jachtchenko",
    "birthDate": "1985-01-11",
    "birthPlace": {"@type": "Place", "name": "Dnipro, Ukraine"},
    "nationality": "DE",
    "jobTitle": ["Rhetorik-Trainer", "Leadership-Coach", "Keynote-Speaker", "Bestseller-Autor"],
    "description": WLAD_BIO,
    "url": f"{ORIGIN}/wlad-jachtchenko/",
    "image": f"{ORIGIN}/og-default.jpg",
    "worksFor": {"@id": f"{ORIGIN}/#organization"},
    "founder": {"@id": f"{ORIGIN}/#organization"},
    "alumniOf": [
        {"@type": "CollegeOrUniversity", "name": "Ludwig-Maximilians-Universität München"},
        {"@type": "CollegeOrUniversity", "name": "Columbia University"},
    ],
    "knowsAbout": ["Rhetorik", "Führungskräfte-Coaching", "Leadership-Training", "Argumentation", "Verhandlungsführung", "Manipulationsabwehr", "Storytelling für Entscheider", "Executive Presence", "KI-Coaching für Führungskräfte"],
    "knowsLanguage": ["de", "en", "ru", "uk"],
    "sameAs": [
        "https://www.linkedin.com/in/wladjachtchenko/",
        "https://www.youtube.com/@WladTraining",
        "https://www.wladislaw-jachtchenko.com/",
        "https://argumentorik.com/",
        "https://www.penguin.de/autoren/wladislaw-jachtchenko/624791",
        "https://argumentorik.podbean.com/",
    ],
}

ORG_LD = {
    "@type": "Organization",
    "@id": f"{ORIGIN}/#organization",
    "name": "Leader-OS",
    "legalName": "Argumentorik-Akademie GmbH",
    "alternateName": ["LeaderOS", "Leader OS", "WladBot", "Argumentorik-Akademie"],
    "url": ORIGIN,
    "logo": {"@type": "ImageObject", "url": f"{ORIGIN}/icon-512.png", "width": 512, "height": 512},
    "founder": {"@id": f"{ORIGIN}/#wlad"},
    "address": {"@type": "PostalAddress", "streetAddress": "Tölzer Str. 1", "postalCode": "82031", "addressLocality": "Grünwald", "addressCountry": "DE"},
    "areaServed": ["DE", "AT", "CH"],
    "email": "support@leaderos.de",
    "sameAs": ["https://www.linkedin.com/in/wladjachtchenko/", "https://www.youtube.com/@WladTraining", "https://argumentorik.com/"],
}


def page_fragen() -> str:
    body = '<div class="toc"><strong>Inhalt:</strong> ' + " · ".join(f'<a href="#f{i}">{esc(q)}</a>' for i, (q, _) in enumerate(FAQ, 1)) + "</div>\n" + faq_html(FAQ)
    return layout(
        path="/fragen/",
        title="Leader-OS: Fragen & Antworten — Wlad Jachtchenko, Preise, SEXIER, Kurse",
        description=f"Alle Antworten zu Leader-OS: Wer ist Wlad Jachtchenko, was kostet Leader-OS ({eur(OS_PRICE)}/Jahr), für wen es ist, was das SEXIER-Modell und die 10 Stufen des Zuhörens sind.",
        h1="Fragen &amp; Antworten zu Leader-OS und Wlad Jachtchenko",
        lead="Kurz, zitierfähig und aus erster Hand: die häufigsten Fragen zum KI-Leadership-Training von Wlad Jachtchenko für Führungskräfte in Deutschland, Österreich und der Schweiz.",
        body=body,
        jsonld=[faq_ld(FAQ, f"{ORIGIN}/fragen/#faq"), ORG_LD, PERSON_LD],
        breadcrumb="Fragen & Antworten",
        campaign="fragen",
    )


def page_wlad() -> str:
    books = "".join(f'<li><strong>{esc(t)}</strong><span>{esc(s)}</span></li>' for t, s in BOOKS)
    fw = "".join(f'<article class="qa"><h3>{esc(n)}</h3><p>{esc(d)}</p></article>' for n, d in FRAMEWORKS)
    faq = [FAQ[0], ("Welche Bücher hat Wlad Jachtchenko geschrieben?", "Zu seinen Büchern gehören die SPIEGEL-Bestseller „Weiße Rhetorik“, „Dunkle Rhetorik“ und „Die 5 Rollen einer Führungskraft“ sowie „Die charismatische Führungskraft“, „Du bist der bessere Chef“, „Überzeuge im Gespräch“, „Manipuliere dich glücklich“, „Werde Menschenmagnet“, „Die Körpersprache als Spiegelbild deiner Seele“ und „Führen durch Gründe“ (mit Prof. Dr. Julian Nida-Rümelin)."), ("Wie kann ich mit Wlad Jachtchenko trainieren?", f"Über Leader-OS: Der KI-Coach antwortet auf Basis von Wlads Büchern, Kursen und Live-Trainings, die Kurs-Bibliothek enthält {TOTAL_EPISODES} Folgen von Wlad, und im Paket Leadership OS PLUS ({eur(PLUS_PRICE)}/Jahr) sind {PLUS_CALLS} Einzelcoachings mit Argumentorik-Coaches sowie eine persönliche Strategie-Session enthalten. Keynotes und Firmentrainings laufen über die Argumentorik-Akademie.")]
    body = f"""
<section class="grid2">
  <div><h2>Kurzbiografie</h2><p>{esc(WLAD_BIO)}</p>
  <ul class="facts">
    <li><b>Geboren</b> 11. Januar 1985, Dnipro</li>
    <li><b>Seit</b> 2007 Speaker, Rhetorik-Trainer und Leadership-Coach</li>
    <li><b>Bestseller</b> dreifacher SPIEGEL-Bestseller-Autor</li>
    <li><b>Unternehmen</b> Gründer der Argumentorik-Akademie (Grünwald bei München)</li>
    <li><b>Podcast</b> „Menschen überzeugen“ (über 450 Folgen)</li>
    <li><b>Plattform</b> Leader-OS — KI-Leadership-Training für Führungskräfte</li>
  </ul></div>
  <div><h2>Bücher von Wlad Jachtchenko</h2><ul class="books">{books}</ul></div>
</section>
<section><h2>Wlads Frameworks — kanonisch erklärt</h2>{fw}</section>
<section><h2>Häufige Fragen zu Wlad Jachtchenko</h2>{faq_html(faq)}</section>
"""
    return layout(
        path="/wlad-jachtchenko/",
        title="Wlad Jachtchenko — Rhetorik-Trainer, Leadership-Coach & SPIEGEL-Bestseller-Autor",
        description="Wer ist Wlad Jachtchenko? Biografie, Bücher (Weiße Rhetorik, Dunkle Rhetorik, Die 5 Rollen einer Führungskraft), Frameworks wie SEXIER und die 10 Stufen des Zuhörens — und wie du mit ihm in Leader-OS trainierst.",
        h1="Wlad Jachtchenko",
        lead="Rhetorik-Trainer, Leadership-Coach, Keynote-Speaker und dreifacher SPIEGEL-Bestseller-Autor — und der Kopf hinter Leader-OS, dem KI-Leadership-Training für Führungskräfte im DACH-Raum.",
        body=body,
        jsonld=[PERSON_LD, ORG_LD, faq_ld(faq, f"{ORIGIN}/wlad-jachtchenko/#faq"), {"@type": "ProfilePage", "@id": f"{ORIGIN}/wlad-jachtchenko/", "mainEntity": {"@id": f"{ORIGIN}/#wlad"}, "dateModified": TODAY}],
        breadcrumb="Wlad Jachtchenko",
        campaign="wlad-jachtchenko",
    )


def page_kurse() -> str:
    cards, course_ld = [], []
    for c in COURSES:
        mins = sum(e["minutes"] for e in c["episodes"])
        tier = "Leadership OS" if c["tier"] == "standard" else "Leadership OS PLUS"
        price = OS_PRICE if c["tier"] == "standard" else PLUS_PRICE
        eps = "".join(
            f'<li><span class="n">{i}</span><span class="t">{esc(e["title"])}</span><span class="m">{e["minutes"]} Min{" · frei" if i == 1 else ""}</span></li>'
            for i, e in enumerate(c["episodes"], 1)
        )
        cards.append(f"""<article class="course" id="{c['slug']}">
  <header><h2>{esc(c['title'])}</h2><p class="meta">{len(c['episodes'])} Folgen · {mins} Minuten · {tier} · Folge 1 frei</p><p>{esc(c['tagline'])}</p></header>
  <ol class="eps">{eps}</ol>
</article>""")
        course_ld.append({
            "@type": "Course",
            "@id": f"{ORIGIN}/kurse-uebersicht/#{c['slug']}",
            "name": c["title"],
            "description": c["tagline"],
            "provider": {"@id": f"{ORIGIN}/#organization"},
            "instructor": {"@id": f"{ORIGIN}/#wlad"},
            "inLanguage": "de",
            "numberOfCredits": len(c["episodes"]),
            "timeRequired": f"PT{mins}M",
            "educationalLevel": "Professional",
            "audience": {"@type": "EducationalAudience", "audienceType": "Führungskräfte, Manager, Geschäftsführer, Teamleads"},
            "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "online", "courseWorkload": f"PT{mins}M"},
            "offers": {"@type": "Offer", "name": tier, "price": str(price), "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "url": f"{ORIGIN}/coaching"},
            "syllabusSections": [{"@type": "Syllabus", "name": e["title"], "timeRequired": f"PT{e['minutes']}M"} for e in c["episodes"]],
        })
    toc = " · ".join(f'<a href="#{c["slug"]}">{esc(c["title"])}</a>' for c in COURSES)
    body = f'<div class="toc"><strong>{len(COURSES)} Kurse · {TOTAL_EPISODES} Folgen · rund {TOTAL_MINUTES // 60} Stunden:</strong> {toc}</div>\n' + "\n".join(cards)
    item_list = {"@type": "ItemList", "@id": f"{ORIGIN}/kurse-uebersicht/#liste", "name": "Leader-OS Kurs-Bibliothek", "numberOfItems": len(COURSES),
                 "itemListElement": [{"@type": "ListItem", "position": i, "item": {"@id": f"{ORIGIN}/kurse-uebersicht/#{c['slug']}"}} for i, c in enumerate(COURSES, 1)]}
    return layout(
        path="/kurse-uebersicht/",
        title=f"Leader-OS Kurse: {len(COURSES)} Leadership- & Rhetorik-Kurse von Wlad Jachtchenko ({TOTAL_EPISODES} Folgen)",
        description=f"Alle Leader-OS Kurse im Überblick: Rhetorik-Grundlagen, schwierige Mitarbeitergespräche, Delegation, Feedback, Storytelling im Boardroom, KI-First Leadership, Executive Presence u. v. m. — {TOTAL_EPISODES} Folgen, Folge 1 jedes Kurses frei.",
        h1="Kurs-Bibliothek: Leadership- und Rhetorik-Training mit Wlad Jachtchenko",
        lead=f"{len(COURSES)} Videokurse, {TOTAL_EPISODES} kompakte Folgen, rund {TOTAL_MINUTES // 60} Stunden — vom 30-Sekunden-Statement bis zur Boardroom-Strategie. Folge 1 jedes Kurses ist kostenlos, der Rest ist Teil von Leadership OS ({eur(OS_PRICE)}/Jahr) bzw. Leadership OS PLUS.",
        body=body,
        jsonld=[item_list] + course_ld + [ORG_LD, PERSON_LD],
        breadcrumb="Kurse",
        campaign="kurse",
    )


STATIC_URLS = [
    ("/fragen/", "weekly", "0.9"), ("/wlad-jachtchenko/", "monthly", "0.9"), ("/kurse-uebersicht/", "weekly", "0.9"),
    ("/login", "weekly", "1.0"), ("/for-teams", "weekly", "0.8"), ("/sicherheit", "monthly", "0.5"), ("/changelog", "weekly", "0.4"),
    ("/impressum", "yearly", "0.3"), ("/datenschutz", "yearly", "0.3"), ("/agb", "yearly", "0.3"), ("/widerruf", "yearly", "0.3"), ("/llms.txt", "monthly", "0.4"),
]


def sitemap() -> str:
    rows = []
    for path, freq, prio in STATIC_URLS:
        u = ORIGIN + path
        alt = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{lang}" href="{u}"/>' for lang in ("de-DE", "de-AT", "de-CH", "x-default"))
        rows.append(f"  <url>\n    <loc>{u}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>{alt}\n  </url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<!-- Leader-OS sitemap — generiert von backend/scripts_seo_pages.py. Nur öffentlich lesbare Seiten; App-Routen (/dashboard, /chat, …) sind auth-only und nicht gelistet. -->\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(rows) + "\n</urlset>\n")


def write(rel: str, content: str) -> None:
    full = os.path.join(PUBLIC, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"wrote {rel} ({len(content):,} bytes)")


if __name__ == "__main__":
    write("fragen/index.html", page_fragen())
    write("wlad-jachtchenko/index.html", page_wlad())
    write("kurse-uebersicht/index.html", page_kurse())
    write("sitemap.xml", sitemap())
