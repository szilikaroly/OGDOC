#!/usr/bin/env python3
"""EXPORTCSOMAG — minden, ami a rendszerből kiadható, egyetlen zip-ben.

    npm run csomag              →  ogdoc-export-<dátum>.zip
    npm run csomag -- --lista   →  csak felsorolja, mi menne bele
    npm run csomag -- --out X   →  a zip neve

AZ ALAPÉRTELMEZÉS A BEVÉTEL.

A csomag a teljes forrástárat viszi — a verziótörténettel, a beszerzett
elsődleges forrásokkal, a generált táblákkal és a fejlesztői melléktermékekkel
együtt. Ami korábban „kizárt” volt, most is bekerül, de a jegyzék MEGŐRZI,
miért állt rajta a kizárási listán: egy indoklás nélkül eltűnt vagy indoklás
nélkül visszatett fájl fél év múlva megmagyarázhatatlan.

KÉT KIVÉTEL MARAD, ÉS EGYIK SEM ÍZLÉS KÉRDÉSE.

  1. A SNOMED CT GPS SZÁRMAZTATOTT TÁBLÁJA (`registry/kodok/helyi/`).
     A licenc CC BY-ND 4.0 — „NoDerivatives”: a származtatott mű
     TERJESZTÉSE tiltott. Nem arról van szó, hogy kényelmetlen, hanem hogy
     jogilag nem szabad. A tábla helyben újraépíthető az eredeti kiadásból;
     a csomag ehhez a leírást és a lenyomatot viszi, a tartalmat nem.

  2. A CSOMAG ÖNMAGA. Egy zip, ami tartalmazza a saját korábbi példányát,
     minden futással megduplázódik.

ÉS EGY MEGÁLLÁS, AMI NEM KIZÁRÁS.

Ha a szűrés BETEGADAT-GYANÚS fájlnevet talál, a csomagolás LEÁLL. Ez nem
kihagyás: egy ilyen fájl jelenléte azt jelenti, hogy valami eleve rossz helyre
került, és azt nem elrejteni kell, hanem megnézni.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import zipfile
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPO = os.path.dirname(ROOT)

# ── AMI NEM MEHET KI ──────────────────────────────────────────────────────
#
# A `helyi/` NEM KÖNYVTÁRNÉV, HANEM ÁLLÍTÁS: ami itt van, az helyben épül és
# helyben marad. A tiltás korábban KÉT konkrét útvonalra szólt
# (`registry/kodok/helyi`, `registry/kulso/helyi`), és emiatt a később
# keletkezett `registry/kepalkotas/helyi` (ACR O-RADS táblák) és
# `registry/vedono/helyi` (7699 megnevezett védőnő munkahelyi címmel)
# csendben bekerült a csomagba. A `core/szabaly/motor.ts`
# `validateTerjesztes()` build-hibának veszi az ACR-táblát a terjesztett
# fában — a csomagoló mégis kivitte volna. A két őr nem egyezett.
#
# Ezért a szabály mostantól MAGÁRA A `helyi/`-RE szól, és az indoklás a
# jegyzékben marad. Aminek nincs bejegyzett indoka, az MEGÁLLÍTJA a
# csomagolást: egy új `helyi/` fa, amiről senki nem mondta ki, miért helyi,
# pont az az eset, ahol a néma alapértelmezés veszélyes.
HELYI = re.compile(r"(^|/)helyi(/|$)")

HELYI_INDOK = [
    (re.compile(r"registry/kodok/helyi(/|$)"),
     "SNOMED CT GPS származtatott tábla",
     "A licenc CC BY-ND 4.0 („NoDerivatives”): a származtatott mű "
     "terjesztése tiltott. A tábla helyben újraépíthető az eredeti "
     "kiadásból — a csomag a leírást és a lenyomatot viszi, a tartalmat nem."),
    (re.compile(r"registry/kulso/helyi(/|$)"),
     "copyleft (GPLv2) származék — PRBPERIsk együtthatók",
     "A GPL a HASZNÁLATOT nem korlátozza, a TERJESZTÉST igen: a "
     "származtatott mű csak GPLv2-kompatibilis feltételekkel adható "
     "tovább, és az OGDOC licence nincs kimondva. Ez a csomag terjesztés. "
     "A tábla helyben újraépíthető: `python3 tools/ingest/prb-pe.py "
     "PRBPERIsk_0.1.0.tar.gz`."),
    (re.compile(r"registry/kepalkotas/helyi(/|$)"),
     "ACR O-RADS besorolási táblák",
     "© American College of Radiology. A táblák szerzői jogvédettek, és a "
     "`validateTerjesztes()` build-hibának veszi őket a terjesztett fában — "
     "a csomag ugyanaz a terjesztés. A generátorok bekerülnek, a kimenet nem: "
     "mindenki a saját, jogszerűen birtokolt ACR-példányából állítja elő."),
    (re.compile(r"registry/vedono/helyi(/|$)"),
     "országos védőnői szolgálatjegyzék — 7699 megnevezett személy",
     "SZEMÉLYES ADAT, nem betegadat: azonosított védőnők neve a munkahelyi "
     "címükkel. Nyilvános hatósági jegyzékből származik, tehát a HASZNÁLATA "
     "jogszerű, de a csomag TOVÁBBADÁS, és ehhez nincs jogalap kimondva. "
     "A fájl saját `note`-ja is ezt írja: „GENERÁLT, ÉS NEM A REPÓBAN. "
     "Havonta változik; egy fagyasztott másolat két hónap múlva rossz "
     "védőnőt nevezne meg.” Egy csomagba fagyasztva pontosan ez történne."),
    (re.compile(r"registry/normogramok/helyi(/|$)"),
     "INTERGROWTH-21st normogramok",
     "A táblázatok szerzői jogvédettek. A beolvasó (`tools/ingest/"
     "intergrowth.py`) bekerül, a kimenet nem — mindenki a saját, "
     "jogszerűen letöltött archívumából állítja elő."),
]

TILTAS = [
    # A KIADÁSI KÖNYVTÁR EGÉSZE. Egy zip, ami tartalmazza a saját korábbi
    # példányát, minden futással megduplázódik.
    #
    # AZ ELŐZŐ SZABÁLY EZT ELVÉTETTE, ÉS ÉRDEMES KIMONDANI, MIÉRT. A minta a
    # repó GYÖKERÉHEZ volt kötve (`^ogdoc-export-…`), a csomag viszont
    # átkerült a `csomag/` könyvtárba — és onnantól a szabály semmit nem
    # fogott meg. A helyhez kötött minta pontosan addig működik, amíg a fájl
    # ott marad; a következő csomagolás már a saját 33 MB-os elődjét és a 30
    # MB-os git bundle-t is bevette volna.
    #
    # A szabály ezért mostantól a KÖNYVTÁRRA szól, nem a fájlnév alakjára.
    (re.compile(r"(^|/)csomag/"),
     "kiadási könyvtár (korábbi csomag és git bundle)",
     "Egy zip, ami tartalmazza a saját korábbi példányát és a repó git "
     "bundle-jét, minden futással megduplázódik. A `csomag/` a KIADÁS helye, "
     "nem a forrásé — ami ott van, az ebből a fából készült."),
    # CSAK A SAJÁT CSOMAG ALAKJA, bárhol. Egy általános `*.zip` szabály
    # kizárná a `forrasok/` alatti ELSŐDLEGES FORRÁSOKAT is — a BNO-, HBCS- és
    # FNO-törzseket, a v16 dokumentációját, a platformexportokat —, vagyis
    # pont azt, amiből a rendszer épül.
    (re.compile(r"(^|/)ogdoc-export-[\d]{8}\.zip(\.[0-9]{3})?$"),
     "korábbi exportcsomag",
     "A szabály CSAK a saját csomag NEVÉRE szól, de bárhol a fában: a "
     "`forrasok/` alatti forrásarchívumok (BNO, HBCS, FNO, v16, "
     "platformexportok) bekerülnek."),
    (re.compile(r"(^|/)ogdoc-standalone\.bundle$"),
     "önálló repó git bundle-je",
     "A bundle ebből a fából készül (`git subtree split`), tehát a "
     "csomagban a saját forrása mellett állna — 30 MB duplán."),
]

# ── AMI KORÁBBAN KI VOLT ZÁRVA, ÉS MOSTANTÓL BEKERÜL ──────────────────────
#
# A jegyzék megőrzi az EREDETI okot. Egy indoklás nélkül visszatett fájl
# ugyanolyan megmagyarázhatatlan, mint egy indoklás nélkül kihagyott.
VISSZATETT = [
    (re.compile(r"(^|/)\.git(/|$)"),
     "verziótörténet",
     "Korábban kimaradt, mert a csomag pillanatkép, nem repó. Mostantól "
     "bekerül: a teljes történet nélkül nem rekonstruálható, MIKOR és MIÉRT "
     "változott egy klinikai szabály."),
    (re.compile(r"registry/kodok/tablak/tbl-(diag|eszkoz|gyfkod)\.json$"),
     "kiadásfüggő finanszírozási törzs",
     "Korábban kimaradt, mert az eredetiből újraépíthető és a másolat "
     "elavul. Mostantól bekerül — de a benne lévő kiadásjelölés dönti el, "
     "aktuális-e, nem a csomag dátuma."),
    (re.compile(r"(^|/)node_modules(/|$)"),
     "függőségek",
     "Korábban kimaradt méret miatt. A rendszernek nincs futásidejű "
     "függősége, tehát ha van ilyen könyvtár, az fejlesztői eszközöké."),
    (re.compile(r"(^|/)__pycache__(/|$)|\.pyc$"),
     "Python melléktermék",
     "Korábban kimaradt mint zaj. Ártalmatlan, és a teljességhez tartozik."),
    (re.compile(r"(^|/)\.adat"),
     "a webes réteg helyi adatkönyvtára",
     "TITKOSÍTOTT ESETARCHÍVUM, KULCSOK ÉS NAPLÓK. Kizárólag szintetikus "
     "adat lehet benne — a kiszolgáló `OGDOC_SYNTHETIC=1` nélkül el sem "
     "indul. FIGYELEM: a kulcsok a rejtjelezett adat MELLETT állnak, tehát "
     "ebben a csomagban a titkosítás senki ellen nem véd."),
    (re.compile(r"\.DS_Store$|Thumbs\.db$"),
     "szerkesztői melléktermék",
     "Korábban kimaradt mint zaj."),
]

# ── AMI MEGÁLLÍTJA A CSOMAGOLÁST ──────────────────────────────────────────
PHI_GYANU = re.compile(r"_PHI|(^|[^a-z])phi([^a-z]|$)|beteg_adat", re.IGNORECASE)


def tiltott(rel: str):
    for minta, cim, ok in TILTAS:
        if minta.search(rel):
            return cim, ok
    if HELYI.search(rel):
        for minta, cim, ok in HELYI_INDOK:
            if minta.search(rel):
                return cim, ok
        return None  # helyi, de indoklás nélkül — a hívó megállítja a futást
    return None


def indoklatlan_helyi(rel: str) -> bool:
    return bool(HELYI.search(rel)) and not tiltott(rel)


def visszatett(rel: str):
    for minta, cim, ok in VISSZATETT:
        if minta.search(rel):
            return cim, ok
    return None


def git(*args: str) -> str:
    try:
        return subprocess.run(["git", *args], cwd=REPO, capture_output=True,
                              text=True, check=True).stdout.strip()
    except Exception:
        return ""


def sorold():
    """Végigjárja a REPÓT. Az alapértelmezés a bevétel."""
    fajlok, tiltottak, visszatettek, gyanus = [], {}, {}, []
    indoklatlan = []

    for dirpath, dirnames, filenames in os.walk(REPO):
        dirnames.sort()
        rel_dir = os.path.relpath(dirpath, REPO).replace(os.sep, "/")
        if rel_dir == ".":
            rel_dir = ""

        # A tiltott KÖNYVTÁRBA be sem megyünk: a 44 MB-os SNOMED-táblát
        # felesleges beolvasni ahhoz, hogy kihagyjuk.
        if rel_dir:
            t = tiltott(rel_dir + "/")
            if t:
                tiltottak.setdefault(t, []).append(rel_dir + "/")
                dirnames[:] = []
                continue
            if indoklatlan_helyi(rel_dir + "/"):
                indoklatlan.append(rel_dir + "/")
                dirnames[:] = []
                continue

        for fn in sorted(filenames):
            rel = f"{rel_dir}/{fn}" if rel_dir else fn
            if PHI_GYANU.search(fn):
                gyanus.append(rel)
                continue
            t = tiltott(rel)
            if t:
                tiltottak.setdefault(t, []).append(rel)
                continue
            if indoklatlan_helyi(rel):
                indoklatlan.append(rel)
                continue
            v = visszatett(rel)
            if v:
                visszatettek.setdefault(v, []).append(rel)
            fajlok.append(rel)

    return sorted(set(fajlok)), tiltottak, visszatettek, gyanus, sorted(indoklatlan)


def sha256(path: str):
    h = hashlib.sha256()
    n = 0
    with open(path, "rb") as fh:
        while chunk := fh.read(1 << 20):
            h.update(chunk)
            n += len(chunk)
    return h.hexdigest(), n


def olvasd_szamokat() -> dict:
    """A rendszer aktuális számai — a forrásból, nem kézből."""
    ki = {}
    try:
        r = subprocess.run(["node", "--experimental-strip-types",
                            "tools/validate.ts"],
                           cwd=ROOT, capture_output=True, text=True, timeout=300)
        sorok = [s for s in r.stdout.strip().split("\n") if s.strip()]
        ki["validalas"] = sorok[-1] if sorok else "(üres kimenet)"
    except Exception as e:
        ki["validalas"] = f"(nem futott le: {e})"
    try:
        # A tesztfájlokat KIFEJTVE adjuk át: a `--test test/` könyvtárként
        # más felderítést használ, és üres eredményt ad — egy „0 sikeres”
        # jegyzék pedig rosszabb, mint a hiányzó szám.
        tesztek = sorted(
            os.path.join("test", f) for f in os.listdir(os.path.join(ROOT, "test"))
            if f.endswith(".test.ts"))
        r = subprocess.run(["node", "--experimental-strip-types", "--test",
                            *tesztek], cwd=ROOT, capture_output=True,
                           text=True, timeout=900)
        m = re.search(r"^# pass (\d+)", r.stdout, re.M)
        f = re.search(r"^# fail (\d+)", r.stdout, re.M)
        ki["teszt"] = f"{m.group(1) if m else '?'} sikeres, {f.group(1) if f else '?'} bukott"
    except Exception as e:
        ki["teszt"] = f"(nem futott le: {e})"
    return ki


def jegyzek(fajlok, tiltottak, visszatettek, out_name, szamok) -> dict:
    tetel, osszes = [], 0
    for rel in fajlok:
        p = os.path.join(REPO, rel)
        if not os.path.isfile(p):
            continue
        h, meret = sha256(p)
        osszes += meret
        tetel.append({"fajl": rel, "meret": meret, "sha256": h})

    return {
        "csomag": out_name,
        "keszult": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "elv":
            "AZ ALAPÉRTELMEZÉS A BEVÉTEL. A csomag a teljes forrástárat viszi. "
            "Ami korábban kizárt volt, most bekerül — de a jegyzék megőrzi, "
            "miért állt a kizárási listán.",
        "forras": {
            "commit": git("rev-parse", "HEAD"),
            "ag": git("rev-parse", "--abbrev-ref", "HEAD"),
            "tiszta_munkafa": git("status", "--porcelain") == "",
        },
        "figyelmeztetes":
            "Ez a csomag SZINTETIKUS és nyilvános adatot tartalmaz. Valódi "
            "betegadat sem a forrásrepóban, sem itt nem szerepel. A "
            "csomagolás LEÁLL, ha betegadat-gyanús fájlnevet talál — a "
            "jelenléte nem kihagyandó, hanem megnézendő.",
        "nem_kerult_bele": [
            {"cim": cim, "ok": ok, "darab": len(lista),
             "utvonalak": sorted(lista)[:10]}
            for (cim, ok), lista in sorted(tiltottak.items())
        ],
        "korabban_kizart_de_bekerult": [
            {"cim": cim, "eredeti_ok": ok, "darab": len(lista),
             "peldak": sorted(lista)[:5]}
            for (cim, ok), lista in sorted(visszatettek.items())
        ],
        "allapot": szamok,
        "osszesen": {"fajl": len(tetel), "bajt": osszes},
        "fajlok": tetel,
    }


def olvassel(j: dict) -> str:
    s = [
        "# OGDOC — exportcsomag",
        "",
        f"Készült: {j['keszult']}  ",
        f"Forrás: `{j['forras']['ag']}` @ `{j['forras']['commit'][:12]}`"
        + ("" if j["forras"]["tiszta_munkafa"]
           else "  \n**A munkafa MÓDOSÍTOTT volt: a csomag nem egyezik pontosan egy commit-tal.**"),
        "",
        "## Az elv",
        "",
        "> " + j["elv"],
        "",
        "## Figyelmeztetés",
        "",
        "> " + j["figyelmeztetes"],
        "",
        "## A rendszer állapota a csomagoláskor",
        "",
        "```",
        j["allapot"].get("validalas", "—"),
        f"teszt: {j['allapot'].get('teszt', '—')}",
        "```",
        "",
        "Részletesen: `ogdoc/docs/14-allapot.md` (generált) és",
        "`ogdoc/docs/13-18-lepes.md` (a tizennyolc lépés állása).",
        "",
        "## Ami korábban ki volt zárva, és MOSTANTÓL BENNE VAN",
        "",
        "Az eredeti ok megmarad, mert egy indoklás nélkül visszatett fájl",
        "ugyanolyan megmagyarázhatatlan, mint egy indoklás nélkül kihagyott.",
        "",
        "| Mi | Darab | Miért volt kizárva |",
        "|---|---:|---|",
    ]
    for k in j["korabban_kizart_de_bekerult"]:
        s.append(f"| **{k['cim']}** | {k['darab']} | {k['eredeti_ok']} |")

    s += [
        "",
        "## Ami NEM került bele — és miért nem",
        "",
        "| Mi | Miért |",
        "|---|---|",
    ]
    for k in j["nem_kerult_bele"]:
        s.append(f"| **{k['cim']}** | {k['ok']} |")

    s += [
        "",
        "### A SNOMED-tábla pótlása",
        "",
        "A `registry/kodok/helyi/tbl-snomed.json` a SNOMED CT Global Patient",
        "Set származtatott alakja. A licenc **CC BY-ND 4.0** — a származtatott",
        "mű terjesztése tiltott, ezért a csomagból hiányzik. Helyben",
        "újraépíthető: a kiadás beszerzése után a `tools/ingest/` alatti",
        "átalakító állítja elő, és a `registry/kodok/tablak/` alá **nem**",
        "kerülhet — azt a `validateSnomedDistribution()` build-hibaként fogja",
        "meg. Az eredeti kiadás azonosítója és sha256 lenyomata a",
        "`forrasok/` jegyzékében szerepel.",
        "",
        "## Ellenőrzés",
        "",
        "A `ogdoc/JEGYZEK.json` minden fájlhoz megadja a méretét és a sha256",
        "lenyomatát:",
        "",
        "```bash",
        "python3 - <<'PY'",
        "import json, hashlib, pathlib",
        "j = json.load(open('JEGYZEK.json', encoding='utf-8'))",
        "rossz = [f['fajl'] for f in j['fajlok']",
        "         if not pathlib.Path(f['fajl']).is_file()",
        "         or hashlib.sha256(pathlib.Path(f['fajl']).read_bytes())",
        "            .hexdigest() != f['sha256']]",
        "print('eltérő fájl:', rossz or 'nincs')",
        "PY",
        "```",
        "",
        f"Összesen **{j['osszesen']['fajl']} fájl**, "
        f"{j['osszesen']['bajt'] / 1e6:.1f} MB tömörítetlenül.",
    ]
    return "\n".join(s) + "\n"


def darabol(path: str, meret: int) -> None:
    """A kész zipet darabokra vágja — ÖSSZEFŰZÉSSEL áll helyre.

    Nem többköteteles zipet készít, hanem NYERS darabokat: a `cat` mindenhol
    létezik, a többkötetes zip olvasása pedig eszközfüggő. A helyreállítás így
    egyetlen parancs, és a darabok sorrendje a nevükből látszik.
    """
    darabok = []
    with open(path, "rb") as fh:
        i = 1
        while chunk := fh.read(meret):
            nev = f"{path}.{i:03d}"
            with open(nev, "wb") as ki:
                ki.write(chunk)
            darabok.append(os.path.basename(nev))
            i += 1
    alap = os.path.basename(path)
    utmutato = os.path.join(os.path.dirname(path), f"{alap}.OSSZEFUZES.md")
    with open(utmutato, "w", encoding="utf-8") as f:
        f.write(
            f"# {alap} — összefűzés\n\n"
            f"A csomag {len(darabok)} darabra van vágva, mert a küldési korlát "
            f"kisebb nála. A darabok NYERS bájtok, nem önálló zipek — "
            f"összefűzés után áll helyre az eredeti fájl.\n\n"
            "```bash\n"
            f"cat {alap}.[0-9][0-9][0-9] > {alap}\n"
            f"unzip -t {alap}      # épség\n"
            "```\n\n"
            "Ellenőrzés (a teljes fájl sha256-ja):\n\n"
            f"```\n{sha256(path)[0]}\n```\n\n"
            "A csomagon belüli `JEGYZEK.json` ezen felül fájlonként is megadja a\n"
            "lenyomatot, tehát a részleges sérülés is kimutatható.\n")
    print(f"\n  {len(darabok)} darabra vágva "
          f"(a helyreállítás: {os.path.basename(utmutato)})")


def main() -> int:
    ap = argparse.ArgumentParser(description="OGDOC exportcsomag")
    ap.add_argument("--out", default=None)
    ap.add_argument("--lista", action="store_true")
    ap.add_argument("--git-nelkul", action="store_true",
                    help="a verziótörténet kihagyása (ha a csomag maga a repóba megy)")
    ap.add_argument("--gyors", action="store_true",
                    help="a validálást és a teszteket nem futtatja le")
    ap.add_argument("--max-mb", type=float, default=None,
                    help="ekkora darabokra vágja a kész zipet (küldési korlát)")
    a = ap.parse_args()

    fajlok, tiltottak, visszatettek, gyanus, indoklatlan = sorold()

    # A VERZIÓTÖRTÉNET KIHAGYÁSA CSAK EGY ESETBEN INDOKOLT, ÉS AKKOR IS
    # KIMONDVA. Ha a csomag maga a GitHub-repóba kerül, a `.git` bevétele azt
    # jelentené, hogy a történet a saját történetébe másolódik: 40 MB, ami
    # minden ilyen csomagolással újra megduplázódik, miközben ugyanaz a
    # történet a repóban amúgy is ott van. Ez ugyanaz az érv, ami a korábbi
    # exportcsomagot kizárja — egy lépéssel odébb.
    if a.git_nelkul:
        ok = ("A csomag a GitHub-repóba kerül, ahol ugyanez a történet már ott "
              "van. Bevéve a történet a saját történetébe másolódna, és minden "
              "csomagolással újra megduplázódna. Teljes történettel: "
              "`npm run csomag` kapcsoló nélkül.")
        gitesek = [f for f in fajlok if re.search(r"(^|/)\.git(/|$)", f)]
        fajlok = [f for f in fajlok if f not in set(gitesek)]
        visszatettek.pop(next((k for k in visszatettek if k[0] == "verziótörténet"), None), None)
        tiltottak[("verziótörténet (--git-nelkul)", ok)] = gitesek

    if gyanus:
        print("A CSOMAGOLÁS LEÁLLT.\n", file=sys.stderr)
        print("Betegadat-gyanús fájlnevet találtam. Ez nem kihagyandó, hanem",
              file=sys.stderr)
        print("megnézendő — egy ilyen fájl jelenléte azt jelenti, hogy valami",
              file=sys.stderr)
        print("eleve rossz helyre került:\n", file=sys.stderr)
        for g in gyanus[:20]:
            print(f"    {g}", file=sys.stderr)
        return 3

    if indoklatlan:
        print("A CSOMAGOLÁS LEÁLLT.\n", file=sys.stderr)
        print("`helyi/` fát találtam, amiről nincs bejegyzett indok. A `helyi/`",
              file=sys.stderr)
        print("nem könyvtárnév, hanem állítás: ami ott van, az helyben épül és",
              file=sys.stderr)
        print("helyben marad — licenc, szerzői jog vagy személyes adat miatt.",
              file=sys.stderr)
        print("Indoklás nélkül nem dönthető el, kivihető-e, és a néma bevétel",
              file=sys.stderr)
        print("pont itt a legdrágább. Vedd fel a HELYI_INDOK listába:\n",
              file=sys.stderr)
        for g in indoklatlan[:20]:
            print(f"    {g}", file=sys.stderr)
        return 4

    nev = a.out or f"ogdoc-export-{datetime.now().strftime('%Y%m%d')}.zip"
    out = nev if os.path.isabs(nev) else os.path.join(REPO, nev)

    if a.lista:
        print(f"{len(fajlok)} fájl menne a csomagba.\n")
        print("KORÁBBAN KIZÁRT, MOSTANTÓL BENNE:")
        for (cim, ok), lista in sorted(visszatettek.items()):
            print(f"  + {len(lista):>5}  {cim}")
            print(f"           {ok[:100]}")
        print("\nNEM KERÜL BELE:")
        for (cim, ok), lista in sorted(tiltottak.items()):
            print(f"  − {len(lista):>5}  {cim}")
            print(f"           {ok[:100]}")
        return 0

    szamok = {"validalas": "(--gyors)", "teszt": "(--gyors)"} if a.gyors \
        else olvasd_szamokat()
    if not a.gyors:
        print("Számok kiolvasása a forrásból…")

    j = jegyzek(fajlok, tiltottak, visszatettek, os.path.basename(out), szamok)

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for rel in fajlok:
            p = os.path.join(REPO, rel)
            if os.path.isfile(p):
                z.write(p, arcname=rel)
        z.writestr("JEGYZEK.json", json.dumps(j, ensure_ascii=False, indent=2))
        z.writestr("OLVASSEL.md", olvassel(j))

    meret = os.path.getsize(out)
    if a.max_mb and meret > a.max_mb * 1024 * 1024:
        darabol(out, int(a.max_mb * 1024 * 1024))
    print(f"\n{out}")
    print(f"  {j['osszesen']['fajl']} fájl · "
          f"{j['osszesen']['bajt'] / 1e6:.1f} MB tömörítetlenül · "
          f"{meret / 1e6:.1f} MB a csomag")
    print(f"  commit: {j['forras']['commit'][:12]} "
          f"({'tiszta' if j['forras']['tiszta_munkafa'] else 'MÓDOSÍTOTT'} munkafa)")
    if j["korabban_kizart_de_bekerult"]:
        print("\n  korábban kizárt, mostantól benne:")
        for k in j["korabban_kizart_de_bekerult"]:
            print(f"    + {k['darab']:>5}  {k['cim']}")
    print("\n  nem került bele:")
    for k in j["nem_kerult_bele"]:
        print(f"    − {k['darab']:>5}  {k['cim']} — {k['ok'][:60]}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
