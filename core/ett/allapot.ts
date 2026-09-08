/**
 * A RENDSZER MOSTANI ÁLLAPOTA — EGY HELYEN, EGYSZER.
 *
 * A beadvány állításait a validálás és a munkalap is megítéli. Ha a kettő
 * külön számolna, a kérelmet egy HARMADIK állapotra írnánk meg — és a
 * bizottság épp azt kapná, ami sehol nincs. Ez a fájl ezért az egyetlen hely,
 * ahol az állapot összeáll.
 *
 * A `dosszie.ts` szándékosan nem tud a betöltésről: azt szintetikus állapoton
 * is végig lehet vinni, és a tesztek így tudják eljátszani azt a napot, amikor
 * minden aláírás megvan.
 */
import { loadRegistry } from "../load.ts";
import { loadDocuments } from "../docs/registry.ts";
import { CALCULATORS } from "../calc/defs.ts";
import { auditFields, loadUiMap } from "../ui/felulet.ts";
import { dontesAllapot, loadDontesek, loadSzabalyok, merleg as dMerleg } from "../ui/dontes.ts";
import {
  hitelesitesAllapot, loadHitelesitesek, merleg as refMerleg,
} from "../lab/hitelesites.ts";
import { loadNormograms } from "../us/normogram.ts";
import { loadNormogramHitelesitesek, ngAllapot } from "../us/hitelesites.ts";
import { loadKalkHitelesitesek, loadOrokolt, orokoltAllas } from "../calc/hitelesites.ts";
import { loadProtocol } from "../szepszis/screen.ts";
import {
  loadKuszobDontes, loadKuszobHitelesitesek, merleg as sepMerleg,
} from "../szepszis/kuszob.ts";
import { loadMegorzesHitelesitesek, merleg as megMerleg } from "../docs/megorzes.ts";
import { loadInstruments } from "../kerdoiv/registry.ts";
import { loadRend, merleg as riasztMerleg } from "../riasztas/eszkalacio.ts";
import { loadLicencek, merleg as licMerleg } from "../kerdoiv/licenc.ts";
import { allapot } from "./dosszie.ts";
import type { Allapot } from "./dosszie.ts";

export function rendszerAllapot(gyoker = "."): Allapot {
  const p = (x: string) => `${gyoker}/${x}`;
  const reg = loadRegistry(p("registry/variables"));
  const docs = loadDocuments(p("registry/documents/core.json"));
  const inst = loadInstruments(p("registry/kerdoivek")).all();

  const szabalyok = loadSzabalyok(p("registry/felulet/dontes-szabalyok.json"));
  const uiMap = loadUiMap(p("registry/felulet/szuleszeti-felulet.json"));
  const gynMap = loadUiMap(p("registry/felulet/nogyogyaszati-felulet.json"));
  const dm = dMerleg(
    dontesAllapot([uiMap, gynMap].flatMap((m) => auditFields(m, reg)), szabalyok,
      loadDontesek(p("registry/felulet/dontesek.json"))),
    szabalyok);

  const rm = refMerleg(hitelesitesAllapot(reg,
    loadHitelesitesek(p("registry/labor/referencia-hitelesitesek.json"))));
  const nga = ngAllapot(loadNormograms(p("registry/normogramok")).all(),
    loadNormogramHitelesitesek(p("registry/normogramok/hitelesitesek.json")));
  const oa = orokoltAllas(CALCULATORS,
    loadKalkHitelesitesek(p("registry/kalkulatorok/hitelesitesek.json")),
    loadOrokolt(p("registry/kalkulatorok/orokolt.json")));
  const sm = sepMerleg(loadProtocol(p("registry/szepszis/cmqcc-ob-szepszis.json")), CALCULATORS,
    loadKuszobHitelesitesek(p("registry/szepszis/kuszob-hitelesitesek.json")),
    loadKuszobDontes(p("registry/szepszis/kuszob-dontes.json")));
  const lm = licMerleg(inst, loadLicencek(p("registry/kerdoivek/licencek.json")),
    new Date().toISOString().slice(0, 10));
  const rim = riasztMerleg(loadRend(p("registry/riasztas/eszkalacio.json")));
  const mm = megMerleg(docs.all(),
    loadMegorzesHitelesitesek(p("registry/documents/megorzes-hitelesitesek.json")));

  return allapot({
    gyoker,
    dontesAlairt: dm.dontottSzabalyok, dontesOsszes: dm.szabalyok,
    megorzesAlairt: mm.alairt, megorzesOsszes: mm.osszes,
    laborAlairt: rm.hitelesitve, laborOsszes: rm.osszes,
    normogramAlairt: nga.filter((x) => x.allapot === "hitelesitve").length,
    normogramOsszes: nga.length,
    kalkKapuMogott: oa.kapuMogott, kalkAlairt: oa.alairt, kalkOrokolt: oa.orokolt,
    szepszisAlairt: sm.alairt, szepszisOsszes: sm.kuszobok, szepszisRiaszt: sm.riaszt,
    meroeszkozRendezett: lm.rendezett,
    meroeszkozOsszes: lm.osszes,
    meroeszkozFelveheto: lm.felveheto,
    meroeszkozValidalt: lm.validaltForditas,
    phiValtozo: reg.all().filter((v) => (v as { phi?: boolean }).phi).length,
    riasztasKiadhato: rim.kiadhato, riasztasOsszes: rim.tipus,
  });
}
