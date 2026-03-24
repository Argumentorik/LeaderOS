import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Brain, Shield, Zap, Sparkles, Users, BookOpen, Video, Star, Lock, Check, X, Award, Target, Lightbulb, MessageSquare, Bot, Rocket } from "lucide-react";
import { generateCurriculumPDF } from "../utils/generateCurriculumPDF";

const dontsList = [
  "KI als Ersatz für echte Führung nutzen – sie ist ein Werkzeug, kein Autopilot",
  "Blind ChatGPT-Outputs kopieren, ohne eigene Perspektive einzubringen",
  "KI-generierte Inhalte ohne menschliche Qualitätskontrolle veröffentlichen",
  "Empathie durch Automatisierung ersetzen – dein Team spürt den Unterschied",
  "KI-Tools sammeln statt sie strategisch einzusetzen – weniger ist mehr",
  "Entscheidungen komplett an Algorithmen delegieren – du bleibst der Leader",
  "Glauben, KI-Kompetenz allein macht dich zum besseren Leader",
  "Die menschliche Komponente vergessen: Vertrauen, Kultur, Beziehungen",
];

const InstagramIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>);
const FacebookIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>);
const LinkedInIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);

const socialLinks = [
  { name: "Instagram", icon: InstagramIcon, href: "https://instagram.com/wladhub" },
  { name: "Facebook Gruppe", icon: FacebookIcon, href: "https://facebook.com/groups/wladhub" },
  { name: "LinkedIn", icon: LinkedInIcon, href: "https://linkedin.com" },
];

const standardFeatures = [
  "6 Video-Kurse (5 Leadership + 1 AI)",
  "WLADHUB Plattform · 1 Jahr Zugang",
  "WladBot AI Coach 24/7",
  "AI Leadership Community",
  "Personalized Learning Journey",
  "Leadership Playbooks",
  "License Key per E-Mail",
];

const fastTrackExtras = [
  "Alles aus dem Standardpaket",
  "6x 1:1 Calls mit AI & Leadership Experte",
  "Persönliches Onboarding-Gespräch",
  "Quartals-Reviews (4x pro Jahr)",
  "Abschluss-Call mit Strategie-Update",
  "Exklusive Mastermind-Gruppe",
  "Priority Support & Fast-Track Zugang",
];

export default function HighTicketClose() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <div className="min-h-screen bg-[#030303] pb-24" data-testid="close-page">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-amber-500/4 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge-amber px-4 py-2 text-sm font-medium inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" />
            Deine Leadership-Transformation
          </div>
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4" data-testid="close-headline">
            Du hast dein Profil.
            <br />
            Jetzt hol dir den <span className="text-gradient-amber">Vorsprung.</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            Wähle deinen Weg zur strategischen Dominanz. Der kostenlose Zugang bleibt bestehen – beide Premium-Pakete geben dir zusätzlich sofortigen Vollzugang.
          </p>
          <p className="font-inter text-sm text-green-400/80 mt-3">
            Du kannst die Diagnose und den 30-Tage-Plan auch kostenlos nutzen – keine Zahlung nötig.
          </p>
        </div>

        {/* PRICE STACK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14" data-testid="price-stack">

          {/* Standard – €997 */}
          <div
            data-testid="plan-standard"
            onClick={() => setSelectedPlan("standard")}
            className={`glass-card p-8 cursor-pointer transition-all hover:scale-[1.01] ${
              selectedPlan === "standard" ? "border-amber-500/40 ring-1 ring-amber-500/20" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 text-xs font-bold inline-block mb-3">STANDARD</div>
                <h2 className="font-manrope font-extrabold text-2xl text-white">Leadership System</h2>
              </div>
              <div className="text-right">
                <div className="font-manrope font-extrabold text-4xl text-white" data-testid="price-standard">€997</div>
                <div className="font-inter text-xs text-slate-500">1 Jahr · Verlängerbar</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {standardFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-inter text-sm text-slate-300">{f}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 opacity-50">
                <X className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="font-inter text-sm text-slate-500">1:1 Strategy-Session</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <X className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="font-inter text-sm text-slate-500">Mastermind-Gruppe</span>
              </div>
            </div>

            <button
              data-testid="cta-standard"
              onClick={(e) => { e.stopPropagation(); setSelectedPlan("standard"); }}
              className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${
                selectedPlan === "standard"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 border border-white/10 text-white hover:border-white/20"
              }`}
            >
              {selectedPlan === "standard" ? <Check className="w-4 h-4" /> : null}
              Standard wählen – €997/Jahr
            </button>
          </div>

          {/* Fast Track – €4.997 */}
          <div
            data-testid="plan-fasttrack"
            onClick={() => setSelectedPlan("fasttrack")}
            className={`relative glass-card p-8 cursor-pointer transition-all hover:scale-[1.01] ${
              selectedPlan === "fasttrack" ? "border-amber-500/40 ring-1 ring-amber-500/20" : "border-white/10"
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold">
              EMPFOHLEN
            </div>

            <div className="flex items-center justify-between mb-6 mt-2">
              <div>
                <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-bold inline-block mb-3">FAST TRACK</div>
                <h2 className="font-manrope font-extrabold text-2xl text-white">Leadership Accelerator</h2>
              </div>
              <div className="text-right">
                <div className="font-manrope font-extrabold text-4xl text-white" data-testid="price-fasttrack">€4.997</div>
                <div className="font-inter text-xs text-slate-500">1 Jahr · 6x 1:1 Calls inkl.</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {fastTrackExtras.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-inter text-sm text-slate-300">{f}</span>
                </div>
              ))}
            </div>

            <button
              data-testid="cta-fasttrack"
              onClick={(e) => { e.stopPropagation(); setSelectedPlan("fasttrack"); }}
              className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${
                selectedPlan === "fasttrack"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 border border-white/10 text-white hover:border-white/20"
              }`}
            >
              {selectedPlan === "fasttrack" ? <Check className="w-4 h-4" /> : null}
              Fast Track wählen – €4.997
            </button>
          </div>
        </div>

        {/* Stripe Embed Section (placeholder for user to connect) */}
        {selectedPlan && (
          <div className="glass-card p-8 mb-10 border border-amber-500/20" data-testid="payment-section" id="payment-section">
            <div className="text-center mb-6">
              <h3 className="font-manrope font-bold text-xl text-white mb-2">
                {selectedPlan === "fasttrack" ? "Fast Track – €4.997/Jahr" : "Standard – €997/Jahr"}
              </h3>
              <p className="font-inter text-sm text-slate-400">
                14 Tage kostenlos testen · Jederzeit kündbar
              </p>
            </div>

            {/* Stripe Embed Placeholder */}
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center mb-6" data-testid="stripe-embed-area">
              <Lock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="font-inter text-sm text-slate-400 mb-1">
                Stripe Payment Embed
              </p>
              <p className="font-inter text-xs text-slate-600">
                Zahlungsformular wird hier eingebettet
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Shield className="w-3 h-3" /> SSL-verschlüsselt</span>
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Sichere Zahlung</span>
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Check className="w-3 h-3" /> Sofort-Zugang</span>
            </div>
          </div>
        )}

        {/* What you get comparison */}
        <div className="glass-card p-8 mb-10" data-testid="comparison">
          <h3 className="font-manrope font-bold text-xl text-white mb-6 text-center">Was du bekommst</h3>
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            <div />
            <div className="font-inter text-xs text-slate-500 uppercase tracking-wider">Kostenlos</div>
            <div className="font-inter text-xs text-blue-400 uppercase tracking-wider font-bold">Standard</div>
            <div className="font-inter text-xs text-amber-400 uppercase tracking-wider font-bold">Fast Track</div>
          </div>
          {[
            ["Leadership-Diagnose", true, true, true],
            ["AI Leadership Report", true, true, true],
            ["6 Starter-Kurse", true, true, true],
            ["30-Tage-Plan", true, true, true],
            ["Kostenloses Buch (PDF)", true, true, true],
            ["Premium-Kurse", false, true, true],
            ["WLADHUB Plattform (1 Jahr)", false, true, true],
            ["WladBot AI Coach 24/7", false, true, true],
            ["Community-Zugang", false, true, true],
            ["Learning Journey", false, true, true],
            ["6x 1:1 Calls mit Experte", false, false, true],
            ["Mastermind-Gruppe", false, false, true],
            ["Quartals-Reviews", false, false, true],
            ["Persönliches Onboarding", false, false, true],
          ].map(([label, free, standard, fast], i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-2.5 border-b border-white/5 items-center">
              <span className="font-inter text-sm text-slate-300 text-left">{label}</span>
              <div className="flex justify-center">{free ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-slate-600" />}</div>
              <div className="flex justify-center">{standard ? <Check className="w-4 h-4 text-blue-400" /> : <X className="w-4 h-4 text-slate-600" />}</div>
              <div className="flex justify-center">{fast ? <Check className="w-4 h-4 text-amber-400" /> : <X className="w-4 h-4 text-slate-600" />}</div>
            </div>
          ))}
        </div>

        {/* Bonus: Don'ts List */}
        <div className="glass-card p-8 md:p-10 mb-10" data-testid="bonus-donts">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold">BONUS</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-bold">GRATIS IM REPORT</span>
          </div>
          <h3 className="font-manrope font-extrabold text-xl md:text-2xl text-white mb-2 mt-4">Die KI Don'ts List</h3>
          <p className="font-inter text-sm text-slate-400 mb-6">KI richtig einsetzen, um dich abzuheben – nicht um unterzugehen. Diese Fehler machen 90% der Führungskräfte.</p>
          <div className="space-y-3">
            {dontsList.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/8" data-testid={`dont-${i}`}>
                <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5"><X className="w-3.5 h-3.5 text-red-400" /></div>
                <span className="font-inter text-sm text-slate-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <p className="font-inter text-sm text-amber-300 leading-relaxed">
              <strong>Der Unterschied?</strong> Wer KI als Werkzeug versteht und Leadership als Superkraft einsetzt, wird gesehen, gehört und befördert. Die Don'ts List ist dein Kompass.
            </p>
          </div>
        </div>

        {/* Curriculum Download */}
        <div className="glass-card-subtle p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4" data-testid="curriculum-download">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-blue-400" /></div>
            <div>
              <div className="font-manrope font-bold text-white">Curriculum PDF</div>
              <div className="font-inter text-xs text-slate-500">Alle Kurse + 30-Tage-Plan</div>
            </div>
          </div>
          <button data-testid="curriculum-download-btn" onClick={() => generateCurriculumPDF()} className="btn-secondary px-6 py-3 text-sm font-medium flex items-center gap-2">
            <Download className="w-4 h-4" /> Herunterladen
          </button>
        </div>

        {/* Book Funnel – Kostenloses Buch */}
        <div className="glass-card p-8 mb-10 border border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent" data-testid="book-funnel">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-44 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-12 h-12 text-amber-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="px-3 py-1 rounded-full bg-green-500/15 border border-green-500/20 text-green-400 text-xs font-bold inline-block mb-3">GRATIS BELOHNUNG</div>
              <h3 className="font-manrope font-extrabold text-xl text-white mb-2">
                "Die 5 Rollen einer Führungskraft"
              </h3>
              <p className="font-inter text-sm text-slate-400 mb-1">von Wladislaw Jachtchenko</p>
              <p className="font-inter text-sm text-slate-400 mb-4">
                Deine Belohnung, dass du den Test gemacht hast. Lerne die 5+1 Rollen, die jede Führungskraft meistern muss – direkt vom SPIEGEL-Bestseller-Autor.
              </p>
              <a
                href="https://www.remote-verlag.de/pages/5-rollen-fuehrungskraft"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="book-cta"
                className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Kostenloses Buch sichern
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="text-center mb-14" data-testid="social-section">
          <h3 className="font-manrope font-bold text-lg text-white mb-4">Teile deine Diagnose</h3>
          <div className="flex justify-center gap-4">
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" data-testid={`social-${link.name.toLowerCase().replace(' ', '-')}`}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
                <link.icon />
              </a>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center border-t border-white/5 pt-10" data-testid="final-cta-section">
          <p className="font-inter text-sm text-slate-500 mb-6">Wähle deinen Weg. Oder starte kostenlos.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              data-testid="close-final-free"
              onClick={() => navigate("/roadmap")}
              className="btn-secondary px-8 py-4 font-semibold inline-flex items-center gap-2 border-green-500/30 text-green-400 hover:border-green-500/50"
            >
              Kostenlos starten
            </button>
            <button
              data-testid="close-final-standard"
              onClick={() => { setSelectedPlan("standard"); document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" }); }}
              className="btn-secondary px-8 py-4 font-semibold inline-flex items-center gap-2"
            >
              Standard – €997/Jahr
            </button>
            <button
              data-testid="close-final-fasttrack"
              onClick={() => { setSelectedPlan("fasttrack"); document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" }); }}
              className="btn-amber px-8 py-4 font-semibold inline-flex items-center gap-3"
            >
              Fast Track – €4.997
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="font-inter text-xs text-slate-600 mt-4">
            14 Tage kostenlos testen · 1 Jahr Mitgliedschaft · Verlängerbar · License Key per E-Mail
          </p>
        </div>
      </div>
    </div>
  );
}
