# Issue Quality Rubric

Use this rubric to assess issue quality. Start with type identification, then evaluate each dimension.

## Issue Types

| Type | Identifying Signals |
| --- | --- |
| Bug Report | Describes unexpected behavior, crash, error, regression. Often has "bug" label or "[Bug]" prefix. |
| Feature Request | Proposes new functionality or enhancement. Often has "enhancement" label or "[Feature]" prefix. |
| Question | Asks how something works, seeks guidance. Often has "question" label. |
| Discussion | Open-ended exploration of approaches, architecture, or direction. |

## Bug Report Quality Criteria

| Dimension | 5/5 | 3/5 | 1/5 |
| --- | --- | --- | --- |
| Problem statement | Specific behavior described with context | General description of what's wrong | "It's broken" with no detail |
| Reproduction | Numbered steps, minimal reproduction | Partial steps or "sometimes happens" | No steps, "just use the app" |
| Expected vs actual | Both clearly stated | One stated, other implied | Neither stated |
| Environment | OS, version, device, relevant config | Partial info | Nothing |
| Evidence | Logs, screenshots, error messages | Partial evidence | Nothing |

## Feature Request Quality Criteria

| Dimension | 5/5 | 3/5 | 1/5 |
| --- | --- | --- | --- |
| Problem statement | Clear pain point with user scenario | General frustration described | No problem context |
| Proposed solution | Concrete, specific, bounded | Vague direction | "Make it better" |
| Alternatives | Multiple approaches compared | One alternative mentioned | None considered |
| Scope | Clear boundaries, single feature | Somewhat bounded | Unbounded wish list |
| Impact | Who benefits, how often, how much | General benefit claimed | No impact context |

## Priority Signals

| Priority | Signals in Issue Text |
| --- | --- |
| P0-Critical | Data loss, security vulnerability, complete feature broken for all users, production down, no workaround |
| P1-High | Major feature broken, significant UX degradation, affects many users, workaround exists but painful |
| P2-Medium | Minor feature broken, cosmetic with functional impact, affects some users, easy workaround |
| P3-Low | Enhancement, cosmetic-only, edge case, nice-to-have, affects few users |

## Scoring Rules

- Start at 3/5 (baseline: intent is clear).
- Add +1 for each dimension that is fully satisfied beyond baseline.
- Subtract -1 for each critical gap that blocks actionability.
- A brief but perfectly clear issue can score 5/5.
- A verbose but unfocused issue can score 2/5.
- Brevity is not a penalty; lack of actionable information is.

## Comment Calibration

- A 5/5 issue should not receive a list of artificial improvements. Say it is ready and name any optional polish only if it would help maintainers.
- A 4/5 issue usually needs at most one or two clarifying details.
- A 3/5 issue should get targeted questions tied to actionability, not a full template checklist.
- A 1-2/5 issue should be handled constructively: identify the first missing piece that would make the report understandable before asking for secondary details.
- Priority and quality are separate. A low-quality report can describe a high-priority incident, and a high-quality report can describe a low-priority enhancement.
