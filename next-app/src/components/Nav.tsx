"use client";
/* Top navigation with the sliding highlight pill. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "./providers";
import { Avatar } from "./ui";

const LINKS = [
  ["/matchmaking", "Matchmaking"], ["/validate", "Validate"], ["/opportunities", "Opportunities"], ["/events", "Events"],
  ["/journal", "Journal"], ["/resources", "Resources"], ["/about", "About"],
] as const;

export function Nav() {
  const path = usePathname();
  const { user, profile, admin, settings } = useApp();
  const [open, setOpen] = useState(false);
  const linksRef = useRef<HTMLElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  const firstRef = useRef(true);

  const activeHref = LINKS.find(([href]) => path === href || path.startsWith(href + "/"))?.[0];
  const moveTo = useCallback((el: HTMLElement | null | undefined, instant = false) => {
    const ind = indRef.current;
    if (!ind) return;
    if (!el) { ind.classList.remove("show"); return; }
    ind.classList.toggle("instant", instant);
    ind.style.left = el.offsetLeft + "px";
    ind.style.width = el.offsetWidth + "px";
    ind.classList.add("show");
    if (instant) requestAnimationFrame(() => ind.classList.remove("instant"));
  }, []);
  const activeEl = () => linksRef.current?.querySelector<HTMLElement>("a.active");

  useLayoutEffect(() => { moveTo(activeEl(), firstRef.current); firstRef.current = false; }, [path, moveTo]);
  useEffect(() => {
    const onResize = () => moveTo(activeEl(), true);
    addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize);
    return () => removeEventListener("resize", onResize);
  }, [moveTo]);

  return (
    <>
      {settings.announcement && <div className="announce">{settings.announcement.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}</div>}
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="wordmark" aria-label="FBC home">
            <span className="wm-mark">FBC<i /></span>
            <span className="wm-name">Founders &amp; Builders Collective</span>
          </Link>
          <nav ref={linksRef} className={`nav-links ${open ? "open" : ""}`} aria-label="Main" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}
               onMouseOver={(e) => { const a = (e.target as HTMLElement).closest("a"); if (a) moveTo(a); }}
               onMouseLeave={() => moveTo(activeEl())}>
            <span ref={indRef} className="nav-ind" aria-hidden="true" />
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} className={activeHref === href ? "active" : ""}>{label}</Link>
            ))}
          </nav>
          <div className="nav-actions">
            {user ? (
              <>
                {admin && <Link href="/admin" className="text-link">Admin</Link>}
                <Link href="/dashboard" className="text-link">Dashboard</Link>
                <Link href="/dashboard" title={profile?.name || user.name}><Avatar name={profile?.name || user.name} photo={profile?.photo || user.photo} /></Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-link">Sign in</Link>
                <Link href="/join" className="btn btn-primary btn-sm">Join FBC</Link>
              </>
            )}
          </div>
          <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}><span /><span /></button>
        </div>
      </header>
    </>
  );
}
