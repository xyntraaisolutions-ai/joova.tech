import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { company, policies } from "@/content/site";

const shortAbout =
  "Joova brings smart, simple and fairly priced technology into everyday life. Built by Joova Tech LLC in the USA, every Joova product is designed to be easy to use and worth it. Smarter Tech | Bigger Tomorrow.";

const values = [
  {
    title: "Honest",
    copy: "We tell you what our products do and what they don't. No hidden costs, no exaggerated claims.",
  },
  {
    title: "Simple",
    copy: "From unboxing to everyday use, everything should feel easy and natural.",
  },
  {
    title: "Warm",
    copy: "We're here to help, not to sell at any cost. Real people, real answers.",
  },
  {
    title: "Forward",
    copy: "We keep looking for better ways technology can improve daily life, and bring them to you.",
  },
] as const;

export const metadata: Metadata = {
  title: "About Joova",
  description: shortAbout,
};

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display" style={{ fontSize: "var(--text-h1)" }}>
        About Joova
      </h1>
      <p className="mt-3 font-display text-2xl font-semibold">
        Smarter Tech | Bigger Tomorrow
      </p>
      <div className="mt-6 space-y-4 text-lg">
        <p>
          Technology should make life easier, not more complicated. That simple
          idea is why we started Joova.
        </p>
        <p>
          Joova is the consumer technology brand of {company.legalName}, a
          US-based company. We design smart, good-looking devices for everyday
          life. They&apos;re easy to set up, easy to understand, and fairly
          priced. Whatever you choose, you get the same Joova experience:
          thoughtful design, honest value and support you can count on.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Our story</h2>
        <div className="mt-4 space-y-4">
          <p>
            We saw two things over and over. Great technology was either priced
            out of reach, or buried under confusing features, fine print and
            extra costs. We believed people deserved better: smart technology
            that simply works, at a price that feels fair.
          </p>
          <p>
            So we built Joova around one question:{" "}
            <em>how can technology make everyday life a little better?</em>{" "}
            Every product we choose, every design decision and every word we
            write starts there.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Our mission</h2>
        <p className="mt-4">
          To make smart technology simple, accessible and worth it, so more
          people can enjoy a smarter today and a bigger tomorrow.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">What we stand for</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.map((value) => (
            <li key={value.title} className="rounded-3xl bg-white p-5">
              <h3 className="font-bold">{value.title}.</h3>
              <p className="mt-2 text-muted">{value.copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Our promise to you</h2>
        <ul className="mt-6 space-y-4">
          <li>
            <span className="font-bold">Quality you can trust: </span>
            every product is carefully selected and quality-checked before it
            reaches you.
          </li>
          <li>
            <span className="font-bold">Fair, clear pricing: </span>
            what you see is what you pay.
          </li>
          <li>
            <span className="font-bold">{policies.returnsTitle}: </span>
            {policies.returnsSummary}{" "}
            <Link href="/returns" className="font-bold text-ink underline">
              Read the returns policy
            </Link>
            .
          </li>
          <li>
            <span className="font-bold">Support that listens: </span>
            questions, feedback or problems, our team is ready to help.{" "}
            {company.supportHours}
          </li>
          <li>
            <span className="font-bold">Always improving: </span>
            we listen to our customers and keep making Joova better.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Join us</h2>
        <p className="mt-4">
          We&apos;re just getting started, and we&apos;re glad you&apos;re
          here. Explore Joova, find something that makes your day a little
          smarter, and grow with us toward a bigger tomorrow.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/shop" className={buttonClassName("primary", "md", "w-full sm:w-fit")}>
            Explore Joova
          </Link>
          <Link href="/contact" className={buttonClassName("secondary", "md", "w-full sm:w-fit")}>
            Contact us
          </Link>
        </div>
      </section>

      <p className="mt-12 text-sm text-muted">
        {company.legalName}
        <br />
        Business address: {company.address}
      </p>
    </Container>
  );
}
