import Link from "next/link";
export default function NotFound() {
  return (
    <section className="route-page not-found" data-system-state="ERROR">
      <div className="lost-core" aria-hidden="true">
        <span />
        <i />
      </div>
      <p className="eyebrow">ROUTE SIGNAL LOST / ERR_404</p>
      <h1>
        404<span className="text-cyan">_</span>
      </h1>
      <p>This address isn’t part of the system.</p>
      <Link href="/" className="button primary">
        Return to core
      </Link>
    </section>
  );
}
