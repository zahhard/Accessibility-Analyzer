import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import { z } from "zod";

export const urlSchema = z.object({ url: z.string().trim().min(1).max(2048).url() });
const blockedHosts = new Set(["localhost", "localhost.localdomain", "0.0.0.0", "::1"]);

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 ||
      a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 ||
      a >= 224;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") ||
      normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
      normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("ff");
  }
  return true;
}

export async function validatePublicUrl(raw: string): Promise<URL> {
  const parsed = new URL(raw);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password ||
      blockedHosts.has(parsed.hostname.toLowerCase())) throw new Error("BLOCKED_URL");
  if (net.isIP(parsed.hostname) && isPrivateIp(parsed.hostname)) throw new Error("BLOCKED_URL");
  const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!records.length || records.some(({ address }) => isPrivateIp(address))) throw new Error("BLOCKED_URL");
  return parsed;
}
