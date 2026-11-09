/**
 * Fixed emergency word check. It runs in the browser before anything is sent,
 * and again on the server. English only: other languages rely on the AI's
 * urgency rating.
 *
 * It prefers a false alarm to a miss. The red screen has a "typed by mistake"
 * link, so a false alarm costs the patient one tap.
 */

export type RedFlagType = "emergency" | "crisis";

const CRISIS: RegExp[] = [
  /\bsuicid\w*/,
  /\bkill(?:ing)? myself\b/,
  /\bend(?:ing)? (?:my|it) (?:life|all)\b/,
  /\bwant(?:s|ing)? to die\b/,
  /\b(?:don'?t|do not) want to (?:live|be alive|be here)\b/,
  /\bno reason to live\b/,
  /\bbetter off dead\b/,
  /\bself[- ]?harm\w*/,
  /\b(?:hurt|hurting|harm|harming|cut|cutting) myself\b/,
];

const EMERGENCY: RegExp[] = [
  // Heart
  /\bheart attack\b/,
  /\bchest\s+(?:is\s+|feels\s+|feel\s+)?(?:\w+\s+)?(?:pain|pains|pressure|hurts?|hurting|tight\w*|crushing|squeezing)\b/,
  /\b(?:pain|pressure|tightness|squeezing)\s+(?:in|on|across)\s+(?:my |the |his |her |their )?chest\b/,
  /\b(?:tight|crushing|heavy)\s+chest\b/,

  // Stroke
  /(?<!heat |sun |golf |back |swim )\bstroke\b(?! of)/,
  /\bface\s+(?:is\s+)?droop\w*/,
  /\bdrooping\s+face\b/,
  /\bslurr\w+(?:\s+\w+)?\s+speech\b/,
  /\bspeech\s+(?:is\s+)?slurr\w*/,
  /\bcan'?t\s+(?:speak|talk)\b/,
  /\bcannot\s+(?:speak|talk)\b/,
  /\bsudden\w*\s+(?:\w+\s+)?(?:weakness|numbness)\b/,
  /\bone side of (?:my|the|his|her|their) (?:face|body)\b/,

  // Breathing
  /\b(?:can'?t|cannot|can not|unable to|couldn'?t)\s+breathe?\b(?!\s+(?:through|from|out of)\s+(?:my |the |one |his |her |their )*(?:nose|nostril))/,
  /\b(?:trouble|difficulty|struggling|hard)\s+(?:to\s+)?breath\w*/,
  /\b(?:can'?t|cannot)\s+(?:catch|get)\s+(?:my|his|her|their)\s+breath\b/,
  /\b(?:severe\w*|very)\s+short(?:ness)?\s+of\s+breath\b/,
  /\bnot breathing\b/,
  /\bstopped breathing\b/,
  /\bgasping\b/,
  /\bchoking\b/,
  /\bblue lips\b/,
  /\blips\s+(?:are\s+|is\s+|turning\s+|turned\s+|went\s+|look\s+)+blue\b/,

  // Bleeding
  /\b(?:heavy|heavily|severe|severely|uncontrolled|massive)\s+bleeding\b/,
  /\bbleeding\s+(?:heavily|a lot|badly|nonstop|non-stop)\b/,
  /\bbleeding\b.{0,30}\b(?:won'?t|will not|doesn'?t|does not|can'?t)\s+stop\b/,
  /\b(?:vomit\w*|throw\w*\s+up|threw\s+up|cough\w*(?:\s+up)?)\s+(?:\w+\s+)?blood\b/,

  // Consciousness and seizures
  /\bunconscious\b/,
  /\bunresponsive\b/,
  /\bpass(?:ed|ing)\s+out\b/,
  /\bfaint(?:ed|ing)\b/,
  /\bblack(?:ed|ing)\s+out\b/,
  /\bcollaps(?:ed|ing)\b/,
  /\b(?:won'?t|will not|not|hard to)\s+wak(?:e|ing)(?:\s+up)?\b/,
  /\bseizures?\b/,
  /\bconvuls\w*/,

  // Allergy
  /\banaphyla\w*/,
  /\bthroat\s+(?:is\s+)?(?:closing|swelling)\b/,
  /\bswollen\s+(?:tongue|throat|lips?)\b/,
  /\b(?:tongue|lips?)\s+(?:is\s+|are\s+)?swollen\b/,

  // Serious injury and poisoning
  /\b(?:severe|serious|major|bad)\s+(?:injury|burn|burns)\b/,
  /\b(?:car|motorcycle|road)\s+(?:crash|accident)\b/,
  /\bbone\s+(?:is\s+)?(?:sticking|poking|showing)\b/,
  /\bstabbed\b/,
  /\bgunshot\b/,
  /\boverdos\w*/,
  /(?<!food )\bpoison\w*/,
  /\bswallowed\s+(?:\w+\s+)?(?:bleach|chemicals?|detergent)\b/,

  // Babies
  /\b(?:newborn|infant)\b.{0,40}\b(?:fever|temperature)\b/,
  /\b(?:fever|temperature)\b.{0,40}\b(?:newborn|infant)\b/,
  /\b(?:\d+|one|two|three|four|five|six)[- ](?:day|week)s?[- ]old\b.{0,40}\b(?:fever|temperature)\b/,
  /\b(?:one|two|1|2)[- ]months?[- ]old\b.{0,40}\b(?:fever|temperature)\b/,
  /\b(?:baby|child|newborn|infant|son|daughter)\b.{0,30}\bfloppy\b/,

  // Other sudden signs
  /\bworst headache\b/,
  /\bthunderclap\b/,
  /\bsudden\w*\s+(?:vision loss|loss of vision|blindness)\b/,
  /\bsuddenly\s+(?:can'?t|cannot)\s+see\b/,
  /\bwent blind\b/,
];

/** "no chest pain", "without any trouble breathing", "I don't have chest pain". */
const NEGATED_BEFORE =
  /(?:^|[\s(])(?:no|not|without|never|don'?t have|do not have|didn'?t have|did not have|haven'?t had|have not had|denies)\s+(?:(?:any|a|have|had|having|been|experienced)\s+)*$/;

function normalize(text: string) {
  return text.toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/\s+/g, " ").trim();
}

function matches(pattern: RegExp, text: string, allowNegation: boolean) {
  const global = new RegExp(pattern.source, "g");
  for (const match of text.matchAll(global)) {
    if (!allowNegation || !NEGATED_BEFORE.test(text.slice(0, match.index))) return true;
  }
  return false;
}

/**
 * Returns the kind of red screen a message needs, or null.
 * Crisis words ignore negation: "I'm not suicidal" gets a support screen it can
 * dismiss, because a wrong guess there is too costly.
 */
export function findRedFlag(message: string): RedFlagType | null {
  const text = normalize(message);
  if (CRISIS.some((p) => matches(p, text, false))) return "crisis";
  if (EMERGENCY.some((p) => matches(p, text, true))) return "emergency";
  return null;
}
