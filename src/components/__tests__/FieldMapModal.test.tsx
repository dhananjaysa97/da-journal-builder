import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { FieldMapModal } from "@/components/FieldMapModal";
import type { GraphForm } from "@/lib/types";
import type { FieldMapping } from "@/lib/mapping/storage";
import { mappingConfig } from "@/config/mappingConfig";

function makeForm(
  id: string,
  name: string,
  fields: { name: string }[],
  dependsOn: string[] = [],
): GraphForm {
  return {
    id,
    name,
    dependsOn,
    fields: fields.map((f, i) => ({
      id: `${id}-fld-${i}`,
      name: f.name,
    })),
  };
}

describe("FieldMapModal", () => {
  const prevAllowAll = mappingConfig.allowAllFields;

  afterEach(() => {
    // Restore config between tests to avoid leakage
    (mappingConfig as any).allowAllFields = prevAllowAll;
  });

  test("renders nothing when closed", () => {
    const target = makeForm("T", "Target", [{ name: "email" }]);
    const dep = makeForm("A", "FormA", [{ name: "email" }]);

    const { container } = render(
      <FieldMapModal
        open={false}
        onClose={jest.fn()}
        targetForm={target}
        dependencyForms={[dep]}
        initial={{}}
        targetFieldKey={null}
        onSubmit={jest.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("filters out excluded field keys from left options and auto-maps by best target field (allowAllFields=false)", () => {
    (mappingConfig as any).allowAllFields = false;

    const target = makeForm("T", "Target", [
      { name: "email" },
      { name: "phone" },
    ]);

    const dep = makeForm("A", "FormA", [
      { name: "id" },
      { name: "email" },
      { name: "mobile" },
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
        targetFieldKey={null}
        onSubmit={onSubmit}
      />,
    );

    // Left list should include email and mobile, but not id
    expect(screen.queryByRole("option", { name: "id" })).toBeNull();
    const emailOptions = screen.getAllByRole("option", { name: "email" });
    expect(
      emailOptions.some((o) => (o as HTMLOptionElement).value === "A::email"),
    ).toBe(true);

    expect(screen.getByRole("option", { name: "mobile" })).toBeInTheDocument();

    const left = screen.getAllByRole("listbox")[0];

    // Add FormA.email
    fireEvent.change(left, { target: { value: "A::email" } });
    fireEvent.doubleClick(left);

    const right = screen.getAllByRole("listbox")[1];
    expect(right).toHaveTextContent("FormA");

    // Add FormA.mobile
    fireEvent.change(left, { target: { value: "A::mobile" } });
    fireEvent.doubleClick(left);

    expect(right).toHaveTextContent("FormA");

    fireEvent.click(screen.getByText("Submit mappings"));

    const draft = onSubmit.mock.calls[0][0] as Record<string, FieldMapping[]>;

    // Existing behavior: email should map to email, mobile should map to phone (category logic)
    expect(draft.email).toEqual([
      { sourceFormId: "A", sourceFieldKey: "email" },
    ]);
    expect(draft.phone).toEqual([
      { sourceFormId: "A", sourceFieldKey: "mobile" },
    ]);

    expect(onClose).toHaveBeenCalled();
  });

  test("removes mapping on double click in right pane", () => {
    (mappingConfig as any).allowAllFields = false;

    const target = makeForm("T", "Target", [{ name: "email" }]);
    const dep = makeForm("A", "FormA", [{ name: "email" }]);

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
        targetFieldKey={null}
        onSubmit={onSubmit}
      />,
    );

    const right = screen.getAllByRole("listbox")[1];
    fireEvent.change(right, { target: { value: "email::A::email" } });
    fireEvent.doubleClick(right);

    expect(screen.getByText("Submit mappings")).toBeDisabled();
  });

  test("allowAllFields=true: right pane shows ONLY mappings for selected target field, and adds map only to selected field", () => {
    (mappingConfig as any).allowAllFields = true;

    const target = makeForm("T", "Target", [
      { name: "email" },
      { name: "phone" },
    ]);
    const dep = makeForm("A", "FormA", [{ name: "email" }]);

    // Initial has mappings for BOTH fields in draft
    const initial = {
      email: [{ sourceFormId: "A", sourceFieldKey: "email" }],
      phone: [{ sourceFormId: "A", sourceFieldKey: "email" }],
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
        targetFieldKey={"phone"} // selected field
        onSubmit={onSubmit}
      />,
    );

    const right = screen.getAllByRole("listbox")[1];

    // Right options should only be for "phone" (value starts with "phone::")
    const rightOptions = within(right).getAllByRole("option");
    expect(rightOptions.length).toBeGreaterThan(0);
    for (const opt of rightOptions) {
      expect((opt as HTMLOptionElement).value.startsWith("phone::")).toBe(true);
    }

    // Add another mapping from left; it should go under phone only
    const left = screen.getAllByRole("listbox")[0];
    fireEvent.change(left, { target: { value: "A::email" } });
    fireEvent.doubleClick(left);

    fireEvent.click(screen.getByText("Submit mappings"));

    const draft = onSubmit.mock.calls[0][0] as Record<string, FieldMapping[]>;

    // In allowAllFields mode, additions go ONLY to selected target field ("phone")
    expect(draft.phone).toEqual([
      { sourceFormId: "A", sourceFieldKey: "email" },
    ]);

    // Email may still exist from initial, but the modal's right pane is filtered.
    // If your implementation keeps whole-form draft intact, this could remain.
    // If you chose to scope draft updates only to selected field, then it should be []/undefined.
    // We don't assert on draft.email here intentionally.
  });
});
