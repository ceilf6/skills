---
name: code-reviewer
description: Use when performing code review, running automatic CR for a changeset, assessing merge risk, checking cascade impact, or deciding whether code changes should be approved before merge.
---

# Code Reviewer

Review code changes as a CR robot. Prefer whole-system correctness and long-term code elegance over accepting a local patch that only works in isolation. The outer system owns data acquisition, publishing, deduplication, permissions, and retries.

## Trigger Signals

Use this skill for prompts like:

- "Review this changeset"
- "自动 CR 这个变更"
- "Check whether this change is safe to merge"
- "Run code review for this diff"
- "Assess merge risk and cascade impact"

Use another skill instead when the user asks to address existing review comments, fix CI, create or publish a change request, or review only frontend visual design.

## Inputs Expected

Assume the caller provides or can access change metadata, diff, changed files, base/head refs, and available cascade-analysis evidence. Do not spend skill attention on how to fetch platform data or publish review comments.

## Review Procedure

1. Read [references/review-rubric.md](references/review-rubric.md).
2. Read [references/cascade-analysis.md](references/cascade-analysis.md).
3. Read [references/karpathy-checklist.md](references/karpathy-checklist.md).
4. Judge the change through cascade evidence first, then diff evidence. Check whether direct callers, affected flows, tests, public contracts, and migration paths remain coherent.
5. Produce the report only. Do not post platform comments, submit reviews, resolve threads, push commits, or mutate repository state.

## Review Priorities

- Correctness and breaking changes outrank style.
- Cascade impact outranks local implementation neatness.
- Architecture preservation outranks isolated cleverness.
- Minimal, surgical fixes outrank speculative abstractions.
- Verifiable behavior outranks plausible explanations.
- Reviewer actionability outranks exhaustive commentary.

## Comment Quality Rules

Write for a maintainer deciding whether to merge now. Lead with the decision, the highest-risk reason, and the next action. Keep the report compact enough to scan in a GitHub review email.

- Include only findings that affect correctness, merge risk, maintainability, or verification confidence.
- Make every finding actionable: name the observed problem, why it matters after merge, and the smallest viable fix.
- Avoid restating the same issue in multiple sections. Summarize categories in the top-level report and reserve line-specific detail for inline findings.
- Inline findings must start with bracketed `[path:line]` syntax so repo-guard can extract GitHub inline comments. Use `[path/to/file.ext:42] <concise issue and fix direction>`; do not use code spans like ``path/to/file.ext:42`` without brackets. Omit inline findings when no issue belongs on a specific changed line.
- Inline findings should target the exact changed line from the diff hunk, not a nearby context line, closing brace, or unchanged caller. If the exact changed line number is unavailable, keep the issue in `### Findings` instead of inventing an inline location.
- If there are no blocking findings, say what was checked, what residual risk remains, and what verification evidence would increase confidence.
- Do not add generic praise, generic best-practice advice, or template filler.

## Output Contract

Keep all headings and bold marker labels exactly as written in this contract, even when responding in Chinese or another language. Localize the values and narrative text, not the marker keys.
The first line must be exactly `## CR Report: <change id or title>`, not `# CR Report` or any localized heading.
Do not add extra headings outside the output contract. Put all analysis inside the listed sections.
Inline finding bullets must begin with `- [` so repo-guard can parse them; do not wrap the `[path:line]` marker in backticks.

Examples:

- Use `**Risk:** HIGH`, not `**风险等级:** HIGH`.
- Use `**Recommendation:** REQUEST_CHANGES`, not `**建议:** REQUEST_CHANGES`.
- Use `**Decision Summary:** ...`, not `**决策摘要:** ...`.

Return this structure:

```markdown
## CR Report: <change id or title>

**Risk:** LOW | MEDIUM | HIGH | CRITICAL
**Recommendation:** APPROVE | COMMENT | REQUEST_CHANGES | NEEDS_HUMAN
**Decision Summary:** <one sentence stating merge readiness and the main reason>

### Cascade Analysis
- Changed symbols:
- Affected flows:
- Callers outside changeset:
- Confidence: high | medium | degraded

### Findings
1. **[severity] <title>**
   - Evidence:
   - Affected callers/flows:
   - Smallest viable fix:

### Inline Findings
- [path/to/file.ext:42] <issue on the changed code at line 42 and smallest fix direction>

### Karpathy Review
- Assumptions:
- Simplicity:
- Surgical scope:
- Verification:

### Missing Coverage
- <tests or scenarios needed before merge>
```

If there are no findings, say that explicitly and still include cascade confidence and residual testing risk.

## Recommendation Rules

- Use `REQUEST_CHANGES` for confirmed correctness bugs, broken callers, contract drift, data loss, security risk, or missing required migration paths.
- Use `NEEDS_HUMAN` when impact is high but evidence is incomplete, GitNexus confidence is degraded for a risky change, or product intent is ambiguous.
- Use `COMMENT` for non-blocking maintainability, test, or clarity issues.
- Use `APPROVE` only when cascade impact is understood, no blocking findings remain, and verification is adequate for the change risk.

## Guardrails

- Do not fabricate line numbers, affected flows, tool output, tests, or platform state.
- Do not treat passing tests as sufficient when callers outside the changeset can break.
- Do not recommend broad rewrites when a small compatible fix would solve the issue.
- Do not block on style nits unless they hide real correctness or maintainability risk.
- Do not publish or mutate anything on any review platform; the outer robot owns posting, deduplication, permissions, and retries.
