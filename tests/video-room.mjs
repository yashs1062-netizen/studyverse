import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
let clock=0,requests=0,connections=0,disposed=0,resolveRoom;
const els=new Map(),timers=[];
function element(){return {disabled:false,close(){},showModal(){},setAttribute(){},addEventListener(){},focus(){},remove(){for(const [id,value]of els)if(value===this||this.childIds?.includes(id))els.delete(id)},set innerHTML(html){this.html=html;this.childIds=[];for(const [,id]of html.matchAll(/id="([^"]+)"/g)){const child=element();els.set(id,child);this.childIds.push(id)}},get innerHTML(){return this.html}}}
const document={createElement:element,body:{appendChild(el){els.set(el.id,el)}},head:{appendChild(){throw Error('Provider script must not load before click three')}}};
const room={roomName:'Studyverse'+'a'.repeat(64),displayName:'Student'};
const ctx={document,$:id=>els.get(id),esc:String,groupData:{selected:{id:'group-a',name:'Revision crew'}},notify(){},stopAmbient(){},window:{addEventListener(){}},Date:{now:()=>clock},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},setInterval(){return 1},clearInterval(){},groupRequest:async()=>{requests++;return room},JitsiMeetExternalAPI:function(domain,options){assert.equal(domain,'meet.jit.si');assert.equal(options.configOverwrite.prejoinConfig.enabled,false);connections++;this.addListener=()=>{};this.dispose=()=>{disposed++}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('ui/views/video-room.js','utf8'),ctx);
ctx.beginGroupVideo();assert.equal(requests,0);ctx.reviewGroupVideo();assert.equal(requests,0);clock+=700;ctx.reviewGroupVideo();assert.equal(requests,0);assert.equal(connections,0);
await ctx.joinGroupVideo();assert.equal(requests,0,'Rapid accidental click cannot bypass final gate');clock+=700;await ctx.joinGroupVideo();assert.equal(requests,1);assert.equal(connections,1);assert(els.has('groupVideoPanel'));
ctx.leaveGroupVideo();assert.equal(disposed,1);assert(!els.has('groupVideoPanel'));
await ctx.joinGroupVideo();assert.equal(connections,1,'Leaving resets all join steps');
ctx.beginGroupVideo();clock+=700;ctx.reviewGroupVideo();ctx.closeVideoJoin();clock+=700;await ctx.joinGroupVideo();assert.equal(connections,1,'Cancel prevents connections');
ctx.groupRequest=()=>new Promise(resolve=>{resolveRoom=resolve});ctx.beginGroupVideo();clock+=700;ctx.reviewGroupVideo();clock+=700;const pending=ctx.joinGroupVideo();ctx.leaveGroupVideo();resolveRoom(room);await pending;assert.equal(connections,1,'A late network response cannot reconnect after Leave');
console.log('PASS: three deliberate steps, rapid-click guard, no early provider/media access, immediate disposal, cancellation and late-response race.');
