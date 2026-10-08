# Local runtime alpha: 0.2.0-alpha.1

This is a portable trusted-local command runtime, separate from the prompt-guided takeover entry. Node.js 18+, no npm dependencies. It runs real local commands; it does not call any model/API or launch Herdr. This candidate has not passed independent semantic code review; evaluate on a disposable branch/project copy, never treat it as production delivery authority.

## Pi-first Agent E2E gate

Pi is the primary Agent target. Direct Node CLI calls prove runtime integration only. They do not establish that a Pi Agent loaded the skill or followed its workflow. Stage acceptance requires an actual Pi process with the explicit skill, successful tool events and verified on-disk activation/contracts/artifacts; then a second Pi process resumes the same session without duplicate attempts and still respects the human gate. Independent Pi review is a separate release gate, not a substitute for worker E2E.

JSON mode can exit 0 despite assistant error/aborted messages. Inspect message_end, successful tool_execution_end, model identity, agent_settled and filesystem evidence; do not accept process exit or Agent text alone. Reuse the user's existing Pi defaults, configured account/login extensions and runtime environment. Do not force a provider/model, disable login extensions with --no-extensions, or replace plugin-selected accounts with raw credential checks. Only diagnose a genuine login failure after exercising that normal chain; never inspect credential stores or switch to another Agent as an E2E substitute.

The development candidate has passed a real Pi worker plus same-session second-process resume using the user's existing default login. Artifacts and DAG state were read back independently, attempts stayed unchanged and human approval remained pending. This bounded README task is not general production readiness or independent code-review approval; only disposable local evaluation is appropriate.

## First trial in an existing project

Choose a project that contains README.md. Commands below create only the declared trial files and project-local runtime state. Read the example contract before running code. If its task ID or output paths already exist, use another ID/path instead of overwriting another task.

```sh
SKILL_ROOT=/path/to/ultra-build
PROJECT=/path/to/project
mkdir -p "$PROJECT/.ultra-build/contracts"
cp "$SKILL_ROOT/examples/runtime-graph.json" "$PROJECT/.ultra-build/contracts/readme-trial.json"

node "$SKILL_ROOT/scripts/runtime.mjs" init --project "$PROJECT" --graph .ultra-build/contracts/readme-trial.json
node "$SKILL_ROOT/scripts/runtime.mjs" frontier --project "$PROJECT" --graph .ultra-build/contracts/readme-trial.json
node "$SKILL_ROOT/scripts/runtime.mjs" run-ready --project "$PROJECT" --graph .ultra-build/contracts/readme-trial.json
```

Expected: hash-readme Verified, summarize AwaitingApproval, complete=false. Read `work/runtime-trial/summary.json` before approving. Only the actual human operator should execute:

```sh
node "$SKILL_ROOT/scripts/runtime.mjs" approve --project "$PROJECT" --graph .ultra-build/contracts/readme-trial.json --node summarize --actor "<human>" --evidence "I inspected the current summary" --confirm
```

That confirms this summary version, not general permission to publish. Agent-generated test approvals are not real human approval. No implicit release, Git push or cleanup occurs in the runtime.

## Commands

- init: initialize task recovery pointer without overwriting existing state.
- frontier: derive Ready, Blocked, Interrupted, Failed, Stale, Submitted, Reviewed, GateFailed, ReviewFailed, AwaitingApproval, Verified or Approved from current evidence.
- run --node ID: real worker execution creates an immutable submission; never declares completion.
- verify --node ID: execute acceptance and laws in separate processes; binds current submission and runtime implementation hash. Commands must not mutate project files, except ignored runtime output.
- review --node ID --evidence review.json: import a genuine trusted-local independent review. JSON: `{submission_hash,decision:"PASS"|"FAIL",actor,evidence}`. Get submission_hash from frontier. Actor must differ from local-worker; this is a convention, not authenticated identity.
- run-ready / resume: run currently Ready nodes sequentially, then real verification. Continue into newly unlocked nodes. Stop at failures, missing review or human gates; no silent retry.
- run --node ID --retry: explicitly create the next attempt after failure or version drift, limited by max_attempts.
- Interrupted retry additionally requires idempotent=true and --confirm-uncertain. First reconcile side effects; the flag is not proof of exactly-once.
- recover-lock --lock-token TOKEN: recover only the exact proven-dead PID lock. Live/unknown/reused PIDs remain blocked. Inspect `.ultra-build/runtime/writer.lock` locally; recovery does not reconcile worker side effects.

## Contract v2

Each node declares id, depends_on, inputs (existing regular files), outputs, write_scope (exact file paths), run (argv array), acceptance (nonempty list of argv arrays), laws, review_required, human_gate, idempotent, max_attempts (1–10), timeout_ms (1–300000). IDs are lowercase letters/digits/hyphens. Inputs and outputs are disjoint; outputs must belong to write_scope. See the runnable example.

Use acceptance to express actual business correctness, not only file existence. Empty acceptance is rejected. No shell parsing is performed; an explicitly declared shell command still executes code and must be trusted.

Revisions change node definitions or current input bytes while retaining graph/node identity. A node's digest binds only its definition, inputs, runtime implementation and upstream verified evidence, so unrelated nodes remain valid. Each attempt freezes its node contract, runtime hash and input hashes. Historical attempts/reviews/approvals remain immutable. Changed inputs or outputs produce Stale; downstream is Blocked. Explicit retry creates a new submission requiring new gates. Changing the runtime implementation invalidates all old verification under that implementation.

## Storage and boundaries

`.ultra-build/state/<graph>/<node>/attempts/NNNN/` contains start, submission, review, verification and approval JSON. Raw command output stays ignored under `.ultra-build/runtime/`. Evidence writes use fsync plus exclusive publication; project writer lock serializes cooperating controllers.

This is not an OS sandbox, authenticated approval service, multi-machine scheduler or adversarial-worker boundary. Same-UID code can tamper with evidence and write outside the project. File-scope audit covers normal project files, excludes .git/.ultra-build/node_modules and known credential filenames (.env, key files, auth.json), and does not track empty directories or permission changes. Credential filenames are forbidden as declared inputs/outputs. This filtering is not comprehensive secret detection. Large/dependency-heavy trees may hit the snapshot bound; use a small scoped project copy for alpha testing. Symbolic-link escapes in declared paths are rejected. Supply project-relative paths; do not persist real machine paths or secrets.

The runtime does not migrate legacy Done, infer independent review from tests, replace business quality checks, manage arbitrary credentials, or perform publication. When combining with the skill, activate takeover with entry.mjs and select one v2 graph as the current task; never use legacy tools/verify.mjs as another completion authority.
