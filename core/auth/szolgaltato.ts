/**
 * HITELESÍTÉSI SZOLGÁLTATÓK — a helyi jelszó, és ami utána jön.
 *
 * A HELYI JELSZÓ NEM CÉL, HANEM ÁTMENET. Éles kórházi üzemben a hitelesítés
 * az intézményi címtárból, az EESZT-ből vagy az eduID-ből jön; a helyi jelszó
 * ott legfeljebb a rendszergazdai tartalék. Ezt a modul kimondja, és a
 * szolgáltatókat ADATKÉNT tartja — nem azért, hogy „majd lesz”, hanem hogy
 * MOST LÁTSZÓDJON, mi hiányzik hozzájuk.
 *
 * AMIT EGY NEM KÉSZ SZOLGÁLTATÓ NEM TEHET: NEM ESIK VISSZA.
 *
 * A leggyakoribb hitelesítési hiba nem a rossz jelszó, hanem a CSENDES
 * VISSZAESÉS: ha az SSO nem érhető el, essünk vissza helyi jelszóra. Ez
 * pontosan az a támadási felület, amiért az SSO-t bevezették — a támadónak
 * elég elérhetetlenné tennie a szolgáltatót. Ezért:
 *
 *   > Az elérhetetlen szolgáltató NEM ok a gyengébb hitelesítésre.
 *   > A felhasználó, akit külső szolgáltató hitelesít, helyi jelszóval SOHA
 *   > nem lép be — akkor sem, ha a szolgáltató épp nem válaszol.
 *
 * A `belep()` a `felhasznalo.ts`-ben ezt már betartja: `szolgaltato !== "helyi"`
 * esetén az árnyék-ellenőrzés lefut, a belépés viszont nem.
 *
 * A KÉSZÜLTSÉG ÁLLAPOT, NEM ÍGÉRET. Minden szolgáltatónál ott áll, mi hiányzik
 * hozzá — szerződés, tanúsítvány, regisztráció —, és ezek nem fejlesztői
 * feladatok. A rendszer ezért nem tudja őket „megcsinálni”; megnevezni tudja.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

export type SzolgaltatoAllapot =
  /** Működik, most is használható. */
  | "mukodik"
  /** A kód kész, de egy SZERVEZETI feltétel hiányzik (szerződés, tanúsítvány). */
  | "feltetelreVar"
  /** Meg van tervezve, kód nincs. */
  | "tervezett";

export interface Szolgaltato {
  id: "helyi" | "eeszt" | "eduid" | "intezmenyi";
  nev: string;
  protokoll: string;
  allapot: SzolgaltatoAllapot;
  /** Mi hiányzik hozzá. ÜRES LISTA csak a működőnél lehet. */
  hianyzik: string[];
  /** Ki tudja elintézni. „A fejlesztés” nem válasz, ha nem fejlesztői feladat. */
  kinel: string;
  /** Ad-e második tényezőt. A helyi jelszó nem. */
  ketTenyezos: boolean;
  leiras: string;
}

export interface SzolgaltatoKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  szolgaltatok: Szolgaltato[];
}

export function loadSzolgaltatok(path: string): SzolgaltatoKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as SzolgaltatoKeszlet;
}

export function hasznalhato(k: SzolgaltatoKeszlet, id: string): boolean {
  return k.szolgaltatok.find((s) => s.id === id)?.allapot === "mukodik";
}

export interface SzolgaltatoMerleg {
  osszes: number;
  mukodik: number;
  feltetelreVar: number;
  tervezett: number;
  ketTenyezos: number;
}

export function merleg(k: SzolgaltatoKeszlet): SzolgaltatoMerleg {
  const a = (x: SzolgaltatoAllapot) => k.szolgaltatok.filter((s) => s.allapot === x).length;
  return {
    osszes: k.szolgaltatok.length,
    mukodik: a("mukodik"), feltetelreVar: a("feltetelreVar"), tervezett: a("tervezett"),
    ketTenyezos: k.szolgaltatok.filter((s) => s.ketTenyezos && s.allapot === "mukodik").length,
  };
}

export function validateSzolgaltatok(k: SzolgaltatoKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const s of k.szolgaltatok) {
    if (latott.has(s.id)) {
      out.push({ severity: "error", id: s.id, message: `Ismétlődő szolgáltató.` });
    }
    latott.add(s.id);
    if (s.allapot === "mukodik" && s.hianyzik.length) {
      out.push({ severity: "error", id: s.id,
        message:
          `A(z) „${s.nev}” szolgáltató „működik” állapotban van, de ${s.hianyzik.length} ` +
          `feltétele hiányzik (${s.hianyzik.join("; ")}). A „működik” állítás — ` +
          `hiányzó feltétellel hamis állítás.` });
    }
    if (s.allapot !== "mukodik" && !s.hianyzik.length) {
      out.push({ severity: "error", id: s.id,
        message:
          `A(z) „${s.nev}” nem működik, de nincs megnevezve, MI hiányzik hozzá. ` +
          `Egy „majd lesz” állapot, aminek nincs feltétellistája, sosem készül el: ` +
          `senki nem tudja, mikor van kész.` });
    }
    if (s.allapot !== "mukodik" && !s.kinel?.trim()) {
      out.push({ severity: "warning", id: s.id,
        message: `Nincs megnevezve, kinél áll a(z) „${s.nev}” feltétele.` });
    }
  }
  if (!k.szolgaltatok.some((s) => s.allapot === "mukodik")) {
    out.push({ severity: "error", id: "szolgaltatok",
      message: `Egyetlen működő hitelesítési szolgáltató sincs — a rendszerbe senki nem tud belépni.` });
  }
  // A KÉT TÉNYEZŐ HIÁNYA NEM HIBA, HANEM KIMONDANDÓ ÁLLAPOT.
  if (!k.szolgaltatok.some((s) => s.ketTenyezos && s.allapot === "mukodik")) {
    out.push({ severity: "warning", id: "szolgaltatok",
      message:
        `Egyetlen MŰKÖDŐ szolgáltató sem ad második tényezőt. Betegadathoz ez ` +
        `nem elég: a jelszó egyedül kiszivárogtatható, és a kiszivárgásról a ` +
        `felhasználó nem szerez tudomást. A második tényező nem fejlesztői ` +
        `feladat — eszköz és eljárás kell hozzá.` });
  }
  return out;
}
