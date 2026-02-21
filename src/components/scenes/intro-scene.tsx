"use client";

import { motion } from "framer-motion";

interface IntroSceneProps {
  username: string;
  avatarUrl: string;
  periodStart: string;
  periodEnd: string;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function IntroScene({ username, avatarUrl, periodStart, periodEnd }: IntroSceneProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="relative"
      >
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 opacity-60 blur-md" />
        <img
          src={avatarUrl}
          alt={username}
          className="relative h-32 w-32 rounded-full border-2 border-white/20"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Seu GitHub Wrapped
          </span>
        </h1>
        <p className="text-lg font-medium text-white/80">@{username}</p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-sm text-white/50"
      >
        {formatDate(periodStart)} &mdash; {formatDate(periodEnd)}
      </motion.p>
    </div>
  );
}
