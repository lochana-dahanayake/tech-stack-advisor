// Re-reads the primary numbers behind the backend, language and frontend scores (RESEARCH §6–8) and prints them with
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
  // Frontend (KB draft §14): same framework bands as the backend; plain HTML uses the language bands (HTML/CSS).
  table(
    "WebFramework",
    ["React", "Next.js", "Vue.js", "Angular", "Svelte", "Astro", "SvelteKit", "Nuxt.js"],
    backendCommunityBand,
  );
  table(
    "Languages",
    ["JavaScript", "HTML/CSS", "TypeScript", "Python", "Java", "Kotlin", "C#", "PHP", "Go"],
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

// Frontend performance (KB draft §14): HTTP Archive Core Web Vitals technology report, mobile, origins passing all
// three Core Web Vitals. The API serves the latest crawl; the scores were set from the 2026-09-01 crawl.
const CWV_API = "https://cdn.httparchive.org/v1/cwv";
const cwvBand = (p: number) => (p >= 0.6 ? 5 : p >= 0.45 ? 4 : p >= 0.35 ? 3 : p >= 0.25 ? 2 : 1);
type CwvRow = {
  date: string;
  technology: string;
  vitals: { name: string; mobile: { good_number: number; tested: number } }[];
};

function coreWebVitals() {
  const names = ["Astro", "Svelte", "SvelteKit", "React", "Vue.js", "Next.js", "Nuxt.js", "Angular"];
  const rows = getJson<CwvRow[]>(
    `${CWV_API}?technology=${names.map(encodeURIComponent).join(",")}&geo=ALL&rank=ALL&start=2026-09-01&end=2026-09-01`,
  );
  console.log("\n### HTTP Archive Core Web Vitals technology report (mobile, origins with good CWV)");
  console.log("| Technology | Month | Good | Tested | Share | Band |\n|---|---|---|---|---|---|");
  for (const name of names) {
    const row = rows.find((r) => r.technology === name);
    const overall = row?.vitals.find((v) => v.name === "overall")?.mobile;
    console.log(
      row && overall
        ? `| ${name} | ${row.date} | ${overall.good_number} | ${overall.tested} | ${pct(overall.good_number / overall.tested)} | ${cwvBand(overall.good_number / overall.tested)} |`
        : `| ${name} | no data | | | | |`,
    );
  }
}

// Frontend versions, licences and first stable release (KB draft §14, maturity rubric). Latest versions change.
function npmFacts() {
  const pkgs = ["react", "vue", "svelte", "@angular/core", "next", "nuxt", "@sveltejs/kit", "astro"];
  console.log("\n### npm registry (live)\n| Package | Latest | Licence | First stable major |\n|---|---|---|---|");
  for (const name of pkgs) {
    const p = getJson<{
      "dist-tags": { latest: string };
      time: Record<string, string>;
      versions: Record<string, { license?: string }>;
    }>(`https://registry.npmjs.org/${name.replace("/", "%2F")}`);
    const latest = p["dist-tags"].latest;
    const firstStable = Object.keys(p.time)
      .filter((v) => /^[1-9]\d*\.0\.0$/.test(v))
      .sort((a, b) => (p.time[a]! < p.time[b]! ? -1 : 1))[0];
    console.log(
      `| ${name} | ${latest} (${p.time[latest]?.slice(0, 10)}) | ${p.versions[latest]?.license ?? "?"} | ${firstStable} (${firstStable ? p.time[firstStable]?.slice(0, 10) : ""}) |`,
    );
  }
}

survey();
techempower();
registries();
coreWebVitals();
npmFacts();
