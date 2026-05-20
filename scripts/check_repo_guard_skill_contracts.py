#!/usr/bin/env python3
"""Validate repo-guard-facing skill output contracts."""

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_TEXT = {
    "code-reviewer/SKILL.md": [
        "**Recommendation:** APPROVE | COMMENT | REQUEST_CHANGES | NEEDS_HUMAN",
        "**Decision Summary:**",
        "[path/to/file.ext:42]",
        "Do not publish or mutate anything on any review platform",
    ],
    "code-reviewer/references/review-rubric.md": [
        "## GitHub Comment Quality",
        "### Inline Comment Hygiene",
        "### No-Finding Reviews",
    ],
    "issue-reviewer/SKILL.md": [
        "## Issue Analysis:",
        "**Quality Score:** X/5",
        "**Priority Suggestion:** P0-Critical | P1-High | P2-Medium | P3-Low",
        "**Type:** Bug Report | Feature Request | Question | Discussion",
        "**Maintainer Next Action:** Ready to work | Ask reporter | Needs triage decision | Needs reproduction",
        "Do not publish or mutate anything on any platform",
    ],
    "issue-reviewer/references/analysis-framework.md": [
        "### Maintainer Next Action",
        "## Reporter-Facing Suggestion Quality",
        "## Minimum Useful Questions",
    ],
    "issue-reviewer/references/issue-quality-rubric.md": [
        "## Comment Calibration",
        "Priority and quality are separate",
    ],
}


def main() -> int:
    failures = []
    for relative_path, required_snippets in REQUIRED_TEXT.items():
        path = ROOT / relative_path
        if not path.exists():
            failures.append(f"{relative_path}: file is missing")
            continue

        content = path.read_text(encoding="utf-8")
        for snippet in required_snippets:
            if snippet not in content:
                failures.append(f"{relative_path}: missing {snippet!r}")

    if failures:
        print("Repo Guard skill contract check failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Repo Guard skill contract check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
