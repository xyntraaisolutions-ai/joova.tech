import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export async function alertStaff(input: { kind: "return" | "warranty"; orderId?: string; email?: string; id?: string }) {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return;
  await fetch(`${url.replace(/\/$/, "")}/functions/v1/staff-notify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: input.kind,
      orderId: input.orderId ?? "",
      email: input.email ?? "",
      id: input.id ?? "",
    }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
}
