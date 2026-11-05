"use client";
/**
 * DraggableCard (Aceternity port) · framer-motion based.
 *
 * - 3D tilt follows mouse (perspective container does the heavy lift)
 * - Drag with momentum + spring bounce on release
 * - Subtle white glare overlay that intensifies with tilt magnitude
 *
 * Ported from the TS version to plain JSX so it fits the existing CRA setup.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useVelocity,
  useAnimationControls,
} from "framer-motion";
import { cn } from "../../lib/utils";

const springConfig = { stiffness: 100, damping: 20, mass: 0.5 };

export const DraggableCardBody = ({ className, children, ...rest }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef(null);
  const controls = useAnimationControls();
  const [constraints, setConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  const velocityX = useVelocity(mouseX);
  const velocityY = useVelocity(mouseY);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [25, -25]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-25, 25]), springConfig);
  const opacity = useSpring(useTransform(mouseX, [-300, 0, 300], [0.85, 1, 0.85]), springConfig);
  const glareOpacity = useSpring(useTransform(mouseX, [-300, 0, 300], [0.18, 0, 0.18]), springConfig);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setConstraints({
        top: -window.innerHeight / 2,
        left: -window.innerWidth / 2,
        right: window.innerWidth / 2,
        bottom: window.innerHeight / 2,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(clientX - centerX);
    mouseY.set(clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      drag
      dragConstraints={constraints}
      onDragStart={() => {
        document.body.style.cursor = "grabbing";
      }}
      onDragEnd={(_event, info) => {
        document.body.style.cursor = "default";
        controls.start({
          rotateX: 0,
          rotateY: 0,
          transition: { type: "spring", ...springConfig },
        });
        const vX = velocityX.get();
        const vY = velocityY.get();
        const mag = Math.sqrt(vX * vX + vY * vY);
        const bounce = Math.min(0.8, mag / 1000);
        animate(info.point.x, info.point.x + vX * 0.3, {
          duration: 0.8,
          ease: [0.2, 0, 0, 1],
          bounce,
          type: "spring",
          stiffness: 50,
          damping: 15,
          mass: 0.8,
        });
        animate(info.point.y, info.point.y + vY * 0.3, {
          duration: 0.8,
          ease: [0.2, 0, 0, 1],
          bounce,
          type: "spring",
          stiffness: 50,
          damping: 15,
          mass: 0.8,
        });
      }}
      style={{ rotateX, rotateY, opacity, willChange: "transform" }}
      animate={controls}
      whileHover={{ scale: 1.04 }}
      whileTap={{ cursor: "grabbing" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-64 md:w-72 min-h-[20rem] cursor-grab overflow-hidden rounded-2xl bg-[#0d0d0d] border border-white/[0.08] p-6 shadow-2xl shadow-black/40",
        className
      )}
      {...rest}
    >
      {children}
      <motion.div
        style={{ opacity: glareOpacity }}
        className="pointer-events-none absolute inset-0 bg-white select-none"
      />
    </motion.div>
  );
};

export const DraggableCardContainer = ({ className, children }) => (
  <div className={cn("[perspective:3000px]", className)}>{children}</div>
);
