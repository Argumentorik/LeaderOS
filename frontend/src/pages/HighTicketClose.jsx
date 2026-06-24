import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Shield, Sparkles, Lock, Crown, Building2, BookOpen } from "lucide-react";
import { generateCurriculumPDF } from "../utils/generateCurriculumPDF";
import { PriceCards } from "../components/pricing/PriceCards";
import { PaymentSection } from "../components/pricing/PaymentSection";
import { EnterpriseSection } from "../components/pricing/EnterpriseSection";
import { ComparisonTable } from "../components/pricing/ComparisonTable";
import {
  ENTERPRISE_TIERS,
  OS_FEATURES,
  OS_PLUS_FEATURES,
  ENTERPRISE_FEATURES,
} from "../components/pricing/pricingConstants";

const API = process.env.REACT_APP_BACKEND_URL;

export default function HighTicketClose() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentOption, setPaymentOption] = useState("leader_os_full");
  const [isLoading, setIsLoading] = useState(false);

  // Enterprise state
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
      const res = await fetch(`${API}/api/payments/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          origin_url: window.location.origin,
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04]">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] font-bold">
              ▸ § 03 / 03 · ENTSCHEIDUNG 
            </span>
          </div>
          {totalScore > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C8FF00]/15 bg-[#C8FF00]/[0.04] mb-6 ml-2">
              <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              <span className="font-inter text-sm text-[#C8FF00] font-medium">Dein Score: {totalScore} %</span>
            </div>
          )}
          <h1 className="font-manrope font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5" data-testid="close-headline">
            Diagnose ist durch.
            <br />
            <span className="text-gradient-lime">Jetzt der Sprint.</span>
          </h1>
          <p className="font-inter text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-3">
            30 Tage Sprint mit Wlad. 12 Monate Plattform. Ein KI-Coach der dich kennt.
            <br className="hidden md:block" />
            Sprint zuerst, immer. Plus-Plus wenn du Live mit Wlad willst.
          </p>
        </div>

        {/* SCARCITY-BAR */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.03]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 font-medium uppercase">
              Werde Teil von Wlads Leader-Movement · <span className="text-[#C8FF00]">KI · Rhetorik · EQ</span>
            </span>
          </div>
        </div>

        {/* TRUST BAR */}
        <div className="flex items-center justify-center gap-6 mb-14 flex-wrap">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" /><span className="font-inter text-xs text-slate-500">14 Tage Geld-zurück auf den Sprint</span></div>
          <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-slate-600" /><span className="font-inter text-xs text-slate-500">SSL · Stripe · DSGVO</span></div>
          <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-600" /><span className="font-inter text-xs text-slate-500">400 000+ Klienten · 3x SPIEGEL-Bestseller</span></div>
        </div>

        {/* 3-TIER PRICE STACK */}
        <PriceCards
          selectedPlan={selectedPlan}
          showInquiry={showInquiry}
          onSelectOS={() => scrollToPayment("leader_os")}
          onSelectPlus={() => scrollToPayment("leader_os_plus")}
          onSelectEnterprise={scrollToEnterprise}
          osFeatures={OS_FEATURES}
          osPlusFeatures={OS_PLUS_FEATURES}
          enterpriseFeatures={ENTERPRISE_FEATURES}
        />

        {/* PAYMENT SECTION (Sprint / Plus-Plus) */}
        <PaymentSection
          selectedPlan={selectedPlan}
          paymentOption={paymentOption}
          setPaymentOption={setPaymentOption}
          isLoading={isLoading}
          onCheckout={handleCheckout}
        />

        {/* ENTERPRISE SECTION */}
        {showInquiry && (
          <EnterpriseSection
            employees={employees}
            setEmployees={setEmployees}
            enterprisePricing={enterprisePricing}
            inquiry={inquiry}
            setInquiry={setInquiry}
            onSubmit={handleInquiry}
            inquirySubmitted={inquirySubmitted}
            inquiryError={inquiryError}
            inquiryLoading={inquiryLoading}
          />
        )}

        {/* COMPARISON TABLE */}
        <ComparisonTable />

        {/* BOOK FUNNEL */}
        <div className="glass-card p-8 mb-10 border border-[#C8FF00]/15 bg-[#C8FF00]/[0.02]" data-testid="book-funnel">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-40 rounded-xl bg-[#C8FF00]/[0.06] border border-[#C8FF00]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-10 h-10 text-[#C8FF00]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="px-3 py-1 rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/15 text-[#C8FF00] text-xs font-bold inline-block mb-3">IN JEDEM PAKET ENTHALTEN</div>
              <h3 className="font-manrope font-extrabold text-xl text-white mb-2">&laquo;Die 6 Rollen einer Führungskraft&raquo;</h3>
              <p className="font-inter text-sm text-slate-400 mb-4">von Wladislaw Jachtchenko · SPIEGEL-Bestseller-Autor</p>
              <a href="https://www.remote-verlag.de/pages/5-rollen-fuehrungskraft" target="_blank" rel="noopener noreferrer" data-testid="book-cta"
                className="btn-secondary px-6 py-3 text-sm font-medium inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Buch ansehen <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* CURRICULUM DOWNLOAD */}
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

        {/* FINAL CTA — direct purchase from the last section */}
        <div className="text-center border-t border-white/[0.04] pt-12 pb-4" data-testid="final-cta-section">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 border border-[#C8FF00]/20 bg-[#C8FF00]/[0.04]">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#C8FF00] font-bold">
              ▸ § 03 / 03 · ENTSCHEIDUNG
            </span>
          </div>
          <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-white mb-3">
            Wer heute zögert,
            <br/>
            <span className="text-slate-500">führt morgen unter jemandem, der nicht gezögert hat.</span>
          </h2>
          <p className="font-inter text-base text-slate-500 mb-2 max-w-xl mx-auto">
            {totalScore > 0 ? `Dein Score: ${totalScore} %. ` : ""}Sprint zuerst, immer. Plus-Plus wenn du Live mit Wlad willst.
          </p>
          <p className="font-inter text-sm text-[#C8FF00]/80 mb-8 max-w-xl mx-auto">
            ▸ Klick direkt auf dein Paket · weiter zu Stripe · Sofort-Zugang per Key
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-3xl mx-auto">
            <button
              data-testid="close-final-os"
              onClick={() => handleCheckout("leader_os_full")}
              disabled={isLoading}
              className="flex-1 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-manrope font-bold hover:border-[#C8FF00]/30 hover:bg-white/[0.06] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <span>Sprint sichern</span>
              <span className="text-[#C8FF00]">997 EUR</span>
            </button>
            <button
              data-testid="close-final-os-plus"
              onClick={() => handleCheckout("leader_os_plus")}
              disabled={isLoading}
              className="flex-1 px-6 py-4 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span>Plus-Plus sichern</span>
              <span>4.797 EUR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              data-testid="close-final-enterprise"
              onClick={scrollToEnterprise}
              className="flex-1 px-6 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-manrope font-bold hover:border-white/20 transition-all inline-flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Enterprise anfragen</span>
            </button>
          </div>
          <p className="font-inter text-xs text-slate-600 mt-6">14 Tage Geld-zurück · License Key per E-Mail · SSL · Stripe</p>
          <p className="font-inter text-xs text-slate-600 mt-3">
            Bereits einen Key? <button onClick={() => navigate("/activate")} className="text-[#C8FF00]/70 hover:text-[#C8FF00] underline" data-testid="activate-link">Hier aktivieren</button>
          </p>
        </div>
      </div>
    </div>
  );
}
