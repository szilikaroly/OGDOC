/**
 * A NAPLÓ MŰVELETEI — hozzáfűzés, láncellenőrzés, visszajátszás, pillanatkép.
 *
 * Minden itteni függvény TISZTA: nem ír lemezre, nem hív hálózatot. A
 * tartósságot a gazda oldja meg — a mag azt mondja meg, MI a helyes
 * bejegyzés, és hogy egy kapott napló ÉP-E.
 */
import { createHash, randomUUID } from "node:crypto";
import type { CaseState, Value } from "../types.ts";
import {
  GENESIS, JOURNAL_FORMAT, type JournalEntry, type JournalOp,
} from "./types.ts";

/**
 * A LENYOMAT DETERMINISZTIKUS SOROSÍTÁSBÓL KÉSZÜL.
 *
 * A `JSON.stringify` a kulcsok BESZÚRÁSI sorrendjét őrzi meg, nem az ábécét.
 * Két gépen ugyanaz a bejegyzés más sorrendben épülhet fel, és akkor a
 * lenyomata is más lenne — a lánc pedig ott törne el, ahol semmi baj nincs.
 * Ezért a kulcsokat rendezzük.
 */
function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  const keys = Object.keys(v as object).filter(
    (k) => (v as Record<string, unknown>)[k] !== undefined).sort();
  return "{" + keys.map((k) =>
    JSON.stringify(k) + ":" + stable((v as Record<string, unknown>)[k])).join(",") + "}";
}

/** Egy bejegyzés lenyomata — a `hash` mezőt magát kihagyva. */
export function hashEntry(e: Omit<JournalEntry, "hash">): string {
  return createHash("sha256")
    .update(`ogdoc-journal-v${JOURNAL_FORMAT}\n` + stable(e))
    .digest("hex");
}

export interface AppendInput {
  caseId: string;
  actor: string;
  op: JournalOp;
  at: string;
  variableId?: string;
  value?: Value;
  ctx?: CaseState["ctx"];
  reason?: string;
  /** Csak teszthez: determinisztikus azonosító. */
  entryId?: string;
}

/**
 * ÚJ BEJEGYZÉS A NAPLÓ VÉGÉRE.
 *
 * A napló nem módosul: új tömböt ad vissza. Ez nem funkcionális pózolás — egy
 * helyben módosított naplónál a részlegesen megírt állapot ugyanaz a
 * változó, mint a teljes, és a hívó nem tudja, melyiket kapta.
 */
export function append(log: JournalEntry[], input: AppendInput): JournalEntry[] {
  if (!input.actor?.trim()) {
    throw new Error(
      "A bejegyzésnek CSELEKVŐJE kell legyen. „A rendszer” nem cselekvő: " +
      "megnevezett személy vagy megnevezett folyamat — az írási napló " +
      "egyben az auditnapló írási fele.",
    );
  }
  if (input.op === "erase" && !input.reason?.trim()) {
    throw new Error(
      "A TÖRLÉS INDOKLÁS NÉLKÜL NEM RÖGZÍTHETŐ. A sírkő indoklás nélkül nem " +
      "különböztethető meg az adatvesztéstől — és éppen ez a különbség az, " +
      "amit évekkel később bizonyítani kell.",
    );
  }
  if (input.op === "write" && (!input.variableId || !input.value)) {
    throw new Error("Az írás bejegyzéséhez változó és érték kell.");
  }

  const prev = log[log.length - 1];
  const base: Omit<JournalEntry, "hash"> = {
    seq: prev ? prev.seq + 1 : 1,
    entryId: input.entryId ?? randomUUID(),
    at: input.at,
    caseId: input.caseId,
    actor: input.actor,
    op: input.op,
    prevHash: prev ? prev.hash : GENESIS,
    ...(input.variableId ? { variableId: input.variableId } : {}),
    ...(input.value ? { value: input.value } : {}),
    ...(input.ctx ? { ctx: input.ctx } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  };
  return [...log, { ...base, hash: hashEntry(base) }];
}

/* ── A LÁNC ÉPSÉGE ──────────────────────────────────────────────────── */

export interface ChainCheck {
  ok: boolean;
  /** Az első hibás bejegyzés sorszáma, ha van. */
  brokenAt: number | null;
  kind: "ok" | "tampered" | "gap" | "reordered" | "brokenLink" | "empty";
  why: string;
}

/**
 * A NAPLÓ ÉPSÉGÉNEK ELLENŐRZÉSE — visszaállítás ELŐTT, nem után.
 *
 * Négy különböző romlást különböztet meg, mert a teendő is más:
 *
 *   tampered    egy bejegyzés TARTALMA változott → a másolat nem hiteles
 *   gap         hiányzik egy sorszám → részleges szállítmány, kérd újra
 *   reordered   a sorszámok nem növekvők → a szállítás összekeverte
 *   brokenLink  a lánc nem illeszkedik → két napló összefésülése történt
 *
 * Az utolsó a legalattomosabb: két külön naplóból „összeollózott" mentés
 * egyenként ép bejegyzésekből áll, mégsem hiteles.
 *
 * AMIT EZ A FÜGGVÉNY NEM TUD, ÉS NEM IS TUDHAT: A LEVÁGOTT VÉGET. Ha a napló
 * utolsó bejegyzései eltűnnek, a maradék lánc HIÁNYTALAN — hézag nincs, minden
 * lenyomat illeszkedik —, és ez a függvény „ép”-et mond. Nem hiba: a naplóban
 * nincs olyan adat, amiből a hiányzó vég kiderülhetne. Ehhez a `Horgony` kell,
 * ami a naplón KÍVÜL tartja a véget; l. `core/pilot/horgony.ts`. Ezért az
 * „ép lánc” önmagában NEM bizonyítja, hogy nem veszett adat.
 */
export function verifyChain(
  log: JournalEntry[], from: { prevHash: string; prevSeq: number } = { prevHash: GENESIS, prevSeq: 0 },
): ChainCheck {
  if (!log.length) {
    return { ok: true, brokenAt: null, kind: "empty",
      why: "Üres napló. Ez ÉRVÉNYES állapot — de ha adatot vártunk, akkor a " +
           "szállítmány veszett el, nem az eset volt üres." };
  }

  // SORSZÁM-ELLENŐRZÉS ELŐSZÖR, AZ EGÉSZ NAPLÓRA.
  //
  // A felcserélt sorrend és a hézag az ELSŐ eltérésnél egyformán néz ki —
  // megkülönböztetni csak az egész sorozat ismeretében lehet. És a teendő
  // más: a felcserélt naplót újrarendezni kell, a hiányosat újrakérni.
  const seqs = log.map((e) => e.seq);
  const sorted = [...seqs].sort((a, b) => a - b);
  const contiguous = sorted.every((v, i) => v === from.prevSeq + 1 + i);
  const ascending = seqs.every((v, i) => i === 0 || v > seqs[i - 1]);

  if (contiguous && !ascending) {
    const at = seqs.find((v, i) => i > 0 && v < seqs[i - 1])!;
    return {
      ok: false, brokenAt: at, kind: "reordered",
      why: `FELCSERÉLT SORREND: a napló minden bejegyzése megvan ` +
           `(${from.prevSeq + 1}–${sorted[sorted.length - 1]}), de nem ` +
           `növekvő sorrendben — a(z) ${at}. bejegyzés a helye előtt áll. A ` +
           `szállítás keverte össze; a napló ÚJRARENDEZHETŐ, nem kell újrakérni.`,
    };
  }
  if (!contiguous) {
    const missing: number[] = [];
    for (let v = from.prevSeq + 1; v <= sorted[sorted.length - 1]; v++) {
      if (!sorted.includes(v)) missing.push(v);
    }
    const dup = sorted.filter((v, i) => i > 0 && v === sorted[i - 1]);
    return {
      ok: false, brokenAt: missing[0] ?? dup[0] ?? sorted[0], kind: "gap",
      why: missing.length
        ? `HÉZAG a naplóban: hiányzik a(z) ${missing.join(", ")}. bejegyzés. ` +
          `Ez részleges szállítmány — a hiányzókat újra kell kérni. A ` +
          `visszajátszás NEM folytatható: a kimaradt írás csendben eltűnne.`
        : `ISMÉTLŐDŐ SORSZÁM (${dup.join(", ")}). Két bejegyzés ugyanarra a ` +
          `helyre — a visszajátszás duplázna.`,
    };
  }

  // LÁNC- ÉS LENYOMAT-ELLENŐRZÉS a helyes sorrendű naplón.
  let prevHash = from.prevHash;
  for (const e of log) {
    if (e.prevHash !== prevHash) {
      return {
        ok: false, brokenAt: e.seq, kind: "brokenLink",
        why: `A LÁNC NEM ILLESZKEDIK a(z) ${e.seq}. bejegyzésnél. Ez akkor ` +
             `fordul elő, ha két KÜLÖNBÖZŐ napló darabjait fésülték össze: ` +
             `minden bejegyzés önmagában ép, a napló mégsem hiteles.`,
      };
    }
    const { hash, ...rest } = e;
    if (hashEntry(rest) !== hash) {
      return {
        ok: false, brokenAt: e.seq, kind: "tampered",
        why: `A(z) ${e.seq}. bejegyzés TARTALMA MEGVÁLTOZOTT a rögzítése óta. ` +
             `A másolat nem hiteles — sem visszaállításra, sem bizonyítékként ` +
             `nem használható. Ez a legfontosabb ellenőrzés: a csendben sérült ` +
             `mentés visszaáll, csak nem azt, ami volt.`,
      };
    }
    prevHash = hash;
  }
  return { ok: true, brokenAt: null, kind: "ok",
    why: `A lánc ép: ${log.length} bejegyzés, ${log[0].seq}-től ` +
         `${log[log.length - 1].seq}-ig, minden lenyomat illeszkedik.` };
}

/* ── VISSZAJÁTSZÁS ──────────────────────────────────────────────────── */

export interface ReplayResult {
  state: CaseState;
  /** Melyik sorszámig játszottuk vissza. */
  seq: number;
  /** A sírkővel törölt változók. */
  erased: Array<{ variableId: string; reason: string; at: string; actor: string }>;
}

/**
 * A NAPLÓBÓL ÁLLAPOT.
 *
 * IDEMPOTENS: ugyanaz a napló mindig ugyanazt az állapotot adja, és a
 * kétszeri lefuttatás sem duplázza az értékeket. Ez a helyreállítás
 * legfontosabb tulajdonsága — visszaállítás közben az újrapróbálkozás
 * normális, nem kivételes esemény.
 *
 * A visszajátszás NEM ellenőrzi a láncot: azt előbb kell, a `verifyChain()`
 * hívásával. A sorrend itt szándékosan külön lépés, mert a hívónak el kell
 * döntenie, mit tesz egy sérült naplóval — a mag ezt nem döntheti el helyette.
 */
export function replay(log: JournalEntry[], upToSeq = Infinity): ReplayResult {
  const values: Record<string, Value[]> = {};
  const erased: ReplayResult["erased"] = [];
  let ctx: CaseState["ctx"] = { encounter: "ambulatory", now: "" };
  let seq = 0;

  for (const e of log) {
    if (e.seq > upToSeq) break;
    seq = e.seq;
    if (e.op === "context" && e.ctx) { ctx = e.ctx; continue; }
    if (e.op === "write" && e.variableId && e.value) {
      (values[e.variableId] ??= []).push(e.value);
      continue;
    }
    if (e.op === "erase" && e.variableId) {
      // A SÍRKŐ TÖRÖL, ÉS A TÖRLÉS TÉNYE MEGMARAD. A visszajátszás után az
      // érték nincs sehol — de az, hogy volt és miért nincs, kiolvasható.
      delete values[e.variableId];
      erased.push({ variableId: e.variableId, reason: e.reason ?? "",
                    at: e.at, actor: e.actor });
    }
  }
  if (!ctx.now && log.length) ctx = { ...ctx, now: log[log.length - 1].at };
  return { state: { ctx, values, errors: [] }, seq, erased };
}

/* ── PILLANATKÉP ÉS TÖMÖRÍTÉS ───────────────────────────────────────── */

export interface Snapshot {
  formatVersion: typeof JOURNAL_FORMAT;
  /** Meddig tartalmazza a naplót. Innen kell folytatni a visszajátszást. */
  throughSeq: number;
  /** A `throughSeq` bejegyzés lenyomata — ide illeszkedik a folytatás. */
  throughHash: string;
  takenAt: string;
  state: CaseState;
  /** A pillanatkép saját lenyomata. */
  hash: string;
  /**
   * A TÖMÖRÍTÉST TÚLÉLŐ SÍRKÖVEK.
   *
   * Ha a törlések a tömörítésnél elvesznek, egy régebbi napló
   * visszajátszása FELTÁMASZTJA a törölt adatot — és a GDPR-törlés a
   * mentésben tovább él. A sírkő ezért kikerül a pillanatképbe is.
   */
  erased: ReplayResult["erased"];
}

export function snapshot(log: JournalEntry[], takenAt: string, upToSeq = Infinity): Snapshot {
  const r = replay(log, upToSeq);
  const last = log.filter((e) => e.seq <= upToSeq).pop();
  const body = {
    formatVersion: JOURNAL_FORMAT,
    throughSeq: r.seq,
    throughHash: last ? last.hash : GENESIS,
    takenAt,
    state: r.state,
    erased: r.erased,
  };
  return { ...body, hash: createHash("sha256")
    .update("ogdoc-snapshot-v" + JOURNAL_FORMAT + "\n" + stable(body)).digest("hex") };
}

/**
 * A PILLANATKÉP ÉS A FOLYTATÁS ILLESZKEDÉSE.
 *
 * A gyakorlati helyreállítás így néz ki: pillanatkép betöltése, majd a
 * MARADÉK napló visszajátszása. Ha a kettő nem illeszkedik, a végeredmény
 * hihetőnek látszik, és mégis rossz — ezért ez külön ellenőrzés.
 */
export function checkContinuation(snap: Snapshot, tail: JournalEntry[]): ChainCheck {
  if (!tail.length) {
    return { ok: true, brokenAt: null, kind: "ok",
      why: "Nincs folytatás: a pillanatkép a napló vége." };
  }
  const first = tail[0];
  if (first.seq !== snap.throughSeq + 1) {
    return { ok: false, brokenAt: first.seq, kind: "gap",
      why: `A pillanatkép a(z) ${snap.throughSeq}. bejegyzésig tart, a folytatás ` +
           `viszont a(z) ${first.seq}.-nál kezdődik. ${
             first.seq > snap.throughSeq + 1
               ? "Hiányzik közte bejegyzés — a visszaállítás CSENDBEN veszítene adatot."
               : "Átfedés van — a visszajátszás duplázna."}` };
  }
  if (first.prevHash !== snap.throughHash) {
    return { ok: false, brokenAt: first.seq, kind: "brokenLink",
      why: `A folytatás nem ehhez a pillanatképhez tartozik: a lenyomatok nem ` +
           `illeszkednek. Más eset vagy más napló darabja került ide.` };
  }
  return verifyChain(tail, { prevHash: snap.throughHash, prevSeq: snap.throughSeq });
}

/* ── HELYREÁLLÍTÁSI PRÓBA ───────────────────────────────────────────── */

export interface RestoreDrill {
  ok: boolean;
  elapsedMs: number;
  entries: number;
  valuesRestored: number;
  chain: ChainCheck;
  mismatches: string[];
  why: string;
}

/**
 * A VISSZA NEM ÁLLÍTOTT MENTÉS NEM MENTÉS.
 *
 * Ez a függvény a negyedéves helyreállítási próba motorja: egy naplóból
 * visszaállít, összeveti a várt állapottal, és MÉRI, mennyi ideig tartott. A
 * katasztrófa napja rossz nap az első próbához — és a mért idő az egyetlen
 * alap, amiből a helyreállítási idő (RTO) megígérhető.
 */
export function restoreDrill(
  log: JournalEntry[], expected: CaseState, now: () => number = () => Date.now(),
): RestoreDrill {
  const t0 = now();
  const chain = verifyChain(log);
  const r = replay(log);
  const elapsedMs = now() - t0;

  const mismatches: string[] = [];
  const ids = new Set([...Object.keys(expected.values), ...Object.keys(r.state.values)]);
  for (const id of [...ids].sort()) {
    const a = expected.values[id] ?? [];
    const b = r.state.values[id] ?? [];
    if (a.length !== b.length) {
      mismatches.push(`${id}: várt ${a.length} érték, visszaállt ${b.length}`);
      continue;
    }
    for (let i = 0; i < a.length; i++) {
      if (stable(a[i]) !== stable(b[i])) mismatches.push(`${id}[${i}]: eltérő érték`);
    }
  }
  const valuesRestored = Object.values(r.state.values).reduce((n, v) => n + v.length, 0);
  const ok = chain.ok && mismatches.length === 0;
  return {
    ok, elapsedMs, entries: log.length, valuesRestored, chain, mismatches,
    why: ok
      ? `Helyreállítási próba RENDBEN: ${log.length} bejegyzésből ` +
        `${valuesRestored} érték állt vissza ${elapsedMs} ms alatt, a lánc ép.`
      : !chain.ok
        ? `A próba ELBUKOTT a lánc ellenőrzésén: ${chain.why}`
        : `A próba ELBUKOTT: ${mismatches.length} eltérés a várt állapothoz ` +
          `képest. A mentés visszaáll, de NEM azt adja vissza, ami volt — ` +
          `ez a legveszélyesebb hibaosztály.`,
  };
}
