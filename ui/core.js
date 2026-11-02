const KEY='grand-line-v2',LAB=['Study','Rev 1','Rev 2'];
const seed=[
['Cost & Management Accounting',['Material Cost','Employee Cost & Direct Expenses','Overheads – Absorption Costing','Activity Based Costing','Cost Sheet','Cost Accounting Systems','Unit & Batch Costing','Job Costing','Process & Operation Costing','Joint Products & By-Products','Service Costing','Standard Costing','Marginal Costing','Budget & Budgetary Control']],
['Auditing & Ethics',['Nature, Objective & Scope of Audit','Audit Strategy, Planning & Programme','Risk Assessment & Internal Control','Audit Evidence','Audit of Items of Financial Statements','Audit Documentation','Completion & Review','Audit Report','Company Audit','Audit of Banks','Ethics & Terms of Audit Engagements']],
['FM & Strategic Management',['FM – Scope & Objectives','FM – Types of Financing','FM – Ratio Analysis','FM – Cost of Capital','FM – Capital Structure','FM – Leverages','FM – Investment Decisions','FM – Working Capital','SM – Introduction','SM – Competitive Strategy','SM – Strategic Management Process','SM – Corporate Level Strategies','SM – Business Level Strategies','SM – Functional Level Strategies','SM – Leadership & Organisation','SM – Implementation & Control']]];
const ranks=[[0,'Cabin Boy'],[10,'Rookie Pirate'],[30,'Rising Supernova'],[55,'Warlord of the Sea'],[80,'Yonko'],[100,'Pirate King']];
// Match the subject name rather than its position in the tracker.
function subjectIcon(name){
  const n=String(name||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const rules=[
    [/\b(audit|auditing|assurance)\b/,'🔍'],
    [/\b(tax|taxation|taxes|gst|dt|idt)\b/,'🧾'],
    [/\b(law|laws|legal|jurisprudence)\b/,'⚖️'],
    [/\b(cost|costing|costs|cma)\b/,'🧮'],
    [/\b(accounts?|accounting|accountancy|financial reporting|fr)\b/,'📒'],
    [/\b(finance|financial management|fm|afm|sfm|investment|investments)\b/,'📈'],
    [/\b(economics|economy)\b/,'🌐'],
    [/\b(strategy|strategic|management|business|sm)\b/,'🎯'],
    [/\b(maths?|mathematics|statistics|quantitative)\b/,'🔢'],
    [/\b(computer|computers|computing|technology|programming|coding|it|eis)\b/,'💻'],
    [/\b(biology|botany|zoology)\b/,'🧬'],
    [/\b(chemistry)\b/,'🧪'],
    [/\b(physics)\b/,'⚛️'],
    [/\b(science)\b/,'🔬'],
    [/\b(history)\b/,'🏛️'],
    [/\b(geography)\b/,'🌍'],
    [/\b(english|hindi|language|literature|communication)\b/,'✍️']
  ];
  return rules.find(([pattern])=>pattern.test(n))?.[1]||'📚';
}
let st=load(),last='',armed='';
function load(){try{const r=localStorage.getItem(KEY);if(r){const o=JSON.parse(r);if(validState(o))return o}}catch(e){}
return{name:'Student',photo:'',tab:'v',cur:0,subs:seed.map(([n,c])=>({n,ch:c.map(x=>({n:x,d:[0,0,0]}))})),lists:[{t:'My test series',items:[]}]}}
function save(){try{if(cloudUser)cacheCloud();else localStorage.setItem(KEY,JSON.stringify(st))}catch{notify('Device storage unavailable. Keep a backup.')}queueCloud()}

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=ch=>{const t=ch.length*3;return t?Math.round(ch.reduce((a,c)=>a+c.d.reduce((x,y)=>x+y,0),0)/t*100):0};
const rank=p=>ranks.filter(r=>p>=r[0]).pop()[1];
const cnt=(ch,k)=>ch.filter(c=>c.d[k]).length;
const money=p=>st.theme==='pirate'?'฿ '+(p*30000000).toLocaleString('en-IN'):Math.round(p*100).toLocaleString('en-IN')+' XP';

function render(anim){
  document.body.dataset.section=st.tab;
  const visibleSubjects=dashboardSubjects();
  if(st.tab==='s'&&visibleSubjects.length&&!visibleSubjects.some(x=>x.index===st.cur))st.cur=visibleSubjects[0].index;
  const all=visibleSubjects.flatMap(x=>x.subject.ch),P=pct(all);
  $('rk').textContent=rank(P);$('pp').textContent=P+'% of the voyage sailed';
  $('ship').style.left=P+'%';$('ship').style.transform='translateX(-'+P+'%)';
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===st.tab));
  const oldSearch=$('chapterSearch')?.value||'',oldFilter=$('chapterFilter')?.value||'all';const pg=$('page');
  pg.innerHTML=st.tab==='v'?voyage(all,P):st.tab==='s'?syllabus():st.tab==='t'?tests():st.tab==='f'?focusView():st.tab==='g'?groupsView():st.tab==='c'?calendarView():studio();
  last=''; updateExtras();if($('currentNavLabel'))$('currentNavLabel').textContent=({v:'Dashboard',s:'Syllabus',t:'Tests & goals',c:'Calendar',f:'Study timer',g:'Study groups',a:'Theme studio'})[st.tab]||'Dashboard';if($('chapterSearch')){$('chapterSearch').value=oldSearch;$('chapterFilter').value=oldFilter;filterChapters()}
  if(anim){pg.classList.remove('in');void pg.offsetWidth;pg.classList.add('in')}
}
