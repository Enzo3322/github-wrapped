"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton } from "@/components/auth/sign-in-button";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="bg-linear-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            GitHub Wrapped
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-400 sm:text-xl">
          Transforme sua atividade no GitHub em uma retrospectiva visual
          incrível
        </p>

        <div className="mt-10">
          {status === "loading" ? (
            <div className="h-12 w-48 animate-pulse rounded-lg bg-white/10" />
          ) : session?.user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-blue-600 px-8 py-3 font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:scale-105 active:scale-100"
            >
              Ver meu Wrapped
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          ) : (
            <SignInButton />
          )}
        </div>
      </motion.div>
    </div>
  );
}
