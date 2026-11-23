"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import { POST_CATS } from "@/lib/content";
import { byDesc } from "@/lib/format";
import { useData } from "@/components/blocks";
import { PageHead, PostCard } from "@/components/ui";
import Newsletter from "./Newsletter";

export default function Journal() {
  const [cat, setCat] = useState("All");
  const [posts] = useData(async () => (await db.list("posts")).sort(byDesc("date")));
  const all = posts || [];
  const feat = all.find((p) => p.featured) || all[0];
  const list = all.filter((p) => (cat !== "All" || p !== feat) && (cat === "All" || p.cat === cat));
  return (
    <>
      <PageHead label="Journal" title="Startup stories, analysis and the newsletter." lead="One company per story: why it started, the problem, the business model, the money, and the mistakes. The ones that didn't make it too." />
      <section className="section-sm"><div className="container">
        {feat && cat === "All" && <PostCard p={feat} featured />}
        <div className="toolbar mt-4"><div className="seg">{["All", ...POST_CATS].map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div></div>
        <div className="grid g3">{list.map((p) => <PostCard key={p.id} p={p} />)}
          {posts && !list.length && <div className="empty" style={{ gridColumn: "1/-1" }}>No posts here yet.</div>}</div>
      </div></section>
      <section className="section"><div className="container"><Newsletter /></div></section>
    </>
  );
}
