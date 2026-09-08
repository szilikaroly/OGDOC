/**
 * Segédfüggvények a levezetéshez.
 *
 * A KÉPLETEK NEM ITT VANNAK. Minden képlet, score és besorolás a
 * `core/calc/defs.ts` kalkulátor-definíciókban él, egyetlen példányban.
 * Ez a fájl csak az általános segédeket tartja.
 */

export function round(x: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round((x + Number.EPSILON) * f) / f;
}

export { durationMs } from "./resolve.ts";
