/* سلوك الموقع فقط (سلايدر، عدّادات، نوافذ، أنيميشن) — النصوص والصور موجودة مباشرة في ملفات HTML */
(function(){
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const isRTL = ()=>document.documentElement.dir==='rtl';

/* ===== اللغة: العربي هو المحتوى الأساسي في HTML، والإنجليزي في data-en (نص) و data-en-<attr> (سمات) ===== */
let lang = (function(){try{return localStorage.getItem('dmp_lang')==='en'?'en':'ar'}catch(e){return 'ar'}})();
const dl = (el,k)=> (lang==='en' && el.dataset[k+'En']) || el.dataset[k];
function applyLang(){
  const root=document.documentElement;
  root.lang=lang; root.dir=lang==='en'?'ltr':'rtl';
  $$('[data-en]').forEach(el=>{
    if(el.dataset.ar===undefined) el.dataset.ar=el.textContent;
    el.textContent = lang==='en' ? el.dataset.en : el.dataset.ar;
  });
  $$('*').forEach(el=>{
    [...el.attributes].forEach(at=>{
      if(!at.name.startsWith('data-en-')) return;
      const n=at.name.slice(8), k='data-ar-'+n;
      if(n==='cta'||n==='lead'||n==='success') return;      // تُقرأ عند الاستخدام
      if(!el.hasAttribute(k)) el.setAttribute(k, el.getAttribute(n)||'');
      el.setAttribute(n, lang==='en' ? at.value : el.getAttribute(k));
    });
  });
  $('#langBtn').textContent = lang==='ar' ? 'English' : 'العربية';
}
applyLang();

/* ===== قائمة الموبايل ===== */
const burger=$('#hamburger'), drawer=$('#mobileNav');
function setMenu(open){drawer.classList.toggle('open',open);burger.classList.toggle('open',open);burger.setAttribute('aria-expanded',open);}
burger.onclick = e=>{e.stopPropagation();setMenu(!drawer.classList.contains('open'));};
document.addEventListener('click', e=>{
  if(e.target.closest('.mobile-nav a')||!e.target.closest('.mobile-nav')) setMenu(false);
});

/* ===== سلايدر الهيرو ===== */
(function(){
  const slideEls=$$('.slide'), dotEls=$$('#heroDots span'); let cur=0;
  function go(n){cur=(n+slideEls.length)%slideEls.length; slideEls.forEach((s,i)=>s.classList.toggle('active',i===cur)); dotEls.forEach((d,i)=>d.classList.toggle('active',i===cur));}
  $('#heroNext').onclick=()=>go(cur+1);
  $('#heroPrev').onclick=()=>go(cur-1);
  dotEls.forEach(d=>d.onclick=()=>go(+d.dataset.i));
  setInterval(()=>go(cur+1),5500);
})();

/* ===== العدّادات ===== */
function animateCount(el){
  const target=+el.dataset.target; let cur=0; const step=Math.max(1,Math.round(target/40));
  el.textContent='0';
  const t=setInterval(()=>{cur+=step; if(cur>=target){cur=target;clearInterval(t);} el.textContent=cur+'+';},30);
}
(function(){
  const els=$$('.counter-card b');
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){animateCount(e.target);io.unobserve(e.target);}})});
  els.forEach(e=>io.observe(e));
})();

/* ===== نافذة تفاصيل الخدمة (المحتوى من بطاقة الخدمة نفسها) ===== */
const modal=$('#svcModal');
function openServiceModal(card){
  const img=$('.svc-img img',card);
  const title=$('h3',card).textContent;
  $('#mIco').innerHTML='';
  const im=document.createElement('img');
  im.src=img.getAttribute('src'); im.alt=title; im.width=800; im.height=520;
  $('#mIco').appendChild(im);
  $('#mTitle').textContent=title;
  $('#mDetail').textContent=$('.svc-detail',card).textContent;
  $('#mCta').textContent=dl(modal,'cta');
  modal.classList.add('open');
}
function closeServiceModal(){modal.classList.remove('open');}
$$('.svc-card').forEach(c=>{
  c.onclick=()=>openServiceModal(c);
  c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openServiceModal(c);}};
});
$('#svcClose').onclick=closeServiceModal;
modal.addEventListener('click', e=>{if(e.target.id==='svcModal') closeServiceModal();});
document.addEventListener('keydown', e=>{if(e.key==='Escape'){closeServiceModal();setMenu(false);}});

/* ===== معرض الأعمال: فلترة + أسهم ===== */
(function(){
  const track=$('#pfTrack'), items=$$('.pf-item',track); let pos=0, visible=items.length;
  const step=280;
  $$('#pfFilters button').forEach(b=>b.onclick=()=>{
    $$('#pfFilters button').forEach(x=>x.classList.toggle('active',x===b));
    visible=0;
    items.forEach(it=>{const show=b.dataset.k==='all'||it.dataset.cat===b.dataset.k; it.hidden=!show; if(show) visible++;});
    pos=0; track.style.transform='translateX(0px)';
  });
  function move(dir){
    const max=Math.max(0, visible*step - track.parentElement.offsetWidth);
    pos=Math.min(max, Math.max(0, pos+dir*step));
    track.style.transform=`translateX(${(isRTL()?1:-1)*pos}px)`;
  }
  document.addEventListener('langchange',()=>{pos=0;track.style.transform='translateX(0px)';});
  $('#pfNext').onclick=()=>move(1);
  $('#pfPrev').onclick=()=>move(-1);
})();

/* ===== شركاء النجاح: سليدر شعارات (سحب باللمس + أسهم + تشغيل تلقائي) ===== */
(function(){
  const root=$('#partnersSlider'); if(!root) return;
  const track=$('.ps-track',root); let paused=false;
  const step=()=>{const it=$('.ps-item',track);return it?it.getBoundingClientRect().width+16:200;};
  document.addEventListener('langchange',()=>track.scrollTo({left:0}));
  $('.ps-l',root).onclick=()=>track.scrollBy({left:-step(),behavior:'smooth'});
  $('.ps-r',root).onclick=()=>track.scrollBy({left:step(),behavior:'smooth'});
  ['mouseenter','touchstart','focusin','pointerdown'].forEach(e=>root.addEventListener(e,()=>{paused=true;},{passive:true}));
  ['mouseleave','touchend','focusout'].forEach(e=>root.addEventListener(e,()=>setTimeout(()=>{paused=false;},2500),{passive:true}));
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(()=>{
    if(paused||document.hidden) return;
    const r=root.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;   // لا يتحرك وهو خارج الشاشة
    const end=Math.abs(track.scrollLeft)+track.clientWidth>=track.scrollWidth-4;
    if(end) track.scrollTo({left:0,behavior:'smooth'});
    else track.scrollBy({left:(isRTL()?-1:1)*step(),behavior:'smooth'});
  },2600);
})();

/* ===== آراء العملاء ===== */
(function(){
  const cards=$$('#testiWrap .testi-card'); let i=0;
  function show(n){i=(n+cards.length)%cards.length; cards.forEach((c,k)=>c.hidden=(k!==i));}
  $('#tPrev').onclick=()=>show(i-1);
  $('#tNext').onclick=()=>show(i+1);
})();

/* ===== الأسئلة الشائعة: فتح سؤال واحد فقط ===== */
(function(){
  const all=$$('#faqList details');
  all.forEach(d=>d.addEventListener('toggle',()=>{if(d.open){all.forEach(o=>{if(o!==d)o.open=false;});}}));
})();

/* ===== نموذج التواصل → واتساب ===== */
$('#contactForm').addEventListener('submit', function(e){
  e.preventDefault();
  const lbl=id=>$('label[for="'+id+'"] span').textContent;
  const name=$('#f_name').value.trim(), phone=$('#f_phone').value.trim(), email=$('#f_email').value.trim(),
        company=$('#f_company').value.trim(), service=$('#f_service').value, msg=$('#f_msg').value.trim();
  /* الاسم ونوع الخدمة إجباريان (required في الحقول)؛ باقي الحقول تُضاف للرسالة فقط إن وُجدت */
  const lines=[dl(this,'lead'),`${lbl('f_name')}: ${name}`,`${lbl('f_service')}: ${service}`];
  if(phone) lines.push(`${lbl('f_phone')}: ${phone}`);
  if(email) lines.push(`${lbl('f_email')}: ${email}`);
  if(company) lines.push(`${lbl('f_company')}: ${company}`);
  if(msg) lines.push(msg);
  $('#formMsg').textContent=dl(this,'success');
  window.open('https://wa.me/966547727535?text='+encodeURIComponent(lines.join('\n')), '_blank');
  this.reset();
});

/* ===== زر الصعود + ظل الهيدر ===== */
const toTop=$('#toTop');
window.addEventListener('scroll', ()=>{
  $('header').style.boxShadow = window.scrollY>10 ? '0 6px 20px rgba(0,0,0,.35)':'none';
  toTop.classList.toggle('show', window.scrollY>500);
},{passive:true});
toTop.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});

/* ===== أنيميشن الظهور عند التمرير ===== */
function assignDirs(){
  const vw=innerWidth, mid=vw/2, seen=new Map();
  const els=$$('.reveal:not(.in)');
  els.forEach(el=>el.classList.remove('from-l','from-r'));
  const rects=els.map(el=>el.getBoundingClientRect());
  els.forEach((el,i)=>{
    const r=rects[i], c=r.left+r.width/2;
    if(r.width>vw*.6) el.classList.add(i%2?'from-r':'from-l');
    else if(c<mid-vw*.08) el.classList.add('from-l');
    else if(c>mid+vw*.08) el.classList.add('from-r');
    const k=seen.get(el.parentNode)||0; seen.set(el.parentNode,k+1);
    el.style.transitionDelay=((k%4)*.08)+'s';
  });
}
function observeReveal(){
  assignDirs();
  if(!('IntersectionObserver' in window)){$$('.reveal').forEach(el=>el.classList.add('in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal:not(.in)').forEach(el=>io.observe(el));
}
$('#langBtn').onclick=e=>{
  e.preventDefault();      // التبديل يتم داخل نفس الصفحة (لا يوجد en/index.html)
  lang = lang==='ar' ? 'en' : 'ar';
  try{localStorage.setItem('dmp_lang',lang);}catch(e){}
  setMenu(false);
  applyLang();
  document.dispatchEvent(new Event('langchange'));
  assignDirs();
};
let rsT; addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(assignDirs,200);});
observeReveal();

/* ===== اللودر + شبكة أمان ===== */
function hideLoader(){const l=$('#loader');if(l)l.classList.add('hide');}
setTimeout(hideLoader, 1000);
setTimeout(()=>$$('.reveal:not(.in)').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)el.classList.add('in');}),4000);
})();
