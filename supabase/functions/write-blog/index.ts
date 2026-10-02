const banned = /\b(diagnoses|cures|treats disease|detects disease|medical advice)\b/i;

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "method" }, { status: 405 });
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const url = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  const anon = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
  const openAiKey = (Deno.env.get("OPENAI_API_KEY") ?? "").trim();
  if (!url || !serviceKey || token.length < 20) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  if (!openAiKey.startsWith("sk-")) return Response.json({ error: "The OpenAI key is not stored yet." }, { status: 503 });

  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon || serviceKey },
  });
  if (!userResponse.ok) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const user = await userResponse.json() as { id?: string };
  if (!user.id) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  });
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const role = Array.isArray(profiles) ? String(profiles[0]?.role ?? "") : "";
  if (role !== "content" && role !== "super_admin") {
    return Response.json({ error: "Content access is required." }, { status: 403 });
  }

  let body: {
    mode?: string;
    topic?: string;
    productId?: string;
    title?: string;
    excerpt?: string;
    products?: { id?: string; name?: string; summary?: string; detail?: string; priceLabel?: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Check the blog topic." }, { status: 400 });
  }

  const mode = body.mode === "banner" ? "banner" : "article";
  const topic = String(body.topic ?? "").trim().slice(0, 400);
  const title = String(body.title ?? "").trim().slice(0, 160);
  const excerpt = String(body.excerpt ?? "").trim().slice(0, 400);
  if (mode === "article" && topic.length < 8) return Response.json({ error: "Add a topic of at least a few words." }, { status: 400 });
  if (mode === "banner" && title.length < 4) return Response.json({ error: "Save the title before creating a new banner." }, { status: 400 });

  const products = (Array.isArray(body.products) ? body.products : []).slice(0, 12).map((product) => ({
    id: String(product.id ?? "").slice(0, 40),
    name: String(product.name ?? "").slice(0, 80),
    summary: String(product.summary ?? "").slice(0, 400),
    detail: String(product.detail ?? "").slice(0, 500),
    priceLabel: String(product.priceLabel ?? "").slice(0, 40),
  })).filter((product) => product.name);
  const focus = String(body.productId ?? "").slice(0, 40);

  let article: Record<string, unknown> | null = null;
  if (mode === "article") {
    const written = await writeArticle(openAiKey, topic, focus, products);
    if ("error" in written) return Response.json({ error: written.error }, { status: 502 });
    article = written.article;
  }

  const imageTitle = article ? String(article.title ?? title) : title;
  const imageExcerpt = article ? String(article.excerpt ?? excerpt) : excerpt;
  const imagePrompt = [
    article ? String(article.imagePrompt ?? "") : "",
    `Editorial photograph for a Joova technology story titled "${imageTitle}". ${imageExcerpt}`,
    "Calm daylight, everyday technology, no text, no letters, no logos, no watermarks, no medical imagery.",
  ].filter(Boolean).join(" ").slice(0, 900);
  const painted = await paint(openAiKey, imagePrompt);
  return Response.json({
    article,
    bannerAlt: article ? String(article.bannerAlt ?? imageTitle) : `${imageTitle} banner`,
    ...( "imageBase64" in painted ? painted : { imageError: painted.error }),
  });
});

async function writeArticle(
  key: string,
  topic: string,
  focus: string,
  products: { id: string; name: string; summary: string; detail: string; priceLabel: string }[],
) {
  const facts = products.map((product) => (
    `${product.id}: ${product.name}. ${product.summary} ${product.detail} Price label: ${product.priceLabel || "not provided"}.`
  )).join("\n");
  const system = [
    "You write Joova blog posts. Joova makes approachable technology, including a screenless fitness band and a smart ring, plus other products listed in the facts.",
    "Wellness language only. Never say a product diagnoses, cures, treats disease, or detects disease. Heart rate, sleep, and blood oxygen are general wellness, not medical claims.",
    "Do not invent reviews, ratings, stock counts, urgency, or prices. Use a price label only when it is in the facts, unchanged.",
    "If a fact is not provided, leave it out. Do not guess battery life, sizes, or app requirements.",
    "Prefer technology and Joova products. Follow the requested topic.",
    "Write in plain sentences. No markdown, no headings inside paragraphs.",
    "Return JSON with title, description, excerpt, points (4 short lines), sections (4 items with id, heading, and 2 paragraphs), bannerAlt, and imagePrompt.",
    "Section ids are short hyphenated words. Each paragraph is 2 to 4 sentences.",
    "Close product stories with this sentence once: This is for general wellness and fitness. It does not diagnose, treat, or detect disease.",
    "imagePrompt describes a photograph with no text in the picture.",
  ].join(" ");
  const user = [
    `Topic: ${topic}`,
    focus ? `Focus product id: ${focus}` : "No single product is required.",
    "Product facts:",
    facts || "No product facts were provided. Stay general and do not invent product specs.",
  ].join("\n");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) {
    const status = response.status;
    if (status === 401 || status === 403) return { error: "The OpenAI key was not accepted." };
    return { error: "The draft could not be written. Try the topic again." };
  }
  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? "";
  let article: Record<string, unknown>;
  try {
    article = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { error: "The draft could not be written. Try the topic again." };
  }
  const text = JSON.stringify(article);
  if (banned.test(text)) return { error: "The draft used a medical claim. Try the topic again." };
  return { article };
}

async function paint(key: string, prompt: string): Promise<{ imageBase64: string; imageType: string } | { error: string }> {
  const modern = await requestImage(key, {
    model: "gpt-image-1",
    prompt,
    size: "1536x1024",
    quality: "medium",
  });
  if (modern) return modern;
  const classic = await requestImage(key, {
    model: "dall-e-3",
    prompt,
    size: "1792x1024",
    response_format: "b64_json",
  });
  if (classic) return classic;
  return { error: "The banner could not be created." };
}

async function requestImage(key: string, body: Record<string, string>) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) return null;
  const data = await response.json() as { data?: { b64_json?: string }[] };
  const imageBase64 = data.data?.[0]?.b64_json ?? "";
  if (imageBase64.length < 32 || imageBase64.length > 8_000_000) return null;
  return { imageBase64, imageType: "image/png" };
}
