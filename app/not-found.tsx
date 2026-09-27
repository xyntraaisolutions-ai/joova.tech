import { Container } from "@/components/ui/container";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-24">
      <h1 className="font-display text-5xl font-extrabold">Page not found</h1>
      <p className="mt-4 text-muted">That URL is not on joova.tech.</p>
      <Link href="/" className={`${buttonClassName()} mt-8`}>
        Go home
      </Link>
    </Container>
  );
}
