/**
 * KÓDOLVASÁS A RÖGZÍTÉSKORI VERZIÓ SZERINT.
 *
 * A `codeSystem.version` bélyegzés önmagában csak annyit mond, hogy egy érték
 * melyik verzió idején keletkezett. Ez kevés, ha maga a KÓDLISTA is változott:
 * a FIGO endometrium-rendszere 2023-ban átalakult, és van kód, ami megszűnt,
 * és van, ami ugyanazzal a jelöléssel mást jelent.
 *
 * Három választ kell tudni adni egy régi kódról:
 *
 *   · MI VOLT AKKOR — a rögzítéskori lista címkéje;
 *   · LÉTEZIK-E MA — vagy visszavonták;
 *   · UGYANAZT JELENTI-E — vagy a jelölés megmaradt, a tartalom nem.
 *
 * A harmadik a legveszélyesebb, mert csendes: a kód feloldódik, a címke
 * megjelenik, és senki nem tudja meg, hogy mást olvas, mint amit írtak.
 */
import type { I18n, Lang, ValueSetItem, ValueSetVersion } from "./types.ts";
import type { Registry } from "./registry.ts";

const L = (a?: string, b?: string): string => a ?? b ?? "";

export interface CodeReading {
  code: string | number;
  /** A címke ÚGY, AHOGY A RÖGZÍTÉSKOR szólt. */
  label: string;
  /** Melyik verzió szerint olvastuk. */
  version: string;
  /** A jelenleg érvényes verzió. */
  currentVersion: string;
  /** Igaz, ha a kód a MAI listán már nem szerepel. */
  retired: boolean;
  /** Igaz, ha a kód ma is létezik, de MÁS a címkéje — ez a csendes csapda. */
  meaningChanged: boolean;
  /** A mai címke, ha a kód ma is létezik. */
  currentLabel?: string;
  /** Mi változott a verziók között. */
  versionNote?: string;
  /** Emberi olvasatra összeszedve — a leleten ez jelenik meg a kód mellett. */
  caveat?: string;
}

function itemsOf(
  reg: Registry, id: string, version: string,
): { items: ValueSetItem[]; note?: I18n; isCurrent: boolean } | null {
  const def = reg.get(reg.resolvePrimary(id));
  if (!def) return null;
  const current = def.codeSystem?.version;
  if (!version || version === current) {
    return { items: def.valueSet ?? [], isCurrent: true };
  }
  const v = (def.valueSetVersions ?? []).find((x: ValueSetVersion) => x.version === version);
  if (!v) return null;
  return { items: v.items, note: v.note, isCurrent: false };
}

/**
 * Egy rögzített kód feloldása a SAJÁT verziója szerint.
 *
 * `recordedVersion` hiányában a jelenlegi listát használjuk — de ez maga is
 * jelzésértékű: verzió nélkül rögzült érték olyan rendszerből jött, ami nem
 * bélyegzett.
 */
export function readCode(
  reg: Registry, id: string, code: string | number,
  recordedVersion?: string | null, lang: Lang = "hu",
): CodeReading | null {
  const def = reg.get(reg.resolvePrimary(id));
  if (!def) return null;
  const currentVersion = def.codeSystem?.version ?? "";
  const version = recordedVersion || currentVersion;

  const set = itemsOf(reg, id, version);
  const currentItems = def.valueSet ?? [];
  const label = (() => {
    const it = set?.items.find((o) => String(o.code) === String(code));
    if (!it) return String(code);
    return L(lang === "en" ? it.label_en : it.label_hu, String(it.code));
  })();

  const inCurrent = currentItems.find((o) => String(o.code) === String(code));
  const currentLabel = inCurrent
    ? L(lang === "en" ? inCurrent.label_en : inCurrent.label_hu, String(inCurrent.code))
    : undefined;

  const retired = !inCurrent;
  const meaningChanged = !!inCurrent && !!currentLabel && currentLabel !== label;

  const parts: string[] = [];
  if (version !== currentVersion) {
    parts.push(
      `A kód a(z) ${version} verzió szerint rögzült; a jelenleg érvényes ${currentVersion}.`,
    );
  }
  if (retired) {
    parts.push(
      "A kód a MAI listán már nem szerepel — az érték a saját verziója szerint " +
      "helyes, de a mai rendszerbe nem fordítható át automatikusan.",
    );
  }
  if (meaningChanged) {
    parts.push(
      `FIGYELEM: a kód ma is létezik, de MÁST jelent — akkor „${label}", ma ` +
      `„${currentLabel}". Ez a legveszélyesebb eset, mert csendes: a kód ` +
      `feloldódik, és senki nem tudja meg, hogy mást olvas, mint amit írtak.`,
    );
  }
  if (set?.note) parts.push(L(set.note[lang], set.note.hu ?? ""));

  return {
    code, label, version, currentVersion, retired, meaningChanged,
    currentLabel,
    versionNote: set?.note ? L(set.note[lang], set.note.hu ?? "") : undefined,
    caveat: parts.length ? parts.join(" ") : undefined,
  };
}

/** Integritás: a verziózott listák és a jelenlegi értékkészlet összhangja. */
export function validateVersionedCodes(reg: Registry) {
  const issues: Array<{ severity: "error" | "warning"; id: string; message: string }> = [];
  for (const d of reg.all()) {
    const versions = d.valueSetVersions ?? [];
    if (!versions.length) continue;

    if (!d.codeSystem) {
      issues.push({
        severity: "error", id: d.id,
        message: "verziózott kódlista kódrendszer megnevezése nélkül",
      });
      continue;
    }
    const seen = new Set<string>();
    for (const v of versions) {
      if (seen.has(v.version)) {
        issues.push({ severity: "error", id: d.id, message: `ismétlődő kódlista-verzió: ${v.version}` });
      }
      seen.add(v.version);
      if (v.version === d.codeSystem.version) {
        issues.push({
          severity: "error", id: d.id,
          message:
            `a jelenlegi verzió (${v.version}) nem szerepelhet a korábbiak közt — ` +
            `az a \`valueSet\` mezőben él`,
        });
      }
      if (!v.items.length) {
        issues.push({ severity: "error", id: d.id, message: `üres kódlista: ${v.version}` });
      }
      if (!v.validTo) {
        issues.push({
          severity: "warning", id: d.id,
          message:
            `a(z) ${v.version} verzióhoz nincs érvényességi vég — enélkül nem ` +
            `állapítható meg, mikortól kell az újat használni`,
        });
      }
    }
  }
  return issues;
}
