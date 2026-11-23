"use client";
/* App-wide state: backend readiness, signed-in user, profile, admin flag, site settings,
   plus toast and modal services. Wraps every page (see app/layout.tsx). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { db, type AuthUser, type Doc } from "@/lib/db";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/config";

interface App {
  ready: boolean;
  mode: "demo" | "firebase";
  user: AuthUser | null;
  profile: Doc | null;
  admin: boolean;
  settings: SiteSettings;
  setProfile: (p: Doc | null) => void;
  setSettings: (s: SiteSettings) => void;
  reloadUser: () => Promise<void>;
}
const AppCtx = createContext<App | null>(null);
const ToastCtx = createContext<(msg: string) => void>(() => {});
const ModalCtx = createContext<{ open: (node: ReactNode, wide?: boolean) => void; close: () => void }>({ open: () => {}, close: () => {} });

export const useApp = () => useContext(AppCtx)!;
export const useToast = () => useContext(ToastCtx);
export const useModal = () => useContext(ModalCtx);

export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Doc | null>(null);
  const [admin, setAdmin] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const load = useCallback(async (u: AuthUser | null) => {
    setUser(u);
    setProfile(u ? await db.getProfile(u.uid).catch(() => null) : null);
    setAdmin(u ? await db.isAdmin(u.email) : false);
  }, []);

  useEffect(() => {
    let off = () => {};
    (async () => {
      try { await db.init(); } catch (e) { console.error("Backend failed to start", e); }
      setSettings(await db.getSettings().catch(() => DEFAULT_SETTINGS));
      await load(db.user());
      off = db.onAuth((u) => { load(u); });
      setReady(true);
    })();
    return () => off();
  }, [load]);

  /* toast */
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg); setToastOn(true);
    clearTimeout(timer.current); timer.current = setTimeout(() => setToastOn(false), 2800);
  }, []);

  /* modal */
  const [modal, setModal] = useState<{ node: ReactNode; wide: boolean } | null>(null);
  const modalApi = useMemo(() => ({ open: (node: ReactNode, wide = false) => setModal({ node, wide }), close: () => setModal(null) }), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const app: App = {
    ready, mode: db.mode, user, profile, admin, settings, setProfile, setSettings,
    reloadUser: () => load(db.user()),
  };

  return (
    <AppCtx.Provider value={app}>
      <ToastCtx.Provider value={toast}>
        <ModalCtx.Provider value={modalApi}>
          {children}
          <div className={`modal ${modal ? "open" : ""}`} aria-hidden={!modal}>
            <div className="modal-backdrop" onClick={() => setModal(null)} />
            <div className={`modal-card ${modal?.wide ? "wide" : ""}`} role="dialog" aria-modal="true">
              <button className="modal-close" onClick={() => setModal(null)} aria-label="Close">×</button>
              <div>{modal?.node}</div>
            </div>
          </div>
          <div className={`toast ${toastOn ? "show" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
        </ModalCtx.Provider>
      </ToastCtx.Provider>
    </AppCtx.Provider>
  );
}
