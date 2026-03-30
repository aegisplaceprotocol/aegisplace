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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invocations_id` PRIMARY KEY(`id`)
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
CREATE TABLE `protocol_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric` varchar(128) NOT NULL,
	`value` decimal(18,6) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocol_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `protocol_stats_metric_unique` UNIQUE(`metric`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operatorId` int NOT NULL,
	`reporterWallet` varchar(64),
	`reportType` enum('quality-check','security-audit','performance-test','dispute','periodic-validation') NOT NULL DEFAULT 'quality-check',
	`score` int NOT NULL,
	`findings` text,
	`applied` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(64);