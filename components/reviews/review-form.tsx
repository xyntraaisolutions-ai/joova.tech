"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Product = { id: string; name: string };

export function ReviewForm() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const id = orderId.trim().toUpperCase();
    const mail = email.trim().toLowerCase();
    if (id.length < 4 || !mail.includes("@")) {
      setProducts([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/reviews?order=${encodeURIComponent(id)}&email=${encodeURIComponent(mail)}`)
        .then((response) => response.json())
        .then((data: { products?: Product[] }) => {
          const next = data.products ?? [];
          setProducts(next);
          setProductId((current) => next.some((item) => item.id === current) ? current : next[0]?.id ?? "");
        })
        .catch(() => setProducts([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [orderId, email]);

  return (
    <form
      className="mt-8 max-w-xl space-y-4 rounded-3xl border border-stone bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, email, productId, author, body }),
        });
        const data = (await response.json()) as { error?: string };
        setPending(false);
        if (!response.ok) {
          setError(data.error ?? "The review could not be sent.");
          return;
        }
        setMessage("Thank you. We will read this before it appears on the page.");
        setBody("");
      }}
    >
      <h2 className="font-display text-2xl">Share a review</h2>
      <p className="text-sm text-muted">Use the email and order number from a delivered order. Reviews stay unpublished until Content approves them.</p>
      {message ? <p role="status">{message}</p> : null}
      <label className="block text-sm">Order number<Input className="mt-2" required value={orderId} onChange={(event) => setOrderId(event.target.value)} /></label>
      <label className="block text-sm">Email<Input className="mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
      {products.length ? (
        <label className="block text-sm">
          Item
          <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" required value={productId} onChange={(event) => setProductId(event.target.value)}>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>
      ) : (
        <p className="text-sm text-muted">Enter a delivered order and its email to choose an item.</p>
      )}
      <label className="block text-sm">Name to show<Input className="mt-2" required maxLength={80} value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
      <label className="block text-sm">
        Review
        <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-stone bg-white px-4 py-3 text-[17px] text-ink" required minLength={12} maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending || !productId}>{pending ? "Sending" : "Send review"}</Button>
    </form>
  );
}
