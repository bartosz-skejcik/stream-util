export interface Column {
  key: string;
  label: string;
}

export const allColumns: Column[] = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "response", label: "Response" },
  { key: "enabled", label: "Enabled" },
  { key: "cooldown_seconds", label: "Cooldown (s)" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
];
