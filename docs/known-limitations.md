# Known limitations

Haven is a **v0.1 demonstrator**. It is deliberately honest about what it is not.

## Data
- **Synthetic only.** No real tenants, no real addresses tied to individuals. Localities are
  real Inverclyde place names used solely as area labels.
- The dataset is deterministic (fixed seed) — good for demos, not representative of real
  distributions or volumes.

## Scoring & recommendations
- Weights, thresholds and rules are **illustrative** and **not calibrated** against real
  outcomes. Not clinically validated. Not a clinical decision system.
- "Health vulnerability" is a coarse, non-clinical, self-declared support flag — not a diagnosis.
- The intervention "effect" shown by the follow-up assessment is a **prototype behaviour**, not
  an evidence model of intervention efficacy.

## Integrations
- All data-source connectors are **demo adapters / simulated**. There are no live integrations
  to asset, repairs, EPC, energy, tariff, support or sensor systems.
- Response windows are **prototype response rules**, not statutory deadlines.

## Product & security
- **No authentication or RBAC** — a single implicit demo user. Not suitable for real data.
- No rate limiting, no CI security scanning, no secrets vault in this demonstrator.
- Reset Demo Data and case actions assume a trusted single operator.

## Governance
- **No DPIA** has been completed. Lawful-basis, consent, retention and access controls are shown
  as concepts/placeholders, not implemented policy.

## Process / verification
- The **official CivTech 12.6 challenge page was not reachable** from the build environment, so
  the alignment in [`civtech-alignment.md`](civtech-alignment.md) is written from the challenge
  statement and must be confirmed against the live page before any submission.
- Not user-tested with residents or frontline staff. Accessibility targets WCAG 2.2 AA where
  practical but has not been independently audited.

## Deployment
- The app is Vercel-ready and builds cleanly, but a live Vercel preview requires the owner's
  Vercel account and Neon environment variables to be connected (no Vercel credentials were
  available in the build environment). Steps are in the README.

## Recommended next steps
See the PR description and README. In short: calibrate the model with Cloch, build one real
connector, add auth/RBAC, run resident user research, and complete a DPIA.
