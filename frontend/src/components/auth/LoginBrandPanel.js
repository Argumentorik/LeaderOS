import { CheckCircle2 } from 'lucide-react';
import { WladMark } from '../brand/WladMark';
import { ProductPreviewLoop } from './ProductPreviewLoop';

const BG_IMG = 'https://images.unsplash.com/photo-1633602114554-be8c2c5d6828?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80';

export const LoginBrandPanel = ({ features, de }) => {
  return (
    <div data-testid="login-brand-panel" className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG_IMG})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95" />

      {/* Aurora gradient — adds depth motion */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-20 h-[28rem] w-[28rem] rounded-full bg-[#BFFF00]/[0.07] blur-[120px] animate-[auroraFloat_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 -right-20 h-[24rem] w-[24rem] rounded-full bg-emerald-500/[0.04] blur-[110px] animate-[auroraFloat_12s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-20">
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

          <h1 className="text-4xl sm:text-5xl tracking-tighter leading-[1.08] text-white mb-8" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, letterSpacing: '-0.035em' }}>
            {de ? (
              <>
                <span className="block">Die Zukunft gehört</span>
                <span className="block"><span className="text-[#BFFF00] inline-block">KI-nativen</span></span>
                <span className="block">Führungskräften.</span>
              </>
            ) : (
              <>
                <span className="block">The future belongs to</span>
                <span className="block"><span className="text-[#BFFF00] inline-block">AI-native</span></span>
                <span className="block">leaders.</span>
              </>
            )}
          </h1>

          <div className="space-y-3.5 mt-10 cascade">
            {features.slice(0, 3).map(item => (
              <div key={item.t} className="flex items-start gap-3">
                <CheckCircle2 size={15} className="text-[#BFFF00] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-white/85 leading-tight">{item.t}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{item.s}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Iter 92.44 (Mert · GODMODE): animated product preview loop —
              Chat-Burst → KI-Score → Video-Frame. Auto-cycle every 4.5s.
              Conversion booster: "try-before-login" effect from Stripe/Linear. */}
          <ProductPreviewLoop de={de} />
        </div>

        <div className="mt-16">
          <p className="text-[11px] text-white/15 tracking-wide">
            {de ? '2.500+ Führungskräfte — von Startups bis DAX.' : '2,500+ leaders — from startups to Fortune 500.'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes auroraFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(20px, -30px) scale(1.08); }
        }
      `}</style>
    </div>
  );
};
