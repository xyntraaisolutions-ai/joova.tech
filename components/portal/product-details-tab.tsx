"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Glance = { label: string; text: string };
export type SpecDraft = { label: string; value: string };

const fieldClass = "mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3";

export function ProductDetailsTab({
  summary,
  lead,
  kicker,
  detail,
  note,
  signals,
  specifications,
  inTheBox,
  compatibility,
  care,
  app,
  onSummary,
  onLead,
  onKicker,
  onDetail,
  onNote,
  onSignals,
  onSpecifications,
  onInTheBox,
  onCompatibility,
  onCare,
  onApp,
}: {
  summary: string;
  lead: string;
  kicker: string;
  detail: string;
  note: string;
  signals: Glance[];
  specifications: SpecDraft[];
  inTheBox: string;
  compatibility: string;
  care: string;
  app: string;
  onSummary: (value: string) => void;
  onLead: (value: string) => void;
  onKicker: (value: string) => void;
  onDetail: (value: string) => void;
  onNote: (value: string) => void;
  onSignals: (value: Glance[]) => void;
  onSpecifications: (value: SpecDraft[]) => void;
  onInTheBox: (value: string) => void;
  onCompatibility: (value: string) => void;
  onCare: (value: string) => void;
  onApp: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-4">
      <p className="text-sm text-muted">The highlight line and highlighted summary appear on the homepage hero when this product is highlighted. The sections below appear on the product page under About this product.</p>
      <label className="text-sm">
        Eyebrow
        <Input className="mt-2" data-field="kicker" value={kicker} maxLength={80} onChange={(event) => onKicker(event.target.value)} />
        <span className="mt-1 block text-xs text-muted">Optional short label above the product name in the hero.</span>
      </label>
      <label className="text-sm">
        Highlight line
        <Input className="mt-2" data-field="lead" value={lead} maxLength={160} onChange={(event) => onLead(event.target.value)} />
        <span className="mt-1 block text-xs text-muted">One short sentence under the name in the hero and on the product page.</span>
      </label>
      <label className="text-sm">
        Highlighted summary
        <textarea className={fieldClass} data-field="summary" value={summary} maxLength={1200} onChange={(event) => onSummary(event.target.value)} required />
        <span className="mt-1 block text-xs text-muted">Shown in the hero for a highlighted product, and on shop cards.</span>
      </label>
      <fieldset className="text-sm">
        <legend className="font-bold">Hero glance</legend>
        <p className="mt-1 text-xs text-muted">Up to four short facts under the hero photo. Leave a row empty to skip it.</p>
        <div className="mt-3 grid gap-3">
          {signals.map((signal, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              <label>
                Label
                <Input
                  className="mt-2"
                  value={signal.label}
                  maxLength={40}
                  onChange={(event) => {
                    const next = signals.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item);
                    onSignals(next);
                  }}
                />
              </label>
              <label>
                Text
                <Input
                  className="mt-2"
                  value={signal.text}
                  maxLength={80}
                  onChange={(event) => {
                    const next = signals.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item);
                    onSignals(next);
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      <label className="text-sm">
        Overview
        <textarea className={fieldClass} data-field="detail" value={detail} maxLength={4000} onChange={(event) => onDetail(event.target.value)} />
        <span className="mt-1 block text-xs text-muted">The Overview tab on the product page. Separate paragraphs with a blank line.</span>
      </label>
      <fieldset className="text-sm">
        <legend className="font-bold">Specifications</legend>
        <div className="mt-3 grid gap-3">
          {specifications.map((row, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <label>
                Label
                <Input
                  className="mt-2"
                  value={row.label}
                  maxLength={80}
                  onChange={(event) => onSpecifications(specifications.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))}
                />
              </label>
              <label>
                Value
                <Input
                  className="mt-2"
                  value={row.value}
                  maxLength={240}
                  onChange={(event) => onSpecifications(specifications.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))}
                />
              </label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onSpecifications(specifications.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          className="mt-3"
          type="button"
          size="sm"
          variant="secondary"
          disabled={specifications.length >= 16}
          onClick={() => onSpecifications([...specifications, { label: "", value: "" }])}
        >
          Add specification
        </Button>
      </fieldset>
      <label className="text-sm">
        In the box
        <textarea className={fieldClass} value={inTheBox} maxLength={2000} onChange={(event) => onInTheBox(event.target.value)} />
        <span className="mt-1 block text-xs text-muted">One item on each line.</span>
      </label>
      <label className="text-sm">
        Compatibility
        <textarea className={fieldClass} value={compatibility} maxLength={2000} onChange={(event) => onCompatibility(event.target.value)} />
      </label>
      <label className="text-sm">
        Care
        <textarea className={fieldClass} value={care} maxLength={2000} onChange={(event) => onCare(event.target.value)} />
      </label>
      <label className="text-sm">
        The app
        <textarea className={fieldClass} value={app} maxLength={2000} onChange={(event) => onApp(event.target.value)} />
      </label>
      <label className="text-sm">
        Important note
        <textarea className={fieldClass} data-field="note" value={note} maxLength={500} onChange={(event) => onNote(event.target.value)} />
        <span className="mt-1 block text-xs text-muted">Shown under the product details. Use this for wellness limits and other facts shoppers should see.</span>
      </label>
    </div>
  );
}
