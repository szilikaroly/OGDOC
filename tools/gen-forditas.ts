/**
 * FORDÍTÓI MUNKALAP — ami a klinikai tartalomból NINCS lefordítva.
 *
 *   npm run forditas > docs/fejlesztes/forditas-munkalap.md
 *
 * MIÉRT NEM FORDÍT A GÉP. A 905 változóból 30-nak van angol címkéje (3,3%),
 * a 2455 opciócímkéből 4-nek. A felület ezt kimondja („source-language
 * interface with en buttons”), és a klinikai szöveget SZÁNDÉKOSAN nem fordítja
 * gépileg: a „Cervix hossza” és a „Cervical length” között egy klinikus dönt,
 * nem egy modell — mert a rossz fordítás a leleten jelenik meg.
 *
 * Amit a gép tud: felsorolni, MI hiányzik, modulonként, a magyar alakkal és a
 * definícióval, hogy a fordítónak ne kelljen a regisztert olvasnia. Ez a lap
 * az, ami egy fordítónak KELL, és ami eddig nem volt.
 */
import { loadRegistry } from "../core/load.ts";
import { loadModulcimek, cimzes } from "../core/ui/modulcimek.ts";
import { LANGS, SOURCE_LANG } from "../core/i18n.ts";
import type { Lang } from "../core/types.ts";

const CEL: Lang = (process.argv[2] as Lang) ?? "en";
if (!LANGS.includes(CEL) || CEL === SOURCE_LANG) {
  console.error(`Célnyelv: ${LANGS.filter((l) => l !== SOURCE_LANG).join(" | ")}`);
  process.exit(1);
}
const reg = loadRegistry("registry/variables");
const cimek = loadModulcimek("registry/felulet/modulcimek.json");

const out: string[] = [];
const P = (s = "") => out.push(s);
let cimkeHiany = 0, opcioHiany = 0, cimkeMind = 0, opcioMind = 0;

const modulok = [...new Set(reg.all().map((d) => d.module))]
  .map((m) => ({ m, c: cimzes(cimek, m, SOURCE_LANG) }))
  .sort((a, b) => a.c.groupOrder - b.c.groupOrder || a.c.title.localeCompare(b.c.title, "hu"));

const blokkok: string[] = [];
for (const { m, c } of modulok) {
  const sorok: string[] = [];
  for (const d of reg.all().filter((x) => x.module === m).sort((a, b) => a.id.localeCompare(b.id))) {
    cimkeMind++;
    const hianyzik = !d.label?.[CEL];
    if (hianyzik) cimkeHiany++;
    const opciok = (d.valueSet ?? []).filter((o) => !(o as Record<string, unknown>)[`label_${CEL}`]);
    opcioMind += (d.valueSet ?? []).length; opcioHiany += opciok.length;
    if (!hianyzik && !opciok.length) continue;
    const def = d.documentation?.definition?.[SOURCE_LANG] ?? "";
    sorok.push(`| \`${d.id}\` | ${d.label?.[SOURCE_LANG] ?? ""}${d.unit ? ` [${d.unit}]` : ""} | ${hianyzik ? "" : d.label?.[CEL]} | ${def.replace(/\|/g, "\\|").slice(0, 110)} |`);
    for (const o of opciok) {
      sorok.push(`| ↳ \`${o.code}\` | ${o.label_hu ?? ""} |  | opció |`);
    }
  }
  if (!sorok.length) continue;
  blokkok.push(`### ${c.title} \`${m}\`\n\n| Azonosító | ${SOURCE_LANG.toUpperCase()} | ${CEL.toUpperCase()} | Definíció |\n|---|---|---|---|\n${sorok.join("\n")}\n`);
}

P(`# Fordítói munkalap — ${CEL.toUpperCase()}`);
P();
P(`Generált: \`npm run forditas ${CEL}\`. **Ne ezt szerkeszd** — a fordítás a`);
P(`\`registry/variables/*.json\` fájlok \`label.${CEL}\` és \`label_${CEL}\` mezőibe megy, és a`);
P(`következő generálás innen eltűnik, ami elkészült.`);
P();
P(`| | Összes | Hiányzik | Kész |`);
P(`|---|---:|---:|---:|`);
P(`| Változócímke | ${cimkeMind} | **${cimkeHiany}** | ${(100 * (cimkeMind - cimkeHiany) / cimkeMind).toFixed(1)}% |`);
P(`| Opciócímke | ${opcioMind} | **${opcioHiany}** | ${(100 * (opcioMind - opcioHiany) / Math.max(opcioMind, 1)).toFixed(1)}% |`);
P();
P(`A felület a klinikai szöveget **szándékosan nem fordítja gépileg**: a „Cervix hossza”`);
P(`és a „Cervical length” között klinikus dönt, mert a fordítás a leleten jelenik meg.`);
P(`Amíg a lefedettség 90% alatt van, a felület a célnyelvet **forrásnyelvi felületként**`);
P(`jelöli, és minden lefordítatlan címke mellett ott a jelölés.`);
P();
P(`## Modulonként, a betegút sorrendjében`);
P();
P(blokkok.join("\n"));
process.stdout.write(out.join("\n") + "\n");
