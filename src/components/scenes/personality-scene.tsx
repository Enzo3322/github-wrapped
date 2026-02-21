"use client";

import { motion } from "framer-motion";

interface PersonalitySceneProps {
  summary: string;
}

export function PersonalityScene({ summary }: PersonalitySceneProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-8">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-bold text-white/70"
      >
        Sua personalidade dev:
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative max-w-xs"
      >
        <span className="absolute -left-4 -top-4 text-5xl font-serif text-violet-500/30">
          &ldquo;
        </span>
        <p className="relative z-10 text-center text-lg font-medium leading-relaxed text-white/90">
          {summary}
        </p>
        <span className="absolute -bottom-6 -right-2 text-5xl font-serif text-violet-500/30">
          &rdquo;
        </span>
      </motion.div>
    </div>
  );
}
