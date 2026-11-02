function show(t){
  if(t!=='f')stopAmbient();if(t===st.tab){render();return} st.tab=t;save();render();scrollTo(0,0);return;
  const w=$('wipe');
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){st.tab=t;save();render(true);return}
  w.classList.remove('go');void w.offsetWidth;w.classList.add('go');
  setTimeout(()=>{st.tab=t;save();render(true);scrollTo(0,0)},470);
  setTimeout(()=>w.classList.remove('go'),1000);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,d=b.dataset,s=st.subs[st.cur]||st.subs[0]; if(!["tab","gosub","sub"].includes(a))checkpoint();
  if(a==='tab'){armed='';show(d.v);if(d.v==='g')loadStudyGroups();return}
  if(a==='gosub'){st.cur=+d.i;show('s');return}
  if(a==='sub'){st.cur=+d.i;armed=''}
  else if(a==='tick'){const c=s.ch[+d.c],v=c.d,wasComplete=s.ch.length>0&&s.ch.every(x=>x.d.every(Boolean)),oldRank=ranks.filter(r=>pct(dashboardSubjects().flatMap(x=>x.subject.ch))>=r[0]).length-1;v[+d.k]=v[+d.k]?0:1;c.dates=c.dates||[null,null,null];c.dates[+d.k]=v[+d.k]?studyToday():null;last=d.c+'-'+d.k;celebrateProgress(wasComplete,oldRank,st.cur)}
  else if(a==='delch')s.ch.splice(+d.c,1);
  else if(a==='addch'){const v=b.previousElementSibling.value.trim();if(!v)return;s.ch.push({n:v,d:[0,0,0],...($('taxSectionFilter')&&['direct','indirect'].includes(taxChapterView)?{taxSection:taxChapterView}:{})})}
  else if(a==='addsub'){st.subs.push({n:'New subject',ch:[]});st.cur=st.subs.length-1}
  else if(a==='delsub'){if(armed!=='s')armed='s';else{if(st.subs.length>1){st.subs.splice(st.cur,1);st.cur=0}armed=''}}
  else if(a==='addlist')st.lists.push({t:'New list',items:[]});
  else if(a==='dellist'){if(armed!=='l'+d.l)armed='l'+d.l;else{st.lists.splice(+d.l,1);armed=''}}
  else if(a==='aitem'){const v=b.previousElementSibling.value.trim();if(!v)return;st.lists[+d.l].items.push({x:v,d:0})}
  else if(a==='titem'){const it=st.lists[+d.l].items[+d.i];it.d=it.d?0:1;last='t'+d.l+'-'+d.i}
  else if(a==='ditem')st.lists[+d.l].items.splice(+d.i,1);
  else return;
  save();render();
});
document.addEventListener('focusout',e=>{
  const t=e.target,d=t.dataset;if(!d||!d.e)return;checkpoint();const v=t.textContent.trim().slice(0,500);
  if(d.e==='ch')st.subs[st.cur].ch[+d.c].n=v||'Untitled';
  else if(d.e==='sub')st.subs[st.cur].n=v||'Subject';
  else if(d.e==='name')st.name=v||'Pirate';
  else if(d.e==='lt')st.lists[+d.l].t=v||'List';
  else if(d.e==='li')st.lists[+d.l].items[+d.i].x=v;
  save();
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;const t=e.target;
  if(t.isContentEditable){e.preventDefault();t.blur()}
  else if(t.dataset&&'add' in t.dataset)t.nextElementSibling.click();
  else if(t.classList.contains('photo'))$('pf').click();
});
document.addEventListener('change',e=>{
  if(e.target.id!=='pf'||!e.target.files[0])return;
  if(!e.target.files[0].type.startsWith('image/'))return notify('Choose an image file.');if(e.target.files[0].size>10*1024*1024)return notify('Choose an image smaller than 10 MB.');checkpoint();const r=new FileReader();r.onerror=()=>notify('Could not read that image.');
  r.onload=()=>{const im=new Image();im.onload=()=>{
    const c=document.createElement('canvas');c.width=240;c.height=290;
    const x=c.getContext('2d'),k=Math.max(240/im.width,290/im.height),w=im.width*k,h=im.height*k;
    x.drawImage(im,(240-w)/2,(290-h)/2,w,h);st.photo=c.toDataURL('image/jpeg',.82);save();render()};
    im.onerror=()=>notify("That image could not be opened.");im.src=r.result};
  r.readAsDataURL(e.target.files[0]);
});
