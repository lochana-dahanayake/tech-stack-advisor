import { describe, expect, it } from "vitest";
import { rawKnowledgeBase } from "@/modules/knowledge-base";
import { assertValidKnowledgeBase } from "@/modules/knowledge-base/check";

describe("assertValidKnowledgeBase (the next.config.ts build gate)", () => {
  it("accepts the committed KB", () => {
    expect(() => assertValidKnowledgeBase()).not.toThrow();
  });

  it("rejects a KB that fails the schema", () => {
    expect(() => assertValidKnowledgeBase({ ...rawKnowledgeBase, meta: {} })).toThrow(/fails the schema/);
  });

  it("rejects a KB with integrity problems", () => {
    const options = [...rawKnowledgeBase.options, rawKnowledgeBase.options[0]]; // a duplicate id
    expect(() => assertValidKnowledgeBase({ ...rawKnowledgeBase, options })).toThrow(/integrity problems/);
  });
});
