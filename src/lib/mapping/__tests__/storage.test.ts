import {
  clearMappings,
  loadMappings,
  saveMappings,
} from "@/lib/mapping/storage";
import type { MappingState } from "@/lib/mapping/storage";

describe("mapping storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("saveMappings + loadMappings round-trip", () => {
    const state: MappingState = {
      T: {
        email: [
          { sourceFormId: "A", sourceFieldKey: "email" },
          { sourceFormId: "B", sourceFieldKey: "email" },
        ],
      },
    };

    saveMappings(state);
    expect(loadMappings()).toEqual(state);
  });

  test("clearMappings removes data", () => {
    const state: MappingState = {
      T: { city: [{ sourceFormId: "A", sourceFieldKey: "city" }] },
    };
    saveMappings(state);
    clearMappings();
    expect(loadMappings()).toEqual({});
  });
});
