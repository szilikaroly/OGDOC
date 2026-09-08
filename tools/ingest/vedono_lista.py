#!/usr/bin/env python3
"""Az országos védőnői szolgáltatásjegyzék beolvasása.

FORRÁS: NEAK „Védőnői szolgáltatást nyújtó" közzétett jegyzék (havi frissítés).

AMIÉRT A KIMENET NEM A REPÓBA MEGY: ~10 000 sor, névvel azonosított
szakemberekkel és munkahelyi címekkel, és HAVONTA változik. Egy repóba
fagyasztott másolat két hónap múlva rossz védőnőt nevezne meg — a rossz
címzett pedig ugyanaz, mint a hiányzó. A `registry/vedono/helyi/` gitignore-olt.

HÁROM DOLOG, AMIT A BEOLVASÓ KIMOND, ÉS AMI NÉLKÜL A JEGYZÉK FÉLREVEZET:

  1. AZ „ISKOLA" TÍPUSÚ SZOLGÁLAT NEM MEGY ÚJSZÜLÖTTHÖZ. Csak a `Területi` és
     a `Vegyes` illetékes — a `Vegyes` a falvak többségében ez a szolgálat.
  2. A „BETÖLTETLEN" NEM CÍMZETT. Egy betöltetlen álláshoz küldött értesítés
     ugyanaz, mint az elmaradt értesítés — csak úgy néz ki, mintha megtörtént
     volna.
  3. AZ IRÁNYÍTÓSZÁM HALMAZT JELÖL, NEM SZEMÉLYT. A szolgálatok 96%-a olyan
     irányítószámban van, ahol több szolgálat is működik; a körzetet az utca
     dönti el, nem az irányítószám.

Futtatás:
    python3 tools/ingest/vedono_lista.py --src <xls> --out registry/vedono/helyi/szolgalatok.json
"""
import argparse, json, re, sys

UJSZULOTTHOZ = {"Területi", "Vegyes"}
BETOLTETLEN = "BETÖLTETLEN"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sheet", default="Országos")
    a = ap.parse_args()

    try:
        import pandas as pd
    except ImportError:
        sys.exit("pandas kell hozzá: pip install pandas xlrd")

    df = pd.read_excel(a.src, sheet_name=a.sheet, header=1)
    df.columns = [str(c).strip() for c in df.columns]
    kell = ["Szolgálat típusa", "Irányító-szám", "Védőnő neve",
            "Szolgálat telephelye (település)", "Szolgálat címe",
            "Szolgáltató", "Finanszírozási kód", "Ellátás szerinti vármegye"]
    hiany = [c for c in kell if c not in df.columns]
    if hiany:
        sys.exit(f"hiányzó oszlop: {hiany}\nvan: {list(df.columns)}")

    sor = lambda c: df[c].astype(str).str.strip()
    tipus = sor("Szolgálat típusa")
    irsz = sor("Irányító-szám").str.extract(r"(\d{4})")[0]
    nev = sor("Védőnő neve")

    szolgalatok, kihagyott_iskola, rossz_irsz = [], 0, 0
    for i in range(len(df)):
        t = tipus.iat[i]
        if t not in UJSZULOTTHOZ:
            kihagyott_iskola += 1
            continue
        z = irsz.iat[i]
        if not isinstance(z, str):
            rossz_irsz += 1
            continue
        n = nev.iat[i]
        szolgalatok.append({
            "irsz": z,
            "telepules": sor("Szolgálat telephelye (település)").iat[i],
            "cim": sor("Szolgálat címe").iat[i],
            "vedono": None if n.upper() == BETOLTETLEN else n,
            "betoltetlen": n.upper() == BETOLTETLEN,
            "tipus": t,
            "szolgaltato": sor("Szolgáltató").iat[i],
            "finanszirozasiKod": sor("Finanszírozási kód").iat[i],
            "varmegye": sor("Ellátás szerinti vármegye").iat[i],
        })

    szolgalatok.sort(key=lambda x: (x["irsz"], x["telepules"], x["cim"]))
    kodok = sorted({s["irsz"] for s in szolgalatok})
    betoltetlen = sum(1 for s in szolgalatok if s["betoltetlen"])
    # Olyan irányítószám, ahol EGYETLEN betöltött szolgálat sincs.
    ures = sorted({z for z in kodok
                   if all(s["betoltetlen"] for s in szolgalatok if s["irsz"] == z)})

    ki = {
        "megnevezes": "Országos védőnői szolgálatjegyzék — újszülötthöz illetékes szolgálatok",
        "modul": 30,
        "forras": a.src.split("/")[-1],
        "note": ("GENERÁLT, ÉS NEM A REPÓBAN. Havonta változik; egy fagyasztott másolat "
                 "két hónap múlva rossz védőnőt nevezne meg. Csak a `Területi` és a "
                 "`Vegyes` szolgálat szerepel: az `Iskola` típusú nem megy újszülötthöz. "
                 "A `vedono: null` betöltetlen állást jelent — az NEM címzett."),
        "szolgalat": len(szolgalatok),
        "betoltetlen": betoltetlen,
        "iranyitoszam": len(kodok),
        "csakBetoltetlenIrsz": ures,
        "szolgalatok": szolgalatok,
    }
    with open(a.out, "w", encoding="utf8") as fh:
        json.dump(ki, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    print(f"{len(szolgalatok)} szolgálat ({betoltetlen} betöltetlen), "
          f"{len(kodok)} irányítószám → {a.out}")
    print(f"  kihagyva: {kihagyott_iskola} iskolai szolgálat"
          + (f", {rossz_irsz} rossz irányítószám" if rossz_irsz else ""))
    print(f"  {len(ures)} irányítószámban EGYETLEN betöltött szolgálat sincs")

if __name__ == "__main__":
    main()
