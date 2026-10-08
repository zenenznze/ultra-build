import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export function currentView(project,taskId){
 const root=fs.realpathSync(project);
 if(!/^[A-Za-z0-9_-]+$/.test(taskId)) throw new Error('Invalid explicit task id');
 const resolve=rel=>{
  if(typeof rel!=='string'||path.isAbsolute(rel)) throw new Error('Use a project-relative reference');
  const candidate=path.resolve(root,rel);
  if(!candidate.startsWith(root+path.sep)) throw new Error('Reference escapes project');
  const full=fs.realpathSync(candidate);
  if(!full.startsWith(root+path.sep)) throw new Error('Reference escapes project');
  return full;
 };
 const read=rel=>JSON.parse(fs.readFileSync(resolve(rel),'utf8'));
 const hash=rel=>crypto.createHash('sha256').update(fs.readFileSync(resolve(rel))).digest('hex');
 const statePath='.ultra-build/state/'+taskId+'/task.json';
 const state=read(statePath);
 const refs=state.current??{};
 const result={task_id:taskId,state:statePath,phase:state.phase??null,
  reported_status:state.status??state.task?.status??'unknown',
  current:refs,human_approval:'pending',artifact_validation:'not_performed',
  framework_verification:'unverified',independent_review:state.independent_review??'not_performed',
  publication:state.publication??{status:'not_recorded',platform_verification:'not_performed'},
  limitations:['Read-only current pointers; not a contract verifier or approval authority']};
 // Explicit pointers only: no global inventory or historical status merging.
 if(refs.manifest){
  const m=read(refs.manifest);
  const video=path.posix.join(path.posix.dirname(refs.manifest),m.video);
  result.video=video;result.video_sha256=hash(video);
  result.artifact_validation=result.video_sha256===m.video_sha256?'hash_matched':'hash_drift';
  result.historical_manifest_review=m.final_review??null;
  if(refs.approval){
   const a=read(refs.approval);
   result.human_approval=a.source==='user'&&a.evidence&&a.sha256===result.video_sha256&&result.artifact_validation==='hash_matched'?'approved':'stale_or_invalid';
  }
 }
 if(refs.delivery){
  const d=read(refs.delivery);result.delivery={record:refs.delivery,status:d.status??'unknown',validation:'not_performed'};
  if(d.artifacts || (d.delivery_format==='folder_only' && d.package && d.files)){
   const artifacts=d.artifacts??Object.entries(d.files).map(([name,r])=>({path:path.posix.join(d.package,name),sha256:r.sha256}));
   if(!Array.isArray(artifacts)||!artifacts.length) throw new Error('Missing explicit delivery artifacts');
   const seen=new Set();
   const matched=artifacts.map(a=>{
    if(!a||typeof a.path!=='string'||typeof a.sha256!=='string'||!/^[a-f0-9]{64}$/.test(a.sha256)) throw new Error('Invalid delivery path/hash');
    const full=resolve(a.path);
    if(seen.has(full)) throw new Error('Duplicate delivery artifact');
    seen.add(full);
    return hash(a.path)===a.sha256;
   }).every(Boolean);
   result.delivery.validation=matched?'folder_hash_matched':'folder_hash_drift';
   result.delivery.artifact_count=artifacts.length;
   if(d.source_video_sha256 && d.source_video_sha256!==result.video_sha256) result.delivery.validation='source_version_drift';
  }else if(d.zip&&d.zip_sha256) result.delivery.validation=hash(d.zip)===d.zip_sha256?'zip_hash_matched':'zip_hash_drift';
 }
 return result;
}
if(process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))){
 const args=process.argv.slice(2);const value=name=>args[args.indexOf(name)+1];
 if(!args.includes('--project')||!args.includes('--task')) throw new Error('Required: --project <root> --task <explicit id>');
 console.log(JSON.stringify(currentView(value('--project'),value('--task')),null,2));
}
