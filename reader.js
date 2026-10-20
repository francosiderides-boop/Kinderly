// Kinderly · lector de EPUB integrado (offline, con progreso, índice, tamaño y temas).
(()=>{
const DL=['https://script.google.com/macros/s/','AKfycbypxSKxmMZfHb2SJScbjIBI9X','xc4InKh','rwtFZ8kd4stgLF'+'LjNeQCV-me3tj8mm2WKMQ','/exec'];
const DL_URL=DL[0]+DL.slice(1,4).join('_')+DL[4];
const ALLOWED=['gutenberg.org','archive.org','wikisource.org','wmcloud.org','books.google.com','library.oapen.org'];
const hostOk=u=>{try{const x=new URL(u);return x.protocol==='https:'&&ALLOWED.some(h=>x.hostname===h||x.hostname.endsWith('.'+h))}catch(e){return false}};
const $=id=>document.getElementById(id);
const say=(t,c)=>{try{window.say(t,c)}catch(e){}};
const THEMES={claro:{bg:'#fbf7ef',fg:'#2b2523',name:'Claro'},sepia:{bg:'#f1e6cf',fg:'#4b3b2a',name:'Sepia'},noche:{bg:'#10161c',fg:'#d9dee2',name:'Noche'}};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const prefs=()=>Object.assign({size:110,theme:'claro',font:'serif'},store.get('kr_cfg',{}));
const lib=()=>store.get('kr_lib',[]);
const idOf=u=>String(u).replace(/[?#].*$/,'');

// ---- almacenamiento offline (IndexedDB) ----
const idb=()=>new Promise((ok,ko)=>{try{const r=indexedDB.open('kinderly-books',1);r.onupgradeneeded=()=>r.result.createObjectStore('b');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}});
async function dbGet(k){try{const d=await idb();return await new Promise(ok=>{const q=d.transaction('b').objectStore('b').get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)})}catch(e){return null}}
async function dbPut(k,v){try{const d=await idb();await new Promise(ok=>{const t=d.transaction('b','readwrite');t.objectStore('b').put(v,k);t.oncomplete=ok;t.onerror=ok})}catch(e){}}
async function dbDel(k){try{const d=await idb();await new Promise(ok=>{const t=d.transaction('b','readwrite');t.objectStore('b').delete(k);t.oncomplete=ok;t.onerror=ok})}catch(e){}}

// ---- librerías externas (solo al abrir el primer libro) ----
const addScript=src=>new Promise((ok,ko)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>ko(new Error('No se pudo cargar el lector. Revisá tu conexión.'));document.head.append(s)});
let libsP=null;
const libs=()=>libsP||(libsP=(async()=>{if(window.ePub)return;await addScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');try{await addScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js')}catch(e){await addScript('https://unpkg.com/epubjs@0.3.93/dist/epub.min.js')}})().catch(e=>{libsP=null;throw e}));

async function fetchBook(url){
  const r=await fetch(DL_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'descargar',url}),signal:AbortSignal.timeout(90000)});
  const d=await r.json();
  if(!d.ok)throw new Error(d.error||'No se pudo descargar el libro');
  const bin=atob(d.data),u=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return u.buffer;
}

// ---- estilos ----
const css=document.createElement('style');
css.textContent='#kr{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;background:var(--krbg,#fbf7ef);color:var(--krfg,#2b2523);font-family:var(--sans)}'+
'#kr .kr-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:var(--krbg);border-bottom:1px solid rgba(128,128,128,.25);transition:transform .2s}'+
'#kr .kr-bot{border-top:1px solid rgba(128,128,128,.25);border-bottom:0;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}'+
'#kr.hide .kr-top{transform:translateY(-100%)}#kr.hide .kr-bot{transform:translateY(100%)}'+
'#kr button{background:transparent;color:inherit;border:1px solid rgba(128,128,128,.35);border-radius:10px;min-width:42px;height:42px;padding:0 12px;font:600 .95rem var(--sans)}'+
'#kr .kr-title{flex:1;min-width:0;text-align:center;font:600 .95rem var(--serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'#kr-view{flex:1;min-height:0;position:relative}#kr-view .epub-container{overflow:hidden!important}'+
'#kr .kr-msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;pointer-events:none;opacity:.8}'+
'#kr .kr-prog{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}#kr .kr-prog input{width:100%}#kr .kr-prog span{font-size:.72rem;text-align:center;opacity:.75}'+
'#kr .kr-panel{position:absolute;left:0;right:0;bottom:0;max-height:70%;overflow:auto;background:var(--krbg);color:var(--krfg);border-top:1px solid rgba(128,128,128,.4);box-shadow:0 -10px 30px rgba(0,0,0,.25);padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px));transform:translateY(105%);transition:transform .22s;z-index:2}'+
'#kr .kr-panel.on{transform:none}#kr .kr-panel h4{margin:0 0 10px;font:600 1rem var(--serif)}'+
'#kr .toc button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid rgba(128,128,128,.2);border-radius:0;height:auto;min-height:44px;padding:10px 4px;font-weight:500}'+
'#kr .row{display:flex;align-items:center;gap:8px;margin:10px 0;flex-wrap:wrap}#kr .row>b{min-width:70px;font-weight:600;font-size:.85rem}'+
'#kr .row button.sel{background:rgba(31,140,110,.25);border-color:rgba(31,140,110,.8)}'+
'#kr-cont{margin:0 0 16px;display:flex;align-items:center;gap:12px}#kr-cont>div{flex:1;min-width:0}#kr-cont b{display:block;font:600 1rem var(--serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#kr-cont small{color:var(--mute)}';
document.head.append(css);

const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const ic=(txt,fn,label)=>{const b=el('button','',txt);b.type='button';b.setAttribute('aria-label',label||txt);b.onclick=fn;return b};

let cur=null;
async function open(o){
  if(cur)return;
  const url=o.url,id=o.id||idOf(url),title=o.title||'Libro';
  if(!o.cached&&!hostOk(url)){say('El enlace no pertenece a una fuente permitida','err');return}
  const p=prefs();
  const root=el('div');root.id='kr';root.setAttribute('role','dialog');root.setAttribute('aria-label','Lector de '+title);
  const apply=()=>{const t=THEMES[prefs().theme]||THEMES.claro;root.style.setProperty('--krbg',t.bg);root.style.setProperty('--krfg',t.fg)};apply();
  const top=el('div','kr-bar kr-top'),bot=el('div','kr-bar kr-bot'),view=el('div');view.id='kr-view';
  const msg=el('div','kr-msg','Preparando “'+title+'”…');
  const tocP=el('div','kr-panel'),aaP=el('div','kr-panel');
  const ttl=el('div','kr-title',title);
  const range=el('input');range.type='range';range.min=0;range.max=1000;range.value=0;range.disabled=true;range.setAttribute('aria-label','Progreso del libro');
  const pt=el('span','','');const prog=el('div','kr-prog');prog.append(range,pt);
  let book=null,rend=null,ready=false,closed=false,pct=0,lastCfi='';
  const hidePanels=()=>{tocP.classList.remove('on');aaP.classList.remove('on')};
  const close=async(fromPop)=>{
    if(closed)return;closed=true;
    save();try{rend&&rend.destroy()}catch(e){}try{book&&book.destroy()}catch(e){}
    document.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);
    root.remove();document.body.style.overflow='';cur=null;
    if(!fromPop&&history.state&&history.state.kr){try{history.back()}catch(e){}}
    cont();
  };
  const pop=()=>close(true);
  const save=()=>{if(!ready||!lastCfi)return;const l=lib().filter(x=>x.id!==id);l.unshift({id,url,title,author:o.author||'',cfi:lastCfi,pct,t:Date.now()});store.set('kr_lib',l.slice(0,12))};
  const key=e=>{if(e.key==='ArrowRight')rend&&rend.next();else if(e.key==='ArrowLeft')rend&&rend.prev();else if(e.key==='Escape')close()};
  top.append(ic('✕',()=>close(),'Cerrar'),ttl,ic('☰',()=>{aaP.classList.remove('on');tocP.classList.toggle('on')},'Índice'),ic('Aa',()=>{tocP.classList.remove('on');aaP.classList.toggle('on')},'Texto y tema'));
  bot.append(ic('‹',()=>rend&&rend.prev(),'Página anterior'),prog,ic('›',()=>rend&&rend.next(),'Página siguiente'));
  root.append(top,view,bot,tocP,aaP);view.append(msg);document.body.append(root);document.body.style.overflow='hidden';cur=root;
  try{history.pushState({kr:1},'')}catch(e){}
  window.addEventListener('popstate',pop);document.addEventListener('keydown',key);

  try{
    await libs();
    let buf=await dbGet(id);
    if(!buf){msg.textContent='Descargando “'+title+'”… (puede tardar unos segundos)';buf=await fetchBook(url);dbPut(id,buf);}
    if(closed)return;
    book=ePub(buf);
    rend=book.renderTo(view,{width:'100%',height:'100%',flow:'paginated',spread:'none',allowScriptedContent:false});
    const style=()=>{const q=prefs(),t=THEMES[q.theme]||THEMES.claro;
      rend.themes.override('color',t.fg);rend.themes.override('background',t.bg);
      rend.themes.override('font-family',q.font==='sans'?'Inter,system-ui,sans-serif':'Georgia,"Iowan Old Style",serif');
      rend.themes.override('line-height','1.6');rend.themes.fontSize(q.size+'%')};
    rend.hooks.content.register(c=>{try{const d=c.document;d.documentElement.style.background=(THEMES[prefs().theme]||THEMES.claro).bg}catch(e){}});
    style();
    const start=(lib().find(x=>x.id===id)||{}).cfi;
    await rend.display(start||undefined);
    msg.remove();ready=true;
    rend.on('relocated',loc=>{lastCfi=loc.start.cfi;if(book.locations&&book.locations.length()){pct=book.locations.percentageFromCfi(lastCfi)||0;range.value=Math.round(pct*1000);pt.textContent=Math.round(pct*100)+'%'}save()});
    rend.on('click',e=>{const w=(e.view||window).innerWidth||innerWidth,x=e.clientX%w;if(x<w*0.28)rend.prev();else if(x>w*0.72)rend.next();else{hidePanels();root.classList.toggle('hide')}});
    let sx=0;rend.on('touchstart',e=>{sx=e.changedTouches[0].screenX});rend.on('touchend',e=>{const dx=e.changedTouches[0].screenX-sx;if(Math.abs(dx)>50){dx<0?rend.next():rend.prev()}});
    rend.on('keyup',e=>{if(e.key==='ArrowRight')rend.next();if(e.key==='ArrowLeft')rend.prev()});
    // índice
    tocP.append(el('h4','','Índice'));const tl=el('div','toc');tocP.append(tl);
    book.loaded.navigation.then(nav=>{const add=(items,d)=>items.forEach(it=>{const b=el('button','',(d?'— ':'')+(it.label||'').trim());b.type='button';b.onclick=()=>{rend.display(it.href);hidePanels()};tl.append(b);if(it.subitems&&it.subitems.length)add(it.subitems,1)});add(nav.toc||[],0);if(!tl.children.length)tl.append(el('p','','Este libro no tiene índice.'))}).catch(()=>{});
    // texto y tema
    aaP.append(el('h4','','Lectura'));
    const mk=(label,opts,get,set)=>{const r=el('div','row');r.append(el('b','',label));const bs=opts.map(([txt,val])=>{const b=ic(txt,()=>{set(val);bs.forEach(x=>x[1].classList.toggle('sel',x[0]===val))},txt);return [val,b]});bs.forEach(x=>{x[1].classList.toggle('sel',x[0]===get());r.append(x[1])});aaP.append(r)};
    const sizeRow=el('div','row');sizeRow.append(el('b','','Tamaño'));
    const bump=d=>{const q=prefs();q.size=Math.max(80,Math.min(200,q.size+d));store.set('kr_cfg',q);style()};
    sizeRow.append(ic('A−',()=>bump(-10),'Texto más chico'),ic('A+',()=>bump(10),'Texto más grande'));aaP.append(sizeRow);
    mk('Fuente',[['Serif','serif'],['Sans','sans']],()=>prefs().font,v=>{const q=prefs();q.font=v;store.set('kr_cfg',q);style()});
    const themeRow=el('div','row');themeRow.append(el('b','','Tema'));
    const tb=Object.keys(THEMES).map(k=>{const b=ic(THEMES[k].name,()=>{const q=prefs();q.theme=k;store.set('kr_cfg',q);apply();style();tb.forEach(x=>x[1].classList.toggle('sel',x[0]===k))},THEMES[k].name);return [k,b]});
    tb.forEach(x=>{x[1].classList.toggle('sel',x[0]===prefs().theme);themeRow.append(x[1])});aaP.append(themeRow);
    aaP.append(el('p','','Tocá el centro de la página para ocultar o mostrar los controles. Los bordes pasan de página.'));aaP.lastChild.style.cssText='font-size:.8rem;opacity:.7;margin:8px 0 0';
    // progreso real (se calcula en segundo plano)
    book.ready.then(()=>book.locations.generate(1200)).then(()=>{if(closed)return;range.disabled=false;if(lastCfi){pct=book.locations.percentageFromCfi(lastCfi)||0;range.value=Math.round(pct*1000);pt.textContent=Math.round(pct*100)+'%'}}).catch(()=>{});
    range.onchange=()=>{if(book.locations.length())rend.display(book.locations.cfiFromPercentage(range.value/1000))};
  }catch(e){
    msg.textContent='No se pudo abrir el libro: '+(e&&e.message||'error');msg.style.pointerEvents='auto';
    if(id)dbDel(id);
  }
}

// ---- Seguí leyendo (inicio) ----
function cont(){
  const host=document.querySelector('.view[data-view="buscar"]');if(!host)return;
  let box=$('kr-cont');const l=lib()[0];
  if(!l){if(box)box.remove();return}
  if(!box){box=el('div','card');box.id='kr-cont';const lead=host.querySelector('.lead');lead?lead.after(box):host.prepend(box)}
  box.textContent='';
  const d=el('div');d.append(el('small','','Seguí leyendo'),el('b','',l.title),el('small','',Math.round((l.pct||0)*100)+'% leído'));
  const b=el('button','','Continuar');b.type='button';b.onclick=()=>open({id:l.id,url:l.url,title:l.title,author:l.author,cached:true});
  box.append(d,b);
}

function decorate(b,actions){
  const o=b.opts.find(x=>x.sendable&&typeof x.url==='function');if(!o)return;
  const x=el('button','ghost','Leer en la app');x.type='button';
  x.onclick=async()=>{x.disabled=true;try{const url=await o.url();await open({url,title:b.title,author:b.author})}catch(e){say(e&&e.message||'No se pudo abrir','err')}finally{x.disabled=false}};
  actions.append(x);
}

window.KReader={open,decorate,continueReading:cont};
cont();
})();
