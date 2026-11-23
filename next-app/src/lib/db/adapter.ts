/* The contract every backend adapter implements.
   Pages never talk to Firebase (or any database) directly; they use `db` from ./index.ts,
   which delegates to one of these adapters. To move to Supabase later, write
   ./supabase.ts implementing this interface and select it in config.ts. */
import type { SiteSettings } from "../config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = Record<string, any> & { id: string };

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  photo: string;
}

export interface ListOptions {
  /** true = admin view, skip the public filter (status == live, published == true) */
  all?: boolean;
  /** single equality filter: [field, value] */
  where?: [string, unknown];
}

export interface Adapter {
  readonly mode: "demo" | "firebase";
  init(): Promise<void>;
  onAuth(cb: (u: AuthUser | null) => void): () => void;
  currentUser(): AuthUser | null;
  /** demo mode passes name/email; Firebase opens the Google pop-up */
  signIn(opts?: { name?: string; email?: string }): Promise<AuthUser>;
  signOut(): Promise<void>;

  get(col: string, id: string): Promise<Doc | null>;
  list(col: string, opts?: ListOptions): Promise<Doc[]>;
  /** create (id = null) or write; returns the id */
  set(col: string, id: string | null, data: Record<string, unknown>, opts?: { merge?: boolean }): Promise<string>;
  remove(col: string, id: string): Promise<void>;

  isAdmin(email: string): Promise<boolean>;
  listAdmins(): Promise<Doc[]>;
  setAdmin(email: string, on: boolean): Promise<void>;
  getSettings(): Promise<SiteSettings>;
  saveSettings(s: Partial<SiteSettings>): Promise<void>;
  reset(): Promise<void>;
}

/** Public pages only see live/published items. */
export const PUBLIC_FILTER: Record<string, [string, unknown]> = {
  ventures: ["status", "live"],
  events: ["published", true],
  opportunities: ["status", "live"],
  posts: ["published", true],
};

export const now = () => new Date().toISOString();
