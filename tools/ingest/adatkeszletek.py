#!/usr/bin/env python3
"""Női egészség AI-adatkészletek táblája → `registry/adatkeszletek/noi-egeszseg.json`.

Forrás: a lektorált közlemény 1. és 2. táblázata (2026.04.28.), CSV alakban.

A szkript NEM csak átmásol: ELLENŐRZI a táblát önmagával szemben.
  - az ország és a megadott WHO-régió összefér-e,
  - a megjegyzés szövege ellentmond-e az `eredet` mezőnek,
  - a régiókód szabályos-e (a „WPR” nem „WPRO”: a csoportosítást elrontja).

Ez nem szőrszálhasogatás. Aki „európai adatkészletekre” szűr, a hibás sorok
miatt a japán biobankot kapja meg, a bradfordit pedig elveszíti.
"""
import csv, hashlib, io, json, os, re, sys
from collections import Counter
from pathlib import Path

ORSZAG_REGIO = {
    "uk": "EURO", "us": "AMRO", "usa": "AMRO", "japan": "WPRO", "china": "WPRO",
    "india": "SEAR", "bangladesh": "SEAR", "pakistan": "EMR", "iran": "EMR",
    "estonia": "EURO", "finland": "EURO", "ireland": "EURO", "netherlands": "EURO",
    "poland": "EURO", "switzerland": "EURO", "slovenia": "EURO", "italy": "EURO",
}
SZABALYOS_REGIO = {"AFR", "AMRO", "EMR", "EURO", "SEAR", "WPRO", "Global"}
# A megjegyzésben szereplő földrajzi utalás → melyik országhoz tartozik.
UTALAS = {
    "japan": "japan", "bradford": "uk", "scottish": "uk", "british": "uk",
    "estonia": "estonia", "american": "us",
}


def olvas(path: Path):
    rows = list(csv.reader(io.StringIO(path.read_text(encoding="utf8", errors="replace"))))
    fej = next(i for i, r in enumerate(rows) if r and r[0].strip() == "Datasets")
    ki = []
    for r in rows[fej + 1:]:
        if len(r) < 8 or not r[0].strip() or not r[3].strip():
            continue
        hozzaferes = r[4].strip().lower()
        ki.append({
            "nev": re.sub(r"\s+", " ", r[0]).strip(),
            "terulet": r[1].strip(),
            "modalitas": re.sub(r"\s+", " ", r[2]).strip(),
            "url": r[3].strip().split(",")[0].strip(),
            "hozzaferes": ("nyilt" if hozzaferes.startswith("open")
                           else "kerelmes" if "request" in hozzaferes else "vegyes"),
            "eredet": r[5].strip().rstrip(","),
            "regio": [x.strip() for x in r[6].split(";") if x.strip()],
            "megjegyzes": re.sub(r"\s+", " ", r[7]).strip() or None,
        })
    return ki


def ellenoriz(tetelek):
    """A tábla ellentmondásai. Ezek a FORRÁS hibái, nem a feldolgozásé."""
    ki = []
    for t in tetelek:
        for r in t["regio"]:
            if r not in SZABALYOS_REGIO:
                ki.append({
                    "tetel": t["nev"], "fajta": "regiokod",
                    "mit": f"Szabálytalan régiókód: „{r}”. A szabályosak: "
                           f"{', '.join(sorted(SZABALYOS_REGIO))}. Egy elgépelt kód nem "
                           f"hibaüzenetet ad, hanem külön csoportot — és a tétel kiesik a szűrésből.",
                })
        varhato = ORSZAG_REGIO.get(t["eredet"].lower())
        if varhato and varhato not in t["regio"]:
            ki.append({
                "tetel": t["nev"], "fajta": "regioEltres",
                "mit": f"Az eredet „{t['eredet']}”, a megadott régió "
                       f"{'/'.join(t['regio'])} — a várt régió {varhato}.",
            })
        n = (t["megjegyzes"] or "").lower()
        for utalas, orszag in UTALAS.items():
            if utalas in n and orszag not in t["eredet"].lower():
                ki.append({
                    "tetel": t["nev"], "fajta": "megjegyzesEltres",
                    "mit": f"A megjegyzés „{utalas}”-ra utal, az eredet viszont "
                           f"„{t['eredet']}”. Aki országra szűr, ezt a tételt rossz helyen találja.",
                })
                break
    return ki


def main():
    src = Path(sys.argv[1])
    tetelek = olvas(src)
    hibak = ellenoriz(tetelek)
    sha = hashlib.sha256(src.read_bytes()).hexdigest()

    regiok = Counter(r for t in tetelek for r in t["regio"])
    hozzaferes = Counter(t["hozzaferes"] for t in tetelek)

    d = {
        "id": "kulso.adatkeszletek",
        "megnevezes": "Női egészség — AI-hoz használható adatkészletek és adattárak",
        "forras": "A lektorált közlemény 1. és 2. táblázata (2026.04.28.), "
                  f"CSV alakban. sha256: {sha}",
        "note": (
            "A KATALÓGUS NEM ADAT, HANEM TÉRKÉP — és a térkép torzít.\n\n"
            f"{len(tetelek)} adatkészlet, ebből {hozzaferes['nyilt']} nyíltan elérhető és "
            f"{hozzaferes['kerelmes']} kérelmes. A regionális eloszlás viszont a "
            "legfontosabb szám az egészben: "
            + ", ".join(f"{r} {n}" for r, n in regiok.most_common())
            + ".\n\nAz anyai halálozás túlnyomó része az afrikai régióban következik be, "
            "és ebben a katalógusban AFR EGYETLEN tételnél szerepel, akkor is másodikként. "
            "Ez nem a katalógus hibája — ez a helyzet, amit leír. De ha egy rendszer ezekre "
            "az adatokra épít modellt, akkor a modell arra a populációra tanul, amelyik itt "
            "látszik, és arra a populációra fogják használni, amelyik nem. "
            "Ez ugyanaz a szabály, ami a normogramoknál már ki van mondva: idegen populáción "
            "mért tartomány idegen választ ad — csak itt nem egy görbéről van szó, hanem az "
            "egész bemeneti oldalról.\n\n"
            "AMIT A FELDOLGOZÁS TALÁLT A TÁBLÁBAN. A forrás lektorált, és mégis van benne "
            f"{len(hibak)} ellentmondás — köztük KÉT SOR, aminek az eredet- és régiómezője "
            "egymással fel van cserélve (a BioBank Japan „UK/EURO”, a bradfordi Born in "
            "Bradford „Japan/WPRO”). Aki európai adatkészletekre szűr, a japán biobankot "
            "kapja meg, a bradfordit pedig elveszíti. A hibák tételesen a `tabla_hibak` "
            "listában állnak — nem javítottuk bele a sorokba, mert a forrás a forrás; "
            "megnevezve viszont kezelhető."
        ),
        "statisztika": {
            "tetel": len(tetelek),
            "hozzaferes": dict(hozzaferes),
            "regio": dict(regiok),
        },
        "tabla_hibak": hibak,
        "tetelek": tetelek,
    }
    cel = Path("registry/adatkeszletek/noi-egeszseg.json")
    cel.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"{len(tetelek)} adatkészlet · {len(hibak)} ellentmondás a forrástáblában")
    for h in hibak:
        print(f"  [{h['fajta']}] {h['tetel'][:44]}")


if __name__ == "__main__":
    main()
