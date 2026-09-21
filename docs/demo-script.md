# Demo script (6–8 minutes)

The in-app **Demo** page carries this script and a **Reset Demo Data** button. Flagship case:
**HAV-C-0001** (property HAV-P-0001, household HAV-H-0001).

## Setup
- Ensure the database is seeded (`npm run db:seed`) — deterministic, so the story below matches.
- Optionally reset via **Demo → Reset demo data** to restore the exact seed state.

## Walkthrough

1. **Overview.** *"Haven monitors 55 properties and 45 households. One is Critical and six are
   High right now, with open cases, interventions and overdue actions surfaced up front."*
2. **Risk Queue → top row.** *"The queue ranks by urgency then overall risk. The top case is a
   pre-1919 tenement — recurring damp, an under-heating fuel-poor household and a vulnerable
   older resident. Colour is always paired with a shape and a label, and there's a confidence
   badge and review status."*
3. **Open HAV-C-0001.** *"This is the working case: status, owner, and the prototype response
   window — a target rhythm, clearly labelled as a prototype rule, not a statutory deadline."*
4. **Scroll to "Why is this risk high?"** *"No black box. Component scores across six
   dimensions, the top drivers with the exact evidence, protective factors, and any missing
   evidence — which lowers the confidence score."*
5. **Property (HAV-P-0001) and Household (HAV-H-0001).** *"The signals feeding the engine:
   fabric and environmental readings on the property; non-clinical support indicators on the
   household. No medical histories."*
6. **Back to the case → Engine recommendations.** *"Haven suggests a heating inspection, heating
   cost support, damp/mould investigation and tenant contact — each with a reason, a responsible
   team and an expected outcome."*
7. **Assign** the case (type a name → Assign) and **Start** it. *"Assignment and status changes
   persist to the database and the audit trail — watch the timeline and audit panel update."*
8. **Complete an intervention.** On an intervention, set status to **Completed** with a short
   outcome → Update. *"The action and its outcome are recorded against the case."*
9. **Run follow-up assessment.** Click **Run follow-up assessment**. *"Haven re-measures risk,
   reflecting the completed work."*
10. **Risk reduction panel.** *"Opening → current → follow-up, with the point reduction — visible
    evidence the intervention moved risk."*
11. **Open a resolved case** (e.g. **HAV-C-0007** or **HAV-C-0022**). *"A completed journey from
    High/Moderate down to Low, with the full timeline and recorded outcome."*
12. **Analytics.** *"Where risk concentrates by area and property type, which interventions move
    the needle, and which properties recur — candidates for a deeper fabric review."*
13. **Overview.** *"Back to the portfolio view — the loop from signal to action to measured
    outcome, in one place."*

## What to say
- "All data is synthetic; risk scores are transparent, rule-based decision-support."
- "Every decision needs a human — Haven prioritises and explains; people act."

## What **not** to claim
- Do not call scores clinically validated or medical.
- Do not imply live integrations — connectors are demo/simulated.
- Do not imply endorsement by Cloch Housing Association or CivTech.

## Reset
**Demo → Reset demo data** (confirm) restores the deterministic seed and discards demo edits.
