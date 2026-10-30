"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div style={{ padding: 30 }}>
      <h1>Let’s get your desk back.</h1>
      <p>Your locally saved work is still on this device.</p>
      <button className="btn btnPrimary" onClick={reset}>
        Try again
      </button>
      <a href="/app" className="btn btnOutline">
        Back to Home
      </a>
    </div>
  );
}
