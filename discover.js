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
st.textContent='.dz-h{font:600 1.05rem var(--serif);margin:20px 0 8px}.dz-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dz-g button{display:flex;align-items:center;gap:8px;justify-content:space-between;text-align:left;white-space:normal;line-height:1.2;min-height:56px;padding:12px 14px;font:500 1rem var(--serif);background:var(--card);color:var(--ink);border:1px solid var(--line);box-shadow:var(--sh)}.dz-g button::after{content:"›";color:var(--mute);font:400 1.3rem/1 var(--sans)}.dz-g button:first-child{grid-column:1/-1;border-color:var(--green)}.dz-g button.on{border-color:var(--green);background:var(--soft)}.dz-g .e{font-size:1.3rem}.dz-a{display:flex;flex-wrap:wrap;gap:8px}.dz-a button{padding:8px 13px;font-size:.82rem;font-weight:500;background:var(--card);color:var(--ink);border:1px solid var(--line)}#dz-res:empty{display:none}.dz-n{color:var(--mute);font-size:.9rem;padding:14px 4px}';
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
let busy=false,cur=null;
const ok=(b,re)=>{
  if(!(b.languages&&b.languages.includes('es')&&b.formats&&b.formats['application/epub+zip']))return false;
  const txt=[].concat(b.subjects||[],b.bookshelves||[],b.title||'').join(' | ');
  if(BAD.test(txt))return false;
  return re?re.test(txt):true;
};
// trae libros hasta juntar n que cumplan; sigue página a página (y tema a tema) sin repetir
async function more(c,n){
  const out=[];let pages=0;
  while(out.length<n&&c.i<c.topics.length&&pages<8){
    if(!c.url)c.url='https://gutendex.com/books/?languages=es&sort=popular'+(c.topics[c.i]?'&topic='+encodeURIComponent(c.topics[c.i]):'');
    pages++;
    const d=await j(c.url);
    (d.results||[]).forEach(b=>{if(!c.seen.has(b.id)&&ok(b,c.re)){c.seen.add(b.id);out.push(gutBook(b))}});
    if(d.next)c.url=d.next;else{c.i++;c.url=''}
  }
  return out;
}
const moreBtn=mk('button','ghost','Ver más libros');moreBtn.type='button';moreBtn.id='dz-more';moreBtn.style.cssText='display:none;width:100%;margin-top:14px';
const endNote=mk('div','dz-n','');endNote.style.display='none';
res.after(endNote,moreBtn);
async function show(label,topics,re,btn,sc){
  if(busy)return;busy=true;
  mg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===btn));
  title.style.display='block';title.textContent=label;res.textContent='';moreBtn.style.display='none';endNote.style.display='none';
  res.append(mk('div','dz-n','Buscando libros…'));
  cur={topics,re,i:0,url:'',seen:new Set()};
  try{
    let l=[];try{l=await more(cur,12)}catch(e){}
    if(l.length<4&&!cur.i){try{l=l.concat(await iaFallback('topic='+encodeURIComponent(topics[0]||'')))}catch(e){}}
    res.textContent='';
    if(!l.length){res.append(mk('div','dz-n','No encontramos libros con ese ánimo en español. Probá con otro o buscá por título.'));cur=null;return}
    l.forEach(b=>window.card(b,'dz-res'));
    refreshMore();
  }catch(e){res.textContent='';res.append(mk('div','dz-n','No se pudo cargar la lista. Probá de nuevo en un momento.'))}
  finally{busy=false}
  if(sc)title.scrollIntoView({behavior:'smooth',block:'start'});
}
function refreshMore(){
  const left=cur&&cur.i<cur.topics.length;
  moreBtn.style.display=left?'block':'none';
  endNote.style.display=left||!cur?'none':'block';
  endNote.textContent='Eso es todo por ahora en esta categoría. Probá otra o buscá por título.';
}
moreBtn.onclick=async()=>{
  if(busy||!cur)return;busy=true;moreBtn.disabled=true;moreBtn.textContent='Buscando…';
  try{const l=await more(cur,12);l.forEach(b=>window.card(b,'dz-res'));if(!l.length)say('No encontramos más libros por ahora','ok')}
  catch(e){say('No se pudo cargar más. Probá de nuevo en un momento.','err')}
  finally{busy=false;moreBtn.disabled=false;moreBtn.textContent='Ver más libros';refreshMore()}
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
