import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Joova by form or email at support@joova.tech. Every message gets a reply within 6 to 24 hours.",
};

export default function ContactPage() {
  return <ContactForm />;
}
