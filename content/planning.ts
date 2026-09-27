export const planDate = "Sep 27, 2026";

export const planSummary =
  "If the deposit is signed and paid this week, the Joova Band can be on sale around Nov 18, nine days before Black Friday. It launches with the factory's generic app, published in Joova's own developer accounts under the Joova name and icon. Custom app features come in the next phase.";

export const orderPlan = {
  units: "1,000 bands",
  price: "$49.99",
  promise: "No subscription. Ever.",
  straps: "3 straps in every box",
  front: "“No subscription. Ever.” on the front",
} as const;

export const colorMix = [
  { name: "Midnight knit", qty: 400, share: "40%" },
  { name: "Cloud knit", qty: 200, share: "20%" },
  { name: "Midnight silicone", qty: 150, share: "15%" },
  { name: "Lilac knit", qty: 150, share: "15%" },
  { name: "Coral knit", qty: 100, share: "10%" },
] as const;

export const launchSteps = [
  {
    n: "01",
    title: "Create the LLC and bank account",
    when: "This week",
    copy: "Form the LLC in your state, get a free EIN from the IRS, and open a business bank account. Contracts, D-U-N-S, Amazon, and app accounts that follow are in the LLC's name.",
  },
  {
    n: "02",
    title: "Sign and pay the deposit",
    when: "By Oct 2",
    copy: "Sign the order contract, the app license, and an NNN agreement. Pay 30%, only to the bank account named in the contract.",
  },
  {
    n: "03",
    title: "Send the brand files",
    when: "By Oct 9",
    copy: "Logo, strap colors, box design, and the user guide in English and French (needed for Canada), plus 5 barcodes, one per color.",
  },
  {
    n: "04",
    title: "Approve the golden sample",
    when: "By Oct 12",
    copy: "One finished band per color, in the box. Production must match it.",
  },
  {
    n: "05",
    title: "Publish the app",
    when: "By Nov 10",
    copy: "Get a D-U-N-S number, open company Apple and Google developer accounts, and have the factory upload its generic app there with the Joova name and icon.",
  },
  {
    n: "06",
    title: "Production and inspection",
    when: "Oct 13 to Nov 5",
    copy: "Your partner checks mid-way and at the end. Pay the 70% balance only after the final check passes.",
  },
  {
    n: "07",
    title: "Ship by air to Amazon",
    when: "Nov 5 to 17",
    copy: "850 bands to Amazon. 150 to you for website orders, creators, and warranty swaps.",
  },
  {
    n: "08",
    title: "Set up the stores",
    when: "By Nov 10",
    copy: "File the JOOVA trademark, then open Amazon, the Joova website, and TikTok Shop.",
  },
  {
    n: "09",
    title: "Create social media and build buzz",
    when: "Oct 1 to Nov 17",
    copy: "Claim @joova, or the closest match, on Instagram, TikTok, YouTube, Facebook, X, Pinterest, Threads, and LinkedIn, all with the same logo and link. Then a website waitlist, free bands to 50 small creators, and one short video a day.",
  },
  {
    n: "10",
    title: "Launch",
    when: "Nov 18",
    copy: "Amazon Vine for early reviews, a 15% launch coupon, and Amazon ads. Black Friday follows on Nov 27.",
  },
  {
    n: "11",
    title: "Watch sales and reorder",
    when: "From December",
    copy: "Reorder the 2 best-selling colors before stock runs low. Custom app features come in the next phase.",
  },
] as const;

export const planBudget =
  "About $40,000 to $76,000 in total, mostly the 1,000 bands landed at Amazon. The range depends on the US tariff rate.";

export const markets = [
  {
    name: "United States",
    when: "Nov 18, 2026",
    where:
      "Amazon.com, the Joova website, and TikTok Shop. Walmart Marketplace from early 2027.",
    stock: "850 bands at Amazon US, 150 with you.",
    radio: "FCC ID, from the factory.",
    labels: "English.",
    tax: "Amazon and TikTok collect it in most states. The website needs a sales-tax app.",
  },
  {
    name: "Canada",
    when: "January 2027",
    where: "Amazon.ca and the Joova website, which ships to Canada.",
    stock:
      "Amazon ships Canadian orders from US stock (North America Remote Fulfillment). Send stock straight to Amazon Canada once sales grow.",
    radio:
      "ISED certification number. Ask the factory now. Most Bluetooth factories already have it.",
    labels: "English and French on the box and user guide. Canadian law.",
    tax: "GST/HST: ask an accountant. Amazon collects it in many cases.",
  },
] as const;

export const marketNote =
  "The US launches first. Canada follows in January 2027 using the same stock. Other countries wait until both markets are working. Design the box in English and French this week, so the same 1,000 bands can sell in both countries without relabeling.";

export const thisWeek = [
  "Form the LLC, get the EIN, and open the business bank account.",
  "Have a lawyer check the contracts, then sign them in the LLC's name.",
  "Pay the 30% deposit from the business account.",
  "Apply for the D-U-N-S number. This needs the LLC first.",
  "File the JOOVA trademark.",
  "Claim @joova on every social platform.",
  "Put up a waitlist page on the Joova website.",
] as const;
