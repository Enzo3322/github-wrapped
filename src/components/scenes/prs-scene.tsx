"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PrsSceneProps {
  opened: number;
  merged: number;
  reviewsDone: number;
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

export function PrsScene({ opened, merged, reviewsDone, message }: PrsSceneProps) {
  const openedCount = useCountUp(opened);
  const mergedCount = useCountUp(merged);
  const reviewsCount = useCountUp(reviewsDone);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xl font-bold text-white/90"
      >
        Pull Requests
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex w-full max-w-xs justify-around"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-4xl font-black tabular-nums text-transparent">
            {openedCount}
          </span>
          <span className="text-xs text-white/50">abertos</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-4xl font-black tabular-nums text-transparent">
            {mergedCount}
          </span>
          <span className="text-xs text-white/50">mergeados</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-4xl font-black tabular-nums text-transparent">
            {reviewsCount}
          </span>
          <span className="text-xs text-white/50">reviews</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="max-w-xs text-center text-sm leading-relaxed text-white/60"
      >
        {message}
      </motion.p>
    </div>
  );
}
