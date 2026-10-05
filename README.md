# Haven

**A housing risk and intervention platform demonstrator.**
CivTech® Challenge 12.6 — improving living conditions and quality of life for social
housing residents in Scotland, with a focus on preventing the impacts of **fuel poverty**.

> **Product demonstrator.** All household and property data is **synthetic**. Risk scores
> and recommendations are prototype decision-support outputs for trained housing and support
> professionals — **not** clinical advice and **not** a clinical decision system. Displayed
> integrations are simulated unless stated otherwise. Nothing here implies endorsement by
> Cloch Housing Association or CivTech.

---

## What Haven does

Data about a home and the people living in it is scattered across asset-management, repairs,
energy, environmental and support systems. Risks — damp, cold, fuel poverty, vulnerability —
accumulate unseen until they become crises.

Haven brings those signals together and answers one operational question:

> **Which households or properties need attention now, why, and what intervention should happen next?**

It transforms fragmented data into **risk → priority → recommended action → ownership →
deadline → case → outcome → measured risk reduction.**

## The challenge & partnership

- **Challenge:** CivTech 12.6, sponsored by **Cloch Housing Association** — how can technology
  improve living conditions and quality of life for social housing residents in Scotland?
- **Delivery partnership:** **Ambidexters Ltd** (technology, software, data, AI, analytics,
  product, implementation) × **The DataKirk SCIO** (Scottish ecosystem insight, community
  engagement, inclusion, co-design, data literacy, user research, stakeholder engagement).

See [`docs/civtech-alignment.md`](docs/civtech-alignment.md) for a requirement-by-requirement map.

## Prototype status

This is a **working v0.1 demonstrator**, not a production system. It is database-backed with
deterministic synthetic data, a transparent rule-based risk engine, real case-management
persistence, and an operational analytics view. It has **not** been calibrated against real
outcomes and has **no** completed DPIA. See [`docs/known-limitations.md`](docs/known-limitations.md).

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v3, hand-rolled accessible components |
| Database | Neon PostgreSQL (serverless Postgres) |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Validation | Zod |
| Charts | Recharts |
| Tests | Vitest |

Risk logic, intervention logic and response rules are **pure, dependency-free TypeScript
modules** (`src/lib/`), kept separate from the database and UI, and unit-tested. All database
access is server-side; every data page is dynamic. Data adapters are modular interfaces.

## Application map

| Section | Purpose |
| --- | --- |
| **Overview** | Portfolio dashboard: counts, risk themes, top of the queue |
| **Risk Queue** | Prioritised triage queue with search / filter / sort |
| **Properties** | Stock records (fabric, energy, environmental, repairs) |
| **Households** | Synthetic household circumstances (non-clinical indicators) |
| **Cases** | Case management with real persistence |
| **Case detail** | Timeline, interventions, risk reduction, explainability, audit, actions |
| **Interventions** | All recommended / scheduled / completed actions |
| **Analytics** | Risk by geography & type, intervention effectiveness, recurring issues |
| **Governance** | Data sources, connector status, lawful-basis placeholders, audit |
| **Methodology** | Exact scoring rules (transparent) |
| **Simulator** | Interactive what-if: move any signal, watch the score/drivers/recommendations recompute live |
| **Demo** | 6–8 minute presenter script + Reset Demo Data |
| **About** | Product, challenge, partnership, disclaimer |

The Risk Queue supports **opening a case** for any untracked household (generates the case,
engine-recommended interventions and opening timeline) and **CSV export** of the filtered view.
A GitHub Actions workflow runs lint + typecheck + test + build on every push and PR.

## Local setup

```bash
npm ci
cp .env.example .env.local     # add your Neon connection strings
npm run db:migrate             # apply drizzle migrations to your database
npm run db:seed                # load deterministic synthetic data
npm run dev                    # http://localhost:3000
```

### Environment variables

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (used by the app) |
| `DIRECT_URL` | Neon **unpooled** connection string (migrations only) |
| `NEXT_PUBLIC_ENV_LABEL` | Optional label shown in the header (e.g. `preview`) |

Copy from [`.env.example`](.env.example). **Never commit real credentials** — this repository is public.

## Database, migrations & seed

- Schema lives in `src/db/schema.ts`; generated SQL migrations in `drizzle/`.
- `npm run db:generate` regenerates migrations from the schema.
- `npm run db:migrate` applies them (`src/db/migrate.ts`).
- `npm run db:seed` loads a deterministic dataset (≥55 properties, 45 households, 26 cases,
  70 interventions, full timelines and audit). `npm run db:seed:sql` emits the same as SQL.
- The **Reset Demo Data** button (Demo page) restores the exact seed state (with confirmation).

The risk engine is the single source of truth: the `risk_assessments` table stores a compact
summary for fast queue sorting, and full explainability is recomputed from stored signals on
demand.

## Testing

```bash
npm run lint
npm run typecheck
npm run test        # 33 unit tests: risk scoring, bands, confidence, urgency,
                    # intervention recommendations, response rules, validation,
                    # case transitions, seed integrity
npm run build
```

Run before deployment:

```bash
npm ci && npm run lint && npm run typecheck && npm run test && npm run build
```

## Deploy to Vercel

1. Import `Imomazin/haven` into Vercel (project name `haven`, or `haven-civtech` if taken).
2. Add `DATABASE_URL` (and `DIRECT_URL`) from your Neon `haven` project as environment variables.
3. Deploy the development branch as a **preview** (do not merge to `main`).
4. Run `npm run db:migrate && npm run db:seed` against the Neon database once.

Vercel serverless functions reach Neon over the pooled connection; all routes use the Node
runtime. See [`docs/architecture.md`](docs/architecture.md).

## Demo workflow

Open **Demo** for a 6–8 minute script: identify the highest-risk case, explain *why*, review
the property and household, review and assign an intervention, complete it, run a follow-up
assessment, and show measured risk reduction. See [`docs/demo-script.md`](docs/demo-script.md).

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/civtech-alignment.md`](docs/civtech-alignment.md)
- [`docs/data-model.md`](docs/data-model.md)
- [`docs/methodology.md`](docs/methodology.md)
- [`docs/intervention-model.md`](docs/intervention-model.md)
- [`docs/responsible-ai.md`](docs/responsible-ai.md)
- [`docs/privacy-and-governance.md`](docs/privacy-and-governance.md)
- [`docs/security.md`](docs/security.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/known-limitations.md`](docs/known-limitations.md)

## Limitations (headline)

Prototype scoring is illustrative and not validated against outcomes; integrations are
simulated; synthetic data only; no DPIA; not a clinical system. Full list in
[`docs/known-limitations.md`](docs/known-limitations.md).
