# Remotion-Video für leader-os.de

> Marketing-Video von der Landing-Page mit Remotion (React-Component-basierter
> Video-Generator). Output: 1080×1920 (Reels/TikTok/Shorts) und 1920×1080 (YouTube).

## Warum Remotion

- **Same DNA**: Remotion ist React. Wir nutzen `frontend/DESIGN.md` Tokens 1:1.
- **Daten-getrieben**: Headlines, Cues, Frame-Timings leben in einer Datei
  (analog `contentAds.js`). Edit → render → MP4.
- **Reproduzierbar**: Brand-konsistent, keine Tool-Drift.

## Setup (separates Projekt im Repo)

Remotion wird als eigenes Sub-Projekt unter `remotion/` angelegt, **NICHT** in
`frontend/`. Grund: Remotion bringt FFmpeg, ESBuild und eine schwere
Toolchain — der Vercel-Frontend-Build muss davon nichts wissen.

```bash
mkdir -p remotion
cd remotion
npm init -y
npm install remotion @remotion/cli @remotion/bundler @remotion/renderer react react-dom
npx remotion init   # erstellt src/Composition.tsx, src/Root.tsx
```

Danach in `remotion/package.json`:

```json
{
  "scripts": {
    "preview": "remotion preview src/Root.tsx",
    "render:reel": "remotion render src/Root.tsx LeaderOSReel out/reel.mp4",
    "render:youtube": "remotion render src/Root.tsx LeaderOSYouTube out/youtube.mp4"
  }
}
```

## Inhalte (was das Video zeigt)

Mapping auf bestehende Landing-Sektionen:

| Sekunde | Frame | Was |
|---|---|---|
| 0–3   | Logo-Reveal       | Schwarzer Canvas, Lime-`W` morpht zum LeaderOS-Logo |
| 3–9   | Hero-Tagline      | "Werde KI-nativ." Outfit-Italic von 0 auf 188px, Lime-Punkt pulst |
| 9–14  | Dichotomie        | "KI bestimmt das Tempo." links · "Du den Kurs." rechts mit Lime-Splitter |
| 14–20 | Track-Field       | SVG-Animation aus TrackFieldVisual.js, Läufer scrollt zum Ziel |
| 20–28 | Frameworks-Wall   | 11 Framework-Namen rasen vorbei (SEXIER, 5 Rollen, …) |
| 28–35 | App-Preview-Tilt  | Dashboard-Mockup kippt rein, Drill-Count zählt 0 → 23% |
| 35–42 | Testimonial-Burst | 3 Quotes hintereinander mit Wlad-Pixel Sign-Guy |
| 42–48 | 50 Free Credits   | Unlock-Animation aus MiniChallenge.js |
| 48–55 | Final-CTA         | "Wer heute zögert…" Headline + Diagnose-Button + leader-os.de |

Komponenten die wir direkt portieren können:
- `TrackFieldVisual.js` → identische SVG
- `MiniChallenge.js` Score-Tiles → static frame
- `WladSignGuy` Pixel-SVG → Maskott-Frame

## Workflow zum Render

```bash
cd remotion
npm run preview              # Live-Preview im Browser
npm run render:reel          # 1080×1920 für Instagram/TikTok
npm run render:youtube       # 1920×1080 für YouTube/LinkedIn
```

Outputs landen in `remotion/out/`, **NICHT** gecommittet (gitignored).

## Programmatic Render auf Vercel (später)

Wenn wir Videos on-demand generieren wollen (z.B. personalisierte Score-Reveals):

1. Vercel Serverless Function in `api/render-video.ts`
2. Nimmt `score`, `name` als Query-Params
3. Ruft `@remotion/renderer` programmatisch
4. Returnt MP4-Stream

Erfordert Vercel Pro (FFmpeg in Lambda) — Cold-Start ~10s.

## Status

Aktuell: **Doc-only**. Wenn du das Video bauen willst, sag's, ich erstelle den
`remotion/`-Ordner mit der Composition-Struktur. Erste Render-Iteration dauert
~1 Sprint-Day, danach ist es ein Edit-Push-Loop wie bei `contentAds.js`.
