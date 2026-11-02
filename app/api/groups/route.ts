import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store, private'}});
const str=(v:any,n:number)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=n;
const db=()=>env.DB!;
function dateKey(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})}
function logDate(s:string){if(typeof s!=='string')return '';if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:''}
export function dailyMinutes(data:string|null,date:string){try{const logs=JSON.parse(data||'{}').focus;return Math.min(1440,(Array.isArray(logs)?logs:[]).reduce((n,l)=>n+(l&&logDate(l.studyDate||l.date||'')===date&&Number.isFinite(l.minutes)&&l.minutes>0?l.minutes:0),0))}catch{return 0}}
export async function GET(request:Request){const user=await getChatGPTUser();if(!user)return json({error:'Sign in to view study groups.'},401);
 try{const groups=await db().prepare('SELECT g.id, g.name, g.description, g.daily_goal, g.owner_id, (SELECT COUNT(*) FROM study_members x WHERE x.group_id=g.id) AS member_count FROM study_groups g JOIN study_members m ON m.group_id=g.id WHERE m.user_id=? ORDER BY g.created_at DESC').bind(user.userId).all<any>();
 const id=new URL(request.url).searchParams.get('group');let selected=null;
 if(id){const mine=await db().prepare('SELECT * FROM study_members WHERE group_id=? AND user_id=?').bind(id,user.userId).first<any>();if(!mine)return json({error:'You are not a member of this group.'},403);
 const group=await db().prepare('SELECT * FROM study_groups WHERE id=?').bind(id).first<any>();if(!group)return json({error:'Group not found.'},404);
 const date=dateKey(),[year,month,day]=date.split('-');
 const rows=await db().prepare(`SELECT m.member_id,m.display_name,m.share_time,m.focusing,m.heartbeat,m.user_id,
 CASE WHEN m.share_time=1 THEN (SELECT SUM(CASE WHEN json_type(l.value,'$.minutes') IN ('integer','real') AND json_extract(l.value,'$.minutes')>0 THEN MIN(1440,json_extract(l.value,'$.minutes')) ELSE 0 END)
 FROM trackers t,json_each(t.data,'$.focus') l WHERE t.user_id=m.user_id AND COALESCE(json_extract(l.value,'$.studyDate'),json_extract(l.value,'$.date')) IN (?,?,?)) ELSE NULL END AS total_minutes
 FROM study_members m WHERE m.group_id=? ORDER BY m.joined_at`).bind(date,`${Number(day)}/${Number(month)}/${year}`,`${day}/${month}/${year}`,id).all<any>();
 const members=rows.results.map(m=>({id:m.member_id,name:m.display_name,isMe:m.user_id===user.userId,isOwner:m.user_id===group.owner_id,sharing:!!m.share_time,minutes:m.share_time?Math.round(Math.min(1440,Math.max(0,Number(m.total_minutes)||0))*100)/100:null,focusing:!!m.share_time&&!!m.focusing&&!!m.heartbeat&&Date.now()-Date.parse(m.heartbeat)<90000}));
 members.sort((a,b)=>(b.minutes??-1)-(a.minutes??-1));selected={id:group.id,name:group.name,description:group.description,dailyGoal:group.daily_goal,isOwner:group.owner_id===user.userId,inviteCode:group.owner_id===user.userId?group.invite_code:null,date,timeZone:'Asia/Kolkata',members,mySettings:{name:mine.display_name,sharing:!!mine.share_time}}}
 return json({groups:groups.results.map(g=>({id:g.id,name:g.name,description:g.description,dailyGoal:g.daily_goal,isOwner:g.owner_id===user.userId,memberCount:g.member_count})),selected});
 }catch{return json({error:'Could not load groups. Please retry.'},503)}}
export async function POST(request:Request){const user=await getChatGPTUser();if(!user)return json({error:'Sign in to manage groups.'},401);
 if(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('X-Studyverse-Request')!=='1')return json({error:'Invalid request origin.'},403);
 let b:any;try{const raw=await request.text();if(raw.length>8000)return json({error:'Request too large.'},413);b=JSON.parse(raw);if(!b||typeof b!=='object')throw Error()}catch{return json({error:'Invalid request.'},400)}
 try{const now=new Date().toISOString();
 if(b.action==='presence'){if(typeof b.focusing!=='boolean')return json({error:'Invalid focus status.'},400);await db().prepare('UPDATE study_members SET focusing=?, heartbeat=? WHERE user_id=?').bind(b.focusing?1:0,now,user.userId).run();return json({ok:true})}
 if(b.action==='create'||b.action==='join'){
 if(!str(b.displayName,60)||typeof b.sharing!=='boolean')return json({error:'Choose a nickname and sharing preference.'},400);
 const count=await db().prepare('SELECT COUNT(*) AS n FROM study_members WHERE user_id=?').bind(user.userId).first<any>();if(count.n>=10)return json({error:'You can join up to 10 groups. Leave one first.'},400);
 if(b.action==='create'){if(!str(b.name,80)||typeof b.description!=='string'||b.description.length>500||!Number.isInteger(b.dailyGoal)||b.dailyGoal<15||b.dailyGoal>1440)return json({error:'Choose a group name and a daily goal from 15 to 1440 minutes.'},400);
 const owned=await db().prepare('SELECT COUNT(*) AS n FROM study_groups WHERE owner_id=?').bind(user.userId).first<any>();if(owned.n>=5)return json({error:'You can create up to five groups.'},400);
 const id=crypto.randomUUID(),code=Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
 await db().batch([db().prepare('INSERT INTO study_groups (id,name,description,owner_id,invite_code,daily_goal,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,b.name.trim(),b.description.trim(),user.userId,code,b.dailyGoal,now),db().prepare('INSERT INTO study_members (group_id,user_id,member_id,display_name,share_time,joined_at) VALUES (?,?,?,?,?,?)').bind(id,user.userId,crypto.randomUUID(),b.displayName.trim(),b.sharing?1:0,now)]);return json({groupId:id},201)}
 if(!str(b.code,32))return json({error:'Enter an invite code.'},400);const group=await db().prepare('SELECT id FROM study_groups WHERE invite_code=?').bind(b.code.replace(/[\s-]/g,'').toUpperCase()).first<any>();if(!group)return json({error:'Invite code not found. Check it with the group owner.'},404);
 const existing=await db().prepare('SELECT member_id FROM study_members WHERE group_id=? AND user_id=?').bind(group.id,user.userId).first();if(existing)return json({groupId:group.id});
 const r=await db().prepare('INSERT INTO study_members (group_id,user_id,member_id,display_name,share_time,joined_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM study_members WHERE group_id=?)<100 ON CONFLICT(group_id,user_id) DO NOTHING').bind(group.id,user.userId,crypto.randomUUID(),b.displayName.trim(),b.sharing?1:0,now,group.id).run();if(!r.meta.changes)return json({error:'This group is full. Groups support 100 members.'},409);return json({groupId:group.id},201)}
 if(!str(b.groupId,100))return json({error:'Choose a group.'},400);
 const group=await db().prepare('SELECT * FROM study_groups WHERE id=?').bind(b.groupId).first<any>(),mine=await db().prepare('SELECT member_id FROM study_members WHERE group_id=? AND user_id=?').bind(b.groupId,user.userId).first<any>();if(!group||!mine)return json({error:'You are not a member of this group.'},403);
 if(b.action==='videoRoom'){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('studyverse-video-v1:'+group.id+':'+group.invite_code));
 const roomName='Studyverse'+Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
 const member=await db().prepare('SELECT display_name FROM study_members WHERE group_id=? AND user_id=?').bind(b.groupId,user.userId).first<any>();
 return json({roomName,displayName:member?.display_name||'Study friend',groupName:group.name});
 }
 if(b.action==='settings'){if(!str(b.displayName,60)||typeof b.sharing!=='boolean')return json({error:'Choose a nickname and sharing preference.'},400);await db().prepare('UPDATE study_members SET display_name=?,share_time=?,focusing=CASE WHEN ?=0 THEN 0 ELSE focusing END WHERE group_id=? AND user_id=?').bind(b.displayName.trim(),b.sharing?1:0,b.sharing?1:0,b.groupId,user.userId).run();return json({ok:true})}
 if(b.action==='leave'){if(group.owner_id===user.userId)return json({error:'As owner, delete the group instead of leaving it.'},400);await db().prepare('DELETE FROM study_members WHERE group_id=? AND user_id=?').bind(b.groupId,user.userId).run();return json({ok:true})}
 if(group.owner_id!==user.userId)return json({error:'Only the group owner can do that.'},403);
 if(b.action==='remove'){if(!str(b.memberId,100))return json({error:'Choose a member.'},400);await db().prepare('DELETE FROM study_members WHERE group_id=? AND member_id=? AND user_id<>?').bind(b.groupId,b.memberId,user.userId).run();return json({ok:true})}
 if(b.action==='delete'){await db().prepare('DELETE FROM study_groups WHERE id=? AND owner_id=?').bind(b.groupId,user.userId).run();return json({ok:true})}
 if(b.action==='rotate'){const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();await db().prepare('UPDATE study_groups SET invite_code=? WHERE id=? AND owner_id=?').bind(code,b.groupId,user.userId).run();return json({ok:true})}
 return json({error:'Unknown group action.'},400);
 }catch{return json({error:'Could not update the group. Please retry.'},503)}}
