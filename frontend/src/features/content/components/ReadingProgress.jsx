import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * ReadingProgress · thin lime hairline at the top of the viewport
 * that scrubs with the article's scroll position.
 *
 * Uses framer-motion's useScroll on the document so it doesn't add
 * a raw window scroll listener. The spring smooths the bar so it
 * feels mechanical rather than jumpy.
 */
export const ReadingProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-brand z-50 origin-left pointer-events-none"
    />
  );
};
