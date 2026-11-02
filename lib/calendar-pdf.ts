import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
export type PlannerPayload = {months:Array<{key:string;title?:string;goals?:string;notes?:string;days:Record<string,{text:string;done:boolean}>}>;settings:{layout:'agenda'|'grid';paper:'A4'|'Letter';weekStart:number;blank:boolean;weekends:boolean};palette:Record<string,string>;name:string};
export function validPlanner(p:any):p is PlannerPayload {
 const str=(v:any,n:number)=>typeof v==='string'&&v.length<=n;
 return p&&str(p.name,500)&&p.settings&&['agenda','grid'].includes(p.settings.layout)&&['A4','Letter'].includes(p.settings.paper)&&[0,1].includes(p.settings.weekStart)&&typeof p.settings.blank==='boolean'&&typeof p.settings.weekends==='boolean'&&p.palette&&['paper','ink','mute','accent','soft'].every(k=>/^#[0-9a-f]{6}$/i.test(p.palette[k]))&&Array.isArray(p.months)&&p.months.length>0&&p.months.length<=12&&p.months.every((m:any)=>m&&/^\d{4}-(0[1-9]|1[0-2])$/.test(m.key)&&+m.key.slice(0,4)>=2000&&+m.key.slice(0,4)<=2101&&['title','goals','notes'].every(k=>m[k]===undefined||str(m[k],6000))&&m.days&&typeof m.days==='object'&&!Array.isArray(m.days)&&Object.entries(m.days).length<=31&&Object.entries(m.days).every(([day,v]:[string,any])=>/^(0[1-9]|[12]\d|3[01])$/.test(day)&&+day<=new Date(+m.key.slice(0,4),+m.key.slice(5),0).getDate()&&v&&str(v.text,1200)&&typeof v.done==='boolean'));
}
function color(hex:string){return rgb(parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255)}
function blend(a:string,b:string,t:number){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('')}
export function wrapText(text:string,font:PDFFont,size:number,width:number):string[]{
 const lines:string[]=[];
 for(const para of text.replace(/\r/g,'').replace(/\t/g,'  ').split('\n')){
  if(!para.trim()){lines.push('');continue}let line='';
  for(const word of para.trim().split(/\s+/)){
   const candidate=line?line+' '+word:word;
   if(font.widthOfTextAtSize(candidate,size)<=width){line=candidate;continue}
   if(line){lines.push(line);line=''}
   if(font.widthOfTextAtSize(word,size)<=width){line=word;continue}
   for(const char of word){if(line&&font.widthOfTextAtSize(line+char,size)>width){lines.push(line);line=char}else line+=char}
  }
  lines.push(line);
 }
 return lines;
}
export async function makeCalendarPdf(p:PlannerPayload,fontBytes:Uint8Array){
 if(!validPlanner(p))throw Error('Invalid calendar export options.');
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const body=await pdf.embedFont(fontBytes,{subset:true}),yearFont=await pdf.embedFont(StandardFonts.TimesRomanBold),monthFont=await pdf.embedFont(StandardFonts.TimesRomanItalic);
 const supported=new Set(body.getCharacterSet());const check=(s:string)=>{for(const c of s)if(!['\n','\r','\t'].includes(c)&&!supported.has(c.codePointAt(0)!))throw Error('Some characters need browser printing. Please use Print, then Save as PDF, to preserve all your text.');return s};
 const [W,H]=p.settings.paper==='A4'?[595.28,841.89]:[612,792],margin=35,width=W-2*margin;
 const palette=p.palette,ink=color(palette.ink),mute=color(palette.mute),accent=color(palette.accent),line=color(blend(palette.paper,palette.ink,.20));
 const details:Array<{heading:string;lines:string[]}>=[];
 function fresh(){const page=pdf.addPage([W,H]);page.drawRectangle({x:0,y:0,width:W,height:H,color:color(palette.paper)});return page}
 function text(page:any,value:string,x:number,y:number,size=9,font=body,c=ink){page.drawText(check(value),{x,y,size,font,color:c})}
 function rule(page:any,x:number,y:number,w:number){page.drawLine({start:{x,y},end:{x:x+w,y},thickness:.4,color:line})}
 const footer=(page:any,label:string)=>{text(page,p.name+"'s studyverse",margin,25,7,body,mute);const size=6;page.drawText(label,{x:W-margin-body.widthOfTextAtSize(label,size),y:25,size,font:body,color:mute})};
 for(const m of p.months){const page=fresh(),year=m.key.slice(0,4),month=new Date(+year,+m.key.slice(5)-1,1).toLocaleDateString('en',{month:'long'}),days=new Date(+year,+m.key.slice(5),0).getDate(),caption=m.title||'MAKE TIME FOR WHAT MATTERS';
 const ys=112,yw=yearFont.widthOfTextAtSize(year,ys);page.drawText(year,{x:(W-yw)/2,y:H-117,size:ys,font:yearFont,color:color(palette.soft)});const ms=43,mw=monthFont.widthOfTextAtSize(month,ms);page.drawText(month,{x:(W-mw)/2,y:H-97,size:ms,font:monthFont,color:ink});
 const titleLines=wrapText(check(caption),body,7.5,width);titleLines.slice(0,2).forEach((l,i)=>text(page,l,(W-body.widthOfTextAtSize(l,7.5))/2,H-134-i*10,7.5,body,mute));
 const top=H-170,bottom=150;const visible:(day:number,x:number,y:number,w:number,h:number,grid:boolean)=>void=(day,x,y,w,h,grid)=>{const key=String(day).padStart(2,'0'),v=m.days[key],date=new Date(+year,+m.key.slice(5)-1,day),weekend=[0,6].includes(date.getDay());if(p.settings.weekends&&weekend)page.drawRectangle({x,y:y-h,width:w,height:h,color:color(blend(palette.paper,palette.soft,.35))});
 text(page,String(day),x+6,y-12,8.5);if(!grid)text(page,date.toLocaleDateString('en',{weekday:'short'}).toUpperCase(),x+28,y-12,6,body,mute);
 if(v?.text&&!p.settings.blank){const entry=check(v.text),tx=grid?x+6:x+66,tw=grid?w-12:w-125,max=grid?Math.max(1,Math.floor((h-24)/10)):1,lines=wrapText(entry,body,8,tw);lines.slice(0,max).forEach((l,i)=>text(page,l,tx,y-(grid?26:12)-i*10,8,body,v.done?mute:ink));if(v.done)text(page,'✓',x+w-12,y-12,8,body,accent);if(lines.length>max){details.push({heading:`${month} ${day}, ${year}${v.done?' - completed':''}`,lines:wrapText(entry,body,10,width-10)});text(page,'+ details',x+w-(grid?35:47),y-h+3,5.5,body,mute)}}};
 if(p.settings.layout==='agenda'){text(page,'DAY',margin+6,top+10,6,body,mute);text(page,'A LITTLE PLAN FOR A BIG DREAM',margin+66,top+10,6,body,mute);rule(page,margin,top,width);const h=(top-bottom)/days;for(let day=1;day<=days;day++){const y=top-(day-1)*h;visible(day,margin,y,width,h,false);rule(page,margin,y-h,width)}}else{const offset=(new Date(+year,+m.key.slice(5)-1,1).getDay()-p.settings.weekStart+7)%7,rows=Math.ceil((days+offset)/7),w=width/7,h=(top-bottom)/rows;for(let i=0;i<7;i++){const name=['SUN','MON','TUE','WED','THU','FRI','SAT'][(i+p.settings.weekStart)%7];text(page,name,margin+i*w+(w-body.widthOfTextAtSize(name,6))/2,top+12,6,body,mute)}for(let i=0;i<rows*7;i++){const x=margin+(i%7)*w,y=top-Math.floor(i/7)*h,day=i-offset+1;if(day>0&&day<=days)visible(day,x,y,w,h,true);page.drawRectangle({x,y:y-h,width:w,height:h,borderWidth:.4,borderColor:line})}}
 for(const [i,label,k]of [[0,'MONTHLY INTENTIONS','goals'],[1,'NOTES & LITTLE REMINDERS','notes']]as const){const x=margin+i*(width/2+10),w=width/2-10;text(page,label,x,124,6.5,body,mute);for(let n=0;n<3;n++)rule(page,x,102-n*16,w);const value=p.settings.blank?'':m[k]||'',lines=wrapText(check(value),body,8,w-5);lines.slice(0,3).forEach((l,n)=>text(page,l,x,106-n*16,8));if(lines.length>3)details.push({heading:`${month} ${year} - ${label.toLowerCase()}`,lines:wrapText(value,body,10,width-10)})}
 footer(page,'ONE DAY AT A TIME');
 }
 if(details.length){let page=fresh(),y=H-70;text(page,'Your plans, with room to breathe.',margin,y,21,monthFont);y-=35;text(page,'Full text of entries that need a little more space.',margin,y,9,body,mute);y-=32;for(const section of details){if(y<100){footer(page,'PLANNER DETAILS');page=fresh();y=H-55}text(page,section.heading,margin,y,11,body,accent);y-=22;for(const lineText of section.lines){if(y<55){footer(page,'PLANNER DETAILS');page=fresh();y=H-55;text(page,section.heading+' (continued)',margin,y,10,body,accent);y-=22}text(page,lineText,margin,y,10);y-=14}y-=20}footer(page,'PLANNER DETAILS')}
 pdf.setTitle('Studyverse monthly planner');pdf.setAuthor('Studyverse');pdf.setSubject('Portrait calendar planner');return pdf.save();
}
