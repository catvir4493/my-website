"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionPreferences } from "./motion-provider";
import { moduleLoad, motionTiming, systemEase } from "@/lib/motion";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { lite, paused } = useMotionPreferences();
  return (
    <motion.div
      className={`module-reveal ${className}`}
      initial={false}
      whileInView={lite || paused ? {} : { ...moduleLoad, opacity: 1 }}
      onViewportEnter={(entry) => entry?.target.setAttribute("data-online", "true")}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: motionTiming.system, ease: systemEase }}
    >
      {children}
    </motion.div>
  );
}
