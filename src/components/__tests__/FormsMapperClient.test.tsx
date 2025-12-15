import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormsMapperClient } from "@/components/FormsMapperClient";
import type { GraphForm } from "@/lib/types";
import type { MappingState } from "@/lib/mapping/storage";

jest.mock("@/lib/mapping/storage", () => {
  return {
    loadMappings: jest.fn(),
    saveMappings: jest.fn(),
  };
});

// Mock child components so we can trigger state changes deterministically
jest.mock("@/components/FormSelector", () => {
  return {
    FormSelector: (props: { onSelect: (id: string) => void }) => (
      <button onClick={() => props.onSelect("B")}>select-b</button>
    ),
  };
});

jest.mock("@/components/FormView", () => {
  return {
    FormView: (props: {
      form: { id: string };
      onSetFormMappings: (formId: string, draft: Record<string, any>) => void;
      onRemoveMapping: (formId: string, fieldKey: string) => void;
    }) => (
      <div>
        <div data-testid="active-form">{props.form.id}</div>
        <button
          onClick={() =>
            props.onSetFormMappings(props.form.id, {
              email: [{ sourceFormId: "A", sourceFieldKey: "email" }],
            })
          }
        >
          set-mapping
        </button>
        <button onClick={() => props.onRemoveMapping(props.form.id, "email")}>
          remove-email
        </button>
      </div>
    ),
  };
});

describe("FormsMapperClient", () => {
  const forms: GraphForm[] = [
    { id: "A", name: "FormA", dependsOn: [], fields: [] },
    { id: "B", name: "FormB", dependsOn: [], fields: [] },
  ];

  test("loads mappings on mount and saves when mappings change", async () => {
    const { loadMappings, saveMappings } = require("@/lib/mapping/storage") as {
      loadMappings: jest.Mock;
      saveMappings: jest.Mock;
    };

    const loaded: MappingState = {
      B: { phone: [{ sourceFormId: "A", sourceFieldKey: "phone" }] },
    };
    loadMappings.mockReturnValue(loaded);

    render(<FormsMapperClient forms={forms} />);

    // shows loading first
    expect(screen.queryByText(/loading mappings/i)).toBeNull();

    // after hydration, main heading should appear
    await waitFor(() =>
      expect(screen.getByText("Forms Mapper")).toBeInTheDocument(),
    );
    expect(loadMappings).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(saveMappings).toHaveBeenCalledWith(loaded));

    // trigger another mapping change via mocked FormView
    fireEvent.click(screen.getByText("set-mapping"));

    await waitFor(() =>
      expect(saveMappings).toHaveBeenCalledWith({
        A: { email: [{ sourceFormId: "A", sourceFieldKey: "email" }] },
        B: { phone: [{ sourceFormId: "A", sourceFieldKey: "phone" }] },
      }),
    );
  });

  test("clears localStorage key and resets mappings", async () => {
    const { loadMappings, saveMappings } = require("@/lib/mapping/storage") as {
      loadMappings: jest.Mock;
      saveMappings: jest.Mock;
    };

    loadMappings.mockReturnValue({
      B: { email: [{ sourceFormId: "A", sourceFieldKey: "email" }] },
    });

    // confirm() is used by the Clear button
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const rm = jest.spyOn(window.localStorage.__proto__, "removeItem");

    render(<FormsMapperClient forms={forms} />);
    await waitFor(() =>
      expect(screen.getByText("Forms Mapper")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Clear mappings"));
    expect(rm).toHaveBeenCalledWith("forms-mapper:mappings:v2");

    // saveMappings should be called with {} after reset (implementation detail, but stable)
    await waitFor(() => expect(saveMappings).toHaveBeenCalledWith({}));

    (window.confirm as jest.Mock).mockRestore();
    rm.mockRestore();
  });
});
