// Kinderly · mascotas de compañía: un perrito (despierto de día, duerme de noche)
// y un gatito (duerme de día, despierto de noche). Dibujo tipo garabato con la paleta de la app.
(function(){
'use strict';
const KEY='k_pets_off';
const off=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
const NS='http://www.w3.org/2000/svg';

const css=document.createElement('style');
css.textContent=`
:root{--pk-ink:#3A4468;--pk-fur-d:#F3E3C6;--pk-ear-d:#B9895A;--pk-fur-c:#AEB6D8;--pk-fur-c2:#8793C2;--pk-lite:#FBF6EC;--pk-pink:#F2A3A8;--pk-gold:#D9B45F}
:root[data-theme="dark"]{--pk-ink:#10141F;--pk-fur-d:#E4D3B4;--pk-ear-d:#A87B50;--pk-fur-c:#98A1CA;--pk-fur-c2:#7480B0;--pk-lite:#EEE8DC}
.pets{position:fixed;left:0;right:0;bottom:calc(73px + env(safe-area-inset-bottom,0px));height:0;z-index:7;pointer-events:none}
.pets.off{display:none}
.pet{position:absolute;bottom:-4px;width:64px;height:58px;opacity:0;transform:translateY(10px);transition:opacity .6s ease,transform .7s cubic-bezier(.34,1.4,.64,1)}
.pets.on .pet{opacity:1;transform:none}
.pet.dog{left:calc(10% - 20px)}.pet.cat{right:calc(10% - 20px)}
.pet .a,.pet .z{position:absolute;inset:0;transition:opacity .6s}
.pet .z{opacity:0}.pet.sleep .a{opacity:0}.pet.sleep .z{opacity:1}
.pet svg{width:100%;height:100%;overflow:visible}
.pet .z svg{transform:translateY(-11%)}
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

const sv=h=>{const d=document.createElement('div');d.innerHTML='<svg xmlns="'+NS+'" viewBox="0 0 100 90" stroke-width="2.6">'+h+'</svg>';return d.firstChild};
const FD='var(--pk-fur-d)',ED='var(--pk-ear-d)',FC='var(--pk-fur-c)',FC2='var(--pk-fur-c2)',LT='var(--pk-lite)',PK='var(--pk-pink)',GD='var(--pk-gold)',INK='var(--pk-ink)';
// forma con relleno apenas corrido del contorno (efecto garabato)
const sh=(tag,at,fill,extra)=>'<g><'+tag+' '+at+' fill="'+fill+'" stroke="none" transform="translate(1.7 1.3)"/><'+tag+' class="ln" '+at+' '+(extra||'')+'/></g>';
const E=(cx,cy,rx,ry,fill)=>sh('ellipse','cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"',fill);
const P=(d,fill)=>sh('path','d="'+d+'"',fill);
const tube=(d,fill,w)=>'<path class="ln" d="'+d+'" stroke-width="'+(w+5)+'"/><path d="'+d+'" fill="none" stroke="'+fill+'" stroke-width="'+w+'" stroke-linecap="round"/>';
const eyeOpen=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+INK+'"/><circle cx="'+(x+r*.38)+'" cy="'+(y-r*.4)+'" r="'+(r*.38)+'" fill="#fff"/>';
const eyeShut=(x,y,w)=>'<path class="ln" d="M'+(x-w)+' '+y+' Q'+x+' '+(y+w*.9)+' '+(x+w)+' '+y+'" stroke-width="2.2"/>';
const blush=(x,y)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="4.6" ry="3" fill="'+PK+'" opacity=".6"/>';

// ---------- perrito despierto ----------
const DOG_AWAKE=
 '<g class="tail">'+tube('M64 78 Q86 74 82 54',ED,6)+'</g>'+
 '<g class="body">'+
 E(50,71,18,15,FD)+E(41,84,7.5,4.6,FD)+E(59,84,7.5,4.6,FD)+
 '<path d="M36 60 Q50 67 64 60" fill="none" stroke="'+GD+'" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="66.5" r="3.3" fill="'+GD+'" stroke="'+INK+'" stroke-width="1.6"/>'+
 E(50,39,27,22,FD)+
 '<g class="ear">'+P('M28 24 Q10 27 12 52 Q25 56 33 39 Z',ED)+'</g><g class="ear" style="animation-delay:2.2s">'+P('M72 24 Q90 27 88 52 Q75 56 67 39 Z',ED)+'</g>'+
 E(50,50,12,8.5,LT)+blush(34,47)+blush(66,47)+
 '<g class="eyes">'+eyeOpen(39,38,3.8)+eyeOpen(61,38,3.8)+'</g>'+
 '<ellipse cx="50" cy="45" rx="4.8" ry="3.4" fill="'+INK+'"/>'+
 '<path class="ln" d="M50 48.5 L50 52 M50 52 Q46 56 42.5 53 M50 52 Q54 56 57.5 53" stroke-width="2"/>'+
 '<path class="ln" d="M47 55 Q50 63 53 55 Z" fill="'+PK+'" stroke-width="1.7"/>'+
 '</g>';

// ---------- perrito dormido ----------
const DOG_SLEEP=
 '<g class="body">'+
 tube('M84 72 Q96 68 92 58',ED,6)+
 E(53,72,34,14.5,FD)+
 '<path d="M44 59 Q50 63 52 70" fill="none" stroke="'+GD+'" stroke-width="5" stroke-linecap="round"/>'+
 E(29,82,12,5,FD)+
 E(34,64,21,16,FD)+
 P('M19 52 Q4 60 11 77 Q23 74 28 58 Z',ED)+
 E(45,70,10,7,LT)+blush(26,71)+
 eyeShut(31,63,4.2)+eyeShut(43,63,4.2)+
 '<ellipse cx="50" cy="66" rx="4" ry="3" fill="'+INK+'"/>'+
 '</g>'+
 '<text class="zz" x="58" y="42">z</text><text class="zz" x="64" y="33">z</text><text class="zz" x="70" y="24">Z</text>';

// ---------- gatito despierto (de noche) ----------
const CAT_AWAKE=
 '<g class="tail">'+tube('M66 80 Q95 82 90 58 Q88 48 80 52',FC,6)+'</g>'+
 '<g class="body">'+
 E(50,71,18,15,FC)+E(42,84,7,4.5,LT)+E(58,84,7,4.5,LT)+E(50,74,9,10,LT)+
 '<g class="ear">'+P('M27 32 L24 8 Q27 6 44 20 Z',FC)+'<path d="M29 27 L28 15 L37 21 Z" fill="'+PK+'"/></g>'+
 '<g class="ear" style="animation-delay:4s">'+P('M73 32 L76 8 Q73 6 56 20 Z',FC)+'<path d="M71 27 L72 15 L63 21 Z" fill="'+PK+'"/></g>'+
 E(50,40,26,21,FC)+
 '<path d="M44 21 L44 28 M50 19 L50 27 M56 21 L56 28" fill="none" stroke="'+FC2+'" stroke-width="2.6" stroke-linecap="round"/>'+
 E(50,51,11,7.5,LT)+blush(33,47)+blush(67,47)+
 '<g class="eyes"><ellipse cx="38" cy="39" rx="4.6" ry="5.4" fill="'+INK+'"/><ellipse cx="62" cy="39" rx="4.6" ry="5.4" fill="'+INK+'"/><circle cx="39.8" cy="36.6" r="1.8" fill="#fff"/><circle cx="63.8" cy="36.6" r="1.8" fill="#fff"/><circle cx="37" cy="41.5" r=".9" fill="#fff"/><circle cx="61" cy="41.5" r=".9" fill="#fff"/></g>'+
 '<path d="M46.5 47 L53.5 47 L50 50.6 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>'+
 '<path class="ln" d="M50 50.6 Q46.5 55 42.5 52.5 M50 50.6 Q53.5 55 57.5 52.5" stroke-width="2"/>'+
 '<path class="ln" d="M33 49 L19 46 M33 52 L19 54 M67 49 L81 46 M67 52 L81 54" stroke-width="1.5"/>'+
 '</g>'+
 '<path class="glint" d="M86 20 L88 26 L94 28 L88 30 L86 36 L84 30 L78 28 L84 26 Z" fill="'+GD+'" stroke="none"/>';

// ---------- gatito dormido (de día) ----------
const CAT_SLEEP=
 '<g class="body">'+
 E(50,72,33,15.5,FC)+
 '<path d="M58 59 Q62 65 58 71 M68 60 Q72 66 68 72" fill="none" stroke="'+FC2+'" stroke-width="2.6" stroke-linecap="round"/>'+
 tube('M82 78 Q62 90 30 84',FC,6)+
 E(34,67,19,14,FC)+
 P('M20 58 L16 43 Q19 41 32 50 Z',FC)+P('M46 52 L52 40 Q55 41 55 56 Z',FC)+
 E(26,72,8,5.2,LT)+blush(22,70)+
 eyeShut(29,65,4.2)+eyeShut(41,65,4.2)+
 '<path d="M32 69 L38 69 L35 72.4 Z" fill="'+PK+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>'+
 '</g>'+
 '<text class="zz" x="58" y="42">z</text><text class="zz" x="64" y="33">z</text><text class="zz" x="70" y="24">Z</text>';

const mk=(cls,a,z)=>{
  const w=document.createElement('div');w.className='pet '+cls;w.setAttribute('aria-hidden','true');
  const A=document.createElement('div');A.className='a';A.append(sv(a));
  const Z=document.createElement('div');Z.className='z';Z.append(sv(z));
  w.append(A,Z);return w};

const host=document.createElement('div');host.className='pets';host.setAttribute('aria-hidden','true');
const dog=mk('dog',DOG_AWAKE,DOG_SLEEP),cat=mk('cat',CAT_AWAKE,CAT_SLEEP);
host.append(dog,cat);document.body.append(host);

// el perro duerme de noche; el gato (nocturno) duerme de día
const night=()=>{const h=new Date().getHours();return document.documentElement.dataset.theme==='dark'||h>=21||h<7};
const sync=()=>{host.classList.toggle('off',off());const n=night();dog.classList.toggle('sleep',n);cat.classList.toggle('sleep',!n)};
sync();setTimeout(()=>host.classList.add('on'),600);
setInterval(sync,60000);
try{new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(e){}
window.KPets={refresh:sync,set:v=>{try{localStorage.setItem(KEY,v?'0':'1')}catch(e){}sync()},on:()=>!off()};

// interruptor en Ajustes
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||document.getElementById('ex-pets'))return;
  const c=document.createElement('div');c.className='card';c.id='ex-pets';c.style.marginTop='14px';
  const b=document.createElement('b');b.textContent='Mascotas de compañía';const p=document.createElement('p');p.className='hint2';p.textContent='Un perrito y un gatito te acompañan sobre la barra de abajo. El perro está despierto de día y duerme de noche; el gato, al revés.';
  const t=document.createElement('button');t.type='button';t.className='ghost';const upd=()=>{t.textContent=window.KPets.on()?'Ocultar mascotas':'Mostrar mascotas'};upd();
  t.onclick=()=>{window.KPets.set(!window.KPets.on());upd()};c.append(b,p,t);h.append(c)})();
})();
