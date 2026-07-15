/**
 * Lightweight, on-device inference of life-context themes from recent messages.
 * Never stored. Passed transiently to the AI so replies can be more attuned
 * without ever assuming identity. All matches are keyword-based and gentle.
 */

export type InferredTheme =
  | "cycle_or_pms"
  | "pregnancy_or_postpartum"
  | "caregiving"
  | "workplace_bias"
  | "emotional_suppression"
  | "body_image"
  | "safety_anxiety"
  | "relationship"
  | "academic_pressure"
  | "fatherhood"
  | "motherhood"
  | "loneliness"
  | "identity_lgbtq";

const RULES: Array<{ theme: InferredTheme; patterns: RegExp[] }> = [
  { theme: "cycle_or_pms", patterns: [/\b(period|periods|pms|menstrual|cramps|cycle)\b/i] },
  { theme: "pregnancy_or_postpartum", patterns: [/\b(pregnan\w*|postpartum|newborn|breastfeed\w*)\b/i] },
  { theme: "caregiving", patterns: [/\b(caregiver|caring for|looking after (my )?(parent|mom|dad|kid|child))\b/i] },
  { theme: "workplace_bias", patterns: [/\b(sexism|misogyn\w*|glass ceiling|mansplain|discriminat\w*|harass\w*)\b/i] },
  { theme: "emotional_suppression", patterns: [/\b(can'?t cry|bottling up|not allowed to feel|men don'?t cry|be strong|hide (my )?feelings)\b/i] },
  { theme: "body_image", patterns: [/\b(body image|too fat|too thin|hate (my )?body|weight|skinny)\b/i] },
  { theme: "safety_anxiety", patterns: [/\b(unsafe|stalk\w*|followed|scared to walk|creepy guy|assault)\b/i] },
  { theme: "relationship", patterns: [/\b(boyfriend|girlfriend|husband|wife|partner|breakup|dating|marriage)\b/i] },
  { theme: "academic_pressure", patterns: [/\b(exam|marks|semester|placement|jee|neet|assignment|deadline)\b/i] },
  { theme: "fatherhood", patterns: [/\b(my kids|my son|my daughter|being a dad|father)\b/i] },
  { theme: "motherhood", patterns: [/\b(my kids|my son|my daughter|being a mom|mother|maa banna)\b/i] },
  { theme: "loneliness", patterns: [/\b(lonely|alone|no friends|nobody (cares|listens))\b/i] },
  { theme: "identity_lgbtq", patterns: [/\b(lgbt\w*|queer|gay|lesbian|trans|non.?binary|coming out)\b/i] },
];

export const inferThemes = (recentText: string): InferredTheme[] => {
  if (!recentText) return [];
  const hits = new Set<InferredTheme>();
  for (const { theme, patterns } of RULES) {
    if (patterns.some((p) => p.test(recentText))) hits.add(theme);
  }
  return Array.from(hits).slice(0, 5);
};
