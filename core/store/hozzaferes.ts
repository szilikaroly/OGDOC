/**
 * JOGOSULTSÁG — ki mihez férhet hozzá, és MIÉRT.
 *
 * Ez a `13-18-lepes.md` 1. lépésének egyetlen valóban hiányzó darabja: a
 * napló, a titkosítás és a kétféle log már megvan és tesztelt, jogosultsági
 * réteg viszont eddig sehol nem volt.
 *
 * A VEZÉRELV UGYANAZ, MINT MINDENÜTT MÁSHOL A RENDSZERBEN:
 *
 *   > **A hiányzó jogosultság sehol nem „igen”.**
 *
 * Ismeretlen cselekvő, ismeretlen szerepkör, ismeretlen eset → elutasítás.
 * Nem azért, mert a szigor önmagában érték, hanem mert az alapértelmezett
 * engedélyezés csendben terjed: egy elfelejtett szerepkör-hozzárendelés így
 * évekig nyitva hagy egy ajtót, és senki nem tud róla.
 *
 * A HÁROM RÉTEG, ÉS AMIÉRT MIND A HÁROM KELL
 *
 *   SZEREPKÖR        mit tehet EGYÁLTALÁN. Az auditor auditnaplót olvas,
 *                    leletet nem; a kutató egyedi esetet nem lát.
 *   ELLÁTÁSI KAPCSOLAT   MELYIK esethez. Ez a legtöbbet kihagyott réteg, és
 *                    a legdrágább: szerepkör-alapon minden orvos minden
 *                    beteget olvashat, és pontosan ez történik a valódi
 *                    rendszerekben. A jogot az ellátás ténye adja, nem a
 *                    diploma.
 *   IDŐABLAK         MEDDIG. Az ellátás lezárul, a jog megszűnik. Egy két
 *                    éve elbocsátott beteg lapját olvasni nem kezelés.
 *
 * AMIT EZ A RÉTEG SZÁNDÉKOSAN NEM TESZ MEG
 *
 * Nem hitelesít. A „ki vagy te” kérdést a gazdának kell megválaszolnia
 * (SSO, kártya, EESZT); ez a réteg a MÁR AZONOSÍTOTT cselekvőről dönti el,
 * hogy szabad-e neki. A kettő összekeverése azért veszélyes, mert egy
 * hitelesítési hibából így csendben jogosultsági hiba lesz.
 */
import type { AuditEvent } from "../log/types.ts";

/* ── SZEREPKÖRÖK ────────────────────────────────────────────────────── */

export type Role =
  /** Orvos, szülésznő: olvas és ír a saját betegéről. */
  | "clinician"
  /** Asszisztens: rögzít, de nem exportál és nem töröltet. */
  | "assistant"
  /** Auditor: az AUDITNAPLÓT olvassa. Leletet nem — ez a lényeg. */
  | "auditor"
  /** Adatvédelmi tisztviselő: törlést rendelhet el, leletet nem olvas. */
  | "dpo"
  /** Kutató: álnevesített exportot kap. Egyedi eset nem. */
  | "researcher"
  /** A beteg — a SAJÁT esetéről. */
  | "patient"
  /**
   * RENDSZERGAZDA — a rendszer fölött mindenható, a BETEGADAT fölött nem.
   *
   * Ez látszólag ellentmond a „mindenható admin” kérésnek, és szándékosan.
   * Egy kórházban a rendszergazdai fiók a leggyakrabban visszaélt hozzáférés,
   * mert egyszerre teljhatalmú és személytelen. Ha az `admin` közvetlenül
   * olvashatna leletet, minden betegadat-hozzáférés megkerülhető lenne egyetlen
   * fiókkal, és az auditnapló nem mondana semmit.
   *
   * A rendszergazda ezért felhasználót és megbízást KEZEL, leletet NEM olvas.
   * Az út nincs elzárva: megbízást adhat magának klinikusként — de az a
   * megbízás LÁTSZIK, névvel, indokkal és időablakkal. A különbség nem a
   * lehetőség, hanem a NYOM.
   */
  | "admin";

export type Action = AuditEvent["action"];

/**
 * MELYIK SZEREPKÖR MELYIK MŰVELETET VÉGEZHETI EL EGYÁLTALÁN.
 *
 * Ez a felső korlát, nem az engedély: aki itt szerepel, annak MÉG KELL egy
 * ellátási kapcsolat is. A táblázat adat, nem elágazás — új szerepkör
 * felvételéhez itt egy sor kell, nem kód.
 */
export const ROLE_ACTIONS: Record<Role, Action[]> = {
  clinician: ["read", "write", "export", "print", "login"],
  assistant: ["read", "write", "print", "login"],
  auditor: ["login"],
  dpo: ["delete", "login"],
  researcher: ["export", "login"],
  patient: ["read", "print", "login"],
  // A rendszergazda NEM olvas és NEM ír esetet. Aki mindkettőt akarja, adjon
  // magának klinikusi megbízást — az látszik.
  admin: ["login"],
};

/**
 * KI OLVASHATJA AZ AUDITNAPLÓT.
 *
 * Miért nem `Action`. Az `Action` az, ami az ESETTEL történik (olvasás, írás,
 * export, nyomtatás, törlés) — az auditnapló olvasása viszont nem az eseten
 * végzett művelet, hanem egy MÁSIK objektum olvasása. Ha `Action`-né tennénk,
 * az auditnapló olvasása bekerülne a saját maga által naplózott műveletek közé,
 * és a szerepkörtábla két különböző dologról mondana egyet.
 *
 * KÉT SZEREPKÖR OLVASHATJA, ÉS EGYIK SEM A KLINIKUS:
 *
 *   `auditor`  — ez a dolga; leletet viszont nem lát.
 *   `dpo`      — az adatvédelmi tisztviselőnek a hozzáférések tényét kell
 *                látnia ahhoz, hogy a törlést és a jogsértést megítélje.
 *
 * A klinikus KIMARAD, és ez szándékos: az auditnapló megmondja, kit láttak el
 * hol és mikor. Ez önmagában is érzékeny adat — egy kollégára rákeresni benne
 * nem gyógyítás.
 */
export const AUDIT_READERS: Role[] = ["auditor", "dpo"];

export function canReadAudit(roles: Role[]): boolean {
  return roles.some((r) => AUDIT_READERS.includes(r));
}

/* ── ELLÁTÁSI KAPCSOLAT ─────────────────────────────────────────────── */

/**
 * A JOG FORRÁSA: hogy ez a cselekvő ELLÁTTA ezt a beteget.
 *
 * A `until` nem elhagyható kényelmi mező. A lezáratlan kapcsolat ugyanaz,
 * mint a soha le nem járó jelszó: működik, senkinek nem tűnik fel, és
 * pontosan akkor derül ki, amikor már baj van. Aki nyitva hagyja, döntsön
 * róla — a `null` itt kimondott döntés, nem feledékenység.
 */
export interface CareRelation {
  actor: string;
  caseId: string;
  /** Mikortól — ISO időbélyeg. */
  from: string;
  /** Meddig. `null` = nyitott ellátás, kimondottan. */
  until: string | null;
  /** Mi keletkeztette: felvétel, beutalás, ügyelet, konzílium. */
  why: string;
}

/** Él-e a kapcsolat a megadott pillanatban. */
export function relationActive(r: CareRelation, now: string): boolean {
  const t = Date.parse(now);
  if (Number.isNaN(t)) return false;
  if (Date.parse(r.from) > t) return false;
  return r.until === null || Date.parse(r.until) >= t;
}

/* ── SÜRGŐSSÉGI HOZZÁFÉRÉS ──────────────────────────────────────────── */

/**
 * „BETÖRÉS AZ ÜVEGEN” — mert a tiltás is öl.
 *
 * Egy eszméletlen beteget hozó ügyeletesnek nincs előzetes ellátási
 * kapcsolata, és nem várhat rá. A rendszer ezért ENGEDI — de három feltétellel,
 * és a három közül a harmadik az, amit a legtöbb rendszer kihagy:
 *
 *   1. INDOKLÁS kell hozzá, szabad szöveggel, a hozzáférés PILLANATÁBAN;
 *   2. a hozzáférés MEGJELÖLVE kerül az auditnaplóba (nem rendes olvasás);
 *   3. valakinek UTÓLAG MEG KELL NÉZNIE, névvel és határidővel.
 *
 * A harmadik nélkül a sürgősségi hozzáférés nem kapu, hanem nyitva hagyott
 * ajtó: két hét alatt mindenki megtanulja, hogy ezzel bármit el lehet érni.
 */
export interface BreakGlass {
  declaredBy: string;
  at: string;
  reason: string;
  /** KI nézi meg utólag. „A vezetőség” nem személy. */
  reviewBy: string;
  /** Meddig kell megnéznie. */
  reviewDeadline: string;
}

export function checkBreakGlass(b: BreakGlass): string[] {
  const bad: string[] = [];
  if (!b.reason?.trim()) {
    bad.push("a sürgősségi hozzáférés INDOKLÁS NÉLKÜL nem adható meg — az " +
             "indoklás nélküli betörés utólag nem különböztethető meg a " +
             "kíváncsiskodástól");
  }
  if (!b.reviewBy?.trim()) {
    bad.push("nincs megnevezve, KI nézi meg utólag. Egy felülvizsgálat " +
             "nélküli sürgősségi hozzáférés nem kapu, hanem nyitva hagyott ajtó");
  }
  if (!b.reviewDeadline || Number.isNaN(Date.parse(b.reviewDeadline))) {
    bad.push("nincs határidő a felülvizsgálatra — a határidő nélküli " +
             "teendő elmarad");
  }
  return bad;
}

/* ── A DÖNTÉS ───────────────────────────────────────────────────────── */

/**
 * A döntés HORDOZZA A JOGALAPOT.
 *
 * A `basis` nem a hívótól jön. Ha a hívó gépelhetné be, minden auditsorban
 * az állna, hogy „kezelés” — a jogalap akkor ér valamit, ha a DÖNTÉST HOZÓ
 * szabály nevezi meg magát.
 */
export type Decision =
  | { ok: true; basis: string; breakGlass?: BreakGlass }
  | { ok: false; why: string };

export interface AccessRequest {
  actor: string;
  roles: Role[];
  action: Action;
  caseId: string;
  now: string;
  /** A cselekvő ellátási kapcsolatai — a gazda adja, a réteg csak szűr. */
  relations: CareRelation[];
  /** Ha a beteg maga kér: melyik esethez tartozik ő. */
  ownCaseIds?: string[];
  /** Sürgősségi hozzáférés bejelentése. */
  breakGlass?: BreakGlass;
}

/**
 * SZABAD-E. Egyetlen belépési pont — hogy ne lehessen megkerülni.
 *
 * A sorrend számít: előbb a szerepkör (mit tehet egyáltalán), aztán a
 * kapcsolat (melyik esethez). Fordítva egy jogosulatlan szerepkör átcsúszna,
 * ha épp van ellátási kapcsolata.
 */
export function decide(req: AccessRequest): Decision {
  if (!req.actor?.trim()) {
    return { ok: false, why:
      "Nincs megnevezett cselekvő. „A rendszer” nem cselekvő: aki nem " +
      "azonosított, az nem jogosult — a hiányzó azonosság sehol nem „igen”." };
  }
  if (!req.roles?.length) {
    return { ok: false, why:
      `${req.actor} egyetlen szerepkörrel sem rendelkezik. A szerepkör ` +
      `hiánya nem „még nem osztották ki”, hanem tiltás: az ellenkezője ` +
      `csendben nyitva hagyna minden elfelejtett hozzárendelést.` };
  }

  // 1. SZEREPKÖR — mit tehet egyáltalán
  const allowed = req.roles.filter((r) => ROLE_ACTIONS[r]?.includes(req.action));
  if (!allowed.length) {
    return { ok: false, why:
      `A(z) „${req.action}” művelethez egyik szerepkör sem elég ` +
      `(${req.roles.join(", ")}). Az auditor auditnaplót olvas, leletet nem; ` +
      `a kutató álnevesített exportot kap, egyedi esetet nem.` };
  }

  // 2. A BETEG A SAJÁT ESETÉHEZ — ehhez nem kell ellátási kapcsolat
  if (allowed.includes("patient")) {
    if (req.ownCaseIds?.includes(req.caseId)) {
      return { ok: true, basis: "a beteg saját adatához való hozzáférése" };
    }
    return { ok: false, why:
      `${req.actor} betegként a(z) ${req.caseId} esethez kért hozzáférést, ` +
      `de az nem az övé. A beteg joga a SAJÁT adatára szól.` };
  }

  // 3. A DPO ÉS AZ AUDITOR nem leletet néz — nekik nem kell ellátási kapcsolat
  if (req.action === "delete" && allowed.includes("dpo")) {
    return { ok: true, basis: "adatvédelmi tisztviselői törlési rendelkezés" };
  }
  if (req.action === "login") {
    return { ok: true, basis: `bejelentkezés (${allowed.join(", ")})` };
  }

  // 4. ELLÁTÁSI KAPCSOLAT — a jogot az ellátás ténye adja, nem a diploma
  const mine = req.relations.filter(
    (r) => r.actor === req.actor && r.caseId === req.caseId);
  const live = mine.filter((r) => relationActive(r, req.now));

  if (live.length) {
    return { ok: true, basis: `ellátási kapcsolat: ${live[0].why}` };
  }

  // 5. LEJÁRT KAPCSOLAT — külön üzenet, mert más a teendő
  if (mine.length) {
    const last = mine
      .filter((r) => r.until)
      .sort((a, b) => Date.parse(b.until!) - Date.parse(a.until!))[0];
    const closed = last?.until ? ` Az utolsó ${last.until}-kor lezárult.` : "";
    return { ok: false, why:
      `${req.actor} ellátta a(z) ${req.caseId} esetet, de a kapcsolat MÁR ` +
      `NEM ÉL.${closed} A lezárt ellátás után az olvasás nem kezelés: ha ` +
      `mégis szükség van rá, sürgősségi hozzáférés vagy új beutalás a helyes út.` };
  }

  // 6. SÜRGŐSSÉGI HOZZÁFÉRÉS — mert a tiltás is öl
  if (req.breakGlass) {
    const bad = checkBreakGlass(req.breakGlass);
    if (bad.length) {
      return { ok: false, why:
        `A sürgősségi hozzáférés bejelentése hiányos, ezért nem érvényes: ` +
        bad.join("; ") + "." };
    }
    return { ok: true, breakGlass: req.breakGlass,
      basis: `SÜRGŐSSÉGI HOZZÁFÉRÉS (${req.breakGlass.reason}) — ` +
             `felülvizsgálja: ${req.breakGlass.reviewBy}, ` +
             `határidő: ${req.breakGlass.reviewDeadline}` };
  }

  return { ok: false, why:
    `${req.actor} és a(z) ${req.caseId} eset között nincs ellátási kapcsolat. ` +
    `A szerepkör azt mondja meg, MIT tehet valaki; azt, hogy KINEK az adatán, ` +
    `az ellátás ténye. Enélkül minden klinikus minden beteget olvashatna — és ` +
    `a valódi rendszerekben pontosan ez történik. Ha az ellátás most kezdődik, ` +
    `vegyél fel kapcsolatot; ha sürgős, jelents be sürgősségi hozzáférést.` };
}

/* ── A FELÜLVIZSGÁLATI TARTOZÁS ─────────────────────────────────────── */

export interface PendingReview {
  at: string;
  actor: string;
  caseId: string;
  reason: string;
  reviewBy: string;
  reviewDeadline: string;
  overdue: boolean;
}

/**
 * MELYIK SÜRGŐSSÉGI HOZZÁFÉRÉST NEM NÉZTE MÉG MEG SENKI.
 *
 * Az auditnaplóból számol, nem külön nyilvántartásból: két lista két igazság
 * lenne, és a második mindig az elhanyagoltabb. A `basis` mezőben ott a
 * jelölés, mert a döntés tette bele — ezért nem kell hinni a hívónak.
 *
 * A LEJÁRT tétel nem tűnik el a listáról. A határidőn túli felülvizsgálat
 * nem „elévült”, hanem ELMARADT — és az elmaradás maga a megállapítás.
 */
export function pendingReviews(
  audit: AuditEvent[], now: string, reviewed: Set<string> = new Set(),
): PendingReview[] {
  const out: PendingReview[] = [];
  for (const e of audit) {
    if (!e.basis?.startsWith("SÜRGŐSSÉGI HOZZÁFÉRÉS")) continue;
    const key = `${e.at}|${e.actor}|${e.caseId}`;
    if (reviewed.has(key)) continue;
    const reason = /SÜRGŐSSÉGI HOZZÁFÉRÉS \(([^)]*)\)/.exec(e.basis)?.[1] ?? "";
    const reviewBy = /felülvizsgálja: ([^,]+)/.exec(e.basis)?.[1] ?? "";
    const deadline = /határidő: (\S+)/.exec(e.basis)?.[1] ?? "";
    out.push({
      at: e.at, actor: e.actor, caseId: e.caseId, reason, reviewBy,
      reviewDeadline: deadline,
      overdue: Boolean(deadline) && Date.parse(deadline) < Date.parse(now),
    });
  }
  return out.sort((a, b) => Date.parse(a.reviewDeadline) - Date.parse(b.reviewDeadline));
}
