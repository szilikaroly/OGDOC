/**
 * A MODULOK SAJÁT HIÁNYAI — EGY HELYEN.
 *
 * A hiányjegyzék gyűjt, nem ír újra: a modulok `hianyzik` listái innen
 * kerülnek be, és ha egy modul javul, a jegyzék magától rövidül.
 *
 * EZ A FÁJL EGY VALÓDI SZÉTCSÚSZÁSRA VÁLASZ. A gyűjtés eddig KÉT helyen volt
 * leírva — a `tools/validate.ts`-ben és a `tools/gen-artifact.ts`-ben —,
 * ugyanazzal a szándékkal, külön másolatban. Ahogy új gyűjtők kerültek a
 * validátorba (soros profilok, DICOM-oldalkocsi, belgyógyászati aláírások), a
 * bemutató másolata ott maradt háromnál: a rendszer 73 tételt mondott, az
 * artifact 51-et. Mindkettő „a forrásból generált” volt — csak nem ugyanabból.
 *
 * Ez a rendszer visszatérő hibacsaládja a legkellemetlenebb alakjában: nem
 * egy szám volt rossz, hanem KÉT igaz szám mondott mást ugyanarról.
 */
import { loadIsber } from "../biobank/minta.ts";
import { loadSzolgaltatok } from "../auth/szolgaltato.ts";
import { loadCsatornak } from "../interop/csatorna.ts";
import { loadProfilok } from "../interop/soros.ts";
import { loadDicom } from "../interop/dicom.ts";
import { loadMwho, loadJelek } from "../belgyogyaszat/kardio.ts";
import { loadPalliativ } from "../belgyogyaszat/palliativ.ts";
import type { ModulHiany } from "./jegyzek.ts";

/** `ut`: a repógyökérhez képesti útvonalat teljes útvonallá alakítja. */
export function modulHianyok(ut: (p: string) => string): ModulHiany[] {
  const isber = loadIsber(ut("registry/biobank/isber.json"));
  const szolgaltatok = loadSzolgaltatok(ut("registry/auth/szolgaltatok.json"));
  const csatornak = loadCsatornak(ut("registry/interop/csatornak.json"));
  const soros = loadProfilok(ut("registry/interop/soros-profilok.json"));
  const dicom = loadDicom(ut("registry/interop/dicom.json"));
  const mwho = loadMwho(ut("registry/belgyogyaszat/mwho.json"));
  const jelek = loadJelek(ut("registry/belgyogyaszat/kardio-jelek.json"));
  const palliativ = loadPalliativ(ut("registry/belgyogyaszat/palliativ.json"));

  return [
    ...isber.tetelek.filter((t) => t.hianyzik.length).map((t) => ({
      forras: "registry/biobank/isber.json", modul: 22, id: t.id, cim: t.cim,
      hianyzik: t.hianyzik, kinel: "biobank-vezető", fajta: "dokumentum" as const,
    })),
    ...szolgaltatok.szolgaltatok.filter((x) => x.hianyzik.length).map((x) => ({
      forras: "registry/auth/szolgaltatok.json", modul: 19, id: x.id, cim: x.nev,
      hianyzik: x.hianyzik, kinel: x.kinel, fajta: "licenc" as const,
    })),
    ...csatornak.csatornak.filter((c) => c.allapot !== "mukodik").map((c) => ({
      forras: "registry/interop/csatornak.json", modul: 8, id: c.id, cim: c.megnevezes,
      hianyzik: c.allapot === "feltetelreVar"
        ? ["intézményi integrációs megállapodás és tesztkörnyezet"]
        : ["a csatorna implementációja"],
      kinel: "intézményi informatika", fajta: "eszkoz" as const,
    })),
    // A soros profilok hiányai a PROFILOKBÓL gyűlnek, nem kézzel írt listából.
    ...soros.profilok.filter((p) => (p.hianyzik ?? []).length).map((p) => ({
      forras: "registry/interop/soros-profilok.json", modul: 8, id: p.id,
      cim: `Soros eszközprofil — ${p.megnevezes}`,
      hianyzik: p.hianyzik ?? [],
      kinel: p.fajta === "kornyezet" ? "biobank-vezető" : "klinikai vezető",
      fajta: "eszkoz" as const,
    })),
    ...(dicom.oldalkocsi.hianyzik.length
      ? [{
        forras: "registry/interop/dicom.json", modul: 8, id: "dicom.oldalkocsi",
        cim: `DICOM-oldalkocsi (${dicom.oldalkocsi.csomag}, ${dicom.oldalkocsi.licenc})`,
        hianyzik: dicom.oldalkocsi.hianyzik,
        kinel: "intézményi informatika", fajta: "eszkoz" as const,
      }]
      : []),
    // A BELGYÓGYÁSZATI TÁBLÁK ALÁÍRÁSAI — szervezeti tételek, nem fejlesztőiek.
    ...(mwho.alairas === null
      ? [{
        forras: "registry/belgyogyaszat/mwho.json", modul: 33, id: "mwho.alairas",
        cim: "Anyai kardiovaszkuláris kockázat (mWHO) — a tábla aláírása",
        hianyzik: [
          `Kardiológus tételes összevetése az ESC 2018 terhességi irányelv hivatalos ` +
          `szövegpéldányával: a ${mwho.allapotok.length} állapot besorolása és a ` +
          `kellAdat listák.`,
          `Annak eldöntése, hogy a gondozási szintek (helyi / megyei / terhesszív-csapat) ` +
          `mit jelentenek ebben az intézményi hálózatban.`,
        ],
        kinel: "kardiológus szakorvos", fajta: "dokumentum" as const,
      }]
      : []),
    ...(jelek.alairas === null
      ? [{
        forras: "registry/belgyogyaszat/kardio-jelek.json", modul: 33,
        id: "kardio.jelek.alairas",
        cim: "Kardiológiai jelek terhességben — a tábla aláírása",
        hianyzik: [
          `A terhességi NT-proBNP küszöb helyi laborvalidálása. A tábla szándékosan ` +
          `nem ad küszöböt.`,
          `Laborszakorvosi és kardiológusi jóváhagyás arról, hogy a ${jelek.jelek.length} ` +
          `jelnél mely kontextusban melyik küszöb marad érvényben.`,
        ],
        kinel: "laborszakorvos és kardiológus", fajta: "dokumentum" as const,
      }]
      : []),
    ...(palliativ.alairas === null
      ? [{
        forras: "registry/belgyogyaszat/palliativ.json", modul: 33, id: "palliativ.alairas",
        cim: "Palliatív ellátás és hospice — a tábla aláírása",
        hianyzik: [
          `Palliatív szakorvosi jóváhagyás a ${palliativ.ellatasiCelok.length} ellátási ` +
          `célról és a ${palliativ.tunetkorok.length} tünetkörről.`,
          `Szülész-nőgyógyász jóváhagyás a perinatális palliatív út elemeiről ` +
          `(szülésterv, búcsú, boncolás).`,
          `JOGÁSZI ellenőrzés a ${palliativ.jogiFeltetelek.length} jogi feltétel ` +
          `§-szintű hivatkozásáról. A rendszer ezeket nem alkalmazza, csak jelzi — de a ` +
          `hivatkozásnak akkor is pontosnak kell lennie.`,
          `Az átadási rések küszöbnapjainak megállapítása (onkológia→hospice, ` +
          `szülőszoba→gyászgondozás, gyászgondozás→következő terhesség).`,
        ],
        kinel: "palliatív szakorvos, szülész-nőgyógyász és jogász",
        fajta: "dokumentum" as const,
      }]
      : []),
  ];
}
