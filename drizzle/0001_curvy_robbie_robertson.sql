CREATE TABLE `study_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`owner_id` text NOT NULL,
	`invite_code` text NOT NULL,
	`daily_goal` integer DEFAULT 120 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_groups_invite_unique` ON `study_groups` (`invite_code`);--> statement-breakpoint
CREATE TABLE `study_members` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`member_id` text NOT NULL,
	`display_name` text NOT NULL,
	`share_time` integer DEFAULT 0 NOT NULL,
	`focusing` integer DEFAULT 0 NOT NULL,
	`heartbeat` text,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`),
	FOREIGN KEY (`group_id`) REFERENCES `study_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_members_id_unique` ON `study_members` (`member_id`);