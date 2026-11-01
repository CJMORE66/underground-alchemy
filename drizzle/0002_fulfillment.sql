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
