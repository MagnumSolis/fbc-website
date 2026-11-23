"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/components/providers";

export default function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  return (
    <div className="feature">
      <div><span className="label">The Builder&apos;s Brief</span><h2 className="mt-2">One startup story in your inbox, every two weeks.</h2></div>
      <div>
        <form className="field" onSubmit={async (e) => { e.preventDefault(); await db.sendMessage({ type: "newsletter", email }); setEmail(""); toast("You're subscribed to The Builder's Brief"); }}>
          <label htmlFor="nlEmail">Email</label>
          <div className="row"><input className="input" id="nlEmail" type="email" required style={{ flex: 1 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@pilani.bits-pilani.ac.in" /><button className="btn btn-primary">Subscribe</button></div>
          <span className="hint">No spam. Unsubscribe any time.</span>
        </form>
      </div>
    </div>
  );
}
