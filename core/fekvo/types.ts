/**
 * FEKVŐBETEG-JELENTÉS — típusok.
 *
 * Ez a réteg NEM SOROL BE. A HBCS besorolási táblázat (10/2012. NEFMI 2.
 * melléklet) nincs gépi alakban, ezért a rendszer csoportot nem állapít meg,
 * és soha nem is fog, amíg a táblázat hiányzik. Amit ELLENŐRIZ: hogy a
 * jelentés KITÖLTHETŐ-E — megvan-e minden, amit a jogszabály kötelezően
 * előír, és belefér-e a rekordképbe.
 *
 * A különbség lényeges. Egy hiányzó „V” típusú Z-kód miatt a jelentés
 * visszapattan; ezt a rendszer ELŐRE megmondja. Azt, hogy az eset melyik
 * csoportba esik, nem mondja meg — mert nem tudja.
 */

/** Egy jelentett diagnózis: típusjel + kód (+ oldaliság). */
export interface ReportedDiagnosis {
  /** A 10/2012. NEFMI 6-7. § szerinti típusjel: 0 1 2 3 4 5 C D V E M K F. */
  type: string;
  /** JELENTÉSI alakú, 5 karakteres BNO- vagy FNO-kód. */
  code: string;
  side?: string;
}

/** Egy jelentett beavatkozás. */
export interface ReportedProcedure {
  /** Ötkarakteres kód a fekvőbeteg beavatkozási törzsből. */
  code: string;
  /** Az elvégzés napja `YYYY-MM-DD`. */
  on?: string | null;
  count?: number;
}

/** Az az adathalmaz, amiből a jelentési rekord kitöltődne. */
export interface InpatientCase {
  diagnoses: ReportedDiagnosis[];
  procedures: ReportedProcedure[];
  /** Beutalóval érkezett-e — ez teszi kötelezővé a „0” típusjelet. */
  referred?: boolean | null;
  /** Áthelyezés történt-e — ez teszi kötelezővé a „2” típusjelet. */
  transferred?: boolean | null;
  admittedOn?: string | null;
  dischargedOn?: string | null;
  sex?: "female" | "male" | null;
  age?: number | null;
  /**
   * Hány napot feküdt a beteg KÖZVETLENÜL a szülés előtt. A 11. melléklet
   * 4.2. pontja szerint a patológiás terhesség csak 12 napon túli
   * bennfekvésnél vehető figyelembe patológiás terhességi diagnózisként.
   */
  preDeliveryDays?: number | null;
}

export type FindingLevel =
  /** A jelentés így nem adható be — a jogszabály kötelezően előírja. */
  | "blocking"
  /** Beadható, de valószínűleg elmaradt bevétel vagy pontatlan állítás. */
  | "warning"
  /** Hiányzó adat miatt NEM ELDÖNTHETŐ. Ez nem „rendben”. */
  | "undetermined";

export interface Finding {
  level: FindingLevel;
  /** Rövid azonosító, hogy tesztelhető és kereshető legyen. */
  rule: string;
  message: string;
  /** A jogszabályhely, ami előírja. */
  cite: string;
}
