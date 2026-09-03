import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import { z } from "zod";

export const urlSchema = z.object({
  url: z.string().trim().min(1).max(2048).url(),
  viewportIds: z
    .array(z.enum(["mobile", "tablet", "desktop"]))
    .min(1)
    .max(3)
    .optional()
    .default(["desktop"]),
});
const localHosts = new Set([
  "localhost",
  "localhost.localdomain",
  "0.0.0.0",
  "::1",
]);

function privateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      a >= 224
    );
  }
  if (version === 6) {
    const value = ip.toLowerCase();
    return (
      value === "::" ||
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      value.startsWith("fe8") ||
      value.startsWith("fe9") ||
      value.startsWith("fea") ||
      value.startsWith("feb") ||
      value.startsWith("ff")
    );
  }
  return true;
}

export async function validatePublicUrl(raw: string): Promise<URL> {
  const parsed = new URL(raw);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.hostname.length > 253 ||
    localHosts.has(parsed.hostname.toLowerCase()) ||
    (net.isIP(parsed.hostname) > 0 && privateIp(parsed.hostname))
  )
    throw new Error("BLOCKED_URL");
  const records = await dns.lookup(parsed.hostname, {
    all: true,
    verbatim: true,
  });
  if (!records.length || records.some(({ address }) => privateIp(address)))
    throw new Error("BLOCKED_URL");
  return parsed;
}
