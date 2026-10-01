import { readFileSync } from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

export type BrandLogo = {
  id?: string;
  url: string;
  width: number;
  height: number;
  storagePath?: string;
};

export function imageSize(bytes: Buffer, type: string) {
  if (type === "image/png" && bytes.length >= 24 && bytes.toString("ascii", 1, 4) === "PNG") {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (type === "image/gif" && bytes.length >= 10 && bytes.toString("ascii", 0, 3) === "GIF") {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  if (type === "image/webp" && bytes.length >= 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    if (bytes.toString("ascii", 12, 16) === "VP8X") {
      return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    }
  }
  if (type === "image/jpeg" && bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) break;
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

export function publicLogoUrl(url: string, siteUrl: string) {
  if (url.startsWith("https://")) return url;
  const site = siteUrl.replace(/\/$/, "");
  if (url.startsWith("/") && site.startsWith("https://")) return `${site}${url}`;
  return "";
}

export async function logoBytes(url: string) {
  if (url.startsWith("/")) {
    const file = path.resolve(process.cwd(), "public", url.replace(/^\/+/, ""));
    const root = path.resolve(process.cwd(), "public");
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) return null;
    try {
      return readFileSync(file);
    } catch {
      return null;
    }
  }
  if (!url.startsWith("https://")) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

export async function loadBrandMark() {
  const admin = createAdminClient();
  const [logo, settings] = await Promise.all([
    admin.from("brand_logos").select("id, url, width, height, storage_path").eq("active", true).maybeSingle(),
    admin.from("site_settings").select("brand, site_url").eq("id", 1).maybeSingle(),
  ]);
  const brand = settings.data?.brand?.trim() || "Joova";
  const siteUrl = (settings.data?.site_url || "").replace(/\/$/, "");
  const row = logo.data;
  return {
    brand,
    siteUrl,
    logo: row
      ? {
          id: row.id,
          url: row.url,
          width: row.width,
          height: row.height,
          storagePath: row.storage_path,
        }
      : null,
  };
}
