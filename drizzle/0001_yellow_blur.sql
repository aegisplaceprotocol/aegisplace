ALTER TABLE `invocations` ADD `guardrailInputPassed` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `invocations` ADD `guardrailOutputPassed` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `invocations` ADD `guardrailViolations` json;--> statement-breakpoint
ALTER TABLE `invocations` ADD `guardrailLatencyMs` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `operators` ADD `lastHealthCheck` timestamp;--> statement-breakpoint
ALTER TABLE `operators` ADD `healthStatus` enum('healthy','degraded','down','unknown') DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `operators` ADD `consecutiveFailures` int DEFAULT 0 NOT NULL;