#!/usr/bin/env python3
"""INTERGROWTH-21st standardok → normogram-táblák.

A publikált PDF-táblákból (centilis + z-érték) és a hivatalos számolótáblák
KÉPLETEIBŐL állítja elő a `registry/normogramok/intergrowth-*.json` fájlokat.

Amit a szkript ELLENŐRIZ, nem feltételez:
  - az öt biometriai standard tényleg normális eloszlású-e (a publikált
    percentilis és a mean ± z·sd eltérése),
  - a súlygyarapodásnál a `ln(gyarapodás + 8,75)` alak visszaadja-e a
    publikált centilis-táblát.

Forrás: © University of Oxford. Villar J et al., Lancet 2014;384:869–79;
Papageorghiou AT et al., Lancet 2014;384:869–79 és BJOG 2013;120:1265–71;
Cheikh Ismail L et al., BMJ 2016;352:i555; Stirnemann J et al., UOG 2017.
"""
import json, math, re, sys
from pathlib import Path
from pypdf import PdfReader

# 3., 5., 10., 50., 90., 95., 97. percentilis z-értékei
PCT = [3, 5, 10, 50, 90, 95, 97]
ZP = [-1.8807936, -1.6448536, -1.2815516, 0.0, 1.2815516, 1.6448536, 1.8807936]

MERESEK = [
    ("Head_Circumference", "us.hc", "mm", "fejkörfogat"),
    ("Abdominal_Circumference", "us.ac", "mm", "haskörfogat"),
    ("Biparietal_Diameter", "us.bpd", "mm", "biparietális átmérő"),
    ("Occipitofrontal_Diameter", "us.ofd", "mm", "occipitofrontális átmérő"),
    ("Femur_Length", "us.fl", "mm", "combcsonthossz"),
]


def tabla(path, oszlop=7):
    r = PdfReader(str(path))
    t = "\n".join((p.extract_text() or "") for p in r.pages)
    out = {}
    for sor in t.split("\n"):
        p = sor.replace("\t", " ").split()
        if len(p) >= oszlop + 1 and re.fullmatch(r"\d{1,2}", p[0]):
            try:
                out[int(p[0])] = [float(x) for x in p[1 : oszlop + 1]]
            except ValueError:
                pass
    return out


def biometria(src: Path):
    ki, jelentes = [], []
    for fajl, valtozo, egyseg, nev in MERESEK:
        z = tabla(src / f"INTERGROWTH-21st_{fajl}_Z_Scores.pdf")
        c = tabla(src / f"INTERGROWTH-21st_{fajl}_Standards.pdf")
        if not z or not c:
            sys.exit(f"HIÁNYZÓ TÁBLA: {fajl}")
        sorok, maxelt = [], 0.0
        for ga in sorted(z):
            v = z[ga]
            mean, sd = v[3], (v[4] - v[2]) / 2
            r = {"x": ga, "mean": round(mean, 2), "sd": round(sd, 3)}
            if ga in c:
                r["p"] = {str(pp): c[ga][i] for i, pp in enumerate(PCT)}
                for i, zz in enumerate(ZP):
                    maxelt = max(maxelt, abs(c[ga][i] - (mean + zz * sd)))
            sorok.append(r)
        jelentes.append(f"{nev}: {len(sorok)} sor, max eltérés {maxelt:.3f} {egyseg}")
        ki.append({
            "id": f"ng.ig21.{valtozo.split('.')[1]}",
            "parameter": valtozo, "by": "ctx.ga", "unit": egyseg,
            "kind": "published", "verification": "assumed",
            "transform": {"kind": "none"},
            "percentileTolerance": 0.5,
            "population": "egyes magzat; nemzetközi standard nyolc városi helyszínről, ALACSONY KOCKÁZATÚ, jól táplált, fertőzésektől mentes anyák magzatai — ez ELŐÍRÓ standard („így NŐNE optimális körülmények között”), nem egy magyar populáció leíró referenciája",
            "source": {"cite": f"INTERGROWTH-21st International Fetal Growth Standards — {nev} ({fajl.replace('_', ' ')}). Papageorghiou AT, Ohuma EO, Altman DG et al., Lancet 2014;384:869–79. © University of Oxford."},
            "rows": sorok,
        })
    return ki, jelentes


def sulygyarapodas(src: Path):
    """A ln(gyarapodás + 8,75) alak — a képlet a hivatalos számolótáblából."""
    c = tabla(src / "grow_gwg-nw-ct_table.pdf")
    sorok, maxelt = [], 0.0
    for ga in sorted(c):
        mean = 1.382972 - 56.14743 * ga ** -2 + 0.2787683 * ga ** 0.5
        sd = 0.2501993731 + 142.4297879 * ga ** -2 - 61.45345 * ga ** -2 * math.log(ga)
        r = {"x": ga, "mean": round(mean, 6), "sd": round(sd, 6),
             "p": {str(pp): c[ga][i] for i, pp in enumerate(PCT)}}
        for i, zz in enumerate(ZP):
            szamolt = math.exp(mean + zz * sd) - 8.75
            maxelt = max(maxelt, abs(c[ga][i] - szamolt))
        sorok.append(r)
    return [{
        "id": "ng.ig21.gwg.normalBmi",
        "parameter": "preg.weightGain", "by": "ctx.ga", "unit": "kg",
        "kind": "published", "verification": "assumed",
        "transform": {"kind": "log", "shift": 8.75},
        "percentileTolerance": 1.2,
        "population": "NORMÁLIS TERHESSÉG ELŐTTI BMI (18,5–24,9). Más BMI-kategóriára ez a tábla NEM érvényes, és a rendszer nem is helyettesíti be — a hiányzó tábla látszik.",
        "source": {"cite": "INTERGROWTH-21st International Gestational Weight Gain Standards for Women with Normal BMI. Cheikh Ismail L, Bishop DC, Pang R et al., BMJ 2016;352:i555. © University of Oxford. A ln(gyarapodás + 8,75) alak és együtthatói a hivatalos INTERGROWTH-21st GWG számolótáblából (v1.0, 2017-04-13)."},
        "rows": sorok,
    }], [f"súlygyarapodás: {len(sorok)} sor, max eltérés {maxelt:.3f} kg"]


def main():
    src = Path(sys.argv[1])
    cel = Path("registry/normogramok")
    bio, j1 = biometria(src)
    gwg, j2 = sulygyarapodas(src)
    (cel / "intergrowth-biometria.json").write_text(
        json.dumps(bio, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    (cel / "intergrowth-sulygyarapodas.json").write_text(
        json.dumps(gwg, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    for s in j1 + j2:
        print("  " + s)
    print(f"{len(bio)} biometriai + {len(gwg)} súlygyarapodási tábla kiírva.")


if __name__ == "__main__":
    main()
