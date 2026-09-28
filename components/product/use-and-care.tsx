import { careNotes, useSteps } from "@/content/site";

export function UseAndCare() {
  return (
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
  );
}
