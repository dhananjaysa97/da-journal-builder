import type { GraphField } from "@/lib/types";

export function fieldCategory(fld: Pick<GraphField, "name">): string {
  const n = (fld.name ?? "").toLowerCase();

  if (n.includes("email")) return "email";
  if (n.includes("phone") || n.includes("mobile")) return "phone";
  if (n.includes("date")) return "date";
  if (n.includes("address")) return "address";

  return "text";
}

export function isCompatible(
  targetField: Pick<GraphField, "name">,
  sourceField: Pick<GraphField, "name">,
): boolean {
  return fieldCategory(targetField) === fieldCategory(sourceField);
}
