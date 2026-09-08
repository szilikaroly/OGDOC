# 16 — Kétszáz fejlesztési javaslat, modulonként

*Nem ötletlista. Minden pont mögött ott van, MI HIÁNYZIK MA, és MIT OLD MEG —
és ahol a rendszer már tud valamit, azt nem soroljuk fel újra.*

**Hogyan olvasd.** A pontok nem egyenrangúak, és nem is sorrendben végzendők:
a végrehajtás sorrendjét a [`13-18-lepes.md`](13-18-lepes.md) adja. Ez a lista
azt mondja meg, **mi tenné jobbá az adott modult** — a jelölés a súlyt mutatja:

- ⬛ **betegbiztonsági** — hiánya kárt okozhat
- ◼ **klinikai érték** — a napi munkát javítja
- ◻ **kényelem / hatékonyság**

---

## 1. Panaszok (1–8)

1. ⬛ **Vörös zászló időablakkal.** A „mellkasi fájdalom" 20 perce és 3 napja két külön sürgősség; ma a szótár nem különbözteti meg.
2. ◼ **Panaszpárok felismerése.** Fejfájás + látászavar + felhasi fájdalom terhesben együtt praeeclampsia-gyanú — külön-külön egyik sem az.
3. ◼ **A panasz lefolyása** (állandó · hullámzó · romló) mint önálló jellemző: a romló panasz más döntés, mint az azonos súlyú állandó.
4. ◻ **Szinonimatanulás az „egyéb"-ből.** Ami havonta ötször beírásra kerül szabad szövegként, javaslatként kerüljön a szótárba — de emberi jóváhagyással.
5. ◼ **Beteg által rögzített panasz** időbélyeggel, a rendelés előtt. A `patient` proveniencia már létezik hozzá.
6. ◻ **Panaszsúlyosság-idősor** grafikonon, több vizit között.
7. ⬛ **A tagadott panasz rögzítése.** „Nincs magzatmozgás-csökkenés" ma nem különbözik attól, hogy nem kérdeztük.
8. ◻ Panaszszótár-lefedettség mérése: hány szabad szöveges bejegyzés maradt kódolatlan.

## 2. Orvoshoz fordulás oka (9–13)

9. ◼ **A beutaló kérdésének megőrzése végig.** A zárójelentés arra válaszoljon, amit kérdeztek — ma a kettő nincs összekötve.
10. ◼ **Beutaló-kód → indikáció leképezés**, hogy a finanszírozási indikáció ne külön bevitel legyen.
11. ◻ Ismételt megjelenés felismerése: ugyanaz a panasz 30 napon belül harmadszor.
12. ⬛ **Sürgősségi triázs-kapu**: ha az ok maga vörös zászló, a rendszer ne engedje a rutin útvonalra.
13. ◻ Önbeutalás vs. beutalt vs. szűrésről behívott — külön útvonal, külön mérőszám.

## 3. Anamnézis (14–24)

14. ⬛ **Az EESZT-rizikókód levezetése a saját anamnézisből.** `hx.repro.prevBirth.preterm` → `hx.eeszt.prevPreterm`: ma két helyen kell beírni ugyanazt.
15. ⬛ **Gyógyszerallergia mint kapu**, ne mezőként: a reakció természete (kiütés vs. anafilaxia) dönti el, adható-e valaha újra.
16. ◼ **Családfa vizuálisan**, három generációra, a genetikai modul bemeneteként.
17. ◼ **Az anamnézis „utoljára megkérdezve" bélyege**: a hároméves anamnézis nem hiányzik, de nem is friss.
18. ◼ **Öröklődő daganatkockázat bemenetei**: rokonsági fok + diagnóziskori életkor + oldaliság, nem puszta létszám.
19. ◻ Anamnézis-átvétel az előző terhességből, javaslatként (nem másolásként).
20. ⬛ **Korábbi császármetszés típusa** (harántmetszés vs. klasszikus): a VBAC-döntés ezen áll, és a „volt császár" önmagában kevés.
21. ◼ Dohányzás csomagévben, levezetve — ne külön beírt szám.
22. ◻ Anamnézis-kitöltés beteg által, otthonról, a vizit előtt.
23. ◼ **A „nem tudom" mint válasz** minden anamnesztikus tételnél — ma több helyen csak igen/nem van.
24. ◻ Nyelvi változatok: ugyanaz a kérdéssor a beteg nyelvén.

## 4. Státusz (25–36)

25. ⬛ **A vitálisok idősora, nem pillanatképe.** Egy 150/95 önmagában más, mint a harmadik egymást követő emelkedő érték.
26. ⬛ **Automatikus MEOWS-számítás** minden vitálrögzítésnél, és a küszöb átlépésénél riasztás — címzettel.
27. ◼ **Bal-jobb szimmetria mint levezetés** (vérnyomás, ödéma, reflexek).
28. ◼ A státusz **átvétele az előző vizsgálatból**, változásjelöléssel — mi változott, nem mi van.
29. ◻ Fényképmelléklet a bőrleletekhez, méretskálával.
30. ⬛ **A „nem vizsgálható" külön teendőt generáljon**: ma rögzül, de nem szül feladatot.
31. ◼ Testsúly-trend a terhesség alatt, az IOM-sávval együtt.
32. ◼ **Ödéma súlyossága kódoltan**, nem szabad szövegben — a praeeclampsia-értékelés bemenete.
33. ◻ Vizsgálati sorrend testre szabása felhasználónként (a lelet szerkezete nem változik).
34. ⬛ **Vérnyomásmérés körülménye**: kar, mandzsettaméret, testhelyzet. Rossz mandzsettával mért érték rendszeresen téved.
35. ◼ Magasság egyszeri rögzítése és zárolása — a terhesség alatt nem változik.
36. ◻ Gyorsbevitel: a leggyakoribb hét mező egy képernyőn.

## 5. Vizsgálatok (37–52)

37. ⬛ **Kritikus laborérték-riasztás** címzettel és átvételi nyugtával — a `core/log/` szerkezete készen áll rá.
38. ⬛ **Delta-check**: a hirtelen, nagy változás gyakran mintacsere, nem klinikai romlás.
39. ⬛ **A 30 laborreferencia hitelesítése** `assumed` → `primary` (a 18 lépés 6.).
40. ◼ **Trend-nézet analitonként**, a trimeszter-referenciával együtt.
41. ◼ **Reflex-vizsgálatok**: emelkedett AFP → AChE automatikus javaslata.
42. ◼ A **mintavétel körülményei** (éhgyomri, ciklusnap, gyógyszerbevétel óta eltelt idő) az értékkel EGYÜTT.
43. ⬛ **A ciklusnap kötelező** endokrin megrendelésnél — enélkül az eredmény nem értelmezhető.
44. ◻ Laborcsomagok kibontva: a „profil" a rekordba tételesen kerüljön, ne csomagnévként.
45. ◼ **A korábbi lelet melletti megjelenítés** — mihez képest változott.
46. ◻ Külső laboreredmény kézi rögzítése, `imported` provenienciával, forrásmegnevezéssel.
47. ⬛ **A kintlévő lelet listája** vizitenként: mit rendeltünk, mi jött vissza.
48. ◼ Ultrahang: **az összes mérés egy képernyőn**, percentilissel, nem lapozva.
49. ◼ **A mérési konvenció rögzítése** (külső-külső vs. külső-belső BPD) — a normogram enélkül félrevezet.
50. ◻ Képek automatikus beemelése a leletbe a DICOM-ból.
51. ⬛ **A normogramok hitelesítése** — ma egyik sem ad percentilist (a 18 lépés 7.).
52. ◼ Ismételt mérés átlagolása, ahol a protokoll ezt kéri (pl. NT).

## 6. Gyógyszerelés (53–66)

53. ⬛ **Kölcsönhatás-ellenőrzés** a teljes listára, nem szerenként.
54. ⬛ **Terhességi és szoptatási kategória** minden szernél, forrásmegnevezéssel.
55. ⬛ **Vesefunkció szerinti dózis** — a CKD-EPI ma kapu mögött van, ez a 8. lépés.
56. ◼ **PUPHA-törzs betöltése**: ma nincs hivatalos gyógyszertörzs.
57. ⬛ **A kontraindikáció-kapu kiterjesztése** mind a 23 hatóanyagra (ma 9-en van).
58. ◼ Adagolási séma időpontokkal, nem szövegesen („3×1").
59. ◻ Gyógyszerelési előzmény idővonalon, a terhességi héttel.
60. ⬛ **A leállított szer külön állapot**, nem törlés: mikor és miért hagyta abba.
61. ◼ **Otthoni gyógyszerek egyeztetése** felvételkor és elbocsátáskor (medication reconciliation).
62. ◻ Recept-előkészítés, a rendszer által ismert adagolással.
63. ⬛ **Az anti-D beadásának nyomon követése** vérkészítmény-tételszámmal (a 18 lépés szempontjából is).
64. ◼ Antibiotikum-választó a helyi rezisztenciaadatok szerint.
65. ◻ Beteg-tájékoztató a szerről, a beteg nyelvén.
66. ⬛ **A dózis egység nélkül nem rögzíthető** — ez már szabály; kiterjesztendő a külső forrásból érkezőre is.

## 7. Diéta (67–71)

67. ◼ Diétás protokoll összekötése a diagnózissal (GDM, PKU, bariátriai előzmény).
68. ◻ Bevásárlólista és mintaétrend generálása a protokollból.
69. ◼ **Allergia és diéta ütközésének kiszűrése.**
70. ◻ Dietetikus-konzílium automatikus javaslata küszöbérték felett.
71. ◼ A diéta betartásának követése beteg-bejegyzésből.

## 8. Pszichológia (72–79)

72. ⬛ **A validált kérdőívek licencelése** — ma tízből kilencnél hiányzik (a 18 lépés 12.).
73. ⬛ **Az öngyilkossági tétel külön kezelése**: az EPDS 10. kérdése nem összegzésre való, hanem azonnali útvonalra.
74. ◼ Kérdőív-ismétlés ütemezetten, a szülés utáni 6. hétig.
75. ◼ **A beteg válaszát a klinikus nem írhatja felül** — ez már szabály, de a felületen is látszódnia kell.
76. ◻ Kérdőívkitöltés otthonról, biztonságos linken.
77. ◼ Partner bevonása, külön kérdőívvel.
78. ⬛ **Krízisútvonal**: kihez fordul a beteg éjszaka — ez nem szöveg, hanem elérhetőség.
79. ◻ Korábbi pszichiátriai kezelés összekötése a gyógyszerlistával.

## 9. Epikrízis (80–85)

80. ◼ **A hiány-szakasz rangsorolása**: ne tizennyolc soros felsorolás, hanem a három legfontosabb.
81. ◼ Az epikrízis **változásainak követése** verziónként.
82. ⬛ **Az aláírás előtti ellenőrzőlista**: mi hiányzik még a dokumentumból.
83. ◻ Sablonok szakterületenként, a regiszterből generálva.
84. ◼ **Kimenő diagnózisok BNO-kódolása** az epikrízisből, nem külön lépésben.
85. ◻ Diktálás szövegre, a strukturált mezők kitöltésével.

## 10. Szülőszoba (86–99)

86. ⬛ **A partogram automatikus kitöltése** a rögzített vizsgálatokból.
87. ⬛ **A CTG gépi olvasata a vizuális MELLETT** — soha nem helyette (ez már elv, de a felület nem mutatja).
88. ⬛ **A szepszisküszöbök hitelesítése** és a riasztás címzettje (a 18 lépés 9. és 15.).
89. ⬛ **A CMQCC vérzési stádium hitelesítése** — ma kapu mögött.
90. ◼ **A vajúdás idősora egy képernyőn**: vitálisok, CTG-értékelés, vizsgálatok, gyógyszerek.
91. ⬛ **A kumulatív vérveszteség mérve, nem becsülve** — a becslés rendszeresen alábecsül.
92. ◼ Csapatriasztás egy gombbal, névsorral: ki jön, mikor ért oda.
93. ◼ **A magzati szívfrekvencia és a vajúdás összevetése** időben.
94. ◻ A szülés utáni első 2 óra külön követési sávja.
95. ⬛ **Az oxytocin-készítmény kiválasztása kapun át** (Syntometrine + hypertonia = ellenjavallat).
96. ◼ Az anyai és a magzati idősor **egy időtengelyen**.
97. ◻ Hangalapú rögzítés a szülőszobán, kéz nélkül.
98. ⬛ **A köldökzsinór-pH mindkét érből** — egyetlen érték az ér megnevezése nélkül nem értelmezhető.
99. ◼ **A szülés utáni átadás** strukturáltan: mi történt, mi van hátra.

## 11. Műtő (100–108)

100. ⬛ **A WHO-ellenőrzőlista három szakasza** háromállapotú tételekkel (igen · nem · nem ellenőrizve).
101. ⬛ **A kenet- és eszközszámolás két ember egyeztetésével**, időponttal — nem egy jelölőnégyzettel.
102. ◼ **A konverzió (laparoszkópia → laparotómia) egyetlen mezőben**, ne hét helyen.
103. ◼ Műtéti idő szakaszonként: bevezetés, metszés, zárás.
104. ⬛ **A visszamaradt eszköz gyanújának útvonala**: mit kell tenni, ha a szám nem stimmel.
105. ◼ Implantátumok nyomon követése egyedi eszközazonosítóval (UDI).
106. ◻ Műtéti leírás sablonból, a rögzített adatokból.
107. ⬛ **A szövettanra küldött minta kintlévősége** — a „szövettanra vár" ma szabad szöveg.
108. ◼ Szövődmények Clavien–Dindo szerint, verziómegnevezéssel.

## 12. Onkológia (109–116)

109. ⬛ **Az MDT-döntés önálló, dátumozott esemény**, résztvevőkkel és indoklással.
110. ◼ **A FIGO-stádium verziójának rögzítése** — a méhtestrák beosztása 2023-ban lényegesen változott.
111. ◼ Kezelési vonal és ciklusszám strukturáltan, nem szabad szövegben.
112. ⬛ **Termékenységmegőrzés felajánlása** mint kötelező döntési pont fogamzóképes korban.
113. ◼ Kumulatív dózis követése (antraciklin, platina).
114. ◻ Klinikai vizsgálatba való bevonhatóság automatikus jelzése.
115. ⬛ **A terhesség alatti onkológiai kezelés** külön útvonala, a magzati kockázat kimondásával.
116. ◼ Az onkoteam-döntés és a tényleges kezelés eltérésének mérése.

## 13. Ellátás tervezése (117–123)

117. ◼ **Az elmulasztott vizit felismerése** — ma a gondozási alaptábla `assumed` szintű, tehát erre nem használható.
118. ◼ A terv és a valóság összevetése: mit terveztünk, mi történt.
119. ◻ Automatikus időpontajánlás a protokoll szerint.
120. ⬛ **A magas kockázatú beteg sűrűbb terve** automatikusan, a score-okból.
121. ◼ A beteg saját naptára, emlékeztetővel.
122. ◻ Csoportos gondozás (group antenatal care) támogatása.
123. ◼ **A terv indoklása**: miért ez a gyakoriság ennél a betegnél.

## 14. Zárójelentés (124–130)

124. ⬛ **A hitelességi kapu** — ma mindenkinél zárva; ez a `21` fejezet kérdése.
125. ◼ **Az üres rubrika néma állítás**: a hiány kimondva jelenjen meg.
126. ◼ Gyógyszer-egyeztetés a zárójelentésben: mi változott a felvételihez képest.
127. ⬛ **A háziorvosnak szóló teendők** külön, számozva, határidővel.
128. ◻ A beteg nyelvén írt változat, párhuzamosan.
129. ◼ **A kintlévő leletek felsorolása** a zárójelentésben — ki fogja megnézni, mikor.
130. ◻ Elektronikus továbbítás a háziorvosnak, nyugtával.

## 15. Utánkövetés (131–137)

131. ⬛ **A kimeneteli adat provenienciája** — ami a kezelőorvos elmondásából származik, nem ugyanaz, mint a zárójelentésből.
132. ⬛ **Az audit-hurok bekapcsolása** (a 18 lépés 17.): visszaigazolta-e a szövettan az ultrahangot.
133. ◼ **A nevező rögzítése**: hány beteget kellett volna követni, nem hányat követtünk.
134. ◼ Automatikus emlékeztető a 6 hetes és 1 éves kontrollra.
135. ◻ Beteg által jelentett kimenetel, otthonról.
136. ⬛ **Az elveszett követés külön állapot**, nem hiányzó adat.
137. ◼ A követési idő mint mérőszám, nem a követett esetek száma.

## 16. Betegelégedettség (138–142)

138. ◼ Rövid, két kérdéses mérés minden vizit után — a hosszú kérdőívet nem töltik ki.
139. ⬛ **A negatív visszajelzés útvonala**: kihez jut el, mikor.
140. ◻ Szöveges visszajelzés kategorizálása.
141. ◼ **A várakozási idő mérése** a rendszerből, nem kérdőívből.
142. ◻ Osztályos és orvosonkénti bontás — csak összesítve, egyéni értékelés nélkül.

## 17. Kódolás (143–152)

143. ⬛ **A HBCS besorolási tábla betöltése** (a 18 lépés 2.) — ma csoportot nem tudunk megállapítani.
144. ⬛ **A BNO négy- és ötkarakteres alak** közötti választás ott, ahol több lehetőség van (ma nem választ helyettünk — ez helyes, de a felületnek kérdeznie kell).
145. ◼ **Kódajánlás a leletből**, nem külön kódolási lépésben.
146. ◼ Az elnyomási lánc indoklása a kódolónak.
147. ⬛ **A jelentési alak érvényessége az ellátás napján** — a kód ma is avul.
148. ◻ Kódolási hibák visszamérése a NEAK-visszajelzésből.
149. ◼ **A beavatkozási törzs megnevezése minden kódnál** (járóbeteg vs. fekvőbeteg — mindkettő ötjegyű).
150. ◻ Kódolói munkalista: mely esetek hiányosak.
151. ⬛ **A szülés kötelező kódolási tételei** — a `core/fekvo/szules.ts` ezt ellenőrzi, de a felület nem vezeti végig.
152. ◼ Archív HBCS-kiadás visszamenőleges elszámoláshoz (már megvan, felületre kell hozni).

## 18. Minőségbiztosítás (153–160)

153. ⬛ **A riasztások átvételének mérése** — hány riasztás ment ki, hányat vettek át.
154. ◼ **Az elfogadási kritériumok futtatása CI-ben** — ma nincs CI-workflow a repóban.
155. ◼ Indikátorok a rendszerből, nem külön adatgyűjtésből.
156. ⬛ **A kapu megkerüléseinek naplózása**: hányszor indokolták meg a hard-stop átlépését, és mivel.
157. ◼ Az adatteljesség mérése mezőnként, nem összesítve.
158. ◻ Havi minőségi jelentés generálva.
159. ⬛ **A nem kívánt esemény bejelentése** a rendszerből, az esethez kötve.
160. ◼ A szabad szöveg arányának mérése — a 11. fejezet célja 10% alatt.

## 19. CRM és üzemeltetés (161–168)

161. ◼ Beosztás és műtőprogram összekötése az esetekkel.
162. ◻ Automatikus SMS/e-mail emlékeztető, a beteg választott csatornáján.
163. ⬛ **A genetikai lelet NEM megy e-mailben PDF-ként** — a forrásrendszer ezt teszi; nálunk kapu.
164. ◼ Az orvos munkaterhelésének mérése esetszámban és időben.
165. ◻ Eszközkarbantartás nyilvántartása (az ultrahangkészülék kalibrációja a leletet érinti).
166. ◼ **A vizsgálatot végző és a felügyelet párja** minden beavatkozásnál.
167. ◻ Helyettesítési rend: ki jár el, ha a kezelőorvos nem elérhető.
168. ⬛ **A jogosultság-összeférhetetlenség kikényszerítése** (`kutato` + `kodkulcs_kezelo`).

## 20. Statisztika és kutatás (169–176)

169. ⬛ **A `phi: true` mezők kizárása az exportból** — ez már szabály, de a lekérdezőben is látszódnia kell.
170. ◼ **Kohorsz-definíció mentése és újrafuttatása** — a reprodukálhatóság alapja.
171. ◼ **A lekérdezés futtatás előtt megmutatva** (a `26` modul elve: a modell a lekérdezést írja, nem a választ).
172. ⬛ **Kis elemszámú cella elrejtése** az exportban — az újraazonosítás legegyszerűbb útja.
173. ◼ ICHOM-export a meglévő leképezésből.
174. ◻ Adatszótár-export a kutatótársaknak.
175. ⬛ **A helyi normogram generálása** a saját populációból (a 18 lépés 18.).
176. ◼ **A hiányzó adat aránya minden kimutatásban** — a nevező nélkül a mutató hízeleg.

## 21. Foglalkozás-egészségügy (177–181)

177. ◼ Munkahelyi kockázat összekötése a terhességi tanáccsal.
178. ⬛ **A terhesség alatti munkavégzési korlátozás** dokumentálása, jogszabályi hivatkozással.
179. ◻ Munkáltatói igazolás generálása, orvosi adat nélkül.
180. ◼ Éjszakai műszak és terhesség: kockázati jelzés.
181. ◻ A SOS24 domének portolása (a modul kész, portolandó).

## 22. Biobank (182–186)

182. ⬛ **A minta beleegyezésének terjedelme** külön a leletétől — más a megőrzési idő, más a visszavonhatóság.
183. ⬛ **A tárolt minta státusza bármikor lekérdezhető** (a genetikai lap „Sejtek elmentve" mezője ma szabad szöveg).
184. ◼ Hőmérséklet-lánc és a fagyasztó riasztásának naplózása.
185. ◼ **A minta és a lelet összekötése** kétirányúan.
186. ◻ ISO 20387 dokumentumfa a rendszerből.

## 23. Genetika (187–192)

187. ⬛ **A VUS mint harmadik eredménykategória** végigvezetve — ma a forrásrendszerből ismert, nálunk még nincs.
188. ⬛ **A beleegyezés vizsgálatonként**, nem globálisan — és az anyai eredménynél tágabb körre.
189. ⬛ **A mellékleletek közlésének külön beleegyezése** (cfDNS Monosomy X: anyai lelet magzati címke alatt).
190. ◼ **Az ISCN-verzió rögzítése** a karyotípus mellett.
191. ◼ A CVS-eredmény és a lepényre korlátozott mozaicizmus megkülönböztetése.
192. ◻ Genetikai tanácsadás dokumentálása, a megbeszélt lehetőségekkel.

## 24. IVF (193–196)

193. ◼ **A donor petesejt életkora** a kockázatszámításban — nem a várandósé.
194. ◼ A ciklus és a terhesség összekötése, epizódok között.
195. ⬛ **A fogamzás módja mint a cfDNS-értelmezés bemenete.**
196. ◻ Embriótranszfer-adatok strukturáltan.

## 25. Admin (197–198)

197. ⬛ **Az első adminisztrátor meghívó-alapú és auditált** — nincs önkiszolgáló bootstrap.
198. ◼ A belső szerkesztő: új változó felvétele kód nélkül, jóváhagyási sorral.

## 26. Előéleti import (199–200)

199. ⬛ **Az OCR bizonytalansága nem tűnhet el a kimeneten** — a javaslattár már ezt oldja meg, de a felületnek mutatnia kell.
200. ◼ **A beteg-oldali változat szabályozási határa** (MDR 11. szabály): a rendezés nem orvostechnikai eszköz, a javaslat az.

---

## Amit a lista megmutat

**69 pont ⬛ betegbiztonsági.** Nem azért, mert a rendszer rossz, hanem
mert ez a szakterület ilyen: a szülészetben a hiba ritka és súlyos, és
majdnem mindig ugyanazon a néhány ponton keletkezik — **hiányzó adat, ami
„nem"-nek látszik; riasztás, amire nincs válaszút; és lelet, amit senki nem
néz meg.**

**Sok pont nem hiányzó szabály, hanem NEM LÁTSZÓ szabály.** A mag ma több
szabályt tud, mint amennyit a felhasználó lát — a `phi` jelölés, a
proveniencia-precedencia, a kintlévőség, a beteg válaszának
felülírhatatlansága mind működik, csak a felületen nem jelenik meg. **Egy
szabály, ami nem látszik, nem véd** — a klinikus nem tud olyasmire
támaszkodni, amiről nem tudja, hogy létezik.

**A legtöbb pont nem új modult kíván, hanem összekötést.** A rendszer huszonhat
modulja külön-külön jól van megtervezve; ami hiányzik, az a közöttük futó
hivatkozás — az anamnézisből a rizikókód, a leletből a kód, a kimenetelből a
visszamérés.
