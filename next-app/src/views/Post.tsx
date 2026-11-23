"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { useApp } from "@/components/providers";
import { useData } from "@/components/blocks";
import { Loading } from "@/components/ui";
import Newsletter from "./Newsletter";

export default function Post() {
  const id = useSearchParams().get("id") || "";
  const { admin } = useApp();
  const [p] = useData(() => db.get("posts", id).catch(() => null), [id]);
  if (p === undefined) return <Loading />;
  if (!p || (!p.published && !admin)) return (
    <section className="section"><div className="container"><span className="label">404</span><h1 className="mt-2">Story not found.</h1><Link href="/journal" className="btn btn-primary mt-4">Back to the journal</Link></div></section>);
  return (
    <article className="article"><div className="narrow">
      <Link href="/journal" className="link small">← Journal</Link>
      <span className="label" style={{ display: "block", marginTop: "2rem" }}>{p.cat} · {fmtDate(p.date)}{p.read ? ` · ${p.read} read` : ""}</span>
      <h1>{p.title}</h1>
      <p className="lead">{p.excerpt}</p>
      <p className="small mt-3">By {p.author}</p>
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body || "") }} />
      <div className="mt-5"><Newsletter /></div>
    </div></article>
  );
}
