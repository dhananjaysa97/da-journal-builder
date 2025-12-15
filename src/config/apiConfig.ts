const apiConfig = {
  graphApiUrl: "http://localhost:3000",
  tenantId: "123",
  actionBlueprintId: "bp_456",
  blueprintVersionId: "bpv_123",
};

export function buildUrl() {
  const { graphApiUrl, tenantId, actionBlueprintId, blueprintVersionId } =
    apiConfig;
  return `${graphApiUrl}/api/v1/${tenantId}/actions/blueprints/${actionBlueprintId}/${blueprintVersionId}/graph`;
}
