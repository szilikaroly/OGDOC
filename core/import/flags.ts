/**
 * VÖRÖS ZÁSZLÓK A JAVASLATOKBÓL — a jóváhagyás sora.
 *
 * A kérés úgy szólt, hogy a rendszer „automatikusan, a háttérben" nézze át az
 * előéleti anyagot, és a vörös zászlókat hagyassa jóvá a klinikussal. A
 * „háttérben" és a „jóváhagyás" együtt csak egyféleképpen működik:
 *
 *   A GÉP KERES. AZ EMBER DÖNT. AMI KÖZTE VAN, AZ NEM TŰNIK EL.
 *
 * Ezért a zászlónak három állapota van, és a harmadik nem olvad bele a
 * másodikba:
 *
 *   raised          megerősített adatból következik — ez már a beteg adata
 *   pending         MEG NEM ERŐSÍTETT javaslatból következne; a klinikus
 *                   döntésére vár, és addig LÁTSZIK
 *   undeterminable  a szükséges adat sehol nincs meg — sem rögzítve, sem
 *                   javaslatként. Ez NEM „nincs vörös zászló"
 *
 * A `pending` a lényeg. Egy olyan rendszer, ami a meg nem erősített
 * kinyerésből fakadó gyanút addig elrejti, amíg valaki jóvá nem hagyja, épp
 * azt veszíti el, amiért az egészet csináljuk: a régi anyagban lévő,
 * észrevétlen jelet.
 */
import type { ComplaintDict } from "../complaints/registry.ts";
import type { Registry } from "../registry.ts";
import type { CaseState } from "../types.ts";
import type { ProposalStore } from "./proposals.ts";
import { setValue } from "../derive/engine.ts";

export type FlagState = "raised" | "pending" | "undeterminable" | "clear";

export interface FlagTriage {
  complaint: string;
  label: string;
  state: FlagState;
  why: string[];
  /** Mely javaslatok döntenék el — ezeket kell jóváhagyatni. */
  awaiting: string[];
}

/**
 * A panaszszótár vörös zászlóinak állapota, a javaslattárral együtt nézve.
 *
 * A vizsgálat KÉTSZER fut: egyszer a megerősített adaton, egyszer úgy, mintha
 * a sorban álló javaslatokat is elfogadtuk volna. A kettő különbsége adja a
 * `pending` zászlókat — vagyis pontosan azt, ami a klinikus döntésén múlik.
 */
export function triageFlags(
  reg: Registry, dict: ComplaintDict, state: CaseState, store: ProposalStore,
): FlagTriage[] {
  // „Mi lenne, ha mindent elfogadnánk" — HIPOTETIKUS állapot. Sehol nem
  // tárolódik, és semmilyen dokumentumba nem kerül: kizárólag azt mutatja
  // meg, mi múlik a döntésen.
  const hypothetical = applyPending(reg, state, store);
  const out: FlagTriage[] = [];

  for (const t of dict.all()) {
    const now = dict.redflagState(reg, state, t.id);
    if (now.flag === true) {
      out.push({
        complaint: t.id, label: t.label.hu ?? t.id, state: "raised",
        why: now.why, awaiting: [],
      });
      continue;
    }
    const ifAccepted = dict.redflagState(reg, hypothetical, t.id);
    if (ifAccepted.flag === true) {
      const awaiting = store.byStatus("pending")
        .filter((p) => ifAccepted.why.some((w) => w.startsWith(p.variable)))
        .map((p) => p.id);
      out.push({
        complaint: t.id, label: t.label.hu ?? t.id, state: "pending",
        why: ifAccepted.why, awaiting,
      });
      continue;
    }
    if (now.flag === "unknown") {
      out.push({
        complaint: t.id, label: t.label.hu ?? t.id, state: "undeterminable",
        why: now.why, awaiting: [],
      });
    }
  }
  return out;
}

/**
 * A hipotetikus állapot: mintha minden sorban álló javaslatot elfogadtunk
 * volna.
 *
 * SOSEM tárolódik és sosem kerül dokumentumba — a `triageFlags` egyetlen
 * kérdésre használja: mi múlik a klinikus döntésén. Ha ez az állapot bárhol
 * máshol megjelenne, azzal pontosan a kaput kerülnénk meg.
 */
function applyPending(
  reg: Registry, state: CaseState, store: ProposalStore,
): CaseState {
  let s = state;
  for (const p of store.byStatus("pending")) {
    try {
      s = writeHypothetical(reg, s, p.variable, p.value, p.t ?? undefined,
                            p.scope ?? undefined);
    } catch {
      // Egy nem írható (levezetett) vagy ismeretlen mezőre adott javaslat a
      // hipotetikus futásból is kimarad — a felvételnél már hibázott volna.
    }
  }
  return s;
}

function writeHypothetical(
  reg: Registry, state: CaseState, id: string, value: unknown,
  t?: string, scope?: string,
): CaseState {
  // A hipotetikus írás eredete SZÁNDÉKOSAN a legalacsonyabb precedenciájú:
  // ha ez az állapot valaha kiszivárogna, akkor is minden rögzített adat
  // felülírná. De a helyes védelem nem ez, hanem az, hogy nem szivárog ki.
  return setValue(reg, state, id, value, {
    provenance: "patient", confidence: "uncertain",
    ...(t ? { t } : {}), ...(scope ? { scope } : {}),
    sourceRef: "import:hipotetikus",
  });
}
