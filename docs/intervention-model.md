# Intervention model

Implemented in `src/lib/intervention-engine.ts` (tested in `intervention-engine.test.ts`).

## How recommendations are generated

The intervention engine reads the property + household signals and the risk assessment, then
applies an **explicit, readable set of rules**. Each rule may emit a recommendation with a
reason, an assigned team, a target lead time, an expected outcome and a priority. Examples:

- Mould history or humidity > 65% → **Mould investigation & treatment** (Repairs)
- Damp history (with open repairs → higher priority) → **Damp investigation** (Repairs)
- Poor ventilation / CO₂ > 1200 ppm → **Ventilation improvement** (Asset Management)
- Winter temperature < 16°C → **Heating system inspection** (Repairs)
- Under-heating or high fuel-poverty score → **Energy advice** (Energy Advice)
- In fuel poverty → **Heating cost support** + **Income maximisation referral** (Fuel Poverty)
- No wall insulation / low EPC in an older home → **Building-fabric improvement** (Asset Mgmt)
- ≥ 2 open repairs → **Repair inspection** (Repairs)
- Elevated vulnerability / support need → **Welfare support** (Tenancy Support)
- Recent household change → **Proactive tenant contact** (Housing Officers)
- Significant support need with housing risk → **Partner referral** (Tenancy Support)
- Any High/Critical case with no contact yet → **Proactive tenant contact**
- Anything above Low → **Follow-up assessment** to re-measure risk

Recommendations are de-duplicated (highest priority wins) and sorted by priority. The full
catalogue and team/lead-time metadata live in `INTERVENTION_META`.

## How humans review them

Recommendations are **suggestions**. On a case, a professional sees the engine's current
recommendations alongside the persisted interventions and decides what to schedule, adapt or
reject. Assigning, scheduling, completing and recording an outcome are explicit human actions
that persist to the database, the case timeline and the audit trail.

## What the system does *not* automate

- It does not book or dispatch works, contact tenants, or spend money.
- It does not close cases or mark work done on its own.
- It does not diagnose medical conditions or make healthcare decisions.
- It does not decide risk without a human able to review and override.

## Measuring effect (risk reduction)

Completing interventions and running a **follow-up assessment** re-measures risk. The case
shows *risk at opening → current → at follow-up*, the point change and the outcome. In this
demonstrator the follow-up steps current risk toward the recomputed baseline in proportion to
completed interventions — clearly a **prototype behaviour** for demonstration, not an evidence
model of intervention efficacy.

## Limitations & future validation

- Rule thresholds and lead times are illustrative, not validated against outcomes.
- Expected outcomes are indicative, not guarantees.
- A real deployment needs: calibration with the landlord's teams; alignment of lead times to
  actual policy and SLAs; an evidence loop that learns which interventions reduce which risks;
  and evaluation of fairness across localities and household types.
