// Kinderly · cuenta, amigos, pedidos y envío desde el Gmail de cada persona.
// Si este módulo no carga (sin conexión, CDN bloqueado), el resto de la app sigue funcionando.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,addDoc,getDocs,collection,query,where,onSnapshot,serverTimestamp,limit,arrayUnion,deleteField} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';

const cfg={apiKey:['AIzaSyC4yXv45','CTxrENY8YYkQ8dY8BHIcuaZdU'].join('_'),authDomain:'kinderly-6bde4.firebaseapp.com',projectId:'kinderly-6bde4',appId:'1:630134944016:web:b5519d0a9005817311f595',messagingSenderId:'630134944016'};
// Script de Google que solo descarga EPUB de fuentes legales (el navegador no puede por CORS).
const DL_URL='https://script.google.com/macros/s/'+['AKfycbypxSKxmMZfHb2SJScbjIBI9X','xc4InKh','rwtFZ8kd4stgLF'+'LjNeQCV-me3tj8mm2WKMQ'].join('_')+'/exec';
const ALLOWED=['gutenberg.org','archive.org','wikisource.org','wmcloud.org','books.google.com','library.oapen.org'];

const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const provider=new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.setCustomParameters({prompt:'select_account'});

const $=id=>document.getElementById(id);
const say=(t,c)=>{try{window.say(t,c)}catch(e){}};
const S={user:null,friends:[],reqIn:[],reqOut:[],sharesIn:[],bookIn:[],bookOut:[],unsubs:[],username:''};
let token='',tokenExp=0;
try{token=sessionStorage.getItem('k_gt')||'';tokenExp=+sessionStorage.getItem('k_gt_exp')||0}catch(e){}
const tokenOk=()=>!!token&&Date.now()<tokenExp-60000;
function setToken(t){token=t;tokenExp=Date.now()+55*60*1000;try{sessionStorage.setItem('k_gt',t);sessionStorage.setItem('k_gt_exp',String(tokenExp))}catch(e){}}
function clearToken(){token='';tokenExp=0;try{sessionStorage.removeItem('k_gt');sessionStorage.removeItem('k_gt_exp')}catch(e){}}
const errMsg=e=>{const c=(e&&e.code)||'';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return 'Cerraste la ventana de Google antes de terminar.';
  if(c==='auth/popup-blocked')return 'Tu navegador bloqueó la ventana de Google. Permitila y probá de nuevo.';
  if(c==='auth/unauthorized-domain')return 'Este dominio todavía no está autorizado para entrar con Google.';
  if(c==='permission-denied'||/insufficient permissions/i.test((e&&e.message)||''))return 'No tenés permiso para esa acción.';
  return (e&&e.message)||'Ocurrió un error';};
const hostOk=u=>{try{const x=new URL(u);return x.protocol==='https:'&&ALLOWED.some(h=>x.hostname===h||x.hostname.endsWith('.'+h))}catch(e){return false}};
const myMail=()=>{let m='';try{m=localStorage.getItem('mail')||''}catch(e){}return m||(S.user&&S.user.email)||''};
const secs=x=>(x&&x.createdAt&&x.createdAt.seconds)||Date.now()/1000;

let needConsent=false;
async function popup(){
  provider.setCustomParameters({prompt:needConsent?'consent':'select_account'});needConsent=false;
  const r=await signInWithPopup(auth,provider);
  const c=GoogleAuthProvider.credentialFromResult(r);
  if(c&&c.accessToken){let ok=true;try{const ti=await(await fetch('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(c.accessToken))).json();ok=!ti.scope||ti.scope.includes('gmail.send')}catch(e){}if(!ok){needConsent=true;throw Object.assign(new Error('Falta el permiso de enviar correo. Tocá “Entrar con Google” de nuevo y tildá la casilla de enviar correo.'),{code:'no-scope'})}setToken(c.accessToken)}
  return r.user;
}
async function login(){try{const u=await popup();say('Hola, '+(u.displayName||u.email)+'. Ya podés enviar desde tu Gmail.','ok')}catch(e){say(errMsg(e),'err')}}
async function ensureToken(){
  if(!auth.currentUser)return false;
  if(tokenOk())return true;
  try{await popup();return tokenOk()}catch(e){say(errMsg(e),'err');return false}
}
async function logout(){clearToken();try{await signOut(auth)}catch(e){}}

const b64u=s=>btoa(unescape(encodeURIComponent(s)));
const wrap=s=>(s.match(/.{1,76}/g)||[]).join('\r\n');
const ascii=s=>String(s||'libro.epub').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9._-]+/g,'_').slice(0,80)||'libro.epub';

async function sendMail({to,url,title,filename}){
  try{
    if(!/^\S+@\S+\.\S+$/.test(to||''))return{ok:false,error:'Mail de destino inválido'};
    if(!tokenOk()&&!(await ensureToken()))return{ok:false,error:'No se pudo autorizar el envío desde tu Gmail'};
    const r=await fetch(DL_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'descargar',url}),signal:AbortSignal.timeout(90000)});
    const d=await r.json();
    if(!d.ok)return{ok:false,error:d.error||'No se pudo descargar el libro'};
    const B='kinderly_'+Math.random().toString(36).slice(2),fname=ascii(filename);
    const mime=['To: '+to,'Subject: =?UTF-8?B?'+b64u('Tu libro: '+title)+'?=','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+B+'"','',
      '--'+B,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(b64u('Acá tenés “'+title+'”, enviado con Kinderly.')),
      '--'+B,'Content-Type: application/epub+zip; name="'+fname+'"','Content-Disposition: attachment; filename="'+fname+'"','Content-Transfer-Encoding: base64','',wrap(d.data),
      '--'+B+'--',''].join('\r\n');
    const raw=btoa(mime).replace(/\+/g,'-').replace(/\//g,'_');const g=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw})});
    if(g.ok)return{ok:true};
    let msg='';try{msg=(await g.json()).error.message}catch(e){}
    if(g.status===401){clearToken();return{ok:false,error:'Se venció el permiso de Gmail. Probá de nuevo.'}}
    if(g.status===403){clearToken();needConsent=true}if(g.status===403)return{ok:false,error:'Google no dejó enviar'+(msg?' ('+msg+')':'')+'. Al entrar, tildá el permiso de enviar correo.'};
    return{ok:false,error:'Gmail respondió '+g.status+(msg?': '+msg:'')};
  }catch(e){return{ok:false,error:e.message||'Error al enviar'}}
}

// ---------- Datos ----------
async function upsertProfile(u){
  try{
    await setDoc(doc(db,'users',u.uid),{name:u.displayName||'',photo:u.photoURL||'',updatedAt:serverTimestamp(),email:deleteField(),emailLower:deleteField()},{merge:true});
    const s=await getDoc(doc(db,'users',u.uid));S.username=(s.exists()&&s.data().username)||'';
  }catch(e){console.warn('perfil',e)}
}
const myName=()=>S.username||(S.user&&S.user.displayName)||'Alguien';
async function claimUsername(raw){
  const low=String(raw||'').trim().replace(/^@/,'').toLowerCase();
  if(!/^[a-z0-9_.]{3,20}$/.test(low))throw new Error('Usá de 3 a 20 letras minúsculas, números, punto o guion bajo (sin espacios ni tildes)');
  if(S.username&&S.username===low){await updateDoc(doc(db,'users',S.user.uid),{username:low,usernameLower:low});return}
  const ref=doc(db,'usernames',low),ex=await getDoc(ref);
  if(ex.exists()&&ex.data().uid!==S.user.uid)throw new Error('Ese usuario ya está en uso, probá con otro');
  if(!ex.exists()){try{await setDoc(ref,{uid:S.user.uid,createdAt:serverTimestamp()})}catch(e){throw new Error('Ese usuario ya está en uso, probá con otro')}}
  const old=(S.username||'').toLowerCase();
  await updateDoc(doc(db,'users',S.user.uid),{username:low,usernameLower:low});
  if(old&&old!==low){try{await deleteDoc(doc(db,'usernames',old))}catch(e){}}
  S.username=low;
}
function promptUsername(){
  if(!S.user)return;
  modal(S.username?'Cambiar tu nombre de usuario':'Elegí tu nombre de usuario',(bx,close)=>{
    bx.append(el('p','hint2','Tus amigos te van a encontrar con este nombre, no con tu mail. Usá de 3 a 20 letras minúsculas, números, punto o guion bajo.'));
    const i=el('input');i.type='text';i.maxLength=20;i.placeholder='ej: maria_lee';i.autocapitalize='none';i.autocomplete='off';i.spellcheck=false;i.value=S.username||'';bx.append(i);
    const a=el('div','ks-acts');
    a.append(btn(S.username?'Cancelar':'Después',close,true),btn('Guardar',()=>guard(async()=>{await claimUsername(i.value);close();render()},'¡Listo! Tu usuario quedó guardado')));
    bx.append(a);setTimeout(()=>i.focus(),50);
  });
}
function subscribe(){
  const uid=S.user.uid,warn=e=>console.warn(e);
  S.unsubs=[
    onSnapshot(query(collection(db,'friendRequests'),where('participants','array-contains',uid)),s=>{const l=s.docs.map(d=>({id:d.id,...d.data()}));S.reqIn=l.filter(r=>r.to===uid&&r.status==='pending');S.reqOut=l.filter(r=>r.from===uid&&r.status==='pending');render()},warn),
    onSnapshot(query(collection(db,'friendships'),where('members','array-contains',uid)),s=>{S.friends=s.docs.map(d=>{const f=d.data(),o=(f.members||[]).find(x=>x!==uid),n=f.names||{},m=f.emails||{};return{id:d.id,uid:o,name:n[o]||m[o]||'Amigo',email:m[o]||''}});render()},warn),
    onSnapshot(query(collection(db,'shares'),where('to','==',uid)),s=>{S.sharesIn=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>secs(b)-secs(a));render()},warn),
    onSnapshot(query(collection(db,'bookRequests'),where('to','==',uid)),s=>{S.bookIn=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>secs(b)-secs(a));render()},warn),
    onSnapshot(query(collection(db,'bookRequests'),where('from','==',uid)),s=>{S.bookOut=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>secs(b)-secs(a));render()},warn)
  ];
}
function unsubscribe(){S.unsubs.forEach(f=>{try{f()}catch(e){}});S.unsubs=[];S.friends=[];S.reqIn=[];S.reqOut=[];S.sharesIn=[];S.bookIn=[];S.bookOut=[]}

async function guard(fn,okMsg){try{await fn();if(okMsg)say(okMsg,'ok')}catch(e){say(errMsg(e),'err')}}
async function addFriend(raw){
  const low=(raw||'').trim().replace(/^@/,'').toLowerCase(),me=S.user;
  if(!S.username){promptUsername();say('Primero elegí tu nombre de usuario','err');return}
  if(!/^[a-z0-9_.]{3,20}$/.test(low)){say('Escribí el nombre de usuario de tu amigo/a (3 a 20 letras, números, punto o guion bajo)','err');return}
  if(low===S.username){say('Ese es tu propio usuario','err');return}
  const s=await getDocs(query(collection(db,'users'),where('usernameLower','==',low)));
  if(s.empty){say('No encontramos a nadie con ese usuario. Revisá cómo lo escribió tu amigo/a.','err');return}
  const tid=s.docs[0].id,t=s.docs[0].data();
  if(S.friends.some(f=>f.uid===tid)){say('Ya son amigos','ok');return}
  if(S.reqIn.some(r=>r.from===tid)){say('Esa persona ya te mandó una solicitud: aceptala en esta misma sección','ok');return}
  if(S.reqOut.some(r=>r.to===tid)){say('Ya le mandaste una solicitud, está pendiente','ok');return}
  const id=me.uid+'_'+tid;
  try{await deleteDoc(doc(db,'friendRequests',id))}catch(e){}
  await setDoc(doc(db,'friendRequests',id),{from:me.uid,to:tid,fromName:S.username,toName:t.username||t.name||'',participants:[me.uid,tid],status:'pending',createdAt:serverTimestamp()});
  say('Solicitud enviada a @'+(t.username||''),'ok');
}
async function acceptReq(r){
  await updateDoc(doc(db,'friendRequests',r.id),{status:'accepted'});
  await setDoc(doc(db,'friendships',r.id),{members:[r.from,r.to],names:{[r.from]:r.fromName||'',[r.to]:r.toName||''},emails:{[r.from]:r.fromEmail||'',[r.to]:r.toEmail||''},createdAt:serverTimestamp()});
}
async function removeFriend(f){
  await deleteDoc(doc(db,'friendships',f.id));
  try{await deleteDoc(doc(db,'friendRequests',f.id))}catch(e){}
}

// ---------- Mi biblioteca, visible para mis amigos ----------
// Se publica en users/{uid}.library: título, autor, % leído y el enlace legal. Nunca los archivos propios del celular.
const shareLibOn=()=>{try{return localStorage.getItem('k_lib_share')!=='0'}catch(e){return true}};
const libForFriends=()=>{let l=[];try{l=JSON.parse(localStorage.getItem('kr_lib')||'[]')}catch(e){}
  return l.filter(x=>x&&x.title&&!x.local).slice(0,40).map(x=>({t:String(x.title).slice(0,200),a:String(x.author||'').slice(0,120),p:Math.round((x.pct||0)*100),u:hostOk(x.url)?x.url:''}))};
let libT=0;
async function syncLib(){
  if(!S.user)return;const uid=S.user.uid,data=shareLibOn()?libForFriends():null,sig=JSON.stringify(data);
  let last='';try{last=localStorage.getItem('k_lib_pub_'+uid)||''}catch(e){}
  if(sig===last)return;
  try{await setDoc(doc(db,'users',uid),data?{library:data,libraryAt:serverTimestamp()}:{library:deleteField(),libraryAt:deleteField()},{merge:true});try{localStorage.setItem('k_lib_pub_'+uid,sig)}catch(e){}}
  catch(e){console.warn('biblioteca',e)}
}
const syncLibSoon=()=>{clearTimeout(libT);libT=setTimeout(syncLib,1500)};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncLib()});
setInterval(syncLib,60000);
function setShareLib(on){try{localStorage.setItem('k_lib_share',on?'1':'0')}catch(e){}syncLib();render();say(on?'Tus amigos ya pueden ver tu biblioteca':'Tu biblioteca dejó de estar visible para tus amigos','ok')}

const reqText=x=>(x.t+(x.a?' — '+x.a:'')).slice(0,200);
function friendLib(f){
  modal('Biblioteca de '+f.name,(bx,close)=>{
    const st=el('p','hint2','Cargando…'),l=el('div','ks-sec');bx.append(st,l);
    const a=el('div','ks-acts');a.append(btn('Cerrar',close,true));
    getDoc(doc(db,'users',f.uid)).then(s=>{
      const lib=s.exists()&&Array.isArray(s.data().library)?s.data().library:[];
      st.textContent=lib.length?(lib.length===1?'1 libro':lib.length+' libros')+'. Tocá “Pedir” y le llega tu pedido.':f.name+' todavía no compartió su biblioteca. Tiene que tener Kinderly actualizado y haber abierto algún libro en la app.';
      lib.forEach(x=>{
        const bs=[],asked=S.bookOut.some(r=>r.to===f.uid&&r.status!=='done'&&r.text===reqText(x));
        if(x.u&&hostOk(x.u)&&window.KReader)bs.push(btn('Leer',()=>{close();window.KReader.open({title:x.t,author:x.a,url:x.u})},true));
        const pb=el('button',asked?'ghost':'',asked?'Pedido ✓':'Pedir');pb.type='button';pb.disabled=asked;
        pb.onclick=async()=>{pb.disabled=true;try{await addDoc(collection(db,'bookRequests'),{from:S.user.uid,to:f.uid,fromName:myName(),toName:f.name,text:reqText(x),status:'open',createdAt:serverTimestamp()});pb.textContent='Pedido ✓';pb.className='ghost';say('Le pediste “'+x.t+'” a '+f.name,'ok')}catch(e){pb.disabled=false;say(errMsg(e),'err')}};
        bs.push(pb);l.append(row(x.t,[x.a,x.p?x.p+'% leído':''].filter(Boolean).join(' · '),bs));
      });
    }).catch(e=>{st.textContent='No se pudo cargar la biblioteca: '+errMsg(e)});
    bx.append(a);
  });
}

// ---------- UI ----------
const css=document.createElement('style');
css.textContent='.ks-ov{position:fixed;inset:0;background:rgba(10,20,30,.55);display:grid;place-items:center;z-index:20;padding:16px}'+
'.ks-box{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:18px;max-width:420px;width:100%;max-height:85vh;overflow:auto;box-shadow:var(--sh)}'+
'.ks-box h3{margin:0 0 10px;font:600 1.1rem var(--serif)}.ks-box input[type=text]{width:100%;border:1px solid var(--line);border-radius:12px;background:var(--bg);padding:10px 12px;margin:6px 0}'+
'.ks-sec{margin-top:16px}.ks-sec h4{margin:0 0 6px;font:600 .95rem var(--serif)}.ks-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line);flex-wrap:wrap}'+
'.ks-row>div{flex:1;min-width:150px}.ks-row small{display:block;color:var(--mute)}.ks-row button{padding:8px 12px;font-size:.8rem}.ks-me{display:flex;align-items:center;gap:10px}'+
'.ks-me img{width:40px;height:40px;border-radius:50%}.ks-add{display:flex;gap:8px;margin-top:8px}.ks-add input{flex:1;min-width:0;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);padding:10px 12px;font:inherit}'+

'#soc{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}'+
'.kf-c{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;margin-top:14px;box-shadow:var(--sh)}'+
'.kf-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 6px}.kf-t{margin:0;font:600 1.08rem var(--serif);color:var(--ink)}'+
'.kf-b{min-width:22px;height:22px;border-radius:11px;background:var(--acc);color:#fff;font:600 .74rem var(--sans);display:grid;place-items:center;padding:0 7px}.kf-b0{background:var(--soft);color:var(--mute)}'+
'.kf-me0{padding:18px 16px 8px}.kf-me{display:flex;align-items:center;gap:14px}.kf-me img,.kf-me .kf-av{width:52px;height:52px;border-radius:50%;flex:none;font-size:1.25rem}.kf-nm{font:600 1.15rem var(--serif);overflow-wrap:anywhere}.kf-tx small{display:block;color:var(--mute);font-size:.86rem;margin-top:2px;overflow-wrap:anywhere}'+
'.kf-links{display:flex;flex-wrap:wrap;column-gap:18px;row-gap:0;margin-top:14px;padding-top:4px;border-top:1px solid var(--line)}.kf-me0>.kf-e{margin:2px 0 8px;font-size:.84rem}'+
'.kf-l{background:none!important;border:0!important;box-shadow:none!important;color:var(--green)!important;font:500 .9rem var(--sans)!important;padding:12px 0!important;min-width:0!important;flex:0 0 auto!important;width:auto!important}'+
'.kf-a .kf-l{color:var(--mute)!important}.kf-it .kf-s.kf-l{padding:10px 4px!important}'+
'.kf-list{margin-top:2px}.kf-it{padding:13px 0;border-top:1px solid var(--line)}.kf-list>.kf-it:first-child{border-top:0}'+
'.kf-top{display:flex;align-items:center;gap:12px}.kf-tx{min-width:0;flex:1}.kf-tx b{display:block;font-weight:600;overflow-wrap:anywhere}'+
'.kf-av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;font:600 1.05rem var(--serif);flex:none}'+
'.kf-a{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap;align-items:center}.kf-a button:not(.kf-l){flex:1 1 0;min-width:92px;padding:11px 12px;font-size:.9rem}'+
'.kf-top button.kf-s:not(.kf-l){flex:none;padding:9px 14px;font-size:.86rem}'+
'.kf-x{flex:none!important;width:34px;height:34px;min-width:34px!important;padding:0!important;border-radius:50%!important;font-size:1.15rem!important;line-height:1;background:var(--soft)!important;color:var(--mute)!important;border:0!important}.kf-it.kf-sd .kf-tx b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kf-it.kf-sd .kf-top{gap:10px}'+
'.kf-add{display:flex;gap:8px;margin:10px 0 6px}.kf-add input{flex:1;min-width:0;height:46px;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--ink);padding:0 14px;font:inherit}.kf-add button{flex:none;height:46px;padding:0 20px}'+
'.kf-e{margin:10px 0 0;color:var(--mute);font-size:.9rem;line-height:1.5}'+
'.kf-d>summary{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;list-style:none;min-height:24px}.kf-d>summary::-webkit-details-marker{display:none}.kf-d>summary::after{content:"›";color:var(--mute);font:400 1.4rem/1 var(--sans);transition:transform .15s;margin-left:auto}.kf-d[open]>summary::after{transform:rotate(90deg)}.kf-d>summary .kf-b0{margin-left:auto}.kf-d>summary .kf-b0+*{}'+
'.ks-radio{display:flex;align-items:center;gap:8px;padding:8px 0}.ks-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}';
document.head.append(css);

function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function btn(text,fn,ghost){const b=el('button',ghost?'ghost':'',text);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn()}finally{b.disabled=false}};return b}
function modal(title,build){
  const ov=el('div','ks-ov'),bx=el('div','ks-box');bx.append(el('h3','',title));
  const close=()=>ov.remove();build(bx,close);
  ov.addEventListener('click',e=>{if(e.target===ov)close()});ov.append(bx);document.body.append(ov);return close;
}
function openPanel(){if(window.showView)window.showView('amigos')}

function row(main,sub,buttons){const r=el('div','ks-row'),d=el('div');d.append(el('b','',main));if(sub)d.append(el('small','',sub));r.append(d);buttons.forEach(b=>r.append(b));return r}

function render(){
  const body=$('soc-body');if(!body)return;
  body.textContent='';
  const sum=$('soc-sum');
  if(!S.user){
    if(sum)sum.textContent='Entrar con Google';const tb0=$('tab-bdg');if(tb0)tb0.style.display='none';
    const w=el('div','kf-c');
    w.append(el('h4','kf-t','Entrá para compartir libros'));
    w.append(el('p','hint2','Con tu cuenta de Google podés enviarte libros desde tu propio Gmail (sin límite compartido) y pedirle libros a tus amigos o mandárselos.'));
    w.append(el('p','hint2','Kinderly solo pide permiso para enviar mails con el libro adjunto. Nunca lee tu correo.'));
    const b=btn('Entrar con Google',login);b.style.cssText='width:100%;margin-top:6px';w.append(b);
    w.append(el('p','hint2','Mientras la app esté en beta, Google puede mostrar “app no verificada”: tocá “Avanzada” y “Ir a Kinderly”.'));
    body.append(w);
    return;
  }
  const n=S.reqIn.length+S.sharesIn.filter(s=>s.status==='new').length+S.bookIn.filter(r=>r.status==='open').length;
  if(sum)sum.textContent='Mi cuenta y amigos'+(n?' ('+n+')':'');const tb=$('tab-bdg');if(tb){tb.textContent=n;tb.style.display=n?'grid':'none'}
  const TONES=['#5468A3','#7A6A9B','#4F7F73','#A0645C','#7B7F4E'];
  const tone=t=>{let h=0;for(const c of String(t||'?'))h=(h*31+c.charCodeAt(0))%997;return TONES[h%TONES.length]};
  const av=t=>{const d=el('div','kf-av',(String(t||'?').replace(/^@/,'').trim()[0]||'?').toUpperCase());d.style.background=tone(t);return d};
  const card=(title,count)=>{const c=el('section','kf-c'),h=el('div','kf-h');h.append(el('h4','kf-t',title));if(count)h.append(el('span','kf-b',String(count)));c.append(h);return c};
  const link=(t,fn)=>{const b=btn(t,fn,true);b.className='kf-l';return b};
  const item=(o)=>{const it=el('div','kf-it'),top=el('div','kf-top');if(o.av)top.append(av(o.av));const tx=el('div','kf-tx');tx.append(el('b','',o.title));if(o.sub)tx.append(el('small','',o.sub));top.append(tx);if(o.side){it.classList.add('kf-sd');o.side.forEach(x=>top.append(x))}it.append(top);if(o.acts&&o.acts.length){const a=el('div','kf-a');o.acts.forEach(x=>a.append(x));it.append(a)}return it};
  const list=()=>el('div','kf-list');
  const small=b=>{b.classList.add('kf-s');return b};

  // Perfil
  const me=el('section','kf-c kf-me0'),mh=el('div','kf-me');
  if(S.user.photoURL){const im=new Image();im.referrerPolicy='no-referrer';im.alt='';im.src=S.user.photoURL;mh.append(im)}else mh.append(av(S.user.displayName||'?'));
  const who=el('div','kf-tx');who.append(el('b','kf-nm',S.user.displayName||S.user.email),el('small','',S.username?('@'+S.username):'Todavía no elegiste tu usuario'));mh.append(who);
  const lk=el('div','kf-links');lk.append(link(S.username?'Cambiar usuario':'Elegir usuario',()=>promptUsername()),link(shareLibOn()?'Ocultar biblioteca':'Compartir biblioteca',()=>setShareLib(!shareLibOn())),link('Salir',logout));
  me.append(mh,lk,el('p','kf-e',shareLibOn()?'Tus amigos ven los libros de tu biblioteca (no los archivos de tu celular) y te los pueden pedir.':'Tu biblioteca no se muestra a tus amigos.'));body.append(me);

  // Novedades (solo si hay algo que atender)
  const newShares=S.sharesIn.filter(s=>s.status!=='received'),openIn=S.bookIn.filter(r=>r.status==='open');
  const shareItem=s=>{
    const sub='de '+(s.fromName||'un amigo')+(s.note?' · “'+s.note+'”':'')+(s.status==='received'?' · ya enviado a tu mail':'');
    return item({title:s.title,sub,acts:[
      btn('Enviar a mi mail',async()=>{if(!(await ensureToken()))return;say('Enviando “'+s.title+'”…');const r=await sendMail({to:myMail(),url:s.url,title:s.title,filename:s.title+'.epub'});if(r.ok){say('Enviado a '+myMail(),'ok');guard(()=>updateDoc(doc(db,'shares',s.id),{status:'received'}))}else say('No se pudo enviar: '+r.error,'err')}),
      btn('Leer',async()=>{if(!hostOk(s.url)){say('El enlace no pertenece a una fuente permitida','err');return}window.KReader?window.KReader.open({title:s.title,author:s.author||'',url:s.url}):say('El lector todavía no cargó','err')},true),
      btn('Descargar',async()=>{if(hostOk(s.url))window.open(s.url,'_blank','noopener');else say('El enlace no pertenece a una fuente permitida','err')},true),
      link('Quitar',()=>guard(()=>deleteDoc(doc(db,'shares',s.id))))]});
  };
  const nTot=S.reqIn.length+newShares.length+openIn.length;
  if(nTot){
    const c=card('Novedades',nTot),l=list();
    S.reqIn.forEach(r=>l.append(item({av:r.fromName,title:r.fromName||'Alguien',sub:'quiere ser tu amigo/a',acts:[btn('Aceptar',()=>guard(()=>acceptReq(r),'Ahora son amigos')),btn('Rechazar',()=>guard(()=>deleteDoc(doc(db,'friendRequests',r.id))),true)]})));
    newShares.forEach(s=>l.append(shareItem(s)));
    openIn.forEach(r=>l.append(item({av:r.fromName,title:(r.fromName||'Un amigo')+' busca',sub:'“'+r.text+'”',acts:[
      btn('Buscar',()=>{window.showView('buscar');$('q').value=String(r.text||'').split(' — ')[0];$('go').click()}),
      btn('Listo',()=>guard(()=>updateDoc(doc(db,'bookRequests',r.id),{status:'done'})),true),
      link('Quitar',()=>guard(()=>deleteDoc(doc(db,'bookRequests',r.id))))]})));
    c.append(l);body.append(c);
  }

  // Amigos
  const fc=card('Mis amigos');
  const form=el('div','kf-add'),inp=el('input');inp.type='text';inp.placeholder='Su nombre de usuario';inp.autocapitalize='none';inp.spellcheck=false;inp.autocomplete='off';inp.setAttribute('aria-label','Usuario de tu amigo o amiga');
  form.append(inp,btn('Agregar',()=>guard(()=>addFriend(inp.value).then(()=>{inp.value=''}))));fc.append(form);
  const fl=list();
  S.reqOut.forEach(r=>fl.append(item({av:r.toName,title:r.toName||'Pendiente',sub:'Solicitud enviada, esperando respuesta',side:[small(link('Cancelar',()=>guard(()=>deleteDoc(doc(db,'friendRequests',r.id)))))]})));
  S.friends.forEach(f=>{const q=btn('×',()=>{if(confirm('¿Quitar a '+f.name+' de tus amigos?'))return guard(()=>removeFriend(f))},true);q.className='kf-x';q.setAttribute('aria-label','Quitar a '+f.name);q.title='Quitar';
    fl.append(item({av:f.name,title:f.name,sub:'Amigo/a',side:[q],acts:[btn('Ver biblioteca',()=>friendLib(f)),btn('Pedir otro libro',()=>askBook(f),true)]}))});
  if(fl.children.length)fc.append(fl);
  if(!S.friends.length&&!S.reqIn.length&&!S.reqOut.length)fc.append(el('p','kf-e','Todavía no agregaste a nadie. Escribí su nombre de usuario arriba. Tiene que haber entrado a Kinderly y elegido uno.'));
  body.append(fc);

  // Historial (recibidos ya enviados y pedidos hechos)
  const done=S.sharesIn.filter(s=>s.status==='received');
  if(done.length||S.bookOut.length){
    const d=el('details','kf-c kf-d'),sm=el('summary','',''),sp=el('span','kf-t','Historial');sm.append(sp,el('span','kf-b kf-b0',String(done.length+S.bookOut.length)));d.append(sm);
    const l=list();done.forEach(s=>l.append(shareItem(s)));
    S.bookOut.forEach(r=>l.append(item({av:r.toName,title:'Le pedí a '+(r.toName||'un amigo'),sub:'“'+r.text+'” · '+(r.status==='done'?'listo':'abierto'),side:[small(link('Quitar',()=>guard(()=>deleteDoc(doc(db,'bookRequests',r.id)))))]})));
    d.append(l);body.append(d);
  }

  // Ayuda
  const hp=el('details','kf-c kf-d'),hs=el('summary','','');hs.append(el('span','kf-t','¿Cómo llegan los libros?'));hp.append(hs,el('p','kf-e','Los libros salen desde tu Gmail hacia '+myMail()+'. Si es un Kindle, aprobá tu Gmail en Amazon (Contenido y dispositivos → Preferencias → Documentos personales).'));
  body.append(hp);
}

function askBook(f){
  modal('Pedirle un libro a '+f.name,(bx,close)=>{
    const i=el('input');i.type='text';i.maxLength=200;i.placeholder='Título y autor';bx.append(i);
    const a=el('div','ks-acts');a.append(btn('Cancelar',close,true),btn('Enviar pedido',async()=>{
      const t=i.value.trim();if(!t){say('Escribí qué libro buscás','err');return}
      await guard(()=>addDoc(collection(db,'bookRequests'),{from:S.user.uid,to:f.uid,fromName:myName(),toName:f.name,text:t,status:'open',createdAt:serverTimestamp()}),'Pedido enviado a '+f.name);close()}));
    bx.append(a);setTimeout(()=>i.focus(),50);
  });
}

async function pickFriendForBook(b,button){
  if(!S.user){say('Entrá con Google para enviarle libros a tus amigos','err');openPanel();return}
  if(!S.friends.length){say('Todavía no tenés amigos en Kinderly. Agregalos desde “Mi cuenta y amigos”.','err');openPanel();return}
  button.disabled=true;let file='',o=null;
  try{
    o=b.opts.find(x=>x.sendable&&typeof x.url==='function');
    if(!o)throw new Error('Este libro no tiene un EPUB autorizado para enviar');
    file=await o.url();
    if(!hostOk(file))throw new Error('El enlace no pertenece a una fuente permitida');
  }catch(e){say(errMsg(e),'err');button.disabled=false;return}
  button.disabled=false;
  modal('Enviar “'+b.title+'” a…',(bx,close)=>{
    let sel=S.friends[0].uid;
    S.friends.forEach((f,i)=>{const l=el('label','ks-radio'),r=el('input');r.type='radio';r.name='ks-f';r.checked=i===0;r.onchange=()=>{sel=f.uid};l.append(r,el('span','',f.name));bx.append(l)});
    const n=el('input');n.type='text';n.maxLength=200;n.placeholder='Mensaje (opcional)';bx.append(n);
    const a=el('div','ks-acts');a.append(btn('Cancelar',close,true),btn('Enviar',async()=>{
      const f=S.friends.find(x=>x.uid===sel);
      await guard(()=>addDoc(collection(db,'shares'),{from:S.user.uid,to:sel,fromName:myName(),title:b.title,author:b.author||'',url:file,source:o.src,note:n.value.trim().slice(0,200),status:'new',createdAt:serverTimestamp()}),'Libro enviado a '+(f?f.name:'tu amigo'));close()}));
    bx.append(a);
  });
}

function decorate(b,actions){
  const x=el('button','ghost','Enviar a un amigo');x.type='button';x.onclick=()=>pickFriendForBook(b,x);actions.append(x);
}


// ---------- Sugerencias ----------
const SG={list:[]};
function renderSug(){
  const host=$('sug-body');if(!host)return;host.textContent='';
  const f=el('div','card');
  if(!S.user){f.append(el('p','hint2','Entrá con Google para dejar tu sugerencia y votar las de otros.'));f.append(btn('Entrar con Google',login))}
  else{
    const ta=el('textarea');ta.maxLength=400;ta.rows=3;ta.placeholder='Contanos qué te gustaría que Kinderly tenga o mejore…';ta.style.cssText='width:100%;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);padding:10px 12px;font:inherit';
    f.append(ta);const a=el('div','ks-acts');
    a.append(btn('Enviar sugerencia',()=>guard(async()=>{const t=ta.value.trim();if(t.length<3){say('Escribí un poco más','err');return}await addDoc(collection(db,'suggestions'),{from:S.user.uid,fromName:(S.username||S.user.displayName||'Anónimo'),text:t,votes:[S.user.uid],createdAt:serverTimestamp()});ta.value=''},'¡Gracias! Tu sugerencia ya está publicada')));
    f.append(a);
  }
  host.append(f);
  const l=SG.list.slice().sort((a,b)=>(b.votes||[]).length-(a.votes||[]).length||secs(b)-secs(a));
  const sec=el('div','ks-sec');sec.append(el('h4','','Lo que piden los usuarios'));
  if(!l.length)sec.append(el('p','hint2','Todavía no hay sugerencias. ¡Sé el primero!'));
  l.forEach(s=>{
    const mine=!!S.user&&(s.votes||[]).includes(S.user.uid),bs=[];
    bs.push(btn((mine?'✓ ':'+1 ')+(s.votes||[]).length,()=>{if(!S.user){say('Entrá con Google para votar','err');return}if(mine)return;return guard(()=>updateDoc(doc(db,'suggestions',s.id),{votes:arrayUnion(S.user.uid)}))},mine));
    if(S.user&&s.from===S.user.uid)bs.push(btn('Borrar',()=>guard(()=>deleteDoc(doc(db,'suggestions',s.id))),true));
    sec.append(row(s.text,s.fromName||'',bs));
  });
  host.append(sec);
}
onSnapshot(query(collection(db,'suggestions'),limit(100)),s=>{SG.list=s.docs.map(d=>({id:d.id,...d.data()}));renderSug()},e=>console.warn(e));


// ---------- Reseñas y puntuaciones ----------
const normT=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function bookKey(b){const a=normT(String(b.author||'').split(/[;,]/)[0]),t=normT(b.title).replace(/^(el|la|los|las|un|una) /,'');const s=t+'|'+a;let h1=0x811c9dc5,h2=5381;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,16777619)>>>0;h2=((h2*33)^c)>>>0}return 'b'+h1.toString(36)+h2.toString(36)}
const RV={cache:{},badges:{}};
// se guarda la promesa: si varias tarjetas del mismo libro piden a la vez, va una sola consulta a Firestore
function loadReviews(key,force){if(!force&&RV.cache[key])return RV.cache[key];const p=getDocs(query(collection(db,'reviews'),where('bookKey','==',key),limit(60))).then(s=>s.docs.map(d=>({id:d.id,...d.data()})));RV.cache[key]=p;p.catch(()=>{if(RV.cache[key]===p)delete RV.cache[key]});return p}
const avgR=l=>l.length?l.reduce((a,r)=>a+r.stars,0)/l.length:0;
const starsTxt=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const refreshBadges=key=>(RV.badges[key]||[]).forEach(f=>f());
function openReviews(b){
  const key=bookKey(b);
  modal('Reseñas de “'+b.title+'”',(bx,close)=>{
    const sum=el('p','hint2','Cargando…'),form=el('div'),list=el('div','ks-sec');bx.append(sum,form,list);
    const draw=async force=>{
      let l=[];try{l=await loadReviews(key,force)}catch(e){sum.textContent='No se pudieron cargar las reseñas.';return}
      sum.textContent=l.length?('★ '+avgR(l).toFixed(1)+' · '+l.length+(l.length===1?' reseña':' reseñas')):'Todavía no hay reseñas. ¡Sé el primero!';
      form.textContent='';
      if(!S.user){form.append(el('p','hint2','Entrá con Google para puntuar y dejar tu reseña.'),btn('Entrar con Google',async()=>{await login();draw(false)}))}
      else{
        const mine=l.find(r=>r.uid===S.user.uid);let st=mine?mine.stars:0;
        const row=el('div');row.style.cssText='display:flex;gap:4px;margin:6px 0';const sb=[];
        for(let i=1;i<=5;i++){const x=btn('★',()=>{st=i;sb.forEach((y,j)=>{y.style.opacity=j<i?1:.3})},true);x.setAttribute('aria-label','Puntuar con '+i);x.style.cssText='font-size:1.3rem;padding:4px 10px;color:#e6a817;opacity:'+(i<=st?1:.3);sb.push(x);row.append(x)}
        const ta=el('textarea');ta.rows=3;ta.maxLength=600;ta.placeholder='Tu reseña (opcional)';ta.value=mine?mine.text:'';ta.style.cssText='width:100%;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);padding:10px 12px;font:inherit';
        const a=el('div','ks-acts');
        if(mine)a.append(btn('Borrar',()=>guard(async()=>{await deleteDoc(doc(db,'reviews',key+'_'+S.user.uid));await draw(true);refreshBadges(key)}),true));
        a.append(btn(mine?'Actualizar':'Publicar',()=>guard(async()=>{if(!st){say('Elegí de 1 a 5 estrellas','err');return}await setDoc(doc(db,'reviews',key+'_'+S.user.uid),{bookKey:key,title:String(b.title).slice(0,200),author:String(b.author||'').slice(0,200),uid:S.user.uid,name:(S.username||S.user.displayName||'Anónimo'),stars:st,text:ta.value.trim().slice(0,600),updatedAt:serverTimestamp()});await draw(true);refreshBadges(key)},'¡Gracias por tu reseña!')));
        form.append(row,ta,a);
      }
      list.textContent='';
      l.slice().sort((a,c)=>((c.updatedAt&&c.updatedAt.seconds)||0)-((a.updatedAt&&a.updatedAt.seconds)||0)).forEach(r=>{const d=el('div','ks-row'),w=el('div');w.append(el('b','',(r.name||'Anónimo')+'  '+starsTxt(r.stars)));if(r.text)w.append(el('small','',r.text));d.append(w);list.append(d)});
    };
    draw(false);
    const a=el('div','ks-acts');a.append(btn('Cerrar',close,true));bx.append(a);
  });
}
function decorateRev(b,actions){
  const key=bookKey(b),x=el('button','ghost','☆ Reseñas');x.type='button';x.onclick=()=>openReviews(b);actions.append(x);
  const upd=async()=>{try{const l=await loadReviews(key);x.textContent=l.length?('★ '+avgR(l).toFixed(1)+' ('+l.length+')'):'☆ Reseñas'}catch(e){}};
  upd.alive=()=>x.isConnected;RV.badges[key]=(RV.badges[key]||[]).filter(f=>f.alive());RV.badges[key].push(upd);upd();
}
window.KRev={decorate:decorateRev,open:openReviews};

window.KSoc={loggedIn:()=>!!auth.currentUser,canSend:()=>!!auth.currentUser,email:()=>(auth.currentUser&&auth.currentUser.email)||'',ensureToken,sendMail,decorate,openPanel,syncLib:syncLibSoon};

onAuthStateChanged(auth,async u=>{
  unsubscribe();S.user=u||null;S.username='';
  if(u){await upsertProfile(u);subscribe();syncLibSoon();if(!S.username)setTimeout(()=>promptUsername(),600)}else clearToken();
  render();renderSug();
});
render();renderSug();
