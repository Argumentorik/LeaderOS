# Interaktiver Wlad — Konzept (Iter 155)

## Ziel
„Mit Wlad sprechen“: Nutzer stellt eine Frage (Stimme oder Text), Wlad antwortet in seiner Klonstimme,
sichtbar als Avatar — im Video-Guide, unter jedem Kursvideo und im Chat.

## Machbarkeit (Stand 09/2026)
| Stufe | Technik | Latenz | Kosten | Status |
|---|---|---|---|---|
| A · Text-Chat mit Videokontext | vorhanden („Frag Wlad dazu“ → /chat?prefill, SSE-Stream) | 1,5 s bis erstes Wort | Chat-Credits | LIVE |
| B · Voice-Beta | STT (Whisper) → Chat-Stream → TTS Wlad-Klon (Minimax via Fal, Fallback ElevenLabs) + animierter Avatar (Atem/Blink-Loop, Lautstärke-getriebene Mundbewegung als CSS/Canvas) | 3–8 s pro Antwort (Minimax-Queue 18–55 s gemessen → Fallback nötig) | ~0,02–0,05 $/Antwort | machbar, 1–2 Iterationen |
| C · Echtzeit-Lipsync-Video | OmniHuman/Kling brauchen 5–40 min pro Shot → kein Echtzeit. Alternativen: HeyGen Interactive Avatar / D-ID Agents / Tavus (WebRTC, ~1–2 s Latenz, eigener Vertrag + Avatar-Training aus Wlad-Videomaterial) | 1–2 s | ~0,10–0,30 $/min Gespräch | extern, nicht über Emergent-Key |

## Empfehlung
1. Stufe B jetzt: „Wlad fragen“-Overlay unter Videos mit Mikrofon-Button, Antwort als Audio + Untertitel,
   Avatar-Standbild aus dem Studio-Keyframe mit subtiler Atem-/Blink-Animation. ElevenLabs-Klon (Creator-Tier)
   für < 1 s TTS-Latenz freischalten — Minimax-Queue ist nicht echtzeitfähig.
2. Stufe C nur, wenn ein Anbieter (HeyGen/Tavus) mit eigenem Vertrag gewünscht ist; Integration als iframe/WebRTC-Widget.

## Voraussetzungen
- ElevenLabs Creator-Tier ODER Key mit `voices_write` (Instant-Clone aus 34-s-Probe)
- Kein Backend-Edit während Fal-Produktionen
