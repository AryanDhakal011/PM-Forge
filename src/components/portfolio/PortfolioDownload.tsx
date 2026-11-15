"use client";

import { useState } from "react";
import { downloadFile } from "@/lib/product/db";
import type { CaseStudy, MasterProfile } from "@/lib/portfolio/model";
import { canExportCase, portablePortfolio } from "@/lib/portfolio/portable";
import { CaseReader } from "./CaseReader";
import { HostedAccessDialog } from "@/components/product/HostedAccessDialog";
import s from "./Portfolio.module.css";

export function PortfolioDownload({ master, cases, onSave, onEdit, notify }: {
  master: MasterProfile;
  cases: CaseStudy[];
  onSave: (profile: MasterProfile) => Promise<void>;
  onEdit: (tab: number) => void;
  notify: (message: string) => void;
}) {
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const eligible = cases.filter(canExportCase);
  const selected = eligible.filter((item) => master.selectedCases.includes(item.id));
  async function choose(id: string, checked: boolean) {
    setReviewed(false);
    setBusy(true);
    try {
      const selectedCases = checked ? [...master.selectedCases, id] : master.selectedCases.filter((item) => item !== id);
      await onSave({ ...master, selectedCases });
    } catch {
      notify("Could not save your selection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className={s.grid}>
    <section className={s.panel}>
      <h2>Share a copy of your work.</h2>
      <p>Download an offline portfolio you can attach or open in a browser and print to PDF.</p>
      {!master.name.trim() && <button className={s.button} onClick={() => onEdit(1)}>Add your name</button>}
      <fieldset className={s.casePicker} disabled={busy}>
        <legend>Choose reviewed cases</legend>
        {eligible.map((item) => <label className={s.check} key={item.id}>
          <input type="checkbox" checked={master.selectedCases.includes(item.id)} onChange={(event) => void choose(item.id, event.target.checked)} />
          {item.title}
        </label>)}
        {!eligible.length && <button className={s.button} onClick={() => onEdit(2)}>Build or review a case study</button>}
      </fieldset>
      <p className={s.note}>The file includes your name, headline, and selected case text. Contact details, images, and recordings stay here.</p>
      <label className={s.check}><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
        I reviewed the selected text for confidential information.
      </label>
      <button className={`${s.button} ${s.primary}`} disabled={busy || !reviewed || !master.name.trim() || !selected.length} onClick={() => {
        try {
          downloadFile("pmforge-portfolio.html", portablePortfolio(master, selected), "text/html;charset=utf-8");
          notify("Portfolio downloaded. Open the file in a browser to read or print it.");
        } catch {
          notify("Could not download the portfolio. Review your selection and retry.");
        }
      }}>Download portfolio</button>
      <p><button className={s.inlineButton} onClick={() => setAccessOpen(true)}>Ask about hosted publishing</button></p>
    </section>
    <aside className={s.panel}>
      <h2>Selected cases</h2>
      {selected.length ? selected.map((item) => <CaseReader key={item.id} item={item} compact />)
        : <p>Choose a reviewed case to preview it here.</p>}
    </aside>
    <HostedAccessDialog open={accessOpen} onClose={() => setAccessOpen(false)} feature="Portfolio publishing" />
  </div>;
}
