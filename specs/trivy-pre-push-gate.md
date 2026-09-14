---
title: Fail-closed Trivy pre-push CVE gate
status: completed
created: 2026-09-14
updated: 2026-09-14
issue: null
---

# Fail-closed Trivy pre-push CVE gate

## Objective

Add a local, client-side pre-push git hook that blocks `git push` when Trivy finds a CRITICAL-severity,
fixable dependency vulnerability, so known-exploitable CVEs never leave the developer's machine. Part of a
fleet-wide rollout across the user's projects (meta-projects issue #41); this repo has no existing
`.githooks/` or hook activation mechanism, so it's created fresh here.

## Context

`audio-sync-app` already runs Trivy manually via the `/trivy-scan` skill and has Husky hooks for lint
(pre-commit) and `make validate` (pre-push on `main`, see root `CLAUDE.md`). This adds a second,
independent pre-push hook path (`.githooks/`, activated via `core.hooksPath`) carrying only the CVE gate —
it is intentionally not merged into the existing Husky `.husky/pre-push`, matching the fleet-wide pattern
being rolled out identically across projects (meta-projects issue #41). The hook is fail-closed: if `trivy`
isn't installed, the push is blocked with instructions rather than silently skipping the scan.

## Requirements

### Functional Requirements

- [x] `.githooks/pre-push` runs `trivy fs . --scanners vuln --severity CRITICAL --exit-code 1 --ignore-unfixed --quiet` and blocks the push (non-zero exit) if it finds a fixable CRITICAL vulnerability.
- [x] If `trivy` is not on `PATH`, the hook exits non-zero (fails closed) with a message pointing to `.claude/skills/trivy-scan/setup.md`.
- [x] `scripts/install-hooks.sh` sets `core.hooksPath` to `.githooks` and chmods its contents executable, one time, only when explicitly run by a contributor (never invoked automatically by this change).

### Non-Functional Requirements

- [x] Scope: only Trivy CVE-gate logic in `.githooks/pre-push` — no Engram sync or other hook logic (that stays meta-projects-only).
- [x] Both new files are committed executable (`chmod +x`).

## Architecture

### Components

- `.githooks/pre-push` — the hook script (fixed content, given verbatim in the issue).
- `scripts/install-hooks.sh` — one-time activation script (fixed content, given verbatim in the issue).

No changes to `.husky/`, `Makefile`, or CI — this is a separate, opt-in local gate.

## Testing Strategy

Manual verification only (git hook, no unit-testable logic):
- `trivy fs . --scanners vuln --severity CRITICAL --ignore-unfixed` run once against the repo pre-activation: clean, 0 findings (documented here and in the PR description, no code change was needed to satisfy it).
- `shellcheck`/`bash -n` on both scripts to confirm they're syntactically valid.
- `scripts/install-hooks.sh` inspected to confirm it does not run automatically and only takes effect when a contributor explicitly executes it.

## Boundaries & Constraints

### In Scope
- The two files listed above, committed executable, with content exactly as specified.

### Out of Scope
- Wiring `.githooks/pre-push` into CI, Husky, or `make validate`.
- Any Engram-related hook content (fleet-wide, meta-projects-only concern).
- Running `git config core.hooksPath` as a side effect of this change.

### Technical Constraints
- Requires a local `trivy` binary; no bundling/installation of Trivy itself in this change.

## Success Criteria

- [x] `.githooks/pre-push` and `scripts/install-hooks.sh` exist, are executable, and match the specified content.
- [x] `core.hooksPath` is untouched by this change (verified: not run as part of implementation).
- [x] PR opened against `main` documenting the clean pre-activation scan.

## Implementation Plan

Single-slice, no separate plan file needed given the fixed, fully-specified two-file scope:

1. Create `.githooks/pre-push` (chmod +x).
2. Create `scripts/install-hooks.sh` (chmod +x).
3. Verify pre-activation scan result (already run clean, no action needed).
4. Commit, push branch, open PR.

## Changelog

(none — first version)
