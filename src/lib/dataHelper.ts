import {
  GraphApiResponse,
  NormalizedGraph,
  Form,
  FieldSchema,
  GraphField,
  GraphForm,
} from "./types";

function getFormSchemaFields(fields: FieldSchema): GraphField[] {
  const props = fields.properties;
  const result: GraphField[] = Object.keys(props).map((key) => {
    return {
      id: key,
      name: key,
    };
  });

  return result;
}

function buildFormSchemaFields(res: GraphApiResponse): Map<string, Form> {
  const componentMapById = new Map<string, Form>();
  for (const component of res.forms) {
    if (component?.id) componentMapById.set(component.id, component);
  }

  return componentMapById;
}

export function normalizeGraphResponse(res: GraphApiResponse): NormalizedGraph {
  const result = { forms: [] };
  if (!res) return result;

  const componentMapById = buildFormSchemaFields(res);

  const nodes = res.nodes ? res.nodes : [];
  if (!nodes.length) return result;

  const forms: GraphForm[] = nodes
    .filter(
      (n) =>
        (n?.type ?? n?.data?.component_type) === "form" ||
        (n?.id ?? "").startsWith("form-"),
    )
    .map((n) => {
      const id = n?.id ?? n?.data?.component_key ?? "";
      const data = n?.data ?? {};
      const name = data?.name ?? id;
      const dependsOn = data?.prerequisites;
      const componentId = data?.component_id ? data.component_id : "";
      const form = componentMapById.get(componentId);
      const fields = form?.field_schema
        ? getFormSchemaFields(form.field_schema)
        : [];
      return { id, name, dependsOn, fields };
    });

  return { forms };
}

export function resolveDependsOnToRoot(
  form: GraphForm,
  formsById: Record<string, GraphForm>,
): GraphForm[] {
  const visited = new Set<string>();
  const result: GraphForm[] = [];

  function dfs(currentId: string) {
    const current = formsById[currentId];
    if (!current) return;

    for (const parentId of current.dependsOn) {
      if (visited.has(parentId)) continue;
      visited.add(parentId);

      const parent = formsById[parentId];
      if (!parent) continue;

      result.push(parent);
      dfs(parentId);
    }
  }

  dfs(form.id);
  return result;
}
