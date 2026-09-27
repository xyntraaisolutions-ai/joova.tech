import { specs } from "@/content/site";

export function SpecsTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone">
      <table className="w-full text-left">
        <caption className="sr-only">Joova Band specifications</caption>
        <tbody>
          {specs.map((row) => (
            <tr key={row.label} className="border-t border-stone first:border-t-0">
              <th className="w-40 px-4 py-3 align-top font-medium">{row.label}</th>
              <td className="px-4 py-3 text-muted">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
