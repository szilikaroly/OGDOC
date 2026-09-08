/**
 * TELJESÍTMÉNYMÉRÉS — a mag forró útjai, számokkal.
 *
 * A sebességről nem véleményt írunk le, hanem MÉRÜNK. Ez a szkript a
 * `docs/fejlesztes/30-core-fejlesztes.md` „sebesség" fejezetének forrása:
 * ha a szám elromlik, itt derül ki, nem a klinikusnál.
 *
 * MIÉRT EZEK A MŰVELETEK. Nem a leglátványosabbak, hanem azok, amelyek egy
 * gépelés és egy mentés között ELKERÜLHETETLENÜL lefutnak. Egy űrlapmező
 * kitöltése után a rendszer feloldást, újraszámítást és validációt végez —
 * ha ez a lánc lassú, a klinikus a gépelést fogja választani, és a projekt
 * legnagyobb kockázata valósul meg.
 *
 * A KÜSZÖBÖK NEM ÖNKÉNYESEK:
 *
 *   16 ms  egy képkocka 60 Hz mellett — ennél lassabb művelet AKADÁS
 *  100 ms  a „azonnali" érzet határa (Nielsen) — eddig nem kell visszajelzés
 *    1 s   a gondolatmenet még nem szakad meg
 *
 * Futtatás: `npm run bench` · `npm run bench -- --json`
 */
import { performance } from "node:perf_hooks";
import { loadRegistry } from "../core/load.ts";
import { setValue } from "../core/derive/engine.ts";
import { recompute } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import { runCalc } from "../core/calc/run.ts";
import { loadUiMap, auditFields } from "../core/ui/felulet.ts";
import type { CaseState } from "../core/types.ts";
import { append, replay, verifyChain } from "../core/journal/journal.ts";
import type { JournalEntry } from "../core/journal/types.ts";
import { newDek, open, seal } from "../core/crypto/envelope.ts";

const JSON_OUT = process.argv.includes("--json");

interface Row {
  what: string;
  /** Egy művelet átlagos ideje ezredmásodpercben. */
  ms: number;
  /** Hányszor futtattuk. */
  n: number;
  /** Melyik érzethatár alá esik. */
  band: "kocka" | "azonnali" | "gondolat" | "lassú";
  note?: string;
}

function band(ms: number): Row["band"] {
  if (ms < 16) return "kocka";
  if (ms < 100) return "azonnali";
  if (ms < 1000) return "gondolat";
  return "lassú";
}

/**
 * MEDIÁN, NEM ÁTLAG. Egy szemétgyűjtés vagy egy lemezművelet az átlagot
 * elhúzza; a medián azt mondja meg, milyen a TIPIKUS futás — és a klinikus
 * a tipikusat éli meg.
 */
function measure(what: string, n: number, fn: () => void, note?: string): Row {
  fn();                                    // bemelegítés: a JIT ne minket mérjen
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const ms = times[Math.floor(times.length / 2)];
  return { what, ms, n, band: band(ms), note };
}

const rows: Row[] = [];

/* ── 1. INDULÁS ─────────────────────────────────────────────────────── */

rows.push(measure("regiszter betöltése (846 változó, lemezről)", 20,
  () => { loadRegistry("registry/variables"); },
  "Folyamatonként EGYSZER fut. A szerver indulásakor, nem kérésenként."));

const reg = loadRegistry("registry/variables");
const NOW = "2026-09-03T10:00:00.000Z";
const blank = (): CaseState =>
  ({ ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] } as CaseState);

/* ── 2. A GÉPELÉS ÉS A MENTÉS KÖZÖTTI LÁNC ──────────────────────────── */

let st = blank();
st = setValue(reg, st, "anthro.height", 168, { t: NOW, provenance: "clinician" });
st = setValue(reg, st, "anthro.weight.prepregnancy", 62, { t: NOW, provenance: "clinician" });

rows.push(measure("egy érték feloldása (`resolve`)", 20000,
  () => { resolve(reg, st, "anthro.height"); },
  "Ez fut a legtöbbször: minden megjelenített mezőnél, minden kalkulátor " +
  "minden bemeneténél."));

rows.push(measure("egy érték írása + a függők újraszámítása (`setValue`)", 2000,
  () => { setValue(reg, st, "anthro.weight.current", 71, { t: NOW, provenance: "clinician" }); },
  "EGY BILLENTYŰLEÜTÉS UTÁN ENNYI TÖRTÉNIK. Ha ez 16 ms fölé megy, a " +
  "felület akad."));

rows.push(measure("teljes újraszámítás (`recompute`)", 500,
  () => { recompute(reg, st); },
  "Betöltés után és import után fut, nem gépelésenként."));

rows.push(measure("egy kalkulátor futtatása (`calc.bmi`)", 5000,
  () => { runCalc(reg, st, "calc.bmi"); }));

/* ── 3. A NAGY SZERKEZETEK ──────────────────────────────────────────── */

const uiMap = loadUiMap("registry/felulet/szuleszeti-felulet.json");
rows.push(measure("felülettérkép betöltése (1106 mező)", 20,
  () => { loadUiMap("registry/felulet/szuleszeti-felulet.json"); }));

rows.push(measure("felülettérkép auditja (1106 mező × szabály)", 20,
  () => { auditFields(uiMap, reg); },
  "Az XLSX-export és a lefedettségi doksi forrása. Nem interaktív út."));

/* ── 4. A NAPLÓ: A HELYREÁLLÍTÁSI IDŐ FORRÁSA ───────────────────────── */

// Egy hosszú vajúdás idősora reálisan több ezer bejegyzés. A visszaállítás
// ideje ebből ígérhető meg — nem becslésből.
{
  const T = (i: number) => new Date(Date.parse(NOW) + i * 1000).toISOString();
  let log: JournalEntry[] = [];
  for (let i = 0; i < 5000; i++) {
    log = append(log, {
      caseId: "bench", actor: "bench", op: "write", at: T(i),
      variableId: i % 3 === 0 ? "vitals.pulse" : "vitals.bp.systolic",
      value: { value: 80 + (i % 40), t: T(i), provenance: "clinician" },
      entryId: "e" + i,
    });
  }
  rows.push(measure("napló visszajátszása (5000 bejegyzés)", 50,
    () => { replay(log); },
    "EZ A HELYREÁLLÍTÁSI IDŐ (RTO) magja: egy hosszú vajúdás idősora."));
  rows.push(measure("lánc ellenőrzése (5000 bejegyzés, 5000 SHA-256)", 20,
    () => { verifyChain(log); },
    "Visszaállítás ELŐTT fut. Drágább, mint a visszajátszás — és megéri: " +
    "a csendben sérült mentés visszaáll, csak nem azt, ami volt."));
  rows.push(measure("egy bejegyzés hozzáfűzése (lenyomattal)", 5000,
    () => { append(log, { caseId: "bench", actor: "bench", op: "write", at: NOW,
      variableId: "vitals.pulse",
      value: { value: 88, t: NOW, provenance: "clinician" } }); },
    "Íráskor fut. A lenyomat ára billentyűleütésenként."));
}

/* ── 5. TITKOSÍTÁS: A BORÍTÉK ÁRA ───────────────────────────────────── */

{
  const dek = newDek();
  const aad = { caseId: "bench", seq: 1, prevHash: "genesis", formatVersion: 1 };
  const key = { keyId: "dek-bench", kekId: "kek", state: "active" as const, createdAt: NOW };
  const payload = { value: 118, t: NOW, provenance: "clinician",
                    unit: "mm[Hg]", confidence: "measured" };
  const sealed = seal(payload, dek, key.keyId, aad);

  rows.push(measure("egy érték lezárása (AES-256-GCM + kötés)", 20000,
    () => { seal(payload, dek, key.keyId, aad); },
    "Íráskor fut, bejegyzésenként."));
  rows.push(measure("egy érték felnyitása", 20000,
    () => { open(sealed, dek, key, aad); },
    "Olvasáskor fut. A titkosítás ára a klinikai úton ennyi."));
}

/* ── KIMENET ────────────────────────────────────────────────────────── */

if (JSON_OUT) {
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), rows }, null, 2));
} else {
  const BAND = { kocka: "16 ms alatt", azonnali: "100 ms alatt",
                 gondolat: "1 s alatt", "lassú": "1 s FÖLÖTT" };
  const w = Math.max(...rows.map((r) => r.what.length));
  console.log("MŰVELET".padEnd(w) + "  MEDIÁN      n      ÉRZET");
  console.log("-".repeat(w + 34));
  for (const r of rows) {
    const ms = r.ms < 1 ? r.ms.toFixed(3) : r.ms.toFixed(2);
    console.log(
      r.what.padEnd(w) + "  " + (ms + " ms").padStart(9) +
      String(r.n).padStart(7) + "   " + BAND[r.band]);
  }
  const slow = rows.filter((r) => r.band === "lassú");
  console.log();
  console.log(slow.length
    ? `FIGYELEM: ${slow.length} művelet 1 s fölött — ${slow.map((r) => r.what).join(", ")}`
    : "Minden mért művelet a saját érzethatára alatt.");
}
