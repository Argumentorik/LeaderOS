"""Iter 92.34 (Mert Go-Live §A=b): Intent Classification Bot.

Pipeline: user message → classify into 1 of 7 intents → caller routes to the
right system prompt + RAG strategy. This is what makes Leader-OS feel
"intelligent" instead of "another wrapper around GPT" — the system DECIDES
what coaching pattern to apply before answering.

Cost: 1 cheap LLM call per user message (~200ms latency, ~$0.0001).
Failover: if classification call fails, defaults to 'general_coaching' (safe).
"""
from __future__ import annotations
import json
import os
from typing import Literal, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage

Intent = Literal[
    "speech_coaching",      # "Ich habe morgen eine Präsentation"
    "speech_practice",      # "Lass uns meinen Pitch üben"
    "theory",               # "Was ist Framing?"
    "general_coaching",     # "Wie werde ich überzeugender?"
    "video_analysis",       # "Analysier dieses Video"
    "feedback",             # "Gib mir Feedback zu meiner Argumentation"
    "playbook",             # "Erstelle ein Playbook für…"
]

INTENT_LABELS = {
    "speech_coaching": "🎤 Speech Coaching",
    "speech_practice": "🎯 Speech Practice",
    "theory": "📚 Theorie & Wissen",
    "general_coaching": "🧭 Allgemeines Coaching",
    "video_analysis": "🎥 Video Analyse",
    "feedback": "💬 Feedback",
    "playbook": "📋 Playbook",
}

CLASSIFY_PROMPT = """Du bist Leader-OS Intent-Classifier. Klassifiziere die User-Message in EXAKT EINE von 7 Kategorien.

KATEGORIEN:
- speech_coaching: User hat eine bevorstehende Rede/Pitch/Präsentation/Meeting und braucht Vorbereitung (z.B. "Ich habe morgen eine Präsentation")
- speech_practice: User will eine konkrete Rede/Pitch JETZT üben/durchgehen (z.B. "Lass uns meinen Pitch durchgehen")
- theory: User fragt ein theoretisches Wissens-Thema (z.B. "Was ist Framing?", "Erklär mir SEXIER")
- general_coaching: Generelle Coaching-Anfrage ohne konkretes Event (z.B. "Wie werde ich überzeugender?")
- video_analysis: User will ein Video hochladen oder ein bereits hochgeladenes analysieren
- feedback: User hat schon etwas formuliert/geschrieben und will Feedback dazu
- playbook: User möchte einen strukturierten Plan/Playbook/Workflow erstellt haben (z.B. "Bau mir ein Playbook für Vorstandsmeeting")

Antworte NUR mit JSON in diesem exakten Format:
{"intent": "<key>", "confidence": <0.0-1.0>, "reasoning": "<1-Satz auf Deutsch>"}

Keine Markdown, keine Code-Fences, kein extra Text."""


async def classify_intent(message: str, override: Optional[Intent] = None) -> dict:
    """Return {intent, confidence, reasoning, label, source}.

    `override`: if user explicitly chose an intent in the UI, skip the LLM call
    and return their choice as the source-of-truth (confidence 1.0).
    """
    # Manual override always wins
    if override and override in INTENT_LABELS:
        return {
            "intent": override,
            "confidence": 1.0,
            "reasoning": "User-Override",
            "label": INTENT_LABELS[override],
            "source": "override",
        }

    if not message or not message.strip():
        return {
            "intent": "general_coaching",
            "confidence": 0.0,
            "reasoning": "Leere Eingabe",
            "label": INTENT_LABELS["general_coaching"],
            "source": "fallback_empty",
        }

    try:
        key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not key:
            raise RuntimeError("EMERGENT_LLM_KEY missing")
        # gpt-4o-mini chosen for cost + speed; classification doesn't need GPT-5.
        chat = (
            LlmChat(api_key=key, session_id="intent-classify", system_message=CLASSIFY_PROMPT)
            .with_model("openai", "gpt-4o-mini")
        )
        raw = await chat.send_message(UserMessage(text=message.strip()[:600]))
        # Strip any accidental code fences
        body = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(body)
        intent = parsed.get("intent", "general_coaching")
        if intent not in INTENT_LABELS:
            intent = "general_coaching"
        conf = float(parsed.get("confidence", 0.6))
        return {
            "intent": intent,
            "confidence": max(0.0, min(1.0, conf)),
            "reasoning": (parsed.get("reasoning") or "")[:200],
            "label": INTENT_LABELS[intent],
            "source": "llm",
        }
    except Exception as e:  # noqa: BLE001
        # Failover — default to general_coaching so UX never breaks.
        return {
            "intent": "general_coaching",
            "confidence": 0.0,
            "reasoning": f"Classify-Fallback ({type(e).__name__})",
            "label": INTENT_LABELS["general_coaching"],
            "source": "fallback_error",
        }
