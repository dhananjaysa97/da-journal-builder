import { buildUrl } from "@/config/apiConfig";

describe("apiConfig.buildUrl", () => {
  test("builds expected graph URL", () => {
    expect(buildUrl()).toMatch(
      /^http:\/\/localhost:3000\/api\/v1\/123\/actions\/blueprints\/bp_456\/bpv_123\/graph$/,
    );
  });
});
