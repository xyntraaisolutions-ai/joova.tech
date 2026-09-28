import { batteryFacts, careNotes, useSteps } from "@/content/site";

export function UseAndCare() {
  return (
    <div className="space-y-10">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {batteryFacts.map((fact) => (
          <div key={fact.label} className="rounded-3xl border border-stone bg-white p-5">
            <dt className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              {fact.label}
            </dt>
            <dd className="font-display mt-3 text-2xl font-extrabold leading-tight">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-2xl font-extrabold">How to use it</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted">
            {useSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="space-y-6">
          {careNotes.map((note) => (
            <div key={note.title}>
              <h3 className="font-display text-2xl font-extrabold">{note.title}</h3>
              <p className="mt-2 text-muted">{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
