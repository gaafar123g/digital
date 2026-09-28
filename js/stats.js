/* Digital Marketing Pro — عدّادات الإحصائيات + تتبّع الأحداث
   - الأرقام المعروضة = القيمة الابتدائية (data-base في HTML) + العدّاد الفعلي المسجَّل
   - العدّاد المشترك يعتمد على خدمة counterapi.dev (لا يوجد باك-إند في الموقع)؛ لتغييرها عدّل CONFIG فقط
   - لتعطيل التتبّع في متصفحك أضف ?stats=off للرابط مرة واحدة (و ?stats=on لإعادته) */
(function(){
'use strict';
const CONFIG={
  remote:true,                          // false = عدّاد محلي في المتصفح فقط (بدون أي طلبات شبكة)
  api:'https://api.counterapi.dev/v1',
  namespace:'dmp-gaafar-7f3a9c',
  visitorWindowMs:24*3600*1000,         // زائر جديد = مرة كل 24 ساعة لكل متصفح
  maxRequestsPerSession:120,            // سقف حماية للطلبات في الجلسة الواحدة
  flushMs:8000,                         // تجميع النقرات/التمريرات وإرسالها كل 8 ثوانٍ
  maxPerFlush:8,
  scrollMinViewport:.5,                 // تمريرة "مؤثرة" = تحرك ≥ نصف ارتفاع الشاشة ثم توقف
  scrollMaxPerPage:40,
  animMs:1600
};
const section=document.getElementById('siteStats'); if(!section) return;
const KEYS=['visitors','clicks','whatsapp','calls','scrolls'];
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const store=(o)=>({get(k){try{return o.getItem(k)}catch(e){return null}},set(k,v){try{o.setItem(k,v)}catch(e){}},del(k){try{o.removeItem(k)}catch(e){}}});
const ls=store(window.localStorage||{getItem(){},setItem(){},removeItem(){}});
const ss=store(window.sessionStorage||{getItem(){},setItem(){},removeItem(){}});

/* ---------- الحالة ---------- */
const S={}, cards={};
let offline={}; try{offline=JSON.parse(ls.get('dmp_offline')||'{}')||{};}catch(e){}
section.querySelectorAll('.stat-card').forEach(c=>{
  const k=c.dataset.key; if(!KEYS.includes(k)) return;
  const base=+c.dataset.base||0;
  cards[k]=c;
  S[k]={base:base,remote:0,extra:0,offline:+offline[k]||0,shown:base,to:base,raf:0,el:c.querySelector('.stat-num')};
});
const fmt=n=>Math.max(0,Math.round(n)).toLocaleString('en-US');
const total=k=>S[k].base+S[k].remote+S[k].extra+S[k].offline;
function saveOffline(){const o={};KEYS.forEach(k=>{if(S[k]&&S[k].offline)o[k]=S[k].offline;});ls.set('dmp_offline',JSON.stringify(o));}

/* ---------- عرض + أنيميشن الأرقام ---------- */
let revealed=false;
function tween(k,from,to,dur){
  const s=S[k]; s.to=to; cancelAnimationFrame(s.raf); s.raf=0;
  if(reduce||dur<=0||from===to){s.shown=to;s.el.textContent=fmt(to);return;}
  const t0=performance.now();
  const step=now=>{
    const p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,3);
    s.shown=from+(s.to-from)*e; s.el.textContent=fmt(s.shown);
    if(p<1){s.raf=requestAnimationFrame(step);}
    else{s.raf=0;s.shown=s.to;s.el.textContent=fmt(s.shown);if(total(k)!==s.shown)render(k);}
  };
  s.raf=requestAnimationFrame(step);
}
function render(k,pulse){
  const s=S[k], to=total(k);
  if(!revealed){s.shown=to;s.to=to;s.el.textContent=fmt(to);return;}
  if(s.raf){s.to=to;}
  else if(to!==s.shown){tween(k,s.shown,to,600);}
  if(pulse&&!reduce){const c=cards[k];c.classList.remove('tick');void c.offsetWidth;c.classList.add('tick');}
}
function reveal(){
  if(revealed) return; revealed=true;
  KEYS.forEach((k,i)=>{
    const c=cards[k],s=S[k]; if(!c) return;
    c.style.transitionDelay=(i*90)+'ms'; c.classList.add('in');
    setTimeout(()=>{c.style.transitionDelay='';},1300);
    s.shown=0; s.el.textContent='0';
    setTimeout(()=>tween(k,0,total(k),CONFIG.animMs),i*90);
  });
}
section.classList.add('js-stats');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();reveal();}},{threshold:.25});
  io.observe(section);
}else{reveal();}

/* ---------- الشبكة ---------- */
let budget=CONFIG.maxRequestsPerSession;
const endpoint=(k,up)=>CONFIG.api+'/'+CONFIG.namespace+'/'+k+(up?'/up':'');
async function call(k,up,keepalive){
  if(!CONFIG.remote) throw new Error('remote off');
  const ctl='AbortController' in window?new AbortController():null;
  const t=ctl&&setTimeout(()=>ctl.abort(),7000);
  try{
    const r=await fetch(endpoint(k,up),{cache:'no-store',credentials:'omit',keepalive:!!keepalive,signal:ctl?ctl.signal:undefined});
    if(!up&&(r.status===404||r.status===400)) return 0;      // عدّاد لم يُنشأ بعد
    if(!r.ok) throw new Error('http '+r.status);
    const j=await r.json();
    if(typeof j.count!=='number') throw new Error('bad payload');
    return j.count;
  }finally{if(t)clearTimeout(t);}
}
function toOffline(k){const s=S[k];s.extra=Math.max(0,s.extra-1);s.offline++;saveOffline();render(k);}
function send(k){                         // يرسل +1 (العرض المتفائل تم مسبقًا في extra)
  if(!CONFIG.remote||budget--<=0){toOffline(k);return;}
  call(k,true,true).then(c=>{const s=S[k];s.remote=Math.max(s.remote,c);s.extra=Math.max(0,s.extra-1);render(k);}).catch(()=>toOffline(k));
}
const q={clicks:0,scrolls:0}; let ft=0;
function schedule(){if(!ft)ft=setTimeout(()=>{ft=0;flush();},CONFIG.flushMs);}
function flush(){
  ['clicks','scrolls'].forEach(k=>{let n=Math.min(q[k],CONFIG.maxPerFlush);q[k]-=n;while(n-->0)send(k);});
  if(q.clicks||q.scrolls) schedule();
}
function count(k,now){
  if(!S[k]) return;
  S[k].extra++; render(k,true);
  if(now){send(k);}else{q[k]++;schedule();}
}

/* ---------- هل نتتبّع هذا الزائر؟ ---------- */
try{const p=new URLSearchParams(location.search).get('stats');if(p==='off')ls.set('dmp_nostats','1');else if(p==='on')ls.del('dmp_nostats');}catch(e){}
const bot=navigator.webdriver||/bot|crawl|spider|headless|lighthouse|pagespeed/i.test(navigator.userAgent||'');
const tracking=!bot&&ls.get('dmp_nostats')!=='1';
function newVisit(){
  if(ss.get('dmp_sv')) return false;                                   // نفس الجلسة
  const now=Date.now(),last=+ls.get('dmp_visit')||0;
  ss.set('dmp_sv','1');
  if(last&&now-last<CONFIG.visitorWindowMs) return false;              // زار خلال 24 ساعة
  ls.set('dmp_visit',String(now)); return true;
}

/* ---------- قراءة القيم الحالية + تسجيل الزيارة (بعد تحميل الصفحة، دون تعطيلها) ---------- */
function boot(){
  const isNew=tracking&&newVisit();
  KEYS.forEach(k=>{
    const up=isNew&&k==='visitors';
    if(up&&(!CONFIG.remote||budget--<=0)){S[k].offline++;saveOffline();render(k);return;}
    call(k,up,false).then(c=>{S[k].remote=Math.max(S[k].remote,c);render(k);})
      .catch(()=>{if(up){S[k].offline++;saveOffline();render(k);}});
  });
}
(window.requestIdleCallback?requestIdleCallback:(f)=>setTimeout(f,600))(boot,{timeout:2500});

if(!tracking) return;

/* ---------- تتبّع الأحداث ---------- */
const WA=/^(?:https?:)?\/\/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)(?:[\/?#:]|$)|^whatsapp:/i;
const recent=new WeakMap();
const once=(el,ms)=>{const n=Date.now(),t=recent.get(el)||0;if(n-t<ms)return false;recent.set(el,n);return true;};
let skipScroll=false, skipUntil=0, lastEl=null, lastT=0;

document.addEventListener('click',e=>{
  if(!e.isTrusted) return;
  const t=e.target; if(!t||!t.closest) return;
  const a=t.closest('a[href]'), href=a?(a.getAttribute('href')||'').trim():'';
  if((a&&href.charAt(0)==='#')||t.closest('#toTop')){skipScroll=true;skipUntil=Date.now()+3000;}   // تمرير برمجي ≠ تمرير المستخدم
  const now=Date.now();
  if(t===lastEl&&now-lastT<350) return;                                                          // نقر مزدوج/لمس مكرر
  lastEl=t;lastT=now;
  count('clicks');
  if(a&&WA.test(href)){if(once(a,1500))count('whatsapp',true);}
  else if(a&&/^tel:/i.test(href)){if(once(a,1500))count('calls',true);}
},{capture:true,passive:true});

const form=document.getElementById('contactForm');           // النموذج يفتح واتساب عند الإرسال
if(form) form.addEventListener('submit',e=>{if(e.isTrusted&&once(form,1500))count('whatsapp',true);},{passive:true});

const t0=Date.now(); let lastY=window.pageYOffset||0, st=0, scrolls=0;
function settle(){
  const y=window.pageYOffset||document.documentElement.scrollTop||0;
  if(Date.now()-t0<1000){lastY=y;return;}                                    // تمرير استعادة الصفحة/الرابط عند التحميل
  if(skipScroll&&Date.now()<skipUntil){skipScroll=false;lastY=y;return;}
  skipScroll=false;
  if(scrolls>=CONFIG.scrollMaxPerPage) return;
  if(Math.abs(y-lastY)>=window.innerHeight*CONFIG.scrollMinViewport){lastY=y;scrolls++;count('scrolls');}
}
window.addEventListener('scroll',()=>{if(document.hidden)return;clearTimeout(st);st=setTimeout(settle,300);},{passive:true});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
window.addEventListener('pagehide',flush);
})();
