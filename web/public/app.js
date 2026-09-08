/**
 * A csontváz felülete.
 *
 * A LÉNYEG: ez a fájl NEM tud egyetlen mezőnevet, egységet, tartományt vagy
 * kódlistát sem. Mindent az `/api/formspec` mond meg, ami a regiszterből
 * generálódik. Új változó felvételéhez ezt a fájlt nem kell módosítani —
 * ez a regiszter-vezérelt architektúra tesztje.
 */

const $ = (s) => document.querySelector(s);

/* ── NYELV ────────────────────────────────────────────────────────────
   A felület saját szövegei lefordíthatók (a miénk). A KLINIKAI TARTALOM
   viszont nem: ha egy változónévnek nincs meg a célnyelvi alakja, a
   forrásnyelvi jelenik meg — MEGJELÖLVE. Egy csendes visszaesés azt adná,
   hogy a felhasználó „angol" felületet lát magyar tartalommal, és nem tudja,
   melyik szó melyik. */
let I18N = { lang: "hu", sourceLang: "hu", strings: {}, coverage: null };
const T = (k, vars) => {
  const text = I18N.strings[k] ?? `⟨${k}⟩`;
  return vars ? text.replace(/\{(\w+)\}/g, (m, n) => (n in vars ? vars[n] : m)) : text;
};

/** `<b>` csomópont — a kiemelés szerkezet, nem szöveg. */
function strong(text) {
  const b = document.createElement("b");
  b.textContent = String(text);
  return b;
}

/**
 * SZÓTÁRI MONDAT + DOM-CSOMÓPONTOK, innerHTML NÉLKÜL.
 *
 * A `{név}` helyőrző helyére csomópont vagy szöveg kerül. Így a mondat
 * szórendje a fordításé marad, de a felület nem kap HTML-összefűzést —
 * egy `innerHTML`-lel kevesebb hely, ahol adat kódnak látszhat.
 */
function fillNodes(el, template, vars) {
  el.textContent = "";
  for (const part of template.split(/(\{\w+\})/)) {
    const key = part.startsWith("{") && part.endsWith("}") ? part.slice(1, -1) : null;
    if (key && key in vars) {
      const v = vars[key];
      el.append(v instanceof Node ? v : document.createTextNode(String(v)));
    } else if (part) {
      el.append(document.createTextNode(part));   // ismeretlen helyőrző MARAD
    }
  }
}

function langOf() {
  return new URLSearchParams(location.search).get("lang")
    || localStorage.getItem("ogdoc.lang") || "hu";
}

/** A forrásnyelvi jelölés — egy kis címke, magyarázó tooltippel. */
function srcMark() {
  const m = document.createElement("span");
  m.className = "srclang";
  m.textContent = I18N.sourceLang.toUpperCase();
  m.title = T("app.sourceExplain");
  return m;
}

function applyStaticStrings() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = T(el.dataset.i18n);
  }
  // a képernyőolvasónak szóló szakasznév is felületi szöveg, nem díszítés
  for (const el of document.querySelectorAll("[data-i18n-label]")) {
    el.setAttribute("aria-label", T(el.dataset.i18nLabel));
  }
  document.documentElement.lang = I18N.lang;
}

/**
 * A KIVÁLASZTOTT CSELEKVŐ.
 *
 * Ez NEM bejelentkezés, és nem is annak látszik: egy legördülő, ami fejlécet
 * állít. A kiszolgáló ezt nem ellenőrzi — a jogosultsági réteg viszont igen,
 * és ez a lényeg: a különbséget a felületen látni kell, nem elfedni.
 */
/**
 * A BEJELENTKEZETT FELHASZNÁLÓ. Nem a felület állítja — a kiszolgáló mondja meg.
 *
 * Korábban itt egy `localStorage`-ból olvasott cselekvőazonosító állt, amit a
 * felület fejlécként küldött. Most a munkamenet HttpOnly sütiben van: a
 * JavaScript nem olvashatja, tehát egy XSS sem viheti el.
 */
let EN = null;

async function api(path, init = {}) {
  const headers = { ...(init.headers || {}) };
  const r = await fetch(path, { ...init, headers, credentials: "same-origin" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    // A JOGOSULTSÁGI ELUTASÍTÁS NEM ÖSSZEOMLÁS. A kiszolgáló megmondja, MIÉRT
    // nincs joga — ezt a felhasználónak látnia kell, nem egy konzolhibát.
    const err = new Error(body.error || `${path}: ${r.status}`);
    err.status = r.status;
    err.kind = body.kind;
    throw err;
  }
  return body;
}

/** A jogosultsági elutasítás megjelenítése — indoklással, nem kódszámmal. */
function showDenied(e) {
  const box = document.querySelector("#denied");
  if (!box) return;
  box.textContent = e.message;
  box.hidden = false;
}
function clearDenied() {
  const box = document.querySelector("#denied");
  if (box) box.hidden = true;
}

let SPEC = [];
/** Az utoljára ELFOGADOTT érték mezőnként — elutasításkor ide állunk vissza. */
const LAST = new Map();

/* ── űrlap ───────────────────────────────────────────────────────────── */

function control(f) {
  if (f.control === "select" || f.control === "tristate") {
    const el = document.createElement("select");
    el.append(new Option("—", ""));
    for (const o of f.options ?? []) {
      const opt = new Option(o.label + (o.unknown ? " ⃰" : ""), String(o.code));
      el.append(opt);
    }
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
    // a kódkészlet lehet szám vagy szöveg — a formspec kódját adjuk vissza
    const o = (f.options ?? []).find((x) => String(x.code) === raw);
    return o ? o.code : raw;
  }
  return raw;
}

function renderForm(spec) {
  const root = $("#sections");
  root.textContent = "";
  for (const sec of spec) {
    const h = document.createElement("div");
    h.className = "module";
    h.textContent = sec.module;
    root.append(h);

    for (const f of sec.fields) {
      const row = document.createElement("div");
      row.className = "field";
      row.dataset.id = f.id;

      const lab = document.createElement("div");
      lab.className = "label";
      const b = document.createElement("b");
      b.textContent = f.label + (f.unit ? `  [${f.unit}]` : "");
      lab.append(b);
      // A CÍMKE NEM A KÉRT NYELVEN VAN. Ezt látni kell — nem a fejlesztőnek,
      // hanem annak, aki a mezőt kitölti.
      // a jelölés A CÍMKE MELLÉ kerül, nem alá: külön sorban álló badge-ről
      // nem látszik, MELYIK szöveg nincs lefordítva
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
          small.append(t, " ");
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
      root.append(row);
    }
  }
}

/* ── írás ────────────────────────────────────────────────────────────── */

async function send(f, el, row) {
  row.querySelectorAll(".err").forEach((n) => n.remove());
  const value = parseValue(f, el);
  if (value === null) return;

  const r = await api(q("/api/value"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: f.id, value }),
  });

  if (!r.ok) {
    // A motor utasította el. Két dolog kötelező: az ok látszódjon, ÉS a mező
    // ne mutasson olyan értéket, amit a rendszer nem tárol. Az elutasított
    // szám a mezőben hagyva úgy néz ki, mintha rögzült volna.
    const e = document.createElement("div");
    e.className = "err";
    // A MOTOR ÜZENETE FORRÁSNYELVŰ. Nem fordítjuk gépileg — de megjelöljük,
    // hogy az olvasó tudja: ez nem a felület nyelve, hanem a rendszeré.
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
  // A KISZOLGÁLÓ A NÉZETET LAPOSAN ADJA VISSZA — nincs `view` kulcs.
  //
  // A `/api/value` válasza `{ ok, ...caseView, entries, basis, affected, seq }`,
  // a kliens viszont `r.view`-t olvasott. Az `undefined` továbbadva a
  // `paint()`-nek minden SIKERES íráskor TypeError-t dobott
  // („Cannot read properties of undefined (reading 'values')”), a kivétel
  // pedig kifelé szállt a `change` eseménykezelőből.
  //
  // A KÖVETKEZMÉNY NEM VOLT LÁTHATÓ, ÉS ÉPP EZÉRT VOLT ROSSZ: az érték
  // ELMENTŐDÖTT, de a képernyő nem frissült — a keresztfeltöltött és
  // levezetett mezők üresen maradtak a következő újratöltésig. Egy
  // regiszter-vezérelt rendszernél, aminek a lényege, hogy egy mező feltölt
  // egy másikat, pontosan ez a lényeg maradt el, némán.
  paint(r);
  $("#entries").textContent = String(r.entries ?? 0);
  if (r.basis) $("#basis").textContent = r.basis;
  for (const id of r.affected ?? []) {
    const target = document.querySelector(`.field[data-id="${CSS.escape(id)}"]`);
    if (target) { target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash"); }
  }
}

/* ── megjelenítés ────────────────────────────────────────────────────── */

/** Egy panel feltöltése: elrejti, ha üres. */
function fill(boxSel, listSel, items, make) {
  const box = $(boxSel), list = $(listSel);
  list.textContent = "";
  box.hidden = items.length === 0;
  for (const it of items) list.append(make(it));
}

/**
 * EGY ISO-IDŐBÉLYEG A MEZŐ SAJÁT ALAKJÁRA.
 *
 * A `<input type="datetime-local">` NEM fogad el teljes ISO-értéket: a
 * `2026-09-08T18:50:38.156Z` alakot a böngésző elutasítja, és a mezőt ÜRESEN
 * hagyja — figyelmeztetéssel a konzolon, amit senki nem néz. A `ctx.now` így
 * tárolt értékkel is üresnek látszott, vagyis a KÉPERNYŐ ÉS AZ ÁLLAPOT MÁST
 * MONDOTT ugyanarról. Egy olyan mezőnél, amiből a gesztációs kor számolódik,
 * ez nem kozmetikai kérdés.
 */
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
  for (const sec of SPEC) {
    for (const f of sec.fields) {
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
  }

  // click-open: csak a látható mezők maradnak a képernyőn
  const vis = new Set(view.visible);
  document.querySelectorAll(".field").forEach((row) => {
    const f = SPEC.flatMap((s) => s.fields).find((x) => x.id === row.dataset.id);
    row.hidden = Boolean(f && f.openedBy && !vis.has(f.id));
  });
  const e = view.effort;
  // A mondat a szótárból jön, a SZÁMOK a nézetből — de HTML-t nem fűzünk
  // össze belőlük: a helyőrző helyére DOM-csomópont kerül, nem string.
  fillNodes($("#effort"), T("effort.summary"), {
    touched: strong(e.touched), hidden: strong(e.hiddenByDefault), total: e.total,
  });

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
    d.append(k);
    const t = document.createElement("div");
    t.className = "t";
    t.textContent = a.text;
    d.append(t);
    const s2 = document.createElement("div");
    s2.className = "src";
    s2.textContent = T("out.triggeredBy") + " " + a.fromLabel;
    d.append(s2);
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
    btn.textContent = T("form.confirm");
    btn.addEventListener("click", async () => {
      const r = await api(q("/api/value"), {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id, value: c.value, provenance: "clinician" }),
      });
      if (r.ok) paint(r.view);
    });
    d.append(btn);
    return d;
  });

  const cl = $("#calcList");
  cl.textContent = "";
  for (const c of view.calc) {
    const d = document.createElement("div");
    d.className = "calc";
    const t = document.createElement("div");
    const b = document.createElement("b");
    b.textContent = c.label;
    t.append(b);
    d.append(t);

    if (c.status === "ok") {
      const val = document.createElement("div");
      val.className = "val " + (c.severity ? "sev-" + c.severity : "");
      val.textContent = `${c.value}${c.unit && c.unit !== "1" ? " " + c.unit : ""}`
        + (c.band ? ` — ${c.band}` : "");
      d.append(val);
    } else {
      const m = document.createElement("div");
      m.className = "miss";
      m.textContent = c.missing?.length
        ? T("calc.missingPrefix") + " " + c.missing.join(", ")
        : c.reason;
      d.append(m);
    }
    cl.append(d);
  }

  const sBox = $("#suggestions");
  const sl = $("#suggestionList");
  sl.textContent = "";
  sBox.hidden = view.suggestions.length === 0;
  for (const s of view.suggestions) {
    const d = document.createElement("div");
    d.className = "sug";
    const b = document.createElement("b");
    b.textContent = s.id;
    d.append(b, document.createTextNode(` = ${JSON.stringify(s.value)}`));
    const n = document.createElement("div");
    n.className = "hint";
    // A motor jegyzete FORRÁSNYELVŰ — gépileg nem fordítjuk, de megjelöljük.
    n.append(document.createTextNode(
      `${s.note} · ${T("form.suggestionSource")} ${s.sourceRef}`));
    if (I18N.lang !== I18N.sourceLang) n.append(" ", srcMark());
    d.append(n);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = T("form.accept");
    btn.addEventListener("click", async () => {
      const r = await api(q("/api/value"), {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: s.id, value: s.value, provenance: "prefilled" }),
      });
      if (r.ok) paint(r.view);
    });
    d.append(btn);
    sl.append(d);
  }
}

async function showDoc(id) {
  const d = await api(q("/api/doc/" + encodeURIComponent(id)));
  $("#doc").textContent = d.text;
  $("#docPanel").hidden = false;
  $("#docPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ── indítás ─────────────────────────────────────────────────────────── */

/**
 * A CSELEKVŐVÁLASZTÓ FELÉPÍTÉSE.
 *
 * Minden cselekvő mellé odaírjuk, MIT MUTAT BE — mert a lista nem
 * felhasználólista, hanem a jogosultsági réteg három rétegének bemutatója.
 * Váltáskor újratöltjük az esetet: aki nem jogosult, elutasítást lát,
 * indoklással.
 */
async function belepoMutat(kapu) {
  const t = $("#belepoTakaro");
  t.hidden = false;
  $("#csereUrlap").hidden = true;
  $("#belepoUrlap").hidden = false;
  document.querySelector("main").hidden = true;
  if (kapu) {
    $("#belepoKapu").textContent =
      `${kapu.osszefoglalo}. ` +
      (kapu.feltetelek.find((f) => f.id === "alapertelmezettJelszo")?.allapot === "hianyzik"
        ? T("auth.defaultStands")
        : "");
  }
}

/** A kapu állapota a fejlécben — bejelentkezés nélkül is olvasható. */
async function kapuFrissit() {
  try {
    const k = await api("/api/kapu");
    $("#kapuSor").innerHTML =
      `${T("admin.gateLive")}: <b>${esc(k.osszefoglalo)}</b> · ` +
      k.feltetelek.map((f) =>
        `<span class="kapuJel ${f.allapot}" title="${esc(f.miert)}">` +
        `${f.allapot === "all" ? "✓" : f.allapot === "hianyzik" ? "✗" : "?"} ${esc(f.cim)}</span>`
      ).join(" · ");
    return k;
  } catch { return null; }
}

/**
 * A BEJELENTKEZETT ÁLLAPOT KIÍRÁSA — a JOGGAL EGYÜTT.
 *
 * Nem elég a nevet és a szerepkört mutatni. A jogot a megbízás adja, és annak
 * hatóköre és ideje van: enélkül a felhasználó nem tudja megmondani, miért lát
 * vagy miért nem lát valamit — és a megmagyarázatlan tiltást megkerülik, nem
 * megértik.
 */
function enKiir() {
  $("#enSor").hidden = !EN;
  if (!EN) return;
  $("#enNev").textContent = EN.nev;
  const megb = (EN.elo || []).map((m) => {
    const hely = (EN.hatokorTartalma?.[m.hatokor] || []).length;
    return `${m.csoport.replace("csoport.", "")} @ ${m.hatokor}` +
      (m.ig ? ` (${m.ig.slice(0, 16).replace("T", " ")}${T("auth.until")})`
            : ` (${T("auth.openEnded")})`) +
      (hely ? ` · ${hely} ${T("auth.places")}` : "");
  });
  $("#enJog").textContent =
    (EN.szerepek || []).join(", ") +
    (megb.length ? " — " + megb.join(" · ") : " — " + T("auth.noAssignment"));
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
    // A 403 „nincs élő megbízás” NEM bejelentkezési hiba: a felhasználó be van
    // léptetve, csak nincs mihez hozzáférnie. Ezt ki kell mondani, különben
    // újra és újra bejelentkezik, és nem érti, miért nem történik semmi.
    if (e.status === 403) {
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

function urlapAdat(f) {
  return Object.fromEntries(new FormData(f).entries());
}

async function buildAuth() {
  const kapu = await kapuFrissit();

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
    await api("/api/auth/kilepes", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    EN = null; enKiir();
    location.reload();
  });

  $("#adminGomb").addEventListener("click", adminNyit);
  $("#adminZar").addEventListener("click", () => { $("#adminTakaro").hidden = true; });

  if (!(await enBetolt())) {
    if ($("#csereUrlap").hidden !== false && $("#denied").hidden) await belepoMutat(kapu);
    return false;
  }
  return true;
}

/* ── ADMIN PANEL ────────────────────────────────────────────────────── */

const esc = (x) => String(x ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function adminPost(path, adat) {
  return api(path, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(adat),
  });
}

async function adminNyit() {
  $("#adminTakaro").hidden = false;
  await adminRajzol();
}

async function adminRajzol() {
  let d;
  try { d = await api("/api/admin/attekintes"); }
  catch (e) { $("#adminTest").innerHTML = `<p class="warn">${esc(e.message)}</p>`; return; }

  const most = Date.parse(d.most);
  const el = (m) => Date.parse(m.tol) <= most && (m.ig === null || Date.parse(m.ig) >= most);
  const fnev = (id) => d.felhasznalok.find((f) => f.id === id)?.nev ?? id;
  const hnev = (id) => d.helyek.find((h) => h.id === id)?.nev ?? id;

  $("#adminTest").innerHTML = `
    ${d.gondok.length ? `<p class="warn"><b>${d.gondok.length} ${T("admin.problems")}:</b><br>${
      d.gondok.map((g) => esc(g.message)).join("<br>")}</p>` : ""}

    <h2>${T("admin.users")} (${d.felhasznalok.length})</h2>
    <table><thead><tr><th>${T("admin.name")}</th><th>${T("admin.loginName")}</th><th>${T("admin.provider")}</th>
      <th>${T("admin.state")}</th><th>${T("admin.lastLogin")}</th><th></th></tr></thead><tbody>
      ${d.felhasznalok.map((f) => `<tr>
        <td>${esc(f.nev)}</td><td><code>${esc(f.felhasznalonev)}</code></td>
        <td>${esc(f.szolgaltato)}</td>
        <td>${esc(f.allapot)}${f.jelszotCserelni ? ` <span class="jel nyitott">${T("admin.mustChangeFlag")}</span>` : ""}
            ${f.zarolas ? `<br><span class="hint">${esc(f.zarolas.ki)}: ${esc(f.zarolas.miert)}</span>` : ""}</td>
        <td>${esc(f.utolsoBelepes?.slice(0, 16).replace("T", " ") ?? "—")}</td>
        <td>${f.allapot === "aktiv"
          ? `<button data-zar="${esc(f.id)}">${T("admin.lock")}</button>`
          : `<button data-old="${esc(f.id)}">${T("admin.unlock")}</button>`}</td>
      </tr>`).join("")}
    </tbody></table>

    <fieldset><legend>${T("admin.newUser")}</legend>
      <label>${T("admin.loginName")} <input id="ujBnev"></label>
      <label>${T("admin.name")} <input id="ujNev"></label>
      <label>${T("admin.initialPassword")} <input id="ujJelszo" type="text"></label>
      <label>${T("admin.provider")} <select id="ujSzolg">
        <option value="helyi">helyi</option><option value="eeszt">eeszt</option>
        <option value="eduid">eduid</option><option value="intezmenyi">intezmenyi</option>
      </select></label>
      <div class="teljes"><button id="ujFelh">${T("admin.create")}</button>
        <span class="hint">${esc(T("admin.issuedMustChange"))}</span></div>
    </fieldset>

    <h2>${T("admin.assignments")} (${d.megbizasok.length}, ${T("admin.liveOf")}: ${d.megbizasok.filter(el).length})</h2>
    <table><thead><tr><th>${T("admin.who")}</th><th>${T("admin.group")}</th><th>${T("admin.scope")}</th><th>${T("admin.from")}</th>
      <th>${T("admin.to")}</th><th>${T("admin.source")}</th><th>${T("admin.grantedBy")}</th><th></th></tr></thead><tbody>
      ${d.megbizasok.map((m) => `<tr>
        <td>${esc(fnev(m.felhasznalo))}</td>
        <td>${esc(d.csoportok.find((c) => c.id === m.csoport)?.nev ?? m.csoport)}</td>
        <td>${esc(hnev(m.hatokor))}<br><span class="hint">${esc(m.hatokor)}</span></td>
        <td>${esc(m.tol.slice(0, 16).replace("T", " "))}</td>
        <td>${m.ig ? esc(m.ig.slice(0, 16).replace("T", " "))
          : `<span class="jel nyitott">${T("auth.openEnded")}</span>`}</td>
        <td>${esc(m.forras)}</td>
        <td>${esc(m.adta)}<br><span class="hint">${esc(m.miert)}</span></td>
        <td>${el(m) ? `<span class="jel el">${T("admin.live")}</span>
              <button data-vissza="${esc(m.id)}">${T("admin.revoke")}</button>`
            : `<span class="jel lejart">${T("admin.notLive")}</span>`}</td>
      </tr>`).join("")}
    </tbody></table>

    <fieldset><legend>${T("admin.grant")}</legend>
      <label>${T("admin.who")} <select id="mFelh">${d.felhasznalok.map((f) =>
        `<option value="${esc(f.id)}">${esc(f.nev)}</option>`).join("")}</select></label>
      <label>${T("admin.group")} <select id="mCsop">${d.csoportok.map((c) =>
        `<option value="${esc(c.id)}" data-fajta="${esc(c.hatokorFajta.join(","))}"
          data-ido="${c.idohozKotott ? 1 : 0}">${esc(c.nev)}</option>`).join("")}</select></label>
      <label>${T("admin.scope")} <select id="mHat"></select></label>
      <label>${T("admin.from")} <input id="mTol" type="datetime-local"></label>
      <label>${T("admin.to")} <input id="mIg" type="datetime-local"></label>
      <label>${T("admin.source")} <select id="mForras">
        <option value="kezi">${T("admin.manual")}</option><option value="beosztas">${T("admin.roster")}</option>
      </select></label>
      <label class="teljes">${T("admin.why")} <input id="mMiert" placeholder="${esc(T("admin.whyPlaceholder"))}"></label>
      <div class="teljes"><button id="mAd">${T("admin.grant")}</button>
        <span class="hint" id="mSugo"></span></div>
    </fieldset>

    <h2>${T("admin.sessions")} (${d.munkamenetek.length})</h2>
    <table><thead><tr><th>${T("admin.who")}</th><th>${T("admin.sessionStart")}</th><th>${T("admin.lastActivity")}</th></tr></thead><tbody>
      ${d.munkamenetek.map((m) => `<tr><td>${esc(m.nev)}</td>
        <td>${esc(m.kezdet.slice(0, 16).replace("T", " "))}</td>
        <td>${esc(m.utolsoTevekenyseg.slice(0, 16).replace("T", " "))}</td></tr>`).join("")
        || `<tr><td colspan="3" class="hint">${T("admin.none")}</td></tr>`}
    </tbody></table>`;

  // A HATÓKÖRLISTA A CSOPORTHOZ IGAZODIK. Nem kényelem: így nem is lehet
  // olyan hatókört választani, ami a csoportnak tilos — a hiba meg sem születik.
  const hatFrissit = () => {
    const o = $("#mCsop").selectedOptions[0];
    const fajtak = (o?.dataset.fajta ?? "").split(",");
    $("#mHat").innerHTML = d.helyek.filter((h) => fajtak.includes(h.fajta))
      .map((h) => `<option value="${esc(h.id)}">${esc(h.nev)} (${esc(h.fajta)})</option>`).join("");
    const ido = o?.dataset.ido === "1";
    $("#mIg").required = ido;
    $("#mSugo").textContent = T(ido ? "admin.timeBound" : "admin.notTimeBound");
  };
  $("#mCsop").addEventListener("change", hatFrissit);
  hatFrissit();

  const iso = (v) => (v ? new Date(v).toISOString() : null);
  $("#mAd").addEventListener("click", async () => {
    try {
      await adminPost("/api/admin/megbizas", {
        felhasznalo: $("#mFelh").value, csoport: $("#mCsop").value,
        hatokor: $("#mHat").value, tol: iso($("#mTol").value) ?? new Date().toISOString(),
        ig: iso($("#mIg").value), forras: $("#mForras").value, miert: $("#mMiert").value,
      });
      await adminRajzol();
    } catch (e) { alert(e.message); }
  });
  $("#ujFelh").addEventListener("click", async () => {
    try {
      await adminPost("/api/admin/felhasznalo", {
        felhasznalonev: $("#ujBnev").value, nev: $("#ujNev").value,
        jelszo: $("#ujJelszo").value, szolgaltato: $("#ujSzolg").value,
      });
      await adminRajzol();
    } catch (e) { alert(e.message); }
  });
  for (const b of document.querySelectorAll("[data-vissza]")) {
    b.addEventListener("click", async () => {
      try { await adminPost("/api/admin/megbizas/visszavon", { id: b.dataset.vissza });
        await adminRajzol(); } catch (e) { alert(e.message); }
    });
  }
  for (const b of document.querySelectorAll("[data-zar]")) {
    b.addEventListener("click", async () => {
      const miert = prompt(T("admin.lockReason"));
      if (!miert) return;
      try { await adminPost("/api/admin/felhasznalo/allapot",
        { id: b.dataset.zar, allapot: "zarolt", miert }); await adminRajzol(); }
      catch (e) { alert(e.message); }
    });
  }
  for (const b of document.querySelectorAll("[data-old]")) {
    b.addEventListener("click", async () => {
      try { await adminPost("/api/admin/felhasznalo/allapot",
        { id: b.dataset.old, allapot: "aktiv" }); await adminRajzol(); }
      catch (e) { alert(e.message); }
    });
  }
}

/** Az eset betöltése — az elutasítás is EREDMÉNY, nem hiba. */
async function loadCase() {
  try {
    clearDenied();
    const view = await api(q("/api/case"));
    paint(view);
    $("#basis").textContent = view.basis || "";
    dpoPanel(view.roles);
    $("#entries").textContent = String(view.entries ?? 0);
    document.querySelector("main").hidden = false;
  } catch (e) {
    document.querySelector("main").hidden = true;
    showDenied(e);
    // A DPO-nak NINCS olvasási joga a lelethez — a törlési panelt ettől még
    // látnia kell. A két jog különböző, és a felület nem moshatja össze őket.
    // A DPO-nak NINCS olvasási joga a lelethez — a törlési panelt ettől még
    // látnia kell. A szerepköröket a MUNKAMENETBŐL vesszük, nem a felület
    // saját nyilvántartásából: két lista két igazság lenne.
    dpoPanel(EN?.szerepek || []);
  }
}

/**
 * A NYELV MINDEN KÉRÉSBEN OTT VAN.
 *
 * Nem a böngésző dönti el a szerveren, hanem a felhasználó választása utazik
 * — így a megosztott hivatkozás ugyanazt mutatja, mint amit a küldő látott.
 */
function q(path) {
  return path + (path.includes("?") ? "&" : "?") + "lang=" + encodeURIComponent(I18N.lang);
}

async function loadAll() {
  I18N = await api(q("/api/i18n"));
  applyStaticStrings();

  // A LEFEDETTSÉG KIMONDVA. Egy 3%-osan lefordított felület nem „részben
  // angol", hanem forrásnyelvi felület angol gombokkal — és a felhasználónak
  // ezt tudnia kell, mielőtt döntést alapoz rá.
  const w = $("#langWarn"), c = I18N.coverage;
  if (c && !c.usable) { w.textContent = c.why; w.hidden = false; }
  else w.hidden = true;

  SPEC = await api(q("/api/formspec"));
  renderForm(SPEC);
}

/**
 * INDULÁS — előbb a séma, aztán a hitelesítés, és csak utána az adat.
 *
 * A sorrend nem esztétikai: a séma cselekvő nélkül is kiszolgálható (nem
 * betegadat), az eset viszont nem. Így a bejelentkező képernyő mögött már
 * felépült felület vár, és a belépés után nincs újabb villanás.
 */
async function indul() {
  if (!(await buildAuth())) return;
  await loadCase();
}

const sel = $("#lang");
sel.value = langOf();
sel.addEventListener("change", async () => {
  I18N.lang = sel.value;
  localStorage.setItem("ogdoc.lang", sel.value);
  const u = new URL(location.href);
  u.searchParams.set("lang", sel.value);
  history.replaceState(null, "", u);
  await loadAll();
  if (EN) await loadCase();
});

I18N.lang = langOf();
await loadAll();
await indul();

/* ── a DPO törlési panelje ───────────────────────────────────────────── */

/**
 * A PANEL CSAK A DPO-NAK JELENIK MEG, és a sorrendje kötött: előbb az
 * ELŐNÉZET, aztán az, ami helyette teljesíthető. A végrehajtás gombja
 * szándékosan nincs itt: amíg blokkoló akadály áll fenn, egy „mégis” gomb
 * csak arra jó, hogy valaki rákattintson.
 */
function dpoPanel(roles) {
  const sec = $("#dpo");
  sec.hidden = !(roles || []).includes("dpo");
}

function dpoRender(nodes) {
  const out = $("#dpoOut");
  out.textContent = "";
  for (const n of nodes) out.append(n);
}

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
    caseId: $("#caseId").textContent,
    fajta: "kriptografiai",
    jogalap: "GDPR 17. cikk (1) b)",
    indoklas: T("dpo.title"),
    rendelte: { nev: "—", szerep: "dpo", at: new Date().toISOString() },
  };
  const e = await api("/api/torles/elonezet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rendelkezes }),
  });
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
