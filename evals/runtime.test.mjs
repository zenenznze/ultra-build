import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validate,frontier,run,review,verify,approve,runReady,within,recoverLock} from '../scripts/runtime/kernel.mjs';
function fixture(fn) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ultra-trial-'));
 try {
 fs.writeFileSync(path.join(root,'source.txt'),'input');
 const node={id:'produce',depends_on:[],inputs:['source.txt'],outputs:['result.txt'],write_scope:['result.txt'],
 run:[process.execPath,'-e',"require('fs').writeFileSync('result.txt',require('fs').readFileSync('source.txt'))"],
 acceptance:[[process.execPath,'-e',"if(require('fs').readFileSync('result.txt','utf8')!=='input')process.exit(1)"]],laws:[],
 review_required:true,human_gate:true,idempotent:true,max_attempts:3,timeout_ms:3000};
 fn(root,{version:2,id:'trial',nodes:[node]});
 } finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('real worker, missing review, real verifier, human gate, version drift',()=>fixture((root,g)=>{
 const submission=run(root,g,'produce');assert.equal(submission.exit_code,0);
 assert.equal(frontier(root,g).nodes[0].status,'Submitted');
 verify(root,g,'produce');assert.equal(frontier(root,g).complete,false);
 const current=frontier(root,g).nodes[0];
 assert.throws(()=>review(root,g,'produce',{submission_hash:current.submission_hash,decision:'PASS',actor:'local-worker',evidence:'self'}),/independent/);
 review(root,g,'produce',{submission_hash:current.submission_hash,decision:'PASS',actor:'fixture-reviewer',evidence:'test fixture, not real approval'});
 assert.equal(frontier(root,g).nodes[0].status,'AwaitingApproval');
 assert.throws(()=>approve(root,g,'produce',{actor:'fixture-human',evidence:'test'}),/explicit/);
 approve(root,g,'produce',{actor:'fixture-human',evidence:'synthetic test approval',confirm:true});
 assert.equal(frontier(root,g).complete,true);
 fs.writeFileSync(path.join(root,'result.txt'),'changed');assert.equal(frontier(root,g).nodes[0].status,'Stale');
 assert.throws(()=>run(root,g,'produce'),/retry/);
 run(root,g,'produce',{retry:true});assert.equal(frontier(root,g).nodes[0].status,'Submitted');
}));
test('dependent generated inputs and selective invalidation',()=>fixture((root,g)=>{
 const a={...g.nodes[0],review_required:false,human_gate:false};
 const b={...a,id:'package',depends_on:['produce'],inputs:['result.txt'],outputs:['package.txt'],write_scope:['package.txt'],
 run:[process.execPath,'-e',"require('fs').copyFileSync('result.txt','package.txt')"],
 acceptance:[[process.execPath,'-e',"if(!require('fs').existsSync('package.txt'))process.exit(1)"]]};
 fs.writeFileSync(path.join(root,'other.txt'),'independent');
 const c={...a,id:'other',inputs:['other.txt'],outputs:['other-output.txt'],write_scope:['other-output.txt'],
 run:[process.execPath,'-e',"require('fs').copyFileSync('other.txt','other-output.txt')"],
 acceptance:[[process.execPath,'-e',"if(!require('fs').existsSync('other-output.txt'))process.exit(1)"]]};
 g.nodes=[a,b,c];assert.equal(frontier(root,g).nodes[1].status,'Blocked');
 assert.equal(runReady(root,g).complete,true);
 fs.writeFileSync(path.join(root,'source.txt'),'new input');
 assert.deepEqual(frontier(root,g).nodes.map(n=>n.status),['Stale','Blocked','Verified']);
}));
test('reject cycle, failed acceptance, out-of-scope write and timeout',()=>{
 fixture((root,g)=>{g.nodes[0].depends_on=['produce'];assert.throws(()=>validate(g),/cycle/);});
 fixture((root,g)=>{g.nodes[0].inputs=['.env'];assert.throws(()=>validate(g),/schema/);});
 fixture((root,g)=>{g.nodes[0].acceptance=[[process.execPath,'-e','process.exit(9)']];run(root,g,'produce');assert.equal(verify(root,g,'produce').nodes[0].status,'GateFailed');});
 fixture((root,g)=>{g.nodes[0].run=[process.execPath,'-e',"require('fs').writeFileSync('rogue.txt','bad');require('fs').writeFileSync('result.txt','input')"];
 assert.equal(run(root,g,'produce').error,'WRITE_SCOPE_VIOLATION');assert.equal(frontier(root,g).nodes[0].status,'Failed');});
 fixture((root,g)=>{g.nodes[0].timeout_ms=30;g.nodes[0].run=[process.execPath,'-e','setTimeout(()=>{},5000)'];assert.equal(run(root,g,'produce').error,'ETIMEDOUT');});
});
test('paths, lock liveness and interrupted execution refuse silent retry',()=>fixture((root,g)=>{
 assert.throws(()=>within(root,'../outside'),/invalid/);
 fs.symlinkSync(os.tmpdir(),path.join(root,'escape'));assert.throws(()=>within(root,'escape/x'),/symlink/);
 const dir=path.join(root,'.ultra-build/runtime');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'writer.lock'),JSON.stringify({pid:process.pid,token:'test-token'}));
 assert.throws(()=>recoverLock(root,'wrong'),/identity/);assert.throws(()=>recoverLock(root,'test-token'),/alive/);
 fs.unlinkSync(path.join(dir,'writer.lock'));
 const v=frontier(root,g).nodes[0],base=path.join(root,'.ultra-build/state/trial/produce/attempts/0001');
 fs.mkdirSync(base,{recursive:true});fs.writeFileSync(path.join(base,'start.json'),JSON.stringify({input:v.input}));
 assert.equal(frontier(root,g).nodes[0].status,'Interrupted');
 assert.throws(()=>run(root,g,'produce',{retry:true}),/uncertain/);
 run(root,g,'produce',{retry:true,confirmUncertain:true});assert.equal(frontier(root,g).nodes[0].status,'Submitted');
}));
