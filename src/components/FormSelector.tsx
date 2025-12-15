"use client";

import type { GraphForm } from "@/lib/types";

export function FormSelector(props: {
  forms: GraphForm[];
  selectedFormId: string | null;
  onSelect: (formId: string) => void;
}) {
  const { forms, selectedFormId, onSelect } = props;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">Select a form</div>
      <select
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        value={selectedFormId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          Choose form…
        </option>
        {forms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
