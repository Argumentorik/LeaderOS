import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Shield, Zap, Sparkles, Users, BookOpen, Star, Lock, Check, X, Award, Lightbulb, MessageSquare, Bot, CreditCard, Loader2, Crown, Gift, ChevronRight, Building2, Calculator, Briefcase, GraduationCap } from "lucide-react";
import { generateCurriculumPDF } from "../utils/generateCurriculumPDF";

const API = process.env.REACT_APP_BACKEND_URL;

// === LEADERSHIP OS (997 EUR) — 3 Payment Options ===
const PAYMENT_OPTIONS = [
  { id: "leader_os_full",  label: "Einmalzahlung",   total: 997,   per: "997 EUR",          note: "Bester Preis",      surcharge: 0 },
  { id: "leader_os_2rate", label: "2 Raten",         total: 1100,  per: "2 × 550 EUR",      note: "+103 EUR Aufschlag",  surcharge: 103 },
  { id: "leader_os_12rate",label: "12 Monatsraten",  total: 1188,  per: "12 × 99 EUR",      note: "+191 EUR Aufschlag",  surcharge: 191 },
];

const osFeatures = [
  { text: "14 Tage Testphase · jederzeit kündbar", highlight: true },
  { text: "Vollzugang zur WLADHUB Plattform · 1 Jahr", included: true },
  { text: "12 Premium-Videokurse (1 neuer Kurs jeden Monat)", included: true, star: true },
  { text: "Wert pro Kurs: 199 EUR · Gesamtwert: 2.388 EUR", subline: true },
  { text: "WladBot AI Coach 24/7", included: true },
  { text: "Personalisierte Learning Journey", included: true },
  { text: "Leadership Playbooks & Frameworks", included: true },
  { text: "License Key per E-Mail · Sofortzugang", included: true },
];

const osPlusFeatures = [
  { text: "Alles aus Leadership OS", highlight: true },
  { text: "12 Einzelcoachings mit Argumentorik-Leadership Coaches", included: true, star: true },
  { text: "Wert pro Coaching: 299 EUR · Gesamt: 3.588 EUR", subline: true },
  { text: "Persönliche Lernbegleitung über 12 Monate", included: true },
  { text: "Direkter Zugang zu Top-Coaches", included: true },
  { text: "Quartals-Reviews mit Strategie-Update", included: true },
  { text: "Priority Support · 24h Response", included: true },
];

const enterpriseFeatures = [
  { text: "B2B-Lizenzen für dein Unternehmen", highlight: true },
  { text: "Volumen-Rabatte: 10% – 50% je nach Mitarbeiterzahl", included: true, star: true },
  { text: "Zentrales Admin-Dashboard für alle Lizenzen", included: true },
  { text: "Onboarding-Workshop mit Wlad", included: true },
  { text: "Coachings optional zubuchbar", included: true },
  { text: "Individuelle Vertrags- und Rechnungsstellung", included: true },
  { text: "Dedizierter Account Manager", included: true },
];

const ENTERPRISE_TIERS = [
  { from: 5,   discount: 10 },
  { from: 10,  discount: 15 },
  { from: 20,  discount: 20 },
  { from: 50,  discount: 30 },
  { from: 100, discount: 40 },
  { from: 200, discount: 50 },
];

export default function HighTicketClose() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentOption, setPaymentOption] = useState("leader_os_full");
  const [isLoading, setIsLoading] = useState(false);

  // Enterprise calculator
  const [employees, setEmployees] = useState(20);
  const [enterprisePricing, setEnterprisePricing] = useState(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiry, setInquiry] = useState({ company: "", contact_name: "", email: "", phone: "", message: "", include_coaching: false });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
  const report = JSON.parse(localStorage.getItem("emergent_report") || "{}");
  const totalScore = report.avg_total || 0;

  // Pre-fill inquiry from user data
  useEffect(() => {
    setInquiry(prev => ({
      ...prev,
      contact_name: prev.contact_name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [user.name, user.email]);

  // Live discount calculation
  useEffect(() => {
    if (employees < 1) { setEnterprisePricing(null); return; }
    const tier = [...ENTERPRISE_TIERS].reverse().find(t => employees >= t.from);
    const discount = tier ? tier.discount : 0;
    const perSeat = +(997 * (1 - discount / 100)).toFixed(2);
    const total = +(perSeat * employees).toFixed(2);
    setEnterprisePricing({ seats: employees, discount_pct: discount, per_seat: perSeat, total });
  }, [employees]);

  const handleCheckout = async (packageId) => {
    setIsLoading(true);
    try {
      const originUrl = window.location.origin;
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
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    setInquiryError("");
    if (!inquiry.company || !inquiry.contact_name || !inquiry.email) {
      setInquiryError("Bitte fülle Firma, Name und E-Mail aus.");
      return;
    }
    setInquiryLoading(true);
    try {
      const res = await fetch(`${API}/api/enterprise/inquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: inquiry.company,
          contact_name: inquiry.contact_name,
          email: inquiry.email,
          phone: inquiry.phone || null,
          employee_count: employees,
          include_coaching: inquiry.include_coaching,
          message: inquiry.message || null,
        }),
      });
      if (res.ok) {
        setInquirySubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setInquiryError(err.detail || "Anfrage konnte nicht gesendet werden.");
      }
    } catch {
      setInquiryError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setInquiryLoading(false);
    }
  };

  const scrollToPayment = (plan) => {
    setSelectedPlan(plan);
    setTimeout(() => document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const scrollToEnterprise = () => {
    setShowInquiry(true);
    setTimeout(() => document.getElementById("enterprise-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24" data-testid="close-page">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#C8FF00]/[0.02] rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#C8FF00]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-28">

        {/* HERO */}
        <div className="text-center mb-6">
          {totalScore > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C8FF00]/15 bg-[#C8FF00]/[0.04] mb-6">
              <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              <span className="font-inter text-sm text-[#C8FF00] font-medium">Dein Leadership-Score: {totalScore}%</span>
            </div>
          )}
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5" data-testid="close-headline">
            Dein Profil ist analysiert.
            <br />
            <span className="text-gradient-lime">Jetzt die Transformation.</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-3">
            Wähle das Programm, das zu dir passt — von individuellem Self-Learning bis zur Enterprise-Lösung für dein gesamtes Team.
          </p>
        </div>

        {/* TRUST BAR */}
        <div className="flex items-center justify-center gap-6 mb-14 flex-wrap">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" /><span className="font-inter text-xs text-slate-500">14 Tage Testphase auf alle Pakete</span></div>
          <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-slate-600" /><span className="font-inter text-xs text-slate-500">SSL-verschlüsselt · Stripe</span></div>
          <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-600" /><span className="font-inter text-xs text-slate-500">DSGVO-konform</span></div>
        </div>

        {/* ===== 3-TIER PRICE STACK ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14" data-testid="price-stack">

          {/* TIER 1: LEADERSHIP OS */}
          <div
            data-testid="plan-leader-os"
            onClick={() => scrollToPayment("leader_os")}
            className={`glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] ${selectedPlan === "leader_os" ? "border-[#C8FF00]/25 ring-1 ring-[#C8FF00]/10" : "border-white/[0.06]"}`}
          >
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-bold tracking-wider">LEADERSHIP OS</div>
                <div className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[10px] font-bold">EINSTIEG</div>
              </div>
              <h2 className="font-manrope font-extrabold text-xl text-white mb-1">Self-Driven Leadership</h2>
              <p className="font-inter text-xs text-slate-500">Plattform + 12 Videokurse + KI-Coach</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-manrope font-extrabold text-4xl text-white" data-testid="price-leader-os">997</span>
                <span className="font-inter text-base text-slate-500">EUR</span>
                <span className="font-inter text-xs text-slate-600 ml-2">/ 1 Jahr</span>
              </div>
              <div className="font-inter text-xs text-slate-600 mt-1">Ratenzahlung möglich · 14 Tage Trial</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#C8FF00]/[0.08] border border-[#C8FF00]/15">
                <Gift className="w-3 h-3 text-[#C8FF00]" />
                <span className="font-inter text-[10px] text-[#C8FF00] font-semibold">Wert der 12 Kurse: 2.388 EUR</span>
              </div>
            </div>

            <div className="space-y-3 mb-7">
              {osFeatures.map((f, i) => (
                <div key={i} className={`flex items-start gap-3 ${f.subline ? "ml-7 -mt-1" : ""}`}>
                  {f.subline ? null :
                   f.highlight ? <Sparkles className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" /> :
                   f.star ? <Star className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" /> :
                   <Check className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" />}
                  <span className={`font-inter ${f.subline ? "text-xs text-[#C8FF00]/70 italic" : f.highlight ? "text-sm text-[#C8FF00] font-semibold" : "text-sm text-slate-300"}`}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              data-testid="cta-leader-os"
              onClick={(e) => { e.stopPropagation(); scrollToPayment("leader_os"); }}
              className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${selectedPlan === "leader_os" ? "bg-[#C8FF00] text-[#0a0a0a] shadow-lg shadow-[#C8FF00]/15" : "bg-white/[0.04] border border-white/[0.08] text-white hover:border-[#C8FF00]/30"}`}
            >
              Jetzt starten — ab 997 EUR
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* TIER 2: LEADERSHIP OS PLUS */}
          <div
            data-testid="plan-leader-os-plus"
            onClick={() => scrollToPayment("leader_os_plus")}
            className={`relative glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] overflow-hidden ${selectedPlan === "leader_os_plus" ? "border-[#C8FF00]/30 ring-1 ring-[#C8FF00]/15" : "border-[#C8FF00]/10"}`}
          >
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
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-[10px] font-bold tracking-wider">OS PLUS</div>
                  <div className="px-2 py-1 rounded-lg bg-[#C8FF00]/[0.06] border border-[#C8FF00]/10 text-[#C8FF00] text-[10px] font-bold tracking-wider">+ 12 COACHINGS</div>
                </div>
                <h2 className="font-manrope font-extrabold text-xl text-white mb-1">Coach-Powered Leadership</h2>
                <p className="font-inter text-xs text-slate-500">Plattform + 12 Coachings mit Top-Coaches</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-manrope font-extrabold text-4xl text-[#C8FF00]" data-testid="price-leader-os-plus">4.447</span>
                  <span className="font-inter text-base text-[#C8FF00]/60">EUR</span>
                  <span className="font-inter text-xs text-slate-600 ml-2">/ 1 Jahr</span>
                </div>
                <div className="font-inter text-xs text-slate-600 mt-1">Einmalzahlung · 14 Tage Trial</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#C8FF00]/[0.08] border border-[#C8FF00]/15">
                  <Gift className="w-3 h-3 text-[#C8FF00]" />
                  <span className="font-inter text-[10px] text-[#C8FF00] font-semibold">Coach-Wert: 3.588 EUR · Gesamtwert: 5.976 EUR</span>
                </div>
              </div>

              <div className="space-y-3 mb-7">
                {osPlusFeatures.map((f, i) => (
                  <div key={i} className={`flex items-start gap-3 ${f.subline ? "ml-7 -mt-1" : ""}`}>
                    {f.subline ? null :
                     f.highlight ? <Sparkles className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" /> :
                     f.star ? <Star className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" /> :
                     <Check className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" />}
                    <span className={`font-inter ${f.subline ? "text-xs text-[#C8FF00]/70 italic" : f.highlight ? "text-sm text-[#C8FF00] font-semibold" : "text-sm text-slate-300"}`}>{f.text}</span>
                  </div>
                ))}
              </div>

              <button
                data-testid="cta-leader-os-plus"
                onClick={(e) => { e.stopPropagation(); scrollToPayment("leader_os_plus"); }}
                className={`w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all ${selectedPlan === "leader_os_plus" ? "bg-[#C8FF00] text-[#0a0a0a] shadow-lg shadow-[#C8FF00]/20" : "bg-[#C8FF00]/10 border border-[#C8FF00]/20 text-[#C8FF00] hover:bg-[#C8FF00]/15"}`}
              >
                {selectedPlan === "leader_os_plus" && <Check className="w-4 h-4" />}
                OS PLUS — 4.447 EUR
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TIER 3: LEADERSHIP OS ENTERPRISE */}
          <div
            data-testid="plan-leader-os-enterprise"
            onClick={scrollToEnterprise}
            className={`glass-card p-7 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] ${showInquiry ? "border-white/15 ring-1 ring-white/10" : "border-white/[0.06]"}`}
          >
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-[10px] font-bold tracking-wider">ENTERPRISE</div>
                <div className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[10px] font-bold">B2B</div>
              </div>
              <h2 className="font-manrope font-extrabold text-xl text-white mb-1">Team Leadership</h2>
              <p className="font-inter text-xs text-slate-500">Volumen-Lizenzen für dein Unternehmen</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-manrope font-extrabold text-3xl text-white">Preis</span>
                <span className="font-inter text-base text-slate-500 ml-2">auf Anfrage</span>
              </div>
              <div className="font-inter text-xs text-slate-600 mt-1">10% – 50% Volumen-Rabatt · ab 5 Mitarbeiter</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="font-inter text-[10px] text-slate-400 font-semibold">Zentrale Lizenzverwaltung</span>
              </div>
            </div>

            <div className="space-y-3 mb-7">
              {enterpriseFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  {f.highlight ? <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" /> :
                   f.star ? <Star className="w-4 h-4 text-white shrink-0 mt-0.5" /> :
                   <Check className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />}
                  <span className={`font-inter text-sm ${f.highlight ? "text-white font-semibold" : "text-slate-300"}`}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              data-testid="cta-leader-os-enterprise"
              onClick={(e) => { e.stopPropagation(); scrollToEnterprise(); }}
              className="w-full py-4 rounded-xl font-manrope font-bold text-base flex items-center justify-center gap-2 transition-all bg-white/[0.04] border border-white/[0.08] text-white hover:border-white/20"
            >
              <Calculator className="w-4 h-4" />
              Rabatt berechnen & anfragen
            </button>
          </div>
        </div>

        {/* ===== PAYMENT SECTION (LEADERSHIP OS / OS PLUS) ===== */}
        {selectedPlan && selectedPlan !== "enterprise" && (
          <div className="glass-card p-8 mb-10 border border-[#C8FF00]/15" data-testid="payment-section" id="payment-section">
            <div className="text-center mb-6">
              <h3 className="font-manrope font-bold text-xl text-white mb-2">
                {selectedPlan === "leader_os_plus" ? "Leadership OS PLUS — 4.447 EUR / Jahr" : "Leadership OS — 1 Jahr Vollzugang"}
              </h3>
              <p className="font-inter text-sm text-slate-400">14 Tage Testphase · Sofortzugang · License Key per E-Mail</p>
            </div>

            {/* Payment options for Leadership OS only */}
            {selectedPlan === "leader_os" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6" data-testid="payment-options">
                {PAYMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    data-testid={`payment-option-${opt.id}`}
                    onClick={() => setPaymentOption(opt.id)}
                    className={`px-5 py-4 rounded-xl text-left transition-all ${paymentOption === opt.id ? "bg-[#C8FF00]/10 border border-[#C8FF00]/30 ring-1 ring-[#C8FF00]/15" : "bg-white/[0.02] border border-white/[0.06] hover:border-white/15"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`font-inter text-xs font-semibold ${paymentOption === opt.id ? "text-[#C8FF00]" : "text-slate-300"}`}>{opt.label}</span>
                      {opt.surcharge === 0 && <span className="px-1.5 py-0.5 rounded bg-[#C8FF00]/15 text-[#C8FF00] text-[9px] font-bold">BEST</span>}
                    </div>
                    <div className={`font-manrope font-extrabold text-xl mb-0.5 ${paymentOption === opt.id ? "text-white" : "text-white/80"}`}>{opt.per}</div>
                    <div className="font-inter text-[10px] text-slate-500">Gesamt: <span className="text-slate-300 font-semibold">{opt.total} EUR</span></div>
                    <div className="font-inter text-[10px] text-slate-600 mt-0.5">{opt.note}</div>
                  </button>
                ))}
              </div>
            )}

            <button
              data-testid="stripe-checkout-btn"
              disabled={isLoading}
              onClick={() => handleCheckout(selectedPlan === "leader_os_plus" ? "leader_os_plus" : paymentOption)}
              className="w-full py-5 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all disabled:opacity-50 mb-4"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Wird geladen...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Jetzt sicher bezahlen — {
                  selectedPlan === "leader_os_plus" ? "4.447 EUR" :
                  PAYMENT_OPTIONS.find(o => o.id === paymentOption)?.per
                }</>
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

        {/* ===== ENTERPRISE SECTION ===== */}
        {showInquiry && (
          <div className="glass-card p-8 mb-10 border border-white/10" data-testid="enterprise-section" id="enterprise-section">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-manrope font-bold text-xl text-white">Leadership OS Enterprise · Rabatt-Rechner</h3>
                <p className="font-inter text-xs text-slate-500">Wähle die Mitarbeiter-Anzahl und sieh deinen individuellen Preis sofort.</p>
              </div>
            </div>

            {/* Slider + live calculation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-3 block">Anzahl Mitarbeiter</label>
                <div className="flex items-center gap-4 mb-4">
                  <input
                    data-testid="enterprise-employee-input"
                    type="number"
                    min={1}
                    max={1000}
                    value={employees}
                    onChange={e => setEmployees(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    className="w-32 h-14 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] font-manrope text-2xl font-bold text-white focus:border-[#C8FF00]/30 focus:outline-none"
                  />
                  <input
                    type="range"
                    min={1}
                    max={300}
                    value={Math.min(employees, 300)}
                    onChange={e => setEmployees(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#C8FF00]"
                    data-testid="enterprise-employee-slider"
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ENTERPRISE_TIERS.map(t => (
                    <button
                      key={t.from}
                      onClick={() => setEmployees(t.from)}
                      className={`px-2 py-2 rounded-lg text-[10px] font-inter font-semibold transition-all ${employees >= t.from && employees < (ENTERPRISE_TIERS.find(x => x.from > t.from)?.from ?? 9999) ? "bg-[#C8FF00]/15 border border-[#C8FF00]/25 text-[#C8FF00]" : "bg-white/[0.02] border border-white/[0.06] text-slate-500"}`}
                    >
                      {t.from}+ MA<br/>−{t.discount}%
                    </button>
                  ))}
                </div>
              </div>

              {enterprisePricing && (
                <div className="p-6 rounded-xl bg-[#C8FF00]/[0.04] border border-[#C8FF00]/15" data-testid="enterprise-pricing-result">
                  <div className="font-inter text-xs text-[#C8FF00] uppercase tracking-wider mb-3">Dein Preis</div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between font-inter text-sm">
                      <span className="text-slate-400">Mitarbeiter</span>
                      <span className="text-white font-semibold" data-testid="ent-seats">{enterprisePricing.seats}</span>
                    </div>
                    <div className="flex justify-between font-inter text-sm">
                      <span className="text-slate-400">Listenpreis pro Lizenz</span>
                      <span className="text-slate-500 line-through">997 EUR</span>
                    </div>
                    <div className="flex justify-between font-inter text-sm">
                      <span className="text-slate-400">Volumen-Rabatt</span>
                      <span className="text-[#C8FF00] font-bold" data-testid="ent-discount">−{enterprisePricing.discount_pct}%</span>
                    </div>
                    <div className="flex justify-between font-inter text-sm">
                      <span className="text-slate-400">Pro Lizenz</span>
                      <span className="text-white font-semibold" data-testid="ent-per-seat">{enterprisePricing.per_seat.toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#C8FF00]/15">
                    <div className="font-inter text-xs text-slate-500 mb-1">Gesamtinvestition / Jahr</div>
                    <div className="font-manrope font-extrabold text-3xl md:text-4xl text-[#C8FF00]" data-testid="ent-total">
                      {enterprisePricing.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inquiry form */}
            {!inquirySubmitted ? (
              <form onSubmit={handleInquiry} className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="enterprise-inquiry-form">
                <input data-testid="ent-inq-company" required placeholder="Firma *" value={inquiry.company} onChange={e => setInquiry({...inquiry, company: e.target.value})} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
                <input data-testid="ent-inq-name" required placeholder="Dein Name *" value={inquiry.contact_name} onChange={e => setInquiry({...inquiry, contact_name: e.target.value})} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
                <input data-testid="ent-inq-email" required type="email" placeholder="E-Mail *" value={inquiry.email} onChange={e => setInquiry({...inquiry, email: e.target.value})} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
                <input data-testid="ent-inq-phone" placeholder="Telefon (optional)" value={inquiry.phone} onChange={e => setInquiry({...inquiry, phone: e.target.value})} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
                <textarea data-testid="ent-inq-message" placeholder="Nachricht (optional) — z.B. gewünschter Startzeitpunkt, Branche, spezifische Anforderungen..." value={inquiry.message} onChange={e => setInquiry({...inquiry, message: e.target.value})} rows={3} className="md:col-span-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none resize-none" />
                <label className="md:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-[#C8FF00]/20 transition-all">
                  <input data-testid="ent-inq-coaching" type="checkbox" checked={inquiry.include_coaching} onChange={e => setInquiry({...inquiry, include_coaching: e.target.checked})} className="w-4 h-4 accent-[#C8FF00]" />
                  <div className="flex-1">
                    <div className="font-inter text-sm text-white font-medium flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#C8FF00]" /> Coaching-Zusatzpaket gewünscht</div>
                    <div className="font-inter text-xs text-slate-500">12 Einzelcoachings pro Mitarbeiter (à 299 EUR Wert) — wir kalkulieren individuell.</div>
                  </div>
                </label>
                {inquiryError && <div className="md:col-span-2 text-sm text-red-400 font-inter" data-testid="ent-inq-error">{inquiryError}</div>}
                <button type="submit" disabled={inquiryLoading} data-testid="ent-inq-submit" className="md:col-span-2 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-base flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#C8FF00]/20 transition-all disabled:opacity-50">
                  {inquiryLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Wird gesendet...</> : <><Briefcase className="w-5 h-5" /> Anfrage senden — wir melden uns innerhalb von 24h</>}
                </button>
              </form>
            ) : (
              <div className="text-center py-10" data-testid="ent-inq-success">
                <div className="w-16 h-16 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#C8FF00]" />
                </div>
                <h4 className="font-manrope font-bold text-2xl text-white mb-3">Anfrage erhalten — danke, {inquiry.contact_name}!</h4>
                <p className="font-inter text-base text-slate-400 max-w-md mx-auto mb-2">
                  Wir haben deine Enterprise-Anfrage für <span className="text-white font-semibold">{inquiry.company}</span> erhalten und melden uns innerhalb von <span className="text-[#C8FF00]">24 Stunden</span> mit einem persönlichen Angebot.
                </p>
                <p className="font-inter text-xs text-slate-600 mt-4">Eine Bestätigung wurde an {inquiry.email} gesendet.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== COMPARISON TABLE ===== */}
        <div className="glass-card p-8 mb-10 overflow-hidden" data-testid="comparison">
          <h3 className="font-manrope font-bold text-xl text-white mb-8 text-center">Was du in jedem Paket bekommst</h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-4 gap-4 text-center mb-4 min-w-[600px]">
              <div />
              <div className="font-inter text-xs text-white uppercase tracking-wider font-bold">Leadership OS<br/><span className="text-slate-500 normal-case font-normal">997 EUR</span></div>
              <div className="font-inter text-xs text-[#C8FF00] uppercase tracking-wider font-bold">OS PLUS<br/><span className="text-slate-500 normal-case font-normal">4.447 EUR</span></div>
              <div className="font-inter text-xs text-white uppercase tracking-wider font-bold">Enterprise<br/><span className="text-slate-500 normal-case font-normal">auf Anfrage</span></div>
            </div>
            {[
              ["14 Tage Testphase", true, true, true],
              ["Leadership-Diagnose + KI-Report", true, true, true],
              ["12 Premium-Videokurse (1 pro Monat)", true, true, true],
              ["Personalisierter 30-Tage-Plan", true, true, true],
              ["WladBot AI Coach 24/7", true, true, true],
              ["WLADHUB Plattform-Vollzugang", true, true, true],
              ["Leadership Playbooks & Frameworks", true, true, true],
              ["License Key per E-Mail", true, true, true],
              ["Ratenzahlung möglich", true, false, true],
              ["12 Einzelcoachings (à 299 EUR Wert)", false, true, "optional"],
              ["Persönliche Lernbegleitung 12 Monate", false, true, true],
              ["Quartals-Reviews", false, true, true],
              ["Priority Support", false, true, true],
              ["Volumen-Rabatte (10–50%)", false, false, true],
              ["Zentrales Admin-Dashboard", false, false, true],
              ["Onboarding-Workshop mit Wlad", false, false, true],
              ["Dedizierter Account Manager", false, false, true],
              ["Individuelle Vertragsgestaltung", false, false, true],
            ].map(([label, os, plus, ent], i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-2.5 border-b border-white/[0.03] items-center min-w-[600px]">
                <span className="font-inter text-sm text-slate-300 text-left">{label}</span>
                <div className="flex justify-center">{os === true ? <Check className="w-4 h-4 text-white/80" /> : os === "optional" ? <span className="text-[10px] text-slate-500 font-semibold uppercase">Opt.</span> : <X className="w-4 h-4 text-slate-700" />}</div>
                <div className="flex justify-center">{plus === true ? <Check className="w-4 h-4 text-[#C8FF00]" /> : plus === "optional" ? <span className="text-[10px] text-[#C8FF00]/70 font-semibold uppercase">Opt.</span> : <X className="w-4 h-4 text-slate-700" />}</div>
                <div className="flex justify-center">{ent === true ? <Check className="w-4 h-4 text-white" /> : ent === "optional" ? <span className="text-[10px] text-slate-400 font-semibold uppercase">Opt.</span> : <X className="w-4 h-4 text-slate-700" />}</div>
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
            {totalScore > 0 ? `Dein Score ist ${totalScore}%. ` : ""}Drei Wege, ein Ziel: Leadership-Souveränität in 12 Monaten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToPayment("leader_os")} className="btn-secondary px-6 py-4 font-semibold inline-flex items-center gap-2">
              Leadership OS — 997 EUR
            </button>
            <button onClick={() => scrollToPayment("leader_os_plus")} data-testid="close-final-os-plus"
              className="btn-primary px-8 py-4 font-semibold inline-flex items-center gap-3">
              <Crown className="w-4 h-4" />
              OS PLUS — 4.447 EUR
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={scrollToEnterprise} className="btn-secondary px-6 py-4 font-semibold inline-flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Enterprise anfragen
            </button>
          </div>
          <p className="font-inter text-xs text-slate-600 mt-6">14 Tage Testphase · License Key per E-Mail · SSL-verschlüsselt</p>
          <p className="font-inter text-xs text-slate-600 mt-3">
            Bereits einen Key? <button onClick={() => navigate("/activate")} className="text-[#C8FF00]/70 hover:text-[#C8FF00] underline" data-testid="activate-link">Hier aktivieren</button>
          </p>
        </div>
      </div>
    </div>
  );
}
