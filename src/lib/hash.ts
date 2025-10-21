import { createHash } from "crypto";

export function hashIp(ip: string | null): string {
  const input = ip?.trim() || "unknown";
  return createHash("sha256").update(input).digest("hex");
}
