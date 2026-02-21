"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { GitHubData, AITexts } from "@/lib/types";
import { renderSceneToBlob } from "@/lib/canvas-renderer";

import { IntroScene } from "@/components/scenes/intro-scene";
import { CommitsScene } from "@/components/scenes/commits-scene";
import { StreakScene } from "@/components/scenes/streak-scene";
import { LanguagesScene } from "@/components/scenes/languages-scene";
import { RepoScene } from "@/components/scenes/repo-scene";
import { ProductivityScene } from "@/components/scenes/productivity-scene";
import { PrsScene } from "@/components/scenes/prs-scene";
import { PersonalityScene } from "@/components/scenes/personality-scene";
import { OutroScene } from "@/components/scenes/outro-scene";

interface ApiRetrospective {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  periodStart: string;
  periodEnd: string;
  githubData: GitHubData | null;
  aiTexts: AITexts | null;
}

const SCENE_DURATION = 5000;
const TOTAL_SCENES = 9;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function RetrospectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [data, setData] = useState<ApiRetrospective | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  // Long-press detection
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/retrospective/${id}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Retrospectiva não encontrada" : "Erro ao carregar");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Erro de conexão");
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!data || (data.status !== "pending" && data.status !== "processing")) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [data, fetchData]);

  // Auto-advance with progress reset
  useEffect(() => {
    if (!data || data.status !== "ready" || isPaused) return;
    const timeout = setTimeout(() => {
      setDirection(1);
      setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES);
      setProgressKey((k) => k + 1);
    }, SCENE_DURATION);
    return () => clearTimeout(timeout);
  }, [data, isPaused, currentScene, progressKey]);

  function goNext() {
    setDirection(1);
    setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES);
    setProgressKey((k) => k + 1);
  }

  function goPrev() {
    setDirection(-1);
    setCurrentScene((prev) => (prev - 1 + TOTAL_SCENES) % TOTAL_SCENES);
    setProgressKey((k) => k + 1);
  }

  // Instagram-style tap: left 30% = prev, right 70% = next
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (isPressedRef.current) return; // was a long press, ignore
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) {
      goPrev();
    } else {
      goNext();
    }
  }

  // Long press = pause (Instagram style)
  function handlePointerDown() {
    isPressedRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isPressedRef.current = true;
      setIsPaused(true);
    }, 200);
  }

  function handlePointerUp() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isPressedRef.current) {
      setIsPaused(false);
      isPressedRef.current = false;
    }
  }

  async function captureScene(): Promise<Blob> {
    return renderSceneToBlob(currentScene, githubData, aiTexts, data!.periodStart, data!.periodEnd);
  }

  function showSuccess(msg: string) {
    setShareSuccess(msg);
    setTimeout(() => setShareSuccess(null), 2500);
  }

  async function handleCopy() {
    if (isSharing) return;
    setIsSharing(true);
    setIsPaused(true);
    setShareError(null);
    try {
      const blob = await captureScene();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showSuccess("Imagem copiada!");
    } catch (err) {
      console.error("Copy failed:", err);
      setShareError("Erro ao copiar imagem");
    } finally {
      setIsSharing(false);
    }
  }

  async function handleDownload() {
    if (isSharing) return;
    setIsSharing(true);
    setIsPaused(true);
    setShareError(null);
    try {
      const blob = await captureScene();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `github-wrapped-${currentScene + 1}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("Imagem salva!");
    } catch (err) {
      console.error("Download failed:", err);
      setShareError("Erro ao baixar imagem");
    } finally {
      setIsSharing(false);
    }
  }

  async function handleNativeShare() {
    if (isSharing) return;
    setIsSharing(true);
    setIsPaused(true);
    setShareError(null);
    try {
      const blob = await captureScene();
      const file = new File([blob], "github-wrapped.png", { type: "image/png" });
      await navigator.share({ files: [file], title: "Meu GitHub Wrapped" });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
        setShareError("Erro ao compartilhar");
      }
    } finally {
      setIsSharing(false);
    }
  }

  // Loading / processing state
  if (!data || data.status === "pending" || data.status === "processing") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="text-sm text-white/60">
          {!data ? "Carregando..." : "Processando sua retrospectiva..."}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          &larr; Voltar
        </Link>
      </div>
    );
  }

  if (error || data.status === "failed") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-6">
        <div className="rounded-full bg-red-500/10 p-4">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-sm text-white/60">{error || "Falha ao gerar retrospectiva"}</p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          &larr; Voltar
        </Link>
      </div>
    );
  }

  const githubData = data.githubData as GitHubData;
  const aiTexts = data.aiTexts as AITexts;

  if (!githubData || !aiTexts) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-white/60">Dados incompletos</p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          &larr; Voltar
        </Link>
      </div>
    );
  }

  function renderScene(index: number) {
    switch (index) {
      case 0:
        return (
          <IntroScene
            username={githubData.profile.username}
            avatarUrl={githubData.profile.avatarUrl}
            periodStart={data!.periodStart}
            periodEnd={data!.periodEnd}
          />
        );
      case 1:
        return (
          <CommitsScene
            total={githubData.commits.total}
            message={aiTexts.commitMessage}
          />
        );
      case 2:
        return (
          <StreakScene
            maxStreak={githubData.commits.maxStreak}
            message={aiTexts.streakMessage}
          />
        );
      case 3:
        return (
          <LanguagesScene
            languages={githubData.languages}
            message={aiTexts.languageComment}
          />
        );
      case 4:
        return (
          <RepoScene
            repos={githubData.repositories.topContributed}
            newCreated={githubData.repositories.newCreated}
            starsReceived={githubData.repositories.starsReceived}
          />
        );
      case 5:
        return (
          <ProductivityScene
            hourlyDistribution={githubData.commits.hourlyDistribution}
            message={aiTexts.productivityMessage}
          />
        );
      case 6:
        return (
          <PrsScene
            opened={githubData.pullRequests.opened}
            merged={githubData.pullRequests.merged}
            reviewsDone={githubData.pullRequests.reviewsDone}
            message={aiTexts.prMessage}
          />
        );
      case 7:
        return (
          <PersonalityScene summary={aiTexts.personalitySummary} />
        );
      case 8:
        return <OutroScene />;
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4 py-6">
      {/* Stories viewer - Instagram style */}
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#030712] shadow-2xl shadow-violet-500/5 select-none"
        style={{ aspectRatio: "9/16" }}
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Progress bars - Instagram style */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-[3px] px-2 pt-2">
          {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
            <div
              key={i}
              className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/25"
            >
              {i < currentScene ? (
                <div className="h-full w-full rounded-full bg-white/90" />
              ) : i === currentScene ? (
                <motion.div
                  key={`progress-${i}-${progressKey}`}
                  className="h-full rounded-full bg-white/90"
                  initial={{ width: "0%" }}
                  animate={{ width: isPaused ? undefined : "100%" }}
                  transition={{
                    duration: SCENE_DURATION / 1000,
                    ease: "linear",
                  }}
                  style={isPaused ? {} : undefined}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Username header - Instagram style */}
        <div className="absolute top-5 left-0 right-0 z-20 flex items-center gap-2 px-3 pt-2">
          <img
            src={githubData.profile.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full border border-white/20"
          />
          <span className="text-sm font-semibold text-white/90">
            @{githubData.profile.username}
          </span>
        </div>

        {/* Scene content */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentScene}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {renderScene(currentScene)}
          </motion.div>
        </AnimatePresence>

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/40 p-3">
              <svg className="h-6 w-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Share actions */}
      <div className="flex flex-col items-center gap-2">
        {shareError && (
          <p className="text-sm text-red-400">{shareError}</p>
        )}
        {shareSuccess && (
          <p className="text-sm text-green-400">{shareSuccess}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={isSharing}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            {isSharing ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
            )}
            Copiar
          </button>

          <button
            onClick={handleDownload}
            disabled={isSharing}
            className="flex items-center gap-1.5 rounded-full bg-violet-500 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-400 disabled:opacity-50"
          >
            {isSharing ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            Baixar
          </button>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              disabled={isSharing}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
              Mais
            </button>
          )}
        </div>
      </div>

      <Link
        href="/dashboard"
        className="text-xs text-white/30 hover:text-white/50 transition-colors"
      >
        &larr; Voltar ao dashboard
      </Link>
    </div>
  );
}
