// Portable trusted-local v2 runtime: worker -> submission -> review -> real verify.
// Single project writer; immutable version-bound evidence; no OS sandbox.
// Imported approvals/reviews rely on a trusted local operator, not authenticated identity.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const VERSION='0.2.0-alpha.1';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const engineHash=hash(fs.readFileSync(fileURLToPath(import.meta.url)));
const json=x=>JSON.stringify(x);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const id=/^[a-z][a-z0-9-]{0,79}$/;
export function within(root,rel) {
 if(typeof rel!=='string'||!rel||path.isAbsolute(rel)||rel.split(/[\\/]/).includes('..')) throw Error('invalid project path');
 const base=fs.realpathSync(root), target=path.resolve(base,rel);
 if(!target.startsWith(base+path.sep)) throw Error('path escapes project');
 let parent=target;
 while(!fs.existsSync(parent)) parent=path.dirname(parent);
 const real=fs.realpathSync(parent);
 if(real!==base&&!real.startsWith(base+path.sep)) throw Error('symlink escapes project');
 return target;
}
function safeFile(root,rel) {
 const p=within(root,rel);
 if(!fs.statSync(p).isFile()) throw Error('expected regular file: '+rel);
 return p;
}
function files(root,paths,missing=false) {
 return paths.map(p=>{
  const f=within(root,p);
  if(!fs.existsSync(f)) {if(missing)return {path:p,sha256:null};throw Error('missing file: '+p);}
  return {path:p,sha256:hash(fs.readFileSync(safeFile(root,p)))};
 });
}
function cmd(c) {return Array.isArray(c)&&c.length>0&&c.every(x=>typeof x==='string'&&x.length>0);}
function sensitive(name) {return name==='.env'||name.startsWith('.env.')||/\.(pem|key|p12)$/.test(name)||['auth.json','.credentials.json'].includes(name);}
function paths(list) {return Array.isArray(list)&&new Set(list).size===list.length&&list.every(x=>typeof x==='string'&&x&& !path.isAbsolute(x)&& !x.split(/[\\/]/).some(p=>p==='..'||sensitive(p))&&!x.startsWith('.ultra-build/')&&!x.startsWith('.git/'));}
export function validate(g) {
 if(!g||g.version!==2||typeof g.id!=='string'||!id.test(g.id)||!Array.isArray(g.nodes)||!g.nodes.length)throw Error('invalid graph v2');
 const nodes=new Map(),order=[],busy=new Set(),done=new Set();
 for(const n of g.nodes) {
  if(!n||typeof n.id!=='string'||!id.test(n.id)||nodes.has(n.id)||!Array.isArray(n.depends_on)||new Set(n.depends_on).size!==n.depends_on.length||
   !n.depends_on.every(x=>typeof x==='string'&&id.test(x))||!paths(n.inputs)||!n.inputs.length||!paths(n.outputs)||!n.outputs.length||!paths(n.write_scope)||
   !cmd(n.run)||!Array.isArray(n.acceptance)||!n.acceptance.length||!n.acceptance.every(cmd)||!Array.isArray(n.laws)||!n.laws.every(cmd)||
   typeof n.review_required!=='boolean'||typeof n.human_gate!=='boolean'||typeof n.idempotent!=='boolean'||
   !Number.isInteger(n.max_attempts)||n.max_attempts<1||n.max_attempts>10||
   !Number.isInteger(n.timeout_ms)||n.timeout_ms<1||n.timeout_ms>300000) throw Error('invalid node schema');
  if(n.inputs.some(p=>n.outputs.includes(p)))throw Error('inputs and outputs must be disjoint');
  if(n.outputs.some(p=>!n.write_scope.includes(p)))throw Error('outputs outside declared write scope');
  nodes.set(n.id,n);
 }
 function visit(key) {
  if(!nodes.has(key))throw Error('missing dependency: '+key);
  if(busy.has(key))throw Error('dependency cycle');
  if(done.has(key))return;
  busy.add(key);for(const dep of nodes.get(key).depends_on)visit(dep);
  busy.delete(key);done.add(key);order.push(key);
 }
 for(const key of nodes.keys())visit(key);
 return {nodes,order};
}
function state(root,g) {return within(root,'.ultra-build/state/'+g.id);}
function immutable(file,value) {
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const tmp=file+'.tmp-'+crypto.randomUUID();
 const fd=fs.openSync(tmp,'wx',0o600);
 try {fs.writeFileSync(fd,json(value)+'\n');fs.fsyncSync(fd);}finally {fs.closeSync(fd);}
 try {fs.linkSync(tmp,file);}finally {fs.unlinkSync(tmp);}
}
function lock(root,fn) {
 const dir=within(root,'.ultra-build/runtime');fs.mkdirSync(dir,{recursive:true});
 const file=within(root,'.ultra-build/runtime/writer.lock');
 const fd=fs.openSync(file,'wx',0o600),token=crypto.randomUUID();
 try {fs.writeFileSync(fd,json({pid:process.pid,token}));fs.fsyncSync(fd);return fn();}
 finally {fs.closeSync(fd);fs.unlinkSync(file);}
}
export function recoverLock(root,token) {
 const file=within(root,'.ultra-build/runtime/writer.lock'),r=read(file);
 if(!token||r.token!==token||!Number.isInteger(r.pid))throw Error('lock identity mismatch');
 try {process.kill(r.pid,0);throw Error('writer still alive');}catch(e) {if(e.code!=='ESRCH')throw e;}
 if(read(file).token!==token)throw Error('lock changed');
 fs.unlinkSync(file);return {recovered:true,side_effects_reconciled:false};
}
function attempts(root,g,n) {
 const dir=path.join(state(root,g),n.id,'attempts');
 if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir).filter(x=>/^\d{4}$/.test(x)).sort().map(x=>{
  const rel='.ultra-build/state/'+g.id+'/'+n.id+'/attempts/'+x;
  const base=within(root,rel);
  return {number:Number(x),base,start:read(within(root,rel+'/start.json'))};
 });
}
function optional(root,base,name) {
 const rel=path.relative(fs.realpathSync(root),path.join(base,name));
 const p=within(root,rel);
 return fs.existsSync(p)?read(p):null;
}
function fingerprint(root,g,n,deps) {
 return hash(json({engineHash,graph:g.id,node:n,inputs:files(root,n.inputs,true),dependencies:deps}));
}
function validActor(r,submission) {
 return r&&r.version===2&&r.submission_hash===hash(json(submission))&&typeof r.actor==='string'&&r.actor.trim()&&
 r.actor!==submission.executor&&typeof r.evidence==='string'&&r.evidence.trim();
}
export function frontier(root,g) {
 const {nodes,order}=validate(g),view=new Map();
 for(const key of order) {
  const n=nodes.get(key),deps=n.depends_on.map(x=>({id:x,evidence:view.get(x).evidence}));
  const input=fingerprint(root,g,n,deps),history=attempts(root,g,n),a=history.at(-1);
  const blocked=n.depends_on.filter(x=>!['Verified','Approved'].includes(view.get(x).status));
  let status='Ready',reason='ready',submission=null,verification=null,review=null,approval=null;
  if(blocked.length){status='Blocked';reason='dependency_unverified';}
  else if(a&&a.start.input===input) {
   submission=optional(root,a.base,'submission.json');
   if(!submission){status='Interrupted';reason='reconcile_before_retry';}
   else if(submission.version!==2||submission.id!==key||submission.input!==input||submission.executor!=='local-worker'||submission.error||submission.exit_code!==0){status='Failed';reason='worker_failed';}
   else if(json(files(root,n.outputs,true))!==json(submission.outputs)){status='Stale';reason='output_changed';}
   else {
    review=optional(root,a.base,'review.json');verification=optional(root,a.base,'verification.json');approval=optional(root,a.base,'approval.json');
    const reviewed=validActor(review,submission)&&review.decision==='PASS';
    const verified=verification?.version===2&&verification.submission_hash===hash(json(submission))&&
     verification.engine_hash===engineHash&&verification.results?.length===n.acceptance.length+n.laws.length&&
     verification.results.every((r,i)=>r.exit_code===0&&!r.error&&json(r.command)===json([...n.acceptance,...n.laws][i]))&&!verification.error;
    if(review&&validActor(review,submission)&&review.decision==='FAIL'){status='ReviewFailed';reason='independent_review_failed';}
    else if(verification&&!verified){status='GateFailed';reason='acceptance_failed';}
    else if(n.review_required&&!reviewed){status='Submitted';reason='independent_review_missing';}
    else if(!verified){status='Reviewed';reason='verification_required';}
    else if(n.human_gate&&!(approval?.version===2&&approval.submission_hash===hash(json(submission))&&approval.decision==='APPROVE'&&typeof approval.actor==='string'&&approval.actor.trim()&&approval.evidence?.trim())){status='AwaitingApproval';reason='human_approval_missing';}
    else {status=n.human_gate?'Approved':'Verified';reason='current_evidence_pass';}
   }
  } else if(a) {status='Stale';reason='input_or_dependency_changed';}
  const evidence=['Verified','Approved'].includes(status)?hash(json({input,submission,review:n.review_required?review:null,verification,approval:n.human_gate?approval:null})):null;
  view.set(key,{id:key,status,reason,input,evidence,blocked_by:blocked,attempt:a?.number??0,submission_hash:submission?hash(json(submission)):null});
 }
 const list=order.map(key=>view.get(key));
 return {version:VERSION,graph:g.id,nodes:list,complete:list.every(n=>['Verified','Approved'].includes(n.status))};
}
function nodeState(root,g,key) {
 const {nodes}=validate(g);if(!nodes.has(key))throw Error('unknown node');
 const n=nodes.get(key),v=frontier(root,g).nodes.find(x=>x.id===key),a=attempts(root,g,n).at(-1);
 return {n,v,a};
}
function execute(root,g,n,command,label) {
 const started=new Date().toISOString();
 const r=spawnSync(command[0],command.slice(1),{cwd:fs.realpathSync(root),encoding:'utf8',timeout:n.timeout_ms,maxBuffer:1024*1024,
 env:{PATH:process.env.PATH,HOME:process.env.HOME,LANG:'C.UTF-8',AGENT_BRIEF_SUPPRESS:'1'}});
 const output=(r.stdout||'')+(r.stderr||'');
 const dir=within(root,'.ultra-build/runtime/'+g.id);fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(within(root,'.ultra-build/runtime/'+g.id+'/'+n.id+'-'+label+'-'+crypto.randomUUID()+'.log'),output,{mode:0o600});
 return {command,started,finished:new Date().toISOString(),exit_code:r.status,error:r.error?.code??null,output_bytes:Buffer.byteLength(output),output_sha256:hash(output)};
}
function snapshot(root) {
 const result={};let count=0;
 function scan(dir,prefix='') {
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})) {
   const p=prefix+ent.name;
   if(['.git','.ultra-build','node_modules'].includes(ent.name)||sensitive(ent.name))continue;
   if(++count>30000)throw Error('project snapshot too large');
   if(ent.isDirectory())scan(path.join(dir,ent.name),p+'/');
   else if(ent.isSymbolicLink())result[p]='link:'+fs.readlinkSync(path.join(dir,ent.name));
   else if(ent.isFile())result[p]=hash(fs.readFileSync(path.join(dir,ent.name)));
  }
 }
 scan(fs.realpathSync(root));return result;
}
function changes(a,b) {return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(p=>a[p]!==b[p]);}
export function run(root,g,key,{retry=false,confirmUncertain=false}={}) {
 return lock(root,()=>{
  const {n,v,a}=nodeState(root,g,key);
  if(v.blocked_by.length)throw Error('dependency not verified');
  const eligible=['Ready','Stale','Failed','GateFailed','ReviewFailed','Interrupted'];
  if(!eligible.includes(v.status))throw Error('node not executable: '+v.status);
  if(a&&!retry)throw Error('explicit --retry required');
  if(v.status==='Interrupted'&&(!n.idempotent||!confirmUncertain))throw Error('uncertain side effects require idempotent contract and --confirm-uncertain');
  if((a?.number??0)>=n.max_attempts)throw Error('attempt budget exhausted');
  files(root,n.inputs);
  const number=(a?.number??0)+1,base=path.join(state(root,g),key,'attempts',String(number).padStart(4,'0'));
  immutable(path.join(base,'start.json'),{version:2,input:v.input,executor:'local-worker',started:new Date().toISOString(),attempt:number,
   graph:g.id,contract:n,engine_hash:engineHash,inputs:files(root,n.inputs)});
  const before=snapshot(root);
  const result=execute(root,g,n,n.run,'worker');
  let error=result.error,outputs=[];
  try {
   const changed=changes(before,snapshot(root));
   if(changed.some(p=>!n.write_scope.includes(p)))error='WRITE_SCOPE_VIOLATION';
   if(frontier(root,g).nodes.find(x=>x.id===key).input!==v.input)error='INPUT_CHANGED';
   outputs=files(root,n.outputs);
  }catch {error=error||'OUTPUT_OR_INPUT_MISSING';}
  const submission={version:2,id:key,input:v.input,attempt:number,executor:'local-worker',...result,error,outputs};
  immutable(path.join(base,'submission.json'),submission);return submission;
 });
}
export function review(root,g,key,record) {
 return lock(root,()=>{
  const {v,a}=nodeState(root,g,key);if(!a||!['Submitted','Reviewed'].includes(v.status))throw Error('not reviewable');
  const submission=read(path.join(a.base,'submission.json'));
  const r={version:2,...record};
  if(!validActor(r,submission)||!['PASS','FAIL'].includes(r.decision))throw Error('invalid independent review');
  immutable(path.join(a.base,'review.json'),r);return frontier(root,g);
 });
}
export function verify(root,g,key) {
 return lock(root,()=>{
  const {n,v,a}=nodeState(root,g,key);if(!a||!['Submitted','Reviewed'].includes(v.status))throw Error('not verifiable');
  if(optional(root,a.base,'verification.json'))return frontier(root,g);
  const submission=read(path.join(a.base,'submission.json'));
  const before=snapshot(root),results=[...n.acceptance,...n.laws].map((c,i)=>execute(root,g,n,c,'verify-'+i));
  let error=null;
  try {
   if(changes(before,snapshot(root)).length||json(files(root,n.outputs))!==json(submission.outputs)||
     frontier(root,g).nodes.find(x=>x.id===key).input!==v.input)error='VERIFICATION_MUTATED_INPUT_OR_OUTPUT';
  }catch {error='VERIFICATION_INPUT_MISSING';}
  immutable(path.join(a.base,'verification.json'),{version:2,submission_hash:hash(json(submission)),engine_hash:engineHash,results,error});
  return frontier(root,g);
 });
}
export function approve(root,g,key,{actor,evidence,confirm=false}) {
 return lock(root,()=>{
  const {n,v,a}=nodeState(root,g,key);if(!n.human_gate||v.status!=='AwaitingApproval'||!confirm||typeof actor!=='string'||!actor.trim()||typeof evidence!=='string'||!evidence.trim())throw Error('current verified version and explicit approval required');
  const submission=read(path.join(a.base,'submission.json'));
  immutable(path.join(a.base,'approval.json'),{version:2,submission_hash:hash(json(submission)),decision:'APPROVE',actor,evidence,approved:new Date().toISOString()});
  return frontier(root,g);
 });
}
export function runReady(root,g) {
 const executed=[];
 for(let step=0;step<g.nodes.length;step++) {
  const item=frontier(root,g).nodes.find(n=>n.status==='Ready');
  if(!item)break;
  const receipt=run(root,g,item.id);executed.push(item.id);
  if(receipt.exit_code!==0||receipt.error)break;
  verify(root,g,item.id);
 }
 return {...frontier(root,g),executed};
}
