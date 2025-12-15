"use client";

import { useMemo, useState } from "react";
import type { GraphForm } from "@/lib/types";
import { FieldMapModal } from "@/components/FieldMapModal";
import type { MappingState, FieldMapping } from "@/lib/mapping/storage";
import { resolveDependsOnToRoot } from "@/lib/dataHelper";
import { mappingConfig } from "@/config/mappingConfig";
import { formatMappingLabel } from "../lib/mapping/mappingLabels";

export function FormView(props: {
  form: GraphForm;
  forms: GraphForm[];
  mappings: MappingState;

  // single-field delete (×)
  onRemoveMapping: (targetFormId: string, targetFieldKey: string) => void;

  // modal submit
  onSetFormMappings: (
    targetFormId: string,
    nextForForm: Record<string, FieldMapping[]>,
  ) => void;
}) {
  const { form, forms, mappings, onRemoveMapping, onSetFormMappings } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillEnabled, setPrefillEnabled] = useState(true);

  const formsById = useMemo(
    () =>
      Object.fromEntries(forms.map((f) => [f.id, f])) as Record<
        string,
        GraphForm
      >,
    [forms],
  );

  // dependency chain to root
  const dependsOnForms = useMemo(() => {
    return resolveDependsOnToRoot(form, formsById);
  }, [form, formsById]);

  const excluded = useMemo(
    () =>
      new Set(
        (mappingConfig.excludedFieldKeys ?? []).map((x) => x.toLowerCase()),
      ),
    [],
  );

  // mappings for this form only
  const byField = mappings[form.id] ?? {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">Form view</div>
            <div className="text-xl font-semibold">{form.name}</div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
            <span className="text-slate-600">Prefill mapping</span>
            <input
              type="checkbox"
              checked={prefillEnabled}
              onChange={(e) => {
                setPrefillEnabled(e.target.checked);
              }}
              aria-label="Toggle prefill mapping"
            />
          </label>
        </div>

        {dependsOnForms.length ? (
          <div className="mt-2 text-sm text-slate-600">
            Depends on (to root):{" "}
            <span className="font-medium">
              {dependsOnForms.map((f) => f.name).join(" → ")}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-sm text-slate-500">No prerequisites</div>
        )}
      </div>

      {/* Fields */}
      <div className="p-4">
        {form.fields.length ? (
          <div className="space-y-2">
            {form.fields.map((fld) => {
              const isExcludedField = excluded.has(
                (fld.name ?? "").toLowerCase(),
              );
              const mList = byField[fld.name] ?? [];
              const mergedLabel = formatMappingLabel(mList, formsById);

              return (
                <div
                  key={fld.name}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left rounded-lg border border-slate-200 px-3 py-3 flex items-start justify-between gap-3
  ${isExcludedField || !prefillEnabled ? "bg-slate-50 opacity-70 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"}
`}
                  onClick={() => {
                    if (isExcludedField) return;
                    if (!prefillEnabled) return;
                    if (mList.length > 0) return;
                    setIsModalOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (isExcludedField) return;
                      if (!prefillEnabled) return;
                      if (mList.length > 0) return;
                      setIsModalOpen(true);
                    }
                  }}
                >
                  <div>
                    <div className="font-medium">{fld.name}</div>
                    <div className="text-slate-500">{mergedLabel}</div>
                  </div>

                  <div className="text-right">
                    {mList.length ? (
                      <div className="text-xs text-slate-700 flex items-start justify-end gap-2">
                        {prefillEnabled ? (
                          <button
                            type="button"
                            className="ml-1 rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                            aria-label={`Delete mapping for ${fld.name}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemoveMapping(form.id, fld.name);
                            }}
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        {isExcludedField ? (
                          <>
                            <div className="font-medium text-slate-600">
                              Not mappable
                            </div>
                            <div className="text-slate-500">
                              Disabled by config
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">Not mapped</div>
                            <div>
                              {prefillEnabled
                                ? "Click to map"
                                : "Prefill mapping is off"}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            No fields found for this form in the graph payload.
          </div>
        )}
      </div>

      <FieldMapModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetForm={form}
        dependencyForms={dependsOnForms}
        initial={mappings[form.id] ?? null}
        onSubmit={(draftForForm) => {
          onSetFormMappings(form.id, draftForForm);
        }}
      />
    </div>
  );
}
