#!/usr/bin/env python3
"""A területi védőnői szűrővizsgálat kérdőíveinek beolvasása.

FORRÁS: 51/1997. (XII. 18.) NM rendelet 4.§ b), 8.§ és 49/2004. (V. 21.)
ESZCSM rendelet 3.§ dd) mellékletei — jogszabályi melléklet, ezért
feldolgozható (ugyanaz a kezelés, mint a 10/2012. NEFMI rendeletnél).

AMI NEM KERÜL BE: a kitöltött példány. Az PHI-t tartalmaz (TAJ, anyja
születési neve, születési hely), és a repóba semmiképp nem való. Ez a
szkript ÜRES SABLONOKAT olvas, és csak a kérdésszöveget viszi át.

Futtatás:
    python3 tools/ingest/vedono_kerdoiv.py --src <könyvtár> --out registry/vedono/kerdoivek.json
"""
import argparse, glob, json, os, re, sys, zipfile

# A HÁROMÉRTÉKŰ VÁLASZSKÁLA. Nem igen/nem: a „Néha" saját érték, és a
# „Még nem" sem „nem" — fejlődési kérdésnél az életkor dönti el, baj-e.
SKALA = [
    {"kod": "rendszeresen", "label_hu": "Igen, rendszeresen (gyakran, többnyire)"},
    {"kod": "neha", "label_hu": "Néha (ritkán, nem nagyon, de előfordul)"},
    {"kod": "megNem", "label_hu": "Még nem"},
]

def szoveg(docx):
    x = zipfile.ZipFile(docx).read("word/document.xml").decode("utf8")
    return [l.strip() for l in re.sub(r"<[^>]+>", "\n", x).split("\n") if l.strip()]

def kor_perc(fejlec):
    """Az életkort HÓNAPBAN adja vissza a fejlécből."""
    m = re.search(r"(\d+(?:,\d+)?)\s*hónapos", fejlec)
    if m:
        return float(m.group(1).replace(",", "."))
    m = re.search(r"(\d+(?:,\d+)?)\s*éves", fejlec)
    if m:
        return float(m.group(1).replace(",", ".")) * 12
    return None

def olvas(f):
    L = szoveg(f)
    fejlec = next((l for l in L if "korban végzett" in l), "")
    honap = kor_perc(fejlec)
    jogszabaly = next((l for l in L if "rendelet" in l and "§" in l), None)
    # VAN-E EGYÁLTALÁN SZÜLŐI KÉRDŐÍV. A 3 hónapos űrlapon nincs — az
    # „(Tartalma: Védőnői szűrővizsgálat)" sor ezt kimondja. Ez nem hiányzó
    # adat, hanem a jogszabály szerkezete: a szűrés megvan, a kérdőív nincs.
    tartalma = next((l for l in L if l.startswith("(Tartalma")), "")
    van_kerdoiv = "kérdőív" in tartalma.lower()

    # A KÉRDÉSEK. Több bekezdésre tördelt kérdést összefűzünk: a docx a
    # zárójeles magyarázatot gyakran külön futamba teszi.
    kerdesek, akt = [], None
    for l in L:
        m = re.match(r"^(\d+)\.\s+(.*)$", l)
        if m and len(m.group(2)) > 12:
            if akt:
                kerdesek.append(akt)
            akt = {"sorszam": int(m.group(1)), "kerdes": m.group(2)}
        elif akt and not re.match(r"^[A-ZÁÉÍÓÖŐÚÜŰ ]{6,}:?$", l) and len(l) > 2:
            if len(akt["kerdes"]) < 400:
                akt["kerdes"] = (akt["kerdes"] + " " + l).strip()
        elif akt and re.match(r"^[A-ZÁÉÍÓÖŐÚÜŰ ]{6,}:?$", l):
            kerdesek.append(akt); akt = None
    if akt:
        kerdesek.append(akt)

    # A VÉDŐNŐI SZŰRŐVIZSGÁLAT SZAKASZAI — nagybetűs fejlécek.
    szakaszok = [l.rstrip(":") for l in L
                 if re.match(r"^[A-ZÁÉÍÓÖŐÚÜŰ][A-ZÁÉÍÓÖŐÚÜŰ ,]{8,}:?$", l)]
    return {
        "id": f"vedono.szures.{int(honap)}h" if honap and honap == int(honap) else
              f"vedono.szures.{str(honap).replace('.', '_')}h",
        "honap": honap,
        "megnevezes": fejlec,
        "jogszabaly": jogszabaly,
        "vanKerdoiv": van_kerdoiv,
        "kerdesek": [k for k in kerdesek if len(k["kerdes"]) > 12] if van_kerdoiv else [],
        "szakaszok": sorted(set(szakaszok)),
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    fajlok = [f for f in sorted(glob.glob(os.path.join(a.src, "*Szli krdv*.docx")))
              if not re.search(r"-(EN|CN)\.docx$", f)]
    if not fajlok:
        sys.exit(f"nincs magyar kérdőív itt: {a.src}")

    ivek = []
    for f in fajlok:
        try:
            iv = olvas(f)
        except Exception as e:                       # noqa: BLE001
            print(f"  KIHAGYVA {os.path.basename(f)}: {e}", file=sys.stderr)
            continue
        if iv["honap"] is None:
            print(f"  KIHAGYVA {os.path.basename(f)}: nem olvasható életkor",
                  file=sys.stderr)
            continue
        # A KÉRDŐÍV NÉLKÜLI SZŰRÉS IS SZŰRÉS. Kihagyva egy jogszabályi
        # szűrési időpont esne ki a naptárból — és a kimaradt látogatás
        # ebben a modulban maga a jel.
        if iv["vanKerdoiv"] and not iv["kerdesek"]:
            print(f"  FIGYELEM {os.path.basename(f)}: kérdőívet ígér, "
                  f"de egy kérdés sem olvasható ki", file=sys.stderr)
        ivek.append(iv)

    # DUPLIKÁTUM-ELLENŐRZÉS. Két bejegyzés ugyanarra az életkorra elrontaná a
    # naptárt: a kimaradt látogatás ebben a modulban maga a jel, és két
    # azonos időpontnál nem tudni, melyik maradt ki. A csomagban tipikusan
    # letöltési másolat („(1)" utótag) okozza.
    latott = {}
    tiszta = []
    for iv in ivek:
        h = iv["honap"]
        if h in latott:
            print(f"  DUPLIKÁTUM {h:g} hónap — a második példány kihagyva "
                  f"({len(iv['kerdesek'])} kérdés, az elsőben "
                  f"{len(latott[h]['kerdesek'])})", file=sys.stderr)
            continue
        latott[h] = iv
        tiszta.append(iv)
    ivek = tiszta
    ivek.sort(key=lambda x: x["honap"])
    ki = {
        "megnevezes": "Területi védőnői szűrővizsgálat — szülői kérdőív",
        "modul": 30,
        "forras": ("51/1997. (XII. 18.) NM rendelet 4.§ b), 8.§; "
                   "49/2004. (V. 21.) ESZCSM rendelet 3.§ dd) mellékletei"),
        "note": ("GENERÁLT — `python3 tools/ingest/vedono_kerdoiv.py`. Jogszabályi "
                 "melléklet, ezért feldolgozható. A KITÖLTÖTT példány PHI-t "
                 "tartalmaz (TAJ, anyja születési neve), és soha nem kerül a repóba.\n\n"
                 "A `vedonoiEgyezes` a forma legfontosabb szerkezeti eleme: a szülő "
                 "válaszol, és a védőnő KÜLÖN rögzíti, hogy a saját észlelése "
                 "ugyanaz-e. Ez beépített egyezés-ellenőrzés — a 17. lépés "
                 "audit-hurka kicsiben, és már a jogszabályi űrlapon ott van."),
        "skala": SKALA,
        "vedonoiEgyezes": {"kerdes": "Védőnői tapasztalat: ugyanaz?",
                           "ertekek": ["igen", "nem"]},
        "ivek": ivek,
    }
    with open(a.out, "w", encoding="utf8") as fh:
        json.dump(ki, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"{len(ivek)} kérdőív, "
          f"{sum(len(i['kerdesek']) for i in ivek)} kérdés → {a.out}")

if __name__ == "__main__":
    main()
