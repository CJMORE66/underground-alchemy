-- Custom SQL migration file, put your code below! --
CREATE TRIGGER commerce_d1_orders_immutable_update BEFORE UPDATE ON commerce_d1_orders
BEGIN SELECT RAISE(ABORT, 'commerce order is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER commerce_d1_orders_immutable_delete BEFORE DELETE ON commerce_d1_orders
BEGIN SELECT RAISE(ABORT, 'commerce order is immutable'); END;
