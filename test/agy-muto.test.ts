/**
 * ÁGYKEZELÉS ÉS MŰTŐBEOSZTÁS — ahol a kihasználtság maximalizálása a hiba.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  athelyez, kapacitas, kiadhato, loadAgyak, validateAgyak,
} from "../core/fekvo/agy.ts";
import type { AgyHelyzet } from "../core/fekvo/agy.ts";
import {
  HATARIDO_PERC, foglalhato, hatarido, loadMutok, validateMutok,
} from "../core/op/muto.ts";
import type { Foglalas, MutoKeszlet } from "../core/op/muto.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const A = () => loadAgyak(join(HERE, "..", "registry", "fekvo", "agyak.json"));
const M = (): MutoKeszlet => loadMutok(join(HERE, "..", "registry", "muto", "mutok.json"));
const MOST = "2026-09-08T08:00:00Z";

/* ── 1. A SZABAD ÁGY NEM UGYANAZ, MINT A KIADHATÓ ─────────────────────── */

test("A HIÁNYZÓ ÁGYÁLLAPOT NEM „SZABAD”", () => {
  const k = kiadhato(undefined, MOST);
  assert.equal(k.kiadhato, false);
  assert.equal(k.allapot, "ismeretlen");
  assert.match(k.miert, /a kimutatott kapacitás\s+enélkül nagyobb a valóságosnál/);
});

test("a kapacitás MEGMONDJA, mennyire megbízható", () => {
  const kap = kapacitas(A(), [], "gyermekagyas", MOST);
  assert.equal(kap.agy, 4);
  assert.equal(kap.kiadhato, 0);
  assert.equal(kap.ismeretlen, 4);
  assert.match(kap.miert, /a valódi szám 0 és 4 között van/);
});

test("a lejárt fenntartás felszabadul, a lejárat nélküli örökre szól", () => {
  const lejart: AgyHelyzet = { agy: "agy.gya.1", allapot: "fenntartva",
    ok: "érkező beteg", eddig: "2026-09-08T06:00:00Z" };
  assert.equal(kiadhato(lejart, MOST).kiadhato, true);

  const orokre: AgyHelyzet = { agy: "agy.gya.1", allapot: "fenntartva", ok: "érkező beteg" };
  const k = kiadhato(orokre, MOST);
  assert.equal(k.kiadhato, false);
  assert.match(k.miert, /a kapacitás csendben fogy/);
});

test("ok nélküli „nem kiadható” állapot: HIBA", () => {
  const h = validateAgyak(A(), [{ agy: "agy.gya.1", allapot: "nemKiadhato" }])
    .filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /eltűnt kapacitás/);
});

/* ── 2. A SZÜLÉSZETI ÁGYON KÉT BETEG FEKSZIK ─────────────────────────── */

test("a rooming-in ágy KÉT beteget tart — az újszülött külön beteg", () => {
  const h: AgyHelyzet[] = [{ agy: "agy.gya.1", allapot: "foglalt",
    betegek: ["anya-1", "ujszulott-1"] }];
  assert.equal(validateAgyak(A(), h).filter((i) => i.severity === "error").length, 0);
  const kap = kapacitas(A(), h, "gyermekagyas", MOST);
  assert.equal(kap.foglalt, 1, "egy ágy");
  assert.equal(kap.beteg, 2, "…de két beteg");
});

test("két beteg NEM rooming-in ágyon: HIBA", () => {
  const h: AgyHelyzet[] = [{ agy: "agy.tp.1", allapot: "foglalt",
    betegek: ["anya-1", "ujszulott-1"] }];
  const e = validateAgyak(A(), h).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /nem is látszik, hogy ott van/);
});

/* ── 3. AZ ÁTHELYEZÉS EGY MŰVELET ────────────────────────────────────── */

test("az áthelyezés KÖZTES ÁLLAPOTA látható — a beteg nem tűnik el", () => {
  const h: AgyHelyzet[] = [
    { agy: "agy.szsz.1", allapot: "foglalt", betegek: ["anya-1"] },
    { agy: "agy.gya.1", allapot: "kiadhato" }];
  const t = athelyez("anya-1", "agy.szsz.1", "agy.gya.1", h, MOST);
  assert.equal(t.allapot, "uton");
  assert.match(t.miert, /EGYIK ágy sem adható ki/);
});

test("nem kiadható célra az áthelyezés el sem indul", () => {
  const h: AgyHelyzet[] = [
    { agy: "agy.szsz.1", allapot: "foglalt", betegek: ["anya-1"] },
    { agy: "agy.gya.1", allapot: "nemKiadhato", ok: "takarítás" }];
  assert.equal(athelyez("anya-1", "agy.szsz.1", "agy.gya.1", h, MOST).allapot,
    "celNemKiadhato");
});

test("A KÉT ÁGYON SZEREPLŐ BETEG a fél-rögzítés tünete", () => {
  const h: AgyHelyzet[] = [
    { agy: "agy.szsz.1", allapot: "foglalt", betegek: ["anya-1"] },
    { agy: "agy.gya.1", allapot: "foglalt", betegek: ["anya-1"] }];
  const e = validateAgyak(A(), h).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /az\s+„érkezett” előbb rögzült, mint az „elment”/);
});

/* ── A MŰTŐ: A TARTALÉK, AMIT NEM SZABAD ELFOGYASZTANI ───────────────── */

const F = (muto: string, s: "k1" | "k2" | "k3" | "k4" = "k4"): Foglalas =>
  ({ id: `f-${muto}`, muto, surgosseg: s, kezdet: "2026-09-08T09:00:00Z",
     vegePerc: 60, beavatkozas: "demó" });
const UJ = (muto: string, s: "k1" | "k2" | "k3" | "k4" = "k4") =>
  ({ muto, surgosseg: s, kezdet: "2026-09-08T09:30:00Z", vegePerc: 45,
     beavatkozas: "demó" });

test("ALÁÍRATLAN TARTALÉK MELLETT elektív foglalás nem indul", () => {
  const f = foglalhato(M(), [], UJ("muto.2"));
  assert.equal(f.allapot, "tartalekAlairatlan");
  assert.match(f.miert, /az első zsúfolt napon elfogy/);
});

function alairt(): MutoKeszlet {
  const k = M();
  k.hitelesitesek.push({ ki: "dr. Demó Osztályvezető", mikor: "2026-09-01",
    tartalek: k.surgossegiTartalek });
  return k;
}

test("AZ ELEKTÍV FOGLALÁS, AMI AZ UTOLSÓ TARTALÉKOT ENNÉ MEG, ELAKAD", () => {
  // muto.1 foglalt → csak muto.2 marad sürgősre alkalmasként.
  const f = foglalhato(alairt(), [F("muto.1")], UJ("muto.2"));
  assert.equal(f.allapot, "tartalekotFogyasztana");
  assert.equal(f.foglalhato, false);
  assert.equal(f.maradoTartalek, 0);
  assert.match(f.miert, /A műtő nem foglalható\s+tele/);
  assert.match(f.miert, /30 perces határidő/);
});

test("A SÜRGŐS BEAVATKOZÁS SOSEM AKAD EL A TARTALÉKON — éppen érte van", () => {
  const f = foglalhato(alairt(), [F("muto.1")], UJ("muto.2", "k1"));
  assert.equal(f.foglalhato, true);
  assert.match(f.miert, /a fenntartott tartalék ÉPPEN\s+ezért van/);
});

test("a felülbírálás MEGNEVEZETT felelőssel nyit", () => {
  const f = foglalhato(alairt(), [F("muto.1")], UJ("muto.2"),
    { ki: "dr. Demó Osztályvezető", miert: "a beteg már felkészítve, a második műtő stabil" });
  assert.equal(f.foglalhato, true);
  assert.match(f.miert, /FELÜLBÍRÁLVA/);
});

test("K1 nem osztható be sürgősre nem alkalmas műtőbe", () => {
  const f = foglalhato(alairt(), [], UJ("muto.3", "k1"));
  assert.equal(f.allapot, "nemSurgosAlkalmas");
  assert.match(f.miert, /a hypoxia elkerülhető/);
});

test("szabad tartalék mellett az elektív foglalás megy", () => {
  const f = foglalhato(alairt(), [], UJ("muto.3"));
  assert.equal(f.foglalhato, true);
  assert.equal(f.maradoTartalek, 2);
});

/* ── A HATÁRIDŐ ──────────────────────────────────────────────────────── */

test("a döntés–megszületés intervallum a mérce", () => {
  assert.equal(HATARIDO_PERC.k1, 30);
  const jo = hatarido("k1", "2026-09-08T09:00:00Z", "2026-09-08T09:22:00Z");
  assert.equal(jo.allapot, "tartva");
  assert.equal(jo.percek, 22);

  const rossz = hatarido("k1", "2026-09-08T09:00:00Z", "2026-09-08T09:41:00Z");
  assert.equal(rossz.allapot, "tullepve");
  assert.match(rossz.miert, /11 perccel túllépve/);
});

test("HIÁNYZÓ DÖNTÉSI IDŐPONTNÁL AZ EREDMÉNY NEM „TARTVA”", () => {
  const h = hatarido("k1", null, "2026-09-08T09:22:00Z");
  assert.equal(h.allapot, "nemMerheto");
  assert.match(h.miert, /amit a leggyakrabban utólag írnak be/);
});

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

test("a tartalék nem lehet annyi, mint az összes sürgős műtő", () => {
  const k = M(); k.surgossegiTartalek = 2;
  const e = validateMutok(k).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /egyetlen elektív műtét sem lenne beosztható/);
});

test("az aláírás a SZÁMHOZ köt", () => {
  const k = alairt(); k.surgossegiTartalek = 0;
  const e = validateMutok(k).filter((i) => i.id === "muto.hitelesites");
  assert.equal(e.length, 1);
  assert.equal(e[0].severity, "error");
});
