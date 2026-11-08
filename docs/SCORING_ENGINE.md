# Scoring Engine

Status: **draft (2026-10-23)**, Phase 0. **Steps 1–6 are implemented** in `src/modules/scoring/` (2026-10-24) for all five parts (frontend and hosting since 2026-11-08). Step 6 has no user locks or `worksBestWith` pair bonuses yet (hosting constraints K3/K4 work through exclusions). Relations of kind `requires`/`conflicts` filter combinations (checked as soon as both parts are picked), `penalty` relations lower the stack score (K9), and `note` relations are reported in `stack.relationNotes`. One `score()` takes about 0.6 ms with five parts. A `requires` relation on a part that isn't in the stack fails (KB schema §6). Products are scored on their part's criteria minus type-only ones (KB schema §4). Hard rule T6 filters the language candidates; step 6.6 (ties) and 6.7 (stack close calls) are implemented. Adapted from Architecture Advisor's `docs/SCORING_ENGINE.md`: same weighted-average core, plus two levels per part, team skills and stack assembly.

`score(input, kb) → StackResult` is a pure TypeScript function: no network, no clock, no randomness, no global state, no React/Next imports. Same input, same output. It runs in the browser (instant result) and on the server (trusted copy for the AI prompt), as in sibling ADR-004.

## Pipeline
```
UserInput
  1. validate + normalise (Zod)
  2. effective weights        = max(user level, question floors, rule floors)
  3. part relevance           = which parts are needed (not-needed rules, app kind)
  4. level 1: score types     = weighted average → 0–100, + rules (±30) → pick the type per part
  5. level 2: score products  = weighted average → 0–100, + rules (±30) + skills (−10…+25)
  6. stack assembly           = best compatible combination (requires / conflicts / works-best-with)
  7. explanation data         = contributions, fired rules, conflicts, "needs: …" labels, close calls
→ StackResult
```

## Step 1: Input
```ts
interface UserInput {
  weights: Partial<Record<CriterionId, Level>>;    // unset = "low"
  answers: Record<QuestionId, string | boolean>;   // app kind, traffic, data shape, budget, deadline, lifespan,
                                                    // commercial, real-time, SEO, hosting constraint, licences...;
                                                    // every question has "Not sure"
  skills: Partial<Record<LanguageId, "none" | "some" | "strong">>;  // unset = "none"
  knownFrameworks: OptionId[];
  goal: "ship" | "learn";                          // default "ship" (decided Q11)
  locked: Partial<Record<PartId, OptionId>>;       // "we must use MongoDB"
  style?: ArchStyleId;                             // from Architecture Advisor (optional)
  notes: string;                                   // ≤ 1,000 chars; AI only, never read by the engine
}
```
Rules run in two passes: first every rule whose condition doesn't read `weight.*` (these set the floors), then the rules that read effective weights (they can't set floors). Validation: unknown ids rejected; at least one criterion at High or Critical **or** an app kind other than "Not sure" (otherwise there's nothing to rank on); more than 3 Critical → warning; a locked option that a rule would exclude → kept, with a warning ("You chose Vercel; for a commercial project it needs the paid plan").

**Implemented (2026-11-09):** `validateInput` throws on unknown ids; `checkInput` (`scoring/check.ts`) returns the messages for people: an issue `nothing-to-rank` (no app kind and no priority at High or Critical) that blocks the result, and a warning `too-many-critical` (more than `MAX_CRITICAL` = 3). Locks are not in the engine yet, so the form doesn't offer them (ROADMAP).

## Step 2: Effective weights
Exactly as the sibling: `none 0, low 1, medium 2, high 3, critical 5`.
```
w[c] = levelValue( max(userLevel[c], floorsFromAnswers[c], floorsFromRules[c]) )
```
If a floor raises a level the user set **explicitly** lower, record an **input conflict** and show it ("You marked real-time Low but said it's a chat app. We used High."). Critical = 5 so a must-have outweighs several Highs.

## Step 3: Part relevance
A part is **not needed** when a `not-needed` rule fires (e.g. no stored data → database). `none` types have no scores, so they never win by points. A locked part is always needed. Not-needed parts are skipped in steps 5–6 and shown with the reason. Parts are processed in a fixed order (backend, frontend, database, hosting, then language), so a rule that depends on another part's type (S9: no backend → no server language) sees it already decided.

## Step 4: Level 1, types
For each part `p` and each type `t` of `p`, using only the part's **fit criteria** (`C_p` = `typeCriteria` of `p`; popularity, ecosystem, cost and lock-in are product-only, see KB schema §5):
```
avg[t]  = Σ_{c∈C_p} w[c]·x[t][c] / Σ_{c∈C_p} w[c]       (1–5)
base[t] = (avg[t] − 1) / 4 × 100                          (0–100)
final[t] = clamp(base[t] + clamp(Σ rule points[t], −30, +30), 0, 100)
```
If every applicable weight is 0 (all set to "none"), `base` is 50 for every option, so only rules decide. Excluded types are removed. The **chosen type** is the highest `final[t]` (tie-break: `base` → KB order). If a locked product exists, its type is chosen.

**Close call:** if the runner-up type is less than `closeCallPoints` (5) behind the winner, the result says "either works" and shows both groups of products. The chosen type is still the higher one.

Why types first: the sibling's v1.1 lesson (its Q30). A weighted average over many criteria favours whichever option is decent at everything. Deciding the category from the situation first (data shape, app kind, constraints) keeps a strong product of the *wrong* type from winning.

## Step 5: Level 2, products
Same formula with product scores, plus the skills bucket:
```
rules[o]  = clamp(Σ rule points[o], −30, +30)
skill[o]  = clamp(Σ skill points[o], −10, +25)
final[o]  = clamp(base[o] + rules[o] + skill[o], 0, 100)
```
Products are listed per type. The main list holds products of the chosen type (and of the runner-up on a close call); products of other types are folded under "Other types".

For assembly, each product gets a **candidate score** that keeps the type decision in charge:
```
cand[o] = final[o] − max(0, final[chosenType] − final[bestTypeOf(o)])
```
So a product outside the chosen type pays the type gap. It can still be picked when compatibility forces it, and the result says why.

The `language` part has one level: its options are scored as products directly.

## Step 6: Stack assembly
1. **Candidates per needed part:** the top 5 by `cand` plus any locked option (locked = the only candidate).
2. **Enumerate** combinations (≤ 5⁵ = 3,125; cheap) and drop any that break a `requires` or `conflicts` relation.
3. **Stack score:**
   ```
   stack = mean over needed parts of cand[pick] + min(Σ worksBestWith points, 6)
   ```
   All parts weigh the same in v1 (DESIGN; revisit in calibration).
4. **Pick** the highest stack score. Tie-break: higher sum of `final` → fewer languages across the stack (moot in v1: one language part) → option ids in KB order, part by part. Deterministic.
5. **No valid combination** (e.g. locks that conflict): return the best per-part picks, flag the conflicting pair, and explain it. Never fail silently.
6. **Ties inside a part** (owner, 2026-10-24, G12). Options with the same `cand` and `final` as a part's #1 are **tied**: the part's list shows them in KB order only so the output is stable, and none of them counts as "the #1". The stack settles the tie with the rules of item 4, in that order, and the result says which one decided it (`ties[]`: part, tied options, pick, reason):
   - **stack score**: the pick fits the rest of the stack better (in G12, Java and C# tie at 86.1 and C# is picked because ASP.NET Core outscores Spring Boot in the backend part). This is deliberate: a language is only useful with a framework, so the better pair wins.
   - **sum of final**: equal stack scores, higher sum of `final`.
   - **KB order**: everything equal; the earlier option in the KB wins.

   A settled tie is never reported as an "adjusted" pick (that label is for a pick moved by a `requires` relation or by a lower-ranked option winning on stack score). The UI says "Java and C# score the same; C# is picked because it pairs with the stronger backend".
7. **Close calls in the stack** (owner, Q29, 2026-10-24, G8). When a part's pick isn't its own #1 (an "adjusted" pick), the engine also finds the best valid stack that keeps that #1. If the chosen stack beats it by less than `closeCallPoints` (5, Q23), the result lists it in `closeCalls[]` (part, the #1 it keeps, its picks, its score, the gap), and the UI shows both stacks side by side: "C# + ASP.NET Core scores 81.4; Go + Gin, which uses the language you know, scores 77.1. Both are good choices." At 5 points or more only the chosen stack is shown. A close call never changes the pick. **T7** (owner Q31, 2026-10-25, DESIGN): with goal "Use what we know" and a language the team knows (some or strong), a close call whose stack uses a language nobody knows is dropped; with goal "Learn something new" every close call is shown.

Every option in each part's list is then labelled against the chosen stack: **in the stack**, **fits** (would also be compatible), or **needs: X** (e.g. "Django — needs: Python").

## Step 7: Explanation data
- `contributions[o][c] = w[c]·x[o][c] / Σw` for "why this score" bars.
- `firedRules[]`, `skillEffects[]` (kept separate so the UI can say "+20 because your team knows Java"), `compatibility[]` (which relations shaped the stack and why a part's pick isn't its #1).
- `conflicts[]`, `warnings[]`, `closeCalls[]`, `notNeeded[]`, `excluded[]` with reasons.
- `factsUsed[]`: ids of dated facts behind the result, so the UI can show "checked on".

## Result type (sketch)
```ts
interface OptionResult { optionId; level: "type" | "product"; base; rules; skill; final; cand?; rank;
  fit: "strong" | "good" | "possible" | "weak"; label?: "in-stack" | "fits" | { needs: OptionId[] };
  contributions: Record<CriterionId, number>; firedRuleIds: string[]; }
interface PartResult { partId; needed: boolean; notNeededReason?: string; chosenType?: OptionId;
  closeCall?: OptionId; types: OptionResult[]; products: OptionResult[]; pick?: OptionId; }
interface StackResult { kbVersion; engineVersion; effectiveWeights; parts: PartResult[];
  stack: Record<PartId, OptionId>; stackScore: number; pairings: { ids: OptionId[]; points; explanation }[];
  excluded; firedRules; conflicts; warnings; topCriteria: CriterionId[]; }
```
Fit labels as in the sibling: ≥ 75 strong · 60–74.9 good · 45–59.9 possible · < 45 weak (DESIGN, tune).

## Worked example (illustrative numbers, not KB values)
"E-commerce store, small team that knows Java" (golden G2). Answers: app kind e-commerce, linked records, money involved, commercial, budget small-paid, SEO important. Skills: Java strong. Weights: maturity High, productivity Medium, rest Low; floors raise `data-integrity` to Critical (D5) and `seo` to High (S4).

**Database, level 1:** relational wins clearly: D1 +15, D5 −5 for document, and the Critical `data-integrity` weight. **Level 2:** PostgreSQL vs MySQL within relational, close on most criteria; the comparison table shows both.

**Backend, level 2** (made-up bases to show the skill bucket):
| Product | Base | Rules | Skill | Final |
|---|---|---|---|---|
| Spring Boot | 62 | 0 | +10 (T1: requires Java) | **72** |
| Django | 64 | 0 | 0 | 64 |
| NestJS | 61 | 0 | 0 | 61 |

**Language:** Java gets +20 from T1, so it leads. **Hosting:** Vercel could only run Spring Boot through its container runtime (beta: −10 from K9, because lifespan 5+ raises maturity to High) and needs the paid plan for commercial use (K2 note); the stack picks a PaaS or cloud product. The result page shows "Spring Boot: base 62, team skill +10, final 72", so the user sees exactly how much their Java skills counted.

## Determinism and safety properties (tested)
1. Same input ⇒ deep-equal output.
2. `|rules[o]| ≤ 30`, `−10 ≤ skill[o] ≤ 25`, `0 ≤ final ≤ 100`.
3. Excluded options never appear in a stack or a ranked list.
4. The chosen stack satisfies every `requires` and `conflicts` relation (or the result carries an explicit conflict).
5. Locked options are always in the stack.
6. Raising a criterion's weight never lowers the base score of an option scoring above its own average on it (sibling property 2).
7. Not-needed parts have no pick.
8. The notes field never changes the rule result.
