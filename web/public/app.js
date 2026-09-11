/**
 * A felület.
 *
 * A LÉNYEG VÁLTOZATLAN: ez a fájl NEM tud egyetlen mezőnevet, egységet,
 * tartományt, kódlistát — és mostantól MODULCÍMET sem. Mindent az
 * `/api/formspec` mond meg, ami a regiszterből generálódik. Új változó vagy új
 * modul felvételéhez ezt a fájlt nem kell módosítani.
 *
 * AMI ÚJ: a 46 modul csukható szakasz, bal oldalt navigátor, felül kereső.
 * A régi felület egyetlen 56 000 pixeles lap volt, navigáció nélkül — és a
 * modulok fejléce a nyers kulcs volt (`hx.repro`), mert a névnek nem volt
 * helye. Most van: a regiszterben.
 */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ── NYELV ────────────────────────────────────────────────────────────
   A felület saját szövegei lefordíthatók. A KLINIKAI TARTALOM nem: ha egy
   címkének nincs célnyelvi alakja, a forrásnyelvi jelenik meg — MEGJELÖLVE. */
let I18N = { lang: "hu", sourceLang: "hu", strings: {}, coverage: null };
const T = (k, vars) => {
  const text = I18N.strings[k] ?? `⟨${k}⟩`;
  return vars ? text.replace(/\{(\w+)\}/g, (m, n) => (n in vars ? vars[n] : m)) : text;
};

function strong(text) {
  const b = document.createElement("b");
  b.textContent = String(text);
  return b;
}

/** Szótári mondat + DOM-csomópontok, innerHTML nélkül. */
function fillNodes(el, template, vars) {
  el.textContent = "";
  for (const part of template.split(/(\{\w+\})/)) {
    const key = part.startsWith("{") && part.endsWith("}") ? part.slice(1, -1) : null;
    if (key && key in vars) {
      const v = vars[key];
      el.append(v instanceof Node ? v : document.createTextNode(String(v)));
    } else if (part) {
      el.append(document.createTextNode(part));
    }
  }
}

function langOf() {
  return new URLSearchParams(location.search).get("lang")
    || tarolo("ogdoc.lang") || "hu";
}

/** localStorage — try/catch-ben, mert privát ablakban vagy tiltott tárolónál dob. */
function tarolo(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch { return null; }
}

function srcMark() {
  const m = document.createElement("span");
  m.className = "srclang";
  m.textContent = I18N.sourceLang.toUpperCase();
  m.title = T("app.sourceExplain");
  return m;
}

function applyStaticStrings() {
  for (const el of $$("[data-i18n]")) el.textContent = T(el.dataset.i18n);
  for (const el of $$("[data-i18n-label]")) el.setAttribute("aria-label", T(el.dataset.i18nLabel));
  for (const el of $$("[data-i18n-placeholder]")) el.placeholder = T(el.dataset.i18nPlaceholder);
  document.documentElement.lang = I18N.lang;
}

/* ── A BEJELENTKEZETT FELHASZNÁLÓ — a kiszolgáló mondja meg, HttpOnly sütiből. */
let EN = null;

async function api(path, init = {}) {
  const r = await fetch(path, { ...init, credentials: "same-origin" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(body.error || `${path}: ${r.status}`);
    err.status = r.status;
    err.kind = body.kind;
    throw err;
  }
  return body;
}

function showDenied(e) { const b = $("#denied"); if (b) { b.textContent = e.message; b.hidden = false; } }
function clearDenied() { const b = $("#denied"); if (b) b.hidden = true; }

let SPEC = [];
/** Mezőleírás azonosító szerint — a `paint()` ezt nézi, nem keres minden sornál. */
let FIELD_BY_ID = new Map();
/** Az utoljára ELFOGADOTT érték mezőnként — elutasításkor ide állunk vissza. */
const LAST = new Map();

/* ── ŰRLAP ────────────────────────────────────────────────────────────── */

function control(f) {
  if (f.control === "select" || f.control === "tristate") {
    const el = document.createElement("select");
    el.append(new Option("—", ""));
    for (const o of f.options ?? []) el.append(new Option(o.label + (o.unknown ? " ⃰" : ""), String(o.code)));
    return el;
  }
  if (f.control === "checkbox") {
    const el = document.createElement("input");
    el.type = "checkbox";
    return el;
  }
  const el = document.createElement("input");
  el.type = f.control === "number" ? "number"
    : f.control === "date" ? "date"
    : f.control === "datetime" ? "datetime-local" : "text";
  if (f.control === "readonly") { el.type = "text"; el.readOnly = true; }
  if (f.min != null) el.min = f.min;
  if (f.max != null) el.max = f.max;
  if (f.step != null) el.step = f.step;
  return el;
}

function parseValue(f, el) {
  if (f.control === "checkbox") return el.checked;
  const raw = el.value;
  if (raw === "") return null;
  if (f.control === "number") return Number(raw);
  if (f.control === "select" || f.control === "tristate") {
    const o = (f.options ?? []).find((x) => String(x.code) === raw);
    return o ? o.code : raw;
  }
  return raw;
}

function mezoSor(f) {
  const row = document.createElement("div");
  row.className = "field";
  row.dataset.id = f.id;

  const lab = document.createElement("div");
  lab.className = "label";
  const b = document.createElement("b");
  b.textContent = f.label + (f.unit ? `  [${f.unit}]` : "");
  lab.append(b);
  if (f.labelFallback) { b.append(srcMark()); row.classList.add("srcfallback"); }

  const id = document.createElement("span");
  id.className = "id";
  id.textContent = f.id;
  id.title = T("form.openDoc");
  id.addEventListener("click", () => showDoc(f.id));
  lab.append(id);

  if (f.openedBy) row.classList.add("detail");

  const tags = [];
  if (f.phi) tags.push(["phi", T("tag.phi")]);
  if (f.finding) tags.push(["finding", T("tag.finding")]);
  if (f.patientEntry) tags.push(["pat", T("tag.patientEntry")]);
  if (f.control === "readonly") tags.push(["derived", T("tag.derived")]);
  if (f.prefillable) tags.push(["", T("tag.prefillable")]);
  if (tags.length || f.hint) {
    const small = document.createElement("small");
    for (const [cls, text] of tags) {
      const t = document.createElement("span");
      t.className = "tag " + cls;
      t.textContent = text;
      small.append(t);
    }
    if (f.hint) small.append(document.createTextNode(f.hint));
    lab.append(small);
  }
  row.append(lab);

  const el = control(f);
  el.id = "f_" + f.id;
  if (f.control === "readonly") {
    el.placeholder = f.computed?.inputs?.length
      ? T("calc.waitingFor") + " " + f.computed.inputs.join(", ") : "";
    el.title = f.computed?.explain ?? "";
  } else {
    el.addEventListener("change", () => send(f, el, row));
  }
  row.append(el);
  // Kereséshez: a címke és az azonosító ékezettelen, kisbetűs alakja.
  row.dataset.kereso = norm(f.label + " " + f.id);
  return row;
}

/** Egy modul szakasza: fejléc (gomb) + mezők. */
function modulSzakasz(sec) {
  const s = document.createElement("section");
  s.className = "mod";
  s.dataset.modul = sec.module;
  s.id = "mod-" + sec.module.replace(/\./g, "-");

  const fej = document.createElement("button");
  fej.type = "button";
  fej.className = "mod-fej";
  fej.setAttribute("aria-expanded", "false");
  fej.setAttribute("aria-controls", s.id + "-mezok");

  const nyil = document.createElement("span");
  nyil.className = "mod-nyil";
  nyil.setAttribute("aria-hidden", "true");
  nyil.textContent = "▼";

  const cimsor = document.createElement("div");
  cimsor.className = "mod-cimsor";
  const cim = document.createElement("span");
  cim.className = "mod-cim";
  cim.textContent = sec.title;
  // A CÍM NINCS A REGISZTERBEN — a nyers kulcs látszik, JELÖLVE.
  if (sec.titleFallback) { cim.append(srcMark()); cim.title = T("mod.titleFallback"); }
  const kulcs = document.createElement("span");
  kulcs.className = "mod-kulcs";
  kulcs.textContent = sec.module;
  kulcs.title = T("mod.keyExplain");
  cimsor.append(cim, kulcs);
  if (sec.description) {
    const le = document.createElement("span");
    le.className = "mod-leiras";
    le.textContent = sec.description;
    cimsor.append(le);
  }

  const db = document.createElement("span");
  db.className = "mod-db";
  db.textContent = T("mod.fields", { m: sec.fields.length });

  fej.append(nyil, cimsor, db);
  fej.addEventListener("click", () => modulNyit(sec.module, !s.hasAttribute("open")));

  const mezok = document.createElement("div");
  mezok.className = "mezok";
  mezok.id = s.id + "-mezok";
  for (const f of sec.fields) mezok.append(mezoSor(f));

  s.append(fej, mezok);
  return s;
}

function renderForm(spec) {
  const root = $("#sections");
  root.textContent = "";
  FIELD_BY_ID = new Map(spec.flatMap((s) => s.fields).map((f) => [f.id, f]));
  for (const sec of spec) root.append(modulSzakasz(sec));
  navigatorEpit(spec);
  nyitasVisszaallit(spec);
  figyeloIndit();
}

/* ── NYITÁS / CSUKÁS — az állapot ezé a böngészőé, nem a rendszeré. */
function nyitottak() {
  try { return new Set(JSON.parse(tarolo("ogdoc.nyitva") || "[]")); } catch { return new Set(); }
}
function nyitasMent() {
  tarolo("ogdoc.nyitva", JSON.stringify($$(".mod[open]").map((m) => m.dataset.modul)));
}
function modulNyit(kulcs, nyit, ment = true) {
  const s = document.querySelector(`.mod[data-modul="${CSS.escape(kulcs)}"]`);
  if (!s) return;
  s.toggleAttribute("open", nyit);
  s.querySelector(".mod-fej").setAttribute("aria-expanded", String(nyit));
  if (ment) nyitasMent();
}
function nyitasVisszaallit(spec) {
  const volt = nyitottak();
  const van = spec.some((s) => volt.has(s.module));
  for (const s of spec) modulNyit(s.module, van ? volt.has(s.module) : s === spec[0], false);
}
function mindNyit(nyit) {
  for (const s of SPEC) modulNyit(s.module, nyit, false);
  nyitasMent();
}

/* ── NAVIGÁTOR ────────────────────────────────────────────────────────── */
function navigatorEpit(spec) {
  const root = $("#navList");
  root.textContent = "";
  let utolsoCsoport = null, tarto = null;
  for (const sec of spec) {
    if (sec.group !== utolsoCsoport) {
      utolsoCsoport = sec.group;
      tarto = document.createElement("div");
      tarto.className = "nav-csoport";
      const h = document.createElement("div");
      h.className = "nav-csoport-cim";
      h.textContent = sec.groupTitle;
      tarto.append(h);
      root.append(tarto);
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = "nav-tetel";
    b.dataset.modul = sec.module;
    const nev = document.createElement("span");
    nev.className = "nev";
    nev.textContent = sec.title;
    const db = document.createElement("span");
    db.className = "db";
    db.textContent = String(sec.fields.length);
    b.append(nev, db);
    b.addEventListener("click", () => {
      modulNyit(sec.module, true);
      document.querySelector(`.mod[data-modul="${CSS.escape(sec.module)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (matchMedia("(max-width: 900px)").matches) fiokNyit(false);
    });
    tarto.append(b);
  }
}

/** Melyik modul van a képernyőn — a navigátorban ez az aktív. */
let FIGYELO = null;
function figyeloIndit() {
  FIGYELO?.disconnect();
  FIGYELO = new IntersectionObserver((entries) => {
    const lathato = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!lathato) return;
    for (const b of $$(".nav-tetel")) {
      b.toggleAttribute("aria-current", b.dataset.modul === lathato.target.dataset.modul);
      if (b.hasAttribute("aria-current")) b.setAttribute("aria-current", "true");
    }
  }, { rootMargin: "-56px 0px -60% 0px", threshold: 0 });
  for (const m of $$(".mod")) FIGYELO.observe(m);
}

function fiokNyit(nyit) {
  const n = $("#navigator");
  n.toggleAttribute("data-nyitva", nyit);
  $("#navToggle").setAttribute("aria-expanded", String(nyit));
}

/* ── KERESÉS a 893 mező között ───────────────────────────────────────── */
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

function keres(q) {
  const kereses = norm(q.trim());
  const ki = $("#keresoDb");
  if (!kereses) {
    for (const r of $$(".field.talalat")) r.classList.remove("talalat");
    for (const m of $$(".mod")) delete m.dataset.talalat;
    for (const b of $$(".nav-tetel.talalat")) b.classList.remove("talalat");
    ki.value = "";
    nyitasVisszaallit(SPEC);
    return;
  }
  let osszes = 0, modulok = 0;
  for (const m of $$(".mod")) {
    let db = 0;
    for (const r of m.querySelectorAll(".field")) {
      const van = r.dataset.kereso.includes(kereses);
      r.classList.toggle("talalat", van);
      if (van) db++;
    }
    m.dataset.talalat = String(db);
    if (db) { modulok++; osszes += db; }
    modulNyit(m.dataset.modul, db > 0, false);
    $(`.nav-tetel[data-modul="${CSS.escape(m.dataset.modul)}"]`)?.classList.toggle("talalat", db > 0);
  }
  ki.value = osszes ? T("nav.results", { n: osszes, m: modulok }) : T("nav.noResults");
}

/* ── ÍRÁS ─────────────────────────────────────────────────────────────── */
async function send(f, el, row) {
  row.querySelectorAll(".err").forEach((n) => n.remove());
  const value = parseValue(f, el);
  if (value === null) return;
  const r = await api(q("/api/value"), {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: f.id, value }),
  });
  if (!r.ok) {
    // Az ok látszódjon, ÉS a mező ne mutasson olyan értéket, amit a rendszer
    // nem tárol: az elutasított szám a mezőben hagyva rögzültnek látszik.
    const e = document.createElement("div");
    e.className = "err";
    e.append(document.createTextNode(`⚠ ${T("form.rejected")}: `));
    const msg = document.createElement("span");
    msg.textContent = r.error;
    e.append(msg);
    if (I18N.lang !== I18N.sourceLang) e.append(" ", srcMark());
    row.append(e);
    const prev = LAST.get(f.id);
    if (f.control === "checkbox") el.checked = prev === true;
    else el.value = prev == null ? "" : String(prev);
    return;
  }
  frissit(r);
}

/**
 * A KISZOLGÁLÓ VÁLASZA LAPOSAN ADJA A NÉZETET — nincs `view` kulcs.
 *
 * Három helyen hívtunk `paint(r.view)`-t: az írásnál, a javaslat
 * elfogadásánál és a megerősítésnél. Az írásnál ez tegnap derült ki (a
 * böngésző TypeError-t dobott, az érték mentődött, a képernyő nem frissült);
 * a másik kettő UGYANAZT a hibát hordozta, csak ritkábban futott. Egy helyen
 * van, hogy ne lehessen még egyszer háromfelé elrontani.
 */
function frissit(r) {
  paint(r);
  $("#entries").textContent = String(r.entries ?? 0);
  if (r.basis) $("#basis").textContent = r.basis;
  if (r.caseId) $("#caseId").textContent = r.caseId;
  for (const id of r.affected ?? []) {
    const t = document.querySelector(`.field[data-id="${CSS.escape(id)}"]`);
    if (t) { t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash"); }
  }
}

/* ── MEGJELENÍTÉS ─────────────────────────────────────────────────────── */
function fill(boxSel, listSel, items, make) {
  const box = $(boxSel), list = $(listSel);
  list.textContent = "";
  box.hidden = items.length === 0;
  for (const it of items) list.append(make(it));
}

/** ISO-időbélyeg a mező saját alakjára — a datetime-local nem fogad el Z-s ISO-t. */
function mezoErtek(el, ertek) {
  const sz = String(ertek);
  if (el.type === "datetime-local") return sz.slice(0, 16);
  if (el.type === "date") return sz.slice(0, 10);
  if (el.type === "time") return sz.length > 8 ? sz.slice(11, 16) : sz.slice(0, 5);
  return sz;
}

function paint(view) {
  const byId = new Map(view.values.map((v) => [v.id, v]));
  for (const v of view.values) LAST.set(v.id, v.value);
  for (const f of FIELD_BY_ID.values()) {
    const el = document.getElementById("f_" + f.id);
    if (!el) continue;
    const v = byId.get(f.id);
    if (f.control === "readonly") {
      el.value = v ? mezoErtek(el, v.value) : "";
      el.title = v?.formula ?? f.computed?.explain ?? "";
    } else if (v && el.value === "" && f.control !== "checkbox") {
      el.value = mezoErtek(el, v.value);
    }
  }

  // Click-open: csak a látható mezők maradnak — és a modulszámláló csak a
  // láthatókat számolja, különben a „kitöltve” a rejtett láncot is várná.
  const vis = new Set(view.visible);
  for (const m of $$(".mod")) {
    let osszes = 0, kitoltve = 0;
    for (const row of m.querySelectorAll(".field")) {
      const f = FIELD_BY_ID.get(row.dataset.id);
      const rejtett = Boolean(f && f.openedBy && !vis.has(f.id));
      row.hidden = rejtett;
      if (rejtett) continue;
      osszes++;
      if (byId.has(row.dataset.id)) kitoltve++;
    }
    const db = m.querySelector(".mod-db");
    db.textContent = kitoltve ? T("mod.filled", { n: kitoltve, m: osszes }) : T("mod.fields", { m: osszes });
    db.classList.toggle("van", kitoltve > 0);
    const nb = $(`.nav-tetel[data-modul="${CSS.escape(m.dataset.modul)}"] .db`);
    if (nb) { nb.textContent = kitoltve ? `${kitoltve}/${osszes}` : String(osszes); nb.classList.toggle("van", kitoltve > 0); }
  }

  const e = view.effort;
  fillNodes($("#effort"), T("effort.summary"),
    { touched: strong(e.touched), hidden: strong(e.hiddenByDefault), total: e.total });

  fill("#patientBox", "#patientList", view.patient, (p) => {
    const d = document.createElement("div");
    d.className = "pl " + p.tone;
    d.textContent = p.text;
    return d;
  });

  fill("#adviceBox", "#adviceList", view.advice, (a) => {
    const d = document.createElement("div");
    d.className = "adv";
    const k = document.createElement("span");
    k.className = "k " + (a.urgency || "routine");
    k.textContent = a.kind;
    const t = document.createElement("div");
    t.className = "t";
    t.textContent = a.text;
    const s2 = document.createElement("div");
    s2.className = "src";
    s2.textContent = T("out.triggeredBy") + " " + a.fromLabel;
    d.append(k, t, s2);
    return d;
  });

  fill("#confirmBox", "#confirmList", view.confirm, (c) => {
    const d = document.createElement("div");
    d.className = "cf";
    const b = document.createElement("b");
    b.textContent = c.label;
    d.append(b, document.createTextNode(" = " + JSON.stringify(c.value)));
    if (c.wouldAffect.length) {
      const w = document.createElement("div");
      w.className = "w";
      w.textContent = T("form.affectsAfterConfirm") + " " + c.wouldAffect.join(", ");
      d.append(w);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "apro";
    btn.textContent = T("form.confirm");
    btn.addEventListener("click", async () => {
      const r = await api(q("/api/value"), {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id, value: c.value, provenance: "clinician" }),
      });
      if (r.ok) frissit(r);
    });
    d.append(btn);
    return d;
  });

  const cl = $("#calcList");
  cl.textContent = "";
  for (const c of view.calc) {
    const d = document.createElement("div");
    d.className = "calc";
    const b = document.createElement("b");
    b.textContent = c.label;
    d.append(b);
    if (c.status === "ok") {
      const val = document.createElement("div");
      val.className = "val " + (c.severity ? "sev-" + c.severity : "");
      val.textContent = `${c.value}${c.unit && c.unit !== "1" ? " " + c.unit : ""}` + (c.band ? ` — ${c.band}` : "");
      d.append(val);
    } else {
      const m = document.createElement("div");
      m.className = "miss";
      m.textContent = c.missing?.length ? T("calc.missingPrefix") + " " + c.missing.join(", ") : c.reason;
      d.append(m);
    }
    cl.append(d);
  }

  fill("#suggestions", "#suggestionList", view.suggestions, (s) => {
    const d = document.createElement("div");
    d.className = "sug";
    const b = document.createElement("b");
    b.textContent = s.id;
    d.append(b, document.createTextNode(` = ${JSON.stringify(s.value)}`));
    const n = document.createElement("div");
    n.className = "hint";
    n.append(document.createTextNode(`${s.note} · ${T("form.suggestionSource")} ${s.sourceRef}`));
    if (I18N.lang !== I18N.sourceLang) n.append(" ", srcMark());
    d.append(n);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "apro";
    btn.textContent = T("form.accept");
    btn.addEventListener("click", async () => {
      const r = await api(q("/api/value"), {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: s.id, value: s.value, provenance: "prefilled" }),
      });
      if (r.ok) frissit(r);
    });
    d.append(btn);
    return d;
  });
}

async function showDoc(id) {
  const d = await api(q("/api/doc/" + encodeURIComponent(id)));
  $("#doc").textContent = d.text;
  $("#docPanel").hidden = false;
  $("#docPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ── BEJELENTKEZÉS ────────────────────────────────────────────────────── */
async function belepoMutat(kapu) {
  $("#belepoTakaro").hidden = false;
  $("#csereUrlap").hidden = true;
  $("#belepoUrlap").hidden = false;
  document.querySelector("main").hidden = true;
  if (kapu) {
    $("#belepoKapu").textContent = `${kapu.osszefoglalo}. ` +
      (kapu.feltetelek.find((f) => f.id === "alapertelmezettJelszo")?.allapot === "hianyzik"
        ? T("auth.defaultStands") : "");
  }
}

const esc = (x) => String(x ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** A kapu állapota — bejelentkezés nélkül is olvasható. */
async function kapuFrissit() {
  try {
    const k = await api("/api/kapu");
    $("#kapuSor").innerHTML =
      `${esc(T("app.statusGate"))}: <b>${esc(k.osszefoglalo)}</b> · ` +
      k.feltetelek.map((f) =>
        `<span class="kapuJel ${f.allapot}" title="${esc(f.miert)}">` +
        `${f.allapot === "all" ? "✓" : f.allapot === "hianyzik" ? "✗" : "?"} ${esc(f.cim)}</span>`
      ).join(" · ");
    return k;
  } catch { return null; }
}

function enKiir() {
  $("#enSor").hidden = !EN;
  if (!EN) return;
  $("#enNev").textContent = EN.nev;
  const megb = (EN.elo || []).map((m) => {
    const hely = (EN.hatokorTartalma?.[m.hatokor] || []).length;
    return `${m.csoport.replace("csoport.", "")} @ ${m.hatokor}` +
      (m.ig ? ` (${m.ig.slice(0, 16).replace("T", " ")}${T("auth.until")})` : ` (${T("auth.openEnded")})`) +
      (hely ? ` · ${hely} ${T("auth.places")}` : "");
  });
  $("#enJog").textContent = (EN.szerepek || []).join(", ") +
    (megb.length ? " — " + megb.join(" · ") : " — " + T("auth.noAssignment"));
  $("#enJog").title = $("#enJog").textContent;
  $("#adminGomb").hidden = !(EN.szerepek || []).includes("admin");
}

async function enBetolt() {
  try {
    const r = await api("/api/auth/en");
    EN = r.en;
    enKiir();
    return true;
  } catch (e) {
    EN = null;
    enKiir();
    if (e.status === 403 && /jelszót cserélni/i.test(e.message)) {
      $("#belepoTakaro").hidden = false;
      $("#belepoUrlap").hidden = true;
      $("#csereUrlap").hidden = false;
      return false;
    }
    if (e.status === 403) {
      // Be van léptetve, csak nincs mihez hozzáférnie — ezt ki kell mondani.
      $("#belepoTakaro").hidden = true;
      document.querySelector("main").hidden = true;
      $("#denied").hidden = false;
      $("#denied").textContent = e.message;
      $("#enSor").hidden = false;
      return false;
    }
    return false;
  }
}

const urlapAdat = (f) => Object.fromEntries(new FormData(f).entries());

let AUTH_KOTVE = false;
async function buildAuth() {
  const kapu = await kapuFrissit();
  if (!AUTH_KOTVE) {
    AUTH_KOTVE = true;
    $("#belepoUrlap").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      $("#belepoHiba").hidden = true;
      try {
        const r = await api("/api/auth/belepes", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify(urlapAdat(ev.target)),
        });
        ev.target.reset();
        if (r.allapot === "jelszotCserelni") {
          $("#belepoUrlap").hidden = true;
          $("#csereUrlap").hidden = false;
          return;
        }
        $("#belepoTakaro").hidden = true;
        await indul();
      } catch (e) {
        $("#belepoHiba").hidden = false;
        $("#belepoHiba").textContent = e.message;
      }
    });
    $("#csereUrlap").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      $("#csereHiba").hidden = true;
      try {
        await api("/api/auth/jelszo", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify(urlapAdat(ev.target)),
        });
        ev.target.reset();
        $("#belepoTakaro").hidden = true;
        await kapuFrissit();
        await indul();
      } catch (e) {
        $("#csereHiba").hidden = false;
        $("#csereHiba").textContent = e.message;
      }
    });
    $("#kilepGomb").addEventListener("click", async () => {
      await api("/api/auth/kilepes", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      EN = null; enKiir();
      location.reload();
    });
    $("#adminGomb").addEventListener("click", adminNyit);
    $("#adminZar").addEventListener("click", () => { $("#adminTakaro").hidden = true; });
  }
  if (!(await enBetolt())) {
    if ($("#csereUrlap").hidden !== false && $("#denied").hidden) await belepoMutat(kapu);
    return false;
  }
  return true;
}

/* ── ADMIN PANEL ──────────────────────────────────────────────────────── */
async function adminPost(path, adat) {
  return api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adat) });
}
async function adminNyit() { $("#adminTakaro").hidden = false; await adminRajzol(); }

async function adminRajzol() {
  let d;
  try { d = await api("/api/admin/attekintes"); }
  catch (e) { $("#adminTest").innerHTML = `<p class="uzenet uzenet-tilt">${esc(e.message)}</p>`; return; }

  const most = Date.parse(d.most);
  const el = (m) => Date.parse(m.tol) <= most && (m.ig === null || Date.parse(m.ig) >= most);
  const fnev = (id) => d.felhasznalok.find((f) => f.id === id)?.nev ?? id;
  const hnev = (id) => d.helyek.find((h) => h.id === id)?.nev ?? id;
  const ido = (s) => esc((s ?? "").slice(0, 16).replace("T", " "));

  $("#adminTest").innerHTML = `
    ${d.gondok.length ? `<p class="uzenet"><b>${d.gondok.length} ${T("admin.problems")}:</b><br>${
      d.gondok.map((g) => esc(g.message)).join("<br>")}</p>` : ""}

    <h2>${T("admin.users")} (${d.felhasznalok.length})</h2>
    <div class="tabla-gorgo"><table><thead><tr><th>${T("admin.name")}</th><th>${T("admin.loginName")}</th>
      <th>${T("admin.provider")}</th><th>${T("admin.state")}</th><th>${T("admin.lastLogin")}</th><th></th></tr></thead><tbody>
      ${d.felhasznalok.map((f) => `<tr>
        <td>${esc(f.nev)}</td><td><code>${esc(f.felhasznalonev)}</code></td><td>${esc(f.szolgaltato)}</td>
        <td>${esc(f.allapot)}${f.jelszotCserelni ? ` <span class="jel nyitott">${T("admin.mustChangeFlag")}</span>` : ""}
            ${f.zarolas ? `<br><span class="hint">${esc(f.zarolas.ki)}: ${esc(f.zarolas.miert)}</span>` : ""}</td>
        <td>${f.utolsoBelepes ? ido(f.utolsoBelepes) : "—"}</td>
        <td>${f.allapot === "aktiv"
          ? `<button class="apro" data-zar="${esc(f.id)}">${T("admin.lock")}</button>`
          : `<button class="apro" data-old="${esc(f.id)}">${T("admin.unlock")}</button>`}</td>
      </tr>`).join("")}
    </tbody></table></div>

    <fieldset><legend>${T("admin.newUser")}</legend>
      <label>${T("admin.loginName")} <input id="ujBnev" autocomplete="off"></label>
      <label>${T("admin.name")} <input id="ujNev"></label>
      <label>${T("admin.initialPassword")} <input id="ujJelszo" type="text" autocomplete="off"></label>
      <label>${T("admin.provider")} <select id="ujSzolg">
        <option value="helyi">helyi</option><option value="eeszt">eeszt</option>
        <option value="eduid">eduid</option><option value="intezmenyi">intezmenyi</option></select></label>
      <div class="teljes"><button id="ujFelh" type="button">${T("admin.create")}</button>
        <span class="hint">${esc(T("admin.issuedMustChange"))}</span></div>
    </fieldset>

    <h2>${T("admin.assignments")} (${d.megbizasok.length}, ${T("admin.liveOf")}: ${d.megbizasok.filter(el).length})</h2>
    <div class="tabla-gorgo"><table><thead><tr><th>${T("admin.who")}</th><th>${T("admin.group")}</th><th>${T("admin.scope")}</th>
      <th>${T("admin.from")}</th><th>${T("admin.to")}</th><th>${T("admin.source")}</th><th>${T("admin.grantedBy")}</th><th></th></tr></thead><tbody>
      ${d.megbizasok.map((m) => `<tr>
        <td>${esc(fnev(m.felhasznalo))}</td>
        <td>${esc(d.csoportok.find((c) => c.id === m.csoport)?.nev ?? m.csoport)}</td>
        <td>${esc(hnev(m.hatokor))}<br><span class="hint">${esc(m.hatokor)}</span></td>
        <td>${ido(m.tol)}</td>
        <td>${m.ig ? ido(m.ig) : `<span class="jel nyitott">${T("auth.openEnded")}</span>`}</td>
        <td>${esc(m.forras)}</td>
        <td>${esc(m.adta)}<br><span class="hint">${esc(m.miert)}</span></td>
        <td>${el(m) ? `<span class="jel el">${T("admin.live")}</span> <button class="apro" data-vissza="${esc(m.id)}">${T("admin.revoke")}</button>`
                    : `<span class="jel lejart">${T("admin.notLive")}</span>`}</td>
      </tr>`).join("")}
    </tbody></table></div>

    <fieldset><legend>${T("admin.grant")}</legend>
      <label>${T("admin.who")} <select id="mFelh">${d.felhasznalok.map((f) => `<option value="${esc(f.id)}">${esc(f.nev)}</option>`).join("")}</select></label>
      <label>${T("admin.group")} <select id="mCsop">${d.csoportok.map((c) =>
        `<option value="${esc(c.id)}" data-fajta="${esc(c.hatokorFajta.join(","))}" data-ido="${c.idohozKotott ? 1 : 0}">${esc(c.nev)}</option>`).join("")}</select></label>
      <label>${T("admin.scope")} <select id="mHat"></select></label>
      <label>${T("admin.from")} <input id="mTol" type="datetime-local"></label>
      <label>${T("admin.to")} <input id="mIg" type="datetime-local"></label>
      <label>${T("admin.source")} <select id="mForras">
        <option value="kezi">${T("admin.manual")}</option><option value="beosztas">${T("admin.roster")}</option></select></label>
      <label class="teljes">${T("admin.why")} <input id="mMiert" placeholder="${esc(T("admin.whyPlaceholder"))}"></label>
      <div class="teljes"><button id="mAd" type="button" class="fo-gomb">${T("admin.grant")}</button>
        <span class="hint" id="mSugo"></span></div>
    </fieldset>

    <h2>${T("admin.sessions")} (${d.munkamenetek.length})</h2>
    <div class="tabla-gorgo"><table><thead><tr><th>${T("admin.who")}</th><th>${T("admin.sessionStart")}</th><th>${T("admin.lastActivity")}</th></tr></thead><tbody>
      ${d.munkamenetek.map((m) => `<tr><td>${esc(m.nev)}</td><td>${ido(m.kezdet)}</td><td>${ido(m.utolsoTevekenyseg)}</td></tr>`).join("")
        || `<tr><td colspan="3" class="hint">${T("admin.none")}</td></tr>`}
    </tbody></table></div>`;

  // A HATÓKÖRLISTA A CSOPORTHOZ IGAZODIK: tiltott hatókört választani sem lehet.
  const hatFrissit = () => {
    const o = $("#mCsop").selectedOptions[0];
    const fajtak = (o?.dataset.fajta ?? "").split(",");
    $("#mHat").innerHTML = d.helyek.filter((h) => fajtak.includes(h.fajta))
      .map((h) => `<option value="${esc(h.id)}">${esc(h.nev)} (${esc(h.fajta)})</option>`).join("");
    const ido2 = o?.dataset.ido === "1";
    $("#mIg").required = ido2;
    $("#mSugo").textContent = T(ido2 ? "admin.timeBound" : "admin.notTimeBound");
  };
  $("#mCsop").addEventListener("change", hatFrissit);
  hatFrissit();

  const iso = (v) => (v ? new Date(v).toISOString() : null);
  const hibaval = (fn) => async () => { try { await fn(); await adminRajzol(); } catch (e) { alert(e.message); } };
  $("#mAd").addEventListener("click", hibaval(() => adminPost("/api/admin/megbizas", {
    felhasznalo: $("#mFelh").value, csoport: $("#mCsop").value, hatokor: $("#mHat").value,
    tol: iso($("#mTol").value) ?? new Date().toISOString(), ig: iso($("#mIg").value),
    forras: $("#mForras").value, miert: $("#mMiert").value })));
  $("#ujFelh").addEventListener("click", hibaval(() => adminPost("/api/admin/felhasznalo", {
    felhasznalonev: $("#ujBnev").value, nev: $("#ujNev").value, jelszo: $("#ujJelszo").value, szolgaltato: $("#ujSzolg").value })));
  for (const b of $$("[data-vissza]")) b.addEventListener("click", hibaval(() => adminPost("/api/admin/megbizas/visszavon", { id: b.dataset.vissza })));
  for (const b of $$("[data-zar]")) b.addEventListener("click", hibaval(async () => {
    const miert = prompt(T("admin.lockReason"));
    if (!miert) throw new Error(T("admin.lockReason"));
    await adminPost("/api/admin/felhasznalo/allapot", { id: b.dataset.zar, allapot: "zarolt", miert });
  }));
  for (const b of $$("[data-old]")) b.addEventListener("click", hibaval(() => adminPost("/api/admin/felhasznalo/allapot", { id: b.dataset.old, allapot: "aktiv" })));
}

/* ── ESET ─────────────────────────────────────────────────────────────── */
async function loadCase() {
  try {
    clearDenied();
    const view = await api(q("/api/case"));
    paint(view);
    $("#basis").textContent = view.basis || "";
    $("#caseId").textContent = view.caseId || "—";
    $("#entries").textContent = String(view.entries ?? 0);
    dpoPanel(view.roles);
    document.querySelector("main").hidden = false;
  } catch (e) {
    document.querySelector("main").hidden = true;
    showDenied(e);
    // A DPO-nak nincs olvasási joga a lelethez — a törlési panelt ettől még látnia kell.
    dpoPanel(EN?.szerepek || []);
  }
}

/** A nyelv minden kérésben ott van — a megosztott hivatkozás ugyanazt mutatja. */
function q(path) {
  return path + (path.includes("?") ? "&" : "?") + "lang=" + encodeURIComponent(I18N.lang);
}

async function loadAll() {
  I18N = await api(q("/api/i18n"));
  applyStaticStrings();
  const w = $("#langWarn"), c = I18N.coverage;
  if (c && !c.usable) { w.textContent = c.why; w.hidden = false; } else w.hidden = true;
  SPEC = await api(q("/api/formspec"));
  renderForm(SPEC);
}

/** Előbb a séma, aztán a hitelesítés, és csak utána az adat. */
async function indul() {
  if (!(await buildAuth())) return;
  await loadCase();
}

/* ── A SÁV MAGASSÁGA MÉRVE, NEM FELTÉTELEZVE ─────────────────────────
   Keskeny képernyőn a felső sáv több sorba törik. A fiók és a rögzített
   navigátor eltolása ezért nem lehet állandó: a sáv tényleges magasságát a
   böngésző méri, és a CSS onnan olvassa (--sav-h). */
new ResizeObserver(([e]) => {
  // BORDER-BOX, nem contentRect: az utóbbi a paddingot és a szegélyt nem
  // tartalmazza, és a fiók 1 px-szel a sáv alá csúszott.
  const h = e.borderBoxSize?.[0]?.blockSize ?? e.target.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--sav-h", `${Math.ceil(h)}px`);
}).observe($(".sav"));

/* ── VEZÉRLŐK ─────────────────────────────────────────────────────────── */
$("#navToggle").addEventListener("click", () => fiokNyit(!$("#navigator").hasAttribute("data-nyitva")));
$("#mindNyit").addEventListener("click", () => mindNyit(true));
$("#mindCsuk").addEventListener("click", () => mindNyit(false));
$("#kereso").addEventListener("input", (e) => keres(e.target.value));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { fiokNyit(false); if ($("#kereso").value) { $("#kereso").value = ""; keres(""); } }
  if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName ?? "")) {
    e.preventDefault(); $("#kereso").focus();
  }
});

const sel = $("#lang");
sel.value = langOf();
sel.addEventListener("change", async () => {
  I18N.lang = sel.value;
  tarolo("ogdoc.lang", sel.value);
  const u = new URL(location.href);
  u.searchParams.set("lang", sel.value);
  history.replaceState(null, "", u);
  await loadAll();
  if (EN) await loadCase();
});

I18N.lang = langOf();
await loadAll();
await indul();

/* ── A DPO TÖRLÉSI PANELJE ───────────────────────────────────────────── */
function dpoPanel(roles) { $("#dpo").hidden = !(roles || []).includes("dpo"); }
function dpoRender(nodes) { const out = $("#dpoOut"); out.textContent = ""; for (const n of nodes) out.append(n); }
function sor(cim, szoveg, osztaly) {
  const p = document.createElement("p");
  if (osztaly) p.className = osztaly;
  const b = document.createElement("b");
  b.textContent = cim + " ";
  p.append(b, document.createTextNode(szoveg));
  return p;
}
$("#dpoPreview")?.addEventListener("click", async () => {
  const rendelkezes = {
    caseId: $("#caseId").textContent, fajta: "kriptografiai", jogalap: "GDPR 17. cikk (1) b)",
    indoklas: T("dpo.title"), rendelte: { nev: "—", szerep: "dpo", at: new Date().toISOString() },
  };
  const e = await api("/api/torles/elonezet", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rendelkezes }) });
  const nodes = [sor(T("dpo.blocked") + ":", e.osszefoglalo, "warn")];
  for (const a of e.akadalyok) {
    nodes.push(sor(a.suly === "blokkolo" ? "⛔" : "⚠", a.why));
    nodes.push(sor("↳ " + T("dpo.remedy") + ":", a.mihezKotott, "hint"));
  }
  dpoRender(nodes);
});
$("#dpoRevoke")?.addEventListener("click", async () => {
  const v = await api("/api/torles/visszavonas");
  const nodes = [sor("", v.osszefoglalo, "warn")];
  for (const m of v.megszunik) nodes.push(sor(T("dpo.ends") + ":", m));
  for (const m of v.marad) nodes.push(sor(T("dpo.stays") + ":", m.mi + " — " + m.miert, "hint"));
  dpoRender(nodes);
});
