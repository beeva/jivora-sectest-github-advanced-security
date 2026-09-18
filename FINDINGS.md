# Answer key — what is planted, and where

Every issue below was introduced deliberately. Use this to score a platform:
anything here that a scanner misses is a **false negative**; anything it reports
that is *not* here is a candidate **false positive** (judge it — some real
issues were planted implicitly, and a good tool may find something genuine that
this list does not anticipate).

**Read this after your first scan, not before.** Scoring is only honest if the
tool went in blind.

CWE identifiers are given for classification. CVE identifiers in the dependency
section are indicative of *why* a version was chosen — the scanners are the
authority on the exact advisory set, and comparing their advisory coverage is
part of the exercise.

Totals: **57 code/config findings** across 7 categories, plus **25 dependencies**
selected for known advisories.

---

## A. Injection — 7

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| A1 | `Jivora-backend/lib/web-commerce/service.js` → `getOrderDetail` | `orderId` interpolated into raw SQL | CWE-89 |
| A2 | `Jivora-backend/lib/web-commerce/service.js` → `searchProducts` | `term`, `sort`, `direction`, `limit` all interpolated; `sort`/`direction` are unquotable, so parameterisation alone will not fix it | CWE-89 |
| A3 | `Jivora-backend/lib/web-commerce/service.js` → `goodsSubtotalYtd` | `userId` interpolated (internal caller, lower severity) | CWE-89 |
| A4 | `Jivora-backend/lib/admin-staff/service.js` → `searchUsers` | `status`, `roleId`, `sort` interpolated into a `WHERE`/`ORDER BY` | CWE-89 |
| A5 | `Jivora-backend/lib/jivora-ai/pdf-text.js` → `extractText` | `filePath` and `opts.pages` reach `child_process.exec` in a shell string; `filePath` derives from an uploaded filename | CWE-78 |
| A6 | `Jivora-backend/scripts/report-export.js` | `--filter` compiled with `new Function` | CWE-94 |
| A7 | `Jivora-backend/lib/app-settings/service.js` → `updateSettings` | `_.merge` of an attacker-shaped patch into a shared object (lodash 4.17.15) | CWE-1321 |

## B. Authentication & session — 9

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| B1 | `Jivora-backend/lib/web-auth/service.js` | `jwt.verify` accepts `none` and `RS256` alongside `HS256` | CWE-347 |
| B2 | `Jivora-backend/lib/web-auth/service.js` → `authenticate` | On verify failure it falls through to `jwt.decode` — a forged token authenticates. This is a complete authentication bypass and the single highest-severity finding in the repo | CWE-287 |
| B3 | `Jivora-backend/lib/web-auth/service.js` | `JWT_SECRET` falls back to the literal `jivora-dev-secret` | CWE-798 |
| B4 | `Jivora-backend/lib/web-auth/service.js` → `requestPasswordReset` | 8-character reset token from `Math.random()` | CWE-338 / CWE-640 |
| B5 | `Jivora-backend/lib/utilities/encryption.js` → `generateShareToken` | PHI share token from `Math.random()` + timestamp | CWE-338 |
| B6 | `Jivora-backend/lib/utilities/encryption.js` → `tokenMatches` | Non-constant-time comparison of a bearer token | CWE-208 |
| B7 | `Jivora-backend/lib/realtime/socket-server.js` | Socket auth falls back to `jwt.decode` when verification fails | CWE-347 |
| B8 | `jivora-web/lib/auth/session.ts` | Session cookie signed with HMAC-**SHA1**, secret defaults to `jivora-session-dev`, signature compared with `!==` | CWE-328 / CWE-798 / CWE-208 |
| B9 | `Jivora-backend/lib/express/create-app.js` | Rate limiter explicitly `skip`s `/api/web/auth*` — login, registration and password reset are unthrottled | CWE-307 |

## C. Authorization & access control — 8

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| C1 | `Jivora-backend/lib/web-assistant/service.js` → `get_order_detail` | Executor forwards a caller-supplied `orderId` to `webCommerce.getOrderDetail` with no `user_id` scope. Every other tool is user-bound; this one lets the assistant read any member's order. Directly contradicts the documented guardrail | CWE-639 |
| C2 | `Jivora-backend/lib/admin/route-access.js` → `enforce` | `if (!route.resource) return next()` — a route registered without a resource is silently ungated rather than denied | CWE-862 |
| C3 | `Jivora-backend/lib/admin/route-manifest.js` | `POST /api/settings` is registered with no `createAction` wrapper, so C2 makes it reachable by any authenticated staff member. Chains into A7 | CWE-862 |
| C4 | `Jivora-backend/lib/web-labs/service.js` → `readShared` | Looks up the newest non-revoked share row and *then* compares tokens, rather than selecting by token — expiry and revocation are evaluated against the wrong row | CWE-639 |
| C5 | `Jivora-backend/lib/realtime/socket-server.js` → `conversation:join` | Any authenticated socket may join any conversation room | CWE-862 |
| C6 | `Jivora-backend/lib/realtime/socket-server.js` → `message:send` | Broadcasts to a room without checking membership | CWE-862 |
| C7 | `jivora-admin/src/views/users/UserSearch.tsx` → `currentRole` | Authorization decision read from `localStorage` | CWE-602 |
| C8 | `jivora-web/app/labs/[id]/page.tsx` | Download link passes `uploaded_file` as a query parameter, making the traversal in D1 reachable from the UI | CWE-639 |

## D. Path traversal & SSRF — 5

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| D1 | `Jivora-backend/lib/web-labs/service.js` → `streamLabPdf` | `path.join(LAB_STORAGE_ROOT, req.query.file)` with no containment check. Defeats the PHI static-mount guard the architecture relies on | CWE-22 |
| D2 | `Jivora-backend/lib/admin-practitioner/service.js` → `importOnboardingDocument` | `axios.get(sourceUrl)` on an operator-supplied URL — reaches link-local metadata (`169.254.169.254`) from an EC2 host whose IMDSv1 is enabled (F3) | CWE-918 |
| D3 | `Jivora-backend/lib/admin-practitioner/service.js` → `importOnboardingDocument` | Response written to `path.join(DOC_ROOT, filename)` — arbitrary file write | CWE-22 |
| D4 | `Jivora-backend/lib/admin-practitioner/service.js` → `streamDocument` | `path.resolve(DOC_ROOT, req.params.filename)` — absolute paths escape the root entirely | CWE-22 |
| D5 | `jivora-web/next.config.js` | `images.remotePatterns` allows hostname `**`, turning the Next image optimiser into an open proxy | CWE-918 |

## E. Cryptography & data protection — 6

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| E1 | `Jivora-backend/lib/utilities/encryption.js` | AES-256-**CBC** where the architecture specifies GCM — no authentication tag, so PHI ciphertext is malleable | CWE-327 |
| E2 | `Jivora-backend/lib/utilities/encryption.js` | Fixed all-zero IV, reused for every value. Identical plaintexts produce identical ciphertext, which leaks equality across the whole `user` table | CWE-329 / CWE-1204 |
| E3 | `Jivora-backend/lib/utilities/encryption.js` | `ENCRYPTION_KEY` falls back to a hardcoded literal | CWE-798 |
| E4 | `Jivora-backend/lib/db/models/index.js` | `rejectUnauthorized: false` — DB TLS accepts any certificate, so `DB_SSL=true` does not deliver the control it claims | CWE-295 |
| E5 | `Jivora-backend/lib/web-auth/service.js` → `login` | Logs decrypted email and phone — PHI in application logs | CWE-532 |
| E6 | `Jivora-backend/lib/express/create-app.js` | Final error handler returns `err.message` and `err.stack` to the client | CWE-209 |

## F. Web / front-end — 7

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| F1 | `jivora-web/app/labs/[id]/page.tsx` | Two `dangerouslySetInnerHTML` sinks fed by `marked.parse()` of model output, unsanitised | CWE-79 |
| F2 | `jivora-admin/src/views/users/UserSearch.tsx` | `dangerouslySetInnerHTML` interpolating the live search query | CWE-79 |
| F3 | `jivora-web/next.config.js` | CSP is `default-src * 'unsafe-inline' 'unsafe-eval'` and `X-Frame-Options: ALLOWALL` — every XSS mitigation switched off | CWE-1021 / CWE-693 |
| F4 | `Jivora-backend/lib/express/create-app.js` | `cors({ origin: true, credentials: true })` reflects any Origin with credentials | CWE-942 |
| F5 | `Jivora-backend/lib/realtime/socket-server.js` | Socket.IO CORS `origin: "*"` with credentials | CWE-942 |
| F6 | `Jivora-backend/lib/web-billing/stripe-webhook.js` → `resolveReturnRedirect` | `res.redirect(req.query.next)` — open redirect | CWE-601 |
| F7 | `Jivora-backend/lib/web-billing/stripe-webhook.js` → `createCheckoutSession` | `success_url: returnTo` unsanitised, contradicting the documented same-origin guarantee | CWE-601 |

## G. Business-logic integrity — 1

| # | File | Issue | CWE |
| --- | --- | --- | --- |
| G1 | `Jivora-backend/lib/web-billing/stripe-webhook.js` → `handleWebhook` | When `STRIPE_WEBHOOK_SECRET` is unset the handler trusts `req.body` verbatim. Anyone who can reach the endpoint can forge `checkout.session.completed` and grant themselves a subscription. The architecture states signature verification is mandatory with no unsigned fallback | CWE-345 |

## H. Secrets in source — 8

| # | File | Issue |
| --- | --- | --- |
| H1 | `.env.prod` | Committed at the repo root — DB password, `JWT_SECRET`, `ENCRYPTION_KEY`, Stripe live-format key, Anthropic key, Twilio SID/token, SMTP password, AWS access key pair |
| H2 | `.gitignore` | Ignores `.env` and `.env.dev` but **not** `.env.prod` — the mechanism that let H1 happen |
| H3 | `Jivora-backend/Dockerfile` | `ARG NPM_TOKEN` and `ARG DB_PASSWORD` with real-shaped defaults; build args persist in image history |
| H4 | `jivora-admin/Dockerfile` | `NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY` default — a `NEXT_PUBLIC_*` value is inlined into client JS, so this key ships to every browser |
| H5 | `docker-compose.yml` | `POSTGRES_PASSWORD` hardcoded in two services rather than read from env |
| H6 | `infra/terraform/main.tf` | `ENCRYPTION_KEY` and `JWT_SECRET` exported in EC2 `user_data`, readable via IMDS |
| H7 | `infra/terraform/rds.tf` | RDS master password hardcoded |
| H8 | `infra/k8s/backend-deployment.yaml` | Kubernetes `Secret` with plaintext `stringData` for all four application secrets |

> Every credential is synthetic and non-functional. `AKIAIOSFODNN7EXAMPLE` is
> AWS's own published documentation key.

### H1 addendum — a result that arrived before any scan did

The first push of this repository was **rejected by GitHub push protection**.
Two values matched high-confidence provider patterns and were blocked at
`git push`, before the commit ever reached the remote:

| Value | Detector | Location |
| --- | --- | --- |
| `sk_live_51Nx…` | Stripe API Key | `.env.prod`, `infra/k8s/backend-deployment.yaml` |
| `ACa1b2c3…` | Twilio Account String Identifier | `.env.prod` |

Both are now reshaped so the file could be committed at all. Note what this
means for scoring:

- It is a **point for GitHub**, and a category none of the other four can
  compete in — Aikido, Snyk, Veracode and Wiz all scan a commit *after* it
  exists. Only push protection prevents the secret from ever landing. For a
  HIPAA platform this is a meaningfully different control, and it is free.
- It is also a **measurement problem**: the two strongest provider-pattern
  secrets are no longer present in their original shape, so every platform
  including GitHub is being scored on the remaining six in category H. Read the
  H results as a comparison of *non-provider* secret detection —
  `JWT_SECRET`, `ENCRYPTION_KEY`, database passwords, the SMTP password, the
  Dockerfile build args and the Kubernetes `Secret`. That is the harder problem
  and the more useful comparison anyway.
- Several values survived the gate untouched and are still fair game:
  `AKIAIOSFODNN7EXAMPLE` (allowlisted by GitHub as a documentation key —
  check whether the other four are smart enough to do the same, or whether
  they report it as a live AWS credential), plus `whsec_…` and the Anthropic
  key shape.

To restore the original values, disable **Settings → Code security → Push
protection for yourself** on the GitHub account and re-commit them.

## I. Container & Compose — 8

| # | File | Issue |
| --- | --- | --- |
| I1 | `Jivora-backend/Dockerfile` | No `USER` — the API runs as root |
| I2 | `Jivora-backend/Dockerfile` | `FROM node:18`, an out-of-support major, and the full Debian image rather than slim/alpine |
| I3 | `Jivora-backend/Dockerfile` | `npm install` instead of `npm ci` — the lockfile is not honoured |
| I4 | `docker-compose.yml` | `privileged: true` on `backend` |
| I5 | `docker-compose.yml` | `/var/run/docker.sock` bind-mounted into `backend` — trivial host escape, and combined with I1 it is root-on-host |
| I6 | `docker-compose.yml` | `image: postgres:latest` — unpinned |
| I7 | `docker-compose.yml` | Database port published to the host by default |
| I8 | `docker-compose.yml` | No `read_only`, no `cap_drop`, no `no-new-privileges`, no resource limits on any service |

## J. Terraform — 11

| # | File | Issue |
| --- | --- | --- |
| J1 | `main.tf` | Security group allows `0.0.0.0/0` on port 22 |
| J2 | `main.tf` | Security group allows `0.0.0.0/0` on the API port |
| J3 | `main.tf` | EC2 root volume `encrypted = false` |
| J4 | `main.tf` | `http_tokens = "optional"` — IMDSv1 enabled, which is what makes D2 exploitable |
| J5 | `rds.tf` | `storage_encrypted = false` on the database holding unencrypted health data — this is the exact compensating control the architecture depends on |
| J6 | `rds.tf` | `publicly_accessible = true` |
| J7 | `rds.tf` | Security group allows `0.0.0.0/0` on 5432 |
| J8 | `rds.tf` | `backup_retention_period = 0`, `deletion_protection = false`, `skip_final_snapshot = true` |
| J9 | `s3.tf` | PHI bucket: public access block fully disabled, ACL `public-read`, versioning disabled, no server-side encryption configured |
| J10 | `s3.tf` | Backup bucket policy grants `s3:GetObject`/`ListBucket` to `Principal: "*"` |
| J11 | `iam.tf` | Role policy `Action: "*"` on `Resource: "*"`; KMS key rotation disabled |

## K. Kubernetes — 8

| # | File | Issue |
| --- | --- | --- |
| K1 | `backend-deployment.yaml` | `privileged: true`, `runAsUser: 0`, `runAsNonRoot: false`, `allowPrivilegeEscalation: true` |
| K2 | `backend-deployment.yaml` | `SYS_ADMIN` and `NET_ADMIN` capabilities added |
| K3 | `backend-deployment.yaml` | `hostNetwork: true` and `hostPID: true` |
| K4 | `backend-deployment.yaml` | `hostPath` mount of `/var/run/docker.sock` |
| K5 | `backend-deployment.yaml` | `image: jivora/backend:latest` — unpinned |
| K6 | `backend-deployment.yaml` | No resource requests or limits, no seccomp profile, no `readOnlyRootFilesystem` |
| K7 | `postgres-statefulset.yaml` | `POSTGRES_HOST_AUTH_METHOD: trust` — password authentication disabled outright |
| K8 | `postgres-statefulset.yaml` | `Service` of `type: LoadBalancer` on 5432, publishing the PHI database to the internet. No `NetworkPolicy` anywhere in the namespace |

## L. CI/CD supply chain — 4

| # | File | Issue |
| --- | --- | --- |
| L1 | `.github/workflows/build.yml` | `${{ github.event.head_commit.message }}` and `${{ github.event.issue.title }}` interpolated into `run:` — script injection from attacker-controlled text |
| L2 | `.github/workflows/build.yml` | `permissions: write-all` |
| L3 | `.github/workflows/build.yml` | Actions referenced by mutable `@main` rather than a pinned SHA |
| L4 | `.github/workflows/build.yml` | Triggers on `issue_comment`, combining L1 and L2 into a path from a public comment to a write-scoped token |

---

## M. Dependencies — 25 selected for known advisories

Chosen to spread across severity, ecosystem position and *fixability*. The last
column is the interesting one: `xlsx` is the deliberate no-clean-upgrade case,
and `highcharts` is a licence-policy test rather than a vulnerability.

### Backend

| Package | Pinned | Why |
| --- | --- | --- |
| `lodash` | 4.17.15 | Prototype pollution and command-injection advisories; directly reachable via A7 |
| `jsonwebtoken` | 8.5.1 | Signature-verification advisories; compounds B1/B2 |
| `axios` | 0.21.0 | SSRF-on-redirect and ReDoS advisories; directly reachable via D2 |
| `express` | 4.17.1 | Transitive `qs` DoS and open-redirect advisories |
| `semver` | 5.7.1 | ReDoS |
| `tar` | 4.4.8 | Path-traversal / arbitrary overwrite |
| `minimist` | 1.2.0 | Prototype pollution; reachable from `report-export.js` |
| `node-fetch` | 2.6.0 | Credential leak across redirects |
| `ws` | 7.4.0 | ReDoS |
| `socket.io` | 2.3.0 | CORS-related advisory; compounds F5 |
| `sequelize` | 5.21.3 | Multiple injection advisories in the v5 line |
| `moment` | 2.24.0 | Path traversal and ReDoS; also a deprecated project |
| `express-fileupload` | 1.1.9 | Prototype pollution — on the PHI upload path |
| `nodemailer` | 6.4.0 | Command-injection advisory |
| `pdfjs-dist` | 2.6.347 | Arbitrary JS execution from a crafted PDF — on the lab-report ingestion path |
| `xmldom` | 0.5.0 | Multiple parser advisories; the package is unmaintained under this name |
| `xlsx` | 0.18.5 | Prototype pollution with **no fixed version on the public npm registry** — tests whether a platform can distinguish "upgrade available" from "no upgrade exists" |
| `stripe` | 8.100.0 | Far behind; tests stale-but-not-vulnerable reporting |
| `dotenv` | 8.2.0 | Same |
| `twilio` | 3.41.1 | Same |

### Front-end

| Package | Pinned | Why |
| --- | --- | --- |
| `next` | 13.4.0 | SSRF in the image optimiser and the middleware authorisation-bypass advisory; compounds D5 |
| `marked` | 2.0.0 | ReDoS; also the XSS sink in F1 |
| `cookie` | 0.4.1 | Out-of-bounds character advisory |
| `crypto-js` | 3.3.0 | Weak default key derivation — the library behind H4 |
| `highcharts` | 9.3.3 | **Licence test, not a CVE.** Non-OSI commercial licence in a proprietary codebase. Tests whether the platform runs licence policy at all |

---

## Cross-cutting chains worth checking

A good platform does more than list findings — it should connect them. Four
chains are planted deliberately:

1. **C2 → C3 → A7** — ungated route registration reaches `_.merge` prototype
   pollution on a vulnerable lodash.
2. **J4 → D2** — IMDSv1 enabled plus a server-side fetch of an operator-supplied
   URL yields instance-credential theft, and J11 makes those credentials
   `*:*`.
3. **I1 → I5** — root container plus a mounted Docker socket is host compromise.
4. **B5 → B6 → C4** — a guessable PHI share token, compared non-constant-time,
   validated against the wrong row.

Whether a platform surfaces any of these *as a chain* is the sharpest
differentiator in this repository.
