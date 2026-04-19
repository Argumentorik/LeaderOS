import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Brain, Shield, Zap, Sparkles, Users, BookOpen, Video, Star, Lock, Check, X, Award, Target, Lightbulb, MessageSquare, Bot, Rocket, CreditCard, Loader2, Calendar, Phone, Crown, Gift, ChevronRight, ExternalLink } from "lucide-react";
import { generateCurriculumPDF } from "../utils/generateCurriculumPDF";

const API = process.env.REACT_APP_BACKEND_URL;

const starterFeatures = [
  { text: "6 Video-Kurse: Leadership + KI", included: true },
  { text: "50 Credits für leader-os.de", included: true },
  { text: "Leadership-Report als PDF", included: true },
  { text: "30-Tage-Aktionsplan", included: true },
  { text: "Kostenloses Buch (PDF)", included: true },
  { text: "WladBot AI Coach", excluded: true },
  { text: "Plattform-Zugang", excluded: true },
  { text: "1:1 Calls mit Experte", excluded: true },
];

const standardFeatures = [
  { text: "Alles aus dem Starter-Paket", highlight: true },
  { text: "WLADHUB Plattform · 1 Jahr Vollzugang", included: true },
  { text: "WladBot AI Coach 24/7", included: true },
  { text: "AI Leadership Community", included: true },
  { text: "Personalized Learning Journey", included: true },
  { text: "Leadership Playbooks & Frameworks", included: true },
  { text: "License Key per E-Mail", included: true },
  { text: "1:1 Calls mit Experte", excluded: true },
];

const fastTrackFeatures = [
  { text: "Alles aus Standard + Starter", highlight: true },
  { text: "AI Learning Path — personalisierte KI-Lernstrecke", included: true },
  { text: "6x 1:1 Calls mit AI & Leadership Experte", included: true, star: true },
  { text: "Kostenlose AI Integrity Consultation", included: true, star: true },
  { text: "Persönliches Onboarding-Gespräch", included: true },
  { text: "Quartals-Reviews (4x pro Jahr)", included: true },
  { text: "Abschluss-Call mit Strategie-Update", included: true },
  { text: "Exklusive Mastermind-Gruppe", included: true },
  { text: "Priority Support & Fast-Track Zugang", included: true },
  { text: "Termin-Buchung direkt im System", included: true, star: true },
];

export default function HighTicketClose() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingOption, setBillingOption] = useState("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const handleCheckout = async (packageId) => {
    setIsLoading(true);
    try {
      const originUrl = window.location.origin;
      const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
      const res = await fetch(`${API}/api/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          origin_url: originUrl,
          email: user.email || null,
          user_name: user.name || null,
          user_session_id: user.session_id || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    try {
      const res = await fetch(`${API}/api/booking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: bookingDate,
          time: bookingTime,
          name: user.name || null,
          email: user.email || null,
          session_id: user.session_id || null,
          plan: "fasttrack",
        }),
      });
      if (res.ok) setBookingSubmitted(true);
    } catch {
      setBookingSubmitted(true);
    }
  };

  const scrollToPayment = (plan) => {
    setSelectedPlan(plan);
    setTimeout(() => document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
  const report = JSON.parse(localStorage.getItem("emergent_report") || "{}");
  const totalScore = report.avg_total || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="close-page">
      {/* Background */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-28">

        {/* ===== HERO SECTION ===== */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C8FF00]/15 bg-[#C8FF00]/[0.04] mb-6">
            <Sparkles className="w-4 h-4 text-[#C8FF00]" />
            <span className="font-inter text-sm text-[#C8FF00] font-medium">Dein Leadership-Score: {totalScore}%</span>
          </div>
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5" data-testid="close-headline">
            Dein Profil ist analysiert.
            <br />
            <span className="text-gradient-lime">Jetzt die Transformation.</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-3">
            Du weißt jetzt, wo du stehst. Die Frage ist: Bleibst du da — oder nutzt du den Vorsprung, den 99% nicht haben?
          </p>
        </div>

        {/* ===== SCARCITY BAR ===== */}
        <div className="flex items-center justify-center gap-6 mb-14 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
            <span className="font-inter text-xs text-slate-500">47 Plätze im Fast Track noch verfügbar</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-inter text-xs text-slate-500">14 Tage Testphase · Jederzeit kündbar</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-inter text-xs text-slate-500">SSL-verschlüsselt · Stripe</span>
          </div>
        </div>

        {/* ===== PRICE STACK – 3 TIERS ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14" data-testid="price-stack">

          {/* TIER 1: STARTER — 199 EUR */}
          <div
            data-testid="plan-starter"
            onClick={() => setSelectedPlan("starter")}
            className={`glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] ${
              selectedPlan === "starter" ? "border-white/20 ring-1 ring-white/10" : "border-white/[0.06]"
            }`}
          >
            <div className="mb-5">
              <div className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-[10px] font-bold tracking-wider inline-block mb-4">STARTER</div>
              <h2 className="font-manrope font-extrabold text-xl text-white mb-1">Video Lessons</h2>
              <p className="font-inter text-xs text-slate-500">Dein Einstieg ins Leadership-System</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-manrope font-extrabold text-4xl text-white" data-testid="price-starter">199</span>
                <span className="font-inter text-base text-slate-500">EUR</span>
              </div>
              <div className="font-inter text-xs text-slate-600 mt-1">Einmalig · Sofortzugang</div>
            </div>

            <div className="space-y-3 mb-7">
              {starterFeatures.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 ${f.excluded ? "opacity-35" : ""}`}>
                  {f.excluded ? <X className="w-4 h-4 text-slate-600 shrink-0" /> : <Check className="w-4 h-4 text-white shrink-0" />}
                  <span className="font-inter text-sm text-slate-300">{f.text}</span>
                </div>
              ))}
            </div>

            <button
              data-testid="cta-starter"
              onClick={(e) => { e.stopPropagation(); scrollToPayment("starter"); }}
              className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${
                selectedPlan === "starter"
                  ? "bg-white text-[#0a0a0a]"
                  : "bg-white/[0.04] border border-white/[0.08] text-white hover:border-white/15"
              }`}
            >
              Starter — 199 EUR
            </button>
          </div>

          {/* TIER 2: STANDARD — 997 EUR */}
          <div
            data-testid="plan-standard"
            onClick={() => setSelectedPlan("standard")}
            className={`glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] ${
              selectedPlan === "standard" ? "border-[#C8FF00]/25 ring-1 ring-[#C8FF00]/10" : "border-white/[0.06]"
            }`}
          >
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-bold tracking-wider">STANDARD</div>
                <div className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[10px] font-bold">BELIEBT</div>
              </div>
              <h2 className="font-manrope font-extrabold text-xl text-white mb-1">Leadership System</h2>
              <p className="font-inter text-xs text-slate-500">Vollzugang zur Plattform + KI-Coach</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-manrope font-extrabold text-4xl text-white" data-testid="price-standard">997</span>
                <span className="font-inter text-base text-slate-500">EUR</span>
              </div>
              <div className="font-inter text-xs text-slate-600 mt-1">Pro Jahr · oder 83,08 EUR/Monat</div>
            </div>

            <div className="space-y-3 mb-7">
              {standardFeatures.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 ${f.excluded ? "opacity-35" : ""}`}>
                  {f.excluded ? <X className="w-4 h-4 text-slate-600 shrink-0" /> :
                   f.highlight ? <ChevronRight className="w-4 h-4 text-[#C8FF00] shrink-0" /> :
                   <Check className="w-4 h-4 text-[#C8FF00] shrink-0" />}
                  <span className={`font-inter text-sm ${f.highlight ? "text-[#C8FF00] font-semibold" : "text-slate-300"}`}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              data-testid="cta-standard"
              onClick={(e) => { e.stopPropagation(); scrollToPayment("standard"); }}
              className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${
                selectedPlan === "standard"
                  ? "bg-[#C8FF00] text-[#0a0a0a] shadow-lg shadow-[#C8FF00]/15"
                  : "bg-white/[0.04] border border-white/[0.08] text-white hover:border-white/15"
              }`}
            >
              Standard — 997 EUR
            </button>
          </div>

          {/* TIER 3: FAST TRACK — 6.970 EUR */}
          <div
            data-testid="plan-fasttrack"
            onClick={() => setSelectedPlan("fasttrack")}
            className={`relative glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] overflow-hidden ${
              selectedPlan === "fasttrack" ? "border-[#C8FF00]/30 ring-1 ring-[#C8FF00]/15" : "border-[#C8FF00]/10"
            }`}
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#C8FF00]/[0.08] via-[#C8FF00]/[0.02] to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#C8FF00]/[0.04] rounded-full blur-[60px] pointer-events-none" />

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#C8FF00] text-[#0a0a0a]">
                <Crown className="w-3.5 h-3.5" />
                <span className="text-xs font-bold tracking-wide">EMPFOHLEN</span>
              </div>
            </div>

            <div className="relative">
              <div className="mb-5 mt-3">
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-bold tracking-wider">FAST TRACK</div>
                  <div className="px-2.5 py-1 rounded-lg bg-[#C8FF00]/[0.06] border border-[#C8FF00]/10 text-[#C8FF00] text-[10px] font-bold tracking-wider animate-pulse">AI LEARNING PATH</div>
                </div>
                <h2 className="font-manrope font-extrabold text-xl text-white mb-1">Leadership Accelerator</h2>
                <p className="font-inter text-xs text-slate-500">Persönliche Betreuung + KI-System + Calls</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-manrope font-extrabold text-4xl text-[#C8FF00]" data-testid="price-fasttrack">6.970</span>
                  <span className="font-inter text-base text-[#C8FF00]/60">EUR</span>
                </div>
                <div className="font-inter text-xs text-slate-600 mt-1">Pro Jahr · 6x 1:1 Calls · AI Consultation</div>
              </div>

              {/* AI Learning Path Card */}
              <div className="mb-5 p-4 rounded-xl bg-[#C8FF00]/[0.04] border border-[#C8FF00]/10">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#C8FF00]/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-[#C8FF00]" />
                  </div>
                  <div>
                    <span className="font-manrope font-bold text-sm text-[#C8FF00]">AI Learning Path</span>
                    <span className="font-inter text-[10px] text-[#C8FF00]/50 ml-2">+ Free AI Consultation</span>
                  </div>
                </div>
                <p className="font-inter text-xs text-slate-400 leading-relaxed">
                  Personalisierte KI-Lernstrecke + wöchentliche Challenges + Termin-Buchung für Expertengespräch direkt im System.
                </p>
              </div>

              {/* Call Booking Preview */}
              <div className="mb-5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C8FF00]/[0.06] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#C8FF00]" />
                </div>
                <div className="flex-1">
                  <div className="font-inter text-xs text-white font-medium">Termin buchen</div>
                  <div className="font-inter text-[10px] text-slate-500">Wähle einen Termin mit deinem Experten</div>
                </div>
                <Phone className="w-4 h-4 text-slate-600" />
              </div>

              <div className="space-y-2.5 mb-6">
                {fastTrackFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {f.highlight ? <ChevronRight className="w-4 h-4 text-[#C8FF00] shrink-0" /> :
                     f.star ? <Star className="w-4 h-4 text-[#C8FF00] shrink-0" /> :
                     <Check className="w-4 h-4 text-[#C8FF00] shrink-0" />}
                    <span className={`font-inter text-sm ${f.highlight ? "text-[#C8FF00] font-semibold" : f.star ? "text-white font-medium" : "text-slate-300"}`}>{f.text}</span>
                  </div>
                ))}
              </div>

              <button
                data-testid="cta-fasttrack"
                onClick={(e) => { e.stopPropagation(); scrollToPayment("fasttrack"); }}
                className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  selectedPlan === "fasttrack"
                    ? "bg-[#C8FF00] text-[#0a0a0a] shadow-lg shadow-[#C8FF00]/20"
                    : "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] hover:bg-[#C8FF00]/15"
                }`}
              >
                {selectedPlan === "fasttrack" && <Check className="w-4 h-4" />}
                Fast Track — 6.970 EUR
              </button>
            </div>
          </div>
        </div>

        {/* ===== PAYMENT SECTION ===== */}
        {selectedPlan && (
          <div className="glass-card p-8 mb-10 border border-[#C8FF00]/15" data-testid="payment-section" id="payment-section">
            <div className="text-center mb-6">
              <h3 className="font-manrope font-bold text-xl text-white mb-2">
                {selectedPlan === "fasttrack" ? "Fast Track · AI Learning Path — 6.970 EUR" :
                 selectedPlan === "standard" ? "Standard — 997 EUR/Jahr" :
                 "Starter · Video Lessons — 199 EUR"}
              </h3>
              <p className="font-inter text-sm text-slate-400">
                14 Tage kostenlos testen · Jederzeit kündbar · Sofortzugang
              </p>
            </div>

            {/* Billing for Standard */}
            {selectedPlan === "standard" && (
              <div className="flex gap-3 justify-center mb-6" data-testid="billing-options">
                <button onClick={() => setBillingOption("yearly")}
                  className={`px-5 py-3 rounded-xl font-inter text-sm font-medium transition-all ${billingOption === "yearly" ? "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00]" : "bg-white/[0.02] border border-white/[0.06] text-slate-400"}`}>
                  <div className="font-manrope font-bold text-lg">997 EUR</div>
                  <div className="text-xs opacity-70">Einmalig / Jahr</div>
                </button>
                <button onClick={() => setBillingOption("monthly")}
                  className={`px-5 py-3 rounded-xl font-inter text-sm font-medium transition-all ${billingOption === "monthly" ? "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00]" : "bg-white/[0.02] border border-white/[0.06] text-slate-400"}`}>
                  <div className="font-manrope font-bold text-lg">83,08 EUR</div>
                  <div className="text-xs opacity-70">12 Monatsraten</div>
                </button>
              </div>
            )}

            {/* Booking section for Fast Track */}
            {selectedPlan === "fasttrack" && (
              <div className="mb-6 p-5 rounded-xl bg-[#C8FF00]/[0.03] border border-[#C8FF00]/10">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-[#C8FF00]" />
                  <div>
                    <div className="font-manrope font-bold text-sm text-white">Kostenloses Erstgespräch buchen</div>
                    <div className="font-inter text-xs text-slate-500">Lerne deinen Experten kennen + AI Integrity Consultation</div>
                  </div>
                </div>
                {!showBooking ? (
                  <button onClick={() => setShowBooking(true)} data-testid="show-booking-btn"
                    className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-inter text-sm font-medium hover:border-[#C8FF00]/20 transition-all flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Termin wählen & kostenloses Gespräch sichern
                  </button>
                ) : bookingSubmitted ? (
                  <div className="text-center py-3">
                    <Check className="w-6 h-6 text-[#C8FF00] mx-auto mb-2" />
                    <p className="font-inter text-sm text-[#C8FF00]">Anfrage gesendet! Wir melden uns innerhalb von 24h.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-inter text-xs text-slate-500 mb-1 block">Datum</label>
                      <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} data-testid="booking-date"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
                    </div>
                    <div>
                      <label className="font-inter text-xs text-slate-500 mb-1 block">Uhrzeit</label>
                      <select value={bookingTime} onChange={e => setBookingTime(e.target.value)} data-testid="booking-time"
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none">
                        <option value="">Wählen...</option>
                        <option value="10:00">10:00 Uhr</option>
                        <option value="11:00">11:00 Uhr</option>
                        <option value="14:00">14:00 Uhr</option>
                        <option value="15:00">15:00 Uhr</option>
                        <option value="16:00">16:00 Uhr</option>
                      </select>
                    </div>
                    <button onClick={handleBooking} disabled={!bookingDate || !bookingTime} data-testid="submit-booking-btn"
                      className="col-span-2 py-3 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] font-inter text-sm font-medium disabled:opacity-30 hover:bg-[#C8FF00]/15 transition-all">
                      Kostenloses Gespräch anfragen
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Button */}
            <button
              data-testid="stripe-checkout-btn"
              disabled={isLoading}
              onClick={() => {
                if (selectedPlan === "fasttrack") handleCheckout("fasttrack_yearly");
                else if (selectedPlan === "starter") handleCheckout("starter");
                else if (billingOption === "monthly") handleCheckout("standard_monthly");
                else handleCheckout("standard_yearly");
              }}
              className="w-full py-5 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all disabled:opacity-50 mb-4"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Wird geladen...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Jetzt sicher bezahlen — {selectedPlan === "fasttrack" ? "6.970 EUR" : selectedPlan === "starter" ? "199 EUR" : billingOption === "monthly" ? "83,08 EUR/Monat" : "997 EUR"}</>
              )}
            </button>

            <div className="flex items-center justify-center gap-6 flex-wrap">
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Shield className="w-3 h-3" /> SSL-verschlüsselt</span>
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Powered by Stripe</span>
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Check className="w-3 h-3" /> 14 Tage Trial</span>
              <span className="font-inter text-xs text-slate-600 flex items-center gap-1"><Gift className="w-3 h-3" /> License Key per E-Mail</span>
            </div>
          </div>
        )}

        {/* ===== COMPARISON TABLE ===== */}
        <div className="glass-card p-8 mb-10 overflow-hidden" data-testid="comparison">
          <h3 className="font-manrope font-bold text-xl text-white mb-8 text-center">Was du in jedem Paket bekommst</h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 gap-4 text-center mb-4 min-w-[600px]">
              <div />
              <div className="font-inter text-xs text-slate-400 uppercase tracking-wider font-bold">Starter · 199 EUR</div>
              <div className="font-inter text-xs text-white uppercase tracking-wider font-bold">Standard · 997 EUR</div>
              <div className="font-inter text-xs text-[#C8FF00] uppercase tracking-wider font-bold">Fast Track · 6.970 EUR</div>
            </div>
            {[
              ["Leadership-Diagnose + KI-Report", true, true, true],
              ["6 Video-Kurse", true, true, true],
              ["30-Tage-Aktionsplan", true, true, true],
              ["50 Credits für leader-os.de", true, true, true],
              ["Kostenloses Buch (PDF)", true, true, true],
              ["WLADHUB Plattform (1 Jahr)", false, true, true],
              ["WladBot AI Coach 24/7", false, true, true],
              ["Community-Zugang", false, true, true],
              ["Personalized Learning Journey", false, true, true],
              ["Leadership Playbooks", false, true, true],
              ["AI Learning Path", false, false, true],
              ["6x 1:1 Calls mit Experte", false, false, true],
              ["AI Integrity Consultation", false, false, true],
              ["Termin-Buchung im System", false, false, true],
              ["Mastermind-Gruppe", false, false, true],
              ["Quartals-Reviews", false, false, true],
              ["Priority Support", false, false, true],
            ].map(([label, starter, standard, fast], i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-2.5 border-b border-white/[0.03] items-center min-w-[600px]">
                <span className="font-inter text-sm text-slate-300 text-left">{label}</span>
                <div className="flex justify-center">{starter ? <Check className="w-4 h-4 text-white/70" /> : <X className="w-4 h-4 text-slate-700" />}</div>
                <div className="flex justify-center">{standard ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-slate-700" />}</div>
                <div className="flex justify-center">{fast ? <Check className="w-4 h-4 text-[#C8FF00]" /> : <X className="w-4 h-4 text-slate-700" />}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BOOK FUNNEL ===== */}
        <div className="glass-card p-8 mb-10 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.02]" data-testid="book-funnel">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-40 rounded-xl bg-[#C8FF00]/[0.06] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-10 h-10 text-[#C8FF00]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-xs font-bold inline-block mb-3">IN JEDEM PAKET ENTHALTEN</div>
              <h3 className="font-manrope font-extrabold text-xl text-white mb-2">"Die 6 Rollen einer Führungskraft"</h3>
              <p className="font-inter text-sm text-slate-400 mb-4">von Wladislaw Jachtchenko · SPIEGEL-Bestseller-Autor</p>
              <a href="https://www.remote-verlag.de/pages/5-rollen-fuehrungskraft" target="_blank" rel="noopener noreferrer" data-testid="book-cta"
                className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Buch ansehen <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* ===== CURRICULUM DOWNLOAD ===== */}
        <div className="glass-card-subtle p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4" data-testid="curriculum-download">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-slate-400" /></div>
            <div>
              <div className="font-manrope font-bold text-white">Curriculum PDF</div>
              <div className="font-inter text-xs text-slate-500">Alle Kurse + 30-Tage-Plan als Download</div>
            </div>
          </div>
          <button data-testid="curriculum-download-btn" onClick={() => generateCurriculumPDF()} className="btn-secondary px-6 py-3 text-sm font-medium flex items-center gap-2">
            <Download className="w-4 h-4" /> Herunterladen
          </button>
        </div>

        {/* ===== FINAL CTA ===== */}
        <div className="text-center border-t border-white/[0.04] pt-12 pb-4" data-testid="final-cta-section">
          <h2 className="font-manrope font-extrabold text-2xl md:text-3xl text-white mb-3">
            Die Entscheidung liegt bei dir.
          </h2>
          <p className="font-inter text-base text-slate-500 mb-8 max-w-xl mx-auto">
            Dein Score ist {totalScore}%. Entweder du änderst das — oder nicht. Aber in 12 Monaten wirst du wissen, ob du dich heute richtig entschieden hast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToPayment("starter")} className="btn-secondary px-6 py-4 font-semibold inline-flex items-center gap-2">
              Starter — 199 EUR
            </button>
            <button onClick={() => scrollToPayment("standard")} className="btn-secondary px-6 py-4 font-semibold inline-flex items-center gap-2 border-[#C8FF00]/15 text-[#C8FF00]">
              Standard — 997 EUR
            </button>
            <button onClick={() => scrollToPayment("fasttrack")} data-testid="close-final-fasttrack"
              className="btn-primary px-8 py-4 font-semibold inline-flex items-center gap-3">
              <Crown className="w-4 h-4" />
              Fast Track — 6.970 EUR
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="font-inter text-xs text-slate-600 mt-6">
            14 Tage kostenlos testen · License Key per E-Mail · SSL-verschlüsselt
          </p>
          <p className="font-inter text-xs text-slate-600 mt-3">
            Bereits einen Key? <button onClick={() => navigate("/activate")} className="text-[#C8FF00]/70 hover:text-[#C8FF00] underline" data-testid="activate-link">Hier aktivieren</button>
          </p>
        </div>
      </div>
    </div>
  );
}
