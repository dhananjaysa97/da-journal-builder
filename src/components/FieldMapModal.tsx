"use client";

import { useEffect, useMemo, useState } from "react";
import type { GraphForm } from "@/lib/types";
import type { FieldMapping } from "@/lib/mapping/storage";
import { mappingConfig } from "@/config/mappingConfig";
import { GLOBAL_FORM } from "../lib/globalForm";
import { fieldCategory, isCompatible } from "../lib/mapping/compatibility";

type Option = {
  key: string; // `${formId}::${fieldKey}`
  formId: string;
  fieldKey: string;
  group: string; // Form name
};

type DraftForForm = Record<string, FieldMapping[]>; 

function makeRightKey(targetFieldKey: string, m: FieldMapping) {
  return `${targetFieldKey}::${m.sourceFormId}::${m.sourceFieldKey}`;
}
function parseRightKey(key: string) {
  const [targetFieldKey, sourceFormId, sourceFieldKey] = key.split("::");
  if (!targetFieldKey || !sourceFormId || !sourceFieldKey) return null;
  return { targetFieldKey, sourceFormId, sourceFieldKey };
}

export function FieldMapModal(props: {
  open: boolean;
  onClose: () => void;
  targetForm: GraphForm;

  dependencyForms: GraphForm[];

  initial?: DraftForForm | null;
  onSubmit: (draft: DraftForForm) => void;
}) {
  const { open, onClose, targetForm, dependencyForms, initial, onSubmit } =
    props;

  const excluded = useMemo(
    () =>
      new Set(
        (mappingConfig.excludedFieldKeys ?? []).map((x) => x.toLowerCase()),
      ),
    [],
  );

  const targetFields = useMemo(
    () =>
      targetForm.fields.filter(
        (f) => !excluded.has((f.name ?? "").toLowerCase()),
      ),
    [targetForm.fields, excluded],
  );

  const sortedDependencyForms = useMemo(() => {
  const sorted = [...dependencyForms].sort((a, b) => a.name.localeCompare(b.name));
  return [GLOBAL_FORM, ...sorted];
}, [dependencyForms]);


  // All available source options (filtered by excluded keys)
  const allOptions: Option[] = useMemo(() => {
    const out: Option[] = [];
    for (const f of sortedDependencyForms) {
      for (const fld of f.fields) {
        if (excluded.has((fld.name ?? "").toLowerCase())) continue;

        out.push({
          key: `${f.id}::${fld.name}`,
          formId: f.id,
          fieldKey: fld.name,
          group: f.name,
        });
      }
    }

    return out;
  }, [sortedDependencyForms, excluded]);

  const formsById = useMemo(
    () =>
      Object.fromEntries(sortedDependencyForms.map((f) => [f.id, f])) as Record<
        string,
        GraphForm
      >,
    [sortedDependencyForms],
  );

  // Draft mappings for the whole target form
  const [draft, setDraft] = useState<DraftForForm>({});

  // list selection state
  const [leftSelectedKey, setLeftSelectedKey] = useState<string>("");
  const [rightSelectedKey, setRightSelectedKey] = useState<string>("");

  // inline warning
  const [warn, setWarn] = useState<string>("");

  function safeClone<T>(value: T): T {
    const sc = (
      globalThis as unknown as { structuredClone?: (v: unknown) => unknown }
    ).structuredClone;
    if (typeof sc === "function") return sc(value) as T;
    return JSON.parse(JSON.stringify(value)) as T;
  }

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? safeClone(initial) : {});
    setLeftSelectedKey(allOptions[0]?.key ?? "");
    setRightSelectedKey("");
    setWarn("");
  }, [open, initial, allOptions]);

  function pickTargetFieldForSource(sourceField: {
    name: string;
    label?: string;
    type?: string;
  }) {
    // 1) Prefer exact key match
    const exact = targetFields.find((t) => t.name === sourceField.name);

    if (exact) return exact;

    // 2) Otherwise pick first compatible by category
    const srcCat = fieldCategory(sourceField);
    return targetFields.find((t) => fieldCategory(t) === srcCat) ?? null;
  }

  function addFromLeftKey(selectedKey: string) {
    if (!selectedKey) return;
    setWarn("");

    const [sourceFormId, sourceFieldKey] = selectedKey.split("::");
    const sourceForm = formsById[sourceFormId];
    const sourceField = sourceForm?.fields.find(
      (f) => f.name === sourceFieldKey,
    );

    if (!sourceForm || !sourceField) return;

    // pick best target field
    const targetField = pickTargetFieldForSource(sourceField);

    if (!targetField) {
      setWarn(
        `No compatible target field found for ${sourceForm.name}.${sourceFieldKey}`,
      );
      return;
    }

    if (!isCompatible(targetField, sourceField)) {
      setWarn(
        `Type mismatch: cannot map ${sourceForm.name}.${sourceFieldKey} → ${targetForm.name}.${targetField.name}`,
      );
      return;
    }

    // add mapping under chosen target field
    setDraft((prev) => {
      const next: DraftForForm = { ...prev };
      const list = [...(next[targetField.name] ?? [])];

      const exists = list.some(
        (m) =>
          m.sourceFormId === sourceFormId &&
          m.sourceFieldKey === sourceFieldKey,
      );
      if (!exists) list.push({ sourceFormId, sourceFieldKey });

      next[targetField.name] = list;
      return next;
    });

    setLeftSelectedKey("");
  }

  function removeFromRightKey(key: string) {
    const parsed = parseRightKey(key);
    if (!parsed) return;

    setDraft((prev) => {
      const next: DraftForForm = { ...prev };
      const list = next[parsed.targetFieldKey] ?? [];
      const filtered = list.filter(
        (m) =>
          !(
            m.sourceFormId === parsed.sourceFormId &&
            m.sourceFieldKey === parsed.sourceFieldKey
          ),
      );

      if (filtered.length === 0) {
        delete next[parsed.targetFieldKey];
      } else {
        next[parsed.targetFieldKey] = filtered;
      }

      return next;
    });

    setRightSelectedKey("");
  }

  const rightOptions = useMemo(() => {
    // flatten draft into readable rows: Target • SourceForm.SourceField
    const out: { key: string; group: string; label: string }[] = [];
    for (const [targetFieldKey, list] of Object.entries(draft)) {
      for (const m of list) {
        const sf = formsById[m.sourceFormId];
        out.push({
          key: makeRightKey(targetFieldKey, m),
          group: `${targetFieldKey}`,
          label: `${sf?.name ?? m.sourceFieldKey}`,
        });
      }
    }

    return out.sort(
      (a, b) =>
        a.group.localeCompare(b.group) || a.label.localeCompare(b.label),
    );
  }, [draft, formsById]);

  useEffect(() => {
  if (!open) return;

  // If mappings exist but nothing is selected in state, select the first entry
  if (!rightSelectedKey && rightOptions.length > 0) {
    setRightSelectedKey(rightOptions[0].key);
    return;
  }

  // If the currently selected key no longer exists (removed), pick the first remaining
  if (rightSelectedKey && rightOptions.length > 0) {
    const exists = rightOptions.some((o) => o.key === rightSelectedKey);
    if (!exists) setRightSelectedKey(rightOptions[0].key);
  }

  // If list becomes empty, clear selection
  if (rightOptions.length === 0 && rightSelectedKey) {
    setRightSelectedKey("");
  }
}, [open, rightOptions, rightSelectedKey]);

  const canSubmit = Object.keys(draft).length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[min(980px,94vw)] rounded-xl bg-white shadow-xl border border-slate-200"
      >
        <div className="p-4 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-500">Map fields</div>
            <div className="text-lg font-semibold">{targetForm.name}</div>

            <div className="mt-1 text-sm text-slate-600">
              Double-click a dependency field to{" "}
              <span className="font-medium">map it</span> to a compatible target
              field.
            </div>

            {warn ? (
              <div className="mt-2 text-sm text-amber-700">{warn}</div>
            ) : null}
          </div>

          <button
            className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            {/* Left */}
            <div className="rounded-lg border border-slate-200">
              <div className="px-3 py-2 border-b border-slate-200 text-sm font-medium">
                Available fields (dependencies)
              </div>

              <div className="p-2">
                <select
                  size={16}
                  className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={leftSelectedKey}
                  onChange={(e) => setLeftSelectedKey(e.target.value)}
                  onDoubleClick={(e) =>
                    addFromLeftKey((e.currentTarget as HTMLSelectElement).value)
                  }
                >
                  {allOptions.length === 0 ? (
                    <option value="" disabled>
                      No dependency forms
                    </option>
                  ) : null}

                  {(() => {
                    const byGroup = new Map<string, Option[]>();
                    for (const o of allOptions) {
                      if (!byGroup.has(o.group)) byGroup.set(o.group, []);
                      byGroup.get(o.group)!.push(o);
                    }

                    return Array.from(byGroup.entries()).map(
                      ([group, items]) => (
                        <optgroup key={group} label={group}>
                          {items.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.fieldKey.replace(group + " • ", "")}
                            </option>
                          ))}
                        </optgroup>
                      ),
                    );
                  })()}
                </select>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-sm disabled:opacity-50"
                    disabled={!leftSelectedKey}
                    onClick={() => addFromLeftKey(leftSelectedKey)}
                  >
                    Add →
                  </button>
                  <div className="text-xs text-slate-500">
                    Tip: double-click to add.
                  </div>
                </div>
              </div>
            </div>

            {/* Middle  */}
            <div className="hidden md:flex flex-col items-center justify-center text-xs text-slate-500">
              <div className="rounded-full border border-slate-200 px-3 py-2 bg-white">
                ⇄
              </div>
            </div>

            {/* Right */}
            <div className="rounded-lg border border-slate-200">
              <div className="px-3 py-2 border-b border-slate-200 text-sm font-medium">
                Selected mappings
              </div>

              <div className="p-2">
                <select
                  size={16}
                  className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={rightSelectedKey}
                  onChange={(e) => setRightSelectedKey(e.target.value)}
                  onDoubleClick={(e) =>
                    removeFromRightKey(
                      (e.currentTarget as HTMLSelectElement).value,
                    )
                  }
                >
                  {rightOptions.length === 0 ? (
                    <option value="" disabled>
                      No mappings selected
                    </option>
                  ) : null}

                  {(() => {
                    const byGroup = new Map<
                      string,
                      { key: string; label: string }[]
                    >();
                    for (const o of rightOptions) {
                      if (!byGroup.has(o.group)) byGroup.set(o.group, []);
                      byGroup
                        .get(o.group)!
                        .push({ key: o.key, label: o.label });
                    }

                    return Array.from(byGroup.entries()).map(
                      ([group, items]) => (
                        <optgroup key={group} label={group}>
                          {items.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      ),
                    );
                  })()}
                </select>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm disabled:opacity-50"
                    disabled={!rightSelectedKey}
                    onClick={() => removeFromRightKey(rightSelectedKey)}
                  >
                    Remove
                  </button>
                  <div className="text-xs text-slate-500">
                    Tip: double-click to remove.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Excluded keys:{" "}
            {(mappingConfig.excludedFieldKeys ?? []).join(", ") || "none"}.
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-sm disabled:opacity-50"
              disabled={!canSubmit}
              onClick={() => {
                onSubmit(draft);
                onClose();
              }}
            >
              Submit mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
