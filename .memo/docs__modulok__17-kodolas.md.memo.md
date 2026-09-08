---
source: docs/modulok/17-kodolas.md
sha256: c7fc2d26a1a37fc3f889e34e866ec691f69d662bc386da239b1bee311f284d31
lines: 143
profile: prose
generator: subagent
raw_tokens_est: 1976
verified: 6 confirmed
---

# docs/modulok/17-kodolas.md

## Topics
- L1-143: BNO/OENO/HBCS kódajánlás szabályokból, EESZT-kódtörzsek, HBCS-kapu

## Claims

- [C1] [CONFIRMED] A kódajánlás feltételes szabályokból, a rögzített adat következményeként áll elő, és követi az adat változását @L27 `kódajánlás tehát **a rögzített adat következménye**, és ha az adat változik, a kód is.`
- [C2] [CONFIRMED] A v15-ös EESZT-ingest óta 13 törzs, mintegy 13 000 tétel van beágyazva, ez a fájlméret nagy része @L35 `A v15-ös EESZT-ingest óta **13 törzs, ~13 000 tétel** van beágyazva.`
- [C3] [CONFIRMED] A súlyosabb kód elnyomja az enyhébbet, de az elnyomott kód a listában marad az elnyomás okával együtt @L102 `A súlyosabb kód ELNYOMJA az enyhébbet, de nem csendben: az elnyomott kód a listában marad,`
- [C4] [CONFIRMED] KAPU: HBCS-besorolás nincs, amíg a szabálykönyv nincs betöltve és ellenőrizve; a képességet a kód kívülről kapja (`rulebookVerified`) @L111 `részhalmaz jó irány, de a kapu előbb van — BESOROLÁS NINCS, amíg a szabálykönyv nincs betöltve`
- [C5] [CONFIRMED] A táblakereséshez új levezetés-fajta kellett (`derivation.kind: "lookup"`), mert az irányítószámból szöveg lesz, a kalkulátor-réteg pedig csak számot ad @L131 `irányítószámból viszont SZÖVEG lesz.`
- [C6] [CONFIRMED] A kódtörzsek ma részhalmazok: 32 BNO-kód és 10 irányítószám van betöltve a tervezett ~13 000 tételből @L141 `**A kódtörzsek részhalmazok.** 32 BNO-kód és 10 irányítószám van betöltve a tervezett ~13 000`
