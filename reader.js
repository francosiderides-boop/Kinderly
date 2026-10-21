// Kinderly · lector de EPUB integrado: biblioteca propia, archivos del celular, subrayado, notas,
// diccionario, búsqueda, fuentes y temas, y resúmenes por IA con la clave del propio usuario.
(()=>{
const DL=['https://script.google.com/macros/s/','AKfycbypxSKxmMZfHb2SJScbjIBI9X','xc4InKh','rwtFZ8kd4stgLF'+'LjNeQCV-me3tj8mm2WKMQ','/exec'];
const DL_URL=DL[0]+DL.slice(1,4).join('_')+DL[4];
const ALLOWED=['gutenberg.org','archive.org','wikisource.org','wmcloud.org','books.google.com','library.oapen.org'];
const hostOk=u=>{try{const x=new URL(u);return x.protocol==='https:'&&ALLOWED.some(h=>x.hostname===h||x.hostname.endsWith('.'+h))}catch(e){return false}};
const $=id=>document.getElementById(id);
const say=(t,c)=>{try{window.say(t,c)}catch(e){}};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const THEMES={auto:{name:'Automático'},claro:{bg:'#F7F6F1',fg:'#161A22',name:'Claro'},sepia:{bg:'#f1e6cf',fg:'#4b3b2a',name:'Sepia'},noche:{bg:'#12151C',fg:'#d9dee2',name:'Noche'},negro:{bg:'#000000',fg:'#c4c9cd',name:'Negro'}};
const FONTS={clasica:{name:'Clásica',css:'Georgia,"Iowan Old Style",serif'},literata:{name:'Literata',css:'Literata,Georgia,serif'},merri:{name:'Merriweather',css:'Merriweather,Georgia,serif'},inter:{name:'Moderna',css:'Inter,system-ui,sans-serif'},atkinson:{name:'Accesible',css:'"Atkinson Hyperlegible",Inter,sans-serif'},lora:{name:'Lora',css:'Lora,Georgia,serif'},garamond:{name:'Garamond',css:'"EB Garamond",Garamond,Georgia,serif'},crimson:{name:'Crimson',css:'"Crimson Pro",Georgia,serif'},source:{name:'Source Serif',css:'"Source Serif 4",Georgia,serif'},bask:{name:'Baskerville',css:'"Libre Baskerville",Baskerville,Georgia,serif'},bitter:{name:'Bitter',css:'Bitter,Georgia,serif'},nunito:{name:'Nunito',css:'Nunito,system-ui,sans-serif'},lexend:{name:'Lexend',css:'Lexend,system-ui,sans-serif'}};
const HL={amarillo:'#f5d142',verde:'#7fd18b',azul:'#7db7f0',rosa:'#f29bb3'};
const prefs=()=>Object.assign({mode:'paginated',size:110,theme:'auto',font:'clasica',lh:1.6,margin:18},store.get('kr_cfg',{}));
const setPref=(k,v)=>{const q=prefs();q[k]=v;store.set('kr_cfg',q)};
const resolveTheme=()=>{const t=prefs().theme;if(t!=='auto')return THEMES[t]||THEMES.claro;const dark=document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);return dark?THEMES.noche:THEMES.claro};
const lib=()=>store.get('kr_lib',[]);
const saveLib=l=>store.set('kr_lib',l.slice(0,40));
const idOf=u=>String(u).replace(/[?#].*$/,'');
const hlKey=id=>'kr_hl_'+id;

// ---- almacenamiento offline (IndexedDB) ----
const idb=()=>new Promise((ok,ko)=>{try{const r=indexedDB.open('kinderly-books',1);r.onupgradeneeded=()=>r.result.createObjectStore('b');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}});
async function dbGet(k){try{const d=await idb();return await new Promise(ok=>{const q=d.transaction('b').objectStore('b').get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)})}catch(e){return null}}
async function dbPut(k,v){try{const d=await idb();await new Promise(ok=>{const t=d.transaction('b','readwrite');t.objectStore('b').put(v,k);t.oncomplete=ok;t.onerror=ok;t.onabort=ok})}catch(e){}}
async function dbDel(k){try{const d=await idb();await new Promise(ok=>{const t=d.transaction('b','readwrite');t.objectStore('b').delete(k);t.oncomplete=ok;t.onerror=ok})}catch(e){}}

// ---- librerías externas (solo al abrir el primer libro) ----
const addScript=src=>new Promise((ok,ko)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>{s.remove();ko(new Error('No se pudo cargar el lector. Revisá tu conexión.'))};document.head.append(s)});
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

// ---- IA con la clave del usuario (se guarda solo en este dispositivo) ----
const GEMINI=['gemini-3.8-flash','gemini-3.6-flash','gemini-3.1-flash-lite'];
const ai=()=>store.get('kr_ai',null);
async function askAI(prompt){
  const c=ai();if(!c||!c.key)throw new Error('Primero cargá tu clave de IA en Ajustes.');
  if(c.p==='claude'){
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':c.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-haiku-5-5',max_tokens:900,messages:[{role:'user',content:prompt}]}),signal:AbortSignal.timeout(90000)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error((d.error&&d.error.message)||('Error '+r.status));
    return (d.content||[]).map(x=>x.text||'').join('').trim();
  }
  let last='';
  for(const m of GEMINI){
    try{
      const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':c.key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:900}}),signal:AbortSignal.timeout(90000)});
      const d=await r.json().catch(()=>({}));
      if(r.ok){const t=((((d.candidates||[])[0]||{}).content||{}).parts||[]).map(p=>p.text||'').join('').trim();if(t)return t;last='Respuesta vacía';continue}
      last=(d.error&&d.error.message)||('Error '+r.status);
      if(r.status===400||r.status===401||r.status===403)break;
    }catch(e){last=e.message}
  }
  throw new Error(last||'No se pudo consultar la IA');
}
function aiForm(box,onDone){
  box.textContent='';
  const c=ai();
  const fld='width:100%;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;margin:6px 0';
  const mkb=(t,fn,g)=>{const b=el('button',g?'ghost':'',t);b.type='button';b.onclick=fn;b.style.cssText='width:100%;margin:6px 0;padding:13px';return b};
  const state=el('p','hint2','');
  const trySave=async k=>{
    k=(k||'').trim();if(k.length<20){say('Esa clave parece incompleta','err');return}
    const prev=store.get('kr_ai',null);store.set('kr_ai',{p:/^sk-ant-/.test(k)?'claude':'gemini',key:k});
    state.textContent='Probando tu clave…';
    try{await askAI('Respondé solo: OK');say('¡Listo! La IA quedó activada','ok');if(onDone)onDone()}
    catch(e){if(prev)store.set('kr_ai',prev);else store.del('kr_ai');state.textContent='No funcionó: '+((e&&e.message)||'error')+'. Revisá que hayas copiado la clave completa.'}
  };
  const note=el('p','hint2','Tu clave queda solo en este celular y se usa únicamente para hablar con Google (o Anthropic). Kinderly no la recibe. Al pedir un resumen se envía el texto del capítulo a ese proveedor.');
  if(c&&c.key){
    box.append(el('p','','✓ IA activada ('+(c.p==='claude'?'Claude':'Gemini')+')'));
    box.append(mkb('Cambiar clave',()=>{store.del('kr_ai');aiForm(box,onDone)},true),mkb('Quitar clave',()=>{store.del('kr_ai');say('Clave eliminada','ok');if(onDone)onDone()},true),note);
    return;
  }
  const steps=el('ol');steps.style.cssText='margin:6px 0 6px 18px;padding:0;line-height:1.5;font-size:.92rem';
  ['Tocá “Conseguir mi clave gratis”: se abre Google AI Studio (es gratis, sin tarjeta).','Entrá con tu cuenta de Google y tocá “Crear clave de API”. Después tocá el ícono de copiar.','Volvé a Kinderly y tocá “Pegar mi clave”.'].forEach(t=>steps.append(el('li','',t)));
  box.append(steps,mkb('1 · Conseguir mi clave gratis',()=>window.open('https://aistudio.google.com/apikey','_blank','noopener')));
  box.append(mkb('2 · Pegar mi clave',async()=>{
    try{const t=await navigator.clipboard.readText();if(!t||t.trim().length<20){state.textContent='No encontré una clave copiada. Copiala en AI Studio y probá de nuevo, o pegala abajo.';return}trySave(t)}
    catch(e){state.textContent='Tu navegador no dejó leer lo copiado. Pegá la clave en el campo de abajo.'}
  }));
  const inp=el('input');inp.type='password';inp.placeholder='…o pegala acá';inp.autocomplete='off';inp.style.cssText=fld;
  inp.addEventListener('paste',()=>setTimeout(()=>trySave(inp.value),50));
  box.append(inp,mkb('Guardar',()=>trySave(inp.value),true),state);
  const d=document.createElement('details');d.style.cssText='margin:8px 0;font-size:.85rem';
  d.append(el('summary','','¿Preferís usar Claude?'),el('p','hint2','Sacá una clave en console.anthropic.com → API keys (empieza con sk-ant-) y pegala acá arriba. Se cobra a tu cuenta de Anthropic por uso.'));
  box.append(d,note);
}

// ---- estilos ----
const css=document.createElement('style');
css.textContent='#kr{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;background:var(--krbg,#fbf7ef);color:var(--krfg,#2b2523);font-family:var(--sans)}'+
'#kr .kr-bar{display:flex;align-items:center;gap:6px;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:var(--krbg);border-bottom:1px solid rgba(128,128,128,.25);transition:transform .2s;z-index:3}'+
'#kr .kr-bot{border-top:1px solid rgba(128,128,128,.25);border-bottom:0;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}'+
'#kr.hide .kr-top{transform:translateY(-100%)}#kr.hide .kr-bot{transform:translateY(100%)}'+
'#kr button{background:transparent;color:inherit;border:1px solid rgba(128,128,128,.35);border-radius:10px;min-width:40px;height:40px;padding:0 10px;font:600 .9rem var(--sans);white-space:nowrap}'+
'#kr button.sel{background:rgba(31,140,110,.25);border-color:rgba(31,140,110,.8)}'+
'#kr .kr-title{flex:1;min-width:0;text-align:center;font:600 .92rem var(--serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'#kr-view{flex:1;min-height:0;position:relative}#kr-view[data-mode=paginated] .epub-container{overflow:hidden!important}'+
'#kr .kr-msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;pointer-events:none;opacity:.8}'+
'#kr .kr-prog{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}#kr .kr-prog input{width:100%}#kr .kr-prog span{font-size:.72rem;text-align:center;opacity:.75}'+
'#kr .kr-panel{position:absolute;left:0;right:0;bottom:0;max-height:78%;display:flex;flex-direction:column;background:var(--krbg);color:var(--krfg);border-top:1px solid rgba(128,128,128,.4);box-shadow:0 -10px 30px rgba(0,0,0,.25);transform:translateY(105%);transition:transform .22s;z-index:5}'+
'#kr .kr-panel.on{transform:none}#kr .kr-ph{display:flex;align-items:center;gap:8px;padding:12px 16px 4px}#kr .kr-ph h4{flex:1;margin:0;font:600 1rem var(--serif)}'+
'#kr .kr-pb{overflow:auto;padding:8px 16px calc(16px + env(safe-area-inset-bottom,0px))}'+
'#kr .kr-tabs{display:flex;gap:6px;margin:4px 0 10px}#kr .kr-tabs button{flex:1}'+
'#kr .li{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid rgba(128,128,128,.2);border-radius:0;height:auto;min-height:44px;padding:10px 4px;font-weight:500;white-space:normal}'+
'#kr .li small{display:block;opacity:.65;font-weight:400;margin-top:2px}'+
'#kr .row{display:flex;align-items:center;gap:8px;margin:10px 0;flex-wrap:wrap}#kr .row>b{min-width:78px;font-weight:600;font-size:.85rem}'+
'#kr .sw{display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:6px;vertical-align:-2px}'+
'#kr .selbar{position:absolute;left:8px;right:8px;bottom:calc(76px + env(safe-area-inset-bottom,0px));display:none;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px;border-radius:14px;background:var(--krbg);border:1px solid rgba(128,128,128,.5);box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:4}#kr .selbar.on{display:flex}'+
'#kr .selbar .dot{min-width:34px;width:34px;height:34px;padding:0;border-radius:50%}'+
'#kr textarea,#kr input[type=text],#kr input[type=search]{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;font:inherit}'+
'#kr .ai-out{white-space:pre-wrap;line-height:1.55;margin:10px 0}'+
'#kr .note{font-size:.78rem;opacity:.7;margin:8px 0 0}'+
'.lib-item{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;padding:12px 0;border-top:1px solid var(--line)}.lib-item>div{flex:1 1 100%;min-width:0}.lib-item b{display:block;font:600 1rem var(--serif);line-height:1.25;overflow-wrap:anywhere}.lib-item small{display:block}.lib-item small{color:var(--mute)}'+
'.lib-bar{height:5px;border-radius:3px;background:var(--soft);margin-top:6px;overflow:hidden}.lib-bar i{display:block;height:100%;background:var(--green)}'+
'#kr-cont{margin:0 0 16px;display:flex;align-items:center;gap:12px}#kr-cont>div{flex:1;min-width:0}#kr-cont b{display:block;font:600 1rem var(--serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#kr-cont small{color:var(--mute)}';
document.head.append(css);

const btn=(txt,fn,label,cls)=>{const b=el('button',cls||'',txt);b.type='button';if(label)b.setAttribute('aria-label',label);b.onclick=fn;return b};
const fmtDate=t=>{try{return new Date(t).toLocaleDateString('es-AR')}catch(e){return ''}};

let cur=null;
// ---- racha y tiempo de lectura (solo en este dispositivo) ----
const ST_K='kr_st',dk=d=>d.toLocaleDateString('sv');
const stGet=()=>{try{return JSON.parse(localStorage.getItem(ST_K)||'{}')}catch(e){return {}}};
function addSec(s){try{const st=stGet(),k=dk(new Date()),g=((window.KEx&&window.KEx.goal())||10)*60,before=st[k]||0;st[k]=before+s;if(before<g&&st[k]>=g&&localStorage.getItem('kr_gd')!==k){localStorage.setItem('kr_gd',k);setTimeout(()=>{try{window.say('Meta de hoy cumplida. ¡Bien ahí!','ok')}catch(e){}},300)}const ks=Object.keys(st).sort();while(ks.length>120)delete st[ks.shift()];localStorage.setItem(ST_K,JSON.stringify(st))}catch(e){}}
function stats(){const st=stGet(),now=new Date(),d=new Date(now);let streak=0;
  if((st[dk(d)]||0)<60)d.setDate(d.getDate()-1);
  while((st[dk(d)]||0)>=60){streak++;d.setDate(d.getDate()-1)}
  let week=0;for(let i=0;i<7;i++){const x=new Date(now);x.setDate(x.getDate()-i);week+=st[dk(x)]||0}
  return {streak,today:st[dk(now)]||0,week}}
const fmtMin=s=>{const m=Math.floor(s/60);return m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')}
function streakPill(){
  const host=document.querySelector('.view[data-view="buscar"]');if(!host)return;
  let p=$('kr-st');const s=stats();
  if(!s.streak){if(p)p.remove();return}
  if(!p){p=el('div','kr-st');p.id='kr-st';const lead=host.querySelector('.lead');lead?lead.after(p):host.prepend(p)}
  p.textContent=s.streak===1?'1 día leyendo seguido':s.streak+' días leyendo seguido';
}
async function open(o){
  if(cur)return;
  const id=o.id||idOf(o.url||'');let title=o.title||'Libro';
  if(!o.buf&&!o.cached&&!hostOk(o.url)){say('El enlace no pertenece a una fuente permitida','err');return}
  const root=el('div');root.id='kr';root.setAttribute('role','dialog');root.setAttribute('aria-label','Lector de '+title);
  const apply=()=>{const t=resolveTheme();root.style.setProperty('--krbg',t.bg);root.style.setProperty('--krfg',t.fg)};apply();
  const top=el('div','kr-bar kr-top'),bot=el('div','kr-bar kr-bot'),view=el('div');view.id='kr-view';
  const msg=el('div','kr-msg','Preparando “'+title+'”…');
  const pnl=el('div','kr-panel');const selbar=el('div','selbar');
  const ttl=el('div','kr-title',title);
  const range=el('input');range.type='range';range.min=0;range.max=1000;range.value=0;range.disabled=true;range.setAttribute('aria-label','Progreso del libro');
  const pt=el('span','','');const prog=el('div','kr-prog');prog.append(range,pt);
  let remount=null,book=null,rend=null,ready=false,closed=false,pct=0,lastCfi='',marks=[],curSel=null;
  const entry=()=>lib().find(x=>x.id===id)||{};
  const closePanel=()=>pnl.classList.remove('on');
  const panel=(name,build)=>{pnl.textContent='';const h=el('div','kr-ph');h.append(el('h4','',name),btn('✕',closePanel,'Cerrar panel'));const b=el('div','kr-pb');pnl.append(h,b);build(b);pnl.classList.add('on');selbar.classList.remove('on')};
  const hideSel=()=>{selbar.classList.remove('on');curSel=null};

  const tick=setInterval(()=>{if(document.visibilityState==='visible')addSec(15)},15000);
  const save=()=>{if(!ready||!lastCfi)return;const l=lib().filter(x=>x.id!==id);l.unshift({id,url:o.url||'',title,author:o.author||entry().author||'',cfi:lastCfi,pct,t:Date.now(),local:!!o.local||!!entry().local});saveLib(l)};
  const close=(fromPop)=>{
    if(closed)return;closed=true;clearInterval(tick);
    try{stopAudio()}catch(e){}save();try{rend&&rend.destroy()}catch(e){}try{book&&book.destroy()}catch(e){}
    document.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);
    root.remove();document.body.style.overflow='';cur=null;
    if(!fromPop&&history.state&&history.state.kr){try{history.back()}catch(e){}}
    cont();renderLib();
  };
  const pop=()=>close(true);
  const key=e=>{if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight')rend&&rend.next();else if(e.key==='ArrowLeft')rend&&rend.prev();else if(e.key==='Escape'){pnl.classList.contains('on')?closePanel():close()}};

  // ----- estilo del libro -----
  const style=()=>{
    if(!rend)return;const q=prefs(),t=resolveTheme(),f=FONTS[q.font]||FONTS.clasica,im=' !important';
    const rules={'html':{'background':t.bg+im},
      'body':{'background':t.bg+im,'color':t.fg+im,'font-family':f.css+im,'line-height':q.lh+im,'padding':'0 '+q.margin+'px'+im},
      'p,div,span,li,td,th,h1,h2,h3,h4,h5,h6,blockquote,em,i,b,strong,small':{'color':t.fg+im},
      'a,a:link,a:visited':{'color':t.fg+im},'::selection':{'background':'rgba(245,200,60,.45)'}};
    const nm='k_'+q.theme+'_'+q.font+'_'+q.lh+'_'+q.margin+'_'+t.bg;rend.themes.register(nm,rules);rend.themes.select(nm);rend.themes.fontSize(q.size+'%');
  };
  const restyle=()=>{apply();style()};

  // ----- marcas (subrayados y notas) -----
  const loadMarks=()=>{marks=store.get(hlKey(id),[])};
  const saveMarks=()=>store.set(hlKey(id),marks);
  const paint=m=>{try{rend.annotations.remove(m.cfi,'highlight')}catch(e){}try{rend.annotations.highlight(m.cfi,{},()=>editMark(m),'kr-hl',{'fill':HL[m.color]||HL.amarillo,'fill-opacity':'0.38'})}catch(e){}};
  const addMark=(cfi,text,color)=>{const m={cfi,text,color,note:'',t:Date.now()};marks.push(m);saveMarks();paint(m);return m};
  const editMark=m=>panel('Subrayado',b=>{
    b.append(el('p','',m.text));
    const row=el('div','row');Object.keys(HL).forEach(c=>{const x=btn('',()=>{m.color=c;saveMarks();paint(m);[...row.children].forEach(y=>y.classList.toggle('sel',y.dataset.c===c))},c);x.dataset.c=c;x.classList.toggle('sel',m.color===c);const sw=el('span','sw');sw.style.background=HL[c];x.append(sw,document.createTextNode(c));row.append(x)});b.append(row);
    const ta=el('textarea');ta.rows=3;ta.placeholder='Tu nota…';ta.value=m.note||'';b.append(ta);
    const r2=el('div','row');
    r2.append(btn('Guardar nota',()=>{m.note=ta.value.trim().slice(0,500);saveMarks();say('Nota guardada','ok');closePanel()}),
      btn('Definir',()=>define(m.text)),
      btn('Borrar subrayado',()=>{try{rend.annotations.remove(m.cfi,'highlight')}catch(e){}marks=marks.filter(x=>x!==m);saveMarks();closePanel()}));
    b.append(r2);
  });

  // ----- diccionario -----
  const dictCache={};
  async function wik(word){
    const w=word.toLowerCase().replace(/[.,;:!?¿¡"“”«»()\[\]—–-]+/g,'').trim();
    if(!w||w.split(/\s+/).length>3)return null;
    if(dictCache[w]!==undefined)return dictCache[w];
    try{
      const r=await fetch('https://es.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&redirects=1&titles='+encodeURIComponent(w)+'&format=json&origin=*',{signal:AbortSignal.timeout(12000)});
      const d=await r.json();const p=Object.values((d.query||{}).pages||{})[0];
      let txt=(p&&p.extract)||'';
      const i=txt.indexOf('\nEspañol\n');if(i<0){dictCache[w]=null;return null}
      txt=txt.slice(i+9);const j=txt.search(/\n(Alemán|Catalán|Francés|Gallego|Inglés|Italiano|Latín|Portugués|Asturiano|Náhuatl|Aragonés)\n/);if(j>0)txt=txt.slice(0,j);
      const lines=txt.split('\n').map(s=>s.trim()).filter(Boolean),out=[];let skip=false;
      for(const ln of lines){
        if(/^(Etimología|Pronunciación|Información adicional|Locuciones|Refranes|Conjugación|Véase también|Traducciones|Términos relacionados|Descendientes|Derivad|Sinónimos|Antónimos|Hiperónimos|Hipónimos|Cognados|Ejemplo)/i.test(ln)){skip=true;continue}
        if(/^(Sustantivo|Adjetivo|Verbo|Adverbio|Pronombre|Interjección|Preposición|Conjunción|Forma|Artículo|Locución)/i.test(ln)&&ln.length<70){skip=false;out.push({h:ln});continue}
        if(skip)continue;
        if(/^\d+\s/.test(ln)&&out.length)out.push({d:ln.replace(/^\d+\s+/,'')});
      }
      const res=out.filter(x=>x.h||x.d).slice(0,16);dictCache[w]=res.some(x=>x.d)?{w,items:res}:null;return dictCache[w];
    }catch(e){return null}
  }
  async function define(word,ctx){
    const clean=word.replace(/\s+/g,' ').trim().slice(0,120);
    panel('Definición',async b=>{
      b.append(el('h3','',clean));const out=el('div');out.textContent='Buscando…';b.append(out);
      const acts=el('div','row');b.append(acts);
      acts.append(btn('RAE',()=>window.open('https://dle.rae.es/'+encodeURIComponent(clean.split(' ')[0]),'_blank','noopener')));
      if(ai()&&ai().key){const bt=btn('Explicar con IA',async()=>{bt.disabled=true;out.textContent='Consultando IA…';try{out.textContent=await askAI('Explicá en español claro y breve (máximo 60 palabras) qué significa «'+clean+'»'+(ctx?' en esta frase de un libro: «'+ctx+'»':'')+'. Si es una palabra antigua o de época, aclaralo.')}catch(e){out.textContent='No se pudo: '+e.message}bt.disabled=false});acts.append(bt)}
      const r=await wik(clean.split(' ').length===1?clean:clean);
      out.textContent='';
      if(!r){out.append(el('p','','No encontramos esa palabra en el diccionario libre (Wikcionario). Probá con la RAE'+(ai()?' o con la IA':'')+'.'));return}
      r.items.forEach(x=>{if(x.h){const h=el('b','',x.h);h.style.display='block';h.style.margin='10px 0 2px';out.append(h)}else{const p=el('div','','• '+x.d);p.style.margin='4px 0';out.append(p)}});
      out.append(el('p','note','Fuente: Wikcionario (licencia libre).'));
    });
  }

  // ----- búsqueda en el libro -----
  async function searchBook(q,list){
    list.textContent='Buscando…';const res=[];
    try{
      for(const it of book.spine.spineItems){
        await it.load(book.load.bind(book));
        const f=it.find(q)||[];f.forEach(x=>res.push(x));it.unload();
        if(res.length>=40)break;
      }
    }catch(e){}
    list.textContent='';
    if(!res.length){list.append(el('p','','Sin resultados.'));return}
    res.forEach(x=>{const b=btn('',()=>{rend.display(x.cfi);closePanel()},'Ir al resultado','li');b.append(document.createTextNode('…'+x.excerpt.trim()+'…'));list.append(b)});
  }

  // ----- panel de contenido (índice, marcas, búsqueda) -----
  const contents=(tab)=>panel('Contenido',b=>{
    const tabs=el('div','kr-tabs'),body=el('div');const names=[['toc','Índice'],['marks','Marcas ('+marks.length+')'],['find','Buscar']];
    const show=t=>{[...tabs.children].forEach((x,i)=>x.classList.toggle('sel',names[i][0]===t));body.textContent='';
      if(t==='toc'){if(!tocItems.length)body.append(el('p','','Este libro no tiene índice.'));tocItems.forEach(it=>{const x=btn('',()=>{rend.display(it.href);closePanel()},it.label,'li');x.append(document.createTextNode((it.d?'— ':'')+it.label));body.append(x)})}
      if(t==='marks'){if(!marks.length)body.append(el('p','','Todavía no subrayaste nada. Mantené apretado un texto del libro para seleccionarlo.'));marks.slice().sort((a,c)=>a.t-c.t).forEach(m=>{const x=btn('',()=>{rend.display(m.cfi);editMark(m)},'Subrayado','li');const sw=el('span','sw');sw.style.background=HL[m.color]||HL.amarillo;x.append(sw,document.createTextNode(m.text.slice(0,140)));if(m.note){const s=el('small','','📝 '+m.note);x.append(s)}body.append(x)})}
      if(t==='find'){const i=el('input');i.type='search';i.placeholder='Buscar en el libro…';const list=el('div');i.onkeydown=e=>{if(e.key==='Enter'&&i.value.trim().length>1)searchBook(i.value.trim(),list)};const go=btn('Buscar',()=>{if(i.value.trim().length>1)searchBook(i.value.trim(),list)});go.style.marginTop='8px';body.append(i,go,list);setTimeout(()=>i.focus(),50)}};
    names.forEach(([t,n])=>tabs.append(btn(n,()=>show(t))));b.append(tabs,body);show(tab||'toc');
  });
  let tocItems=[];

  // ----- apariencia -----
  const looks=()=>panel('Apariencia',b=>{
    const group=(label,opts,get,set)=>{const r=el('div','row');r.append(el('b','',label));const bs=[];opts.forEach(([txt,val])=>{const x=btn(txt,()=>{set(val);bs.forEach(y=>y[1].classList.toggle('sel',y[0]===val))});bs.push([val,x]);x.classList.toggle('sel',get()===val);r.append(x)});b.append(r)};
    const sz=el('div','row');sz.append(el('b','','Tamaño'),btn('A−',()=>{setPref('size',Math.max(80,prefs().size-10));style()},'Texto más chico'),btn('A+',()=>{setPref('size',Math.min(220,prefs().size+10));style()},'Texto más grande'));b.append(sz);
    group('Fuente',Object.keys(FONTS).map(k=>[FONTS[k].name,k]),()=>prefs().font,v=>{setPref('font',v);style()});
    group('Tema',Object.keys(THEMES).map(k=>[THEMES[k].name,k]),()=>prefs().theme,v=>{setPref('theme',v);restyle()});
    group('Modo de lectura',[['Páginas','paginated'],['Scroll','scrolled']],()=>prefs().mode||'paginated',v=>{setPref('mode',v);if(remount)remount()});
    group('Interlineado',[['Compacto',1.35],['Normal',1.6],['Amplio',1.9]],()=>prefs().lh,v=>{setPref('lh',v);style()});
    group('Márgenes',[['Chicos',6],['Medios',18],['Grandes',34]],()=>prefs().margin,v=>{setPref('margin',v);style()});
    b.append(el('p','note','“Automático” sigue el modo claro u oscuro de tu celular. Tocá el centro de la página para ocultar o mostrar los controles; los bordes pasan de página.'));
  });

  // ----- IA: resumen del capítulo -----
  async function chapterText(){
    const loc=rend.currentLocation();const href=loc&&loc.start&&loc.start.href;const sec=href&&book.spine.get(href);if(!sec)return {text:'',label:''};
    await sec.load(book.load.bind(book));
    const doc=sec.document||sec.contents;const text=((doc&&doc.body&&doc.body.textContent)||(doc&&doc.textContent)||'').replace(/\s+/g,' ').trim();
    const t=tocItems.filter(x=>x.href&&String(x.href).split('#')[0]===String(href).split('#')[0]).map(x=>x.label)[0]||'';
    return {text,label:t,key:String(href)};
  }
  const aiPanel=()=>panel('✨ Resumen del capítulo',b=>{
    const c=ai();
    if(!c||!c.key){b.append(el('p','','Esta función usa tu propia cuenta de IA (Gemini o Claude). Pegá tu clave una sola vez y queda guardada en este dispositivo.'));const f=el('div');aiForm(f,()=>aiPanel());b.append(f);return}
    const out=el('div','ai-out');const acts=el('div','row');
    const key='kr_sum_'+id;const cache=store.get(key,{});
    const run=async(force)=>{
      out.textContent='Leyendo el capítulo…';
      try{
        const ch=await chapterText();
        if(ch.text.length<600){out.textContent='Este tramo es muy corto para resumir (portada, índice o título). Pasá a un capítulo y probá de nuevo.';return}
        if(!force&&cache[ch.key]){out.textContent=cache[ch.key];return}
        out.textContent='Resumiendo con tu IA…';
        const text=ch.text.slice(0,48000);
        const r=await askAI('Sos un asistente de lectura. Resumí en español rioplatense, en 120 a 180 palabras, este capítulo del libro «'+title+'»'+(o.author?' de '+o.author:'')+(ch.label?' (capítulo: '+ch.label+')':'')+'. Contá solo lo que ocurre en el texto, sin inventar ni adelantar lo que sigue. Texto del capítulo:\n\n'+text);
        cache[ch.key]=r;store.set(key,cache);out.textContent=r;
      }catch(e){out.textContent='No se pudo resumir: '+(e&&e.message||'error')}
    };
    acts.append(btn('Volver a generar',()=>run(true)),btn('Copiar',()=>{try{navigator.clipboard.writeText(out.textContent);say('Copiado','ok')}catch(e){}}),btn('Clave de IA',()=>{b.textContent='';const f=el('div');aiForm(f,()=>aiPanel());b.append(f)}));
    b.append(out,acts,el('p','note','Resume el capítulo en el que estás. El texto se envía a tu proveedor de IA y se usa tu cuota o saldo.'));
    run(false);
  });

  // ----- audiolectura -----
  const AV=[['Kore','Kore · firme'],['Puck','Puck · animada'],['Charon','Charon · grave'],['Aoede','Aoede · suave'],['Fenrir','Fenrir · intensa'],['Zephyr','Zephyr · clara']];
  const aCfg=()=>Object.assign({eng:'device',voice:'Kore',dev:'',rate:1},store.get('kr_au',{}));
  const setA=(k,v)=>{const q=aCfg();q[k]=v;store.set('kr_au',q)};
  const AU={on:false,paused:false,gen:0,audio:null,list:[],pos:0,href:'',rest:null,onState:null};
  let auModels=null;
  const stopAudio=()=>{AU.gen++;AU.on=false;AU.paused=false;AU.rest=null;try{speechSynthesis.cancel()}catch(e){}if(AU.audio){try{AU.audio.pause()}catch(e){}AU.audio=null}if(AU.onState)AU.onState()};
  window.__krStop=stopAudio;
  const devVoices=()=>{try{return speechSynthesis.getVoices().filter(v=>/^es/i.test(v.lang))}catch(e){return[]}};
  const chunks=(t,max)=>{const out=[];let s=t;while(s.length){if(s.length<=max){out.push(s);break}let i=-1;for(const m of ['. ','? ','! ','; ',', ',' ']){const k=s.lastIndexOf(m,max);if(k>max*0.4){i=k+m.length;break}}if(i<0)i=max;out.push(s.slice(0,i).trim());s=s.slice(i).trim()}return out.filter(Boolean)};
  const nextHref=h=>{try{const s=book.spine.get(h);const n=s&&s.next();return n?n.href:null}catch(e){return null}};
  async function audioText(href0){
    let href=href0,cfi=null;
    if(!href){const loc=rend.currentLocation();href=loc&&loc.start&&loc.start.href;cfi=loc&&loc.start&&loc.start.cfi}
    const sec=href&&book.spine.get(href);if(!sec)return null;
    await sec.load(book.load.bind(book));
    const doc=sec.document||sec.contents;const body=doc&&(doc.body||doc);
    const full=(body&&body.textContent)||'';let off=0;
    if(cfi){try{const r=await book.getRange(cfi);if(r){const d=r.startContainer.ownerDocument||doc;const pre=d.createRange();pre.setStart(d.body,0);pre.setEnd(r.startContainer,r.startOffset);off=pre.toString().length}}catch(e){}}
    return {href:sec.href,text:full.slice(off).replace(/\s+/g,' ').trim()};
  }
  const speak=txt=>new Promise((res,rej)=>{const u=new SpeechSynthesisUtterance(txt),c=aCfg(),v=devVoices().find(x=>x.voiceURI===c.dev);if(v){u.voice=v;u.lang=v.lang}else u.lang='es-ES';u.rate=c.rate;u.onend=()=>res();u.onerror=e=>{(e.error==='canceled'||e.error==='interrupted')?res():rej(new Error(e.error||'voz'))};speechSynthesis.speak(u)});
  const wavUrl=(b64,mime)=>{const bin=atob(b64),n=bin.length,pcm=new Uint8Array(n);for(let i=0;i<n;i++)pcm[i]=bin.charCodeAt(i);
    if(mime&&!/pcm|L16/i.test(mime))return URL.createObjectURL(new Blob([pcm],{type:mime}));
    const m=/rate=(\d+)/.exec(mime||''),sr=m?+m[1]:24000,h=new DataView(new ArrayBuffer(44)),w=(o,s)=>{for(let i=0;i<s.length;i++)h.setUint8(o+i,s.charCodeAt(i))};
    w(0,'RIFF');h.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');h.setUint32(16,16,true);h.setUint16(20,1,true);h.setUint16(22,1,true);h.setUint32(24,sr,true);h.setUint32(28,sr*2,true);h.setUint16(32,2,true);h.setUint16(34,16,true);w(36,'data');h.setUint32(40,n,true);
    return URL.createObjectURL(new Blob([h.buffer,pcm],{type:'audio/wav'}));};
  async function ttsModels(key){
    if(auModels)return auModels;
    try{const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(15000)});const d=await r.json();
      const l=(d.models||[]).map(m=>String(m.name).replace('models/','')).filter(n=>/tts/i.test(n));
      l.sort((a,b)=>(/flash/.test(b)?1:0)-(/flash/.test(a)?1:0)||b.localeCompare(a));if(l.length){auModels=l;return l}}catch(e){}
    auModels=['gemini-2.5-flash-preview-tts'];return auModels;
  }
  async function tts(txt,voice){
    const c=ai(),ms=await ttsModels(c.key);let last='';
    for(const m of ms.slice(0,3)){
      try{
        const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':c.key},body:JSON.stringify({contents:[{parts:[{text:txt}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}}),signal:AbortSignal.timeout(70000)});
        const d=await r.json().catch(()=>({}));
        if(r.ok){const p=((((d.candidates||[])[0]||{}).content||{}).parts||[]).find(x=>x.inlineData);if(p)return wavUrl(p.inlineData.data,p.inlineData.mimeType);last='La IA no devolvió audio';continue}
        last=(d.error&&d.error.message)||('Error '+r.status);if([400,401,403,429].includes(r.status))break;
      }catch(e){last=e.message}
    }
    throw new Error(last||'No se pudo generar el audio');
  }
  const playUrl=url=>new Promise((res,rej)=>{const a=AU.audio;if(!a)return res();a.onended=()=>res();a.onerror=()=>rej(new Error('No se pudo reproducir el audio'));a.src=url;a.playbackRate=aCfg().rate;a.play().catch(rej)});
  async function runAudio(seg0){
    const gen=++AU.gen,eng=aCfg().eng==='ai'?'ai':'device';
    if(eng==='ai'&&!(ai()&&ai().key&&ai().p!=='claude')){say('Cargá tu clave de Gemini para usar la voz con IA','err');return}
    if(eng==='device'&&!('speechSynthesis' in window)){say('Tu navegador no tiene lectura en voz alta','err');return}
    AU.on=true;AU.paused=false;AU.rest=null;
    if(eng==='ai'){try{AU.audio=new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');AU.audio.play().catch(()=>{})}catch(e){}}
    try{navigator.mediaSession.metadata=new MediaMetadata({title:title,artist:o.author||'Kinderly'});navigator.mediaSession.setActionHandler('pause',()=>pauseAudio());navigator.mediaSession.setActionHandler('play',()=>resumeAudio())}catch(e){}
    if(AU.onState)AU.onState();
    try{
      let seg=seg0||await audioText();
      while(seg&&AU.gen===gen){
        if(seg.text.length>=20){
          AU.href=seg.href;const list=chunks(seg.text,eng==='ai'?700:200);AU.list=list;let pre=null;
          for(AU.pos=0;AU.pos<list.length&&AU.gen===gen;AU.pos++){
            if(eng==='ai'){const v=aCfg().voice,cur=pre||tts(list[AU.pos],v);pre=AU.pos+1<list.length?tts(list[AU.pos+1],v):null;if(pre)pre.catch(()=>{});const u=await cur;if(AU.gen!==gen)return;await playUrl(u)}
            else await speak(list[AU.pos]);
          }
        }
        if(AU.gen!==gen)return;
        const nh=nextHref(seg.href);if(!nh)break;
        try{await rend.display(nh)}catch(e){}
        seg=await audioText(nh);
      }
    }catch(e){if(AU.gen===gen)say('Audio: '+((e&&e.message)||'error'),'err')}
    if(AU.gen===gen){AU.on=false;AU.paused=false;if(AU.onState)AU.onState()}
  }
  const pauseAudio=()=>{if(!AU.on)return;AU.paused=true;if(aCfg().eng==='ai'&&AU.audio){AU.audio.pause()}else{const rest=AU.list.slice(AU.pos).join(' ');AU.gen++;try{speechSynthesis.cancel()}catch(e){}AU.rest={href:AU.href,text:rest};AU.on=false}if(AU.onState)AU.onState()};
  const resumeAudio=()=>{if(!AU.paused)return;if(AU.on&&AU.audio){AU.paused=false;AU.audio.play().catch(()=>{});if(AU.onState)AU.onState()}else if(AU.rest){const r=AU.rest;AU.rest=null;runAudio(r)}};
  const audioPanel=()=>panel('🎧 Audiolectura',b=>{
    const c=aCfg(),gem=!!(ai()&&ai().key&&ai().p!=='claude');
    const chips=(label,opts,get,set)=>{const r=el('div','row');r.append(el('b','',label));const bs=[];opts.forEach(([t,v])=>{const x=btn(t,()=>{set(v);bs.forEach(y=>y[1].classList.toggle('sel',y[0]===v))},t);bs.push([v,x]);x.classList.toggle('sel',get()===v);r.append(x)});b.append(r)};
    const st=el('p','hint2','');
    const refresh=()=>{if(!st.isConnected)return;st.textContent=AU.on?(AU.paused?'En pausa.':'Leyendo en voz alta…'):(AU.paused?'En pausa.':'Tocá “Leer desde acá” para empezar donde estás.')};
    AU.onState=refresh;
    const ctl=el('div','row');
    ctl.append(btn('▶ Leer desde acá',()=>{if(AU.paused){resumeAudio()}else{stopAudio();runAudio()}},'Leer'),btn('⏸ Pausa',pauseAudio,'Pausa'),btn('⏹ Detener',stopAudio,'Detener'));
    b.append(ctl,st);refresh();
    chips('Voz',[['Del dispositivo (gratis)','device'],['Con IA (tu clave)','ai']],()=>aCfg().eng,v=>{stopAudio();setA('eng',v);audioPanel()});
    if(c.eng==='ai'){
      if(!gem){b.append(el('p','hint2',ai()&&ai().key?'Las voces con IA usan tu clave de Gemini; la que cargaste es de Claude.':'Las voces con IA usan tu propia clave de Gemini (gratis en Google AI Studio).'),btn('Cargar mi clave de Gemini',aiPanel))}
      else{
        chips('Elegí una voz',AV.map(x=>[x[1],x[0]]),()=>aCfg().voice,v=>{setA('voice',v)});
        b.append(btn('🔊 Probar voz',async()=>{try{say('Generando muestra…');const u=await tts('Hola, esta es mi voz. Puedo leerte tu libro en voz alta.',aCfg().voice);const a=new Audio(u);a.play()}catch(e){say((e&&e.message)||'No se pudo','err')}}));
        b.append(el('p','note','Voz natural generada por Gemini. Cada fragmento consume un poco de tu cuota o saldo.'));
      }
    }else{
      const vs=devVoices();
      if(!vs.length){b.append(el('p','hint2','No encontramos voces en español en este dispositivo. Podés instalarlas desde los ajustes del celular (Idioma → Texto a voz) o usar la voz con IA.'));if(window.speechSynthesis&&!AU.vwait){AU.vwait=1;setTimeout(()=>{AU.vwait=0;const h=pnl.querySelector('h4');if(pnl.classList.contains('on')&&h&&/Audiolectura/.test(h.textContent)&&devVoices().length)audioPanel()},900)}}
      else{const s=document.createElement('select');s.style.cssText='width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;margin:6px 0';vs.forEach(v=>{const o2=document.createElement('option');o2.value=v.voiceURI;o2.textContent=v.name+' ('+v.lang+')';s.append(o2)});s.value=vs.some(v=>v.voiceURI===c.dev)?c.dev:vs[0].voiceURI;s.onchange=()=>setA('dev',s.value);b.append(s)}
    }
    chips('Velocidad',[['Lenta',0.85],['Normal',1],['Rápida',1.25],['Muy rápida',1.5]],()=>aCfg().rate,v=>{setA('rate',v);if(AU.audio)AU.audio.playbackRate=v});
    b.append(el('p','note','Lee desde la página en la que estás y sigue con los capítulos siguientes. Al cerrar el libro se detiene.'));
  });

  // ----- armado de la interfaz -----
  top.append(btn('✕',()=>close(),'Cerrar'),ttl,btn('🎧',audioPanel,'Audiolectura'),btn('✨',aiPanel,'Resumen con IA'),btn('☰',()=>contents('toc'),'Contenido'),btn('Aa',looks,'Apariencia'));
  bot.append(btn('‹',()=>rend&&rend.prev(),'Página anterior'),prog,btn('›',()=>rend&&rend.next(),'Página siguiente'));
  // barra de selección
  const selBtns=()=>{selbar.textContent='';
    Object.keys(HL).forEach(c=>{const x=btn('',()=>{if(!curSel)return;addMark(curSel.cfi,curSel.text,c);try{curSel.contents.window.getSelection().removeAllRanges()}catch(e){}hideSel()},'Subrayar '+c,'dot');x.style.background=HL[c];selbar.append(x)});
    selbar.append(btn('Nota',()=>{if(!curSel)return;const m=addMark(curSel.cfi,curSel.text,'amarillo');hideSel();editMark(m)}),btn('Definir',()=>{if(!curSel)return;const w=curSel.text,cx=curSel.ctx;hideSel();define(w,cx)}),btn('Copiar',()=>{if(curSel){try{navigator.clipboard.writeText(curSel.text);say('Copiado','ok')}catch(e){}}hideSel()}),btn('✕',hideSel,'Cancelar'));};
  selBtns();
  root.append(top,view,bot,selbar,pnl);view.append(msg);document.body.append(root);document.body.style.overflow='hidden';cur=root;
  try{history.pushState({kr:1},'')}catch(e){}
  window.addEventListener('popstate',pop);document.addEventListener('keydown',key);

  try{
    await libs();
    let buf=o.buf||await dbGet(id);
    if(!buf){msg.textContent='Descargando “'+title+'”… (puede tardar unos segundos)';buf=await fetchBook(o.url);}
    if(o.buf||!(await dbGet(id)))dbPut(id,buf);
    if(closed)return;
    book=ePub(buf.slice?buf.slice(0):buf);
    loadMarks();
    const mount=async(cfi)=>{
      const sc=prefs().mode==='scrolled';view.dataset.mode=sc?'scrolled':'paginated';view.textContent='';
      rend=book.renderTo(view,sc?{width:'100%',height:'100%',flow:'scrolled',manager:'continuous',allowScriptedContent:false}:{width:'100%',height:'100%',flow:'paginated',spread:'none',allowScriptedContent:false});
      rend.hooks.content.register(c=>{try{const d=c.document,l=d.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Crimson+Pro:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Bitter:ital,wght@0,400;0,700;1,400&family=Nunito:ital,wght@0,400;0,700;1,400&family=Lexend:wght@400;600&display=swap';d.head.append(l)}catch(e){}});
      style();
      await rend.display(cfi||undefined);
    rend.on('relocated',loc=>{lastCfi=loc.start.cfi;if(book.locations&&book.locations.length()){pct=book.locations.percentageFromCfi(lastCfi)||0;range.value=Math.round(pct*1000);pt.textContent=Math.round(pct*100)+'%'}hideSel();save()});
    rend.on('click',e=>{if(selbar.classList.contains('on')){return}const w=(e.view||window).innerWidth||innerWidth,x=e.clientX%w;closePanel();if(!sc&&x<w*0.28)rend.prev();else if(!sc&&x>w*0.72)rend.next();else root.classList.toggle('hide')});
    let sx=0;rend.on('touchstart',e=>{sx=e.changedTouches[0].screenX});rend.on('touchend',e=>{const dx=e.changedTouches[0].screenX-sx;if(!sc&&Math.abs(dx)>60){dx<0?rend.next():rend.prev()}});
    rend.on('keyup',e=>{if(e.key==='ArrowRight')rend.next();if(e.key==='ArrowLeft')rend.prev()});
    rend.on('selected',(cfi,contents)=>{
      try{const r=rend.getRange(cfi),text=(r?r.toString():'').replace(/\s+/g,' ').trim();if(!text)return;
        let ctx='';try{ctx=(r.startContainer.parentElement.textContent||'').replace(/\s+/g,' ').trim().slice(0,300)}catch(e){}
        curSel={cfi,text,contents,ctx};closePanel();if(text.length<=30&&!/\s/.test(text)){const n=Date.now();if(window.__krW&&window.__krW.w===text&&n-window.__krW.t<2500)return;window.__krW={w:text,t:n};hideSel();define(text,ctx);return}selbar.classList.add('on')}catch(e){}
    });
    };
    remount=async()=>{const c=lastCfi;try{rend.destroy()}catch(e){}rend=null;await mount(c);marks.forEach(paint);closePanel()};
    // título y autor reales para archivos del celular
    book.loaded.metadata.then(md=>{if(o.local&&md){const t=(md.title||'').trim();if(t){ttl.textContent=t;o.title=t;title=t}if(md.creator)o.author=md.creator;}}).catch(()=>{});
    await mount(o.cfi||entry().cfi||undefined);
    msg.remove();ready=true;marks.forEach(paint);
    if(o.local){try{const md=await book.loaded.metadata;if(md&&md.title){o.title=md.title.trim();title=o.title}if(md&&md.creator)o.author=md.creator}catch(e){}}
    book.loaded.navigation.then(nav=>{const add=(items,d)=>items.forEach(it=>{tocItems.push({label:(it.label||'').trim(),href:it.href,d});if(it.subitems&&it.subitems.length)add(it.subitems,1)});add(nav.toc||[],0)}).catch(()=>{});
    book.ready.then(()=>book.locations.generate(1200)).then(()=>{if(closed)return;range.disabled=false;if(lastCfi){pct=book.locations.percentageFromCfi(lastCfi)||0;range.value=Math.round(pct*1000);pt.textContent=Math.round(pct*100)+'%';save()}}).catch(()=>{});
    range.onchange=()=>{if(book.locations.length())rend.display(book.locations.cfiFromPercentage(range.value/1000))};
    save();
  }catch(e){
    msg.textContent='No se pudo abrir el libro: '+(e&&e.message||'error');msg.style.pointerEvents='auto';
  }
}

// ---- archivos del celular ----
async function openFile(file){
  if(!file)return;
  if(!/\.epub$/i.test(file.name)&&file.type!=='application/epub+zip'){say('Elegí un archivo .epub','err');return}
  if(file.size>120*1024*1024){say('El archivo es demasiado grande','err');return}
  try{
    say('Abriendo “'+file.name+'”…');
    const buf=await file.arrayBuffer();
    const id='local:'+file.name+':'+file.size;
    const title=file.name.replace(/\.epub$/i,'').replace(/[_]+/g,' ');
    open({id,title,author:'',buf,local:true});
  }catch(e){say('No se pudo leer el archivo','err')}
}
function pickFile(){const i=document.createElement('input');i.type='file';i.accept='.epub,application/epub+zip';i.onchange=()=>openFile(i.files&&i.files[0]);i.click()}

// ---- pestaña Biblioteca ----
function renderLib(){
  const host=document.querySelector('.view[data-view="biblioteca"]');if(!host)return;
  host.textContent='';
  host.append(el('h2','vt','Mi biblioteca'),el('p','vs','Tus libros, incluso sin conexión.'));
  const S0=stats(),sc=el('div','card kr-stats');
  [[String(S0.streak),S0.streak===1?'día seguido':'días seguidos'],[fmtMin(S0.today),'hoy'],[fmtMin(S0.week),'esta semana']].forEach(([v,k])=>{const c=el('div','kr-sc');c.append(el('b','',v),el('small','',k));sc.append(c)});
  const goalM=(window.KEx&&window.KEx.goal())||10,gS=goalM*60,pctG=Math.min(1,S0.today/gS);
  const gw=el('div','kr-goal'),gh=el('div','kr-gh');gh.append(el('span','',pctG>=1?'Meta de hoy cumplida':'Meta de hoy: '+Math.floor(S0.today/60)+' de '+goalM+' min'));
  const gb=el('button','kr-gl','Cambiar');gb.type='button';gb.onclick=()=>window.KEx&&window.KEx.pickGoal();gh.append(gb);
  const gbar=el('div','kr-gbar'),gi=el('i');gi.style.width=Math.round(pctG*100)+'%';if(pctG>=1)gi.className='done';gbar.append(gi);gw.append(gh,gbar);
  const wk=el('div','kr-wk'),stt=stGet(),maxS=Math.max(gS,...Array.from({length:7},(_,i)=>{const x=new Date();x.setDate(x.getDate()-i);return stt[dk(x)]||0}));
  for(let i=6;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);const v=stt[dk(x)]||0,col=el('div','kr-wc'),bar=el('div','kr-wb'),f=el('i');f.style.height=Math.max(v?8:3,Math.round(v/maxS*100))+'%';if(v>=gS)f.className='done';bar.append(f);col.append(bar,el('small',i===0?'on':'','DLMMJVS'[x.getDay()]));wk.append(col)}
  sc.append(gw,wk);host.append(sc);
  if(!S0.week)host.append(el('p','hint2 kr-sn','Leé un minuto hoy en la app y empieza tu racha.'));
  const top=el('div','card');
  top.append(el('b','','Abrir un libro de tu celular'),el('p','hint2','Elegí un archivo .epub que ya tengas guardado (descargas, Drive, mail…). Queda en esta biblioteca y no sale de tu dispositivo.'));
  const b=btn('Elegir archivo EPUB',pickFile);b.style.marginTop='10px';top.append(b);host.append(top);
  const l=lib();
  const sec=el('div','card');sec.style.marginTop='14px';sec.append(el('b','','Leídos recientemente'));
  if(!l.length){sec.append(el('p','hint2','Todavía no abriste ningún libro. Buscá uno y tocá “Leer en la app”, o abrí un archivo.'));const g=btn('Buscar mi primer libro',()=>window.showView&&window.showView('buscar'));g.classList.add('empty-cta');sec.append(g)};
  l.forEach(x=>{
    const r=el('div','lib-item'),d=el('div');d.append(el('b','',x.title),el('small','',(x.author?x.author+' · ':'')+Math.round((x.pct||0)*100)+'% · '+(x.local?'archivo propio · ':'')+fmtDate(x.t)));
    const bar=el('div','lib-bar'),i=el('i');i.style.width=Math.round((x.pct||0)*100)+'%';bar.append(i);d.append(bar);
    const open1=btn('Leer',()=>open({id:x.id,url:x.url,title:x.title,author:x.author,cached:true,local:x.local}));
    const rv=btn('Reseñas',()=>{if(window.KRev)window.KRev.open({title:x.title,author:x.author})},'Reseñas del libro','ghost');
    const del=btn('Quitar',async()=>{if(!confirm('¿Quitar “'+x.title+'” de tu biblioteca? Se borran también tus subrayados.'))return;saveLib(lib().filter(y=>y.id!==x.id));store.del(hlKey(x.id));store.del('kr_sum_'+x.id);await dbDel(x.id);renderLib();cont()},'Quitar','ghost');
    r.append(d,open1,rv,del);sec.append(r);
  });
  host.append(sec);
  if(window.KEx)window.KEx.render(host);
}

// ---- tarjeta “Seguí leyendo” (inicio) ----
function cont(){
  streakPill();
  const host=document.querySelector('.view[data-view="buscar"]');if(!host)return;
  let box=$('kr-cont');const l=lib()[0];
  if(!l){if(box)box.remove();return}
  if(!box){box=el('div','card');box.id='kr-cont';const lead=host.querySelector('.lead');const an=$('kr-st')||lead;an?an.after(box):host.prepend(box)}
  box.textContent='';
  const d=el('div');d.append(el('small','','Seguí leyendo'),el('b','',l.title),el('small','',Math.round((l.pct||0)*100)+'% leído'));
  const b=btn('Continuar',()=>open({id:l.id,url:l.url,title:l.title,author:l.author,cached:true,local:l.local}));
  box.append(d,b);
}

// ---- ajustes de IA ----
function aiSettings(){
  const host=document.querySelector('.view[data-view="ajustes"]');if(!host||$('ai-set'))return;
  const c=el('div','card');c.id='ai-set';c.style.marginTop='14px';
  c.append(el('b','','IA para resúmenes (opcional)'),el('p','hint2','Cargá tu propia clave de Gemini o de Claude para pedir resúmenes de capítulos dentro del lector. Se usa tu cuota o saldo.'));
  const f=el('div');aiForm(f,()=>aiSettingsRefresh());c.append(f);host.append(c);
  window.aiSettingsRefresh=()=>{f.textContent='';aiForm(f,()=>aiSettingsRefresh())};
}
const aiSettingsRefresh=()=>window.aiSettingsRefresh&&window.aiSettingsRefresh();

function decorate(b,actions){
  const o=b.opts.find(x=>x.sendable&&typeof x.url==='function');if(!o)return;
  const x=el('button','read','Leer en la app');x.type='button';
  x.onclick=async()=>{x.disabled=true;try{const url=await o.url();await open({url,title:b.title,author:b.author})}catch(e){say(e&&e.message||'No se pudo abrir','err')}finally{x.disabled=false}};
  actions.append(x);
}

window.KReader={open,openFile,pickFile,decorate,continueReading:cont,renderLibrary:renderLib};
cont();renderLib();aiSettings();
})();
