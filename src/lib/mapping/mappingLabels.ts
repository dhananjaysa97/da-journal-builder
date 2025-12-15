import type { GraphForm } from "@/lib/types";

export function formatMappingLabel(
  mList: { sourceFormId: string; sourceFieldKey: string }[],
  formsById: Record<string, GraphForm>,
) {
  if (!mList.length) return "";

  return mList
    .map((m) => {
      const f = formsById[m.sourceFormId];
      return `${f?.name ?? m.sourceFormId}.${m.sourceFieldKey}`;
    })
    .join(", ");
}
