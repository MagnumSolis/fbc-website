/* Demo adapter: everything in the visitor's browser (localStorage), seeded with sample data.
   Used when no Firebase keys are configured. */
import { ALLOWED_EMAIL, DEFAULT_SETTINGS, type SiteSettings } from "../config";
import { SEED } from "../content";
import { PUBLIC_FILTER, now, type Adapter, type AuthUser, type Doc } from "./adapter";

const KEY = "fbc_demo_db_v2"; // same key as the original site, so existing demo data carries over
const SEEDABLE = ["events", "opportunities", "posts", "resources"] as const;

interface Store {
  session: AuthUser | null;
  admins: Record<string, { email: string; addedAt: string }>;
  settings: { site: Partial<SiteSettings> };
  [col: string]: unknown;
}

export function demoAdapter(): Adapter {
  let mem: Store | null = null;
  const listeners = new Set<(u: AuthUser | null) => void>();

  const load = (): Store => {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { mem = null; }
    if (!mem) {
      const m: Store = { session: null, admins: {}, settings: { site: { ...DEFAULT_SETTINGS } } };
      const put = (c: string, id: string, d: Record<string, unknown>) => {
        const coll = (m[c] ||= {}) as Record<string, Doc>;
        coll[id] = { ...d, id };
      };
      SEEDABLE.forEach((c) => SEED[c].forEach((d) => put(c, d.id, { ...d, createdAt: now() })));
      SEED.demoUsers.forEach((u) => put("users", u.uid, { ...u, demo: true, createdAt: now() }));
      SEED.demoVentures.forEach((v) => {
        const f = SEED.demoUsers.find((u) => u.uid === v.founderUid)!;
        put("ventures", v.founderUid, { ...v, founderName: f.name, founderYear: f.year, status: "live", pitchNight: true, createdAt: now(), updatedAt: now() });
      });
      mem = m;
    }
    return mem;
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* storage full or blocked */ } };
  const col = (c: string) => ((load()[c] ||= {}) as Record<string, Doc>);
  const current = () => (load().session ? { ...load().session! } : null);
  const emit = () => listeners.forEach((cb) => cb(current()));

  return {
    mode: "demo",
    async init() { load(); },
    onAuth(cb) { listeners.add(cb); cb(current()); return () => { listeners.delete(cb); }; },
    currentUser: current,
    async signIn({ name, email } = {}) {
      if (!email || !ALLOWED_EMAIL.test(email)) throw new Error("not-bits");
      const existing = Object.values(col("users")).find((u) => String(u.email).toLowerCase() === email.toLowerCase() && !u.demo);
      const uid = existing?.id || "local-" + Math.random().toString(36).slice(2, 10);
      load().session = { uid, email, name: name || existing?.name || email.split("@")[0], photo: "" };
      // In demo mode the first real visitor is an admin, so the team can explore the console.
      if (!Object.keys(load().admins).length) load().admins[email.toLowerCase()] = { email, addedAt: now() };
      save(); emit();
      return current()!;
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
      const key = id || c.slice(0, 3) + "-" + Math.random().toString(36).slice(2, 9);
      coll[key] = { ...(merge ? coll[key] : {}), ...data, id: key };
      save();
      return key;
    },
    async remove(c, id) { delete col(c)[id]; save(); },
    async isAdmin(email) { return !!load().admins[String(email).toLowerCase()]; },
    async listAdmins() { return Object.values(load().admins).map((a) => ({ ...a, id: a.email })); },
    async setAdmin(email, on) {
      const e = email.toLowerCase();
      if (on) load().admins[e] = { email: e, addedAt: now() }; else delete load().admins[e];
      save();
    },
    async getSettings() { return { ...DEFAULT_SETTINGS, ...(load().settings?.site || {}) }; },
    async saveSettings(s) { load().settings.site = { ...load().settings.site, ...s }; save(); },
    async reset() { localStorage.removeItem(KEY); mem = null; load(); save(); emit(); },
  };
}
