CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`targetType` varchar(64),
	`targetId` int,
	`details` json,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invocationId` int NOT NULL,
	`operatorId` int NOT NULL,
	`challengerWallet` varchar(64) NOT NULL,
	`reason` enum('incorrect_output','timeout','overcharge','schema_violation','malicious_response','other') NOT NULL DEFAULT 'other',
	`description` text,
	`evidenceUrl` varchar(1024),
	`disputeStatus` enum('open','under_review','resolved_for_challenger','resolved_for_operator','dismissed') NOT NULL DEFAULT 'open',
	`resolutionNotes` text,
	`reviewerValidatorId` int,
	`refundAmount` decimal(18,8),
	`slashAmount` decimal(18,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operator_bonds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operatorId` int NOT NULL,
	`bondWallet` varchar(64) NOT NULL,
	`amountLamports` bigint NOT NULL,
	`txSignature` varchar(128),
	`status` enum('active','released','slashed') NOT NULL DEFAULT 'active',
	`slashReason` text,
	`bondedAt` timestamp NOT NULL DEFAULT (now()),
	`releasedAt` timestamp,
	CONSTRAINT `operator_bonds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invocationId` int NOT NULL,
	`txSignature` varchar(128) NOT NULL,
	`totalAmount` decimal(18,8) NOT NULL,
	`operatorShare` decimal(18,8) NOT NULL,
	`protocolShare` decimal(18,8) NOT NULL,
	`validatorShare` decimal(18,8) NOT NULL,
	`burnAmount` decimal(18,8) NOT NULL DEFAULT '0',
	`paymentStatus` enum('pending','settled','failed','refunded') NOT NULL DEFAULT 'pending',
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(128) NOT NULL,
	`endpoint` varchar(256) NOT NULL,
	`requestCount` int NOT NULL DEFAULT 0,
	`windowStart` timestamp NOT NULL DEFAULT (now()),
	`windowSeconds` int NOT NULL DEFAULT 60,
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operatorId` int NOT NULL,
	`reviewerWallet` varchar(64) NOT NULL,
	`reviewerUserId` int,
	`rating` int NOT NULL,
	`comment` text,
	`flagged` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`wallet` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`stakeLamports` bigint NOT NULL DEFAULT 0,
	`status` enum('active','inactive','slashed','pending') NOT NULL DEFAULT 'pending',
	`validatedCount` bigint NOT NULL DEFAULT 0,
	`slashedCount` int NOT NULL DEFAULT 0,
	`reputationScore` int NOT NULL DEFAULT 50,
	`totalEarnings` decimal(18,6) NOT NULL DEFAULT '0',
	`commissionBps` int NOT NULL DEFAULT 500,
	`website` varchar(1024),
	`avatarUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `validators_id` PRIMARY KEY(`id`),
	CONSTRAINT `validators_wallet_unique` UNIQUE(`wallet`)
);
--> statement-breakpoint
ALTER TABLE `invocations` ADD `paymentToken` varchar(512);--> statement-breakpoint
ALTER TABLE `invocations` ADD `paymentVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `operators` ADD `suspensionReason` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `validatorId` int;--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_disputes_operator` ON `disputes` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_disputes_status` ON `disputes` (`disputeStatus`);--> statement-breakpoint
CREATE INDEX `idx_disputes_challenger` ON `disputes` (`challengerWallet`);--> statement-breakpoint
CREATE INDEX `idx_bonds_operator` ON `operator_bonds` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_bonds_status` ON `operator_bonds` (`status`);--> statement-breakpoint
CREATE INDEX `idx_payments_invocation` ON `payments` (`invocationId`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `idx_ratelimit_identifier` ON `rate_limits` (`identifier`,`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_reviews_operator` ON `skill_reviews` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewer` ON `skill_reviews` (`reviewerWallet`);--> statement-breakpoint
CREATE INDEX `idx_validators_status` ON `validators` (`status`);--> statement-breakpoint
CREATE INDEX `idx_validators_reputation` ON `validators` (`reputationScore`);--> statement-breakpoint
CREATE INDEX `idx_invocations_operator` ON `invocations` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_invocations_caller` ON `invocations` (`callerWallet`);--> statement-breakpoint
CREATE INDEX `idx_invocations_created` ON `invocations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_operators_category` ON `operators` (`category`);--> statement-breakpoint
CREATE INDEX `idx_operators_creator` ON `operators` (`creatorWallet`);--> statement-breakpoint
CREATE INDEX `idx_operators_trust` ON `operators` (`trustScore`);--> statement-breakpoint
CREATE INDEX `idx_operators_active` ON `operators` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_reports_operator` ON `reports` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_reports_validator` ON `reports` (`validatorId`);
