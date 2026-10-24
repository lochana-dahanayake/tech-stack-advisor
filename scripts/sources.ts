// Re-reads the primary numbers behind the backend and language scores (RESEARCH §6–7) and prints them with
// the rubric band each one gives. Needs network access (uses curl, so the session proxy applies).
// Usage: npm run sources
// Registry counts change daily; the survey and TechEmpower files are pinned (commit, round).
import { execFileSync } from "node:child_process";

const SO_2026 =
  "https://raw.githubusercontent.com/StackExchange/Survey/9dd5c163b7ec09ce5503f711c37a99dbd80ff3c7/packages/archive/2026/json/technology.json";
const TFB_ROUND_23 = "https://www.techempower.com/benchmarks/results/round23/ph.json";

function get(url: string): string {
  return execFileSync("curl", ["-sSfL", "--max-time", "120", url], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}
const getJson = <T>(url: string): T => JSON.parse(get(url)) as T;
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

// Rubric bands (KNOWLEDGE_BASE_DRAFT §6 and §11).
const backendCommunityBand = (p: number) => (p >= 0.15 ? 5 : p >= 0.1 ? 4 : p >= 0.05 ? 3 : p >= 0.02 ? 2 : 1);
const languageCommunityBand = (p: number) => (p >= 0.4 ? 5 : p >= 0.2 ? 4 : p >= 0.1 ? 3 : p >= 0.04 ? 2 : 1);
const fortunesBand = (share: number) =>
  share >= 0.4 ? 5 : share >= 0.15 ? 4 : share >= 0.075 ? 3 : share >= 0.03 ? 2 : 1;

type SurveyRow = { slice: number; response: string; count: number; pct: number };
type SurveyQuestion = { meta: { slices: { n: number }[] }; data: SurveyRow[] };

function survey() {
  const so = getJson<Record<string, SurveyQuestion>>(SO_2026);
  const table = (key: string, names: string[], band: (p: number) => number) => {
    const q = so[key]!;
    console.log(`\n### Stack Overflow 2026, ${key} (all respondents, n = ${q.meta.slices[0]!.n})`);
    console.log("| Answer | Count | Share | Band |\n|---|---|---|---|");
    for (const name of names) {
      const row = q.data.find((r) => r.slice === 0 && r.response === name);
      console.log(
        row
          ? `| ${name} | ${row.count} | ${pct(row.pct)} | ${band(row.pct)} |`
          : `| ${name} | not an answer option | | |`,
      );
    }
  };
  table(
    "WebFramework",
    ["Next.js", "ASP.NET Core", "FastAPI", "Express", "Spring Boot", "Django", "Laravel", "NestJS", "Fastify", "Gin"],
    backendCommunityBand,
  );
  table(
    "Languages",
    ["JavaScript", "TypeScript", "Python", "Java", "Kotlin", "C#", "PHP", "Go"],
    languageCommunityBand,
  );
}

type TfbRow = { totalRequests: number | string };
type TfbResults = {
  duration: number;
  rawData: Record<string, Record<string, TfbRow[]>>;
  testMetadata: {
    name: string;
    framework: string;
    language: string;
    approach: string;
    classification: string;
    database: string;
  }[];
};

function techempower() {
  const r = getJson<TfbResults>(TFB_ROUND_23);
  const peak = (test: string, name: string) => {
    const rows = r.rawData[test]?.[name];
    return rows?.length ? Math.max(...rows.map((x) => Number(x.totalRequests) || 0)) / r.duration : 0;
  };
  const best = Math.max(...r.testMetadata.map((m) => peak("fortune", m.name)));
  // Our product id → TechEmpower framework names. Tests marked "platform" (raw runtime, no framework routing)
  // or "stripped" are left out, so each row is the framework as people use it; so are languages the KB doesn't
  // rank (ASP.NET Core also has Visual Basic tests).
  const kbLanguages = ["c#", "go", "java", "javascript", "php", "python", "typescript"];
  const ours: Record<string, string[]> = {
    "aspnet-core": ["asp.net core", "asp.net core [minimal apis]", "asp.net core [mvc]"],
    "spring-boot": ["spring"],
    fastify: ["fastify"],
    express: ["express"],
    nestjs: ["nestjs"],
    gin: ["gin", "gin-gorm"],
    fastapi: ["fastapi"],
    laravel: ["laravel"],
    django: ["django"],
  };
  console.log(
    `\n### TechEmpower Round 23 (2025-02-24, physical), Fortunes: best realistic, non-platform test per framework`,
  );
  console.log(`Round best (any test): ${Math.round(best)} responses/s. Share = framework best / round best.`);
  console.log("| Product | Test | Database | Responses/s | Share | Band |\n|---|---|---|---|---|---|");
  for (const [id, names] of Object.entries(ours)) {
    const tests = r.testMetadata
      .filter((m) => names.includes(m.framework.toLowerCase()) && m.approach === "realistic")
      .filter((m) => m.classification !== "platform" && kbLanguages.includes(m.language))
      .map((m) => ({ m, rps: peak("fortune", m.name) }))
      .filter((t) => t.rps > 0)
      .sort((a, b) => b.rps - a.rps);
    const top = tests[0];
    console.log(
      top
        ? `| ${id} | ${top.m.name} | ${top.m.database} | ${Math.round(top.rps)} | ${pct(top.rps / best)} | ${fortunesBand(top.rps / best)} |`
        : `| ${id} | no Fortunes result | | | | |`,
    );
  }
}

function registries() {
  const counts: [string, () => number][] = [
    [
      "npm (replicate.npmjs.com doc_count)",
      () => getJson<{ doc_count: number }>("https://replicate.npmjs.com/").doc_count,
    ],
    [
      "PyPI (simple index, projects)",
      () =>
        JSON.parse(
          execFileSync(
            "curl",
            ["-sSfL", "-H", "Accept: application/vnd.pypi.simple.v1+json", "https://pypi.org/simple/"],
            {
              encoding: "utf8",
              maxBuffer: 256 * 1024 * 1024,
            },
          ),
        ).projects.length,
    ],
    [
      "Maven Central (search.maven.org, group:artifact)",
      () =>
        getJson<{ response: { numFound: number } }>("https://search.maven.org/solrsearch/select?q=*:*&rows=0&wt=json")
          .response.numFound,
    ],
    [
      "NuGet (search totalHits)",
      () => getJson<{ totalHits: number }>("https://azuresearch-usnc.nuget.org/query?take=0").totalHits,
    ],
    [
      "Packagist (statistics.json packages)",
      () => getJson<{ totals: { packages: number } }>("https://packagist.org/statistics.json").totals.packages,
    ],
  ];
  console.log("\n### Package registries (live counts)\n| Registry | Packages |\n|---|---|");
  for (const [name, count] of counts) {
    let value: string;
    try {
      value = String(count());
    } catch {
      value = "not reachable";
    }
    console.log(`| ${name} | ${value} |`);
  }
  console.log("| Go modules | no total count published (pkg.go.dev, index.golang.org) |");
}

survey();
techempower();
registries();
