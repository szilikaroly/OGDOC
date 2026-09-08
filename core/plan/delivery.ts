/**
 * SZÜLÉSMÓD-TERVEZÉS — a modul legérzékenyebb része.
 *
 * A rendszer NEM DÖNT. Nem azért, mert óvatos, hanem mert nincs mit
 * eldöntenie: a hüvelyi szülés kísérlete és az elektív ismételt császármetszés
 * között nem szakmai fölény van, hanem KOCKÁZATCSERE. A méhrepedés ritka és
 * katasztrofális; a császármetszés gyakoribb szövődményekkel jár és a
 * következő terhességet is terheli. Hogy melyik kockázat elviselhetőbb, az
 * ÉRTÉKÍTÉLET, és az a betegé.
 *
 * Amit a rendszer megtehet, három dolog:
 *
 *   · összeszedi, mi szól melyik irány mellett — SZÁM NÉLKÜL, mert a
 *     Grobman-együtthatók nincsenek meg (ld. `core/scores/vbac.ts`);
 *   · megmondja, ha az egyik út ELLENJAVALLT — ez tény, nem preferencia;
 *   · nem engedi lezárni a tervet a beszélgetés dokumentálása nélkül.
 *
 * A harmadik ugyanaz a kapu, mint a terhesség alatti daganatnál (12. modul),
 * és ugyanazért kettős: a pipa és a MEGBESZÉLT LEHETŐSÉGEK is kellenek.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import { assessVbac, type VbacAssessment } from "../scores/vbac.ts";

export type Offerability = "offerable" | "conditional" | "contraindicated" | "unknown";

export interface DeliveryOption {
  mode: "tolac" | "electiveCs";
  label: string;
  offerability: Offerability;
  why: string;
}

export interface DeliveryPlan {
  /** Van-e egyáltalán korábbi császármetszés — enélkül a kérdés nem merül fel. */
  priorCs: number | null;
  relevant: boolean;
  options: DeliveryOption[];
  vbac: VbacAssessment;
  preference: { recorded: boolean; value: string | null };
  decision: {
    documented: boolean;
    canRecord: boolean;
    missing: string[];
    reason: string;
  };
  /** MINDIG null. Nem hiba, hanem a modul állítása. */
  recommendation: null;
  caveat: string;
}

export function deliveryPlan(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): DeliveryPlan {
  const cs = resolve(reg, state, "hx.repro.prevBirth.cs");
  const priorCs = cs.state === "ok" && typeof cs.value === "number" ? cs.value : null;
  const vbac = assessVbac(reg, state, lang);

  const inst = resolve(reg, state, "plan.institution.tolacCapable");
  const instOk = inst.state === "ok" ? inst.value === "pos" : null;

  const options: DeliveryOption[] = [];
  if (vbac.contraindicated.yes) {
    options.push({
      mode: "tolac", label: "Hüvelyi szülés kísérlete (TOLAC)",
      offerability: "contraindicated", why: vbac.contraindicated.why!,
    });
  } else if (instOk === true) {
    options.push({
      mode: "tolac", label: "Hüvelyi szülés kísérlete (TOLAC)",
      offerability: "conditional",
      why:
        "Felajánlható: az intézményi feltételek (24 órás aneszteziológiai " +
        "háttér, azonnali császármetszés lehetősége) adottak. A siker esélye " +
        "a felsorolt tényezőkből mérlegelendő, SZÁMSZERŰ becslés nélkül.",
    });
  } else if (instOk === false) {
    options.push({
      mode: "tolac", label: "Hüvelyi szülés kísérlete (TOLAC)",
      offerability: "contraindicated",
      why:
        "AZ INTÉZMÉNYBEN NEM AJÁNLHATÓ FEL: a 24 órás aneszteziológiai háttér " +
        "vagy az azonnali császármetszés lehetősége hiányzik. A méhrepedés " +
        "ritka, de perceken múlik — a feltételek hiánya nem a beteg " +
        "kockázatvállalásának kérdése. Ha a beteg a kísérletet választja, az " +
        "megfelelő intézménybe irányítást jelent, nem itteni vállalást.",
    });
  } else {
    options.push({
      mode: "tolac", label: "Hüvelyi szülés kísérlete (TOLAC)",
      offerability: "unknown",
      why:
        "Nem ismert, hogy az intézményi feltételek adottak-e " +
        "(`plan.institution.tolacCapable`). A „NEM TUDJUK” NEM jelenti azt, " +
        "hogy adottak: a TOLAC felajánlása feltételek nélkül nem javallat, " +
        "hanem a kockázat áthárítása a betegre.",
    });
  }

  options.push({
    mode: "electiveCs", label: "Elektív ismételt császármetszés",
    offerability: "offerable",
    why:
      "Mindig felajánlható út. Kisebb a méhrepedés kockázata, de nagyobb a " +
      "műtéti szövődményeké, hosszabb a felépülés, és a KÖVETKEZŐ terhességet " +
      "is terheli (placentatapadási rendellenességek kockázata a hegek " +
      "számával nő). Ez kockázatcsere, nem biztonságosabb választás.",
  });

  const pref = resolve(reg, state, "plan.delivery.patientPreference");
  const sd = resolve(reg, state, "plan.delivery.sharedDecision");
  const opts = resolve(reg, state, "plan.delivery.optionsDiscussed");
  const documented = sd.state === "ok" && sd.value === true;
  const hasOptions = opts.state === "ok" && String(opts.value).trim().length > 0;
  const hasPref = pref.state === "ok";

  const missing: string[] = [];
  if (!documented) missing.push("plan.delivery.sharedDecision");
  if (!hasOptions) missing.push("plan.delivery.optionsDiscussed");
  if (!hasPref) missing.push("plan.delivery.patientPreference");

  const relevant = priorCs == null || priorCs > 0;

  return {
    priorCs, relevant, options, vbac,
    preference: { recorded: hasPref, value: hasPref ? String(pref.value) : null },
    decision: {
      documented, canRecord: missing.length === 0, missing,
      reason: missing.length === 0
        ? "A megosztott döntéshozatal dokumentálva: a beszélgetés ténye, a " +
          "megbeszélt lehetőségek és a beteg preferenciája együtt."
        : "A SZÜLÉSMÓD-TERV NEM RÖGZÍTHETŐ lezártként. Hiányzik: " +
          missing.join(", ") + ". A pipa önmagában kipipálható anélkül, hogy " +
          "bármi történt volna; az egyetlen felkínált út melletti beleegyezés " +
          "pedig nem döntés. A beteg preferenciája külön mező, mert ha a " +
          "javaslattal megegyezik, az adat — ha eltér, az a legfontosabb adat " +
          "az egész tervben.",
    },
    recommendation: null,
    caveat:
      "A rendszer SZÁNDÉKOSAN nem ad javaslatot a szülésmódra. A két út között " +
      "nem szakmai fölény van, hanem kockázatcsere, és hogy melyik kockázat " +
      "elviselhetőbb, az értékítélet — a betegé. " +
      (priorCs === 0
        ? "Korábbi császármetszés nincs rögzítve, ezért a TOLAC kérdése nem merül fel."
        : priorCs == null
        ? "A korábbi császármetszések száma nem ismert, ezért a mérlegelés ELŐZETES."
        : `Korábbi császármetszés: ${priorCs}. `) +
      "A tényleges szülésmód ettől eltérhet; a dokumentált szándék attól még " +
      "számít, mert ehhez képest értelmezhető minden eltérés.",
  };
}
