import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { calibrationTables } from "./calibration";
import { variants } from "./variants";

// Pins every table in the calibration log (KNOWLEDGE_BASE_DRAFT §5/§10). Print one with `npm run calibrate -- --variant <name>`.
describe("calibration tables", () => {
  for (const name of Object.keys(variants)) {
    it(`variant ${name}`, () => {
      expect(calibrationTables(name, kb)).toMatchSnapshot();
    });
  }
  it("rejects an unknown variant", () => {
    expect(() => calibrationTables("nope", kb)).toThrow(/unknown variant/);
  });
});
