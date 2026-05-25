---
name: group-skill-stats
description: Use when counting or ranking Friday/SkillHub skills created by members of a Daxiang group, especially requests involving group members, group skill statistics, creator counts, skills per person, Friday skills, or SkillHub contribution summaries.
---

# Group Skill Stats

## Overview

Count Friday/SkillHub skills created by members of the embedded team MIS list, a Daxiang group, or an explicit MIS list. Use the bundled script so member parsing, Friday pagination, creator matching, and report formatting stay consistent.

## Workflow

1. Resolve the input source. If the user asks for this team's total without providing input, use the script with no member source; it has the team MIS list embedded. Prefer an explicit MIS list when the user provides one. Otherwise resolve the Daxiang group ID; if the user only provides a group name or an unsigned Neixin URL and the group ID is not discoverable from context, ask for the group ID.
2. Ensure required CLIs exist:

```bash
node -e "const cp=require('child_process'); for (const bin of ['oa-skills','mtskills']) { const probe=process.platform==='win32'?'where '+bin:'command -v '+bin; cp.execSync(probe,{stdio:'ignore',shell:true}); }"
```

If missing, install the relevant CLI:

```bash
npm install -g @it/oa-skills @mtfe/mtskills --registry=http://r.npm.sankuai.com
```

3. Run the report. With no member source, the script uses the embedded team MIS list:

```bash
node group-skill-stats/scripts/group_skill_stats.mjs --format md
```

For a direct MIS list:

```bash
node group-skill-stats/scripts/group_skill_stats.mjs --mis-list '["mis1","mis2"]' --format md
```

4. If Friday authentication fails, retry with CIBA using the user's known MIS, or ask for MIS if unknown:

```bash
node group-skill-stats/scripts/group_skill_stats.mjs --gid <groupId> --format md --ciba <mis>
```

5. Return the Markdown table. If a coverage note is useful, put it after the table and keep it brief; never put non-table text before the result table.

## Output Rules

- The final user-facing result must be a Markdown table unless the user explicitly asks for JSON or CSV.
- `--format md` emits only the Markdown table, with no prose prefix.
- Do not claim full statistics if `--max-pages` was used; treat it as a dry run only.
- Match Friday `creator` to Daxiang member `mis` case-insensitively. Do not infer a creator from display name.
- If a member has no matched skills, include them with `0` so the table is complete.
- If the Daxiang command requires login, tell the user to approve the SSO/CIBA prompt and continue after approval.

## Script Options

```bash
node group-skill-stats/scripts/group_skill_stats.mjs --help
```

Useful options:

| Option | Purpose |
| --- | --- |
| `--format md` | Markdown table output, default |
| `--format json` | Machine-readable full payload |
| `--format csv` | Spreadsheet-friendly output |
| `--refresh` | Ignore cached Friday skill list and rescan |
| `--cache-file <path>` | Choose a cache file for Friday scan results |
| `--members-file <path>` | Test with saved `oa-skills ... --raw` JSON |
| `--mis-list <json\|csv>` | Use a JSON array or comma-separated MIS list directly |
| `--mis-file <path>` | Use a JSON file containing an array of MIS values |
| `--skills-file <path>` | Test with saved `mtskills search --json` data |

## Data Sources

- Daxiang members: `oa-skills daxiang group list-members --user --gid <gid> --raw`
- Friday skills: direct `https://friday.sankuai.com/mcphub-api/skill/list` pagination using the local mtskills token cache, with `mtskills search` as a fallback.

Prefer `oa-skills daxiang` over calling `https://api.neixin.cn/ems-group/...` directly because the CLI handles user SSO/CIBA and signed request details.
