---
title: Fail-closed Trivy pre-push CVE gate
status: completed
created: 2026-09-14
updated: 2026-09-14
issue: null
---

# Fail-closed Trivy pre-push CVE gate

## Objective

Add a local, client-side pre-push check that blocks `git push` when Trivy finds a CRITICAL-severity,
fixable dependency vulnerability, so known-exploitable CVEs never leave the developer's machine. Part of a
fleet-wide rollout across the user's projects (meta-projects issue #41).

## Context

`audio-sync-app` already has an active Husky-managed pre-push hook (`core.hooksPath` = `.husky/_`,
activated automatically via `npm install`'s `prepare` script): `.husky/pre-push` runs `make validate` on
`main`. The fleet rollout's original plan assumed no target repo had existing hook infrastructure and would
create a parallel `.githooks/` + `scripts/install-hooks.sh` path — that assumption doesn't hold here (same
gap found and corrected during the `portfolio-website` pilot of this rollout). Creating a second,
independently-activated hook path would either go unused (nothing sets `core.hooksPath` to `.githooks`) or,
if `scripts/install-hooks.sh` were ever run, silently disable every existing Husky hook (pre-commit gitleaks
+ lint-staged, and this repo's own pre-push `make validate`). Per the decision rule established in the
`portfolio-website` pilot: when a target repo already has hook infrastructure and an activation mechanism,
prepend/adapt the Trivy step into it in place rather than creating a parallel one. This gate is prepended to
the existing `.husky/pre-push`, ahead of the `make validate` branch check, and runs unconditionally (all
branches, not just `main`) — matching the gate's fail-closed intent and the pattern used in `meta-projects`'
own `.githooks/pre-push` and in `portfolio-website`'s PR #140.

## Requirements

### Functional Requirements

- [x] `.husky/pre-push` runs `trivy fs . --scanners vuln --severity CRITICAL --exit-code 1 --ignore-unfixed --quiet` before any existing logic, and blocks the push (non-zero exit) if it finds a fixable CRITICAL vulnerability.
- [x] If `trivy` is not on `PATH`, the hook exits non-zero (fails closed) with a message pointing to `.claude/skills/trivy-scan/setup.md`.
- [x] No new activation mechanism — the gate takes effect immediately for anyone with Husky already installed (same as every other Husky hook in this repo), no separate opt-in step.

### Non-Functional Requirements

- [x] Scope: only the Trivy CVE-gate step is added — no Engram sync or other hook logic (that stays meta-projects-only), and the existing gitleaks/lint-staged/`make validate` logic is untouched.
- [x] No parallel `.githooks/` directory or `scripts/install-hooks.sh` — avoids a second, competing hook-activation path.

## Architecture

### Components

- `.husky/pre-push` — existing Husky hook, now prepended with the Trivy fail-closed block ahead of the
  `make validate` branch check.

No changes to `.husky/pre-commit`, `Makefile`, or CI.

## Testing Strategy

Manual verification only (git hook, no unit-testable logic):
- `trivy fs . --scanners vuln --severity CRITICAL --ignore-unfixed` run once against the repo pre-activation: clean, 0 findings.
- `bash -n .husky/pre-push` to confirm the edited script is syntactically valid.
- Confirmed `core.hooksPath` (`.husky/_`) is unchanged by this PR — the gate rides the existing Husky activation, nothing new to install.

## Boundaries & Constraints

### In Scope
- Prepending the Trivy step to `.husky/pre-push`, content exactly as specified.

### Out of Scope
- Wiring the gate into CI — local hook only.
- Any Engram-related hook content (fleet-wide, meta-projects-only concern).
- Changing `make validate`, `.husky/pre-commit`, or any other existing hook logic.

### Technical Constraints
- Requires a local `trivy` binary; no bundling/installation of Trivy itself in this change.

## Success Criteria

- [x] `.husky/pre-push` contains the Trivy step ahead of existing logic, matches the specified content.
- [x] `core.hooksPath` and all other Husky hooks are untouched by this change.
- [x] PR opened against `main` documenting the clean pre-activation scan and the deviation from the
      original fleet-rollout plan (adapt-in-place instead of parallel `.githooks/`).

## Implementation Plan

Single-slice, no separate plan file needed given the fixed, fully-specified scope:

1. Prepend the Trivy block to `.husky/pre-push`.
2. Verify pre-activation scan result (already run clean, no action needed).
3. Commit, push branch, open PR.

## Changelog

- 2026-09-14: initial version created a parallel `.githooks/pre-push` +
  `scripts/install-hooks.sh` path per the fleet rollout's original (later
  found incorrect) assumption that no target repo had existing hook infra.
  Corrected before merge: this repo already runs Husky, so the gate is
  prepended into `.husky/pre-push` instead, matching the decision rule from
  the `portfolio-website` pilot.
