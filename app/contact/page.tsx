import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Joova support. We reply within 24 hours on weekdays.",
};

export default function ContactPage() {
  return <ContactForm />;
}
