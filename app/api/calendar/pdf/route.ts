import { getChatGPTUser } from '../../../chatgpt-auth';
import { makeCalendarPdf, validPlanner } from '../../../../lib/calendar-pdf';
import fontBase64 from '../../../../assets/fonts/planner-font.txt?raw';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const json=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
 if(!await getChatGPTUser())return json('Please sign in to export your calendar.',401);
 if(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('X-Studyverse-Request')!=='1')return json('Invalid request origin.',403);
 try{const raw=await request.text();if(new TextEncoder().encode(raw).length>2000000)return json('Calendar export is too large. Export fewer months.',413);const payload=JSON.parse(raw);if(!validPlanner(payload))return json('Invalid calendar export options.',400);const font=Uint8Array.from(atob(fontBase64.trim()),c=>c.charCodeAt(0));const bytes=await makeCalendarPdf(payload,font);return new Response(bytes as unknown as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="studyverse-calendar.pdf"','Cache-Control':'no-store, private'}})}catch(e){return json(e instanceof Error&&e.message.includes('browser printing')?e.message:'Could not create this PDF. Try Print, then Save as PDF.',422)}
}
