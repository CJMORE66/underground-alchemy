-- Generated deployment migration mirror; edit db/schema.ts and regenerate Drizzle, not this file.
CREATE TABLE `commerce_d1_drafts` (
	`scope` text NOT NULL,
	`order_id` text NOT NULL,
	`external_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`payment_reference` text NOT NULL,
	`state` text NOT NULL,
	`attempted` integer DEFAULT 0 NOT NULL,
	`printful_id` integer,
	`failure_code` text,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`created_at_ms` integer NOT NULL,
	`updated_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `order_id`),
	FOREIGN KEY (`scope`,`order_id`) REFERENCES `commerce_d1_orders`(`scope`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "commerce_d1_draft_state_check" CHECK("commerce_d1_drafts"."state" IN ('reserved', 'created', 'uncertain', 'failed')),
	CONSTRAINT "commerce_d1_draft_attempted_check" CHECK("commerce_d1_drafts"."attempted" IN (0, 1)),
	CONSTRAINT "commerce_d1_draft_printful_check" CHECK("commerce_d1_drafts"."printful_id" IS NULL OR "commerce_d1_drafts"."printful_id" > 0),
	CONSTRAINT "commerce_d1_draft_failures_check" CHECK("commerce_d1_drafts"."failure_count" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_draft_external_unique` ON `commerce_d1_drafts` (`scope`,`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_draft_payload_unique` ON `commerce_d1_drafts` (`scope`,`payload_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_draft_payment_unique` ON `commerce_d1_drafts` (`scope`,`payment_reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_draft_printful_unique` ON `commerce_d1_drafts` (`scope`,`printful_id`);--> statement-breakpoint
CREATE TABLE `commerce_d1_events` (
	`scope` text NOT NULL,
	`event_id` text NOT NULL,
	`session_id` text NOT NULL,
	`type` text NOT NULL,
	`provider_created` integer NOT NULL,
	`received_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `event_id`),
	CONSTRAINT "commerce_d1_event_created_check" CHECK("commerce_d1_events"."provider_created" >= 0)
);
--> statement-breakpoint
CREATE TABLE `commerce_d1_jobs` (
	`scope` text NOT NULL,
	`id` text NOT NULL,
	`event_id` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at_ms` integer NOT NULL,
	`worker_id` text,
	`lease_token` text,
	`lease_expires_at_ms` integer,
	`last_error_code` text,
	`completed_at_ms` integer,
	`created_at_ms` integer NOT NULL,
	`updated_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `id`),
	FOREIGN KEY (`scope`,`event_id`) REFERENCES `commerce_d1_events`(`scope`,`event_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "commerce_d1_job_state_check" CHECK("commerce_d1_jobs"."state" IN ('pending', 'processing', 'completed', 'dead_letter')),
	CONSTRAINT "commerce_d1_job_attempts_check" CHECK("commerce_d1_jobs"."attempts" BETWEEN 0 AND 5),
	CONSTRAINT "commerce_d1_job_lease_check" CHECK(("commerce_d1_jobs"."state" = 'processing' AND "commerce_d1_jobs"."worker_id" IS NOT NULL AND "commerce_d1_jobs"."lease_token" IS NOT NULL AND "commerce_d1_jobs"."lease_expires_at_ms" IS NOT NULL) OR ("commerce_d1_jobs"."state" != 'processing' AND "commerce_d1_jobs"."worker_id" IS NULL AND "commerce_d1_jobs"."lease_token" IS NULL AND "commerce_d1_jobs"."lease_expires_at_ms" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `commerce_d1_jobs_available` ON `commerce_d1_jobs` (`scope`,`state`,`available_at_ms`,`created_at_ms`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_job_event_unique` ON `commerce_d1_jobs` (`scope`,`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_job_lease_unique` ON `commerce_d1_jobs` (`scope`,`lease_token`);--> statement-breakpoint
CREATE TABLE `commerce_d1_limits` (
	`scope` text NOT NULL,
	`key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`scope`, `key`),
	CONSTRAINT "commerce_d1_limit_window_check" CHECK("commerce_d1_limits"."window_start" >= 0),
	CONSTRAINT "commerce_d1_limit_count_check" CHECK("commerce_d1_limits"."count" BETWEEN 1 AND 10001)
);
--> statement-breakpoint
CREATE TABLE `commerce_d1_orders` (
	`scope` text NOT NULL,
	`id` text NOT NULL,
	`quote_hash` text NOT NULL,
	`order_hash` text NOT NULL,
	`order_json` text NOT NULL,
	`total_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `id`),
	CONSTRAINT "commerce_d1_order_scope_check" CHECK(length("commerce_d1_orders"."scope") BETWEEN 1 AND 180),
	CONSTRAINT "commerce_d1_order_json_check" CHECK(json_valid("commerce_d1_orders"."order_json")),
	CONSTRAINT "commerce_d1_order_total_check" CHECK("commerce_d1_orders"."total_minor" > 0),
	CONSTRAINT "commerce_d1_order_currency_check" CHECK(length("commerce_d1_orders"."currency") = 3)
);
--> statement-breakpoint
CREATE TABLE `commerce_d1_schema` (
	`version` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`contract` text DEFAULT 'ua-commerce-d1-v1' NOT NULL,
	CONSTRAINT "commerce_d1_schema_version_check" CHECK("commerce_d1_schema"."version" = 1),
	CONSTRAINT "commerce_d1_schema_contract_check" CHECK("commerce_d1_schema"."contract" = 'ua-commerce-d1-v1')
);
--> statement-breakpoint
CREATE TABLE `commerce_d1_sessions` (
	`scope` text NOT NULL,
	`session_id` text NOT NULL,
	`order_id` text NOT NULL,
	`quote_hash` text NOT NULL,
	`bound_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `session_id`),
	FOREIGN KEY (`scope`,`order_id`) REFERENCES `commerce_d1_orders`(`scope`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_session_order_unique` ON `commerce_d1_sessions` (`scope`,`order_id`);
-- Custom SQL migration file, put your code below! --
CREATE TRIGGER commerce_d1_orders_immutable_update BEFORE UPDATE ON commerce_d1_orders
BEGIN SELECT RAISE(ABORT, 'commerce order is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER commerce_d1_orders_immutable_delete BEFORE DELETE ON commerce_d1_orders
BEGIN SELECT RAISE(ABORT, 'commerce order is immutable'); END;

CREATE TABLE `commerce_d1_fulfillment` (
	`scope` text NOT NULL,
	`order_id` text NOT NULL,
	`printful_id` integer NOT NULL,
	`external_id` text NOT NULL,
	`provider_updated_at` integer NOT NULL,
	`projection_hash` text NOT NULL,
	`projection_json` text NOT NULL,
	`observed_at_ms` integer NOT NULL,
	PRIMARY KEY(`scope`, `order_id`),
	FOREIGN KEY (`scope`,`order_id`) REFERENCES `commerce_d1_drafts`(`scope`,`order_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "commerce_d1_fulfillment_printful_check" CHECK("commerce_d1_fulfillment"."printful_id" > 0),
	CONSTRAINT "commerce_d1_fulfillment_version_check" CHECK("commerce_d1_fulfillment"."provider_updated_at" >= 0),
	CONSTRAINT "commerce_d1_fulfillment_hash_check" CHECK(length("commerce_d1_fulfillment"."projection_hash") = 64),
	CONSTRAINT "commerce_d1_fulfillment_json_check" CHECK(json_valid("commerce_d1_fulfillment"."projection_json")),
	CONSTRAINT "commerce_d1_fulfillment_observed_check" CHECK("commerce_d1_fulfillment"."observed_at_ms" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_fulfillment_printful_unique` ON `commerce_d1_fulfillment` (`scope`,`printful_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `commerce_d1_fulfillment_external_unique` ON `commerce_d1_fulfillment` (`scope`,`external_id`);--> statement-breakpoint
CREATE TABLE `commerce_d1_public_catalog_cache` (
	`store_id` integer PRIMARY KEY NOT NULL,
	`payload_json` text,
	`verified_at_ms` integer DEFAULT 0 NOT NULL,
	`expires_at_ms` integer DEFAULT 0 NOT NULL,
	`lease_token` text,
	`lease_expires_at_ms` integer DEFAULT 0 NOT NULL,
	`updated_at_ms` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "commerce_d1_catalog_store_check" CHECK("commerce_d1_public_catalog_cache"."store_id" > 0),
	CONSTRAINT "commerce_d1_catalog_json_check" CHECK("commerce_d1_public_catalog_cache"."payload_json" IS NULL OR json_valid("commerce_d1_public_catalog_cache"."payload_json")),
	CONSTRAINT "commerce_d1_catalog_time_check" CHECK("commerce_d1_public_catalog_cache"."verified_at_ms" >= 0 AND "commerce_d1_public_catalog_cache"."expires_at_ms" >= 0 AND "commerce_d1_public_catalog_cache"."lease_expires_at_ms" >= 0 AND "commerce_d1_public_catalog_cache"."updated_at_ms" >= 0)
);

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

