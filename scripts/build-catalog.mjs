// Genera catalog/<id>.json con libros en español de Project Gutenberg (vía Gutendex) por ánimo.
// Corre en GitHub Actions (el navegador del teléfono lo lee ya armado: carga instantánea).
import {writeFile,mkdir} from 'node:fs/promises';
const BAD=/dictionar|grammar|textbook|catalog|bibliograph|cookery|cookbook|almanac|periodical|manual of|instruction/i;
const MOODS=[ // mismo criterio que discover.js
['reir',['humor','satire','comedy'],/humor|satir|comed|wit|picaresque|burlesque|farce/i],
['emocion',['love','romance','tragedy'],/love|romance|tragedy|passion|courtship|marriage/i],
['aventura',['adventure','voyages','travel'],/adventure|voyage|travel|pirate|explor|sea stories|frontier/i],
['intriga',['detective','mystery','crime'],/detective|mystery|crime|murder|spy|suspense/i],
['pensar',['philosophy','essays','ethics'],/philosoph|essay|ethic|thought|reason|moral/i],
['sonar',['fantasy','fairy tales','legends'],/fantasy|fairy|legend|myth|magic|dream|folklore/i],
['susto',['horror','ghost','gothic'],/horror|ghost|gothic|supernatural|vampire|haunt|terror/i],
['breve',['short stories','tales'],/short stor|tales|stories|novella/i],
['historia',['history','biography','chronicles'],/histor|biograph|chronicle|conquest/i],
['teatro',['drama','plays','comedies'],/drama|play|theat|comed|tragedies/i],
['poesia',['poetry','poems','verse'],/poet|poem|verse|ballad|sonnet/i],
['chicos',['children','juvenile','fairy tales'],/child|juvenile|fairy|young/i],
['top',[''],null]
];
const PAGES=3,MAX=72,BUDGET=12*60*1000,T0=Date.now();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url){
  for(let i=0;i<3;i++){
    if(Date.now()-T0>BUDGET)return null;
    try{const r=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'user-agent':'kinderly-catalog/1'}});if(r.ok)return await r.json();console.warn('HTTP',r.status,url)}catch(e){console.warn('err',e.message,url)}
    await sleep(1500*(i+1));
  }
  return null;
}
const ok=(b,re)=>{
  if(!(b.languages&&b.languages.includes('es')&&b.formats&&b.formats['application/epub+zip']))return false;
  const txt=[].concat(b.subjects||[],b.bookshelves||[],b.title||'').join(' | ');
  return !BAD.test(txt)&&(!re||re.test(txt));
};
await mkdir('catalog',{recursive:true});
let total=0;
// todas las categorías a la vez (Gutendex es lento, pero tolera pedidos en paralelo)
await Promise.all(MOODS.map(async ([id,topics,re])=>{
  const seen=new Map();
  const urls=[];topics.forEach(t=>{for(let p=1;p<=PAGES;p++)urls.push('https://gutendex.com/books/?languages=es&sort=popular&page='+p+(t?'&topic='+encodeURIComponent(t):''))});
  const res=await Promise.all(urls.map(get));
  res.forEach(d=>{if(!d)return;(d.results||[]).forEach(b=>{if(!seen.has(b.id)&&ok(b,re))seen.set(b.id,{i:b.id,t:b.title.replace(/\s*:?\s*\$[a-z]\s+/gi,': ').replace(/\s*\$[a-z]\s*$/i,'').trim(),a:(b.authors||[]).map(x=>x.name).join('; '),c:b.formats['image/jpeg']||'',e:b.formats['application/epub+zip'],d:b.download_count||0,s:((b.summaries||[])[0]||'').slice(0,600)})})});
  const list=[...seen.values()].sort((x,y)=>y.d-x.d).slice(0,MAX);
  if(list.length){await writeFile('catalog/'+id+'.json',JSON.stringify(list));total+=list.length}
  console.log(id,list.length);
}));
await writeFile('catalog/index.json',JSON.stringify({updated:new Date().toISOString(),total}));
