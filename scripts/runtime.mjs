#!/usr/bin/env node
// Portable alpha CLI; all data belongs to --project, code stays in this package.
// Node >=18, no dependencies. See references/runtime-trial.md.
// Trusted-local only: no authenticated actors, OS sandbox or multi-machine scheduler.
import fs from 'node:fs';
import path from 'node:path';
import {VERSION,within,validate,frontier,run,review,verify,approve,runReady,recoverLock} from './runtime/kernel.mjs';
const args=process.argv.slice(2),command=args[0];
const boolean=new Set(['--retry','--confirm-uncertain','--confirm']);
const flags=new Map();
try {
 for(let i=1;i<args.length;i++){
  const key=args[i];
  if(!['--project','--graph','--node','--evidence','--actor','--lock-token',...boolean].includes(key)||flags.has(key))throw Error('unknown or duplicate option: '+key);
  if(boolean.has(key))flags.set(key,true);
  else {if(!args[i+1]||args[i+1].startsWith('--'))throw Error('missing value: '+key);flags.set(key,args[++i]);}
 }
 function required(key){if(!flags.has(key))throw Error('required '+key);return flags.get(key);}
 if(command==='--version'||command==='version'){console.log(VERSION);}
 else if(command==='help'||command==='--help'||!command)console.log('runtime init|frontier|run|run-ready|resume|review|verify|approve|recover-lock --project <root> --graph <relative.json> [--node <id>]. See references/runtime-trial.md');
 else {
  const root=fs.realpathSync(required('--project'));let result;
  if(command==='recover-lock')result=recoverLock(root,required('--lock-token'));
  else {
   const graphPath=required('--graph'),g=JSON.parse(fs.readFileSync(within(root,graphPath),'utf8'));validate(g);
   if(command==='init') {
    const control=within(root,'.ultra-build');fs.mkdirSync(control,{recursive:true});
    const ignore=within(root,'.ultra-build/.gitignore');
    if(!fs.existsSync(ignore))fs.writeFileSync(ignore,'runtime/\n',{flag:'wx'});
    const dir=within(root,'.ultra-build/state/'+g.id);fs.mkdirSync(dir,{recursive:true});
    const task=within(root,'.ultra-build/state/'+g.id+'/task.json');
    if(fs.existsSync(task)&&JSON.parse(fs.readFileSync(task,'utf8')).current?.graph!==graphPath)throw Error('task ID already bound to another graph path');
    if(!fs.existsSync(task))fs.writeFileSync(task,JSON.stringify({version:2,task_id:g.id,current:{graph:graphPath},status:'unverified'},null,2)+'\n',{flag:'wx'});
    result=frontier(root,g);
   } else if(command==='frontier')result=frontier(root,g);
   else if(command==='run')result=run(root,g,required('--node'),{retry:flags.has('--retry'),confirmUncertain:flags.has('--confirm-uncertain')});
   else if(command==='run-ready'||command==='resume')result=runReady(root,g);
   else if(command==='verify')result=verify(root,g,required('--node'));
   else if(command==='review')result=review(root,g,required('--node'),JSON.parse(fs.readFileSync(within(root,required('--evidence')),'utf8')));
   else if(command==='approve')result=approve(root,g,required('--node'),{actor:required('--actor'),evidence:required('--evidence'),confirm:flags.has('--confirm')});
   else throw Error('unknown command');
  }
  console.log(JSON.stringify(result,null,2));
  if(command==='run'&&(result.exit_code!==0||result.error))process.exitCode=1;
  if(command==='verify'&&result.nodes.some(n=>n.id===flags.get('--node')&&n.status==='GateFailed'))process.exitCode=1;
 }
} catch(error){console.error(JSON.stringify({error:error.message}));process.exitCode=1;}
