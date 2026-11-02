export function validTracker(o: any): boolean {
  const str = (v: any, max = 500) => typeof v === 'string' && v.length <= max;
  const validDay=(v:any)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;};
  const plan=o?.revisionPlan;const validPlan=plan===undefined||!!plan&&Number.isInteger(plan.rev1)&&plan.rev1>=1&&plan.rev1<=60&&Number.isInteger(plan.rev2)&&plan.rev2>=1&&plan.rev2<=90&&Number.isInteger(plan.dailyMinutes)&&plan.dailyMinutes>=15&&plan.dailyMinutes<=1440;
  const calendar = o?.calendars;
  const validCalendars = calendar === undefined || (calendar && typeof calendar === 'object' && !Array.isArray(calendar) && Object.keys(calendar).length <= 1200 && Object.entries(calendar).every(([key, value]: [string, any]) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key) || !value || typeof value !== 'object') return false;
    if (!['title','notes','goals'].every(k => value[k] === undefined || str(value[k],6000))) return false;
    return value.days && typeof value.days === 'object' && !Array.isArray(value.days) && Object.keys(value.days).length <= 31 && Object.entries(value.days).every(([day, d]: [string,any]) => /^(0[1-9]|[12]\d|3[01])$/.test(day) && +day <= new Date(+key.slice(0,4),+key.slice(5),0).getDate() && d && str(d.text,1200) && typeof d.done === 'boolean');
  }));
  return (o?.caInterGroup === undefined || ['1','2','all'].includes(o.caInterGroup)) && validPlan && validCalendars && !!o && str(o.name) && Array.isArray(o.subs) && o.subs.length > 0 && o.subs.length <= 100 &&
    o.subs.every((s: any) => s && str(s.n) && (s.caInterPaper === undefined || Number.isInteger(s.caInterPaper) && s.caInterPaper >= 1 && s.caInterPaper <= 6) && Array.isArray(s.ch) && s.ch.length <= 2000 &&
      s.ch.every((c: any) => c && str(c.n) && Array.isArray(c.d) && c.d.length === 3 && c.d.every((v: any) => v === 0 || v === 1) && (c.dates === undefined || Array.isArray(c.dates) && c.dates.length === 3 && c.dates.every((v:any)=>v===null||validDay(v))))) &&
    Array.isArray(o.lists) && o.lists.length <= 100 && o.lists.every((l: any) => l && str(l.t) && Array.isArray(l.items) && l.items.length <= 2000 && l.items.every((i: any) => i && str(i.x) && (i.d === 0 || i.d === 1))) &&
    (o.photo == null || o.photo === '' || (str(o.photo, 2000000) && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(o.photo))) &&
    ['title', 'tagline', 'course', 'exam', 'theme', 'accent', 'font', 'tab'].every(k => o[k] == null || str(o[k])) &&
    (o.focus == null || (Array.isArray(o.focus) && o.focus.length <= 10000 && o.focus.every((f: any) => f && str(f.subject) && str(f.date) && (f.note === undefined || str(f.note,500)) && (f.studyDate === undefined || str(f.studyDate,10) && /^\d{4}-\d{2}-\d{2}$/.test(f.studyDate)) && Number.isFinite(f.minutes) && f.minutes > 0 && f.minutes <= 1440)));
}
