# Security posture

> **This is a security-scanner evaluation fixture, not a production system.**
> It deliberately contains vulnerabilities, misconfigurations and synthetic
> credentials. See [`FINDINGS.md`](FINDINGS.md) for the full answer key.

## What this document would normally carry

In the real Jivora repository this file holds the HIPAA safeguards map and the
vulnerability-reporting process. Here it records the controls the architecture
*claims*, so a scanner's findings can be read against the stated intent.

| Control | Claim |
| --- | --- |
| PHI at rest | AES-256-GCM on identifiers and lab-report content; stable `ENCRYPTION_KEY`. Health data in `user_*` is not column-encrypted and depends on database-level encryption. |
| PHI in transit | TLS to the database in production (`DB_SSL=true`). |
| PHI assets | Lab-report PDFs and practitioner/BAA documents are 404'd on the public static mount and streamed only through authenticated routes. |
| PHI access auditing | Practitioner reads via `logAccess` (`user_access_log`); admin reads via `logActivity`. |
| Server-side paywalls | `requirePaidModule()` returns 402. The UI lock is not the security boundary. |
| Webhook integrity | Mandatory Stripe signature verification plus an idempotency log. |
| Open-redirect / SSRF guards | Checkout return paths sanitised to same-origin relative paths. |
| Upload limits | 50 MB across at most 5 files, abort-on-limit, safe filenames. |
| Rate limiting & CORS | Applied at the edge of the Express pipeline. |
| Process resilience | Global rejection and exception handlers plus a final Express error handler. |

Several of those claims are **contradicted by the code in this repository on
purpose** — the gap between the documented control and the implementation is
itself part of what the platforms are being measured on.

## Reporting

Findings from a scan belong in [`SCORECARD.md`](SCORECARD.md). This repository
has no real users and no real data; there is nothing to disclose.
