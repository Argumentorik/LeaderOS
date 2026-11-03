# Finale Topologie — Marketing auf Vercel, App auf Emergent

> Update 2026-06-11. `start.leader-os.de` wird **nicht** angelegt
> (gelöscht aus dem Plan). Stattdessen: jede Hauptdomain hat ihre
> Marketing-LP auf Vercel und ihre App-Schicht auf einer Emergent-
> Subdomain.

## Endgültige Topologie

| Hostname | Hosting | Inhalt | Status |
|---|---|---|---|
| **`leader-os.de`** | Vercel | Claude-Code Nike-DNA Marketing-Landing | ✅ Live |
| **`www.leader-os.de`** | Vercel | Redirect zu `leader-os.de` | ✅ Live |
| **`app.leader-os.de`** | Emergent | Login + Dashboard + WladBot (User-Bereich) | ⏳ Subdomain einrichten |
| **`leader-check.de`** | Vercel | Claude-Code Light-Nike Marketing-Landing | ⏳ DNS gerade in Arbeit |
| **`start.leader-check.de`** | Emergent | Diagnose-Quiz / Role-Assessment-App | ⏳ Subdomain einrichten |
| **`command-center-229.emergent.host`** | Emergent | Roh-URL, finaler Fallback | ✅ Existiert |

## CTA-Flow

```
USER LANDET HIER             KLICKT                LANDET DANN HIER
─────────────────────────────────────────────────────────────────
leader-os.de            →    "Diagnose starten"  →  start.leader-check.de
leader-os.de            →    "Login"             →  app.leader-os.de/login
leader-os.de            →    "WladBot starten"   →  app.leader-os.de/chat
                                                    (nach Login)

leader-check.de         →    "Diagnose starten"  →  start.leader-check.de
leader-check.de         →    Result eingegeben   →  start.leader-check.de
                                                    (Email gespeichert)
                                                    → später app.leader-os.de
                                                    nach Upgrade
```

## Was du jetzt in Emergent + Vercel einrichten musst

### Subdomain 1: `app.leader-os.de`

**In Emergent (Projekt: LeaderOS App):**
1. Settings → Custom Domains → Add `app.leader-os.de`
2. Notier was Emergent als Target gibt (CNAME oder A)

**In Vercel DNS (`leader-os.de`):**
3. https://vercel.com/aiporators-projects/~/domains/leader-os.de
4. Add Record: Name `app`, Type CNAME (oder A je nach Emergent), Value = was Emergent gab, TTL 60

### Subdomain 2: `start.leader-check.de`

**In Emergent (Projekt: Leader-Check Role-Assessment):**
1. Settings → Custom Domains → Add `start.leader-check.de`
2. Target notieren

**In Vercel DNS (`leader-check.de`):**
3. https://vercel.com/aiporators-projects/~/domains/leader-check.de
4. Add Record: Name `start`, Type CNAME, Value = Emergent-Target

### Im Code (mache ich gleich)

Sobald du mir die Subdomains bestätigst, update ich die CTAs:
- `LandingNav.js` "Login"-Link → `https://app.leader-os.de/login`
- Hero "Werde KI-nativ" CTA → bleibt `/quiz` für lead-capture OR direkt `start.leader-check.de`
- Footer-Links → checken

## Warum diese Struktur stark ist

1. **Klare mentale Trennung:** Marketing-URLs (`.de` Root) für SEO + Werbung, App-URLs (`app.` / `start.`) für authentifizierte Nutzung. User versteht: hier kaufe ich, dort nutze ich.

2. **Domain-Authority bleibt:** Google indexiert leader-os.de und leader-check.de mit Marketing-Content — keine private-app-Routes in der Suche.

3. **DNS-Vereinfachung:** Vercel managed DNS für beide Hauptdomains. Subdomains-Records zeigen auf Emergent. Wenn Vercel ausfällt, läuft App weiter (Subdomain ist Emergent-controlled).

4. **Skalierungspfad klar:** Wenn ihr später `app.leader-os.de` auf Fly.io/Supabase migriert — nur die Subdomain-Records ändern, Marketing-LPs bleiben unverändert.

## start.leader-os.de wird gelöscht

Da `app.leader-os.de` der primäre App-Endpoint wird (semantisch klarer als `start.`), brauchen wir `start.leader-os.de` nicht.

Falls schon eingerichtet:
1. Emergent → das Custom-Domain `start.leader-os.de` entfernen
2. Vercel DNS → den CNAME `start` löschen
