import { getGraphData } from "../lib/api-server";
import { normalizeGraphResponse } from "../lib/dataHelper";
import { GraphForm, NormalizedGraph } from "@/lib/types";
import { FormsMapperClient } from "../components/FormsMapperClient";

export default async function Home() {
  let forms: GraphForm[] = [];
  let error: string | null = null;

  try {
    const res = await getGraphData();
    // normalize
    const graphData: NormalizedGraph = normalizeGraphResponse(res);
    forms = graphData.forms;
  } catch (e: unknown) {
    if (e instanceof Error) {
      error = e?.message ?? "Failed to load graph";
    } else {
      error = "Failed to load graph";
    }
  }

  return (
    <div>
      {error ? (
        <main className="max-w-5xl mx-auto p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="font-semibold text-red-800">
              Could not load graph
            </div>
            <div className="mt-1 text-sm text-red-700">{error}</div>
            <div className="mt-3 text-sm text-slate-700">
              Update{" "}
              <code className="px-1 py-0.5 rounded bg-white border border-red-100">
                src/config/appConfig.ts
              </code>{" "}
              and ensure your backend is running.
            </div>
          </div>
        </main>
      ) : null}

      {forms.length ? (
        <FormsMapperClient forms={forms} />
      ) : !error ? (
        <main className="max-w-5xl mx-auto p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No forms found in the graph payload.
          </div>
        </main>
      ) : null}
    </div>
  );
}
