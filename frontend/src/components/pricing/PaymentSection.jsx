import { CreditCard, Loader2, Shield, Lock, Check, Gift } from "lucide-react";
import { PAYMENT_OPTIONS } from "./pricingConstants";

// Renders the payment confirmation block below the price cards.
// Shows installment toggle ONLY for "leader_os" plan.
export function PaymentSection({
  selectedPlan,
  paymentOption, setPaymentOption,
  isLoading,
  onCheckout,
}) {
  if (!selectedPlan || selectedPlan === "enterprise") return null;

  const isPlus = selectedPlan === "leader_os_plus";
  const currentOption = PAYMENT_OPTIONS.find(o => o.id === paymentOption);
  const ctaPrice = isPlus ? "4.447 EUR" : currentOption?.per;

  return (
    <div className="glass-card p-8 mb-10 border border-[#C8FF00]/15" data-testid="payment-section" id="payment-section">
      <div className="text-center mb-6">
        <h3 className="font-manrope font-bold text-xl text-white mb-2">
          {isPlus ? "Leadership OS PLUS — 4.447 EUR / Jahr" : "Leadership OS — 1 Jahr Vollzugang"}
        </h3>
        <p className="font-inter text-sm text-slate-400">14 Tage Testphase · Sofortzugang · License Key per E-Mail</p>
      </div>

      {!isPlus && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3" data-testid="payment-options">
            {PAYMENT_OPTIONS.map(opt => {
              const active = paymentOption === opt.id;
              return (
                <button
                  key={opt.id}
                  data-testid={`payment-option-${opt.id}`}
                  onClick={() => setPaymentOption(opt.id)}
                  className={`px-5 py-4 rounded-xl text-left transition-all ${active ? "bg-[#C8FF00]/10 border border-[#C8FF00]/30 ring-1 ring-[#C8FF00]/15" : "bg-white/[0.02] border border-white/[0.06] hover:border-white/15"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={`font-inter text-xs font-semibold ${active ? "text-[#C8FF00]" : "text-slate-300"}`}>{opt.label}</span>
                    {opt.surcharge === 0 && <span className="px-1.5 py-0.5 rounded bg-[#C8FF00]/15 text-[#C8FF00] text-[9px] font-bold">BEST</span>}
                  </div>
                  <div className={`font-manrope font-extrabold text-xl mb-0.5 ${active ? "text-white" : "text-white/80"}`}>{opt.per}</div>
                  <div className="font-inter text-[10px] text-slate-500">Gesamt: <span className="text-slate-300 font-semibold">{opt.total} EUR</span></div>
                  <div className="font-inter text-[10px] text-slate-600 mt-0.5">{opt.note}</div>
                </button>
              );
            })}
          </div>
          {paymentOption !== "leader_os_full" && (
            <div className="text-center mb-6 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]" data-testid="installment-info">
              <span className="font-inter text-[11px] text-slate-500">
                Echte Ratenzahlung wird in Stripe-Live-Modus aktiv. Im aktuellen Test-Modus wird der Gesamtbetrag einmalig verrechnet.
              </span>
            </div>
          )}
        </>
      )}

      <button
        data-testid="stripe-checkout-btn"
        disabled={isLoading}
        onClick={() => onCheckout(isPlus ? "leader_os_plus" : paymentOption)}
        className="w-full py-5 rounded-xl bg-[#C8FF00] text-[#0a0a0a] font-manrope font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#C8FF00]/20 transition-all disabled:opacity-50 mb-4"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Wird geladen...</>
        ) : (
          <><CreditCard className="w-5 h-5" /> Jetzt sicher bezahlen — {ctaPrice}</>
        )}
      </button>

      <div className="flex items-center justify-center gap-6 flex-wrap">
        <Trust icon={Shield} text="SSL-verschlüsselt" />
        <Trust icon={Lock} text="Powered by Stripe" />
        <Trust icon={Check} text="14 Tage Trial" />
        <Trust icon={Gift} text="License Key per E-Mail" />
      </div>
    </div>
  );
}

function Trust({ icon: Icon, text }) {
  return (
    <span className="font-inter text-xs text-slate-600 flex items-center gap-1">
      <Icon className="w-3 h-3" /> {text}
    </span>
  );
}
