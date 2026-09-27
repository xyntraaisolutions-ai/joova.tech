import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Straps",
  description: "Joova Band woven straps. Black, Blue, Green, Orange, and Red. Three straps in every box.",
};

export default function StrapsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
