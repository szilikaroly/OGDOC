/**
 * HBCS — HOMOGÉN BETEGSÉGCSOPORT: a besorolás, amit nem végzünk el.
 *
 * A magyar finanszírozás alapja a fődiagnózis, a beavatkozások, a kísérő
 * betegségek és az ápolási idő kombinációja. A modul terve azt írta, hogy a
 * rendszer „javaslatot ad, nem végleges besorolást" — és ez igaz, de kevés:
 * egy javaslathoz is a HATÁLYOS szabálykönyv kell.
 *
 * Az a szabálykönyv évente változik, terjedelmes, és NINCS betöltve. Egy
 * közelítő besorolás rosszabb lenne a semminél: a HBCS PÉNZ, és egy hihetőnek
 * látszó, de rossz csoport a finanszírozási elszámolásban derülne ki — vagy
 * nem derülne ki.
 *
 * Ezért ugyanaz a kapu, mint az ellenőrizetlen kalkulátor-konstansnál és a
 * hitelesítetlen normogramnál:
 *
 *   BESOROLÁS NINCS, AMÍG A SZABÁLYKÖNYV NINCS BETÖLTVE ÉS ELLENŐRIZVE.
 *
 * Amit a rendszer megtesz: ÖSSZESZEDI a besoroláshoz szükséges bemeneteket, és
 * megmondja, melyik hiányzik. Ez valódi munka — a besorolás legtöbb hibája
 * abból származik, hogy egy kísérő betegség vagy egy beavatkozás nem került a
 * dokumentumba.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import type { CodeRules } from "./rules.ts";

export interface HbcsInput {
  id: string;
  label: string;
  present: boolean;
  value?: unknown;
  why: string;
}

export interface HbcsResult {
  /** MINDIG `blocked` ebben a kiadásban — ez állítás, nem hiányosság. */
  status: "blocked" | "suggested";
  group: null;
  inputs: HbcsInput[];
  missing: string[];
  reason: string;
  /** A besorolást végző ember dolga; a rendszer csak előkészít. */
  responsibility: string;
}

export interface HbcsOpts {
  /**
   * A hatályos HBCS-szabálykönyv betöltött és ellenőrzött-e.
   *
   * A képességet KÍVÜLRŐL kapja, nem magáról állítja — ugyanaz a szerkezet,
   * mint a zárójelentés hitelesítésénél. Ma egyetlen futtató sem adja meg.
   */
  rulebookVerified?: boolean;
}

export function suggestHbcs(
  reg: Registry, rules: CodeRules, state: CaseState,
  opts: HbcsOpts = {}, lang: Lang = "hu",
): HbcsResult {
  const inputs: HbcsInput[] = [];
  const missing: string[] = [];

  const add = (id: string, label: string, value: unknown, present: boolean, why: string) => {
    inputs.push({ id, label, present, value: present ? value : undefined, why });
    if (!present) missing.push(id);
  };

  // 1. FŐDIAGNÓZIS — a kódoló döntése, nem az ajánlás.
  const dx = resolve(reg, state, "code.dx.primary");
  add("code.dx.primary", "Fődiagnózis (BNO)", dx.value, dx.state === "ok",
    "A besorolás gerince. A rendszer AJÁNL kódot, de a fődiagnózist a kódoló " +
    "választja ki — az ajánlás nem helyettesíti a döntést.");

  // 2. KÍSÉRŐ BETEGSÉGEK — a besorolás leggyakoribb hibaforrása.
  const sec = resolve(reg, state, "code.dx.secondary");
  const hasSec = sec.state === "ok" && Array.isArray(sec.value) && sec.value.length > 0;
  add("code.dx.secondary", "Kísérő betegségek (BNO)", sec.value, hasSec,
    "A besorolás LEGGYAKORIBB hibaforrása: egy nem dokumentált kísérő betegség " +
    "alacsonyabb súlyszámú csoportot eredményez. A rendszer a fennálló " +
    "kódajánlásokat felkínálja, de a felvételük emberi döntés.");

  // 3. BEAVATKOZÁSOK.
  const proc = resolve(reg, state, "code.proc.performed");
  const hasProc = proc.state === "ok" && Array.isArray(proc.value) && proc.value.length > 0;
  add("code.proc.performed", "Elvégzett beavatkozások (OENO)", proc.value, hasProc,
    "A beavatkozás sokszor önmagában más csoportba sorol (pl. császármetszés).");

  // 4. ÁPOLÁSI IDŐ.
  const los = resolve(reg, state, "out.mlos");
  add("out.mlos", "Ápolási idő", los.value, los.state === "ok",
    "A rövid és a hosszú ápolási idő eltérő elszámolás alá eshet.");

  // 5. AZ ELBOCSÁTÁS MÓDJA.
  const dtype = resolve(reg, state, "disch.type");
  add("disch.type", "Az elbocsátás módja", dtype.value, dtype.state === "ok",
    "Az áthelyezés és a saját felelősségre távozás más elszámolást jelenthet.");

  const verified = opts.rulebookVerified === true;
  const suggestedCodes = rules.suggest(reg, state, lang).codes;

  return {
    status: "blocked",
    group: null,
    inputs, missing,
    reason: verified
      ? "A szabálykönyv ellenőrzöttként van jelölve, de a besorolási logika " +
        "ebben a kiadásban nincs megvalósítva — a rendszer ezért továbbra sem " +
        "ad csoportot."
      : "HBCS-BESOROLÁS NEM KÉSZÜL: a hatályos szabálykönyv nincs betöltve és " +
        "ellenőrizve. Egy közelítő besorolás rosszabb lenne a semminél — a " +
        "HBCS pénz, és egy hihetőnek látszó, de rossz csoport a finanszírozási " +
        "elszámolásban derülne ki, vagy nem derülne ki. " +
        (missing.length
          ? `A besoroláshoz szükséges bemenetek közül ${missing.length} hiányzik: ` +
            missing.join(", ") + ". "
          : "A besoroláshoz szükséges bemenetek megvannak. ") +
        (suggestedCodes.length
          ? `A rendszer által ajánlott kódok: ${suggestedCodes.join(", ")}.`
          : "A rendszer jelenleg egyetlen kódot sem ajánl."),
    responsibility:
      "A HBCS-besorolás INTÉZMÉNYI FELELŐSSÉG. A rendszer feladata az " +
      "előkészítés: hogy a besoroláshoz szükséges adat hiánytalanul és " +
      "visszakereshetően ott legyen.",
  };
}
