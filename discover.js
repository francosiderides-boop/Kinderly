// Kinderly · pestaña Descubrir: ideas para empezar, sin saber qué buscar. Solo fuentes legales.
(()=>{
const $=id=>document.getElementById(id);
const host=document.querySelector('.view[data-view="descubrir"]');if(!host)return;
const BAD=/dictionar|grammar|textbook|catalog|bibliograph|cookery|cookbook|almanac|periodical|manual of|instruction/i;
const MOODS=[
['Quiero reír',['humor','satire','comedy'],/humor|satir|comed|wit|picaresque|burlesque|farce/i],
['Quiero emocionarme',['love','romance','tragedy'],/love|romance|tragedy|passion|courtship|marriage/i],
['Quiero aventura',['adventure','voyages','travel'],/adventure|voyage|travel|pirate|explor|sea stories|frontier/i],
['Quiero intriga',['detective','mystery','crime'],/detective|mystery|crime|murder|spy|suspense/i],
['Quiero pensar',['philosophy','essays','ethics'],/philosoph|essay|ethic|thought|reason|moral/i],
['Quiero soñar',['fantasy','fairy tales','legends'],/fantasy|fairy|legend|myth|magic|dream|folklore/i],
['Quiero un susto',['horror','ghost','gothic'],/horror|ghost|gothic|supernatural|vampire|haunt|terror/i],
['Tengo poco tiempo',['short stories','tales'],/short stor|tales|stories|novella/i],
['Quiero historia',['history','biography','chronicles'],/histor|biograph|chronicle|conquest/i],
['Quiero teatro',['drama','plays','comedies'],/drama|play|theat|comed|tragedies/i],
['Quiero poesía',['poetry','poems','verse'],/poet|poem|verse|ballad|sonnet/i],
['Para chicos',['children','juvenile','fairy tales'],/child|juvenile|fairy|young/i]
];
const KW={'humor':'humor','love':'amor','adventure':'aventuras','detective':'misterio','philosophy':'filosofía','fantasy':'fantasía','horror':'terror','short stories':'cuentos','history':'historia','drama':'teatro','poetry':'poesía','children':'infantil'};
const AUTHORS=['Miguel de Cervantes','Benito Pérez Galdós','Gustavo Adolfo Bécquer','Rosalía de Castro','Emilia Pardo Bazán','Rubén Darío','Lope de Vega','Francisco de Quevedo','Leopoldo Alas','José Hernández','Jorge Isaacs','Ricardo Palma','Horacio Quiroga','Juan Valera'];
host.textContent='';
const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
host.append(mk('h2','vt','Descubrir'),mk('p','vs','Elegí cómo te sentís o un autor clásico, y te mostramos libros con EPUB gratuito y legal.'));
const st=document.createElement('style');
st.textContent='.dz-h{font:600 1.05rem var(--serif);margin:20px 0 8px}.dz-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dz-g button{display:flex;align-items:center;gap:8px;justify-content:space-between;text-align:left;white-space:normal;line-height:1.2;min-height:56px;padding:12px 14px;font:500 1rem var(--serif);background:var(--card);color:var(--ink);border:1px solid var(--line);box-shadow:var(--sh)}.dz-g button::after{content:"›";color:var(--mute);font:400 1.3rem/1 var(--sans)}.dz-g button:first-child{grid-column:1/-1;border-color:var(--green)}.dz-g button.on{border-color:var(--green);background:var(--soft)}.dz-g .e{font-size:1.3rem}.dz-a{display:flex;flex-wrap:wrap;gap:8px}.dz-a button{padding:8px 13px;font-size:.82rem;font-weight:500;background:var(--card);color:var(--ink);border:1px solid var(--line)}#dz-res:empty{display:none}.dz-n{color:var(--mute);font-size:.9rem;padding:14px 4px}.dz-sk{height:118px;border-radius:18px;background:var(--soft);margin-bottom:12px;animation:dzp 1.3s ease-in-out infinite}.dz-sk:nth-child(2){animation-delay:.15s}.dz-sk:nth-child(3){animation-delay:.3s}@keyframes dzp{50%{opacity:.45}}';
document.head.append(st);

host.append(mk('h3','dz-h','¿Qué tenés ganas de leer?'));
const mg=mk('div','dz-g');host.append(mg);
const res=mk('div');res.id='dz-res';
const title=mk('h3','dz-h','');title.id='dz-title';title.style.display='none';
host.append(title,res);
host.append(mk('h3','dz-h','Autores para conocer'));
const ag=mk('div','dz-a');host.append(ag);
host.append(mk('p','hint2','Tocá un autor para buscar sus obras en la pestaña Buscar.'));

const nf=new Intl.NumberFormat('es-AR');
function gutBook(b){
  const author=(b.authors||[]).map(a=>a.name).join('; '),n=nf.format(b.download_count||0);
  return {title:b.title,author,language:'es',img:b.formats['image/jpeg']||'',opts:[{src:'Project Gutenberg',label:'Project Gutenberg · '+n+' descargas',sendable:true,url:async()=>b.formats['application/epub+zip'],inf:async()=>({author,desc:(b.summaries||[])[0]||'',edition:'Project Gutenberg, dominio público'})}]};
}
async function iaFallback(query){
  const m=/topic=([^&]*)/.exec(query),k=m?(KW[decodeURIComponent(m[1])]||''):'';
  const p=new URLSearchParams({q:'mediatype:texts AND format:EPUB AND language:spa AND -collection:inlibrary AND -access-restricted-item:true'+(k?' AND ('+k+')':''),rows:24,output:'json'});
  ['identifier','title','creator','licenseurl','rights','date','language','downloads'].forEach(f=>p.append('fl[]',f));p.append('sort[]','downloads desc');
  const ia=await j('https://archive.org/advancedsearch.php?'+p);
  return (ia.response?.docs||[]).filter(x=>isSpanish(x.language)&&hasOpenLicense(x.licenseurl||x.rights)).slice(0,10).map(b=>{const count=nf.format(b.downloads||0),author=[].concat(b.creator||[])[0]||'';return {title:b.title,author,language:b.language,img:'https://archive.org/services/img/'+b.identifier,opts:[{src:'Internet Archive',label:'Internet Archive · '+count+' descargas',sendable:true,url:()=>iaEpub(b.identifier),page:'https://archive.org/details/'+encodeURIComponent(b.identifier),inf:()=>iaInfo(b.identifier)}]}});
}
let cur=null,run=0,loadingMore=false;
const ok=(b,re)=>{
  if(!(b.languages&&b.languages.includes('es')&&b.formats&&b.formats['application/epub+zip']))return false;
  const txt=[].concat(b.subjects||[],b.bookshelves||[],b.title||'').join(' | ');
  if(BAD.test(txt))return false;
  return re?re.test(txt):true;
};
const urlFor=x=>'https://gutendex.com/books/?languages=es&sort=popular&page='+x.p+(x.topic?'&topic='+encodeURIComponent(x.topic):'');
// pide todos los temas de la categoría a la vez, hasta 3 rondas, y entrega cada tanda apenas llega
async function more(c,n,emit,myRun){
  let got=0,rounds=0,fails=0,tries=0;
  while(got<n&&rounds<3&&c.t.some(x=>!x.done)){
    rounds++;
    const act=c.t.filter(x=>!x.done);
    const rs=await Promise.allSettled(act.map(x=>j(urlFor(x))));
    if(myRun!==run)return got;
    const found=[];
    rs.forEach((r,i)=>{const x=act[i];tries++;
      if(r.status!=='fulfilled'){fails++;x.done=true;return}
      (r.value.results||[]).forEach(b=>{if(!c.seen.has(b.id)&&ok(b,c.re)){c.seen.add(b.id);found.push(b)}});
      if(r.value.next)x.p++;else x.done=true});
    found.sort((a,b)=>(b.download_count||0)-(a.download_count||0));
    if(found.length){got+=found.length;emit(found.map(gutBook))}
  }
  if(!got&&tries&&fails===tries)throw new Error('sin conexión con el catálogo');
  return got;
}
const moreBtn=mk('button','ghost','Ver más libros');moreBtn.type='button';moreBtn.id='dz-more';moreBtn.style.cssText='display:none;width:100%;margin-top:14px';
const endNote=mk('div','dz-n','');endNote.style.display='none';
res.after(endNote,moreBtn);
const skel=()=>{const w=mk('div','');w.id='dz-sk';for(let i=0;i<3;i++)w.append(mk('div','dz-sk',''));return w};
function refreshMore(){
  const left=cur&&cur.t.some(x=>!x.done);
  moreBtn.style.display=left?'block':'none';
  endNote.style.display=left||!cur||!res.children.length?'none':'block';
  endNote.textContent='Eso es todo por ahora en esta categoría. Probá otra o buscá por título.';
}
async function show(label,topics,re,btn,sc){
  const my=++run;                       // un toque nuevo cancela el anterior (no hay que esperar)
  mg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===btn));
  title.style.display='block';title.textContent=label;res.textContent='';moreBtn.style.display='none';endNote.style.display='none';
  res.append(skel());
  if(sc)title.scrollIntoView({behavior:'smooth',block:'start'});
  cur={t:topics.map(t=>({topic:t,p:1,done:false})),re,seen:new Set()};
  const c=cur;let first=true;
  const emit=l=>{if(my!==run)return;if(first){res.textContent='';first=false}l.forEach(b=>window.card(b,'dz-res'))};
  let n=0;
  try{n=await more(c,12,emit,my)}catch(e){n=0}
  if(my!==run)return;
  if(n<4&&!c.t.some(x=>x.p>1)){try{const l=await iaFallback('topic='+encodeURIComponent(topics[0]||''));if(my===run&&l.length){emit(l);n+=l.length}}catch(e){}}
  if(my!==run)return;
  if(!n){res.textContent='';res.append(mk('div','dz-n','No pudimos cargar libros ahora. Revisá tu conexión y probá de nuevo, o elegí otra categoría.'));cur=null;return}
  refreshMore();
}
moreBtn.onclick=async()=>{
  if(loadingMore||!cur)return;loadingMore=true;moreBtn.disabled=true;moreBtn.textContent='Buscando…';const my=run;
  try{const g=await more(cur,12,l=>{if(my===run)l.forEach(b=>window.card(b,'dz-res'))},my);if(!g&&my===run)say('No encontramos más libros por ahora','ok')}
  catch(e){say('No se pudo cargar más. Probá de nuevo en un momento.','err')}
  finally{loadingMore=false;moreBtn.disabled=false;moreBtn.textContent='Ver más libros';if(my===run)refreshMore()}
};
MOODS.forEach(([t,tp,re])=>{const b=mk('button','');b.type='button';b.append(mk('span','',t));b.onclick=()=>show(t,tp,re,b,true);mg.append(b)});
const pb=mk('button','');pb.type='button';pb.append(mk('span','','Los más leídos'));pb.onclick=()=>show('Los más leídos en español',[''],null,pb,true);mg.prepend(pb);
AUTHORS.forEach(a=>{const b=mk('button','',a);b.type='button';b.onclick=()=>{window.showView('buscar');$('q').value=a;$('go').click()};ag.append(b)});
// primera vez: mostramos los más leídos
let first=false;const tab=document.querySelector('nav.tabs button[data-go="descubrir"]');
const init=()=>{if(first)return;first=true;show('Los más leídos en español',[''],null,pb)};
if(tab)tab.addEventListener('click',init);
if((location.hash||'')==='#descubrir')init();
})();
