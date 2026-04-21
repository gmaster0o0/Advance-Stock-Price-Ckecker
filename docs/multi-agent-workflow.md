# Multi-Agent Workflow

This document describes the multi-agent system built for the **Advance-Stock-Price-Checker** NestJS project. All agents live in `.github/agents/` and are loaded automatically by VS Code Copilot Chat.

---

## Overview

The system is composed of four agents. Three are **specialists** that each own a single responsibility. One is an **Orchestrator** that coordinates them. No agent crosses another's responsibility boundary.

```
User
 └─► Orchestrator
       ├─► Planner          (research & planning only)
       ├─► NestJS Developer (implementation only)
       └─► Tester           (tests & failure classification only)
```

All specialist agents report results back to the Orchestrator via a _Return to Orchestrator_ handoff button. The Orchestrator is the only agent that decides what happens next.

---

## Agent Reference

### Orchestrator · `orchestrator.agent.md`

| Property | Value |
|---|---|
| Tools | `agent`, `todo` |
| Writes code | ❌ Never |
| Edits files | ❌ Never |
| Invokes agents | ✅ Planner, NestJS Developer, Tester |

**Responsibility:** Receives the user's request, breaks it into scoped tasks, delegates one at a time, and synthesises a final summary. It is the single decision-maker in the system — no specialist agent delegates to another specialist directly.

---

### Planner · `planner.agent.md`

| Property | Value |
|---|---|
| Tools | `read`, `search`, `web`, `mcp_context7/*` |
| Writes code | ❌ Never |
| Edits files | ❌ Never |
| Reports to | Orchestrator (via _Return to Orchestrator_ handoff) |

**Responsibility:** Researches the codebase and verifies external library documentation, then produces a structured implementation plan. Never assumes — always checks official docs with Context7 or web fetch before planning around an external API.

**Output format:**
- Summary (one paragraph)
- Implementation steps (ordered)
- Edge cases to handle
- Open questions (when scope is unclear)

---

### NestJS Developer · `nestjs-developer.agent.md`

| Property | Value |
|---|---|
| Tools | `read`, `edit`, `search`, `execute`, `todo` |
| Writes code | ✅ Yes |
| Edits files | ✅ Yes |
| Reports to | Orchestrator (via _Return to Orchestrator_ handoff) |

**Responsibility:** Implements the plan produced by the Planner. Follows the project's strict conventions: constructor-based DI, no `any`, class-validator DTOs, `PrismaService` injected (never `new PrismaClient()`), `HttpException` for error handling.

**Output format:**
- List of created / modified files
- Summary of each change and its rationale
- Verification commands (e.g., `npm run typecheck`, `npm run lint`)

---

### Tester · `tester.agent.md`

| Property | Value |
|---|---|
| Tools | `read`, `search`, `edit`, `execute`, `todo` |
| Writes code | ✅ Yes (test files only) |
| Edits files | ✅ Test files only — never production source |
| Reports to | Orchestrator (via _Return to Orchestrator_ handoff) |

**Responsibility:** Writes Jest unit and e2e tests, runs the suite, and classifies every failure into exactly one category before reporting. Never hides a failure or marks a test as skipped to make the suite appear green.

**Failure categories:**

| Category | Name | Definition |
|---|---|---|
| **A** | App Bug | Production logic is broken; test assertion is correct. |
| **B** | Test Decay | Test is outdated — stale mocks, changed interface, or misaligned assertions. |
| **C** | Environment | Infrastructure problem — missing `TEST_DATABASE_URL`, DB unreachable, port conflict. |

**Structured failure report block:**
```
Suite:      <file path>
Test:       <describe> > <it>
Status:     FAIL
Category:   <A | B | C>
Evidence:   <exact error + relevant stack lines>
Suggestion: <one concrete next action — who, what, which file>
```

**Run Summary block** (appended after all failure blocks):
```
Run Summary
  Suites:  <n> passed, <n> failed, <n> total
  Tests:   <n> passed, <n> failed, <n> skipped, <n> total
  Coverage gaps: <list or "none">
```

---

## Standard Workflow

```
Step 1 — PLAN
  Orchestrator → Planner
  Planner researches codebase + docs, outputs plan.
  Planner → Return to Orchestrator

Step 2 — REVIEW (gate)
  If Planner surfaces open questions:
    Orchestrator → User  (waits for clarification before continuing)

Step 3 — BUILD
  Orchestrator → NestJS Developer (with full plan as context)
  NestJS Developer implements.
  NestJS Developer → Return to Orchestrator

Step 4 — TEST
  Orchestrator → Tester (with implementation output as context)
  Tester writes/runs tests, classifies failures.
  Tester → Return to Orchestrator

Step 5 — FIX (conditional, repeats until green)
  Category A → Orchestrator delegates to NestJS Developer (fix production code)
               NestJS Developer → Return to Orchestrator → re-run Step 4
  Category B → Orchestrator delegates to Tester (fix stale test)
               Tester → Return to Orchestrator → re-run Step 4
  Category C → Orchestrator → User (resolve environment, then re-run Step 4)

  Loop guard: if Step 4 → Step 5 cycles more than twice without going green,
              Orchestrator stops and escalates to the user.

Step 6 — DONE
  Orchestrator reports final summary to User.
```

### Orchestrator status line format

After each delegation returns, the Orchestrator emits one line before delegating the next step:

```
[PLAN ✓]  Plan produced — N steps, M open questions.
[BUILD ✓] Implementation complete — files changed: <list>.
[TEST ✓]  Suite green — N tests passed.
[TEST ✗]  Suite failing — Category A: <n>, B: <n>, C: <n>.
[FIX ✓]   Fix applied — re-running tests.
[DONE]    All steps complete — <one-sentence summary>.
```

---

## Responsibility Matrix

| Action | Orchestrator | Planner | NestJS Developer | Tester |
|---|---|---|---|---|
| Delegate tasks | ✅ | ❌ | ❌ | ❌ |
| Research codebase | ❌ | ✅ | ✅ (for context) | ✅ (for context) |
| Verify external docs | ❌ | ✅ | ❌ | ❌ |
| Write production code | ❌ | ❌ | ✅ | ❌ |
| Write test code | ❌ | ❌ | ❌ | ✅ |
| Run tests | ❌ | ❌ | ❌ | ✅ |
| Classify test failures | ❌ | ❌ | ❌ | ✅ |
| Report to user | ✅ (summaries) | ✅ (standalone) | ✅ (standalone) | ✅ (standalone) |
| Report to Orchestrator | — | ✅ (when delegated) | ✅ (when delegated) | ✅ (when delegated) |

---

## Project Test Conventions (enforced by Tester)

- Unit tests: co-located `src/**/*.spec.ts` — run with `npm test`
- E2e tests: `test/*.e2e-spec.ts` — run with `npm run test:e2e`
- Coverage: `npm run test:cov`
- `TEST_DATABASE_URL` must be set before any test run (enforced by `test/setup-test-env.ts`)
- All tests use `@nestjs/testing` `Test.createTestingModule()`
- E2e tests use `supertest` for HTTP assertions
- Prisma is always mocked in unit tests — `PrismaClient` is never instantiated directly

---

## File Locations

```
.github/agents/
  orchestrator.agent.md   — Orchestrator
  planner.agent.md        — Planner
  nestjs-developer.agent.md — NestJS Developer
  tester.agent.md         — Tester
```

---

## Standalone Use

Every agent is `user-invocable: true`. You can invoke any specialist directly without going through the Orchestrator:

| Prompt | Agent to use |
|---|---|
| `Plan how to add a stocks endpoint` | Planner |
| `Add a GET /stocks endpoint` | NestJS Developer |
| `Run the test suite and report failures` | Tester |
| `Add a stocks feature end-to-end` | Orchestrator |
