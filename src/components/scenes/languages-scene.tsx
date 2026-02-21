"use client";

import { motion } from "framer-motion";

interface LanguagesSceneProps {
  languages: { name: string; percentage: number }[];
  message: string;
}

const BAR_COLORS = [
  "from-violet-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-green-500",
  "from-amber-500 to-yellow-500",
  "from-rose-500 to-pink-500",
];

export function LanguagesScene({ languages, message }: LanguagesSceneProps) {
  const top5 = languages.slice(0, 5);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xl font-bold text-white/90"
      >
        Linguagens
      </motion.h2>

      <div className="w-full max-w-xs space-y-4">
        {top5.map((lang, i) => (
          <motion.div
            key={lang.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">{lang.name}</span>
              <span className="text-xs tabular-nums text-white/50">
                {lang.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]}`}
                initial={{ width: 0 }}
                animate={{ width: `${lang.percentage}%` }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="max-w-xs text-center text-sm leading-relaxed text-white/60"
      >
        {message}
      </motion.p>
    </div>
  );
}
