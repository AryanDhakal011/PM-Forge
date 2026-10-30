"use client";
import dynamic from "next/dynamic";
const Runner = dynamic(() => import("./InterviewRunner"), {
  ssr: false,
  loading: () => <p style={{ padding: 36 }}>Opening the interview room…</p>,
});
export default function RunnerLoader({ runId }: { runId: string }) {
  return <Runner runId={runId} />;
}
