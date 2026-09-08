/**
 * NAPLÓZÁSI SZERZŐDÉS — a mag nem naplóz, hanem TÉNYT AD VISSZA.
 *
 * A `core/` egyetlen `console.log`-ot sem tartalmaz, és ez nem véletlen: egy
 * könyvtár, amelyik ír valahova, eldönti a gazdája helyett, mi számít
 * fontosnak, és beleír egy olyan csatornába, amit nem ő tart karban. A mag
 * ehelyett minden elutasításhoz megírja a MIÉRT-et (`why`, `CaseState.errors`),
 * és a gazda dönti el, hogy azt kiírja, elmenti vagy elhallgatja.
 *
 * Ez a fájl a szerződés a másik irányba: amit a gazdának naplóznia KELL, és
 * ahogyan azt tennie kell. Két külön naplóról van szó, és a kettő
 * összekeverése a leggyakoribb hiba:
 *
 *   MŰKÖDÉSI NAPLÓ    hibakeresésre. Rövid életű, fejlesztő olvassa.
 *                     BETEGADATOT NEM TARTALMAZHAT.
 *   AUDITNAPLÓ        ki mit mikor olvasott és írt. Jogszabályi
 *                     követelmény, módosíthatatlan, és a MEGŐRZÉSI IDEJE
 *                     ELTÉR a leletétől.
 *
 * A szétválasztás nem elvi finomság. A működési napló hibakeresés közben
 * kikerül fejlesztői gépre, jegyre, képernyőképre; az auditnapló soha.
 */
import type { Registry } from "../registry.ts";

export type LogLevel = "debug" | "info" | "warn" | "error";

/** MŰKÖDÉSI esemény — betegadat nélkül. */
export interface OpEvent {
  kind: "op";
  level: LogLevel;
  at: string;
  /** Honnan: modul vagy függvény, nem fájlnév. */
  where: string;
  message: string;
  /**
   * Az esethez kötés AZONOSÍTÓVAL, nem tartalommal. A `caseId` álnevesített
   * kulcs: önmagában nem azonosít beteget, de a naplósorokat összefűzi.
   */
  caseId?: string;
  /** Egy kérés/művelet minden sorát összefűző azonosító. */
  traceId?: string;
  /** Számok, azonosítók, időtartamok. ÉRTÉKEK NEM. */
  data?: Record<string, string | number | boolean | null>;
}

/** AUDIT esemény — jogszabályi követelmény, módosíthatatlan. */
export interface AuditEvent {
  kind: "audit";
  at: string;
  /** KI. Nem „a rendszer": megnevezett személy vagy megnevezett folyamat. */
  actor: string;
  /** MIT tett. */
  action: "read" | "write" | "export" | "print" | "delete" | "login" | "denied";
  /** MIN. Eset- és változóazonosító — nem az érték. */
  caseId: string;
  variableIds?: string[];
  /** MIÉRT volt joga hozzá. Üres string nem elfogadható. */
  basis: string;
  traceId?: string;
  /** Elutasított hozzáférésnél az ok. */
  denyReason?: string;
}

export type LogEvent = OpEvent | AuditEvent;

/**
 * A NYELŐ. A mag nem tudja, hova megy — ez a lényeg.
 *
 * Az `audit` nyelő nem dobhat el eseményt. Ha nem tud írni, a MŰVELETNEK kell
 * elbuknia: egy naplózhatatlan olvasás jogilag meg nem történt olvasás, és a
 * csendben elveszett auditsor rosszabb, mint a leállás.
 */
export interface Sink {
  op(e: OpEvent): void;
  /** Dobhat. A hívó NEM nyelheti le. */
  audit(e: AuditEvent): void;
}

/** Tesztekhez és fejlesztéshez: memóriában gyűjt, sehova nem ír. */
export function memorySink(): Sink & { events: LogEvent[] } {
  const events: LogEvent[] = [];
  return {
    events,
    op(e) { events.push(e); },
    audit(e) { events.push(e); },
  };
}

/* ── A SZIVÁRGÁS ELLEN ──────────────────────────────────────────────── */

const PHI_HINT = /taj|szemely|szig|nev|cim|telefon|email|anyja|szul.*hely|lakcim/i;

export interface RedactionIssue {
  where: string;
  key: string;
  why: string;
}

/**
 * MEGVIZSGÁLJA, HOGY EGY MŰKÖDÉSI ESEMÉNY SZIVÁROGTAT-E.
 *
 * Két úton fog: a regiszterből (a `phi: true` jelölésű változók azonosítói) és
 * névmintából (a kulcs neve árulkodik). A második azért kell, mert a
 * naplósorba nem csak változóazonosítók kerülnek — kerül bele kézzel írt
 * kulcs is, és éppen az a veszélyes.
 *
 * NEM javít, hanem MEGNEVEZ. A csendben megtisztított napló hazudik arról,
 * hogy a hívó rendben írt; a megnevezett szivárgás javítható.
 */
export function auditRedaction(reg: Registry, e: OpEvent): RedactionIssue[] {
  const out: RedactionIssue[] = [];
  for (const [key, value] of Object.entries(e.data ?? {})) {
    const def = reg.get(key);
    if (def?.phi) {
      out.push({ where: e.where, key,
        why: `a(z) ${key} változó \`phi: true\` jelölésű — a MŰKÖDÉSI naplóba ` +
             `nem kerülhet, csak az auditnapló hivatkozhat rá azonosítóként` });
      continue;
    }
    if (PHI_HINT.test(key)) {
      out.push({ where: e.where, key,
        why: `a(z) „${key}” kulcs neve beteg-azonosításra alkalmas adatra utal. ` +
             `Ha mégsem az, nevezd át — egy naplószűrő nem tud gondolatot olvasni` });
      continue;
    }
    if (typeof value === "string" && value.length > 200) {
      out.push({ where: e.where, key,
        why: `a(z) „${key}” értéke ${value.length} karakter: a hosszú szabad ` +
             `szöveg a leggyakoribb szivárgási út, mert senki nem olvassa el, ` +
             `mi került bele` });
    }
  }
  return out;
}

/**
 * AZ AUDITSOR TELJESSÉGE.
 *
 * Egy auditnapló, amiből hiányzik a „ki" vagy a „miért", nem auditnapló:
 * utólag nem lehet belőle megállapítani, jogszerű volt-e a hozzáférés. Ezért
 * ez ELLENŐRZÉS, nem ajánlás — és a hívónak a művelet ELŐTT kell lefuttatnia.
 */
export function checkAudit(e: AuditEvent): string[] {
  const bad: string[] = [];
  if (!e.actor?.trim()) {
    bad.push("hiányzik a CSELEKVŐ. „A rendszer” nem cselekvő: megnevezett " +
             "személy vagy megnevezett folyamat kell");
  }
  if (!e.caseId?.trim()) bad.push("hiányzik az ESET azonosítója");
  if (!e.basis?.trim()) {
    bad.push("hiányzik a JOGALAP. Enélkül az auditsor azt rögzíti, hogy " +
             "valaki hozzáfért — azt nem, hogy joga volt hozzá");
  }
  if (e.action === "denied" && !e.denyReason?.trim()) {
    bad.push("elutasított hozzáférés indoklás nélkül — az elutasítás oka " +
             "legalább annyira lelet, mint a hozzáférés ténye");
  }
  if (!e.at || Number.isNaN(Date.parse(e.at))) bad.push("hiányzó vagy hibás időbélyeg");
  return bad;
}
