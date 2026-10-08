---
name: ultra-build
description: >-
  Use when ultra-build is explicitly invoked or injected, including multi-skill skill-context;
  when a project already has active ultra-build rules/state and the user says continue, resume,
  revise, approve, or start the next task without naming the framework again;
  or when adopting a project workflow, migrating legacy task evidence, coordinating Agents,
  or establishing project-local durable state and human approval gates.
  项目级持久工作流框架：当用户要求接管项目、改造工作流、任务协作调度、恢复任务、
  推进到人工验收节点，或已启用项目中要求继续、返工、通过后推进、新任务时加载。
  与视频制作、代码开发等业务能力同时使用，不替代业务能力。
  Also use for evidence-driven ultra-build self-evolution: inspect its Pi usage and
  task-generated project records to improve this framework. 根据自身使用数据自举优化 ultra-build。
  After any ultra-build use in the current task, generic reflection requests such as
  “这个对话里有哪些可以优化的” also trigger business-skill and ultra-build workflow review.
---
# ultra-build：当前任务工作流

## 必须先执行：定位与接管

以本次加载的 SKILL.md 的真实目录为 SKILL_ROOT；不得用目标项目的 tools/ 代替本技能工具。
目标项目是用户明确指定的项目根；否则检查当前 cwd 和 Git 根，存在歧义先澄清。
先运行（占位变量必须替换为真实定位值）：

    node "$SKILL_ROOT/scripts/entry.mjs" --project "$PROJECT_ROOT"

读取启动回执中的 workflow、framework、project、contracts、frontier、next 和 limitations。
预览用于检查写入范围，不是激活完成。显式斜杠调用、palette 选择或多技能注入本技能，即表示在当前明确项目中启用接管；不要求用户再补一句“使用它”。无附加任务时先完成项目初始化，恢复已有任务；没有可识别任务则报告已激活并等待目标，不凭空派活。仅询问技能、引用技能文字或明确要求只读预览不算激活授权。项目不明或权限冲突才澄清。回执若发现 legacy_evidence，列为待迁移证据，不执行旧 frontier。激活时运行：

    node "$SKILL_ROOT/scripts/entry.mjs" --project "$PROJECT_ROOT" --apply

仅修改回执所列管理路径。apply 会生成 legacy-scan.json 和 state/legacy-adoption/task.json，并升级旧管理块；重复执行不得重置既有任务和事件。回读 takeover.ready、active、tasks：未 ready 不得声称已接管。它们只是接管证据，不是完成证明。不默认修改全局配置，也不授权付费、发布或扩大写集。

## 持久接管语义

`/skill:ultra-build` 是一次性激活，不是只对当前回答生效的提示词。成功执行 `--apply` 后，目标项目的 `.ultra-build/project.json` 与 `AGENTS.md` 管理块共同表示该项目已进入 ultra-build 运行时：后续对话即使用户没有重复任何指令，也必须继续使用本技能的 contract、state、review、submission、verify 与 human-gate 语义。不得因为下一条消息没有再次提及 ultra-build 而回退到 legacy workflow；只有用户明确要求停用、移除或切换框架时才可解除。每次恢复任务仍须读取项目状态并运行本技能入口，不得把激活标记本身当作任务完成证明。

## 旧工作流与旧资料

本次任务明确使用 ultra-build 时，不继续用旧框架的自动执行入口、看板或 frontier 指挥本次工作。
这不是忽略用户指令、项目安全规则或权限边界；无法调和的冲突必须报告。
可以读取与当前任务相关的旧目标、合同、产物、失败记录和审批证据；记录相对来源、版本和 hash。
不删除、覆盖或搬迁旧文件；不把历史 Done、旧测试通过或聊天结论迁移成新 Done。
用户当前审批只有匹配当前产物版本才可引用；不能制造审批或从生成审核包的同意推断批准。
已有音频/视频/代码先检查再复用，不重复付费生产，不自动增加第二个 Agent。

## 写入位置

- 本技能仓库：通用工具、schema、adapter；目标项目数据不得回写这里。
- 目标项目 AGENTS.md：只追加 ULTRA-BUILD 管理块，保留其他规则。
- .ultra-build/project.json：启用格式与工作流标识。
- .ultra-build/contracts/、laws/、impl/：当前合同、约束、不可变提交证据。
- .ultra-build/state/<task-id>/：task.json、HANDOFF.md、attempts/、result、review、checkpoint、resource receipt。
- .ultra-build/approvals/：版本绑定的人审证据，不保存凭据。
- .ultra-build/runtime/：本机锁与日志，已忽略 Git。
- 业务成果：留在项目既有业务目录；合同中用项目相对路径引用。
可提交记录禁止真实本机路径、用户名路径和密钥。运行时回执可展示解析路径，但不得复制进持久证据。

## 框架与业务能力绑定

同时加载业务技能不是切换掉 ultra-build。框架拥有任务拓扑、恢复和完成判定；业务技能提供内容方法、生产 CLI 与验收能力。遇到业务技能强制旧 frontier/verify，先在当前合同中记录冲突与能力绑定，只复用其验收/生产函数，不执行旧自动编排入口；不静默忽略项目安全规则，无法调和时报告具体冲突。

每个任务写 `.ultra-build/state/<task-id>/task.json` 与 `HANDOFF.md`，记录当前合同、业务技能来源/版本、业务状态相对路径、当前阶段、产物 hash、验收命令/结果、审批引用、下一动作和阻断项。业务目录里的 state 可保留为技术事实源，但必须明确绑定，不能形成第二套完成权威。继续、返工、审核通过和后台唤醒时先读匹配任务及 checkpoint；只让受变更影响的下游失效。没有独立 review 能力时如实标记缺失，不增加未经决定的第二 Agent、不伪造 review，也不将自身检查称为独立审核。技术检查可以继续，Contract Done 仍不可宣称。

## 当前版本视图（不改历史证据）

恢复一个已明确任务时，可用 `node "$SKILL_ROOT/scripts/entry.mjs" --project "$PROJECT_ROOT" --task <task-id>`，或只读 `scripts/current.mjs --project ... --task ...`。不再遍历所有旧文档推断哪个pending是真相。

在task.json的`current`中保存项目相对路径：`config`（当前稿）、`manifest`（当前成片）、`approval`（当前真实用户批准）、`delivery`（当前交付校验记录）。当前视图校验成片hash和批准hash相同才显示approved；旧manifest的pending作为历史字段保留，不改写旧提交。文件夹交付记录用artifacts=[{path,sha256}]的项目相对路径（或delivery_format=folder_only、package和files字典），current逐文件回读hash并拒绝越界/重复/空清单，不能只看自报verified或只支持ZIP。媒体与批准hash匹配不证明发布文本或交付副本仍一致；文件夹hash检查也不代替业务字段顺序、完整性、解码或合同verifier。只读视图不创造批准，不代替业务解码/质量验证或可信合同验收。

`publication`独立于制作/交付状态。用户自报发布记录`status=user_reported`、真实`evidence`和`platform_verification=not_performed`；平台核验须有另行授权和真实证据。不因交付成功推定发布，不在此增加数据采集或反馈分析。

当前任务保持一个恢复入口；恢复先读task.current及当前回读结果，再看checkpoint/HANDOFF。二者冲突时不执行旧next：以版本绑定的当前证据为准，刷新必要的阶段性检查点而非把approved/delivery写回历史manifest。用户指定某个输入/延后某项选择要记录为独立决策和停止位置，不继承旧输入授权；更改交付容器或发布信息只更新相应交付hash，不自动重做已审媒体。
同一合同范围内的小裁切/机械配乐记录版本与受影响依赖即可，不为每次内部试版新增任务或人工闸门。目标、权限或写集改变时才修订合同，历史合同/批准/产物仍不可变。

## 主 Agent 的必做闭环

读取目标、任务相关旧证据、当前合同、依赖、write scope、资源、人审门与 backend 能力。
没有当前合同不得开始新执行；先建立合同及真实 acceptance。
worker result → 独立 review → submission → 实际执行 acceptance/laws/verifier → 新 frontier。
worker done、review PASS、自报 gate PASS、Herdr idle/done 都不能代替合同验证。
缺少 trusted verifier 时只能报告“验收命令结果/未验证”，不得报告 Contract Done。
人工门缺失保持 blocked/open；scope/resource 冲突不并发；崩溃保留证据并明确恢复边界。
entry 负责接管与恢复指针。显式选择 v2 合同后，可使用本技能 `scripts/runtime.mjs` 的本地 alpha 运行时执行 run → submission → 独立 review → 实际 verify → 人工门 → 新 frontier；先读 [试用说明](references/runtime-trial.md) 与合同，传入明确的 --project 和项目相对 --graph。它不是生产级 scheduler、安全沙箱或认证审批服务；当前候选仍缺独立语义代码审核，限可丢弃项目副本试验。没有选择 v2 合同时仍保持 prompt-guided，不能把接管标记当作验证完成。不得调用本仓库旧 tools/verify.mjs 来证明目标项目完成。
先继续现有任务的当前阶段，完成所需审查后停在真实人工节点，不人为给每个小实现增加审核点。

## 自举与使用反馈

**结尾双轨复盘（任务内调用一次即生效）**：当前任务有任一次真实 ultra-build 注入、加载或入口调用，你说“这个对话里有哪些可以优化的”“这次有什么可以更新到技能里”，即使未再提框架名，也必须同时复盘业务能力和 ultra-build。不能只优化视频/代码等业务技能。按 [自举操作方法](references/self-evolution.md) 的双轨流程检查是否真正激活、按合同执行、恢复、审核与验收；给出差距、证据和应改位置，并将有证据且在授权范围内的本框架最小修复落实、验证、交付，无问题则如实报告不改。泛化复盘请求在此条件下包含本框架维护，不包含来源技能、全局规则或未知归属文件的修改；用户明确只讨论/只复盘某业务技能时遵守更窄范围。复盘不等于人工批准或任务收尾。

用户要求根据自身使用数据优化 ultra-build、自举或复盘框架执行时，读取 [自举操作方法](references/self-evolution.md)。从相关 Pi 会话的真实注入/调用/结果，追踪到目标项目中本框架生成或明确绑定的任务数据，再形成“证据 → 原因/假设 → 通用机制 → 最小补丁 → 验证 → 后续观察”。普通任务只记必要反馈，不自行改源码或无限迭代。仅扫描已明确项目与任务范围，不收集整个项目；加载、激活、执行、恢复、验收分别举证。

维护技能内容 load `asm` skill，使用 private make 的 operate / 适用 eval；Git 交付 load `dev` skill；历史定位 load `session-history` skill。此流程不替代它们的门禁、不自动修改来源技能、不绕过人审，不把静态通过或自报完成当作实际效果。

## 调用示例

“使用 ultra-build 接管当前任务，读取相关旧资料，检查现有产物，推进到下一个人工审核节点；不要重复生产。”

## 失败处理

项目位置不明、格式不兼容、规则块损坏或权限不足：保留现场并报告，不覆盖、不扩大权限。
