export default function ProjectLoading() {
  return (
    <section className="route-page project-loading" data-system-state="LOADING" aria-busy="true">
      <p className="eyebrow" role="status">
        RESOLVING MODULE
      </p>
      <div className="loading-signal" aria-hidden="true" />
    </section>
  );
}
