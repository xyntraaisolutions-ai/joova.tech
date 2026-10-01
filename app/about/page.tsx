import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { LastUpdated } from "@/components/content/last-updated";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { pageCopy } = await loadContentBundle();
  return {
    title: "About Joova",
    description: pageCopy.about.shortAbout,
  };
}

export default async function AboutPage() {
  const { company, policies, pageCopy } = await loadContentBundle();
  const about = pageCopy.about;
  const values = [
    { title: "Honest", copy: about.honest },
    { title: "Simple", copy: about.simple },
    { title: "Warm", copy: about.warm },
    { title: "Forward", copy: about.forward },
  ];
  return (
    <Container className="py-10 md:py-16">
      <article className="mx-auto w-full max-w-[40rem]">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        About Joova
      </h1>
      <LastUpdated value={about.updatedOn} />
      <p className="mt-3 font-display text-2xl font-semibold">
        Smarter Tech | Bigger Tomorrow
      </p>
      <div className="mt-6 space-y-4 text-lg">
        <p>
          {about.idea}
        </p>
        <p>
          Joova is the consumer technology brand of {company.legalName}, a
          US-based company. {about.brand}
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Our story</h2>
        <div className="mt-4 space-y-4 hyphens-auto text-justify">
          <p>
            {about.story1}
          </p>
          <p>
            So we built Joova around one question:{" "}
            <em>how can technology make everyday life a little better?</em>{" "}
            {about.story2}
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Our mission</h2>
        <p className="mt-4 hyphens-auto text-justify">
          {about.mission}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">What we stand for</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.map((value) => (
            <li key={value.title} className="rounded-3xl bg-white p-5">
              <h3 className="font-bold">{value.title}.</h3>
              <p className="mt-2 hyphens-auto text-justify text-muted">{value.copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Our promise to you</h2>
        <ul className="mt-6 space-y-4 hyphens-auto text-justify">
          <li>
            <span className="font-bold">Quality you can trust: </span>
            {about.quality}
          </li>
          <li>
            <span className="font-bold">Fair, clear pricing: </span>
            {about.pricing}
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
            {about.improving}
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Join us</h2>
        <p className="mt-4 hyphens-auto text-justify">
          {about.join}
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
      </article>
    </Container>
  );
}
