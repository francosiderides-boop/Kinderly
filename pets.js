// Kinderly · mascotas de compañía: un perrito (despierto de día, duerme de noche)
// y un gatito (duerme de día, despierto de noche). Dibujo tipo garabato con la paleta de la app.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const css=document.createElement('style');
css.textContent=`
:root{--pk-ink:#5A4636;--pk-cream:#F5E6CC;--pk-car:#C9915E;--pk-cat:#EEA867;--pk-cat2:#CF7E3B;--pk-white:#FCEED8;--pk-pink:#EFA9A4}
:root[data-theme="dark"]{--pk-ink:#1D1610;--pk-cream:#E6D5B8;--pk-car:#B27F52;--pk-cat:#D69A5B;--pk-cat2:#B06F2F;--pk-white:#EADBC0}
.pets{position:fixed;left:0;right:0;bottom:calc(73px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pets .slot{position:absolute;left:0;right:0;bottom:0;height:0;opacity:0;transition:opacity .5s ease}
.pets[data-v="buscar"] .slot.main,.pets[data-v="descubrir"] .slot.rest{opacity:1}
.pet{position:absolute;bottom:-4px;left:calc(10% - 20px);width:64px;height:58px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .7s cubic-bezier(.34,1.4,.64,1)}
.slot.rest .pet{left:auto;right:calc(10% - 20px)}
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
.pet .head{transform-box:view-box;transform-origin:50px 64px;animation:phead 9s ease-in-out infinite}
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

const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 0 100 90" stroke-width="2.5">'+h+'</svg>';return d.firstChild};
const CR='var(--pk-cream)',CA='var(--pk-car)',CT='var(--pk-cat)',CT2='var(--pk-cat2)',WH='var(--pk-white)',PK='var(--pk-pink)',INK='var(--pk-ink)';
// forma con relleno apenas corrido del contorno (efecto lápiz de color)
const sh=(tag,at,fill)=>'<g><'+tag+' '+at+' fill="'+fill+'" stroke="none" transform="translate(1.5 1.2)"/><'+tag+' class="ln" '+at+'/></g>';
const E=(cx,cy,rx,ry,fill)=>sh('ellipse','cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"',fill);
const P=(d,fill)=>sh('path','d="'+d+'"',fill);
const tube=(d,fill,w)=>'<path class="ln" d="'+d+'" stroke-width="'+(w+5)+'"/><path d="'+d+'" fill="none" stroke="'+fill+'" stroke-width="'+w+'" stroke-linecap="round"/>';
const dot=(x,y,rx,ry)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+INK+'"/>';
const shut=(x,y,w)=>'<path class="ln" d="M'+(x-w)+' '+y+' Q'+x+' '+(y+w*.8)+' '+(x+w)+' '+y+'" stroke-width="2.1"/>';

// ---------- perrito despierto ----------
const DOG_AWAKE=
 '<g class="tail">'+tube('M67 82 Q82 80 81 66',CA,7)+'</g>'+
 '<g class="body">'+
 P('M30 86 Q26 64 50 60 Q74 64 70 86 Q50 90 30 86 Z',CR)+E(41,86,8.5,4.4,CR)+E(59,86,8.5,4.4,CR)+
 P('M23 43 Q21 22 50 21 Q79 22 77 43 Q77 61 50 62 Q23 61 23 43 Z',CR)+
 '<ellipse cx="62" cy="39" rx="9.5" ry="9" fill="'+CA+'" opacity=".9"/>'+
 '<g class="ear">'+P('M25 28 Q9 31 12 53 Q23 57 29 42 Z',CA)+'</g><g class="ear" style="animation-delay:2.4s">'+P('M75 28 Q91 31 88 53 Q77 57 71 42 Z',CA)+'</g>'+
 '<g class="eyes"><g class="gl">'+dot(39,42,2.6,3.1)+dot(61,42,2.6,3.1)+'</g></g>'+
 '<ellipse cx="50" cy="50" rx="5.8" ry="4.2" fill="'+INK+'"/>'+
 '<path class="ln" d="M50 54 Q50 59.5 44.5 59.5 M50 54 Q50 59.5 55.5 59.5" stroke-width="2"/>'+
 '<path d="M47.5 59.5 Q50 68 52.5 59.5 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>'+
 '</g>';

// ---------- perrito dormido ----------
const DOG_SLEEP=
 '<g class="body">'+
 tube('M84 78 Q97 75 93 64',CA,7)+
 P('M16 80 Q14 58 46 56 Q82 54 88 74 Q91 87 70 87 L24 87 Q16 87 16 80 Z',CR)+
 '<path d="M52 59 Q70 56 82 68" fill="none" stroke="'+CA+'" stroke-width="9" stroke-linecap="round" opacity=".9"/>'+
 E(27,84,14,5,CR)+
 E(33,68,19,15.5,CR)+
 P('M20 55 Q5 61 11 80 Q23 79 28 62 Z',CA)+
 shut(34,66,4)+
 '<ellipse cx="47" cy="72" rx="4.6" ry="3.4" fill="'+INK+'"/>'+
 '</g>'+
 '<text class="zz" x="56" y="44">z</text><text class="zz" x="62" y="35">z</text><text class="zz" x="68" y="26">Z</text>';

// ---------- gatito despierto (de noche) ----------
const CAT_AWAKE=
 '<g class="tail">'+tube('M67 84 Q95 88 92 62 Q90 50 82 55',CT,8)+'<path d="M92 62 Q90 50 82 55" fill="none" stroke="'+CT2+'" stroke-width="3.4" stroke-linecap="round" opacity=".9"/></g>'+
 '<g class="body">'+
 P('M29 88 Q24 64 50 60 Q76 64 71 88 Q50 92 29 88 Z',CT)+E(50,79,9.5,9.5,WH)+E(40,88,8.5,4.6,WH)+E(60,88,8.5,4.6,WH)+
 '<path d="M30 74 L36 75 M31 80 L37 80 M70 74 L64 75 M69 80 L63 80" fill="none" stroke="'+CT2+'" stroke-width="2.2" stroke-linecap="round"/>'+
 '</g>'+
 '<g class="head">'+
 '<g class="ear">'+P('M24 35 Q17 12 26 8 Q39 11 47 22 Z',CT)+'<path d="M27 28 Q24 17 28 14 Q35 16 40 23 Z" fill="'+PK+'" opacity=".85"/></g>'+
 '<g class="ear" style="animation-delay:4.2s">'+P('M76 35 Q83 12 74 8 Q61 11 53 22 Z',CT)+'<path d="M73 28 Q76 17 72 14 Q65 16 60 23 Z" fill="'+PK+'" opacity=".85"/></g>'+
 P('M21 42 Q19 21 50 20 Q81 21 79 42 Q85 48 78 53 Q80 60 72 61 Q62 67 50 66 Q38 67 28 61 Q20 60 22 53 Q15 48 21 42 Z',CT)+
 '<path d="M45 22 L45 29 M50 21 L50 28 M55 22 L55 29" fill="none" stroke="'+CT2+'" stroke-width="2.8" stroke-linecap="round"/>'+
 E(50,56,11.5,8,WH)+
 '<ellipse cx="31" cy="53" rx="5" ry="3.2" fill="'+PK+'" opacity=".55"/><ellipse cx="69" cy="53" rx="5" ry="3.2" fill="'+PK+'" opacity=".55"/>'+
 '<g class="eyes"><g class="gl">'+dot(36,45,3.2,4)+dot(64,45,3.2,4)+'</g></g>'+
 '<path d="M47 51 L53 51 L50 54.2 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+
 '<path class="ln" d="M50 54.2 Q50 59 45.5 58.6 M50 54.2 Q50 59 54.5 58.6" stroke-width="2"/>'+
 '<g class="wh"><path class="ln" d="M38 55 L24 52.5 M38 58 L25 61.5" stroke-width="1.4"/></g><g class="wh" style="animation-delay:.2s"><path class="ln" d="M62 55 L76 52.5 M62 58 L75 61.5" stroke-width="1.4"/></g>'+
 '</g>';

// ---------- gatito dormido (de día) ----------
const CAT_SLEEP=
 '<g class="body">'+
 P('M12 73 Q12 55 50 55 Q88 55 88 73 Q88 87 50 87 Q12 87 12 73 Z',CT)+
 '<path d="M54 58 Q58 64 55 71 M66 59 Q70 66 66 73 M77 63 Q80 69 77 76" fill="none" stroke="'+CT2+'" stroke-width="2.6" stroke-linecap="round"/>'+
 tube('M80 83 Q52 94 22 85',CT,7)+
 E(30,70,18,14.5,CT)+
 P('M17 61 L15 46 Q22 46 31 56 Z',CT)+P('M44 57 L50 45 Q54 47 54 62 Z',CT)+
 E(26,75,8,5,WH)+
 shut(24,70,3.8)+shut(37,70,3.8)+
 '<path d="M29 74 L34 74 L31.5 76.8 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.3" stroke-linejoin="round"/>'+
 '</g>'+
 '<text class="zz" x="58" y="44">z</text><text class="zz" x="64" y="35">z</text><text class="zz" x="70" y="26">Z</text>';

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
  const g=sl?pick(['sigh','dream','dream']):dog?pick(['hop','woof','heart','woof']):pick(['stretch','miau','heart','miau']);
  let cls='',txt='',ms=2300;
  if(g==='hop'){cls='g-hop';ms=1300}else if(g==='stretch'){cls='g-stretch';ms=2300}else if(g==='sigh'){cls='g-sigh';ms=2500}else if(g==='heart'){cls='g-heart';ms=2000}
  else if(g==='woof'){cls='say g-hop';txt='¡guau!';ms=2000}else if(g==='miau'){cls='say';txt='miau~';ms=2200}else if(g==='dream'){cls='say';txt=dog?'🦴':'🐟';ms=2800}
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
