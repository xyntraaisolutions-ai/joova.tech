import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  canAccess,
  isRole,
  isViewAs,
  portalHome,
  VIEW_AS_COOKIE,
  type PortalArea,
  type Role,
  type ViewAs,
} from "@/lib/portal/roles";
import { roleForAccount } from "@/lib/portal/super-admin";

export type PortalProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export async function readPortalProfile() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const profile = await supabase
    .from("profiles")
    .select("id, name, email, role, active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile.data || !isRole(profile.data.role)) return null;
  const role = await roleForAccount(profile.data.email, profile.data.role);
  if (!profile.data.active && role !== "super_admin") return null;
  if (!isRole(role)) return null;
  return {
    supabase,
    profile: { ...profile.data, role } as PortalProfile,
  };
}

export async function readViewAs(role: Role) {
  if (role !== "super_admin") return null;
  const jar = await cookies();
  const value = jar.get(VIEW_AS_COOKIE)?.value ?? null;
  return isViewAs(value) ? value : null;
}

export async function requirePortalPage(area: PortalArea) {
  const session = await readPortalProfile();
  if (!session) redirect("/account?mode=sign-in&next=/portal");
  if (!isStaffRole(session.profile.role)) redirect("/account");
  if (!canAccess(session.profile.role, area)) {
    redirect(portalHome(session.profile.role, await readViewAs(session.profile.role)));
  }
  const viewAs = await readViewAs(session.profile.role);
  return { ...session, viewAs };
}

function isStaffRole(role: Role) {
  return role !== "customer";
}
