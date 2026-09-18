# Jivora — security platform test bed · GitHub Advanced Security

> ⚠️ **Intentionally vulnerable.** This repository exists solely to evaluate
> security scanning platforms. Do not deploy it, do not reuse its code, and do
> not treat any credential in it as real.

**Platform under test:** GitHub Advanced Security — CodeQL code scanning, secret
scanning, and Dependabot.

## Enabling it

Everything here is native to GitHub; there is no third-party app to install.

1. **Settings → Advanced Security**. On a public repository, enable:
   - **Code scanning** — the workflow in `.github/workflows/codeql.yml` already
     runs `security-extended`, so "Advanced setup" is already satisfied.
   - **Secret scanning** — leave alerts **on**, but leave **push protection
     off**. The committed `.env.prod` is a deliberate test case; push protection
     would have blocked it from ever landing.
   - **Dependabot alerts** and **Dependabot security updates**.
2. **Settings → Code security → Dependency graph** must be on for Dependabot to
   see the three `package.json` files.
3. Push or re-run the workflow. Findings land in the **Security** tab under
   Code scanning, Secret scanning and Dependabot respectively.

## What to watch for

- **CodeQL `javascript-typescript`** should be strongest on the taint-flow
  findings — the SQL injection in `web-commerce`, the path traversal in
  `web-labs`, the command injection in `pdf-text.js`. Check whether it connects
  the source in the route registrar to the sink three files away.
- **CodeQL `actions`** is the newer analysis and should catch the script
  injection in `.github/workflows/build.yml`.
- **Secret scanning** covers partner patterns well (Stripe, AWS, Anthropic).
  Watch whether it finds the non-partner secrets: `JWT_SECRET`,
  `ENCRYPTION_KEY`, the RDS password in Terraform, the Kubernetes `Secret`.
- **Dependabot** is the weakest-coverage arm to test: it reports advisories but
  not reachability, so expect noise on dependencies nothing calls.
- **Blind spots to confirm:** GHAS has no IaC scanning. Everything in
  `infra/terraform/` and `infra/k8s/` — 19 planted findings — should come back
  empty. That gap is the finding.

## Cost note

Code scanning, secret scanning and Dependabot are free on public repositories.
On a private repository — which is what Jivora actually is — these are the paid
**GitHub Code Security** and **GitHub Secret Protection** SKUs, billed per
active committer. Price the real thing, not this.
---

## What this repository is

A deliberately vulnerable, structurally faithful miniature of **Jivora** — a
Lyme-disease wellness platform handling PHI under HIPAA. It exists to be scanned.

The shape is copied from the real system's architecture document (v1.4), so
findings land on the same surfaces they would in production: a monorepo of three
applications over one PostgreSQL database, two API surfaces with different
authentication, PHI column encryption, an AI assistant with a read-only tool
loop, Stripe webhooks, and a Docker Compose deployment.

```
Jivora-backend/     Node 22 · Express 4 · Sequelize · Socket.IO · @anthropic-ai/sdk
jivora-web/         Next.js App Router · member app · port 4000
jivora-admin/       Next.js App Router · admin panel · port 4002 · Yarn only
infra/terraform/    The AWS deployment the platform would move to
infra/k8s/          The Kubernetes topology for the same
docker-compose.yml  The production stack as actually deployed today
.env.prod           Committed on purpose
```

### Architectural fidelity

| Real Jivora | Here |
| --- | --- |
| Two account stores (`user`, `admin_user`), seven roles | Both, with the same role ids |
| `/api/web/*` and `/api/*` registered separately | Both registrars present |
| PHI column encryption + `*_hash` lookup columns | Present — and subtly wrong |
| Entitlements recomputed live, 402 on paywall | `lib/web/entitlements.js` |
| Admin route manifest as single source of truth | `lib/admin/route-manifest.js` + `route-access.js` |
| 13 read-only assistant tools bound to `user.id` | All 13 — one is not bound |
| Stripe webhook signature mandatory | Claimed in docs, not in code |
| In-process scheduler, no separate worker | `lib/web-protocol/reminder-scheduler.js` |

Where the code contradicts the architecture document, that is the point: the
most interesting findings in this repository are the ones where a stated
security control does not survive contact with the implementation.

## Running it

Don't. There is no seed data, and several dependencies are pinned to versions
with known remote-code-execution advisories. If you want a container for
image-layer scanning:

```sh
docker build -t jivora/backend:sectest Jivora-backend
docker build -t jivora/web:sectest     jivora-web
```

`npm install` inside any of the three apps is enough for dependency scanning and
is safe as long as nothing is executed.

## Scoring a platform

1. Connect the platform. Do not read `FINDINGS.md` first.
2. Let it scan everything it is willing to scan.
3. Export its findings.
4. Now open [`FINDINGS.md`](FINDINGS.md) — the answer key: 57 code and config
   issues across 7 categories, plus 25 dependencies chosen for known advisories.
5. Fill in [`SCORECARD.md`](SCORECARD.md).

Four multi-step attack chains are planted deliberately. Whether a platform
surfaces them *as chains* rather than as unrelated findings is the sharpest
differentiator in this repository.

## Sibling repositories

The same codebase, scanned by a different platform in each:

| Repository | Platform |
| --- | --- |
| [`jivora-sectest-github-advanced-security`](https://github.com/beeva/jivora-sectest-github-advanced-security) | GitHub Advanced Security |
| [`jivora-sectest-aikido`](https://github.com/beeva/jivora-sectest-aikido) | Aikido |
| [`jivora-sectest-snyk`](https://github.com/beeva/jivora-sectest-snyk) | Snyk |
| [`jivora-sectest-veracode`](https://github.com/beeva/jivora-sectest-veracode) | Veracode |
| [`jivora-sectest-wiz`](https://github.com/beeva/jivora-sectest-wiz) | Wiz |

Identical content by design — only this README and the workflows in
`.github/workflows/` differ, so the results are directly comparable.

## Safety

Every credential in this repository is synthetic and authenticates against
nothing. `AKIAIOSFODNN7EXAMPLE` is AWS's own published documentation key. There
is no real PHI here and no real patient data; the clinical vocabulary is
structural, and every value is invented.

GitHub push protection is disabled on this repository on purpose — the committed
`.env.prod` is one of the things being tested for.

Do not copy any pattern from this repository into anything real.
