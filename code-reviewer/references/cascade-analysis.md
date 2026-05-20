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

## Fallback: No Code Graph Available

When no code graph (GitNexus or equivalent) is available, use these diff-based heuristics:

### Evidence Gathering

- Use `git diff --stat` to identify all changed files and their change magnitude.
- Identify exported/public symbols that changed signature, return type, or behavior from the diff hunks.
- Use text search (grep) to find callers of changed symbols outside the changeset.
- Check if changed function parameters, return shapes, or error behaviors have consumers not visible in the diff.

### Confidence Rules

- Default to `degraded` confidence when operating without a graph.
- Upgrade to `medium` only if the diff clearly shows all affected callers are updated within the changeset.
- Never claim `high` confidence without graph evidence.

### Blocking Signals (Still Apply)

Even without a graph, flag these as blocking:

- A function signature changes but the diff doesn't update all call sites visible via text search.
- A shared utility changes behavior but only one caller's usage pattern is addressed.
- A public API, route, or schema changes without migration or version handling.
- A config key is renamed or removed without checking all references.

### Evidence Labeling

When reporting findings from text search rather than graph traversal, note the evidence source:

- `(graph)` — found via code knowledge graph (high confidence)
- `(text search)` — found via grep/text matching (lower confidence, may have false positives)
- `(inferred)` — inferred from code patterns but not directly confirmed
