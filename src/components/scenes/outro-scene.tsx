"use client";

import { motion } from "framer-motion";

export function OutroScene() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8">
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="text-3xl font-extrabold tracking-tight"
      >
        <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          GitHub Profile Analyse
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-sm text-white/50"
      >
        Desenvolvido por{" "}
        <span className="font-medium text-violet-400">spag.dev</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
      />
    </div>
  );
}
