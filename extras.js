// Kinderly · extras: introducción, meta diaria, listas (Para leer / Favoritos)
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const say=(t,c)=>{try{window.say(t,c)}catch(e){}};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const keyOf=b=>norm(b.title).replace(/^(el|la|los|las|un|una) /,'')+'|'+norm(String(b.author||'').split(/[;,]/)[0]);

const st=el('style');st.textContent=`
.ex-ov{position:fixed;inset:0;z-index:40;background:rgba(20,24,34,.5);display:flex;align-items:flex-end;justify-content:center;animation:fade .2s ease both}
.ex-sh{width:100%;max-width:520px;background:var(--card);color:var(--ink);border-radius:22px 22px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.18);animation:in .25s ease both}
.ex-sh h3{margin:0 0 4px;font:600 1.2rem var(--serif)}.ex-sh p{margin:0 0 14px;color:var(--mute);font-size:.92rem;line-height:1.5}
.ex-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;margin-top:8px;padding:14px 16px;border-radius:14px;background:var(--card);color:var(--ink);border:1px solid var(--line);font:500 1rem var(--sans);text-align:left}
.ex-opt.on{border-color:var(--green);background:var(--soft)}.ex-opt span:last-child{color:var(--green);font-weight:600;font-size:.85rem}
.ex-intro{position:fixed;inset:0;z-index:45;background:var(--bg);display:flex;flex-direction:column;padding:calc(28px + env(safe-area-inset-top,0px)) 24px calc(24px + env(safe-area-inset-bottom,0px));animation:fade .25s ease both}
.ex-slide{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:460px;width:100%;margin:0 auto;animation:in .3s ease both}
.ex-slide img{width:84px;height:84px;border-radius:20px;margin-bottom:26px}
.ex-slide h2{margin:0 0 12px;font:600 1.9rem/1.15 var(--serif)}.ex-slide p{margin:0;color:var(--mute);font-size:1.05rem;line-height:1.55}
.ex-slide ul{margin:0;padding:0;list-style:none}.ex-slide li{display:flex;gap:14px;align-items:flex-start;margin-top:16px;font-size:1.02rem;line-height:1.45}.ex-slide li b{display:block;font-weight:600}.ex-slide li span{color:var(--mute);font-size:.95rem}
.ex-n{flex:none;width:30px;height:30px;border-radius:50%;background:var(--soft);color:var(--green);display:grid;place-items:center;font:600 .9rem var(--sans)}
.ex-foot{max-width:460px;width:100%;margin:0 auto}.ex-dots{display:flex;gap:7px;justify-content:center;margin-bottom:16px}.ex-dots i{width:7px;height:7px;border-radius:50%;background:var(--line);transition:all .2s}.ex-dots i.on{width:20px;border-radius:4px;background:var(--green)}
.ex-foot button.main{width:100%;padding:15px;font-size:1.02rem}.ex-skip{display:block;margin:10px auto 0;background:none!important;color:var(--mute)!important;border:0!important;font-weight:500}
.ex-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.ex-chips button{flex:1 1 70px;padding:16px 0;font-size:1.05rem;background:var(--card);color:var(--ink);border:1px solid var(--line)}.ex-chips button.on{border-color:var(--green);background:var(--soft);color:var(--green)}
.ex-seg{display:flex;gap:6px;padding:4px;background:var(--soft);border-radius:12px;margin:10px 0 4px}.ex-seg button{flex:1;padding:9px 6px;background:transparent;color:var(--mute);font-size:.88rem;border-radius:9px}.ex-seg button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.ex-li{padding:12px 0;border-top:1px solid var(--line)}.ex-li:first-of-type{border-top:0}.ex-li b{display:block;font:600 1rem var(--serif);overflow-wrap:anywhere}.ex-li small{color:var(--mute)}.ex-la{display:flex;gap:8px;margin-top:9px}.ex-la button{padding:9px 14px;font-size:.86rem}
`;document.head.append(st);

function sheet(build){
  const ov=el('div','ex-ov'),b=el('div','ex-sh');ov.append(b);
  const close=()=>{ov.remove()};ov.addEventListener('click',e=>{if(e.target===ov)close()});
  build(b,close);document.body.append(ov);return close;
}

// ---------- meta diaria ----------
const goal=()=>{const g=+get('kr_goal',10);return g>0?g:10};
function pickGoal(after){
  sheet((b,close)=>{
    b.append(el('h3','','Meta diaria'),el('p','','¿Cuántos minutos querés leer por día? Una meta chica y constante rinde más que una grande.'));
    [5,10,20,30].forEach(m=>{const o=el('button','ex-opt'+(goal()===m?' on':''));o.type='button';o.append(el('span','',m+' minutos'),el('span','',goal()===m?'Actual':''));o.onclick=()=>{set('kr_goal',m);close();if(after)after();rerender()};b.append(o)});
  });
}

// ---------- introducción ----------
function intro(done){
  let i=0,g=goal();
  const root=el('div','ex-intro'),body=el('div'),foot=el('div','ex-foot');
  body.style.cssText='flex:1;display:flex';root.append(body,foot);
  const dots=el('div','ex-dots');for(let k=0;k<3;k++)dots.append(el('i'));
  const main=el('button','main');main.type='button';const skip=el('button','ex-skip','Saltar');skip.type='button';
  foot.append(dots,main,skip);
  const finish=()=>{set('kr_goal',g);try{localStorage.setItem('k_welcome','1')}catch(e){}root.remove();if(done)done();rerender()};
  const draw=()=>{
    body.textContent='';[...dots.children].forEach((d,k)=>d.classList.toggle('on',k===i));
    const s=el('div','ex-slide');
    if(i===0){const im=new Image();im.src='k2-192.png';im.alt='';s.append(im,el('h2','','Libros en español, gratis y legales'),el('p','','Kinderly busca EPUB de fuentes abiertas, para que leas donde quieras sin pagar ni mirar de reojo.'));main.textContent='Siguiente'}
    else if(i===1){s.append(el('h2','','Todo en un solo lugar'));const u=el('ul');
      [['Buscá y descubrí','Por título, autor, portada o según tu ánimo.'],['Leé en la app','Con tipografías, temas, subrayados y audio.'],['Compartí con amigos','Pedí libros y mandalos a tu mail o Kindle.']].forEach(([t,d],k)=>{const l=el('li');l.append(el('div','ex-n',String(k+1)));const x=el('div');x.append(el('b','',t),el('span','',d));l.append(x);u.append(l)});s.append(u);main.textContent='Siguiente'}
    else{s.append(el('h2','','¿Cuánto querés leer por día?'),el('p','','Elegí una meta. Podés cambiarla cuando quieras.'));const c=el('div','ex-chips');
      [5,10,20,30].forEach(m=>{const b=el('button',g===m?'on':'',m+' min');b.type='button';b.onclick=()=>{g=m;[...c.children].forEach(x=>x.classList.toggle('on',x===b))};c.append(b)});s.append(c);main.textContent='Empezar'}
    body.append(s);skip.style.display=i===2?'none':'block';
  };
  main.onclick=()=>{if(i<2){i++;draw()}else finish()};skip.onclick=finish;
  draw();document.body.append(root);
}

// ---------- listas ----------
const LISTS=[['toread','Para leer','Quiero leerlo'],['fav','Favoritos','Favorito']];
const lists=()=>{const l=get('kr_lists',{});LISTS.forEach(([k])=>{if(!l[k])l[k]={}});return l};
const inList=(b,k)=>!!lists()[k][keyOf(b)];
function toggle(b,k){const l=lists(),key=keyOf(b);if(l[k][key])delete l[k][key];else l[k][key]={title:b.title,author:b.author||'',t:Date.now()};set('kr_lists',l)}
function rerender(){try{window.KReader&&window.KReader.renderLibrary()}catch(e){}}
function decorate(b,actions){
  const x=el('button','ghost');x.type='button';
  const lab=()=>{const on=LISTS.some(([k])=>inList(b,k));x.textContent=on?'Guardado':'Guardar';x.classList.toggle('saved',on)};lab();
  x.onclick=()=>sheet((sh,close)=>{
    sh.append(el('h3','',b.title),el('p','',b.author||'Guardalo en una de tus listas.'));
    LISTS.forEach(([k,name,verb])=>{const o=el('button','ex-opt'+(inList(b,k)?' on':''));o.type='button';
      const paint=()=>{o.classList.toggle('on',inList(b,k));o.lastChild.textContent=inList(b,k)?'Guardado':''};
      o.append(el('span','',verb),el('span',''));paint();
      o.onclick=()=>{toggle(b,k);paint();lab();rerender();say(inList(b,k)?'Guardado en '+name:'Quitado de '+name,'ok')};sh.append(o)});
    const c=el('button','ex-opt');c.type='button';c.append(el('span','','Listo'),el('span',''));c.onclick=close;sh.append(c);
  });
  actions.append(x);
}
let seg='toread';
function render(host){
  if(!host)return;
  const c=el('div','card');c.style.marginTop='14px';c.append(el('b','','Mis listas'));
  const s=el('div','ex-seg');
  LISTS.forEach(([k,name])=>{const n=Object.keys(lists()[k]).length,b=el('button',seg===k?'on':'',name+(n?' · '+n:''));b.type='button';b.onclick=()=>{seg=k;rerender()};s.append(b)});
  c.append(s);
  const items=Object.entries(lists()[seg]).sort((a,b)=>b[1].t-a[1].t);
  if(!items.length)c.append(el('p','hint2',seg==='toread'?'Tocá “Guardar” en cualquier libro para armar tu lista de pendientes.':'Marcá tus libros preferidos con “Guardar” para tenerlos a mano.'));
  items.forEach(([key,v])=>{
    const r=el('div','ex-li');r.append(el('b','',v.title));if(v.author)r.append(el('small','',v.author));
    const a=el('div','ex-la'),go=el('button','','Buscar');go.type='button';go.onclick=()=>{try{window.showView('buscar');$('q').value=v.title;$('go').click()}catch(e){}};
    const rm=el('button','ghost','Quitar');rm.type='button';rm.onclick=()=>{const l=lists();delete l[seg][key];set('kr_lists',l);rerender()};
    a.append(go,rm);r.append(a);c.append(r);
  });
  host.append(c);
}

window.KEx={intro,pickGoal,goal,decorate,render};

// introducción la primera vez; en Ajustes se puede volver a ver
try{if(!localStorage.getItem('k_welcome'))intro()}catch(e){}
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||$('ex-set'))return;
  const c=el('div','card');c.id='ex-set';c.style.marginTop='14px';c.append(el('b','','Introducción y meta diaria'),el('p','hint2','Volvé a ver la bienvenida o cambiá cuánto querés leer por día.'));
  const a=el('div','ex-la'),b1=el('button','ghost','Ver introducción'),b2=el('button','ghost','Cambiar meta');b1.type=b2.type='button';b1.onclick=()=>intro();b2.onclick=()=>pickGoal();a.append(b1,b2);c.append(a);h.append(c)})();
rerender();
})();
