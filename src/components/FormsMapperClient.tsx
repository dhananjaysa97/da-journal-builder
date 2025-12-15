"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphForm } from "@/lib/types";
import { FormSelector } from "@/components/FormSelector";
import { FormView } from "@/components/FormView";
import {
  loadMappings,
  saveMappings,
  type MappingState,
  type FieldMapping,
} from "@/lib/mapping/storage";

export function FormsMapperClient({ forms }: { forms: GraphForm[] }) {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(
    forms[0]?.id ?? null,
  );

  const [mappings, setMappings] = useState<MappingState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMappings(loadMappings());
    setHydrated(true);
  }, []);

  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    saveMappings(mappings);
  }, [mappings]);

  const selectedForm = useMemo(
    () => forms.find((f) => f.id === selectedFormId) ?? null,
    [forms, selectedFormId],
  );

  // single field mapping remove
  function onRemoveMapping(targetFormId: string, targetFieldKey: string) {
    setMappings((prev) => {
      const next: MappingState = { ...prev };
      next[targetFormId] = { ...(next[targetFormId] ?? {}) };
      delete next[targetFormId][targetFieldKey];
      if (Object.keys(next[targetFormId]).length === 0)
        delete next[targetFormId];

      return next;
    });
  }

  // NEW: set whole-form mappings at once (used by the modal submit)
  function onSetFormMappings(
    targetFormId: string,
    nextForForm: Record<string, FieldMapping[]>,
  ) {
    setMappings((prev) => {
      const next: MappingState = { ...prev };
      if (Object.keys(nextForForm).length === 0) {
        delete next[targetFormId];
      } else {
        next[targetFormId] = nextForForm;
      }
      return next;
    });
  }

  if (!hydrated) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <div className="text-sm text-slate-500">Loading mappings…</div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Forms Mapper</h1>
          <p className="text-sm text-slate-600">
            Dropdown of forms → form details → click on any empty field → modal
            bulk mapping.
          </p>
        </div>

        <button
          className="px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
          onClick={() => {
            if (!confirm("Clear all saved mappings (localStorage)?")) return;
            localStorage.removeItem("forms-mapper:mappings:v2");
            setMappings({});
          }}
        >
          Clear mappings
        </button>
      </div>

      <FormSelector
        forms={forms}
        selectedFormId={selectedFormId}
        onSelect={(id) => setSelectedFormId(id)}
      />

      {selectedForm ? (
        <FormView
          form={selectedForm}
          forms={forms}
          mappings={mappings}
          onRemoveMapping={onRemoveMapping}
          onSetFormMappings={onSetFormMappings}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No form selected.
        </div>
      )}
    </main>
  );
}
