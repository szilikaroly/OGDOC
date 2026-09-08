/**
 * A KOMMUNIKÁCIÓS CSATORNÁK JEGYZÉKE — mit tud, és mit NEM tud mindegyik.
 *
 * A rendszer négy kapuja (azonosság, fogalom, egység, eszköz-QC) minden
 * csatornára ugyanaz. A CSATORNÁK KÉPESSÉGE VISZONT NEM UGYANAZ, és ezt
 * kimondani fontosabb, mint egységesen kezelni őket:
 *
 *   Egy HL7-üzenet hordoz betegazonosítót, nyugtázást és időbélyeget.
 *   Egy SOROS VONALON érkező mérés EGYIKET SEM.
 *
 * Ha a rendszer úgy tesz, mintha a kettő egyforma volna, akkor vagy a HL7-et
 * kezeli feleslegesen szigorúan, vagy — és ez a rosszabb — a soros mérést
 * kezeli olyan bizalommal, amit az nem érdemel. A második eset konkrét kárt
 * okoz: egy betegazonosító nélküli mérés némán a rossz laphoz kerül.
 *
 * EZÉRT MINDEN CSATORNÁHOZ TARTOZIK EGY KÉPESSÉGLISTA, és a hiányzó képesség
 * PÓTLÁSI MÓDJA. A „nincs betegazonosító” nem hiányosság, amit el kell
 * hallgatni, hanem tulajdonság, amihez eljárás kell.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { Channel } from "./types.ts";

export type CsatornaAllapot =
  /** Kód és eljárás kész, használható. */
  | "mukodik"
  /** A kód kész, de szervezeti feltétel hiányzik (szerződés, eszköz). */
  | "feltetelreVar"
  /** Meg van tervezve, kód nincs. */
  | "tervezett";

export interface Csatorna {
  id: Channel;
  megnevezes: string;
  /** Fizikai vagy hálózati út. */
  atvitel: string;
  /** Az üzenet alakja. */
  formatum: string;
  allapot: CsatornaAllapot;
  /** Hordoz-e betegazonosítót az üzenet MAGA. */
  betegazonosito: boolean;
  /** Van-e nyugtázás: tudja-e a küldő, hogy megérkezett. */
  nyugtazas: boolean;
  /** Az üzenet hordoz-e megbízható időbélyeget. */
  idobelyeg: boolean;
  /** Hordoz-e mértékegységet. */
  mertekegyseg: boolean;
  /** Ha valamelyik hiányzik: MIVEL pótoljuk. Üres lista csak akkor, ha mind megvan. */
  potlas: string[];
  irany: "be" | "ki" | "ketiranyu";
  leiras: string;
}

export interface CsatornaKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  csatornak: Csatorna[];
}

export function loadCsatornak(path: string): CsatornaKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as CsatornaKeszlet;
}

/* ── A CSATORNA MEGBÍZHATÓSÁGA ───────────────────────────────────────── */

export type BizalomSzint =
  /** Minden képesség megvan: az üzenet önmagában elég. */
  | "onmagabanEleg"
  /** Hiányzik képesség, de mindegyikhez van pótlás. */
  | "potlassal"
  /** Hiányzik képesség, amihez NINCS pótlás — ez blokkoló. */
  | "hianyos";

export interface BizalomItelet {
  szint: BizalomSzint;
  hianyzo: string[];
  potlas: string[];
  miert: string;
}

/**
 * MENNYIRE ÁLLHAT MEG AZ ÜZENET ÖNMAGÁBAN.
 *
 * A soros vonal itt szándékosan NEM bukik meg: attól, hogy nincs benne
 * betegazonosító, még használható — ha van dokumentált hozzárendelési lépés.
 * A rendszer nem a csatornát minősíti, hanem azt, hogy a hiányát pótolták-e.
 */
export function bizalom(cs: Csatorna): BizalomItelet {
  const hianyzo: string[] = [];
  if (!cs.betegazonosito) hianyzo.push("betegazonosító az üzenetben");
  if (!cs.nyugtazas) hianyzo.push("nyugtázás");
  if (!cs.idobelyeg) hianyzo.push("megbízható időbélyeg");
  if (!cs.mertekegyseg) hianyzo.push("mértékegység");

  if (!hianyzo.length) {
    return { szint: "onmagabanEleg", hianyzo, potlas: cs.potlas,
      miert: `${cs.megnevezes}: minden képesség megvan, az üzenet önmagában elég.` };
  }
  if (!cs.potlas.length) {
    return { szint: "hianyos", hianyzo, potlas: [],
      miert:
        `${cs.megnevezes}: ${hianyzo.length} képesség hiányzik ` +
        `(${hianyzo.join(", ")}), és EGYIKHEZ SINCS pótlás megnevezve. Egy ilyen ` +
        `csatornán érkező adat nem kötheti magát betegre — a rendszer ezért nem ` +
        `veszi át, hanem várakozó sorba teszi.` };
  }
  return { szint: "potlassal", hianyzo, potlas: cs.potlas,
    miert:
      `${cs.megnevezes}: ${hianyzo.join(", ")} hiányzik az üzenetből, ezért ` +
      `pótlás kell hozzá — ${cs.potlas.join("; ")}. Ez nem a csatorna hibája, ` +
      `hanem a tulajdonsága: a pótlás eljárás, nem kód.` };
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface CsatornaMerleg {
  osszes: number;
  mukodik: number;
  onmagabanEleg: number;
  potlassal: number;
  hianyos: number;
}

export function merleg(k: CsatornaKeszlet): CsatornaMerleg {
  const b = k.csatornak.map(bizalom);
  return {
    osszes: k.csatornak.length,
    mukodik: k.csatornak.filter((c) => c.allapot === "mukodik").length,
    onmagabanEleg: b.filter((x) => x.szint === "onmagabanEleg").length,
    potlassal: b.filter((x) => x.szint === "potlassal").length,
    hianyos: b.filter((x) => x.szint === "hianyos").length,
  };
}

export function validateCsatornak(k: CsatornaKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const c of k.csatornak) {
    if (latott.has(c.id)) {
      out.push({ severity: "error", id: c.id, message: `Ismétlődő csatorna.` });
    }
    latott.add(c.id);
    const b = bizalom(c);
    // A HIÁNYZÓ KÉPESSÉG PÓTLÁS NÉLKÜL BUILD-HIBA, ha a csatorna MŰKÖDIK.
    // Egy tervezett csatornánál még nem kell tudni, hogyan pótoljuk; egy
    // működőnél igen — különben az adat pótlás nélkül jön be.
    if (c.allapot === "mukodik" && b.szint === "hianyos") {
      out.push({ severity: "error", id: c.id,
        message:
          `A(z) „${c.megnevezes}” csatorna MŰKÖDIK, de ${b.hianyzo.length} ` +
          `képessége hiányzik (${b.hianyzo.join(", ")}), és nincs megnevezve, ` +
          `mivel pótoljuk. Egy betegazonosító nélkül beérkező mérés némán a ` +
          `rossz laphoz kerülhet — a hiányt nem elhallgatni kell, hanem ` +
          `eljárással pótolni.` });
    }
    if (b.szint === "potlassal" && !c.potlas.every((x) => x.trim())) {
      out.push({ severity: "error", id: c.id, message: `Üres pótlási tétel.` });
    }
    if (!c.leiras?.trim()) {
      out.push({ severity: "warning", id: c.id, message: `Nincs leírás.` });
    }
  }
  return out;
}
