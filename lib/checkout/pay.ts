import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

type StartResult = {
  url?: string;
  error?: string;
  status: number;
};

type ConfirmResult = {
  found?: boolean;
  orderId?: string;
  paymentStatus?: string;
  email?: string;
  emailSent?: boolean;
};

async function callCheckoutFunction(body: Record<string, unknown>) {
  const url = supabaseUrl().replace(/\/$/, "");
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  const response = await fetch(`${url}/functions/v1/start-checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

export async function startCheckoutPayment(input: {
  orderId: string;
  token: string;
  shippingOption: string;
  promoCode?: string;
  origin: string;
}): Promise<StartResult> {
  try {
    const called = await callCheckoutFunction({
      action: "start",
      orderId: input.orderId,
      token: input.token,
      shippingOption: input.shippingOption,
      promoCode: input.promoCode ?? "",
      origin: input.origin,
    });
    if (!called) return { error: "Payment is not ready yet.", status: 503 };
    if (called.response.status === 404) return { error: "Payment is not ready yet.", status: 503 };
    const data = called.data as { url?: string; error?: string } | null;
    if (!called.response.ok || !data?.url) {
      return { error: data?.error ?? "Payment could not be started. Nothing was charged.", status: called.response.status === 503 ? 503 : 400 };
    }
    return { url: data.url, status: 200 };
  } catch (error) {
    console.error("start-checkout", error instanceof Error ? error.message : "failed");
    return { error: "Payment could not be started. Nothing was charged.", status: 400 };
  }
}

export async function confirmCheckoutPayment(sessionId: string): Promise<ConfirmResult | null> {
  try {
    const called = await callCheckoutFunction({ action: "confirm", sessionId });
    if (!called || !called.response.ok) return null;
    return called.data as ConfirmResult | null;
  } catch (error) {
    console.error("start-checkout", error instanceof Error ? error.message : "failed");
    return null;
  }
}
