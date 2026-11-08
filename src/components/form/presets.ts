import type { UserInput } from "@/modules/scoring";

export interface Preset {
  id: string;
  title: string;
  description: string;
  /** The golden scenario this example copies (tests/ui/presets.test.ts keeps the inputs identical). */
  golden: string;
  input: UserInput;
}

/**
 * Worked examples for the landing page and the form. Each one is a golden scenario (TESTING_STRATEGY §3), so its
 * result is already checked by the engine tests.
 */
export const presets: Preset[] = [
  {
    id: "chat",
    title: "Real-time chat app",
    description: "A growing web app with live messages, built by a small TypeScript team.",
    golden: "G3",
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
  },
  {
    id: "shop",
    title: "Online shop, Java team",
    description: "Payments, search-engine traffic and a five-year life, built by a team that knows Java.",
    golden: "G2",
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
  },
  {
    id: "portfolio",
    title: "Student portfolio",
    description: "A few pages about you, free hosting, no server or database needed.",
    golden: "G1",
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
  },
  {
    id: "dashboard",
    title: "Data dashboard, Python team",
    description: "An internal tool over linked records for a small team that writes Python.",
    golden: "G4",
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
  },
  {
    id: "mvp",
    title: "Startup MVP in 4 weeks",
    description: "A commercial web app on a very tight deadline; the team knows some TypeScript.",
    golden: "G5",
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
  },
  {
    id: "hobby",
    title: "Beginner's habit tracker",
    description: "A first full app for one user, free hosting only, some Python and time to learn.",
    golden: "G9",
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
      weights: { "learning-curve": "high" },
      skills: { python: "some" },
    },
  },
];
