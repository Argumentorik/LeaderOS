import { Calculator, Check, Loader2, Briefcase, GraduationCap, Building2, Star, Sparkles } from "lucide-react";
import { ENTERPRISE_TIERS } from "./pricingConstants";
import { FeatureRow } from "./FeatureRow";

// Live discount calculator + B2B inquiry form.
// API integration is owned by the parent (HighTicketClose) for testability.
export function EnterpriseSection({
  employees, setEmployees,
  enterprisePricing,
  inquiry, setInquiry,
  onSubmit,
  inquirySubmitted, inquiryError, inquiryLoading,
}) {
  return (
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
            {ENTERPRISE_TIERS.map(t => {
              const next = ENTERPRISE_TIERS.find(x => x.from > t.from)?.from ?? 9999;
              const active = employees >= t.from && employees < next;
              return (
                <button
                  key={t.from}
                  onClick={() => setEmployees(t.from)}
                  className={`px-2 py-2 rounded-lg text-[10px] font-inter font-semibold transition-all ${active ? "bg-[#C8FF00]/15 border border-[#C8FF00]/25 text-[#C8FF00]" : "bg-white/[0.02] border border-white/[0.06] text-slate-500"}`}
                >
                  {t.from}+ MA<br />−{t.discount}%
                </button>
              );
            })}
          </div>
        </div>

        {enterprisePricing && (
          <div className="p-6 rounded-xl bg-[#C8FF00]/[0.04] border border-[#C8FF00]/15" data-testid="enterprise-pricing-result">
            <div className="font-inter text-xs text-[#C8FF00] uppercase tracking-wider mb-3">Dein Preis</div>
            <div className="space-y-2 mb-4">
              <Row label="Mitarbeiter" value={enterprisePricing.seats} testid="ent-seats" />
              <Row label="Listenpreis pro Lizenz" value={<span className="text-slate-500 line-through">997 EUR</span>} />
              <Row label="Volumen-Rabatt" value={<span className="text-[#C8FF00] font-bold" data-testid="ent-discount">−{enterprisePricing.discount_pct}%</span>} />
              <Row label="Pro Lizenz" value={<span className="text-white font-semibold" data-testid="ent-per-seat">{enterprisePricing.per_seat.toLocaleString("de-DE", { minimumFractionDigits: 2 })} EUR</span>} />
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

      {!inquirySubmitted ? (
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="enterprise-inquiry-form">
          <input data-testid="ent-inq-company" required placeholder="Firma *" value={inquiry.company} onChange={e => setInquiry({ ...inquiry, company: e.target.value })} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
          <input data-testid="ent-inq-name" required placeholder="Dein Name *" value={inquiry.contact_name} onChange={e => setInquiry({ ...inquiry, contact_name: e.target.value })} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
          <input data-testid="ent-inq-email" required type="email" placeholder="E-Mail *" value={inquiry.email} onChange={e => setInquiry({ ...inquiry, email: e.target.value })} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
          <input data-testid="ent-inq-phone" placeholder="Telefon (optional)" value={inquiry.phone} onChange={e => setInquiry({ ...inquiry, phone: e.target.value })} className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none" />
          <textarea data-testid="ent-inq-message" placeholder="Nachricht (optional) — z.B. gewünschter Startzeitpunkt, Branche, spezifische Anforderungen..." value={inquiry.message} onChange={e => setInquiry({ ...inquiry, message: e.target.value })} rows={3} className="md:col-span-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-[#C8FF00]/30 focus:outline-none resize-none" />
          <label className="md:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-[#C8FF00]/20 transition-all">
            <input data-testid="ent-inq-coaching" type="checkbox" checked={inquiry.include_coaching} onChange={e => setInquiry({ ...inquiry, include_coaching: e.target.checked })} className="w-4 h-4 accent-[#C8FF00]" />
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
  );
}

function Row({ label, value, testid }) {
  return (
    <div className="flex justify-between font-inter text-sm">
      <span className="text-slate-400">{label}</span>
      {testid ? <span className="text-white font-semibold" data-testid={testid}>{value}</span> : <span>{value}</span>}
    </div>
  );
}
