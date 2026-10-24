// Prints the calibration tables in KNOWLEDGE_BASE_DRAFT §5/§10.
// Usage: npm run calibrate [-- --variant current|draft|session2|session2-no-d0]
import { kb } from "@/modules/knowledge-base";
import { calibrationTables } from "../tests/scoring/calibration";

const i = process.argv.indexOf("--variant");
console.log(calibrationTables(i >= 0 ? (process.argv[i + 1] ?? "current") : "current", kb));
