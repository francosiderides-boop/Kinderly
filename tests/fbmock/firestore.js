// Firestore de mentira para las pruebas (solo lo que usa social.js). No aplica reglas de seguridad.
// window.__fdb = {coleccion: {id: datos}}; window.__fdbDeny = true simula que las reglas rechazan userData.
// como la nube real, sobrevive a recargar la página (se guarda en sessionStorage de la pestaña)
let saved = null; try { saved = JSON.parse(sessionStorage.getItem('__fdb') || 'null') } catch (e) {}
const DB = window.__fdb = saved || window.__fdb || {};
const subs = [];
const DEL = {__del: 1}, TS = {__ts: 1};
let auto = 0;
const col = c => (DB[c] = DB[c] || {});
const clean = v => v === TS ? {seconds: Math.floor(Date.now() / 1000)} : v;
const notify = () => { try { sessionStorage.setItem('__fdb', JSON.stringify(DB)) } catch (e) {} subs.forEach(s => s.fire()) };
const denied = c => window.__fdbDeny && c.startsWith('userData');
const deny = () => Object.assign(new Error('Missing or insufficient permissions.'), {code: 'permission-denied'});
export const getFirestore = () => ({});
export const doc = (_, ...seg) => ({c: seg.slice(0, -1).join('/'), id: seg[seg.length - 1]});
export const collection = (_, ...seg) => ({c: seg.join('/')});
export const where = (f, op, v) => ({f, op, v});
export const limit = n => ({limit: n});
export const query = (ref, ...conds) => ({c: ref.c, conds: conds.filter(x => x.f)});
export const serverTimestamp = () => TS;
export const deleteField = () => DEL;
export const arrayUnion = (...a) => ({__union: a});
const snapDoc = (c, id) => ({id, exists: () => !!col(c)[id], data: () => col(c)[id] && JSON.parse(JSON.stringify(col(c)[id]))});
export async function getDoc(r) { return snapDoc(r.c, r.id) }
export async function setDoc(r, data, opt) {
  if (denied(r.c)) throw deny();
  const cur = opt && opt.merge ? Object.assign({}, col(r.c)[r.id] || {}) : {};
  for (const [k, v] of Object.entries(data)) { if (v === DEL) delete cur[k]; else cur[k] = clean(v) }
  col(r.c)[r.id] = cur; notify();
}
export async function updateDoc(r, data) { if (!col(r.c)[r.id]) throw new Error('no doc'); await setDoc(r, data, {merge: true}) }
export async function deleteDoc(r) { delete col(r.c)[r.id]; notify() }
export async function addDoc(ref, data) { const id = 'a' + (++auto); await setDoc({c: ref.c, id}, data); return {id} }
const match = (d, w) => w.op === '==' ? d[w.f] === w.v : w.op === 'array-contains' ? (d[w.f] || []).includes(w.v) : true;
const run = q => { const docs = Object.entries(col(q.c)).filter(([, d]) => (q.conds || []).every(w => match(d, w))).map(([id]) => snapDoc(q.c, id)); return {docs, empty: !docs.length} };
export async function getDocs(q) { return run(q) }
export function onSnapshot(q, cb, err) {
  if (denied(q.c)) { setTimeout(() => err && err(deny()), 0); return () => {} }
  const s = {fire: () => cb(run(q))}; subs.push(s); setTimeout(s.fire, 0); return () => subs.splice(subs.indexOf(s), 1);
}
// para simular un cambio hecho desde otro dispositivo
window.__fdbSet = (c, id, data) => { col(c)[id] = data; notify() };
