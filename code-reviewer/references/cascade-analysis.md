# Cascade Analysis

Use this reference to judge whether a change remains correct in the whole codebase, not just inside the edited files. The outer robot owns how change data is fetched and how reports are published.

## Evidence To Prefer

- Changed symbols, files, and public contracts.
- Direct upstream callers and consumers of changed symbols.
- Affected execution flows and process steps.
- Tests that cover the changed symbols and affected flows.
- Route, tool, API, schema, or config consumers when contracts change.

Prefer GitNexus or an equivalent code graph for this evidence. If graph evidence is missing, stale, or incomplete, set cascade confidence to `degraded` and avoid strong approval for risky shared changes.

## Blocking Cascade Signals

- A direct caller outside the changeset still relies on an old signature, return shape, side effect, error behavior, or timing assumption.
- A public contract changes without corresponding consumers, migration, compatibility handling, or tests.
- A shared helper changes semantics for one call path while other call paths still require the old behavior.
- A route, tool, schema, or config change has downstream consumers that are not updated.
- A critical flow is affected but only leaf-level tests were added.

## Non-Blocking But Important Signals

- The change adds a local workaround where an existing shared abstraction should be used.
- The change adds an abstraction that has only one real use case.
- The change makes sibling flows inconsistent.
- The change reduces diagnostic clarity, observability, or failure transparency.
- The change is correct but broader than needed for the stated goal.

## Confidence Labels

- `high`: graph evidence and diff review agree; direct callers and affected tests are inspected.
- `medium`: graph evidence covers key symbols, but some peripheral flows or tests are inferred.
- `degraded`: graph evidence is unavailable, stale, unmapped, or contradicted by the diff.

Use `NEEDS_HUMAN` instead of `APPROVE` when confidence is degraded and the change touches shared, critical, or public-contract code.
