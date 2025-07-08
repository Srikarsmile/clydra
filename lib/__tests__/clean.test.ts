/**
 * @tests - Unit tests for clean.ts functions
 */
import { sanitizeMathAnswer, isGibberish, cleanResponse, isValidResponse } from "../clean";

describe("sanitizeMathAnswer", () => {
  test("removes isolated consonant sequences", () => {
    const input = "The answer is 42 bcdfg and here's why.";
    const output = sanitizeMathAnswer(input);
    expect(output).toBe("The answer is 42 and here's why.");
  });

  test("removes isolated single consonants", () => {
    const input = "This is a test b c d with random letters.";
    const output = sanitizeMathAnswer(input);
    expect(output).toBe("This is a test with random letters.");
  });

  test("collapses multiple whitespace", () => {
    const input = "This  has    multiple     spaces.";
    const output = sanitizeMathAnswer(input);
    expect(output).toBe("This has multiple spaces.");
  });

  test("wraps LaTeX expressions in code blocks", () => {
    const input = "The fraction \\frac{1}{2} equals 0.5";
    const output = sanitizeMathAnswer(input);
    expect(output).toContain("```math");
    expect(output).toContain("\\frac{1}{2}");
  });

  test("handles empty or null input", () => {
    expect(sanitizeMathAnswer("")).toBe("");
    expect(sanitizeMathAnswer(null as unknown as string)).toBe("");
    expect(sanitizeMathAnswer(undefined as unknown as string)).toBe("");
  });

  test("preserves valid mathematical expressions", () => {
    const input = "The equation x^2 + y^2 = r^2 represents a circle.";
    const output = sanitizeMathAnswer(input);
    expect(output).toContain("x^2 + y^2 = r^2");
  });
});

describe("isGibberish", () => {
  test("identifies gibberish text", () => {
    const gibberish = "xzqwertasdfghjkl mnbvcxzasdfghjkl";
    expect(isGibberish(gibberish)).toBe(true);
  });

  test("recognizes normal text", () => {
    const normal = "This is a normal sentence with proper English words.";
    expect(isGibberish(normal)).toBe(false);
  });

  test("does not flag short text", () => {
    const short = "hello";
    expect(isGibberish(short)).toBe(false);
  });

  test("does not flag code", () => {
    const code = "function test() { const x = 10; return x; }";
    expect(isGibberish(code)).toBe(false);
  });

  test("does not flag math expressions", () => {
    const math = "The integral \\frac{dx}{dt} = velocity";
    expect(isGibberish(math)).toBe(false);
  });

  test("flags text with excessive consonants", () => {
    const consonantHeavy = "bcdfghjklmnpqrstvwxyz bcdfghjklmnpqrstvwxyz bcdfghjklmnpqrstvwxyz";
    expect(isGibberish(consonantHeavy)).toBe(true);
  });

  test("flags very long random words", () => {
    const longRandom = "supercalifragilisticexpialidocious qwertyuiopasdfghjklzxcvbnm";
    expect(isGibberish(longRandom)).toBe(true);
  });

  test("handles empty or null input", () => {
    expect(isGibberish("")).toBe(false);
    expect(isGibberish(null as unknown as string)).toBe(false);
    expect(isGibberish(undefined as unknown as string)).toBe(false);
  });
});

describe("cleanResponse", () => {
  test("combines sanitization and gibberish detection", () => {
    const input = "The answer is 42 bcdfg and here's the math \\frac{1}{2}.";
    const output = cleanResponse(input);
    expect(output).not.toContain("bcdfg");
    expect(output).toContain("\\frac{1}{2}");
  });

  test("handles gibberish detection", () => {
    const gibberish = "xzqwertasdfghjkl mnbvcxzasdfghjkl qwertyuiopasdfgh";
    const output = cleanResponse(gibberish);
    // Should return original but log warning
    expect(output).toBe(gibberish);
  });

  test("preserves valid content", () => {
    const valid = "This is a valid response with proper content.";
    const output = cleanResponse(valid);
    expect(output).toBe(valid);
  });
});

describe("isValidResponse", () => {
  test("accepts valid responses", () => {
    const valid = "This is a valid response with proper content.";
    expect(isValidResponse(valid)).toBe(true);
  });

  test("rejects empty responses", () => {
    expect(isValidResponse("")).toBe(false);
    expect(isValidResponse("   ")).toBe(false);
    expect(isValidResponse(null as unknown as string)).toBe(false);
  });

  test("rejects too short responses", () => {
    expect(isValidResponse("Hi")).toBe(false);
    expect(isValidResponse("OK")).toBe(false);
  });

  test("rejects gibberish responses", () => {
    const gibberish = "xzqwertasdfghjkl mnbvcxzasdfghjkl qwertyuiopasdfgh";
    expect(isValidResponse(gibberish)).toBe(false);
  });

  test("rejects responses without letters", () => {
    expect(isValidResponse("123 !@# $%^")).toBe(false);
    expect(isValidResponse("... --- ...")).toBe(false);
  });

  test("accepts responses with mixed content", () => {
    expect(isValidResponse("The answer is 42 and here's why.")).toBe(true);
    expect(isValidResponse("Code: function test() { return 42; }")).toBe(true);
  });
});