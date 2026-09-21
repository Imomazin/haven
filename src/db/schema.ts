// Haven database schema (Drizzle ORM, PostgreSQL / Neon).
// Synthetic data only. Enum-like fields are stored as text and validated in
// application code via Zod + the string-literal unions in src/lib/types.ts.

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    locality: text("locality").notNull(),
    propertyType: text("property_type").notNull(),
    constructionEra: text("construction_era").notNull(),
    epcRating: text("epc_rating").notNull(),
    heatingType: text("heating_type").notNull(),
    wallInsulation: text("wall_insulation").notNull(),
    loftInsulation: text("loft_insulation").notNull(),
    glazing: text("glazing").notNull(),
    ventilation: text("ventilation").notNull(),
    dampHistoryCount: integer("damp_history_count").notNull().default(0),
    mouldHistoryCount: integer("mould_history_count").notNull().default(0),
    openRepairs: integer("open_repairs").notNull().default(0),
    lastRepairDaysAgo: integer("last_repair_days_ago"),
    indoorHumidityPct: integer("indoor_humidity_pct"),
    indoorWinterTempC: real("indoor_winter_temp_c"),
    co2Ppm: integer("co2_ppm"),
    readingsAgeDays: integer("readings_age_days"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    localityIdx: index("properties_locality_idx").on(t.locality),
    typeIdx: index("properties_type_idx").on(t.propertyType),
  }),
);

export const households = pgTable(
  "households",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id),
    householdSize: integer("household_size").notNull(),
    adultsOver65: integer("adults_over_65").notNull().default(0),
    childrenUnder5: integer("children_under_5").notNull().default(0),
    childrenPresent: boolean("children_present").notNull().default(false),
    incomeRiskIndicator: text("income_risk_indicator").notNull(),
    fuelPovertyIndicator: text("fuel_poverty_indicator").notNull(),
    mobilitySupport: boolean("mobility_support").notNull().default(false),
    healthVulnerability: text("health_vulnerability").notNull(),
    recentHouseholdChange: boolean("recent_household_change").notNull().default(false),
    energyUsePattern: text("energy_use_pattern").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    propIdx: index("households_property_idx").on(t.propertyId),
    fuelIdx: index("households_fuel_idx").on(t.fuelPovertyIndicator),
  }),
);

export const riskAssessments = pgTable(
  "risk_assessments",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    overallScore: integer("overall_score").notNull(),
    band: text("band").notNull(),
    confidenceScore: integer("confidence_score").notNull(),
    confidence: text("confidence").notNull(),
    urgencyScore: integer("urgency_score").notNull(),
    urgency: text("urgency").notNull(),
    primaryRisk: text("primary_risk").notNull(),
    secondaryRisk: text("secondary_risk"),
    responseDueDays: integer("response_due_days").notNull(),
    dimensions: jsonb("dimensions").notNull(),
    detail: jsonb("detail").notNull(),
    modelVersion: text("model_version").notNull(),
    reviewStatus: text("review_status").notNull().default("unreviewed"),
    reviewedBy: text("reviewed_by"),
    isCurrent: boolean("is_current").notNull().default(true),
    assessedAt: timestamp("assessed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    propIdx: index("risk_property_idx").on(t.propertyId),
    bandIdx: index("risk_band_idx").on(t.band),
    currentIdx: index("risk_current_idx").on(t.isCurrent),
  }),
);

export const cases = pgTable(
  "cases",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"),
    ownerTeam: text("owner_team").notNull(),
    ownerName: text("owner_name"),
    priorityBand: text("priority_band").notNull(),
    openingRiskScore: integer("opening_risk_score"),
    openingBand: text("opening_band"),
    currentRiskScore: integer("current_risk_score"),
    currentBand: text("current_band"),
    followupRiskScore: integer("followup_risk_score"),
    followupBand: text("followup_band"),
    outcome: text("outcome"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    responseDueAt: timestamp("response_due_at", { withTimezone: true }),
    followUpDueAt: timestamp("follow_up_due_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("cases_status_idx").on(t.status),
    teamIdx: index("cases_team_idx").on(t.ownerTeam),
    propIdx: index("cases_property_idx").on(t.propertyId),
  }),
);

export const caseNotes = pgTable(
  "case_notes",
  {
    id: serial("id").primaryKey(),
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id),
    author: text("author").notNull(),
    kind: text("kind").notNull().default("note"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    caseIdx: index("notes_case_idx").on(t.caseId),
  }),
);

export const interventions = pgTable(
  "interventions",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id),
    type: text("type").notNull(),
    label: text("label").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("recommended"),
    team: text("team").notNull(),
    ownerName: text("owner_name"),
    urgency: text("urgency").notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expectedOutcome: text("expected_outcome"),
    actualOutcome: text("actual_outcome"),
    followUpDate: timestamp("follow_up_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    caseIdx: index("interventions_case_idx").on(t.caseId),
    statusIdx: index("interventions_status_idx").on(t.status),
  }),
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityRef: text("entity_ref").notNull(),
    caseId: integer("case_id"),
    action: text("action").notNull(),
    actor: text("actor").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    caseIdx: index("audit_case_idx").on(t.caseId),
    entityIdx: index("audit_entity_idx").on(t.entityType, t.entityRef),
  }),
);

export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  purpose: text("purpose").notNull(),
  confidence: text("confidence").notNull(),
  adapterStatus: text("adapter_status").notNull(),
  lawfulBasisPlaceholder: text("lawful_basis_placeholder").notNull(),
  accessConcept: text("access_concept").notNull(),
  retentionConcept: text("retention_concept").notNull(),
  lastUpdate: timestamp("last_update", { withTimezone: true }),
});

export type Property = typeof properties.$inferSelect;
export type Household = typeof households.$inferSelect;
export type RiskAssessmentRow = typeof riskAssessments.$inferSelect;
export type CaseRow = typeof cases.$inferSelect;
export type CaseNote = typeof caseNotes.$inferSelect;
export type Intervention = typeof interventions.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
