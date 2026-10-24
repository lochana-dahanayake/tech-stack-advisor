import type { Option } from "./schema";

/**
 * Q28 (owner, 2026-10-24): the "open-source licences only" constraint (K6) allows OSI-approved licences and public
 * domain. Public domain is shown as such, never as "OSI: yes".
 */
export function isOpenSourceAllowed(o: Option): boolean {
  return o.licence ? o.licence.osi || o.licence.publicDomain === true : true;
}

/** Badge text for a product's licence (Q16, Q28). Types and options without a licence get none. */
export function licenceBadge(o: Option): "public domain" | "OSI: yes" | "OSI: no" | undefined {
  if (!o.licence) return undefined;
  if (o.licence.publicDomain) return "public domain";
  return o.licence.osi ? "OSI: yes" : "OSI: no";
}
