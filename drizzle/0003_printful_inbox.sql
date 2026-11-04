CREATE TABLE `commerce_d1_printful_events` (
	`scope` text NOT NULL,
	`fingerprint` text NOT NULL,
	`type` text NOT NULL,
	`occurred_at` text NOT NULL,
	`store_id` integer NOT NULL,
	`printful_id` integer NOT NULL,
	`external_id` text,
	`shipment_id` integer,
	`received_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `fingerprint`),
	CONSTRAINT "commerce_d1_pf_event_hash_check" CHECK(length("commerce_d1_printful_events"."fingerprint") = 64),
	CONSTRAINT "commerce_d1_pf_event_ids_check" CHECK("commerce_d1_printful_events"."store_id" > 0 AND "commerce_d1_printful_events"."printful_id" > 0 AND ("commerce_d1_printful_events"."shipment_id" IS NULL OR "commerce_d1_printful_events"."shipment_id" > 0))
);
--> statement-breakpoint
CREATE TABLE `commerce_d1_printful_jobs` (
	`scope` text NOT NULL,
	`id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`order_id` text,
	`state` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at_ms` integer NOT NULL,
	`worker_id` text,
	`lease_token` text,
	`lease_expires_at_ms` integer,
	`last_error_code` text,
	`recovery_count` integer DEFAULT 0 NOT NULL,
	`recovery_nonce` text,
	`completed_at_ms` integer,
	`created_at_ms` integer NOT NULL,
	`updated_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `id`),
	FOREIGN KEY (`scope`,`fingerprint`) REFERENCES `commerce_d1_printful_events`(`scope`,`fingerprint`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scope`,`order_id`) REFERENCES `commerce_d1_orders`(`scope`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "commerce_d1_pf_job_state_check" CHECK("commerce_d1_printful_jobs"."state" IN ('pending', 'processing', 'completed', 'ignored', 'dead_letter')),
	CONSTRAINT "commerce_d1_pf_job_attempts_check" CHECK("commerce_d1_printful_jobs"."attempts" BETWEEN 0 AND 5 AND "commerce_d1_printful_jobs"."recovery_count" BETWEEN 0 AND 10),
	CONSTRAINT "commerce_d1_pf_job_mapping_check" CHECK("commerce_d1_printful_jobs"."order_id" IS NOT NULL OR "commerce_d1_printful_jobs"."state" = 'ignored'),
	CONSTRAINT "commerce_d1_pf_job_lease_check" CHECK(("commerce_d1_printful_jobs"."state" = 'processing' AND "commerce_d1_printful_jobs"."worker_id" IS NOT NULL AND "commerce_d1_printful_jobs"."lease_token" IS NOT NULL AND "commerce_d1_printful_jobs"."lease_expires_at_ms" IS NOT NULL) OR ("commerce_d1_printful_jobs"."state" != 'processing' AND "commerce_d1_printful_jobs"."worker_id" IS NULL AND "commerce_d1_printful_jobs"."lease_token" IS NULL AND "commerce_d1_printful_jobs"."lease_expires_at_ms" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `commerce_d1_pf_jobs_available` ON `commerce_d1_printful_jobs` (`scope`,`state`,`available_at_ms`,`created_at_ms`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_pf_job_event_unique` ON `commerce_d1_printful_jobs` (`scope`,`fingerprint`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_pf_job_lease_unique` ON `commerce_d1_printful_jobs` (`scope`,`lease_token`);--> statement-breakpoint
CREATE TABLE `commerce_d1_printful_recoveries` (
	`scope` text NOT NULL,
	`job_id` text NOT NULL,
	`number` integer NOT NULL,
	`actor_hash` text NOT NULL,
	`reason_code` text NOT NULL,
	`created_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `job_id`, `number`),
	FOREIGN KEY (`scope`,`job_id`) REFERENCES `commerce_d1_printful_jobs`(`scope`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "commerce_d1_pf_recovery_check" CHECK("commerce_d1_printful_recoveries"."number" BETWEEN 1 AND 10 AND length("commerce_d1_printful_recoveries"."actor_hash") = 64 AND "commerce_d1_printful_recoveries"."created_at_ms" >= 0)
);
