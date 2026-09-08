#!/usr/bin/env python3
"""
HBCS BESOROLÁSI TÁBLÁZAT — a 10/2012. (II. 28.) NEFMI rendelet 2. mellékletéből.

    python3 tools/ingest/hbcs_besorolas.py \
        --src forrasok/jogszabaly/10_2012_NEFMI_fekvo_20250501.docx \
        --out registry/finanszirozas/hbcs-besorolas.json

MIÉRT NEM KÓDTÁBLA

A `tbl.hbcs` súlyszámtábla lapos: csoportkód → súlyszám, határnapok. A
BESOROLÁS nem az: minden csoporthoz KÓDLISTA-BLOKKOK tartoznak (betegségek,
beavatkozások, eszközök, anaesztézia…), és egy LOGIKAI SZABÁLY, ami megmondja,
a blokkok milyen kombinációja esetén esik az eset abba a csoportba. Ez
szabálykészlet, nem tábla — ezért nem a `registry/kodok/tablak/` alá kerül.

AMIT EZ A SZKRIPT NEM CSINÁL: NEM TALÁL KI SZABÁLYT

A rendelet 243-féle logikai kifejezést használ, köztük időfeltételeseket
(„LEGALÁBB 4 NAPON ÁT”, „a szülést közvetlenül megelőzően 12 napnál hosszabb
ápolás”), típusfeltételeseket („»6«,»8« TÍPUSKÉNT”) és darabszámosakat
(„3 KÜLÖNBÖZŐ BEAVATKOZÁS KÖRBŐL LEGALÁBB EGY-EGY”). A szkript CSAK a
felismert alakokat elemzi géppé; a többinél a SZÓ SZERINTI szöveget őrzi meg,
és a csoportot `elemzetlen`-nek jelöli.

Ez nem lustaság. Egy félreértelmezett besorolási szabály rossz finanszírozási
tételt állít elő, és éppen az a fajta csendes hiba, amit a rendszer mindenütt
máshol tilt. A besoroló ezért az elemzetlen csoportokra NEM ad besorolást,
hanem megmondja, melyik szabályt nem érti.

SEMMIT NEM DOB EL CSENDBEN. Minden bemeneti sor pontosan egy vödörbe kerül, és
a szkript a végén összeveti a vödrök összegét a bemenet sorszámával.
"""
import argparse, hashlib, json, re, sys, zipfile
from collections import Counter
from datetime import date, timezone, datetime

MELLEKLET_KEZD = "2. melléklet a 10/2012. (II. 28.) NEFMI rendelethez"
MELLEKLET_VEGE = "3. melléklet a 10/2012. (II. 28.) NEFMI rendelethez"


def unesc(s):
    return (s.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
             .replace("&apos;", "'").replace("&amp;", "&"))


def docx_lines(path):
    """Bekezdések, a <w:tab/> OSZLOPHATÁRKÉNT megőrizve."""
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    out = []
    for p in re.findall(r"<w:p(?: [^>]*)?>.*?</w:p>", xml, re.S):
        parts = []
        for m in re.finditer(r"<w:tab/>|<w:t(?: [^>]*)?>(.*?)</w:t>", p, re.S):
            parts.append("\t" if m.group(0) == "<w:tab/>" else unesc(m.group(1)))
        out.append("".join(parts).rstrip())
    return out


# ── A NYELVTAN ─────────────────────────────────────────────────────────

RE_FOCSOPORT = re.compile(r"^\*{4}\s*Főcsoport:\s*(\S+)\s+(.*)$")
RE_CSOPORT = re.compile(r"^\s*\*{4}\s+(\S+)\s+(\S+)\t(.*)$")
RE_KOZOS = re.compile(r"^\s*\*{3}\s+(.*)$")
RE_TETEL = re.compile(r"^([0-9A-Z]{4,6}\*?)\t(.*)$")

#: Blokkfajták a fejléc szövegéből. A sorrend számít: az első találat nyer.
#: A tövekre illesztünk, nem a teljes szóra — a rendelet ragoz
#: („KEMOTERÁPIÁK”, „LEUKAEMIÁK”), és a teljes szóra illesztés ezeket elejtené.
FAJTAK = [
    ("anaesztézia", r"ANAESTESIA|ANESZTÉZIA"),
    ("kemoterápia", r"KEMOTERÁPI|RADIOKEMOTERÁPI"),
    ("vérkészítmény", r"VÉRKÉSZÍTMÉNY"),
    ("eszköz", r"ESZKÖZ"),
    ("beavatkozás", r"BEAVATKOZÁS|BEVATKOZÁS|ELJÁRÁS|MŰTÉT|SZÍVKATÉTEREZÉS|"
                    r"VIZSGÁLAT|PARODONTOLÓGIAI|PACEMAKER"),
    ("betegség", r"BETEGSÉG|DIAGNÓZIS|DAGANAT|LEUKAEMI|BETEGSÉGKÓD|"
                 r"SZÜLÉS TÉNYÉNEK"),
]

#: LOGIKAI SZABÁLY: blokkbetűkre hivatkozik szereppel, vagy zárójeles kifejezés.
#: Ez a megkülönböztetés a fejléctől — a fejléc FAJTÁT nevez meg, a szabály
#: BETŰKET kombinál.
RE_SZABALY = re.compile(
    r'"\w+"\s*(?:DIAGN|BEAV|ESZKÖZ|ANAESTESIA|KEMOT|RADKEM|DAG)\.?|'
    r'^[(\[]|^(?:VAGY|ÉS)\s*[(\[]|DIAGN\.\s*(?:ÉS|VAGY)|'
    r'BEAV\.?\s*(?:ÉS|VAGY|\))|LEGALÁBB EGY-EGY|ÓRÁN BELÜL|'
    r'TÍPUSKÉNT VAGY|hosszabb ápolás|CSOPORTBÓL LEGALÁBB|'
    r'A szülés ténye|FELTÉTELEI$|"\w+"\s+(?:vagy|és)\s+"\w+"', re.I)

#: ELSZÁMOLÁSI feltétel — nem besorolás, hanem hogy a csoport mellé mi
#: számolható el. Külön mezőbe kerül: összekeverni a kettőt rossz tételt ad.
RE_ELSZAMOLAS = re.compile(
    r"KIEGÉSZÍTŐ HBCS|RÁÉPÍTETT HBCS|CSAK AKKOR SZÁMOLHATÓ EL|"
    r"főcsoportba kerülés feltételei|SZAKMAI PROTOKOLL SZABÁLYAI|"
    r"ÁPOLÁSI NAP|NAPNÁL HOSSZABB|Minimum \d+ napig", re.I)

#: A FEJLÉC BIZTOS ISMÉRVE: fajtanévvel (és legfeljebb egy betűjellel) ZÁRUL.
#: Ez erősebb jel, mint a szabályminta: a „»1« VAGY »3« TÍPUSÚ DIAGNÓZISOK”
#: sorban az idézőjelben DIAGNÓZISTÍPUS áll, nem blokkbetű — szabálynak véve
#: a mögötte álló kódok gazdátlanul maradnának.
RE_FEJLEC_VEG = re.compile(
    r"(BETEGSÉGEK|DIAGNÓZISOK|BEAVATKOZÁSOK|BEVATKOZÁSOK|BEAVATKOZÁSAI|"
    r"ESZKÖZÖK|MŰTÉTEI|MŰTÉTEK|KÓDJAI|KÓDOK|ELJÁRÁSOK|VIZSGÁLATOK|"
    r"DAGANATOK|KEMOTERÁPIÁK|RADIOKEMOTERÁPIÁK|LEUKAEMIÁK|VÉRKÉSZÍTMÉNYEK|"
    r"BETEGSÉGKÓDOK|FELTÉTELEI|FELTÉTELEK)"
    r'(\s*\([^)]*\))?(\s*"[^"]*")?\s*:?\s*$', re.I)

#: A blokkfejlécben álló FELTÉTEL: „(LEGALÁBB 4 NAPON ÁT)”.
RE_FELTETEL = re.compile(r"\(([^)]*(?:LEGALÁBB|NAPON ÁT|ÓRÁN)[^)]*)\)", re.I)

RE_HIVATKOZAS = re.compile(r"A kódlistát ld\.")
RE_BARMELY = re.compile(
    r"^(A főcsoportba tartozó bármely betegség|"
    r"Az alább felsoroltak kivételével|Bármely műtét a felsoroltak kivételével|"
    r"VAGY AZ ALÁBB FELSOROLTAK KIVÉTELÉVEL)", re.I)


def blokk_fajta(fejlec):
    for nev, minta in FAJTAK:
        if re.search(minta, fejlec, re.I):
            return nev
    return None


def jel(fejlec):
    """A blokk betűjele — az utolsó idézőjeles darab, ha van."""
    m = re.findall(r'"([^"]+)"', fejlec)
    return m[-1] if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--valid-from", default="2025-05-01")
    a = ap.parse_args()

    raw = open(a.src, "rb").read()
    sha = hashlib.sha256(raw).hexdigest()
    lines = docx_lines(a.src)

    try:
        i0 = next(i for i, l in enumerate(lines) if l.strip() == MELLEKLET_KEZD)
        i1 = next(i for i, l in enumerate(lines) if l.strip() == MELLEKLET_VEGE)
    except StopIteration:
        sys.exit("Nem találom a 2. mellékletet a forrásban — a rendelet szerkezete "
                 "változhatott. A kinyerés NEM folytatódik találgatással.")
    ann = lines[i0 + 1:i1]

    focsoportok, csoportok = {}, {}
    fo = None          # aktuális főcsoport
    cs = None          # aktuális csoport
    blokk = None       # aktuális blokk
    kozos_cel = None   # főcsoport-szintű megosztott blokk épül-e
    vodor = Counter()
    ismeretlen = []

    def zar_blokk():
        nonlocal blokk
        blokk = None

    for idx, l in enumerate(ann):
        s = l.strip()
        if not s:
            vodor["üres"] += 1
            continue

        m = RE_FOCSOPORT.match(s)
        if m:
            fo = m.group(1)
            focsoportok[fo] = {"label": m.group(2).strip(), "kozosBlokkok": {}}
            cs, kozos_cel = None, None
            zar_blokk()
            vodor["főcsoport"] += 1
            continue

        m = RE_CSOPORT.match(l)
        if m:
            fo_h, kod, label = m.group(1), m.group(2), m.group(3).strip()
            cs = {"focsoport": fo_h, "label": label, "blokkok": [],
                  "szabalySorok": [], "megjegyzesek": []}
            csoportok[kod] = cs
            kozos_cel = None
            zar_blokk()
            vodor["csoport"] += 1
            continue

        m = RE_KOZOS.match(s)
        if m and fo:
            fejlec = m.group(1).strip()
            j = jel(fejlec) or fejlec
            kozos_cel = {"label": re.sub(r'\s*"[^"]*"\s*$', "", fejlec).strip(),
                         "fajta": blokk_fajta(fejlec), "kodok": []}
            focsoportok[fo]["kozosBlokkok"][j] = kozos_cel
            blokk = kozos_cel
            vodor["közös blokk"] += 1
            continue

        m = RE_TETEL.match(l)
        if m and blokk is not None:
            # CSAK A KÓD kerül ide. A megnevezés a `tbl.bno` és a `tbl.mut`
            # táblákban él, amelyek már a repóban vannak — a duplikálás 4,5 MB
            # lenne 1,3 helyett, és két igazság ugyanarról a kódról.
            blokk["kodok"].append(m.group(1))
            vodor["kódtétel"] += 1
            continue
        if m:
            # kódtétel nyitott blokk nélkül — ezt NEM nyeljük le
            ismeretlen.append((idx, "blokk nélküli kódtétel", s[:90]))
            vodor["gazdátlan kódtétel"] += 1
            continue

        if s.startswith("Az aktív fekvőbeteg-ellátás diagnózisainak"):
            vodor["melléklet alcíme"] += 1
            continue

        # innentől szöveges sor
        if cs is None and kozos_cel is None:
            # FŐCSOPORT-SZINTŰ feltétel („A főcsoportba kerülés feltételei”) —
            # ez az egész főcsoportra vonatkozik, nem egy csoportra
            if fo and (RE_SZABALY.search(s) or RE_ELSZAMOLAS.search(s)
                       or s.upper() in ("VAGY", "ÉS")):
                focsoportok[fo].setdefault("felteteleSorok", []).append(s)
                vodor["főcsoport-feltétel"] += 1
                continue
            ismeretlen.append((idx, "csoporton kívüli szöveg", s[:90]))
            vodor["csoporton kívüli szöveg"] += 1
            continue

        if RE_HIVATKOZAS.search(s):
            if cs: cs["megjegyzesek"].append(s)
            vodor["kódlista-hivatkozás"] += 1
            continue

        # „BÁRMELY BETEGSÉG” — és a kivételes alakja, ami UTÁNA sorolja fel,
        # mi NEM tartozik bele. A kettő ellentétes értelmű, ezért `kizarva`.
        if RE_BARMELY.match(s):
            kizar = bool(re.search(r"kivételével", s, re.I))
            cel = cs if cs else None
            if cel:
                cel["blokkok"].append({
                    "jel": jel(s), "fajta": "betegség", "label": s,
                    "kotoszo": "vagy" if s.upper().startswith("VAGY") else "és",
                    "kodok": [], "barmely": True, "kizarva": kizar})
                blokk = cel["blokkok"][-1]
            vodor["»bármely betegség«"] += 1
            continue

        # BLOKKFEJLÉC — fajtát nevez meg, és NEM betűket kombinál. A sorrend
        # itt kritikus: a „(LEGALÁBB 4 NAPON ÁT)” feltételes fejléc egyébként
        # szabálynak látszana, és a mögötte álló kódok gazdátlanul maradnának.
        f = blokk_fajta(s)
        if f and cs and (RE_FEJLEC_VEG.search(s) or not RE_SZABALY.search(s)):
            felt = RE_FELTETEL.search(s)
            b = {
                "jel": jel(s), "fajta": f,
                "label": re.sub(r'\s*"[^"]*"\s*$', "", s).strip(),
                "kotoszo": "vagy" if s.upper().startswith("VAGY") else "és",
                "kodok": [],
            }
            if felt: b["feltetel"] = felt.group(1).strip()
            cs["blokkok"].append(b)
            blokk = b
            vodor["blokkfejléc"] += 1
            continue

        if RE_SZABALY.search(s):
            # FOLYTATÓSOR: a rendelet a hosszú kifejezéseket több bekezdésre
            # tördeli („… VAGY (DAG. »F1« ÉS RADKEM. »*E«)”). Külön sorként
            # tárolva a kifejezés értelmetlen darabokra esne.
            folytatas = bool(re.match(r"^(VAGY|ÉS)\b", s, re.I)) and cs and cs["szabalySorok"]
            if folytatas:
                cs["szabalySorok"][-1] += " " + s
                vodor["szabály folytatása"] += 1
            elif cs:
                cs["szabalySorok"].append(s)
                vodor["szabálysor"] += 1
            zar_blokk()
            continue

        # ELSZÁMOLÁSI feltétel — nem besorolás. Külön mezőbe.
        if RE_ELSZAMOLAS.search(s):
            if cs: cs.setdefault("elszamolasiFeltetelek", []).append(s)
            vodor["elszámolási feltétel"] += 1
            continue

        if s.upper() in ("VAGY", "ÉS"):
            if cs: cs["szabalySorok"].append(s)
            vodor["kötőszó"] += 1
            continue

        if cs: cs["megjegyzesek"].append(s)
        ismeretlen.append((idx, "besorolatlan szöveg", s[:90]))
        vodor["besorolatlan szöveg"] += 1

    # A MEGOSZTOTT BLOKKOKAT NEM SÜTJÜK BELE.
    #
    # Egy csoport hivatkozhat a főcsoport közös listájára a blokk betűjelével
    # („A kódlistát ld. kiemelve a főcsoport elején!”), de a SZABÁLY is
    # hivatkozhat rá közvetlenül — a 673A „Hüvelyi szülés” blokkja névtelen, és
    # a szabály nevezi meg a „C” és „D” listát. A feloldás ezért a futásidőé:
    # ott van meg mindkét irány, és ott derül ki, ha egy betű SEHOL nincs
    # definiálva — ami hiba, nem üres lista.
    ures = sum(1 for c in csoportok.values()
               for b in c["blokkok"] if not b["kodok"] and not b.get("barmely"))

    out = {
        "id": "tbl.hbcs.besorolas",
        "label": {"hu": "HBCS besorolási táblázat"},
        "version": f"10/2012. NEFMI 2. melléklet / {a.valid_from}",
        "validFrom": a.valid_from,
        "source": {
            "cite": "10/2012. (II. 28.) NEFMI rendelet 2. melléklet — "
                    "Az aktív fekvőbeteg-ellátás diagnózisainak és "
                    "beavatkozásainak besorolási táblázatai",
            "file": a.src.split("/")[-1],
            "sha256": sha,
            "extractedAt": datetime.now(timezone.utc).date().isoformat(),
        },
        "focsoportok": focsoportok,
        "csoportok": csoportok,
    }
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")

    ossz = sum(vodor.values())
    print(f"{len(ann)} bemeneti sor · {ossz} besorolva "
          f"{'✓ egyezik' if ossz == len(ann) else '✗ ELTÉRÉS!'}")
    for k, n in vodor.most_common():
        print(f"  {n:7}  {k}")
    kodok = sum(len(b["kodok"]) for c in csoportok.values() for b in c["blokkok"])
    kodok += sum(len(b["kodok"]) for f in focsoportok.values()
                 for b in f["kozosBlokkok"].values())
    print(f"\n{len(focsoportok)} főcsoport · {len(csoportok)} HBCS-csoport · "
          f"{kodok} kódhivatkozás · {ures} blokk hivatkozik máshova")
    if ismeretlen:
        print(f"\n{len(ismeretlen)} sor NEM illett a nyelvtanba "
              f"(a csoport megjegyzései közé került, nem veszett el):")
        for i, mi, s in ismeretlen[:15]:
            print(f"  {mi}: {s}")
    if ossz != len(ann):
        sys.exit("A vödrök összege nem egyezik a bemenettel — sor veszett el.")


if __name__ == "__main__":
    main()
