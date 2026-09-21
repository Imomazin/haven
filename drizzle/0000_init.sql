CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_ref" text NOT NULL,
	"case_id" integer,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"author" text NOT NULL,
	"kind" text DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"property_id" integer NOT NULL,
	"household_id" integer NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_team" text NOT NULL,
	"owner_name" text,
	"priority_band" text NOT NULL,
	"opening_risk_score" integer,
	"opening_band" text,
	"current_risk_score" integer,
	"current_band" text,
	"followup_risk_score" integer,
	"followup_band" text,
	"outcome" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_due_at" timestamp with time zone,
	"follow_up_due_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"purpose" text NOT NULL,
	"confidence" text NOT NULL,
	"adapter_status" text NOT NULL,
	"lawful_basis_placeholder" text NOT NULL,
	"access_concept" text NOT NULL,
	"retention_concept" text NOT NULL,
	"last_update" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "households" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"property_id" integer NOT NULL,
	"household_size" integer NOT NULL,
	"adults_over_65" integer DEFAULT 0 NOT NULL,
	"children_under_5" integer DEFAULT 0 NOT NULL,
	"children_present" boolean DEFAULT false NOT NULL,
	"income_risk_indicator" text NOT NULL,
	"fuel_poverty_indicator" text NOT NULL,
	"mobility_support" boolean DEFAULT false NOT NULL,
	"health_vulnerability" text NOT NULL,
	"recent_household_change" boolean DEFAULT false NOT NULL,
	"energy_use_pattern" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "households_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"case_id" integer NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'recommended' NOT NULL,
	"team" text NOT NULL,
	"owner_name" text,
	"urgency" text NOT NULL,
	"target_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expected_outcome" text,
	"actual_outcome" text,
	"follow_up_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interventions_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"locality" text NOT NULL,
	"property_type" text NOT NULL,
	"construction_era" text NOT NULL,
	"epc_rating" text NOT NULL,
	"heating_type" text NOT NULL,
	"wall_insulation" text NOT NULL,
	"loft_insulation" text NOT NULL,
	"glazing" text NOT NULL,
	"ventilation" text NOT NULL,
	"damp_history_count" integer DEFAULT 0 NOT NULL,
	"mould_history_count" integer DEFAULT 0 NOT NULL,
	"open_repairs" integer DEFAULT 0 NOT NULL,
	"last_repair_days_ago" integer,
	"indoor_humidity_pct" integer,
	"indoor_winter_temp_c" real,
	"co2_ppm" integer,
	"readings_age_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"household_id" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"band" text NOT NULL,
	"confidence_score" integer NOT NULL,
	"confidence" text NOT NULL,
	"urgency_score" integer NOT NULL,
	"urgency" text NOT NULL,
	"primary_risk" text NOT NULL,
	"secondary_risk" text,
	"response_due_days" integer NOT NULL,
	"dimensions" jsonb NOT NULL,
	"detail" jsonb NOT NULL,
	"model_version" text NOT NULL,
	"review_status" text DEFAULT 'unreviewed' NOT NULL,
	"reviewed_by" text,
	"is_current" boolean DEFAULT true NOT NULL,
	"assessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cases" ADD CONSTRAINT "cases_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cases" ADD CONSTRAINT "cases_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "households" ADD CONSTRAINT "households_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interventions" ADD CONSTRAINT "interventions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_case_idx" ON "audit_events" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_idx" ON "audit_events" USING btree ("entity_type","entity_ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_case_idx" ON "case_notes" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_status_idx" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_team_idx" ON "cases" USING btree ("owner_team");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_property_idx" ON "cases" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "households_property_idx" ON "households" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "households_fuel_idx" ON "households" USING btree ("fuel_poverty_indicator");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interventions_case_idx" ON "interventions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interventions_status_idx" ON "interventions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_locality_idx" ON "properties" USING btree ("locality");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_type_idx" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_property_idx" ON "risk_assessments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_band_idx" ON "risk_assessments" USING btree ("band");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "risk_current_idx" ON "risk_assessments" USING btree ("is_current");