"use client";
import Link from "next/link";
import { useApp } from "./providers";

export function Footer() {
  const { settings, mode } = useApp();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <p className="footer-line">Ideas, people, building.<br /><em>Let&apos;s learn entrepreneurship together.</em></p>
          <div className="footer-cols">
            <div>
              <h4>Platform</h4>
              <Link href="/matchmaking">Co-founder matchmaking</Link>
              <Link href="/validate">Validate an idea</Link>
              <Link href="/opportunities">Opportunities</Link>
              <Link href="/dashboard">Dashboard</Link>
            </div>
            <div>
              <h4>Community</h4>
              <Link href="/events">Events</Link>
              <Link href="/journal">Journal</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/about">About &amp; roadmap</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <Link href="/contact">Write to us</Link>
              <a href={settings.whatsapp} target="_blank" rel="noopener">WhatsApp community</a>
              <a href={settings.joinForm} target="_blank" rel="noopener">Join form</a>
            </div>
          </div>
        </div>
        <div className="footer-mark" aria-hidden="true">FBC<i /></div>
        <div className="footer-bottom">
          <span>© 2026 Founders and Builders Collective, BITS Pilani</span>
          <span>{mode === "demo" ? "Demo mode: data is saved only in this browser." : ""}</span>
        </div>
      </div>
    </footer>
  );
}
