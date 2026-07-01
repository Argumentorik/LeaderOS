import { Sparkles } from 'lucide-react';

/**
 * WladBotAvatar — the ONE avatar users see everywhere WladBot speaks.
 *
 * Iter 92.48: global rollout (chat, emails, challengers).
 * Iter 92.50 (Mert · GODMODE): `live` variant — realistic presence:
 *   - breathing scale animation (4.5s)
 *   - slowly rotating lime aura ring (conic gradient)
 *   - emerald online-status dot with ping
 *
 * Falls back to a lime gradient tile + Sparkles if the PNG 404s.
 *
 * Usage:
 *   <WladBotAvatar size={40} />          → medium
 *   <WladBotAvatar size={28} ring />     → small with lime ring
 *   <WladBotAvatar size={64} pulse />    → typing pulse
 *   <WladBotAvatar size={56} live />     → "he's really here" presence
 */
const AVATAR_SRC = '/wladbot-avatar.png';

export const WladBotAvatar = ({
  size = 40,
  ring = false,
  pulse = false,
  live = false,
  className = '',
  alt = 'WladBot',
}) => {
  const px = `${size}px`;
  const ringCls = ring ? 'ring-2 ring-[#BFFF00]/40' : '';
  const pulseCls = pulse ? 'animate-pulse' : '';

  const core = (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] shadow-lg shadow-[#BFFF00]/20 shrink-0 ${ringCls} ${pulseCls} ${live ? '' : className}`}
      style={{ width: px, height: px }}
      data-testid="wladbot-avatar"
    >
      {/* Fallback icon behind image (visible only if img errors out) */}
      <Sparkles
        size={Math.max(10, Math.round(size * 0.42))}
        className="absolute text-[#0A0A0A]"
        strokeWidth={2.6}
        aria-hidden="true"
      />
      <img
        src={AVATAR_SRC}
        alt={alt}
        className="relative z-10 w-full h-full object-cover"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </span>
  );

  if (!live) return core;

  const dotSize = Math.max(8, Math.round(size * 0.24));
  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: `${size + 8}px`, height: `${size + 8}px` }}
      data-testid="wladbot-avatar-live"
    >
      {/* Rotating lime aura ring */}
      <span
        aria-hidden
        className="wlad-ring-spin absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #BFFF00 0%, rgba(191,255,0,0.05) 28%, #BFFF00 52%, rgba(191,255,0,0.05) 78%, #BFFF00 100%)',
          animation: 'wladRingSpin 7s linear infinite',
          filter: 'drop-shadow(0 0 6px rgba(191,255,0,0.35))',
        }}
      />
      {/* Breathing avatar core */}
      <span
        className="wlad-breath absolute inset-[3px] rounded-full"
        style={{ animation: 'wladBreath 4.5s ease-in-out infinite' }}
      >
        {core}
      </span>
      {/* Online status dot */}
      <span
        className="absolute rounded-full bg-emerald-400 border-2 border-white dark:border-[#0A0A0A] z-10"
        style={{ width: `${dotSize}px`, height: `${dotSize}px`, bottom: '2%', right: '2%' }}
        data-testid="wladbot-online-dot"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
      </span>
    </span>
  );
};

export default WladBotAvatar;
