# Munkalap — az audit-hurok

*Generált: `npm run audit`. 3 pár, 3/3 audit-mező bekötve · 0 vizsgált eset · 0/3 pár közölhető · 3 küszöb hiányzik.*

## Amiért ez a lépés a rendszer legfontosabb köre

Minden normogram, minden kockázati szám és minden modell **csak addig ér
valamit, amíg valaki elhiszi** — hacsak vissza nem mérjük ebben az
intézményben, ezen a populáción. Ez a hurok az a szerkezet, amitől a rendszer
meg tudja tudni magáról, hogy jó-e.

## 1. Amit ez a lépés talált

**A három audit-mezőnek nem volt hova írnia.** Mind ott állt a
felülettérképen, `outcomeAudit` jelöléssel, saját kapuval, saját döntési
szabállyal és hosszú indoklással — és mind a háromban `variable: null`.
A rendszer legfontosabb köre olyan mezőkből állt, amelyeknek nem volt
változójuk: a válasz, amit a klinikus beleír, sehol nem maradt volna meg.
A 17. lépés „Kész, ha”-ja **számot** kér, és számot nem lehet olyan mezőből
számolni, ami nem létezik.

| Mező | Űrlap | Változó |
|---|---|---|
| A prenatális diagnózis megerősítve? (igen · …) | `form.kimenetelGyermek` | `audit.prenatal.confirmed` |
| Műtét utáni diagnózis megerősítve (Endometriosis · …) | `gyn.form.kimenetel` | `audit.postop.confirmed` |
| UH diagnózis megerősítve (igen · …) | `gyn.form.kimenetel` | `audit.us.confirmed` |

## 2. Négy válasz, nem kettő

A *„megerősítve? igen/nem”* kérdés a **cáfolatot** és az
**eldönthetetlenséget** ugyanabba a rekeszbe teszi. Az egyik azt jelenti, hogy
a rendszer tévedett; a másik azt, hogy a **referencia** nem tudott
válaszolni.

A felülettérkép saját jegyzete mondja ki, hogy a felületes endometriosis
szövettani igazolása megbízhatatlan — vagyis minden ilyen eset „tévedés”-ként
állna be, és az ultrahang **rendszeresen rosszabbnak látszana**, mint amilyen.

| Kód | Mit jelent | A nevezőben? |
|---|---|---|
| `confirmed` | a referencia ugyanazt mondta | igen |
| `refuted` | a referencia mást mondott — a rendszer tévedett | igen |
| `indeterminate` | a referencia **nem tudott dönteni** | nem |
| `noReference` | nem történt referenciavizsgálat | nem |
| *(hiányzik)* | senki nem töltötte ki | nem |

Az utolsónak nincs kódja, és ez szándékos: **a hiányzó adat sehol nem „nem”.**

Egy példa a különbségre. 6 egyezés, 2 eltérés, 4 eldönthetetlen:

- helyesen: **6/8 = 75%**
- az eldönthetetleneket cáfolatnak véve: **6/12 = 50%**

Ugyanaz az adat, ugyanaz a rendszer, huszonöt százalékpont különbség.

## 3. A három pár

| Pár | Az állítás | Az igazság | Mit mér vissza |
|---|---|---|---|
| **Prenatális diagnózis ↔ postnatalis igazság** | A méhen belül kimondott diagnózis | Az újszülöttön megállapított diagnózis (vizsgálat, képalkotás, genetika, boncolás) | `normogram`, `kockazat` |
| **Ultrahangos megítélés ↔ műtéti/szövettani lelet** | Az ultrahangos diagnózis | A műtéti lelet, illetve a szövettan | `calc.iota.adnex`, `calc.rmi`, `calc.pul` |
| **Műtét közben látott kép ↔ szövettan** | A műtét utáni diagnózis | A szövettani lelet | — |

**Prenatális diagnózis ↔ postnatalis igazság.** A referencia maga is lehet MÁSODKÉZBŐL való („információ a kezelőorvostól”). Hallomásból tudott kimenetelre modellt validálni nem lehet.

**Ultrahangos megítélés ↔ műtéti/szövettani lelet.** Ez a pár méri vissza az IOTA-, az RMI- és a PUL-modell teljesítményét EBBEN az intézményben.

**Műtét közben látott kép ↔ szövettan.** A felületes endometriosis szövettani igazolása megbízhatatlan: itt az „eldönthetetlen” NEM ritka kivétel, hanem várható kimenet. Cáfolatként számolva az ultrahang és a sebész rosszabbnak látszana, mint amilyen.

## 4. Mikortól szabad számot mondani

Egy háromesetes mintából számolt 67%-os találati arány **rosszabb, mint
semmi**: úgy néz ki, mint egy mérés, és nem az. A hurok ezért soha nem ad ki
puszta arányt — mindig konfidenciaintervallummal, és csak akkor, ha mindhárom
küszöb engedi.

| Küszöb | Mit dönt el | Ma |
|---|---|---|
| `minimumEset` | hány értékelhető eset alatt nem közlünk arányt | **nincs megnevezve** |
| `maxBizonytalanSav` | milyen széles sáv fogadható el | **nincs megnevezve** |
| `maxEldonthetetlenArany` | mennyi eldönthetetlen fér bele | **nincs megnevezve** |

**A hiányzó küszöb nem engedékenység: a kapu zárva marad.** Ma a hurok 100/100
egyezés mellett sem adna ki számot — ugyanaz a szerkezet, mint a rendszer
többi kapujánál.

A sáv **Wilson-féle pontszám-intervallum**, nem a tankönyvi normál közelítés.
Az utóbbi éppen ott omlik össze, ahol egy induló audit-hurok dolgozni fog:

| Adat | Normál közelítés | Wilson |
|---|---|---|
| 3/3 | 100% ± 0 — „biztos” | 44%–100% |
| 0/5 | 0% ± … — **negatív** alsó határ | 0%–43% |

## 5. Ahol ma tartunk

| Pár | Vizsgált eset | Értékelhető | Állapot |
|---|---|---|---|
| Prenatális diagnózis ↔ postnatalis igazság | 0 | 0 | kuszobNelkul |
| Ultrahangos megítélés ↔ műtéti/szövettani lelet | 0 | 0 | kuszobNelkul |
| Műtét közben látott kép ↔ szövettan | 0 | 0 | kuszobNelkul |

**Nincs egyetlen eset sem**, és ez nem ennek a lépésnek a hiánya: az esetek a
**16. lépésből** jönnének, a pilot pedig nem indulhat el. A hurok szerkezete
készen áll és be van kötve; ami hiányzik hozzá, az egy osztály, egy vezető,
aki vállalja, és a három küszöb megnevezése.
