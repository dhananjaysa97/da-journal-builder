import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FieldMapModal } from "@/components/FieldMapModal";
import type { GraphForm } from "@/lib/types";
import type { FieldMapping } from "@/lib/mapping/storage";

function makeForm(
  id: string,
  name: string,
  fields: { name: string; type?: string; label?: string }[],
  dependsOn: string[] = [],
): GraphForm {
  return {
    id,
    name,
    dependsOn,
    fields: fields.map((f, i) => ({
      id: `${id}-fld-${i}`,
      name: f.name,
      type: f.type,
      label: f.label ?? f.name,
    })),
  };
}

describe("FieldMapModal", () => {
  test("renders nothing when closed", () => {
    const target = makeForm("T", "Target", [{ name: "email", type: "email" }]);
    const dep = makeForm("A", "FormA", [{ name: "email", type: "email" }]);

    const { container } = render(
      <FieldMapModal
        open={false}
        onClose={jest.fn()}
        targetForm={target}
        dependencyForms={[dep]}
        initial={{}}
        onSubmit={jest.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("filters out excluded field keys from left options and auto-maps by best target field", () => {
    const target = makeForm("T", "Target", [
      { name: "email", type: "email" },
      { name: "phone", type: "phone" },
    ]);

    const dep = makeForm("A", "FormA", [
      { name: "id", type: "text", label: "ID" },
      { name: "email", type: "email" },
      { name: "mobile", type: "phone", label: "Mobile" },
    ]);

    const onSubmit = jest.fn();
    const onClose = jest.fn();

    render(
      <FieldMapModal
        open={true}
        onClose={onClose}
        targetForm={target}
        dependencyForms={[dep]}
        initial={{}}
        onSubmit={onSubmit}
      />,
    );

    // Left list should include email and mobile, but not id
    expect(screen.queryByText("id")).toBeNull();
    expect(screen.getAllByRole("option", { name: "email" })).toHaveLength(2);
    expect(screen.getByText("mobile")).toBeInTheDocument();

    const left = screen.getAllByRole("listbox")[0];

    fireEvent.change(left, { target: { value: "A::email" } });
    fireEvent.doubleClick(left);

    // Now right list should show the selected mapping
    const right = screen.getAllByRole("listbox")[1];
    expect(right).toHaveTextContent("FormA");

    fireEvent.change(left, { target: { value: "A::mobile" } });
    fireEvent.doubleClick(left);
    expect(right).toHaveTextContent("FormA");

    fireEvent.click(screen.getByText("Submit mappings"));

    const draft = onSubmit.mock.calls[0][0] as Record<string, FieldMapping[]>;
    expect(draft.email).toEqual([
      { sourceFormId: "A", sourceFieldKey: "email" },
    ]);
    expect(draft.phone).toEqual([
      { sourceFormId: "A", sourceFieldKey: "mobile" },
    ]);

    expect(onClose).toHaveBeenCalled();
  });

  test("removes mapping on double click in right pane", () => {
    const target = makeForm("T", "Target", [{ name: "email", type: "email" }]);
    const dep = makeForm("A", "FormA", [{ name: "email", type: "email" }]);

    const initial = {
      email: [{ sourceFormId: "A", sourceFieldKey: "email" }],
    };

    const onSubmit = jest.fn();
    const onClose = jest.fn();

    render(
      <FieldMapModal
        open={true}
        onClose={onClose}
        targetForm={target}
        dependencyForms={[dep]}
        initial={initial}
        onSubmit={onSubmit}
      />,
    );

    const right = screen.getAllByRole("listbox")[1];
    fireEvent.change(right, { target: { value: "email::A::email" } });
    fireEvent.doubleClick(right);

    expect(screen.getByText("Submit mappings")).toBeDisabled();
  });
});
