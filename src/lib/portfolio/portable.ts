import { caseLabel, type CaseStudy, type MasterProfile } from "./model";

export function canExportCase(item: CaseStudy) {
  return item.reviewed && item.ready !== false && item.confidentiality !== "private"
    && (item.kind === "simulation" || item.realWorkConfirmed);
}

function escape(text: string) {
  const characters: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return text.replace(/[&<>"']/g, (character) => characters[character]);
}

export function portablePortfolio(profile: MasterProfile, cases: CaseStudy[]) {
  const selected = cases.filter((item) => profile.selectedCases.includes(item.id) && canExportCase(item));
  if (!profile.name.trim() || !selected.length) throw new Error("Add your name and select a reviewed case.");
  const sections = selected.map((item) => {
    const fields = [
      ["Context", item.context], ["Problem", item.problem], ["Evidence", item.evidence],
      ["Options considered", item.options], ["Decision", item.decision], ["Trade-off", item.tradeoff],
      ["Success measure", item.metric], ["Outcome", item.outcome], ["What I learned", item.learning],
      ["What I’d check next", item.nextCheck],
    ];
    const body = fields.filter(([, value]) => value.trim()).map(([heading, value]) =>
      `<section><h3>${heading}</h3><p>${escape(value)}</p></section>`).join("");
    const label = item.kind === "simulation" ? "Simulated practice" : caseLabel(item);
    return `<article><p class="label">${label}</p><h2>${escape(item.title)}</h2>${body}</article>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${escape(profile.name)} · Decision portfolio</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f1e5;color:#25362e;font:16px/1.6 system-ui,sans-serif}
main{max-width:54rem;margin:auto;padding:clamp(1.25rem,6vw,4rem)}header,article{border-top:1px solid #9ba89c;padding:1.75rem 0}
h1,h2,h3{line-height:1.16;margin:0 0 .65rem}h1,h2{font-family:Georgia,serif;font-weight:500}
h1{font-size:clamp(2.5rem,8vw,4.75rem)}h2{font-size:clamp(1.85rem,5vw,3rem)}h3{font-size:1rem}
p{margin:.35rem 0 1.1rem;white-space:pre-wrap;overflow-wrap:anywhere}.label,footer{color:#46594b;font-size:.875rem}
section{margin-top:1.3rem}@media print{body{background:white}main{padding:0}h2,h3{break-after:avoid}p{orphans:3;widows:3}}
</style>
</head>
<body><main><header><p class="label">Decision portfolio</p><h1>${escape(profile.name)}</h1>
${profile.targetTitle ? `<p>${escape(profile.targetTitle)}</p>` : ""}
${profile.valueProp ? `<p>${escape(profile.valueProp)}</p>` : ""}
</header>${sections}<footer>Created with PMForge</footer></main></body></html>`;
}
