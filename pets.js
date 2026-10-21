// Kinderly · mascotas de compañía: un perrito (despierto de día, duerme de noche)
// y un gatito (duerme de día, despierto de noche). Dibujo tipo garabato con la paleta de la app.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const css=document.createElement('style');
css.textContent=`
:root{--pk-ink:#30353F;--pk-fill:#FFFFFF;--pk-pink:#F6B9B9;--pk-cat:#2A2E40;--pk-rim:#2A2E40;--pk-lav:#9AA6D9;--pk-wh:#434A5E;--pk-bk:#5468A3;--pk-bk2:#7686C4;--pk-gold:#D9C58B;--pk-sh:rgba(60,72,130,.2)}
:root[data-theme="dark"]{--pk-ink:#1A1714;--pk-fill:#F1E9DB;--pk-pink:#E8A9A9;--pk-cat:#1B1E2B;--pk-rim:#8F98C8;--pk-lav:#8F9BD0;--pk-wh:#B4BADA;--pk-bk:#6677B8;--pk-bk2:#8896D0;--pk-gold:#CDB97E;--pk-sh:rgba(0,0,0,.4)}
.pets{position:fixed;left:0;right:0;bottom:calc(73px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pets .slot{position:absolute;left:0;right:0;bottom:0;height:0;opacity:0;transition:opacity .5s ease}
.pets[data-v="buscar"] .slot.main,.pets[data-v="descubrir"] .slot.rest{opacity:1}
.pet{position:absolute;bottom:-6px;left:calc(var(--cx,18%) - 32px);width:64px;height:64px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .7s cubic-bezier(.34,1.4,.64,1)}
.pets.on .pet{opacity:1;transform:none}
.pets.on .pet.gone{opacity:0;transform:translateY(6px)}
.pet.dozing{animation:pdoze 1s ease both}.pet.waking{animation:pwake .9s cubic-bezier(.34,1.4,.64,1) both}
@keyframes pdoze{0%{transform:none}45%{transform:translateY(2px) scale(1.02,.92)}100%{transform:none}}
@keyframes pwake{0%{transform:scale(1.04,.88)}35%{transform:translateY(-9px) scale(.96,1.1)}65%{transform:translateY(0) scale(1.03,.95)}100%{transform:none}}
.pet .a,.pet .z{position:absolute;inset:0;transition:opacity .6s}
.pet .z{opacity:0}.pet.sleep .a{opacity:0}.pet.sleep .z{opacity:1}
.pet svg{width:100%;height:100%;overflow:visible}
.pet .tail,.pet .head,.pet .ear,.pet .eyes,.pet .body,.pet .arm,.pet .wh,.pet .gl{will-change:transform}
.pet .ln{stroke:var(--pk-ink);fill:none;stroke-linecap:round;stroke-linejoin:round}
.pet .tail{transform-box:fill-box;transform-origin:0% 100%;animation:pwags 3s ease-in-out infinite}
.pet.cat .tail{animation:psway 4s ease-in-out infinite}
.pet .eyes{transform-box:fill-box;transform-origin:center;animation:pblink 5.5s infinite}
.pet.cat .eyes{animation-duration:8s}
.pet .body{transform-box:fill-box;transform-origin:50% 100%;animation:pbreath 3.6s ease-in-out infinite}
.pet.sleep .body{animation-duration:5.2s}
.pet .ear{transform-box:fill-box;transform-origin:50% 100%;animation:pear 9s ease-in-out infinite}
.pet .zz{font:700 11px 'Instrument Sans',system-ui,sans-serif;fill:#6F7BAA;opacity:0;animation:pzz 3.8s ease-in-out infinite}
.pet .zz:nth-of-type(2){animation-delay:1.25s}.pet .zz:nth-of-type(3){animation-delay:2.5s}
.pet .glint{animation:ptw 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes phead{0%,100%{transform:rotate(0)}22%{transform:rotate(-3deg)}48%{transform:rotate(0)}70%{transform:rotate(2.5deg)}}
.pet .nz{transform-box:fill-box;transform-origin:center;animation:pnose 6.5s ease-in-out infinite}
@keyframes pnose{0%,86%,100%{transform:scale(1)}90%{transform:scale(1.3,1.2)}94%{transform:scale(1)}97%{transform:scale(1.2)}}
.pet.arrive{animation:parrive .9s cubic-bezier(.34,1.5,.64,1)}
@keyframes parrive{0%{transform:translateY(8px) scale(1.04,.9)}40%{transform:translateY(-8px) scale(.97,1.06)}70%{transform:translateY(0) scale(1.02,.97)}100%{transform:none}}
.pet .a .nz,.pet .a .eyes{will-change:transform}
@keyframes pglance{0%,38%,100%{transform:translateX(0)}44%,60%{transform:translateX(-1.8px)}68%,86%{transform:translateX(1.8px)}}
@keyframes pwhisk{0%,90%,100%{transform:rotate(0)}94%{transform:rotate(3deg)}97%{transform:rotate(-2deg)}}
@keyframes pswish{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(14deg)}}
.pet .head{transform-box:view-box;transform-origin:50px 56px;animation:phead 9s ease-in-out infinite}
.pet.cat .head{animation-duration:11s}
.pet .gl{transform:translate(calc(var(--lx,0)*1px),calc(var(--ly,0)*1px));transition:transform .2s ease-out}
.pet .lk{transform-box:view-box;transform-origin:50px 56px;transform:rotate(calc(var(--hr,0)*1deg));transition:transform .3s ease-out;will-change:transform}
.pet.cat .tail{animation:pswish 5s ease-in-out infinite}
@keyframes pswish{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(2.4deg)}}
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
.pet .arm{transform-box:view-box}.pet.dog .arm{transform-origin:68px 66px}.pet.cat .arm{transform-origin:62px 68px}
.pet .tail.r{transform-origin:100% 100%}.pet.dog .a .ear{transform-origin:50% 0%}
.pet.dog .a .arm{animation:pwave 8s ease-in-out infinite}
.pet.cat .a .arm{opacity:0}
.pet.g-wave .arm{opacity:1!important;animation:gwave 2s ease-in-out!important}
@keyframes pwags{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(9deg)}}
@keyframes pwag{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(18deg)}}
@keyframes psway{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(10deg)}}
@keyframes pblink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes pbreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.04)}}
@keyframes pzz{0%{opacity:0;transform:translate(0,4px)}25%{opacity:.9}100%{opacity:0;transform:translate(7px,-12px)}}
@keyframes pear{0%,88%,100%{transform:rotate(0)}92%{transform:rotate(-8deg)}96%{transform:rotate(3deg)}}
@keyframes ptw{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}

.pet.g-ignore .a .head{animation:gignore 3.2s ease-in-out!important}
@keyframes gignore{0%,100%{transform:rotate(0)}18%,80%{transform:rotate(9deg) translateX(1px)}}
.pet.g-ignore .a .gl{transform:translate(2.6px,.4px)!important}
.pet.g-side .a .gl{transform:translate(-2.4px,.3px)!important}
.pet.g-side .a .head{animation:gside 2.6s ease-in-out!important}
@keyframes gside{0%,100%{transform:rotate(0)}20%,75%{transform:rotate(-4deg)}}
.pet .tongue{opacity:0;transition:opacity .2s}.pet.g-pant .tongue{opacity:1}
.pet.g-pant .a .body{animation:ppant .3s ease-in-out infinite}
@keyframes ppant{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.05)}}
.pet.g-wag .a .tail{animation:pwagf .2s ease-in-out infinite!important}
@keyframes pwagf{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(26deg)}}
.pet.g-wag .a .body{animation:gbounce .4s ease-in-out infinite}
@keyframes gbounce{0%,100%{transform:none}50%{transform:scale(1.01,.985)}}
.pet.g-tilt .a .head{animation:gtilt 2.6s ease-in-out!important}
@keyframes gtilt{0%,100%{transform:rotate(0)}20%,78%{transform:rotate(-14deg)}}
.pet.g-sniff .a .head{animation:gsniff 2.6s ease-in-out!important}
@keyframes gsniff{0%,100%{transform:none}14%{transform:rotate(14deg)}28%{transform:rotate(8deg)}42%{transform:rotate(15deg)}56%{transform:rotate(8deg)}72%{transform:rotate(14deg)}88%{transform:none}}
.pet.g-eflick .a .ear{animation:geflick 1s ease-in-out 2!important}
@keyframes geflick{0%,100%{transform:rotate(0)}30%{transform:rotate(-16deg)}60%{transform:rotate(6deg)}}
.pet.g-blink .a .eyes{animation:gblink 2.6s ease-in-out!important}
@keyframes gblink{0%,100%{transform:scaleY(1)}28%,72%{transform:scaleY(.12)}}
.pet.g-flick .a .tail{animation:gflick .5s ease-in-out 3!important}
@keyframes gflick{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(7deg)}}
.pet.g-wash .a .arm{opacity:1!important;animation:gwash .6s ease-in-out infinite!important}
@keyframes gwash{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(7deg)}}
.pet.g-wash .a .head{animation:gwashh 3.4s ease-in-out!important}
@keyframes gwashh{0%,100%{transform:rotate(0)}15%,85%{transform:rotate(5deg) translateY(2px)}}
.pet.g-purr .a .body{animation:gpurr .09s linear infinite}
@keyframes gpurr{0%,100%{transform:translateX(-.5px)}50%{transform:translateX(.5px)}}
@media (prefers-reduced-motion:reduce){.pet *{animation:none!important}}
`;
document.head.append(css);

const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 -5 100 105" stroke-width="2.1">'+h+'</svg>';return d.firstChild};
const F='var(--pk-fill)',PK='var(--pk-pink)',INK='var(--pk-ink)';
const P=(d,c)=>'<path class="ln" d="'+d+'" style="fill:'+(c||F)+'"/>';
const L=(d,w)=>'<path class="ln" d="'+d+'"'+(w?' stroke-width="'+w+'"':'')+'/>';
const B=d=>'<path d="'+d+'" style="fill:var(--pk-cat);stroke:var(--pk-rim);stroke-width:1.3;stroke-linejoin:round"/>';
const dot=(x,y,rx,ry,r)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+INK+'" transform="rotate('+(r||0)+' '+x+' '+y+')"/>';
const shut=(x,y,w,c)=>'<path d="M'+(x-w)+' '+y+' Q'+x+' '+(y+w*.8)+' '+(x+w)+' '+y+'" fill="none" stroke="'+(c||INK)+'" stroke-width="1.9" stroke-linecap="round"/>';
const WH=(d)=>'<path d="'+d+'" fill="none" stroke="var(--pk-wh)" stroke-width="1.2" stroke-linecap="round"/>';
const lid=(x,y,r)=>'<path d="M'+(x-7.5)+' '+(y-10)+' H'+(x+7.5)+' V'+(y-.9)+' H'+(x-7.5)+' Z" style="fill:var(--pk-cat)" transform="rotate('+r+' '+x+' '+y+')"/>';
const eyeW=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="6.3" fill="#fff"/>';
const eyeP=(x,y,px)=>'<circle cx="'+(x+px)+'" cy="'+(y+.6)+'" r="3.3" fill="#1A1820"/><circle cx="'+(x+px+1.1)+'" cy="'+(y-.6)+'" r="1" fill="#fff"/>';

// ======== PERRITO (de frente, sentado, saluda con una patita) ========
const DOG_AWAKE=
 '<g class="tail r">'+P('M28 88 C20 90 12 86 11 78 C18 75 25 78 28 84 Z')+'</g>'+
 '<g class="body">'+P('M35 52 C28 62 24 76 26 88 C28 97 38 99.5 50 99.5 C62 99.5 72 97 74 88 C75 76 71 62 65 52 Z')+L('M50 78 C49 87 50 94 54 98.500')+L('M42 85 C41 91 43 96 47 99')+'</g>'+
 '<g class="head"><g class="lk">'+
 '<g class="ear">'+P('M31 17 C23 13 14 17 12 26 C10 35 13 44 19 45.500 C25 47 28 41 28.500 35 Z')+'</g>'+
 '<g class="ear" style="animation-delay:2.4s">'+P('M69 17 C77 13 86 17 88 26 C90 35 87 44 81 45.500 C75 47 72 41 71.500 35 Z')+'</g>'+
 P('M24 36 C23 18 36 10 50 10 C64 10 77 18 76 36 C75 50 64 58 50 58 C36 58 25 50 24 36 Z')+
 L('M44 9 L42 3 M50 8 L50.500 2 M56 9 L58.500 3.500')+
 '<g class="eyes"><g class="gl">'+dot(38,37,1.9,2.8,8)+dot(62,36,1.9,2.8,-8)+'</g></g>'+'<g class="nz">'+dot(50,45,2.6,1.8)+'</g>'+
 '<g class="tongue"><path class="ln" d="M46.500 48.500 C46 55.500 54 55.500 53.500 48.500 Z" style="fill:'+PK+'"/></g>'+
 '</g></g>'+
 '<g class="arm">'+P('M64 62 C74 61 80 56 82 48 C83 41 91 42 91.500 48 C92 56 85 67 75 74 L69 72 Z')+dot(87,49,2.8,2.3)+dot(83.300,44.200,1.1,1.1)+dot(87,42.600,1.1,1.1)+dot(90.500,44.600,1.1,1.1)+'</g>';
const DOG_SLEEP=
 '<g class="body">'+
 '<g class="tail">'+P('M88 92 C96 92 100 86 98 79 C92 81 89 85 87 88 Z')+'</g>'+
 P('M10 88 C10 76 28 71 50 71 C72 71 90 76 90 88 C90 97 74 100 50 100 C26 100 10 97 10 88 Z')+
 P('M28 98 C28 91 40 90 44 94 C45 98 36 100 28 98 Z')+P('M72 98 C72 91 60 90 56 94 C55 98 64 100 72 98 Z')+
 P('M30 55 C22 52 14 58 13 68 C12 76 17 82 23 80 C28 78 29 70 30 62 Z')+P('M70 55 C78 52 86 58 87 68 C88 76 83 82 77 80 C72 78 71 70 70 62 Z')+
 P('M24 68 C23 52 36 46 50 46 C64 46 77 52 76 68 C75 82 64 88 50 88 C36 88 25 82 24 68 Z')+
 shut(39,68,4.4)+shut(61,68,4.4)+dot(50,75,2.6,1.8)+
 '</g>'+
 '<text class="zz" x="62" y="40">z</text><text class="zz" x="69" y="31">z</text><text class="zz" x="76" y="22">Z</text>';

// ======== GATITO (silueta negra, de frente, sentado) ========
const CAT_AWAKE=
 '<g class="tail r"><path d="M27 93 C10 98 3 82 11 70 C15 64 22 66 20 72" fill="none" stroke="var(--pk-cat)" stroke-width="6" stroke-linecap="round"/></g>'+
 '<g class="body">'+B('M38 52 C32 64 26 78 25 90 C24 98 34 100 50 100 C66 100 76 98 75 90 C74 78 68 64 62 52 Z')+
 '<path d="M50 80 C49 88 50 94 52 99 M40 88 C39 93 41 97 44 99.500" fill="none" stroke="var(--pk-rim)" stroke-width="1.2" stroke-linecap="round" opacity=".75"/></g>'+
 '<g class="head"><g class="lk">'+
 '<g class="ear">'+B('M26 28 C24 18 24 8 28 1 C34 3 42 9 47 15 Z')+'<path d="M30 22 C29 15 29 10 31 6.500 C35 8.500 39 11.500 41.500 15 Z" fill="var(--pk-lav)"/></g>'+
 '<g class="ear" style="animation-delay:4.2s">'+B('M74 28 C76 18 76 8 72 1 C66 3 58 9 53 15 Z')+'<path d="M70 22 C71 15 71 10 69 6.500 C65 8.500 61 11.500 58.500 15 Z" fill="var(--pk-lav)"/></g>'+
 B('M24 35 C24 21 36 13 50 13 C64 13 76 21 76 35 C76 48 65 56 50 56 C35 56 24 48 24 35 Z')+
 '<g class="eyes">'+eyeW(38.5,36)+eyeW(61.5,36)+'<g class="gl">'+eyeP(38.5,36.6,1.9)+eyeP(61.5,36.6,1.9)+'</g>'+lid(38.5,36,9)+lid(61.5,36,-6)+'</g>'+
 '<g class="nz"><path d="M47.500 44.500 L52.500 44.500 L50 47.500 Z" fill="#C99AA6"/></g>'+'<path d="M45.500 50 Q47.800 51.600 50 49.800 Q52.300 51.200 54.800 49.400" fill="none" stroke="var(--pk-lav)" stroke-width="1" stroke-linecap="round" opacity=".85"/>'+
 '<g class="wh">'+WH('M24 43 L9 39.500 M24 47 L8 49 M26 51 L13 57.500')+WH('M76 43 L91 39.500 M76 47 L92 49 M74 51 L87 57.500')+'</g>'+
 '</g></g>'+
 '<g class="arm">'+B('M58 62 C65 58 68 50 66 44 C65 39.500 71.500 38.500 72 43.500 C73 51 71 62 65 71 Z')+'</g>';
const CAT_SLEEP=
 '<g class="body">'+
 '<g class="tail"><path d="M88 90 C76 100 40 102 14 96" fill="none" stroke="var(--pk-cat)" stroke-width="6" stroke-linecap="round"/></g>'+
 B('M10 88 C10 74 28 68 50 68 C72 68 90 74 90 88 C90 97 74 100 50 100 C26 100 10 97 10 88 Z')+
 B('M27 58 C25 50 25 42 28 35 C34 38 39 42 42 47 Z')+B('M73 58 C75 50 75 42 72 35 C66 38 61 42 58 47 Z')+
 B('M24 68 C23 52 36 46 50 46 C64 46 77 52 76 68 C75 82 64 88 50 88 C36 88 25 82 24 68 Z')+
 shut(39,67,4.4,'#E9E4F2')+shut(61,67,4.4,'#E9E4F2')+'<path d="M47.500 73 L52.500 73 L50 76 Z" fill="#C99AA6"/>'+
 '</g>'+
 '<text class="zz" x="62" y="40">z</text><text class="zz" x="69" y="31">z</text><text class="zz" x="76" y="22">Z</text>';

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
const place=()=>{try{[['buscar',sM],['descubrir',sR]].forEach(([k,sl])=>{const b=document.querySelector('nav.tabs button[data-go="'+k+'"]');if(!b)return;const r=b.getBoundingClientRect();if(r.width)sl.style.setProperty('--cx',(r.left+r.width/2).toFixed(1)+'px')})}catch(e){}};
let vReady=false;
const vw=()=>{const v=document.querySelector('.view.on'),k=v?v.dataset.view:'';const ch=host.dataset.v!==k;host.dataset.v=k;place();if(ch&&vReady&&(k==='buscar'||k==='descubrir'))setTimeout(()=>{try{const p=visPet();if(p&&!p.classList.contains('sleep')&&!busy){p.classList.add('arrive');setTimeout(()=>p.classList.remove('arrive'),950)}}catch(e){}},380)};
window.addEventListener('resize',()=>requestAnimationFrame(place));setTimeout(()=>{place();vReady=true},400);setTimeout(place,1500);
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
  const g=sl?pick(['sigh','dream','dream']):dog?pick(['hop','woof','heart','wave','wag','tilt','pant','sniff','eflick']):pick(['stretch','miau','wash','blink','flick','purr','eflick','ignore','sideeye','ignore','sideeye']);
  let cls='',txt='',ms=2300;
  if(g==='hop'){cls='g-hop';ms=1300}else if(g==='stretch'){cls='g-stretch';ms=2300}else if(g==='sigh'){cls='g-sigh';ms=2500}else if(g==='heart'){cls='g-heart';ms=2000}
  else if(g==='wave'){cls='g-wave';ms=2100}else if(g==='woof'){cls='say g-hop';txt='¡guau!';ms=2000}else if(g==='miau'){cls='say';txt='miau.';ms=2200}else if(g==='ignore'){cls='g-ignore say';txt='meh';ms=3200}else if(g==='sideeye'){cls='g-side';ms=2600}else if(g==='wag'){cls='g-wag';ms=2400}else if(g==='tilt'){cls='g-tilt';ms=2700}else if(g==='pant'){cls='g-pant';ms=3200}else if(g==='sniff'){cls='g-sniff';ms=2700}else if(g==='eflick'){cls='g-eflick';ms=2100}
  else if(g==='wash'){cls='g-wash';ms=3400}else if(g==='blink'){cls='g-blink';ms=2700}else if(g==='flick'){cls='g-flick';ms=1700}else if(g==='purr'){cls='say g-purr';txt='mrr…';ms=3000}
  else if(g==='dream'){cls='say';txt=dog?'🦴':'🐟';ms=2800}
  if(txt)bub.textContent=txt;cls.split(' ').forEach(c=>pet.classList.add(c));
  setTimeout(()=>cls.split(' ').forEach(c=>pet.classList.remove(c)),ms)}
(function loop(){setTimeout(()=>{try{gesture()}catch(e){}loop()},10000+Math.random()*20000)})();
// primer gesto temprano para que se note
setTimeout(()=>{try{gesture()}catch(e){}},7000);
try{new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(e){}
// ---- vida propia: mira lo que tocás, reacciona a lo que pasa en la app ----
const visPet=()=>{const v=host.dataset.v,slot=v==='buscar'?sM:v==='descubrir'?sR:null;return slot&&[...slot.children].find(p=>!p.classList.contains('gone'))||null};
let lastPtr=0,raf=0,px=0,py=0,sc=0;
const setLook=(lx,ly,hr)=>{host.style.setProperty('--lx',lx.toFixed(2));host.style.setProperty('--ly',ly.toFixed(2));host.style.setProperty('--hr',hr.toFixed(2))};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function lookAt(x,y){const p=visPet();if(!p||p.classList.contains('sleep'))return;const r=p.getBoundingClientRect(),cx=r.left+r.width*.5,cy=r.top+r.height*.3,nx=clamp((x-cx)/170,-1,1),ny=clamp((y-cy)/230,-1,1);const k=p.classList.contains('cat')?.45:1;setLook(nx*2.2*k,ny*1.8*k,nx*5*k)}
function onPtr(e){const t=e.touches?e.touches[0]:e;if(!t)return;px=t.clientX;py=t.clientY;lastPtr=Date.now();if(!raf)raf=requestAnimationFrame(()=>{raf=0;lookAt(px,py)})}
['pointerdown','pointermove'].forEach(ev=>document.addEventListener(ev,onPtr,{passive:true,capture:true}));
document.addEventListener('touchstart',onPtr,{passive:true,capture:true});
let scT=0;document.addEventListener('scroll',e=>{const y=(e.target===document?document.scrollingElement:e.target).scrollTop||0;const d=y-sc;sc=y;if(Math.abs(d)<2)return;lastPtr=Date.now();setLook(0,d>0?1.8:-1.8,0);clearTimeout(scT);scT=setTimeout(()=>setLook(0,0,0),700)},{passive:true,capture:true});
// mirada de reposo: de vez en cuando mira para algún lado
setInterval(()=>{if(Date.now()-lastPtr<5000||document.hidden)return;const r=Math.random();setLook((Math.random()-.5)*3,(Math.random()-.4)*1.6,r<.5?0:(Math.random()-.5)*6)},3200);
// busca: el bicho mira el cuadro de búsqueda y se interesa
const qEl=document.getElementById('q');
if(qEl){qEl.addEventListener('focus',()=>{const r=qEl.getBoundingClientRect();lastPtr=Date.now()+4000;lookAt(r.left+r.width*.5,r.top+r.height*.5);play('g-eflick')});qEl.addEventListener('input',()=>{lastPtr=Date.now()+2000;const r=qEl.getBoundingClientRect();lookAt(r.left+Math.min(r.width,qEl.value.length*9+20),r.top+r.height*.5)});qEl.addEventListener('blur',()=>setLook(0,0,0))}
function play(cls,txt,ms){const p=visPet();if(!p||p.classList.contains('sleep')||busy)return;const bub=p.querySelector('.bub');if(txt&&bub)bub.textContent=txt;const cs=(cls+(txt?' say':'')).split(' ').filter(Boolean);if(cs.some(c=>p.classList.contains(c)))return;cs.forEach(c=>p.classList.add(c));setTimeout(()=>cs.forEach(c=>p.classList.remove(c)),ms||2200)}
function react(k){const p=visPet();if(!p||p.classList.contains('sleep'))return;const dog=p.classList.contains('dog');
  if(k==='found')play(dog?'g-hop':'g-blink',dog?'¡mirá!':'mm, bien.',2400);
  else if(k==='sent')play(dog?'g-hop g-heart':'g-flick',dog?'¡a leer!':'obvio.',2200);
  else if(k==='goal')play(dog?'g-hop g-heart':'g-stretch',dog?'¡meta!':'no está mal.',2400);
  else if(k==='err')play(dog?'g-tilt':'g-flick',dog?'uy…':'tsk.',2400);
  else if(k==='ok'&&dog)play('g-heart','',1800);
  else if(k==='busy')play(dog?'g-tilt':'g-eflick','',1800)}
const stEl=document.getElementById('status');
if(stEl){let lastT='',foundFor='';new MutationObserver(()=>{const t=stEl.textContent||'',c=stEl.className||'';if(t===lastT)return;lastT=t;
  if(/^Buscando EPUB/.test(t)){foundFor='';react('busy');return}
  const m=/(\d+)\/(\d+) fuentes · (\d+) resultados/.exec(t);if(m&&+m[3]>0&&+m[1]===+m[2]&&foundFor!==t){foundFor=t;react('found');return}
  if(/Enviado a/.test(t))react('sent');else if(/Meta de hoy cumplida/.test(t))react('goal');else if(c==='err')react('err');else if(c==='ok'&&/guardad|copiad|Descargado/i.test(t))react('ok')}).observe(stEl,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']})}
window.KPets={react,refresh:sync,set:v=>{try{localStorage.setItem(KEY,v?'0':'1')}catch(e){}sync();host.classList.toggle('off',off())},on:()=>!off()};

// interruptor en Ajustes
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||document.getElementById('ex-pets'))return;
  const c=document.createElement('div');c.className='card';c.id='ex-pets';c.style.marginTop='14px';
  const b=document.createElement('b');b.textContent='Mascotas de compañía';const p=document.createElement('p');p.className='hint2';p.textContent='Un perrito y un gatito te acompañan sobre la barra de abajo. El que está despierto te espera en Buscar y el que duerme, en Descubrir. De día está despierto el perro; al anochecer se turnan con el gato.';
  const t=document.createElement('button');t.type='button';t.className='ghost';const upd=()=>{t.textContent=window.KPets.on()?'Ocultar mascotas':'Mostrar mascotas'};upd();
  t.onclick=()=>{window.KPets.set(!window.KPets.on());upd()};c.append(b,p,t);h.append(c)})();
})();
