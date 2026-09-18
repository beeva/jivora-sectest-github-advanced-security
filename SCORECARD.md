# Scorecard

Fill this in after scanning. One copy lives in each of the five repositories;
collate them when all five are done.

Platform: `____________`
Plan / tier scanned on: `____________`
Date: `____________`

---

## 1. Detection by category

Denominators come from [`FINDINGS.md`](FINDINGS.md). "Found" means the platform
reported the issue at the right file with a usable description — not that it
reported *something* in that file.

| Category | Planted | Found | Missed | Notes |
| --- | ---: | ---: | ---: | --- |
| A. Injection | 7 | | | |
| B. Authentication & session | 9 | | | |
| C. Authorization & access control | 8 | | | |
| D. Path traversal & SSRF | 5 | | | |
| E. Cryptography & data protection | 6 | | | |
| F. Web / front-end | 7 | | | |
| G. Business-logic integrity | 1 | | | |
| H. Secrets in source | 8 | | | |
| I. Container & Compose | 8 | | | |
| J. Terraform | 11 | | | |
| K. Kubernetes | 8 | | | |
| L. CI/CD supply chain | 4 | | | |
| M. Dependencies | 25 | | | |
| **Total** | **107** | | | |

### The four chains

| Chain | Surfaced as a chain? | Surfaced as separate findings? | Missed? |
| --- | --- | --- | --- |
| C2 → C3 → A7 (ungated route → prototype pollution) | | | |
| J4 → D2 (IMDSv1 → SSRF → `*:*` credentials) | | | |
| I1 → I5 (root container → Docker socket → host) | | | |
| B5 → B6 → C4 (weak share token → PHI disclosure) | | | |

---

## 2. Noise

| Measure | Value |
| --- | --- |
| Total findings reported | |
| Of those, in `FINDINGS.md` | |
| Judged genuine but not anticipated | |
| Judged false positives | |
| **Precision** (genuine ÷ total) | |
| Findings at Critical/High | |
| False positives at Critical/High | |

A tool that reports all 107 alongside 400 false positives has not won.

---

## 3. Operational fit

Score 1–5, with a sentence of evidence for anything below 4.

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Time to first scan from signup | | |
| Setup friction (app install, CI config, auth) | | |
| Scan wall-clock time | | |
| PR/commit feedback quality | | |
| Fix guidance — is it specific to *this* code? | | |
| Auto-fix / suggested-patch quality | | |
| Triage workflow (dismiss, snooze, assign) | | |
| Reachability or exploitability filtering | | |
| Duplicate suppression across scans | | |
| Monorepo handling (3 apps, 2 package managers) | | |
| Yarn-vs-npm handling in `jivora-admin` | | |
| Licence policy support | | |
| SBOM export | | |
| Compliance reporting (HIPAA / SOC 2 evidence) | | |
| API / data export | | |
| Documentation quality | | |

---

## 4. Commercials

| Item | Value |
| --- | --- |
| Free tier limits | |
| Entry paid tier, annual | |
| Price at 3 repos / 1–3 developers | |
| Price at 10 developers | |
| What is gated behind an upsell | |
| Self-serve, or sales call required | |
| Contract minimum | |

---

## 5. Verdict

**Would I run Jivora on this?** Yes / No / Only alongside something else

**Strongest finding it produced:**

**Most damaging thing it missed:**

**Biggest operational friction:**

**One-line summary:**
