/**
 * SNOMED-AZONOSÍTÓ ELLENŐRZÉSE — tábla nélkül, a szám szerkezetéből.
 *
 * A SNOMED CT azonosító nem szabad szám: VERHOEFF-ELLENŐRZŐJEGYE van, és a
 * végén hordozza, hogy fogalom, leírás vagy kapcsolat azonosítója-e. Ez azt
 * jelenti, hogy egy elgépelt vagy kitalált azonosító a KÉSZLET ISMERETE
 * NÉLKÜL is kibukik.
 *
 * Miért számít ez itt. A rendszernek volt már egy közeli hibája: az
 * emlékezetből beírt 41633001 azonosítóról kiderült, hogy nem a HELLP, hanem
 * az `Intraocular pressure`. Az ilyen tévedést a szerkezeti ellenőrzés NEM
 * fogja meg — a 41633001 érvényes azonosító, csak másé. Ezért a két
 * ellenőrzés KÜLÖNBÖZŐ dolgot állít, és mindkettőre szükség van:
 *
 *   · a szerkezeti (ez a fájl): „ez a szám lehet SNOMED-azonosító”;
 *   · a készletbeli (`snomed.ts`): „ez az azonosító EZT a fogalmat jelöli”.
 *
 * Az elsőhöz nem kell licenc és nem kell hálózat; a másodikhoz a betöltött
 * kiadás kell. A `snomedVerified` mező azért marad kötelező, mert a
 * szerkezeti helyesség nem jelentés.
 *
 * A Verhoeff-táblák a SNOMED International hivatkozási megvalósításából
 * valók (IHTSDO/snomed-database-loader, PostgreSQL/Verhoeff.sql).
 */

/** Verhoeff diéder-csoport szorzótábla. */
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
/** Verhoeff permutációtábla. */
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/** A Verhoeff-összeg 0, ha az ellenőrzőjegy stimmel. */
function verhoeffOk(digits: string): boolean {
  let c = 0;
  const rev = [...digits].reverse();
  for (let i = 0; i < rev.length; i++) {
    c = D[c][P[i % 8][Number(rev[i])]];
  }
  return c === 0;
}

export type SctIdKind = "concept" | "description" | "relationship";

export interface SctIdCheck {
  id: string;
  valid: boolean;
  /** Mit azonosít — fogalmat, leírást vagy kapcsolatot. */
  kind: SctIdKind | null;
  /** `international` = alapkiadás · `extension` = névtérrel kiadott bővítmény. */
  origin: "international" | "extension" | null;
  /** Bővítménynél a kiadó névtere (7 jegy). */
  namespace: string | null;
  why: string;
}

/**
 * Egy SNOMED-azonosító SZERKEZETI ellenőrzése.
 *
 * Amit ELDÖNT: a hossz, a vezető nulla hiánya, a partíciós jegyek és a
 * Verhoeff-ellenőrzőjegy. Amit NEM DÖNT EL: hogy létezik-e, és hogy MIT
 * jelöl. Erre a betöltött kiadás való.
 */
export function checkSctId(raw: unknown): SctIdCheck {
  const id = String(raw ?? "").trim();
  const bad = (why: string): SctIdCheck =>
    ({ id, valid: false, kind: null, origin: null, namespace: null, why });

  if (!/^[0-9]+$/.test(id)) return bad("A SNOMED-azonosító csak számjegyekből áll.");
  if (id.length < 6 || id.length > 18) {
    return bad(
      `A SNOMED-azonosító 6–18 jegyű; ez ${id.length} jegyű. Ez rendszerint ` +
      `elgépelés vagy más kódrendszer azonosítója.`);
  }
  if (id[0] === "0") return bad("A SNOMED-azonosító nem kezdődhet nullával.");

  const partition = id.slice(-3, -1);
  const KIND: Record<string, SctIdKind> = {
    "00": "concept", "10": "concept",
    "01": "description", "11": "description",
    "02": "relationship", "12": "relationship",
  };
  const kind = KIND[partition];
  if (!kind) {
    return bad(
      `A(z) „${partition}” partíciós jegypár nem érvényes: a SNOMED-azonosító ` +
      `utolsó előtti két jegye mondja meg, hogy fogalmat (00/10), leírást ` +
      `(01/11) vagy kapcsolatot (02/12) azonosít.`);
  }
  const extension = partition[0] === "1";
  if (!verhoeffOk(id)) {
    return bad(
      `A(z) ${id} Verhoeff-ellenőrzőjegye nem stimmel: ez a szám nem lehet ` +
      `SNOMED-azonosító. Egy elgépelt vagy emlékezetből beírt azonosító ` +
      `jellemzően itt bukik ki.`);
  }
  const namespace = extension ? id.slice(-10, -3) : null;
  return {
    id, valid: true, kind,
    origin: extension ? "extension" : "international",
    namespace,
    why:
      `A(z) ${id} szerkezetileg érvényes SNOMED-${
        kind === "concept" ? "fogalomazonosító" :
        kind === "description" ? "leírásazonosító" : "kapcsolatazonosító"}` +
      (extension ? ` a(z) ${namespace} névtérből` : " az alapkiadásból") +
      `. Ez NEM jelenti, hogy létezik, és azt sem, hogy mit jelöl — csak azt, ` +
      `hogy a szám alakja helyes.`,
  };
}
