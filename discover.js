// Kinderly · pestaña Descubrir: ideas para empezar, sin saber qué buscar. Solo fuentes legales.
(()=>{
const $=id=>document.getElementById(id);
const host=document.querySelector('.view[data-view="descubrir"]');if(!host)return;
const MOODS=[['😄','Quiero reír','humor'],['💗','Quiero emocionarme','love'],['🧭','Quiero aventura','adventure'],['🔎','Quiero intriga','detective'],['🤔','Quiero pensar','philosophy'],['🌙','Quiero soñar','fantasy'],['👻','Quiero un susto','horror'],['⏱️','Tengo poco tiempo','short stories'],['📜','Quiero historia','history'],['🎭','Quiero teatro','drama'],['🪶','Quiero poesía','poetry'],['🧒','Para chicos','children']];
const AUTHORS=['Miguel de Cervantes','Benito Pérez Galdós','Gustavo Adolfo Bécquer','Rosalía de Castro','Emilia Pardo Bazán','Rubén Darío','Lope de Vega','Francisco de Quevedo','Leopoldo Alas','José Hernández','Jorge Isaacs','Ricardo Palma','Horacio Quiroga','Juan Valera'];
host.textContent='';
const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
host.append(mk('h2','vt','Descubrir'),mk('p','vs','Elegí cómo te sentís o un autor clásico, y te mostramos libros con EPUB gratuito y legal.'));
const st=document.createElement('style');
st.textContent='.dz-h{font:600 1.05rem var(--serif);margin:20px 0 8px}.dz-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.dz-g button{display:flex;align-items:center;gap:8px;justify-content:flex-start;text-align:left;white-space:normal;line-height:1.2;padding:12px;background:var(--card);color:var(--ink);border:1px solid var(--line);box-shadow:var(--sh)}.dz-g button.on{border-color:var(--green);background:var(--soft)}.dz-g .e{font-size:1.3rem}.dz-a{display:flex;flex-wrap:wrap;gap:8px}.dz-a button{padding:8px 13px;font-size:.82rem;font-weight:500;background:var(--card);color:var(--ink);border:1px solid var(--line)}#dz-res:empty{display:none}.dz-n{color:var(--mute);font-size:.9rem;padding:14px 4px}';
document.head.append(st);

host.append(mk('h3','dz-h','¿Qué tenés ganas de leer?'));
const mg=mk('div','dz-g');host.append(mg);
const res=mk('div');res.id='dz-res';
const title=mk('h3','dz-h','');title.id='dz-title';title.style.display='none';
host.append(title,res);
host.append(mk('h3','dz-h','Autores para conocer'));
const ag=mk('div','dz-a');host.append(ag);
host.append(mk('p','hint2','Tocá un autor para buscar sus obras en la pestaña Buscar.'));

const j=async u=>{const r=await fetch(u,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()};
const nf=new Intl.NumberFormat('es-AR');
function gutBook(b){
  const author=(b.authors||[]).map(a=>a.name).join('; '),n=nf.format(b.download_count||0);
  return {title:b.title,author,language:'es',img:b.formats['image/jpeg']||'',opts:[{src:'Project Gutenberg',label:'Project Gutenberg · '+n+' descargas',sendable:true,url:async()=>b.formats['application/epub+zip'],inf:async()=>({author,desc:(b.summaries||[])[0]||'',edition:'Project Gutenberg, dominio público'})}]};
}
let busy=false;
async function show(label,query,btn,sc){
  if(busy)return;busy=true;
  mg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===btn));
  title.style.display='block';title.textContent=label;res.textContent='';
  const w=mk('div','dz-n','Buscando libros…');res.append(w);
  try{
    const d=await j('https://gutendex.com/books/?languages=es&sort=popular&'+query);
    const l=(d.results||[]).filter(b=>b.languages&&b.languages.includes('es')&&b.formats&&b.formats['application/epub+zip']).slice(0,12);
    res.textContent='';
    if(!l.length){res.append(mk('div','dz-n','No encontramos libros con ese ánimo en español. Probá con otro o buscá por título.'));return}
    l.forEach(b=>window.card(gutBook(b),'dz-res'));
  }catch(e){res.textContent='';res.append(mk('div','dz-n','No se pudo cargar la lista. Probá de nuevo en un momento.'))}
  finally{busy=false}
  if(sc)title.scrollIntoView({behavior:'smooth',block:'start'});
}
MOODS.forEach(([e,t,q])=>{const b=mk('button','');b.type='button';b.append(mk('span','e',e),mk('span','',t));b.onclick=()=>show(t,'topic='+encodeURIComponent(q),b,true);mg.append(b)});
const pb=mk('button','');pb.type='button';pb.append(mk('span','e','⭐'),mk('span','','Los más leídos'));pb.onclick=()=>show('Los más leídos en español','',pb,true);mg.prepend(pb);
AUTHORS.forEach(a=>{const b=mk('button','',a);b.type='button';b.onclick=()=>{window.showView('buscar');$('q').value=a;$('go').click()};ag.append(b)});
// primera vez: mostramos los más leídos
let first=false;const tab=document.querySelector('nav.tabs button[data-go="descubrir"]');
const init=()=>{if(first)return;first=true;show('Los más leídos en español','',pb)};
if(tab)tab.addEventListener('click',init);
if((location.hash||'')==='#descubrir')init();
})();
