import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("@/lib/api-server", () => ({
  getGraphData: jest.fn(),
}));

jest.mock("@/lib/dataHelper", () => ({
  normalizeGraphResponse: jest.fn(),
}));

jest.mock("@/components/FormsMapperClient", () => ({
  FormsMapperClient: (props: { forms: any[] }) => (
    <div data-testid="forms-client">forms:{props.forms.length}</div>
  ),
}));

describe("Home page", () => {
  test("renders FormsMapperClient when forms exist", async () => {
    const { getGraphData } = require("@/lib/api-server") as {
      getGraphData: jest.Mock;
    };
    const { normalizeGraphResponse } = require("@/lib/dataHelper") as {
      normalizeGraphResponse: jest.Mock;
    };

    getGraphData.mockResolvedValue({ raw: true });
    normalizeGraphResponse.mockReturnValue({
      forms: [{ id: "A", name: "A", dependsOn: [], fields: [] }],
    });

    const jsx = await Home();
    render(jsx as any);

    expect(screen.getByTestId("forms-client")).toHaveTextContent("forms:1");
  });

  test("renders error UI when getGraphData throws", async () => {
    const { getGraphData } = require("@/lib/api-server") as {
      getGraphData: jest.Mock;
    };
    getGraphData.mockRejectedValue(new Error("boom"));

    const jsx = await Home();
    render(jsx as any);

    expect(screen.getByText("Could not load graph")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  test("renders empty state when no forms and no error", async () => {
    const { getGraphData } = require("@/lib/api-server") as {
      getGraphData: jest.Mock;
    };
    const { normalizeGraphResponse } = require("@/lib/dataHelper") as {
      normalizeGraphResponse: jest.Mock;
    };

    getGraphData.mockResolvedValue({ raw: true });
    normalizeGraphResponse.mockReturnValue({ forms: [] });

    const jsx = await Home();
    render(jsx as any);

    expect(
      screen.getByText("No forms found in the graph payload."),
    ).toBeInTheDocument();
  });
});
