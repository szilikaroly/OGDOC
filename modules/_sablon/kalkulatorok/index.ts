/**
 * A modul saját kalkulátorai.
 *
 * A `registerCalc` ugyanazokat a szabályokat kényszeríti ki, mint a magban:
 * elsődleges forrás kötelező, és `verified: false` mellett a kalkulátor teljes
 * bemenettel sem ad eredményt.
 *
 * Ezt a fájlt egyszer kell importálni a modul betöltésekor.
 */
import { registerCalc } from "../../../core/calc/defs.ts";

registerCalc({
  id: "calc.modul.pelda",
  label: { hu: "Példa kalkulátor" },
  kind: "formula",
  module: "modul",
  inputs: [
    { id: "modul.pelda.mennyiseg", unit: "mm[Hg]", required: true },
  ],
  output: {
    unit: "mm[Hg]",
    digits: 0,
    bands: [
      { max: 90, label: { hu: "alacsony" }, severity: "watch" },
      { min: 90, max: 140, label: { hu: "normális" }, severity: "normal" },
      { min: 140, label: { hu: "magas" }, severity: "redflag" },
    ],
  },
  formula: "eredmény = bemenet   (EMBERI OLVASATÚ képlet, ez kerül a doksiba)",
  source: { cite: "KÖTELEZŐ: az elsődleges közlemény vagy szabvány", pmid: null },

  // `true` CSAK akkor, ha valaki ténylegesen összevetette a konstansokat a forrással.
  verified: false,
  verifiedNote:
    "KÖTELEZŐ, amíg verified: false — miért nincs még ellenőrizve, és mi a kockázata, " +
    "ha rossz. Enélkül a registerCalc elutasítja a regisztrációt.",

  caveats: { hu: "Amit a felhasználónak tudnia kell az eredmény értelmezéséhez." },

  fn: (x) => x,
});
