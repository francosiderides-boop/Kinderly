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
provider.addScope('https://www.googleapis.com/auth/drive.file'); // subir libros a la carpeta Kinderly del Drive de cada persona (solo ve lo que crea la app)
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
async function popup(need){need=need||'gmail.send';
  provider.setCustomParameters({prompt:needConsent?'consent':'select_account'});needConsent=false;
  const r=await signInWithPopup(auth,provider);
  const c=GoogleAuthProvider.credentialFromResult(r);
  if(c&&c.accessToken){let ok=true,drive=false;try{const ti=await(await fetch('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(c.accessToken))).json();ok=!ti.scope||ti.scope.includes(need);drive=!!ti.scope&&ti.scope.includes('drive.file')}catch(e){}if(!ok){needConsent=true;throw Object.assign(new Error(need==='drive.file'?'Falta el permiso de Drive. Tocá de nuevo “Subir al Drive” y tildá la casilla de Drive.':'Falta el permiso de enviar correo. Tocá “Entrar con Google” de nuevo y tildá la casilla de enviar correo.'),{code:'no-scope'})}setToken(c.accessToken);try{sessionStorage.setItem('k_gt_drive',drive?'1':'0')}catch(e){}}
  return r.user;
}
async function login(){try{const u=await popup();say('Hola, '+(u.displayName||u.email)+'. Ya podés enviar desde tu Gmail.','ok')}catch(e){say(errMsg(e),'err')}}
async function ensureToken(){
  if(!auth.currentUser)return false;
  if(tokenOk())return true;
  try{await popup();return tokenOk()}catch(e){say(errMsg(e),'err');return false}
}
// token para Drive: si falta el permiso se vuelve a pedir (tiene que llamarse directo desde un toque, por el bloqueo de ventanas)
const driveOk=()=>{try{return sessionStorage.getItem('k_gt_drive')==='1'}catch(e){return false}};
async function driveToken(){
  if(auth.currentUser&&tokenOk()&&driveOk())return token;
  try{if(auth.currentUser&&!driveOk())needConsent=true;await popup('drive.file');return(tokenOk()&&driveOk())?token:null}catch(e){say(errMsg(e),'err');return null}
}
async function logout(){clearToken();try{await signOut(auth)}catch(e){}}

const b64u=s=>btoa(unescape(encodeURIComponent(s)));
const wrap=s=>(s.match(/.{1,76}/g)||[]).join('\r\n');
const ascii=s=>String(s||'libro.epub').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9._-]+/g,'_').slice(0,80)||'libro.epub';

// arma el mail con el EPUB adjunto y lo manda desde el Gmail de la persona (data: EPUB en base64)
async function sendData({to,title,fname,data}){
  try{
    const B='kinderly_'+Math.random().toString(36).slice(2);
    const mime=['To: '+to,'Subject: =?UTF-8?B?'+b64u('Tu libro: '+title)+'?=','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+B+'"','',
      '--'+B,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(b64u('Acá tenés “'+title+'”, enviado con Kinderly.')),
      '--'+B,'Content-Type: application/epub+zip; name="'+fname+'"','Content-Disposition: attachment; filename="'+fname+'"','Content-Transfer-Encoding: base64','',wrap(data),
      '--'+B+'--',''].join('\r\n');
    // hasta ~3 MB va como JSON (lo de siempre); más grande, por la carga directa de Gmail (hasta 35 MB)
    const big=data.length>4000000;
    const g=big?await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'message/rfc822'},body:mime})
      :await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw:btoa(mime).replace(/\+/g,'-').replace(/\//g,'_')})});
    if(g.ok)return{ok:true};
    let msg='';try{msg=(await g.json()).error.message}catch(e){}
    if(g.status===401){clearToken();return{ok:false,error:'Se venció el permiso de Gmail. Probá de nuevo.'}}
    if(g.status===403){clearToken();needConsent=true}if(g.status===403)return{ok:false,error:'Google no dejó enviar'+(msg?' ('+msg+')':'')+'. Al entrar, tildá el permiso de enviar correo.'};
    return{ok:false,error:'Gmail respondió '+g.status+(msg?': '+msg:'')};
  }catch(e){return{ok:false,error:e.message||'Error al enviar'}}
}
// un libro que ya está guardado en el dispositivo (ArrayBuffer): se manda sin volver a descargarlo
async function sendFile({to,title,filename,buf}){
  if(!/^\S+@\S+\.\S+$/.test(to||''))return{ok:false,error:'Mail de destino inválido'};
  if(!tokenOk()&&!(await ensureToken()))return{ok:false,error:'No se pudo autorizar el envío desde tu Gmail'};
  let bin='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)bin+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
  return sendData({to,title,fname:ascii(filename),data:btoa(bin)});
}

async function sendMail({to,url,title,filename}){
  try{
    if(!/^\S+@\S+\.\S+$/.test(to||''))return{ok:false,error:'Mail de destino inválido'};
    if(!tokenOk()&&!(await ensureToken()))return{ok:false,error:'No se pudo autorizar el envío desde tu Gmail'};
    const r=await fetch(DL_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'descargar',url}),signal:AbortSignal.timeout(90000)});
    const d=await r.json();
    if(!d.ok)return{ok:false,error:d.error||'No se pudo descargar el libro'};
    return await sendData({to,title,fname:ascii(filename),data:d.data});
  }catch(e){return{ok:false,error:e.message||'Error al enviar'}}
}

// ---------- Datos ----------
async function upsertProfile(u){
  try{
    await setDoc(doc(db,'users',u.uid),{name:u.displayName||'',photo:u.photoURL||'',updatedAt:serverTimestamp(),email:deleteField(),emailLower:deleteField()},{merge:true});
    const s=await getDoc(doc(db,'users',u.uid));const ud=(s.exists()&&s.data())||{};S.username=ud.username||'';S.bio=ud.bio||'';S.pic=ud.pic||'';
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
    a.append(btn(S.username?'Cancelar':'Después',close,true),btn('Guardar',()=>guard(async()=>{await claimUsername(i.value);close();render();renderProfile()},'¡Listo! Tu usuario quedó guardado')));
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
    onSnapshot(query(collection(db,'bookRequests'),where('from','==',uid)),s=>{S.bookOut=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>secs(b)-secs(a));render()},warn),
    onSnapshot(query(collection(db,'clubReads'),where('members','array-contains',uid)),s=>{CL.denied=false;CL.reads=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.deadline-b.deadline);refreshClub()},e=>{warn(e);CL.denied=true;renderClub()})
  ];
}
function unsubscribe(){S.unsubs.forEach(f=>{try{f()}catch(e){}});S.unsubs=[];S.friends=[];S.reqIn=[];S.reqOut=[];S.sharesIn=[];S.bookIn=[];S.bookOut=[];CL.reads=[];CL.prog={};CL.denied=false}

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
// Se publica en libraries/{uid} (solo la leen tus amigos): título, autor, % leído y el enlace legal. Nunca los archivos propios del celular.
const shareLibOn=()=>{try{return localStorage.getItem('k_lib_share')!=='0'}catch(e){return true}};
const libForFriends=()=>{let l=[];try{l=JSON.parse(localStorage.getItem('kr_lib')||'[]')}catch(e){}
  return l.filter(x=>x&&x.title&&!x.local).slice(0,40).map(x=>({t:String(x.title).slice(0,200),a:String(x.author||'').slice(0,120),p:Math.round((x.pct||0)*100),u:hostOk(x.url)?x.url:''}))};
let libT=0;
async function syncLib(){
  if(!S.user)return;const uid=S.user.uid,data=shareLibOn()?libForFriends():null,sig=JSON.stringify(data);
  let last='';try{last=localStorage.getItem('k_lib_pub_'+uid)||''}catch(e){}
  if(sig===last)return;
  try{const ref=doc(db,'libraries',uid);if(data)await setDoc(ref,{items:data,updatedAt:serverTimestamp()});else await deleteDoc(ref);try{localStorage.setItem('k_lib_pub_'+uid,sig)}catch(e){}}
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
    getDoc(doc(db,'libraries',f.uid)).then(s=>{
      const lib=s.exists()&&Array.isArray(s.data().items)?s.data().items:[];
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
    if(sum)sum.textContent='Entrar con Google';['tab-bdg','menu-bdg'].forEach(i=>{const x=$(i);if(x)x.style.display='none'});
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
  if(sum)sum.textContent='Mi cuenta y amigos'+(n?' ('+n+')':'');['tab-bdg','menu-bdg'].forEach(i=>{const x=$(i);if(x){x.textContent=n;x.style.display=n?'grid':'none'}});
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
  if(myPhoto()){const im=new Image();im.referrerPolicy='no-referrer';im.alt='';im.src=myPhoto();mh.append(im)}else mh.append(av(S.user.displayName||'?'));
  const who=el('div','kf-tx');who.append(el('b','kf-nm',S.user.displayName||S.user.email),el('small','',S.username?('@'+S.username):'Todavía no elegiste tu usuario'));mh.append(who);
  const lk=el('div','kf-links');lk.append(link('Editar perfil',()=>window.showView('perfil')),link(shareLibOn()?'Ocultar biblioteca':'Compartir biblioteca',()=>setShareLib(!shareLibOn())),link('Salir',logout));
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
    fl.append(item({av:f.name,title:f.name,sub:'Amigo/a',side:[q],acts:[btn('Ver biblioteca',()=>friendLib(f)),btn('Perfil',()=>friendProfile(f),true),btn('Pedir otro libro',()=>askBook(f),true)]}))});
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


// ---------- Mi cuenta igual en todos los dispositivos ----------
// Cada dato guardado en el navegador (biblioteca y progreso, subrayados, marcadores, listas, meta, estadísticas,
// ajustes del lector, mail) se copia en userData/{uid}/k/{clave}, privado de cada usuario.
// Gana el cambio más nuevo; la biblioteca y las estadísticas se combinan para no perder lo leído en otro lado.
const SY={uid:'',ready:false,unsub:null,state:'off',at:0,ui:0};
const NOSYNC=/^(kr_ai$|kr_sum_|kr_q_|kr_bio_|kr_air$|kr_au$|kr_mus$|k_gt|k_sync_|k_lib_pub_|k_pets_ph$|k_inst_x$|k_welcome$)/;
const syncable=k=>k==='mail'||(/^(kr_|k_)/.test(k)&&!NOSYNC.test(k));
const MERGE=new Set(['kr_lib','kr_lib_rm','kr_st','kr_tot']);
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}},obj:k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}}};
const hsh=s=>{if(s==null)return 'n';let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36)+'.'+s.length};
const pj=s=>{try{return JSON.parse(s)}catch(e){return undefined}};
const kid=k=>encodeURIComponent(k).slice(0,1400);
function mergeVal(k,a,b,first){ // a: local, b: de la nube. Devuelve el texto combinado o undefined si esa clave no se combina
  const A=pj(a),B=pj(b);if(A===undefined||B===undefined)return undefined;
  const maxMap=(x,y)=>{const o=Object.assign({},x||{});for(const [i,v] of Object.entries(y||{}))o[i]=Math.max(+o[i]||0,+v||0);return o};
  if(k==='kr_tot')return String(Math.max(+A||0,+B||0));
  if(k==='kr_st'||k==='kr_lib_rm')return JSON.stringify(maxMap(A,B));
  if(k==='kr_lib'){const m=new Map();[...(Array.isArray(A)?A:[]),...(Array.isArray(B)?B:[])].forEach(x=>{if(x&&x.id){const o=m.get(x.id);if(!o||(+x.t||0)>(+o.t||0))m.set(x.id,x)}});
    const rm=maxMap(LS.obj('kr_lib_rm'),{});return JSON.stringify([...m.values()].filter(x=>!(rm[x.id]>=(+x.t||0))).sort((x,y)=>(+y.t||0)-(+x.t||0)).slice(0,40))}
  if(!first)return undefined;
  // primera vez en este dispositivo: se suman subrayados, marcadores y listas en vez de pisarlos
  if(Array.isArray(A)&&Array.isArray(B)){const id=x=>x&&(x.cfi||x.id)||JSON.stringify(x),seen=new Set(B.map(id));return JSON.stringify([...B,...A.filter(x=>!seen.has(id(x)))])}
  if(k==='kr_lists'&&A&&B&&typeof A==='object'&&typeof B==='object'){const o={};new Set([...Object.keys(A),...Object.keys(B)]).forEach(i=>{o[i]=Object.assign({},B[i]||{},A[i]||{})});return JSON.stringify(o)}
  return undefined;
}
const syMeta=()=>LS.obj('k_sync_m'),syHash=()=>LS.obj('k_sync_h');
const sySave=(m,h)=>{LS.set('k_sync_m',JSON.stringify(m));LS.set('k_sync_h',JSON.stringify(h))};
function syErr(e){SY.state=(e&&(e.code==='permission-denied'||/permission/i.test(e.message||'')))?'denied':'error';console.warn('sync',e);syncCard()}
// se marca como subido recién cuando la nube confirma: si la página se cierra a mitad, el cambio se reintenta la próxima vez
const pending=new Set();
async function pushKey(k){
  if(!SY.uid||pending.has(k))return;const v=LS.get(k),m=Date.now(),meta=syMeta();meta[k]=m;sySave(meta,syHash());
  if(v&&v.length>900000){console.warn('sync: muy grande',k);return}
  pending.add(k);
  try{await setDoc(doc(db,'userData',SY.uid,'k',kid(k)),{k,v:v==null?null:v,m});const hs=syHash();hs[k]=hsh(v);sySave(syMeta(),hs);if(SY.state!=='on'){SY.state='on';syncCard()}SY.at=Date.now()}
  catch(e){SY.failAt=Date.now();syErr(e)}
  finally{pending.delete(k)}
}
function scan(){
  if(!SY.ready||!SY.uid)return;if(SY.failAt&&Date.now()-SY.failAt<60000)return; // si la nube rechazó, se espera un minuto antes de reintentar
  const hs=syHash(),keys=new Set(Object.keys(hs));
  try{for(let i=0;i<localStorage.length;i++)keys.add(localStorage.key(i))}catch(e){}
  keys.forEach(k=>{if(syncable(k)&&hsh(LS.get(k))!==hs[k])pushKey(k)});
}
function applyRemote(docs){
  const meta=syMeta(),hs=syHash(),push=[];let changed=false;
  docs.forEach(d=>{const r=d.data()||{},k=r.k;if(!k||!syncable(k))return;
    const rv=r.v==null?null:String(r.v),rm=+r.m||0,lv=LS.get(k),lm=meta[k]||0,first=!(k in meta);
    if(lv!=null&&rv!=null&&(MERGE.has(k)||first)){const mv=mergeVal(k,lv,rv,first);
      if(mv!==undefined){if(mv!==lv){LS.set(k,mv);changed=true}meta[k]=Math.max(lm,rm);hs[k]=hsh(mv);if(mv!==rv)push.push(k);return}}
    if(rm>lm){if(lv!==rv){LS.set(k,rv);changed=true}meta[k]=rm;hs[k]=hsh(rv)}
  });
  sySave(meta,hs);push.forEach(pushKey);
  if(changed){clearTimeout(SY.ui);SY.ui=setTimeout(refreshAll,250)}
}
function refreshAll(){ // lo que llegó de otro dispositivo se ve sin recargar
  try{const m=$('mail');if(m&&document.activeElement!==m)m.value=LS.get('mail')||''}catch(e){}
  try{if(window.KReader){window.KReader.renderLibrary();window.KReader.continueReading()}}catch(e){}
  try{window.KPets&&window.KPets.refresh()}catch(e){}
}
function syncStart(u){
  syncStop();SY.uid=u.uid;SY.ready=false;SY.state='connecting';syncCard();
  if(LS.get('k_sync_uid')!==u.uid){LS.set('k_sync_m',null);LS.set('k_sync_h',null);LS.set('k_sync_uid',u.uid)} // otra cuenta en este dispositivo: se arranca de cero
  SY.unsub=onSnapshot(collection(db,'userData',u.uid,'k'),s=>{applyRemote(s.docs);SY.state='on';SY.at=SY.at||Date.now();if(!SY.ready){SY.ready=true;scan()}syncCard()},syErr);
}
function syncStop(){try{SY.unsub&&SY.unsub()}catch(e){}SY.unsub=null;SY.uid='';SY.ready=false;SY.state='off'}
setInterval(scan,15000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')scan()});
window.addEventListener('pagehide',scan);
window.KSync={now:scan};

function syncCard(){
  const host=document.querySelector('.view[data-view="ajustes"]');if(!host)return;
  let c=$('sync-set');if(!c){c=el('div','card');c.id='sync-set';c.style.marginTop='14px';const cfg=$('cfg');cfg?cfg.before(c):host.append(c)}
  c.textContent='';c.append(el('b','','Tu cuenta en todos tus dispositivos'));
  const p=t=>el('p','hint2',t);
  if(!S.user){c.append(p('Entrá con Google y tu biblioteca, lo que llevás leído, subrayados, marcadores, listas, meta y estadísticas se ven igual en el celular y en la compu.'));const b=btn('Entrar con Google',login);b.style.marginTop='10px';c.append(b);return}
  const who=S.user.email||S.user.displayName||'tu cuenta';
  if(SY.state==='denied')c.append(p('Entraste como '+who+', pero la nube todavía no acepta guardar tus datos (falta un permiso en Firebase). Mientras tanto todo queda en este dispositivo.'));
  else if(SY.state==='error')c.append(p('No se pudo sincronizar ahora. Se vuelve a intentar solo cuando haya conexión.'));
  else if(SY.state==='connecting')c.append(p('Conectando con '+who+'…'));
  else{c.append(p('✓ Sincronizado con '+who+'. Lo que hagas acá aparece en tus otros dispositivos al abrir Kinderly con la misma cuenta.'),p('Los EPUB que abriste desde un archivo propio no viajan: en el otro dispositivo volvé a elegir el archivo y sigue desde donde quedaste.'));
    const b=btn('Sincronizar ahora',()=>{scan();say('Sincronizado','ok')},true);b.style.marginTop='10px';c.append(b)}
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

// ----- Perfil: foto, usuario y mini bio -----
const myPhoto=()=>S.pic||(S.user&&S.user.photoURL)||'';
function paintMenu(){const h=$('menu-av');if(!h)return;const ph=myPhoto();if(!h.dataset.icon)h.dataset.icon=h.innerHTML;if(ph){const im=new Image();im.referrerPolicy='no-referrer';im.alt='';im.src=ph;h.textContent='';h.append(im)}else h.innerHTML=h.dataset.icon}
const shrink=file=>new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const m=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,256,256);URL.revokeObjectURL(u);let d=c.toDataURL('image/jpeg',.8);if(d.length>100000)d=c.toDataURL('image/jpeg',.55);res(d)};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('No se pudo leer esa imagen'))};im.src=u});
const saveMe=data=>setDoc(doc(db,'users',S.user.uid),Object.assign({updatedAt:serverTimestamp()},data),{merge:true});
const rulesHint=e=>(e&&(e.code==='permission-denied'||/permission/i.test(e.message||'')))?'Falta publicar las reglas nuevas de Firebase para guardar esto.':errMsg(e);
function renderProfile(){
  const body=$('pf-body');if(!body)return;body.textContent='';paintMenu();
  if(!S.user){const w=el('div','kf-c');w.append(el('h4','kf-t','Entrá para armar tu perfil'),el('p','hint2','Tu nombre de usuario, tu foto y tu mini bio se guardan con tu cuenta de Google.'));const b=btn('Entrar con Google',login);b.style.width='100%';w.append(b);body.append(w);return}
  const c=el('section','kf-c pf'),top=el('div','pf-top'),ph=myPhoto();
  if(ph){const im=new Image();im.referrerPolicy='no-referrer';im.alt='Tu foto';im.src=ph;im.className='pf-pic';top.append(im)}else{const a=el('div','pf-pic pf-ph',String(S.username||S.user.displayName||'?').charAt(0).toUpperCase());top.append(a)}
  const fi=el('input');fi.type='file';fi.accept='image/*';fi.hidden=true;fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;guardMsg(async()=>{const d=await shrink(f);await saveMe({pic:d});S.pic=d;renderProfile()},'Foto actualizada')};
  const col=el('div','pf-col');col.append(el('b','pf-u',S.username?'@'+S.username:'Sin nombre de usuario'));
  const acts=el('div','pf-acts');acts.append(btn(S.username?'Cambiar usuario':'Elegir usuario',()=>promptUsername(),true),btn('Cambiar foto',()=>fi.click(),true));if(S.pic)acts.append(btn('Quitar foto',()=>guardMsg(async()=>{await saveMe({pic:deleteField()});S.pic='';renderProfile()}),true));
  col.append(acts,fi);top.append(col);c.append(top);
  const l=el('label','pf-l','Mini bio');l.htmlFor='pf-bio';const ta=el('textarea');ta.id='pf-bio';ta.rows=4;ta.maxLength=300;ta.placeholder='Contá qué tipo de lectura te gusta: novela histórica, poesía, terror…';ta.value=S.bio||'';
  const n=el('small','pf-n',ta.value.length+' / 300');ta.oninput=()=>{n.textContent=ta.value.length+' / 300'};
  const sv=btn('Guardar',()=>guardMsg(async()=>{const t=ta.value.trim();await saveMe({bio:t});S.bio=t},'Perfil guardado'));sv.style.marginTop='10px';
  c.append(l,ta,n,sv);body.append(c);
}
async function guardMsg(fn,ok){try{await fn();if(ok)say(ok,'ok')}catch(e){say(rulesHint(e),'err')}}
function friendProfile(f){modal(f.name,async(bx,close)=>{
  const h=el('div');h.append(el('p','hint2','Cargando…'));bx.append(h);const a=el('div','kf-a');a.style.marginTop='12px';a.append(btn('Cerrar',close,true));bx.append(a);
  try{const s=await getDoc(doc(db,'users',f.uid)),u=(s.exists()&&s.data())||{};h.textContent='';const top=el('div','pf-top'),ph=u.pic||u.photo;if(ph){const im=new Image();im.referrerPolicy='no-referrer';im.alt='';im.src=ph;im.className='pf-pic';top.append(im)}else top.append(el('div','pf-pic pf-ph',String(f.name).charAt(0).toUpperCase()));const cl=el('div','pf-col');cl.append(el('b','pf-u',u.username?'@'+u.username:f.name));top.append(cl);h.append(top,el('p','pf-bio',u.bio||'Todavía no escribió su bio.'))}catch(e){h.textContent='';h.append(el('p','hint2',errMsg(e)))}
})}

// ----- Club de Lectura: clubReads/{id}, con progress/{uid} y notes/{capítulo_uid} -----
const CL={reads:[],prog:{},notes:{},denied:false,q:Promise.resolve(),pushT:{}};
const isIn=r=>!!S.user&&(r.joined||[]).includes(S.user.uid);
const lsDone=id=>{try{const v=localStorage.getItem('k_club_'+id);return v==null?null:+v}catch(e){return null}};
const setLsDone=(id,v)=>{try{localStorage.setItem('k_club_'+id,String(v))}catch(e){}};
const doneOf=r=>{const c=(CL.prog[r.id]||{})[S.user.uid];return Math.max(lsDone(r.id)||0,(c&&c.done)||0)};
const pushProg=(r,done,pct)=>setDoc(doc(db,'clubReads',r.id,'progress',S.user.uid),{uid:S.user.uid,name:myName(),done,pct:Math.round((pct||0)*1000)/1000,updatedAt:serverTimestamp()});
const whenLeft=ms=>{const d=Math.ceil((ms-Date.now())/864e5),f=new Date(ms).toLocaleDateString('es-AR',{day:'numeric',month:'long'});return d<0?'Venció el '+f:d===0?'Vence hoy':d===1?'Vence mañana':'Hasta el '+f+' · quedan '+d+' días'};
async function refreshClub(){if(!S.user)return;await Promise.all(CL.reads.filter(isIn).map(async r=>{try{const s=await getDocs(collection(db,'clubReads',r.id,'progress')),m={};s.docs.forEach(d=>{m[d.id]=d.data()});CL.prog[r.id]=m}catch(e){console.warn('club',e)}}));renderClub()}
const clubBadge=()=>{const b=$('club-bdg');if(!b)return;const n=S.user?CL.reads.filter(r=>!isIn(r)).length:0;b.textContent=n;b.style.display=n?'grid':'none'};
function renderClub(){
  clubBadge();const body=$('club-body');if(!body)return;body.textContent='';
  if(!S.user){const w=el('div','kf-c');w.append(el('h4','kf-t','Entrá para sumarte a un club'),el('p','hint2','Con tu cuenta podés proponer libros a tus amigos y comentar cada capítulo.'));const b=btn('Entrar con Google',login);b.style.width='100%';w.append(b);body.append(w);return}
  if(CL.denied){const w=el('div','kf-c');w.append(el('h4','kf-t','El Club todavía no está activado'),el('p','hint2','Faltan publicar las reglas nuevas de Firebase. Cuando estén, esta sección empieza a funcionar sola.'));body.append(w);return}
  const add=btn('Proponer un libro',propose);add.style.width='100%';body.append(add);
  const inv=CL.reads.filter(r=>!isIn(r)),act=CL.reads.filter(isIn);
  inv.forEach(r=>{const c=el('section','kf-c cl');c.append(el('small','cl-k',(r.fromName||'Un amigo')+' te invita'),el('h4','kf-t',r.title),el('small','cl-s',(r.author?r.author+' · ':'')+whenLeft(r.deadline)));const a=el('div','kf-a');a.append(btn('Sumarme',()=>guardMsg(()=>updateDoc(doc(db,'clubReads',r.id),{joined:arrayUnion(S.user.uid)}),'¡Te sumaste!')),btn('Ahora no',()=>guardMsg(()=>leave(r)),true));c.append(a);body.append(c)});
  act.forEach(r=>{const c=el('section','kf-c cl'),tot=(r.chapters||[]).length,done=doneOf(r);
    c.append(el('h4','kf-t',r.title),el('small','cl-s',(r.author?r.author+' · ':'')+whenLeft(r.deadline)));
    const ppl=el('div','cl-ppl'),pg=CL.prog[r.id]||{};(r.joined||[]).forEach(u=>{const p=pg[u]||{},row=el('div','cl-p'),bar=el('i','cl-bar'),fill=el('i');fill.style.width=Math.round((p.pct||0)*100)+'%';bar.append(fill);row.append(el('span','',u===S.user.uid?'Vos':((r.names||{})[u]||'Amigo')),bar,el('small','',Math.round((p.pct||0)*100)+'%'));ppl.append(row)});c.append(ppl);
    const a=el('div','kf-a');a.append(btn('Leer',()=>{if(window.KReader)window.KReader.open({title:r.title,author:r.author||'',url:r.url})}),btn('Comentarios'+(tot?' ('+Math.min(done,tot)+'/'+tot+')':''),()=>chapters(r),true),btn(r.from===S.user.uid?'Quitar':'Salir',()=>{if(confirm(r.from===S.user.uid?'¿Quitar esta lectura del club para todos?':'¿Salir de esta lectura?'))return guardMsg(()=>r.from===S.user.uid?deleteDoc(doc(db,'clubReads',r.id)):leave(r))},true));c.append(a);body.append(c)});
  if(!inv.length&&!act.length)body.append(el('p','hint2 cl-e','Todavía no hay lecturas. Proponé un libro de tu biblioteca y elegí con qué amigos leerlo.'));
}
const leave=r=>{const me=S.user.uid;return updateDoc(doc(db,'clubReads',r.id),{members:(r.members||[]).filter(x=>x!==me),joined:(r.joined||[]).filter(x=>x!==me)})};
function propose(){
  if(!S.friends.length){say('Primero agregá amigos: el club se arma con ellos','err');window.showView('amigos');return}
  let lib=[];try{lib=JSON.parse(localStorage.getItem('kr_lib')||'[]')}catch(e){}lib=lib.filter(x=>x.url&&hostOk(x.url)).slice(0,30);
  if(!lib.length){say('Abrí un libro desde Buscar: los que estén en tu biblioteca se pueden proponer','err');window.showView('buscar');return}
  modal('Proponer un libro',(bx,close)=>{
    bx.append(el('b','cl-l','Libro'));let sel=lib[0];lib.forEach((x,i)=>{const l=el('label','ks-radio'),r=el('input');r.type='radio';r.name='cl-b';r.checked=i===0;r.onchange=()=>{sel=x};l.append(r,el('span','',x.title));bx.append(l)});
    bx.append(el('small','cl-s','Solo aparecen libros con enlace: tus amigos no pueden abrir archivos de tu celular.'),el('b','cl-l','Con quién'));const who=new Set();S.friends.forEach(f=>{const l=el('label','ks-radio'),r=el('input');r.type='checkbox';r.onchange=()=>{r.checked?who.add(f):who.delete(f)};l.append(r,el('span','',f.name));bx.append(l)});
    const dl=el('label','cl-l','Plazo para terminarlo');dl.htmlFor='cl-d';const d=el('input');d.type='date';d.id='cl-d';const day=n=>new Date(Date.now()+n*864e5-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);d.min=day(1);d.value=day(30);bx.append(dl,d);
    const a=el('div','kf-a');a.style.marginTop='14px';a.append(btn('Cancelar',close,true),btn('Proponer',()=>guardMsg(async()=>{if(!who.size){say('Elegí al menos un amigo','err');return}const ms=new Date(d.value+'T23:59:59').getTime();if(!ms||ms<Date.now()){say('Elegí una fecha futura','err');return}
      const me=S.user.uid,names={[me]:myName()},mem=[me];who.forEach(f=>{mem.push(f.uid);names[f.uid]=f.name});
      await addDoc(collection(db,'clubReads'),{title:String(sel.title).slice(0,300),author:String(sel.author||'').slice(0,200),url:sel.url,from:me,fromName:myName(),members:mem,joined:[me],names,deadline:ms,chapters:[],createdAt:serverTimestamp()});close();say('Propuesta enviada','ok')})));bx.append(a);
  });
}
function chapters(r){modal('Comentarios: '+r.title,(bx,close)=>{const done=doneOf(r),L=r.chapters||[];
  if(!L.length)bx.append(el('p','hint2','Los capítulos aparecen cuando alguien abre el libro en Kinderly.'));
  else{bx.append(el('p','hint2','Cada capítulo se abre cuando lo terminás de leer, así nadie se adelanta.'));L.forEach((t,i)=>{const open=i<done,b=btn((open?'':'🔒 ')+t,()=>{close();chapterNote(r,i)},true);b.classList.add('cl-ch');b.disabled=!open;bx.append(b)})}
  const a=el('div','kf-a');a.style.marginTop='12px';a.append(btn('Cerrar',close,true));bx.append(a)})}
async function chapterNote(r,ch,fresh){
  const me=S.user.uid,ref=doc(db,'clubReads',r.id,'notes',ch+'_'+me),label=(r.chapters||[])[ch]||('Capítulo '+(ch+1));
  const stop=modal(fresh?'Terminaste “'+label+'”':label,async(bx,close)=>{
    const ta=el('textarea');ta.rows=4;ta.maxLength=600;ta.placeholder='¿Qué te pareció hasta acá?';ta.setAttribute('aria-label','Qué te pareció hasta acá');const others=el('div','cl-notes');
    const a=el('div','kf-a');a.append(btn(fresh?'Después':'Cerrar',close,true),btn('Guardar',()=>guardMsg(async()=>{const t=ta.value.trim();if(!t){say('Escribí algo o tocá “'+(fresh?'Después':'Cerrar')+'”','err');return}await setDoc(ref,{uid:me,name:myName(),ch,text:t,updatedAt:serverTimestamp()});close();say('Comentario guardado','ok')})));
    bx.append(ta,a,others);
    try{const s=await getDocs(collection(db,'clubReads',r.id,'notes'));s.docs.map(d=>d.data()).filter(n=>n.ch===ch).forEach(n=>{if(n.uid===me){if(!ta.value)ta.value=n.text;return}const it=el('div','cl-note');it.append(el('b','',n.name||'Amigo'),el('p','',n.text));others.append(it)})}catch(e){console.warn('club',e)}
  });
  const ovs=document.querySelectorAll('.ks-ov');if(ovs.length)ovs[ovs.length-1].style.zIndex=40; // por encima del lector
  return stop;
}
window.KClub={
  has:url=>!!S.user&&CL.reads.some(r=>r.url===url&&isIn(r)),
  onProgress:p=>{CL.q=CL.q.then(async()=>{const r=CL.reads.find(x=>x.url===p.url&&isIn(x));if(!r)return;
    if(!(r.chapters||[]).length){r.chapters=p.labels.slice(0,200).map(x=>String(x).slice(0,80));await updateDoc(doc(db,'clubReads',r.id),{chapters:r.chapters})}
    let known=lsDone(r.id);
    if(known==null){const s=await getDoc(doc(db,'clubReads',r.id,'progress',S.user.uid));if(s.exists())known=s.data().done||0;else{known=p.done;await pushProg(r,known,p.pct)}setLsDone(r.id,known)} // el punto de partida es donde ya venía leyendo
    if(p.crossed&&p.done>known){setLsDone(r.id,p.done);await pushProg(r,p.done,p.pct);chapterNote(r,p.done-1,true);return}
    if(Date.now()-(CL.pushT[r.id]||0)>30000){CL.pushT[r.id]=Date.now();await pushProg(r,Math.max(known,0),p.pct)}
  }).catch(e=>console.warn('club',e))}
};
{const st=document.createElement('style');st.textContent='.pf-top{display:flex;align-items:center;gap:16px}.pf-pic{width:84px;height:84px;border-radius:50%;object-fit:cover;flex:none}.pf-ph{display:grid;place-items:center;background:var(--soft);color:var(--green);font:600 2rem var(--serif)}.pf-col{min-width:0;flex:1}.pf-u{display:block;font:600 1.15rem var(--serif);overflow-wrap:anywhere;margin-bottom:8px}.pf-acts{display:flex;flex-wrap:wrap;gap:6px}.pf-acts button{padding:7px 12px;font-size:.8rem}.pf-l{display:block;font-weight:600;margin:16px 0 6px}.pf textarea,.ks-box textarea,.ks-box input[type=date]{box-sizing:border-box;width:100%;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);padding:10px 12px;font:inherit}.pf-n{display:block;text-align:right;color:var(--mute);margin-top:4px}.pf-bio{white-space:pre-wrap;overflow-wrap:anywhere;margin:14px 0 0}'+
'.cl .kf-t{margin:0 0 2px}.cl-k{display:block;color:var(--green);font-weight:600;margin-bottom:2px}.cl-s{display:block;color:var(--mute);font-size:.84rem}.cl-l{display:block;font-weight:600;margin:14px 0 6px}.cl-ppl{margin:12px 0;display:grid;gap:7px}.cl-p{display:grid;grid-template-columns:minmax(0,88px) 1fr 38px;gap:8px;align-items:center;font-size:.86rem}.cl-p span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cl-p small{text-align:right;color:var(--mute)}.cl-bar{display:block;height:6px;border-radius:3px;background:var(--line);overflow:hidden}.cl-bar i{display:block;height:100%;background:var(--green)}.kf-c.cl .kf-a{display:flex!important;flex-wrap:wrap;gap:8px}.kf-c.cl .kf-a button{flex:1 1 auto;width:auto;min-width:0;white-space:nowrap}.cl-ch{display:block;width:100%;text-align:left;margin-top:6px}.cl-ch:disabled{opacity:.55}.cl-note{border-top:1px solid var(--line);margin-top:12px;padding-top:10px}.cl-note p{margin:3px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.cl-e{margin-top:14px}.ks-box{background:var(--card)!important}.ks-box .kf-a{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:12px}';document.head.append(st)}
{const tb=document.querySelector('nav.tabs button[data-go="club"]');if(tb)tb.addEventListener('click',()=>refreshClub())}

window.KSoc={loggedIn:()=>!!auth.currentUser,canSend:()=>!!auth.currentUser,email:()=>(auth.currentUser&&auth.currentUser.email)||'',ensureToken,driveToken,sendMail,sendFile,decorate,openPanel,syncLib:syncLibSoon};

onAuthStateChanged(auth,async u=>{
  unsubscribe();S.user=u||null;S.username='';
  if(u){syncStart(u);await upsertProfile(u);subscribe();syncLibSoon();if(!S.username)setTimeout(()=>promptUsername(),600)}else{clearToken();syncStop()}
  render();renderSug();syncCard();renderProfile();renderClub();
});
render();renderSug();syncCard();renderProfile();renderClub();
