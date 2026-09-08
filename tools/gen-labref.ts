/**
 * MUNKALAP A 32 REFERENCIA HITELESÍTÉSÉHEZ — a 6. lépés kimenete.
 *
 * Ez nem dokumentáció, hanem ÜLÉSANYAG. Egy laboratóriumi szakorvos nem
 * fogja a repót olvasni, és nem is kell: azt kell látnia, hogy MELYIK szám
 * ellen mit kell összevetni, és melyik táblasorral.
 *
 * A munkalap forrásokra bontva sorol, mert az összevetés így megy: egy tábla
 * kézbe, végig a soraiban. Változónként ugrálni két forrás között az a
 * munkaszervezés, amitől a feladat fél éve áll.
 *
 * Futtatás: `npm run labref` (a kimenet a képernyőre megy — másolható)
 */
import { loadRegistry } from "../core/load.ts";
import {
  hitelesitesAllapot, lenyeg, lenyomat, loadHitelesitesek, merleg,
  referenciasValtozok,
} from "../core/lab/hitelesites.ts";

const reg = loadRegistry("registry/variables");
const kat = loadHitelesitesek("registry/labor/referencia-hitelesitesek.json");
const allapotok = hitelesitesAllapot(reg, kat);
const m = merleg(allapotok);

const P = (...s: string[]) => console.log(s.join(""));
const sav = (r: { context: string; low?: number | null; high?: number | null }) =>
  `${r.context}: ${r.low ?? "−∞"} – ${r.high ?? "∞"}`;

P("# Munkalap — laborreferenciák hitelesítése");
P("");
P(`*Generált: \`npm run labref\`. ${m.osszes} tétel, ${m.hitelesitve} hitelesítve, `,
  `${m.alairatlan} aláíratlan, ${m.elavult} elavult. `,
  `**${m.savokHatra} sáv vár összevetésre.***`);
P("");
P("## Amit alá kell írni, és amit nem");
P("");
P("Az aláírás a referencia NORMATÍV MAGJÁRA szól: az **egységre** és a **sávok");
P("határaira**. A megjegyzés, a forrás idézetének pontosítása és a címke NEM");
P("része — azok javíthatók az aláírás elvesztése nélkül.");
P("");
P("Egyetlen határérték megváltoztatása viszont **elavulttá** teszi az aláírást.");
P("Ez nem szigor: az aláíró azokra a számokra mondta ki, hogy helyesek.");
P("");

/* Forrásonként — mert az összevetés így megy. */
const forrasok = new Map<string, typeof allapotok>();
for (const a of allapotok) {
  forrasok.set(a.forras, [...(forrasok.get(a.forras) ?? []), a]);
}

let n = 0;
for (const [forras, tetelek] of [...forrasok.entries()]
  .sort((a, b) => b[1].length - a[1].length)) {
  P(`## Forrás: ${forras}`);
  P("");
  P(`*${tetelek.length} tétel · `,
    `${tetelek.reduce((s, t) => s + t.savok, 0)} sáv*`);
  P("");
  P("| # | Változó | Egység | Sávok | Állapot | Lenyomat |");
  P("|---:|---|---|---|---|---|");
  for (const t of tetelek) {
    n++;
    const d = reg.get(t.variable)!;
    const savok = d.reference!.ranges.map(sav).join(" · ");
    const all = t.allapot === "hitelesitve"
      ? `✓ ${t.alairo}`
      : t.allapot === "elavult" ? "**ELAVULT**" : "aláíratlan";
    P(`| ${n} | \`${t.variable}\`<br>${t.label} | ${t.unit ?? "—"} | `,
      `${savok} | ${all} | \`${t.lenyomat}\` |`);
  }
  P("");
}

P("## Amit az összevetésnél nézni kell");
P("");
P("| Kérdés | Miért |");
P("|---|---|");
P("| Az **egység** ugyanaz, mint a táblában? | A leggyakoribb néma hiba: a ",
  "tábla mg/dL-ben, a rendszer mmol/L-ben. A szám ilyenkor is „hihető”. |");
P("| A **trimeszterhatárok** ugyanott vannak? | A rendszer 14. és 28. hétnél ",
  "vált. Ha a tábla máshol, a határ közelében rossz sávot kap a beteg. |");
P("| Az **azonos trimeszterek** szándékosak? | Ahol mind a három trimeszter ",
  "ugyanaz, ott vagy tényleg nincs változás, vagy egy sort másoltak négyszer. |");
P("| A **gyermekágy** külön sáv-e a táblában? | A rendszer 42 napig ",
  "`postpartum` kontextust ad. Ha a tábla nem különböztet, ezt ki kell mondani. |");
P("| A tábla **melyik populációra** vonatkozik? | Egy referenciatartomány ",
  "populációhoz tartozik. Ha a tábla nem magyar, ez a hitelesítés HATÁRA. |");
P("");
P("## Hogyan kerül be az aláírás");
P("");
P("A `registry/labor/referencia-hitelesitesek.json` `hitelesitesek` tömbjébe,");
P("tételenként:");
P("");
P("```json");
P("{");
P('  "variable": "lab.alp",');
P('  "ki": "dr. Példa Éva",');
P('  "szerep": "labor",');
P('  "mikor": "2026-09-12",');
P('  "lenyomat": "<a munkalap Lenyomat oszlopából>",');
P('  "forrasTabla": "Abbassi-Ghanavati 2009, Table 1, 3. sor"');
P("}");
P("```");
P("");
P("A `lenyomat` a **másolandó** mező: ez köti az aláírást azokhoz a számokhoz,");
P("amelyeket az aláíró látott. Ha közben bárki megváltoztat egy határértéket,");
P("a `npm run validate` **build-hibát** ad — nem csendben elavul.");
P("");
P("## Ami a hitelesítéssel MEGVÁLTOZIK");
P("");
P("A `verification` `assumed` → `primary`, és ettől a mérés melletti");
P("figyelmeztetés eltűnik. **A regiszterben kézzel átírt `\"primary\"` nem elég:**");
P("a validálás hibaként fogja meg, mert az aláírás nélküli emelés pontosan az a");
P("mozdulat, ami a kaput felelős nélkül nyitná ki.");

if (m.osszes !== referenciasValtozok(reg).length) {
  throw new Error("belső ellentmondás a munkalapban");
}
// Az utolsó sor a lenyomat-számítás önellenőrzése: ha a `lenyeg()` változna,
// minden aláírás egyszerre avulna el, és jobb, ha ez itt derül ki.
for (const d of referenciasValtozok(reg)) {
  const a = allapotok.find((x) => x.variable === d.id)!;
  if (a.lenyomat !== lenyomat(lenyeg(d))) throw new Error(`lenyomat-eltérés: ${d.id}`);
}
