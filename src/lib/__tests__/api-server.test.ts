import { getGraphData } from "@/lib/api-server";

describe("getGraphData", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test("returns json on ok response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    } as any);

    const data = await getGraphData();
    expect(data).toEqual({ hello: "world" });
    expect(global.fetch).toHaveBeenCalled();
  });

  test("throws with status + text when response not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => "failed",
    } as any);

    await expect(getGraphData()).rejects.toThrow(
      /Graph Get Api failed - 500 Server Error - failed/,
    );
  });

  test("throws even if text() fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => {
        throw new Error("nope");
      },
    } as any);

    await expect(getGraphData()).rejects.toThrow(/404 Not Found/);
  });
});
