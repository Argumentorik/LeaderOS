"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export const Timeline = ({ data, heading, subheading }) => {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full font-sans md:px-10" ref={containerRef} data-testid="aceternity-timeline">
      {(heading || subheading) && (
        <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 md:px-8 lg:px-10">
          {heading && (
            <h2 className="font-manrope text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-white max-w-3xl mb-5">
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
              {subheading}
            </p>
          )}
        </div>
      )}

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-32 md:gap-10"
            data-testid={`timeline-item-${index}`}
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-32 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black flex items-center justify-center border border-[#C8FF00]/20">
                <div className="h-3.5 w-3.5 rounded-full bg-[#C8FF00] shadow-[0_0_18px_rgba(200,255,0,0.6)]" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-extrabold tracking-tight text-white/85 font-manrope">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-extrabold text-[#C8FF00] tracking-tight font-manrope">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-white/[0.08] to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[#C8FF00] via-[#A8E600] to-transparent from-[0%] via-[15%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
