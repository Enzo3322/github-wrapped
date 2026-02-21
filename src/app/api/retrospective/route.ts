import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, retrospectives } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchGitHubData } from "@/lib/github";
import { generateCreativeTexts } from "@/lib/gemini";

async function processRetrospective(
  retrospectiveId: string,
  accessToken: string,
  username: string,
  periodStart: string,
  periodEnd: string
) {
  try {
    const githubData = await fetchGitHubData(
      accessToken,
      username,
      periodStart,
      periodEnd
    );

    const aiTexts = await generateCreativeTexts(githubData);

    await db
      .update(retrospectives)
      .set({
        githubData,
        aiTexts,
        status: "ready",
        updatedAt: new Date(),
      })
      .where(eq(retrospectives.id, retrospectiveId));
  } catch (error) {
    console.error("Error processing retrospective:", error);
    await db
      .update(retrospectives)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(retrospectives.id, retrospectiveId));
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as unknown as Record<string, unknown>).userId as
    | string
    | undefined;

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const body = await request.json();
  const { periodStart, periodEnd } = body;

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 }
    );
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [retrospective] = await db
    .insert(retrospectives)
    .values({
      userId,
      periodStart,
      periodEnd,
      status: "processing",
    })
    .returning();

  // Kick off background processing (don't await)
  processRetrospective(
    retrospective.id,
    dbUser.accessToken,
    dbUser.username,
    periodStart,
    periodEnd
  );

  return NextResponse.json({ id: retrospective.id, status: "processing" });
}
