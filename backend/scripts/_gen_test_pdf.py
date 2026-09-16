import sys, os, logging
logging.basicConfig(level=logging.WARNING)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.pdf_report import generate_diagnostic_pdf

report = {
    "avg_total": 63,
    "cat_scores": {"ki_strategie": 58, "rhetorik": 71, "kritisches_denken": 64, "entscheidung": 60, "fuehrung": 66, "eq": 55},
    "leadership_roles": {},
    "strongest_role": {"label": "Der Kommunikator", "key": "rhetorik"},
    "weakest_role": {"label": "Emotionale Intelligenz", "key": "eq"},
    "narrative": {
        "recommendation_1": {"title": "Aktives Zuhören", "description": "Lass dein Gegenüber ausreden bevor du antwortest."},
        "recommendation_2": {"title": "Feedback-Routine", "description": "Etabliere woechentliche 1:1s mit klarem SBI-Format."},
        "recommendation_3": {"title": "Delegation", "description": "Gib Verantwortung ab statt nur Aufgaben."},
        "pattern_1_title": "Du entscheidest schnell und kommunizierst dabei zu spaet, sodass dein Team oft im Unklaren bleibt und wertvolle Zeit verliert.",
    },
}
pdf = generate_diagnostic_pdf("Maria Muster", report)
out = "/tmp/test_report.pdf"
with open(out, "wb") as f:
    f.write(pdf)
print("WROTE", out, len(pdf), "bytes")
