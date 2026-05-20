# Analysis Framework

Use this framework to structure your issue analysis. Evaluate each dimension independently, then synthesize into the final assessment.

## Completeness Check

For each issue type, verify the presence of required information:

### Bug Report Checklist
- [ ] What happened (actual behavior)
- [ ] What should happen (expected behavior)
- [ ] How to trigger it (reproduction steps)
- [ ] Where it happens (environment, version, platform)
- [ ] Evidence (logs, screenshots, error messages)

### Feature Request Checklist
- [ ] What problem this solves (motivation)
- [ ] What the solution looks like (proposal)
- [ ] What else was considered (alternatives)
- [ ] Who benefits (impact scope)
- [ ] How to know it's done (acceptance criteria)

### Missing Information Assessment
- Mark as "missing" only if the information is necessary for the issue type.
- Mark as "N/A" if the information doesn't apply (e.g., reproduction steps for a feature request).
- Mark as "partial" if some information is present but insufficient to act on.

## Clarity Assessment

### Title Analysis
- Does the title identify the specific problem or request?
- Could someone understand the issue from the title alone?
- Is it specific enough to distinguish from similar issues?

### Focus Analysis
- Is there exactly one concern per issue?
- If multiple concerns exist, could they be separate issues?
- Does the body stay on topic or drift into tangents?

### Precision Analysis
- Are vague terms avoided ("doesn't work", "broken", "slow")?
- Are quantities specified where relevant ("takes 30s" vs "takes too long")?
- Are conditions specified ("when X happens" vs "sometimes")?

## Actionability Assessment

### Readiness Check
- Could a developer start working on this today?
- What questions would they need answered first?
- Are there implicit assumptions that need validation?

### Acceptance Criteria
- Is it clear when this issue would be "done"?
- Are success conditions measurable or observable?
- Would two developers agree on whether a fix satisfies this issue?

### Dependency Check
- Does this depend on other issues or external factors?
- Are there blocking decisions that need to be made first?
- Is the required context available or does it need to be gathered?

### Maintainer Next Action

Choose the one next action that best helps triage:

| Action | Use When |
| --- | --- |
| Ready to work | The issue is actionable enough for implementation or investigation to start. |
| Ask reporter | A specific missing detail blocks progress and only the reporter can provide it. |
| Needs triage decision | The issue is clear, but maintainers must decide priority, product direction, or scope. |
| Needs reproduction | A bug is plausible but cannot be verified or isolated from the current report. |

Use this action to shape the summary and suggestions. Do not ask the reporter for information that would not change the next action.

## Constructive Feedback Principles

When writing suggestions:

1. **Acknowledge first**: Note what the reporter did well before suggesting improvements.
2. **Be specific**: "Adding the OS version would help" beats "needs more info".
3. **Explain why**: "Reproduction steps help us isolate the trigger" gives context.
4. **Offer templates**: If information is missing, suggest the format it should take.
5. **Limit suggestions**: 2-3 actionable items. More than that overwhelms.
6. **Match tone**: If the reporter is frustrated, acknowledge the frustration before asking for details.

## Reporter-Facing Suggestion Quality

Convert rubric labels into direct, answerable requests.

Good:

```markdown
- Please add the exact version and OS where this happens; that will help determine whether this is platform-specific.
- If possible, add the shortest set of steps that triggers the crash, starting from a clean launch.
```

Avoid:

```markdown
- Environment info is missing.
- Reproduction steps are incomplete.
```

## Minimum Useful Questions

Ask fewer questions when one answer would unblock the issue. Prefer the highest-value missing detail. For vague reports, ask only the top 2-3 questions needed to unblock triage.

- For a crash: exact error/log and trigger steps.
- For a regression: last working version and first broken version.
- For a feature request: user problem and observable acceptance criteria.
- For a question: expected outcome and what has already been tried.

If an issue is ready to work, state that no required reporter action remains. Include at most one optional polish item only if it would materially help maintainers.

## Language Matching

- If the issue is written in Chinese, respond in Chinese.
- If the issue is written in English, respond in English.
- If mixed, follow the dominant language.
- Override only if the `language` parameter is explicitly set.
- Preserve output headings and bold marker labels in English exactly as shown in the output contract.
