import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import fs from 'node:fs';
const db = new DatabaseSync(':memory:');
db.exec(fs.readFileSync('drizzle/0000_blue_black_panther.sql','utf8'));
globalThis.testUser=null;
globalThis.testDB={prepare(sql){let values=[];return {bind(...v){values=v;return this},async first(){return db.prepare(sql).get(...values)||null},async run(){const r=db.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}}}}}};
let source=fs.readFileSync('app/api/tracker/route.ts','utf8')
 .replace("import { env } from 'cloudflare:workers';",'const env={DB:globalThis.testDB};')
 .replace("import { getChatGPTUser } from '../../chatgpt-auth';",'const getChatGPTUser=async()=>globalThis.testUser;')
 .replace("import { validTracker } from '../../../lib/tracker-validation';",fs.readFileSync('lib/tracker-validation.ts','utf8').replace('export function','function'));
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const api=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const state={name:'QA student',subs:[{n:'Accounting',ch:[{n:'Chapter 1',d:[1,0,0]}]}],lists:[]};
async function call(user,method='GET',body,extra={}){globalThis.testUser=user?{userId:user,email:user+'@example.test'}:null;return method==='GET'?api.GET():api.PUT(new Request('https://studyverse.test/api/tracker',{method,headers:{Origin:'https://studyverse.test','X-Studyverse-Request':'1','Content-Type':'application/json',...extra},body:JSON.stringify(body)}))}
assert.equal((await call(null)).status,401);
assert.equal((await call(null,'PUT',{state,revision:0})).status,401);
assert.equal((await (await call('a')).json()).state,null);
assert.equal((await call('a','PUT',{state,revision:0})).status,200);
let saved=await (await call('a')).json();assert.deepEqual(saved.state,state);assert.equal(saved.revision,1);
assert.equal((await (await call('b')).json()).state,null);
assert.equal((await call('a','PUT',{state,revision:0})).status,409);
state.subs[0].ch[0].d=[1,1,0];assert.equal((await call('a','PUT',{state,revision:1})).status,200);
assert.equal((await call('a','PUT',{state,revision:1})).status,409);
assert.equal((await call('a','PUT',{state:{},revision:2})).status,400);
assert.equal((await call('a','PUT',{state,revision:2},{Origin:'https://other.example'})).status,403);
assert.equal((await call('a','PUT',{state,revision:2},{'X-Studyverse-Request':''})).status,403);
saved=await (await call('a')).json();assert.equal(saved.revision,2);assert.deepEqual(saved.state.subs[0].ch[0].d,[1,1,0]);
assert.equal((await call('b','PUT',{state,revision:0})).status,200);
assert.equal((await (await call('a')).json()).revision,2);
state.calendars={'2026-12':{title:'My month',notes:'Rest',goals:'Revise',days:{'02':{text:'Costing mock',done:false}}}};assert.equal((await call('a','PUT',{state,revision:2})).status,200);assert.deepEqual((await (await call('a')).json()).state.calendars,state.calendars);
state.revisionPlan={rev1:1,rev2:7,dailyMinutes:120};state.subs[0].ch[0].dates=['2026-11-01',null,null];assert.equal((await call('a','PUT',{state,revision:3})).status,200);state.subs[0].ch[0].dates=['2026-02-30',null,null];assert.equal((await call('a','PUT',{state,revision:4})).status,400);
console.log('PASS: real route handlers with SQLite: auth required, account isolation, save/load, optimistic conflicts, validation, origin checks.');
