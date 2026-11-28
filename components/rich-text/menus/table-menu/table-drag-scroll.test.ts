import { expect, it } from "vitest";
import { tableEdgeVelocity } from "./table-drag-scroll";

it("ramps symmetrically within the edge zone and stays idle in the center", () => {
  expect(tableEdgeVelocity(0, 0, 400)).toBe(-540);
  expect(tableEdgeVelocity(14, 0, 400)).toBe(-270);
  expect(tableEdgeVelocity(28, 0, 400)).toBe(0);
  expect(tableEdgeVelocity(200, 0, 400)).toBe(0);
  expect(tableEdgeVelocity(386, 0, 400)).toBe(270);
  expect(tableEdgeVelocity(400, 0, 400)).toBe(540);
  expect(tableEdgeVelocity(-50, 0, 400)).toBe(-540);
  expect(tableEdgeVelocity(450, 0, 400)).toBe(540);
});
it("handles a narrow or fully clipped viewport without overlapping edge zones", () => {
  expect(tableEdgeVelocity(10, 0, 20)).toBe(0);
  expect(tableEdgeVelocity(5, 0, 20)).toBe(-270);
  expect(tableEdgeVelocity(15, 0, 20)).toBe(270);
  expect(tableEdgeVelocity(10, 20, 10)).toBe(0);
  expect(tableEdgeVelocity(10, 10, 10)).toBe(0);
});
