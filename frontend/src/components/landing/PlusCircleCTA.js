import { Link } from 'react-router-dom';

/**
 * PlusCircleCTA · THE signature interaction of the Direction-A brand.
 *
 * Visual: a perfect lime-green circle with a black `+` glyph, an
 * underlined action-phrase to its right, with an infinite halo pulse
 * radiating outward to attract the eye (conversion booster). On hover
 * the whole thing pivots slightly up with a stronger lime glow.
 *
 * Pass `to` for internal navigation (React Router) or `href` for
 * external (opens in a new tab by default; pass external=false to
 * disable). The two paths render the same visual.
 *
 * Set `halo={false}` to disable the pulse · use for secondary CTAs or
 * when multiple CTAs sit close (multiple pulsing halos = noise).
 */

const baseClasses =
  'group inline-flex items-center gap-3 text-current ' +
  'transition-all duration-200 ease-out hover:translate-y-[-1px] active:translate-y-0';

const circleWrap =
  'relative flex items-center justify-center w-11 h-11 rounded-full';

const circleClasses =
  'relative z-10 flex items-center justify-center w-11 h-11 rounded-full bg-brand ' +
  'text-[#0A0A0A] font-black text-xl leading-none ' +
  'transition-all duration-200 group-hover:shadow-[0_10px_30px_-8px_rgba(191,255,0,0.7)] ' +
  'group-hover:brightness-105 group-active:scale-[0.96]';

const haloClasses =
  'pointer-events-none absolute top-1/2 left-1/2 w-11 h-11 rounded-full ' +
  'bg-brand/35 animate-cta-halo';

const labelClasses =
  'text-[14px] md:text-[15px] font-bold underline decoration-1 ' +
  'underline-offset-[6px] decoration-current/40 ' +
  'group-hover:decoration-current transition-all';

export const PlusCircleCTA = ({
  href,
  to,
  children,
  className = '',
  testId,
  external = true,
  halo = true,
  onClick,
}) => {
  const sharedProps = {
    className: `${baseClasses} ${className}`,
    'data-testid': testId,
    onClick,
  };

  const inner = (
    <>
      <span aria-hidden className={circleWrap}>
        {halo && <span aria-hidden className={haloClasses} />}
        <span className={circleClasses}>+</span>
      </span>
      <span className={labelClasses}>{children}</span>
    </>
  );

  if (to) {
    return <Link to={to} {...sharedProps}>{inner}</Link>;
  }

  return (
    <a
      href={href || '#'}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      {...sharedProps}
    >
      {inner}
    </a>
  );
};
