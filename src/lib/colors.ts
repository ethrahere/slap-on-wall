import { format } from "date-fns";

export type ColorOption = {
  id: string;
  label: string;
  value: string;
  isSpecial?: boolean;
  availableWindow?: string;
};

const BASE_PASTELS: ColorOption[] = [
  { id: "sunbeam", label: "OG Sunshine", value: "var(--post-it-yellow)" },
  { id: "pinkcloud", label: "Bubblegum Dream", value: "var(--post-it-pink)" },
  { id: "minty", label: "Fresh Mint", value: "var(--post-it-green)" },
  { id: "skywave", label: "Sky Vibes", value: "var(--post-it-blue)" },
  { id: "lilac", label: "Lilac Whispers", value: "var(--post-it-purple)" },
];

const SPECIAL_WINDOWS: Array<
  ColorOption & {
    startHour: number;
    endHour: number;
    gradient?: boolean;
  }
> = [
  {
    id: "golden-hour",
    label: "Golden Hour Glow",
    value: "#ffd86b",
    startHour: 18,
    endHour: 19,
    availableWindow: "6 – 7pm",
    isSpecial: true,
  },
  {
    id: "midnight-thoughts",
    label: "Midnight Thoughts",
    value: "linear-gradient(135deg, #1f1147 20%, #7d5dff 100%)",
    startHour: 0,
    endHour: 4,
    availableWindow: "12 – 4am",
    isSpecial: true,
  },
  {
    id: "sunrise-hues",
    label: "Sunrise Hues",
    value: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
    startHour: 5,
    endHour: 7,
    availableWindow: "5 – 7am",
    isSpecial: true,
  },
];

export const PLACEHOLDER_ROTATIONS = [
  "still don't know what gwei means...",
  "wen moon? wen lambo? wen nap?",
  "today i finally understood...",
  "confession: i bought [redacted] at ATH",
  "fellow queens, i need help with...",
  "hot take: gas fees are...",
];

export function getAvailableColors(now = new Date()): ColorOption[] {
  const hour = now.getHours();
  const specials = SPECIAL_WINDOWS.filter((special) =>
    isHourWithinWindow(hour, special.startHour, special.endHour),
  );

  return [
    ...BASE_PASTELS,
    ...specials.map((special) => ({
      id: special.id,
      label: special.label,
      value: special.value,
      isSpecial: special.isSpecial,
      availableWindow: special.availableWindow,
    })),
  ];
}

export function getDefaultColor(now = new Date()): string {
  const palette = getAvailableColors(now);
  const randomIndex = Math.floor(Math.random() * palette.length);
  return palette[randomIndex]?.value ?? BASE_PASTELS[0].value;
}

export function colorFromHue(sliderValue: number): string {
  const hue = Math.round((sliderValue / 100) * 360);
  return `hsl(${hue}, 75%, 80%)`;
}

export function normaliseColorValue(value: string): string {
  if (value.startsWith("var(")) {
    return getComputedStyleValue(value);
  }
  return value;
}

function getComputedStyleValue(cssVar: string): string {
  if (typeof window === "undefined") {
    return cssVar;
  }
  const match = cssVar.match(/var\(([^)]+)\)/);
  if (!match) {
    return cssVar;
  }
  const computed = getComputedStyle(document.documentElement).getPropertyValue(
    match[1],
  );
  return computed?.trim() || cssVar;
}

function isHourWithinWindow(hour: number, windowStart: number, windowEnd: number) {
  if (windowStart <= windowEnd) {
    return hour >= windowStart && hour < windowEnd;
  }
  return hour >= windowStart || hour < windowEnd;
}

export function describeCurrentVibe(now = new Date()): string | null {
  const hour = now.getHours();
  const matching = SPECIAL_WINDOWS.find((special) =>
    isHourWithinWindow(hour, special.startHour, special.endHour),
  );

  if (!matching) {
    return null;
  }

  return `${matching.label} is unlocked until ${formatWindowEnd(matching.endHour)}.`;
}

function formatWindowEnd(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return format(date, "h aaaa");
}
