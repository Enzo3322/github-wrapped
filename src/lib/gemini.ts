import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GitHubData, AITexts } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateCreativeTexts(data: GitHubData): Promise<AITexts> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Voce e um narrador criativo e bem-humorado para um "GitHub Wrapped" (retrospectiva anual do desenvolvedor). Gere textos curtos e engracados em portugues brasileiro para cada cena do video.

Dados do desenvolvedor @${data.profile.username}:
- Total de commits: ${data.commits.total}
- Streak maximo: ${data.commits.maxStreak} dias
- Linguagens top: ${data.languages.slice(0, 3).map((l) => `${l.name} (${l.percentage}%)`).join(", ")}
- Horario mais ativo: ${data.commits.hourlyDistribution.indexOf(Math.max(...data.commits.hourlyDistribution))}h
- PRs abertos: ${data.pullRequests.opened}, mergeados: ${data.pullRequests.merged}
- Reviews feitos: ${data.pullRequests.reviewsDone}
- Issues abertas: ${data.issues.opened}, fechadas: ${data.issues.closed}
- Repos mais ativos: ${data.repositories.topContributed.slice(0, 3).map((r) => r.name).join(", ")}

Responda APENAS com JSON valido neste formato exato:
{
  "commitMessage": "texto criativo sobre o total de commits (max 15 palavras)",
  "streakMessage": "texto sobre o streak maximo (max 15 palavras)",
  "languageComment": "comentario sobre as linguagens usadas (max 15 palavras)",
  "productivityMessage": "texto sobre o horario mais produtivo (max 15 palavras)",
  "prMessage": "texto sobre PRs e code reviews (max 15 palavras)",
  "personalitySummary": "uma 'personalidade de dev' criativa em 2-3 frases (max 40 palavras)"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]) as AITexts;
}
