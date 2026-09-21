# Architecture

Haven is a database-backed Next.js application. It is deliberately layered so that the
**risk logic, intervention logic and data adapters stay separate** from the database and UI,
and so that human review is explicit.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│ UI (App Router, server components)                           │
│  Overview · Risk Queue · Properties · Households · Cases ·   │
│  Interventions · Analytics · Governance · Methodology · Demo │
└───────────────▲───────────────────────────┬─────────────────┘
                │ read (queries)             │ write (server actions)
┌───────────────┴───────────────────────────▼─────────────────┐
│ Data access — src/db/queries.ts, src/app/actions.ts          │
│  Drizzle ORM over Neon PostgreSQL (server-only)              │
└───────────────▲───────────────────────────┬─────────────────┘
                │ recompute                  │ persist
┌───────────────┴───────────────┐  ┌────────▼─────────────────┐
│ Domain logic (pure TS)         │  │ Neon PostgreSQL           │
│  risk-engine · intervention-   │  │  properties, households,  │
│  engine · response-rules ·     │  │  risk_assessments, cases, │
│  validation (Zod)              │  │  interventions, notes,    │
│  — unit-tested, no I/O         │  │  audit_events, data_sources│
└────────────────────────────────┘  └───────────────────────────┘
```

## Key decisions

- **Pure domain core.** `src/lib/risk-engine.ts`, `intervention-engine.ts`, `response-rules.ts`
  and `validation.ts` have no database or framework dependencies. They are unit-tested and are
  the single source of truth for scoring and recommendations.
- **Engine as source of truth.** The `risk_assessments` table stores a compact summary
  (score, band, confidence, urgency, primary/secondary, dimension scores) for fast queue
  sorting and filtering. Full explainability (drivers, protective factors, missing evidence)
  is **recomputed on demand** from the stored property + household signals, so the UI can
  never drift from the engine.
- **Server-side data only.** All Neon access is in `src/db/` behind `server-only`. Every data
  page is `dynamic = "force-dynamic"`, so `next build` needs no database and the app always
  renders live data. All routes use the Node runtime (postgres-js over the pooled connection).
- **Mutations via server actions.** `src/app/actions.ts` implements case management (assign,
  start, note, escalate, intervention status, outcome, follow-up assessment, close, reopen,
  reset). Each writes the change, a case note and an audit event, then revalidates.
- **Modular adapters.** Data sources are represented as records with a connector status
  (`Demo adapter`, `Ready for configuration`, `Not connected`). No unauthorised real
  integrations exist. See [`data-model.md`](data-model.md) and Governance.

## Directory layout

```
src/
  app/            App Router pages + server actions + global CSS
  components/     UI primitives, severity badges, nav, charts, risk explanation
  db/             schema, client, queries, migrate, reset
  lib/            risk-engine, intervention-engine, response-rules, validation,
                  constants, types, rng, format
  seed/           deterministic dataset generator + seed runner
drizzle/          generated SQL migrations
docs/             this documentation set
```

## Data flow for a risk score

1. Property + household rows are read from Neon.
2. `toRiskInput()` maps them into the engine's typed input.
3. `assessRisk()` computes six dimension scores, weighted overall score, band, urgency,
   confidence, top drivers, protective factors and missing evidence — deterministically.
4. The UI renders the explanation; a human reviewer confirms before any action.

## Deployment

Vercel (Node serverless) → Neon (pooled connection, `prepare:false` for pgBouncer). Preview
deploys track the development branch; `main` is not merged for this demonstrator.
