---
name: issue-reviewer
description: Use when triaging GitHub issues, assessing issue quality, analyzing bug reports or feature requests for completeness, clarity, and actionability, or providing structured feedback to issue reporters.
---

# Issue Reviewer

Analyze GitHub issues (bug reports, feature requests, questions) and produce a structured quality assessment. Help maintainers triage efficiently and help reporters improve their issues. The outer system owns data acquisition and comment posting.

## Trigger Signals

Use this skill for prompts like:

- "Review this issue"
- "Triage this issue"
- "Assess issue quality"
- "分析这个 issue"
- "Is this issue ready to work on?"
- "What's missing from this bug report?"

Use another skill instead when the user asks to fix the bug described in the issue, implement the feature request, or perform code review on a PR.

## Inputs Expected

Assume the caller provides or can access the issue title, body, labels, and any template metadata. Do not spend skill attention on how to fetch platform data or publish comments.

## Review Procedure

1. Read [references/issue-quality-rubric.md](references/issue-quality-rubric.md).
2. Read [references/analysis-framework.md](references/analysis-framework.md).
3. Determine issue type (Bug Report, Feature Request, Question, Discussion).
4. Assess against each dimension: completeness, clarity, actionability.
5. Assign quality score and priority suggestion based on evidence.
6. Produce the report only. Do not post comments, close issues, add labels, or mutate repository state.

## Review Priorities

- Actionability outranks completeness (a brief but clear issue is better than a verbose unclear one).
- Evidence-based priority outranks gut feeling.
- Constructive suggestions outrank criticism.
- Reporter's intent outranks template compliance.
- Practical impact outranks theoretical concerns.
- The next useful maintainer action outranks exhaustive scoring detail.

## Comment Quality Rules

Write for two readers at once: the maintainer triaging the queue and the reporter who may need to improve the issue. The comment should make the next action obvious without making the reporter feel graded.

- Lead with whether the issue is ready to work, needs reporter clarification, or needs maintainer triage.
- Ask only for the smallest missing information that would materially change actionability.
- Convert rubric gaps into concrete requests, not abstract labels.
- If the issue is already actionable, avoid filler suggestions; state that no required reporter action remains and include at most one optional polish item.
- When `Maintainer Next Action` is `Ready to work`, `### Suggestions` must contain only `No required reporter action remains` plus at most one optional polish bullet.
- Do not ask for alternatives, impact scope, or extra context when the issue is already actionable; put minor maintainer considerations in `### Summary` only if they materially affect implementation.
- When the reporter is frustrated, acknowledge the impact briefly before asking for details.
- Match the dominant language of the issue unless the caller explicitly asks for another language.

## Output Label Invariants

Keep all headings and bold marker labels exactly as written in the output contract, even when responding in Chinese or another language. Localize the values and narrative text, not the marker keys.

Examples:

- Use `**Quality Score:** 2/5`, not `**质量评分:** 2/5`.
- Use `**Priority Suggestion:** P1-High`, not `**优先级建议:** P1-高`.
- Use `**Maintainer Next Action:** Ask reporter`, not `**维护者下一步动作:** 询问报告者`.

## Output Contract

Return this structure:

```markdown
## Issue Analysis: <issue title>

**Quality Score:** X/5
**Priority Suggestion:** P0-Critical | P1-High | P2-Medium | P3-Low
**Type:** Bug Report | Feature Request | Question | Discussion
**Maintainer Next Action:** Ready to work | Ask reporter | Needs triage decision | Needs reproduction

### Completeness
- Problem statement: clear / vague / missing
- Reproduction steps: provided / partial / missing / N/A
- Expected vs actual: described / implied / missing / N/A
- Environment info: provided / partial / missing / N/A
- Supporting evidence: provided / missing / N/A

### Clarity
- Title quality: descriptive / vague / misleading
- Single concern: yes / multiple concerns bundled
- Language precision: precise / somewhat vague / unclear
- Scope: well-defined / open-ended / unclear

### Actionability
- Ready to work: yes / needs clarification / blocked
- Acceptance criteria: explicit / implied / missing
- Dependencies: identified / not applicable / unknown

### Suggestions
- <2-3 specific, constructive suggestions or questions. If `Maintainer Next Action` is `Ready to work`, state "No required reporter action remains" and include at most one optional polish item.>

### Summary
<1-2 sentence overall assessment>
```

If the issue is high quality, acknowledge that explicitly and note only minor improvements if any.

## Quality Score Rubric

- **5/5**: Ready to work immediately. All relevant information provided, clear and focused.
- **4/5**: Minor gaps but actionable. A developer could start with reasonable assumptions.
- **3/5**: Needs some clarification. Key information is missing but the intent is clear.
- **2/5**: Significant gaps. Multiple pieces of critical information missing.
- **1/5**: Cannot act on this. Unclear what is being reported or requested.

## Guardrails

- Do not fabricate information about the project or its codebase.
- Do not make assumptions about priority without evidence from the issue text.
- Do not dismiss issues as low quality just because they are brief — some issues are naturally concise.
- Do not suggest changes that would make the issue non-standard for its template.
- If the issue references external context you don't have, note it rather than guessing.
- Do not publish or mutate anything on any platform; the outer robot owns posting, deduplication, permissions, and retries.
