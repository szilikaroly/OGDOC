# Modulsablon

Másold `modules/NN-modulnev/` alá, és töltsd ki. Amíg a **kilenc tétel** hiánytalan,
a modul nem kész — a `docs/fejlesztes/04-modul-csontvaz.md` ezt tételesen indokolja.

```
modules/NN-nev/
  README.md                a modul saját fejlesztői leírása (ebből a sablonból)
  regiszter/
    valtozok.json          a modul változói — EZ a modul lényege
    ertekkeszletek.json    a kódlisták, ha nagyok
  kalkulatorok/
    index.ts               registerCalc() hívások, forrásmegjelöléssel
  teszt/
    modul.test.ts          golden tesztek a modul SZABÁLYAIRA
    fixture.json           szintetikus eset — beteg-azonosításra alkalmas adat nélkül
  ATVETEL.md               a klinikai átvétel jegyzőkönyve
```

## A kilenc tétel

- [ ] **1. Változók** — minden mező `documentation.definition`-nel; `coded`-hoz `valueSet`
- [ ] **2. Keresztfeltöltési térkép** — mi mit tölt (a gráfból **generált**, nem kézzel írt)
- [ ] **3. Kalkulátorok** — `source.cite` és `verified` jelölés mindegyiken
- [ ] **4. Szabad szöveg feloldása** — minden `text` mezőhöz indoklás vagy csere
- [ ] **5. Golden tesztek** — a modul szabályaira, kézzel ellenőrzött értékekkel
- [ ] **6. FHIR-leképezés** — `standards.fhir` minden exportálandó mezőn
- [ ] **7. PHI-jelölés** — minden beteg-azonosításra alkalmas mezőn `phi: true`
- [ ] **8. Klinikai átvétel** — `ATVETEL.md`, aláírva
- [ ] **9. Nyitott kérdések** — amit a modul NEM old meg, kimondva

## Amit soha ne csinálj

| Ne | Mert |
|---|---|
| Ne írj kézzel `consumers` listát | generált mező; a kézi lista fél éven belül hazudik |
| Ne vegyél fel `bool`-t anamnesztikus kérdéshez | a „nem tudom" elveszik → `tristate` |
| Ne másold át egy másik modul mezőjét | ha ugyanaz az adat, `aliasOf` kell |
| Ne írj képletet a modul kódjába | `registerCalc`, forrással és `verified` jelöléssel |
| Ne tegyél valódi betegadatot a fixture-be | a repó soha nem tartalmazhat ilyet |
