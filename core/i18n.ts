/**
 * NYELVEK — és a szabály, ami miatt ez nem egy `??` operátor.
 *
 * A rendszer 846 változójából ma 30-nak van angol címkéje. Ha a felület
 * nyelvváltásnál csendben visszaesne a magyarra, a felhasználó **angol
 * felületet látna magyar tartalommal**, és nem tudná, melyik szó melyik —
 * pont az a néma helyettesítés, amit a rendszer minden más ponton tilt.
 *
 * HÁROM SZINT, ÉS A KETTŐ KÖZÖTTI KÜLÖNBSÉG A LÉNYEG:
 *
 *   FELÜLETI SZÖVEG   gombok, fejlécek, állapotnevek. A MIÉNK, tehát
 *                     lefordítjuk. Hiányzó kulcs = build-hiba.
 *   KLINIKAI TARTALOM változónevek, leletszövegek, javaslatok. Ezek
 *                     SZAKMAI SZÖVEGEK: a rögtönzött fordítás nem
 *                     ugyanaz a fogalom. Ha nincs meg a célnyelven, a
 *                     forrásnyelvi alak jelenik meg — MEGJELÖLVE.
 *   MÉRŐESZKÖZ        validált kérdőívek tételszövege. Itt a fordítás
 *                     LICENC és eljárás kérdése: nem jelenik meg
 *                     rögtönzött alakban, sehogy.
 *
 * A második szint az, amit a legtöbb rendszer elront. Egy „Cervix length"
 * helyett megjelenő „Cervix hossza” nem hiba — az a HELYES viselkedés,
 * feltéve, hogy a felhasználó LÁTJA, hogy ez nem fordítás.
 */
import type { I18n, Lang } from "./types.ts";

export const LANGS: Lang[] = ["hu", "en"];
export const SOURCE_LANG: Lang = "hu";

export interface Picked {
  text: string;
  /** Melyik nyelven van, amit visszaadtunk. */
  lang: Lang;
  /** Igaz, ha NEM a kért nyelven — a felületnek ezt jelölnie kell. */
  fallback: boolean;
}

/**
 * A KÉRT NYELV, VAGY A FORRÁSNYELV — MEGJELÖLVE.
 *
 * Nem `??`-lánc, mert az elrejti, hogy fordítás történt-e. A hívó eldöntheti,
 * hogy a jelölést megmutatja-e; azt nem döntheti el, hogy megtudja-e.
 */
export function pick(x: I18n | undefined, lang: Lang): Picked {
  const want = x?.[lang];
  if (want) return { text: want, lang, fallback: false };
  const src = x?.[SOURCE_LANG];
  if (src) return { text: src, lang: SOURCE_LANG, fallback: true };
  for (const l of LANGS) {
    const any = x?.[l];
    if (any) return { text: any, lang: l, fallback: true };
  }
  return { text: "", lang, fallback: false };
}

/** Csak a szöveg — ott, ahol a jelölésnek nincs helye (napló, összehasonlítás). */
export function L(x: I18n | undefined, lang: Lang = SOURCE_LANG): string {
  return pick(x, lang).text;
}

/* ── A FELÜLET SAJÁT SZÖVEGEI ───────────────────────────────────────── */

/**
 * EZ A MIÉNK, TEHÁT LEFORDÍTJUK.
 *
 * Nem klinikai tartalom: gombok, állapotnevek, fejlécek. Itt a hiányzó
 * fordítás nem „forrásnyelvi alak", hanem HIBA — a `missingUiStrings()`
 * kimutatja, és a teszt bukik rá.
 */
export const UI: Record<string, I18n> = {
  // ── navigátor és modulfejléc ─────────────────────────────────────────
  "nav.title":      { hu: "Modulok", en: "Modules" },
  "nav.search":     { hu: "Keresés a mezők között", en: "Search fields" },
  "nav.searchHint": { hu: "Címke vagy azonosító — a találatot tartalmazó modul kinyílik",
                      en: "Label or identifier — modules with matches open" },
  "nav.results":    { hu: "{n} találat {m} modulban", en: "{n} matches in {m} modules" },
  "nav.noResults":  { hu: "Nincs találat", en: "No matches" },
  "nav.expandAll":  { hu: "Mind kinyit", en: "Expand all" },
  "nav.collapseAll":{ hu: "Mind becsuk", en: "Collapse all" },
  "nav.open":       { hu: "Modulok megnyitása", en: "Open modules" },
  "mod.filled":     { hu: "{n} / {m} kitöltve", en: "{n} / {m} filled" },
  "mod.fields":     { hu: "{m} mező", en: "{m} fields" },
  "mod.keyExplain": { hu: "A modul kulcsa a regiszterben", en: "The module key in the register" },
  "mod.titleFallback": {
    hu: "Ennek a modulnak nincs címe a regiszterben — a nyers kulcs látszik.",
    en: "This module has no title in the register — the raw key is shown." },
  "assist.title":   { hu: "Segéd", en: "Assist" },
  "app.statusGate": { hu: "Éles üzem", en: "Production gate" },
  "app.title":            { hu: "OGDOC — klinikai mag", en: "OGDOC — clinical core" },
  "app.lang":             { hu: "Nyelv", en: "Language" },
  "app.sourceMarker":     { hu: "forrásnyelvi", en: "source language" },
  "app.sourceExplain": {
    hu: "Ez a szöveg nincs lefordítva a választott nyelvre. A forrásnyelvi " +
        "alak jelenik meg — a rendszer nem fordít gépileg klinikai szöveget.",
    en: "This text has not been translated into the selected language. The " +
        "source-language form is shown — the system does not machine-translate " +
        "clinical text.",
  },

  "app.reset":            { hu: "Eset ürítése", en: "Clear case" },

  /* ── HITELESÍTÉS ─────────────────────────────────────────────────── */
  "auth.gateLoading":     { hu: "A kapu állapota betöltés alatt…",
                            en: "Loading gate status…" },
  "auth.signIn":          { hu: "Bejelentkezés", en: "Sign in" },
  "auth.username":        { hu: "Felhasználónév", en: "Username" },
  "auth.password":        { hu: "Jelszó", en: "Password" },
  "auth.signInButton":    { hu: "Belépés", en: "Sign in" },
  "auth.signOut":         { hu: "Kilépés", en: "Sign out" },
  "auth.admin":           { hu: "Admin", en: "Admin" },
  "auth.mustChange":      { hu: "Jelszót cserélni kell", en: "Password change required" },
  "auth.mustChangeWhy": {
    hu: "Ez a jelszó kiosztott vagy alapértelmezett. Amíg érvényben van, a fiók " +
        "annyit ér, amennyit a kiosztás csatornája. A rendszer nem kér nagybetűt " +
        "és számot — HOSSZÚT kér: legalább 12 karaktert, és egy négyszavas " +
        "jelmondat erősebb, mint a „Jelszo1!”.",
    en: "This password was issued or is the default. While it stands, the account " +
        "is worth exactly what the channel that issued it was worth. The system " +
        "does not ask for capitals and digits — it asks for LENGTH: at least 12 " +
        "characters, and a four-word passphrase beats „Passw0rd!”.",
  },
  "auth.currentPassword": { hu: "Jelenlegi jelszó", en: "Current password" },
  "auth.newPassword":     { hu: "Új jelszó", en: "New password" },
  "auth.change":          { hu: "Csere", en: "Change" },
  "auth.noAssignment":    { hu: "nincs élő megbízás", en: "no live assignment" },
  "auth.openEnded":       { hu: "nyitott", en: "open-ended" },
  "auth.until":           { hu: "-ig", en: " until" },
  "auth.places":          { hu: "hely", en: "places" },
  "auth.defaultStands": {
    hu: "Az „admin” fiók jelszava még mindig „admin” — az első dolgod a csere.",
    en: "The „admin” account still has the password „admin” — change it first.",
  },

  /* ── ADMIN PANEL ─────────────────────────────────────────────────── */
  "admin.title":          { hu: "Adminisztráció", en: "Administration" },
  "admin.close":          { hu: "Bezár", en: "Close" },
  "admin.intro": {
    hu: "A rendszergazda felhasználót és megbízást kezel — LELETET NEM OLVAS. Ha " +
        "klinikai hozzáférés kell, adj magadnak klinikusi megbízást: az látszik, " +
        "névvel, indokkal és időablakkal. A különbség nem a lehetőség, hanem a nyom.",
    en: "The administrator manages users and assignments — and does NOT read " +
        "records. If clinical access is needed, grant yourself a clinician " +
        "assignment: it shows, with a name, a reason and a time window. The " +
        "difference is not the possibility but the trace.",
  },
  "admin.users":          { hu: "Felhasználók", en: "Users" },
  "admin.assignments":    { hu: "Megbízások", en: "Assignments" },
  "admin.sessions":       { hu: "Élő munkamenetek", en: "Live sessions" },
  "admin.newUser":        { hu: "Új felhasználó", en: "New user" },
  "admin.grant":          { hu: "Megbízás adása", en: "Grant assignment" },
  "admin.name":           { hu: "Név", en: "Name" },
  "admin.loginName":      { hu: "Belépőnév", en: "Login name" },
  "admin.provider":       { hu: "Szolgáltató", en: "Provider" },
  "admin.state":          { hu: "Állapot", en: "State" },
  "admin.lastLogin":      { hu: "Utolsó belépés", en: "Last sign-in" },
  "admin.lock":           { hu: "Zárol", en: "Lock" },
  "admin.unlock":         { hu: "Felold", en: "Unlock" },
  "admin.create":         { hu: "Létrehoz", en: "Create" },
  "admin.initialPassword": { hu: "Kezdő jelszó (min. 12)", en: "Initial password (min. 12)" },
  "admin.issuedMustChange": {
    hu: "A kiosztott jelszót a felhasználónak cserélnie kell az első belépéskor.",
    en: "The issued password must be changed by the user at first sign-in.",
  },
  "admin.who":            { hu: "Ki", en: "Who" },
  "admin.group":          { hu: "Csoport", en: "Group" },
  "admin.scope":          { hu: "Hatókör", en: "Scope" },
  "admin.from":           { hu: "Mettől", en: "From" },
  "admin.to":             { hu: "Meddig", en: "To" },
  "admin.source":         { hu: "Forrás", en: "Source" },
  "admin.grantedBy":      { hu: "Adta / miért", en: "Granted by / why" },
  "admin.revoke":         { hu: "Visszavon", en: "Revoke" },
  "admin.live":           { hu: "él", en: "live" },
  "admin.notLive":        { hu: "nem él", en: "not live" },
  "admin.why":            { hu: "Miért", en: "Why" },
  "admin.whyPlaceholder": { hu: "pl. délelőttös műszak, szülőszoba",
                            en: "e.g. morning shift, delivery ward" },
  "admin.manual":         { hu: "kézi", en: "manual" },
  "admin.roster":         { hu: "beosztás (műszak)", en: "roster (shift)" },
  "admin.timeBound": {
    hu: "Ez a csoport MŰSZAKHOZ KÖTÖTT: a „meddig” kötelező. A műszaknak van vége, a jognak vele.",
    en: "This group is SHIFT-BOUND: the end time is required. The shift ends, and the right with it.",
  },
  "admin.notTimeBound": {
    hu: "Ennél a csoportnál a nyitott időablak megengedett — de akkor kimondottan.",
    en: "An open-ended window is permitted for this group — but then it must be stated.",
  },
  "admin.lockReason": {
    hu: "Miért zárolod? Indoklás nélkül utólag nem különböztethető meg a fegyelmi intézkedés az elgépeléstől.",
    en: "Why are you locking this account? Without a reason a disciplinary action cannot later be told apart from a typo.",
  },
  "admin.mustChangeFlag": { hu: "jelszót cserélni", en: "must change password" },
  "admin.sessionStart":   { hu: "Kezdet", en: "Started" },
  "admin.lastActivity":   { hu: "Utolsó tevékenység", en: "Last activity" },
  "admin.problems":       { hu: "gond a megbízásokban", en: "problems in assignments" },
  "admin.none":           { hu: "nincs", en: "none" },
  "admin.liveOf":         { hu: "ebből él", en: "of which live" },
  "admin.gateLive":       { hu: "Éles üzem", en: "Production readiness" },
  "app.actor":            { hu: "Cselekvő", en: "Actor" },
  "app.case":             { hu: "Eset", en: "Case" },
  "app.entries":          { hu: "bejegyzés", en: "entries" },
  "app.basis":            { hu: "jogalap", en: "basis" },
  "app.pickActor":        { hu: "— válassz cselekvőt —", en: "— choose an actor —" },

  "dpo.title":            { hu: "Törlési rendelkezés", en: "Deletion order" },
  "dpo.intro": {
    hu: "A törlés visszafordíthatatlan. Előbb nézd meg, mi történne — és mi az, " +
        "ami helyette most is teljesíthető.",
    en: "Deletion is irreversible. First see what would happen — and what can " +
        "be done instead, today.",
  },
  "dpo.preview":          { hu: "Mi történne?", en: "What would happen?" },
  "dpo.revoke":           { hu: "Kutatási hozzájárulás visszavonása", en: "Withdraw research consent" },
  "dpo.blocked":          { hu: "A törlés nem hajtható végre", en: "Deletion cannot proceed" },
  "dpo.remedy":           { hu: "Mi hárítaná el", en: "What would clear it" },
  "dpo.ends":             { hu: "Megszűnik", en: "Ends" },
  "dpo.stays":            { hu: "Marad", en: "Stays" },
  "form.title":           { hu: "Űrlap", en: "Form" },
  "form.generated":       { hu: "a regiszterből generálva", en: "generated from the registry" },
  "form.confirmPending":  { hu: "Megerősítésre vár", en: "Awaiting confirmation" },
  "form.section":         { hu: "Szakasz", en: "Section" },
  "form.field":           { hu: "Mező", en: "Field" },
  "form.unit":            { hu: "Mértékegység", en: "Unit" },
  "form.value":           { hu: "Érték", en: "Value" },
  "form.save":            { hu: "Mentés", en: "Save" },
  "form.saved":           { hu: "Mentve", en: "Saved" },
  "form.notSaved":        { hu: "Még nincs tartósan mentve", en: "Not durably saved yet" },
  "form.openDoc":         { hu: "Dokumentáció megnyitása", en: "Open documentation" },
  "form.confirm":         { hu: "Megerősítem", en: "Confirm" },
  "form.accept":          { hu: "Elfogadom", en: "Accept" },
  "form.suggestion":      { hu: "Javaslat", en: "Suggestion" },
  "form.suggestionNote": {
    hu: "Javaslat a korábbi adatból — amíg el nem fogadod, nem adat.",
    en: "Suggested from earlier data — until you accept it, it is not data.",
  },

  "finding.normal":       { hu: "Eltérés nélkül", en: "No abnormality" },
  "finding.abnormal":     { hu: "Eltérés", en: "Abnormality" },
  "finding.limited":      { hu: "Korlátozott vizsgálat", en: "Limited examination" },
  "finding.impossible":   { hu: "Nem vizsgálható", en: "Not examinable" },
  "finding.omitted":      { hu: "Kimaradt", en: "Not examined" },
  "finding.refused":      { hu: "A beteg elutasította", en: "Patient declined" },

  "calc.insufficient":    { hu: "Nem számolható", en: "Cannot be computed" },
  "calc.gated":           { hu: "Kapu mögött", en: "Behind a gate" },
  "calc.missing":         { hu: "Ehhez hiányzik", en: "Missing for this" },
  "calc.source":          { hu: "Forrás", en: "Source" },
  "calc.clinicianNote": {
    hu: "A számítás a klinikus mellé áll, nem helyette.",
    en: "The calculation stands beside the clinician, never instead.",
  },

  "out.patient":          { hu: "A betegnek", en: "For the patient" },
  "out.clinician":        { hu: "A klinikusnak", en: "For the clinician" },
  "out.why":              { hu: "Miért", en: "Why" },
  "out.trigger":          { hu: "Kiváltó mező", en: "Triggering field" },

  "queue.title":          { hu: "Munkalista", en: "Work queue" },
  "queue.outstanding":    { hu: "Kintlévő lelet", en: "Outstanding result" },
  "queue.age":            { hu: "Kora", en: "Age" },
  "queue.empty":          { hu: "Nincs elintézetlen tétel.", en: "Nothing outstanding." },

  /* ── a csontváz felületének minden LÁTHATÓ szövege ───────────────── */

  "app.subtitle":         { hu: "webes réteg", en: "web layer" },
  "app.warning": {
    hu: "Perzisztencia, jogosultság és auditnapló: ÉLES. HITELESÍTÉS: NINCS — a " +
        "cselekvőt egy kérésfejléc állítja, és azt senki nem ellenőrzi. Ezért " +
        "kizárólag szintetikus adattal futtatható.",
    en: "Persistence, authorization and the audit log are REAL. AUTHENTICATION: " +
        "NONE — the actor is set by a request header that nobody verifies. " +
        "Synthetic data only.",
  },
  "app.langHu":           { hu: "Magyar", en: "Hungarian" },
  "app.langEn":           { hu: "Angol", en: "English" },

  "form.confirmNote": {
    hu: "A beteg adta meg a felvételkor. Döntés megerősítés nélkül nem épülhet rá.",
    en: "Entered by the patient at intake. No decision may rest on it unconfirmed.",
  },
  "form.affectsAfterConfirm": {
    hu: "megerősítés után hat:", en: "affects once confirmed:",
  },
  "form.suggestionSource": { hu: "forrás:", en: "source:" },
  "form.rejected":        { hu: "A rendszer elutasította", en: "Rejected by the system" },

  "tag.phi":              { hu: "phi — exportból kimarad", en: "phi — excluded from exports" },
  "tag.finding":          { hu: "alapból csukva — csak kórosnál nyílik",
                            en: "collapsed by default — opens only when abnormal" },
  "tag.patientEntry":     { hu: "a beteg tölti ki", en: "filled in by the patient" },
  "tag.derived":          { hu: "levezetett", en: "derived" },
  "tag.prefillable":      { hu: "előtölthető", en: "can be pre-filled" },

  /**
   * EGY MONDAT, HELYŐRZŐKKEL — nem három darab összefűzve. A magyar és az
   * angol szórend nem azonos („összesen 834” vs „834 in total”), és a
   * darabokból ragasztott mondat pont ezen bukik el.
   */
  "effort.summary": {
    hu: "{touched} megérintett mező · {hidden} rejtve, mert a lelet normális · összesen {total}",
    en: "{touched} fields touched · {hidden} hidden because the finding is normal · {total} in total",
  },

  "out.patientTitle":     { hu: "A betegnek szóló tájékoztató",
                            en: "The patient-facing summary" },
  "out.patientNote":      { hu: "Generált szöveg — a normális leletről is.",
                            en: "Generated text — including for a normal finding." },
  "out.triggeredBy":      { hu: "kiváltotta:", en: "triggered by:" },

  "calc.title":           { hu: "Kalkulátorok", en: "Calculators" },
  "calc.note": {
    hu: "Hiányzó bemenetnél nem nullát mutat, hanem megmondja, mi hiányzik.",
    en: "On a missing input it shows no zero — it names what is missing.",
  },
  "calc.waitingFor":      { hu: "vár:", en: "waiting for:" },
  "calc.missingPrefix":   { hu: "hiányzik:", en: "missing:" },

  "doc.title":            { hu: "Meződokumentáció", en: "Field documentation" },

  "cov.source":           { hu: "Forrásnyelv.", en: "Source language." },
  "cov.ok": {
    hu: "{percent}% lefordítva ({done}/{total}).",
    en: "{percent}% translated ({done}/{total}).",
  },
  /**
   * EZ A MONDAT MAGA IS FORDÍTANDÓ — és pont ezen a képernyőn a
   * legfontosabb. Egy magyarul kiírt „csak 4% van lefordítva” figyelmeztetés
   * az angol felületen bizonyítja is, amit állít, csak épp az olvasónak nem
   * mondja meg. A figyelmeztetés akkor ér valamit, ha ÉRTHETŐ.
   */
  "cov.unusable": {
    hu: "CSAK {percent}% VAN LEFORDÍTVA ({done}/{total}). Ez nem „részben " +
        "{lang}” felület, hanem forrásnyelvi felület {lang} gombokkal — és a " +
        "felhasználó ezt csak akkor tudja, ha megmondjuk. A nyelv " +
        "felkínálható, de minden le nem fordított szöveg MEGJELÖLVE jelenik meg.",
    en: "ONLY {percent}% IS TRANSLATED ({done}/{total}). This is not a " +
        "“partly {lang}” interface — it is a source-language interface with " +
        "{lang} buttons, and the user only knows that if we say so. The " +
        "language may be offered, but every untranslated string appears MARKED.",
  },

  "err.missingNotNo": {
    hu: "A hiányzó adat nem „nem”.",
    en: "A missing value is never a “no”.",
  },
};

export interface UiMissing { key: string; lang: Lang }

/** Mely felületi kulcs hiányzik mely nyelven. Ez HIBA, nem hiányosság. */
export function missingUiStrings(): UiMissing[] {
  const out: UiMissing[] = [];
  for (const [key, v] of Object.entries(UI)) {
    for (const lang of LANGS) if (!v[lang]) out.push({ key, lang });
  }
  return out;
}

/**
 * Felületi szöveg. Ismeretlen kulcsnál a KULCS jelenik meg — nem üres string.
 *
 * A `vars` a `{név}` helyőrzőket tölti ki. Helyőrzőt HASZNÁLUNK a
 * szövegdarabok összefűzése helyett: a magyar és az angol mondat szórendje
 * nem azonos, és a „darabokból ragasztott” mondat pont ezen bukik el.
 */
export function t(key: string, lang: Lang = SOURCE_LANG,
                  vars?: Record<string, string | number>): string {
  const v = UI[key];
  if (!v) return `⟨${key}⟩`;     // láthatóan hiányzik, nem némán eltűnik
  const text = v[lang] ?? v[SOURCE_LANG] ?? `⟨${key}⟩`;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m);   // ismeretlen helyőrző MARAD, nem tűnik el
}

/* ── LEFEDETTSÉG ────────────────────────────────────────────────────── */

export interface Coverage {
  lang: Lang;
  total: number;
  translated: number;
  percent: number;
  /** Használható-e ez a nyelv klinikai üzemben. */
  usable: boolean;
  /** A magyarázat A KÉRT NYELVEN — nem forrásnyelvi mondat. */
  why: string;
}

/**
 * MENNYIRE VAN KÉSZ EGY NYELV.
 *
 * A százalék nem díszítés: egy 4%-osan lefordított felület nem „részben
 * angol", hanem **forrásnyelvi felület angol gombokkal** — és a felhasználó
 * ezt csak akkor tudja, ha megmondjuk neki.
 *
 * A magyarázat A KÉRT NYELVEN készül. Egy magyarul kiírt figyelmeztetés az
 * angol felületen igazolja is, amit állít — csak épp az olvasó nem érti meg.
 */
export function coverage(items: Array<I18n | undefined>, lang: Lang, minPercent = 90): Coverage {
  const total = items.filter((x) => x && Object.keys(x).length).length;
  const translated = items.filter((x) => x?.[lang]).length;
  const percent = total ? Math.round((translated / total) * 100) : 0;
  const usable = lang === SOURCE_LANG || percent >= minPercent;
  const vars = { percent, done: translated, total, lang };
  return {
    lang, total, translated, percent, usable,
    why: lang === SOURCE_LANG
      ? t("cov.source", lang)
      : t(usable ? "cov.ok" : "cov.unusable", lang, vars),
  };
}
