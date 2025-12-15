import {
  normalizeGraphResponse,
  resolveDependsOnToRoot,
} from "@/lib/dataHelper";
import type { GraphApiResponse, GraphForm } from "@/lib/types";

describe("normalizeGraphResponse", () => {
  test("normalizes nodes into GraphForm list with dependsOn and schema fields", () => {
    const res: GraphApiResponse = {
      nodes: [
        {
          id: "form-A",
          type: "form",
          data: {
            id: "form-A",
            component_key: "A",
            component_type: "form",
            component_id: "cmp-A",
            name: "FormA",
            prerequisites: [],
            input_mapping: {},
          },
        },
        {
          id: "form-B",
          type: "form",
          data: {
            id: "form-B",
            component_key: "B",
            component_type: "form",
            component_id: "cmp-B",
            name: "FormB",
            prerequisites: ["form-A"],
            input_mapping: {},
          },
        },
      ],
      edges: [],
      forms: [
        {
          id: "cmp-A",
          name: "A",
          field_schema: {
            type: "object",
            required: [],
            properties: {
              email: { title: "Email" },
            } as any,
          },
        },
        {
          id: "cmp-B",
          name: "B",
          field_schema: {
            type: "object",
            required: [],
            properties: {
              phone: { title: "Phone" },
            } as any,
          },
        },
      ],
    };

    const norm = normalizeGraphResponse(res);
    expect(norm.forms).toHaveLength(2);

    const a = norm.forms.find((f) => f.id === "form-A")!;
    const b = norm.forms.find((f) => f.id === "form-B")!;

    expect(a.name).toBe("FormA");
    expect(a.dependsOn).toEqual([]);
    expect(a.fields.map((x) => x.name)).toEqual(["email"]);

    expect(b.dependsOn).toEqual(["form-A"]);
    expect(b.fields.map((x) => x.name)).toEqual(["phone"]);
  });

  test("returns empty when nodes missing", () => {
    const norm = normalizeGraphResponse({
      nodes: [] as any,
      edges: [],
      forms: [],
    });
    expect(norm.forms).toEqual([]);
  });
});

describe("resolveDependsOnToRoot", () => {
  test("returns unique dependency chain to root in DFS order", () => {
    const formA: GraphForm = { id: "A", name: "A", dependsOn: [], fields: [] };
    const formB: GraphForm = {
      id: "B",
      name: "B",
      dependsOn: ["A"],
      fields: [],
    };
    const formC: GraphForm = {
      id: "C",
      name: "C",
      dependsOn: ["A"],
      fields: [],
    };
    const formD: GraphForm = {
      id: "D",
      name: "D",
      dependsOn: ["B", "C"],
      fields: [],
    };

    const formsById = { A: formA, B: formB, C: formC, D: formD };

    const deps = resolveDependsOnToRoot(formD, formsById);
    // B and C are direct; A is transitive (but only once)
    expect(deps.map((f) => f.id)).toEqual(["B", "A", "C"]);
  });
});
