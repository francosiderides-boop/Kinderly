// Kinderly · mascotas de compañía: un perrito (despierto de día, duerme de noche)
// y un gatito (duerme de día, despierto de noche). Dibujo tipo garabato con la paleta de la app.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const css=document.createElement('style');
css.textContent=`
:root{--pk-ink:#2B2A33;--pk-cream:#FFF4E2;--pk-car:#F2D3AE;--pk-cat:#FFE0C2;--pk-cat2:#EBB88A;--pk-white:#FFFBF4;--pk-pink:#FAC3C3;--pk-ld:#2B2A33;--pk-lc:#2B2A33;--pk-muz:#FFFBF4}
:root[data-theme="dark"]{--pk-ink:#17151C;--pk-cream:#EADFCB;--pk-car:#D2B18C;--pk-cat:#E6CBAE;--pk-cat2:#C79F78;--pk-white:#F0E8DA;--pk-ld:#17151C;--pk-lc:#17151C;--pk-muz:#F0E8DA}
.pets{position:fixed;left:0;right:0;bottom:calc(73px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pets .slot{position:absolute;left:0;right:0;bottom:0;height:0;opacity:0;transition:opacity .5s ease}
.pets[data-v="buscar"] .slot.main,.pets[data-v="descubrir"] .slot.rest{opacity:1}
.pet{position:absolute;bottom:8px;left:calc(10% - 22px);width:72px;height:66px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .7s cubic-bezier(.34,1.4,.64,1)}
.slot.rest .pet{left:auto;right:calc(10% - 22px)}
.pets.on .pet{opacity:1;transform:none}
.pets.on .pet.gone{opacity:0;transform:translateY(6px)}
.pet.dozing{animation:pdoze 1s ease both}.pet.waking{animation:pwake .9s cubic-bezier(.34,1.4,.64,1) both}
@keyframes pdoze{0%{transform:none}45%{transform:translateY(2px) scale(1.02,.92)}100%{transform:none}}
@keyframes pwake{0%{transform:scale(1.04,.88)}35%{transform:translateY(-9px) scale(.96,1.1)}65%{transform:translateY(0) scale(1.03,.95)}100%{transform:none}}
.pet .a,.pet .z{position:absolute;inset:0;transition:opacity .6s}
.pet .z{opacity:0}.pet.sleep .a{opacity:0}.pet.sleep .z{opacity:1}
.pet svg{width:100%;height:100%;overflow:visible}
.pet .z svg{transform:translateY(-9%)}
.pet .ln{stroke:var(--pk-ink);fill:none;stroke-linecap:round;stroke-linejoin:round}
.pet.dog .ln{stroke:var(--pk-ld)}.pet.cat .ln{stroke:var(--pk-lc)}
.pet .tail{transform-box:fill-box;transform-origin:0% 100%;animation:pwag 1.7s ease-in-out infinite}
.pet.cat .tail{animation:psway 4s ease-in-out infinite}
.pet .eyes{transform-box:fill-box;transform-origin:center;animation:pblink 5.5s infinite}
.pet.cat .eyes{animation-duration:8s}
.pet .body{transform-box:fill-box;transform-origin:50% 100%;animation:pbreath 3.6s ease-in-out infinite}
.pet.sleep .body{animation-duration:5.2s}
.pet .ear{transform-box:fill-box;transform-origin:50% 100%;animation:pear 9s ease-in-out infinite}
.pet .zz{font:700 11px 'Instrument Sans',system-ui,sans-serif;fill:#6F7BAA;opacity:0;animation:pzz 3.8s ease-in-out infinite}
.pet .zz:nth-of-type(2){animation-delay:1.25s}.pet .zz:nth-of-type(3){animation-delay:2.5s}
.pet .glint{animation:ptw 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes phead{0%,100%{transform:rotate(0)}22%{transform:rotate(-5deg)}48%{transform:rotate(0)}70%{transform:rotate(4deg)}}
@keyframes pglance{0%,38%,100%{transform:translateX(0)}44%,60%{transform:translateX(-1.8px)}68%,86%{transform:translateX(1.8px)}}
@keyframes pwhisk{0%,90%,100%{transform:rotate(0)}94%{transform:rotate(3deg)}97%{transform:rotate(-2deg)}}
@keyframes pswish{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(14deg)}}
.pet .head{transform-box:view-box;transform-origin:50px 60px;animation:phead 9s ease-in-out infinite}
.pet.cat .head{animation-duration:11s}
.pet .gl{animation:pglance 7s ease-in-out infinite}
.pet.cat .tail{animation:pswish 2.8s ease-in-out infinite}
.pet .wh{transform-box:fill-box;transform-origin:0% 50%;animation:pwhisk 6s ease-in-out infinite}
/* gestos ocasionales */
.pet .bub{position:absolute;left:50%;bottom:calc(100% - 2px);transform:translate(-50%,6px) scale(.6);opacity:0;background:#FFFDF8;color:#5A4636;border:1.6px solid #5A4636;border-radius:11px;padding:1px 7px;font:700 10.5px 'Instrument Sans',system-ui,sans-serif;white-space:nowrap;transition:opacity .25s,transform .45s cubic-bezier(.34,1.5,.64,1)}
.pet.say .bub{opacity:1;transform:translate(-50%,-1px) scale(1)}
.pet .heart{position:absolute;left:50%;top:8px;color:#E5707A;font-size:15px;line-height:1;opacity:0}
.pet.g-heart .heart{animation:gheart 1.9s ease-out}
.pet.g-hop{animation:ghop 1.2s ease}
.pet.g-stretch .a{transform-origin:50% 100%;animation:gstretch 2.2s ease-in-out}
.pet.g-sigh .z{transform-origin:50% 100%;animation:gsigh 2.4s ease-in-out}
@keyframes ghop{0%,100%{transform:none}18%{transform:translateY(-10px)}34%{transform:none}52%{transform:translateY(-7px)}68%{transform:none}}
@keyframes gstretch{0%,100%{transform:none}30%{transform:scale(1.1,.88)}60%{transform:scale(.94,1.12)}80%{transform:scale(1.02,.98)}}
@keyframes gsigh{0%,100%{transform:none}40%{transform:scale(1.05,1.13)}}
@keyframes gheart{0%{opacity:0;transform:translate(-50%,6px) scale(.5)}25%{opacity:1;transform:translate(-50%,-4px) scale(1.1)}100%{opacity:0;transform:translate(-50%,-22px) scale(1)}}
@keyframes pwave{0%,62%,100%{transform:rotate(0)}68%{transform:rotate(-16deg)}76%{transform:rotate(10deg)}84%{transform:rotate(-14deg)}92%{transform:rotate(6deg)}}
@keyframes gwave{0%,100%{transform:rotate(0)}12%{transform:rotate(-18deg)}28%{transform:rotate(12deg)}44%{transform:rotate(-18deg)}60%{transform:rotate(12deg)}76%{transform:rotate(-14deg)}90%{transform:rotate(4deg)}}
.pet .arm{transform-box:view-box;transform-origin:64px 73px}
.pet.dog .a .arm{animation:pwave 8s ease-in-out infinite}
.pet.cat .a .arm{opacity:0}
.pet.g-wave .arm{opacity:1!important;animation:gwave 2s ease-in-out!important}
@keyframes pwag{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(18deg)}}
@keyframes psway{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(10deg)}}
@keyframes pblink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes pbreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.04)}}
@keyframes pzz{0%{opacity:0;transform:translate(0,4px)}25%{opacity:.9}100%{opacity:0;transform:translate(7px,-12px)}}
@keyframes pear{0%,88%,100%{transform:rotate(0)}92%{transform:rotate(-8deg)}96%{transform:rotate(3deg)}}
@keyframes ptw{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
@media (prefers-reduced-motion:reduce){.pet *{animation:none!important}}
`;
document.head.append(css);

const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 0 100 92" stroke-width="2.7">'+h+'</svg>';return d.firstChild};
const CR='var(--pk-cream)',CA='var(--pk-car)',CT='var(--pk-cat)',CT2='var(--pk-cat2)',WH='var(--pk-white)',PK='var(--pk-pink)',INK='var(--pk-ink)';
const sh=(tag,at,fill)=>'<g><'+tag+' '+at+' fill="'+fill+'" stroke="none" transform="translate(1 .8)"/><'+tag+' class="ln" '+at+'/></g>';
const E=(cx,cy,rx,ry,fill)=>sh('ellipse','cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"',fill);
const P=(d,fill)=>sh('path','d="'+d+'"',fill);
const tube=(d,fill,w)=>'<path class="ln" d="'+d+'" stroke-width="'+(w+5.4)+'"/><path d="'+d+'" fill="none" stroke="'+fill+'" stroke-width="'+w+'" stroke-linecap="round"/>';
const dot=(x,y,rx,ry)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+INK+'"/>';
const shut=(x,y,w)=>'<path d="M'+(x-w)+' '+y+' Q'+x+' '+(y+w*.8)+' '+(x+w)+' '+y+'" fill="none" stroke="'+INK+'" stroke-width="2.2" stroke-linecap="round"/>';
const blush=(x,y)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="5.5" ry="3.4" fill="'+PK+'" opacity=".7"/>';
// patita levantada con almohadilla (saluda)
const arm=f=>'<g class="arm">'+tube('M64 73 Q87 73 88 57',f,7)+'<ellipse cx="88" cy="51" rx="6.2" ry="5.6" fill="'+f+'" stroke="none"/><path class="ln" d="M82 52 Q82 45 88 45 Q94 45 94 52" stroke-width="2.7"/>'+
  '<ellipse cx="88.3" cy="53" rx="2.7" ry="2.2" fill="'+INK+'"/><circle cx="84.6" cy="49.4" r="1.1" fill="'+INK+'"/><circle cx="88.2" cy="47.8" r="1.1" fill="'+INK+'"/><circle cx="91.8" cy="49.4" r="1.1" fill="'+INK+'"/></g>';

// ---------- perrito despierto ----------
const DOG_AWAKE=
 '<g class="tail">'+P('M30 82 Q14 82 12 70 Q22 66 32 74 Z',CR)+'</g>'+
 '<g class="body">'+P('M32 58 Q26 74 30 85 Q44 91 60 89 Q71 88 71 77 Q69 66 66 58 Z',CR)+
 '<path class="ln" d="M46 72 Q44 82 48 89 M56 72 Q60 81 56 89" stroke-width="2.3"/></g>'+
 '<g class="head">'+
 P('M25 24 Q8 18 7 38 Q7 56 19 54 Q27 51 27 38 Z',CA)+P('M75 24 Q92 18 93 38 Q93 56 81 54 Q73 51 73 38 Z',CA)+
 P('M20 40 Q20 15 50 15 Q80 15 80 40 Q80 61 50 61 Q20 61 20 40 Z',CR)+
 '<path class="ln" d="M44 12 L43 6 M50 11 L50 4.5 M56 12 L58 6" stroke-width="2.2"/>'+
 blush(31,50)+blush(69,50)+
 '<g class="eyes"><g class="gl">'+dot(37,40,2.7,3.5)+dot(63,40,2.7,3.5)+'</g></g>'+
 '<ellipse cx="50" cy="47.5" rx="3.8" ry="2.5" fill="'+INK+'"/>'+
 '</g>'+arm(CR);

// ---------- perrito dormido ----------
const DOG_SLEEP=
 '<g class="body">'+
 '<g class="tail">'+P('M82 78 Q96 74 94 62 Q86 62 80 70 Z',CR)+'</g>'+
 P('M24 70 Q20 58 44 56 Q74 54 84 66 Q90 84 66 88 Q40 91 26 84 Q20 80 24 70 Z',CR)+
 '<path class="ln" d="M60 88 Q62 80 58 74" stroke-width="2.2"/>'+
 P('M14 56 Q2 58 3 74 Q4 86 17 82 Q22 78 22 66 Z',CA)+
 P('M12 66 Q10 52 32 52 Q52 52 52 70 Q52 86 32 86 Q12 86 12 66 Z',CR)+
 '<path class="ln" d="M28 50 L27 45 M33 49 L33 44 M38 50 L40 45" stroke-width="2.1"/>'+
 blush(21,76)+shut(27,68,4.4)+shut(43,68,4.4)+
 '<ellipse cx="35" cy="75" rx="3.6" ry="2.4" fill="'+INK+'"/>'+
 '</g>'+
 '<text class="zz" x="56" y="46">z</text><text class="zz" x="63" y="37">z</text><text class="zz" x="70" y="28">Z</text>';

// ---------- gatito despierto ----------
const CAT_AWAKE=
 '<g class="tail">'+tube('M68 86 Q95 88 92 62 Q90 50 82 54',CT,6)+'</g>'+
 '<g class="body">'+P('M32 58 Q26 74 30 85 Q44 91 60 89 Q71 88 71 77 Q69 66 66 58 Z',CT)+'<ellipse cx="50" cy="79" rx="8.5" ry="8" fill="'+WH+'"/>'+
 '<path class="ln" d="M46 76 Q44 84 48 89 M54 76 Q58 84 54 89" stroke-width="2.2"/></g>'+
 '<g class="head">'+
 '<g class="ear">'+P('M22 36 Q16 14 22 8 Q36 10 46 22 Z',CT)+'<path class="ln" d="M26 28 Q25 19 28 15" stroke-width="1.8"/></g>'+
 '<g class="ear" style="animation-delay:4.2s">'+P('M78 36 Q84 14 78 8 Q64 10 54 22 Z',CT)+'<path class="ln" d="M74 28 Q75 19 72 15" stroke-width="1.8"/></g>'+
 P('M19 42 Q18 20 50 19 Q82 20 81 42 Q81 62 50 62 Q19 62 19 42 Z',CT)+
 '<path class="ln" d="M45 21 L45 27 M50 20 L50 26 M55 21 L55 27" stroke-width="2.1"/>'+
 blush(30,52)+blush(70,52)+
 '<g class="eyes"><g class="gl">'+dot(37,42,2.7,3.5)+dot(63,42,2.7,3.5)+'</g></g>'+
 '<path d="M47.6 48 L52.4 48 L50 50.8 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>'+
 '<g class="wh"><path class="ln" d="M33 49 L20 46.5 M33 52 L21 55" stroke-width="1.5"/></g><g class="wh" style="animation-delay:.25s"><path class="ln" d="M67 49 L80 46.5 M67 52 L79 55" stroke-width="1.5"/></g>'+
 '</g>'+arm(CT);

// ---------- gatito dormido ----------
const CAT_SLEEP=
 '<g class="body">'+
 P('M12 74 Q12 56 50 56 Q88 56 88 74 Q88 88 50 88 Q12 88 12 74 Z',CT)+
 '<path class="ln" d="M56 58 Q60 65 57 72 M67 59 Q71 66 68 74 M77 62 Q80 69 77 76" stroke-width="2.2"/>'+
 tube('M80 84 Q54 95 24 87',CT,6)+
 P('M14 60 L13 44 Q22 44 31 53 Z',CT)+P('M42 54 L50 43 Q54 46 54 60 Z',CT)+
 P('M12 70 Q12 52 33 52 Q54 52 54 70 Q54 86 33 86 Q12 86 12 70 Z',CT)+
 '<path class="ln" d="M28 54 L28 49 M33 53 L33 48 M38 54 L38 49" stroke-width="2.1"/>'+
 blush(21,77)+shut(26,70,4.2)+shut(41,70,4.2)+
 '<path d="M31 75 L36 75 L33.5 77.6 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+
 '</g>'+
 '<text class="zz" x="58" y="46">z</text><text class="zz" x="65" y="37">z</text><text class="zz" x="72" y="28">Z</text>';

const mk=(cls,a,z)=>{
  const w=document.createElement('div');w.className='pet '+cls;w.setAttribute('aria-hidden','true');
  const A=document.createElement('div');A.className='a';A.append(sv(a));
  const Z=document.createElement('div');Z.className='z';Z.append(sv(z));
  const bb=document.createElement('span');bb.className='bub';const hh=document.createElement('span');hh.className='heart';hh.textContent='♥';
  w.append(A,Z,bb,hh);return w};

// El que está despierto vive en la pantalla principal (Buscar); el que duerme, en Descubrir.
// De día está despierto el perro; de noche, el gato. Al amanecer o anochecer se "relevan".
const host=document.createElement('div');host.className='pets';host.setAttribute('aria-hidden','true');
const sM=document.createElement('div');sM.className='slot main';const sR=document.createElement('div');sR.className='slot rest';
const mDog=mk('dog',DOG_AWAKE,DOG_SLEEP),mCat=mk('cat',CAT_AWAKE,CAT_SLEEP),rDog=mk('dog',DOG_AWAKE,DOG_SLEEP),rCat=mk('cat',CAT_AWAKE,CAT_SLEEP);
sM.append(mDog,mCat);sR.append(rDog,rCat);host.append(sM,sR);document.body.append(host);

const night=()=>{const h=new Date().getHours();return document.documentElement.dataset.theme==='dark'||h>=21||h<7};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let shown=null,busy=false;
const setPlain=n=>{ // estado sin animación
  const mm=n?mCat:mDog,mo=n?mDog:mCat,rr=n?rDog:rCat,ro=n?rCat:rDog;
  [mDog,mCat,rDog,rCat].forEach(p=>p.classList.remove('dozing','waking'));
  mm.classList.remove('gone','sleep');mo.classList.add('gone');mo.classList.remove('sleep');
  rr.classList.remove('gone');rr.classList.add('sleep');ro.classList.add('gone');ro.classList.remove('sleep');
  shown=n;try{localStorage.setItem('k_pets_ph',n?'night':'day')}catch(e){}};
async function swap(n){
  if(busy||shown===n)return;busy=true;
  const oldM=n?mDog:mCat,newM=n?mCat:mDog,oldR=n?rCat:rDog,newR=n?rDog:rCat;
  oldM.classList.add('dozing');oldR.classList.add('waking');await wait(450);
  oldM.classList.add('sleep');oldR.classList.remove('sleep');await wait(1300);
  oldM.classList.add('gone');oldR.classList.add('gone');await wait(700);
  [oldM,oldR].forEach(p=>p.classList.remove('dozing','waking'));
  newM.classList.add('sleep');newM.classList.remove('gone');newR.classList.remove('sleep','gone');await wait(1000);
  newM.classList.add('waking');newR.classList.add('dozing');await wait(450);
  newM.classList.remove('sleep');newR.classList.add('sleep');await wait(1300);
  [newM,newR].forEach(p=>p.classList.remove('dozing','waking'));
  shown=n;try{localStorage.setItem('k_pets_ph',n?'night':'day')}catch(e){}busy=false;
  if(night()!==n)swap(night())}
const sync=()=>{host.classList.toggle('off',off());const n=night();if(shown===null){setPlain(n);return}if(n!==shown)swap(n)};
// vista activa → qué mascota se ve
const vw=()=>{const v=document.querySelector('.view.on');host.dataset.v=v?v.dataset.view:''};
vw();document.querySelectorAll('.view').forEach(v=>{try{new MutationObserver(vw).observe(v,{attributes:true,attributeFilter:['class']})}catch(e){}});
// al abrir: si cambió el momento del día desde la última vez, se muestra el cambio
let prev=null;try{prev=localStorage.getItem('k_pets_ph')}catch(e){}
const nowN=night();
if(prev&&(prev==='night')!==nowN){setPlain(!nowN);host.classList.toggle('off',off());setTimeout(()=>{host.classList.add('on');setTimeout(()=>swap(night()),1400)},500)}
else{setPlain(nowN);host.classList.toggle('off',off());setTimeout(()=>host.classList.add('on'),600)}
setInterval(sync,30000);
// de vez en cuando, un gestito
const pick=a=>a[Math.floor(Math.random()*a.length)];
function gesture(){
  if(busy||host.classList.contains('off')||document.hidden)return;
  const v=host.dataset.v,slot=v==='buscar'?sM:v==='descubrir'?sR:null;if(!slot)return;
  const pet=[...slot.children].find(p=>!p.classList.contains('gone'));if(!pet)return;
  const dog=pet.classList.contains('dog'),sl=pet.classList.contains('sleep'),bub=pet.querySelector('.bub');
  const g=sl?pick(['sigh','dream','dream']):dog?pick(['hop','woof','heart','wave']):pick(['stretch','miau','heart','wave']);
  let cls='',txt='',ms=2300;
  if(g==='hop'){cls='g-hop';ms=1300}else if(g==='stretch'){cls='g-stretch';ms=2300}else if(g==='sigh'){cls='g-sigh';ms=2500}else if(g==='heart'){cls='g-heart';ms=2000}
  else if(g==='wave'){cls='g-wave';ms=2100}else if(g==='woof'){cls='say g-hop';txt='¡guau!';ms=2000}else if(g==='miau'){cls='say';txt='miau~';ms=2200}else if(g==='dream'){cls='say';txt=dog?'🦴':'🐟';ms=2800}
  if(txt)bub.textContent=txt;cls.split(' ').forEach(c=>pet.classList.add(c));
  setTimeout(()=>cls.split(' ').forEach(c=>pet.classList.remove(c)),ms)}
(function loop(){setTimeout(()=>{try{gesture()}catch(e){}loop()},14000+Math.random()*26000)})();
// primer gesto temprano para que se note
setTimeout(()=>{try{gesture()}catch(e){}},7000);
try{new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(e){}
window.KPets={refresh:sync,set:v=>{try{localStorage.setItem(KEY,v?'0':'1')}catch(e){}sync();host.classList.toggle('off',off())},on:()=>!off()};

// interruptor en Ajustes
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||document.getElementById('ex-pets'))return;
  const c=document.createElement('div');c.className='card';c.id='ex-pets';c.style.marginTop='14px';
  const b=document.createElement('b');b.textContent='Mascotas de compañía';const p=document.createElement('p');p.className='hint2';p.textContent='Un perrito y un gatito te acompañan sobre la barra de abajo. El que está despierto te espera en Buscar y el que duerme, en Descubrir. De día está despierto el perro; al anochecer se turnan con el gato.';
  const t=document.createElement('button');t.type='button';t.className='ghost';const upd=()=>{t.textContent=window.KPets.on()?'Ocultar mascotas':'Mostrar mascotas'};upd();
  t.onclick=()=>{window.KPets.set(!window.KPets.on());upd()};c.append(b,p,t);h.append(c)})();
})();
