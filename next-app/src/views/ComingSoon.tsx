import Link from "next/link";
/* Temporary placeholder while the migration is in progress. */
export default function ComingSoon({ what }: { what: string }) {
  return (
    <section className="section"><div className="narrow">
      <span className="label">Migration in progress</span>
      <h2 className="mt-2">{what} is moving to the new stack.</h2>
      <p className="lead mt-3">This part is being ported next. Until then it works on the current site.</p>
      <div className="row mt-4"><a className="btn btn-primary" href="https://magnumsolis.github.io/fbc-website/">Open the current site</a><Link className="btn" href="/">Home</Link></div>
    </div></section>
  );
}
