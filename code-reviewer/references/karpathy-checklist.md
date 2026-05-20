# Karpathy Review Checklist

Apply these four dimensions to every code review. Each dimension has concrete check questions — flag any that apply.

## 1. Assumptions Surfaced

Identify hidden assumptions that could lead to incorrect implementation or future breakage.

- Is there unclear product intent that could lead the implementation in the wrong direction?
- Are there ambiguous compatibility promises (backward compat, API stability, data format versioning)?
- Are there hidden migration assumptions (schema version, data format, deployment order)?
- Does the code assume specific runtime conditions (timing, ordering, availability) without validation?
- Are there implicit contracts between components that aren't documented or tested?

**Flag when:** The code works under the author's assumptions but those assumptions aren't guaranteed by the system.

## 2. Simplicity First

Identify unnecessary complexity that makes the code harder to understand, maintain, or debug.

- Are there speculative abstractions solving problems that don't exist yet?
- Is there over-configurability where a simple constant or direct implementation would suffice?
- Are there unnecessary generic helpers that have only one real use case?
- Is the solution proportional to the problem, or is it over-engineered?
- Are there layers of indirection that obscure what the code actually does?
- Could a simpler data structure or algorithm achieve the same result?

**Flag when:** Removing the abstraction would make the code clearer without sacrificing correctness.

## 3. Surgical Changes

Identify scope creep that makes the diff harder to review and increases risk.

- Are there unrelated refactors bundled with the functional change?
- Is there formatting churn (whitespace, import reordering) that obscures the real diff?
- Are there drive-by cleanups that don't trace to the stated goal of the PR?
- Does every changed line serve the PR's stated purpose?
- Are there "while I'm here" improvements that should be separate PRs?
- Is the change the minimal diff needed to achieve the goal?

**Flag when:** Splitting the PR would make each part easier to review and safer to merge independently.

## 4. Goal-Driven Verification

Identify gaps in testing and verification relative to what the change actually does.

- Are there tests for invalid inputs and error paths, not just the happy path?
- Are changed contracts (function signatures, API shapes, schemas) tested from the consumer's perspective?
- Are affected callers and regression paths covered by existing or new tests?
- Is user-visible behavior verified, not just internal state?
- If the change fixes a bug, is there a test that would have caught the bug?
- If the change adds a feature, do tests cover the acceptance criteria?

**Flag when:** The change could pass all existing tests while still being broken for real users.
