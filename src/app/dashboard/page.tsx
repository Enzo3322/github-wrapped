"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PeriodSelector } from "@/components/period-selector";

interface Retrospective {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "pending" | "processing" | "ready" | "failed";
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-400" },
  processing: { label: "Processando", className: "bg-blue-500/10 text-blue-400" },
  ready: { label: "Pronto", className: "bg-green-500/10 text-green-400" },
  failed: { label: "Falhou", className: "bg-red-500/10 text-red-400" },
} as const;

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Retrospective[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/retrospective/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, fetchHistory]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  function handlePeriodSelect(start: string, end: string) {
    setPeriodStart(start);
    setPeriodEnd(end);
  }

  async function handleGenerate() {
    if (!periodStart || !periodEnd) return;

    setLoading(true);
    try {
      const res = await fetch("/api/retrospective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart, periodEnd }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/retrospective/${data.id}`);
      }
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ola,{" "}
          <span className="bg-linear-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            {session.user.name ?? "dev"}
          </span>
          !
        </h1>

        <p className="mt-2 text-gray-400">
          Selecione um periodo para gerar sua retrospectiva
        </p>
      </motion.div>

      <motion.section
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Periodo
        </h2>
        <PeriodSelector onSelect={handlePeriodSelect} />

        <button
          onClick={handleGenerate}
          disabled={!periodStart || loading}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-blue-600 px-8 py-3 font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:scale-105 active:scale-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Gerando...
            </>
          ) : (
            "Gerar Retrospectiva"
          )}
        </button>
      </motion.section>

      <motion.section
        className="mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Historico
        </h2>

        {historyLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500">
            Nenhuma retrospectiva ainda. Gere a primeira acima!
          </p>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {history.map((item, index) => {
                const statusConfig = STATUS_CONFIG[item.status];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-6 py-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-white">
                        {formatDisplayDate(item.periodStart)} &mdash;{" "}
                        {formatDisplayDate(item.periodEnd)}
                      </span>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {item.status === "ready" && (
                      <Link
                        href={`/retrospective/${item.id}`}
                        className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                      >
                        Ver
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </motion.section>
    </div>
  );
}
