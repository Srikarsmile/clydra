/**
 * @clean - Text sanitization and gibberish detection utilities
 */

// Sanitize math answers by removing random letters and fixing LaTeX formatting
export function sanitizeMathAnswer(text: string): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // Remove isolated non-ASCII letters (regex to catch random letter sequences)
  cleaned = cleaned.replace(/\b[bcdfghjklmnpqrstvwxyz]{2,}\b/gi, "");

  // Remove isolated single consonants that don't make sense
  cleaned = cleaned.replace(/\b[bcdfghjklmnpqrstvwxyz]\b/gi, "");

  // Collapse multiple whitespace into single spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  // Fix LaTeX formatting - wrap LaTeX expressions in code blocks if they contain math
  if (cleaned.includes("\\frac") || cleaned.includes("^") || cleaned.includes("_")) {
    // Check if it's already in a code block
    if (!cleaned.includes("```math") && !cleaned.includes("```latex")) {
      // Look for LaTeX expressions and wrap them
      cleaned = cleaned.replace(
        /(\\frac\{[^}]+\}\{[^}]+\}|\\[a-zA-Z]+\{[^}]*\}|[a-zA-Z0-9]+\^[a-zA-Z0-9{}_]+|[a-zA-Z0-9]+_[a-zA-Z0-9{}_]+)/g,
        "```math\n$1\n```"
      );
    }
  }

  return cleaned;
}

// Detect if text is gibberish using heuristics
export function isGibberish(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  // Don't flag short text as gibberish
  if (text.length < 10) return false;

  // Don't flag code or math expressions
  if (
    text.includes("```") ||
    text.includes("function") ||
    text.includes("const") ||
    text.includes("var") ||
    text.includes("let") ||
    text.includes("\\frac") ||
    text.includes("=") ||
    text.includes("$")
  ) {
    return false;
  }

  const words = text.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return false;

  // Calculate average word length
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = totalLength / words.length;

  // Flag if average word length is too long (indicates random characters)
  if (avgWordLength > 8) return true;

  // Count words with excessive consonants
  let consonantHeavyWords = 0;
  let veryLongWords = 0;
  let randomCharWords = 0;

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    
    if (cleanWord.length === 0) continue;

    // Count consonants vs vowels
    const consonants = cleanWord.match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
    const vowels = cleanWord.match(/[aeiou]/g) || [];
    
    // Flag words with too many consonants
    if (consonants.length > vowels.length * 2 && cleanWord.length > 4) {
      consonantHeavyWords++;
    }

    // Flag very long words (likely random)
    if (cleanWord.length > 12) {
      veryLongWords++;
    }

    // Flag words with repeating character patterns
    if (/(.)\1{2,}/.test(cleanWord) || /([a-z]{2})\1{2,}/.test(cleanWord)) {
      randomCharWords++;
    }
  }

  // Calculate ratios
  const consonantRatio = consonantHeavyWords / words.length;
  const longWordRatio = veryLongWords / words.length;
  const randomRatio = randomCharWords / words.length;

  // Flag as gibberish if multiple indicators are present
  if (consonantRatio > 0.3 || longWordRatio > 0.2 || randomRatio > 0.1) {
    return true;
  }

  // Check for trigram frequency (simplified heuristic)
  const trigrams = extractTrigrams(text);
  const uncommonTrigrams = trigrams.filter(trigram => 
    !isCommonTrigram(trigram)
  );

  // Flag if too many uncommon trigrams
  if (uncommonTrigrams.length > trigrams.length * 0.7) {
    return true;
  }

  return false;
}

// Extract trigrams from text
function extractTrigrams(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, "");
  const trigrams: string[] = [];

  for (let i = 0; i <= cleaned.length - 3; i++) {
    trigrams.push(cleaned.slice(i, i + 3));
  }

  return trigrams;
}

// Check if trigram is common in English
function isCommonTrigram(trigram: string): boolean {
  const commonTrigrams = new Set([
    "the", "and", "ing", "her", "hat", "his", "thi", "for", "ent", "ion",
    "ter", "was", "you", "ith", "ver", "all", "wit", "thi", "tio", "but",
    "had", "ten", "ere", "our", "one", "han", "hav", "ave", "can", "not",
    "out", "are", "new", "whi", "say", "she", "may", "use", "res", "man",
    "way", "day", "get", "has", "him", "old", "see", "now", "way", "who",
    "oil", "sit", "set", "run", "eat", "far", "sea", "eye", "low", "buy",
    "off", "try", "let", "end", "why", "own", "got", "put", "too", "old",
    "any", "app", "ask", "bad", "big", "car", "cut", "did", "eat", "eye",
    "got", "had", "has", "him", "his", "how", "its", "let", "man", "may",
    "new", "now", "old", "our", "out", "own", "put", "run", "saw", "say",
    "she", "too", "top", "two", "way", "who", "win", "yes", "yet", "you"
  ]);

  return commonTrigrams.has(trigram);
}

// Clean and validate response before storing/displaying
export function cleanResponse(text: string): string {
  if (!text || typeof text !== "string") return "";

  // First sanitize math content
  const cleaned = sanitizeMathAnswer(text);

  // Check if it's gibberish (but not code/math)
  if (isGibberish(cleaned)) {
    console.warn("Detected gibberish response, may need backup model");
    // Return original for now, but log the detection
    // In production, this would trigger a backup model request
  }

  return cleaned;
}

// Validate if response is acceptable for display
export function isValidResponse(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  
  // Must have minimum length
  if (text.trim().length < 5) return false;

  // Must not be pure gibberish
  if (isGibberish(text)) return false;

  // Must have some actual content (not just symbols)
  const hasLetters = /[a-zA-Z]/.test(text);
  if (!hasLetters) return false;

  return true;
}