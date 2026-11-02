let taxChapterView='all';
function taxChapterSection(chapter){
  if(['direct','indirect'].includes(chapter.taxSection))return chapter.taxSection;
  if(/\b(gst|indirect tax|idt)\b/i.test(chapter.n))return 'indirect';
  if(/\b(income[ -]?tax|direct tax|dt)\b/i.test(chapter.n))return 'direct';
  return 'other';
}
function taxSectionSelector(subject){
  if(caInterPaper(subject)?.id!==3)return '';
  return `<label class="taxSectionLabel">Taxation section<select id="taxSectionFilter" onchange="taxChapterView=this.value;filterChapters()"><option value="all" ${taxChapterView==='all'?'selected':''}>All Taxation chapters</option><option value="direct" ${taxChapterView==='direct'?'selected':''}>Direct Tax · Income Tax</option><option value="indirect" ${taxChapterView==='indirect'?'selected':''}>Indirect Tax · GST</option>${subject.ch.some(c=>taxChapterSection(c)==='other')?`<option value="other" ${taxChapterView==='other'?'selected':''}>Other / unclassified chapters</option>`:''}</select></label>`;
}
function syllabus(){
  if(!dashboardSubjects().length)return `<section class="card"><h2>${selectedGroupLabel()}</h2><p>No subjects in this group. Select the group again on Dashboard to add its subjects.</p><button class="go" onclick="show('v')">Go to Dashboard</button></section>`;
  const s=st.subs[st.cur]||st.subs[0];
  return `<p class="hint" style="margin-top:20px">${selectedGroupLabel()} · Change the group on Dashboard.</p><div class="pills">${dashboardSubjects().map(({subject:x,index:i})=>`<button class="pill" data-a="sub" data-i="${i}" aria-pressed="${i===st.cur}">${esc(x.n)} · ${pct(x.ch)}%</button>`).join('')}<button class="ghost pill" data-a="addsub">+ Add subject</button></div>
  <div class="card"><div class="hdr"><h2 contenteditable="true" data-e="sub">${esc(s.n)}</h2><button class="ghost" data-a="delsub">${armed==='s'?'Tap again to remove':'Remove subject'}</button></div>
  <div class="bar"><i style="width:${pct(s.ch)}%"></i></div>
  ${group1SyllabusNote(s)}<p class="hint">Edit chapter names directly. Track study and each revision separately. Use Undo to reverse a change.</p>
  ${taxSectionSelector(s)}<div class="searchrow"><input id="chapterSearch" placeholder="Search chapters…" aria-label="Search chapters"><select id="chapterFilter" aria-label="Filter chapters"><option value="all">All chapters</option><option value="pending">Study pending</option><option value="revision">Needs revision</option><option value="complete">Fully completed</option></select></div><div id="emptySearch" class="hint" hidden>No chapters match your filters.</div><div class="row hd"><span></span>${LAB.map(l=>`<span>${l}</span>`).join('')}<span></span></div>
  ${s.ch.map((c,i)=>`<div class="row"><div class="chapterName"><span class="nm" contenteditable="true" data-e="ch" data-c="${i}">${esc(c.n)}</span><button class="revisionDateEdit" type="button" onclick="openRevisionDates(${st.cur},${i})">Completion dates</button></div>${c.d.map((v,k)=>`<button class="coin${v?' on':''}${last===i+'-'+k?' pop':''}" data-a="tick" data-c="${i}" data-k="${k}" aria-pressed="${!!v}" aria-label="${esc(c.n)} ${LAB[k]}">${v?'✓':''}</button>`).join('')}<button class="x" data-a="delch" data-c="${i}" aria-label="Remove chapter">×</button></div>`).join('')||'<p class="hint">No chapters yet. Add your first one below.</p>'}
  <div class="add"><input data-add placeholder="Add a chapter" aria-label="New chapter name"><button class="go" data-a="addch">Add chapter</button></div></div>`;
}
function tests(){
  return `<p class="hint" style="margin-top:1rem">Your own space: write anything (tests, papers, marks, goals) and tick it off yourself. Tap any text to edit it.</p>
  ${st.lists.map((L,l)=>`<div class="card"><div class="hdr"><h2 contenteditable="true" data-e="lt" data-l="${l}">${esc(L.t)}</h2><button class="ghost" data-a="dellist" data-l="${l}">${armed==='l'+l?'Tap again to delete':'Delete list'}</button></div>
  ${L.items.map((it,i)=>`<div class="it"><button class="coin${it.d?' on':''}${last==='t'+l+'-'+i?' pop':''}" data-a="titem" data-l="${l}" data-i="${i}" aria-pressed="${!!it.d}" aria-label="Tick">${it.d?'✓':''}</button><span class="tx${it.d?' done':''}" contenteditable="true" data-e="li" data-l="${l}" data-i="${i}">${esc(it.x)}</span><button class="x" data-a="ditem" data-l="${l}" data-i="${i}" aria-label="Remove">×</button></div>`).join('')||'<p class="hint">Empty. Write your first entry below.</p>'}
  <div class="add"><input data-add placeholder="e.g. MTP 1 – Auditing, 52/100" aria-label="New entry"><button class="go" data-a="aitem" data-l="${l}">Add</button></div></div>`).join('')}
  <div class="add"><button class="go" data-a="addlist">+ New list</button></div>`;
}
