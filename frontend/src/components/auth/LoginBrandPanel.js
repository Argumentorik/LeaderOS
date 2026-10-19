import { CheckCircle2 } from 'lucide-react';
import { WladMark } from '../brand/WladMark';
import { ProductPreviewLoop } from './ProductPreviewLoop';
import { LoginTeaserVideo } from './LoginTeaserVideo';

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

      {/* Diagonal light sweep — one slow premium pass */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[lightSweep_11s_ease-in-out_infinite]"
      />

      <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-20">
            <WladMark size={40} animated />
            <div className="flex flex-col leading-none">
              <span
                className="font-black text-[20px] tracking-tight text-white"
                style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.025em' }}
              >
                Leader<span className="text-brand mx-0.5">·</span>OS
              </span>
              <span className="text-[8.5px] tracking-[0.28em] uppercase font-bold text-brand mt-1.5 font-mono">
                ▸ Powered by WladBot
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

          <div className="space-y-5 mt-12 cascade">
            {features.map(item => (
              <div key={item.t} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-[#BFFF00] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white/80">{item.t}</p>
                  <p className="text-xs text-white/30 mt-0.5">{item.s}</p>
                </div>
              </div>
            ))}
          </div>
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
