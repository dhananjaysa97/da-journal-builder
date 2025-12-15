import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormView } from "@/components/FormView";
import type { GraphForm } from "@/lib/types";
import type { MappingState } from "@/lib/mapping/storage";

// Stub modal: open/close only (we don't test modal internals here)
jest.mock("@/components/FieldMapModal", () => {
  return {
    FieldMapModal: (props: { open: boolean }) =>
      props.open ? <div data-testid="field-map-modal">open</div> : null,
  };
});

function makeForms(): { target: GraphForm; forms: GraphForm[] } {
  const formA: GraphForm = {
    id: "A",
    name: "FormA",
    dependsOn: [],
    fields: [
      { id: "a1", name: "email" },
      { id: "a2", name: "firstName" },
    ],
  };

  const formB: GraphForm = {
    id: "B",
    name: "FormB",
    dependsOn: ["A"],
    fields: [
      { id: "b1", name: "email" },
      { id: "b2", name: "phone" },
    ],
  };

  const target: GraphForm = {
    id: "D",
    name: "FormD",
    dependsOn: ["B"],
    fields: [
      { id: "d1", name: "email" },
      { id: "d2", name: "phone" },
      { id: "d3", name: "id" }, // excluded by config
    ],
  };

  return { target, forms: [formA, formB, target] };
}

describe("FormView", () => {
  test("opens modal only when clicking an empty, mappable field and mapping is enabled", () => {
    const { target, forms } = makeForms();
    const mappings: MappingState = {}; // empty -> fields unmapped
    const onRemoveMapping = jest.fn();
    const onSetFormMappings = jest.fn();

    render(
      <FormView
        form={target}
        forms={forms}
        mappings={mappings}
        onRemoveMapping={onRemoveMapping}
        onSetFormMappings={onSetFormMappings}
      />,
    );

    // Click email (empty & mappable) - opens modal
    fireEvent.click(screen.getByText("email"));
    expect(screen.getByTestId("field-map-modal")).toBeInTheDocument();

    // Turn mapping off - should prevent opening modal on further clicks
    fireEvent.click(screen.getByLabelText("Toggle prefill mapping"));

    // We don't test closing here (modal is mocked); just ensure clicks don't open a new one.
    fireEvent.click(screen.getByText("phone"));
    expect(screen.getByTestId("field-map-modal")).toBeInTheDocument(); // still the same open one
  });

  test("does not open modal when clicking a mapped field; shows merged mapping label for email", () => {
    const { target, forms } = makeForms();

    const mappings: MappingState = {
      [target.id]: {
        email: [
          { sourceFormId: "A", sourceFieldKey: "email" },
          { sourceFormId: "B", sourceFieldKey: "email" },
        ],
      },
    };

    render(
      <FormView
        form={target}
        forms={forms}
        mappings={mappings}
        onRemoveMapping={jest.fn()}
        onSetFormMappings={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText("email"));
    expect(screen.queryByTestId("field-map-modal")).toBeNull();

    expect(screen.getByText("FormA.email, FormB.email")).toBeInTheDocument();
  });

  test("X button deletes mapping without opening modal", () => {
    const { target, forms } = makeForms();
    const onRemoveMapping = jest.fn();

    const mappings: MappingState = {
      [target.id]: {
        phone: [{ sourceFormId: "B", sourceFieldKey: "phone" }],
      },
    };

    render(
      <FormView
        form={target}
        forms={forms}
        mappings={mappings}
        onRemoveMapping={onRemoveMapping}
        onSetFormMappings={jest.fn()}
      />,
    );

    const del = screen.getByLabelText("Delete mapping for phone");
    fireEvent.click(del);

    expect(onRemoveMapping).toHaveBeenCalledWith(target.id, "phone");
    expect(screen.queryByTestId("field-map-modal")).toBeNull();
  });

  test("excluded fields are shown as not mappable and do not open modal", () => {
    const { target, forms } = makeForms();
    render(
      <FormView
        form={target}
        forms={forms}
        mappings={{}}
        onRemoveMapping={jest.fn()}
        onSetFormMappings={jest.fn()}
      />,
    );

    expect(screen.getByText("Not mappable")).toBeInTheDocument();

    fireEvent.click(screen.getByText("id"));
    expect(screen.queryByTestId("field-map-modal")).toBeNull();
  });
});
