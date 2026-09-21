# Data model

Synthetic data only. Schema in `src/db/schema.ts`; migrations in `drizzle/`. PostgreSQL (Neon).

## Entities

### `properties`
The monitored stock. Fields: `ref` (HAV-P-####), `locality`, `property_type`,
`construction_era`, `epc_rating`, `heating_type`, `wall_insulation`, `loft_insulation`,
`glazing`, `ventilation`, `damp_history_count`, `mould_history_count`, `open_repairs`,
`last_repair_days_ago`, and environmental readings `indoor_humidity_pct`,
`indoor_winter_temp_c`, `co2_ppm`, `readings_age_days`.

### `households`
Synthetic household circumstances linked to a property (`property_id`). Fields: `ref`
(HAV-H-####), `household_size`, `adults_over_65`, `children_under_5`, `children_present`,
`income_risk_indicator`, `fuel_poverty_indicator`, `mobility_support`, `health_vulnerability`
(non-clinical, self-declared support flag), `recent_household_change`, `energy_use_pattern`.
No medical histories or unnecessary sensitive data are held.

### `risk_assessments`
Current + historical assessments per household/property. Stores the compact summary
(`overall_score`, `band`, `confidence_score`, `confidence`, `urgency_score`, `urgency`,
`primary_risk`, `secondary_risk`, `response_due_days`, `dimensions` JSON), the `model_version`,
`review_status` (`unreviewed`/`reviewed`/`overridden`), `reviewed_by`, `is_current` and
`assessed_at`. Full driver-level explainability is recomputed from signals by the engine.

### `cases`
A unit of work. `ref` (HAV-C-####), `property_id`, `household_id`, `title`, `status`
(`open`/`assigned`/`in_progress`/`escalated`/`monitoring`/`closed`), `owner_team`, `owner_name`,
`priority_band`, `opening_risk_score`/`opening_band`, `current_risk_score`/`current_band`,
`followup_risk_score`/`followup_band`, `outcome`, and dates (`opened_at`, `response_due_at`,
`follow_up_due_at`, `closed_at`).

### `case_notes`
Timeline entries: `case_id`, `author`, `kind` (`note`/`status_change`/`assignment`/
`intervention`/`escalation`/`outcome`/`assessment`), `body`, `created_at`.

### `interventions`
Recommended/scheduled/completed actions on a case. `ref` (HAV-I-####), `case_id`, `type`,
`label`, `reason`, `status` (`recommended`/`scheduled`/`in_progress`/`completed`/`cancelled`),
`team`, `owner_name`, `urgency`, `target_date`, `completed_at`, `expected_outcome`,
`actual_outcome`, `follow_up_date`.

### `audit_events`
Immutable record of key actions: `entity_type`, `entity_ref`, `case_id`, `action`, `actor`,
`detail`, `created_at`. Actions include `risk_calculated`, `risk_updated`, `case_created`,
`case_assigned`, `intervention_created`, `case_escalated`, `outcome_recorded`, `case_closed`.

### `data_sources`
Governance reference data: `name`, `category`, `purpose`, `confidence`, `adapter_status`
(`demo`/`ready`/`not_connected`), `lawful_basis_placeholder`, `access_concept`,
`retention_concept`, `last_update`.

## Conceptual model (beyond the demonstrator)

The brief lists finer-grained entities (TenantProfile, EnergyProfile, BuildingAttribute,
VulnerabilityIndicator, RepairHistory, EnvironmentalReading, RiskFactor, CaseAssignment,
InterventionType, Outcome, DataSource, ConsentRecord, ResponseRule). In this demonstrator these
are modelled pragmatically:

- **Property/household attributes** are flattened onto `properties`/`households` (fabric,
  energy, environmental readings, vulnerability indicators, repair counts).
- **RiskFactor** is derived at runtime by the engine (driver-level breakdown), not stored.
- **InterventionType / ResponseRule** are code catalogues (`intervention-engine.ts`,
  `response-rules.ts`) so they are transparent and testable.
- **CaseAssignment** is represented by `owner_team`/`owner_name` + assignment notes/audit.
- **ConsentRecord** is represented conceptually via `data_sources.lawful_basis_placeholder`
  and documented as future information-governance work.

A production build would normalise these into their own tables as volume and integrations grow.

## Relationships

```
properties 1─* households
properties 1─* risk_assessments        households 1─* risk_assessments
properties 1─* cases                    households 1─* cases
cases 1─* case_notes
cases 1─* interventions
cases 1─* audit_events
```

## Indexes

Localities and property types (`properties`), fuel-poverty indicator (`households`), band and
`is_current` (`risk_assessments`), status/team/property (`cases`), case + status
(`interventions`), case + entity (`audit_events`).
