# Privacy & governance

> This is a **demonstrator using synthetic data only**. No real personal data is processed. A
> Data Protection Impact Assessment (DPIA) has **not** been completed and would be required
> before any real deployment.

## Data minimisation

Haven holds only the indicators needed to support housing decisions. Households carry coarse
indicators (size, age bands, fuel-poverty flag, income-risk band, mobility support, a
non-clinical support-need flag, energy-use pattern). It deliberately does **not** hold medical
histories, diagnoses, or free-text sensitive information.

## Purpose limitation

Data is used to prioritise housing risk and coordinate interventions for the wellbeing of
residents — not for enforcement, profiling for unrelated purposes, or any automated decision
affecting a person's rights without human review.

## Human oversight

No autonomous decisions. Every risk assessment has a review status and can be overridden; every
case action is performed by a named user and recorded.

## Role-based access (future architecture)

The Governance page shows an **access concept** per data source (e.g. support records restricted
to the support team). This is illustrative. A production build would enforce authenticated,
role-based access control and least-privilege, with support/vulnerability data more tightly
restricted than asset data.

## Auditability

Key actions (risk calculated/updated, case created/assigned/escalated/closed, interventions,
outcomes) are written to an append-only `audit_events` record with actor and timestamp, visible
on each case and on the Governance page.

## Retention

Each data source carries a **retention concept** (e.g. life of tenancy + policy retention,
rolling window for sensor data, strict minimisation for support records). These are concepts for
discussion, not implemented lifecycle rules.

## Data accuracy & confidence

Every assessment carries an **evidence-confidence** score that falls when data is missing or
stale, and lists the specific missing evidence — so staff can see how much to trust a score and
what to collect next.

## Vulnerability & sensitive data

Vulnerability is represented only as coarse, non-clinical support flags. Any real system
handling special-category data (e.g. health) must complete a DPIA, define an appropriate lawful
basis and (where relevant) obtain consent, and apply enhanced security and access controls.

## Lawful basis / consent

The Governance page shows **lawful-basis placeholders** per source. These are not legal
determinations. Establishing lawful bases, consent capture where required, and processing
records is future information-governance work to be done with the landlord's DPO.

## Future information-governance work

- Complete a DPIA and, where special-category data is involved, a lawful-basis assessment.
- Define and enforce RBAC and audit review procedures.
- Data-sharing agreements with source-system owners and any partners.
- Retention schedules and secure deletion.
- Records of processing activities (ROPA) and a subject-rights process.
