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
CREATE TABLE `invocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operatorId` int NOT NULL,
	`callerWallet` varchar(64),
	`amountPaid` decimal(18,8) NOT NULL DEFAULT '0',
	`creatorShare` decimal(18,8) NOT NULL DEFAULT '0',
	`validatorShare` decimal(18,8) NOT NULL DEFAULT '0',
	`treasuryShare` decimal(18,8) NOT NULL DEFAULT '0',
	`burnAmount` decimal(18,8) NOT NULL DEFAULT '0',
	`responseMs` int,
	`success` boolean NOT NULL DEFAULT true,
	`statusCode` int,
	`trustDelta` int NOT NULL DEFAULT 0,
	`txSignature` varchar(128),
	`paymentToken` varchar(512),
	`paymentVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invocations_id` PRIMARY KEY(`id`)
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
CREATE TABLE `operators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`tagline` varchar(512),
	`description` text,
	`category` enum('code-review','sentiment-analysis','data-extraction','image-generation','text-generation','translation','summarization','classification','search','financial-analysis','security-audit','other') NOT NULL DEFAULT 'other',
	`endpointUrl` varchar(1024),
	`httpMethod` enum('GET','POST','PUT') NOT NULL DEFAULT 'POST',
	`requestSchema` json,
	`responseSchema` json,
	`pricePerCall` decimal(18,8) NOT NULL DEFAULT '0.003',
	`creatorWallet` varchar(64) NOT NULL,
	`creatorId` int,
	`stakeAmount` decimal(18,4) NOT NULL DEFAULT '0',
	`trustScore` int NOT NULL DEFAULT 50,
	`totalInvocations` bigint NOT NULL DEFAULT 0,
	`successfulInvocations` bigint NOT NULL DEFAULT 0,
	`totalEarned` decimal(18,6) NOT NULL DEFAULT '0',
	`avgResponseMs` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`suspensionReason` text,
	`tags` json,
	`iconUrl` varchar(1024),
	`docsUrl` varchar(1024),
	`githubUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operators_id` PRIMARY KEY(`id`),
	CONSTRAINT `operators_slug_unique` UNIQUE(`slug`)
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
CREATE TABLE `protocol_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric` varchar(128) NOT NULL,
	`value` decimal(18,6) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocol_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `protocol_stats_metric_unique` UNIQUE(`metric`)
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
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operatorId` int NOT NULL,
	`validatorId` int,
	`reporterWallet` varchar(64),
	`reportType` enum('quality-check','security-audit','performance-test','dispute','periodic-validation') NOT NULL DEFAULT 'quality-check',
	`score` int NOT NULL,
	`findings` text,
	`applied` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`walletAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
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
CREATE INDEX `idx_audit_action` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_disputes_operator` ON `disputes` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_disputes_status` ON `disputes` (`disputeStatus`);--> statement-breakpoint
CREATE INDEX `idx_disputes_challenger` ON `disputes` (`challengerWallet`);--> statement-breakpoint
CREATE INDEX `idx_invocations_operator` ON `invocations` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_invocations_caller` ON `invocations` (`callerWallet`);--> statement-breakpoint
CREATE INDEX `idx_invocations_created` ON `invocations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_bonds_operator` ON `operator_bonds` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_bonds_status` ON `operator_bonds` (`status`);--> statement-breakpoint
CREATE INDEX `idx_operators_category` ON `operators` (`category`);--> statement-breakpoint
CREATE INDEX `idx_operators_creator` ON `operators` (`creatorWallet`);--> statement-breakpoint
CREATE INDEX `idx_operators_trust` ON `operators` (`trustScore`);--> statement-breakpoint
CREATE INDEX `idx_operators_active` ON `operators` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_payments_invocation` ON `payments` (`invocationId`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `idx_ratelimit_identifier` ON `rate_limits` (`identifier`,`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_reports_operator` ON `reports` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_reports_validator` ON `reports` (`validatorId`);--> statement-breakpoint
CREATE INDEX `idx_reviews_operator` ON `skill_reviews` (`operatorId`);--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewer` ON `skill_reviews` (`reviewerWallet`);--> statement-breakpoint
CREATE INDEX `idx_validators_status` ON `validators` (`status`);--> statement-breakpoint
CREATE INDEX `idx_validators_reputation` ON `validators` (`reputationScore`);
