import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, publicUser, userFromToken } from "@/lib/mock-store";
import { sessionToken } from "@/lib/session-cookie";

const itemSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  price: z.number().nonnegative().max(100000),
  quantity: z.number().int().positive().max(20),
  color: z.string().trim().max(80).optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  guestEmail: z.email().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "The cart could not be checked out." }, { status: 400 });
  }

  const user = await userFromToken(sessionToken(request));
  if (!user && !parsed.data.guestEmail) {
    return NextResponse.json(
      { error: "Sign in, register, or continue as a guest with your email." },
      { status: 401 },
    );
  }

  const order = await createOrder({
    userId: user?.id ?? null,
    email: user?.email ?? parsed.data.guestEmail!,
    guest: !user,
    items: parsed.data.items,
  });

  return NextResponse.json({
    orderId: order.id,
    subtotal: order.subtotal,
    user: user ? publicUser(user) : null,
    message:
      "Order saved in the preview account. Payment will go through Shopify when checkout is connected. Card details are not collected on this site.",
  });
}
