/**
 * MODULTÉRKÉP — melyik modulhoz milyen kód, teszt és dokumentum tartozik.
 *
 * A TÉRKÉP AZÉRT ADAT, MERT ELLENŐRIZHETŐ.
 *
 * Egy kézzel karbantartott „mi tartozik hova” lista fél éven belül elavul: a
 * kód átkerül, a fájl megszűnik, és a lista tovább mutat rá. Az ilyen lista
 * rosszabb a semminél, mert úgy néz ki, mintha igaz volna — és a bemutató, a
 * dokumentáció meg az onboarding mind belőle dolgozik.
 *
 * Ezért minden útvonalat MEGNÉZÜNK, és a nem létező HIBA. Nem figyelmeztetés:
 * egy hibás térkép nem „pontatlan”, hanem félrevezető.
 *
 * ÉS AMI TÖBB MODULHOZ TARTOZIK, AZ TÖBB HELYEN SZEREPEL. Ez nem duplikátum,
 * hanem tény: a `core/auth` a 19. (CRM, HR) és a 36. (hitelesítés) modulnak is
 * a része, és a kettő nem ugyanaz a nézőpont. A validálás ezért nem tiltja az
 * ismétlődést — csak a hiányzó útvonalat és a hiányzó modult.
 */
import { existsSync, readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

export interface TerkepSor {
  n: number;
  kod: string[];
  teszt: string[];
  doksi: string | null;
}

export interface Terkep {
  megnevezes: string;
  note: string;
  modulok: TerkepSor[];
}

export function loadTerkep(path: string): Terkep {
  return JSON.parse(readFileSync(path, "utf8")) as Terkep;
}

export interface TerkepMerleg {
  modul: number;
  doksiNelkul: number;
  kodNelkul: number;
  tesztNelkul: number;
}

export function merleg(t: Terkep): TerkepMerleg {
  return {
    modul: t.modulok.length,
    doksiNelkul: t.modulok.filter((m) => !m.doksi).length,
    kodNelkul: t.modulok.filter((m) => !m.kod.length).length,
    tesztNelkul: t.modulok.filter((m) => !m.teszt.length).length,
  };
}

export function validateTerkep(t: Terkep, gyoker: string): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<number>();
  const van = (p: string) => existsSync(`${gyoker}/${p}`);

  for (const m of t.modulok) {
    if (latott.has(m.n)) {
      out.push({ severity: "error", id: `modul.${m.n}`,
        message: `Ismétlődő modulszám a térképen.` });
    }
    latott.add(m.n);
    for (const p of [...m.kod, ...m.teszt, ...(m.doksi ? [m.doksi] : [])]) {
      if (!van(p)) {
        out.push({ severity: "error", id: `modul.${m.n}`,
          message:
            `A térkép nem létező útvonalra mutat: „${p}”. Egy hibás térkép nem ` +
            `„pontatlan”, hanem FÉLREVEZETŐ: a bemutató, a dokumentáció és az ` +
            `onboarding mind belőle dolgozik, és mind azt fogja mondani, hogy a ` +
            `fájl ott van.` });
      }
    }
    if (!m.doksi) {
      out.push({ severity: "warning", id: `modul.${m.n}`,
        message:
          `A(z) ${m.n}. modulnak nincs dokumentuma. Egy modul, aminek nincs ` +
          `leírása, nem „üres”, hanem HIÁNYZÓ — és a különbség fél év múlva nem ` +
          `lesz kikövetkeztethető.` });
    }
    if (!m.kod.length) {
      out.push({ severity: "warning", id: `modul.${m.n}`,
        message: `A(z) ${m.n}. modulhoz nincs kód rendelve a térképen.` });
    }
    if (!m.teszt.length) {
      out.push({ severity: "warning", id: `modul.${m.n}`,
        message:
          `A(z) ${m.n}. modulhoz nincs teszt rendelve. Egy modul, amiről nem ` +
          `bizonyítja semmi, hogy a szabályai működnek, csak terv.` });
    }
  }
  // A SORSZÁMOZÁSNAK HÉZAGMENTESNEK KELL LENNIE. Egy kihagyott szám fél év
  // múlva megválaszolhatatlan kérdés: volt ott modul, vagy sosem volt?
  const szamok = [...latott].sort((a, b) => a - b);
  for (let i = 0; i < szamok.length - 1; i++) {
    if (szamok[i + 1] !== szamok[i] + 1) {
      out.push({ severity: "error", id: "terkep",
        message:
          `Hézag a modulszámozásban: ${szamok[i]} után ${szamok[i + 1]} jön. Egy ` +
          `kihagyott szám fél év múlva megválaszolhatatlan kérdés: volt ott modul, ` +
          `vagy sosem volt? Ha szándékos, a hiányzó számnak is kell egy sor.` });
    }
  }
  return out;
}
