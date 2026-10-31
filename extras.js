// Kinderly · extras: introducción, meta diaria, listas y carpetas (Para leer / Favoritos / las tuyas)
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
.ex-sh .ex-cl{margin:16px 0 0}.ex-cg{display:flex;align-items:center;gap:10px;margin-top:8px}.ex-cg input{flex:1;min-width:0;height:50px;padding:0 16px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);font:500 1rem var(--sans)}.ex-cg span{color:var(--mute)}.ex-cg button{flex:none;height:50px;padding:0 22px}
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
  const close=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),250)};ov.addEventListener('click',e=>{if(e.target===ov)close()});
  build(b,close);document.body.append(ov);requestAnimationFrame(()=>ov.classList.add('on'));return close;
}

// ---------- meta diaria ----------
const goal=()=>{const g=+get('kr_goal',10);return g>0?g:10};
function pickGoal(after){
  sheet((b,close)=>{
    const P=[5,10,20,30],g=goal();
    b.append(el('h3','','Meta diaria'),el('p','','¿Cuántos minutos querés leer por día? Tu meta actual: '+g+' min. Una meta chica y constante rinde más que una grande.'));
    const pick=m=>{set('kr_goal',m);close();if(after)after();rerender();say('Meta: '+m+' minutos por día','ok')};
    P.forEach(m=>{const o=el('button','ex-opt'+(g===m?' on':''));o.type='button';o.append(el('span','',m+' minutos'),el('span','',g===m?'Actual':''));o.onclick=()=>pick(m);b.append(o)});
    // cantidad a elección
    const cw=el('div','ex-cg'),ci=el('input');ci.type='number';ci.inputMode='numeric';ci.min=1;ci.max=600;ci.placeholder='Otra cantidad';ci.setAttribute('aria-label','Minutos por día');if(!P.includes(g))ci.value=g;
    const cb=el('button','','Guardar');cb.type='button';
    const saveC=()=>{const m=Math.round(+ci.value);if(!(m>=1&&m<=600)){say('Elegí entre 1 y 600 minutos','err');ci.focus();return}pick(m)};
    cb.onclick=saveC;ci.onkeydown=e=>{if(e.key==='Enter')saveC()};
    cw.append(ci,el('span','','min'),cb);b.append(el('p','ex-cl','O escribí tus minutos:'),cw);
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
// ---------- listas y carpetas ----------
const BASE=[{id:'toread',name:'Para leer',color:'#3E5287',verb:'Quiero leerlo',base:1},{id:'fav',name:'Favoritos',color:'#8A3B3B',verb:'Favorito',base:1}];
const PALETTE=['#3E5287','#8A3B3B','#2F6B5A','#7A5A2B','#5B3F7A','#2B5F7A','#6B2F4F','#4A5568','#8A6D1F','#2F4F7A'];
const folders=()=>{let f=get('kr_folders',null);f=Array.isArray(f)?f.filter(x=>x&&x.id&&x.name):[];
  BASE.slice().reverse().forEach(b=>{if(!f.some(x=>x.id===b.id))f.unshift({id:b.id,name:b.name,color:b.color})});
  return f.map(x=>{const b=BASE.find(y=>y.id===x.id);return b?Object.assign({},x,{base:1,verb:b.verb,name:x.name||b.name}):Object.assign({},x)})};
const saveFolders=f=>set('kr_folders',f.map(x=>({id:x.id,name:x.name,color:x.color})));
const lists=()=>{const l=get('kr_lists',{});folders().forEach(f=>{if(!l[f.id])l[f.id]={}});return l};
const inList=(b,k)=>!!(lists()[k]||{})[keyOf(b)];
function toggle(b,k){const l=lists(),key=keyOf(b);if(l[k][key])delete l[k][key];else{const os=Object.values(l[k]).map(v=>v.o).filter(n=>typeof n==='number');l[k][key]={title:b.title,author:b.author||'',t:Date.now(),o:os.length?Math.min(...os)-1:0}}set('kr_lists',l)}
const ordered=id=>Object.entries(lists()[id]||{}).map(([key,v])=>Object.assign({key},v)).sort((a,b)=>(typeof a.o==='number'?a.o:-(a.t||0))-(typeof b.o==='number'?b.o:-(b.t||0)));
function moveBook(id,key,dir){const arr=ordered(id),i=arr.findIndex(x=>x.key===key),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];const l=lists();arr.forEach((x,n)=>{l[id][x.key].o=n});set('kr_lists',l)}
function sendBook(from,to,key){const l=lists(),v=l[from][key];if(!v)return;delete l[from][key];if(!l[to][key]){const os=Object.values(l[to]).map(x=>x.o).filter(n=>typeof n==='number');l[to][key]=Object.assign({},v,{o:os.length?Math.min(...os)-1:0})}set('kr_lists',l)}
function dropBook(id,key){const l=lists();delete l[id][key];set('kr_lists',l)}
function addFolder(name,color){const f=folders(),id='f'+Date.now().toString(36);f.push({id,name:name.trim().slice(0,30)||'Carpeta',color:color||PALETTE[f.length%PALETTE.length]});saveFolders(f);return id}
function editFolder(id,patch){const f=folders();const x=f.find(y=>y.id===id);if(x)Object.assign(x,patch);saveFolders(f)}
function removeFolder(id){saveFolders(folders().filter(x=>x.id!==id||x.base));const l=get('kr_lists',{});delete l[id];set('kr_lists',l)}
function shiftFolder(id,dir){const f=folders(),i=f.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=f.length)return;[f[i],f[j]]=[f[j],f[i]];saveFolders(f)}
function rerender(){try{window.KReader&&window.KReader.renderLibrary()}catch(e){}}
function decorate(b,actions){
  const x=el('button','ghost');x.type='button';
  const lab=()=>{const on=folders().some(f=>inList(b,f.id));x.textContent=on?'Guardado':'Guardar';x.classList.toggle('saved',on)};lab();
  x.onclick=()=>listSheet(b,lab);
  actions.append(x);
}
function listSheet(b,lab){
  sheet((sh,close)=>{
    const draw=()=>{sh.textContent='';
      sh.append(el('h3','',b.title),el('p','',b.author||'Guardalo en una o más de tus listas.'));
      folders().forEach(f=>{const o=el('button','ex-opt'+(inList(b,f.id)?' on':''));o.type='button';
        const dot=el('i','ls-dot');dot.style.background=f.color;
        const nm=el('span','ls-onm');nm.append(dot,f.verb||f.name);
        o.append(nm,el('span','',inList(b,f.id)?'Guardado':''));
        o.onclick=()=>{toggle(b,f.id);if(lab)lab();rerender();say(inList(b,f.id)?'Guardado en '+f.name:'Quitado de '+f.name,'ok');draw()};sh.append(o)});
      const nb=el('button','ex-opt','');nb.type='button';nb.append(el('span','','＋ Nueva carpeta'),el('span',''));
      nb.onclick=()=>{const g=el('div','ex-cg'),i=el('input');i.type='text';i.maxLength=30;i.placeholder='Nombre de la carpeta';i.setAttribute('aria-label','Nombre de la carpeta');
        const ok=el('button','','Crear');ok.type='button';ok.onclick=()=>{if(!i.value.trim())return;const id=addFolder(i.value);toggle(b,id);if(lab)lab();rerender();say('Guardado en '+i.value.trim(),'ok');draw()};
        g.append(i,ok);nb.replaceWith(g);i.focus()};
      sh.append(nb);
      const c=el('button','ex-opt');c.type='button';c.append(el('span','','Listo'),el('span',''));c.onclick=close;sh.append(c)};
    draw();
  });
}

// ---------- ventana «Mis listas» (estantes / lista) ----------
const sst=el('style');sst.textContent=`
.ls-ov{position:fixed;inset:0;z-index:42;background:rgba(10,12,20,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s}.ls-ov.on{opacity:1}
.ls-sh{width:100%;max-width:680px;max-height:94vh;max-height:94dvh;overflow:auto;background:var(--card);color:var(--ink);border-radius:26px 26px 0 0;padding:16px 16px calc(24px + env(safe-area-inset-bottom,0px));box-shadow:0 -14px 50px rgba(0,0,0,.35)}
@media(min-width:700px){.ls-ov{align-items:center}.ls-sh{border-radius:26px;max-height:90vh}}
.ls-hd{display:flex;align-items:center;gap:10px;margin-bottom:4px}.ls-hd h3{margin:0;font:600 1.3rem var(--serif);flex:1}
.ls-tg{display:flex;padding:3px;border-radius:999px;background:var(--soft);border:1px solid var(--line)}.ls-tg button{padding:7px 13px;font-size:.8rem;background:transparent;color:var(--mute);border-radius:999px}.ls-tg button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.2)}
.ls-x{padding:8px 12px;font-size:.8rem}
.ls-sub{margin:0 0 14px;color:var(--mute);font-size:.85rem}
.ls-sf{margin:0 0 22px}.ls-sfh{display:flex;align-items:center;gap:8px;margin:0 2px 6px}.ls-dot{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none;margin-right:8px;vertical-align:-1px}
.ls-sfh .ls-dot{margin:0}.ls-sfh b{font:600 1.02rem var(--serif);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-sfh small{color:var(--mute)}
.ls-sm{padding:6px 12px;font-size:.78rem}
.ls-empty{height:130px;display:grid;place-items:center;color:var(--mute);font-size:.86rem;padding:0 20px;text-align:center;width:100%}
.ls-pk,.ls-ed{margin:10px 0 0;padding:12px;border-radius:16px;background:var(--soft);border:1px solid var(--line)}.ls-pk b{display:block;font:600 1rem var(--serif)}.ls-pk small{color:var(--mute)}
.ls-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.ls-row button{padding:8px 13px;font-size:.8rem}
.ls-ed input[type=text]{width:100%;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit}
.ls-swa{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}.ls-swa i{width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent}.ls-swa i.on{border-color:var(--ink)}
.ls-new{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:18px;background:transparent;border:1.5px dashed var(--line);color:var(--ink)}
.ls-hint{margin:8px 2px 0;color:var(--mute);font-size:.74rem;text-align:center}
.ls-tree{border:1px solid var(--line);border-radius:16px;overflow:hidden}
.ls-fr{display:flex;align-items:center;gap:10px;width:100%;padding:13px 14px;background:var(--soft);color:var(--ink);border-radius:0;border-top:1px solid var(--line);text-align:left;font:600 .98rem var(--serif)}.ls-fr:first-child{border-top:0}
.ls-fr .chev{width:14px;color:var(--mute);transition:transform .15s;font-size:.8rem}.ls-fr.open .chev{transform:rotate(90deg)}.ls-fr .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-fr small{color:var(--mute);font:500 .8rem var(--sans)}
.ls-bk{padding:10px 14px 10px 38px;border-top:1px solid var(--line);background:var(--card)}.ls-bk b{display:block;font:600 .95rem var(--serif);overflow-wrap:anywhere}.ls-bk small{color:var(--mute)}
.ls-fe{padding:10px 14px 12px 38px;border-top:1px solid var(--line);background:var(--card)}
.ls-card{display:block;width:100%;text-align:left;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:16px 18px;cursor:pointer}
.ls-card .top{display:flex;align-items:center;justify-content:space-between;gap:10px}.ls-card b{font:600 1rem var(--sans)}.ls-card .go{color:var(--green);font-weight:600;font-size:.88rem}
.ls-card .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ls-card .chips span{display:inline-flex;align-items:center;padding:6px 11px;border-radius:999px;background:var(--soft);font-size:.82rem}
.ls-card p{margin:10px 0 0;color:var(--mute);font-size:.88rem}
.ls-onm{display:flex;align-items:center}
.ls-card,.ls-card p,.ls-card .chips span{white-space:normal}
.ls-sf .kr-hs{padding-top:12px}.ls-sf .kr-bk{flex-basis:25%}.ls-sf .kr-bk.sel .kr-bkc{outline:3px solid var(--btn);outline-offset:2px;transform:translateY(-6px)}.ls-sf .kr-bkc{transition:transform .2s}
@media(prefers-reduced-motion:reduce){.ls-sf .kr-bkc,.ls-fr .chev{transition:none}}
`;document.head.append(sst);

const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)};
const readBook=v=>{try{const k=keyOf(v),x=(get('kr_lib',[])||[]).find(y=>keyOf(y)===k);if(x&&window.KReader){window.KReader.open({id:x.id,url:x.url,title:x.title,author:x.author,cached:true,local:x.local});return true}}catch(e){}return false};
const inLib=v=>{try{const k=keyOf(v);return (get('kr_lib',[])||[]).some(y=>keyOf(y)===k)}catch(e){return false}};
function shelfData(){const lib=get('kr_lib',[])||[];
  return folders().map(f=>({id:f.id,name:f.name,color:f.color,books:ordered(f.id).map(v=>{const k=keyOf(v),e=lib.find(y=>keyOf(y)===k)||null;return {title:v.title,author:v.author||'',entry:e,cover:e?(get('kr_cov_'+e.id,'')||e.img||''):''}})}))}
function openLists(){
  if($('ls-ov'))return;
  const ov=el('div','ls-ov');ov.id='ls-ov';const sh=el('div','ls-sh');sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Mis listas');ov.append(sh);
  const close=()=>{ov.classList.remove('on');setTimeout(()=>{ov.remove();rerender()},200);document.removeEventListener('keydown',esc)};
  const esc=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',esc);
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  let view=get('kr_lview','shelves')==='list'?'list':'shelves';const open=new Set(),editing=new Set();let pickedKey=null,pickedFolder=null,moving=false,creating=false,sure=null;
  const draw=()=>{const sc=sh.scrollTop;sh.textContent='';
    const hd=el('div','ls-hd');hd.append(el('h3','','Mis listas'));
    const tg=el('div','ls-tg');tg.setAttribute('role','group');tg.setAttribute('aria-label','Vista');
    [['shelves','Estantes'],['list','Lista']].forEach(([k,n])=>{const b=el('button',view===k?'on':'',n);b.type='button';b.setAttribute('aria-pressed',view===k);b.onclick=()=>{view=k;set('kr_lview',k);draw()};tg.append(b)});
    const x=el('button','ghost ls-x','Cerrar');x.type='button';x.onclick=close;hd.append(tg,x);sh.append(hd);
    sh.append(el('p','ls-sub',view==='shelves'?'Cada lista es un estante. Deslizá hacia los lados y tocá una portada.':'Tus carpetas, como en el explorador de archivos. Tocá una para abrirla.'));
    const body=el('div');sh.append(body);
    if(view==='shelves')folders().forEach(f=>shelf(body,f));else{const tree=el('div','ls-tree');folders().forEach(f=>row(tree,f));body.append(tree);body.style.marginBottom='16px'}
    // nueva carpeta
    if(creating){const e=el('div','ls-ed'),i=el('input');i.type='text';i.maxLength=30;i.placeholder='Nombre (por ejemplo: Ciencia ficción)';i.setAttribute('aria-label','Nombre de la carpeta');let c=PALETTE[folders().length%PALETTE.length];
      const sw=el('div','ls-swa');const ps=()=>{sw.textContent='';PALETTE.forEach(p=>{const d=el('i',p===c?'on':'');d.style.background=p;d.onclick=()=>{c=p;ps()};sw.append(d)})};ps();
      const r=el('div','ls-row');const ok=el('button','','Crear carpeta');ok.type='button';ok.onclick=()=>{if(!i.value.trim()){i.focus();return}addFolder(i.value,c);creating=false;draw()};const no=el('button','ghost','Cancelar');no.type='button';no.onclick=()=>{creating=false;draw()};r.append(ok,no);e.append(i,sw,r);sh.append(e);setTimeout(()=>i.focus(),0)}
    else{const nb=el('button','ls-new','＋ Nueva carpeta');nb.type='button';nb.onclick=()=>{creating=true;draw()};sh.append(nb)}
    sh.append(el('p','ls-hint','Vos decidís cómo agrupar tus libros: por género, por época, por ánimo…'));
    sh.scrollTop=sc;
  };
  const editor=(f,parent)=>{const ed=el('div','ls-ed');
    if(!f.base){const i=el('input');i.type='text';i.maxLength=30;i.value=f.name;i.setAttribute('aria-label','Nombre de la carpeta');ed.append(i);ed._i=i}
    const sw=el('div','ls-swa');PALETTE.forEach(p=>{const d=el('i',p===f.color?'on':'');d.style.background=p;d.onclick=()=>{if(ed._i)editFolder(f.id,{name:ed._i.value.trim()||f.name});editFolder(f.id,{color:p});draw()};sw.append(d)});ed.append(sw);
    const r=el('div','ls-row');
    if(!f.base){const ok=el('button','','Guardar nombre');ok.type='button';ok.onclick=()=>{editFolder(f.id,{name:ed._i.value.trim()||f.name});draw()};r.append(ok)}
    const fs=folders(),ix=fs.findIndex(x=>x.id===f.id);
    const up=el('button','ghost',view==='shelves'?'↑ Subir estante':'↑ Subir');up.type='button';up.disabled=ix<=0;up.onclick=()=>{shiftFolder(f.id,-1);draw()};
    const dn=el('button','ghost',view==='shelves'?'↓ Bajar estante':'↓ Bajar');dn.type='button';dn.disabled=ix>=fs.length-1;dn.onclick=()=>{shiftFolder(f.id,1);draw()};r.append(up,dn);
    if(!f.base){const del=el('button','ghost',sure===f.id?'Tocá otra vez para eliminar':'Eliminar carpeta');del.type='button';del.onclick=()=>{if(sure!==f.id){sure=f.id;draw();return}sure=null;removeFolder(f.id);editing.delete(f.id);draw()};r.append(del)}
    ed.append(r);if(!f.base)ed.append(el('p','ls-hint','Eliminar la carpeta no borra los libros de tu biblioteca.'));parent.append(ed)};
  const actions=(f,v,box)=>{const r=el('div','ls-row');
    const rd=el('button','',inLib(v)?'Leer':'Buscar');rd.type='button';rd.onclick=()=>{if(inLib(v)){close();readBook(v)}else{close();try{window.showView('buscar');$('q').value=v.title;$('go').click()}catch(e){}}};r.append(rd);
    const arr=ordered(f.id),i=arr.findIndex(x=>x.key===v.key);
    const a=el('button','ghost','←');a.type='button';a.setAttribute('aria-label','Mover antes');a.disabled=i<=0;a.onclick=()=>{moveBook(f.id,v.key,-1);draw()};
    const b=el('button','ghost','→');b.type='button';b.setAttribute('aria-label','Mover después');b.disabled=i>=arr.length-1;b.onclick=()=>{moveBook(f.id,v.key,1);draw()};
    const mv=el('button','ghost','Mover a…');mv.type='button';mv.onclick=()=>{moving=!moving;draw()};
    const rm=el('button','ghost','Quitar');rm.type='button';rm.onclick=()=>{dropBook(f.id,v.key);pickedKey=null;draw()};
    r.append(a,b,mv,rm);box.append(r);
    if(moving){const d=el('div','ls-row');folders().filter(x=>x.id!==f.id).forEach(x=>{const o=el('button','ghost','→ '+x.name);o.type='button';o.onclick=()=>{sendBook(f.id,x.id,v.key);pickedKey=null;moving=false;draw()};d.append(o)});box.append(d)}};
  function shelf(parent,f){const w=el('div','ls-sf'),books=ordered(f.id);
    const h=el('div','ls-sfh'),dot=el('span','ls-dot');dot.style.background=f.color;
    const eb=el('button','ghost ls-sm','Editar');eb.type='button';eb.onclick=()=>{editing.has(f.id)?editing.delete(f.id):editing.add(f.id);sure=null;draw()};
    h.append(dot,el('b','',f.name),el('small','',books.length+(books.length===1?' libro':' libros')),eb);w.append(h);
    const wh=el('div','kr-hs');
    if(!books.length)wh.append(el('div','ls-empty','Este estante está vacío. Guardá libros desde la búsqueda o movelos acá.'));
    const libAll=get('kr_lib',[])||[];
    books.forEach(v=>{const e=libAll.find(y=>keyOf(y)===v.key||keyOf(y)===keyOf(v)),cover=e?(get('kr_cov_'+e.id,'')||e.img||''):'';
      const sel=pickedFolder===f.id&&pickedKey===v.key,sp=el('button','kr-bk'+(sel?' sel':''));sp.type='button';sp.setAttribute('aria-label',v.title);sp.setAttribute('aria-pressed',sel);
      const ph=()=>{const p=el('span','kr-bkc ph');p.style.background=PALETTE[hash(v.key)%PALETTE.length];p.append(el('em','',window.kTitle?window.kTitle(v.title):v.title));return p};
      if(cover){const im=el('img','kr-bkc');im.src=cover;im.alt='';im.loading='lazy';im.onerror=()=>im.replaceWith(ph());sp.append(im)}else sp.append(ph());
      sp.onclick=()=>{if(pickedFolder===f.id&&pickedKey===v.key){pickedKey=null;pickedFolder=null}else{pickedKey=v.key;pickedFolder=f.id}moving=false;draw()};wh.append(sp)});
    w.append(wh,el('div','kr-bd'));
    if(pickedFolder===f.id){const v=books.find(x=>x.key===pickedKey);if(v){const pk=el('div','ls-pk');pk.append(el('b','',window.kTitle?window.kTitle(v.title):v.title),el('small','',v.author||''));actions(f,v,pk);w.append(pk)}}
    if(editing.has(f.id))editor(f,w);
    parent.append(w)}
  function row(parent,f){const books=ordered(f.id),isOpen=open.has(f.id);
    const tree=parent;
    const r=el('button','ls-fr'+(isOpen?' open':''));r.type='button';r.setAttribute('aria-expanded',isOpen);
    const dot=el('span','ls-dot');dot.style.background=f.color;dot.style.margin='0';
    r.append(el('span','chev','▶'),dot,el('span','nm',f.name),el('small','',String(books.length)));r.onclick=()=>{isOpen?open.delete(f.id):open.add(f.id);draw()};tree.append(r);
    if(!isOpen)return;
    if(!books.length){const em=el('div','ls-bk');em.append(el('small','','Carpeta vacía'));tree.append(em)}
    books.forEach(v=>{const bk=el('div','ls-bk');bk.append(el('b','',window.kTitle?window.kTitle(v.title):v.title),el('small','',v.author||''));if(pickedFolder===f.id&&pickedKey===v.key)actions(f,v,bk);
      bk.style.cursor='pointer';bk.onclick=e=>{if(e.target.closest('button'))return;if(pickedFolder===f.id&&pickedKey===v.key){pickedKey=null;pickedFolder=null}else{pickedKey=v.key;pickedFolder=f.id}moving=false;draw()};tree.append(bk)});
    const fe=el('div','ls-fe'),eb=el('button','ghost ls-sm',editing.has(f.id)?'Cerrar edición':'Editar carpeta');eb.type='button';eb.onclick=()=>{editing.has(f.id)?editing.delete(f.id):editing.add(f.id);sure=null;draw()};fe.append(eb);if(editing.has(f.id))editor(f,fe);tree.append(fe)}
  draw();document.body.append(ov);requestAnimationFrame(()=>ov.classList.add('on'));
}

// ---------- vocabulario personal (diccionario propio + práctica) ----------
const vget=()=>{const v=get('kr_vocab',[]);return Array.isArray(v)?v:[]};
const vsave=v=>set('kr_vocab',v);
const vstate=x=>!x.reps?'n':((x.ivl||0)>=21?'m':'l');
const vdue=x=>!x.reps||(x.due||0)<=Date.now();
const vHas=w=>vget().some(x=>x.id===norm(w));
function vocabAdd(o){const v=vget(),id=norm(o.w);if(!id)return 'bad';if(v.some(x=>x.id===id))return 'exists';
  v.unshift({id,w:String(o.w).trim().slice(0,60),d:String(o.d||'').slice(0,400),q:String(o.q||'').slice(0,400),book:o.book||'',bid:o.bid||'',au:o.au||'',cfi:o.cfi||'',note:'',reps:0,ivl:0,due:0,t:Date.now()});vsave(v);rerender();return 'added'}
const VL={n:'nueva',l:'aprendiendo',m:'dominada'};
const nextDays=(x,r)=>{const n=x.reps||0,i=x.ivl||0;return r===1?Math.max(1,Math.round(i*1.2)||1):r===2?(n?Math.round(i*2.2):3):(n?Math.round(i*3.2):7)};
const fmtD=d=>d<7?(d===1?'1 día':d+' días'):d<30?Math.round(d/7)+' sem.':Math.round(d/30)+(Math.round(d/30)>1?' meses':' mes');
function vrate(id,r){const v=vget(),y=v.find(z=>z.id===id);if(!y)return;if(r===0){y.due=Date.now()+10*60000}else{const d=nextDays(y,r);y.ivl=d;y.reps=(y.reps||0)+1;y.due=Date.now()+d*864e5}vsave(v)}
const vst=el('style');vst.textContent=`
.vc-hd{display:flex;align-items:center;gap:8px;margin-bottom:4px}.vc-hd h3{margin:0;font:600 1.3rem var(--serif);flex:1;min-width:0}
.vc-pr{padding:9px 14px;font-size:.84rem;white-space:nowrap}.vc-x{padding:8px 11px;font-size:.84rem}
.vc-in{width:100%;height:46px;padding:0 14px;border:1px solid var(--line);border-radius:14px;background:var(--soft);color:var(--ink);font:500 1rem var(--sans)}
.vc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0 8px}.vc-row label{color:var(--mute);font-size:.8rem}
.vc-sel{font:inherit;color:var(--ink);background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:6px 8px;max-width:100%}
.vc-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.vc-chips button{padding:7px 12px;font-size:.8rem}.vc-chips button.on{background:var(--btn)!important;color:var(--btnInk)!important}
.vc-az{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.vc-az button{padding:4px 0;width:28px;font-size:.76rem;background:var(--soft)!important;color:var(--ink)!important;border:1px solid var(--line)!important}.vc-az button.on{background:var(--btn)!important;color:var(--btnInk)!important}.vc-az button[disabled]{opacity:.3}
.vc-lt{background:var(--soft);padding:2px 12px;margin:10px 0 2px;border-radius:8px;font:600 .8rem var(--sans);color:var(--mute)}
.vc-w{border-top:1px solid var(--line);padding:11px 0}.vc-lt+.vc-w{border-top:0}
.vc-wh{display:flex;align-items:center;gap:8px;width:100%;background:none!important;color:var(--ink)!important;padding:0!important;border-radius:0!important;text-align:left;box-shadow:none!important;border:0!important;cursor:pointer}.vc-wh b{font:600 1.05rem var(--serif)}.vc-wh small{margin-left:auto;color:var(--mute);font:500 .78rem var(--sans)}
.vc-dot{width:10px;height:10px;border-radius:50%;flex:none}.vc-dot.n{background:#f29bb3}.vc-dot.l{background:#e0b72f}.vc-dot.m{background:#5fb872}
.vc-wb{display:none;margin-top:8px}.vc-w.open .vc-wb{display:block}.vc-wb p{margin:0 0 6px;font-size:.92rem}
.vc-q{color:var(--mute);font-family:var(--serif);font-style:italic;border-left:3px solid var(--gold);padding-left:10px}
.vc-w mark,.vc-q mark{background:rgba(245,200,60,.4);color:inherit;border-radius:3px;padding:0 2px;font-style:normal}
.vc-bk{display:inline-block;padding:2px 9px;border-radius:999px;background:var(--soft);font-size:.74rem;color:var(--mute);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vc-nt label{display:block;font-size:.78rem;color:var(--mute);margin:8px 0 3px}.vc-nt textarea{width:100%;border:1px solid var(--line);border-radius:12px;background:var(--soft);color:var(--ink);font:inherit;padding:8px 10px}
.vc-act{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}.vc-act button{padding:7px 12px;font-size:.8rem}.vc-sp{flex:1}
.vc-add{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.vc-fc{perspective:900px;margin:8px 0 12px}.vc-fi{position:relative;min-height:240px;transition:transform .5s;transform-style:preserve-3d;cursor:pointer}.vc-fc.flip .vc-fi{transform:rotateY(180deg)}
.vc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:20px;background:var(--soft);border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;text-align:center;overflow:auto}
.vc-face.back{transform:rotateY(180deg)}.vc-word{font:600 2rem var(--serif);overflow-wrap:anywhere}.vc-hint{color:var(--mute);font-size:.8rem;margin-top:10px}.vc-def{font:500 1.05rem var(--serif);margin:0 0 10px}
.vc-bar{height:6px;border-radius:3px;background:var(--soft);overflow:hidden;flex:1}.vc-bar i{display:block;height:100%;background:var(--btn);transition:width .3s}
.vc-rate{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.vc-rate button{display:flex;flex-direction:column;gap:2px;padding:10px 2px;border-radius:14px;font-size:.84rem}.vc-rate small{font-weight:500;opacity:.8;font-size:.7rem}
.vc-rate .a{background:#f29bb3!important;color:#2b0f19!important}.vc-rate .d{background:#f5d142!important;color:#2e2600!important}.vc-rate .k{background:var(--btn)!important;color:var(--btnInk)!important}.vc-rate .e{background:#7fd18b!important;color:#0d2a14!important}
.vc-end{text-align:center;padding:22px 6px}.vc-end b{font:600 1.3rem var(--serif);display:block;margin-bottom:6px}
.ex-vocab .ls-fake{margin-top:10px;padding:9px 12px;border-radius:12px;background:var(--soft);color:var(--mute);font-size:.88rem}
@media(prefers-reduced-motion:reduce){.vc-fi,.vc-bar i{transition:none}}
`;document.head.append(vst);
const vnrm=s=>norm(s);
function hiNode(text,q){const f=document.createDocumentFragment();text=String(text||'');if(!q){f.append(text);return f}const n=text.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  // el texto sin acentos puede tener otro largo: se busca sobre una copia letra por letra
  let map=[],plain='';for(let i=0;i<text.length;i++){const c=text[i].normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();for(const ch of c){plain+=ch;map.push(i)}}
  const k=vnrm(q).replace(/\s+/g,' ').trim();if(!k){f.append(text);return f}
  let i=0,at=0,j;while((j=plain.indexOf(k,at))>=0){const a=map[j],b=map[j+k.length-1]+1;if(a>i)f.append(text.slice(i,a));const m=document.createElement('mark');m.textContent=text.slice(a,b);f.append(m);i=b;at=j+k.length}
  if(i<text.length)f.append(text.slice(i));return f}
const vhay=(x,q)=>{const k=vnrm(q);return vnrm(x.w).includes(k)||vnrm(x.d).includes(k)||vnrm(x.q).includes(k)||vnrm(x.note||'').includes(k)};
function openVocab(opts){
  if($('vc-ov'))return;opts=opts||{};
  const ov=el('div','ls-ov');ov.id='vc-ov';const sh=el('div','ls-sh');sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Mi vocabulario');ov.append(sh);
  const close=()=>{ov.classList.remove('on');setTimeout(()=>{ov.remove();rerender()},200);document.removeEventListener('keydown',esc)};
  const esc=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',esc);
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  let filter='all',term='',book='',sort='az',letter='',view=opts.practice?'practice':'list';const openIds=new Set();
  let queue=[],total=0,done=0,flipped=false,azEl=null,hostEl=null;
  const startPractice=()=>{const v=vget().filter(vdue).sort((a,b)=>(a.due||0)-(b.due||0));queue=v.map(x=>x.id);total=queue.length;done=0;flipped=false;view='practice';draw()};
  const header=right=>{const hd=el('div','vc-hd');hd.append(el('h3','',view==='practice'?'Practicar':'Mi vocabulario'));right.forEach(x=>hd.append(x));sh.append(hd)};
  const readIn=x=>{const lib=get('kr_lib',[])||[];const e=lib.find(y=>y.id===x.bid);if(!e||!window.KReader){say('Ese libro ya no está en tu biblioteca','err');return}close();setTimeout(()=>window.KReader.open({id:e.id,url:e.url,title:e.title,author:e.author,cached:true,local:e.local,cfi:x.cfi||undefined}),230)};
  const draw=()=>{const sc=sh.scrollTop;sh.textContent='';const all=vget(),due=all.filter(vdue).length;
    if(view==='practice'){practice(due);sh.scrollTop=sc;return}
    const pr=el('button','vc-pr','Practicar'+(due?' · '+due:''));pr.type='button';pr.disabled=!due;if(!due)pr.style.opacity='.5';pr.onclick=startPractice;pr.setAttribute('aria-label','Practicar: repasar palabras');
    const x=el('button','ghost vc-x','✕');x.type='button';x.setAttribute('aria-label','Cerrar');x.onclick=close;header([pr,x]);
    sh.append(el('p','ls-sub',all.length+(all.length===1?' palabra':' palabras')+' · '+due+' para practicar hoy. La búsqueda mira la palabra, la definición, la frase y tus notas.'));
    const q=el('input','vc-in');q.type='search';q.placeholder='Buscar en mi vocabulario';q.value=term;q.setAttribute('aria-label','Buscar en mi vocabulario');q.oninput=()=>{term=q.value.trim();list();};sh.append(q);
    const row=el('div','vc-row');const bs=[...new Set(all.map(x=>x.book).filter(Boolean))];
    const sb=el('select','vc-sel');sb.setAttribute('aria-label','Libro');sb.append(new Option('Todos los libros',''));bs.forEach(b=>sb.append(new Option(b,b)));sb.value=book;sb.onchange=()=>{book=sb.value;list()};
    const ss=el('select','vc-sel');ss.setAttribute('aria-label','Orden');ss.append(new Option('A–Z','az'),new Option('Más recientes','new'));ss.value=sort;ss.onchange=()=>{sort=ss.value;list()};row.append(sb,ss);sh.append(row);
    const ch=el('div','vc-chips');[['all','Todas'],['due','Para practicar'],['l','Aprendiendo'],['m','Dominadas']].forEach(([k,n])=>{const b=el('button',filter===k?'on':'ghost',n);b.type='button';b.onclick=()=>{filter=k;draw()};ch.append(b)});sh.append(ch);
    azEl=el('div','vc-az');sh.append(azEl);hostEl=el('div');sh.append(hostEl);
    const ad=el('div','vc-add');ad.append(el('div','ls-sub','Agregar una palabra sin estar leyendo'));const ar=el('div','vc-row');ar.style.margin='0';const ai=el('input','vc-in');ai.type='text';ai.placeholder='Escribí la palabra';ai.setAttribute('aria-label','Palabra nueva');ai.style.flex='1';ai.style.minWidth='140px';
    const ab=el('button','','Buscar y agregar');ab.type='button';ab.onclick=async()=>{const w=ai.value.trim();if(!w)return ai.focus();if(vHas(w)){say('Esa palabra ya está','err');return}ab.disabled=true;ab.textContent='Buscando…';let d='';try{const r=window.KReader&&window.KReader.wik?await window.KReader.wik(w):null;const it=r&&r.items.find(i=>i.d);d=it?it.d:''}catch(e){}
      vocabAdd({w,d,q:'',book:'Agregadas a mano'});ai.value='';ab.disabled=false;ab.textContent='Buscar y agregar';say(d?'Agregada a tu vocabulario':'Agregada. No encontré la definición, podés escribirla en tu nota.','ok');draw()};
    ar.append(ai,ab);ad.append(ar);sh.append(ad);
    list();sh.scrollTop=sc};
  function list(){const all=vget();const az=azEl,host=hostEl;if(!az||!host)return;
    const have=new Set(all.map(x=>vnrm(x.w)[0]));az.textContent='';'abcdefghijklmnopqrstuvwxyz'.split('').forEach(L=>{const b=el('button',letter===L?'on':'',L.toUpperCase());b.type='button';b.disabled=!have.has(L);b.onclick=()=>{letter=letter===L?'':L;list();};az.append(b)});
    let f=all.filter(x=>(filter==='all'||(filter==='due'?vdue(x):vstate(x)===filter))&&(!book||x.book===book)&&(!term||vhay(x,term))&&(!letter||vnrm(x.w)[0]===letter));
    f=sort==='az'?f.slice().sort((a,b)=>a.w.localeCompare(b.w,'es')):f.slice().sort((a,b)=>(b.t||0)-(a.t||0));
    host.textContent='';if(!f.length){host.append(el('p','ls-sub',all.length?'No hay palabras con ese filtro.':'Todavía no guardaste palabras. Tocá una palabra mientras leés y elegí “Guardar en mi vocabulario”.'));return}
    let last='';f.forEach(x=>{
      if(sort==='az'&&vnrm(x.w)[0]!==last){last=vnrm(x.w)[0];host.append(el('div','vc-lt',last.toUpperCase()))}
      const d=el('div','vc-w'+((openIds.has(x.id)||(term&&!vnrm(x.w).includes(vnrm(term))))?' open':''));
      const h=el('button','vc-wh');h.type='button';const dot=el('i','vc-dot '+vstate(x)),b=el('b');b.append(hiNode(x.w,term));h.append(dot,b,el('small','',VL[vstate(x)]+(vdue(x)?' · practicar':'')));
      h.onclick=()=>{d.classList.toggle('open');d.classList.contains('open')?openIds.add(x.id):openIds.delete(x.id)};d.append(h);
      const bd=el('div','vc-wb');const p1=el('p');p1.append(hiNode(x.d||'Sin definición todavía. Escribila en tu nota.',term));bd.append(p1);
      if(x.q){const p2=el('p','vc-q');p2.append(hiNode(x.q,term||x.w));bd.append(p2)}
      const meta=el('div','vc-act');if(x.book)meta.append(el('span','vc-bk',x.book));meta.append(el('span','vc-sp'));bd.append(meta);
      const nt=el('div','vc-nt');nt.append(el('label','','Tu nota'));const ta=el('textarea');ta.rows=2;ta.placeholder='Escribí con tus palabras qué significa, un ejemplo…';ta.value=x.note||'';ta.setAttribute('aria-label','Nota sobre '+x.w);nt.append(ta);bd.append(nt);
      const ac=el('div','vc-act');const sv=el('button','','Guardar nota');sv.type='button';sv.onclick=()=>{const v=vget(),y=v.find(z=>z.id===x.id);if(y){y.note=ta.value.trim().slice(0,500);vsave(v);say('Nota guardada','ok')}};ac.append(sv);
      if(x.bid&&(get('kr_lib',[])||[]).some(y=>y.id===x.bid)){const go=el('button','ghost','Ver en el libro');go.type='button';go.onclick=()=>readIn(x);ac.append(go)}
      ac.append(el('span','vc-sp'));const rm=el('button','ghost','Quitar');rm.type='button';rm.onclick=()=>{vsave(vget().filter(z=>z.id!==x.id));draw()};ac.append(rm);bd.append(ac);d.append(bd);host.append(d)})}
  function practice(due){
    const back=el('button','ghost vc-x','‹ Volver');back.type='button';back.onclick=()=>{view='list';draw()};const x=el('button','ghost vc-x','✕');x.type='button';x.setAttribute('aria-label','Cerrar');x.onclick=close;header([back,x]);
    const v=vget();
    if(!total){sh.append(Object.assign(el('div','vc-end'),{}));const e=sh.lastChild;e.append(el('b','','Todo al día'),el('p','ls-sub','No hay palabras para practicar ahora.'));return}
    if(!queue.length){const e=el('div','vc-end');e.append(el('b','','Práctica completa'),el('p','ls-sub','Practicaste '+total+(total===1?' palabra':' palabras')+'. Las difíciles vuelven pronto.'));const b=el('button','','Volver al vocabulario');b.type='button';b.onclick=()=>{view='list';draw()};e.append(b);sh.append(e);return}
    const c=v.find(z=>z.id===queue[0]);if(!c){queue.shift();draw();return}
    const top=el('div','vc-row');top.style.margin='0 0 6px';top.append(el('small','ls-sub',(done+1)+' de '+total));const bar=el('div','vc-bar'),bi=el('i');bi.style.width=(done/total*100)+'%';bar.append(bi);top.append(bar);sh.append(top);
    const fc=el('div','vc-fc'+(flipped?' flip':'')),fi=el('div','vc-fi');fi.tabIndex=0;fi.setAttribute('role','button');fi.setAttribute('aria-label','Girar tarjeta');
    const f1=el('div','vc-face');f1.append(el('div','vc-word',c.w),el('div','vc-hint','Pensá qué significa y tocá para ver la respuesta'));
    const f2=el('div','vc-face back');f2.append(el('div','vc-def',c.d||'Sin definición. Mirá tu nota.'));if(c.q)f2.append(Object.assign(el('div','vc-q'),{}));if(c.q)f2.lastChild.append(hiNode(c.q,c.w));if(c.note){const n=el('div','ls-sub','Tu nota: '+c.note);n.style.marginTop='8px';f2.append(n)}
    fi.append(f1,f2);fc.append(fi);sh.append(fc);
    const rt=el('div','vc-rate');rt.style.cssText=flipped?'':'opacity:.4;pointer-events:none';
    [['Otra vez','a','10 min',0],['Difícil','d',fmtD(nextDays(c,1)),1],['Bien','k',fmtD(nextDays(c,2)),2],['Fácil','e',fmtD(nextDays(c,3)),3]].forEach(([n,k,s,r])=>{const b=el('button',k);b.type='button';b.append(n,el('small','',s));
      b.onclick=()=>{const id=queue.shift();vrate(id,r);if(r===0)queue.push(id);else done++;flipped=false;draw()};rt.append(b)});sh.append(rt);
    const flip=()=>{flipped=!flipped;fc.classList.toggle('flip',flipped);rt.style.cssText=flipped?'':'opacity:.4;pointer-events:none'};fi.onclick=flip;fi.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}};
  }
  draw();document.body.append(ov);requestAnimationFrame(()=>ov.classList.add('on'));
}

let seg='toread';
function render(host){
  if(!host)return;
  const fs=folders(),l=lists(),total=fs.reduce((n,f)=>n+Object.keys(l[f.id]||{}).length,0);
  const c=el('button','card ex-lists ls-card');c.type='button';c.style.marginTop='14px';c.setAttribute('aria-label','Abrir Mis listas');
  const top=el('div','top');top.append(el('b','','Mis listas'),el('span','go','Abrir ›'));c.append(top);
  const ch=el('div','chips');fs.slice(0,6).forEach(f=>{const s=el('span','');const d=el('i','ls-dot');d.style.background=f.color;s.append(d,f.name+' · '+Object.keys(l[f.id]||{}).length);ch.append(s)});if(fs.length>6)ch.append(el('span','','+'+(fs.length-6)));c.append(ch);
  if(!total)c.append(el('p','','Tocá “Guardar” en cualquier libro para armar tus listas, o creá tus propias carpetas.'));
  c.onclick=openLists;host.append(c);
  {const vv=vget(),vd=vv.filter(vdue).length;const t=el('button','card ex-vocab ls-card');t.type='button';t.style.marginTop='14px';t.setAttribute('aria-label','Abrir Mi vocabulario');
   const tp=el('div','top');tp.append(el('b','','Mi vocabulario'),el('span','go','Abrir ›'));t.append(tp);
   const ch=el('div','chips');ch.append(el('span','',vv.length+(vv.length===1?' palabra':' palabras')),el('span','',vd+' para practicar'));t.append(ch);
   t.append(el('div','ls-fake','Buscar una palabra…'));if(!vv.length)t.append(el('p','','Al leer, tocá una palabra y elegí “Guardar en mi vocabulario”.'));
   t.onclick=()=>openVocab();host.append(t)}
  try{ach(host)}catch(e){}
}

// ---------- página de estadísticas ----------
function statsPage(){
  const old=$('ks-pg');if(old)old.remove();
  const st=get('kr_st',{}),lib=get('kr_lib',[]),goalM=(window.KEx&&window.KEx.goal())||10,GS=goalM*60;
  const dk=d=>d.toLocaleDateString('sv'),day=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
  const mins=s=>Math.round(s/60),fmtH=s=>{const m=mins(s);return m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min'};
  const sum=n=>{let t=0;for(let i=0;i<n;i++)t+=st[dk(day(i))]||0;return t};
  const keys=Object.keys(st);const tot=Math.max(+localStorage.getItem('kr_tot')||0,keys.reduce((a,k)=>a+(st[k]||0),0));
  // rachas
  let cur=0;{let i=(st[dk(day(0))]||0)>=60?0:1;while((st[dk(day(i))]||0)>=60){cur++;i++}}
  let best=0,run=0,prev=null;keys.sort().forEach(k=>{if((st[k]||0)>=60){const d=new Date(k+'T12:00:00');run=prev&&Math.round((d-prev)/864e5)===1?run+1:1;prev=d;best=Math.max(best,run)}else{run=0;prev=null}});
  const activeDays=keys.filter(k=>(st[k]||0)>=60).length;
  let goalDays=0;for(let i=0;i<30;i++)if((st[dk(day(i))]||0)>=GS)goalDays++;
  // velocidad
  let q={w:0,m:0};try{q=JSON.parse(localStorage.getItem('kr_wpm')||'null')||q}catch(e){}
  const wpm=(q.m>=1.5&&q.w>=250)?Math.round(q.w/q.m):0;
  // libros
  const done=lib.filter(b=>(b.pct||0)>=.97).length,going=lib.filter(b=>(b.pct||0)>0&&(b.pct||0)<.97).length;
  let hl=0,notes=0,bm=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^kr_hl_/.test(k)){try{const a=JSON.parse(localStorage.getItem(k));hl+=a.length;notes+=a.filter(x=>x.note).length}catch(e){}}else if(/^kr_bm_/.test(k)){try{bm+=JSON.parse(localStorage.getItem(k)).length}catch(e){}}}}catch(e){}
  // por día de la semana (promedio sobre últimos 56 días)
  const wd=[0,0,0,0,0,0,0],wc=[0,0,0,0,0,0,0];for(let i=0;i<56;i++){const d=day(i);wd[(d.getDay()+6)%7]+=st[dk(d)]||0;wc[(d.getDay()+6)%7]++}
  const wavg=wd.map((v,i)=>v/Math.max(1,wc[i]));const wmax=Math.max(...wavg,1);const bestWd=wavg.indexOf(Math.max(...wavg));
  const WN=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],WL=['lunes','martes','miércoles','jueves','viernes','sábados','domingos'];
  const pg=el('div','ks-pg');pg.id='ks-pg';
  const hd=el('div','ks-h');hd.append(el('b','','Mis estadísticas'));const x=el('button','ghost','✕');x.type='button';x.setAttribute('aria-label','Cerrar');x.onclick=()=>{pg.classList.remove('on');setTimeout(()=>pg.remove(),250)};hd.append(x);pg.append(hd);
  const bd=el('div','ks-b');pg.append(bd);
  const sec=(t,n)=>{const w=el('section','ks-s');w.append(el('h3','',t),n);bd.append(w);return w};
  const tile=(v,l,cls)=>{const t=el('div','ks-t'+(cls?' '+cls:''));t.append(el('b','',v),el('small','',l));return t};
  // héroe
  const hero=el('div','ks-hero');hero.append(tile(String(cur),cur===1?'día seguido':'días seguidos','hot'),tile(String(best),'mejor racha'),tile(fmtH(tot),'leídas en total'));bd.append(hero);
  // tiempo
  const g1=el('div','ks-grid');g1.append(tile(fmtH(st[dk(day(0))]||0),'hoy'),tile(fmtH(sum(7)),'últimos 7 días'),tile(fmtH(sum(30)),'últimos 30 días'),tile(activeDays?fmtH(tot/Math.max(1,activeDays)):'0 min','promedio por día activo'));sec('Tiempo de lectura',g1);
  // 30 días
  const ch=el('div','ks-ch');let mx=GS;for(let i=0;i<30;i++)mx=Math.max(mx,st[dk(day(i))]||0);
  for(let i=29;i>=0;i--){const v=st[dk(day(i))]||0,col=el('div','ks-c'),bar=el('i');bar.style.height=Math.max(v?6:2,Math.round(v/mx*100))+'%';bar.style.animationDelay=(29-i)*14+'ms';if(v>=GS)bar.className='done';col.append(bar);ch.append(col)}
  const c30=el('div');c30.append(ch,el('p','ks-n','Cada barra es un día. En azul fuerte, los días en que cumpliste tu meta de '+goalM+' min: '+goalDays+' de los últimos 30.'));sec('Últimos 30 días',c30);
  // mapa de calor
  const hm=el('div','ks-hm');for(let w=13;w>=0;w--){const col=el('div','ks-hc');for(let d=0;d<7;d++){const n=w*7+(6-d);const dd=day(n),v=st[dk(dd)]||0;const c=el('span','');const lv=v<60?0:v<GS*.5?1:v<GS?2:v<GS*2?3:4;c.className='l'+lv;c.title=dd.toLocaleDateString('es-AR')+' · '+mins(v)+' min';col.append(c)}hm.append(col)}
  const hw=el('div');hw.append(hm,el('p','ks-n','Las últimas 14 semanas. Cuanto más oscuro, más leíste ese día.'));sec('Constancia',hw);
  // días de la semana
  const wr=el('div','ks-wd');wavg.forEach((v,i)=>{const c=el('div','ks-wc'),b=el('i');b.style.height=Math.max(3,Math.round(v/wmax*100))+'%';if(i===bestWd&&v>0)b.className='done';c.append(b,el('small','',WN[i]));wr.append(c)});
  const ww=el('div');ww.append(wr,el('p','ks-n',wavg[bestWd]>0?'Leés más los '+WL[bestWd]+' (en promedio '+mins(wavg[bestWd])+' min).':'Todavía no hay datos suficientes.'));sec('¿Cuándo leés más?',ww);
  // velocidad
  const sp=el('div');if(wpm){const g=el('div','ks-grid');g.append(tile(String(wpm),'palabras por minuto'),tile(String(Math.round(wpm*60/250)),'páginas por hora'),tile(fmtH(80000/wpm*60),'para una novela de 80.000 palabras'),tile(fmtH(300*250/wpm*60),'para un libro de 300 páginas'));sp.append(g,el('p','ks-n','Se calcula mientras leés en la app, sin contar pausas ni saltos. Mejora con el uso.'))}else sp.append(el('p','ks-n','Todavía no tengo datos. Leé unas páginas seguidas en el lector y voy a calcular tu ritmo.'));sec('Velocidad de lectura',sp);
  // libros
  const g2=el('div','ks-grid');g2.append(tile(String(lib.length),'en tu biblioteca'),tile(String(done),'terminados'),tile(String(going),'en curso'),tile(String(hl),'subrayados'),tile(String(notes),'notas'),tile(String(bm),'marcadores'));sec('Libros',g2);
  // en curso
  if(going){const l=el('div');lib.filter(b=>(b.pct||0)>0&&(b.pct||0)<.97).slice(0,5).forEach(b=>{const r=el('div','ks-bk');const t=el('div');t.append(el('b','',b.title),el('small','',Math.round((b.pct||0)*100)+'%'));const bar=el('div','lib-bar'),i=el('i');i.style.width=Math.round((b.pct||0)*100)+'%';bar.append(i);r.append(t,bar);l.append(r)});sec('Lo que estás leyendo',l)}
  document.body.append(pg);requestAnimationFrame(()=>pg.classList.add('on'));
}

// ---------- listas de lectura sugeridas ----------
const SUG=[
 ['📚','Clásicos para empezar','#3E5287','#232B45',[['Lazarillo de Tormes','Anónimo','Breve, ácida y la madre de la novela picaresca.'],['Don Quijote de la Mancha','Cervantes','La novela fundadora; se lee por tramos.'],['La Celestina','Fernando de Rojas','Pasión y ambición en un diálogo vertiginoso.'],['Marianela','Pérez Galdós','Una historia corta y conmovedora.'],['Rimas y leyendas','Bécquer','Poesía y relatos de misterio.'],['El sombrero de tres picos','Alarcón','Comedia rural, ligera y divertida.'],['Doña Perfecta','Pérez Galdós','Fanatismo y amor en un pueblo cerrado.'],['Pepita Jiménez','Valera','Una novela epistolar delicada.']]],
 ['🕯️','Terror y misterio','#4A2C4F','#1D1424',[['Frankenstein','Mary Shelley','El origen de la ciencia ficción gótica.'],['Drácula','Bram Stoker','Cartas y diarios que cuentan el terror.'],['Narraciones extraordinarias','Edgar Allan Poe','Cuentos perfectos de miedo y locura.'],['El extraño caso del Dr. Jekyll','Stevenson','Corta, intensa, imposible de soltar.'],['En las montañas de la locura','Lovecraft','Horror cósmico en la Antártida.'],['Estudio en escarlata','Conan Doyle','La primera aventura de Sherlock Holmes.'],['El retrato de Dorian Gray','Oscar Wilde','Belleza, vanidad y consecuencias.'],['Cuentos de amor, de locura y de muerte','Horacio Quiroga','El terror rioplatense.']]],
 ['🌎','Literatura latinoamericana','#2F6B58','#16332B',[['Martín Fierro','José Hernández','El poema nacional argentino.'],['María','Jorge Isaacs','El gran romance romántico colombiano.'],['Azul','Rubén Darío','Inicio del modernismo en español.'],['Facundo','Sarmiento','Civilización y barbarie.'],['Tradiciones peruanas','Ricardo Palma','Relatos breves con humor e historia.'],['Don Segundo Sombra','Güiraldes','La pampa y el gaucho, con nostalgia.'],['Versos sencillos','José Martí','Poesía clara y profunda.'],['Cumandá','Juan León Mera','Novela indigenista ecuatoriana.']]],
 ['🧭','Aventuras y viajes','#B5612F','#5A2B16',[['La isla del tesoro','Stevenson','Piratas, mapas y un joven héroe.'],['Viaje al centro de la Tierra','Julio Verne','Descenso a un mundo perdido.'],['Veinte mil leguas de viaje submarino','Julio Verne','El Nautilus y el capitán Nemo.'],['La vuelta al mundo en ochenta días','Julio Verne','Una apuesta contra el reloj.'],['Los tres mosqueteros','Alejandro Dumas','Capa, espada y amistad.'],['El conde de Montecristo','Alejandro Dumas','La venganza más famosa.'],['Robinson Crusoe','Daniel Defoe','Supervivencia en una isla.'],['La Odisea','Homero','El regreso a casa, el viaje de todos los viajes.']]],
 ['🎭','Teatro y poesía','#8A3B4B','#3F1822',[['Don Juan Tenorio','Zorrilla','Amor, muerte y salvación.'],['La vida es sueño','Calderón de la Barca','Realidad o sueño, la gran duda.'],['Fuenteovejuna','Lope de Vega','Un pueblo entero contra el abuso.'],['Romeo y Julieta','Shakespeare','Amor y tragedia.'],['Hamlet','Shakespeare','Ser o no ser.'],['Los intereses creados','Benavente','Comedia de títeres, aguda y actual.'],['Poesía','Gustavo Adolfo Bécquer','Rimas de amor y ausencia.'],['Campos de Castilla','Antonio Machado','Paisaje, tiempo y memoria.']]],
 ['💡','Ideas que cambiaron el mundo','#4A5568','#1F2430',[['El príncipe','Maquiavelo','Poder y política sin maquillaje.'],['Discurso del método','Descartes','Pensar con método.'],['Utopía','Tomás Moro','La isla de la sociedad ideal.'],['Elogio de la locura','Erasmo','Sátira brillante.'],['El contrato social','Rousseau','Libertad y comunidad.'],['Meditaciones','Marco Aurelio','Estoicismo para el día a día.'],['El arte de la guerra','Sun Tzu','Estrategia en capítulos breves.'],['La república','Platón','Justicia y ciudad ideal.']]]];
function sugView(L){
  const old=$('ex-sug');if(old)old.remove();
  const ov=el('div','ex-ov');ov.id='ex-sug';const bx=el('div','ex-sb');
  const close=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),250)};ov.onclick=e=>{if(e.target===ov)close()};
  const hd=el('div','ex-sg-h');hd.append(el('b','',L[0]+' '+L[1]));const x=el('button','ghost','✕');x.type='button';x.setAttribute('aria-label','Cerrar');x.onclick=close;hd.append(x);bx.append(hd);
  L[4].forEach(([t,a,w],i)=>{const r=el('div','ex-si');const n=el('span','ex-sn',String(i+1));const d=el('div');d.append(el('b','',t),el('small','',a+' · '+w));const g=el('button','ghost','Buscar');g.type='button';g.onclick=()=>{close();try{$('q').value=t;window.showView('buscar');window.search(a.includes(' ')||/^[A-ZÁÉÍÓÚ]/.test(a)?a:'')}catch(e){}};r.append(n,d,g);bx.append(r)});
  ov.append(bx);document.body.append(ov);requestAnimationFrame(()=>ov.classList.add('on'));
}
(function(){const v=document.querySelector('.view[data-view="descubrir"]');if(!v||$('ex-sugs'))return;const vs=v.querySelector('.vs');
  const w=el('div','ex-sugs');w.id='ex-sugs';w.append(el('b','ex-sg-t','Listas de lectura sugeridas'));const row=el('div','ex-sg-row');
  SUG.forEach(L=>{const c=el('button','ex-sg');c.type='button';c.style.background='linear-gradient(145deg,'+L[2]+','+L[3]+')';c.append(el('span','ex-sge',L[0]),el('b','',L[1]),el('small','',L[4].length+' libros'));c.onclick=()=>sugView(L);row.append(c)});
  w.append(row);vs?vs.after(w):v.prepend(w)})();

// ---------- logros ----------
function achSheet([e,n,d,ok,pr]){
  sheet((sh,close)=>{
    const top=el('div','ex-ad');top.append(el('span','ex-adi'+(ok?' on':''),e));const t=el('div');t.append(el('h3','',n),el('p','ex-ads'+(ok?' ok':''),ok?'✓ Completado':'Todavía no lo conseguiste'));top.append(t);sh.append(top);
    sh.append(el('p','ex-adw',(ok?'Lo lograste con: ':'Qué tenés que hacer: ')+d+'.'));
    if(pr){const cur=Math.min(pr[0],pr[1]),pc=Math.round(cur/pr[1]*100),bar=el('div','ex-adb'),i=el('i');i.style.width=pc+'%';bar.append(i);
      sh.append(bar,el('p','ex-adp',ok?'Llevás '+pr[0]+' '+pr[2]+'. La meta era '+pr[1]+'.':'Llevás '+pr[0]+' de '+pr[1]+' '+pr[2]+(pr[1]-pr[0]>0?'. Te '+(pr[1]-pr[0]===1?'falta ':'faltan ')+(pr[1]-pr[0])+'.':'.')))}
    const c=el('button','ex-opt');c.type='button';c.append(el('span','','Listo'),el('span',''));c.onclick=close;sh.append(c);
  });
}
function ach(host){
  const lib=get('kr_lib',[]),stt=get('kr_st',{}),days=Object.keys(stt).sort();
  const tot=days.reduce((a,k)=>a+(stt[k]||0),0);
  let best=0,run=0,prev=null;days.forEach(k=>{if((stt[k]||0)>=60){const d=new Date(k+'T12:00:00');run=prev&&Math.round((d-prev)/864e5)===1?run+1:1;prev=d;best=Math.max(best,run)}else{run=0;prev=null}});
  const done=lib.filter(b=>(b.pct||0)>=.97).length;
  let hl=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^kr_hl_/.test(k)){try{hl+=JSON.parse(localStorage.getItem(k)).length}catch(e){}}}}catch(e){}
  const lsAll=get('kr_lists',{}),nl=Object.values(lsAll).reduce((n,o)=>n+Object.keys(o||{}).length,0);
  const B=[['📖','Primera página','Abrí tu primer libro',lib.length>=1,[lib.length,1,'libros']],['🔥','Racha de 3','3 días leyendo seguido',best>=3,[best,3,'días seguidos']],['🌟','Racha de 7','Una semana sin faltar',best>=7,[best,7,'días seguidos']],['🏆','Racha de 30','Un mes de lectura',best>=30,[best,30,'días seguidos']],
    ['⏱️','Una hora','1 hora leída en total',tot>=3600,[Math.floor(tot/60),60,'minutos']],['🕰️','Diez horas','10 horas de lectura',tot>=36000,[Math.floor(tot/60),600,'minutos']],['🏁','Libro terminado','Llegá al final de un libro',done>=1,[done,1,'libros terminados']],['📚','Tres libros','Terminá 3 libros',done>=3,[done,3,'libros terminados']],
    ['🖍️','Subrayador','Subrayá 5 pasajes',hl>=5,[hl,5,'subrayados']],['🗂️','Coleccionista','Tené 5 libros en tu biblioteca',lib.length>=5,[lib.length,5,'libros']],['🔖','Curador','Guardá 5 libros en tus listas',nl>=5,[nl,5,'libros en tus listas']]];
  const c=el('div','card ex-ach');c.style.marginTop='14px';const got=B.filter(b=>b[3]).length;
  c.append(el('b','','Logros · '+got+' de '+B.length));
  const g=el('div','ex-agrid');B.forEach(it=>{const [e,n,d,ok]=it;const x=el('button','ex-ab'+(ok?' on':''));x.type='button';x.setAttribute('aria-label',n+(ok?', completado':', sin completar'));x.append(el('span','ex-ae',e),el('small','',n));x.onclick=()=>achSheet(it);g.append(x)});c.append(g);
  c.append(el('p','hint2','Se desbloquean leyendo: '+(B.find(b=>!b[3])?B.find(b=>!b[3])[2]+'.':'¡los tenés todos!')));
  host.append(c);
}

// ---------- mini biografía del autor (Wikipedia en español) ----------
function cleanName(a){
  let s=String(a||'').split(/[;&]|\sy\s/)[0].replace(/\(.*?\)/g,'').replace(/\b\d{3,4}\s*[-–]\s*\d{0,4}\b/g,'').trim();
  if(s.includes(',')){const p=s.split(',').map(x=>x.trim()).filter(Boolean);if(p.length>=2)s=p[1]+' '+p[0]}
  return s.replace(/\s+/g,' ').trim();
}
async function bio(author){
  const name=cleanName(author);
  if(!name||/^an[oó]nimo|^desconocid|^various|^varios/i.test(name))return {none:true,name:name||'Autor'};
  const ck='kr_bio_'+norm(name),c=get(ck,null);if(c)return c;
  const J=async u=>{const r=await fetch(u,{signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()};
  const s=await J('https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(name)+'&srlimit=4&format=json&origin=*');
  const toks=norm(name).split(' ').filter(w=>w.length>2&&!['del','los','las','von','van'].includes(w)),hits=(s.query&&s.query.search)||[];
  const score=h=>{const t=norm(h.title).split(' ');return toks.filter(w=>t.includes(w)).length};
  const best=hits.map(h=>[score(h),h]).sort((a,b)=>b[0]-a[0])[0];
  const pick=best&&best[0]>=Math.max(1,Math.ceil(toks.length/2))?best[1]:null;
  if(!pick)return {none:true,name};
  const d=await J('https://es.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(pick.title.replace(/ /g,'_')));
  let ex=String(d.extract||'').trim();if(!ex||d.type==='disambiguation')return {none:true,name};
  if(ex.length>700){const cut=ex.slice(0,700),i=Math.max(cut.lastIndexOf('. '),0);ex=i>200?cut.slice(0,i+1):cut.replace(/\s\S*$/,'')+'…'}
  const out={name:d.title||pick.title,desc:d.description||'',extract:ex,url:(d.content_urls&&d.content_urls.desktop&&d.content_urls.desktop.page)||'',thumb:(d.thumbnail&&d.thumbnail.source)||''};
  set(ck,out);return out;
}
function bioView(host,author){
  host.textContent='Buscando información del autor…';
  bio(author).then(b=>{
    host.textContent='';
    if(b.none){host.append(el('p','',b.name==='Autor'||!b.name?'No hay información disponible del autor.':'No encontramos una biografía de “'+b.name+'”.'));return}
    const top=el('div','ex-bio');
    if(b.thumb){const im=new Image();im.alt='';im.referrerPolicy='no-referrer';im.src=b.thumb;im.className='ex-bio-img';top.append(im)}
    const t=el('div');t.append(el('b','',b.name));if(b.desc)t.append(el('small','',b.desc));top.append(t);host.append(top,el('p','ex-bio-t',b.extract));
    if(b.url){const a=el('a','','Leer más en Wikipedia');a.href=b.url;a.target='_blank';a.rel='noopener noreferrer';a.className='ex-bio-a';host.append(a)}
  }).catch(()=>{host.textContent='No se pudo cargar la biografía. Revisá tu conexión y probá de nuevo.'});
}
st.textContent+=`.ks-pg{position:fixed;inset:0;z-index:55;background:var(--bg);color:var(--ink);overflow:auto;opacity:0;transform:translateY(24px);transition:opacity .3s,transform .45s cubic-bezier(.22,1,.36,1)}.ks-pg.on{opacity:1;transform:none}.ks-h{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top,0px)) 18px 12px;background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.ks-h b{font:600 1.3rem var(--serif)}.ks-h button{width:40px;padding:0}.ks-b{max-width:640px;margin:0 auto;padding:16px 18px calc(40px + env(safe-area-inset-bottom,0px))}
.ks-hero{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:10px;margin-bottom:18px}.ks-t{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 12px;text-align:center}.ks-t b{display:block;font:600 1.35rem var(--serif);line-height:1.15}.ks-t small{display:block;color:var(--mute);font-size:.74rem;margin-top:4px;line-height:1.25}.ks-hero .ks-t:last-child b{font-size:1.1rem;padding-top:3px}.ks-t.hot{background:linear-gradient(160deg,color-mix(in srgb,var(--gold) 45%,var(--card)),var(--card))}
.ks-s{margin:0 0 20px}.ks-s h3{font:600 1.02rem var(--serif);margin:0 0 10px}.ks-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ks-n{color:var(--mute);font-size:.8rem;line-height:1.4;margin:8px 2px 0}
.ks-ch{display:flex;align-items:flex-end;gap:3px;height:110px;padding:10px;background:var(--card);border:1px solid var(--line);border-radius:18px}.ks-c{flex:1;height:100%;display:flex;align-items:flex-end}.ks-c i,.ks-wc i{display:block;width:100%;border-radius:3px 3px 1px 1px;background:color-mix(in srgb,var(--green) 38%,transparent);transform-origin:bottom;animation:ksg .7s cubic-bezier(.22,1,.36,1) both}.ks-c i.done,.ks-wc i.done{background:var(--green)}@keyframes ksg{from{transform:scaleY(0)}}
.ks-hm{display:flex;gap:5px;justify-content:center;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:18px}.ks-hc{display:flex;flex-direction:column;gap:5px}.ks-hc span{width:17px;height:17px;border-radius:5px;background:var(--soft)}.ks-hc .l1{background:color-mix(in srgb,var(--green) 25%,var(--soft))}.ks-hc .l2{background:color-mix(in srgb,var(--green) 50%,var(--soft))}.ks-hc .l3{background:color-mix(in srgb,var(--green) 78%,var(--soft))}.ks-hc .l4{background:var(--green)}
.ks-wd{display:flex;gap:8px;align-items:flex-end;height:110px;padding:12px 12px 8px;background:var(--card);border:1px solid var(--line);border-radius:18px}.ks-wc{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;align-items:center}.ks-wc i{flex:none}.ks-wc small{font-size:.68rem;color:var(--mute)}.ks-bk{margin:0 0 12px}.ks-bk b{font:600 .95rem var(--serif)}.ks-bk small{color:var(--mute);margin-left:8px}
.ex-sugs{margin:14px 0 18px}.ex-sg-t{display:block;font:600 1.02rem var(--serif);margin-bottom:10px}.ex-sg-row{display:flex;gap:12px;overflow-x:auto;margin:0 -18px;padding:2px 18px 8px;scrollbar-width:none}.ex-sg-row::-webkit-scrollbar{display:none}.ex-sg{flex:none;width:150px;height:170px;border:0;border-radius:22px;padding:16px;text-align:left;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(20,25,50,.22)}.ex-sg::after{content:"";position:absolute;right:-30px;top:-30px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.12)}.ex-sge{position:absolute;left:16px;top:14px;font-size:1.9rem}.ex-sg b{font:600 1.02rem/1.2 var(--serif);color:#fff;display:block}.ex-sg small{opacity:.8;font-size:.78rem}.ex-sg{white-space:normal}.ex-sg b,.ex-sg small{white-space:normal}\n.ex-ov{position:fixed;inset:0;z-index:60;background:rgba(10,12,20,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .25s}.ex-ov.on{opacity:1}\n.ex-sb{width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--card);color:var(--ink);border-radius:26px 26px 0 0;padding:16px 18px calc(18px + env(safe-area-inset-bottom,0px));transform:translateY(40px);transition:transform .45s cubic-bezier(.34,1.4,.64,1)}#ex-sug.on .ex-sb{transform:none}.ex-sg-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.ex-sg-h b{font:600 1.15rem var(--serif)}.ex-sg-h button{width:40px;padding:0}.ex-si{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}.ex-sn{flex:none;width:26px;height:26px;border-radius:50%;background:var(--soft);display:grid;place-items:center;font:600 .8rem var(--sans);color:var(--mute)}.ex-si>div{flex:1;min-width:0}.ex-si b{display:block;font:600 .98rem/1.25 var(--serif)}.ex-si small{color:var(--mute);font-size:.8rem;line-height:1.3;display:block}.ex-si button{flex:none;padding:8px 14px}\n.ex-agrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.ex-ad{display:flex;align-items:center;gap:14px;margin-bottom:10px}.ex-ad h3{margin:0}.ex-adi{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:2rem;background:var(--soft);filter:grayscale(1);opacity:.6;flex:none}.ex-adi.on{filter:none;opacity:1;background:color-mix(in srgb,var(--gold) 38%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--gold) 70%,transparent)}.ex-ads{margin:2px 0 0!important;font-size:.88rem!important;color:var(--mute)}.ex-ads.ok{color:var(--green)!important;font-weight:600}.ex-adw{margin:0 0 12px!important;color:var(--ink)!important;font-size:1rem!important}.ex-adb{height:8px;border-radius:4px;background:var(--soft);overflow:hidden}.ex-adb i{display:block;height:100%;background:var(--green);transition:width .4s}.ex-adp{margin:8px 0 4px!important;font-size:.88rem!important}
button.ex-ab{background:none!important;border:0!important;padding:4px 0!important;box-shadow:none!important;color:inherit!important;border-radius:12px!important;font:inherit;cursor:pointer;width:100%}button.ex-ab:active{transform:scale(.95)}
.ex-ab{text-align:center;opacity:.35;filter:grayscale(1);transition:opacity .3s,filter .3s}.ex-ab.on{opacity:1;filter:none}.ex-ae{display:grid;place-items:center;width:46px;height:46px;margin:0 auto 4px;border-radius:50%;background:var(--soft);font-size:1.4rem}.ex-ab.on .ex-ae{background:color-mix(in srgb,var(--gold) 38%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--gold) 70%,transparent)}.ex-ab small{display:block;font-size:.66rem;line-height:1.15;color:var(--mute)}.ex-ab.on small{color:var(--ink);font-weight:600}
.ex-bio{display:flex;gap:12px;align-items:center;margin-bottom:8px}.ex-bio-img{width:56px;height:56px;border-radius:50%;object-fit:cover;flex:none}.ex-bio b{display:block}.ex-bio small{display:block;opacity:.7;font-size:.84rem}.ex-bio-t{margin:6px 0;line-height:1.55}.ex-bio-a{font-size:.88rem;color:inherit;text-decoration:underline}`;

window.KEx={listSheet,openLists,openVocab,vocabAdd,vHas,shelfData,intro,pickGoal,goal,decorate,render,bioView,statsPage};

// introducción la primera vez; en Ajustes se puede volver a ver
try{if(!localStorage.getItem('k_welcome'))intro()}catch(e){}
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||$('ex-set'))return;
  const c=el('div','card');c.id='ex-set';c.style.marginTop='14px';c.append(el('b','','Introducción y meta diaria'),el('p','hint2','Volvé a ver la bienvenida o cambiá cuánto querés leer por día.'));
  const a=el('div','ex-la'),b1=el('button','ghost','Ver introducción'),b2=el('button','ghost','Cambiar meta');b1.type=b2.type='button';b1.onclick=()=>intro();b2.onclick=()=>pickGoal();a.append(b1,b2);c.append(a);h.append(c)})();
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||$('ex-rem'))return;
  const c=el('div','card');c.id='ex-rem';c.style.marginTop='14px';c.append(el('b','','Recordatorio diario de lectura'),el('p','hint2','Elegí una hora y lo agregamos a tu calendario como evento diario con aviso. Se maneja desde la app de calendario de tu celular.'));
  const t=el('input');t.type='time';let v='21:00';try{v=localStorage.getItem('kr_rem')||v}catch(e){}t.value=v;t.style.cssText='display:block;width:140px;box-sizing:border-box;margin:6px 0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit';
  const b=el('button','ghost','Agregar al calendario');b.type='button';b.onclick=()=>{const [H,M]=(t.value||'21:00').split(':');try{localStorage.setItem('kr_rem',t.value)}catch(e){}
    const d=new Date(),p=n=>String(n).padStart(2,'0'),day=''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kinderly//ES','BEGIN:VEVENT','UID:kinderly-lectura-'+Date.now()+'@kinderly','DTSTAMP:'+day+'T000000Z','DTSTART:'+day+'T'+H+M+'00','DURATION:PT15M','RRULE:FREQ=DAILY','SUMMARY:Leer en Kinderly','DESCRIPTION:Tu ratito de lectura de hoy.','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Leer en Kinderly','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
    const u=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})),a=document.createElement('a');a.href=u;a.download='recordatorio-kinderly.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)};
  c.append(t,el('br'),b);h.append(c)})();
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||$('ex-bk'))return;
  const c=el('div','card');c.id='ex-bk';c.style.marginTop='14px';c.append(el('b','','Copia de seguridad'),el('p','hint2','Guardá tu biblioteca, subrayados, marcadores, listas y estadísticas en un archivo, y pasalos a otro celular cuando quieras. No incluye tu clave de IA.'));
  const a=el('div','ex-la'),e1=el('button','ghost','Guardar copia'),e2=el('button','ghost','Restaurar copia');e1.type=e2.type='button';
  // qué entra en la copia: tus datos (no la clave de IA, ni las marcas internas de la sincronización, que son de cada dispositivo)
  const inBackup=k=>k==='mail'||(/^(kr_|k_)/.test(k)&&k!=='kr_ai'&&!/^(k_sync_|k_lib_pub_)/.test(k));
  e1.onclick=()=>{const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(inBackup(k))o[k]=localStorage.getItem(k)}}catch(e){}
    const u=URL.createObjectURL(new Blob([JSON.stringify({app:'kinderly',v:1,t:Date.now(),data:o})],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='kinderly-copia-'+new Date().toLocaleDateString('sv')+'.json';document.body.append(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);say('Copia guardada','ok')};
  const f=el('input');f.type='file';f.accept='application/json,.json';f.hidden=true;
  f.onchange=async()=>{try{const j=JSON.parse(await f.files[0].text());if(j.app!=='kinderly'||!j.data)throw 0;let n=0;const now=Date.now();let sm={};try{sm=JSON.parse(localStorage.getItem('k_sync_m')||'{}')||{}}catch(e){}
      Object.keys(j.data).forEach(k=>{if(inBackup(k)){localStorage.setItem(k,j.data[k]);sm[k]=now;n++}});
      // lo restaurado cuenta como el cambio más nuevo: se sube a tu cuenta en vez de que la nube lo pise
      try{localStorage.setItem('k_sync_m',JSON.stringify(sm));localStorage.removeItem('k_sync_h')}catch(e){}say('Copia restaurada ('+n+' datos). Reiniciando…','ok');setTimeout(()=>location.reload(),900)}catch(e){say('Ese archivo no es una copia de Kinderly','err')}};
  e2.onclick=()=>f.click();a.append(e1,e2);c.append(a,f);h.append(c)})();
rerender();
})();
