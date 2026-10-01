"use client";

import { useEffect, useState } from "react";

export function SkuCodes({ sku }: { sku: string }) {
  const [qr, setQr] = useState("");
  const [barcode, setBarcode] = useState<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!sku || !barcode) return;
    let cancel = false;
    void import("jsbarcode").then((mod) => {
      if (cancel) return;
      mod.default(barcode, sku, { format: "CODE128", displayValue: true, fontSize: 14, height: 56, margin: 0 });
    });
    void import("qrcode").then((mod) => {
      void mod.default.toDataURL(sku, { margin: 1, width: 160 }).then((url) => {
        if (!cancel) setQr(url);
      });
    });
    return () => {
      cancel = true;
    };
  }, [sku, barcode]);

  if (!sku) return null;
  return (
    <div className="mt-4 flex flex-wrap items-end gap-6">
      <div>
        <p className="text-sm text-muted">Barcode</p>
        <svg ref={setBarcode} role="img" aria-label={`Barcode for ${sku}`} />
      </div>
      {qr ? (
        <div>
          <p className="text-sm text-muted">QR code</p>
          {/* Generated in the browser from the SKU. It is not a remote image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code for ${sku}`} width={160} height={160} />
        </div>
      ) : null}
    </div>
  );
}
