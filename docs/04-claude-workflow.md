# Leveraging Claude Code on This Project

> **Scope note.** This repo is **frontend only** (see `CLAUDE.md`). Skills and agents here work on the
> client and on the *client side* of the API contract; server changes belong in `hymbee-backend`. The
> design spec of record is `design-spec/`, not Figma — Figma is upstream.

This answers "how can I use Claude's plugins, skills, artifacts, design tools, etc." — concretely,
mapped to this project's actual work, and honest about what each thing is and isn't good for.

---

## 1. Context files (`CLAUDE.md`) — the highest-leverage thing on this list

Claude reads `CLAUDE.md` automatically at session start, and nested `CLAUDE.md` files when working
in a subdirectory.

```
CLAUDE.md                    ← already written: product, repos, standing decisions, working rules
apps/mobile/CLAUDE.md        ← RN CLI conventions, React Navigation patterns, perf budget
packages/ui/CLAUDE.md        ← "never hardcode a design value", component API conventions
docs/                        ← the deep reference this file set lives in
```

**Why it matters most:** every other tool below works better when Claude starts the session already
knowing that role is per-industry and points conversion is config-driven. Keep `CLAUDE.md` short and
declarative; push detail into `docs/` and link to it.

Run `/init` inside a package once it has real code, then edit the result down — generated versions
tend to describe the file tree (which Claude can see) rather than the rules (which it can't infer).

---

## 2. MCP servers — already connected and verified

| Server | Use it for |
| --- | --- |
| **Figma** ✅ verified | `get_variable_defs` (token extraction — already pulled node `33:953`), `get_design_context` (screen → code), `get_screenshot` (visual reference), `download_assets` (icons/images), `add_code_connect_map` (bind Figma components ↔ `packages/ui`) |
| **GitHub** ✅ | PR creation and review, issue triage, code search across `hft-hymbee` org repos |
| **Atlassian Rovo (Jira + Confluence)** ✅ | Turn the PRD into epics and stories; publish these docs to Confluence for stakeholders who don't read git |

**Highest-value first move:** ask Claude to walk the Figma design-system page and generate
`packages/tokens` in one pass. Then set up **Code Connect** — after that, "implement this screen"
produces real design-system components instead of approximations. It is the difference between
design-to-code that needs rewriting and design-to-code that needs reviewing.

---

## 3. Skills — the biggest custom win here

Skills are folders of instructions Claude loads on demand: `.claude/skills/<name>/SKILL.md`.
Write these once and every future session (yours or a teammate's) follows the same patterns.

**Build these for this project:**

| Skill | What it does |
| --- | --- |
| `humbee-screen` | Scaffold a new screen: React Navigation route + linking entry, feature folder, TanStack Query hook, `packages/ui` components only, i18n keys for en+hi, loading/empty/offline/error states, a11y labels, test file. Encodes the whole checklist so no screen ships half-dressed. |
| `humbee-tokens-sync` | Regenerate `packages/tokens` from the handoff's `design-spec/tokens/*.css` (Figma only as upstream) → show the diff → flag any token removed that is still referenced in code. |
| `humbee-api-hook` | Regenerate `packages/api-client` from `humbee_influencer_backend/contracts/openapi.yaml`, add the typed TanStack Query hook with the right `(screen, manufacturer, period)` key, and fail if the screen recomputes any server-owned number. **Backend endpoints are not written in this repo** — a contract gap is raised, not coded around. |
| `humbee-i18n` | Extract hardcoded strings, add en + hi keys, flag Devanagari strings likely to overflow fixed-height components. |
| `humbee-a11y-check` | Audit a screen against the §4.13 rules: 48dp targets, 16sp minimum, contrast, icon labels, 200% font scaling. |
| `humbee-scope-check` | Given a feature, diff it against `08-screen-inventory.md` (the v1 surface) and `00-PRD.md`, and report gaps — especially the points-post-on-allocation rule, the points-config invariant, and any invented UI. Note the PRD is broader than v1; `08` wins. |

**Skills that already ship with Claude Code and are directly useful:**
`/code-review` · `/security-review` (run before every release — DPDP and OTP surface make this real)
· `/run` (launch the app and screenshot a change) · `/ship-ticket` (opens a PR against a Jira ticket —
works because you have both the GitHub and Jira MCP servers connected) · `/dataviz` (the points-by-
manufacturer chart) · `/fewer-permission-prompts` (cut approval friction once the repo settles).

---

## 4. Subagents

Definition files in `.claude/agents/*.md`. Useful when a task is a broad sweep whose *conclusion* you
want without the file dumps, or when several independent checks can run at once.

| Agent | Purpose |
| --- | --- |
| `design-system-auditor` | Sweep the app for hardcoded colors/spacing/font sizes and report violations |
| `prd-compliance` | Read a feature end to end and check it against the PRD section it implements |
| `perf-budget` | Check bundle size, unvirtualized lists, unnecessary re-renders against the §9 budget |

Built-in `Explore` is good for "where is X handled in `humbee-mobile-app`" across a large unfamiliar
FastAPI monolith — it returns the answer instead of 40 files.

---

## 5. Hooks — automation Claude itself can't be trusted to remember

Configured in `.claude/settings.json`. The harness runs these, so they're reliable in a way
"please always remember to…" is not.

- **PostToolUse on Write/Edit** → `prettier --write` + `eslint --fix` on the touched file.
- **Stop** → `tsc --noEmit` on changed packages; surface errors before you read the summary.
- **PreToolUse on Bash** → block `git push --force` to `main`/`develop`.
- **PostToolUse on `packages/tokens/**`** → fail loudly if tokens were hand-edited rather than generated.

Use the `/update-config` skill to write these — it knows the schema.

---

## 6. Artifacts

Publish a private, shareable web page from a file. Good for the things stakeholders read and git
doesn't serve well:

- **This doc set as a stakeholder-readable site** — architecture decisions, phased plan, open questions.
  Better than emailing a .docx around.
- **Interactive screen-flow map** of the app (Login → Dashboard → Allocations → Detail → Dispute).
- **KPI dashboard mockups** for the §10 metrics, to align on the analytics event taxonomy before it's built.
- **Clickable design-token reference** — the palette, type ramp, and spacing scale as a live page for
  designers and devs to agree on.

Not for: anything that should live in the repo and be diffed. Use artifacts to *communicate*, docs to *specify*.

---

## 7. Plugins & team distribution

Once the skills, agents, and hooks above stabilize, package them as a **plugin** and publish to an
internal marketplace so every engineer on `hft-hymbee` gets the same setup with one install, rather
than each person's Claude improvising its own conventions. This is what makes the "industry standard
code" goal actually hold across a team instead of across one machine.

---

## 8. A realistic working loop

1. **Plan mode** (`Shift+Tab` twice, or ask for a plan) before any non-trivial feature — approve the
   approach before code exists.
2. Point Claude at the **handoff screen spec** (`design-spec/04-screens/NN-*.md`) + the **row in
   `08-screen-inventory.md`** it implements. Both, always. Figma is upstream, not the working spec.
   Design without spec produces pretty screens with wrong semantics; spec without design produces the reverse.
3. Let the `humbee-screen` skill scaffold; you review the plan, not the boilerplate.
4. `/run` to see it on a device; iterate against a screenshot.
5. `/code-review` then `/security-review` before PR.
6. `/ship-ticket` to open the PR linked to its Jira ticket.

**What Claude should not be trusted to do unsupervised on this project:** decide product behavior
that isn't in the PRD, invent design values, or change the points/role invariants. Those three are
where an autonomous mistake is expensive and quiet.
