/**
 * A gyógyszer-névsor értékkészletének előállítása a gyógyszertörzsből.
 *
 * A `rx.active` értékkészlete NEM kézi lista: a szótár
 * (`registry/gyogyszerek/`) a forrás. Ez a generátor írja be a regiszterfájlba,
 * és a `--check` kapcsolóval ugyanez ellenőrzi, hogy nem csúszott-e szét.
 *
 * Miért generált és nem futásidejű: így a regiszterfájl önmagában teljes marad
 * — a validátor, a felület és az export nem függ attól, hogy valaki bekötötte-e
 * a szótárat. Az elcsúszást a CI fogja meg, nem a felhasználó.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { loadDrugs } from "../core/rx/registry.ts";
import type { VariableDef } from "../core/types.ts";

const FILE = "registry/variables/06-gyogyszereles.json";
const ROSTERS = ["rx.active"];

const dict = loadDrugs("registry/gyogyszerek");
const want = dict.valueSet();

const defs: VariableDef[] = JSON.parse(readFileSync(FILE, "utf8"));
let changed = false;
for (const d of defs) {
  if (!ROSTERS.includes(d.id)) continue;
  if (JSON.stringify(d.valueSet) !== JSON.stringify(want)) {
    d.valueSet = want;
    changed = true;
  }
}

if (process.argv.includes("--check")) {
  if (changed) {
    console.error(
      `✗ ${FILE}: a névsor nem egyezik a gyógyszertörzsral (${want.length} tétel).\n` +
      `  Futtasd: node tools/gen-drug-roster.ts`,
    );
    process.exit(1);
  }
  console.log(`✓ gyógyszer-névsor naprakész (${want.length} tétel)`);
} else {
  writeFileSync(FILE, JSON.stringify(defs, null, 2) + "\n", "utf8");
  console.log(
    changed
      ? `✓ ${FILE}: a névsor frissítve (${want.length} tétel)`
      : `✓ ${FILE}: a névsor már naprakész volt (${want.length} tétel)`,
  );
}
