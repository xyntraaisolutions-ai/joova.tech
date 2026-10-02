export const ROLES = ["customer", "csr", "inventory", "content", "super_admin"] as const;

export type Role = (typeof ROLES)[number];

export const VIEW_AS = ["csr", "inventory", "content", "customer"] as const;

export type ViewAs = (typeof VIEW_AS)[number];

export const VIEW_AS_COOKIE = "joova-view-as";

export const roleLabels: Record<Role, string> = {
  customer: "Customer",
  csr: "Customer Support",
  inventory: "Inventory Manager",
  content: "Content Manager",
  super_admin: "Super Admin",
};

export function isRole(value: string | null | undefined): value is Role {
  return ROLES.includes(value as Role);
}

export function isViewAs(value: string | null | undefined): value is ViewAs {
  return VIEW_AS.includes(value as ViewAs);
}

export function isStaff(role: Role) {
  return role !== "customer";
}

export type PortalArea = "support" | "inventory" | "content" | "admin";

export function canAccess(role: Role, area: PortalArea) {
  if (role === "super_admin") return true;
  if (area === "support") return role === "csr";
  if (area === "inventory") return role === "inventory";
  if (area === "content") return role === "content";
  return false;
}

export function portalHome(role: Role, viewAs: ViewAs | null) {
  const shown = role === "super_admin" && viewAs ? viewAs : role;
  if (shown === "csr") return "/portal/support";
  if (shown === "inventory") return "/portal/inventory";
  if (shown === "content") return "/portal/content";
  if (shown === "customer") return "/portal/support";
  return "/portal/admin";
}
