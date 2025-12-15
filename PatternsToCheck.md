# PatternsToCheck.md

This document highlights the key patterns in this project that are worth paying attention to (and preserving) as we extend the project.

---

## 1) Normalize First, UI Second

**Pattern:** Convert any external data into a stable internal model _before_ it reaches React components.

- External APIs can change. UI should not.
- Keep “messy” API shape knowledge in one place (normalization), not spread across components.

**Where to look**

- Server fetch / SSR entry (`src/app/page.tsx` or server helpers)
- Normalization helpers (e.g., `src/lib/dataHelper.ts`)

**Rule of thumb**

> Components should consume `GraphForm[]` (the contract), not raw API responses.

---

## 2) Stable Internal Contract: `GraphForm`

**Pattern:** Everything depends on a small stable type contract.

- `GraphForm` defines: `id`, `name`, `fields[{id,name}]`, `dependsOn[]`
- Mapping, dependency traversal, and UI rendering all rely on it

---

## 3) Pure Logic in `src/lib/*`, Rendering in `src/components/*`

**Pattern:** Keep decision logic out of React components.

Examples of logic that belongs in `src/lib`:

- dependency traversal
- compatibility rules (field categorization)
- mapping label formatting
- storage read/write (localStorage)
- option building / sorting

Examples of logic that belongs in components:

- rendering
- event handling (clicks, keyboard)
- local UI state (modal open/close, selected option)

**Why it matters**

- Pure functions are easier to test
- Components stay readable and focused

---

## 4) Derived Data via `useMemo`

**Pattern:** Use `useMemo` for derived structures (maps, sorted lists), and avoid mutating props.

---

## 5) Keep Modal State Separate from App State

**Pattern:** Modal state (selection, warnings, temporary draft) should be local, while the “saved” mapping state belongs to the parent.

- Modal can create/edit a draft
- Parent owns the persisted mapping state
- Submit applies the draft; cancel discards

**Why it matters**

- Predictable user experience
- Easier to reason about state changes
- Less chance of partially-applied updates

---

## 6) Controlled Inputs: State Must Match the UI

**Pattern:** For `<select size={...}>` controls (and other controlled inputs), ensure React state matches what the user sees.

Browsers can visually highlight options even when controlled `value=""`.
If we rely on selection state for enabling actions (“Add”, “Remove”), default-select the first real option in state when options appear.

**Why it matters**

- Keeps keyboard and mouse interaction consistent

---

## 7) Mapping Rules Are Centralized (Compatibility + Labels)

**Pattern:** Treat mapping rules as “business logic” and centralize them.

- Compatibility: `src/lib/mapping/compatibility.ts`
- Label formatting: `src/lib/mapping/mappingLabels.ts`

**Why it matters**

- Adding new field categories becomes a single change + tests
- UI remains stable while rules evolve

---

## 8) Tests: Prefer Testing Rules Over UI Where Possible

**Pattern:** Keep more tests around pure helpers than around DOM structure.

Good test targets:

- normalization output (`normalizeGraphResponse`)
- dependency traversal (`resolveDependsOnToRoot`)
- compatibility rules
- label formatting
- storage read/write behavior

---

## 9) Accessibility & Keyboard Interaction

**Pattern:** Any clickable row should also be keyboard-usable.

- `role="button"`
- `tabIndex={0}`
- respond to `Enter` and `Space`
- keep `aria-label` for icon-only buttons

**Why it matters**

- Better UX and inclusive design
- Makes the UI more “production ready”
- Helps in code reviews

---

## 10) Keep Configuration as Data (Not Logic)

**Pattern:** Use config for things like excluded field keys.

- `mappingConfig.excludedFieldKeys`
- Keep the config simple and declarative

**Why it matters**

- Avoid sprinkling “special field” rules across multiple files
- Makes behavior changes safer and easier to review

---

## Quick Checklist When Adding Features

Before shipping a new feature, check:

- [ ] Did I normalize external data into `GraphForm[]`?
- [ ] Did I keep mapping rules in `src/lib/mapping/*`?
- [ ] Did I avoid mutating props (clone before sort)?
- [ ] Did I add unit tests for pure logic?
- [ ] Did I keep components focused on rendering + handlers?
- [ ] Did I keep modal drafts separate from saved state?
- [ ] Did I keep keyboard interaction working?

---

## Summary

If I preserve these patterns, the project stays:

- extensible (new sources plug in easily),
- testable (rules are isolated),
- readable (components stay small),
- and stable (UI doesn’t depend on API quirks).
