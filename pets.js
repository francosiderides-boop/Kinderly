// Kinderly · mascotas de compañía: un perrito (despierto de día, duerme de noche)
// y un gatito (duerme de día, despierto de noche). Dibujo tipo garabato con la paleta de la app.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const css=document.createElement('style');
css.textContent=`
:root{--pk-ink:#2B2723;--pk-fill:#FFFFFF;--pk-pink:#F6B9B9;--pk-tan:#E6C7A2}
:root[data-theme="dark"]{--pk-ink:#1A1714;--pk-fill:#F1E9DB;--pk-pink:#E8A9A9;--pk-tan:#CFA77B}
.pets{position:fixed;left:0;right:0;bottom:calc(73px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pets .slot{position:absolute;left:0;right:0;bottom:0;height:0;opacity:0;transition:opacity .5s ease}
.pets[data-v="buscar"] .slot.main,.pets[data-v="descubrir"] .slot.rest{opacity:1}
.pet{position:absolute;bottom:-2px;left:calc(10% - 24px);width:84px;height:84px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .7s cubic-bezier(.34,1.4,.64,1)}
.slot.rest .pet{left:auto;right:calc(10% - 24px)}
.pets.on .pet{opacity:1;transform:none}
.pets.on .pet.gone{opacity:0;transform:translateY(6px)}
.pet.dozing{animation:pdoze 1s ease both}.pet.waking{animation:pwake .9s cubic-bezier(.34,1.4,.64,1) both}
@keyframes pdoze{0%{transform:none}45%{transform:translateY(2px) scale(1.02,.92)}100%{transform:none}}
@keyframes pwake{0%{transform:scale(1.04,.88)}35%{transform:translateY(-9px) scale(.96,1.1)}65%{transform:translateY(0) scale(1.03,.95)}100%{transform:none}}
.pet .a,.pet .z{position:absolute;inset:0;transition:opacity .6s}
.pet .z{opacity:0}.pet.sleep .a{opacity:0}.pet.sleep .z{opacity:1}
.pet svg{width:100%;height:100%;overflow:visible;filter:url(#kpwob)}
.pet .ln.sk{stroke-width:.9;opacity:.5}.pet .ln.sk2{stroke-width:.6;opacity:.35}
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
.pet .head{transform-box:view-box;transform-origin:60px 46px;animation:phead 9s ease-in-out infinite}
.pet.cat .head{animation-duration:11s}
.pet .gl{animation:pglance 7s ease-in-out infinite}
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
.pet .arm{transform-box:view-box}.pet.dog .arm{transform-origin:60px 64px}.pet.cat .arm{transform-origin:58px 66px}
.pet .tail.r{transform-origin:100% 100%}.pet.dog .a .ear{transform-origin:70% 0%}
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

if(!document.getElementById('kpwob')){const f=document.createElement('div');f.style.cssText='position:absolute;width:0;height:0;overflow:hidden';f.innerHTML='<svg xmlns="'+NS+'" width="0" height="0"><filter id="kpwob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03 .045" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d1"/><feTurbulence type="fractalNoise" baseFrequency=".22" numOctaves="1" seed="3" result="n2"/><feDisplacementMap in="d1" in2="n2" scale="1.3" xChannelSelector="G" yChannelSelector="R"/></filter></svg>';document.body.appendChild(f)}
const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 -5 100 105" stroke-width="2.1">'+h+'</svg>';return d.firstChild};
const F='var(--pk-fill)',PK='var(--pk-pink)',INK='var(--pk-ink)';
// línea limpia con relleno blanco, estilo dibujo simple
// trazo "a mano": relleno corrido (mal registrado), línea doble levemente desfasada
let _n=0;
const gap=()=>{_n++;const g=2.2+((_n*7)%5)*.7,o=(_n*37)%100;return 'pathLength="100" stroke-dasharray="'+(100-g)+' '+g+'" stroke-dashoffset="-'+o+'"'};
const P=(d,x,c)=>'<path d="'+d+'" style="fill:'+(c||F)+';stroke:none" transform="translate(1.4 1.6)"/><path class="ln" d="'+d+'" '+gap()+' '+(x||'')+'/><path class="ln sk" d="'+d+'" transform="translate(.8 -.7) rotate(.7 50 50)"/><path class="ln sk2" d="'+d+'" transform="translate(-.5 .5) rotate(-.5 50 50)"/>';
const L=(d,w)=>'<path class="ln" d="'+d+'"'+(w?' stroke-width="'+w+'"':'')+'/><path class="ln sk" d="'+d+'" transform="translate(.5 .7)"/>';
const tube=(d,w)=>'<path class="ln" d="'+d+'" stroke-width="'+(w+3.6)+'"/><path d="'+d+'" fill="none" stroke="'+F+'" stroke-width="'+w+'" stroke-linecap="round"/>';
const eye=(x,y,r,k)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+(1.75*(k||1))+'" ry="'+(2.65*(k||1))+'" fill="'+INK+'" transform="rotate('+r+' '+x+' '+y+')"/>';
const shut=(x,y,w)=>'<path d="M'+(x-w)+' '+y+' Q'+x+' '+(y+w*.8)+' '+(x+w)+' '+y+'" fill="none" stroke="'+INK+'" stroke-width="1.9" stroke-linecap="round"/>';
const nose=(x,y)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="2.5" ry="1.7" fill="'+INK+'"/>';
const TAN='var(--pk-tan)';
// miembro: relleno + dos líneas abiertas (sin borde arriba)
const LIMB=(fill,line)=>'<path d="'+fill+'" style="fill:'+F+';stroke:none"/>'+L(line);
// ======== PERRO (de perfil, sentado, mirando a la derecha) ========
const D_TORSO='M46 40 C34 44 22 54 16 70 C12 82 14 94 18 98 L66 98 C68 92 66 82 64 72 C63 62 66 54 66 46 Z';
const DOG_AWAKE=
 '<g class="tail r">'+P('M18 82 C8 82 1 73 2 61 C2 56 6 55 8 58 C11 66 15 70 22 72 Z')+'</g>'+
 '<g class="body">'+P(D_TORSO)+L('M20 76 C28 68 41 72 43 84 C44 92 40 97 33 98',1.8)+P('M14 97 C14 92 30 91 37 95 C39 99 31 100 24 100 L16 100 Z')+L('M30 56 l-3 3.5 M24 62 l-3 3.5',1.2)+'</g>'+
 '<g class="arm">'+LIMB('M55 60 C54 74 56 86 56 93 C56 99 68 99 68 93 C68 86 67 74 66.5 60 Z','M55 68 C54 77 56 86 56 93 C56 99 68 99 68 93 C68 86 67 77 66.5 68')+L('M62 94 L62 98',1.3)+'</g>'+
 '<path d="M49 43 C56 49 62 52 68 51" fill="none" stroke="#5468A3" stroke-width="3.6" stroke-linecap="round"/>'+
 '<g class="head">'+
 P('M58 22 C60 14 72 12 80 18 C84 21 90 24 94 28 C96 32 93 36 88 37 C82 38 78 38 74 42 C68 46 58 42 57 34 Z')+
 L('M69 19.5 l5 -1.5',1.3)+
 '<g class="eyes"><g class="gl">'+eye(73,25.5,0,.95)+'</g></g>'+
 '<ellipse cx="93.6" cy="28.6" rx="3.1" ry="2.5" fill="'+INK+'"/>'+L('M91 36 C86 38.5 80 37 76.5 36',1.4)+
 '<g class="tongue"><path class="ln" d="M82 37.5 C81 45 88 45 87 37 Z" style="fill:'+PK+'"/></g>'+
 '<g class="ear">'+P('M60 17 C52 16 46 24 46 34 C46 42 52 46 57 42 C61 38 63 28 63 20 Z','',TAN)+'</g>'+
 '</g>';
const DOG_SLEEP=
 '<g class="body">'+
 '<g class="tail">'+P('M12 90 C3 91 -2 83 1 75 C5 79 10 81 14 83 Z')+'</g>'+
 P('M8 96 C4 80 14 66 34 62 C52 58 70 62 76 74 C80 84 76 96 66 98 L20 98 C14 98 10 98 8 96 Z')+L('M26 70 C32 66 40 66 46 69 M22 80 l-3 3',1.2)+
 P('M52 92 C52 88 66 88 74 92 C74 98 56 99 52 95 Z')+
 P('M60 66 C60 56 74 52 84 56 C92 59 96 66 94 74 C92 82 84 86 74 86 C66 86 60 78 60 66 Z')+
 shut(77,66,3.6)+'<ellipse cx="94" cy="68.5" rx="3" ry="2.4" fill="'+INK+'"/>'+
 P('M63 58 C54 58 52 72 58 80 C62 84 68 78 69 70 Z','',TAN)+
 '</g>'+
 '<text class="zz" x="62" y="46">z</text><text class="zz" x="69" y="37">z</text><text class="zz" x="76" y="28">Z</text>';

// ======== GATO (de perfil, sentado, mirando a la derecha) ========
const CAT_AWAKE=
 '<g class="body">'+P('M52 40 C38 46 26 60 24 76 C22 90 26 98 34 98 L62 98 C66 96 66 86 64 76 C63 62 64 52 62 44 Z')+
 L('M26 78 C34 70 46 74 48 86 C49 93 44 97 38 98',1.8)+L('M58 66 C58 78 58 90 60 97',1.8)+P('M52 98 C52 94 66 94 67 98 C67 100 53 100 52 98 Z')+
 L('M34 56 C40 62 41 70 38 76 M27 66 C31 70 31 76 29 80',1.4)+'</g>'+
 '<g class="arm">'+LIMB('M52 66 C60 60 69 52 73 45 C76 41 82 43 80 48 C77 55 70 66 62 72 Z','M54 66 C62 60 70 53 73.500 45 C76 41 82 43 80 48 C77 55 70 66 62 72')+'</g>'+
 '<g class="tail">'+tube('M26 94 C42 100 70 100 86 93 C93 89 93 81 89 78',4.6)+'</g>'+
 '<g class="head">'+
 '<g class="ear"><g>'+P('M51 26 L49 6 L63 15 Z')+'</g></g>'+
 '<g class="ear" style="animation-delay:4.2s"><g>'+P('M72 16 L83 4 L85 24 Z')+P('M75 16 L82 8 L83 20 Z','',PK)+'</g></g>'+
 P('M50 30 C50 18 60 14 68 16 C78 18 83 26 83 34 C83 42 75 48 66 48 C56 48 50 40 50 30 Z')+
 L('M62 17 L63 22.5 M67 16 L67.5 21.5 M72 17 L72 22',1.6)+
 '<g class="eyes"><g class="gl">'+eye(64,32,4,1.05)+eye(76.5,31,0,.9)+'</g></g>'+
 '<path d="M79 35.5 L84 35.5 L81.5 38.5 Z" style="fill:'+PK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+L('M81.5 38.5 C81 41.5 78.5 42.5 77 41 M81.5 38.5 C82 41.5 84.5 42 85.5 40.5',1.2)+
 '<g class="wh">'+L('M82 41 L94 39 M82 43.5 L93 46',1.3)+'</g>'+
 '</g>';
const CAT_SLEEP=
 '<g class="body">'+
 P('M10 82 C8 64 24 52 46 52 C70 52 90 62 90 80 C90 94 74 99 50 99 C26 99 12 94 10 82 Z')+
 L('M54 54 C58 62 57 70 54 76 M66 56 C70 63 69 71 66 77 M78 60 C81 66 80 73 77 78',1.5)+
 '<g class="tail">'+tube('M88 84 C76 98 40 100 20 94',4.6)+'</g>'+
 P('M14 68 L12 52 L25 61 Z')+P('M30 62 L39 52 L41 66 Z')+
 P('M12 78 C10 66 20 60 30 62 C40 64 44 74 40 84 C36 92 22 94 16 88 C13 85 12 82 12 78 Z')+
 shut(20,76,3.2)+shut(32,77,3.2)+
 '<path d="M24.5 82 L29.5 82 L27 85 Z" style="fill:'+PK+'" stroke="'+INK+'" stroke-width="1.3" stroke-linejoin="round"/>'+
 '</g>'+
 '<text class="zz" x="46" y="46">z</text><text class="zz" x="53" y="37">z</text><text class="zz" x="60" y="28">Z</text>';

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
