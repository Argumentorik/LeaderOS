import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { WladMark } from '../brand/WladMark';
import { ProductPreviewLoop } from './ProductPreviewLoop';
import { LoginTeaserVideo } from './LoginTeaserVideo';

const BG_IMG = 'https://images.unsplash.com/photo-1633602114554-be8c2c5d6828?crop=entropy&cs=srgb&fm=webp&w=1400&q=60';

export const LoginBrandPanel = ({ features, de }) => {
  const [hasTeaser, setHasTeaser] = useState(false);
  return (
    <div data-testid="login-brand-panel" className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
      {/* Cinematic background: photo → deep dark grade → fine grid → aurora */}
      <div className="absolute inset-0 bg-cover bg-center scale-105 animate-[bgDrift_28s_ease-in-out_infinite_alternate]" style={{ backgroundImage: `url(${BG_IMG})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/85 to-[#050505]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 30% 30%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 30% 30%, black 30%, transparent 75%)',
        }}
      />

      {/* Aurora depth layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-24 h-[30rem] w-[30rem] rounded-full bg-[#BFFF00]/[0.08] blur-[130px] animate-[auroraFloat_9s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-8%] -right-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/[0.05] blur-[120px] animate-[auroraFloat_13s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[55%] left-[40%] h-[18rem] w-[18rem] rounded-full bg-[#BFFF00]/[0.04] blur-[100px] animate-[auroraFloat_16s_ease-in-out_infinite]" />
      </div>

      {/* Diagonal light sweep — one slow premium pass */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[lightSweep_11s_ease-in-out_infinite]"
      />

      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-16 xl:mb-20 brand-rise" style={{ animationDelay: '0ms' }}>
            <WladMark size={40} animated />
            <div className="flex flex-col leading-none">
              <span className="font-black text-[18px] tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}>
                Leader<span className="opacity-40">·</span>OS
              </span>
              <span className="text-[8px] tracking-[0.22em] uppercase font-bold text-white/35 mt-1">
                Powered by WladBot
              </span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl tracking-tighter leading-[1.08] text-white mb-5" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, letterSpacing: '-0.035em' }}>
            {de ? (
              <>
                <span className="block overflow-hidden"><span className="block line-reveal" style={{ animationDelay: '120ms' }}>Führe besser.</span></span>
                <span className="block overflow-hidden">
                  <span className="block line-reveal" style={{ animationDelay: '260ms' }}>
                    <span className="relative inline-block">
                      <span className="lime-shimmer">Jeden Tag.</span>
                      <span aria-hidden className="absolute left-0 -bottom-1 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-[#BFFF00] to-[#BFFF00]/20 underline-draw" style={{ animationDelay: '900ms' }} />
                    </span>
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="block overflow-hidden"><span className="block line-reveal" style={{ animationDelay: '120ms' }}>Lead better.</span></span>
                <span className="block overflow-hidden">
                  <span className="block line-reveal" style={{ animationDelay: '260ms' }}>
                    <span className="relative inline-block">
                      <span className="lime-shimmer">Every day.</span>
                      <span aria-hidden className="absolute left-0 -bottom-1 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-[#BFFF00] to-[#BFFF00]/20 underline-draw" style={{ animationDelay: '900ms' }} />
                    </span>
                  </span>
                </span>
              </>
            )}
          </h1>

          <p className="text-[13.5px] text-white/45 leading-relaxed max-w-sm mb-2 brand-rise" style={{ animationDelay: '560ms' }} data-testid="login-brand-subline">
            {de
              ? 'Kein Onlinekurs, den du abarbeitest. Kein Chatbot, der dir Allgemeinplätze liefert. Leader-OS ist das, was dir im Alltag fehlt: jemand, der dich vor dem schwierigen Gespräch vorbereitet – zehn Minuten, jeden Tag.'
              : 'Not an online course you grind through. Not a chatbot handing you platitudes. Leader-OS is what your workday is missing: someone who prepares you before the hard conversation – ten minutes, every day.'}
          </p>

          {/* Wlad-Teaser (freigegeben) direkt unter der Headline — Conversion first */}
          <div className="mt-8 brand-rise" style={{ animationDelay: '640ms' }}>
            <LoginTeaserVideo de={de} onAvailable={setHasTeaser} />
          </div>

          <div className={`space-y-2 ${hasTeaser ? 'mt-8' : 'mt-10'}`}>
            {features.slice(0, 3).map((item, i) => (
              <div
                key={item.t}
                className="group flex items-start gap-3 rounded-xl px-3 py-2.5 -mx-3 border border-transparent hover:border-white/[0.07] hover:bg-white/[0.03] transition-all duration-300 hover:translate-x-1 brand-rise"
                style={{ animationDelay: `${680 + i * 130}ms` }}
              >
                <span className="mt-0.5 shrink-0 h-6 w-6 rounded-lg bg-[#BFFF00]/[0.08] border border-[#BFFF00]/[0.16] flex items-center justify-center group-hover:bg-[#BFFF00]/[0.16] group-hover:scale-110 transition-all duration-300">
                  <CheckCircle2 size={13} className="text-[#BFFF00]" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-white/85 leading-tight">{item.t}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{item.s}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ohne freigegebenen Teaser: der animierte Produkt-Loop */}
          {!hasTeaser && (
            <div className="brand-rise" style={{ animationDelay: '1100ms' }}>
              <ProductPreviewLoop de={de} />
            </div>
          )}
        </div>

        <div className="mt-16 brand-rise" style={{ animationDelay: '1250ms' }}>
          <p className="text-[11px] text-white/15 tracking-wide">
            {de ? 'Auf Basis der Methodik von Wlad Jachtchenko, Rhetorik- und Leadership-Trainer.' : 'Built on the methodology of Wlad Jachtchenko, rhetoric and leadership trainer.'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes auroraFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(22px, -32px) scale(1.08); }
        }
        @keyframes bgDrift {
          0%   { transform: scale(1.05) translate(0, 0); }
          100% { transform: scale(1.1) translate(-14px, -10px); }
        }
        @keyframes lightSweep {
          0%, 55%  { transform: translateX(-140%) skewX(-12deg); opacity: 0; }
          70%      { opacity: 1; }
          100%     { transform: translateX(340%) skewX(-12deg); opacity: 0; }
        }
        @keyframes brandRiseIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .brand-rise {
          opacity: 0;
          animation: brandRiseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes lineRevealUp {
          from { opacity: 0; transform: translateY(105%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .line-reveal {
          opacity: 0;
          animation: lineRevealUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes limeShimmer {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .lime-shimmer {
          background: linear-gradient(100deg, #BFFF00 20%, #EDFFB0 42%, #BFFF00 62%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: limeShimmer 4.5s ease-in-out 1.4s infinite;
        }
        @keyframes underlineDrawIn {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .underline-draw {
          transform: scaleX(0);
          animation: underlineDrawIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-rise, .line-reveal, .underline-draw { animation-duration: 0.01s; animation-delay: 0s; }
          .lime-shimmer { animation: none; -webkit-text-fill-color: #BFFF00; }
        }
      `}</style>
    </div>
  );
};
