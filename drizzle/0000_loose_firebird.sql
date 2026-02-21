CREATE TABLE `retrospectives` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`github_data` text,
	`ai_texts` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`video_url` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`github_id` text NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`access_token` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_github_id_unique` ON `users` (`github_id`);