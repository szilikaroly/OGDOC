#!/usr/bin/env python3
"""
FORRÁSTÁR ÖSSZEÁLLÍTÁSA — a teljes követhetőséghez.

    python3 tools/publish/forrasok.py --uploads <könyvtár> --out forrasok

A rendszer minden kódtáblája és minden finanszírozási szabálya hivatalos
forrásból származik. A `registry/kodok/manifest.json` eddig is rögzítette a
forrás nevét, méretét és SHA-256 lenyomatát — de a FÁJL maga nem volt a
repóban. Egy retrospektív vita esetén a lenyomat csak azt bizonyítja, hogy a
fájl NEM VÁLTOZOTT; azt nem, hogy mi volt benne.

Ez a szkript összeállítja a forrástárat, és ugyanabban a lépésben megmondja,
mi maradt ki, és MIÉRT. A kimaradás nem hiányosság: LICENC. Egy forrástár,
ami hallgat a kihagyott tételekről, rosszabb a semminél, mert teljesnek
látszik.

HÁROM OSZTÁLY:

  publikus    magyar közfeladatot ellátó szerv hivatalos törzse vagy
              jogszabály szövege — szabadon továbbadható
  sajat       a projekt saját bemeneti anyaga (IntuiCare, SOS24, IPRACS,
              v16) — a szerző dönt róla
  kimarad     szerzői jogi vagy licencfeltétel miatt NEM kerül be; a
              lenyomata igen
"""
import argparse, hashlib, json, os, re, shutil, sys
from datetime import date

# (feltöltési minta, kanonikus név, osztály, forrás, ok)
KATALOGUS = [
    # ── Hivatalos magyar törzsek és jogszabályok ─────────────────────────
    (r"BNO_2501\.ZIP$", "torzsek/BNO_2501.zip", "publikus",
     "NEAK: BNO-10 magyar törzs, 2025. januári kiadás (BNOTORZS.DBF)",
     "Ebből lett a `tbl.bno`. Ez a kiadás adja a nemet, az életkori "
     "tartományt és az érvényességet."),
    (r"BNOX_3_4\.zip$", "torzsek/BNOX_3_4.zip", "publikus",
     "BNO-10 magyar törzs, 3.4 kiadás (2006) — archív",
     "A korábbi kiadás. Négykarakteres alkategóriákat is tartalmaz; a "
     "jelentési alak viszont ötkarakteres, ezért ezt felváltotta az újabb."),
    (r"MUT_2602_1\.ZIP$", "torzsek/MUT_2602.zip", "publikus",
     "NEAK: fekvőbeteg beavatkozási (műtéti) törzs, 2026. február (MUTET_AP.DBF)",
     "Ebből lett a `tbl.mut`. Ez döntötte el, hogy a hazai fekvőbeteg "
     "beavatkozáskód ötjegyű, nem ICD-9-CM alakú."),
    (r"FNOTORZS\.ZIP$", "torzsek/FNOTORZS.zip", "publikus",
     "NEAK: FNO (ICF) törzs, 2019", "Ebből lett a `tbl.fno`."),
    (r"HBCS2603\.ZIP$", "torzsek/HBCS_2026-03.zip", "publikus",
     "NEAK: HBCS 5.0 törzs DBF alakban (HBCS50.DBF)",
     "Ebből lett a `tbl.hbcs`: súlyszám, határnapok, közérthető csoportnév "
     "és a `*` intézeti jelzés."),
    (r"Hbcs50_torzs_20260401\.xls$", "torzsek/Hbcs50_torzs_20260401.xls", "publikus",
     "NEAK: HBCS 5.0 törzs, érvényes 2026.04.01-től (XLS)",
     "Ugyanaz a kiadás táblázatos alakban."),
    (r"hbcs50_2025\.zip$", "torzsek/hbcs50_2025.zip", "publikus",
     "NEAK: HBCS 5.0 korábbi kiadások (2025-01, 2025-05)",
     "Ebből lett a `tbl.hbcs@2025-01-01` és a `tbl.hbcs@2025-05-01`. A 671A "
     "Császármetszés súlyszáma 2025 májusában 1,53177 volt, 2026 áprilisában "
     "1,74947 — visszamenőleges elszámoláshoz a KIADÁS dönt, nem a csoportkód."),
    (r"teljes_szabalykonyv.*20260101\.docx$", "jogszabaly/9_2012_NEFMI_jaro_20260101.docx",
     "publikus", "9/2012. (II. 28.) NEFMI rendelet — járóbeteg-szakellátás, "
     "hatályos 2026.01.01.",
     "Ebből lett a `tbl.oeno` és a három melléklet-tábla: kompetencia, "
     "kizárási és együtt-jelenthetőségi szabályok, BNO-feltételes eljárások."),
    (r"10_2012_NEFMI_fekvo_20250501\.docx$", "jogszabaly/10_2012_NEFMI_fekvo_20250501.docx",
     "publikus", "10/2012. (II. 28.) NEFMI rendelet — HBCs kódolási és "
     "besorolási szabályok, hatályos 2025.05.01.",
     "KÉZZEL feldolgozva: ebből lett a `registry/kodok/fekvo/` "
     "diagnózis-típusjel és szülés-kódolási szabálykészlete."),
    (r"Technikai_leiras_202605\.pdf$", "jogszabaly/NEAK_fekvo_technikai_utmutato_202605.pdf",
     "publikus", "NEAK Általános Finanszírozási Főosztály: Fekvőbeteg jelentés "
     "— technikai útmutató, 2026. május",
     "KÉZZEL feldolgozva: ebből lett a `rekordkep.json`. Ez döntötte el a "
     "kódalak kérdését: BNO_KOD 5 karakter, B_KOD 5 karakter."),
    (r"torzslista_.*20260101\.xlsx$", "torzsek/OENO_torzslista_20260101.xlsx", "publikus",
     "OENO törzslista pontértékkel, hatályos 2026.01.01.",
     "A pontérték teszi elvégezhetővé a 9/2012 NEFMI 5. § (7) szerinti "
     "választást: kizárásos ütközésnél a magasabb pontszámú eljárás számolható el."),
    (r"kompetencia_.*20260101\.xlsx$", "torzsek/OENO_kompetencia_20260101.xlsx", "publikus",
     "OENO × szakma kompetencialista, hatályos 2026.01.01.", "Gépi olvasatú kiadás."),
    (r"9_jegy__beutal_si_t_rzslista_202609\.xlsx$",
     "torzsek/9jegyu_beutalasi_torzslista_202609.xlsx", "publikus",
     "NEAK: 9 jegyű beutalási (GYFKOD) törzs, 2026. szeptember",
     "A SZEMÉLYNEVEK a származtatott táblából szándékosan kimaradnak; a "
     "forrásfájl az eredeti, változatlan kiadás."),
    (r"Diagnosztikai_torzs_letoltese.*\.xls$", "torzsek/Diagnosztikai_torzs_20051220.xls",
     "publikus", "Diagnosztikai anyagok törzse, 2005.12.20. (archív)", ""),
    (r"MANYAGUJ_.*\.xlsx$", "torzsek/Egyszerhasznalatos_eszkoz_torzs_20180604.xlsx",
     "publikus", "Egyszerhasználatos (műanyag) eszközök törzse, 2018.06.04.", ""),

    # ── A projekt saját bemeneti anyagai ─────────────────────────────────
    (r"intuicareteljesforraskod\.zip$", "platform/intuicare-forraskod.zip", "sajat",
     "IntuiCare (MedRoster) teljes forráskód", "A platform, amire a rendszer épül."),
    (r"intuicarefejlesztoidokumentacio\.zip$", "platform/intuicare-fejlesztoi-dok.zip",
     "sajat", "IntuiCare fejlesztői dokumentáció", ""),
    (r"intuicareadatbazis\.zip$", "platform/intuicare-adatbazis.zip", "sajat",
     "IntuiCare adatbázisséma (230 tábla)", ""),
    (r"sos24teljesexport.*\.zip$", "platform/sos24-export.zip", "sajat",
     "SOS24 portál teljes exportja (71 tábla, 37 edge function)",
     "A foglalkozás-egészségügyi domének forrása."),
    (r"IPRACS_Full_Dev_Doc\.docx$", "ipracs/IPRACS_fejlesztoi_dokumentacio.docx", "sajat",
     "IPRACS v1.0 fejlesztői dokumentáció", "A score-ok és a klinikai kapuk forrása."),
    (r"IPRACS_Fejlesztesi_Dokumentacio\.docx$", "ipracs/IPRACS_fejlesztesi_dokumentacio.docx",
     "sajat", "IPRACS fejlesztési dokumentáció", ""),
    (r"IPRACS_Lovable_Spec\.md$", "ipracs/IPRACS_Lovable_Spec.md", "sajat",
     "IPRACS Lovable-implementációs specifikáció",
     "Történeti: a `docs/06-webes-migracio.md` írja le, miért nem ezt használjuk."),
    (r"Anamnezis_v16_dokumentacio\.zip$", "v16/Anamnezis_v16_dokumentacio.zip", "sajat",
     "Anamnézis-asszisztens v16 dokumentáció", "A 110 kérdéssoros anamnézis forrása."),

    # ── Amit licenc miatt NEM teszünk be ─────────────────────────────────
    (r"SnomedINTL_GPSRelease.*\.zip$", None, "kimarad",
     "SNOMED CT Global Patient Set, 2026-01-01 kiadás",
     "CC BY-ND 4.0. A VÁLTOZATLAN továbbadás megengedett lenne, de a "
     "rendszer elve az, hogy SNOMED-tartalom nem kerül a repóba — sem a "
     "kiadás, sem a belőle készült tábla. A repó csak AZONOSÍTÓKAT "
     "tartalmaz. A készlet helyben települ; ezt a "
     "`validateSnomedDistribution()` build-hibával kényszeríti ki."),
    (r"753286_2aae3f75f8d243328657b7d6788f1d5d\.pdf$", None, "kimarad",
     "SNOMED International: Guidelines for Translation of SNOMED CT",
     "SNOMED International szerzői joga. A belőle következő SZABÁLY a "
     "kódban van: magyar SNOMED-megnevezést a rendszer nem ad validált "
     "fordítás nélkül."),
    (r"2_Eg__szs__g__gyfinansz__roz__sa_20171209\.pdf$", None, "kimarad",
     "Egészségügy finanszírozása — oktatási anyag (2017)",
     "Szerzői jogvédett oktatási anyag, ráadásul képként szkennelt: "
     "szövegréteg nélkül nem is adott semmit."),
    (r"A_HBCS_rendszer_mukodesi_zavarai.*\.pdf$", None, "kimarad",
     "IME IV/2 (2005): A HBCS rendszer működési zavarai és azok megszüntetése",
     "Folyóiratcikk, szerzői jogvédett. Háttérirodalom, nem normatív forrás — "
     "szabályt nem vezettünk belőle."),
    (r"egvedec3444\.pdf$", None, "kimarad",
     "Egészségügyi Gazdasági Szemle 2009/6 — szakcikk",
     "Folyóiratcikk, szerzői jogvédett. Háttérirodalom, nem normatív forrás."),
    # ── Harmadik fél nyilvános repói: a tanulság bejön, a fájl nem ──────
    (r"DataMiningmain\.zip$", None, "kimarad",
     "DataMining (nyilvános GitHub-repó): egyetemi adatbányászati gyakorlat",
     "Harmadik fél anyaga, a licencét nem vizsgáltuk — a fájl nem kerül be. "
     "A TANULSÁG igen, és a `docs/fejlesztes/29-kulso-repok.md` írja le: a "
     "citokinprofil-alapú halálozás-előrejelzés a HELYI MODELL mintapéldája, "
     "és egyben annak is, miért nem futtatható más populáción "
     "hitelesítés nélkül."),
    (r"MedicalReportSimplification.*\.zip$", None, "kimarad",
     "Medical Report Simplification for Patients (nyilvános GitHub-repó): "
     "FLAN-T5 + LoRA a leletek betegnyelvre fordítására",
     "Harmadik fél anyaga, a licencét nem vizsgáltuk. A tanulság a 26. modult "
     "érinti: a rendszer a beteg szövegét a STRUKTURÁLT ÉRTÉKEKBŐL írja, nem "
     "a kész leletből — a kettő különbsége az ellenőrizhetőség."),
    (r"hospital_managment_app_djangomaster\.zip$", None, "kimarad",
     "hospital_managment_app_django (nyilvános GitHub-repó): kórházi "
     "nyilvántartás Django-ban",
     "Harmadik fél anyaga, és KÜLÖN OK is van rá: a repó README-je "
     "jelszavakat közöl nyílt szövegben, és egy feltöltött SQLite-adatbázist "
     "is tartalmaz. Éppen az, amit a mi `.gitignore`-unk és a "
     "„beteg-azonosításra alkalmas adat nem kerül a repóba” szabály tilt — "
     "a tanulság negatív mintaként ér valamit, a fájl semmit."),

    (r"27PregnancyChildbirthDataDictionaryV5\.0_2025\.xlsx$", None, "kimarad",
     "ICHOM Pregnancy and Childbirth Data Dictionary v5.0 (2025)",
     "Az ICHOM saját felhasználási feltételei alatt jelenik meg. A belőle "
     "GENERÁLT változóleképezés a repóban van "
     "(`registry/ichom-pcb-v5.seed.json`), a szótár maga nem."),
]



CIM = {
    "publikus": ("Hivatalos törzsek és jogszabályok",
                 "Magyar közfeladatot ellátó szerv hivatalos kiadványa vagy "
                 "jogszabály szövege. Szabadon továbbadható, és **itt van, "
                 "eredetiben** — nem csak a lenyomata."),
    "sajat": ("A projekt saját bemeneti anyagai",
              "Amire a rendszer épül: a platform, a korábbi alkalmazások és "
              "a specifikációk."),
    "kimarad": ("Ami licenc miatt NEM került be",
                "Ezek a tételek **nincsenek a tárban** — de itt vannak "
                "felsorolva, lenyomattal és okkal. Ez a szakasz nem hiányjegyzék, "
                "hanem a tár része: enélkül a tár teljesnek látszana."),
}


def readme(manifest):
    out = ["# Forrástár\n",
           "> Minden kódtábla és minden finanszírozási szabály **hivatalos "
           "forrásból** származik. Ez a könyvtár a forrásokat tartalmazza "
           "eredetiben, hogy egy retrospektív vita eldönthető legyen.\n",
           "A `registry/kodok/manifest.json` eddig is őrizte a forrás nevét, "
           "méretét és SHA-256 lenyomatát. A lenyomat azt bizonyítja, hogy a "
           "fájl **nem változott** — azt nem, hogy **mi volt benne**. Egy "
           "elszámolási vitában ez a különbség dönt.\n",
           f"Összeállítva: {manifest['keszult']}\n"]
    for klass in ("publikus", "sajat", "kimarad"):
        rows = [e for e in manifest["tetelek"] if e["osztaly"] == klass]
        if not rows:
            continue
        title, lead = CIM[klass]
        out.append(f"## {title}\n\n{lead}\n")
        for e in rows:
            hol = f"`{e['utvonal']}`" if e.get("utvonal") else "**nincs a tárban**"
            out.append(f"### {e['forras']}\n")
            out.append(f"| | |\n|---|---|\n| Hol | {hol} |\n"
                       f"| Méret | {e['bytes']:,} bájt |\n"
                       f"| SHA-256 | `{e['sha256']}` |\n".replace(",", " "))
            if e["megjegyzes"]:
                out.append(f"\n{e['megjegyzes']}\n")
            out.append("")
    out.append("## Az elv\n\n" + manifest["elv"] + "\n")
    return "\n".join(out)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--uploads", required=True)
    ap.add_argument("--out", default="forrasok")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    files = sorted(os.listdir(a.uploads))
    index, missing = [], []
    for rx, dest, klass, cite, note in KATALOGUS:
        # A feltöltési nevek egyedi előtagot kapnak; a legfrissebb példány nyer.
        hits = [f for f in files if re.search(rx, f)]
        if not hits:
            missing.append(cite)
            continue
        src = os.path.join(a.uploads, sorted(
            hits, key=lambda f: os.path.getmtime(os.path.join(a.uploads, f)))[-1])
        entry = {
            "forras": cite, "osztaly": klass, "bytes": os.path.getsize(src),
            "sha256": sha256(src), "megjegyzes": note,
        }
        if dest:
            entry["utvonal"] = dest
            if not a.dry_run:
                target = os.path.join(a.out, dest)
                os.makedirs(os.path.dirname(target), exist_ok=True)
                shutil.copy2(src, target)
        index.append(entry)

    index.sort(key=lambda e: (["publikus", "sajat", "kimarad"].index(e["osztaly"]),
                              e.get("utvonal", e["forras"])))
    manifest = {
        "keszult": date.today().isoformat(),
        "elv": "Minden forrás lenyomattal szerepel. Ami licenc miatt kimarad, "
               "az IS szerepel — a lenyomatával és a kimaradás okával. Egy "
               "forrástár, ami hallgat a kihagyott tételekről, teljesnek "
               "látszik, és ezért rosszabb a semminél.",
        "tetelek": index,
    }
    if not a.dry_run:
        os.makedirs(a.out, exist_ok=True)
        with open(os.path.join(a.out, "manifest.json"), "w", encoding="utf8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=1)
            f.write("\n")
        with open(os.path.join(a.out, "README.md"), "w", encoding="utf8") as f:
            f.write(readme(manifest))
    n = {k: sum(1 for e in index if e["osztaly"] == k)
         for k in ("publikus", "sajat", "kimarad")}
    print(f'  {n["publikus"]} publikus · {n["sajat"]} saját · {n["kimarad"]} '
          f'licenc miatt kihagyva (lenyomattal)')
    for m in missing:
        print(f"  NEM TALÁLHATÓ a feltöltések közt: {m}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
