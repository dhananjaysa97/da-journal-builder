import { buildUrl } from "../config/apiConfig";

export async function getGraphData() {
  const url = buildUrl();

  const res = await fetch(url, {
    headers: { Accept: "application/json, application/problem+json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const error = await res.text().catch(() => "");
    throw new Error(
      `Graph Get Api failed - ${res.status} ${res.statusText} ${error ? `- ${error}` : ""}`,
    );
  }

  return res.json();
}
