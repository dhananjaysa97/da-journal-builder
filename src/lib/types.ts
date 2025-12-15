export type GraphField = {
  id: string;
  name: string; // key
};

export type GraphForm = {
  id: string; // node id 
  name: string; // display name
  label?: string;
  dependsOn: string[]; // node ids this form depends on
  fields: GraphField[];
};

export type NormalizedGraph = {
  forms: GraphForm[];
};

export interface FieldSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
}

export interface Form {
  id: string;
  name: string;
  field_schema: FieldSchema;
}

// Node data for a form node in the graph
export interface FormNodeData {
  id: string;
  component_key: string;
  component_type: "form";
  component_id: string;
  name: string;
  prerequisites: string[]; // IDs of prerequisite form nodes
  input_mapping: Record<string, unknown>;
}

// A node in the graph (all are form nodes in this example)
export interface Node {
  id: string;
  type: "form";
  data: FormNodeData;
}

// Edge connecting nodes (prerequisites flow)
export interface Edge {
  source: string; // Node ID
  target: string; // Node ID
}

// Main graph blueprint interface
export interface GraphApiResponse {
  nodes: Node[];
  edges: Edge[];
  forms: Form[];
}
