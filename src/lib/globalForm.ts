import type { GraphForm } from "@/lib/types";

export const GLOBAL_FORM: GraphForm = {
  id: "__global__",
  name: "Global",
  dependsOn: [],
  fields: [
    {
      id: "global_email",
      name: "email",
    },
    {
      id: "global_phone",
      name: "phone",
    },
    {
      id: "global_address",
      name: "address",
    },
  ],
};
