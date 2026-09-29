"use client";

import Link from "next/link";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Answer({ text }: { text: string }) {
  const label = "Privacy page";
  const index = text.indexOf(label);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <Link href="/privacy" className="text-ink underline">
        {label}
      </Link>
      {text.slice(index + label.length)}
    </>
  );
}

export function Accordion({
  items,
  className,
}: {
  items: { q: string; a: string }[];
  className?: string;
}) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      className={cn("divide-y divide-stone border-y border-stone", className)}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.q} value={item.q}>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-medium">
              {item.q}
              <ChevronDown className="size-5 shrink-0 transition group-data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden pb-5 text-muted data-[state=closed]:animate-none">
            <Answer text={item.a} />
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
