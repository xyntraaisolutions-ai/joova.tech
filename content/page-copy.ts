export const pageCopy = {
  about: {
    shortAbout:
      "Joova brings smart, simple and fairly priced technology into everyday life. Built by Joova Tech LLC in the USA, every Joova product is designed to be easy to use and worth it. Smarter Tech | Bigger Tomorrow.",
    idea: "Technology should make life easier, not more complicated. That simple idea is why we started Joova.",
    brand:
      "We design smart, good-looking devices for everyday life. They're easy to set up, easy to understand, and fairly priced. Whatever you choose, you get the same Joova experience: thoughtful design, honest value and support you can count on.",
    story1:
      "We saw two things over and over. Great technology was either priced out of reach, or buried under confusing features, fine print and extra costs. We believed people deserved better: smart technology that simply works, at a price that feels fair.",
    story2:
      "Every product we choose, every design decision and every word we write starts there.",
    mission:
      "To make smart technology simple, accessible and worth it, so more people can enjoy a smarter today and a bigger tomorrow.",
    honest: "We tell you what our products do and what they don't. No hidden costs, no exaggerated claims.",
    simple: "From unboxing to everyday use, everything should feel easy and natural.",
    warm: "We're here to help, not to sell at any cost. Real people, real answers.",
    forward: "We keep looking for better ways technology can improve daily life, and bring them to you.",
    quality: "every product is carefully selected and quality-checked before it reaches you.",
    pricing: "what you see is what you pay.",
    improving: "we listen to our customers and keep making Joova better.",
    join: "We're just getting started, and we're glad you're here. Explore Joova, find something that makes your day a little smarter, and grow with us toward a bigger tomorrow.",
  },
  privacy: {
    collectAccount:
      "We collect the information you give us to create a Joova Customer Account, place an order, register a product, or contact support. That includes your name, email, order details, and the messages you send us.",
    collectProduct:
      "When you use a Joova product, we collect the information needed to run that product and, where it applies, the Joova app. Tracker data is stored by the Joova app and is never sold. We use this information to fill orders, provide support, and operate the products you buy.",
    sell: "We do not sell personal information.",
    cookies: "A full cookie policy and pixel rules will be added with the consent banner.",
  },
  terms: {
    orders:
      "The price is the price shown on the product page. What you see is what you pay. Orders ship from US warehouses and are delivered in 7 to 10 days. Shipping is free in the United States.",
    subscription:
      "When a Joova product includes features in the Joova app, those features come with the product. No subscription needed. Ever. We do not charge a monthly fee for features included with the product you buy.",
    wellness:
      "Joova products are consumer technology. Where a product shows a wellness reading, that reading is for general wellness only. Joova does not diagnose, treat, or detect disease.",
  },
  accessibility: {
    body: "We aim to meet WCAG 2.2 AA. Pages use semantic HTML, skip links, visible focus, and text labels on color swatches. If something blocks you, email",
  },
  returns: {
    window:
      "The 30 days start on the delivery date and apply to Joova orders in the United States. We cover return shipping. After day 30, the free return window is closed.",
    exchange:
      "A Joova Ring size exchange is included in those same 30 days. Wear the free sizing sample, then confirm the size before the ring ships. If the ring still does not fit, request the exchange inside the 30 days.",
    stepReply: "We reply within 6 to 24 hours and send a prepaid US return label.",
    stepShip:
      "Pack the product and send it back. We refund after we receive it, or as stated at checkout. You can follow the return from the account.",
    notWarranty:
      "A warranty claim is not a return. Devices are covered for 1 year from the purchase date. Register within 30 days for 1 extra year.",
  },
  warranty: {
    title: "Joova Limited Warranty",
    intro: "Every Joova device comes with a 1-year limited warranty. Register it and we add 1 extra year, free.",
    eligibleNote:
      "Warranty starts on the purchase date. Applies to products bought new from joova.tech or authorized sellers (e.g. Amazon) in the USA and Canada.",
    product1Name: "Joova Smart Band (JSB01)",
    product1Term: "1 year",
    product1Extra: "+1 year when registered",
    product2Name: "Joova Smart Band ECG (JSB02)",
    product2Term: "1 year",
    product2Extra: "+1 year when registered",
    product3Name: "Joova Smart Ring (JSR01)",
    product3Term: "1 year",
    product3Extra: "+1 year when registered",
    product4Name: "Extra straps (1-pack, 2-pack)",
    product4Term: "90 days",
    product4Extra: "—",
    covered: "Manufacturing defects, battery or charging failure in normal use.",
    notCovered:
      "Accidental damage, water damage beyond the rating (bands are splash resistant only), normal wear, misuse, unauthorized repair.",
    remedy: "We repair or replace the product.",
    step1: "Create a Joova Customer Account on this website, or sign in.",
    step2: "Register the device with the serial number from the card in the box and on the box label. Add the purchase date, where you bought it, and the receipt.",
    step3: "Done: your warranty is extended to 2 years. Registration is free and must be completed within 30 days of purchase.",
    claim:
      "Sign in, open My Devices, select the device, and choose Start warranty claim. Or use the contact form. Have your serial number and receipt ready.",
    footerNote:
      "No registration? You're still covered for 1 year with proof of purchase. This warranty does not affect your rights under local law.",
  },
} as const;

export type PageCopy = {
  [Page in keyof typeof pageCopy]: { [Key in keyof (typeof pageCopy)[Page]]: string };
};
