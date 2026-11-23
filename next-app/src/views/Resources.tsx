"use client";
import Link from "next/link";
import { db } from "@/lib/db";
import { SHELVES } from "@/lib/content";
import { useData } from "@/components/blocks";
import { PageHead } from "@/components/ui";

export default function Resources() {
  const [res] = useData(async () => (await db.list("resources")).sort((a, b) => (a.order || 0) - (b.order || 0)));
  return (
    <>
      <PageHead label="Resources" title="The founder's library." lead="Guides, templates, books and tools picked by the Research & Knowledge team." />
      <section className="section-sm"><div className="container">
        {SHELVES.map((sh) => {
          const items = (res || []).filter((r) => r.shelf === sh);
          if (!items.length) return null;
          return (
            <div key={sh} className="sec-grid" style={{ marginBottom: "3.5rem" }}><span className="label">{sh}</span>
              <div className="list boxed">{items.map((r) => (
                <div key={r.id} className="list-row" style={{ gridTemplateColumns: "1fr auto" }}>
                  <div><span className="title">{r.title}</span>{r.featured && <span className="tag gold" style={{ marginLeft: ".4rem" }}>Featured</span>}<div className="tagline">{r.desc}</div></div>
                  {r.url ? (r.url.startsWith("#") || r.url.startsWith("/")
                    ? <Link className="arrow-link small" href={r.url === "#validate" ? "/validate" : r.url}>Open</Link>
                    : <a className="arrow-link small" href={r.url} target="_blank" rel="noopener">Open</a>)
                    : <span className="xs faint">Coming soon</span>}
                </div>))}</div>
            </div>);
        })}
      </div></section>
    </>
  );
}
