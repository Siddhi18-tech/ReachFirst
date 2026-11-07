ALTER TABLE "disasters" ADD COLUMN "casualties" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "disasters" ADD COLUMN "teams_deployed" integer DEFAULT 0 NOT NULL;