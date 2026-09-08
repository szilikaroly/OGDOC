/**
 * CORI — hat domén, és a szám, ami NEM valószínűség.
 *
 * A CORI nem publikált, validált modell: a rendszer saját ÖSSZESÍTŐJE hat
 * klinikai domén fölött. Ezt ki kell mondani, mert egy 0–5 skála pontosan úgy
 * néz ki, mint egy validált score — és nem az.
 *
 * Amit viszont MEGTEHET, és amiért mégis van értelme: az összesítés `max`,
 * nem összeg. A maximum nem állít semmit a dómének EGYÜTTES hatásáról; azt
 * mondja, hogy „a legrosszabb domén ezen a szinten van, tehát a betegcsoport
 * ellátása erre a szintre emelkedik". Ez ESZKALÁCIÓS SZABÁLY, nem statisztikai
 * modell — és ezért nem esik a „külön OR-ok szorzása" csapdájába, ami a
 * postpartum pszichózis kockázatánál a kombinált számot megtiltotta.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A LEGVESZÉLYESEBB PONT: a skála 0. szintje „nincs adat".
 *
 * Ha egy domén adathiány miatt 0, a `max` változatlan marad — vagyis öt üres
 * domén mellett a CORI simán mutathat 1-et, zölden. Ez pontosan az a csendes
 * helyettesítés, amit a rendszer mindenhol máshol tilt.
 *
 * Ezért a kimenet KÉT számot hordoz: az összesített szintet ÉS azt, hány
 * domén nem mért. Ha egyetlen domén sem mért, nincs eredmény. Ha van mért és
 * van hiányzó, az eredmény melletti figyelmeztetés nem elhagyható.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { runCalc } from "../calc/run.ts";
import { resolve } from "../derive/resolve.ts";
import { fullPiers } from "./fullpiers.ts";
import { nichd } from "./nichd.ts";

export type CoriLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface CoriDomain {
  id: string;
  label: string;
  /** `null`, ha nincs adat — NEM 0. */
  level: CoriLevel | null;
  why: string;
  /** Mi hiányzik, ha nincs szint. */
  missing: string[];
}

export interface CoriOk {
  status: "ok";
  overall: CoriLevel;
  label: string;
  action: string;
  domains: CoriDomain[];
  /** Hány domén nem mért. Ha > 0, az eredmény MELLETT jelenik meg, nem helyette. */
  unmeasured: number;
  /** Enélkül a szám félrevezet. */
  caveat: string;
}
export interface CoriBlocked {
  status: "insufficient";
  domains: CoriDomain[];
  reason: string;
}
export type CoriResult = CoriOk | CoriBlocked;

const LEVELS: Record<CoriLevel, { label: string; action: string }> = {
  0: { label: "nincs adat", action: "Adatfelvétel szükséges." },
  1: { label: "alapszint", action: "Szokásos ellátás." },
  2: { label: "megfigyelés", action: "Sűrűbb ellenőrzés, dokumentált újraértékelés." },
  3: {
    label: "óvatosság",
    action: "SENIOR ORVOS TÁJÉKOZTATÁSA, célzott kivizsgálás, a terv írásba foglalása.",
  },
  4: {
    label: "sürgős",
    action: "Protokoll szerinti beavatkozás azonnal, a csapat riasztásával.",
  },
  5: {
    label: "kritikus",
    action: "AZONNALI multidiszciplináris ellátás; a szülés befejezésének mérlegelése.",
  },
};

export function cori(reg: Registry, state: CaseState, lang: Lang = "hu"): CoriResult {
  const domains: CoriDomain[] = [];

  /* 1. Anyai deterioráció — MEOWS */
  const meows = runCalc(reg, state, "calc.meows", lang);
  domains.push(meows.status === "ok"
    ? {
        id: "maternal", label: "Anyai deterioráció",
        level: (meows.value >= 2 ? 4 : meows.value === 1 ? 2 : 1) as CoriLevel,
        why: `MEOWS ${meows.value} kiváltó paraméter`, missing: [],
      }
    : { id: "maternal", label: "Anyai deterioráció", level: null,
        why: meows.reason, missing: meows.missing });

  /* 2. Hipertenzió / praeeclampsia — fullPIERS */
  const fp = fullPiers(reg, state);
  domains.push(fp.status === "ok"
    ? {
        id: "hypertensive", label: "Hipertenzió, praeeclampsia",
        level: (fp.value >= 0.3 ? 5 : fp.value >= 0.1 ? 4 : fp.value >= 0.025 ? 3 : 1) as CoriLevel,
        why: `fullPIERS ${(fp.value * 100).toFixed(1)}% 48 órás kockázat`, missing: [],
      }
    : {
        id: "hypertensive", label: "Hipertenzió, praeeclampsia", level: null,
        // A leggyakoribb ok NEM a hiányzó labor, hanem a KAPU: az együtthatók
        // nincsenek visszaellenőrizve a publikációval, ezért a modell teljes
        // bemenettel sem ad eredményt.
        why: fp.reason, missing: fp.missing,
      });

  /* 3. Vérzés — CMQCC + sokk-index */
  const stage = runCalc(reg, state, "calc.cmqcc.stage", lang);
  domains.push(stage.status === "ok"
    ? {
        id: "hemorrhage", label: "Vérzés",
        level: (stage.value >= 3 ? 5 : stage.value === 2 ? 4 : stage.value === 1 ? 3 : 1) as CoriLevel,
        why: `CMQCC ${stage.value}. stádium`, missing: [],
      }
    : { id: "hemorrhage", label: "Vérzés", level: null,
        // Nem feltételezzük, hogy adathiány az ok: a stádium a KAPU miatt is
        // elmaradhat (a stádiumhatárok nincsenek visszaellenőrizve).
        why: stage.reason, missing: stage.missing });

  /* 4. Infekció — omqSOFA */
  const sofa = runCalc(reg, state, "calc.omqsofa", lang);
  domains.push(sofa.status === "ok"
    ? {
        id: "infection", label: "Infekció",
        level: (sofa.value >= 2 ? 4 : sofa.value === 1 ? 2 : 1) as CoriLevel,
        why: `omqSOFA ${sofa.value} pont`, missing: [],
      }
    : { id: "infection", label: "Infekció", level: null,
        why: sofa.reason, missing: sofa.missing });

  /* 5. Magzat — NICHD */
  const fhr = nichd(reg, state, lang);
  domains.push(fhr.status === "ok"
    ? {
        id: "fetal", label: "Magzat",
        level: (fhr.category === 3 ? 5 : fhr.category === 2 ? 2 : 1) as CoriLevel,
        why: fhr.label, missing: [],
      }
    : { id: "fetal", label: "Magzat", level: null, why: fhr.reason, missing: fhr.missing });

  /* 6. Vajúdás menete — a WHO figyelmeztető és beavatkozási vonal */
  const partogram = partogramLevel(reg, state, lang);
  domains.push(partogram);

  const measured = domains.filter((d) => d.level != null);
  if (!measured.length) {
    return {
      status: "insufficient", domains,
      reason:
        "Egyetlen domén sem mért. A CORI ilyenkor NEM 0 és NEM zöld: nincs " +
        "eredmény. A 0-s szint a skálán „nincs adat”-ot jelent, és ha ezt " +
        "összesítenénk, a teljesen üres eset alapszintnek látszana.",
    };
  }

  const overall = Math.max(...measured.map((d) => d.level!)) as CoriLevel;
  const unmeasured = domains.length - measured.length;

  return {
    status: "ok", overall,
    label: LEVELS[overall].label,
    action: LEVELS[overall].action,
    domains, unmeasured,
    caveat:
      (unmeasured
        ? `${unmeasured} domén NEM MÉRT (${domains.filter((d) => d.level == null)
            .map((d) => d.label).join(", ")}). Az összesített szint csak a mért ` +
          `dómének maximuma — a nem mért domén nem „rendben van”, hanem ismeretlen. `
        : "") +
      "A CORI nem publikált, validált score, hanem eszkalációs szabály: a " +
      "legrosszabb domén szintje határozza meg az ellátás szintjét. Nem " +
      "valószínűséget mond, és nem helyettesíti az egyes score-ok külön " +
      "olvasását.",
  };
}

/**
 * A vajúdás menete: a WHO klasszikus figyelmeztető és beavatkozási vonala.
 *
 * A vonalak a 4 cm-től számított 1 cm/óra ütemet feltételezik. A WHO 2020-as
 * Labour Care Guide EZT ELHAGYTA, mert az 1 cm/óra a vajúdások nagy részénél
 * fölösleges beavatkozáshoz vezetett — a normális vajúdás lassabb és
 * változékonyabb, mint a vonal feltételezi.
 *
 * A vonalak mégis benne vannak, mert a hazai gyakorlat és a partogram-nyomtatvány
 * használja őket. De a szint mellé ODA KELL ÍRNI, hogy mit feltételez.
 */
function partogramLevel(reg: Registry, state: CaseState, lang: Lang): CoriDomain {
  const hours = runCalc(reg, state, "calc.labour.hours", lang);
  const c = resolve(reg, state, "exam.cervix.dilation");
  const cervix = c.state === "ok" && typeof c.value === "number" ? c.value : null;
  if (hours.status !== "ok" || cervix == null) {
    return {
      id: "labourProgress", label: "Vajúdás menete", level: null,
      why: "nincs vajúdáskezdet vagy méhszáj-tágulat",
      missing: [
        ...(hours.status !== "ok" ? hours.missing : []),
        ...(cervix == null ? ["exam.cervix.dilation"] : []),
      ],
    };
  }
  // A vonalak csak az AKTÍV szakban értelmesek.
  if (cervix < 4) {
    return {
      id: "labourProgress", label: "Vajúdás menete", level: 1,
      why: "látens szak — a figyelmeztető vonal itt nem alkalmazható", missing: [],
    };
  }
  const expected = 4 + hours.value;                 // 1 cm/óra a 4 cm-től
  const behind = expected - cervix;
  if (behind >= 4) {
    return {
      id: "labourProgress", label: "Vajúdás menete", level: 4,
      why: "a beavatkozási vonalon túl (a klasszikus 1 cm/óra ütemhez képest)",
      missing: [],
    };
  }
  if (behind >= 0.5) {
    return {
      id: "labourProgress", label: "Vajúdás menete", level: 3,
      why: "a figyelmeztető vonalon túl (a klasszikus 1 cm/óra ütemhez képest)",
      missing: [],
    };
  }
  return { id: "labourProgress", label: "Vajúdás menete", level: 1, why: "a vonalon belül", missing: [] };
}
