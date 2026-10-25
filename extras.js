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
function ach(host){
  const lib=get('kr_lib',[]),stt=get('kr_st',{}),days=Object.keys(stt).sort();
  const tot=days.reduce((a,k)=>a+(stt[k]||0),0);
  let best=0,run=0,prev=null;days.forEach(k=>{if((stt[k]||0)>=60){const d=new Date(k+'T12:00:00');run=prev&&Math.round((d-prev)/864e5)===1?run+1:1;prev=d;best=Math.max(best,run)}else{run=0;prev=null}});
  const done=lib.filter(b=>(b.pct||0)>=.97).length;
  let hl=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^kr_hl_/.test(k)){try{hl+=JSON.parse(localStorage.getItem(k)).length}catch(e){}}}}catch(e){}
  const lists=get('kr_lists',{toread:{},fav:{}}),nl=Object.keys(lists.toread||{}).length+Object.keys(lists.fav||{}).length;
  const B=[['📖','Primera página','Abrí tu primer libro',lib.length>=1],['🔥','Racha de 3','3 días leyendo seguido',best>=3],['🌟','Racha de 7','Una semana sin faltar',best>=7],['🏆','Racha de 30','Un mes de lectura',best>=30],
    ['⏱️','Una hora','1 hora leída en total',tot>=3600],['🕰️','Diez horas','10 horas de lectura',tot>=36000],['🏁','Libro terminado','Llegá al final de un libro',done>=1],['📚','Tres libros','Terminá 3 libros',done>=3],
    ['🖍️','Subrayador','Subrayá 5 pasajes',hl>=5],['🗂️','Coleccionista','Tené 5 libros en tu biblioteca',lib.length>=5],['🔖','Curador','Guardá 5 libros en tus listas',nl>=5]];
  const c=el('div','card ex-ach');c.style.marginTop='14px';const got=B.filter(b=>b[3]).length;
  c.append(el('b','','Logros · '+got+' de '+B.length));
  const g=el('div','ex-agrid');B.forEach(([e,n,d,ok])=>{const x=el('div','ex-ab'+(ok?' on':''));x.title=d;x.append(el('span','ex-ae',e),el('small','',n));g.append(x)});c.append(g);
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
.ex-sugs{margin:14px 0 18px}.ex-sg-t{display:block;font:600 1.02rem var(--serif);margin-bottom:10px}.ex-sg-row{display:flex;gap:12px;overflow-x:auto;margin:0 -18px;padding:2px 18px 8px;scrollbar-width:none}.ex-sg-row::-webkit-scrollbar{display:none}.ex-sg{flex:none;width:150px;height:170px;border:0;border-radius:22px;padding:16px;text-align:left;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(20,25,50,.22)}.ex-sg::after{content:"";position:absolute;right:-30px;top:-30px;width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.12)}.ex-sge{position:absolute;left:16px;top:14px;font-size:1.9rem}.ex-sg b{font:600 1.02rem/1.2 var(--serif);color:#fff;display:block}.ex-sg small{opacity:.8;font-size:.78rem}.ex-sg{white-space:normal}.ex-sg b,.ex-sg small{white-space:normal}\n.ex-ov{position:fixed;inset:0;z-index:60;background:rgba(10,12,20,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .25s}.ex-ov.on{opacity:1}\n.ex-sb{width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--card);color:var(--ink);border-radius:26px 26px 0 0;padding:16px 18px calc(18px + env(safe-area-inset-bottom,0px));transform:translateY(40px);transition:transform .45s cubic-bezier(.34,1.4,.64,1)}#ex-sug.on .ex-sb{transform:none}.ex-sg-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.ex-sg-h b{font:600 1.15rem var(--serif)}.ex-sg-h button{width:40px;padding:0}.ex-si{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}.ex-sn{flex:none;width:26px;height:26px;border-radius:50%;background:var(--soft);display:grid;place-items:center;font:600 .8rem var(--sans);color:var(--mute)}.ex-si>div{flex:1;min-width:0}.ex-si b{display:block;font:600 .98rem/1.25 var(--serif)}.ex-si small{color:var(--mute);font-size:.8rem;line-height:1.3;display:block}.ex-si button{flex:none;padding:8px 14px}\n.ex-agrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.ex-ab{text-align:center;opacity:.35;filter:grayscale(1);transition:opacity .3s,filter .3s}.ex-ab.on{opacity:1;filter:none}.ex-ae{display:grid;place-items:center;width:46px;height:46px;margin:0 auto 4px;border-radius:50%;background:var(--soft);font-size:1.4rem}.ex-ab.on .ex-ae{background:color-mix(in srgb,var(--gold) 38%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--gold) 70%,transparent)}.ex-ab small{display:block;font-size:.66rem;line-height:1.15;color:var(--mute)}.ex-ab.on small{color:var(--ink);font-weight:600}
.ex-bio{display:flex;gap:12px;align-items:center;margin-bottom:8px}.ex-bio-img{width:56px;height:56px;border-radius:50%;object-fit:cover;flex:none}.ex-bio b{display:block}.ex-bio small{display:block;opacity:.7;font-size:.84rem}.ex-bio-t{margin:6px 0;line-height:1.55}.ex-bio-a{font-size:.88rem;color:inherit;text-decoration:underline}`;

window.KEx={intro,pickGoal,goal,decorate,render,bioView,statsPage};

// introducción la primera vez; en Ajustes se puede volver a ver
try{if(!localStorage.getItem('k_welcome'))intro()}catch(e){}
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||$('ex-set'))return;
  const c=el('div','card');c.id='ex-set';c.style.marginTop='14px';c.append(el('b','','Introducción y meta diaria'),el('p','hint2','Volvé a ver la bienvenida o cambiá cuánto querés leer por día.'));
  const a=el('div','ex-la'),b1=el('button','ghost','Ver introducción'),b2=el('button','ghost','Cambiar meta');b1.type=b2.type='button';b1.onclick=()=>intro();b2.onclick=()=>pickGoal();a.append(b1,b2);c.append(a);h.append(c)})();
(function(){const h=document.querySelector('.view[data-view="ajustes"]');if(!h||$('ex-rem'))return;
  const c=el('div','card');c.id='ex-rem';c.style.marginTop='14px';c.append(el('b','','Recordatorio diario de lectura'),el('p','hint2','Elegí una hora y lo agregamos a tu calendario como evento diario con aviso. Se maneja desde la app de calendario de tu celular.'));
  const t=el('input');t.type='time';let v='21:00';try{v=localStorage.getItem('kr_rem')||v}catch(e){}t.value=v;t.style.cssText='max-width:140px;margin:6px 0';
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
