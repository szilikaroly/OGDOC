#!/usr/bin/env python3
"""
U.S. MEC 2024 összefoglaló tábla → registry/fogamzas/usmec-2024.json

MIÉRT POZÍCIÓ SZERINT OLVASSUK, ÉS NEM SZÖVEGSORBÓL

A tábla minden módszernél KÉT oszlopot tart: I = kezdés (initiation), C =
folytatás (continuation). Ahol a kettő egyenlő, a PDF egyetlen összevont,
KÖZÉPRE zárt cellát rajzol; ahol eltér, két külön cellát. A kinyert
szövegsorban ez a különbség NYOMTALANUL ELTŰNIK — a „4 2 4 2 2 2 1 2” sorból
nem derül ki, hogy az első négy szám két módszer kezdés/folytatás párja, a
maradék négy pedig négy módszer összevont értéke.

Egy szövegsor-alapú olvasás ezért kénytelen találgatni az oszlophatárt, és a
találgatás pont ott téved, ahol a tábla a legtöbbet mondja. Konkrét példa
ebből a táblából: HIV-fertőzés, nem jól beállított beteg, réz-IUD — kezdés 2,
FOLYTATÁS 1. A folytatási oszlop elvesztésével a rendszer egy MŰKÖDŐ IUD
eltávolítását javasolná, miközben az elhagyás kockázata (nem tervezett
terhesség) éppen ilyenkor a legnagyobb.

Ezért az oszlopközepeket a fejléc saját „I” és „C” betűiből vesszük
oldalanként, és minden cellaértéket a legközelebbi réshez rendelünk:

    I-közép ...... 9,3 pt ...... összevont közép ...... 9,3 pt ...... C-közép

A vízszintes vonalak NEM használhatók összevonás-detektálásra: a PDF minden
sorhatárnál kirajzolja őket, függetlenül attól, hogy a cella függőlegesen
össze van-e vonva. Az öröklést ezért kimondott, ELLENŐRZÖTT szabály végzi
(lásd `orokoltet`), nem vonalgeometria.

Amit nem sikerül réshez rendelni, azt KIÍRJUK, nem eldobjuk.
"""
import json, re, sys, collections
from pathlib import Path

import pdfplumber

OSZLOP = ["cu_iud", "lng_iud", "implant", "dmpa", "pop", "chc"]
CHC_TAGOK = ["coc", "patch", "ring"]

ERTEK = re.compile(r"^(NA|[1-4](?:/[1-4])?)([\*‡†]*)$")
JELOLES = re.compile(r"^(?:([a-h])|(i{1,3}|iv|v))\.$")
TOL = 4.6           # pt — a rések 9,3 pt-ra vannak egymástól


def oszlopsavok(page):
    """A négy címkeoszlop (feltétel/alfeltétel × bal/jobb tábla) x-határai a
    vízszintes cellavonalak leggyakoribb (x0, x1) párjaiból."""
    c = collections.Counter((round(e["x0"]), round(e["x1"]))
                            for e in page.edges
                            if e["orientation"] == "h" and e["x1"] - e["x0"] > 40)
    # a fél pontos rajzeltérések miatt a közeli (x0, x1) párokat összevonjuk
    osszevont = {}
    for (x0, x1), n in c.items():
        kulcs = next((k for k in osszevont if abs(k[0] - x0) <= 2 and abs(k[1] - x1) <= 2), None)
        if kulcs is None:
            osszevont[(x0, x1)] = n
        else:
            osszevont[kulcs] += n
    sav = sorted(k for k, n in osszevont.items() if n >= 15)
    if len(sav) != 4:
        raise SystemExit(f"{len(sav)} címkeoszlopot találtam 4 helyett: {sav}")
    return sav  # [(feltétel bal), (alfeltétel bal), (feltétel jobb), (alfeltétel jobb)]


def vonalak(page, x0, x1):
    """Az adott oszlopot teljes szélességében átfogó vízszintes vonalak y-ai."""
    ys = {round(e["top"], 1) for e in page.edges
          if e["orientation"] == "h" and e["x0"] <= x0 + 1.5 and e["x1"] >= x1 - 1.5}
    return sorted(ys)


def savokra(ys):
    """Egymást követő vonalpárokból sávok."""
    return [(ys[i], ys[i + 1]) for i in range(len(ys) - 1)]


def slotok(page):
    fej = [w for w in page.extract_words() if w["text"] in ("I", "C") and w["top"] < 135]
    fej.sort(key=lambda w: w["x0"])
    if len(fej) != 24:
        raise SystemExit(f"A fejlécben {len(fej)} I/C betű van 24 helyett — a tábla alakja megváltozott.")
    ki = []
    for j in range(0, 24, 2):
        i_x = (fej[j]["x0"] + fej[j]["x1"]) / 2
        c_x = (fej[j + 1]["x0"] + fej[j + 1]["x1"]) / 2
        ki.append((OSZLOP[(j // 2) % 6], (j // 2) // 6, (i_x, (i_x + c_x) / 2, c_x)))
    return ki


def szoveg(page, x0, x1, lo, hi):
    """Az adott cellába eső szavak, olvasási sorrendben. A felső indexek
    (‡, †) 1 pt-tal elcsúsztatják az alapvonalat, ezért 2,5 pt-os tűréssel
    fűzzük sorba a szavakat — enélkül a „History of bariatric surgery‡”
    „surgery‡ History of bariatric” lesz."""
    ws = [w for w in page.extract_words()
          if x0 - 1 <= w["x0"] < x1 and lo - 0.5 < w["top"] <= hi + 0.5]
    ws.sort(key=lambda w: w["top"])
    sorok, cur = [], []
    for w in ws:
        if cur and w["top"] - cur[0]["top"] > 2.5:
            sorok.append(cur); cur = []
        cur.append(w)
    if cur:
        sorok.append(cur)
    return " ".join(" ".join(w["text"] for w in sorted(r, key=lambda w: w["x0"]))
                    for r in sorok).strip()


def olvas(pdf_path):
    sorok = []
    with pdfplumber.open(pdf_path) as pdf:
        for pi, pg in enumerate(pdf.pages):
            sav = oszlopsavok(pg)
            sl = slotok(pg)
            szavak = pg.extract_words()
            for t in (0, 1):
                c_x0, c_x1 = sav[t * 2]
                s_x0, s_x1 = sav[t * 2 + 1]
                # Az adatterület az alfeltétel-oszlop jobb szélétől az utolsó
                # C-rés fél oszlopnyi jobb széléig tart. Szűkebb ablak levágná a
                # széles cellákat („1/2*” balra lóg az I-rés közepétől), bővebb
                # beengedné a lábjegyzetet („CS 349509-C”).
                adat_x0 = s_x1 + 0.5
                # FELSŐ HATÁR IS KELL. Alsó határ nélkül a bal tábla sorai
                # beszippantják a jobb tábla összes szavát (és az oldal
                # lábjegyzetét, a „CS 349509-C” kiadványszámot is), mert azok
                # x-e nagyobb az adatoszlop kezdeténél.
                adat_x1 = max(s[2] for n, tt, s in sl if tt == t) + 9.9
                fsavok = savokra(vonalak(pg, c_x0, c_x1))
                for lo, hi in savokra(vonalak(pg, s_x0, s_x1)):
                    kat, jelek, egyeb = {}, {}, []
                    cellak = collections.defaultdict(list)
                    for w in szavak:
                        if not (adat_x0 <= w["x0"] and w["x1"] <= adat_x1):
                            continue
                        if not (lo - 0.5 < w["top"] <= hi + 0.5):
                            continue
                        x = (w["x0"] + w["x1"]) / 2
                        legjobb, tav = None, 1e9
                        for nev, tt, (ix, mx, cx) in sl:
                            if tt != t:
                                continue
                            for res, xx in (("I", ix), ("IC", mx), ("C", cx)):
                                if abs(x - xx) < tav:
                                    legjobb, tav = (nev, res), abs(x - xx)
                        if legjobb is None or not (sl[0][2][0] - 14 <= x or True):
                            continue
                        cellak[legjobb[0]].append((w, x, legjobb[1], tav))
                    for m, tetelek in cellak.items():
                        # KÜLÖN ESET: a CHC-cella maga nevezi meg az almódszereket
                        # („COCs: 3” / „P/R: 1”). Ilyenkor az oszlopréshez rendelés
                        # értelmetlen — a cella szövegét kell olvasni.
                        cimkes = [x for x in tetelek if x[0]["text"] in ("COCs:", "P/R:")]
                        if cimkes:
                            for w, x, _, _ in cimkes:
                                jobbra = sorted((y for y in tetelek
                                                 if y[0]["x0"] > w["x1"] - 0.5
                                                 and abs(y[0]["top"] - w["top"]) <= 2.5),
                                                key=lambda y: y[0]["x0"])
                                if not jobbra:
                                    continue
                                mm = ERTEK.match(jobbra[0][0]["text"])
                                if not mm:
                                    continue
                                cel = ["coc"] if w["text"] == "COCs:" else ["patch", "ring"]
                                for c in cel:
                                    kat[c] = {"k": mm.group(1), "f": mm.group(1)}
                                    if mm.group(2):
                                        jelek[c] = mm.group(2)
                            continue
                        for w, x, res, tav in tetelek:
                            mm = ERTEK.match(w["text"])
                            if not mm or tav > TOL:
                                egyeb.append((m, w["text"], round(w["top"], 1), w["x0"]))
                                continue
                            d = kat.setdefault(m, {})
                            if res in ("I", "IC"):
                                d["k"] = mm.group(1)
                            if res in ("C", "IC"):
                                d["f"] = mm.group(1)
                            if mm.group(2):
                                jelek[m] = mm.group(2)
                    felt = ""
                    for flo, fhi in fsavok:
                        if flo - 0.5 < (lo + hi) / 2 <= fhi + 0.5:
                            felt = szoveg(pg, c_x0, c_x1, flo, fhi)
                            break
                    egyeb.sort(key=lambda e: (e[2], e[3]))
                    sorok.append({
                        "oldal": pi, "tabla": t, "sav": (lo, hi), "feltetel": felt,
                        "alfeltetel": szoveg(pg, s_x0, s_x1, lo, hi),
                        "kat": kat, "jelek": jelek,
                        "megjegyzes": " ".join(e[1] for e in egyeb).strip(),
                    })
    return sorok


KORSAV = re.compile(r"(Menarche to <\d+|≥\d+|>\d+|\d+–\d+)\s*yrs\s*:\s*([1-4])")


def korfuggo(pdf_path):
    """Az „Age” sor NEM lapos besorolás: módszerenként korsávokra bontott.
    Kihagyni annyi lenne, mint azt mondani, hogy az életkor nem számít."""
    ki = {}
    with pdfplumber.open(pdf_path) as pdf:
        pg = pdf.pages[0]
        sl = slotok(pg)
        sav = oszlopsavok(pg)
        rsavok = savokra(vonalak(pg, *sav[1]))
        cel = next(((lo, hi) for lo, hi in rsavok
                    if szoveg(pg, *sav[0], lo, hi).startswith("Age")), None)
        if cel is None:
            raise SystemExit("Az „Age” sor nincs meg a bal tábla feltétel-oszlopában.")
        lo, hi = cel
        for nev, tt, (ix, mx, cx) in sl:
            if tt != 0:
                continue
            t = szoveg(pg, ix - 19, cx + 10, lo, hi)
            savok = [{"kor": a.replace("Menarche to ", "menarche–"), "kat": int(b)}
                     for a, b in KORSAV.findall(t.replace("yrs:", "yrs: "))]
            if not savok:
                raise SystemExit(f"Az „Age” sor {nev} oszlopából nem jött ki korsáv: {t!r}")
            ki[nev] = savok
    return ki


ALFELT = re.compile(r"^(?:([a-h])|(i{1,3}|iv|v))\.")
PROZA = []


def szoveges(nyers):
    """Számok nélküli, de kategóriáról BESZÉLŐ sorok. A táblában egy ilyen van:
    „All other ARVs are 1 or 2 for all methods”. Számcella híján kiesne a
    mátrixból, pedig épp azt mondja meg, mi a helyzet a fel nem sorolt
    szerekkel — és a kiesése úgy látszana, mintha a tábla hallgatna róluk."""
    # Csak olyan prózasor számít, amelynek a FELTÉTELE tényleg szerepel a
    # mátrixban — különben a fejléc jelmagyarázata („KEY: 1 = No restriction…”)
    # is besétálna klinikai tartalomként.
    valos = {s["feltetelTeljes"] for s in nyers if s["kat"]}
    ki = []
    for s in nyers:
        if s["kat"] or not s["alfeltetel"] or s["feltetelTeljes"] not in valos:
            continue
        if re.search(r"\b[1-4]\b", s["alfeltetel"]):
            ki.append({"feltetel": s["feltetelTeljes"], "szoveg": s["alfeltetel"],
                       "oldal": s["oldal"] + 1})
    return ki


def utvonal(minden):
    """A sorok TELJES útvonala: feltétel → betűs alfeltétel → római alsor.

    Két oka van, hogy ez nem hagyható el:

    a) A feltétel-cella függőlegesen összevont, és a PDF a szöveget csak a
       blokk tetejére rajzolja. A „Gallbladder disease” alatti i/ii/iii sorok
       feltétel-cellája ÜRES — továbbvitel nélkül névtelen sorok lennének.

    b) A római alsor önmagában nem egyedi. „i. With other risk factors for
       VTE” a szoptatásnál KÉTSZER szerepel (21–<30 nap és 30–42 nap alatt),
       más besorolással. A betűs szülő nélkül a két klinikailag különböző sor
       ugyanarra a kulcsra esne, és a keresés a rosszabbikat is eltalálhatná.
    """
    felt, szulo, elozo_kulcs = "", None, None
    for s in minden:
        kulcs = (s["oldal"], s["tabla"])
        if kulcs != elozo_kulcs:
            felt, szulo, elozo_kulcs = "", None, kulcs
        if s["feltetel"].strip():
            felt = s["feltetel"].strip()
        s["feltetelTeljes"] = felt
        m = ALFELT.match(s["alfeltetel"])
        s["szint"] = 0 if not m else (1 if m.group(1) else 2)
        if s["szint"] == 1:
            szulo = s["alfeltetel"]
        elif s["szint"] == 0:
            szulo = None
        s["szuloAlfeltetel"] = szulo if s["szint"] == 2 else None
    return minden


def jsonra(pdf_path):
    minden = utvonal(olvas(pdf_path))
    PROZA[:] = szoveges(minden)
    sorok = [s for s in minden if s["kat"]]

    # ÖRÖKLÉS. A táblában a függőlegesen összevont cellát a PDF nem jelöli:
    # minden sorhatárnál kirajzolja a vonalat. A „b. HIV infection” sor
    # hormonális oszlopai LÁTHATÓAN átnyúlnak az „i.” és „ii.” alsorokra —
    # ezt szabállyal pótoljuk, nem geometriával: a római számmal jelölt alsor
    # a betűvel jelölt szülőjétől veszi át azt, amit maga nem sorol be.
    for i, s in enumerate(sorok):
        if s["szint"] != 2:
            continue
        szulo = next((sorok[j] for j in range(i - 1, -1, -1)
                      if sorok[j]["szint"] == 1
                      and sorok[j]["feltetelTeljes"] == s["feltetelTeljes"]
                      and sorok[j]["alfeltetel"] == s["szuloAlfeltetel"]), None)
        if szulo is None:
            continue
        s["oroklott"] = sorted(m for m in szulo["kat"] if m not in s["kat"])
        for m in s["oroklott"]:
            s["kat"][m] = dict(szulo["kat"][m])
            if m in szulo["jelek"]:
                s["jelek"][m] = szulo["jelek"][m]
        if s["oroklott"]:
            # a szülő ezekre a módszerekre már nem önálló sor
            szulo.setdefault("gyerekre", []).extend(s["oroklott"])

    ki = []
    for s in sorok:
        kat, honnan = {}, {}
        for m, v in s["kat"].items():
            celok = CHC_TAGOK if m == "chc" else [m]
            for c in celok:
                kat[c] = {"k": v.get("k"), "f": v.get("f")}
                # A kettő EGYSZERRE is igaz lehet, és mindkettő számít: a HIV
                # alsorok kombinált tablettájának értéke a szülősor összevont
                # cellájából jön (függőleges összevonás), ÉS a közös CHC-oszlopból
                # (vízszintes összevonás). Egyetlen címkére szűkítve az egyik
                # nyomtalanul eltűnne.
                h = []
                if m in s.get("oroklott", []):
                    h.append("orokolt")
                if m == "chc":
                    h.append("chc")
                honnan[c] = h or ["sajat"]
        hianyzo = [k for k, v in kat.items() if v["k"] is None or v["f"] is None]
        if hianyzo:
            raise SystemExit(f"Fél cella: {s['feltetel']} / {s['alfeltetel']} → {hianyzo}")
        ki.append({
            "feltetel": s["feltetelTeljes"],
            "alfeltetel": " / ".join(x for x in (s["szuloAlfeltetel"], s["alfeltetel"]) if x)
                          or None,
            "kat": kat,
            "honnan": honnan,
            "jelek": {(c if m != "chc" else c): v
                      for m, v in s["jelek"].items()
                      for c in (CHC_TAGOK if m == "chc" else [m])},
            "jegyzet": s["megjegyzes"] or None,
            "oldal": s["oldal"] + 1,
        })
    return ki


MODSZERNEV = {
    "cu_iud": "Réz-IUD", "lng_iud": "LNG-IUD", "implant": "Implantátum",
    "dmpa": "DMPA (depó medroxiprogeszteron-acetát)",
    "pop": "Progesztogén-tabletta (POP)", "coc": "Kombinált tabletta (COC)",
    "patch": "Tapasz", "ring": "Hüvelygyűrű",
}

NOTE = """KÖZKINCS: az Egyesült Államok szövetségi kormányzati munkája (CDC, MMWR RR-73(4), 2024).

A MÁTRIX NEM SZABÁLYTÁBLA, HANEM KERESŐ. Nincs sorrend és nincs első találat: a feltétel és a módszer metszete adja a kategóriát.

A KEZDÉS ÉS A FOLYTATÁS KÉT KÜLÖN OSZLOP. A tábla minden módszernél I (initiation) és C (continuation) oszlopot tart. Ezért `kat` minden módszernél `{k, f}` pár, akkor is, ha a kettő egyenlő. Egyetlen számra összevonva pont az veszne el, ami a legtöbbet mondja: HIV-fertőzés nem beállított beteg + réz-IUD = kezdés 2, FOLYTATÁS 1 — a folytatási oszlop nélkül a rendszer egy működő IUD eltávolítását javasolná.

A `honnan` MEZŐ AZT MONDJA MEG, HONNAN VAN AZ ÉRTÉK:
  sajat    — a módszer saját cellájából
  chc      — a közös CHC-oszlopból (tabletta, tapasz, gyűrű EGY cella). Ilyenkor a három módszer közti KÜLÖNBSÉG NEM LEVEZETHETŐ ebből a forrásból; nem az következik belőle, hogy nincs különbség.
  orokolt  — a szülősor függőlegesen összevont cellájából (pl. a „b. HIV infection” hormonális oszlopai átnyúlnak az „i.” és „ii.” alsorokra).

AZ „NA” NEM HIÁNY, ÉS NEM IS „1”. Terhességben a hormonális módszerek NA = nem értelmezhető (a fogamzásgátlás céltalan, nem veszélyes), a réz-IUD viszont 4 (a behelyezés ártalmas). A kettőt egy „nincs besorolás” alá vonni a veszélyeset tüntetné el.

A „2/4” ALAKÚ ÉRTÉK VAGYLAGOS: a forrás lábjegyzete dönti el, melyik érvényes. Egyetlen számra kerekíteni találgatás lenne.

AMI NINCS A TÁBLÁBAN, ARRÓL NEM KÖVETKEZIK, HOGY SZABAD: ez az összefoglaló lap a teljes ajánlás részhalmaza."""


if __name__ == "__main__":
    src = sys.argv[1]
    sorok = jsonra(src)
    ki = {
        "id": "usmec.2024",
        "megnevezes": "U.S. Medical Eligibility Criteria for Contraceptive Use (U.S. MEC), 2024 — összefoglaló tábla",
        "verzio": "2024",
        "forras": "CDC, Summary Chart of U.S. Medical Eligibility Criteria for Contraceptive Use (MMWR RR-73(4), 2024)",
        "hivatkozas": "https://www.cdc.gov/contraception/hcp/usmec/",
        "note": NOTE,
        "modszerek": MODSZERNEV,
        "chcTagok": CHC_TAGOK,
        "kategoriak": {
            "1": "Nincs korlátozás — a módszer használható.",
            "2": "Az előnyök általában felülmúlják az elméleti vagy igazolt kockázatot.",
            "3": "Az elméleti vagy igazolt kockázat rendszerint felülmúlja az előnyöket. A módszer csak akkor jön szóba, ha nincs elfogadhatóbb alternatíva, és szakorvosi megítélés mellett.",
            "4": "Elfogadhatatlan egészségi kockázat — a módszer NEM használható.",
            "NA": "Nem értelmezhető: a módszer ebben a helyzetben nem alkalmazandó. NEM azonos az „1”-gyel, és nem is hiányzó adat.",
        },
        "korfuggo": {"feltetel": "Age", "modszerenkent": korfuggo(src)},
        "szovegesSorok": PROZA,
        "sorok": sorok,
    }
    cel = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    sz = json.dumps(ki, ensure_ascii=False, indent=1)
    if cel:
        cel.write_text(sz + "\n", encoding="utf8")
        elter = [s for s in sorok if any(v["k"] != v["f"] for v in s["kat"].values())]
        na = [s for s in sorok if any(v["k"] == "NA" for v in s["kat"].values())]
        vagy = [s for s in sorok if any("/" in str(v["k"]) or "/" in str(v["f"])
                                        for v in s["kat"].values())]
        orok = [s for s in sorok if any("orokolt" in v for v in s["honnan"].values())]
        print(f"{cel}: {len(sorok)} sor")
        print(f"  kezdés ≠ folytatás : {len(elter)} sor")
        print(f"  NA (nem értelmezhető): {len(na)} sor")
        print(f"  vagylagos (n/m)     : {len(vagy)} sor")
        print(f"  öröklött cellával   : {len(orok)} sor")
    else:
        print(sz)
