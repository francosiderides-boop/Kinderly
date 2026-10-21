// Kinderly · mascotas de compañía: un perrito (despierto de día, duerme de noche)
// y un gatito (duerme de día, despierto de noche). Dibujo tipo garabato con la paleta de la app.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const css=document.createElement('style');
css.textContent=`
:root{--pk-ink:#1E1E24;--pk-fill:#FFFFFF;--pk-pink:#F6B9B9}
:root[data-theme="dark"]{--pk-ink:#14131A;--pk-fill:#F1E9DB;--pk-pink:#E8A9A9}
.pets{position:fixed;left:0;right:0;bottom:calc(73px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pets .slot{position:absolute;left:0;right:0;bottom:0;height:0;opacity:0;transition:opacity .5s ease}
.pets[data-v="buscar"] .slot.main,.pets[data-v="descubrir"] .slot.rest{opacity:1}
.pet{position:absolute;bottom:-2px;left:calc(10% - 24px);width:78px;height:78px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .7s cubic-bezier(.34,1.4,.64,1)}
.slot.rest .pet{left:auto;right:calc(10% - 24px)}
.pets.on .pet{opacity:1;transform:none}
.pets.on .pet.gone{opacity:0;transform:translateY(6px)}
.pet.dozing{animation:pdoze 1s ease both}.pet.waking{animation:pwake .9s cubic-bezier(.34,1.4,.64,1) both}
@keyframes pdoze{0%{transform:none}45%{transform:translateY(2px) scale(1.02,.92)}100%{transform:none}}
@keyframes pwake{0%{transform:scale(1.04,.88)}35%{transform:translateY(-9px) scale(.96,1.1)}65%{transform:translateY(0) scale(1.03,.95)}100%{transform:none}}
.pet .a,.pet .z{position:absolute;inset:0;transition:opacity .6s}
.pet .z{opacity:0}.pet.sleep .a{opacity:0}.pet.sleep .z{opacity:1}
.pet svg{width:100%;height:100%;overflow:visible;filter:url(#kpwob)}
.pet .ln.sk{stroke-width:.9;opacity:.55}
.pet .z svg{transform:translateY(-9%)}
.pet .ln{stroke:var(--pk-ink);fill:none;stroke-linecap:round;stroke-linejoin:round}
.pet .tail{transform-box:fill-box;transform-origin:0% 100%;animation:pwag 1.1s ease-in-out infinite}
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
.pet .head{transform-box:view-box;transform-origin:48px 56px;animation:phead 9s ease-in-out infinite}
.pet.cat .head{animation-duration:11s}
.pet .gl{animation:pglance 7s ease-in-out infinite}
.pet.cat .tail{animation:pswish 5s ease-in-out infinite}
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
.pet .arm{transform-box:view-box;transform-origin:72px 66px}
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

.pet .tongue{opacity:0;transition:opacity .2s}.pet.g-pant .tongue{opacity:1}
.pet.g-pant .a .body{animation:ppant .3s ease-in-out infinite}
@keyframes ppant{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.05)}}
.pet.g-wag .a .tail{animation:pwagf .2s ease-in-out infinite!important}
@keyframes pwagf{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(26deg)}}
.pet.g-wag .a .body{animation:gbounce .4s ease-in-out infinite}
@keyframes gbounce{0%,100%{transform:none}50%{transform:scale(1.01,.985)}}
.pet.g-tilt .a .head{animation:gtilt 2.6s ease-in-out!important}
@keyframes gtilt{0%,100%{transform:rotate(0)}20%,78%{transform:rotate(-15deg) translateY(1px)}}
.pet.g-sniff .a .head{animation:gsniff 2.6s ease-in-out!important}
@keyframes gsniff{0%,100%{transform:none}14%{transform:translate(2px,7px) rotate(6deg)}28%{transform:translate(0,4px)}42%{transform:translate(2px,8px) rotate(6deg)}56%{transform:translate(0,4px)}72%{transform:translate(2px,7px) rotate(5deg)}88%{transform:none}}
.pet.g-eflick .a .ear{animation:geflick 1s ease-in-out 2!important}
@keyframes geflick{0%,100%{transform:rotate(0)}30%{transform:rotate(-16deg)}60%{transform:rotate(6deg)}}
.pet.g-blink .a .eyes{animation:gblink 2.6s ease-in-out!important}
@keyframes gblink{0%,100%{transform:scaleY(1)}28%,72%{transform:scaleY(.12)}}
.pet.g-flick .a .tail{animation:gflick .5s ease-in-out 3!important}
@keyframes gflick{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(26deg)}}
.pet.g-wash .a .arm{opacity:1!important;animation:gwash .6s ease-in-out infinite!important}
@keyframes gwash{0%,100%{transform:rotate(-36deg)}50%{transform:rotate(-50deg)}}
.pet.g-wash .a .head{animation:gwashh 3.4s ease-in-out!important}
@keyframes gwashh{0%,100%{transform:rotate(0)}15%,85%{transform:rotate(-7deg) translateY(1px)}}
.pet.g-purr .a .body{animation:gpurr .09s linear infinite}
@keyframes gpurr{0%,100%{transform:translateX(-.5px)}50%{transform:translateX(.5px)}}
@media (prefers-reduced-motion:reduce){.pet *{animation:none!important}}
`;
document.head.append(css);

if(!document.getElementById('kpwob')){const f=document.createElement('div');f.style.cssText='position:absolute;width:0;height:0;overflow:hidden';f.innerHTML='<svg xmlns="'+NS+'" width="0" height="0"><filter id="kpwob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035 .05" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';document.body.appendChild(f)}
const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 -5 100 105" stroke-width="2.1">'+h+'</svg>';return d.firstChild};
const F='var(--pk-fill)',PK='var(--pk-pink)',INK='var(--pk-ink)';
// línea limpia con relleno blanco, estilo dibujo simple
// trazo "a mano": relleno corrido (mal registrado), línea doble levemente desfasada
const P=(d,x)=>'<path d="'+d+'" style="fill:'+F+';stroke:none" transform="translate(1.3 1.5)"/><path class="ln" d="'+d+'" '+(x||'')+'/><path class="ln sk" d="'+d+'" transform="translate(.7 -.6) rotate(.6 50 50)"/>';
const L=(d,w)=>'<path class="ln" d="'+d+'"'+(w?' stroke-width="'+w+'"':'')+'/><path class="ln sk" d="'+d+'" transform="translate(.5 .6)"/>';
const tube=(d,w)=>'<path class="ln" d="'+d+'" stroke-width="'+(w+3.6)+'"/><path d="'+d+'" fill="none" stroke="'+F+'" stroke-width="'+w+'" stroke-linecap="round"/>';
const eye=(x,y,r)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="1.75" ry="2.65" fill="'+INK+'" transform="rotate('+r+' '+x+' '+y+')"/>';
const shut=(x,y,w)=>'<path d="M'+(x-w)+' '+y+' Q'+x+' '+(y+w*.8)+' '+(x+w)+' '+y+'" fill="none" stroke="'+INK+'" stroke-width="1.9" stroke-linecap="round"/>';
const nose=(x,y)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="2.5" ry="1.7" fill="'+INK+'"/>';
// patita levantada con almohadilla
const ARM='<g class="arm"><g transform="translate(-8 3)">'+P('M70 59 C79 58 85 53 85.5 46 C86 39 94.5 39.5 95 46.5 C95.5 54 87 66 77 72 L72 74 Z')+
  '<ellipse cx="90" cy="47.5" rx="2.9" ry="2.4" fill="'+INK+'"/><circle cx="86.4" cy="43.6" r="1.15" fill="'+INK+'"/><circle cx="90" cy="42" r="1.15" fill="'+INK+'"/><circle cx="93.4" cy="43.8" r="1.15" fill="'+INK+'"/></g></g>';
const BODY='M37 47 C33 58 29 72 30 84 C31 94 37 99 44 99.5 C53 100 61 99 64 92 C67 85 66 74 64 64 C63 56 62 51 60 47 Z';

// ---------- perrito despierto ----------
const DOG_AWAKE=
 '<g class="tail">'+P('M30 84 C21 86 13 82 12 75 C19 72 27 75 30 80 Z')+'</g>'+
 '<g class="body">'+P(BODY)+L('M48 76 C47 84 49 91 52 98')+L('M38 86 C37 91 39 96 42 99')+'</g>'+
 '<g class="head">'+
 '<g class="ear"><g transform="translate(7 0)">'+P('M28 12 C22 8 14 10 9 17 C5 24 6 34 10 39 C14 43 20 41 22.5 36 C24 32 24 26 24.5 22 Z')+'</g></g>'+
 '<g class="ear" style="animation-delay:2.4s"><g transform="translate(-7 0)">'+P('M64 8 C72 6 80 10 82 18 C84 26 81 33 77 37 C73 40 70 36 70.5 31 C71 26 69 22 67 20 Z')+'</g></g>'+
 P('M29 33 C28 14 40 6 49 6 C60 6 68 16 67 34 C66 49 59 57 48 57 C37 57 30 48 29 33 Z')+
 L('M45 4 L43.5 -1.5 M50 3.5 L50.5 -2.5 M55 4.5 L57.5 -.5')+
 '<g class="eyes"><g class="gl">'+eye(41,37.5,8)+eye(57.5,36,8)+'</g></g>'+nose(50,44)+'<g class="tongue">'+P('M46.5 48.5 C46 55 54 55 53.5 48.5 Z')+'</g>'+
 '</g>'+ARM;

// ---------- perrito dormido ----------
const DOG_SLEEP=
 '<g class="body">'+
 '<g class="tail">'+P('M83 82 C92 84 99 80 100 73 C93 70 86 73 83 78 Z')+'</g>'+
 P('M12 82 C10 66 26 58 46 58 C68 58 84 66 85 80 C85 92 76 98 56 98 L30 98 C18 98 13 92 12 82 Z')+
 L('M66 98 C68 90 66 84 62 80')+
 P('M8 56 C0 58 -2 72 3 82 C7 88 14 86 17 80 C19 74 18 64 16 58 Z')+
 P('M10 74 C8 58 22 50 38 51 C52 52 58 62 56 76 C54 90 40 94 26 92 C16 90 11 84 10 74 Z')+
 L('M28 49 L27 44 M34 48 L34.5 43 M40 49.5 L42.5 44.5')+
 shut(24,68,4.2)+shut(41,69,4.2)+nose(36,77)+
 '</g>'+
 '<text class="zz" x="58" y="46">z</text><text class="zz" x="65" y="37">z</text><text class="zz" x="72" y="28">Z</text>';

// ---------- gatito despierto ----------
const CAT_BODY='M39 47 C34 58 25 72 26 85 C27 95 35 100 46 100 C58 100 68 98 70 90 C72 80 66 66 61 47 Z';
const CAT_AWAKE=
 '<g class="tail"><g transform="translate(14 -2)">'+tube('M20 92 C4 96 -2 80 4 66 C8 57 15 56 16 62',5)+'</g></g>'+
 '<g class="body">'+P(CAT_BODY)+L('M47 74 C46 84 48 92 51 99')+L('M37 88 C36 93 38 97 41 100')+L('M62 78 C66 84 66 92 63 97',1.5)+'</g>'+
 '<g class="head">'+
 '<g class="ear"><g transform="translate(3 2)">'+P('M25 22 C22 13 22 6 24 0 C32 2 41 7 46 12 Z')+P('M28 17 C27 12 27 8 28 5 C32 7 36 9 38 11 Z','style="fill:'+PK+'"')+'</g></g>'+
 '<g class="ear" style="animation-delay:4.2s"><g transform="translate(-3 2)">'+P('M72 22 C75 13 75 6 73 0 C65 2 56 7 51 12 Z')+P('M69 17 C70 12 70 8 69 5 C65 7 61 9 59 11 Z','style="fill:'+PK+'"')+'</g></g>'+
 P('M24 34 C23 16 36 9 49 9 C62 9 74 16 73 34 C72 49 62 57 48.5 57 C35 57 25 49 24 34 Z')+
 L('M45 11 L45.5 17 M50 10.5 L50 16.5 M55 11 L54.5 17')+
 '<g class="eyes"><g class="gl">'+eye(39.5,37,6)+eye(58.5,36.5,6)+'</g></g>'+
 '<path d="M46.5 43 L51.5 43 L49 46 Z" style="fill:'+PK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+L('M49 46 C49 49 46 50 44.5 49 M49 46 C49 49 52 50 53.5 49',1.3)+
 '<g class="wh">'+L('M35 45 L22 42.5 M35 48.5 L23 51.5',1.4)+'</g><g class="wh" style="animation-delay:.25s">'+L('M63 45 L76 42.5 M63 48.5 L75 51.5',1.4)+'</g>'+
 '</g>'+ARM;

// ---------- gatito dormido ----------
const CAT_SLEEP=
 '<g class="body">'+
 P('M8 78 C8 62 26 56 50 56 C76 56 92 64 92 78 C92 92 76 98 50 98 C24 98 8 92 8 78 Z')+
 L('M58 58 C62 66 60 74 56 80 M70 60 C74 68 72 77 68 82 M81 64 C84 71 82 79 78 84')+
 tube('M84 90 C60 102 30 100 16 90',6)+
 P('M14 62 L13 44 C20 45 28 50 32 54 Z')+P('M44 54 C48 49 52 46 55 43 C57 50 57 58 55 64 Z')+
 P('M10 74 C8 58 22 50 36 51 C52 52 58 62 56 76 C54 90 40 94 26 92 C16 90 11 84 10 74 Z')+
 L('M27 50 L27 45 M33 49 L33 44 M39 50 L40.5 45')+
 shut(24,68,4.2)+shut(41,69,4.2)+
 '<path d="M32.5 75 L38 75 L35.2 78.2 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+
 '</g>'+
 '<text class="zz" x="60" y="42">z</text><text class="zz" x="67" y="33">z</text><text class="zz" x="74" y="24">Z</text>';

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
  const g=sl?pick(['sigh','dream','dream']):dog?pick(['hop','woof','heart','wave','wag','tilt','pant','sniff','eflick']):pick(['stretch','miau','heart','wash','blink','flick','purr','eflick']);
  let cls='',txt='',ms=2300;
  if(g==='hop'){cls='g-hop';ms=1300}else if(g==='stretch'){cls='g-stretch';ms=2300}else if(g==='sigh'){cls='g-sigh';ms=2500}else if(g==='heart'){cls='g-heart';ms=2000}
  else if(g==='wave'){cls='g-wave';ms=2100}else if(g==='woof'){cls='say g-hop';txt='¡guau!';ms=2000}else if(g==='miau'){cls='say';txt='miau~';ms=2200}else if(g==='wag'){cls='g-wag';ms=2400}else if(g==='tilt'){cls='g-tilt';ms=2700}else if(g==='pant'){cls='g-pant';ms=3200}else if(g==='sniff'){cls='g-sniff';ms=2700}else if(g==='eflick'){cls='g-eflick';ms=2100}
  else if(g==='wash'){cls='g-wash';ms=3400}else if(g==='blink'){cls='g-blink';ms=2700}else if(g==='flick'){cls='g-flick';ms=1700}else if(g==='purr'){cls='say g-purr';txt='mrrr…';ms=3000}
  else if(g==='dream'){cls='say';txt=dog?'🦴':'🐟';ms=2800}
  if(txt)bub.textContent=txt;cls.split(' ').forEach(c=>pet.classList.add(c));
  setTimeout(()=>cls.split(' ').forEach(c=>pet.classList.remove(c)),ms)}
(function loop(){setTimeout(()=>{try{gesture()}catch(e){}loop()},10000+Math.random()*20000)})();
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
