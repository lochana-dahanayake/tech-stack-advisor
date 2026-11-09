import { describe, expect, it } from "vitest";
import { kb, matchMentions, MAX_MENTIONS } from "@/modules/knowledge-base";
import { buildPrompt } from "@/modules/ai/prompt";
import { validateReply } from "@/modules/ai/validate";
import { ctxFor, inputOf, validReply } from "../ai/helpers";

const ids = (notes: string) => matchMentions(notes, kb).map((m) => `${m.kind}:${m.id}`);

describe("notes mentions (schema §10, glossary matching)", () => {
  it("matches glossary entries and ranked options, in order of appearance", () => {
    expect(ids("We like Supabase, but our host must run Postgres; maybe WordPress for the blog.")).toEqual([
      "glossary:supabase",
      "option:postgresql",
      "glossary:wordpress",
    ]);
  });

  it("matches whole words only, and the longest alias claims its text", () => {
    expect(ids("We go live in May and render pages on the server, express our ideas.")).toEqual([]);
    expect(ids("Our old app is Ruby on Rails.")).toEqual(["glossary:rails"]);
    expect(ids("golang or C# with ASP.NET Core")).toEqual(["option:go", "option:csharp", "option:aspnet-core"]);
    expect(ids("deploy on render.com with a dockerfile")).toEqual(["option:render", "glossary:docker"]);
  });

  it("is case-insensitive, deterministic and capped", () => {
    expect(ids("PRISMA")).toEqual(["glossary:prisma"]);
    const many = "wordpress firebase supabase bun deno prisma drizzle";
    expect(ids(many)).toHaveLength(MAX_MENTIONS);
    expect(ids(many)).toEqual(ids(many));
    expect(ids("")).toEqual([]);
  });

  it("answers an option with its summary and part", () => {
    const [m] = matchMentions("mongo", kb);
    expect(m).toMatchObject({ kind: "option", id: "mongodb", part: "database", matched: "mongo" });
    expect(m!.answer).toMatch(/We rank it under Database\.$/);
  });

  it("the result lists them, with or without AI", () => {
    const g3 = { ...inputOf("G3"), notes: "We already know Prisma." };
    const prompt = buildPrompt(ctxFor(g3));
    expect(prompt.ids.mentions).toEqual(["glossary:prisma"]);
    expect(prompt.user).toMatch(/MENTIONED IN NOTES/);
  });
});

describe("AI mentions (AI_INTEGRATION §4b)", () => {
  const ctx = ctxFor({ ...inputOf("G3"), notes: "Is Supabase an option? We use Docker." });
  const p = buildPrompt(ctx);

  it("a valid reply answers every matched item once", () => {
    expect(p.ids.mentions).toEqual(["glossary:supabase", "glossary:docker"]);
    const v = validateReply(validReply(ctx), ctx, p.ids);
    expect(v.ok && v.explanation.mentions.map((m) => m.id)).toEqual(["glossary:supabase", "glossary:docker"]);
  });

  it("rejects a missing, repeated or unknown mention", () => {
    const r = validReply(ctx) as unknown as { explanation: { mentions: { id: string; answer: string }[] } };
    const reason = (mentions: { id: string; answer: string }[]) => {
      const v = validateReply({ ...r, explanation: { ...r.explanation, mentions } }, ctx, p.ids);
      return v.ok ? "ok" : v.reason;
    };
    expect(reason([{ id: "glossary:supabase", answer: "x" }])).toMatch(/must answer glossary:docker/);
    expect(
      reason([
        { id: "glossary:supabase", answer: "x" },
        { id: "glossary:supabase", answer: "y" },
        { id: "glossary:docker", answer: "z" },
      ]),
    ).toMatch(/mentions/);
    expect(reason([{ id: "glossary:wordpress", answer: "x" }])).toMatch(/mentions/);
  });

  it("with no notes, mentions must be empty", () => {
    const plain = ctxFor(inputOf("G3"));
    const pp = buildPrompt(plain);
    const r = validReply(plain) as unknown as { explanation: { mentions: unknown[] } };
    r.explanation.mentions = [{ id: "glossary:docker", answer: "x" }];
    expect(validateReply(r, plain, pp.ids).ok).toBe(false);
  });
});
