#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FELÜLETTÉRKÉP → XLSX — a két forrásrendszer mezőinek teljes leltára.

A táblázat nem másolat, hanem MÉRLEG: minden mező mellett ott áll, mi lesz
vele nálunk. Öt lap:

  Összesítés   szakterületenként és állapotonként, plusz a bélyeg
  Mezők        minden mező, egy sor — ez a munkalap
  Adatlapok    laponkénti bontás a lap tanulságával
  Menüfa       a két menüfa, modulhozzárendeléssel
  Jelölések    mit jelent a huszonöt szerkezeti jelölés

Az „állapot" oszlop a `core/ui/felulet.ts` auditjából származik, nem kézi
besorolásból: ami a kódban változik, a táblázatban is változik.

Futtatás:  python3 tools/export/felulet_xlsx.py [kimenet.xlsx]
"""
import json, io, sys, subprocess, os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAPS = [("Szülészet", "registry/felulet/szuleszeti-felulet.json"),
        ("Nőgyógyászat", "registry/felulet/nogyogyaszati-felulet.json")]

# A jelölések emberi olvasata. A kulcs a `FormField` mezőneve.
JELOLESEK = [
 ("special", "Különleges adat", "GDPR 9. cikk. Csak kifejezett, célhoz kötött hozzájárulással, és soha nem folyhat be csendben egy számításba."),
 ("safetySensitive", "Biztonsági kockázat", "Egy nyomtatott dokumentumon megjelenve veszélyeztetheti a beteget. Külön láthatósági szabály kell rá."),
 ("insecureChannel", "Védtelen csatorna", "Különleges adat e-mailben, PDF-ként. A választás lehet a betegé, a csatorna biztonsága nem az."),
 ("subjectAmbiguous", "Kinek az adata?", "A mező alanya eldönthetetlen (anyai lapon magzati panel). Egy leletnél az alany a lelet fele."),
 ("pairedSubjects", "Egy sor, két alany", "Magzati és anyai érték egy sorban. Nálunk két változó, alany szerinti példánnyal."),
 ("synonymDuplicate", "Egy adat, két néven", "AST és GOT ugyanaz az enzim, két mezőben — két különböző szám állhat ugyanarról a mérésről."),
 ("unitDuplicate", "Párhuzamos mértékegység", "Az egység az ÉRTÉKHEZ tartozik, a megjelenítés váltja át."),
 ("unitMismatch", "Rossz egység", "Az egység nem az, amiben a döntési határ ki van mondva. A tévedés csendes, mert a mező neve stimmel."),
 ("allNegative", "„Minden negatív”", "Egy pipa nem állíthat negatívumot tételekről, amelyekről külön-külön nem nyilatkoztak."),
 ("handTotal", "Kézzel írt végösszeg", "A bejelölt összetevők mellé beírt összeg. Nálunk az összeg levezetett."),
 ("valueSetSuspect", "Gyanús értékkészlet", "A legördülő értékei más mezőből származnak."),
 ("labelSuspect", "Gyanús címke", "A mező címkéje más lapról származik, vagy mást jelent, mint amit mér."),
 ("orderTracking", "Megrendelve ≠ eredmény", "A kintlévő lelet nem üres mező, hanem tartozás, amit valakinek utána kell járnia."),
 ("uncertainSignificance", "Bizonytalan jelentőség (VUS)", "Harmadik eredménykategória: nem enyhébb kóros és nem majdnem normális."),
 ("noResultState", "„Nincs eredmény”", "Önálló állapot, saját okkal — nem üres mező és nem negatív lelet."),
 ("attemptFailed", "Megkísérelve, sikertelen", "Harmadik állapot az „megtörtént” és az „elmaradt” mellett. Az indoklás a lelet része."),
 ("sampleAdequacy", "Minta alkalmassága", "Elégtelen mintán a „negatív” nem negatív lelet."),
 ("screeningOnly", "Szűrés, nem diagnózis", "Az „alacsony kockázat” nem negatív lelet."),
 ("incidentalMaternal", "Mellékelet", "Magzati címke alatt anyai lelet. A közlésre a beleegyezésnek külön ki kell terjednie."),
 ("outcomeAudit", "Audit-hurok", "A korábbi állítás szembesítése a kiderült igazsággal. Enélkül a modellek soha nem mérhetők vissza."),
 ("consentGate", "Beleegyezés-kapu", "A SZÁMÍTÁS vagy a vizsgálat futtatása beleegyezéshez kötött, nem csak az adat rögzítése."),
 ("operatorGate", "Kompetencia-kapu", "A vizsgálatot végző akkreditációja vagy a felügyelet ténye."),
 ("contraindication", "Kontraindikáció-kapu", "A kezelés feltétele. Bejelöletlenül a kezelés nem indítható."),
 ("safetyPrecheck", "Biztonsági előellenőrzés", "Három állapot: igen · nem · NEM ELLENŐRIZVE. Elhallgatva a hiányzó ellenőrzés megtörténtnek látszik."),
 ("irreversible", "Visszafordíthatatlan lépés", "A kapunak a lépés ELŐTT kell zárnia."),
 ("traceable", "Nyomon követendő", "Gyártási tétel vagy eszközazonosító szintjén visszakereshető. A megőrzési ideje eltér a leletétől."),
 ("invalidates", "Érvénytelenítő adat", "Az eredményt érvénytelenítő vagy átértelmező jelölés."),
 ("modelBacked", "Modellhez kötött", "Publikált modellből származik. Hivatkozás nélkül a modell nem futhat."),
 ("assayBound", "Vizsgálathoz kötött", "A teljesítmény és a referencia a megnevezett gyártóhoz vagy platformhoz tartozik."),
 ("lotCritical", "Tételszámhoz kötött", "A MoM a reagenskészlet mediánsorához tartozik."),
 ("versionedClassification", "Verziózott osztályozás", "FIGO · IOTA · IETA · rASRM · ISCN. Verzió nélkül két intézet lelete nem hasonlítható össze."),
 ("contextualThreshold", "Kontextusfüggő határ", "A referencia a helyzettől függ (ciklusnap, menopauza, terhességi kor, gyógyszer)."),
 ("specimenBound", "Mintához kötött", "Ugyanaz az analit a szérumban, a vizeletben és a magzatvízben mást jelent."),
 ("rangeValued", "Tartomány", "Alsó és felső határ, nem egyetlen szám."),
 ("measurementContext", "Mérési körülmény", "A készülék, a fej, a behatolás útja — a mért értékkel EGYÜTT tárolandó."),
 ("prePost", "Előtte és utána", "Ugyanaz a mérés egy eseményt közrefogva."),
 ("secondAttempt", "Korlátozott megítélhetőség", "A vizsgálat korlátozottsága a lelet része."),
 ("crossFilled", "Több helyen ugyanaz", "Egy változó, több felületi hely. Két beviteli hely két igazságot tud tárolni."),
 ("crossInstance", "Példányok közötti levezetés", "Bal + jobb → összes. Kézzel írva két lapon két összeg állhat."),
 ("crossEpisode", "Epizódok közötti hivatkozás", "A beavatkozás megelőzi az epizódot, amelyben a hatása jelentkezik."),
 ("scoped", "Példányonkénti adat", "Eseménysorozat vagy oldalanként/magzatonként ismétlődő készlet — nem egyetlen mező."),
 ("interfaceFilled", "Interfészből", "HL7 v2 ADT/ORM. Kézzel felülírva némán szétcsúszik a két rendszer."),
 ("derived", "Levezetett", "Nálunk számított, a felületen kézzel töltendő."),
 ("gatesOutput", "Kimenetet kapuz", "Pl. a magzat nemének közlése."),
 ("refusalState", "Elutasítva", "A beteg elutasította — dokumentált döntés, nem hiány."),
 ("surgicallyAbsent", "Műtétileg hiányzik", "A szerv műtéti előzmény miatt nincs — hatodik szervállapot."),
 ("criticalCategory", "Súlyos kategória", "Kategória, nem szám, és a kategória súlyos."),
 ("boundaryNote", "Határérték-jelzés", "A modell 0%/100% határának értelmezése."),
 ("phi", "Beteg-azonosításra alkalmas", "`phi: true` jelöléssel veendő fel, exportból és lekérdezőből kizárva."),
 ("freeText", "Szabad szöveg", "A 11. fejezet szerint a klinikai adatmezők 90%-a kódolt vagy mért érték kell legyen."),
 ("required", "Kötelező"),
 ("inputSelector", "Bemenetválasztó", "Megnevezi, MELYIK mért érték megy be a számításba."),
 ("ageForRisk", "Kockázati életkor", "Nem a beteg mai kora (donor petesejt, mintavételkori kor)."),
 ("riskChannel", "Kockázati csatorna", "UH · biokémia · kombinált."),
 ("markerSet", "Markerkészlet", "Melyik publikáció markerkészletéhez tartozik."),
 ("subject", "Alany", "Kinek a mérése."),
 ("billing", "Elszámolási adat"),
 ("research", "Kutatási célú", "Beleegyezéshez kötött."),
]
JEL_LABEL = {k: v[0] if isinstance(v, tuple) else v for k, v, *_ in
             [(a, b, c) if len(t) == 3 else (a, b, "") for t in JELOLESEK
              for a, b, c in [(t[0], t[1], t[2] if len(t) > 2 else "")]]}

STATUS_HU = {
  "mapped": "megvan", "gap": "hiányzik", "derived": "levezetett",
  "refused": "nem vehető át", "interface": "interfészből",
  "gate": "kapu", "context": "mérési körülmény",
}

def audit():
    """A `core/ui/felulet.ts` auditja — a besorolás a KÓDBÓL jön, nem kézből."""
    src = """
    import {loadUiMap, auditFields, uiStamp} from "./core/ui/felulet.ts";
    import {loadRegistry} from "./core/load.ts";
    import {loadSzabalyok, loadDontesek, dontesAllapot, merleg, dontesStamp,
      lenyomat} from "./core/ui/dontes.ts";
    const reg = loadRegistry("registry/variables");
    const kat = loadSzabalyok("registry/felulet/dontes-szabalyok.json");
    const dnt = loadDontesek("registry/felulet/dontesek.json");
    const out = {}; const minden = [];
    for (const [name, path] of %s) {
      const m = loadUiMap(path);
      const a = auditFields(m, reg);
      minden.push(...a);
      out[name] = { stamp: uiStamp(m, reg),
        rows: a.map((x) => [x.form, x.field, x.status, x.why, x.rule]) };
    }
    const st = dontesAllapot(minden, kat, dnt);
    out.__dontes = {
      szerepek: kat.szerepek,
      szabalyok: kat.szabalyok.map((s) => ({...s, lenyomat: lenyomat(s.lenyeg)})),
      merleg: merleg(st, kat), stamp: dontesStamp(merleg(st, kat)),
      mezok: st.map((x) => [x.form, x.field, x.rule, x.allapot, x.fajta ?? "",
                            x.atkerul, x.miert]),
    };
    console.log(JSON.stringify(out));
    """ % json.dumps(MAPS)
    r = subprocess.run(["node", "--experimental-strip-types", "--input-type=module",
                        "-e", src], cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        sys.exit("az audit futtatása elbukott:\n" + r.stderr)
    return json.loads(r.stdout.splitlines()[-1])

HEAD = Font(bold=True, color="FFFFFF")
FILL = PatternFill("solid", fgColor="2F4858")
BOLD = Font(bold=True)
WRAP = Alignment(vertical="top", wrap_text=True)
TOP  = Alignment(vertical="top")
THIN = Border(bottom=Side(style="thin", color="D0D0D0"))
STATUS_FILL = {
  "nem vehető át": PatternFill("solid", fgColor="F4CCCC"),
  "kapu":          PatternFill("solid", fgColor="FFF2CC"),
  "hiányzik":      PatternFill("solid", fgColor="EFEFEF"),
  "megvan":        PatternFill("solid", fgColor="D9EAD3"),
  "levezetett":    PatternFill("solid", fgColor="D0E0E3"),
  "interfészből":  PatternFill("solid", fgColor="E6D8F0"),
  "mérési körülmény": PatternFill("solid", fgColor="FCE5CD"),
}

def sheet(wb, title, headers, widths, rows, freeze="A2"):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for c in ws[1]:
        c.font = HEAD; c.fill = FILL; c.alignment = Alignment(vertical="center")
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for r in rows:
        ws.append(r)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = WRAP if ws.column_dimensions[c.column_letter].width > 40 else TOP
            c.border = THIN
    ws.freeze_panes = freeze
    ws.auto_filter.ref = ws.dimensions
    return ws

ALLAPOT_HU = {
  "dontve": "eldöntve", "eldontetlen": "eldöntetlen",
  "elavult": "elavult aláírás", "hianyos": "hiányos aláírás",
}
FAJTA_HU = {
  "atvesszuk": "átvesszük", "atalakitva": "átalakítva vesszük át",
  "nem": "nem vesszük át", "": "",
}
ALLAPOT_FILL = {
  "eldöntve": PatternFill("solid", fgColor="D9EAD3"),
  "eldöntetlen": PatternFill("solid", fgColor="F4CCCC"),
  "elavult aláírás": PatternFill("solid", fgColor="FFF2CC"),
  "hiányos aláírás": PatternFill("solid", fgColor="FCE5CD"),
}

def main(out_path):
    A = audit()
    D = A.pop("__dontes")
    global DSTATE
    DSTATE = {(f, fl): (allapot, atkerul, fajta, miert)
              for f, fl, _r, allapot, fajta, atkerul, miert in D["mezok"]}
    maps = {}
    for name, path in MAPS:
        maps[name] = json.load(io.open(os.path.join(ROOT, path), encoding="utf-8"))

    wb = Workbook(); wb.remove(wb.active)

    # ── Mezők ────────────────────────────────────────────────────────
    rows = []
    for name, _ in MAPS:
        m = maps[name]
        forms = {f["id"]: f for f in m["forms"]}
        for form_id, field_label, status, why, rule in A[name]["rows"]:
            f = forms[form_id]
            fld = next(x for x in f["fields"] if x["label"] == field_label)
            jel = [lbl for key, lbl, *_ in JELOLESEK if fld.get(key)]
            d = DSTATE.get((form_id, field_label))
            rows.append([
                name, " › ".join(f["menuPath"]) or "(gyökér)", f["label"]["hu"],
                field_label, STATUS_HU[status], rule,
                ALLAPOT_HU.get(d[0], "") if d else "—",
                ("igen" if d[1] else "nem") if d else "—",
                " · ".join(jel), fld.get("variable") or "", why,
            ])
    sheet(wb, "Mezők",
          ["Szakterület", "Menüpont", "Adatlap", "Mező", "Állapot", "Szabály",
           "Döntés", "Átkerül", "Jelölések", "Változó", "Miért"],
          [14, 30, 34, 52, 17, 22, 15, 10, 34, 18, 96], rows)
    ws = wb["Mezők"]
    for r in ws.iter_rows(min_row=2, min_col=5, max_col=5):
        f = STATUS_FILL.get(r[0].value)
        if f: r[0].fill = f

    # ── Döntések ─────────────────────────────────────────────────────
    # Ez a MUNKALAP: a 3. lépés (docs/13-18-lepes.md) nem 326-szor dönt, hanem
    # 38-szor. Az utolsó öt oszlop üres — azt az ülés tölti ki, nem a gép.
    per_rule = {}
    for f, fl, r, allapot, fajta, atkerul, miert in D["mezok"]:
        per_rule.setdefault(r, []).append(allapot)
    rows = []
    for s_ in D["szabalyok"]:
        st = per_rule.get(s_["rule"], [])
        allapot = ALLAPOT_HU.get(st[0], "") if st else "nem szólal meg"
        rows.append([
            len(st), s_["rule"], s_["cim"],
            D["szerepek"].get(s_["felelos"], s_["felelos"]),
            " + ".join(D["szerepek"].get(x, x) for x in sorted(s_["kell"])),
            s_["lenyeg"],
            FAJTA_HU.get(s_["javaslat"], s_["javaslat"]), s_["mit"],
            allapot, s_["lenyomat"],
            "", "", "", "", "",
        ])
    rows.sort(key=lambda r: (-r[0], r[1]))
    sheet(wb, "Döntések",
          ["Mező", "Szabály", "Cím", "FELELŐS", "Kell hozzá", "Amit aláírnak",
           "Javaslat", "Mit jelent az átalakítás", "Állapot ma", "Lenyomat",
           "DÖNTÉS", "INDOKLÁS (egy mondat)", "MIT ALAKÍTUNK ÁT",
           "ALÁÍRÓK (név · szerep)", "DÁTUM"],
          [7, 24, 30, 24, 34, 90, 22, 70, 17, 19, 22, 60, 60, 40, 13], rows)
    ws = wb["Döntések"]
    for r in ws.iter_rows(min_row=2, min_col=9, max_col=9):
        f = ALLAPOT_FILL.get(r[0].value)
        if f: r[0].fill = f
    dv = DataValidation(type="list",
                        formula1='"átvesszük,átalakítva vesszük át,nem vesszük át"',
                        allow_blank=True, showDropDown=False)
    dv.error = "A döntés csak ez a három lehet."
    ws.add_data_validation(dv)
    dv.add("K2:K%d" % (len(rows) + 1))
    for c in ws[1][10:]:
        c.fill = PatternFill("solid", fgColor="7F6000")
    ws["D1"].fill = PatternFill("solid", fgColor="45818E")

    # ── Adatlapok ────────────────────────────────────────────────────
    rows = []
    for name, _ in MAPS:
        by_form = {}
        for form_id, _f, status, _w, _r in A[name]["rows"]:
            by_form.setdefault(form_id, []).append(STATUS_HU[status])
        for f in maps[name]["forms"]:
            st = by_form.get(f["id"], [])
            rows.append([
                name, " › ".join(f["menuPath"]) or "(gyökér)", f["label"]["hu"],
                len(f["fields"]),
                sum(1 for s in st if s == "nem vehető át"),
                sum(1 for s in st if s == "kapu"),
                sum(1 for s in st if s == "hiányzik"),
                (f.get("note") or {}).get("hu", ""),
            ])
    sheet(wb, "Adatlapok",
          ["Szakterület", "Menüpont", "Adatlap", "Mező", "Nem vehető át", "Kapu",
           "Hiányzik", "A lap tanulsága"],
          [14, 30, 44, 8, 14, 8, 10, 130], rows)

    # ── Menüfa ───────────────────────────────────────────────────────
    rows = []
    for name, _ in MAPS:
        m = maps[name]
        has_form = {}
        for f in m["forms"]:
            key = " › ".join(f["menuPath"])
            has_form[key] = has_form.get(key, 0) + 1
        for n in m["menu"]:
            full = " › ".join([*n["path"], n["label"]])
            rows.append([name, len(n["path"]), " › ".join(n["path"]) or "(gyökér)",
                         n["label"], n.get("module") or "",
                         has_form.get(full, 0)])
    sheet(wb, "Menüfa",
          ["Szakterület", "Szint", "Szülő", "Menüpont", "Modul", "Adatlap"],
          [14, 7, 34, 34, 8, 9], rows)

    # ── Jelölések ────────────────────────────────────────────────────
    used = {}
    for name, _ in MAPS:
        for f in maps[name]["forms"]:
            for fld in f["fields"]:
                for key, *_ in JELOLESEK:
                    if fld.get(key): used[key] = used.get(key, 0) + 1
    rows = [[lbl, key, used.get(key, 0), (t[2] if len(t) > 2 else "")]
            for t in JELOLESEK for key, lbl in [(t[0], t[1])]]
    rows.sort(key=lambda r: (-r[2], r[0]))
    sheet(wb, "Jelölések", ["Jelölés", "Kulcs", "Előfordulás", "Mit jelent"],
          [32, 26, 13, 120], rows)

    # ── Összesítés (elöl) ────────────────────────────────────────────
    ws = wb.create_sheet("Összesítés", 0)
    ws.column_dimensions["A"].width = 34
    for i in "BCDEFGH": ws.column_dimensions[i].width = 15
    ws["A1"] = "A két forrásrendszer mezőleltára"; ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = ("A táblázat nem másolat, hanem mérleg: minden mező mellett ott áll, "
                "mi lesz vele nálunk. Az „állapot” oszlop a validátor auditjából "
                "származik, nem kézi besorolásból.")
    ws["A2"].alignment = Alignment(wrap_text=True); ws.row_dimensions[2].height = 30
    ws.merge_cells("A2:H2")

    r = 4
    order = ["megvan", "levezetett", "kapu", "mérési körülmény", "interfészből",
             "nem vehető át", "hiányzik"]
    ws.cell(r, 1, "Szakterület").font = HEAD; ws.cell(r, 1).fill = FILL
    for i, s in enumerate(order, 2):
        c = ws.cell(r, i, s); c.font = HEAD; c.fill = FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
    ws.cell(r, len(order) + 2, "Összes").font = HEAD
    ws.cell(r, len(order) + 2).fill = FILL
    for name, _ in MAPS:
        r += 1
        st = [STATUS_HU[s] for _f, _l, s, _w, _r in A[name]["rows"]]
        ws.cell(r, 1, name).font = BOLD
        for i, s in enumerate(order, 2):
            c = ws.cell(r, i, st.count(s))
            if STATUS_FILL.get(s): c.fill = STATUS_FILL[s]
        ws.cell(r, len(order) + 2, len(st)).font = BOLD
    r += 1
    ws.cell(r, 1, "Együtt").font = BOLD
    allst = [STATUS_HU[s] for name, _ in MAPS for _f, _l, s, _w, _r in A[name]["rows"]]
    for i, s in enumerate(order, 2):
        ws.cell(r, i, allst.count(s)).font = BOLD
    ws.cell(r, len(order) + 2, len(allst)).font = BOLD

    r += 2
    for name, _ in MAPS:
        m = maps[name]
        ws.cell(r, 1, name + " — bélyeg").font = BOLD
        ws.cell(r, 2, A[name]["stamp"]); ws.merge_cells(start_row=r, start_column=2,
                                                        end_row=r, end_column=9)
        r += 1
        ws.cell(r, 1, "forrás")
        ws.cell(r, 2, m["source"]["cite"]); ws.merge_cells(start_row=r, start_column=2,
                                                           end_row=r, end_column=9)
        r += 1
        ws.cell(r, 1, "ami még hiányzik")
        c = ws.cell(r, 2, (m.get("coverageNote") or {}).get("hu", ""))
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=9)
        ws.row_dimensions[r].height = 60
        r += 2

    ws.cell(r, 1, "A lapokról").font = BOLD; r += 1
    for t in [("Döntések", "a 3. lépés munkalapja: 38 szabály, javaslattal — "
                             "az utolsó öt oszlopot az ülés tölti ki"),
              ("Mezők", "minden mező egy sor: hol áll, mi lesz vele, és miért"),
              ("Adatlapok", "laponkénti bontás, a lap tanulságával"),
              ("Menüfa", "a két menüfa modulhozzárendeléssel"),
              ("Jelölések", "a szerkezeti jelölések jelentése és előfordulása")]:
        ws.cell(r, 1, t[0]); ws.cell(r, 2, t[1])
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=9); r += 1

    wb.save(out_path)
    print(out_path, "·", len(allst), "mező")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "felulet-mezoleltar.xlsx")
