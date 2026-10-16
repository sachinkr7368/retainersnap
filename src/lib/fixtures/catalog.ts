export const previewShots = [
  { id: "components", title: "Components" },
  { id: "dashboard", title: "Dashboard" },
  { id: "clients", title: "Clients" },
  { id: "client", title: "Client" },
  { id: "new-client", title: "New client" },
  { id: "new-site", title: "New site" },
  { id: "site", title: "Site" },
  { id: "reports", title: "Reports" },
  { id: "report", title: "Report" },
  { id: "billing", title: "Billing" },
  { id: "settings", title: "Settings" },
  { id: "health", title: "Health result" },
  { id: "empty", title: "Empty states" },
] as const;

export type PreviewShotId = (typeof previewShots)[number]["id"];
