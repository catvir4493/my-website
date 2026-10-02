"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMotionPreferences } from "./motion-provider";
export function LogEntry({
  date,
  title,
  description,
}: {
  date: string;
  title: string;
  description: string;
}) {
  const [visible, setVisible] = useState(false);
  const { paused, lite } = useMotionPreferences();
  return (
    <motion.div
      className={`log-entry ${visible && !paused && !lite ? "is-visible" : ""}`}
      onViewportEnter={() => setVisible(true)}
      viewport={{ once: true, amount: 0.5 }}
    >
      <span className="log-dot" />
      <span className="mono text-cyan">{date}</span>
      <h3>
        <span>&gt;</span> {title}
      </h3>
      <p>{description}</p>
    </motion.div>
  );
}
