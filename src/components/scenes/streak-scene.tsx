"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StreakSceneProps {
  maxStreak: number;
  message: string;
}

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);

  return count;
}

export function StreakScene({ maxStreak, message }: StreakSceneProps) {
  const count = useCountUp(maxStreak);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-8">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="flex flex-col items-center"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-5xl">&#x1F525;</span>
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-7xl font-black tabular-nums text-transparent">
            {count}
          </span>
        </div>
        <span className="mt-2 text-xl font-semibold text-white/70">dias de streak</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="max-w-xs text-center text-sm leading-relaxed text-white/60"
      >
        {message}
      </motion.p>
    </div>
  );
}
