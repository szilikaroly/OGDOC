/**
 * ICHOM PCB v5.0 EXPORT — és a hat kategória, amit nem szabad összemosni.
 *
 * A modul elfogadási kritériuma:
 *
 *   „A 42. napos mérési pont kitöltése után az eset ICHOM PCB v5.0-kompatibilis
 *    exportot ad, AZONOSÍTÓ NÉLKÜL, és az export mellé kiíródik, MELY KÖTELEZŐ
 *    VÁLTOZÓK MARADTAK ÜRESEN.”
 *
 * Az utolsó tagmondat a nehéz. Egy „hiányzó változók” lista ugyanis hat
 * különböző dolgot mosna össze, és ezek mind mást jelentenek — más ember
 * javítja mindegyiket:
 *
 *   present         — megvan
 *   missing         — VAN mezőnk, de üres            → a beteget kell megkérdezni
 *   unmapped        — NINCS ilyen mezőnk             → fejleszteni kell
 *   notCollected    — szándékosan nem gyűjtjük       → politikai döntés, nem hiba
 *   conditional     — feltételes tétel, a feltétel   → géppel NEM eldönthető
 *                     szabad szövegben van
 *   excludedPhi     — azonosít, ezért kimarad        → helyes viselkedés
 *
 * A hármat összeadó „82% teljesség” szám hazugság lenne: a fejlesztői
 * lemaradás, az adatgyűjtési mulasztás és a tudatos adatvédelmi döntés nem
 * ugyanaz, és az összegük semmit nem mér.
 */
import { readFileSync } from "node:fs";
import type { CaseState, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export interface IchomItem {
  /** Az ICHOM saját változóneve (`outcome.mlos`). */
  id: string;
  code: string;
  label: string;
  datatype: string;
  timing: string[];
  inclusion: string;
  phi: boolean;
}

export interface IchomSpec {
  standard: string;
  importedAt: string;
  items: IchomItem[];
}

export function loadIchomSpec(path: string): IchomSpec {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const items: IchomItem[] = (raw.variables ?? []).map((v: Record<string, unknown>) => ({
    id: String(v.id),
    code: String((v.standards as Record<string, unknown>)?.ichom_pcb_v5 ?? ""),
    label: String((v.label as Record<string, unknown>)?.en ?? v.id),
    datatype: String(v.datatype ?? ""),
    // A magban egy elgépelt szóköz is van a forrásban („42 days postpartum,”);
    // a normalizálás itt történik, nem a hívónál.
    timing: ((v.timing as string[]) ?? []).map((t) => t.trim().replace(/,$/, "")),
    inclusion: String(v.inclusion ?? ""),
    phi: v.phi === true,
  }));
  return { standard: String(raw.source), importedAt: String(raw.importedAt), items };
}

export type ItemStatus =
  | "present" | "missing" | "unmapped" | "notCollected" | "conditional" | "excludedPhi"
  /** Az eseményt ELLENŐRIZTÉK, és nem következett be — a dátummező joggal üres. */
  | "notOccurred";

export interface ExportRow {
  code: string;
  ichomId: string;
  label: string;
  status: ItemStatus;
  /** A mi változónk, ha van ilyen. */
  variable?: string;
  value?: unknown;
  note?: string;
}

export interface IchomExport {
  standard: string;
  timing: string;
  rows: ExportRow[];
  counts: Record<ItemStatus, number>;
  /** Kitölthető-e teljesnek: minden LEKÉPEZETT kötelező tétel megvan. */
  complete: boolean;
  /** Tartalmaz-e bármilyen azonosítót. MINDIG hamis — ezt teszt őrzi. */
  containsIdentifiers: boolean;
  caveat: string;
}

/**
 * Amit SZÁNDÉKOSAN nem gyűjtünk, és miért.
 *
 * Az etnikum és a „race” az ICHOM kötelező tétele. A rendszer NEM gyűjti:
 * a GDPR szerint különleges adat, a besorolás a gyakorlatban az ellátó
 * benyomásán múlik, és ugyanezért maradt ki a személyre szabott
 * növekedési görbéből is. Ez POLITIKAI DÖNTÉS, nem hiányosság — és épp ezért
 * nem szabad ugyanabba a listába kerülnie, mint az elmaradt adatfelvétel.
 */
const NOT_COLLECTED: Record<string, string> = {
  PCB005:
    "Az etnikum a GDPR szerint különleges adat, és a besorolás a gyakorlatban az " +
    "ellátó benyomásán múlik. A rendszer szándékosan nem gyűjti — ugyanazért, " +
    "amiért a személyre szabott növekedési görbéből is kimaradt.",
  PCB006:
    "A „race” kategória a magyar ellátásban nem értelmezett, és a GDPR szerint " +
    "különleges adat. A rendszer szándékosan nem gyűjti.",
};

/**
 * EGY DÁTUMMEZŐ NEM TUD NEMET MONDANI.
 *
 * Az anyai halál, a halvaszületés és az újszülöttkori halál ICHOM-tétele
 * DÁTUM. Ha az esemény nem következett be, a mező üres — de üres akkor is, ha
 * senki nem nézett utána. A kettő ugyanúgy néz ki, és nem ugyanaz: a 42
 * napon belüli anyai halál nagy része az intézményen KÍVÜL történik, és csak
 * akkor kerül be, ha valaki ténylegesen ellenőrzi.
 *
 * Ezért a nemleges tényt KÜLÖN mező mondja ki, és az export csak ennek
 * alapján minősít egy üres dátumot jogosnak.
 */
const NEGATED_BY: Record<string, { var: string; value: unknown; note: string }> = {
  PCB026: {
    var: "out.maternal.alive", value: "pos",
    note: "Ellenőrizve: az anya él a 42. napon, ezért a haláleset dátuma joggal üres.",
  },
  PCB027: {
    var: "out.birth.outcome", value: "liveBirth",
    note: "Élveszületés rögzítve, ezért a halvaszületés dátuma joggal üres.",
  },
  PCB028: {
    var: "out.neonate.alive", value: "pos",
    note: "Ellenőrizve: az újszülött él a 42. napon, ezért a haláleset dátuma joggal üres.",
  },
};

/** Melyik ICHOM-kódhoz melyik saját változónk tartozik. */
export function mapping(reg: Registry): Map<string, string> {
  const m = new Map<string, string>();
  for (const d of reg.all()) {
    const code = d.standards?.ichom;
    if (code && /^PCB\d+$/.test(code)) m.set(code, d.id);
  }
  return m;
}

export function ichomExport(
  reg: Registry, spec: IchomSpec, state: CaseState, timing: string, _lang: Lang = "hu",
): IchomExport {
  const map = mapping(reg);
  const rows: ExportRow[] = [];

  for (const item of spec.items) {
    // Az „On all forms” MINDEN mérési ponthoz tartozik — és épp ez a
    // beteg-azonosító tétel, aminek minden exportban LÁTHATÓAN ki kell
    // maradnia. Ha csak kiszűrnénk, az export nem mondaná meg, hogy volt mit
    // kihagyni.
    const applies = item.timing.some(
      (t) => t === "On all forms" || t === timing || t.includes(timing),
    );
    if (!applies) continue;
    const row: ExportRow = {
      code: item.code, ichomId: item.id, label: item.label, status: "missing",
    };

    // 1. AZONOSÍTÓ: soha nem kerül exportba, függetlenül attól, van-e adatunk.
    if (item.phi) {
      row.status = "excludedPhi";
      row.note =
        "Beteg-azonosító tétel: az exportból KIMARAD. Az intézmény oldalán " +
        "készül külön ICHOM-azonosító; a kettő összerendelése csak ott ismert.";
      rows.push(row);
      continue;
    }

    // 2. SZÁNDÉKOSAN NEM GYŰJTÖTT.
    if (NOT_COLLECTED[item.code]) {
      row.status = "notCollected";
      row.note = NOT_COLLECTED[item.code];
      rows.push(row);
      continue;
    }

    // 3. FELTÉTELES TÉTEL. Az `inclusion` mező SZABAD SZÖVEG az ICHOM-ban
    //    („If answered 2 = WHODAS V2.0-12 to HR-HSQoL”). Ezt géppel nem
    //    értékeljük ki — és nem is teszünk úgy, mintha tudnánk: a feltételes
    //    tétel se nem hiány, se nem teljesített.
    if (item.inclusion && item.inclusion !== "All Patients") {
      row.status = "conditional";
      row.note =
        `A tétel feltételes: „${item.inclusion}”. A feltétel SZABAD SZÖVEG az ` +
        `ICHOM-specifikációban, ezért géppel nem értékelhető ki. A rendszer nem ` +
        `tesz úgy, mintha eldöntötte volna: a tétel se nem hiány, se nem kész.`;
      rows.push(row);
      continue;
    }

    // 4. VAN-E EGYÁLTALÁN MEZŐNK RÁ.
    const varId = map.get(item.code);
    if (!varId) {
      row.status = "unmapped";
      row.note =
        "A katalógusban NINCS ehhez a tételhez mező. Ez FEJLESZTŐI feladat, nem " +
        "adatgyűjtési mulasztás — a kettő összemosása mindkettőt eltünteti.";
      rows.push(row);
      continue;
    }
    row.variable = varId;

    // 5. MEGVAN-E AZ ADAT.
    const r = resolve(reg, state, varId);
    if (r.state === "ok") {
      row.status = "present";
      row.value = r.value;
    } else {
      // Üres dátum: megnézzük, kimondta-e valaki, hogy az esemény NEM történt.
      const neg = NEGATED_BY[item.code];
      const negR = neg ? resolve(reg, state, neg.var) : null;
      if (neg && negR?.state === "ok" && negR.value === neg.value) {
        row.status = "notOccurred";
        row.note = neg.note;
      } else {
        row.status = "missing";
        row.note =
          `A mező (${varId}) létezik, de üres. Ez ADATGYŰJTÉSI hiány: a beteget ` +
          `vagy a dokumentációt kell megkérdezni, nem fejleszteni.` +
          (neg
            ? ` FIGYELEM: egy dátummező nem tud nemet mondani — ha az esemény nem ` +
              `következett be, azt a(z) ${neg.var} mezőben kell kimondani, mert az ` +
              `üres dátum megkülönböztethetetlen az elmaradt ellenőrzéstől.`
            : "");
      }
    }
    rows.push(row);
  }

  const counts = rows.reduce((a, r) => {
    a[r.status] = (a[r.status] ?? 0) + 1;
    return a;
  }, {} as Record<ItemStatus, number>);
  for (const k of ["present", "missing", "unmapped", "notCollected", "conditional",
                   "excludedPhi", "notOccurred"] as ItemStatus[]) {
    counts[k] ??= 0;
  }

  const complete = counts.missing === 0;
  return {
    standard: spec.standard, timing, rows, counts, complete,
    containsIdentifiers: rows.some((r) => r.status === "present" && r.code === "PCB000"),
    caveat:
      `A ${timing} időponthoz az ICHOM ${rows.length} tételt sorol. Ebből ` +
      `${counts.present} kitöltve, ${counts.missing} ÜRES (adatgyűjtési hiány), ` +
      `${counts.unmapped} tételhez NINCS mezőnk (fejlesztői feladat), ` +
      `${counts.notCollected} tételt szándékosan nem gyűjtünk, ` +
      `${counts.conditional} feltételes tétel géppel nem értékelhető ki, ` +
      `${counts.notOccurred} eseményről ellenőrizve tudjuk, hogy nem következett be, ` +
      `${counts.excludedPhi} azonosító kimarad. ` +
      `EZEK NEM ADHATÓK ÖSSZE: a fejlesztői lemaradás, az adatgyűjtési mulasztás ` +
      `és a tudatos adatvédelmi döntés nem ugyanaz, és egyetlen „teljességi ` +
      `százalék” mindhármat elrejtené.`,
  };
}

/**
 * A NEVEZŐ. Egyetlen eset exportja semmit nem mond a torzításról.
 *
 * Ha a kimeneteli mutatókat csak a visszatérő betegekből számoljuk, a mutató
 * az intézményt hízelgi: aki rosszul járt, gyakrabban nem jön vissza. Ezért a
 * kohorsz-szintű összesítés a VÁLASZARÁNYT is megadja, és amíg az alacsony,
 * a mutató nem közölhető összehasonlításra.
 */
export function cohortCompleteness(
  exports: Array<{ export: IchomExport; returned: boolean }>,
  minResponseRate = 0.8,
): {
  due: number; returned: number; responseRate: number;
  comparable: boolean; caveat: string;
} {
  const due = exports.length;
  const returned = exports.filter((e) => e.returned).length;
  const rate = due ? returned / due : 0;
  const comparable = due > 0 && rate >= minResponseRate;
  return {
    due, returned, responseRate: rate, comparable,
    caveat: comparable
      ? `Válaszarány ${(rate * 100).toFixed(0)}% (${returned}/${due}).`
      : `VÁLASZARÁNY ${(rate * 100).toFixed(0)}% (${returned}/${due}) — a mutató ` +
        `összehasonlításra NEM közölhető. Aki rosszul járt, gyakrabban nem jön ` +
        `vissza: a hiányzó ${due - returned} eset nem véletlenszerűen hiányzik, ` +
        `és a számított kimenetel ezért a valóságosnál jobb.`,
  };
}

/** Integritás: a regiszter ICHOM-hivatkozásai létező tételekre mutatnak-e. */
export function validateIchomMapping(reg: Registry, spec: IchomSpec): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const known = new Set(spec.items.map((i) => i.code));
  const used = new Map<string, string[]>();

  for (const d of reg.all()) {
    const code = d.standards?.ichom;
    if (!code) continue;
    if (!/^PCB\d+$/.test(code)) {
      issues.push({
        severity: "error", id: d.id,
        message: `az ICHOM-hivatkozás nem PCB-kód: ${code}`,
      });
      continue;
    }
    if (!known.has(code)) {
      issues.push({
        severity: "error", id: d.id,
        message: `ismeretlen ICHOM-kód: ${code} — nem szerepel a betöltött szabványban`,
      });
    }
    used.set(code, [...(used.get(code) ?? []), d.id]);
  }
  for (const [code, ids] of used) {
    if (ids.length > 1) {
      issues.push({
        severity: "error", id: ids[0],
        message: `a(z) ${code} ICHOM-kódra több változó is hivatkozik: ${ids.join(", ")}`,
      });
    }
  }
  return issues;
}
