import { inTheBox } from "@/content/site";

export function InTheBox() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {inTheBox.map((item) => (
        <li key={item} className="rounded-2xl border border-stone px-4 py-3">
          {item}
        </li>
      ))}
    </ul>
  );
}
