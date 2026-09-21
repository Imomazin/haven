# CivTech 12.6 alignment

**Challenge 12.6** (sponsor: **Cloch Housing Association**): how can technology improve living
conditions and quality of life for social housing residents in Scotland — with a focus on
preventing the impacts of **fuel poverty**.

The official challenge page (`civtech.scot`) is the source of truth. It was not reachable from
the build environment (network egress restriction), so this mapping is written against the
challenge statement above and the challenge brief; **verify against the live challenge page and
adjust before any submission.** This is a gap, tracked below and in
[`known-limitations.md`](known-limitations.md).

## Legend

- **Implemented** — working in this demonstrator against synthetic data.
- **Simulated** — represented in the UI as a demo/placeholder (e.g. connectors).
- **Future integration** — needs a real data connection to a landlord system.
- **Future validation** — needs calibration / evaluation / governance sign-off.

## Requirement → capability map

| Official aim | Haven capability | Workflow | Data required | Prototype implementation | Limitation | Future Accelerator development |
| --- | --- | --- | --- | --- | --- | --- |
| Identify residents at risk of fuel poverty / poor conditions | Six-dimension risk engine incl. Fuel Poverty & Environmental | Signals → score → band → queue | Property fabric, EPC, energy pattern, environment, household indicators | **Implemented** (synthetic) | Not calibrated to real outcomes | Calibrate with Cloch; validate against real cases |
| Prioritise who needs help now | Risk triage queue (urgency then risk) | Sort/filter/search, open case | Current assessments | **Implemented** | Prototype urgency rules | Align to Cloch policy & SLAs |
| Explain *why* a household is at risk | Explainability panel (drivers, evidence, protective, missing) | Open assessment | Stored signals | **Implemented** | Illustrative weights | Co-design thresholds with staff |
| Recommend the next action | Intervention engine (13 types) | Recommendations on case | Assessment + signals | **Implemented** | Rules not validated | Evidence loop on what reduces risk |
| Coordinate the response | Case management (assign/act/escalate/close) | Server actions persist to DB | Cases, interventions, notes | **Implemented** | Single demo user, no auth | RBAC, SSO, teams |
| Prove the intervention worked | Risk reduction (opening→current→follow-up) | Complete work, follow-up assessment | Interventions + reassessment | **Implemented** (prototype effect model) | Not an efficacy model | Longitudinal outcome tracking |
| Bring fragmented data together | Modular data adapters + governance view | Adapters with connector status | Asset, repairs, EPC, energy, tariff, support, sensors, open data | **Simulated** (demo adapters) | No live integrations | Build real connectors per system |
| Environmental / cold-home detection | Environmental dimension (humidity, temp, CO₂, ventilation) | Sensor readings feed engine | IoT / inspection data | **Implemented** (synthetic) · **Future integration** (real sensors) | Synthetic readings | Sensor programme + validation |
| Respect residents & data | Governance, minimisation, human oversight, audit | Governance page, review status | Lawful-basis placeholders | **Implemented** (concepts) · **Future validation** (DPIA) | No DPIA | DPIA, IG sign-off, RBAC |
| Community engagement & inclusion (DataKirk) | Plain-language explanations, accessible UI | Whole app | — | **Implemented** (design) | Not user-tested with residents | Co-design & user research with communities |
| Analytics for operational decisions | Analytics (geography, type, effectiveness, recurrence) | Analytics page | Aggregates | **Implemented** | Demo scale | Portfolio-scale reporting |

## Honest status summary

- **Implemented:** risk engine, explainability, triage queue, property/household profiles, case
  management with persistence, interventions, outcomes & risk reduction, analytics, governance
  view, audit trail, methodology, demo, accessibility basics, tests, build.
- **Simulated:** all data-source connectors (demo adapters); the follow-up "effect" of
  interventions on risk.
- **Future integration:** real connections to asset/repairs/EPC/energy/tariff/support systems
  and environmental sensors.
- **Future validation:** scoring calibration, intervention-effectiveness evidence, resident
  user research, DPIA and information-governance sign-off, and confirmation against the live
  official challenge page.
