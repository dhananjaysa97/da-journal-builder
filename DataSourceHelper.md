# DataSourceHelper.md

## Purpose

This project supports different “data sources” (APIs, virtual forms, derived data) by enforcing a single internal contract:

> **External data that is Graph Api response must be normalized into `GraphForm[]` before it reaches the UI.**

This keeps the React components simple and makes adding new sources predictable and safe.

---

## Architecture Overview

### Data flow

External Data Source -> Server fetch (SSR) -> Normalization (lib) -> GraphForm[] (internal contract) -> Client UI (FormSelector → FormView → FieldMapModal)

## What Counts as a Data Source?

A data source is:

- A REST API endpoint returning a graph payload
- A new graph payload shape from the same API
- A virtual/derived source (ex: `GLOBAL_FORM`)

If it can be transformed into `GraphForm[]`, the UI can consume it.

## Internal Contract: GraphForm

All sources must normalize into:

```ts
export type GraphForm = {
  id: string;
  name: string;
  fields: { id: string; name: string }[];
  dependsOn: string[];
};
```

This contract is used by:

- dependency traversal (`resolveDependsOnToRoot`)
- mapping logic (compatibility helpers)
- all UI components (`FormView`, `FieldMapModal`, etc.)

---

## Adding a New API Data Source

### Step 1 — Add configuration

Update config (example pattern):

```ts
export const apiConfig = {
  graphApiUrl: "...",
  tenantId: "...",
  actionBlueprintId: "...",
  blueprintVersionId: "...",
};
```

If the new source has a new endpoint, add new config keys instead of repurposing existing ones.

---

### Step 2 — Fetch on the server

Create a server helper:

```ts
export async function getNewGraphSource(): Promise<unknown> {
  const res = await fetch("...");
  if (!res.ok) throw new Error("Failed to fetch new graph source");
  return res.json();
}
```

Fetch should occur in **server-side code** (SSR / server helper), not inside client components.

---

### Step 3 — Normalize to GraphForm[]

Create a normalization function:

```ts
import type { GraphForm } from "@/lib/types";

export function normalizeNewGraphSource(raw: unknown): GraphForm[] {
  // Convert raw API response shape → GraphForm[]
  // Validate required fields: id, name, fields[], dependsOn[]
  return [];
}
```

**Normalization rules:**

- Do not leak raw API fields past normalization
- Convert identifiers and names into the stable model
- Ensure all `dependsOn` values reference form IDs

---

### Step 4 — Use normalized forms in SSR entry

Example:

```ts
const raw = await getNewGraphSource();
const forms = normalizeNewGraphSource(raw);
return <FormsMapperClient forms={forms} />;
```

At this point, the UI doesn’t care where the forms came from.

---

## Adding a Virtual/Derived Data Source (Example: GLOBAL_FORM)

### What is it?

A “virtual form” is a synthetic `GraphForm` that behaves like a dependency source.

Example: `GLOBAL_FORM` contains global fields (email, phone, etc.).

### Step 1 — Define it

```ts
export const GLOBAL_FORM: GraphForm = {
  id: "__global__",
  name: "Global",
  fields: [
    { id: "email", name: "email" },
    { id: "phone", name: "phone" },
  ],
  dependsOn: [],
};
```

### Step 2 — Inject into dependency source list

When building the list of selectable dependency fields:

- Always keep global first
- Sort dependency forms without mutating props

```ts
const sortedDependencyForms = useMemo(() => {
  const sorted = [...dependencyForms].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return [GLOBAL_FORM, ...sorted];
}, [dependencyForms]);
```

---

## Extending Compatibility Rules for New Fields

Compatibility is determined by pure helper logic:

- `src/lib/mapping/compatibility.ts`

If new sources introduce new naming conventions, update the categorization rules here.

Example approach:

```ts
export function fieldCategory(fld: { name: string }) {
  const n = fld.name.toLowerCase();

  if (n.includes("email")) return "email";
  if (n.includes("phone") || n.includes("mobile")) return "phone";
  if (n.includes("date")) return "date";
  if (n.includes("address")) return "address";

  return "text";
}
```

Add tests in `src/lib/mapping/__tests__/compatibility.test.ts` whenever rules change.

---

## Extending Mapping Display / Labels

Mapping label formatting should be handled in a pure helper:

- `src/lib/mapping/mappingLabels.ts`

Rules should be consistent and tested. UI components should only call the helper.

---

## What NOT to Do

Do not fetch external data inside client components  
Do not store raw API objects in React state  
Do not add “if source is X then …” logic inside components

---

## Testing Checklist When Adding a Data Source

When we introduce a new data source:

1. Add unit tests for the normalization function
2. Ensure compatibility tests still pass
3. Run component tests to confirm UI is unaffected
4. Verify mapping and modal behavior works with the new forms

---

## Summary

To add a new data source, follow this workflow:

1. Fetch (server-side)
2. Normalize to `GraphForm[]`
3. Pass `GraphForm[]` to the client UI
4. Extend mapping rules via pure helpers + unit tests

This will keep the app scalable, readable, and easy to extend.

---
