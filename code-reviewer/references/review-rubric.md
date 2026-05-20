# Review Rubric

Use this rubric to decide what matters in code review. Start with system impact, then inspect code quality through the Karpathy lens.

## Severity

| Severity | Use When |
| --- | --- |
| Critical | Merge can break production-critical flows, security, data integrity, auth, payments, irreversible writes, or broad public contracts. |
| High | Direct callers, API consumers, migrations, or affected execution flows are broken or unhandled. |
| Medium | The change likely works locally but weakens maintainability, omits important tests, introduces avoidable coupling, or makes future changes harder. |
| Low | Minor clarity, naming, or cleanup issue that does not affect behavior or architecture. |

## Cascade-First Checks

- Identify changed symbols, public interfaces, route/tool contracts, schemas, config keys, and shared helpers.
- Inspect d=1 upstream callers first. Any caller outside the changeset that still expects old behavior is a blocking finding.
- Inspect d=2/d=3 flows when the changed symbol is central, reused, or part of critical workflows.
- Check whether tests cover the affected flows, not only the edited files.
- Treat broad shared utilities, framework hooks, middleware, permission paths, and data models as higher risk than isolated leaf code.

## Karpathy Review Standard

- **Assumptions surfaced:** flag unclear product intent, ambiguous compatibility promises, or hidden migration assumptions.
- **Simplicity first:** flag speculative abstractions, over-configurability, unnecessary generic helpers, and large solutions to small problems.
- **Surgical changes:** flag unrelated refactors, formatting churn, drive-by cleanup, or changes whose lines do not trace to the stated goal.
- **Goal-driven verification:** flag missing tests for invalid inputs, changed contracts, affected callers, regression paths, or user-visible behavior.

## Whole-System Elegance

Flag changes that are locally tidy but globally worse:

- A local wrapper or abstraction duplicates an existing pattern instead of using it.
- A special case patches one caller while leaving sibling flows inconsistent.
- A signature or schema change makes downstream code more complex without a clear system-level payoff.
- A new dependency or layer solves a one-off problem.
- A "cleanup" erases compatibility, diagnostics, observability, or failure handling that other flows rely on.

## Evidence Standard

Every finding needs concrete evidence:

- file and line when available
- diff hunk or symbol name
- affected caller, flow, contract, or test gap
- why the issue matters after merge
- smallest viable fix direction

When evidence is incomplete, say so and downgrade certainty. Do not invent missing tool output.

## GitHub Comment Quality

Repo Guard may publish this report directly as a PR review. Optimize for a reviewer scanning the comment under time pressure.

### Decision Summary

The first screen should answer three questions:

- Can this merge now?
- If not, what is the highest-risk blocker?
- What is the smallest next action?

Use one direct sentence. Do not repeat the full findings list.

### Finding Threshold

Include a finding only when it changes one of these outcomes:

- merge decision
- required follow-up before merge
- test or verification confidence
- maintainability risk for a touched shared path

Do not include style preferences, speculative rewrites, or broad advice unless they hide real risk.

### Inline Comment Hygiene

Use inline comments for line-specific defects only. A good inline comment is short, anchored, and fix-oriented.

Good:

```markdown
[scripts/review.mjs:42] This accepts `0` as a PR number, which later calls `/pulls/0`; reject non-positive integers before the API call.
```

Avoid:

```markdown
[scripts/review.mjs:42] Consider improving validation.
```

If the same root cause appears on several lines, leave one representative inline comment and summarize the broader issue once in the main findings.

### No-Finding Reviews

When no blocking findings exist, do not produce a hollow approval. State what evidence was inspected, why the recommendation is non-blocking, and any residual risk caused by missing graph evidence, truncated diffs, or absent tests.
