import type { GraphForm } from "@/lib/types";
import { formatMappingLabel } from "../mappingLabels";

describe("formatMappingLabel", () => {
  test("returns empty string when no mappings", () => {
    expect(formatMappingLabel([], {} as Record<string, GraphForm>)).toBe("");
  });

  test("formats mappings as FormName.fieldKey joined by comma+space", () => {
    const formsById: Record<string, GraphForm> = {
      A: {
        id: "A",
        name: "FormA",
        dependsOn: [],
        fields: [{ id: "1", name: "email" }],
      },
      B: {
        id: "B",
        name: "FormB",
        dependsOn: [],
        fields: [{ id: "2", name: "phone" }],
      },
    };

    const label = formatMappingLabel(
      [
        { sourceFormId: "A", sourceFieldKey: "email" },
        { sourceFormId: "B", sourceFieldKey: "phone" },
      ],
      formsById,
    );

    expect(label).toBe("FormA.email, FormB.phone");
  });

  test("falls back to sourceFormId when form is missing", () => {
    const label = formatMappingLabel(
      [{ sourceFormId: "X", sourceFieldKey: "dynamic_object" }],
      {} as Record<string, GraphForm>,
    );

    expect(label).toBe("X.dynamic_object");
  });
});
