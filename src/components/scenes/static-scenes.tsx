/**
 * Static (non-animated) versions of scene components for image capture/sharing.
 * These render the same visuals but without Framer Motion, so html-to-image
 * can capture them cleanly at 1080x1920.
 */

import type { GitHubData, AITexts } from "@/lib/types";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

interface StaticSceneProps {
  scene: number;
  githubData: GitHubData;
  aiTexts: AITexts;
  periodStart: string;
  periodEnd: string;
}

export function StaticScene({ scene, githubData, aiTexts, periodStart, periodEnd }: StaticSceneProps) {
  switch (scene) {
    case 0:
      return <StaticIntro username={githubData.profile.username} avatarUrl={githubData.profile.avatarUrl} periodStart={periodStart} periodEnd={periodEnd} />;
    case 1:
      return <StaticCommits total={githubData.commits.total} message={aiTexts.commitMessage} />;
    case 2:
      return <StaticStreak maxStreak={githubData.commits.maxStreak} message={aiTexts.streakMessage} />;
    case 3:
      return <StaticLanguages languages={githubData.languages} message={aiTexts.languageComment} />;
    case 4:
      return <StaticRepo repos={githubData.repositories.topContributed} newCreated={githubData.repositories.newCreated} starsReceived={githubData.repositories.starsReceived} />;
    case 5:
      return <StaticProductivity hourlyDistribution={githubData.commits.hourlyDistribution} message={aiTexts.productivityMessage} />;
    case 6:
      return <StaticPrs opened={githubData.pullRequests.opened} merged={githubData.pullRequests.merged} reviewsDone={githubData.pullRequests.reviewsDone} message={aiTexts.prMessage} />;
    case 7:
      return <StaticPersonality summary={aiTexts.personalitySummary} />;
    case 8:
      return <StaticOutro />;
    default:
      return null;
  }
}

function StaticIntro({ username, avatarUrl, periodStart, periodEnd }: { username: string; avatarUrl: string; periodStart: string; periodEnd: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 48, padding: "0 48px", background: "#030712", color: "white" }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", opacity: 0.6, filter: "blur(16px)" }} />
        <img src={avatarUrl} alt={username} crossOrigin="anonymous" style={{ position: "relative", width: 192, height: 192, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.2)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, background: "linear-gradient(to right, #a78bfa, #c084fc, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          Seu GitHub Wrapped
        </h1>
        <p style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.8)", margin: 0 }}>@{username}</p>
      </div>
      <p style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", margin: 0 }}>
        {formatDate(periodStart)} — {formatDate(periodEnd)}
      </p>
    </div>
  );
}

function StaticCommits({ total, message }: { total: number; message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 32, padding: "0 48px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: 4 }}>Total de commits</p>
      <p style={{ fontSize: 120, fontWeight: 800, background: "linear-gradient(to right, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, lineHeight: 1 }}>
        {total.toLocaleString()}
      </p>
      <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center", maxWidth: 800 }}>{message}</p>
    </div>
  );
}

function StaticStreak({ maxStreak, message }: { maxStreak: number; message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 32, padding: "0 48px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 64, margin: 0 }}>🔥</p>
      <p style={{ fontSize: 100, fontWeight: 800, background: "linear-gradient(to right, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, lineHeight: 1 }}>
        {maxStreak}
      </p>
      <p style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", margin: 0 }}>dias de streak</p>
      <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center", maxWidth: 800 }}>{message}</p>
    </div>
  );
}

function StaticLanguages({ languages, message }: { languages: GitHubData["languages"]; message: string }) {
  const colors = ["#8b5cf6", "#a78bfa", "#60a5fa", "#22d3ee", "#34d399"];
  const top5 = languages.slice(0, 5);
  const maxPct = Math.max(...top5.map((l) => l.percentage), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 40, padding: "0 48px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Linguagens</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        {top5.map((lang, i) => (
          <div key={lang.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", width: 140, textAlign: "right" }}>{lang.name}</span>
            <div style={{ flex: 1, height: 32, background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${(lang.percentage / maxPct) * 100}%`, height: "100%", background: colors[i] ?? colors[0], borderRadius: 8 }} />
            </div>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", width: 60 }}>{lang.percentage}%</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center", maxWidth: 800 }}>{message}</p>
    </div>
  );
}

function StaticRepo({ repos, newCreated, starsReceived }: { repos: GitHubData["repositories"]["topContributed"]; newCreated: number; starsReceived: number }) {
  const top = repos[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 40, padding: "0 48px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Repositório destaque</p>
      {top && (
        <div style={{ padding: 32, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, background: "rgba(255,255,255,0.02)", width: "100%" }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#a78bfa", margin: "0 0 12px 0" }}>{top.name}</p>
          {top.description && <p style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", margin: 0 }}>{top.description}</p>}
        </div>
      )}
      <div style={{ display: "flex", gap: 48 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#a78bfa", margin: 0 }}>{newCreated}</p>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", margin: 0 }}>novos repos</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#fbbf24", margin: 0 }}>{starsReceived}</p>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", margin: 0 }}>stars</p>
        </div>
      </div>
    </div>
  );
}

function StaticProductivity({ hourlyDistribution, message }: { hourlyDistribution: number[]; message: string }) {
  const max = Math.max(...hourlyDistribution, 1);
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 32, padding: "0 48px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Horário mais produtivo</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 200, width: "100%" }}>
        {hourlyDistribution.map((count, hour) => (
          <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: "100%", borderRadius: 4,
              height: `${Math.max((count / max) * 160, 4)}px`,
              background: hour === peakHour ? "linear-gradient(to top, #8b5cf6, #60a5fa)" : "rgba(255,255,255,0.1)",
            }} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 24, fontWeight: 600, color: "#a78bfa", margin: 0 }}>Pico às {peakHour}h</p>
      <p style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center", maxWidth: 800 }}>{message}</p>
    </div>
  );
}

function StaticPrs({ opened, merged, reviewsDone, message }: { opened: number; merged: number; reviewsDone: number; message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 40, padding: "0 48px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>Pull Requests & Reviews</p>
      <div style={{ display: "flex", gap: 48 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 56, fontWeight: 800, color: "#34d399", margin: 0 }}>{opened}</p>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", margin: 0 }}>abertos</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 56, fontWeight: 800, color: "#a78bfa", margin: 0 }}>{merged}</p>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", margin: 0 }}>mergeados</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 56, fontWeight: 800, color: "#60a5fa", margin: 0 }}>{reviewsDone}</p>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", margin: 0 }}>reviews</p>
        </div>
      </div>
      <p style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center", maxWidth: 800 }}>{message}</p>
    </div>
  );
}

function StaticPersonality({ summary }: { summary: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 32, padding: "0 64px", background: "#030712", color: "white" }}>
      <p style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: 4 }}>Sua personalidade dev</p>
      <div style={{ position: "relative", textAlign: "center" }}>
        <span style={{ fontSize: 80, color: "rgba(139,92,246,0.3)", position: "absolute", top: -40, left: -20 }}>"</span>
        <p style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: "0 20px" }}>{summary}</p>
        <span style={{ fontSize: 80, color: "rgba(139,92,246,0.3)", position: "absolute", bottom: -60, right: -20 }}>"</span>
      </div>
    </div>
  );
}

function StaticOutro() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", gap: 24, background: "#030712", color: "white" }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, background: "linear-gradient(to right, #a78bfa, #c084fc, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
        GitHub Wrapped
      </h1>
      <p style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", margin: 0 }}>Gere o seu em githubwrapped.dev</p>
    </div>
  );
}
