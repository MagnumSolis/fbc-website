/* ==========================================================
   Data layer. One API, two engines:
   - "demo":     localStorage, seeded with sample data. No setup.
   - "firebase": Firebase Auth (Google, BITS emails only) + Firestore.
   The rest of the app only talks to the exported `db` object.

   Firestore layout (see firestore.rules for who can do what):
     users/{uid}                     member profile
     users/{uid}/rsvps/{eventId}     my RSVPs
     ventures/{founderUid}           one venture per founder
     applications/{ventureId_uid}    builder -> venture applications
     events/{id}                     events (admin-managed)
     events/{id}/rsvps/{uid}         attendees
     opportunities/{id}, posts/{id}, resources/{id}   admin-managed content
     messages/{id}                   contact form, newsletter, opportunity submissions
     ideaChecks/{id}                 saved idea checks (signed-in members)
     settings/site                   links, announcement, VistaDex copy
     admins/{email}                  who can use the admin console
   ========================================================== */
import { config } from "./config.js";
import { SEED } from "./content.js";

const PUBLIC_FILTER = { ventures: ["status", "live"], events: ["published", true], opportunities: ["status", "live"], posts: ["published", true] };
const SEEDABLE = ["events", "opportunities", "posts", "resources"];
const now = () => new Date().toISOString();
export const isAllowedEmail = (e) => config.allowedEmail.test(String(e || "").trim());
export const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

/* ==========================================================
   DEMO ENGINE (localStorage)
   ========================================================== */
function demoEngine() {
  const KEY = "fbc_demo_db_v2";
  let mem = null;
  const load = () => {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (!mem) {
      mem = { session: null, admins: {}, settings: { site: { ...config.site } } };
      const put = (col, id, d) => { (mem[col] ||= {})[id] = { id, ...d }; };
      SEEDABLE.forEach((c) => SEED[c].forEach((d) => put(c, d.id, { ...d, createdAt: now() })));
      SEED.demoUsers.forEach((u) => put("users", u.uid, { ...u, demo: true, createdAt: now() }));
      SEED.demoVentures.forEach((v) => {
        const f = SEED.demoUsers.find((u) => u.uid === v.founderUid);
        put("ventures", v.founderUid, { ...v, founderName: f.name, founderYear: f.year, status: "live", pitchNight: true, createdAt: now(), updatedAt: now() });
      });
    }
    return mem;
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} };
  const col = (c) => (load()[c] ||= {});
  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb(current()));
  const current = () => { const s = load().session; return s ? { ...s } : null; };

  return {
    mode: "demo",
    async init() { load(); },
    onAuth(cb) { listeners.add(cb); cb(current()); return () => listeners.delete(cb); },
    currentUser: current,
    async signIn({ name, email } = {}) {
      if (!isAllowedEmail(email)) throw new Error("not-bits");
      const users = col("users");
      const existing = Object.values(users).find((u) => u.email?.toLowerCase() === email.toLowerCase() && !u.demo);
      const uid = existing?.id || "local-" + Math.random().toString(36).slice(2, 10);
      load().session = { uid, email, name: name || existing?.name || email.split("@")[0], photo: "" };
      // In demo mode the first real visitor is an admin, so the team can explore the console.
      if (!Object.keys(load().admins).length) load().admins[email.toLowerCase()] = { email, addedAt: now() };
      save(); emit();
      return current();
    },
    async signOut() { load().session = null; save(); emit(); },

    async get(c, id) { const d = col(c)[id]; return d ? { ...d } : null; },
    async list(c, { all = false, where } = {}) {
      let rows = Object.values(col(c));
      const f = !all && PUBLIC_FILTER[c];
      if (f) rows = rows.filter((r) => r[f[0]] === f[1]);
      if (where) rows = rows.filter((r) => r[where[0]] === where[1]);
      return rows.map((r) => ({ ...r }));
    },
    async set(c, id, data, { merge = true } = {}) {
      const coll = col(c);
      id ||= c.slice(0, 3) + "-" + Math.random().toString(36).slice(2, 9);
      coll[id] = { ...(merge ? coll[id] : {}), ...data, id };
      save();
      return id;
    },
    async remove(c, id) { delete col(c)[id]; save(); },
    async isAdmin(email) { return !!load().admins[String(email).toLowerCase()]; },
    async listAdmins() { return Object.values(load().admins); },
    async setAdmin(email, on) { const e = email.toLowerCase(); if (on) load().admins[e] = { email: e, addedAt: now() }; else delete load().admins[e]; save(); },
    async getSettings() { return { ...config.site, ...(load().settings?.site || {}) }; },
    async saveSettings(s) { load().settings.site = { ...load().settings.site, ...s }; save(); },
    async reset() { localStorage.removeItem(KEY); mem = null; load(); save(); emit(); },
  };
}

/* ==========================================================
   FIREBASE ENGINE
   ========================================================== */
function firebaseEngine() {
  let fb = {}, auth, fs, user = null;
  const base = `https://www.gstatic.com/firebasejs/${config.sdkVersion}`;
  const listeners = new Set();
  // Local emulators: open the site on localhost with ?emulator=1
  const useEmulator = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("emulator");

  const mapUser = (u) => (u ? { uid: u.uid, email: u.email, name: u.displayName || u.email.split("@")[0], photo: u.photoURL || "" } : null);
  const snapToObj = (s) => (s.exists() ? { id: s.id, ...s.data() } : null);
  const ref = (c, id) => {
    // "events/abc/rsvps" style paths are allowed for c
    const parts = c.split("/");
    return id ? fb.doc(fs, ...parts, id) : fb.collection(fs, ...parts);
  };

  return {
    mode: "firebase",
    async init() {
      const [app, a, f] = await Promise.all([
        import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-firestore.js`),
      ]);
      fb = { ...app, ...a, ...f };
      const firebaseApp = fb.initializeApp(config.firebase);
      auth = fb.getAuth(firebaseApp);
      try {
        fs = fb.initializeFirestore(firebaseApp, { localCache: fb.persistentLocalCache({ tabManager: fb.persistentMultipleTabManager() }) });
      } catch { fs = fb.getFirestore(firebaseApp); }
      if (useEmulator) {
        fb.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        fb.connectFirestoreEmulator(fs, "127.0.0.1", 8080);
      }
      await new Promise((res) => {
        const off = fb.onAuthStateChanged(auth, async (u) => {
          if (u && !isAllowedEmail(u.email)) { await fb.signOut(auth); return; }
          user = mapUser(u);
          listeners.forEach((cb) => cb(user));
          res();
        });
        void off;
      });
    },
    onAuth(cb) { listeners.add(cb); cb(user); return () => listeners.delete(cb); },
    currentUser: () => user,
    async signIn() {
      const provider = new fb.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      // Local testing only: the Auth emulator accepts fake Google tokens. Never active on a real domain.
      const emuLogin = useEmulator && window.__fbcEmuLogin;
      const res = emuLogin
        ? await fb.signInWithCredential(auth, fb.GoogleAuthProvider.credential(JSON.stringify({ sub: "emu-" + emuLogin.email, email: emuLogin.email, email_verified: true, name: emuLogin.name })))
        : await fb.signInWithPopup(auth, provider);
      if (!isAllowedEmail(res.user.email)) { await fb.signOut(auth); throw new Error("not-bits"); }
      user = mapUser(res.user);
      return user;
    },
    async signOut() { await fb.signOut(auth); },

    async get(c, id) { return snapToObj(await fb.getDoc(ref(c, id))); },
    async list(c, { all = false, where } = {}) {
      const cons = [];
      const f = !all && PUBLIC_FILTER[c];
      if (f) cons.push(fb.where(f[0], "==", f[1]));
      if (where) cons.push(fb.where(where[0], "==", where[1]));
      const snap = await fb.getDocs(cons.length ? fb.query(ref(c), ...cons) : ref(c));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    async set(c, id, data, { merge = true } = {}) {
      const clean = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && k !== "id"));
      if (id) { await fb.setDoc(ref(c, id), clean, { merge }); return id; }
      const d = await fb.addDoc(ref(c), clean);
      return d.id;
    },
    async remove(c, id) { await fb.deleteDoc(ref(c, id)); },
    async isAdmin(email) {
      try { return (await fb.getDoc(ref("admins", String(email).toLowerCase()))).exists(); } catch { return false; }
    },
    async listAdmins() { return (await fb.getDocs(ref("admins"))).docs.map((d) => ({ id: d.id, ...d.data() })); },
    async setAdmin(email, on) {
      const e = String(email).toLowerCase();
      if (on) await fb.setDoc(ref("admins", e), { email: e, addedAt: now() }); else await fb.deleteDoc(ref("admins", e));
    },
    async getSettings() {
      try { const s = await fb.getDoc(ref("settings", "site")); return { ...config.site, ...(s.exists() ? s.data() : {}) }; }
      catch { return { ...config.site }; }
    },
    async saveSettings(s) { await fb.setDoc(ref("settings", "site"), s, { merge: true }); },
    async reset() {},
  };
}

/* ==========================================================
   PUBLIC API: what the app uses
   ========================================================== */
const engine = config.firebase ? firebaseEngine() : demoEngine();

export const db = {
  get mode() { return engine.mode; },
  init: () => engine.init(),
  onAuth: (cb) => engine.onAuth(cb),
  user: () => engine.currentUser(),
  signIn: (opts) => engine.signIn(opts),
  signOut: () => engine.signOut(),
  reset: () => engine.reset(),

  /* settings */
  getSettings: () => engine.getSettings(),
  saveSettings: (s) => engine.saveSettings({ ...s, updatedAt: now() }),

  /* public content */
  list: (c, opts) => engine.list(c, opts),
  get: (c, id) => engine.get(c, id),

  /* profiles */
  getProfile: (uid) => engine.get("users", uid),
  async saveProfile(uid, data) {
    const u = engine.currentUser();
    const profile = { ...data, email: u.email, updatedAt: now() };
    delete profile.id;
    // Trim to the limits enforced in firestore.rules (AI-imported text can run long).
    const LIMITS = { name: 80, year: 60, bio: 200, linkedin: 200, work: 800, vname: 80, vpitch: 250, vproblem: 800, commit: 60 };
    for (const [k, max] of Object.entries(LIMITS)) if (typeof profile[k] === "string") profile[k] = profile[k].slice(0, max);
    for (const k of ["skills", "needs", "domains"]) if (Array.isArray(profile[k])) profile[k] = profile[k].slice(0, 10);
    if (!["founder", "builder", "explorer"].includes(profile.role)) profile.role = "builder";
    const existing = await engine.get("users", uid);
    if (!existing) profile.createdAt = now();
    await engine.set("users", uid, profile);
    // Founders: keep their public venture listing in sync with their profile.
    if (profile.role === "founder" && profile.vname) {
      const v = await engine.get("ventures", uid);
      await engine.set("ventures", uid, {
        founderUid: uid, founderName: profile.name, founderYear: profile.year || "",
        name: profile.vname, stage: Number(profile.vstage) || 0, pitch: profile.vpitch || "", problem: profile.vproblem || "",
        domains: profile.domains || [], needs: profile.needs || [], commitment: profile.commit || "", equity: profile.equity || "",
        pitchNight: !!profile.pitchnight,
        status: v?.status || "live", createdAt: v?.createdAt || now(), updatedAt: now(),
      });
    }
    return profile;
  },
  members: (role) => engine.list("users", role ? { where: ["role", role] } : {}),
  myVenture: (uid) => engine.get("ventures", uid),
  setVentureStatus: (uid, status) => engine.set("ventures", uid, { status, updatedAt: now() }),

  /* applications */
  async apply(venture, message, me) {
    const id = `${venture.id}_${me.uid}`;
    await engine.set("applications", id, {
      ventureId: venture.id, ventureName: venture.name, founderUid: venture.founderUid,
      applicantUid: me.uid, applicantName: me.name || "", applicantEmail: me.email, applicantYear: me.year || "",
      applicantSkills: me.skills || [], message: String(message).slice(0, 2000), status: "new", createdAt: now(),
    }, { merge: false });
    return id;
  },
  myApplications: (uid) => engine.list("applications", { where: ["applicantUid", uid] }),
  applicationsToMe: (uid) => engine.list("applications", { where: ["founderUid", uid] }),
  setApplicationStatus: (id, status) => engine.set("applications", id, { status, updatedAt: now() }),
  withdrawApplication: (id) => engine.remove("applications", id),

  /* events */
  async rsvp(eventId, me, on) {
    if (on) {
      await engine.set(`events/${eventId}/rsvps`, me.uid, { uid: me.uid, name: me.name || "", email: me.email, createdAt: now() }, { merge: false });
      await engine.set(`users/${me.uid}/rsvps`, eventId, { eventId, createdAt: now() }, { merge: false });
    } else {
      await engine.remove(`events/${eventId}/rsvps`, me.uid);
      await engine.remove(`users/${me.uid}/rsvps`, eventId);
    }
  },
  async myRsvps(uid) { return (await engine.list(`users/${uid}/rsvps`, { all: true })).map((r) => r.id); },
  eventRsvps: (eventId) => engine.list(`events/${eventId}/rsvps`, { all: true }),

  /* messages: contact form, newsletter, opportunity submissions */
  sendMessage: (m) => engine.set("messages", null, {
    type: m.type, name: String(m.name || "").slice(0, 120), email: String(m.email || "").slice(0, 200),
    body: String(m.body || "").slice(0, 4000), extra: String(m.extra || "").slice(0, 200), createdAt: now(),
  }),
  saveIdeaCheck: (uid, check) => engine.set("ideaChecks", null, { uid, ...check, createdAt: now() }),
  myIdeaChecks: (uid) => engine.list("ideaChecks", { where: ["uid", uid] }),

  /* admin */
  isAdmin: (email) => engine.isAdmin(email),
  listAdmins: () => engine.listAdmins(),
  setAdmin: (email, on) => engine.setAdmin(email, on),
  adminList: (c) => engine.list(c, { all: true }),
  adminSave: (c, id, data) => engine.set(c, id, { ...data, updatedAt: now() }),
  adminDelete: (c, id) => engine.remove(c, id),
  async seed() {
    let n = 0;
    for (const c of SEEDABLE) {
      for (const d of SEED[c]) {
        if (!(await engine.get(c, d.id))) { await engine.set(c, d.id, { ...d, createdAt: now() }, { merge: false }); n++; }
      }
    }
    return n;
  },
};
