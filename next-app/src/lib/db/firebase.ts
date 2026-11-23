/* Firebase adapter: Google sign-in (BITS accounts only) + Cloud Firestore.
   Security is enforced by firestore.rules on Google's servers, not by this code.
   The SDK is loaded lazily, so demo mode never downloads it. */
import { ALLOWED_EMAIL, DEFAULT_SETTINGS, firebaseConfig } from "../config";
import { PUBLIC_FILTER, now, type Adapter, type AuthUser, type Doc } from "./adapter";

type FB = typeof import("firebase/firestore") & typeof import("firebase/auth") & typeof import("firebase/app");

export function firebaseAdapter(): Adapter {
  let fb: FB;
  let auth: import("firebase/auth").Auth;
  let fs: import("firebase/firestore").Firestore;
  let user: AuthUser | null = null;
  const listeners = new Set<(u: AuthUser | null) => void>();
  // Local emulators: open the site on localhost with ?emulator=1
  const useEmulator = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("emulator");

  const mapUser = (u: import("firebase/auth").User | null): AuthUser | null =>
    u ? { uid: u.uid, email: u.email || "", name: u.displayName || (u.email || "").split("@")[0], photo: u.photoURL || "" } : null;
  // "events/abc/rsvps" style sub-collection paths are allowed
  const ref = (c: string, id?: string) => (id ? fb.doc(fs, c, id) : fb.collection(fs, c));

  return {
    mode: "firebase",
    async init() {
      const [app, a, f] = await Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore")]);
      fb = { ...app, ...a, ...f } as FB;
      const firebaseApp = fb.initializeApp(firebaseConfig!);
      auth = fb.getAuth(firebaseApp);
      try { fs = fb.initializeFirestore(firebaseApp, { localCache: fb.persistentLocalCache({ tabManager: fb.persistentMultipleTabManager() }) }); }
      catch { fs = fb.getFirestore(firebaseApp); }
      if (useEmulator) {
        fb.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        fb.connectFirestoreEmulator(fs, "127.0.0.1", 8080);
      }
      await new Promise<void>((res) => {
        fb.onAuthStateChanged(auth, async (u) => {
          if (u && !ALLOWED_EMAIL.test(u.email || "")) { await fb.signOut(auth); return; }
          user = mapUser(u);
          listeners.forEach((cb) => cb(user));
          res();
        });
      });
    },
    onAuth(cb) { listeners.add(cb); cb(user); return () => { listeners.delete(cb); }; },
    currentUser: () => user,
    async signIn(opts) {
      const provider = new fb.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      // Local testing only: the Auth emulator accepts fake Google tokens. Never active on a real domain.
      const res = useEmulator && opts?.email
        ? await fb.signInWithCredential(auth, fb.GoogleAuthProvider.credential(JSON.stringify({ sub: "emu-" + opts.email, email: opts.email, email_verified: true, name: opts.name })))
        : await fb.signInWithPopup(auth, provider);
      if (!ALLOWED_EMAIL.test(res.user.email || "")) { await fb.signOut(auth); throw new Error("not-bits"); }
      user = mapUser(res.user);
      return user!;
    },
    async signOut() { await fb.signOut(auth); },

    async get(c, id) { const s = await fb.getDoc(ref(c, id) as import("firebase/firestore").DocumentReference); return s.exists() ? ({ id: s.id, ...s.data() } as Doc) : null; },
    async list(c, { all = false, where } = {}) {
      const cons: import("firebase/firestore").QueryConstraint[] = [];
      const f = !all && PUBLIC_FILTER[c];
      if (f) cons.push(fb.where(f[0], "==", f[1]));
      if (where) cons.push(fb.where(where[0], "==", where[1]));
      const coll = ref(c) as import("firebase/firestore").CollectionReference;
      const snap = await fb.getDocs(cons.length ? fb.query(coll, ...cons) : coll);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Doc);
    },
    async set(c, id, data, { merge = true } = {}) {
      const clean = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && k !== "id"));
      if (id) { await fb.setDoc(ref(c, id) as import("firebase/firestore").DocumentReference, clean, { merge }); return id; }
      const d = await fb.addDoc(ref(c) as import("firebase/firestore").CollectionReference, clean);
      return d.id;
    },
    async remove(c, id) { await fb.deleteDoc(ref(c, id) as import("firebase/firestore").DocumentReference); },
    async isAdmin(email) {
      try { return (await fb.getDoc(ref("admins", String(email).toLowerCase()) as import("firebase/firestore").DocumentReference)).exists(); } catch { return false; }
    },
    async listAdmins() { return (await fb.getDocs(ref("admins") as import("firebase/firestore").CollectionReference)).docs.map((d) => ({ id: d.id, ...d.data() }) as Doc); },
    async setAdmin(email, on) {
      const e = String(email).toLowerCase();
      const r = ref("admins", e) as import("firebase/firestore").DocumentReference;
      if (on) await fb.setDoc(r, { email: e, addedAt: now() }); else await fb.deleteDoc(r);
    },
    async getSettings() {
      try { const s = await fb.getDoc(ref("settings", "site") as import("firebase/firestore").DocumentReference); return { ...DEFAULT_SETTINGS, ...(s.exists() ? s.data() : {}) }; }
      catch { return { ...DEFAULT_SETTINGS }; }
    },
    async saveSettings(s) { await fb.setDoc(ref("settings", "site") as import("firebase/firestore").DocumentReference, s, { merge: true }); },
    async reset() {},
  };
}
