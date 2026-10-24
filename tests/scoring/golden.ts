import type { KnowledgeBase } from "@/modules/knowledge-base";
import type { ScoreResult, UserInput } from "@/modules/scoring";

/**
 * Golden scenarios (TESTING_STRATEGY §3), written in full. Only the database and backend parts are in the KB so far;
 * the other expectations of each scenario arrive with their parts. Criteria not in the KB yet (seo, cost for
 * hosting) are left out of `weights` and noted.
 */
export interface PartExpectation {
  notNeeded?: true;
  typeIn?: string[]; // allowed #1 types
  typeInTop2?: string; // must be #1 or #2
  typeNot?: string[]; // must never be #1
  productIn?: string[]; // allowed #1 product (database: in the chosen type; backend: in the team's language, see teamLanguagePick)
  productNotSecond?: string;
}
export interface Scenario {
  id: string;
  title: string;
  input: UserInput;
  expect: { database?: PartExpectation; backend?: PartExpectation };
}

export const golden: Scenario[] = [
  {
    id: "G1",
    title: "Student portfolio site",
    input: {
      answers: {
        "app-kind": "portfolio",
        "data-shape": "none",
        budget: "free-only",
        commercial: "no",
        seo: "yes",
        "team-size": "solo",
        experience: "beginner",
      },
    },
    expect: { database: { notNeeded: true }, backend: { notNeeded: true } },
  },
  {
    id: "G2",
    title: "E-commerce store, small team that knows Java",
    input: {
      answers: {
        "app-kind": "e-commerce",
        "data-shape": "linked",
        "data-flags": ["money"],
        commercial: "yes",
        budget: "small-paid",
        seo: "yes",
        lifespan: "5-plus-years",
        "team-size": "2-5",
      },
      weights: { maturity: "high", productivity: "medium" },
      skills: { java: "strong" },
    },
    expect: {
      database: {
        typeIn: ["relational"],
        typeNot: ["document"],
        productIn: ["postgresql", "mysql"],
        productNotSecond: "sqlite",
      },
      backend: { productIn: ["spring-boot"] },
    },
  },
  {
    id: "G3",
    title: "Real-time chat app",
    input: {
      answers: {
        "app-kind": "web-app",
        "real-time": "yes",
        traffic: "growing",
        budget: "small-paid",
        "team-size": "2-5",
      },
      skills: { "typescript-node": "strong" },
    },
    expect: { backend: { productIn: ["fastify", "nestjs", "express"] } },
  },
  {
    id: "G4",
    title: "Data dashboard for a Python team",
    input: {
      answers: {
        "app-kind": "internal-tool",
        "data-shape": "linked",
        traffic: "small",
        budget: "small-paid",
        "team-size": "2-5",
      },
      skills: { python: "strong" },
    },
    expect: {
      database: { typeIn: ["relational"], productIn: ["postgresql"] },
      backend: { productIn: ["fastapi", "django"] },
    },
  },
  {
    id: "G5",
    title: "Startup MVP that must ship in 4 weeks",
    input: {
      answers: {
        "app-kind": "web-app",
        "data-shape": "linked",
        deadline: "very-tight",
        commercial: "yes",
        budget: "small-paid",
        "team-size": "2-5",
      },
      skills: { "typescript-node": "some" },
    },
    expect: {
      database: { typeIn: ["relational"], productIn: ["postgresql"] },
      backend: { typeIn: ["fullstack"], productIn: ["frontend-server"] },
    },
  },
  {
    id: "G6",
    title: "Internal business app at a .NET company",
    input: {
      answers: {
        "app-kind": "internal-tool",
        "data-shape": "linked",
        lifespan: "5-plus-years",
        "team-size": "6-15",
        "hosting-rule": "azure",
      },
      skills: { csharp: "strong" },
    },
    expect: { database: { typeIn: ["relational"] }, backend: { productIn: ["aspnet-core"] } },
  },
  {
    id: "G7",
    title: "Content site for an agency client, PHP team",
    input: {
      // Content-heavy pages with authors and categories: read as linked records.
      answers: {
        "app-kind": "content-site",
        "data-shape": "linked",
        commercial: "yes",
        budget: "small-paid",
        "team-size": "2-5",
      },
      skills: { php: "strong" },
    },
    expect: {
      database: { typeIn: ["relational"], productIn: ["mysql", "postgresql"] },
      backend: { productIn: ["laravel"] },
    },
  },
  {
    id: "G8",
    title: "High-throughput REST API",
    input: {
      // "Steady heavy load" = traffic large. `cost` High is a hosting criterion, not in the KB yet.
      answers: {
        "app-kind": "api-only",
        "data-shape": "linked",
        traffic: "large",
        "team-size": "6-15",
        experience: "experienced",
      },
      weights: { performance: "critical" },
      skills: { go: "some" },
    },
    expect: {
      database: { typeIn: ["relational"], productIn: ["postgresql"] },
      backend: { typeNot: ["fullstack"], productIn: ["gin", "aspnet-core"] },
    },
  },
  {
    id: "G9",
    title: "Beginner's hobby app (habit tracker)",
    input: {
      answers: {
        "app-kind": "web-app",
        "data-shape": "linked",
        "data-flags": ["single-user"],
        budget: "free-only",
        commercial: "no",
        "team-size": "solo",
        experience: "beginner",
        deadline: "relaxed",
      },
      weights: { "learning-curve": "high" }, // a beginner
      skills: { python: "some" },
    },
    expect: {
      database: { typeIn: ["relational"], productIn: ["sqlite", "postgresql"] },
      backend: { productIn: ["django", "fastapi"] },
    },
  },
  {
    id: "G10",
    title: "Social app with friends-of-friends suggestions",
    input: {
      answers: { "app-kind": "web-app", "data-shape": "connected", traffic: "growing", "team-size": "2-5" },
      skills: { "typescript-node": "strong" },
    },
    expect: { database: { typeInTop2: "graph", typeNot: ["document"] } },
  },
  {
    id: "G11",
    title: "Microservices from Architecture Advisor",
    input: {
      answers: { "app-kind": "web-app", traffic: "large", budget: "comfortable", "team-size": "16-plus" },
      skills: { java: "strong", go: "some" },
      style: "microservices",
    },
    expect: { backend: { productIn: ["spring-boot"] } },
  },
  {
    id: "G12",
    title: "Neutral input",
    input: { weights: { maturity: "high" } },
    expect: {},
  },
  {
    id: "G13",
    title: "Product catalogue with very different items",
    input: {
      answers: {
        "app-kind": "web-app",
        "data-shape": "documents",
        "data-flags": ["fields-vary"],
        traffic: "growing",
        budget: "small-paid",
        "team-size": "2-5",
      },
      skills: { "typescript-node": "strong" },
    },
    expect: { database: { typeIn: ["document"], typeNot: ["relational"], productIn: ["mongodb"] } },
  },
];

/** Extra inputs used only in the calibration log (not golden: no expectations). */
export const probes: Scenario[] = [
  {
    id: "P1",
    title: "G10 + scalability High",
    input: { ...golden[9]!.input, weights: { scalability: "high" } },
    expect: {},
  },
  {
    id: "P2",
    title: "G13 without 'fields vary'",
    input: { ...golden[12]!.input, answers: { ...golden[12]!.input.answers, "data-flags": [] } },
    expect: {},
  },
  {
    id: "P3",
    title: "Cache-only service (only simple lookups)",
    input: { answers: { "app-kind": "api-only", "data-shape": "lookups" }, weights: { performance: "high" } },
    expect: {},
  },
];

/**
 * STAND-IN until the language part and stack assembly exist (ROADMAP Next up, Part 3): the best backend product
 * (by candidate score) among products that run on the team's strongest language(s). With no skills, the plain #1.
 */
export function teamLanguagePick(result: ScoreResult, input: UserInput, kb: KnowledgeBase): string | undefined {
  const rank = { strong: 2, some: 1, none: 0 } as const;
  const skills = Object.entries(input.skills ?? {});
  const top = Math.max(0, ...skills.map(([, l]) => rank[l ?? "none"]));
  const langs = top === 0 ? [] : skills.filter(([, l]) => rank[l ?? "none"] === top).map(([id]) => id);
  const products = result.parts.backend?.products ?? [];
  if (langs.length === 0) return products[0]?.id;
  const runsOn = (id: string) => kb.compatibility.find((c) => c.option === id && c.part === "language")?.anyOf ?? [];
  return products.find((p) => runsOn(p.id).some((l) => langs.includes(l)))?.id;
}
