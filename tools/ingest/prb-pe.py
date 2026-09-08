#!/usr/bin/env python3
"""
PRBPERIsk — az R-csomag együtthatóinak kinyerése HELYI táblákba.

MIÉRT NEM A REPÓBA. A csomag licence GPLv2 — copyleft. A GPL a HASZNÁLATOT
nem korlátozza, a TERJESZTÉST igen: egy GPLv2 műből származtatott mű
terjesztése csak GPLv2-kompatibilis feltételekkel jogszerű. Az OGDOC
licence ma NINCS kimondva, tehát a kérdés nem eldönthető — és amíg nem az,
az együtthatók a `registry/kulso/helyi/` alá kerülnek, ami a .gitignore-ban
van. Ugyanaz a minta, mint a SNOMED CT GPS-nél, más okból:

    SNOMED  — az átalakított mű terjesztése TILOS (ND).
    PRB PE  — az átalakított mű terjesztése FELTÉTELHEZ kötött (copyleft).

Egyik esetben sem a mi döntésünk, hogy „belefér-e”.

Futtatás:  python3 tools/ingest/prb-pe.py <PRBPERIsk_0.1.0.tar.gz>
Igényel:   pyreadr  (pip install pyreadr)
"""
import hashlib
import json
import os
import re
import sys
import tarfile
import tempfile
from datetime import date

CEL = "registry/kulso/helyi/prb-pe"

# A PRIOR-EGYÜTTHATÓK NEM ÁLLNAK EBBEN A FÁJLBAN.
#
# Ez a szkript az MIT-licencű műben van; a számok a GPLv2 csomagból valók.
# Kézzel bemásolva GPL-eredetű adat kerülne az MIT-fába — pontosan az a
# szivárgás, ami ellen a `helyi/` könyvtár véd. Ezért KIOLVASSUK a csomag
# forrásából futásidőben, és a kiolvasott érték is csak oda kerül.
ERTEK_MINTA = re.compile(r"prcoef\s*<-\s*c\(([^)]*)\)", re.S)
NEV_MINTA = re.compile(r"names\(prcoef\)\s*<-\s*c\((.*)$", re.M)


def prior_egyutthatok(r_forras: str) -> dict:
    """A prior-kockázat együtthatói a csomag SAJÁT forrásából."""
    e = ERTEK_MINTA.search(r_forras)
    n = NEV_MINTA.search(r_forras)
    if not e or not n:
        raise RuntimeError(
            "a prior-együtthatók nem olvashatók ki a priorPERisk.R-ből — "
            "a csomag szerkezete változott, és találgatni nem szabad")
    ertekek = [float(x) for x in e.group(1).split(",") if x.strip()]
    # A nevek között zárójel is van („(Intercept)”), ezért idézőjelre bontunk.
    nevek = re.findall(r'"([^"]*)"', n.group(1))
    if len(ertekek) != len(nevek):
        raise RuntimeError(
            f"az együtthatók ({len(ertekek)}) és a nevek ({len(nevek)}) száma nem egyezik")
    return dict(zip(nevek, ertekek))


# A LEKÉPEZÉS a mi változóinkra. Ez is a helyi könyvtárba megy: a GPL-csomag
# felületének leírása, nem a mi művünk része.
LEKEPEZES = {
    "CHTN": {"variable": "hx.sys.htn", "tipus": "logikai"},
    "Nuli": {"variable": "ctx.parity.para", "tipus": "szarmaztatott",
             "szabaly": "1, ha para == 0 (nullipara), különben 0"},
    "HistPe": {"variable": "hx.repro.preeclampsia", "tipus": "logikai"},
    "mwkg": {"variable": "anthro.weight.current", "tipus": "eltolt",
             "szabaly": "testsúly (kg) − 75"},
    "HTKG": {"variable": "anthro.height", "tipus": "eltolt",
             "szabaly": "testmagasság (cm) − 163"},
    "Age": {"variable": "patient.age", "tipus": "eltolt", "szabaly": "életkor − 24"},
    "Smok": {"variable": "hx.life.smoking", "tipus": "logikai"},
    "SampleGA": {"variable": "ctx.ga", "tipus": "sav",
                 "szabaly": "a 8/16/20/24/28/32/37 hetes sáv KEZDETÉTŐL mért hét"},
    "PLGFMOM": {"variable": "lab.plgf", "tipus": "mom",
                "szabaly": "log10(mért) − a MoM-modell által jósolt átlag"},
    "sVEGFR1MOM": {"variable": "lab.sflt1", "tipus": "mom",
                   "szabaly": "log10(mért) − jósolt átlag; a csomagban sVEGFR1 = sFlt-1"},
    "MAPMOM": {"variable": "vitals.map", "tipus": "mom"},
    "sEngMOM": {"variable": None, "tipus": "mom",
                "hianyzik": "a szolubilis endoglin NINCS a regiszterben — "
                            "enélkül a modell nem futtatható"},
}


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    tgz = sys.argv[1]
    if not os.path.exists(tgz):
        print(f"nincs meg: {tgz}", file=sys.stderr)
        return 1

    try:
        import pyreadr
    except ImportError:
        print("pyreadr kell: pip install pyreadr", file=sys.stderr)
        return 1

    os.makedirs(CEL, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        with tarfile.open(tgz) as t:
            # Csak a szükséges fájl — a tar tartalmára nem hagyatkozunk vakon.
            tagok = [m for m in t.getmembers()
                     if m.isfile() and m.name.endswith("R/sysdata.rda")]
            prior_r = [m for m in t.getmembers()
                       if m.isfile() and m.name.endswith("R/priorPERisk.R")]
            if not tagok or not prior_r:
                print("hiányzó fájl a csomagban (sysdata.rda / priorPERisk.R)",
                      file=sys.stderr)
                return 1
            t.extract(tagok[0], tmp, filter="data")
            t.extract(prior_r[0], tmp, filter="data")
            rda = os.path.join(tmp, tagok[0].name)
            tablak = pyreadr.read_r(rda)
            with open(os.path.join(tmp, prior_r[0].name), encoding="utf8") as f:
                prior = prior_egyutthatok(f.read())

        kiirt = {}
        for nev, df in tablak.items():
            if not hasattr(df, "to_csv"):
                continue
            ki = os.path.join(CEL, f"{nev}.csv")
            df.to_csv(ki)
            kiirt[nev] = {"sorok": int(df.shape[0]), "oszlopok": int(df.shape[1])}
            print(f"  {nev:24} {df.shape[0]:>3} × {df.shape[1]:<3} → {ki}")

    with open(os.path.join(CEL, "prior-coef.json"), "w", encoding="utf8") as f:
        json.dump(prior, f, indent=2)
    print(f"  prior-együtthatók        {len(prior):>3} tétel        → {CEL}/prior-coef.json")

    # A MODELL.json az, amit a `core/kulso/modell.ts` OLVAS. A mag maga
    # semmilyen PRB-specifikus ismeretet nem tartalmaz: a tagok nevei, a
    # rétegek és a leképezés mind ITT vannak, a helyi könyvtárban.
    modell = {
        "id": "prb.pe",
        "label": {"hu": "PRB preeclampsia-kockázat (Tarca–Bhatti)",
                  "en": "PRB preeclampsia risk (Tarca-Bhatti)"},
        "licenc": "GPL-2.0",
        "figyelmeztetes":
            "GPLv2 — az OGDOC MIT. Ez a modell NEM része a terjesztett műnek: "
            "a felhasználó telepíti helyben, és a rendszer adatként olvassa.",
        "verification": "assumed",
        "verificationNote":
            "Az együtthatók a szerzők csomagjából származnak, de senki nem vetette "
            "össze őket a közleménnyel, és a modell magyar populáción nincs "
            "kalibrálva. Amíg ez így van, SZÁM NEM SZÜLETIK.",
        "retegek": ["Interval1", "Interval2", "Interval3",
                    "Interval4", "Interval5", "Interval6"],
        "retegHatarok": [8, 16, 20, 24, 28, 32, 37],
        "retegValtozo": "ctx.ga",
        "tablak": {
            "osszes": "risksrcdata.csv",
            "preterm": "pretermrisksrcdata.csv",
            "term": "termrisksrcdata.csv",
            "mom": "momsrcdata.csv",
        },
        "prior": "prior-coef.json",
        "lekepezes": LEKEPEZES,
    }
    with open(os.path.join(CEL, "MODELL.json"), "w", encoding="utf8") as f:
        json.dump(modell, f, ensure_ascii=False, indent=2)

    manifest = {
        "forras": os.path.basename(tgz),
        "sha256": sha256(tgz),
        "licenc": "GPLv2",
        "kiadva": "2020-11-19",
        "szerzok": "Adi Laurentiu Tarca, Gaurav Bhatti (Wayne State University / PRB)",
        "kinyerve": date.today().isoformat(),
        "tablak": kiirt,
        "figyelmeztetes":
            "GPLv2 (copyleft) származék. NEM kerülhet a repóba és az "
            "exportcsomagba, amíg az OGDOC licencét ki nem mondták. "
            "A `validateKulsoTerjesztes()` build-hibát ad, ha mégis megjelenik "
            "a terjesztett könyvtárban.",
    }
    with open(os.path.join(CEL, "MANIFEST.json"), "w", encoding="utf8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\n  {CEL}/  — sha256 {manifest['sha256'][:16]}…  licenc GPLv2")
    print("  A könyvtár a .gitignore-ban van: helyben áll elő, és nem terjed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
