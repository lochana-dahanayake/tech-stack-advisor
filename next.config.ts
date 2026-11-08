import type { NextConfig } from "next";
import { assertValidKnowledgeBase } from "./src/modules/knowledge-base/check";

// A broken knowledge base fails `next dev` / `next build` here, so the app itself never parses it
// (that keeps Zod out of the browser bundle; see src/modules/knowledge-base/index.ts).
assertValidKnowledgeBase();

const nextConfig: NextConfig = {};

export default nextConfig;
