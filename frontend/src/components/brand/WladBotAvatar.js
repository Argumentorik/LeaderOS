import { Sparkles } from 'lucide-react';

/**
 * WladBotAvatar — the ONE avatar users see everywhere WladBot speaks.
 *
 * Iter 92.48 (Mert · GODMODE): "Make sure to use the avatar everywhere so
 * people think they are talking to the avatar."
 *
 * The image lives at /wladbot-avatar.png in /app/frontend/public. If it fails
 * to load (network, 404), the component gracefully falls back to a lime
 * gradient tile with a Sparkles icon — the previous brand mark. This is
 * defensive: the avatar becomes visible instantly across chat, drawer,
 * previews, and system-message rows the moment the PNG is deployed.
 *
 * Usage:
 *   <WladBotAvatar size={40} />                → medium
 *   <WladBotAvatar size={28} ring />            → small with lime ring
 *   <WladBotAvatar size={64} pulse />           → hero with typing pulse
 */
const AVATAR_SRC = '/wladbot-avatar.png';

export const WladBotAvatar = ({
  size = 40,
  ring = false,
  pulse = false,
  className = '',
  alt = 'WladBot',
}) => {
  const px = `${size}px`;
  const ringCls = ring ? 'ring-2 ring-[#BFFF00]/40' : '';
  const pulseCls = pulse ? 'animate-pulse' : '';
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] shadow-lg shadow-[#BFFF00]/20 shrink-0 ${ringCls} ${pulseCls} ${className}`}
      style={{ width: px, height: px }}
      data-testid="wladbot-avatar"
    >
      {/* Real avatar image with graceful fallback */}
      <img
        src={AVATAR_SRC}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Hide broken image → gradient + Sparkles below becomes visible.
          e.currentTarget.style.display = 'none';
        }}
      />
      {/* Fallback icon shown behind image (visible only if img errors out) */}
      <Sparkles
        size={Math.max(10, Math.round(size * 0.42))}
        className="absolute text-[#0A0A0A]"
        strokeWidth={2.6}
        aria-hidden="true"
      />
    </span>
  );
};

export default WladBotAvatar;
