# Responsible AI

## No AI black box in the prototype

Haven's risk scoring and intervention recommendations are **transparent, rule-based and
deterministic**. The demonstrator uses **no external AI/LLM APIs** and requires none. Every
score is reproducible from the documented rules in [`methodology.md`](methodology.md), and every
recommendation from the rules in [`intervention-model.md`](intervention-model.md). Nothing in the
UI is fabricated model output.

## Principles

- **Human-in-the-loop.** Haven supports professionals; it never decides or acts autonomously.
  Every assessment carries a review status and can be overridden. Every action is a human action.
- **Transparency.** Scores open into component scores, drivers, evidence, protective factors and
  missing evidence. Weights, thresholds and rules are published and versioned.
- **Not clinical.** Haven does not diagnose medical conditions and is not a clinical decision
  system. "Health vulnerability" is a coarse, self-declared, non-clinical support flag only.
- **Data minimisation.** Only the indicators needed for housing support are held. No medical
  histories, no unnecessary sensitive data, synthetic identities only.
- **Provenance & auditability.** Scores record their model version; key actions are audited.
- **Fairness by design (future).** Because the rules are explicit, they can be inspected for
  bias and evaluated across localities and household types before operational use.

## Possible future AI architecture

If AI is introduced later, it would be **assistive and supervised**, for example:

- **Case summarisation** — draft a plain-language summary of a case for a reviewer to check.
- **Risk-evidence extraction** — pull structured signals from unstructured notes/inspection
  reports to feed the *transparent* engine (AI extracts evidence; rules still score).
- **Pattern detection** — surface clusters of recurring issues for human investigation.
- **Intervention support** — suggest wording or next steps for an officer to accept or edit.
- **Document review** — triage inbound documents.

Any such feature would keep the deterministic engine as the scoring authority, log AI
provenance distinctly, require human confirmation, and be covered by a DPIA and model-risk
assessment. Haven would never present AI output as fact or let it act unsupervised.

## Guardrails we commit to

- Do not fake LLM output.
- Do not require external AI to run the core product.
- Do not let any model make or execute a decision about a household without human review.
- Keep the scoring rules open and challengeable.
