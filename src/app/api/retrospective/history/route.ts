import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { retrospectives } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
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

  const userRetrospectives = await db.query.retrospectives.findMany({
    where: eq(retrospectives.userId, userId),
    orderBy: [desc(retrospectives.createdAt)],
  });

  return NextResponse.json(userRetrospectives);
}
