export type FieldMapping = {
  sourceFormId: string;
  sourceFieldKey: string;
};

export type MappingState = Record<string, Record<string, FieldMapping[]>>;

const KEY = "forms-mapper:mappings:v2";

export function loadMappings(): MappingState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MappingState) : {};
  } catch {
    return {};
  }
}

export function saveMappings(m: MappingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(m));
}

export function clearMappings() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
