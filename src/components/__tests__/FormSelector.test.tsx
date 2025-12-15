import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormSelector } from "@/components/FormSelector";
import type { GraphForm } from "@/lib/types";

describe("FormSelector", () => {
  const forms: GraphForm[] = [
    { id: "A", name: "FormA", dependsOn: [], fields: [] },
    { id: "B", name: "FormB", dependsOn: ["A"], fields: [] },
  ];

  test("renders options and calls onSelect", () => {
    const onSelect = jest.fn();
    render(
      <FormSelector forms={forms} selectedFormId={"A"} onSelect={onSelect} />,
    );

    const select = screen.getByRole("combobox");
    // Select B
    fireEvent.change(select, { target: { value: "B" } });
    expect(onSelect).toHaveBeenCalledWith("B");

    // Options should include both forms
    expect(screen.getByText("FormA")).toBeInTheDocument();
    expect(screen.getByText("FormB")).toBeInTheDocument();
  });
});
