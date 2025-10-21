export function getDeterministicRotation(id: string, maxTilt = 3): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }

  const normalized = Math.abs(hash % (maxTilt * 2 * 10));
  return normalized / 10 - maxTilt;
}
