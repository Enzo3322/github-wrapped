"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import Link from "next/link";
import type { RetrospectiveData, GitHubData, AITexts } from "@/lib/types";

import { IntroScene } from "@/components/scenes/intro-scene";
import { CommitsScene } from "@/components/scenes/commits-scene";
import { StreakScene } from "@/components/scenes/streak-scene";
import { LanguagesScene } from "@/components/scenes/languages-scene";
import { RepoScene } from "@/components/scenes/repo-scene";
import { ProductivityScene } from "@/components/scenes/productivity-scene";
import { PrsScene } from "@/components/scenes/prs-scene";
import { PersonalityScene } from "@/components/scenes/personality-scene";
import { OutroScene } from "@/components/scenes/outro-scene";
import { StaticScene } from "@/components/scenes/static-scenes";

interface ApiRetrospective {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  periodStart: string;
  periodEnd: string;
  githubData: GitHubData | null;
  aiTexts: AITexts | null;
}

const SCENE_DURATION = 4000;
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
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/retrospective/${id}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Retrospectiva nao encontrada" : "Erro ao carregar");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Erro de conexao");
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll while processing
  useEffect(() => {
    if (!data || (data.status !== "pending" && data.status !== "processing")) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [data, fetchData]);

  // Auto-advance scenes
  useEffect(() => {
    if (!data || data.status !== "ready" || isPaused) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES);
    }, SCENE_DURATION);
    return () => clearInterval(interval);
  }, [data, isPaused]);

  function goToScene(index: number) {
    setDirection(index > currentScene ? 1 : -1);
    setCurrentScene(index);
  }

  function handleClick() {
    setDirection(1);
    setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES);
  }

  async function captureScene(): Promise<Blob> {
    const offscreen = document.createElement("div");
    offscreen.style.cssText = `
      position: fixed; left: -9999px; top: 0;
      width: 1080px; height: 1920px;
      background: #030712; overflow: hidden;
      font-family: ${getComputedStyle(document.body).fontFamily};
    `;
    document.body.appendChild(offscreen);

    const { createRoot } = await import("react-dom/client");
    const sceneElement = document.createElement("div");
    sceneElement.style.cssText = "width: 100%; height: 100%;";
    offscreen.appendChild(sceneElement);

    const root = createRoot(sceneElement);
    const { flushSync } = await import("react-dom");
    const { createElement } = await import("react");

    flushSync(() => {
      root.render(
        createElement(StaticScene, {
          scene: currentScene,
          githubData,
          aiTexts,
          periodStart: data!.periodStart,
          periodEnd: data!.periodEnd,
        })
      );
    });

    const images = offscreen.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    const dataUrl = await toPng(offscreen, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true });
    root.unmount();
    document.body.removeChild(offscreen);

    return await (await fetch(dataUrl)).blob();
  }

  function showSuccess(msg: string) {
    setShareSuccess(msg);
    setTimeout(() => setShareSuccess(null), 2500);
  }

  async function handleCopy() {
    if (isSharing) return;
    setIsSharing(true);
    setIsPaused(true);
    try {
      const blob = await captureScene();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showSuccess("Imagem copiada! Cole no WhatsApp Web");
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setIsSharing(false);
    }
  }

  async function handleDownload() {
    if (isSharing) return;
    setIsSharing(true);
    setIsPaused(true);
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
    } finally {
      setIsSharing(false);
    }
  }

  async function handleNativeShare() {
    if (isSharing) return;
    setIsSharing(true);
    setIsPaused(true);
    try {
      const blob = await captureScene();
      const file = new File([blob], "github-wrapped.png", { type: "image/png" });
      await navigator.share({ files: [file], title: "Meu GitHub Wrapped" });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
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

  // Error state
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

  // Ready state - render scenes
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4 py-8">
      {/* Phone frame */}
      <div
        ref={frameRef}
        className="relative w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#030712] shadow-2xl shadow-violet-500/5"
        style={{ aspectRatio: "9/16" }}
        onClick={handleClick}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentScene}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {renderScene(currentScene)}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
          {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToScene(i);
              }}
            >
              <motion.div
                className="h-full bg-white/70 rounded-full"
                initial={false}
                animate={{
                  width: i < currentScene ? "100%" : i === currentScene ? "100%" : "0%",
                }}
                transition={
                  i === currentScene
                    ? { duration: SCENE_DURATION / 1000, ease: "linear" }
                    : { duration: 0.2 }
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_SCENES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToScene(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentScene
                ? "w-6 bg-violet-400"
                : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Share actions */}
      <div className="flex flex-col items-center gap-3">
        {shareSuccess && (
          <p className="text-sm text-green-400 animate-pulse">{shareSuccess}</p>
        )}
        <div className="flex gap-3">
          {/* Copy to clipboard - for WhatsApp Web */}
          <button
            onClick={handleCopy}
            disabled={isSharing}
            className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            {isSharing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
            )}
            Copiar
          </button>

          {/* Download - for Instagram */}
          <button
            onClick={handleDownload}
            disabled={isSharing}
            className="flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-400 disabled:opacity-50"
          >
            {isSharing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            Baixar
          </button>

          {/* Native share - only on mobile */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              disabled={isSharing}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
              Mais
            </button>
          )}
        </div>
        <p className="text-xs text-white/30">Copie e cole no WhatsApp Web, ou baixe para o Instagram</p>
      </div>

      <Link
        href="/dashboard"
        className="text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        &larr; Voltar
      </Link>
    </div>
  );
}
