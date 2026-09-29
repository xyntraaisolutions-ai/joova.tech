import { paymentMethods } from "@/content/site";
import { cn } from "@/lib/utils";

function Mark({ id }: { id: (typeof paymentMethods)[number]["id"] }) {
  if (id === "amex") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="#1F72CD" />
        <text x="24" y="14" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">
          AM
        </text>
        <text x="24" y="24" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">
          EX
        </text>
      </svg>
    );
  }
  if (id === "apple-pay") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="#fff" />
        <path
          fill="#111"
          d="M18.2 11.2c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.5-.7 1.2-.6 1.9.7.1 1.4-.3 1.8-.9zm.6 1c-1-.1-1.8.6-2.3.6s-1.2-.5-2-.5-1.5.5-2.3 1.4c-.8 1-1.2 2.5-.5 4 .4.8.9 1.6 1.6 1.6.6 0 .9-.4 1.7-.4s1 .4 1.7.4 1.2-.8 1.6-1.6c.5-.7.7-1.4.7-1.5-.1 0-1.4-.5-1.4-2.1 0-1.3 1.1-1.9 1.1-2 0-.1-.6-1-.9-.9z"
        />
        <text x="27" y="20" fill="#111" fontSize="8" fontWeight="600">
          Pay
        </text>
      </svg>
    );
  }
  if (id === "bancontact") {
    return (
      <svg viewBox="0 0 78 32" className="h-8 w-[4.75rem]" aria-hidden="true">
        <rect width="78" height="32" rx="4" fill="#fff" />
        <path fill="#005AB9" d="M6 8h10l-4 16H6z" />
        <path fill="#FFD100" d="M12 8h6l-4 16h-6z" />
        <text x="22" y="19" fill="#111" fontSize="6.5" fontWeight="700">
          Bancontact
        </text>
      </svg>
    );
  }
  if (id === "google-pay") {
    return (
      <svg viewBox="0 0 56 32" className="h-8 w-14" aria-hidden="true">
        <rect width="56" height="32" rx="4" fill="#fff" />
        <text x="8" y="20" fontSize="11" fontWeight="700">
          <tspan fill="#4285F4">G</tspan>
          <tspan fill="#111"> Pay</tspan>
        </text>
      </svg>
    );
  }
  if (id === "wero") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="#F5C518" />
        <circle cx="14" cy="16" r="5" fill="#E30613" />
        <circle cx="18" cy="16" r="5" fill="#003399" opacity="0.9" />
        <text x="28" y="20" fill="#111" fontSize="8" fontWeight="700">
          wero
        </text>
      </svg>
    );
  }
  if (id === "mastercard") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="#1A1A1A" />
        <circle cx="20" cy="16" r="7" fill="#EB001B" />
        <circle cx="28" cy="16" r="7" fill="#F79E1B" />
      </svg>
    );
  }
  if (id === "paypal") {
    return (
      <svg viewBox="0 0 56 32" className="h-8 w-14" aria-hidden="true">
        <rect width="56" height="32" rx="4" fill="#fff" />
        <text x="8" y="20" fill="#003087" fontSize="10" fontWeight="700">
          PayPal
        </text>
      </svg>
    );
  }
  if (id === "shop") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="#5A31F4" />
        <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
          shop
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontStyle="italic">
        VISA
      </text>
    </svg>
  );
}

export function PaymentMarks({ className }: { className?: string }) {
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-2 [&_text]:font-sans", className)}
      aria-label="Accepted payment methods"
    >
      {paymentMethods.map((method) => (
        <li key={method.id}>
          <span className="sr-only">{method.label}</span>
          <Mark id={method.id} />
        </li>
      ))}
    </ul>
  );
}
