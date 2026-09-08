/**
 * A WEBES RÉTEG ÉS A TÁROLÓ ÖSSZEKÖTÉSE.
 *
 * Eddig a csontváz EGY esetet tartott a memóriában, jogosultság és napló
 * nélkül. Ez a modul cseréli ki alatta a talajt:
 *
 *   · PERZISZTENCIA — az eset a `SecureCaseStore`-ban él, titkosítva, és
 *     túléli az újraindítást;
 *   · JOGOSULTSÁG — minden olvasás és írás a három rétegen (szerepkör →
 *     ellátási kapcsolat → időablak) megy át;
 *   · AUDITNAPLÓ — a napló ELŐBB íródik, mint ahogy az adat kimegy, és ha a
 *     naplózás elbukik, a művelet is;
 *   · TÖBBFELHASZNÁLÓS ELKÜLÖNÍTÉS — esetenként külön lánc, külön kulcs.
 *
 * A HITELESÍTÉS a `core/auth/` alatt van, és a `web/auth-api.ts` köti be.
 *
 * A KUDARC MEGNEVEZETT MARAD. A tároló háromféle bukást különböztet meg, és a
 * teendő mind a háromnál más — ezért nem szabad őket egyetlen 500-asba
 * mosni. A HTTP-státusz ezt viszi tovább:
 *
 *   denied      → 403  jogosultsági kérdés, emberi döntés kell hozzá
 *   corrupt     → 409  a lánc sérült, mentésből kell visszaállítani
 *   unreadable  → 410  a kulcs megsemmisült — a törlés így néz ki
 */
import type { Registry } from "../core/registry.ts";
import type { CaseState, Lang } from "../core/types.ts";
import type { SecureCaseStore, Who } from "../core/store/biztonsagos.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { DerivationGraph } from "../core/derive/graph.ts";
import { caseView } from "./api.ts";
import type { CaseView } from "./api.ts";
import type { DocumentRegistry } from "../core/docs/registry.ts";
import {
  ertekelTorles, tanusitvany, visszavonasHatasa,
} from "../core/store/torles.ts";
import type {
  TorlesErtekeles, TorlesiRendelkezes, TorlesiTanusitvany, VisszavonasEredmeny,
} from "../core/store/torles.ts";

/** A tároló bukásfajtáiból HTTP-státusz — a teendő mindháromnál más. */
export const STATUS_BY_KIND: Record<"denied" | "corrupt" | "unreadable", number> = {
  denied: 403, corrupt: 409, unreadable: 410,
};

export interface StoreOk<T> { ok: true; status: 200; body: T }
export interface StoreErr {
  ok: false; status: number; kind: "denied" | "corrupt" | "unreadable";
  error: string;
}
export type StoreReply<T> = StoreOk<T> | StoreErr;

function hiba(kind: "denied" | "corrupt" | "unreadable", why: string): StoreErr {
  return { ok: false, status: STATUS_BY_KIND[kind], kind, error: why };
}

export interface CaseEnvelope extends CaseView {
  caseId: string;
  /** Hány naplóbejegyzésből áll az eset — a felület ezt mutatja. */
  entries: number;
  /** Mi alapján kapott jogot — a RÉTEG állítja elő, nem a hívó. */
  basis: string;
  /** Törésüveg-hozzáférés volt-e. A felületen ez nem apróbetűs. */
  breakGlass: boolean;
}

/**
 * EGY ESET BETÖLTÉSE ÉS MEGJELENÍTÉSE.
 *
 * A `recompute` a visszajátszott állapoton fut: a levezetett mezők nem a
 * naplóból jönnek, hanem a bemeneteikből — így egy képletjavítás után a régi
 * esetek is a helyes levezetést mutatják.
 */
export async function readCase(
  reg: Registry, store: SecureCaseStore, caseId: string, who: Who,
  lang: Lang = "hu", now = new Date().toISOString(),
): Promise<StoreReply<CaseEnvelope>> {
  const r = await store.read(caseId, who);
  if (!r.ok) return hiba(r.kind, r.why);

  const state = recompute(reg, { ...r.state, ctx: { ...r.state.ctx, now } });
  return {
    ok: true, status: 200,
    body: {
      ...caseView(reg, state, lang),
      caseId, entries: r.entries, basis: r.basis, breakGlass: r.breakGlass,
    },
  };
}

export interface WriteOutcome extends CaseEnvelope {
  /** Amit ez az írás átszámoltatott. */
  affected: string[];
  seq: number;
}

/**
 * EGY ÉRTÉK RÖGZÍTÉSE — a tárolón keresztül.
 *
 * KÉT KÜLÖNBÖZŐ ELUTASÍTÁS, és nem szabad összemosni őket:
 *
 *   · a JOGOSULTSÁGI elutasítás (`denied`) a tárolóé — audit sor keletkezik
 *     róla, és a hívó 403-at kap;
 *   · az ÉRVÉNYESSÉGI elutasítás (tartományon kívüli érték, levezetett mezőre
 *     írás, ismeretlen kód) a regiszteré — ez nem jogosultsági ügy, nem is
 *     hiba a kiszolgálón, hanem a felületnek megmutatandó üzenet.
 *
 * Az érvényességi ellenőrzés ELŐBB fut, mint a tárolóba írás: érvénytelen
 * érték nem kerülhet a naplóba, mert a napló utólag nem javítható.
 */
export async function writeValue(
  reg: Registry, store: SecureCaseStore, caseId: string, who: Who,
  req: { id: string; value: unknown; provenance?: string },
  lang: Lang = "hu", now = new Date().toISOString(),
): Promise<StoreReply<WriteOutcome> | { ok: false; status: 200; error: string }> {
  // 1. Beolvasás — ez egyben a jogosultság ellenőrzése is.
  const before = await store.read(caseId, who);
  if (!before.ok) return hiba(before.kind, before.why);

  // 2. ÉRVÉNYESSÉG. A regiszter szabályai a naplózás ELŐTT futnak le.
  let proba: CaseState;
  try {
    proba = setValue(reg, before.state, req.id, req.value as never, {
      provenance: (req.provenance ?? "clinician") as never,
    });
  } catch (e) {
    return { ok: false, status: 200, error: e instanceof Error ? e.message : String(e) };
  }
  const ertek = proba.values[reg.resolvePrimary(req.id)]?.slice(-1)[0];
  if (!ertek) {
    return { ok: false, status: 200, error: `A(z) ${req.id} írása nem keletkeztetett értéket.` };
  }

  // 3. ÍRÁS a tárolóba — innen a lánc, a titkosítás és az audit a tárolóé.
  const w = await store.write(caseId, who, [{
    op: "write", at: now, variableId: reg.resolvePrimary(req.id), value: ertek,
  }]);
  if (!w.ok) return hiba(w.kind, w.why);

  const utan = await readCase(reg, store, caseId, who, lang, now);
  if (!utan.ok) return utan;

  return {
    ok: true, status: 200,
    body: {
      ...utan.body,
      affected: new DerivationGraph(reg).impactOf(reg.resolvePrimary(req.id)),
      seq: w.seq,
    },
  };
}

/**
 * AZ ARCHÍVUM ÉPSÉGE — kulcs és olvasási jog nélkül.
 *
 * Az üzemeltetőnek és a mentésellenőrzőnek nincs joga a lelethez, de KELL
 * tudnia, hogy az archívum ép. Ez a végpont ezért nem kér olvasási jogot, és
 * nem is ad vissza semmit a tartalomból.
 */
export async function archiveHealth(
  store: SecureCaseStore, caseId: string,
): Promise<{ caseId: string; ok: boolean; entries: number; why: string }> {
  const r = await store.verifyArchive(caseId);
  return { caseId, ...r };
}


/* ── A DPO TÖRLÉSI FELÜLETE ─────────────────────────────────────────────── */

export interface TorlesKerelem {
  rendelkezes: TorlesiRendelkezes;
  /** Meg tudja-e semmisíteni a kulcstár a kulcsot. */
  kulcsMegsemmisitheto: boolean;
}

/**
 * MI TÖRTÉNNE — végrehajtás NÉLKÜL.
 *
 * A visszafordíthatatlan műveletet előbb meg kell tudni nézni. Ez a végpont
 * ugyanazokat a kapukat futtatja le, mint a végrehajtás, de semmit nem
 * változtat: a DPO látja az akadályokat, mindegyik mellett azzal, MI hárítaná
 * el, és látja, mi maradna meg utána.
 */
export function torlesElonezet(
  docs: DocumentRegistry, kerelem: TorlesKerelem, now = new Date().toISOString(),
): TorlesErtekeles {
  return ertekelTorles(kerelem.rendelkezes, {
    docs, kulcsMegsemmisitheto: kerelem.kulcsMegsemmisitheto, now,
  });
}

export interface TorlesEredmeny {
  tanusitvany: TorlesiTanusitvany;
  ertekeles: TorlesErtekeles;
}

/**
 * A TÖRLÉS VÉGREHAJTÁSA.
 *
 * KÉT FÜGGETLEN KAPU, és mindkettőnek nyitva kell lennie:
 *
 *   · a TÖRLÉSI kapuk (megőrzési kötelezettség, második aláíró, kulcstár) —
 *     ezekről a `core/store/torles.ts` dönt;
 *   · a JOGOSULTSÁGI kapu (ki rendelheti el egyáltalán) — erről a tároló.
 *
 * A sorrend nem cserélhető fel: az elutasított törlésről nem keletkezik
 * `delete` auditsor, mert nem is történt törlési kísérlet a tárolón — a
 * rendelkezés még a tároló előtt elakadt.
 */
export async function torlesVegrehajtas(
  store: SecureCaseStore, docs: DocumentRegistry, who: Who,
  kerelem: TorlesKerelem, now = new Date().toISOString(),
): Promise<StoreReply<TorlesEredmeny> | { ok: false; status: 409; ertekeles: TorlesErtekeles }> {
  const ertekeles = torlesElonezet(docs, kerelem, now);
  if (!ertekeles.vegrehajthato) {
    // 409: a kérés önmagában érvényes, az ÁLLAPOT nem engedi. Nem 403, mert
    // nem jogosultsági kérdés — a DPO-nak van joga, csak az eset nem törölhető.
    return { ok: false, status: 409, ertekeles };
  }
  const r = await store.destroyKey(
    kerelem.rendelkezes.caseId, who,
    `${kerelem.rendelkezes.jogalap} — ${kerelem.rendelkezes.indoklas}`,
  );
  if (!r.ok) return hiba(r.kind, r.why);

  return {
    ok: true, status: 200,
    body: {
      tanusitvany: tanusitvany(kerelem.rendelkezes, r.entries, now),
      ertekeles,
    },
  };
}

/**
 * A KUTATÁSI HOZZÁJÁRULÁS VISSZAVONÁSÁNAK HATÁSA.
 *
 * Ez az, ami a beteg kérésére MOST IS teljesíthető — és amit a törlés helyett
 * fel kell ajánlani, ha az elakad a megőrzési kötelezettségen.
 */
export function visszavonasElonezet(
  docs: DocumentRegistry, caseId: string,
): VisszavonasEredmeny {
  return visszavonasHatasa(caseId, docs);
}
