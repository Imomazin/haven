# Security

Haven is a **public-repository demonstrator** on synthetic data. Security here focuses on not
leaking secrets, safe data handling, and a realistic path to production hardening.

## Secrets & the public repo

- Every committed file is assumed **externally visible**. No `DATABASE_URL`, passwords, tokens,
  API keys, real addresses, clinical data or private partner/procurement material is committed.
- Credentials come only from environment variables (`DATABASE_URL`, `DIRECT_URL`). `.env`,
  `.env.local` and `.env.*.local` are git-ignored; `.env.example` contains placeholders only.
- The generated seed SQL dump (`drizzle/seed.sql`) is git-ignored; the deterministic generator
  is committed instead.
- If a credential is ever exposed, rotate it in Neon immediately and invalidate the old one.

## Data handling

- **Synthetic only** — no real tenant identities, and no real addresses tied to individuals.
- Localities are real Inverclyde place names used purely as area labels.
- Household data is minimised to non-clinical support indicators (see
  [`privacy-and-governance.md`](privacy-and-governance.md)).

## Application security posture (demonstrator)

- All database access is server-side (`server-only`), never exposed to the client.
- Server actions accept `FormData`, coerce inputs, and validate where relevant (Zod schemas in
  `src/lib/validation.ts`; case-status transitions guarded).
- Drizzle ORM uses parameterised queries (no string-built SQL from user input).
- Neon connections use TLS (`sslmode=require`) and the pooled endpoint with `prepare:false`.

## Not yet implemented (required for production)

- **Authentication & authorisation.** The demo has a single implicit user and no login.
  Production needs SSO/auth, RBAC and least-privilege (support/vulnerability data restricted).
- **Rate limiting / abuse protection** on mutating actions.
- **Audit review & alerting**, secrets management (e.g. a vault), and dependency scanning in CI.
- **DPIA and information-governance sign-off** before processing real personal data.

## Reporting

For a real deployment, define a security contact and a coordinated disclosure process. This
demonstrator has no production data to compromise.
