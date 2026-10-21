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
const prefs=()=>Object.assign({mode:'paginated',size:110,theme:'auto',font:'clasica',lh:1.6,margin:18,just:false,dim:0,warm:0},store.get('kr_cfg',{}));
const setPref=(k,v)=>{const q=prefs();q[k]=v;store.set('kr_cfg',q)};
const resolveTheme=()=>{const t=prefs().theme;if(t!=='auto')return THEMES[t]||THEMES.claro;const dark=document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);return dark?THEMES.noche:THEMES.claro};
const lib=()=>store.get('kr_lib',[]);
const saveLib=l=>store.set('kr_lib',l.slice(0,40));
const QT={azul:{n:'Azul',bg:['#3E5287','#232B45'],fg:'#FFFFFF',ac:'#D9C58B',mu:'rgba(255,255,255,.7)',orb:'rgba(255,255,255,.07)'},
  papel:{n:'Papel',bg:['#F7F2E7','#EBE3D2'],fg:'#2B2523',ac:'#C8372D',mu:'rgba(43,37,35,.65)',orb:'rgba(200,55,45,.07)'},
  noche:{n:'Noche',bg:['#14171F','#0A0C11'],fg:'#EFEBE1',ac:'#D9C58B',mu:'rgba(239,235,225,.62)',orb:'rgba(217,197,139,.08)'},
  atardecer:{n:'Atardecer',bg:['#E9A27E','#6B3F7A'],fg:'#FFFFFF',ac:'#FFF1D6',mu:'rgba(255,255,255,.78)',orb:'rgba(255,255,255,.1)'}};
function renderCard(text,title,author,tpl,fmt){
  const T=QT[tpl]||QT.azul,W=1080,H=fmt==='post'?1350:1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,W*.6,H);g.addColorStop(0,T.bg[0]);g.addColorStop(1,T.bg[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle=T.orb;x.beginPath();x.arc(W-100,H*.14,320,0,7);x.fill();x.beginPath();x.arc(60,H*.9,280,0,7);x.fill();
  let t=text.replace(/\s+/g,' ').trim();if(t.length>380)t=t.slice(0,377).replace(/\s+\S*$/,'')+'…';
  const fs=(t.length<90?84:t.length<160?70:t.length<260?58:t.length<330?50:44)+(fmt==='post'?0:6),lh=Math.round(fs*1.36),maxW=W-220;
  x.font='italic '+fs+'px Newsreader,Georgia,serif';
  const words=t.split(' '),lines=[];let ln='';words.forEach(w=>{const tt=ln?ln+' '+w:w;if(x.measureText(tt).width>maxW&&ln){lines.push(ln);ln=w}else ln=tt});if(ln)lines.push(ln);
  const bh=lines.length*lh,top=fmt==='post'?170:300,bot=fmt==='post'?H-300:H-420,y0=Math.max(top+170,top+(bot-top-bh)/2+60);
  x.fillStyle=T.ac;x.font='bold 240px Georgia,serif';x.fillText('“',100,y0-lh+10);
  x.fillStyle=T.fg;x.font='italic '+fs+'px Newsreader,Georgia,serif';let y=y0;lines.forEach(l=>{x.fillText(l,110,y);y+=lh});
  const by=Math.min(H-(fmt==='post'?230:380),y+70);
  x.fillStyle=T.ac;x.fillRect(110,by,96,5);
  x.fillStyle=T.fg;x.font='600 42px Newsreader,Georgia,serif';x.fillText(String(title||'').slice(0,38),110,by+75);
  x.fillStyle=T.mu;x.font='32px Instrument Sans,system-ui,sans-serif';x.fillText(String(author||'').slice(0,46),110,by+125);
  x.fillStyle=T.mu;x.font='600 26px Instrument Sans,system-ui,sans-serif';x.fillText('Kinderly',110,H-(fmt==='post'?70:150));
  return c;
}
const cvBlob=c=>new Promise(r=>c.toBlob(r,'image/png'));
async function shareCard(c,title,save){
  const blob=await cvBlob(c);if(!blob)throw new Error('canvas');const f=new File([blob],'cita-kinderly.png',{type:'image/png'});
  if(!save&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'Cita de '+title});return}catch(e){if(e&&e.name==='AbortError')return}}
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='cita-kinderly.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);say('Imagen guardada','ok');
}
function quoteCard(text,title,author){
  const old=document.getElementById('kr-qs');if(old)old.remove();
  const host=document.getElementById('kr')||document.body;
  let tpl=store.get('kr_qt','azul'),fmt=store.get('kr_qf','story');if(!QT[tpl])tpl='azul';
  const ov=el('div','kr-qs');ov.id='kr-qs';const sh=el('div','kr-qsh');
  const close=()=>{ov.classList.remove('on');setTimeout(()=>ov.remove(),250)};
  ov.onclick=e=>{if(e.target===ov)close()};
  const hd=el('div','kr-qh');hd.append(el('b','','Tu frase'),btn('✕',close,'Cerrar','ghost'));
  const pv=el('div','kr-qp'),im=el('img');im.alt='Vista previa de la tarjeta';pv.append(im);
  let cv=null,url='';
  const draw=()=>{cv=renderCard(text,title,author,tpl,fmt);cvBlob(cv).then(b=>{if(!b)return;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(b);im.src=url});pv.style.aspectRatio=fmt==='post'?'1080/1350':'1080/1920'};
  const tr=el('div','kr-qt');const tb={};Object.keys(QT).forEach(k=>{const x=btn('',()=>{tpl=k;store.set('kr_qt',k);Object.keys(tb).forEach(j=>tb[j].classList.toggle('sel',j===k));draw()},QT[k].n,'kr-qd');x.style.background='linear-gradient(135deg,'+QT[k].bg[0]+','+QT[k].bg[1]+')';x.classList.toggle('sel',k===tpl);tb[k]=x;tr.append(x)});
  const sg=el('div','ap-seg');const fb={};[['Historia','story'],['Publicación','post']].forEach(([n,v])=>{const x=btn(n,()=>{fmt=v;store.set('kr_qf',v);Object.keys(fb).forEach(j=>fb[j].classList.toggle('sel',j===v));draw()});x.classList.toggle('sel',v===fmt);fb[v]=x;sg.append(x)});
  const main=btn('Compartir en Instagram y más',()=>shareCard(cv,title).catch(()=>say('No pude compartir la imagen','err')),'Compartir');main.classList.add('kr-qm');
  const sv=btn('Guardar imagen',()=>shareCard(cv,title,true).catch(()=>say('No pude guardar','err')),'Guardar','ghost');
  const nt=el('p','note','Se abre el menú de compartir de tu celular: elegí Instagram y después “Historia”.');
  const off=btn(store.get('kr_qs_off',false)===true?'Mostrar esto al subrayar':'No mostrar esto al subrayar',()=>{const v=store.get('kr_qs_off',false)!==true;store.set('kr_qs_off',v);off.textContent=v?'Mostrar esto al subrayar':'No mostrar esto al subrayar'},'Preferencia','ghost');off.style.cssText='border:0;background:transparent;font-weight:500;opacity:.7;height:36px';
  sh.append(hd,pv,tr,sg,main,sv,nt,off);ov.append(sh);host.append(ov);requestAnimationFrame(()=>ov.classList.add('on'));draw();
}
function fixOrphans(d){try{const bl=[...d.body.querySelectorAll('p')];let n=0;
  for(let i=1;i<bl.length;i++){const p=bl[i],q=bl[i-1];if(p.parentNode!==q.parentNode)continue;const t=p.textContent.trim(),qt=q.textContent.trim();
    if(!t||!qt||!/^[a-záéíóúñü]/.test(t)||/[.!?…:»”"')\]]$/.test(qt)||qt.length<30)continue;
    if(t.length<=60||q.dataset.m){q.append(' ');while(p.firstChild)q.append(p.firstChild);q.dataset.m='1';p.remove();bl[i]=q;n++}}
  return n}catch(e){return 0}}
window.__krFix=fixOrphans;window.__krQuote=(t,a,b)=>quoteCard(t,a,b);
const idOf=u=>String(u).replace(/[?#].*$/,'');
const hlKey=id=>'kr_hl_'+id;const bmKey=id=>'kr_bm_'+id;

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
async function askAI(prompt,onTry){
  const c=ai();if(!c||!c.key)throw new Error('Primero cargá tu clave de IA en Ajustes.');
  if(c.p==='claude'){
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':c.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-haiku-5-5',max_tokens:1200,messages:[{role:'user',content:prompt}]}),signal:AbortSignal.timeout(60000)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error((d.error&&d.error.message)||('Error '+r.status));
    return (d.content||[]).map(x=>x.text||'').join('').trim();
  }
  let last='';
  let n=0;
  for(const m of GEMINI){
    n++;if(onTry)onTry(n,GEMINI.length);
    try{
      const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':c.key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:2048}}),signal:AbortSignal.timeout(40000)});
      const d=await r.json().catch(()=>({}));
      if(r.ok){const t=((((d.candidates||[])[0]||{}).content||{}).parts||[]).map(p=>p.text||'').join('').trim();if(t)return t;last='Respuesta vacía';continue}
      last=(d.error&&d.error.message)||('Error '+r.status);
      if(r.status===400||r.status===401||r.status===403)break;
    }catch(e){last=(e&&e.name==='TimeoutError')?'La IA tardó demasiado en responder':e.message}
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
'#kr .kr-bar{display:flex;align-items:center;gap:6px;padding:8px 10px;padding-top:calc(8px + env(safe-area-inset-top,0px));background:color-mix(in srgb,var(--krbg) 78%,transparent);-webkit-backdrop-filter:blur(20px) saturate(1.5);backdrop-filter:blur(20px) saturate(1.5);border-bottom:1px solid rgba(128,128,128,.2);transition:transform .35s cubic-bezier(.22,1,.36,1);z-index:3}'+
'#kr .kr-bot{border-top:1px solid rgba(128,128,128,.25);border-bottom:0;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}'+
'#kr .kr-foot{position:absolute;left:0;right:0;bottom:calc(6px + env(safe-area-inset-bottom,0px));text-align:center;font-size:.7rem;opacity:0;pointer-events:none;transition:opacity .2s;color:var(--krfg,#222)}#kr.hide .kr-foot{opacity:.6}#kr .kr-prog span{line-height:1.25}'+
'#kr.hide .kr-top{transform:translateY(-100%)}#kr.hide .kr-bot{transform:translateY(100%)}'+
'#kr button{background:transparent;color:inherit;border:1px solid rgba(128,128,128,.35);border-radius:10px;min-width:40px;height:40px;padding:0 10px;font:600 .9rem var(--sans);white-space:nowrap}'+
'#kr button.sel{background:rgba(31,140,110,.25);border-color:rgba(31,140,110,.8)}'+
'#kr .kr-title{flex:1;min-width:0;text-align:center;font:600 .92rem var(--serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'#kr-view{flex:1;min-height:0;position:relative}#kr-view[data-mode=paginated] .epub-container{overflow:hidden!important}'+
'#kr .kr-msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;pointer-events:none;opacity:.8}'+
'#kr .kr-prog{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}#kr .kr-prog input{width:100%}#kr .kr-prog span{font-size:.72rem;text-align:center;opacity:.75}'+
'#kr .kr-panel{position:absolute;left:0;right:0;bottom:0;max-height:78%;display:flex;flex-direction:column;background:color-mix(in srgb,var(--krbg) 84%,transparent);-webkit-backdrop-filter:blur(24px) saturate(1.5);backdrop-filter:blur(24px) saturate(1.5);color:var(--krfg);border-top:1px solid rgba(128,128,128,.3);box-shadow:0 -10px 30px rgba(0,0,0,.22);transform:translateY(105%);transition:transform .22s;z-index:5}'+
'#kr .kr-panel.on{transform:none}#kr .kr-ph{display:flex;align-items:center;gap:8px;padding:12px 16px 4px}#kr .kr-ph h4{flex:1;margin:0;font:600 1rem var(--serif)}'+
'#kr .kr-pb{overflow:auto;padding:8px 16px calc(16px + env(safe-area-inset-bottom,0px))}'+
'#kr .kr-tabs{display:flex;gap:6px;margin:4px 0 10px}#kr .kr-tabs button{flex:1;padding:0 4px;font-size:.82rem;min-width:0}'+
'#kr .kr-panel{border-radius:22px 22px 0 0;max-height:68%}#kr .kr-panel::before{content:"";display:block;width:38px;height:4px;border-radius:2px;background:rgba(128,128,128,.4);margin:8px auto 0;flex:none}'+
'#kr .kr-dim,#kr .kr-warm{position:absolute;inset:0;pointer-events:none;z-index:2}#kr .kr-warm{mix-blend-mode:multiply}#kr .ap-sl{display:flex;align-items:center;gap:10px;margin:2px 0 8px}#kr .ap-sl input{flex:1;accent-color:#5468A3}'+
'#kr .kr-q{padding:12px 0;border-bottom:1px solid rgba(128,128,128,.2)}#kr .kr-q p{margin:0 0 6px;font:italic 1rem/1.5 var(--serif)}#kr .kr-q .row{margin:4px 0 0}'+
'#kr-qs,.kr-qs{position:fixed;inset:0;z-index:60;background:rgba(10,12,20,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .25s}.kr-qs.on,#kr-qs.on{opacity:1}.kr-qsh{width:100%;max-width:520px;max-height:94vh;overflow:auto;background:var(--card,#fff);color:var(--ink,#222);border-radius:26px 26px 0 0;padding:14px 18px calc(18px + env(safe-area-inset-bottom,0px));transform:translateY(40px);transition:transform .45s cubic-bezier(.34,1.4,.64,1);box-shadow:0 -10px 40px rgba(0,0,0,.3)}.kr-qs.on .kr-qsh{transform:none}'+
'.kr-qh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.kr-qh b{font:600 1.1rem var(--serif,Georgia)}.kr-qs button{font:600 .92rem var(--sans,system-ui)}'+
'.kr-qp{margin:0 auto 12px;height:min(46vh,420px);max-width:100%;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.28);background:#222}.kr-qp img{display:block;height:100%;width:auto;margin:0 auto}'+
'.kr-qt{display:flex;justify-content:center;gap:12px;margin:4px 0 12px}.kr-qd{width:40px!important;min-width:40px!important;height:40px!important;padding:0!important;border-radius:50%!important;border:2px solid rgba(128,128,128,.35)!important}.kr-qd.sel{border-color:#5468A3!important;box-shadow:0 0 0 3px rgba(84,104,163,.3)}'+
'.kr-qs .ap-seg{display:flex;gap:2px;background:rgba(128,128,128,.14);border-radius:12px;padding:3px;margin-bottom:12px}.kr-qs .ap-seg button{flex:1;border:0;height:38px;border-radius:9px;background:transparent;color:inherit}.kr-qs .ap-seg button.sel{background:var(--card,#fff);box-shadow:0 1px 3px rgba(0,0,0,.18);font-weight:700}'+
'.kr-qs .kr-qm{width:100%;height:50px;border-radius:999px;border:0;background:var(--btn,#5468A3);color:#fff;margin-bottom:8px}.kr-qs .ghost{width:100%;height:44px;border-radius:999px}.kr-qs .kr-qh .ghost{width:40px}.kr-qs .note{text-align:center;font-size:.75rem;opacity:.65;margin:8px 0 0}'+
'#kr .kr-br{position:absolute;right:12px;left:12px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:6;padding:10px 16px;border-radius:18px;background:color-mix(in srgb,var(--krbg) 88%,transparent);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border:1px solid rgba(128,128,128,.3);box-shadow:0 8px 28px rgba(0,0,0,.25);opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .2s,transform .3s cubic-bezier(.34,1.4,.64,1)}#kr .kr-br.on{opacity:1;pointer-events:auto;transform:none}#kr.hide .kr-br{opacity:0;pointer-events:none}'+
'#kr .kr-mus{position:absolute;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));height:80px;z-index:4;display:none}#kr .kr-mus.on{display:block}#kr .kr-mus.off,#kr.hide .kr-mus{opacity:0;pointer-events:none}#kr .kr-mh{margin:16px 0 4px;font-weight:600}'+
'#kr .ap-s{margin:0 0 16px}#kr .ap-l{font:600 .68rem var(--sans);letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin:0 2px 8px}'+
'#kr .ap-size{display:flex;align-items:center;gap:10px;background:rgba(128,128,128,.12);border-radius:14px;padding:4px}#kr .ap-size .ap-st{flex:1;height:44px;border:0;border-radius:11px;background:rgba(128,128,128,.14);font-size:1.05rem}#kr .ap-pct{min-width:56px;text-align:center;font:600 .95rem var(--sans);font-variant-numeric:tabular-nums}'+
'#kr .ap-fonts,#kr .ap-themes{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:2px 16px 4px;scroll-snap-type:x proximity}#kr .ap-fonts::-webkit-scrollbar,#kr .ap-themes::-webkit-scrollbar{display:none}'+
'#kr .ap-f{flex:none;width:84px;height:auto;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;border-radius:14px;scroll-snap-align:start}#kr .ap-fa{font-size:1.6rem;line-height:1.1}#kr .ap-fn{font:500 .68rem var(--sans);opacity:.75;max-width:100%;overflow:hidden;text-overflow:ellipsis}'+
'#kr .ap-t{flex:none;min-width:64px;height:auto;padding:6px 4px;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:5px}#kr .ap-tc{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font:600 1rem Georgia,serif;border:2px solid rgba(128,128,128,.3);box-sizing:border-box}#kr .ap-tn{font:500 .68rem var(--sans);opacity:.75}#kr .ap-t.sel{background:transparent;border:0}#kr .ap-t.sel .ap-tc{border-color:#5468A3;box-shadow:0 0 0 3px rgba(84,104,163,.28)}#kr .ap-t.sel .ap-tn{opacity:1;font-weight:700}'+
'#kr .ap-seg{display:flex;gap:2px;background:rgba(128,128,128,.14);border-radius:12px;padding:3px}#kr .ap-seg button{flex:1;border:0;height:38px;border-radius:9px;background:transparent;font-weight:500;padding:0 6px}#kr .ap-seg button.sel{background:var(--krbg);box-shadow:0 1px 4px rgba(0,0,0,.18),0 0 0 .5px rgba(128,128,128,.25);font-weight:700}'+
'#kr .kr-panel button{box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}#kr .ap-seg button.sel{box-shadow:0 1px 3px rgba(0,0,0,.18)}#kr .ap-fonts,#kr .ap-themes{scroll-padding-left:16px;scroll-snap-type:none}#kr .ap-t{border-radius:14px}'+
'#kr .ap-f.sel{background:rgba(84,104,163,.16);border-color:#5468A3}#kr .ap-f.sel .ap-fn{opacity:1;font-weight:700}'+
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
  const id=o.id||idOf(o.url||'');let title=(window.kTitle?window.kTitle(o.title):o.title)||'Libro';
  if(!o.buf&&!o.cached&&!hostOk(o.url)){say('El enlace no pertenece a una fuente permitida','err');return}
  const root=el('div');root.id='kr';root.setAttribute('role','dialog');root.setAttribute('aria-label','Lector de '+title);
  const apply=()=>{const t=resolveTheme();root.style.setProperty('--krbg',t.bg);root.style.setProperty('--krfg',t.fg)};apply();
  const top=el('div','kr-bar kr-top'),bot=el('div','kr-bar kr-bot'),view=el('div');view.id='kr-view';
  const msg=el('div','kr-msg','Preparando “'+title+'”…');
  const pnl=el('div','kr-panel');const selbar=el('div','selbar');
  const ttl=el('div','kr-title',title);
  const range=el('input');range.type='range';range.min=0;range.max=1000;range.value=0;range.disabled=true;range.setAttribute('aria-label','Progreso del libro');
  const pt=el('span','','');const prog=el('div','kr-prog');prog.append(range,pt);const foot=el('div','kr-foot');
  let remount=null,book=null,rend=null,ready=false,closed=false,pct=0,lastCfi='',marks=[],curSel=null;
  const entry=()=>lib().find(x=>x.id===id)||{};
  const closePanel=()=>pnl.classList.remove('on');
  const panel=(name,build)=>{pnl.textContent='';const h=el('div','kr-ph');h.append(el('h4','',name),btn('✕',closePanel,'Cerrar panel'));const b=el('div','kr-pb');pnl.append(h,b);build(b);pnl.classList.add('on');selbar.classList.remove('on');const bp=root.querySelector('.kr-br');if(bp)bp.classList.remove('on')};
  const hideSel=()=>{selbar.classList.remove('on');curSel=null};

  // ----- progreso: porcentaje, páginas y tiempo restante -----
  const CPL=1500,CPM=1100;let chEnd=[];
  const spineOf=c=>{const m=/\/6\/(\d+)/.exec(c||'');return m?(+m[1]/2-1):-1};
  const buildCh=()=>{const L=(book.locations&&book.locations._locations)||[];chEnd=new Array(L.length);let end=L.length-1;for(let i=L.length-1;i>=0;i--){if(i===L.length-1||spineOf(L[i])!==spineOf(L[i+1]))end=i;chEnd[i]=end}};
  const fmtT=m=>m<1?'menos de 1 min':m<60?Math.round(m)+' min':Math.floor(m/60)+' h '+String(Math.round(m%60)).padStart(2,'0')+' min';
  const upd=()=>{
    const P=Math.round(pct*100)+'%';
    try{
      const L=book.locations;const n=L&&L.length();
      if(n&&lastCfi){
        const i=Math.max(0,Math.min(n-1,L.locationFromCfi(lastCfi)||0)),ch=Math.max(0,(chEnd[i]!=null?chEnd[i]:n-1)-i);
        pt.textContent=P+' · pág. '+(i+1)+' de '+n+' · cap.: '+fmtT(ch*CPL/CPM)+' · libro: '+fmtT((n-1-i)*CPL/CPM);
        foot.textContent=P+' · pág. '+(i+1)+' de '+n+' · '+fmtT(ch*CPL/CPM)+' para el fin del capítulo';
        return;
      }
    }catch(e){}
    pt.textContent=P;foot.textContent='';
  };
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
    if(q.just){rules['p,li,blockquote']={'text-align':'justify'+im,'text-justify':'inter-word'+im,'hyphens':'auto'+im,'-webkit-hyphens':'auto'+im}}
    const nm='k_'+q.theme+'_'+q.font+'_'+q.lh+'_'+q.margin+'_'+t.bg+(q.just?'_j':'');rend.themes.register(nm,rules);rend.themes.select(nm);rend.themes.fontSize(q.size+'%');
  };
  const dimEl=el('div','kr-dim'),warmEl=el('div','kr-warm');
  const comfort=()=>{const q=prefs();dimEl.style.background='rgba(0,0,0,'+(q.dim/100)+')';warmEl.style.background='rgba(255,140,30,'+(q.warm/100*.5)+')'};
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
    const tabs=el('div','kr-tabs'),body=el('div');const bms=()=>store.get(bmKey(id),[]);const names=[['toc','Índice'],['bm','Marcas'+(bms().length?' ('+bms().length+')':'')],['marks','Notas'+(marks.length?' ('+marks.length+')':'')],['q','Frases'],['find','Buscar']];
    const show=t=>{[...tabs.children].forEach((x,i)=>x.classList.toggle('sel',names[i][0]===t));body.textContent='';
      if(t==='toc'){if(!tocItems.length)body.append(el('p','','Este libro no tiene índice.'));tocItems.forEach(it=>{const x=btn('',()=>{rend.display(it.href);closePanel()},it.label,'li');x.append(document.createTextNode((it.d?'— ':'')+it.label));body.append(x)})}
      if(t==='q'){body.append(el('p','hint2','Frases célebres de este libro o de su autor, tomadas de Wikiquote.'));const box=el('div');body.append(box);loadQuotes(box)}
      if(t==='bm'){const add=btn('🔖 Marcar esta página',()=>{const l=bms(),h=Math.round((pct||0)*100);if(l.some(x=>x.cfi===lastCfi)){say('Esta página ya está marcada','ok');return}let lab='';try{const lc=rend.currentLocation();const h0=lc&&lc.start&&lc.start.href;const t0=tocItems.filter(x=>x.href&&String(x.href).split('#')[0]===String(h0).split('#')[0])[0];lab=t0?t0.label:''}catch(e){}l.push({cfi:lastCfi,pct:pct||0,label:lab,t:Date.now()});store.set(bmKey(id),l);say('Marcador guardado','ok');contents('bm')});add.style.cssText='width:100%;margin-bottom:8px';body.append(add);
        const l=bms().slice().sort((a,c)=>a.pct-c.pct);if(!l.length)body.append(el('p','','Todavía no marcaste ninguna página. Tocá el botón para guardar tu lugar y volver cuando quieras.'));
        l.forEach(m=>{const x=btn('',()=>{rend.display(m.cfi);closePanel()},'Ir al marcador','li');x.append(document.createTextNode('🔖 '+Math.round(m.pct*100)+'%'+(m.label?' · '+m.label:'')));const s=el('small','',new Date(m.t).toLocaleDateString('es-AR'));x.append(s);const d=btn('Quitar',e=>{e.stopPropagation();store.set(bmKey(id),bms().filter(y=>y.cfi!==m.cfi));contents('bm')},'Quitar marcador','ghost');d.style.cssText='margin:4px 0 8px';body.append(x,d)})}
      if(t==='marks'){if(!marks.length)body.append(el('p','','Todavía no subrayaste nada. Mantené apretado un texto del libro para seleccionarlo.'));if(marks.length){const exp=el('div','row');exp.append(btn('Copiar o compartir',()=>exportMarks(false),'Copiar subrayados'),btn('Descargar .md',()=>exportMarks(true),'Descargar subrayados'));body.append(exp)}marks.slice().sort((a,c)=>a.t-c.t).forEach(m=>{const x=btn('',()=>{rend.display(m.cfi);editMark(m)},'Subrayado','li');const sw=el('span','sw');sw.style.background=HL[m.color]||HL.amarillo;x.append(sw,document.createTextNode(m.text.slice(0,140)));if(m.note){const s=el('small','','📝 '+m.note);x.append(s)}body.append(x)})}
      if(t==='find'){const i=el('input');i.type='search';i.placeholder='Buscar en el libro…';const list=el('div');i.onkeydown=e=>{if(e.key==='Enter'&&i.value.trim().length>1)searchBook(i.value.trim(),list)};const go=btn('Buscar',()=>{if(i.value.trim().length>1)searchBook(i.value.trim(),list)});go.style.marginTop='8px';body.append(i,go,list);setTimeout(()=>i.focus(),50)}};
    names.forEach(([t,n])=>tabs.append(btn(n,()=>show(t))));b.append(tabs,body);show(tab||'toc');
  });
  let tocItems=[];
  const nq=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const wq=async p=>{const r=await fetch('https://es.wikiquote.org/w/api.php?'+new URLSearchParams(Object.assign({format:'json',origin:'*'},p)),{signal:AbortSignal.timeout(12000)});return r.json()};
  const cleanQ=s=>s.replace(/<ref[^>]*>.*?<\/ref>/g,'').replace(/<[^>]+>/g,'').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g,'$1').replace(/\{\{[^}]*\}\}/g,'').replace(/'{2,}/g,'').replace(/\s+/g,' ').trim();
  async function findQuotes(){
    const ti=String(o.title||entry().title||'').split(/[:(]/)[0].trim(),au=String(o.author||entry().author||'').split(/[;(]/)[0].trim();
    const au2=au.includes(',')?au.split(',').slice(1).join(' ').trim()+' '+au.split(',')[0].trim():au;
    const tries=[[ti,'book'],[au2,'author']].filter(x=>x[0]);
    for(const [q,kind] of tries){
      const s=await wq({action:'query',list:'search',srsearch:q,srlimit:4});const hits=(s.query&&s.query.search)||[];
      const w=nq(q).split(' ').filter(x=>x.length>2);
      const hit=hits.find(h=>{const t=nq(h.title);return w.length&&w.filter(x=>t.includes(x)).length>=Math.min(2,w.length)});
      if(!hit)continue;
      const d=await wq({action:'parse',page:hit.title,prop:'wikitext'});const wt=(d.parse&&d.parse.wikitext&&d.parse.wikitext['*'])||'';
      const out=[];wt.split('\n').forEach(l=>{const m=/^\*(?![*:#])\s*(.+)$/.exec(l);if(!m)return;const t=cleanQ(m[1]).replace(/^[«"“]|[»"”]$/g,'').trim();if(t.length>=25&&t.length<=420&&!/^(http|Wikipedia|Commons)/i.test(t)&&!/^\w+:\s*$/.test(t))out.push(t)});
      if(out.length)return {kind,page:hit.title,list:out.slice(0,40)};
    }
    return null;
  }
  async function loadQuotes(box){
    const ck='kr_q_'+id;let r=store.get(ck,null);
    if(!r){box.append(el('p','','Buscando frases…'));try{r=await findQuotes();if(r)store.set(ck,r)}catch(e){box.textContent='';box.append(el('p','','No pude consultar Wikiquote ahora. Probá de nuevo con conexión.'));return}}
    box.textContent='';
    if(!r){box.append(el('p','','No encontré frases publicadas de este libro ni de su autor.'));return}
    box.append(el('p','note',r.kind==='book'?'De la página “'+r.page+'”.':'No hay página del libro; estas son frases de “'+r.page+'”.'));
    r.list.forEach(q=>{const w=el('div','kr-q');w.append(el('p','',q));const a=el('div','row');a.append(btn('Copiar',()=>{try{navigator.clipboard.writeText('“'+q+'”');say('Copiado','ok')}catch(e){}},'Copiar frase','ghost'),btn('Imagen',()=>quoteCard(q,title,o.author||entry().author||''),'Compartir como imagen','ghost'));w.append(a);box.append(w)});
  }
  const exportMarks=async dl=>{const ti=(o.title||entry().title||'Libro'),au=(o.author||entry().author||'');
    const md='# '+ti+(au?'\n_'+au+'_':'')+'\n\nMis subrayados en Kinderly\n\n'+marks.slice().sort((a,c)=>a.t-c.t).map(m=>'> '+m.text.replace(/\s+/g,' ').trim()+(m.note?'\n\nNota: '+m.note:'')).join('\n\n---\n\n')+'\n';
    if(dl){const u=URL.createObjectURL(new Blob([md],{type:'text/markdown'})),a=document.createElement('a');a.href=u;a.download=(ti.replace(/[^\wáéíóúñü ]+/gi,'').trim().slice(0,50)||'subrayados')+' - subrayados.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);say('Descargado','ok');return}
    try{if(navigator.share){await navigator.share({title:ti,text:md});return}}catch(e){if(e&&e.name==='AbortError')return}
    try{await navigator.clipboard.writeText(md);say('Subrayados copiados','ok')}catch(e){say('No pude copiar; probá con Descargar','err')}};

  // ----- apariencia -----
  const looks=()=>panel('Apariencia',b=>{
    const sec=(label,node)=>{const w=el('section','ap-s');w.append(el('div','ap-l',label),node);b.append(w);return w};
    // tamaño: stepper
    const pct=el('span','ap-pct',prefs().size+'%');
    const stp=(t,d,lab)=>btn(t,()=>{const v=Math.max(80,Math.min(220,prefs().size+d));setPref('size',v);pct.textContent=v+'%';style()},lab,'ap-st');
    const sz=el('div','ap-size');sz.append(stp('A−',-10,'Texto más chico'),pct,stp('A+',10,'Texto más grande'));
    sec('Tamaño del texto',sz);
    // fuentes: carrusel con vista previa
    const fr=el('div','ap-fonts');const fb={};
    Object.keys(FONTS).forEach(k=>{const x=btn('',()=>{setPref('font',k);style();Object.keys(fb).forEach(j=>fb[j].classList.toggle('sel',j===k))},FONTS[k].name,'ap-f');const g=el('span','ap-fa','Aa');g.style.fontFamily=FONTS[k].css;x.append(g,el('span','ap-fn',FONTS[k].name));x.classList.toggle('sel',prefs().font===k);fb[k]=x;fr.append(x)});
    sec('Fuente',fr);
    // tema: círculos de color
    const tr=el('div','ap-themes');const tb={};
    Object.keys(THEMES).forEach(k=>{const T=THEMES[k];const x=btn('',()=>{setPref('theme',k);restyle();Object.keys(tb).forEach(j=>tb[j].classList.toggle('sel',j===k))},T.name,'ap-t');const c=el('span','ap-tc','Aa');if(k==='auto'){c.style.background='linear-gradient(135deg,#F7F6F1 50%,#12151C 50%)';c.style.color='#7d8590'}else{c.style.background=T.bg;c.style.color=T.fg}x.append(c,el('span','ap-tn',T.name));x.classList.toggle('sel',prefs().theme===k);tb[k]=x;tr.append(x)});
    sec('Tema',tr);
    const sl=(label,key,max)=>{const w=el('div','ap-sl');const i=el('input');i.type='range';i.min=0;i.max=max;i.value=prefs()[key]||0;i.setAttribute('aria-label',label);i.oninput=()=>{setPref(key,+i.value);comfort()};w.append(el('span','',key==='dim'?'☀':'🔥'),i,el('span','',key==='dim'?'☾':'🌙'));return w};
    const cf=el('div');cf.append(sl('Atenuar pantalla','dim',70),sl('Luz cálida','warm',100));sec('Brillo y luz cálida',cf);
    // segmentados
    const seg=(label,opts,get,set)=>{const r=el('div','ap-seg');const bs=[];opts.forEach(([txt,val])=>{const x=btn(txt,()=>{set(val);bs.forEach(y=>y[1].classList.toggle('sel',y[0]===val))});bs.push([val,x]);x.classList.toggle('sel',get()===val);r.append(x)});sec(label,r)};
    seg('Modo de lectura',[['Páginas','paginated'],['Scroll','scrolled']],()=>prefs().mode||'paginated',v=>{setPref('mode',v);if(remount)remount()});
    seg('Interlineado',[['Compacto',1.35],['Normal',1.6],['Amplio',1.9]],()=>prefs().lh,v=>{setPref('lh',v);style()});
    seg('Alineación',[['Izquierda',false],['Justificado',true]],()=>!!prefs().just,v=>{setPref('just',v);style()});
    seg('Márgenes',[['Chicos',6],['Medios',18],['Grandes',34]],()=>prefs().margin,v=>{setPref('margin',v);style()});
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
        const text=ch.text.slice(0,30000);
        const r=await askAI('Sos un asistente de lectura. Resumí en español rioplatense, en 120 a 180 palabras, este capítulo del libro «'+title+'»'+(o.author?' de '+o.author:'')+(ch.label?' (capítulo: '+ch.label+')':'')+'. Contá solo lo que ocurre en el texto, sin inventar ni adelantar lo que sigue. Texto del capítulo:\n\n'+text,(i,t)=>{out.textContent='Resumiendo con tu IA… '+(i>1?'(intento '+i+' de '+t+')':'')});
        cache[ch.key]=r;store.set(key,cache);out.textContent=r;
      }catch(e){out.textContent='No se pudo resumir: '+(e&&e.message||'error')}
    };
    acts.append(btn('Volver a generar',()=>run(true)),btn('Copiar',()=>{try{navigator.clipboard.writeText(out.textContent);say('Copiado','ok')}catch(e){}}),btn('Clave de IA',()=>{b.textContent='';const f=el('div');aiForm(f,()=>aiPanel());b.append(f)}));
    b.append(out,acts,el('p','note','Resume el capítulo en el que estás. El texto se envía a tu proveedor de IA y se usa tu cuota o saldo.'));
    run(false);
  });

  // ----- audiolectura -----
  const MUS=[['Piano suave','🎹','37i9dQZF1DX4sWSpwq3LiO'],['Concentración','🎯','37i9dQZF1DWZeKCadgRdKQ'],['Lo-fi','☕','37i9dQZF1DWWQRwui0ExPn'],['Clásica','🎻','37i9dQZF1DWWEJlAGA9gs0'],['Ambiente','🌫️','37i9dQZF1DX3Ogo9pFvBkY'],['Jazz','🎷','37i9dQZF1DX0SM0LYsmbMT']];
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
  const musHost=el('div','kr-mus');root.append(musHost);
  const musOn=()=>!!musHost.firstChild&&!musHost.classList.contains('off');
  const setMus=(kind,id,name)=>{musHost.textContent='';const f=document.createElement('iframe');f.src='https://open.spotify.com/embed/'+kind+'/'+id+'?utm_source=generator&theme=0';f.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';f.loading='lazy';f.title='Spotify: '+name;f.style.cssText='width:100%;height:100%;border:0;border-radius:14px';musHost.append(f);musHost.classList.add('on');musHost.classList.remove('off');store.set('kr_mus',{k:kind,i:id,n:name});audioPanel()};
  const audioPanel=()=>panel('🎧 Audio y música',b=>{
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
    // música de Spotify mientras leés
    const mh=el('div','kr-mh');mh.append(el('b','','Música para leer · Spotify'));b.append(mh);
    const mrow=el('div','ap-fonts');MUS.forEach(([n,e,id])=>{const x=btn('',()=>{setMus('playlist',id,n)},n,'ap-f');x.append(el('span','ap-fa',e),el('span','ap-fn',n));mrow.append(x)});b.append(mrow);
    const lk=el('input');lk.type='text';lk.placeholder='…o pegá un enlace de Spotify (playlist, álbum, canción)';lk.style.cssText='margin:8px 0';lk.onchange=()=>{const m=/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|episode|show|artist)\/([A-Za-z0-9]+)/.exec(lk.value);if(!m){say('Ese no parece un enlace de Spotify','err');return}setMus(m[1],m[2],'Spotify');lk.value=''};b.append(lk);
    const mc=el('div','row');mc.append(btn(musOn()?'Ocultar reproductor':'Mostrar reproductor',()=>{musHost.classList.toggle('off');audioPanel()},'Mostrar u ocultar'),btn('Quitar música',()=>{musHost.textContent='';musHost.classList.remove('on');store.del('kr_mus');say('Música quitada','ok');audioPanel()},'Quitar música','ghost'));if(musHost.firstChild)b.append(mc);
    b.append(el('p','note','Spotify se reproduce dentro de la app. Si tenés sesión iniciada de Spotify en este navegador suena completo; si no, son fragmentos de 30 segundos. Kinderly no accede a tu cuenta.'));
  });

  // ----- armado de la interfaz -----
  top.append(btn('✕',()=>close(),'Cerrar'),ttl,btn('🎧',audioPanel,'Audiolectura'),btn('✨',aiPanel,'Resumen con IA'),btn('ⓘ',()=>panel('Sobre el autor',b=>{const w=el('div');b.append(w);if(window.KEx)window.KEx.bioView(w,o.author||entry().author||'');else w.textContent='No disponible'}),'Sobre el autor'),btn('☰',()=>contents('toc'),'Contenido'),btn('Aa',looks,'Apariencia'));
  const brPop=el('div','kr-br');
  const brRow=(ic,key,max,lab)=>{const r=el('div','ap-sl');const i=el('input');i.type='range';i.min=0;i.max=max;i.value=prefs()[key]||0;i.setAttribute('aria-label',lab);i.oninput=()=>{setPref(key,+i.value);comfort()};r.append(el('span','',ic),i);return r};
  brPop.append(brRow('🌙','dim',70,'Atenuar pantalla'),brRow('🔥','warm',100,'Luz cálida'));
  const brBtn=btn('☀',()=>{brPop.classList.toggle('on');brBtn.classList.toggle('sel',brPop.classList.contains('on'))},'Brillo');
  root.addEventListener('pointerdown',e=>{if(brPop.classList.contains('on')&&!brPop.contains(e.target)&&e.target!==brBtn){brPop.classList.remove('on');brBtn.classList.remove('sel')}},true);
  bot.append(btn('‹',()=>rend&&rend.prev(),'Página anterior'),prog,btn('›',()=>rend&&rend.next(),'Página siguiente'),brBtn);root.append(brPop);
  // barra de selección
  const selBtns=()=>{selbar.textContent='';
    Object.keys(HL).forEach(c=>{const x=btn('',()=>{if(!curSel)return;const q0=curSel.text;addMark(curSel.cfi,curSel.text,c);try{curSel.contents.window.getSelection().removeAllRanges()}catch(e){}hideSel();if(q0.trim().length>=20&&store.get('kr_qs_off',false)!==true)setTimeout(()=>quoteCard(q0,title,o.author||entry().author||''),250)},'Subrayar '+c,'dot');x.style.background=HL[c];selbar.append(x)});
    selbar.append(btn('Nota',()=>{if(!curSel)return;const m=addMark(curSel.cfi,curSel.text,'amarillo');hideSel();editMark(m)}),btn('Definir',()=>{if(!curSel)return;const w=curSel.text,cx=curSel.ctx;hideSel();define(w,cx)}),btn('Copiar',()=>{if(curSel){try{navigator.clipboard.writeText(curSel.text);say('Copiado','ok')}catch(e){}}hideSel()}),btn('Imagen',()=>{if(!curSel)return;const q=curSel.text;hideSel();quoteCard(q,title,o.author||entry().author||'')},'Compartir como imagen'),btn('✕',hideSel,'Cancelar'));};
  selBtns();
  root.append(top,view,bot,selbar,pnl,foot);view.append(msg);root.append(warmEl,dimEl);comfort();document.body.append(root);document.body.style.overflow='hidden';cur=root;
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
      rend.hooks.content.register(c=>{try{const d=c.document;
        // seleccionar solo manteniendo apretado (un toque suelto ya no marca palabras)
        fixOrphans(d);const ss=d.createElement('style');ss.textContent='body{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}body.kr-sel,body.kr-sel *{-webkit-user-select:text!important;user-select:text!important}';d.head.append(ss);
        let tm=null,sx=0,sy=0,lastT=0;const cancel=()=>{if(tm){clearTimeout(tm);tm=null}};
        d.addEventListener('touchstart',e=>{lastT=Date.now();const t=e.touches[0];if(!t||e.touches.length>1){cancel();return}sx=t.clientX;sy=t.clientY;cancel();
          tm=setTimeout(()=>{tm=null;try{d.body.classList.add('kr-sel');let rg=null;if(d.caretRangeFromPoint)rg=d.caretRangeFromPoint(sx,sy);else if(d.caretPositionFromPoint){const p=d.caretPositionFromPoint(sx,sy);if(p){rg=d.createRange();rg.setStart(p.offsetNode,p.offset);rg.collapse(true)}}
            if(rg){const s=d.getSelection();s.removeAllRanges();s.addRange(rg);if(s.modify){s.modify('move','backward','word');s.modify('extend','forward','word')}}}catch(e){}},550)},{passive:true});
        d.addEventListener('touchmove',e=>{const t=e.touches[0];if(t&&(Math.abs(t.clientX-sx)>8||Math.abs(t.clientY-sy)>8))cancel()},{passive:true});
        d.addEventListener('touchend',()=>{lastT=Date.now();cancel()});d.addEventListener('touchcancel',cancel);
        d.addEventListener('mousedown',()=>{if(Date.now()-lastT>900)d.body.classList.add('kr-sel')});
        d.addEventListener('selectionchange',()=>{try{const s=d.getSelection();if(!s||s.isCollapsed)d.body.classList.remove('kr-sel')}catch(e){}});
        const l=d.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600&family=Lora:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Crimson+Pro:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Bitter:ital,wght@0,400;0,700;1,400&family=Nunito:ital,wght@0,400;0,700;1,400&family=Lexend:wght@400;600&display=swap';d.head.append(l)}catch(e){}});
      style();
      await rend.display(cfi||undefined);
    rend.on('relocated',loc=>{lastCfi=loc.start.cfi;if(book.locations&&book.locations.length()){pct=book.locations.percentageFromCfi(lastCfi)||0;range.value=Math.round(pct*1000);upd()}hideSel();save()});
    rend.on('click',e=>{if(selbar.classList.contains('on')){return}const w=(e.view||window).innerWidth||innerWidth,x=e.clientX%w;closePanel();if(!sc&&x<w*0.28)rend.prev();else if(!sc&&x>w*0.72)rend.next();else root.classList.toggle('hide')});
    let sx=0;rend.on('touchstart',e=>{sx=e.changedTouches[0].screenX});rend.on('touchend',e=>{const dx=e.changedTouches[0].screenX-sx;if(!sc&&Math.abs(dx)>60){dx<0?rend.next():rend.prev()}});
    rend.on('keyup',e=>{if(e.key==='ArrowRight')rend.next();if(e.key==='ArrowLeft')rend.prev()});
    rend.on('selected',(cfi,contents)=>{
      try{const r=rend.getRange(cfi),text=(r?r.toString():'').replace(/\s+/g,' ').trim();if(text.length<2)return;
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
    book.ready.then(()=>book.locations.generate(CPL)).then(()=>{if(closed)return;buildCh();range.disabled=false;if(lastCfi){pct=book.locations.percentageFromCfi(lastCfi)||0;range.value=Math.round(pct*1000);upd();save()}}).catch(()=>{});
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
    const r=el('div','lib-item'),d=el('div');d.append(el('b','',window.kTitle?window.kTitle(x.title):x.title),el('small','',(x.author?x.author+' · ':'')+Math.round((x.pct||0)*100)+'% · '+(x.local?'archivo propio · ':'')+fmtDate(x.t)));
    const bar=el('div','lib-bar'),i=el('i');i.style.width=Math.round((x.pct||0)*100)+'%';bar.append(i);d.append(bar);
    const open1=btn('Leer',()=>open({id:x.id,url:x.url,title:x.title,author:x.author,cached:true,local:x.local}));
    const rv=btn('Reseñas',()=>{if(window.KRev)window.KRev.open({title:x.title,author:x.author})},'Reseñas del libro','ghost');
    const del=btn('Quitar',async()=>{if(!confirm('¿Quitar “'+x.title+'” de tu biblioteca? Se borran también tus subrayados.'))return;saveLib(lib().filter(y=>y.id!==x.id));store.del(hlKey(x.id));store.del(bmKey(x.id));store.del('kr_sum_'+x.id);await dbDel(x.id);renderLib();cont()},'Quitar','ghost');
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
  const d=el('div');d.append(el('small','','Seguí leyendo'),el('b','',window.kTitle?window.kTitle(l.title):l.title),el('small','',Math.round((l.pct||0)*100)+'% leído'));
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
