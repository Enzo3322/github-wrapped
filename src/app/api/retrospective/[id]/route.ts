import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { retrospectives } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const retrospective = await db.query.retrospectives.findFirst({
    where: and(
      eq(retrospectives.id, id),
      eq(retrospectives.userId, userId)
    ),
  });

  if (!retrospective) {
    return NextResponse.json(
      { error: "Retrospective not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(retrospective);
}
