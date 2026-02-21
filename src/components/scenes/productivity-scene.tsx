"use client";

import { motion } from "framer-motion";

interface ProductivitySceneProps {
  hourlyDistribution: number[];
  message: string;
}

export function ProductivityScene({ hourlyDistribution, message }: ProductivitySceneProps) {
  const max = Math.max(...hourlyDistribution, 1);
  const peakHour = hourlyDistribution.indexOf(max);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xl font-bold text-white/90"
      >
        Produtividade
      </motion.h2>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex w-full max-w-xs items-end justify-center gap-[3px]"
        style={{ height: 120 }}
      >
        {hourlyDistribution.map((value, hour) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          const isPeak = hour === peakHour;
          return (
            <motion.div
              key={hour}
              className={`w-2 rounded-t-sm ${
                isPeak
                  ? "bg-gradient-to-t from-violet-500 to-blue-400"
                  : "bg-white/20"
              }`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 2)}%` }}
              transition={{ duration: 0.6, delay: 0.3 + hour * 0.02, ease: "easeOut" }}
            />
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="flex w-full max-w-xs justify-between text-[10px] text-white/30"
      >
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-center text-sm font-medium text-violet-400"
      >
        Pico as {peakHour}h
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="max-w-xs text-center text-sm leading-relaxed text-white/60"
      >
        {message}
      </motion.p>
    </div>
  );
}
