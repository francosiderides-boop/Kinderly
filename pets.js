// Kinderly · mascotas de compañía (perrito y gatito, dibujados a mano alzada).
// De día están despiertos; de noche (modo noche o pasadas las 22 h / antes de las 7 h) duermen.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const INK='#2F3447';
const css=document.createElement('style');
css.textContent=`
.pets{position:fixed;left:0;right:0;bottom:calc(74px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pet{position:absolute;bottom:-3px;width:66px;height:60px;opacity:0;transform:translateY(8px);transition:opacity .6s ease,transform .6s cubic-bezier(.34,1.4,.64,1)}
.pets.on .pet{opacity:1;transform:none}
.pet.dog{left:20px}.pet.cat{right:20px}
.pet svg{width:100%;height:100%;overflow:visible;filter:url(#khd)}
.pet .a,.pet .z{transition:opacity .5s}
.pet .z{opacity:0;position:absolute;inset:0}
.pet.sleep .a{opacity:0;pointer-events:none}
.pet.sleep .z{opacity:1}
.pet .a{position:absolute;inset:0}
.pet .ln{stroke:${INK};stroke-linecap:round;stroke-linejoin:round}
.pet .nf{fill:none}
.pet .tail{transform-box:fill-box;transform-origin:0% 100%;animation:pwag 1.7s ease-in-out infinite}
.pet.cat .tail{transform-origin:0% 100%;animation:psway 3.6s ease-in-out infinite}
.pet .eyes{transform-box:fill-box;transform-origin:center;animation:pblink 5.5s infinite}
.pet.cat .eyes{animation-duration:7s}
.pet .body{transform-box:fill-box;transform-origin:50% 100%;animation:pbreath 3.6s ease-in-out infinite}
.pet.sleep .body{animation-duration:5s}
.pet .zz{font:700 11px 'Instrument Sans',system-ui,sans-serif;fill:#6F7BAA;opacity:0;animation:pzz 3.6s ease-in-out infinite}
.pet .zz:nth-of-type(2){animation-delay:1.2s}.pet .zz:nth-of-type(3){animation-delay:2.4s}
.pet .ear{transform-box:fill-box;transform-origin:50% 100%;animation:pear 9s ease-in-out infinite}
@keyframes pwag{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(16deg)}}
@keyframes psway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(9deg)}}
@keyframes pblink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
@keyframes pbreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.035)}}
@keyframes pzz{0%{opacity:0;transform:translate(0,4px)}25%{opacity:.9}100%{opacity:0;transform:translate(7px,-12px)}}
@keyframes pear{0%,88%,100%{transform:rotate(0)}92%{transform:rotate(-9deg)}96%{transform:rotate(3deg)}}
@media (prefers-reduced-motion:reduce){.pet *{animation:none!important}}
`;
document.head.append(css);

const S=(t,a,kids)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(kids||[]).forEach(c=>e.append(c));return e};
const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 0 100 90" stroke-width="2.5">'+h+'</svg>';return d.firstChild};

// filtro de trazo tembloroso (efecto lápiz/marcador)
const defs=document.createElement('div');
defs.innerHTML='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="khd" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6"/></filter></defs></svg>';
document.body.append(defs.firstChild);

const CREAM='#F6E7CF',BROWN='#C48B5C',PINK='#F4A9A8',PEACH='#F2B27E',PDARK='#D98B52',WHITE='#FFFFFF';
// cola como tubo con contorno
const tube=(d,fill,w)=>'<path class="ln nf" d="'+d+'" stroke-width="'+(w+4.5)+'"/><path class="nf" d="'+d+'" stroke="'+fill+'" stroke-width="'+w+'" stroke-linecap="round"/>';

const DOG_AWAKE=
 '<g class="tail">'+tube('M72 70 Q90 64 85 46',BROWN,6)+'</g>'+
 '<g class="body"><ellipse class="ln" cx="50" cy="69" rx="24" ry="17" fill="'+CREAM+'"/>'+
 '<ellipse class="ln" cx="40" cy="83" rx="8" ry="5" fill="'+CREAM+'"/><ellipse class="ln" cx="60" cy="83" rx="8" ry="5" fill="'+CREAM+'"/>'+
 '<ellipse class="ln" cx="50" cy="38" rx="23" ry="20" fill="'+CREAM+'"/>'+
 '<g class="ear"><path class="ln" d="M31 25 Q16 29 19 52 Q31 50 34 36 Z" fill="'+BROWN+'"/></g><g class="ear" style="animation-delay:2s"><path class="ln" d="M69 25 Q84 29 81 52 Q69 50 66 36 Z" fill="'+BROWN+'"/></g>'+
 '<ellipse cx="36" cy="46" rx="4.5" ry="3" fill="'+PINK+'" opacity=".55"/><ellipse cx="64" cy="46" rx="4.5" ry="3" fill="'+PINK+'" opacity=".55"/>'+
 '<g class="eyes"><circle cx="41" cy="37" r="3.3" fill="'+INK+'"/><circle cx="59" cy="37" r="3.3" fill="'+INK+'"/><circle cx="42.2" cy="35.8" r="1.1" fill="#fff"/><circle cx="60.2" cy="35.8" r="1.1" fill="#fff"/></g>'+
 '<ellipse cx="50" cy="45" rx="4.4" ry="3.2" fill="'+INK+'"/>'+
 '<path class="ln nf" d="M50 48 Q50 54 44.5 53.5 M50 48 Q50 54 55.5 53.5" stroke-width="2"/>'+
 '<path class="ln" d="M47.5 53.5 Q50 61 52.5 53.5 Z" fill="'+PINK+'" stroke-width="1.8"/></g>';

const DOG_SLEEP=
 '<g class="body"><ellipse class="ln" cx="52" cy="72" rx="34" ry="14" fill="'+CREAM+'"/>'+
 tube('M82 70 Q95 66 91 56',BROWN,6)+
 '<ellipse class="ln" cx="30" cy="80" rx="12" ry="5" fill="'+CREAM+'"/>'+
 '<ellipse class="ln" cx="34" cy="63" rx="19" ry="15" fill="'+CREAM+'"/>'+
 '<path class="ln" d="M22 52 Q9 60 16 75 Q26 71 29 57 Z" fill="'+BROWN+'"/>'+
 '<ellipse cx="43" cy="69" rx="4" ry="2.6" fill="'+PINK+'" opacity=".55"/>'+
 '<path class="ln nf" d="M30 62 Q33.5 66 37 62 M42 62 Q45.5 66 49 62" stroke-width="2"/>'+
 '<ellipse cx="50" cy="66" rx="3.6" ry="2.7" fill="'+INK+'"/></g>'+
 '<text class="zz" x="56" y="44">z</text><text class="zz" x="62" y="36">z</text><text class="zz" x="68" y="28">Z</text>';

const CAT_AWAKE=
 '<g class="tail">'+tube('M68 74 Q94 74 89 52 Q87 44 80 46',PEACH,6)+'</g>'+
 '<g class="body"><ellipse class="ln" cx="48" cy="69" rx="20" ry="17" fill="'+PEACH+'"/>'+
 '<ellipse class="ln" cx="40" cy="83" rx="7" ry="4.6" fill="'+PEACH+'"/><ellipse class="ln" cx="56" cy="83" rx="7" ry="4.6" fill="'+PEACH+'"/>'+
 '<ellipse cx="48" cy="72" rx="9" ry="10" fill="#FBE3CC"/>'+
 '<g class="ear"><path class="ln" d="M29 34 L27 12 L43 24 Z" fill="'+PEACH+'"/><path d="M31 29 L30.5 19 L38 24 Z" fill="'+PINK+'"/></g>'+
 '<g class="ear" style="animation-delay:3.5s"><path class="ln" d="M67 34 L69 12 L53 24 Z" fill="'+PEACH+'"/><path d="M65 29 L65.5 19 L58 24 Z" fill="'+PINK+'"/></g>'+
 '<ellipse class="ln" cx="48" cy="40" rx="22" ry="18" fill="'+PEACH+'"/>'+
 '<path class="nf" d="M43 25 L43 31 M48 24 L48 30 M53 25 L53 31" stroke="'+PDARK+'" stroke-width="2.4" stroke-linecap="round"/>'+
 '<ellipse cx="33" cy="47" rx="4.5" ry="3" fill="'+PINK+'" opacity=".6"/><ellipse cx="63" cy="47" rx="4.5" ry="3" fill="'+PINK+'" opacity=".6"/>'+
 '<g class="eyes"><ellipse cx="39" cy="40" rx="3.2" ry="4" fill="'+INK+'"/><ellipse cx="57" cy="40" rx="3.2" ry="4" fill="'+INK+'"/><circle cx="40.2" cy="38.4" r="1.2" fill="#fff"/><circle cx="58.2" cy="38.4" r="1.2" fill="#fff"/></g>'+
 '<path d="M45.5 46 L50.5 46 L48 49 Z" fill="'+PINK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+
 '<path class="ln nf" d="M48 49 Q45 53 41.5 51 M48 49 Q51 53 54.5 51" stroke-width="1.9"/>'+
 '<path class="ln nf" d="M34 46 L21 44 M34 49 L21 51 M62 46 L75 44 M62 49 L75 51" stroke-width="1.4"/></g>';

const CAT_SLEEP=
 '<g class="body"><ellipse class="ln" cx="50" cy="70" rx="33" ry="16" fill="'+PEACH+'"/>'+
 '<path class="ln nf" d="M60 56 Q64 62 60 68 M70 58 Q74 64 70 70" stroke="'+PDARK+'" stroke-width="2.4"/>'+
 tube('M82 76 Q62 88 30 82',PEACH,6)+
 '<ellipse class="ln" cx="34" cy="66" rx="17" ry="13" fill="'+PEACH+'"/>'+
 '<path class="ln" d="M22 58 L20 46 L30 53 Z" fill="'+PEACH+'"/><path class="ln" d="M44 55 L48 45 L50 58 Z" fill="'+PEACH+'"/>'+
 '<ellipse cx="25" cy="71" rx="3.6" ry="2.4" fill="'+PINK+'" opacity=".6"/>'+
 '<path class="ln nf" d="M27 65 Q30.5 69 34 65 M38 65 Q41.5 69 45 65" stroke-width="2"/>'+
 '<path d="M33 70 L37 70 L35 72.4 Z" fill="'+PINK+'" stroke="'+INK+'" stroke-width="1.2" stroke-linejoin="round"/></g>'+
 '<text class="zz" x="52" y="44">z</text><text class="zz" x="58" y="36">z</text><text class="zz" x="64" y="28">Z</text>';

const mk=(cls,a,z,label)=>{
  const w=document.createElement('div');w.className='pet '+cls;w.setAttribute('aria-hidden','true');
  const A=document.createElement('div');A.className='a';A.append(sv(a));
  const Z=document.createElement('div');Z.className='z';Z.append(sv(z));
  w.append(A,Z);return w};

const host=document.createElement('div');host.className='pets';host.setAttribute('aria-hidden','true');
const dog=mk('dog',DOG_AWAKE,DOG_SLEEP),cat=mk('cat',CAT_AWAKE,CAT_SLEEP);
host.append(dog,cat);document.body.append(host);

const asleep=()=>{const h=new Date().getHours();return document.documentElement.dataset.theme==='dark'||h>=22||h<7};
const sync=()=>{host.classList.toggle('off',off());const s=asleep();dog.classList.toggle('sleep',s);cat.classList.toggle('sleep',s)};
sync();setTimeout(()=>host.classList.add('on'),600);
setInterval(sync,60000);
try{new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(e){}
// el gato se despierta un ratito más tarde que el perro al cambiar de modo
window.KPets={refresh:sync,set:v=>{try{localStorage.setItem(KEY,v?'0':'1')}catch(e){}sync()},on:()=>!off()};

// interruptor en Ajustes
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||document.getElementById('ex-pets'))return;
  const c=document.createElement('div');c.className='card';c.id='ex-pets';c.style.marginTop='14px';
  const b=document.createElement('b');b.textContent='Mascotas de compañía';const p=document.createElement('p');p.className='hint2';p.textContent='Un perrito y un gatito te acompañan sobre la barra de abajo: de día están despiertos y de noche duermen.';
  const t=document.createElement('button');t.type='button';t.className='ghost';const upd=()=>{t.textContent=window.KPets.on()?'Ocultar mascotas':'Mostrar mascotas'};upd();
  t.onclick=()=>{window.KPets.set(!window.KPets.on());upd()};c.append(b,p,t);h.append(c)})();
})();
