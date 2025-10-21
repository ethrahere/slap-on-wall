const BLOCKED_PHRASES = [
  "rugpull",
  "scam",
  "pump and dump",
  "shitcoin",
  "pumpanddump",
];

const BLOCKED_REGEX = BLOCKED_PHRASES.map(
  (phrase) => new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i"),
);

const MIN_LENGTH = 10;

export function validatePostText(text: string): { ok: boolean; reason?: string } {
  if (!text || text.trim().length < MIN_LENGTH) {
    return {
      ok: false,
      reason: "Minimum 10 characters, queen. Spill a little more tea.",
    };
  }

  const match = BLOCKED_REGEX.find((regex) => regex.test(text));
  if (match) {
    return {
      ok: false,
      reason:
        "That phrase is on the SheFi naughty list. Try remixing it so it feels safer for the wall.",
    };
  }

  return { ok: true };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
