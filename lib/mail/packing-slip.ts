import PDFDocument from "pdfkit";

type SlipItem = {
  name: string;
  quantity: number;
  sku?: string;
  detail?: string;
};

type SlipAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
};

export function packingSlipPdf(input: {
  orderId: string;
  email: string;
  shipping: SlipAddress;
  items: SlipItem[];
  carrier?: string | null;
  tracking?: string | null;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#0c121c").text("Joova packing slip");
    doc.moveDown(0.4);
    doc.fontSize(12).fillColor("#3f3f46").text(`Order ${input.orderId}`);
    doc.text(input.email);
    if (input.carrier || input.tracking) {
      doc.text([input.carrier, input.tracking].filter(Boolean).join(" · "));
    }
    doc.moveDown();
    doc.fontSize(14).fillColor("#0c121c").text("Ship to");
    doc.fontSize(12).fillColor("#3f3f46");
    const address = input.shipping;
    for (const line of [address.name, address.line1, address.line2, [address.city, address.region, address.postal].filter(Boolean).join(", ")].filter(Boolean)) {
      doc.text(String(line));
    }
    doc.moveDown();
    doc.fontSize(14).fillColor("#0c121c").text("Pick list");
    doc.moveDown(0.4);
    for (const item of input.items) {
      const extra = [item.sku, item.detail].filter(Boolean).join(" · ");
      doc.fontSize(12).fillColor("#0c121c").text(`${item.quantity} × ${item.name}`);
      if (extra) doc.fontSize(11).fillColor("#3f3f46").text(extra);
      doc.moveDown(0.3);
    }
    doc.moveDown();
    doc.fontSize(10).fillColor("#6b7280").text("Joova Tech LLC · Grapevine, Texas");
    doc.end();
  });
}
