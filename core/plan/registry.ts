/** Gondozási protokollok és konzílium-javallatok betöltése. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CareProtocol, ConsultRule } from "./types.ts";
import { CarePlanner } from "./visits.ts";
import { ConsultSet } from "./consults.ts";

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

function readAll(paths: string[]): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) out.push([f, JSON.parse(readFileSync(f, "utf8"))]);
  }
  return out;
}

export function loadCareProtocols(...paths: string[]): CarePlanner {
  const protocols: CareProtocol[] = [];
  for (const [f, parsed] of readAll(paths)) {
    if (!Array.isArray(parsed)) throw new Error(`${f}: a gondozási fájl tömböt vár`);
    for (const x of parsed as Array<Record<string, unknown>>) {
      if (Array.isArray(x.base)) protocols.push(x as unknown as CareProtocol);
    }
  }
  return new CarePlanner(protocols);
}

export function loadConsultRules(...paths: string[]): ConsultSet {
  const rules: ConsultRule[] = [];
  for (const [f, parsed] of readAll(paths)) {
    if (!Array.isArray(parsed)) throw new Error(`${f}: a gondozási fájl tömböt vár`);
    for (const x of parsed as Array<Record<string, unknown>>) {
      if (typeof x.specialty === "string") rules.push(x as unknown as ConsultRule);
    }
  }
  return new ConsultSet(rules);
}
