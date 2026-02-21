"use client";

import { motion } from "framer-motion";

interface RepoSceneProps {
  repos: { name: string; description: string | null }[];
  newCreated: number;
  starsReceived: number;
}

export function RepoScene({ repos, newCreated, starsReceived }: RepoSceneProps) {
  const featured = repos[0];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xl font-bold text-white/90"
      >
        Repositorios
      </motion.h2>

      {featured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
            <span className="text-sm font-bold text-white">{featured.name}</span>
          </div>
          {featured.description && (
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              {featured.description}
            </p>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex gap-8"
      >
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-white">{newCreated}</span>
          <span className="text-xs text-white/50">novos repos</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-yellow-400">{starsReceived}</span>
          <span className="text-xs text-white/50">stars recebidas</span>
        </div>
      </motion.div>
    </div>
  );
}
