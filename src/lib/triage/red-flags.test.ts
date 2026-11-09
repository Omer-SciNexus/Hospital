import { describe, expect, it } from "vitest";
import { findRedFlag } from "./red-flags";

describe("emergency words", () => {
  it.each([
    "I have chest pain",
    "my chest feels tight",
    "my chest hurts a lot",
    "There is pressure in my chest",
    "I think I'm having a heart attack",
    "I can't breathe",
    "I can’t breathe",
    "she cannot breathe",
    "having trouble breathing",
    "it is hard to breathe",
    "his lips are turning blue",
    "I think he had a stroke",
    "her face is drooping",
    "my speech is slurred",
    "sudden weakness in my arm",
    "heavy bleeding",
    "the bleeding will not stop",
    "I am vomiting blood",
    "coughing up blood",
    "he passed out",
    "my dad is unconscious",
    "she had a seizure",
    "my throat is closing",
    "swollen tongue after eating nuts",
    "I took an overdose",
    "my kid swallowed bleach",
    "bone is sticking out of my leg",
    "worst headache of my life",
    "I suddenly can't see",
    "my newborn has a fever",
    "my 6 week old has a temperature",
    "my baby is very floppy",
    "CHEST PAIN",
  ])("catches: %s", (text) => {
    expect(findRedFlag(text)).toBe("emergency");
  });
});

describe("crisis words", () => {
  it.each([
    "I want to die",
    "I am thinking about suicide",
    "I feel suicidal",
    "I want to kill myself",
    "I don't want to live anymore",
    "I keep cutting myself",
    "self-harm",
    "everyone would be better off dead without me",
    // Negation is ignored here on purpose.
    "I'm not suicidal",
  ])("catches: %s", (text) => {
    expect(findRedFlag(text)).toBe("crisis");
  });
});

describe("ordinary messages", () => {
  it.each([
    "my lower back hurts",
    "I have a rash on my arm",
    "toothache since Monday",
    "I can't breathe through my nose",
    "food poisoning I think",
    "I had heat stroke years ago",
    "stomach ache after dinner",
    "my knee hurts when I walk",
    "yes",
    "no",
    "3 days",
    "7",
  ])("allows: %s", (text) => {
    expect(findRedFlag(text)).toBeNull();
  });
});

describe("negation", () => {
  it.each(["no chest pain", "I don't have chest pain", "without any trouble breathing", "never had a seizure"])("allows: %s", (text) => {
    expect(findRedFlag(text)).toBeNull();
  });

  it.each(["no chest pain but I can't breathe", "no, chest pain", "no chest pain yesterday, but now I have chest pain"])("still catches: %s", (text) => {
    expect(findRedFlag(text)).toBe("emergency");
  });
});
