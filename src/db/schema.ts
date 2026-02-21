import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  githubId: text("github_id").notNull().unique(),
  username: text("username").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  accessToken: text("access_token").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const retrospectives = sqliteTable("retrospectives", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  githubData: text("github_data", { mode: "json" }),
  aiTexts: text("ai_texts", { mode: "json" }),
  status: text("status", { enum: ["pending", "processing", "ready", "failed"] }).notNull().default("pending"),
  videoUrl: text("video_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
