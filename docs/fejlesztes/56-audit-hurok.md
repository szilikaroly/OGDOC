# 56 — Az audit-hurok

*A 17. lépés gépi fele. A kör, aminek nem volt hova írnia.*

---

## Amiért ez a lépés a rendszer legfontosabb köre

Minden normogram, minden kockázati szám és minden modell **csak addig ér
valamit, amíg valaki elhiszi** — hacsak vissza nem mérjük *ebben az
intézményben, ezen a populáción*. A terv negyedik megjegyzendő mondata így
szól: *„a 17. és a 18. nélkül a rendszer sosem tudja meg, hogy jó-e.”*

---

## Amit ez a lépés talált

**A három audit-mezőnek nem volt hova írnia.**

A felülettérképen mind ott állt — `outcomeAudit: true` jelöléssel, saját
kapuval (`core/ui/felulet.ts`), saját döntési szabállyal
(`registry/felulet/dontes-szabalyok.json`), hosszú indoklással arról, hogy ez
zárja be a rendszer legfontosabb körét:

| Mező | Űrlap | Változó volt |
|---|---|---|
| A prenatális diagnózis megerősítve? | `form.kimenetelGyermek` | **`null`** |
| UH diagnózis megerősítve | `gyn.form.kimenetel` | **`null`** |
| Műtét utáni diagnózis megerősítve | `gyn.form.kimenetel` | **`null`** |

Mind a háromban `variable: null`. A mező megjelent volna a felületen, a kapu
megállította volna az átvételt, a szabály a klinikushoz került volna — és a
válasz, amit a klinikus beleír, **sehol nem maradt volna meg**.

A 17. lépés „Kész, ha”-ja **számot** kér. Számot nem lehet olyan mezőből
számolni, ami nem létezik. Ez a hibacsalád hatodszor kerül elő: próza, ami
olyat ígér, amit a szerkezet nem tud hordozni — most a rendszer legfontosabb
körén.

**A javítás:** három új változó (`audit.prenatal.confirmed`,
`audit.us.confirmed`, `audit.postop.confirmed`), a három mező bekötve, és egy
validálás, ami a **változó nélküli `outcomeAudit` mezőt hibának** tekinti. Az
audit-mezők listája a felülettérképből derivált, nem külön nyilvántartásból: egy
új mező felvétele önmagában bekapcsolja az ellenőrzést.

---

## Négy válasz, nem kettő

A mezők felirata *„megerősítve? **igen · …**”* volt — vagyis kétértékű. És a
kétértékű válasz a **cáfolatot** és az **eldönthetetlenséget** ugyanabba a
rekeszbe teszi:

- `refuted` — a referencia **mást mondott**: a rendszer tévedett.
- `indeterminate` — a referencia **nem tudott dönteni**: a rendszerről ez
  semmit nem állít.

A különbség nem elméleti. A felülettérkép **saját jegyzete** mondja ki, hogy a
felületes endometriosis szövettani igazolása közismerten megbízhatatlan — vagyis
ezen a páron az „eldönthetetlen” nem ritka kivétel, hanem **várható kimenet**.
Kétértékű mezővel minden ilyen eset „tévedés”-ként állna be.

| 6 egyezés · 2 eltérés · 4 eldönthetetlen | Arány |
|---|---|
| helyesen (a nevező csak az értékelhető) | **6/8 = 75%** |
| az eldönthetetleneket cáfolatnak véve | **6/12 = 50%** |

Ugyanaz az adat, ugyanaz a rendszer, **huszonöt százalékpont** különbség — és
mindig lefelé. Az összemosás nem zajt csinál, hanem **rendszeres torzítást**.

A változók ezért négyértékűek (`confirmed` · `refuted` · `indeterminate` ·
`noReference`), és az ötödik állapot a **hiányzó** válasz, aminek nincs kódja:
*a hiányzó adat sehol nem „nem”.* A `besorol()` ezért az ismeretlen kódot is
`hianyzo`-ba teszi — érdemi rekeszbe soha.

Ha valaki a válaszkészletet visszacsúsztatja kétértékűre, az **hiba**, nem
figyelmeztetés.

---

## Mikortól szabad számot mondani

Egy háromesetes mintából számolt 67%-os találati arány **rosszabb, mint semmi**:
úgy néz ki, mint egy mérés, és nem az.

A `kozles()` ezért soha nem ad ki puszta arányt — mindig
konfidenciaintervallummal, és csak akkor, ha mindhárom küszöb engedi:

| Állapot | Mikor |
|---|---|
| `kuszobNelkul` | nincs megnevezett küszöb → **a kapu zárva**, 100/100 mellett is |
| `nincsAdat` | nulla értékelhető eset → **ez nem nulla találati arány** |
| `keveseset` | kevesebb eset, mint a minimum |
| `tulSokEldonthetetlen` | a szám a *referenciáról* szólna, nem a rendszerről |
| `tulSzelesSav` | a pontbecslés megvan, de a sáv szélesebb a megengedettnél |
| `kozolheto` | az arány **a sávjával együtt** |

**Az arány `null`, nem 0**, valahányszor nem közölhető. A nulla azt állítja,
hogy mértünk és rossz lett; a `null` azt, hogy nem mértünk. A kettő
összekeverése ezt a lépést egészében értelmetlenné tenné.

**A hiányzó küszöb nem engedékenység.** Ugyanaz a szerkezet, mint mindenhol
máshol a rendszerben: a kapu adatból nyílik, és a hiányzó döntés nem „igen”. A
három küszöb a nyilvántartásban `null` — klinikai és statisztikai döntés, nem
fejlesztési.

### A sáv Wilson-féle, nem normál közelítés

A tankönyvi *p ± z·√(p(1−p)/n)* éppen ott omlik össze, ahol egy **induló**
audit-hurok dolgozni fog:

| Adat | Normál közelítés | Wilson |
|---|---|---|
| 3/3 | 100% ± 0 — „biztos” | 44–100% |
| 0/5 | **negatív** alsó határ | 0–43% |

---

## És a nevező, ami nem hígul

A kitöltetlen válasz **nem** kerül bele az eldönthetetlen-arányba sem. A
kitöltetlenség adatgyűjtési hiba, nem a referencia korlátja — ha a nevezőben
lenne, száz kitöltetlen eset elhígítaná az öt eldönthetetlent, és a kapu
átengedne egy számot, aminek épp az eldönthetetlensége a problémája.

---

## Ahol ma tartunk

`Audit-hurok: 3/3 mező bekötve, 0/3 pár közölhető (0 eset, 3 küszöb hiányzik)`

**Nincs egyetlen eset sem**, és ez nem ennek a lépésnek a hiánya: az esetek a
**16. lépésből** jönnének, a pilot pedig nem indulhat el. A hurok szerkezete
készen áll és be van kötve; ami hiányzik, az egy osztály, egy vezető, aki
vállalja, és a három küszöb megnevezése.

---

## Ami elkészült

| | |
|---|---|
| `registry/variables/15-utankovetes.json` | 3 új, négyértékű változó |
| `registry/felulet/*.json` | a három `outcomeAudit` mező **bekötve** |
| `registry/audit/hurok.json` | 3 pár, 3 küszöb (mind `null`) |
| `core/audit/hurok.ts` | besorolás, összevetés, Wilson-sáv, a közölhetőség kapuja |
| `tools/gen-audit.ts` | `npm run audit` → [`../megfeleles/16-audit-hurok.md`](../megfeleles/16-audit-hurok.md) |
| `test/audit.test.ts` | 17 teszt |

Munkalap: [`../megfeleles/16-audit-hurok.md`](../megfeleles/16-audit-hurok.md).
