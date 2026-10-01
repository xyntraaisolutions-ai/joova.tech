import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReviewForm } from "@/components/reviews/review-form";
import { Container } from "@/components/ui/container";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Real Joova reviews will appear here after we have at least 10 verified buyer reviews.",
};

export default async function ReviewsPage() {
  let reviews: { id: string; author: string; body: string }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("reviews").select("id, author, body").eq("published", true);
    reviews = data ?? [];
  }

  return (
    <Container className="py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Reviews
      </h1>
      {reviews.length < 10 ? (
        <p className="mt-6 max-w-2xl text-muted">
          This page stays empty until we have at least 10 genuine reviews. Paid
          creator content will be marked.           We never fabricate ratings.{" "}
          <Link className="font-bold text-ink underline" href="/shop">Shop Joova</Link>
        </p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-3xl border border-stone bg-white p-6">
              <p className="font-bold">{review.author}</p>
              <p className="mt-2 text-muted">{review.body}</p>
            </li>
          ))}
        </ul>
      )}
      <Suspense fallback={null}>
        <ReviewForm />
      </Suspense>
    </Container>
  );
}
