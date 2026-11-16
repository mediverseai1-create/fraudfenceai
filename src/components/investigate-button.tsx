"use client";

import { useState, useTransition } from "react";
import { runInvestigation } from "@/app/app/actions";

export function InvestigateButton({ caseId, hasResult }: { caseId: string; hasResult: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <button
        className="btn-dark btn-sm"
        disabled={pending}
        onClick={() => {
          setErr(null);
          start(async () => {
            const r = await runInvestigation(caseId);
            if (r.error) setErr(r.error);
          });
        }}
      >
        {pending ? "Analysing evidence…" : hasResult ? "Re-run AI investigation" : "Run AI investigation"}
      </button>
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
    </div>
  );
}
