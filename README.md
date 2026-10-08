# ultra-build

A project-local Agent workflow skill for durable task contracts, recovery, evidence and human approval gates.

## Install

Requires Node.js 18+ and an Agent client supporting `SKILL.md`.

```sh
git clone https://github.com/zenenznze/ultra-build.git
mkdir -p /path/to/project/.agents/skills
ln -s /path/to/ultra-build /path/to/project/.agents/skills/ultra-build
```

Discovery locations vary by client: expose this directory in your client's skill directory, then load `ultra-build`. No global configuration is changed automatically. Optional maintenance skills referenced in the workflow (`asm`, `dev`, `session-history`) must be supplied by your environment; this repository does not bundle them.

## Use

“使用 ultra-build 接管当前项目，读取相关旧资料，建立合同并推进到下一个人工审核节点；不要重复生产。”

Preview and activate explicitly:

```sh
node /path/to/ultra-build/scripts/entry.mjs --project /path/to/project
node /path/to/ultra-build/scripts/entry.mjs --project /path/to/project --apply
node /path/to/ultra-build/scripts/entry.mjs --project /path/to/project --task example-task
```

Activation adds a managed block to `AGENTS.md` and project-local `.ultra-build/` contracts, state, approvals and migration evidence. Repeated activation preserves existing tasks. Back up project files before activation. To deactivate, set `.ultra-build/project.json` `active` to `false` and remove only the ULTRA-BUILD managed block from `AGENTS.md`; preserve task evidence and do not run `--apply` again unless reactivation is intended.

## Portable local runtime candidate

`0.2.0-alpha.1` adds a dependency-free command runtime with real DAG execution, submission receipts, acceptance/laws, explicit review import, version-bound human gates and conservative retry/recovery. It does not require an Agent client. This candidate has **not passed independent semantic code review**; evaluate only on a disposable project copy.

```sh
node /path/to/ultra-build/scripts/runtime.mjs --version
node /path/to/ultra-build/scripts/runtime.mjs help
```

Follow [runtime trial instructions](references/runtime-trial.md) and the runnable `examples/runtime-graph.json`. Trial data stays in the target project; code stays in this package. No legacy Done migration or automatic publication.

**Pi is the primary Agent integration target.** CLI/filesystem checks are integration tests, not Pi Agent E2E. A trial-stage acceptance requires a real Pi session loading this skill, executing the task through tools, producing independently checked artifacts, and a second Pi process resuming without duplicate work or fabricated human approval. Independent release review remains a separate gate; successful worker E2E is not release approval.

## Limits and troubleshooting

This is prompt-guided coordination, not a sandbox or production-ready scheduler/trusted verifier. Worker completion and passing tests do not grant human approval. Current views check explicit artifact hashes, not business quality. Missing independent review or approval remains unresolved.

Malformed managed blocks or unsupported project formats fail rather than silently overwrite. Inspect and resolve them before retrying. Runtime receipts can display local paths: do not commit raw receipts or secrets. `.gitignore` does not remove already tracked files; audit the Git index before publication.

## Sources and licensing

See [PROVENANCE.md](PROVENANCE.md) for **Inspired by** design sources, actual transitive WP adaptations, pinned source commits and license boundaries. The author's WP/Herdr references are published separately as sanitized source snapshots.

## Distribution

This repository contains only the standalone authored skill, not development source snapshots, private task records or original development history. MIT licensed; see `LICENSE`. Versions are identified by Git commit. No telemetry, paid API calls or automatic publication tools are bundled.
