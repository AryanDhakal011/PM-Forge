"use client";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <div style={{ padding: 30 }}>
      <h1>Let’s get your desk back.</h1>
      <p>
        This view could not load. Retry it or reload the current app. These
        actions do not delete saved work.
      </p>
      <button className="btn btnPrimary" onClick={retry}>
        Try again
      </button>
      <button className="btn btnOutline" onClick={() => location.reload()}>
        Reload latest app
      </button>
      <a href="/reset.html" className="btn btnOutline">
        Start fresh / clear local test data
      </a>
      <a href="/" className="btn btnOutline">
        Back to PMForge
      </a>
    </div>
  );
}
