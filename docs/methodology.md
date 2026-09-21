# Risk scoring methodology

Model version: **`haven-risk-0.1.0`** (`RISK_MODEL_VERSION` in `src/lib/constants.ts`).

Haven's risk scoring is **transparent, rule-based and deterministic**. There is no machine
learning and no external AI call. Every number is reproducible from the rules below and is
implemented in `src/lib/risk-engine.ts` (unit-tested in `src/lib/risk-engine.test.ts`).

> This scoring is **prototype decision-support**. It is **not clinically validated**, does not
> diagnose medical conditions, and must be reviewed by a trained professional.

## Dimensions and weights

Six dimensions are each scored 0–100, then combined into an overall score using fixed weights
(sum = 1.0):

| Dimension | Weight | Captures |
| --- | --- | --- |
| Property Condition | 0.22 | Era, insulation, glazing, open repairs, damp/mould history |
| Fuel Poverty | 0.24 | Fuel-poverty & income indicators, EPC, heating type, under-heating |
| Environmental | 0.20 | Indoor humidity, winter temperature, CO₂, ventilation, mould |
| Household Vulnerability | 0.16 | Older adults, young children, mobility, declared support need |
| Recurrence | 0.10 | Repeat damp/mould, persistence after repair, sustaining factors |
| Support Need | 0.08 | Affordability, support need, recent change, under-heating |

`overall = round(Σ weightₖ × dimensionₖ)`, clamped 0–100.

## Exact scoring rules

### Property Condition (cap 100)
- Era: pre1919 +25 · 1919–1944 +20 · 1945–1964 +15 · 1965–1982 +12 · 1983–2002 +5 · post2002 +0
- Wall insulation: none +18 · partial +9 · full 0
- Loft insulation: none +10 · partial +5 · full 0
- Glazing: single +10 · double +3 · triple 0
- Open repairs: +min(count×6, 18)
- Damp history (24m): +min(count×7, 21)
- Mould history (24m): +min(count×8, 24)

### Fuel Poverty (cap 100)
- Indicator: in_fuel_poverty +45 · at_risk +25 · none 0
- Income risk: high +20 · medium +10 · low 0
- EPC: F/G +20 · E +14 · D +8 · C +3 · A/B 0
- Heating: electric_panel +12 · none +15 · solid_fuel +10 · electric_storage +8 · communal +2 · gas/heat_pump 0
- Energy use: under_heating +15 · backup-reliant +8 · normal 0

### Environmental (cap 100)
- Humidity: >70% +30 · 60–70% +18 · 55–60% +8 · else 0
- Winter temp: <16°C +25 · 16–18°C +14 · 18–21°C +4 · else 0
- CO₂: >1400 ppm +18 · 1000–1400 +9 · else 0
- Ventilation: poor +15 · adequate +5 · good 0
- Mould present: +12

### Household Vulnerability (cap 100)
- Adults 65+: +18, plus +6 per extra (cap +30)
- Children under 5 present: +16
- Mobility support: +14
- Declared health-related support (non-clinical): significant +25 · some +12 · none 0
- Recent household change: +8

### Recurrence (cap 100)
- Combined damp+mould events: +min(total×10, 40)
- Problem persists after a repair ≤180 days ago: +25 (else, open repair with active history: +15)
- Poor ventilation: +10
- No wall insulation: +8

### Support Need (cap 100)
- Fuel poverty: in_fuel_poverty +25 · at_risk +12
- Health-related support: significant +20 · some +8
- Mobility support: +12
- Recent household change: +12
- Income risk: high +15 · medium +7
- Under-heating: +10

## Bands

| Band | Overall score |
| --- | --- |
| Critical | ≥ 75 |
| High | 50–74 |
| Moderate | 25–49 |
| Low | 0–24 |

## Urgency and response window

Urgency starts at the overall score, then is escalated for acute combinations:
- Winter temp < 16°C **and** a vulnerable occupant (65+, under-5, or declared support) → ≥ 85
- Humidity > 70% **and** children present → ≥ 80
- In fuel poverty **and** under-heating → ≥ 75

| Urgency | Score | Prototype response window |
| --- | --- | --- |
| Immediate | ≥ 80 | 2 days |
| Soon | ≥ 60 | 7 days |
| Scheduled | ≥ 40 | 21 days |
| Routine | < 40 | 60 days |

These windows are **prototype response rules**, not statutory deadlines (see
[`intervention-model.md`](intervention-model.md) and the Governance page).

## Evidence confidence

Confidence starts at 100 and is reduced for missing/stale evidence: no humidity −12, no
temperature −12, no CO₂ −8, no timestamp −6, readings >120 days −14 (or >45 days −6), no repair
history −4. Bands: High ≥ 80 · Moderate ≥ 60 · Low < 60.

## Explainability

Each assessment exposes: overall score, band, six component scores (with weights), top risk
drivers (each with the specific evidence and point contribution), protective factors, missing
evidence, confidence, urgency and primary/secondary risk. These are recomputed live from the
stored signals so they always match the score.

## Calibration note

Weights and thresholds are **illustrative starting points** chosen to produce a realistic
spread across a synthetic portfolio. A real deployment must calibrate them with the landlord
against real outcomes, and validate before operational use.
