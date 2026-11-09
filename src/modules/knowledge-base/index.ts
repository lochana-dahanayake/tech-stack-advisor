import meta from "./data/meta.json";
import parts from "./data/parts.json";
import criteria from "./data/criteria.json";
import options from "./data/options.json";
import questions from "./data/questions.json";
import rules from "./data/rules.json";
import skills from "./data/skills.json";
import compatibility from "./data/compatibility.json";
import references from "./data/references.json";
import bundles from "./data/bundles.json";
import glossary from "./data/glossary.json";
import type { KnowledgeBase } from "./schema";

export type * from "./schema";
export { conditionPaths, findIntegrityProblems, listSources, isComparativeExtreme, productCriteria } from "./integrity";
export { isOpenSourceAllowed, licenceBadge } from "./licence";
export { matchMentions, mentionAliases, MAX_MENTIONS, type Mention } from "./mentions";

export const rawKnowledgeBase = {
  meta,
  parts,
  criteria,
  options,
  questions,
  rules,
  skills,
  compatibility,
  references,
  bundles,
  glossary,
};

/** The knowledge base, typed. Not parsed here so Zod stays out of the browser; the KB tests parse it with `knowledgeBaseSchema`. */
export const kb = rawKnowledgeBase as unknown as KnowledgeBase;
