---
name: repo-evolver
description: 当需要自主循环审视仓库、发现改进点、创建 issue、编写方案、实现变更、提交 PR 并处理 repo-guard 审评反馈时使用。支持 meta-improvement：当 repo-guard 质量偏低时自动优化其 prompts 和 skills。
triggers:
  explicit:
    - "$repo-evolver"
    - "repo-evolver"
  keywords:
    - "审视仓库"
    - "自主改进"
    - "持续优化"
    - "evolve repo"
    - "autonomous improvement"
  negative:
    - "单次代码评审"
    - "手动修复"
---

# Repo Evolver

自主仓库改进循环。读取状态文件，执行当前阶段，推进状态机，每次迭代完成一个改进。

<HARD-GATE>
在创建 GitHub Issue 并等待 repo-guard 评论之前，禁止修改任何项目代码文件。
在 Issue 创建并评估 repo-guard 反馈之前，禁止创建分支、编写方案或执行实现。
违反此规则等同于跳过测试直接提交——无论改进多么"显而易见"，都必须走完整流程。
</HARD-GATE>

## 红线

- 不经过 Issue 直接修改代码 → 违规。立即停止，回退到 Phase 1。
- 不等 repo-guard 评论就开始实现 → 违规。必须轮询等待或超时后才能继续。
- 跳过 PR 直接 commit 到默认分支 → 违规。所有变更必须通过 PR。
- "这个改动太小不需要走流程" → 不存在这种例外。所有改动走完整五阶段。

## 触发信号

- "审视这个仓库并持续改进"
- "自主发现和修复问题"
- "evolve this repo"
- 被 ralph-loop 重复喂入时自动恢复执行

不适用于：单次代码评审、手动指定的 bugfix、不涉及 GitHub 的本地修改。

## 状态机

```dot
digraph repo_evolver {
    rankdir=TB;
    node [shape=box];

    init [label="读取状态文件\n.claude/repo-evolver.local.md" shape=ellipse];
    scan [label="Phase 1: SCAN\n发现改进点"];
    issue [label="Phase 2: ISSUE\n创建 GitHub issue"];
    plan [label="Phase 3: PLAN + IMPLEMENT\n方案 → 实现 → PR"];
    review [label="Phase 4: PR REVIEW\n处理 repo-guard 反馈"];
    meta [label="Phase 5: META-IMPROVE\n优化 repo-guard"];
    done [label="更新状态文件\n退出本次迭代" shape=ellipse];

    init -> scan [label="无状态或 backlog 为空"];
    init -> issue [label="phase=issue"];
    init -> plan [label="phase=plan"];
    init -> review [label="phase=pr_review"];
    init -> meta [label="phase=meta_improve"];

    scan -> issue [label="backlog 非空"];
    scan -> done [label="backlog 为空\n输出 completion promise"];
    issue -> plan;
    plan -> review;
    review -> done [label="审评通过或已处理"];
    review -> meta [label="质量分 < 3 且未超频率限制"];
    meta -> review [label="改进完成，重新触发审评"];
}
```

## 工作流程

### 启动

1. 读取 `references/state-schema.md` 了解状态文件格式。
2. 读取 `.claude/repo-evolver.local.md`。如果不存在，创建初始状态（phase: scan, backlog: []）。
3. 根据当前 phase 跳转到对应阶段。

### 执行模型

**每次调用只执行当前 phase，完成后更新状态文件并退出。** 不要在一次调用中连续执行多个 phase。

- ralph-loop 模式：stop-hook 会重新喂入 prompt，下次调用自动进入下一个 phase。
- 单次调用模式：执行完当前 phase 后停止，用户下次调用时继续。

这意味着：Phase 1 结束后退出，Phase 2 在下次调用时执行，以此类推。这确保每个 phase 之间有明确的状态持久化点，且 repo-guard 有时间产生评论。

### Phase 1: SCAN

**本阶段只读。禁止修改任何项目文件。产出是 backlog 列表，不是代码变更。**

1. 读取 `references/scan-rubric.md`。
2. 运行项目的 lint、typecheck、test 命令，收集 warnings 和 failures。
3. 使用 GitNexus 查询死代码、高复杂度函数、未使用导出。
4. grep TODO/FIXME/HACK，检查过时依赖。
5. 对每个发现按 scan-rubric 评分，写入 backlog（去重：不重复已有 issue 或已尝试过的改进）。
6. 如果 backlog 为空且无新发现，输出 `<promise>NO_MORE_IMPROVEMENTS</promise>` 终止循环。
7. 否则取最高优先级项，设置 phase=issue，更新状态文件。**然后停止。不要继续执行 Phase 2。**

### Phase 2: ISSUE

**本阶段禁止修改项目代码。唯一允许的写操作是创建 GitHub Issue 和更新状态文件。**

1. 用 `gh issue create` 创建 issue，标题和正文描述改进点。
2. 等待 repo-guard 的 issue review 评论（轮询 `gh api repos/{owner}/{repo}/issues/{number}/comments`，最多等待 3 分钟，间隔 30 秒）。
3. 读取 `references/quality-evaluation.md`，对 repo-guard 评论评分。
4. 如果 repo-guard 建议有价值（分数 >= 0），将其纳入后续方案的约束条件。
5. 设置 phase=plan，记录 issue 编号，更新状态文件。**然后停止。不要继续执行 Phase 3。**

### Phase 3: PLAN + IMPLEMENT

1. **REQUIRED SUB-SKILL:** 使用 superpowers:writing-plans 为当前 issue 生成技术方案。
2. **REQUIRED SUB-SKILL:** 使用 superpowers:subagent-driven-development 执行方案。
3. **REQUIRED SUB-SKILL:** 使用 superpowers:finishing-a-development-branch 创建 PR（目标分支为项目默认分支）。
4. 设置 phase=pr_review，记录 PR 编号和分支名，更新状态文件。

### Phase 4: PR REVIEW

1. 等待 repo-guard 的 PR review 评论（轮询 `gh api repos/{owner}/{repo}/pulls/{number}/reviews`，最多等待 5 分钟，间隔 30 秒）。
2. 读取 `references/quality-evaluation.md`，对 repo-guard 评论评分并记录到状态文件的 quality_log。
3. 对有效建议（单项分数 > 0）：实施修复，push 到同一分支。
4. 对无效建议（误报、泛泛建议）：忽略，记录原因。
5. 检查 CI 状态（`gh pr checks`）。如果 CI 失败，修复并 push。
6. 计算最近 3 个 PR 的 repo-guard 平均质量分。如果 < 3 且距上次 meta-improve >= 5 次迭代：设置 phase=meta_improve。
7. 否则：标记当前改进完成，从 backlog 移除，设置 phase=scan（进入下一轮扫描）。

### Phase 5: META-IMPROVE

1. 读取 `references/meta-improvement-guide.md`。
2. 诊断 repo-guard 质量问题类别（误报多？遗漏多？泛泛？）。
3. 定位需要修改的文件（repo-guard 的 prompts、skills、或 extra-instructions）。
4. 在 repo-guard 仓库创建分支，实施改进，提 PR。
5. 记录 meta_improvement_count++，设置 phase=pr_review（回到 Phase 4 等待原 PR 的下一轮审评）。

## 输出契约

本 skill 不产出面向用户的报告。所有产出写入：
- `.claude/repo-evolver.local.md`（状态文件）
- GitHub issues 和 PRs（通过 gh CLI）
- Git commits（通过 subagent-driven-development）

每次迭代结束时，状态文件必须反映：当前 phase、backlog、quality_log、iteration count。

## 防护边界

- 不直接合并 PR。所有变更必须通过 PR + CI。
- 不 force-push。不删除分支（除非是自己创建的已合并分支）。
- 不修改项目的 CLAUDE.md 或 .claude/settings。
- Meta-improvement 每 5 次迭代最多触发 1 次。超过限制时跳过 Phase 5，直接回到 Phase 1。
- 不重复尝试已失败的改进。如果某个 backlog 项连续失败 2 次，标记为 skipped 并记录原因。
- 如果 scan 阶段连续 3 次产出空 backlog，输出 completion promise 终止循环。
- 不创建超过 10 个未合并 PR。如果未合并 PR 数量 >= 10，暂停创建新 PR，优先处理已有 PR 的 review 反馈。
