"use client";

import { useMotionValue, motion, useMotionTemplate } from "motion/react";
import React, { MouseEvent as ReactMouseEvent, useState } from "react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { cn } from "@/lib/utils";

export const CardSpotlight = ({
  children,
  radius = 350,
  color = "hsl(var(--primary) / 0.12)",
  className,
  ...props
}: {
  radius?: number;
  color?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const [isHovering, setIsHovering] = useState(false);
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  return (
    <div
      className={cn(
        "group/spotlight p-10 rounded-md relative bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 border border-blue-100/80 dark:border-gray-700 hover:border-primary/40 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-inner dark:hover:border-primary/40 transition-all duration-300",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute z-0 -inset-px rounded-md opacity-0 transition duration-300 group-hover/spotlight:opacity-100 bg-gradient-to-tr"
        style={{
          backgroundColor: color,
          maskImage: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 80%
            )
          `,
        }}
      >
        {isHovering && (
          <CanvasRevealEffect
            animationSpeed={2.5}
            containerClassName="bg-transparent absolute inset-0 pointer-events-none"
            colors={[
              [79, 70, 229], // deep indigo
              [59, 130, 246], // bright blue
              [147, 51, 234]  // purple
            ]}
            dotSize={2}
          />
        )}
      </motion.div>
      <div className="relative z-10 [&>h3]:text-gray-900 [&>h3]:font-semibold [&>p]:text-gray-700 dark:text-gray-50">
        {children}
      </div>
    </div>
  );
};
