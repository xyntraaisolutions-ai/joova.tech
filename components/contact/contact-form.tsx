"use client";

import { useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";

export function ContactForm() {
  const { support } = useSiteContent();
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");

  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Contact Us
      </h1>
      <p className="mt-4 text-lg text-muted">{support.promise}</p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {support.channels.map((channel) => (
          <li key={channel.id} className="rounded-3xl border border-stone bg-white p-5">
            <p className="font-display text-xl font-extrabold">{channel.label}</p>
            <p className="mt-2 text-muted">Reply {channel.reply}.</p>
            {channel.id === "email" && "href" in channel ? (
              <a className="mt-3 inline-block font-medium underline" href={channel.href}>
                {support.email}
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      {status === "success" ? (
        <p className="mt-10" role="status">
          Thanks. Your email app should open with this message addressed to{" "}
          {support.email}. We reply to form messages within 6 hours.
        </p>
      ) : (
        <form
          className="mt-10 space-y-4 rounded-3xl border border-stone bg-white p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (website) return;
            const data = new FormData(event.currentTarget);
            const name = String(data.get("name") ?? "");
            const email = String(data.get("email") ?? "");
            const message = String(data.get("message") ?? "");
            setError("");
            void fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, message }),
            })
              .then((response) => response.json())
              .then((body: { saved?: boolean }) => {
                if (body.saved) {
                  setStatus("success");
                  return;
                }
                setError("The message was not saved.");
              })
              .catch(() => setError("The message was not saved."));
          }}
        >
          <h2 className="font-display text-2xl font-extrabold">Send a message</h2>
          <p className="text-muted">
            Fill in the form and submit. We reply within 6 hours.
          </p>
          <label className="block">
            <span className="text-sm font-medium text-ink">Name</span>
            <Input className="mt-2" name="name" required autoComplete="name" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <Input className="mt-2" type="email" name="email" required autoComplete="email" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Message</span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-2xl border border-stone bg-white p-4 text-[17px] text-ink"
            />
          </label>
          <div className="hidden" aria-hidden>
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>
          {error ? (
            <p className="text-sm text-band-red" role="alert">
              {error} Email{" "}
              <a className="font-bold text-ink underline" href={`mailto:${support.email}`}>{support.email}</a>{" "}
              instead.
            </p>
          ) : null}
          <Button type="submit" className="w-full sm:w-fit">Submit</Button>
        </form>
      )}
    </Container>
  );
}
