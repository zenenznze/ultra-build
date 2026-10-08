import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {currentView} from './current.mjs';
const args=process.argv.slice(2);
const flag=args.indexOf('--project');
if(flag<0 || !args[flag+1]) throw new Error('Required: --project <target project root>');
const project=fs.realpathSync(args[flag+1]);
const framework=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const control=path.join(project,'.ultra-build');
const rule=path.join(project,'AGENTS.md');
const begin='<!-- ULTRA-BUILD:START -->',end='<!-- ULTRA-BUILD:END -->';
const block=begin+'\n## Active task workflow: ultra-build\nultra-build is persistent once activated: after this block is installed, apply its workflow to every subsequent task in this project until explicitly deactivated by the user; do not require the user to repeat the slash command.\nLoad the installed ultra-build skill and invoke its own entry with --project when resuming or creating task state.\nLegacy workflow entrypoints/status are reference evidence, not completion authority.\nPreserve user instructions and project safety rules. Read task-relevant legacy evidence without adopting legacy Done.\nPut contracts/laws/submissions in .ultra-build/, durable tasks in .ultra-build/state/, approvals in .ultra-build/approvals/.\nBusiness deliverables stay in existing project directories. Runtime locks/logs belong in ignored .ultra-build/runtime/.\nAfter any actual ultra-build use in the current task, generic reflection requests must review both business skills and ultra-build workflow use. Load references/self-evolution.md from the installed ultra-build skill directory; apply evidence-backed owned framework fixes within the requested scope, or report missing evidence/blockers. Respect explicit narrower read-only requests; reflection is not human approval or task closeout.\nNever infer human approval or completion from worker done, tests, or legacy status.\n'+end;
const current=fs.existsSync(rule)?fs.readFileSync(rule,'utf8'):'';
if(current.includes(begin)!==current.includes(end) || (current.includes(begin) && (current.indexOf(end)<current.indexOf(begin) || current.split(begin).length!==2 || current.split(end).length!==2))) throw new Error('Malformed rule block; preserve and resolve manually');
const config=path.join(control,'project.json');
const legacyRoots=['work/topic-selection-map','work/runs','tools/frontier.mjs','build2me','AGENTS.md'];
const legacyEvidence=legacyRoots.filter(rel=>fs.existsSync(path.join(project,rel))).map(rel=>({path:rel,kind:rel==='AGENTS.md'?'rules-or-history':rel.includes('frontier')?'legacy-frontier':'legacy-workflow'}));
const adoptionTask={task_id:'legacy-adoption',contract:'takeover-adoption',goal:'Import legacy evidence into ultra-build without inheriting completion',status:'pending',depends_on:[],write_scope:['.ultra-build/**'],resources:[],max_attempts:1};
if(fs.existsSync(config) && JSON.parse(fs.readFileSync(config)).version!==1) throw new Error('Unsupported project format');
if(args.includes('--apply')){
 for(const name of ['contracts','laws','impl','state','approvals','runtime']) fs.mkdirSync(path.join(control,name),{recursive:true});
 if(!fs.existsSync(config)) fs.writeFileSync(config,JSON.stringify({version:1,workflow:'ultra-build',active:true,activation:'persistent-project-takeover',legacy_status_authoritative:false,legacy_evidence:legacyEvidence.map(x=>x.path)},null,2)+'\n',{flag:'wx'});
 else { const existing=JSON.parse(fs.readFileSync(config,'utf8')); existing.active=true; existing.activation='persistent-project-takeover'; fs.writeFileSync(config,JSON.stringify(existing,null,2)+'\n'); }
 const imports=path.join(control,'imports'); fs.mkdirSync(imports,{recursive:true});
 const receipt={version:1,source:'legacy-project-scan',evidence:legacyEvidence,completion_authority:'ultra-build',legacy_done_imported:false};
 fs.writeFileSync(path.join(imports,'legacy-scan.json'),JSON.stringify(receipt,null,2)+'\n');
 fs.mkdirSync(path.join(control,'state','legacy-adoption'),{recursive:true});
 const adoptionFile=path.join(control,'state','legacy-adoption','task.json');
 if(!fs.existsSync(adoptionFile)) fs.writeFileSync(adoptionFile,JSON.stringify({version:1,task:adoptionTask,events:[{seq:1,from:null,to:'pending',evidence:'entry adoption'}]},null,2)+'\n',{flag:'wx'});
 const upgraded=current.includes(begin)?current.slice(0,current.indexOf(begin))+block+current.slice(current.indexOf(end)+end.length):current+(current.endsWith('\n')||!current?'':'\n')+'\n'+block+'\n';
 if(upgraded!==current) fs.writeFileSync(rule,upgraded);
 const ignore=path.join(control,'.gitignore');
 if(!fs.existsSync(ignore)) fs.writeFileSync(ignore,'runtime/\n',{flag:'wx'});
}
const tasks=[];
const stateRoot=path.join(control,'state');
if(fs.existsSync(stateRoot)) for(const name of fs.readdirSync(stateRoot)) {
 const file=path.join(stateRoot,name,'task.json');
 if(!fs.existsSync(file)) continue;
 const record=JSON.parse(fs.readFileSync(file,'utf8'));
 tasks.push({path:`state/${name}/task.json`,task_id:record.task?.task_id??record.task_id??name,reported_status:record.task?.status??record.status??'unknown',verification:'unverified'});
}
const projectState=fs.existsSync(config)?JSON.parse(fs.readFileSync(config,'utf8')):null;
const managed=fs.existsSync(rule) && fs.readFileSync(rule,'utf8').includes(block);
const takeoverReason=!projectState?'not_initialized':projectState.active!==true?'inactive':managed?'ready':!fs.existsSync(rule)||!fs.readFileSync(rule,'utf8').includes(begin)?'managed_block_missing':'managed_block_outdated';
const contracts=fs.existsSync(path.join(control,'contracts'))?fs.readdirSync(path.join(control,'contracts')).filter(x=>x.endsWith('.json')):[];
console.log(JSON.stringify({
 mode:args.includes('--apply')?'applied':'preview',framework,project,
 workflow:'ultra-build',active:fs.existsSync(config)?Boolean(JSON.parse(fs.readFileSync(config,'utf8')).active):false,activation:fs.existsSync(config)?JSON.parse(fs.readFileSync(config,'utf8')).activation:null,legacy_status_authoritative:false,
 planned_paths:['AGENTS.md managed block','.ultra-build/{contracts,laws,impl,state,approvals,imports,runtime}'],
 legacy_evidence:legacyEvidence,
 adoption:{task_id:'legacy-adoption',status:tasks.find(x=>x.task_id==='legacy-adoption')?.reported_status??'preview',receipt:'imports/legacy-scan.json',legacy_done_imported:false},
 takeover:{ready:takeoverReason==='ready',reason:takeoverReason,action:takeoverReason==='ready'?'Read matching task and checkpoint before execution':takeoverReason==='managed_block_outdated'?'Managed rule block needs upgrade; existing activation and tasks preserved':takeoverReason==='inactive'?'Project explicitly inactive; do not reactivate without user instruction':'Activation incomplete: apply project-local takeover before execution'},
 current_view:args.includes('--task')?currentView(project,args[args.indexOf('--task')+1]):null,
 tasks,contracts,frontier:contracts.map(file=>({file,status:'unverified',action:'Read contract and execute its acceptance; no Done inferred'})),
 next:contracts.length?'Read current task evidence and gates':'Read relevant legacy task evidence; establish current contract before new execution',
 limitations:['Prompt-guided takeover; not a sandbox','No automatic legacy approval migration','Runtime scheduler and trusted verifier not yet production-ready']
},null,2));
