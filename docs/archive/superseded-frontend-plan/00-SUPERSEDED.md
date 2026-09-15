# SUPERSEDED — an earlier frontend plan

**Do not build from these documents.** They were written in `humbee_influencer_backend/frontend/docs/`
before this repo became the frontend home, and they have been moved here as a record.

| | |
| --- | --- |
| **Where the current plan lives** | `docs/01-architecture.md` (ADRs), `docs/10-rn-cli-implementation-guide.md` (the build manual), `docs/09-saas-and-module-architecture.md` (modules and multi-tenancy) |
| **Where their analysis survives** | `docs/07-framework-comparison.md` consolidates and re-scores `02-alternatives-considered.md`, `14-web-stack-evaluation.md` and `15-saas-multi-tenant-and-stack-revision.md` against the criteria that were actually asked for |

**Three reasons they are stale:**

1. **Repo layout.** They assume the app lives at `humbee_influencer_backend/frontend/apps/influencer-mobile`
   with a sibling `manufacturer-web`. It lives in this repo, and this repo is frontend only.
2. **Toolchain.** `01` recommends Expo CNG + Expo Router; `15` amends to RN CLI. The decision is
   **RN CLI with React Navigation** — recorded in `docs/01-architecture.md` ADR-001.
3. **Relative paths.** Every `../docs/…` and `../contracts/…` reference in these files pointed at the
   backend repo from their old location and no longer resolves. The backend contract is at
   `humbee_influencer_backend/contracts/openapi.yaml`.

They are kept because the reasoning in `02`, `14` and `15` is worth reading if the framework question is
ever re-opened. That is their only remaining use.
