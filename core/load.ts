/** Regiszter betöltése fájlból vagy könyvtárból. Az egyetlen hely, ahol I/O történik. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Registry } from "./registry.ts";
import type { VariableDef } from "./types.ts";

/** Egy könyvtár összes `.json` fájlja, NÉV SZERINT rendezve — determinisztikusan. */
function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => join(dir, f));
}

/**
 * A megadott fájlokat és könyvtárakat tölti be egyetlen regiszterbe.
 *
 * A modulonkénti bontás a katalógus feltöltésének feltétele: ~4000 változó egy
 * fájlban nem szerkeszthető és nem szemlézhető. A `Registry` konstruktora
 * kivételt dob duplikált azonosítóra, ezért két modul nem definiálhatja
 * ugyanazt a mezőt — ha mindkettőnek kell, `aliasOf` a helyes megoldás.
 */
export function loadRegistry(...paths: string[]): Registry {
  const defs: VariableDef[] = [];
  const files = paths.flatMap((p) => statSync(p).isDirectory() ? filesIn(p) : [p]);
  for (const f of files) {
    const parsed = JSON.parse(readFileSync(f, "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${f}: a regiszterfájl tömböt vár`);
    defs.push(...parsed);
  }
  return new Registry(defs);
}
