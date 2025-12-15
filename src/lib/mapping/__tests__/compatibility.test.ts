import { fieldCategory, isCompatible } from "@/lib/mapping/compatibility";

describe("mapping/compatibility", () => {
  describe("fieldCategory", () => {
    test("categorizes email fields", () => {
      expect(fieldCategory({ name: "email" })).toBe("email");
      expect(fieldCategory({ name: "userEmail" })).toBe("email");
      expect(fieldCategory({ name: "primary_email" })).toBe("email");
    });

    test("categorizes phone fields", () => {
      expect(fieldCategory({ name: "phone" })).toBe("phone");
      expect(fieldCategory({ name: "mobile" })).toBe("phone");
      expect(fieldCategory({ name: "mobileNumber" })).toBe("phone");
      expect(fieldCategory({ name: "user_phone" })).toBe("phone");
    });

    test("categorizes date fields", () => {
      expect(fieldCategory({ name: "date" })).toBe("date");
      expect(fieldCategory({ name: "startDate" })).toBe("date");
      expect(fieldCategory({ name: "end_date" })).toBe("date");
      expect(fieldCategory({ name: "birthdate" })).toBe("date");
    });

    test("categorizes address fields", () => {
      expect(fieldCategory({ name: "address" })).toBe("address");
      expect(fieldCategory({ name: "homeAddress" })).toBe("address");
      expect(fieldCategory({ name: "address_line1" })).toBe("address");
    });

    test("defaults to text", () => {
      expect(fieldCategory({ name: "firstName" })).toBe("text");
      expect(fieldCategory({ name: "dynamic_object" })).toBe("text");
      expect(fieldCategory({ name: "" })).toBe("text");
    });

    test("is case-insensitive", () => {
      expect(fieldCategory({ name: "EMAIL" })).toBe("email");
      expect(fieldCategory({ name: "Mobile" })).toBe("phone");
      expect(fieldCategory({ name: "StartDATE" })).toBe("date");
      expect(fieldCategory({ name: "HomeADDRESS" })).toBe("address");
    });
  });

  describe("isCompatible", () => {
    test("returns true when categories match", () => {
      expect(isCompatible({ name: "email" }, { name: "userEmail" })).toBe(true);
      expect(isCompatible({ name: "phone" }, { name: "mobileNumber" })).toBe(
        true,
      );
      expect(isCompatible({ name: "startDate" }, { name: "end_date" })).toBe(
        true,
      );
      expect(
        isCompatible({ name: "homeAddress" }, { name: "address_line1" }),
      ).toBe(true);
      expect(
        isCompatible({ name: "firstName" }, { name: "dynamic_object" }),
      ).toBe(true); // both text
    });

    test("returns false when categories differ", () => {
      expect(isCompatible({ name: "email" }, { name: "phone" })).toBe(false);
      expect(isCompatible({ name: "phone" }, { name: "startDate" })).toBe(
        false,
      );
      expect(isCompatible({ name: "address" }, { name: "email" })).toBe(false);
      expect(
        isCompatible({ name: "startDate" }, { name: "dynamic_object" }),
      ).toBe(false); // date vs text
    });

    test("handles empty or missing-ish names safely", () => {
      // Your implementation should treat "" as text
      expect(isCompatible({ name: "" }, { name: "firstName" })).toBe(true);
      expect(isCompatible({ name: "" }, { name: "email" })).toBe(false);
    });
  });
});
