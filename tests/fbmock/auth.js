// Usuario de prueba ya logueado (uid u1).
const user = {uid: 'u1', displayName: 'Franco', email: 'franco@example.test', photoURL: ''};
const auth = {currentUser: user};
export const getAuth = () => auth;
export class GoogleAuthProvider { addScope() {} setCustomParameters() {} static credentialFromResult() { return null } }
export const signInWithPopup = async () => ({user});
export const signOut = async () => {};
export const onAuthStateChanged = (_, cb) => { setTimeout(() => cb(user), 0); return () => {} };
