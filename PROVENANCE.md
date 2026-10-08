# Sources, reuse and licenses

## What this public package contains

`SKILL.md`, `scripts/entry.mjs`, `scripts/current.mjs`, the self-evolution reference and trigger cases are authored ultra-build implementation. The entry/current scripts use only Node.js built-ins; they do not import WP, build2me, goal-driven or Herdr code. No third-party source trees, binaries, development contracts, task evidence or development Git history are included. MIT in this repository covers authored ultra-build files, not upstream projects.

The development workspace retained reference clones and a Herdr skill source copy. **A source copy in a private development workspace is not runtime code reuse in this public package.** The wider prototype framework and its acceptance fixtures are not part of this skill distribution.

## Design references — Inspired by

| Source | Pinned source revision | Influence / boundary | Upstream license |
|---|---|---|---|
| [shitianfang/build2me](https://github.com/shitianfang/build2me), author's [fork](https://github.com/zenenznze/build2me) | `cd9fbb970a11db47602c69236272e4f42380cda8` (fork) | Inspired by immutable contracts, DAG/frontier, submission and acceptance/verify separation; no upstream code bundled | MIT, copyright 2026 shitianfang |
| [lidangzzz/goal-driven](https://github.com/lidangzzz/goal-driven) | `c8e54ba3e9a4cf65df8fd9d92d0f9b231cab7f45` | Inspired by goal-driven continuation; conceptual reference only, no copied code or README | No declared license found in the inspected source/API; public availability is not redistribution permission |
| Author's [skill-wp](https://github.com/zenenznze/skill-wp-reference) | source `c838d3e02220e0327229cd74bde0f931f49082ae` | Inspired by durable HANDOFF, bounded attempts/recovery, independent review and resource receipts; public sanitized snapshot, no import into ultra-build | MIT for author's code; inherited MIT notices retained |
| Author's [skill-herdr](https://github.com/zenenznze/skill-herdr) | source `3908c6513844c4191a934cd0e3094ebfb9644633` | Inspired by visible Agent lifecycle and workspace/resource semantics; skill snapshot, not the Herdr application | MIT for author's skill code |
| [herdrdev/herdr](https://github.com/herdrdev/herdr) | no application revision pinned by this skill | External execution backend concept; lifecycle done/idle does not establish contract completion; application not bundled | Apache-2.0 (upstream repository) |

## Actual transitive adaptations in WP

WP's public snapshot **does reuse adapted code** from [ythx-101/agent-sop](https://github.com/ythx-101/agent-sop), MIT, copyright 2026 ythx-101. This is not labeled merely “Inspired by”. Its `NOTICE.md` preserves the complete upstream MIT notice and these mappings:

- `scripts/discover_executors.py` ← `scripts/discover-roster.py`
- `references/roster-discovery.md` ← `references/roster-protocol.md`
- `references/review-checklist.md` ← same upstream name
- `assets/SIGNOFF.md.template` ← `templates/signoff-packet.md`

These adapted files are in WP, not copied into ultra-build. An exact agent-sop source revision was not recorded in the pinned WP notice; we do not invent one.

## Public-export policy

The self-owned WP/Herdr reference snapshots are published separately, without private histories. Private logs, handoffs, machine-specific incident scripts and unreviewed WebShell patches are excluded. This attribution does not grant licenses to excluded material. Source revisions above identify original design inputs; sanitized export commits have different hashes.

`asm`, `dev` and `session-history` names in the skill are optional environment-specific maintenance/history handoffs, not copied libraries or bundled dependencies. Node.js and Agent clients retain their own licenses.
