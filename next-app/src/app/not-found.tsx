import Link from "next/link";
export default function NotFound() {
  return <section className="section"><div className="container"><span className="label">404</span><h1 className="mt-2">Not built yet.</h1>
    <p className="lead mt-3">This page doesn&apos;t exist. Fitting, for a builders&apos; club.</p><Link href="/" className="btn btn-primary mt-4">Back home</Link></div></section>;
}
