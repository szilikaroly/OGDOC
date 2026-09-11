# Fordítói munkalap — EN

Generált: `npm run forditas en`. **Ne ezt szerkeszd** — a fordítás a
`registry/variables/*.json` fájlok `label.en` és `label_en` mezőibe megy, és a
következő generálás innen eltűnik, ami elkészült.

| | Összes | Hiányzik | Kész |
|---|---:|---:|---:|
| Változócímke | 905 | **875** | 3.3% |
| Opciócímke | 2455 | **2451** | 0.2% |

A felület a klinikai szöveget **szándékosan nem fordítja gépileg**: a „Cervix hossza”
és a „Cervical length” között klinikus dönt, mert a fordítás a leleten jelenik meg.
Amíg a lefedettség 90% alatt van, a felület a célnyelvet **forrásnyelvi felületként**
jelöli, és minden lefordítatlan címke mellett ott a jelölés.

## Modulonként, a betegút sorrendjében

### Ellátási kontextus `ctx`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `ctx.breastfeeding` | Szoptat |  | Szoptat-e jelenleg a beteg. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `ctx.conception` | Fogamzás módja |  | Hogyan jött létre a terhesség. |
| ↳ `spontaneous` | Spontán |  | opció |
| ↳ `oi` | Ovuláció-indukció |  | opció |
| ↳ `iui` | IUI |  | opció |
| ↳ `ivf` | IVF |  | opció |
| ↳ `icsi` | ICSI |  | opció |
| ↳ `fet` | Fagyasztott embrió-transzfer (FET) |  | opció |
| ↳ `donor` | Donor ivarsejt vagy embrió |  | opció |
| `ctx.consentState` | Kutatási beleegyezés állapota |  | A tudományos és biobanki felhasználásra adott hozzájárulás állapota. |
| ↳ `none` | Nincs megkérdezve |  | opció |
| ↳ `declined` | Elutasította |  | opció |
| ↳ `partial` | Részleges — egyes pontokra |  | opció |
| ↳ `broad` | Széles körű beleegyezés |  | opció |
| ↳ `withdrawn` | Visszavonta |  | opció |
| `ctx.edd` | Várható szülési időpont |  | A Naegele-szabály szerinti várható szülési időpont. |
| `ctx.eduLevel` | Képzettségi szint |  | A felhasználó képzettségi szintje — a megjelenített magyarázatok részletességéhez. |
| ↳ `student` | Hallgató |  | opció |
| ↳ `resident` | Rezidens |  | opció |
| ↳ `specialist` | Szakorvos |  | opció |
| ↳ `professor` | Egyetemi oktató |  | opció |
| `ctx.encounter` | Ellátási esemény típusa |  | Milyen ellátási helyzetben történik a vizsgálat. |
| ↳ `ambulatory` | Ambuláns vizit |  | opció |
| ↳ `emergency` | Sürgősségi ellátás |  | opció |
| ↳ `elective.admission` | Tervezett felvétel |  | opció |
| ↳ `labour` | Szülőszoba, vajúdás |  | opció |
| ↳ `followup` | Kontroll |  | opció |
| ↳ `screening` | Szűrővizsgálat |  | opció |
| `ctx.gaSource` | A gesztációs kor forrása |  | Melyik forrásból számoltuk a terhességi kort. |
| ↳ `ivf.transfer` | IVF/FET transzfer dátuma és embriókor |  | opció |
| ↳ `crl` | Korai ultrahang CRL (8–13+6. hét) |  | opció |
| ↳ `lmp` | Utolsó menstruáció |  | opció |
| ↳ `late.biometry` | Késői UH-biometria — pontatlan |  | opció |
| ↳ `unknown` | Nem meghatározható |  | opció |
| `ctx.multiple` | Többes terhesség — chorionicitás és amnionicitás |  | Egyes vagy többes terhesség, a chorionicitás és amnionicitás szerint. |
| ↳ `no` | Egyes terhesség |  | opció |
| ↳ `dcda` | Ikerterhesség — DCDA (két lepény, két burok) |  | opció |
| ↳ `mcda` | Ikerterhesség — MCDA (egy lepény, két burok) |  | opció |
| ↳ `mcma` | Ikerterhesség — MCMA (egy lepény, egy burok) |  | opció |
| ↳ `higher` | Hármas vagy több |  | opció |
| `ctx.parity.gravida` | Gravida [1] |  | Az összes eddigi terhesség száma, a jelenlegit is beleértve. |
| `ctx.parity.para` | Para [1] |  | A 24. héten túl megszült terhességek száma. |
| `ctx.pathway` | Ellátási útvonal |  | Melyik gondozási úton halad a beteg. |
| ↳ `preconception` | Fogamzás előtti gondozás |  | opció |
| ↳ `pre-ivf` | IVF-előkészítés |  | opció |
| ↳ `prenatal` | Várandósgondozás |  | opció |
| ↳ `pregnancy.pathology` | Patológiás terhesség |  | opció |
| ↳ `gynecology` | Nőgyógyászat |  | opció |
| ↳ `postpartum` | Gyermekágy |  | opció |
| ↳ `oncology` | Onkológia |  | opció |
| `ctx.pregnant` | Terhes-e |  | Fennáll-e terhesség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudja |  | opció |
| `ctx.purpose` | A vizit célja |  | Miért jött a beteg. |
| ↳ `complaint` | Panasz kivizsgálása |  | opció |
| ↳ `care` | Gondozási vizit |  | opció |
| ↳ `procedure` | Beavatkozás |  | opció |
| ↳ `followup` | Utánkövetés |  | opció |
| ↳ `screening` | Szűrés |  | opció |
| ↳ `second` | Második vélemény |  | opció |
| `ctx.referral` | Beutalóval érkezett |  | Van-e érvényes beutaló. |
| `ctx.referralDx` | Beutaló diagnózisa |  | A beutalón szereplő diagnózis. |
| ↳ `O00` | Méhen kívüli terhesség |  | opció |
| ↳ `O14` | Praeeclampsia |  | opció |
| ↳ `O24` | Terhességi diabetes |  | opció |
| ↳ `N80` | Endometriosis |  | opció |
| ↳ `N92` | Rendellenes méhvérzés |  | opció |
| ↳ `Z34` | Normális terhesség felügyelete |  | opció |
| ↳ `egyeb` | Egyéb — a teljes törzsből választva |  | opció |
| `ctx.referralOrg` | Beutaló intézmény |  | A beutalót kiállító intézmény. |
| `ctx.role` | A rögzítő szerepe |  | Ki tölti ki az űrlapot. |
| ↳ `patient` | Beteg |  | opció |
| ↳ `midwife` | Szülésznő |  | opció |
| ↳ `resident` | Rezidens |  | opció |
| ↳ `specialist` | Szakorvos |  | opció |
| ↳ `researcher` | Kutató |  | opció |

### Lakcím `addr`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `addr.county` | Megye |  | A lakcím megyéje. |
| `addr.postcode` | Irányítószám |  | A beteg lakcímének irányítószáma. |
| `addr.settlement` | Település |  | A lakcím települése. |

### Panaszok `complaints`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `compl.active` | Aktív panaszok |  | A jelen ellátás során rögzített panaszok listája a panaszszótárból. |
| ↳ `compl.bleeding.amenorrhea.primary` | A menstruáció meg sem indult |  | opció |
| ↳ `compl.bleeding.amenorrhea.secondary` | Elmaradt menstruáció |  | opció |
| ↳ `compl.bleeding.heavy` | Erős menstruációs vérzés |  | opció |
| ↳ `compl.bleeding.intermenstrual` | Ciklusok közti vérzés |  | opció |
| ↳ `compl.bleeding.oligomenorrhea` | Ritka menstruáció |  | opció |
| ↳ `compl.bleeding.postcoital` | Közösülés utáni vérzés |  | opció |
| ↳ `compl.bleeding.postmenopausal` | Vérzés a változókor után |  | opció |
| ↳ `compl.bleeding.vaginal` | Hüvelyi vérzés terhességben |  | opció |
| ↳ `compl.breast.discharge` | Váladékozás az emlőbimbóból |  | opció |
| ↳ `compl.breast.lump` | Csomó az emlőben |  | opció |
| ↳ `compl.breast.pain` | Emlőfájdalom |  | opció |
| ↳ `compl.breast.skinChange` | Bőrelváltozás az emlőn |  | opció |
| ↳ `compl.discharge.increased` | Fokozott hüvelyi folyás |  | opció |
| ↳ `compl.discharge.malodorous` | Bűzös hüvelyi folyás |  | opció |
| ↳ `compl.edema.generalized` | Kiterjedt vizenyő |  | opció |
| ↳ `compl.fert.infertility` | Nem jön létre terhesség |  | opció |
| ↳ `compl.fert.recurrentLoss` | Ismétlődő terhességvesztés |  | opció |
| ↳ `compl.fetal.noMovement` | Nem érzett magzatmozgás |  | opció |
| ↳ `compl.fetal.reducedMovement` | Csökkent magzatmozgás |  | opció |
| ↳ `compl.gen.acne` | Pattanásosság |  | opció |
| ↳ `compl.gen.bloating` | Puffadás, haspuffadás |  | opció |
| ↳ `compl.gen.chestPain` | Mellkasi fájdalom |  | opció |
| ↳ `compl.gen.constipation` | Székrekedés |  | opció |
| ↳ `compl.gen.diarrhea` | Hasmenés |  | opció |
| ↳ `compl.gen.fatigue` | Fáradékonyság |  | opció |
| ↳ `compl.gen.fever` | Láz |  | opció |
| ↳ `compl.gen.hairLoss` | Hajhullás |  | opció |
| ↳ `compl.gen.headache` | Fejfájás |  | opció |
| ↳ `compl.gen.hirsutism` | Fokozott szőrnövekedés |  | opció |
| ↳ `compl.gen.legSwelling` | Egyoldali lábdagadás |  | opció |
| ↳ `compl.gen.nausea` | Hányinger |  | opció |
| ↳ `compl.gen.palpitations` | Szívdobogásérzés |  | opció |
| ↳ `compl.gen.rash` | Bőrkiütés |  | opció |
| ↳ `compl.gen.syncope` | Ájulás |  | opció |
| ↳ `compl.gen.visualDisturbance` | Látászavar |  | opció |
| ↳ `compl.gen.vomiting` | Hányás |  | opció |
| ↳ `compl.gen.weightGain` | Hízás |  | opció |
| ↳ `compl.gen.weightLoss` | Fogyás |  | opció |
| ↳ `compl.gyn.prolapse` | Kidomborodás érzése a hüvelyben |  | opció |
| ↳ `compl.meno.hotFlush` | Hőhullámok |  | opció |
| ↳ `compl.meno.vaginalDryness` | Hüvelyszárazság |  | opció |
| ↳ `compl.neuro.headache.visual` | Fejfájás látászavarral |  | opció |
| ↳ `compl.obs.backPain` | Deréktáji fájdalom terhességben |  | opció |
| ↳ `compl.obs.contractions` | Összehúzódások |  | opció |
| ↳ `compl.obs.dizziness` | Szédülés, ájulásérzés terhességben |  | opció |
| ↳ `compl.obs.fever` | Láz terhességben |  | opció |
| ↳ `compl.obs.fluidLeak` | Folyadékszivárgás, burokrepedés gyanúja |  | opció |
| ↳ `compl.obs.hyperemesis` | Makacs terhességi hányás |  | opció |
| ↳ `compl.obs.itching` | Viszketés terhességben |  | opció |
| ↳ `compl.obs.pelvicPressure` | Medencei nyomásérzés |  | opció |
| ↳ `compl.obs.seizure` | Görcsroham terhességben |  | opció |
| ↳ `compl.obs.trauma` | Hasi sérülés terhességben |  | opció |
| ↳ `compl.pain.abdomen.diffuse` | Kiterjedt hasi fájdalom |  | opció |
| ↳ `compl.pain.abdomen.llq` | Bal alhasi fájdalom |  | opció |
| ↳ `compl.pain.abdomen.rlq` | Jobb alhasi fájdalom |  | opció |
| ↳ `compl.pain.abdomen.suprapubic` | Szeméremcsont feletti fájdalom |  | opció |
| ↳ `compl.pain.chronicPelvic` | Krónikus kismedencei fájdalom |  | opció |
| ↳ `compl.pain.dysmenorrhea` | Menstruációs görcsök |  | opció |
| ↳ `compl.pain.dyspareunia.deep` | Mély közösülési fájdalom |  | opció |
| ↳ `compl.pain.dyspareunia.superficial` | Felszíni közösülési fájdalom |  | opció |
| ↳ `compl.pain.epigastric` | Epigasztriális fájdalom |  | opció |
| ↳ `compl.pain.flank` | Vesetáji fájdalom |  | opció |
| ↳ `compl.pp.bleeding` | Fokozott gyermekágyi vérzés |  | opció |
| ↳ `compl.pp.breastPain` | Emlőfájdalom szoptatás alatt |  | opció |
| ↳ `compl.pp.fever` | Gyermekágyi láz |  | opció |
| ↳ `compl.pp.mood` | Hangulatzavar a szülés után |  | opció |
| ↳ `compl.pp.urinaryRetention` | Vizelési képtelenség szülés után |  | opció |
| ↳ `compl.pp.woundPain` | Műtéti seb vagy gátseb fájdalma |  | opció |
| ↳ `compl.psy.anxiety` | Szorongás |  | opció |
| ↳ `compl.psy.depressedMood` | Nyomott hangulat |  | opció |
| ↳ `compl.psy.sleepDisturbance` | Alvászavar |  | opció |
| ↳ `compl.psy.suicidalThoughts` | Önbántó gondolatok |  | opció |
| ↳ `compl.psy.violence` | Bántalmazás |  | opció |
| ↳ `compl.resp.dyspnea` | Nehézlégzés |  | opció |
| ↳ `compl.uro.dysuria` | Fájdalmas vizelés |  | opció |
| ↳ `compl.uro.frequency` | Gyakori vizelés |  | opció |
| ↳ `compl.uro.incontinence.stress` | Vizeletvesztés terhelésre |  | opció |
| ↳ `compl.uro.incontinence.urge` | Vizeletvesztés sürgető inger mellett |  | opció |
| ↳ `compl.uro.retention` | Vizelési képtelenség |  | opció |
| ↳ `compl.vulva.itching` | Külső nemi szervek viszketése |  | opció |
| ↳ `compl.vulva.lump` | Csomó a külső nemi szerveken |  | opció |
| ↳ `compl.vulva.ulcer` | Fekély a külső nemi szerveken |  | opció |
| `compl.chief` | Vezető panasz |  | Az aktív panaszok közül az, ami miatt a beteg felkereste az ellátást. |
| ↳ `compl.bleeding.amenorrhea.primary` | A menstruáció meg sem indult |  | opció |
| ↳ `compl.bleeding.amenorrhea.secondary` | Elmaradt menstruáció |  | opció |
| ↳ `compl.bleeding.heavy` | Erős menstruációs vérzés |  | opció |
| ↳ `compl.bleeding.intermenstrual` | Ciklusok közti vérzés |  | opció |
| ↳ `compl.bleeding.oligomenorrhea` | Ritka menstruáció |  | opció |
| ↳ `compl.bleeding.postcoital` | Közösülés utáni vérzés |  | opció |
| ↳ `compl.bleeding.postmenopausal` | Vérzés a változókor után |  | opció |
| ↳ `compl.bleeding.vaginal` | Hüvelyi vérzés terhességben |  | opció |
| ↳ `compl.breast.discharge` | Váladékozás az emlőbimbóból |  | opció |
| ↳ `compl.breast.lump` | Csomó az emlőben |  | opció |
| ↳ `compl.breast.pain` | Emlőfájdalom |  | opció |
| ↳ `compl.breast.skinChange` | Bőrelváltozás az emlőn |  | opció |
| ↳ `compl.discharge.increased` | Fokozott hüvelyi folyás |  | opció |
| ↳ `compl.discharge.malodorous` | Bűzös hüvelyi folyás |  | opció |
| ↳ `compl.edema.generalized` | Kiterjedt vizenyő |  | opció |
| ↳ `compl.fert.infertility` | Nem jön létre terhesség |  | opció |
| ↳ `compl.fert.recurrentLoss` | Ismétlődő terhességvesztés |  | opció |
| ↳ `compl.fetal.noMovement` | Nem érzett magzatmozgás |  | opció |
| ↳ `compl.fetal.reducedMovement` | Csökkent magzatmozgás |  | opció |
| ↳ `compl.gen.acne` | Pattanásosság |  | opció |
| ↳ `compl.gen.bloating` | Puffadás, haspuffadás |  | opció |
| ↳ `compl.gen.chestPain` | Mellkasi fájdalom |  | opció |
| ↳ `compl.gen.constipation` | Székrekedés |  | opció |
| ↳ `compl.gen.diarrhea` | Hasmenés |  | opció |
| ↳ `compl.gen.fatigue` | Fáradékonyság |  | opció |
| ↳ `compl.gen.fever` | Láz |  | opció |
| ↳ `compl.gen.hairLoss` | Hajhullás |  | opció |
| ↳ `compl.gen.headache` | Fejfájás |  | opció |
| ↳ `compl.gen.hirsutism` | Fokozott szőrnövekedés |  | opció |
| ↳ `compl.gen.legSwelling` | Egyoldali lábdagadás |  | opció |
| ↳ `compl.gen.nausea` | Hányinger |  | opció |
| ↳ `compl.gen.palpitations` | Szívdobogásérzés |  | opció |
| ↳ `compl.gen.rash` | Bőrkiütés |  | opció |
| ↳ `compl.gen.syncope` | Ájulás |  | opció |
| ↳ `compl.gen.visualDisturbance` | Látászavar |  | opció |
| ↳ `compl.gen.vomiting` | Hányás |  | opció |
| ↳ `compl.gen.weightGain` | Hízás |  | opció |
| ↳ `compl.gen.weightLoss` | Fogyás |  | opció |
| ↳ `compl.gyn.prolapse` | Kidomborodás érzése a hüvelyben |  | opció |
| ↳ `compl.meno.hotFlush` | Hőhullámok |  | opció |
| ↳ `compl.meno.vaginalDryness` | Hüvelyszárazság |  | opció |
| ↳ `compl.neuro.headache.visual` | Fejfájás látászavarral |  | opció |
| ↳ `compl.obs.backPain` | Deréktáji fájdalom terhességben |  | opció |
| ↳ `compl.obs.contractions` | Összehúzódások |  | opció |
| ↳ `compl.obs.dizziness` | Szédülés, ájulásérzés terhességben |  | opció |
| ↳ `compl.obs.fever` | Láz terhességben |  | opció |
| ↳ `compl.obs.fluidLeak` | Folyadékszivárgás, burokrepedés gyanúja |  | opció |
| ↳ `compl.obs.hyperemesis` | Makacs terhességi hányás |  | opció |
| ↳ `compl.obs.itching` | Viszketés terhességben |  | opció |
| ↳ `compl.obs.pelvicPressure` | Medencei nyomásérzés |  | opció |
| ↳ `compl.obs.seizure` | Görcsroham terhességben |  | opció |
| ↳ `compl.obs.trauma` | Hasi sérülés terhességben |  | opció |
| ↳ `compl.pain.abdomen.diffuse` | Kiterjedt hasi fájdalom |  | opció |
| ↳ `compl.pain.abdomen.llq` | Bal alhasi fájdalom |  | opció |
| ↳ `compl.pain.abdomen.rlq` | Jobb alhasi fájdalom |  | opció |
| ↳ `compl.pain.abdomen.suprapubic` | Szeméremcsont feletti fájdalom |  | opció |
| ↳ `compl.pain.chronicPelvic` | Krónikus kismedencei fájdalom |  | opció |
| ↳ `compl.pain.dysmenorrhea` | Menstruációs görcsök |  | opció |
| ↳ `compl.pain.dyspareunia.deep` | Mély közösülési fájdalom |  | opció |
| ↳ `compl.pain.dyspareunia.superficial` | Felszíni közösülési fájdalom |  | opció |
| ↳ `compl.pain.epigastric` | Epigasztriális fájdalom |  | opció |
| ↳ `compl.pain.flank` | Vesetáji fájdalom |  | opció |
| ↳ `compl.pp.bleeding` | Fokozott gyermekágyi vérzés |  | opció |
| ↳ `compl.pp.breastPain` | Emlőfájdalom szoptatás alatt |  | opció |
| ↳ `compl.pp.fever` | Gyermekágyi láz |  | opció |
| ↳ `compl.pp.mood` | Hangulatzavar a szülés után |  | opció |
| ↳ `compl.pp.urinaryRetention` | Vizelési képtelenség szülés után |  | opció |
| ↳ `compl.pp.woundPain` | Műtéti seb vagy gátseb fájdalma |  | opció |
| ↳ `compl.psy.anxiety` | Szorongás |  | opció |
| ↳ `compl.psy.depressedMood` | Nyomott hangulat |  | opció |
| ↳ `compl.psy.sleepDisturbance` | Alvászavar |  | opció |
| ↳ `compl.psy.suicidalThoughts` | Önbántó gondolatok |  | opció |
| ↳ `compl.psy.violence` | Bántalmazás |  | opció |
| ↳ `compl.resp.dyspnea` | Nehézlégzés |  | opció |
| ↳ `compl.uro.dysuria` | Fájdalmas vizelés |  | opció |
| ↳ `compl.uro.frequency` | Gyakori vizelés |  | opció |
| ↳ `compl.uro.incontinence.stress` | Vizeletvesztés terhelésre |  | opció |
| ↳ `compl.uro.incontinence.urge` | Vizeletvesztés sürgető inger mellett |  | opció |
| ↳ `compl.uro.retention` | Vizelési képtelenség |  | opció |
| ↳ `compl.vulva.itching` | Külső nemi szervek viszketése |  | opció |
| ↳ `compl.vulva.lump` | Csomó a külső nemi szerveken |  | opció |
| ↳ `compl.vulva.ulcer` | Fekély a külső nemi szerveken |  | opció |
| `compl.q.course` | Alakulás a kezdet óta |  | Javult, változatlan vagy romlik a panasz. |
| ↳ `improving` | Javul |  | opció |
| ↳ `stable` | Változatlan |  | opció |
| ↳ `worsening` | Romlik |  | opció |
| ↳ `fluctuating` | Változó |  | opció |
| `compl.q.firstEpisode` | Első alkalom |  | Volt-e már korábban ilyen panasza. |
| ↳ `pos` | Igen, ez az első |  | opció |
| ↳ `neg` | Nem, volt már ilyen |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `compl.q.impact` | Hatása a napi életre |  | Mennyire akadályozza a panasz a mindennapokban. |
| ↳ `none` | Nem akadályozza |  | opció |
| ↳ `mild` | Enyhén — mindent meg tud csinálni |  | opció |
| ↳ `moderate` | Korlátozza a szokásos tevékenységben |  | opció |
| ↳ `severe` | Munkaképtelen, ágyhoz kötött |  | opció |
| `compl.q.onset` | Kezdet időpontja |  | Mikor kezdődött ez a panasz. |
| `compl.q.onsetType` | Kezdet jellege |  | Hogyan indult a panasz. |
| ↳ `sudden` | Hirtelen, percek alatt |  | opció |
| ↳ `acute` | Gyorsan, órák alatt |  | opció |
| ↳ `gradual` | Fokozatosan, napok alatt |  | opció |
| ↳ `recurrent` | Ismétlődően, korábban is volt |  | opció |
| ↳ `unknown` | Nem tudja megmondani |  | opció |
| `compl.q.provoke` | Mi váltja ki vagy erősíti |  | Mitől lesz rosszabb a panasz. |
| ↳ `movement` | Mozgás |  | opció |
| ↳ `food` | Étkezés |  | opció |
| ↳ `empty` | Éhgyomor |  | opció |
| ↳ `urination` | Vizelés |  | opció |
| ↳ `defecation` | Székletürítés |  | opció |
| ↳ `intercourse` | Közösülés |  | opció |
| ↳ `menses` | Menstruáció |  | opció |
| ↳ `stress` | Feszültség, stressz |  | opció |
| ↳ `position` | Testhelyzet-változtatás |  | opció |
| ↳ `breathing` | Mély belégzés |  | opció |
| ↳ `nothing` | Semmi, folyamatosan fennáll |  | opció |
| `compl.q.quality` | A panasz jellege |  | Milyen jellegű a panasz. |
| ↳ `sharp` | Szúró, éles |  | opció |
| ↳ `burning` | Égő |  | opció |
| ↳ `cramping` | Görcsös |  | opció |
| ↳ `dull` | Tompa, sajgó |  | opció |
| ↳ `pressure` | Nyomó, szorító |  | opció |
| ↳ `tearing` | Hasító |  | opció |
| ↳ `colicky` | Kólikás, hullámzó |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `compl.q.radiation` | Sugárzás |  | Hova sugárzik ki a panasz. |
| ↳ `none` | Nem sugárzik |  | opció |
| ↳ `back` | Hátba |  | opció |
| ↳ `shoulder` | Vállba |  | opció |
| ↳ `groin` | Lágyékba, combba |  | opció |
| ↳ `chest` | Mellkasba |  | opció |
| ↳ `jaw` | Állkapocsba |  | opció |
| ↳ `arm` | Karba |  | opció |
| ↳ `perineum` | Gátra, végbél felé |  | opció |
| `compl.q.relieve` | Mi enyhíti |  | Mitől lesz jobb a panasz. |
| ↳ `rest` | Pihenés |  | opció |
| ↳ `position` | Bizonyos testhelyzet |  | opció |
| ↳ `heat` | Meleg |  | opció |
| ↳ `analgesic` | Fájdalomcsillapító |  | opció |
| ↳ `food` | Étkezés |  | opció |
| ↳ `defecation` | Székletürítés |  | opció |
| ↳ `nothing` | Semmi |  | opció |
| `compl.q.severity` | Erősség (0–10) [1] |  | A panasz erőssége a beteg saját megítélése szerint, nullától tízig. |
| `compl.q.timing` | Időbeli lefolyás |  | Hogyan alakul a panasz az idő során. |
| ↳ `constant` | Állandó |  | opció |
| ↳ `intermittent` | Jön-megy |  | opció |
| ↳ `wavelike` | Hullámzó, rohamokban |  | opció |
| ↳ `cyclic` | A ciklushoz kötött |  | opció |
| ↳ `nocturnal` | Éjszaka rosszabb |  | opció |
| `compl.verbatim` | A beteg saját szavai |  | A panasz szó szerinti, szerkesztetlen megfogalmazása, ahogyan a beteg elmondta. |

### Allergia `allergy`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `allergy.asked` | Az allergiát megkérdezték |  | Feltették-e a kérdést. `pos` = megkérdezték, `neg` = nem kérdezték meg, `unk` = a beteg nem tudja. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `allergy.list` | Ismert allergiák |  | AZ EGYETLEN ALLERGIA-ENTITÁS. Minden réteg — gyógyszerrendelés, műtői ellenőrzőlista, diéta — ezt nézi. |
| ↳ `allergen.penicillin` | Penicillin és származékai |  | opció |
| ↳ `allergen.cephalosporin` | Cefalosporin |  | opció |
| ↳ `allergen.sulfonamid` | Szulfonamid |  | opció |
| ↳ `allergen.nsaid` | Nem szteroid gyulladáscsökkentő (NSAID) |  | opció |
| ↳ `allergen.opioid` | Opioid |  | opció |
| ↳ `allergen.helyiErzestelenito` | Helyi érzéstelenítő |  | opció |
| ↳ `allergen.latex` | Latex |  | opció |
| ↳ `allergen.jodKontraszt` | Jódos kontrasztanyag |  | opció |
| ↳ `allergen.klorhexidin` | Klórhexidin |  | opció |
| ↳ `allergen.etel` | Étel (a fajtát a diétás mező részletezi) |  | opció |
| ↳ `allergen.egyeb` | Egyéb (megnevezve) |  | opció |
| `allergy.reaction` | Az allergiás reakció jellege |  | Mi történt — ALLERGÉNENKÉNT külön. |
| ↳ `anaphylaxis` | Anafilaxia |  | opció |
| ↳ `angioedema` | Angioödéma |  | opció |
| ↳ `bronchospasm` | Hörgőgörcs |  | opció |
| ↳ `urticaria` | Csalánkiütés |  | opció |
| ↳ `rash` | Bőrkiütés |  | opció |
| ↳ `giUpset` | Gyomor-bél panasz |  | opció |
| ↳ `unknown` | Nem ismert |  | opció |
| `allergy.severity` | A reakció súlyossága |  | Mennyire volt súlyos — allergénenként. |
| ↳ `eletveszelyes` | Életveszélyes (ellátást igényelt) |  | opció |
| ↳ `sulyos` | Súlyos |  | opció |
| ↳ `enyhe` | Enyhe |  | opció |
| ↳ `unknown` | Nem ismert |  | opció |
| `allergy.verified` | Az allergia igazolt |  | Igazolt-e, és hogyan. |
| ↳ `igazolt` | Vizsgálattal igazolt (bőrteszt, provokáció, specifikus IgE) |  | opció |
| ↳ `anamnesztikus` | Csak a beteg elmondása alapján |  | opció |
| ↳ `cafolt` | Kivizsgálva és CÁFOLT |  | opció |
| ↳ `unknown` | Nem ismert |  | opció |

### Anamnézis `hx`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.repro.currentPregnancy.preeclampsia` | Praeeclampsia a jelen terhességben |  | Fennáll-e praeeclampsia a most futó terhességben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Belszervi előzmény `hx.sys`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.sys.anemia` | Krónikus vérszegénység |  | Terhesség előtt fennálló anaemia. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.aps` | Antifoszfolipid szindróma |  | Igazolt APS. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.asthma` | Asztma / krónikus légúti betegség | Asthma | Ismert asztma vagy krónikus légúti betegség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.autoimmune` | Autoimmun betegség |  | SLE, rheumatoid arthritis vagy más autoimmun kórkép. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.bariatric` | Bariátriai műtét |  | Gyomor- vagy bélátalakító fogyasztó műtét. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.bleedingDisorder` | Vérzékenység |  | Ismert alvadási zavar, pl. von Willebrand. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.cardiac.congenital` | Veleszületett szívhiba |  | Ismert congenitalis vitium, műtött vagy nem. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.cardiac.mechValve` | Mechanikus műbillentyű |  | Beültetett mechanikus szívbillentyű. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.cardiac.prevEvent` | Korábbi szívesemény vagy ritmuszavar |  | Korábbi infarktus, szívelégtelenség, aritmia. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.celiac` | Coeliakia |  | Igazolt gluténérzékenység. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.dm1` | 1-es típusú diabetes |  | Inzulinfüggő cukorbetegség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.dm2` | 2-es típusú diabetes |  | Nem inzulinfüggő cukorbetegség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.endometriosis` | Endometriosis |  | Igazolt endometriosis. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.epilepsy` | Epilepszia |  | Ismert epilepszia. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.htn` | Magas vérnyomás |  | Ismert, terhesség előtt fennálló hypertonia. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.ibd` | Gyulladásos bélbetegség |  | Crohn-betegség vagy colitis ulcerosa. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.liver` | Krónikus májbetegség |  | Ismert májbetegség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.migraine` | Migrén |  | Ismert migrén, aurával vagy anélkül. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.myoma` | Myoma |  | Ismert méhmyoma. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.osa` | Alvási apnoe |  | Igazolt obstruktív alvási apnoe. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.pcos` | PCOS |  | Policisztás ovárium szindróma. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.renal` | Krónikus vesebetegség |  | Ismert vesebetegség vagy csökkent vesefunkció. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.thrombophilia` | Ismert thrombophilia |  | Laboratóriumilag igazolt alvadási hajlam. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.thyroid.hyper` | Pajzsmirigy-túlműködés |  | Ismert hyperthyreosis vagy Basedow-kór. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.thyroid.hypo` | Pajzsmirigy-alulműködés |  | Ismert hypothyreosis. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.uterineAnomaly` | Méhfejlődési rendellenesség |  | Uterus septus, bicornis, unicornis. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.sys.vte` | Korábbi thrombosis vagy embólia |  | Mélyvénás thrombosis vagy tüdőembólia az anamnézisben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Családi anamnézis `hx.family`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.family.ageAtDeath` | Életkor a halálozáskor [a] |  | Hány évesen hunyt el, ha elhunyt. |
| `hx.family.ageAtOnset` | Életkor a diagnóziskor [a] |  | Hány évesen alakult ki a betegség. |
| `hx.family.dataSource` | Az adat forrása |  | Kitől származik az információ. |
| ↳ `patient` | A beteg mondta |  | opció |
| ↳ `family` | Családtag mondta |  | opció |
| ↳ `records` | Orvosi dokumentációból |  | opció |
| ↳ `genetic-report` | Genetikai leletből |  | opció |
| `hx.family.diagnosisReliability` | A diagnózis megbízhatósága |  | Mennyire megbízható a családtag diagnózisa. |
| ↳ `documented` | Dokumentált — lelet látta |  | opció |
| ↳ `reported` | Elmondás alapján |  | opció |
| ↳ `suspected` | Csak gyanú |  | opció |
| `hx.family.disease` | Betegség |  | A családtagnál fennálló betegség vagy betegségek. |
| ↳ `cancer.breast` | Emlőrák |  | opció |
| ↳ `cancer.ovary` | Petefészekrák |  | opció |
| ↳ `cancer.colon` | Vastagbélrák |  | opció |
| ↳ `cancer.uterus` | Méhtestrák |  | opció |
| ↳ `dm` | Cukorbetegség |  | opció |
| ↳ `htn` | Magas vérnyomás |  | opció |
| ↳ `preeclampsia` | Praeeclampsia |  | opció |
| ↳ `vte` | Thrombosis |  | opció |
| ↳ `cardiac` | Szívbetegség |  | opció |
| ↳ `stroke` | Stroke |  | opció |
| ↳ `thyroid` | Pajzsmirigy-betegség |  | opció |
| ↳ `psych` | Pszichiátriai betegség |  | opció |
| ↳ `epilepsy` | Epilepszia |  | opció |
| ↳ `congenital` | Veleszületett rendellenesség |  | opció |
| ↳ `genetic` | Ismert genetikai betegség |  | opció |
| ↳ `hearing` | Halláscsökkenés |  | opció |
| ↳ `cf` | Cisztás fibrózis |  | opció |
| ↳ `hemoglobinopathy` | Haemoglobinopathia |  | opció |
| ↳ `muscular` | Izombetegség |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `hx.family.documentationGap` | Dokumentációs hiány |  | Hiányzik-e a dokumentáció, amit érdemes lenne beszerezni. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.family.relation` | Rokonsági fok |  | A családtag rokonsági foka a beteghez képest. |
| ↳ `self` | Saját |  | opció |
| ↳ `mother` | Anya |  | opció |
| ↳ `father` | Apa |  | opció |
| ↳ `sister` | Nővér/húg |  | opció |
| ↳ `brother` | Fivér |  | opció |
| ↳ `child` | Gyermek |  | opció |
| ↳ `mother.mother` | Anyai nagyanya |  | opció |
| ↳ `mother.father` | Anyai nagyapa |  | opció |
| ↳ `mother.sister` | Anyai nagynéni |  | opció |
| ↳ `mother.brother` | Anyai nagybácsi |  | opció |
| ↳ `father.mother` | Apai nagyanya |  | opció |
| ↳ `father.father` | Apai nagyapa |  | opció |
| ↳ `father.sister` | Apai nagynéni |  | opció |
| ↳ `father.brother` | Apai nagybácsi |  | opció |

### Diéta `diet`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `diet.allergies.food` | Ételallergia |  | Milyen ételre volt korábban allergiás reakció. |
| ↳ `milk` | Tej |  | opció |
| ↳ `egg` | Tojás |  | opció |
| ↳ `peanut` | Földimogyoró |  | opció |
| ↳ `treeNut` | Diófélék |  | opció |
| ↳ `fish` | Hal |  | opció |
| ↳ `shellfish` | Rákfélék |  | opció |
| ↳ `soy` | Szója |  | opció |
| ↳ `wheat` | Búza |  | opció |
| ↳ `sesame` | Szezám |  | opció |
| ↳ `none` | Nincs |  | opció |
| `diet.carb.breakfast` | Szénhidrát — reggeli [g] |  | A reggelire javasolt szénhidrátmennyiség. |
| `diet.carb.dinner` | Szénhidrát — vacsora [g] |  | A(z) vacsorare javasolt szénhidrátmennyiség. |
| `diet.carb.lunch` | Szénhidrát — ebéd [g] |  | A(z) ebédre javasolt szénhidrátmennyiség. |
| `diet.carb.snack1` | Szénhidrát — tízórai [g] |  | A(z) tízóraire javasolt szénhidrátmennyiség. |
| `diet.carb.snack2` | Szénhidrát — uzsonna [g] |  | A(z) uzsonnare javasolt szénhidrátmennyiség. |
| `diet.carb.snack3` | Szénhidrát — utóvacsora [g] |  | A(z) utóvacsorare javasolt szénhidrátmennyiség. |
| `diet.counselingDate` | A tanácsadás időpontja |  | Mikor történt a táplálkozási tanácsadás. |
| `diet.counselingGiven` | Dietetikai tanácsadás megtörtént |  | Kapott-e a beteg személyre szóló táplálkozási tanácsadást. |
| `diet.energyTarget` | Napi energiaszükséglet [kcal] |  | A becsült napi energiaszükséglet. |
| `diet.fluidIntake` | Napi folyadékbevitel [L] |  | Mennyi folyadékot iszik naponta. |
| `diet.pattern` | Jelenlegi étrend |  | Milyen étrendet követ a beteg. |
| ↳ `mixed` | Vegyes |  | opció |
| ↳ `vegetarian` | Vegetáriánus |  | opció |
| ↳ `vegan` | Vegán |  | opció |
| ↳ `pescatarian` | Halat is fogyaszt, húst nem |  | opció |
| ↳ `lowCarb` | Szénhidrátszegény |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `diet.proteinTarget` | Napi fehérjeszükséglet [g] |  | A becsült napi fehérjeszükséglet terhességben. |
| `diet.restrictions` | Étrendi megszorítások |  | Milyen okból kerül a beteg bizonyos ételeket. |
| ↳ `lactoseFree` | Laktózmentes |  | opció |
| ↳ `glutenFree` | Gluténmentes |  | opció |
| ↳ `halal` | Halal |  | opció |
| ↳ `kosher` | Kóser |  | opció |
| ↳ `lowSalt` | Sószegény |  | opció |
| ↳ `lowFat` | Zsírszegény |  | opció |
| ↳ `none` | Nincs |  | opció |
| `diet.selfMonitoring` | Vércukor-önellenőrzési napló |  | Vezet-e a beteg vércukor-önellenőrzési naplót. |
| `diet.supp.b12` | B12-vitamin — javasolt |  | Javasoljuk-e a(z) b12-vitamin pótlását. |
| `diet.supp.b12.dose` | B12-vitamin — napi adag [ug] |  | A javasolt napi b12-vitamin-adag. |
| `diet.supp.calcium` | Kalcium — javasolt |  | Javasoljuk-e a(z) kalcium pótlását. |
| `diet.supp.calcium.dose` | Kalcium — napi adag [mg] |  | A javasolt napi kalcium-adag. |
| `diet.supp.dha` | Omega-3 (DHA) — javasolt |  | Javasoljuk-e a(z) omega-3 (dha) pótlását. |
| `diet.supp.dha.dose` | Omega-3 (DHA) — napi adag [mg] |  | A javasolt napi omega-3 (dha)-adag. |
| `diet.supp.folate` | Folsav — javasolt |  | Javasoljuk-e a(z) folsav pótlását. |
| `diet.supp.folate.dose` | Folsav — napi adag [ug] |  | A javasolt napi folsav-adag. |
| `diet.supp.iodine` | Jód — javasolt |  | Javasoljuk-e a(z) jód pótlását. |
| `diet.supp.iodine.dose` | Jód — napi adag [ug] |  | A javasolt napi jód-adag. |
| `diet.supp.iron` | Vas — javasolt |  | Javasoljuk-e a(z) vas pótlását. |
| `diet.supp.iron.dose` | Vas — napi adag [mg] |  | A javasolt napi vas-adag. |
| `diet.supp.multivit` | Terhes-multivitamin — javasolt |  | Javasoljuk-e a(z) terhes-multivitamin pótlását. |
| `diet.supp.multivit.dose` | Terhes-multivitamin — napi adag [{tbl}] |  | A javasolt napi terhes-multivitamin-adag. |
| `diet.supp.vitaminD` | D-vitamin — javasolt |  | Javasoljuk-e a(z) d-vitamin pótlását. |
| `diet.supp.vitaminD.dose` | D-vitamin — napi adag [[IU]] |  | A javasolt napi d-vitamin-adag. |

### EESZT-előzmény `hx.eeszt`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.eeszt.age` | Életkor szerinti kockázat |  | Hivatalos magyar várandós-rizikókód: életkor szerinti kockázat. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.assisted` | Asszisztált reprodukció |  | Hivatalos magyar várandós-rizikókód: asszisztált reprodukció. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.bmi` | Testtömegindex szerinti kockázat |  | Hivatalos magyar várandós-rizikókód: testtömegindex szerinti kockázat. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.chronicDisease` | Krónikus betegség |  | Hivatalos magyar várandós-rizikókód: krónikus betegség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.infection` | Fertőzés |  | Hivatalos magyar várandós-rizikókód: fertőzés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.multiple` | Többes terhesség (EESZT rizikókód) |  | Hivatalos magyar várandós-rizikókód: többes terhesség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.parity` | Parity szerinti kockázat |  | Hivatalos magyar várandós-rizikókód: parity szerinti kockázat. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.prevLoss` | Korábbi terhességvesztés |  | Hivatalos magyar várandós-rizikókód: korábbi terhességvesztés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.prevPreterm` | Korábbi koraszülés (EESZT rizikókód) |  | Hivatalos magyar várandós-rizikókód: korábbi koraszülés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.psych` | Pszichiátriai kockázat |  | Hivatalos magyar várandós-rizikókód: pszichiátriai kockázat. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.social` | Szociális kockázat |  | Hivatalos magyar várandós-rizikókód: szociális kockázat. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.eeszt.substance` | Szerhasználat |  | Hivatalos magyar várandós-rizikókód: szerhasználat. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Életmód `hx.life`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.life.alcohol` | Alkoholfogyasztás |  | Alkoholfogyasztási szokás. |
| ↳ `none` | Nem fogyaszt |  | opció |
| ↳ `occasional` | Alkalmi |  | opció |
| ↳ `regular` | Rendszeres |  | opció |
| ↳ `heavy` | Nagy mennyiségű |  | opció |
| `hx.life.drugs` | Kábítószer-használat |  | Használ-e tiltott szert vagy nem orvosi célra gyógyszert. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.life.smoking` | Dohányzás |  | Dohányzási státusz. |
| ↳ `never` | Soha nem dohányzott |  | opció |
| ↳ `former` | Leszokott |  | opció |
| ↳ `current` | Jelenleg is dohányzik |  | opció |
| ↳ `passive` | Passzív dohányzás |  | opció |
| `hx.life.smoking.perDay` | Napi cigaretta [1] |  | Hány szál cigarettát szív naponta. |

### Étrend-kiegészítők `hx.supp`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.supp.b12` | B12-vitamin |  | Szedi-e: b12-vitamin. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.calcium` | Kalcium |  | Szedi-e: kalcium. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.dha` | Omega-3 (DHA) |  | Szedi-e: omega-3 (dha). |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.folate` | Folsav |  | Szedi-e: folsav. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.folate.dose` | Folsav napi dózisa [ug] |  | A szedett folsav napi mennyisége. |
| `hx.supp.iodine` | Jód |  | Szedi-e: jód. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.iron` | Vas |  | Szedi-e: vas. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.multivit` | Terhesvitamin |  | Szedi-e: terhesvitamin. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.supp.vitD` | D-vitamin |  | Szedi-e: d-vitamin. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Műtéti előzmény `hx.surg`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.surg.anesthesiaProblem` | Aneszteziológiai probléma |  | Volt-e érzéstelenítéssel kapcsolatos probléma. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.surg.complication` | Volt-e szövődmény |  | Járt-e a műtét szövődménnyel. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.surg.spineIssue` | Gerinc-elváltozás vagy műtét |  | Van-e a gerincen olyan eltérés, ami a regionális érzéstelenítést befolyásolja. |
| ↳ `none` | Nincs |  | opció |
| ↳ `scoliosis` | Scoliosis |  | opció |
| ↳ `surgery` | Gerincműtét volt |  | opció |
| ↳ `hernia` | Porckorongsérv |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `hx.surg.type` | Korábbi műtét |  | Milyen műtéten esett át. |
| ↳ `cs` | Császármetszés |  | opció |
| ↳ `myomectomy` | Myomaeltávolítás |  | opció |
| ↳ `laparoscopy` | Laparoszkópia |  | opció |
| ↳ `laparotomy` | Laparotómia |  | opció |
| ↳ `hysteroscopy` | Hiszteroszkópia |  | opció |
| ↳ `conization` | Konizáció |  | opció |
| ↳ `appendectomy` | Vakbélműtét |  | opció |
| ↳ `cholecystectomy` | Epeműtét |  | opció |
| ↳ `bariatric` | Bariátriai műtét |  | opció |
| ↳ `cardiac` | Szívműtét |  | opció |
| ↳ `spine` | Gerincműtét |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `hx.surg.year` | A műtét éve [a] |  | Melyik évben történt. |

### Nőgyógyászati előzmény `hx.gyn`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.gyn.cervix.adequateScreening` | Dokumentáltan megfelelő méhnyakszűrési előzmény |  | A megelőző 10 évben dokumentált, megfelelő negatív szűrési sorozat (citológiai programban három egymást követő |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.gyn.cervix.cin2plus` | CIN2+ / AIS / méhnyakrák az előzményben |  | Kezelt vagy kezeletlen CIN2, CIN3, adenocarcinoma in situ vagy méhnyakrák a megelőző 25 évben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.gyn.cervix.removed` | A méhnyak eltávolításra került |  | Teljes méheltávolítás a méhnyakkal együtt (nem szupracervikális). |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Pszichiátriai előzmény `hx.psy`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.psy.anxiety` | Szorongásos zavar |  | Diagnosztizált szorongásos zavar. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.psy.bipolar` | Bipoláris zavar |  | Igazolt bipoláris affektív zavar. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.psy.depression` | Depresszió |  | Kezelt vagy kezeletlen depresszió az anamnézisben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.psy.eatingDisorder` | Evészavar |  | Anorexia, bulimia vagy más evészavar. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.psy.prevPPD` | Korábbi postpartum depresszió |  | Korábbi szülés után kialakult depresszió. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.psy.prevPPP` | Korábbi postpartum pszichózis |  | Korábbi szülés után kialakult pszichózis. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Reprodukciós anamnézis `hx.repro`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.repro.contraception` | Fogamzásgátlás |  | Milyen fogamzásgátlást használt legutóbb. |
| ↳ `none` | Nem használt |  | opció |
| ↳ `coc` | Kombinált tabletta |  | opció |
| ↳ `pop` | Minitabletta |  | opció |
| ↳ `iud.cu` | Réz IUD |  | opció |
| ↳ `iud.lng` | Hormonos IUD |  | opció |
| ↳ `implant` | Implantátum |  | opció |
| ↳ `injection` | Injekció |  | opció |
| ↳ `barrier` | Barrier |  | opció |
| ↳ `sterilisation` | Sterilizáció |  | opció |
| `hx.repro.currentPregnancy.accreta` | Placenta accreta gyanúja |  | Beszűrődő lepény gyanúja vagy igazolása. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.currentPregnancy.previa` | Placenta previa a jelen terhességben |  | Elölfekvő lepény igazolva. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.cycleLength` | Ciklushossz [d] |  | Az átlagos ciklushossz napokban. |
| `hx.repro.gdm` | Korábbi terhességi cukorbetegség |  | Volt-e GDM korábbi terhességben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.intervention.curettage` | Méhűri beavatkozás |  | Volt-e curettage vagy más méhűri beavatkozás terhesség után. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.loss.ectopic` | Méhen kívüli terhesség |  | Volt-e méhen kívüli terhesség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.loss.induced` | Művi terhességmegszakítás [1] |  | Művi úton befejezett terhességek száma. |
| `hx.repro.loss.missed` | Nem fejlődő terhesség [1] |  | Missed abortion — a magzat elhalt, de a vetélés nem indult meg. |
| `hx.repro.loss.mola` | Molaterhesség |  | Volt-e mola hydatidosa. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.loss.spontaneous` | Spontán vetélés [1] |  | A 24. hét előtt spontán elveszett terhességek száma. |
| `hx.repro.menarche` | Menarche életkora [a] |  | Hány éves korában volt az első menstruáció. |
| `hx.repro.preeclampsia` | Korábbi praeeclampsia |  | Volt-e praeeclampsia korábbi terhességben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.prevBirth.cs` | Korábbi császármetszés [1] |  | Korábbi császármetszések száma. |
| `hx.repro.prevBirth.pph` | Korábbi szülés utáni vérzés |  | Volt-e jelentős postpartum vérzés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.prevBirth.preterm` | Korábbi koraszülés (saját anamnézis) |  | Volt-e 37. hét előtti szülés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.prevBirth.recurringIndication` | Ismétlődő császármetszési javallat |  | A korábbi császármetszés oka fennáll-e most is (pl. szűk medence). |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.prevBirth.shoulderDystocia` | Korábbi vállelakadás |  | Volt-e vállelakadás korábbi szülésnél. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.prevBirth.tear34` | Korábbi harmad- vagy negyedfokú gátrepedés |  | Volt-e sphincter-érintettséggel járó gátsérülés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.repro.prevBirth.vaginal` | Korábbi hüvelyi szülés [1] |  | Hüvelyi úton lezajlott szülések száma. |
| `hx.repro.prevBirth.vbac` | Korábbi sikeres VBAC |  | Volt-e császármetszés utáni sikeres hüvelyi szülés. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Saját születési előzmény `hx.origin`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `hx.origin.birthWeight` | Saját születési súly [g] |  | A beteg saját születési súlya. |
| `hx.origin.maternalPreeclampsia` | Az anyja praeeclampsiás volt-e |  | A beteg anyjának volt-e praeeclampsiája a vele való terhességben. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `hx.origin.preterm` | Saját koraszülöttség |  | A beteg maga koraszülött volt-e. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |

### Antropometria `anthro`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `anthro.bsa` | Testfelszín [m2] |  | Mosteller-képlettel számolt testfelszín. |
| `anthro.weightGain` | Terhességi súlygyarapodás [kg] |  | A terhesség előtti súlyhoz képest hízott mennyiség. |

### Fizikális státusz `status`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `status.cardio.auscultation` | Szívhallgatózás |  | A szívhangok és zörejek hallgatózásos vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.cardio.character` | A szívzörej jellege |  | Milyen jellegű az eltérés. |
| ↳ `murmur` | Zörej |  | opció |
| ↳ `extra` | Extra hang (S3, S4) |  | opció |
| ↳ `rub` | Dörzszörej |  | opció |
| ↳ `arrhy` | Szabálytalan ritmus |  | opció |
| `status.cardio.congestion` | Pangásjelek |  | A keringési pangás klinikai jelei. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.cardio.congestion.sign` | Pangásjel |  | Melyik jel észlelhető. |
| ↳ `jvd` | Nyaki vénatágulat (JVD) |  | opció |
| ↳ `hepatomegaly` | Megnagyobbodott máj |  | opció |
| ↳ `edema` | Végtagi oedema |  | opció |
| ↳ `orthopnea` | Ortopnoe |  | opció |
| ↳ `pnd` | Éjszakai rohamszerű nehézlégzés |  | opció |
| `status.cardio.murmur.grade` | Zörej mértéke |  | A szívzörej hangossága Levine szerint, 1–6. |
| ↳ `1` | 1/6 |  | opció |
| ↳ `2` | 2/6 |  | opció |
| ↳ `3` | 3/6 |  | opció |
| ↳ `4` | 4/6 |  | opció |
| ↳ `5` | 5/6 |  | opció |
| ↳ `6` | 6/6 |  | opció |
| `status.cardio.murmur.timing` | Zörej típusa |  | A szívciklus melyik szakaszában hallható. |
| ↳ `sys` | Szisztolés |  | opció |
| ↳ `dia` | Diasztolés |  | opció |
| ↳ `cont` | Folyamatos |  | opció |
| `status.cardio.nyha` | NYHA-osztály |  | A funkcionális terhelhetőség NYHA szerint. |
| ↳ `1` | I — panaszmentes |  | opció |
| ↳ `2` | II — enyhe korlátozottság |  | opció |
| ↳ `3` | III — kifejezett korlátozottság |  | opció |
| ↳ `4` | IV — nyugalmi panasz |  | opció |
| `status.cardio.peripheralPulse` | Perifériás pulzusok |  | A végtagi pulzusok tapinthatósága. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.cardio.peripheralPulse.site` | Hol |  | Melyik pulzus hiányzik vagy gyengült. |
| ↳ `radial` | Radialis |  | opció |
| ↳ `femoral` | Femoralis |  | opció |
| ↳ `popliteal` | Poplitealis |  | opció |
| ↳ `dorsalis` | Dorsalis pedis |  | opció |
| ↳ `tibial` | Tibialis posterior |  | opció |
| `status.cardio.pulseQuality` | Pulzuskvalitás |  | A pulzus jellege. |
| ↳ `regular` | Szabályos |  | opció |
| ↳ `irregular` | Szabálytalan |  | opció |
| ↳ `weak` | Gyenge |  | opció |
| ↳ `bounding` | Ugráló |  | opció |
| ↳ `alternans` | Alternáló |  | opció |
| `status.cardio.site` | A szívhang/zörej lokalizációja |  | Hol hallható az eltérés. |
| ↳ `ao` | Aorta felett |  | opció |
| ↳ `pulm` | Pulmonalis felett |  | opció |
| ↳ `mitr` | Mitralis felett |  | opció |
| ↳ `tric` | Tricuspidalis felett |  | opció |
| ↳ `diff` | Diffúz, nem lokalizálható |  | opció |
| `status.endo.acanthosis` | Acanthosis nigricans |  | A hajlatok sötét, bársonyos bőrelváltozásának vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.endo.acanthosis.severity` | Kiterjedtség |  | Mennyire kiterjedt az elváltozás. |
| ↳ `1` | Enyhe — csak közelről látható |  | opció |
| ↳ `2` | Közepes — jól látható, körülírt |  | opció |
| ↳ `3` | Kiterjedt — nagy felületen, bőrfüggelékekkel |  | opció |
| `status.endo.acanthosis.site` | Az acanthosis lokalizációja |  | Hol látható az elváltozás. |
| ↳ `neck` | Nyak |  | opció |
| ↳ `axilla` | Hónalj |  | opció |
| ↳ `groin` | Lágyék |  | opció |
| ↳ `knuckles` | Ujjperc-hajlatok |  | opció |
| ↳ `multiple` | Több hajlatban |  | opció |
| `status.endo.eyeSigns` | Szemtünetek |  | A pajzsmirigy-túlműködéshez társuló szemtünetek vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.endo.eyeSigns.sign` | Szemtünet |  | Milyen szemtünet észlelhető. |
| ↳ `exophthalmos` | Exophthalmus (kiálló szem) |  | opció |
| ↳ `lidRetraction` | Szemhéjretrakció (Dalrymple) |  | opció |
| ↳ `lidLag` | Szemhéj-elmaradás lefelé tekintéskor (von Graefe) |  | opció |
| ↳ `chemosis` | Kötőhártya-duzzanat |  | opció |
| ↳ `diplopia` | Kettőslátás |  | opció |
| ↳ `visusLoss` | Látásromlás |  | opció |
| `status.endo.fatDistribution` | Zsíreloszlás |  | A testzsír eloszlásának mintázata. |
| ↳ `even` | Egyenletes |  | opció |
| ↳ `central` | Centrális (hasi) |  | opció |
| ↳ `gluteofemoral` | Csípő-comb túlsúlyú |  | opció |
| ↳ `cushingoid` | Cushingoid (holdvilágarc, buffalo hump, vékony végtagok) |  | opció |
| ↳ `lipodystrophy` | Lipodystrophia (végtagi zsírvesztés) |  | opció |
| `status.endo.hip` | Csípőkörfogat [cm] |  | A csípő legnagyobb körfogata a trochanterek magasságában. |
| `status.endo.striae` | Striák |  | A bőr csíkozottságának vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.endo.striae.color` | Striák színe |  | A striák megjelenése. |
| ↳ `white` | Halvány, fehér (régi) |  | opció |
| ↳ `pink` | Rózsaszín (friss) |  | opció |
| ↳ `purple` | Lilás-vörös, széles (> 1 cm) |  | opció |
| `status.endo.striae.site` | Striák elhelyezkedése |  | Hol láthatók a striák. |
| ↳ `abdomen` | Has |  | opció |
| ↳ `breast` | Emlő |  | opció |
| ↳ `thigh` | Comb |  | opció |
| ↳ `hip` | Csípő |  | opció |
| ↳ `axilla` | Hónalj |  | opció |
| ↳ `multiple` | Több területen |  | opció |
| `status.endo.thyroid` | Pajzsmirigy tapintás |  | A pajzsmirigy megtekintéses és tapintásos vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.endo.thyroid.consistency` | A pajzsmirigy konzisztenciája |  | A pajzsmirigy tapintott állománya. |
| ↳ `soft` | Puha |  | opció |
| ↳ `firm` | Tömött (rugalmas) |  | opció |
| ↳ `hard` | Kemény, köves |  | opció |
| ↳ `fixed` | A környezetéhez fixált |  | opció |
| `status.endo.thyroid.nodule` | Göb |  | Tapintható-e göb a pajzsmirigyben. |
| ↳ `none` | Nincs |  | opció |
| ↳ `solitary` | Szoliter göb |  | opció |
| ↳ `multi` | Többgöbös |  | opció |
| ↳ `diffuse` | Diffúz megnagyobbodás göb nélkül |  | opció |
| `status.endo.thyroid.size` | Nagyság (WHO golyva-fokozat) |  | A pajzsmirigy nagysága a WHO golyvabesorolása szerint. |
| ↳ `0` | 0 — nem tapintható és nem látható |  | opció |
| ↳ `1` | I — tapintható, de nyújtott nyakon sem látható |  | opció |
| ↳ `2` | II — normál nyaktartásnál is látható |  | opció |
| `status.endo.thyroid.tenderness` | Nyomásérzékenység |  | Fájdalmas-e a pajzsmirigy tapintása. |
| `status.endo.virilization` | Virilizáció jelei |  | A kifejezett androgénhatás fizikális jeleinek vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.endo.virilization.sign` | Virilizációs jel |  | Milyen jel észlelhető. |
| ↳ `clitoromegaly` | Klitorisz-megnagyobbodás |  | opció |
| ↳ `voice` | Hangmélyülés |  | opció |
| ↳ `balding` | Halántéki hajritkulás (androgén típusú) |  | opció |
| ↳ `muscle` | Férfias izomzat-eloszlás |  | opció |
| ↳ `breastAtrophy` | Emlő-sorvadás |  | opció |
| `status.endo.waist` | Derékkörfogat [cm] |  | A derék legkisebb körfogata, illetve a köldök magasságában mért körfogat. |
| `status.endo.whr` | Derék–csípő arány [1] |  | A derékkörfogat és a csípőkörfogat hányadosa. |
| `status.fert.fg.arm` | Ferriman–Gallwey — felkar |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A felkar külső felszíne. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.chest` | Ferriman–Gallwey — mellkas |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A szegycsont és a mellbimbók környéke. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.chin` | Ferriman–Gallwey — áll |  | A terminális (vastag, pigmentált) szőrzet mennyisége. Az áll és az állkapocs vonala. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.lowerAbdomen` | Ferriman–Gallwey — alhas |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A köldök alatt, a szeméremcsont felé. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.lowerBack` | Ferriman–Gallwey — ágyéki-keresztcsonti terület |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A derék és a keresztcsont fölött. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.thigh` | Ferriman–Gallwey — comb |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A comb elülső felszíne. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.total` | Ferriman–Gallwey összpontszám [{pont}] |  | A kilenc testtájék pontszámának összege. |
| `status.fert.fg.treated` | Szőrtelenítő kezelés alatt áll |  | Alkalmaz-e a beteg gyantázást, lézeres vagy más szőrtelenítést a pontozott területeken. |
| `status.fert.fg.upperAbdomen` | Ferriman–Gallwey — felhas |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A köldök felett, a középvonalban. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.upperBack` | Ferriman–Gallwey — hát felső része |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A lapockák közötti terület. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.fg.upperLip` | Ferriman–Gallwey — felső ajak |  | A terminális (vastag, pigmentált) szőrzet mennyisége. A felső ajak felett. |
| ↳ `0` | 0 — nincs terminális szőrzet |  | opció |
| ↳ `1` | 1 — kevés, szórt |  | opció |
| ↳ `2` | 2 — mérsékelt |  | opció |
| ↳ `3` | 3 — kifejezett, férfias mintázat |  | opció |
| `status.fert.galactorrhoea` | Galactorrhoea |  | Ürül-e váladék az emlőbimbóból szoptatáson kívül. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.fert.galactorrhoea.character` | Váladék jellege |  | A váladék megjelenése. |
| ↳ `milky` | Tejszerű |  | opció |
| ↳ `serous` | Savós, tiszta |  | opció |
| ↳ `green` | Zöldes-barnás |  | opció |
| ↳ `bloody` | Véres |  | opció |
| ↳ `purulent` | Gennyes |  | opció |
| `status.fert.galactorrhoea.side` | Galactorrhoea — melyik oldal |  | Melyik emlőből ürül a váladék. |
| ↳ `both` | Mindkét oldal |  | opció |
| ↳ `right` | Jobb |  | opció |
| ↳ `left` | Bal |  | opció |
| `status.fert.partner.semenAnalysis` | Partner ondóvizsgálatának eredménye |  | A partner legutóbbi spermiogramjának összefoglaló besorolása. |
| ↳ `normo` | Normozoospermia |  | opció |
| ↳ `oligo` | Oligozoospermia |  | opció |
| ↳ `astheno` | Asthenozoospermia |  | opció |
| ↳ `terato` | Teratozoospermia |  | opció |
| ↳ `oat` | Oligo-astheno-teratozoospermia |  | opció |
| ↳ `crypto` | Cryptozoospermia |  | opció |
| ↳ `azoo` | Azoospermia |  | opció |
| ↳ `notDone` | Nem történt vizsgálat |  | opció |
| `status.fert.tanner.breast` | Emlő Tanner-stádium |  | Az emlő fejlettségi foka a Tanner-beosztás szerint. |
| ↳ `1` | B1 — gyermeki emlő |  | opció |
| ↳ `2` | B2 — emlőbimbó-kiemelkedés |  | opció |
| ↳ `3` | B3 — az emlő és az udvar tovább növekszik |  | opció |
| ↳ `4` | B4 — az udvar önálló dombot képez |  | opció |
| ↳ `5` | B5 — érett emlő |  | opció |
| `status.gyn.adnex.finding` | Függelék — lelet |  | Mi tapintható a függelék tájékán. |
| ↳ `tender` | Érzékenység |  | opció |
| ↳ `resistance` | Rezisztencia |  | opció |
| ↳ `mass` | Körülírt terime |  | opció |
| ↳ `fixedMass` | Fixált, egyenetlen terime |  | opció |
| `status.gyn.adnex.side` | Függelék — oldal |  | Melyik oldalon tapintható eltérés. |
| ↳ `right` | Jobb |  | opció |
| ↳ `left` | Bal |  | opció |
| ↳ `both` | Mindkét oldal |  | opció |
| `status.gyn.bimanual` | Bimanuális tapintás |  | A méh és a függelékek kétkezes (hüvelyi + hasi) tapintásos vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.gyn.cmt` | Portio mozgatási fájdalom |  | Fájdalmas-e a méhnyak oldalirányú mozgatása (cervical motion tenderness). |
| `status.gyn.colposcopy` | Kolposzkópos lelet |  | A méhnyak nagyítós, ecetsavas és jódos vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.gyn.colposcopy.biopsy` | Történt célzott biopszia |  | Vettek-e szövettani mintát a vizsgálat során. |
| `status.gyn.colposcopy.finding` | Kolposzkópos kép |  | Az ecetsavas és jódos próba utáni kép besorolása. |
| ↳ `normal` | Normális kolposzkópos kép |  | opció |
| ↳ `grade1` | 1. fokú (minor) elváltozás |  | opció |
| ↳ `grade2` | 2. fokú (major) elváltozás |  | opció |
| ↳ `invasion` | Invázióra gyanús kép |  | opció |
| ↳ `nonspec` | Nem specifikus eltérés (gyulladás, atrophia) |  | opció |
| ↳ `inadeq` | Nem megítélhető |  | opció |
| `status.gyn.colposcopy.tz` | Transzformációs zóna típusa |  | A hám átalakulási zónájának láthatósága. |
| ↳ `1` | 1. típus — teljesen látható, ectocervicalis |  | opció |
| ↳ `2` | 2. típus — teljesen látható, endocervicalis komponenssel |  | opció |
| ↳ `3` | 3. típus — nem teljesen látható |  | opció |
| `status.gyn.cytology` | Méhnyak-citológia eredménye |  | A méhnyakról vett kenet citológiai besorolása. |
| ↳ `nilm` | NILM — negatív intraepithelialis laesióra |  | opció |
| ↳ `ascus` | ASC-US — meghatározatlan jelentőségű laphámsejt-eltérés |  | opció |
| ↳ `lsil` | LSIL — enyhe fokú laphám-elváltozás |  | opció |
| ↳ `asch` | ASC-H — HSIL nem zárható ki |  | opció |
| ↳ `hsil` | HSIL — súlyos fokú laphám-elváltozás |  | opció |
| ↳ `agc` | AGC — mirigyhámsejt-eltérés |  | opció |
| ↳ `ais` | AIS — adenocarcinoma in situ |  | opció |
| ↳ `ca` | Karcinóma-gyanús |  | opció |
| ↳ `inadeq` | Nem értékelhető minta |  | opció |
| `status.gyn.douglas` | Douglas-üreg |  | A méh mögötti mélyedés tapintási lelete. |
| ↳ `free` | Szabad |  | opció |
| ↳ `tender` | Érzékeny |  | opció |
| ↳ `bulging` | Boltosuló (szabad folyadék gyanúja) |  | opció |
| ↳ `nodular` | Göbös, egyenetlen |  | opció |
| `status.gyn.fluor.character` | Fluor jellege |  | A hüvelyváladék megjelenése. |
| ↳ `physiologic` | Élettani (fehéres, szagtalan) |  | opció |
| ↳ `curdy` | Sajtos, túrószerű |  | opció |
| ↳ `frothy` | Habos, szürkés-zöldes |  | opció |
| ↳ `greyThin` | Szürke, híg, tapadó |  | opció |
| ↳ `purulent` | Gennyes |  | opció |
| ↳ `bloody` | Véres |  | opció |
| ↳ `watery` | Bő, vizes |  | opció |
| `status.gyn.fluor.odor` | Szag |  | Van-e kóros szaga a váladéknak. |
| ↳ `none` | Nincs |  | opció |
| ↳ `amine` | Halszagú (amin) |  | opció |
| ↳ `foul` | Bűzös |  | opció |
| `status.gyn.hpv` | HPV-státusz |  | A magas kockázatú HPV-tipizálás eredménye. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `hr` | Magas kockázatú HPV pozitív (nem 16/18) |  | opció |
| ↳ `hpv16` | HPV 16 pozitív |  | opció |
| ↳ `hpv18` | HPV 18 pozitív |  | opció |
| ↳ `posUntyped` | Pozitív, genotipizálás nélkül |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `status.gyn.hpv.collection` | A HPV-minta vételi módja |  | A magas kockázatú HPV-teszthez felhasznált minta vételi módja. |
| ↳ `clinician` | Ellátó által vett méhnyakminta |  | opció |
| ↳ `selfVaginal` | Önmintavétel — hüvelyi minta |  | opció |
| ↳ `unknown` | Nem ismert |  | opció |
| `status.gyn.ph` | Hüvelyi pH [1] |  | A hüvelyváladék pH-ja indikátorpapírral mérve. |
| `status.gyn.portio` | Portio (méhszáj) |  | A hüvelybe domborodó méhnyakrész megtekintéses vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.gyn.portio.contactBleeding` | Kontaktvérzés |  | Vérzik-e a portio a kenetvétel vagy az érintés hatására. |
| `status.gyn.portio.surface` | Felszín |  | A portio felszínének megjelenése. |
| ↳ `smooth` | Sima, ép |  | opció |
| ↳ `ectopy` | Ectopia (hengerhám-kiterjedés) |  | opció |
| ↳ `nabothian` | Ovula Nabothi |  | opció |
| ↳ `polyp` | Nyaki polyp |  | opció |
| ↳ `erosion` | Erosio, hámhiány |  | opció |
| ↳ `ulcer` | Fekély |  | opció |
| ↳ `exophytic` | Exophyticus, tumorgyanús terime |  | opció |
| ↳ `condyloma` | Condyloma |  | opció |
| ↳ `cerclage` | Cerclage-öltés látható |  | opció |
| `status.gyn.speculum` | Hüvelyi feltárás |  | A hüvely és a méhszáj megtekintése tükörrel. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.gyn.uterus.mobility` | Mozgathatóság |  | Szabadon elmozdítható-e a méh a tapintás során. |
| ↳ `free` | Szabadon mozgatható |  | opció |
| ↳ `limited` | Korlátozottan mozgatható |  | opció |
| ↳ `fixed` | Fixált |  | opció |
| `status.gyn.uterus.position` | Méh helyzete |  | A méhtest dőlésiránya a méhnyakhoz és a medencetengelyhez képest. |
| ↳ `ante` | Anteflexio-anteversio |  | opció |
| ↳ `medio` | Medioflexio (középállás) |  | opció |
| ↳ `retro` | Retroflexio-retroversio |  | opció |
| ↳ `dextro` | Jobbra deviált |  | opció |
| ↳ `sinistro` | Balra deviált |  | opció |
| `status.gyn.uterus.size` | Méh nagysága |  | A méh tapintott nagysága, terhességi hetekben kifejezve. |
| ↳ `normal` | Normális nagyságú |  | opció |
| ↳ `gt6` | Kisujjnyival nagyobb (≈6–8 hetes) |  | opció |
| ↳ `gt8` | 8–12 hetes terhességnek megfelelő |  | opció |
| ↳ `gt12` | 12 hetes terhességnél nagyobb |  | opció |
| ↳ `small` | Kisebb a szokásosnál (atrophiás) |  | opció |
| `status.gyn.vulva` | Külső genitália |  | A szeméremtest, a gát és a hüvelybemenet megtekintéses vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.gyn.vulva.lesion` | Eltérés jellege |  | Milyen elváltozás látható a külső nemi szerveken. |
| ↳ `erythema` | Bőrpír, gyulladás |  | opció |
| ↳ `edema` | Duzzanat |  | opció |
| ↳ `excoriation` | Vakarásnyom, hámhiány |  | opció |
| ↳ `ulcer` | Fekély |  | opció |
| ↳ `condyloma` | Condyloma (szemölcs) |  | opció |
| ↳ `leukoplakia` | Fehéres, hegesedő terület (lichen gyanúja) |  | opció |
| ↳ `atrophy` | Sorvadás |  | opció |
| ↳ `cyst` | Ciszta (pl. Bartholin) |  | opció |
| ↳ `tumor` | Tumorgyanús terime |  | opció |
| ↳ `varix` | Vulva-varicositas |  | opció |
| ↳ `laceration` | Sérülés, repedés |  | opció |
| `status.gyn.vulva.site` | A vulvaelváltozás lokalizációja |  | Hol látható az eltérés. |
| ↳ `labMaj` | Nagyajak |  | opció |
| ↳ `labMin` | Kisajak |  | opció |
| ↳ `clitoris` | Csikló |  | opció |
| ↳ `introitus` | Hüvelybemenet |  | opció |
| ↳ `perineum` | Gát |  | opció |
| ↳ `perianal` | Végbélnyílás körül |  | opció |
| ↳ `diffuse` | Kiterjedt, több területet érint |  | opció |
| `status.internal.abdomen` | Hasi tapintás |  | A has tapintásos vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.internal.abdomen.region` | Hasi régió |  | Melyik hasi régióban. |
| ↳ `ruq` | Jobb bordaív alatt |  | opció |
| ↳ `epigastrium` | Epigastrium |  | opció |
| ↳ `luq` | Bal bordaív alatt |  | opció |
| ↳ `rlq` | Jobb alhas |  | opció |
| ↳ `suprapubic` | Symphysis felett |  | opció |
| ↳ `llq` | Bal alhas |  | opció |
| ↳ `diffuse` | Diffúz |  | opció |
| `status.internal.abdomen.sign` | Tapintási jel |  | Milyen eltérés tapintható. |
| ↳ `tender` | Nyomásérzékenység |  | opció |
| ↳ `defense` | Défense (izomvédekezés) |  | opció |
| ↳ `rebound` | Rebound (Blumberg) |  | opció |
| ↳ `mass` | Tapintható terime |  | opció |
| ↳ `hepatomegaly` | Megnagyobbodott máj |  | opció |
| ↳ `splenomegaly` | Megnagyobbodott lép |  | opció |
| `status.internal.edema` | Oedema |  | Végtagi vizenyő jelenléte és mértéke. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.internal.edema.grade` | Oedema fokozata |  | A benyomat mélysége és visszatelődési ideje szerint. |
| ↳ `1` | + |  | opció |
| ↳ `2` | ++ |  | opció |
| ↳ `3` | +++ |  | opció |
| `status.internal.edema.site` | Oedema kiterjedése |  | Hol jelentkezik a vizenyő. |
| ↳ `ankle` | Boka |  | opció |
| ↳ `leg` | Lábszár |  | opció |
| ↳ `gen` | Generalizált |  | opció |
| ↳ `face` | Arc, kéz |  | opció |
| `status.internal.general` | Általános megtekintés |  | Az általános benyomás: bőr, hidratáltság, ikterus, cyanosis. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.internal.hydration` | Hidratáltság |  | A hidratáltsági állapot. |
| ↳ `normal` | Megfelelő |  | opció |
| ↳ `mild` | Enyhén kiszáradt |  | opció |
| ↳ `severe` | Súlyosan kiszáradt |  | opció |
| `status.internal.lungs` | Tüdőhallgatózás |  | A légzési hangok hallgatózásos vizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.internal.lungs.side` | Tüdőlelet — melyik oldal |  | Melyik oldalon hallható az eltérés. |
| ↳ `right` | Jobb |  | opció |
| ↳ `left` | Bal |  | opció |
| ↳ `both` | Mindkét oldalon |  | opció |
| ↳ `base` | Bázisokon |  | opció |
| `status.internal.lungs.sound` | Hallgatózási lelet |  | Milyen kóros légzési hang. |
| ↳ `crackles` | Szörtyzörej |  | opció |
| ↳ `wheeze` | Sípolás, búgás |  | opció |
| ↳ `diminished` | Halkult légzés |  | opció |
| ↳ `absent` | Néma terület |  | opció |
| ↳ `rub` | Pleurális dörzszörej |  | opció |
| `status.internal.lymph` | Nyirokcsomók |  | A tapintható nyirokcsomó-régiók. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.internal.lymph.region` | Nyirokcsomó-régió |  | Hol tapintható. |
| ↳ `cervical` | Nyaki |  | opció |
| ↳ `axillary` | Hónalji |  | opció |
| ↳ `supraclav` | Kulcscsont feletti |  | opció |
| ↳ `inguinal` | Lágyéki |  | opció |
| ↳ `generalized` | Generalizált |  | opció |
| `status.internal.perfusion` | Perifériás keringés |  | A végtagok keringése. |
| ↳ `normal` | Megfelelő |  | opció |
| ↳ `cool` | Hűvös végtagok |  | opció |
| ↳ `mottled` | Márványozott bőr |  | opció |
| ↳ `delayed` | Elhúzódó kapilláris újratelődés |  | opció |
| `status.internal.skin` | Bőr |  | A bőr színe és állapota. |
| ↳ `pale` | Sápadt |  | opció |
| ↳ `jaundice` | Ikterusos |  | opció |
| ↳ `cyanotic` | Cyanotikus |  | opció |
| ↳ `flushed` | Kipirult |  | opció |
| ↳ `rash` | Kiütéses |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `status.internal.varicosity` | Varicositas |  | Visszértágulat. |
| ↳ `none` | Nincs |  | opció |
| ↳ `mild` | Enyhe |  | opció |
| ↳ `moderate` | Közepes |  | opció |
| ↳ `severe` | Kifejezett |  | opció |
| ↳ `vulvar` | Vulvaris varicositas |  | opció |
| `status.obs.amnioticFluid` | Magzatvíz jellege |  | A lefolyó magzatvíz megjelenése. |
| ↳ `intact` | Burok ép |  | opció |
| ↳ `clear` | Tiszta |  | opció |
| ↳ `meconiumThin` | Híg meconiumos |  | opció |
| ↳ `meconiumThick` | Sűrű meconiumos |  | opció |
| ↳ `bloody` | Véres |  | opció |
| ↳ `foul` | Bűzös |  | opció |
| ↳ `absent` | Nem ürül (oligohydramnion gyanúja) |  | opció |
| `status.obs.caput` | Caput succedaneum |  | A vezérpont feletti lágyrész-duzzanat mértéke. |
| ↳ `0` | 0 — nincs |  | opció |
| ↳ `1` | 1+ — kismértékű |  | opció |
| ↳ `2` | 2+ — kifejezett |  | opció |
| ↳ `3` | 3+ — jelentős |  | opció |
| `status.obs.contractions.duration` | Kontrakció időtartama [s] |  | Egy összehúzódás hossza másodpercben. |
| `status.obs.contractions.freq` | Kontrakciók száma [/(10.min)] |  | Hány összehúzódás jelentkezik 10 perc alatt. |
| `status.obs.contractions.intensity` | Kontrakció erőssége |  | A tapintott összehúzódás ereje. |
| ↳ `mild` | Gyenge (a méh benyomható) |  | opció |
| ↳ `moderate` | Közepes |  | opció |
| ↳ `strong` | Erős (a méh nem nyomható be) |  | opció |
| ↳ `tetanic` | Tartós, nem enged fel |  | opció |
| `status.obs.engagement` | Fejbeszállás (ötödökben) |  | A koponya hány ötöde tapintható még a medencebemenet felett hasi tapintással. |
| ↳ `5` | 5/5 — teljesen a bemenet felett |  | opció |
| ↳ `4` | 4/5 |  | opció |
| ↳ `3` | 3/5 |  | opció |
| ↳ `2` | 2/5 — beszállóban |  | opció |
| ↳ `1` | 1/5 |  | opció |
| ↳ `0` | 0/5 — nem tapintható |  | opció |
| `status.obs.fhr` | Magzati szívfrekvencia [/min] |  | A magzat alapszívfrekvenciája percenkénti ütésszámban. |
| `status.obs.fhr.method` | Szívhang észlelésének módja |  | Mivel történt a magzati szívhang megítélése. |
| ↳ `pinard` | Pinard-féle kürt |  | opció |
| ↳ `doppler` | Kézi Doppler |  | opció |
| ↳ `ctg` | CTG (kardiotokográfia) |  | opció |
| ↳ `us` | Ultrahang |  | opció |
| ↳ `fse` | Fejbőr-elektróda (belső) |  | opció |
| `status.obs.fundalHeight` | Méhmagasság |  | A symphysis-fundus távolság megítélése a gesztációs korhoz mérten. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `status.obs.fundalHeight.cm` | Méhmagasság (symphysis-fundus távolság) [cm] |  | Symphysis-fundus távolság centiméterben. |
| `status.obs.fundalHeight.dev` | Eltérés iránya |  | A méhmagasság a gesztációs korhoz képest. |
| ↳ `small` | Kisebb a vártnál |  | opció |
| ↳ `large` | Nagyobb a vártnál |  | opció |
| `status.obs.lie` | Magzat fekvése |  | A magzat hossztengelyének viszonya a méh hossztengelyéhez. |
| ↳ `long` | Hosszfekvés |  | opció |
| ↳ `transverse` | Harántfekvés |  | opció |
| ↳ `oblique` | Ferdefekvés |  | opció |
| ↳ `unstable` | Instabil (változó) |  | opció |
| `status.obs.membranes` | Magzatburok |  | A magzatburok állapota. |
| ↳ `intact` | Intakt |  | opció |
| ↳ `srom` | Spontán repedt |  | opció |
| ↳ `arom` | Mesterségesen megnyitott |  | opció |
| ↳ `uncertain` | Bizonytalan — repedés gyanúja |  | opció |
| `status.obs.membranes.hours` | Burokrepedés óta eltelt idő [h] |  | A magzatburok megrepedése óta eltelt óra. |
| `status.obs.membranes.rupturedAt` | Burokrepedés időpontja |  | Mikor repedt meg a magzatburok. |
| `status.obs.moulding` | Koponyacsont-egymásra csúszás |  | A koponyavarratok mentén a csontok egymásra csúszásának mértéke. |
| ↳ `0` | 0 — a varratok elkülönülnek |  | opció |
| ↳ `1` | 1+ — a csontok érintkeznek |  | opció |
| ↳ `2` | 2+ — egymásra csúsztak, de eltolhatók |  | opció |
| ↳ `3` | 3+ — egymásra csúsztak, nem eltolhatók |  | opció |
| `status.obs.position` | Magzat állása |  | A vezérpont viszonya az anyai medencéhez. |
| ↳ `oa` | OA — nyakszirt elöl |  | opció |
| ↳ `loa` | LOA — bal elülső |  | opció |
| ↳ `roa` | ROA — jobb elülső |  | opció |
| ↳ `lot` | LOT — bal haránt |  | opció |
| ↳ `rot` | ROT — jobb haránt |  | opció |
| ↳ `op` | OP — nyakszirt hátul |  | opció |
| ↳ `lop` | LOP — bal hátulsó |  | opció |
| ↳ `rop` | ROP — jobb hátulsó |  | opció |
| `status.obs.presentation` | Előfekvő rész |  | A medencebemenet felett elhelyezkedő magzati rész. |
| ↳ `cephalic` | Koponyavégű |  | opció |
| ↳ `breechFrank` | Farfekvés — tiszta far |  | opció |
| ↳ `breechComplete` | Farfekvés — komplett |  | opció |
| ↳ `breechFootling` | Farfekvés — lábra álló |  | opció |
| ↳ `shoulder` | Váll |  | opció |
| ↳ `face` | Arctartás |  | opció |
| ↳ `brow` | Homloktartás |  | opció |
| ↳ `compound` | Kombinált (végtag a fej mellett) |  | opció |

### Szülészeti vizsgálat `exam.obs`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `exam.cervix.consistency` | A cervix konzisztenciája | Cervical consistency | A cervix tapintási konzisztenciája. |
| ↳ `0` | kemény |  | opció |
| ↳ `1` | közepes |  | opció |
| ↳ `2` | puha |  | opció |
| `exam.cervix.position` | Pozíció | Cervical position | A cervix elhelyezkedése. |
| ↳ `0` | hátsó |  | opció |
| ↳ `1` | közép |  | opció |
| ↳ `2` | elülső |  | opció |

### Vitális paraméterek `vitals`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `vitals.consciousness` | Tudatállapot |  | AVPU szerinti tudatállapot. |
| ↳ `a` | Éber (Alert) |  | opció |
| ↳ `v` | Hangra reagál (Voice) |  | opció |
| ↳ `p` | Fájdalomra reagál (Pain) |  | opció |
| ↳ `u` | Nem reagál (Unresponsive) |  | opció |
| `vitals.pain` | Fájdalom (VAS) [1] |  | A beteg által jelzett fájdalom 0–10 skálán. |
| `vitals.pulsePressure` | Pulzusnyomás [mm[Hg]] |  | A szisztolés és diasztolés nyomás különbsége. |
| `vitals.rr` | Légzésszám [/min] |  | Percenkénti légvételek száma. |
| `vitals.shockIndex` | Sokk-index [1] |  | Pulzus osztva a szisztolés vérnyomással. |
| `vitals.temp` | Testhőmérséklet [Cel] |  | Maghőmérséklet. |

### EKG — tizenkét elvezetés `ekg`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `ekg.avf.q` | Q-hullám mélysége — aVF [mV] |  | A Q-hullám amplitúdója a(z) aVF elvezetésben. |
| `ekg.avf.r` | R-amplitúdó — aVF [mV] |  | Az R-hullám amplitúdója a(z) aVF elvezetésben. |
| `ekg.avf.s` | S-amplitúdó — aVF [mV] |  | Az S-hullám amplitúdója a(z) aVF elvezetésben. |
| `ekg.avf.st` | ST-eltérés — aVF [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) aVF elvezetésben. |
| `ekg.avf.t` | T-hullám — aVF |  | A T-hullám iránya és alakja a(z) aVF elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.avl.q` | Q-hullám mélysége — aVL [mV] |  | A Q-hullám amplitúdója a(z) aVL elvezetésben. |
| `ekg.avl.r` | R-amplitúdó — aVL [mV] |  | Az R-hullám amplitúdója a(z) aVL elvezetésben. |
| `ekg.avl.s` | S-amplitúdó — aVL [mV] |  | Az S-hullám amplitúdója a(z) aVL elvezetésben. |
| `ekg.avl.st` | ST-eltérés — aVL [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) aVL elvezetésben. |
| `ekg.avl.t` | T-hullám — aVL |  | A T-hullám iránya és alakja a(z) aVL elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.avr.q` | Q-hullám mélysége — aVR [mV] |  | A Q-hullám amplitúdója a(z) aVR elvezetésben. |
| `ekg.avr.r` | R-amplitúdó — aVR [mV] |  | Az R-hullám amplitúdója a(z) aVR elvezetésben. |
| `ekg.avr.s` | S-amplitúdó — aVR [mV] |  | Az S-hullám amplitúdója a(z) aVR elvezetésben. |
| `ekg.avr.st` | ST-eltérés — aVR [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) aVR elvezetésben. |
| `ekg.avr.t` | T-hullám — aVR |  | A T-hullám iránya és alakja a(z) aVR elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.axis` | QRS-tengely [deg] |  | A kamrai depolarizáció frontális tengelye. |
| `ekg.calibrationConfirmed` | A kalibráció megerősítve |  | A klinikus megerősítette a papírsebességet és az érzékenységet. |
| `ekg.gain` | Érzékenység [mm/mV] |  | A regisztrátum függőleges léptéke. |
| `ekg.i.q` | Q-hullám mélysége — I. [mV] |  | A Q-hullám amplitúdója a(z) I. elvezetésben. |
| `ekg.i.r` | R-amplitúdó — I. [mV] |  | Az R-hullám amplitúdója a(z) I. elvezetésben. |
| `ekg.i.s` | S-amplitúdó — I. [mV] |  | Az S-hullám amplitúdója a(z) I. elvezetésben. |
| `ekg.i.st` | ST-eltérés — I. [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) I. elvezetésben. |
| `ekg.i.t` | T-hullám — I. |  | A T-hullám iránya és alakja a(z) I. elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.ii.q` | Q-hullám mélysége — II. [mV] |  | A Q-hullám amplitúdója a(z) II. elvezetésben. |
| `ekg.ii.r` | R-amplitúdó — II. [mV] |  | Az R-hullám amplitúdója a(z) II. elvezetésben. |
| `ekg.ii.s` | S-amplitúdó — II. [mV] |  | Az S-hullám amplitúdója a(z) II. elvezetésben. |
| `ekg.ii.st` | ST-eltérés — II. [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) II. elvezetésben. |
| `ekg.ii.t` | T-hullám — II. |  | A T-hullám iránya és alakja a(z) II. elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.iii.q` | Q-hullám mélysége — III. [mV] |  | A Q-hullám amplitúdója a(z) III. elvezetésben. |
| `ekg.iii.r` | R-amplitúdó — III. [mV] |  | Az R-hullám amplitúdója a(z) III. elvezetésben. |
| `ekg.iii.s` | S-amplitúdó — III. [mV] |  | Az S-hullám amplitúdója a(z) III. elvezetésben. |
| `ekg.iii.st` | ST-eltérés — III. [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) III. elvezetésben. |
| `ekg.iii.t` | T-hullám — III. |  | A T-hullám iránya és alakja a(z) III. elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.narrative` | EKG — kiegészítő leírás |  | Amit a strukturált mezők nem fednek le. |
| `ekg.paperSpeed` | Papírsebesség [mm/s] |  | A regisztrátum vízszintes léptéke. |
| `ekg.pr` | PR-távolság [ms] |  | A P-hullám kezdetétől a QRS kezdetéig. |
| `ekg.qrs` | QRS-szélesség [ms] |  | A kamrai depolarizáció időtartama. |
| `ekg.qtc.bazett` | Korrigált QT (Bazett) [ms] |  | Bazett-korrekcióval számolt QT. |
| `ekg.qtc.fridericia` | Korrigált QT (Fridericia) [ms] |  | Fridericia-korrekcióval számolt QT. |
| `ekg.rate` | Kamrai frekvencia [/min] |  | A kamrai összehúzódások száma percenként. |
| `ekg.rhythm` | Alapritmus |  | Az EKG alapritmusa. |
| ↳ `sinus` | Sinusritmus |  | opció |
| ↳ `sinusTachy` | Sinus tachycardia |  | opció |
| ↳ `sinusBrady` | Sinus bradycardia |  | opció |
| ↳ `af` | Pitvarfibrilláció |  | opció |
| ↳ `aflutter` | Pitvarlebegés |  | opció |
| ↳ `svt` | Supraventricularis tachycardia |  | opció |
| ↳ `vt` | Kamrai tachycardia |  | opció |
| ↳ `paced` | Pacemaker-ritmus |  | opció |
| ↳ `junctional` | Junkcionális ritmus |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `ekg.s1q3t3` | S1Q3T3 mintázat |  | Az I. elvezetésben S-hullám, a III.-ban Q-hullám és negatív T. |
| `ekg.sgarbossa` | Sgarbossa-kritériumok |  | Az infarktus megítélése bal Tawara-szárblokk vagy pacemaker-ritmus mellett. |
| ↳ `none` | Egyik kritérium sem teljesül |  | opció |
| ↳ `concordantSTE` | Konkordáns ST-eleváció ≥ 1 mm |  | opció |
| ↳ `concordantSTD` | Konkordáns ST-depresszió V1–V3-ban ≥ 1 mm |  | opció |
| ↳ `discordant` | Kifejezett diszkordáns ST-eleváció |  | opció |
| `ekg.source` | A felvétel forrása |  | Hogyan került be a rendszerbe. |
| ↳ `native` | Natív digitális (DICOM waveform) |  | opció |
| ↳ `manual` | Kézi bevitel a papírról |  | opció |
| ↳ `image` | Kép-alapú felismerés (fotó vagy szkennelés) |  | opció |
| ↳ `pdf` | PDF-ből kinyerve |  | opció |
| `ekg.v1.q` | Q-hullám mélysége — V1 [mV] |  | A Q-hullám amplitúdója a(z) V1 elvezetésben. |
| `ekg.v1.r` | R-amplitúdó — V1 [mV] |  | Az R-hullám amplitúdója a(z) V1 elvezetésben. |
| `ekg.v1.s` | S-amplitúdó — V1 [mV] |  | Az S-hullám amplitúdója a(z) V1 elvezetésben. |
| `ekg.v1.st` | ST-eltérés — V1 [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) V1 elvezetésben. |
| `ekg.v1.t` | T-hullám — V1 |  | A T-hullám iránya és alakja a(z) V1 elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.v2.q` | Q-hullám mélysége — V2 [mV] |  | A Q-hullám amplitúdója a(z) V2 elvezetésben. |
| `ekg.v2.r` | R-amplitúdó — V2 [mV] |  | Az R-hullám amplitúdója a(z) V2 elvezetésben. |
| `ekg.v2.s` | S-amplitúdó — V2 [mV] |  | Az S-hullám amplitúdója a(z) V2 elvezetésben. |
| `ekg.v2.st` | ST-eltérés — V2 [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) V2 elvezetésben. |
| `ekg.v2.t` | T-hullám — V2 |  | A T-hullám iránya és alakja a(z) V2 elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.v3.q` | Q-hullám mélysége — V3 [mV] |  | A Q-hullám amplitúdója a(z) V3 elvezetésben. |
| `ekg.v3.r` | R-amplitúdó — V3 [mV] |  | Az R-hullám amplitúdója a(z) V3 elvezetésben. |
| `ekg.v3.s` | S-amplitúdó — V3 [mV] |  | Az S-hullám amplitúdója a(z) V3 elvezetésben. |
| `ekg.v3.st` | ST-eltérés — V3 [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) V3 elvezetésben. |
| `ekg.v3.t` | T-hullám — V3 |  | A T-hullám iránya és alakja a(z) V3 elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.v4.q` | Q-hullám mélysége — V4 [mV] |  | A Q-hullám amplitúdója a(z) V4 elvezetésben. |
| `ekg.v4.r` | R-amplitúdó — V4 [mV] |  | Az R-hullám amplitúdója a(z) V4 elvezetésben. |
| `ekg.v4.s` | S-amplitúdó — V4 [mV] |  | Az S-hullám amplitúdója a(z) V4 elvezetésben. |
| `ekg.v4.st` | ST-eltérés — V4 [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) V4 elvezetésben. |
| `ekg.v4.t` | T-hullám — V4 |  | A T-hullám iránya és alakja a(z) V4 elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.v5.q` | Q-hullám mélysége — V5 [mV] |  | A Q-hullám amplitúdója a(z) V5 elvezetésben. |
| `ekg.v5.r` | R-amplitúdó — V5 [mV] |  | Az R-hullám amplitúdója a(z) V5 elvezetésben. |
| `ekg.v5.s` | S-amplitúdó — V5 [mV] |  | Az S-hullám amplitúdója a(z) V5 elvezetésben. |
| `ekg.v5.st` | ST-eltérés — V5 [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) V5 elvezetésben. |
| `ekg.v5.t` | T-hullám — V5 |  | A T-hullám iránya és alakja a(z) V5 elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |
| `ekg.v6.q` | Q-hullám mélysége — V6 [mV] |  | A Q-hullám amplitúdója a(z) V6 elvezetésben. |
| `ekg.v6.r` | R-amplitúdó — V6 [mV] |  | Az R-hullám amplitúdója a(z) V6 elvezetésben. |
| `ekg.v6.s` | S-amplitúdó — V6 [mV] |  | Az S-hullám amplitúdója a(z) V6 elvezetésben. |
| `ekg.v6.st` | ST-eltérés — V6 [mV] |  | Az ST-szakasz eltérése az alapvonaltól a(z) V6 elvezetésben. |
| `ekg.v6.t` | T-hullám — V6 |  | A T-hullám iránya és alakja a(z) V6 elvezetésben. |
| ↳ `upright` | Pozitív |  | opció |
| ↳ `flat` | Lapos |  | opció |
| ↳ `inverted` | Negatív |  | opció |
| ↳ `biphasic` | Bifázisos |  | opció |
| ↳ `peaked` | Csúcsos |  | opció |

### Képalkotás és CTG `imaging`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `ctg.accel` | CTG gyorsulások |  | Legalább 15/min amplitúdójú, legalább 15 másodperces szívfrekvencia-emelkedések. |
| ↳ `pos` | Vannak |  | opció |
| ↳ `neg` | Nincsenek |  | opció |
| ↳ `unk` | Nem értékelhető |  | opció |
| `ctg.baseline` | CTG alapvonal [/min] |  | A magzati szívfrekvencia alapvonala: a görbe átlagos szintje legalább 10 perces szakaszon, gyorsulások és lass |
| `ctg.category` | CTG besorolás |  | A magzati szívfrekvencia-görbe összesített megítélése. |
| ↳ `normal` | Normál |  | opció |
| ↳ `suspicious` | Gyanús |  | opció |
| ↳ `pathological` | Kóros |  | opció |
| ↳ `preterminal` | Preterminális |  | opció |
| `ctg.decel` | CTG lassulások |  | A szívfrekvencia átmeneti csökkenései és típusuk. |
| ↳ `none` | Nincs |  | opció |
| ↳ `early` | Korai |  | opció |
| ↳ `variable` | Variábilis, nem ismétlődő |  | opció |
| ↳ `variableRepetitive` | Variábilis, ISMÉTLŐDŐ |  | opció |
| ↳ `lateRepetitive` | Késői, ISMÉTLŐDŐ |  | opció |
| ↳ `prolonged` | Elhúzódó (> 3 perc) |  | opció |
| `ctg.variability` | CTG variabilitás |  | Az alapvonal körüli oszcilláció amplitúdója. |
| ↳ `absent` | Hiányzó (< 5/min, > 50 percig) |  | opció |
| ↳ `reduced` | Csökkent (< 5/min, 30–50 percig) |  | opció |
| ↳ `normal` | Normális (5–25/min) |  | opció |
| ↳ `increased` | Fokozott (> 25/min, > 30 percig) |  | opció |
| ↳ `sinusoidal` | Sinusoidalis |  | opció |
| `img.alternativeConsidered` | Mérlegelt sugármentes alternatíva |  | Milyen sugármentes vizsgálat jött szóba, és miért nem az történt. |
| `img.contrast` | Kontrasztanyag |  | Milyen kontrasztanyagot kapott a beteg. |
| ↳ `none` | Nem kapott |  | opció |
| ↳ `iodinated` | Jódos (CT) |  | opció |
| ↳ `gadolinium` | Gadolínium (MR) |  | opció |
| ↳ `usContrast` | Ultrahangos kontraszt |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `img.doseEstimate` | Becsült effektív dózis [mSv] |  | A vizsgálat becsült effektív sugárdózisa. |
| `img.fetalDoseEstimate` | Becsült magzati dózis [mGy] |  | A magzatot érő becsült sugárdózis. |
| `img.hsg.cavity` | Méhűr alakja |  | A méhűr alakja a kontrasztos felvételen. |
| ↳ `normal` | Szabályos |  | opció |
| ↳ `septate` | Sövényes |  | opció |
| ↳ `bicornuate` | Kétszarvú |  | opció |
| ↳ `unicornuate` | Egyszarvú |  | opció |
| ↳ `tShaped` | T-alakú |  | opció |
| ↳ `fillingDefect` | Telődési hiány (polyp, myoma, összenövés) |  | opció |
| `img.hsg.spill` | Peritoneális szóródás |  | Kijut-e a kontrasztanyag a hasüregbe. |
| ↳ `bilateral` | Kétoldali |  | opció |
| ↳ `unilateral` | Egyoldali |  | opció |
| ↳ `none` | Nincs |  | opció |
| `img.hsg.tube.left` | Bal petevezeték átjárhatósága |  | Átjárható-e a bal oldali petevezeték. |
| ↳ `patent` | Átjárható |  | opció |
| ↳ `blocked` | Elzáródott |  | opció |
| ↳ `hydrosalpinx` | Hydrosalpinx |  | opció |
| ↳ `notAssessable` | Nem megítélhető |  | opció |
| `img.hsg.tube.right` | Jobb petevezeték átjárhatósága |  | Átjárható-e a jobb oldali petevezeték. |
| ↳ `patent` | Átjárható |  | opció |
| ↳ `blocked` | Elzáródott |  | opció |
| ↳ `hydrosalpinx` | Hydrosalpinx |  | opció |
| ↳ `notAssessable` | Nem megítélhető |  | opció |
| `img.indication` | A képalkotó vizsgálat indikációja |  | Miért történt a vizsgálat — kódolt indikációlistából. |
| ↳ `trauma` | Sérülés |  | opció |
| ↳ `pe` | Tüdőembólia gyanúja |  | opció |
| ↳ `acuteAbdomen` | Akut has |  | opció |
| ↳ `infection` | Fertőzés gócának keresése |  | opció |
| ↳ `oncologyStaging` | Daganat stádiumozása |  | opció |
| ↳ `oncologyFollowup` | Daganat követése |  | opció |
| ↳ `infertility` | Meddőségi kivizsgálás |  | opció |
| ↳ `screening` | Szűrés |  | opció |
| ↳ `fetalAnomaly` | Magzati eltérés tisztázása |  | opció |
| ↳ `preop` | Műtét előtti felmérés |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `img.mammography.birads` | Mammográfia BI-RADS besorolása |  | Az emlő képalkotó vizsgálatának összegző kategóriája. |
| ↳ `0` | 0 — kiegészítő vizsgálat szükséges |  | opció |
| ↳ `1` | 1 — negatív |  | opció |
| ↳ `2` | 2 — jóindulatú |  | opció |
| ↳ `3` | 3 — valószínűleg jóindulatú, rövid távú kontroll |  | opció |
| ↳ `4` | 4 — gyanús, szövettani mintavétel javasolt |  | opció |
| ↳ `5` | 5 — erősen malignitásra utaló |  | opció |
| ↳ `6` | 6 — szövettannal igazolt daganat |  | opció |
| `img.modality` | Vizsgálati módszer |  | Milyen képalkotó vizsgálat történt. |
| ↳ `xray` | Röntgen |  | opció |
| ↳ `mammography` | Mammográfia |  | opció |
| ↳ `hsg` | Hiszteroszalpingográfia |  | opció |
| ↳ `ct` | CT |  | opció |
| ↳ `mri` | MR |  | opció |
| ↳ `mriFetal` | Magzati MR |  | opció |
| ↳ `dexa` | Csontsűrűség-mérés |  | opció |
| ↳ `scintigraphy` | Izotópvizsgálat |  | opció |
| ↳ `fluoroscopy` | Átvilágítás |  | opció |
| `img.narrative` | Radiológiai lelet szövege |  | A radiológus leletének szövege. |
| `img.pregnancyStatusAtExam` | Terhességi státusz a vizsgálat idején |  | Terhes volt-e a beteg a felvétel készítésekor. |
| ↳ `no` | Nem terhes |  | opció |
| ↳ `yes` | Terhes |  | opció |
| ↳ `unknown` | Nem ismert |  | opció |
| ↳ `notApplicable` | Nem értelmezhető |  | opció |
| `img.radiationJustified` | A sugárterhelés indokoltsága rögzítve |  | Terhes betegnél megtörtént-e a mérlegelés dokumentálása. |
| `img.result` | Összefoglaló lelet |  | A vizsgálat összegzett eredménye. |
| ↳ `normal` | Eltérés nélkül |  | opció |
| ↳ `abnormalRelevant` | Az indikáció szempontjából eltérés |  | opció |
| ↳ `incidental` | Járulékos (véletlen) lelet |  | opció |
| ↳ `nonDiagnostic` | Nem értékelhető vizsgálat |  | opció |
| ↳ `pending` | Lelet folyamatban |  | opció |
| `us.afi` | Magzatvíz-index (AFI) [cm] |  | A négy negyedben mért legnagyobb magzatvíz-tócsák összege. |
| `us.breast` | Emlő-ultrahang |  | Az emlő és a hónalji nyirokcsomók ultrahangvizsgálata. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `us.breast.finding` | Emlő-ultrahang lelet |  | Mit mutat az emlő ultrahangvizsgálata. |
| ↳ `normal` | Eltérés nélkül |  | opció |
| ↳ `cyst` | Ciszta |  | opció |
| ↳ `fibroadenoma` | Fibroadenoma-szerű gócz |  | opció |
| ↳ `galactocele` | Galactocele |  | opció |
| ↳ `abscess` | Tályog |  | opció |
| ↳ `suspicious` | Malignitásra gyanús gócz |  | opció |
| ↳ `lymphNode` | Kóros hónalji nyirokcsomó |  | opció |
| `us.breast.side` | Emlő-ultrahang — melyik oldal |  | Melyik emlőben látható az eltérés. |
| ↳ `right` | Jobb |  | opció |
| ↳ `left` | Bal |  | opció |
| ↳ `both` | Mindkettő |  | opció |
| `us.cardiac.aorticRoot` | Aortagyök átmérője [mm] |  | Az aortagyök átmérője a Valsalva-sinus szintjén. |
| `us.cardiac.ef` | Bal kamrai ejekciós frakció [%] |  | A bal kamra pumpafunkciója. |
| `us.cardiac.lvot` | Bal kamrai kiáramlási gradiens [mm[Hg]] |  | A bal kamrai kiáramlási pálya csúcsgradiense. |
| `us.cardiac.paps` | Becsült pulmonalis nyomás [mm[Hg]] |  | A jobb kamra és a pitvar közti nyomáskülönbségből becsült szisztolés pulmonalis nyomás. |
| `us.cervicalLength` | Méhnyakhossz [mm] |  | A méhnyakcsatorna hossza hüvelyi ultrahanggal mérve. |
| `us.cpr` | Cerebro-placentáris arány [1] |  | A középső agyi artéria és a köldökartéria pulzatilitási indexének hányadosa. |
| `us.crl` | CRL — ülőmagasság [mm] |  | A magzat fej-far hossza. |
| `us.crl.first` | CRL — az első trimeszteri mérés [mm] |  | A terminus megállapításához használt, első trimeszterben mért ülőmagasság. |
| `us.dv.pi` | Ductus venosus PI [1] |  | A ductus venosus pulzatilitási indexe. |
| `us.endometrium.pattern` | Endometrium jellege |  | A méhnyálkahártya ultrahangos megjelenése. |
| ↳ `thin` | Vékony, egyenletes |  | opció |
| ↳ `trilaminar` | Háromrétegű |  | opció |
| ↳ `secretory` | Szekréciós, echodús |  | opció |
| ↳ `heterogeneous` | Egyenetlen |  | opció |
| ↳ `fluid` | Folyadék a cavumban |  | opció |
| ↳ `polypoid` | Polypoid képlet |  | opció |
| `us.endometrium.thickness` | Endometrium-vastagság [mm] |  | A méhnyálkahártya vastagsága sagittalis metszetben, mindkét réteggel. |
| `us.fast.result` | FAST-vizsgálat eredménye |  | Szabad folyadék a fókuszált sürgősségi ultrahangvizsgálaton. |
| ↳ `negative` | Negatív — szabad folyadék nem látható |  | opció |
| ↳ `positive` | Pozitív — szabad folyadék látható |  | opció |
| ↳ `indeterminate` | Nem megítélhető |  | opció |
| `us.fetal.sex` | Magzat neme |  | Az ultrahanggal megítélt magzati nem. |
| ↳ `female` | Leány |  | opció |
| ↳ `male` | Fiú |  | opció |
| ↳ `unknown` | Nem megítélhető |  | opció |
| ↳ `notDisclosed` | A szülő nem kéri a közlését |  | opció |
| `us.fetal.viability` | Magzati életjelenség |  | Észlelhető-e magzati szívműködés. |
| ↳ `present` | Szívműködés észlelhető |  | opció |
| ↳ `absent` | Szívműködés nem észlelhető |  | opció |
| ↳ `tooEarly` | Túl korai a megítéléshez |  | opció |
| ↳ `notApplicable` | Nem terhes |  | opció |
| `us.gs` | Petezsák átmérője [mm] |  | A gesztációs zsák átlagos belső átmérője. |
| `us.gyn` | Nőgyógyászati ultrahang |  | A kismedencei szervek ultrahangvizsgálata, jellemzően hüvelyi fejjel. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `abn` | Eltérés |  | opció |
| ↳ `lim` | Korlátozott vizsgálat |  | opció |
| ↳ `imp` | Nem vizsgálható |  | opció |
| `us.gyn.finding` | Ultrahang lelet |  | Mit mutat a kismedencei ultrahang. |
| ↳ `cyst` | Petefészek-ciszta |  | opció |
| ↳ `complexMass` | Összetett terime |  | opció |
| ↳ `myoma` | Myoma |  | opció |
| ↳ `adenomyosis` | Adenomyosis |  | opció |
| ↳ `endometrioma` | Endometrioma |  | opció |
| ↳ `hydrosalpinx` | Hydrosalpinx |  | opció |
| ↳ `thickEndometrium` | Megvastagodott méhnyálkahártya |  | opció |
| ↳ `iud` | Méhen belüli eszköz |  | opció |
| ↳ `emptyUterus` | Üres méhűr |  | opció |
| ↳ `adnexalRing` | Függelék-táji gyűrű (extrauterin gyanú) |  | opció |
| `us.gyn.freeFluid` | Szabad hasi folyadék |  | Látható-e szabad folyadék a Douglas-üregben. |
| ↳ `none` | Nincs |  | opció |
| ↳ `trace` | Nyomokban |  | opció |
| ↳ `moderate` | Közepes mennyiségű |  | opció |
| ↳ `large` | Nagy mennyiségű |  | opció |
| `us.hl` | Humerus hossza [mm] |  | A felkarcsont hossza. |
| `us.ivc.collapse` | Vena cava inferior kollapszus [%] |  | Az alsó üresvéna belégzési átmérőcsökkenése. |
| `us.lung.blines` | B-vonalak száma [1] |  | A tüdő-ultrahangon látható B-vonalak száma metszetenként. |
| `us.mca.pi` | Arteria cerebri media PI [1] |  | A középső agyi artéria pulzatilitási indexe. |
| `us.mca.psv` | Arteria cerebri media csúcssebesség [cm/s] |  | A középső agyi artéria szisztolés csúcssebessége. |
| `us.myoma.count` | Myomák száma [1] |  | A méhben látható myomák száma. |
| `us.myoma.figo` | Vezető myoma FIGO-típusa |  | A tünetek szempontjából meghatározó myoma elhelyezkedése a FIGO-beosztás szerint. |
| ↳ `0` | 0 — teljesen intracavitalis |  | opció |
| ↳ `1` | 1 — döntően intramuralis, < 50% submucosus |  | opció |
| ↳ `2` | 2 — > 50% intramuralis |  | opció |
| ↳ `3` | 3 — intramuralis, a nyálkahártyát érinti |  | opció |
| ↳ `4` | 4 — teljesen intramuralis |  | opció |
| ↳ `5` | 5 — subserosus, > 50% intramuralis |  | opció |
| ↳ `6` | 6 — subserosus, < 50% intramuralis |  | opció |
| ↳ `7` | 7 — subserosus, kocsányos |  | opció |
| ↳ `8` | 8 — egyéb (cervicalis, ligamentum) |  | opció |
| `us.narrative` | Ultrahang — kiegészítő leírás |  | Amit a strukturált mezők nem fednek le. |
| `us.nasalBone` | Orrcsont |  | Látható-e az orrcsont az I. trimeszterben. |
| ↳ `present` | Látható |  | opció |
| ↳ `absent` | Nem látható |  | opció |
| ↳ `notAssessable` | Nem megítélhető |  | opció |
| `us.nt` | Nyaki átlátszóság (NT) [mm] |  | A tarkótáji folyadékréteg vastagsága. |
| `us.ovary.afc.left` | Antralis tüszőszám — bal [1] |  | A bal petefészek 2–10 mm-es tüszőinek száma. |
| `us.ovary.afc.right` | Antralis tüszőszám — jobb [1] |  | A jobb petefészek 2–10 mm-es tüszőinek száma. |
| `us.placenta.accretaSigns` | Beékelődés (accreta) jelei |  | Látszanak-e a kóros lepénytapadás ultrahangos jelei. |
| ↳ `none` | Nincs |  | opció |
| ↳ `lacunae` | Lacunák a lepényben |  | opció |
| ↳ `lossOfClearZone` | A retroplacentáris tiszta zóna eltűnése |  | opció |
| ↳ `bladderInterrupt` | A hólyagfal vonalának megszakadása |  | opció |
| ↳ `hypervascular` | Fokozott érdússág a határon |  | opció |
| `us.placenta.site` | A lepény elhelyezkedése |  | Hol tapad a méhlepény. |
| ↳ `anterior` | Elülső fal |  | opció |
| ↳ `posterior` | Hátsó fal |  | opció |
| ↳ `fundal` | Fundus |  | opció |
| ↳ `lateral` | Oldalfal |  | opció |
| ↳ `lowLying` | Mélyen tapadó (a belső szájadéktól < 2 cm) |  | opció |
| ↳ `praevia` | Placenta praevia |  | opció |
| `us.pregnancy.location` | A terhesség elhelyezkedése |  | Hol helyezkedik el a terhesség. |
| ↳ `intrauterine` | Méhen belül |  | opció |
| ↳ `unknownLocation` | Ismeretlen lokalizációjú terhesség |  | opció |
| ↳ `tubal` | Petevezetékben |  | opció |
| ↳ `cervical` | Méhnyakban |  | opció |
| ↳ `cesareanScar` | Császármetszés hegében |  | opció |
| ↳ `interstitial` | Interstitialis |  | opció |
| ↳ `abdominal` | Hasüregi |  | opció |
| `us.sdp` | Legmélyebb magzatvíztasak [cm] |  | A legnagyobb magzatvíz-tócsa függőleges mélysége. |
| `us.subchorionic` | Subchorialis haematoma |  | Van-e vérgyülem a burok és a méhfal között. |
| ↳ `none` | Nincs |  | opció |
| ↳ `small` | Kicsi |  | opció |
| ↳ `moderate` | Közepes |  | opció |
| ↳ `large` | Nagy |  | opció |
| `us.tricuspid` | Tricuspidalis regurgitáció |  | Észlelhető-e visszaáramlás a háromhegyű billentyűn. |
| ↳ `absent` | Nincs |  | opció |
| ↳ `present` | Van |  | opció |
| ↳ `notAssessable` | Nem megítélhető |  | opció |
| `us.ua.enddiastolic` | Végdiasztolés áramlás a köldökartériában |  | Milyen az áramlás a szívciklus végén. |
| ↳ `present` | Jelen van |  | opció |
| ↳ `absent` | Hiányzik |  | opció |
| ↳ `reversed` | Megfordult |  | opció |
| `us.ua.pi` | Arteria umbilicalis PI [1] |  | A köldökartéria pulzatilitási indexe. |
| `us.uta.pi.left` | Arteria uterina PI — bal [1] |  | A bal oldali méhartéria pulzatilitási indexe. |
| `us.uta.pi.right` | Arteria uterina PI — jobb [1] |  | A jobb oldali méhartéria pulzatilitási indexe. |
| `us.ys` | Szikzsák átmérője [mm] |  | A szikzsák átmérője. |

### Labor `lab`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `lab.17ohp` | 17-OH-progeszteron [nmol/L] |  | 17-hidroxi-progeszteron a szérumban. |
| `lab.alp` | Alkalikus foszfatáz [U/L] |  | Alkalikus foszfatáz a szérumban. |
| `lab.alt` | ALT (GPT) [U/L] |  | Alanin-aminotranszferáz a szérumban. |
| `lab.amh` | AMH — anti-Müller-hormon [pmol/L] |  | Az ovariális rezerv jelzője. |
| `lab.antibodyScreen` | Ellenanyagszűrés |  | Irreguláris vörösvérsejt-ellenanyagok kimutatása. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| `lab.antithrombin` | Antitrombin aktivitás [%] |  | Az antitrombin funkcionális aktivitása. |
| `lab.antitpo` | Anti-TPO [k[IU]/L] |  | Pajzsmirigy-peroxidáz elleni antitest. |
| `lab.aptt` | APTI [s] |  | Aktivált parciális tromboplasztin idő. |
| `lab.bileAcids` | Epesavak [umol/L] |  | Az összes epesav szérumszintje. |
| `lab.bili.total` | Összbilirubin [umol/L] |  | A szérum összbilirubin-szintje. |
| `lab.bloodGroup.abo` | AB0 vércsoport |  | A beteg AB0 vércsoportja. |
| ↳ `A` | A |  | opció |
| ↳ `B` | B |  | opció |
| ↳ `AB` | AB |  | opció |
| ↳ `0` | 0 |  | opció |
| `lab.bloodGroup.rhd` | Rh(D) vércsoport |  | A beteg Rh(D) antigén-státusza. |
| ↳ `pos` | Rh(D) pozitív |  | opció |
| ↳ `neg` | Rh(D) negatív |  | opció |
| `lab.ca.total` | Összkalcium [mmol/L] |  | A szérum összkalcium-szintje. |
| `lab.chlamydia` | Chlamydia trachomatis NAAT |  | Chlamydia kimutatása nukleinsav-alapú módszerrel. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.cmv.igg` | CMV IgG |  | Cytomegalovirus elleni antitest (IgG). |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.cmv.igm` | CMV IgM |  | Friss CMV-fertőzésre utaló antitest. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.cortisol.am` | Reggeli kortizol [nmol/L] |  | A szérum kortizolszintje reggel. |
| `lab.crp` | C-reaktív fehérje [mg/L] |  | Gyulladásos akutfázis-fehérje a szérumban. |
| `lab.dheas` | DHEAS [umol/L] |  | Dehidroepiandroszteron-szulfát. |
| `lab.dimer` | D-dimer [mg/L{FEU}] |  | A fibrin bomlásterméke a szérumban. |
| `lab.e2` | Ösztradiol [pmol/L] |  | A szérum ösztradiol-szintje. |
| `lab.egfr` | Becsült GFR [mL/min/{1.73_m2}] |  | CKD-EPI 2021 egyenlettel becsült glomeruláris filtrációs ráta. |
| `lab.ferritin` | Ferritin [ug/L] |  | A vasraktárak jelzője. |
| `lab.fibrinogen` | Fibrinogén [g/L] |  | A szérum fibrinogén-szintje. |
| `lab.fsh` | FSH [[IU]/L] |  | Follikulus-stimuláló hormon. |
| `lab.ft3` | Szabad T3 [pmol/L] |  | A szabad trijód-tironin szérumszintje. |
| `lab.ft4` | Szabad T4 [pmol/L] |  | A szabad tiroxin szérumszintje. |
| `lab.gbs` | B-csoportú streptococcus szűrés |  | Hüvely- és végbélváladék tenyésztés GBS-re, a 35–37. héten. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.glucose.fasting` | Éhomi vércukor [mmol/L] |  | Az éhomi vérplazma glükózszintje. |
| `lab.gonorrhoea` | Neisseria gonorrhoeae NAAT |  | Gonorrhoea kimutatása nukleinsav-alapú módszerrel. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.hba1c` | HbA1c [%] |  | Glikált hemoglobin. |
| `lab.hbsag` | HBsAg |  | Hepatitis B felszíni antigén. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.hcg` | Szérum béta-hCG [[IU]/L] |  | A humán choriogonadotropin béta-alegységének szérumszintje. |
| `lab.hcv` | Anti-HCV |  | Hepatitis C elleni antitest. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.hgb` | Hemoglobin [g/L] |  | A vér hemoglobin-koncentrációja. |
| `lab.hiv` | HIV szűrés |  | HIV-1/2 antitest és p24 antigén. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.htc` | Hematokrit [%] |  | A vörösvérsejtek térfogataránya a vérben. |
| `lab.inr` | INR [1] |  | Nemzetközi normalizált arány (protrombin idő). |
| `lab.k` | Kálium [mmol/L] |  | A szérum káliumszintje. |
| `lab.lactate` | Laktát [mmol/L] |  | A vér laktátszintje. |
| `lab.ldh` | LDH [U/L] |  | Laktát-dehidrogenáz a szérumban. |
| `lab.lh` | LH [[IU]/L] |  | Luteinizáló hormon. |
| `lab.mcv` | MCV — átlagos vörösvérsejt-térfogat [fL] |  | A vörösvérsejtek átlagos térfogata. |
| `lab.mg` | Magnézium [mmol/L] |  | A szérum magnéziumszintje. |
| `lab.na` | Nátrium [mmol/L] |  | A szérum nátriumszintje. |
| `lab.ntprobnp` | NT-proBNP [pg/mL] |  | A kamrai falfeszülésre felszabaduló natriuretikus peptid N-terminális prohormonja. |
| `lab.ogtt.0` | OGTT — éhomi [mmol/L] |  | 75 g terheléses vércukor, éhomi érték. |
| `lab.ogtt.120` | OGTT — 120 perc [mmol/L] |  | 75 g terheléses vércukor, 2 órás érték. |
| `lab.ogtt.60` | OGTT — 60 perc [mmol/L] |  | 75 g terheléses vércukor, 1 órás érték. |
| `lab.plgf` | PlGF [ng/L] |  | Placentális növekedési faktor a szérumban. |
| `lab.prl` | Prolaktin [ug/L] |  | A szérum prolaktinszintje. |
| `lab.procalcitonin` | Prokalcitonin [ug/L] |  | A bakteriális fertőzés specifikusabb jelzője. |
| `lab.rbc` | Vörösvérsejtszám [10*12/L] |  | A keringő vörösvérsejtek száma. |
| `lab.rubella.igg` | Rubeola IgG |  | Rubeola elleni védettség. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.sflt.ratio` | sFlt-1 / PlGF arány [1] |  | A két praeeclampsia-marker hányadosa. |
| `lab.sflt1` | sFlt-1 [ng/L] |  | Szolubilis fms-szerű tirozin-kináz-1. |
| `lab.swab.vaginal` | Hüvelyváladék-tenyésztés |  | A hüvelyváladékból tenyésztéssel kimutatott kórokozó. |
| ↳ `neg` | Nem nőtt kórokozó |  | opció |
| ↳ `candida` | Candida |  | opció |
| ↳ `bv` | Bakteriális vaginosis mikrobiomja |  | opció |
| ↳ `trich` | Trichomonas |  | opció |
| ↳ `gbs` | B-csoportú streptococcus |  | opció |
| ↳ `aerobic` | Aerob vaginitis kórokozója |  | opció |
| ↳ `other` | Egyéb |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| `lab.syphilis` | Syphilis szűrés |  | Treponema-specifikus szerológia. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.testosterone.total` | Összes tesztoszteron [nmol/L] |  | A szérum összes tesztoszteron-szintje. |
| `lab.toxo.igg` | Toxoplasma IgG |  | Toxoplasma elleni antitest (IgG). |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.toxo.igm` | Toxoplasma IgM |  | Friss toxoplasma-fertőzésre utaló antitest. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| ↳ `equiv` | Határérték |  | opció |
| ↳ `pending` | Folyamatban |  | opció |
| ↳ `notDone` | Nem történt |  | opció |
| `lab.trak` | TRAK (TSH-receptor elleni antitest) [[IU]/L] |  | A TSH-receptor elleni antitest szintje. |
| `lab.troponin.hs` | Nagy érzékenységű troponin [ng/L] |  | A szívizomsejt-károsodás keringő jelzője, nagy érzékenységű módszerrel mérve. |
| `lab.tsh` | TSH [m[IU]/L] |  | Pajzsmirigy-stimuláló hormon a szérumban. |
| `lab.ua` | Húgysav [umol/L] |  | A szérum húgysavszintje. |
| `lab.urea` | Karbamid [mmol/L] |  | A szérum karbamid-nitrogén szintje. |
| `lab.urine.blood` | Vizelet vér (gyorsteszt) |  | A vizelet vértartalma tesztcsíkkal. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `trace` | Nyomokban |  | opció |
| ↳ `plus1` | + |  | opció |
| ↳ `plus2` | ++ |  | opció |
| ↳ `plus3` | +++ |  | opció |
| ↳ `plus4` | ++++ |  | opció |
| `lab.urine.leukocyte` | Vizelet fehérvérsejt-észteráz |  | A vizelet gyulladásos sejtjeire utaló tesztcsík-reakció. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `trace` | Nyomokban |  | opció |
| ↳ `plus1` | + |  | opció |
| ↳ `plus2` | ++ |  | opció |
| ↳ `plus3` | +++ |  | opció |
| ↳ `plus4` | ++++ |  | opció |
| `lab.urine.nitrite` | Vizelet nitrit |  | Baktériumok által termelt nitrit a vizeletben. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `pos` | Pozitív |  | opció |
| `lab.urine.protein` | Vizelet fehérje (gyorsteszt) |  | A vizelet fehérjetartalma tesztcsíkkal. |
| ↳ `neg` | Negatív |  | opció |
| ↳ `trace` | Nyomokban |  | opció |
| ↳ `plus1` | + |  | opció |
| ↳ `plus2` | ++ |  | opció |
| ↳ `plus3` | +++ |  | opció |
| ↳ `plus4` | ++++ |  | opció |
| `lab.wbc` | Fehérvérsejtszám [10*9/L] |  | A keringő fehérvérsejtek száma. |
| `lab.wbc.diff.neut` | Neutrofil granulocyta arány [%] |  | A neutrofil granulocyták aránya a fehérvérsejteken belül. |

### Magzati biometria `vizsgalatok`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `us.ac` | Haskörfogat [mm] |  | Ultrahangos haskörfogat mérés. |
| `us.bpd` | Biparietális átmérő [mm] |  | Ultrahangos biparietális átmérő mérés. |
| `us.efw` | Becsült magzati súly [g] |  | Ultrahangos biometriából becsült magzati súly. |
| `us.efw.ig21` | Becsült magzati súly (INTERGROWTH-21st) [g] |  | Becsült magzati súly az INTERGROWTH-21st modell szerint (Stirnemann 2017). |
| `us.fl` | Combcsonthossz [mm] |  | Ultrahangos combcsonthossz mérés. |
| `us.ga.crl` | Gesztációs kor CRL-ből (INTERGROWTH-21st) [wk] |  | Ultrahangos datálás a korai terhességben mért CRL-ből. |
| `us.ga.hc` | Gesztációs kor fejkörfogatból (csak FL hiányában) [wk] |  | Másodlagos datálási módszer a késői terhességben. |
| `us.ga.hcfl` | Gesztációs kor HC-ből és FL-ből (INTERGROWTH-21st) [wk] |  | Ultrahangos datálás a második-harmadik trimeszterben. |
| `us.hc` | Fejkörfogat [mm] |  | Ultrahangos fejkörfogat mérés. |
| `us.ofd` | Occipitofrontális átmérő [mm] |  | Ultrahangos occipitofrontális (elülső-hátulsó) fejátmérő. |

### Kardiológia `cardio`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `cardio.kardiologiai.idopont` | Szülés utáni kardiológiai kontroll időpontja |  | A gyermekágyi kardiológiai átadás rögzített időpontja. |
| `cardio.mwho` | Anyai kardiovaszkuláris kockázat (mWHO) |  | A terhesség anyai kardiovaszkuláris kockázatának besorolása a módosított WHO-osztályozás szerint. |
| ↳ `I` | I. — nem kimutathatóan emelkedett |  | opció |
| ↳ `II` | II. — kismértékben emelkedett |  | opció |
| ↳ `II-III` | II–III. — köztes |  | opció |
| ↳ `III` | III. — jelentősen emelkedett |  | opció |
| ↳ `IV` | IV. — rendkívül magas |  | opció |
| ↳ `nemBesorolhato` | Nem besorolható — hiányzik a mérés |  | opció |
| `cardio.nyha` | NYHA funkcionális osztály |  | A szívelégtelenség tüneteinek terhelhetőség szerinti besorolása. |
| ↳ `I` | I. — a szokásos terhelés nem okoz panaszt |  | opció |
| ↳ `II` | II. — a szokásos terhelés panaszt okoz |  | opció |
| ↳ `III` | III. — a szokásosnál kisebb terhelés is panaszt okoz |  | opció |
| ↳ `IV` | IV. — nyugalomban is panasz |  | opció |
| `cardio.szivbetegseg.allapot` | Ismert szívbetegség — állapot az mWHO-táblából |  | Melyik mWHO-táblabeli állapot áll fenn. A konkrét kódot a registry/belgyogyaszat/mwho.json adja. |
| ↳ `nincs` | Nincs ismert szívbetegség |  | opció |
| ↳ `ismeretlen` | Nem tudjuk |  | opció |
| ↳ `tablabol` | Az mWHO-tábla egyik állapota (a kód a táblából jön) |  | opció |
| `echo.aorta.atmero` | Aortagyök / ascendens átmérő [mm] |  | Az aorta legnagyobb átmérője szívultrahanggal vagy keresztmetszeti képalkotással. |
| `echo.aorta.gradiens` | Aortabillentyű maximális gradiens [mm[Hg]] |  | A bal kamra és az aorta közti nyomáskülönbség csúcsértéke. |
| `echo.lvef` | Balkamrai ejekciós frakció [%] |  | A bal kamra szisztolés funkciója szívultrahanggal mérve. |
| `echo.mitralis.terulet` | Mitralis szájadék területe [cm2] |  | A mitralis billentyű nyílásfelszíne szívultrahanggal. |
| `echo.pap` | Becsült szisztolés pulmonalis artériás nyomás [mm[Hg]] |  | A tricuspidalis regurgitáció sebességéből becsült pulmonalis nyomás. |

### Ellátástervezés `plan`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `plan.bf.intention` | Szoptatási szándék |  | Amit a beteg a terhesség alatt tervez. |
| ↳ `exclusive` | Kizárólagos szoptatást tervez |  | opció |
| ↳ `mixed` | Vegyes táplálást tervez |  | opció |
| ↳ `formula` | Tápszeres táplálást tervez |  | opció |
| ↳ `undecided` | Még nem döntött |  | opció |
| `plan.bf.previousExperience` | Korábbi szoptatási tapasztalat |  | Hogyan alakult a szoptatás a korábbi gyermekeknél. |
| ↳ `none` | Nem volt korábbi szoptatás |  | opció |
| ↳ `successful` | Problémamentes |  | opció |
| ↳ `difficult` | Nehézségekkel járt |  | opció |
| ↳ `unable` | Nem sikerült |  | opció |
| `plan.birth.companion` | Kísérő a szülésnél |  | Ki lehet jelen a szülésnél a beteg kérése szerint. |
| ↳ `partner` | Partner |  | opció |
| ↳ `relative` | Más hozzátartozó |  | opció |
| ↳ `doula` | Dúla |  | opció |
| ↳ `none` | Nem kér kísérőt |  | opció |
| `plan.birth.cordClamping` | Köldökzsinór-ellátás terve |  | A tervezett köldökzsinór-ellátás. |
| ↳ `delayed` | Késleltetett lefogás (legalább 1 perc) |  | opció |
| ↳ `immediate` | Azonnali lefogás |  | opció |
| ↳ `milking` | Köldökzsinór-fejés |  | opció |
| `plan.birth.painRelief` | Tervezett fájdalomcsillapítás |  | Amit a beteg a szülési tervben megjelölt. |
| ↳ `none` | Gyógyszermentes |  | opció |
| ↳ `nonPharm` | Nem gyógyszeres módszerek (mozgás, víz, masszázs) |  | opció |
| ↳ `n2o` | Nitrogén-oxidul |  | opció |
| ↳ `opioid` | Opioid |  | opció |
| ↳ `epidural` | Epidurális érzéstelenítés |  | opció |
| ↳ `undecided` | Még nem döntött |  | opció |
| `plan.birth.position` | Kívánt szülési testhelyzet |  | Amit a beteg a szülési tervben megjelölt. |
| ↳ `free` | Szabad testhelyzetválasztás |  | opció |
| ↳ `upright` | Függőleges (álló, guggoló, térdelő) |  | opció |
| ↳ `sideLying` | Oldalfekvő |  | opció |
| ↳ `supine` | Hanyatt |  | opció |
| ↳ `water` | Vízben |  | opció |
| `plan.birth.skinToSkin` | Bőr-bőr kontaktus kérése |  | Kéri-e a beteg az azonnali bőr-bőr kontaktust. |
| `plan.consult.declined` | Elutasított konzílium-javallat indoklása |  | Ha egy automatikus konzílium-javallat nem valósul meg, itt az indok. |
| `plan.consult.requested` | Kért konzíliumok |  | Mely konzíliumok kérése történt meg. |
| ↳ `seniorObstetric` | Szülész szakorvosi (senior) |  | opció |
| ↳ `cardiology` | Terhes-kardiológia |  | opció |
| ↳ `diabetology` | Diabetológia |  | opció |
| ↳ `psychiatry` | Pszichiátria |  | opció |
| ↳ `genetics` | Klinikai genetika |  | opció |
| ↳ `dietetics` | Dietetika |  | opció |
| ↳ `anaesthesiology` | Aneszteziológia |  | opció |
| ↳ `haematology` | Haematológia |  | opció |
| ↳ `neonatology` | Neonatológia |  | opció |
| ↳ `oncology` | Onkológia |  | opció |
| `plan.contraception.method` | Tervezett szülés utáni fogamzásgátlás |  | A szülés utáni fogamzásgátlás megbeszélt módszere. |
| ↳ `none` | Nem tervez |  | opció |
| ↳ `lam` | Laktációs amenorrhoea (LAM) |  | opció |
| ↳ `pop` | Csak gesztagént tartalmazó tabletta |  | opció |
| ↳ `coc` | Kombinált hormonális |  | opció |
| ↳ `implant` | Implantátum |  | opció |
| ↳ `iud.cu` | Réztartalmú méhen belüli eszköz |  | opció |
| ↳ `iud.lng` | Levonorgesztrelt tartalmazó méhen belüli eszköz |  | opció |
| ↳ `barrier` | Barrier |  | opció |
| ↳ `sterilisation` | Sterilizáció |  | opció |
| ↳ `undecided` | Még nem döntött |  | opció |
| `plan.contraception.timing` | A fogamzásgátlás tervezett indítása |  | Mikor kezdődjön a választott módszer. |
| ↳ `immediate` | Közvetlenül a szülés után (48 órán belül) |  | opció |
| ↳ `week3` | 3. hét után |  | opció |
| ↳ `week6` | 6. hét után |  | opció |
| ↳ `later` | Később |  | opció |
| `plan.delivery.intendedMode` | Tervezett szülésmód |  | A megbeszélt, dokumentált szülésmód-terv. |
| ↳ `vaginal` | Hüvelyi szülés |  | opció |
| ↳ `tolac` | Hüvelyi szülés császármetszés után (TOLAC) |  | opció |
| ↳ `electiveCs` | Elektív ismételt császármetszés |  | opció |
| ↳ `primaryCs` | Elsődleges császármetszés (javallattal) |  | opció |
| ↳ `undecided` | Még nincs eldöntve |  | opció |
| `plan.delivery.optionsDiscussed` | A szülés módjánál megbeszélt lehetőségek |  | Mely szülésmódok kerültek szóba, és milyen kockázatokkal. |
| `plan.delivery.patientPreference` | A beteg preferenciája a szülésmódról |  | Amit a beteg maga szeretne — a szakmai javaslattól függetlenül rögzítve. |
| ↳ `vaginal` | Hüvelyi szülést szeretne |  | opció |
| ↳ `cs` | Császármetszést szeretne |  | opció |
| ↳ `noPreference` | Nincs határozott preferenciája |  | opció |
| ↳ `undecided` | Még gondolkodik |  | opció |
| `plan.delivery.rationale` | A szülésmód-döntés indoklása |  | Miért ez a terv — a szakmai és a beteg-oldali szempontok együtt. |
| `plan.delivery.sharedDecision` | Megosztott döntéshozatal megtörtént |  | Megtörtént-e a szülésmódról szóló tájékoztató beszélgetés. |
| `plan.emergency.given` | Sürgősségi terv átadva |  | Megkapta-e a beteg írásban, mikor kell azonnal jelentkeznie. |
| `plan.emergency.language` | A sürgősségi terv nyelve |  | Milyen nyelven kapta meg a beteg a sürgősségi tervet. |
| ↳ `hu` | Magyar |  | opció |
| ↳ `en` | Angol |  | opció |
| ↳ `other` | Egyéb |  | opció |
| ↳ `notUnderstood` | A beteg nyelvén nem állt rendelkezésre |  | opció |
| `plan.institution.tolacCapable` | Az intézmény TOLAC-feltételei adottak |  | 24 órás aneszteziológiai háttér és azonnali császármetszés lehetősége. |
| ↳ `pos` | Adottak |  | opció |
| ↳ `neg` | Nem adottak |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `plan.nextVisit.at` | Következő vizit időpontja |  | A ténylegesen megbeszélt következő időpont. |
| `plan.nextVisit.rationale` | Eltérés a vizitrendtől — indoklás |  | Miért tér el a megbeszélt időpont a protokoll szerintitől. |
| `plan.protocolVersion` | A gondozási protokoll verziója |  | Melyik gondozási protokoll szerint készült a vizitrend. |
| `plan.reviewedAt` | A terv felülvizsgálatának ideje |  | Mikor nézték át utoljára a tervet egészében. |

### Műtét `op`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `op.cs.adhesions` | Összenövések |  | Milyen mértékű összenövéseket találtunk. |
| ↳ `none` | Nincs |  | opció |
| ↳ `mild` | Enyhe |  | opció |
| ↳ `moderate` | Közepes |  | opció |
| ↳ `severe` | Kiterjedt |  | opció |
| `op.cs.placenta` | A lepény eltávolítása |  | Hogyan távolítottuk el a lepényt. |
| ↳ `spontaneous` | Spontán, kontrollált zsinórhúzással |  | opció |
| ↳ `manual` | Kézi lefejtés |  | opció |
| ↳ `adherent` | Tapadó lepény, nehezített eltávolítás |  | opció |
| ↳ `accreta` | Beékelődött lepény |  | opció |
| `op.cs.prevScar` | A korábbi heg állapota |  | Milyen állapotban találtuk az előző császármetszés hegét. |
| ↳ `intact` | Ép |  | opció |
| ↳ `thin` | Elvékonyodott |  | opció |
| ↳ `dehiscence` | Szétvált (dehiscentia) |  | opció |
| ↳ `rupture` | Megrepedt |  | opció |
| ↳ `notApplicable` | Nem volt korábbi metszés |  | opció |
| `op.cs.uterotomy` | Uterotomia típusa |  | Hogyan nyitottuk meg a méhet. |
| ↳ `lowTransverse` | Alsó harántmetszés |  | opció |
| ↳ `lowVertical` | Alsó hosszmetszés |  | opció |
| ↳ `classical` | Klasszikus (test) metszés |  | opció |
| ↳ `inverted-T` | Fordított T |  | opció |
| ↳ `J` | J-metszés |  | opció |
| `op.intra.anesthesia` | Érzéstelenítés típusa |  | Milyen érzéstelenítésben történt a beavatkozás. |
| ↳ `spinal` | Spinális |  | opció |
| ↳ `epidural` | Epidurális |  | opció |
| ↳ `cse` | Kombinált spinális-epidurális |  | opció |
| ↳ `general` | Általános |  | opció |
| ↳ `local` | Helyi |  | opció |
| ↳ `sedation` | Szedáció |  | opció |
| `op.intra.approach` | Behatolás |  | Milyen úton történt a behatolás. |
| ↳ `pfannenstiel` | Pfannenstiel |  | opció |
| ↳ `joelCohen` | Joel-Cohen |  | opció |
| ↳ `midline` | Median laparotomia |  | opció |
| ↳ `laparoscopy` | Laparoszkópia |  | opció |
| ↳ `vaginal` | Hüvelyi |  | opció |
| ↳ `hysteroscopy` | Hiszteroszkópia |  | opció |
| ↳ `robotic` | Robotasszisztált |  | opció |
| `op.intra.closure` | Zárás |  | Hogyan történt a zárás, milyen varróanyaggal. |
| `op.intra.closureAt` | A zárás befejezése |  | Mikor fejeződött be a műtét. |
| `op.intra.complication` | Intraoperatív szövődmény |  | Történt-e szövődmény a műtét során. |
| ↳ `none` | Nem |  | opció |
| ↳ `hemorrhage` | Jelentős vérzés |  | opció |
| ↳ `bladderInjury` | Hólyagsérülés |  | opció |
| ↳ `ureterInjury` | Ureter-sérülés |  | opció |
| ↳ `bowelInjury` | Bélsérülés |  | opció |
| ↳ `hysterectomy` | Méheltávolítás |  | opció |
| ↳ `anesthetic` | Aneszteziológiai szövődmény |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `op.intra.deliveryAt` | A magzat kiemelésének időpontja |  | Mikor emelték ki a magzatot. |
| `op.intra.drain` | Drén |  | Helyeztek-e be drént. |
| ↳ `none` | Nem |  | opció |
| ↳ `subfascial` | Fascia alatti |  | opció |
| ↳ `subcutaneous` | Bőr alatti |  | opció |
| ↳ `intraabdominal` | Hasűri |  | opció |
| `op.intra.findings` | Műtéti lelet |  | Amit a műtét során találtunk. |
| `op.intra.incisionAt` | Bemetszés időpontja |  | Mikor történt a bemetszés. |
| `op.intra.qbl` | Műtéti vérvesztés (mért) [mL] |  | A műtét során mért vérvesztés. |
| `op.intra.steps` | Az elvégzett lépések |  | A beavatkozás menete lépésenként. |
| `op.post.complication` | Posztoperatív szövődmény |  | Történt-e szövődmény a műtét után. |
| ↳ `none` | Nem |  | opció |
| ↳ `infection` | Sebfertőzés |  | opció |
| ↳ `endometritis` | Endometritis |  | opció |
| ↳ `bleeding` | Utóvérzés |  | opció |
| ↳ `vte` | Thromboembolia |  | opció |
| ↳ `ileus` | Bélparalízis |  | opció |
| ↳ `readmission` | Visszavétel |  | opció |
| `op.post.mobilization` | Mobilizáció |  | Mikor kelt fel először a beteg. |
| ↳ `within6h` | 6 órán belül |  | opció |
| ↳ `within24h` | 24 órán belül |  | opció |
| ↳ `later` | 24 óra után |  | opció |
| ↳ `bedrest` | Ágynyugalom elrendelve |  | opció |
| `op.post.vte.prophylaxis` | VTE-profilaxis |  | Milyen thrombosis-megelőzés indult. |
| ↳ `none` | Nem indokolt |  | opció |
| ↳ `mechanical` | Csak mechanikus (harisnya, kompresszió) |  | opció |
| ↳ `lmwh` | Kis molekulatömegű heparin |  | opció |
| ↳ `both` | Gyógyszeres és mechanikus együtt |  | opció |
| ↳ `omitted` | Indokolt lett volna, de elmaradt |  | opció |
| `op.post.vte.startedAt` | A VTE-profilaxis kezdete |  | Mikor kapta a beteg az első adagot. |
| `op.post.wound` | Sebállapot |  | A műtéti seb ellenőrzésének lelete. |
| ↳ `clean` | Ép, száraz |  | opció |
| ↳ `erythema` | Bőrpír a seb körül |  | opció |
| ↳ `discharge` | Váladékozó |  | opció |
| ↳ `dehiscence` | Szétnyílt |  | opció |
| ↳ `hematoma` | Haematoma |  | opció |
| `op.pre.antibiotic.timing` | Antibiotikus profilaxis időzítése |  | Mikor kapta a beteg a profilaktikus antibiotikumot. |
| ↳ `before` | A bemetszés előtt 30–60 perccel |  | opció |
| ↳ `atIncision` | A bemetszéskor |  | opció |
| ↳ `afterCordClamp` | A köldökzsinór lefogása után |  | opció |
| ↳ `none` | Nem kapott |  | opció |
| ↳ `notIndicated` | Nem indokolt |  | opció |
| `op.pre.anticoag.lastDose` | Utolsó antikoaguláns adag |  | Mikor kapta a beteg az utolsó véralvadásgátló adagot. |
| `op.pre.asa` | ASA fizikai státusz |  | A beteg általános állapotának aneszteziológiai besorolása. |
| ↳ `1` | I — egészséges |  | opció |
| ↳ `2` | II — enyhe szisztémás betegség |  | opció |
| ↳ `3` | III — súlyos szisztémás betegség |  | opció |
| ↳ `4` | IV — súlyos, életet veszélyeztető szisztémás betegség |  | opció |
| ↳ `5` | V — moribund beteg |  | opció |
| ↳ `6` | VI — agyhalott donor |  | opció |
| `op.pre.bloodUnitsReady` | Előkészített vérkészítmény [1] |  | Hány egység vörösvértest-koncentrátum áll készen. |
| `op.pre.consent` | Tájékozott beleegyezés megtörtént |  | Aláírta-e a beteg a tájékozott beleegyezést. |
| `op.pre.consent.discussedRisks` | Megbeszélt kockázatok |  | Milyen kockázatokról tájékoztattuk a beteget. |
| `op.pre.fastingSince` | Utolsó étkezés időpontja |  | Mikor evett vagy ivott utoljára a beteg. |
| `op.pre.urgency` | Sürgősség |  | Mennyire sürgős a beavatkozás. |
| ↳ `1` | 1 — azonnali: anyai vagy magzati életveszély |  | opció |
| ↳ `2` | 2 — sürgős: anyai vagy magzati veszélyeztetettség, de nem közvetlen |  | opció |
| ↳ `3` | 3 — korai: befejezés szükséges, de nincs veszélyeztetettség |  | opció |
| ↳ `4` | 4 — elektív: a nőnek és a csapatnak megfelelő időben |  | opció |
| `op.procedure` | Elvégzett beavatkozás |  | Melyik beavatkozás történt — a beavatkozási törzsből. |
| ↳ `proc.adnexectomy` | Függelék eltávolítása |  | opció |
| ↳ `proc.bartholin` | Bartholin-ciszta marsupialisatiója |  | opció |
| ↳ `proc.cerclage` | Méhszáj-körülöltés (cerclage) |  | opció |
| ↳ `proc.conization` | Méhnyak-konizáció |  | opció |
| ↳ `proc.cs.elective` | Tervezett császármetszés |  | opció |
| ↳ `proc.cs.emergency` | Sürgős császármetszés |  | opció |
| ↳ `proc.cs.hysterectomy` | Császármetszés méheltávolítással |  | opció |
| ↳ `proc.curettage` | Méhűri kaparás |  | opció |
| ↳ `proc.embryo.transfer` | Embrió-beültetés |  | opció |
| ↳ `proc.forceps` | Fogóműtét |  | opció |
| ↳ `proc.hysterectomy.abdominal` | Hasi méheltávolítás |  | opció |
| ↳ `proc.hysterectomy.laparoscopic` | Laparoszkópos méheltávolítás |  | opció |
| ↳ `proc.hysterectomy.vaginal` | Hüvelyi méheltávolítás |  | opció |
| ↳ `proc.hysteroscopy.diagnostic` | Diagnosztikus hiszteroszkópia |  | opció |
| ↳ `proc.hysteroscopy.operative` | Műtéti hiszteroszkópia |  | opció |
| ↳ `proc.iud.insertion` | Méhen belüli eszköz behelyezése |  | opció |
| ↳ `proc.laparoscopy.cystectomy` | Petefészek-ciszta laparoszkópos eltávolítása |  | opció |
| ↳ `proc.laparoscopy.diagnostic` | Diagnosztikus laparoszkópia |  | opció |
| ↳ `proc.laparoscopy.ectopic` | Méhen kívüli terhesség laparoszkópos ellátása |  | opció |
| ↳ `proc.leep` | LLETZ / hurokkimetszés |  | opció |
| ↳ `proc.myomectomy` | Myoma eltávolítása |  | opció |
| ↳ `proc.oocyte.retrieval` | Petesejt-leszívás |  | opció |
| ↳ `proc.other` | Egyéb beavatkozás |  | opció |
| ↳ `proc.perineal.repair` | Gátsérülés ellátása |  | opció |
| ↳ `proc.vacuum` | Vákuum-extrakció |  | opció |
| `op.who.signIn.airway` | WHO — Nehéz légút vagy aspirációs kockázat felmérve |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: nehéz légút vagy aspirációs kockázat felmérve. |
| `op.who.signIn.allergy` | WHO — Ismert allergia egyeztetve |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: ismert allergia egyeztetve. |
| `op.who.signIn.anesthesia` | WHO — Az aneszteziológiai gép és gyógyszerek ellenőrizve |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: az aneszteziológiai gép és gyógyszerek ellenőrizve. |
| `op.who.signIn.bloodLoss` | WHO — Várható vérvesztés és vérkészítmény-igény egyeztetve |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: várható vérvesztés és vérkészítmény-igény egyeztetve |
| `op.who.signIn.completedAt` | WHO Bejelentkezés (érzéstelenítés előtt) — időbélyeg |  | Mikor zárult le a(z) „Bejelentkezés (érzéstelenítés előtt)” fázis. |
| `op.who.signIn.identity` | WHO — A beteg azonossága, a beavatkozás és a beleegyezés megerősítve |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: a beteg azonossága, a beavatkozás és a beleegyezés m |
| `op.who.signIn.pulseOx` | WHO — Pulzoximéter a betegen és működik |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: pulzoximéter a betegen és működik. |
| `op.who.signIn.site` | WHO — A műtéti terület megjelölve, ha releváns |  | A(z) „Bejelentkezés (érzéstelenítés előtt)” fázis tétele: a műtéti terület megjelölve, ha releváns. |
| `op.who.signOut.completedAt` | WHO Kijelentkezés (a beteg elhagyása előtt) — időbélyeg |  | Mikor zárult le a(z) „Kijelentkezés (a beteg elhagyása előtt)” fázis. |
| `op.who.signOut.counts` | WHO — Eszköz-, tű- és törlőszám egyezik |  | A(z) „Kijelentkezés (a beteg elhagyása előtt)” fázis tétele: eszköz-, tű- és törlőszám egyezik. |
| `op.who.signOut.equipmentIssues` | WHO — Eszközhiba vagy probléma jelezve |  | A(z) „Kijelentkezés (a beteg elhagyása előtt)” fázis tétele: eszközhiba vagy probléma jelezve. |
| `op.who.signOut.procedureName` | WHO — A ténylegesen elvégzett beavatkozás rögzítve |  | A(z) „Kijelentkezés (a beteg elhagyása előtt)” fázis tétele: a ténylegesen elvégzett beavatkozás rögzítve. |
| `op.who.signOut.recoveryPlan` | WHO — A felépülés és az ellátás fő szempontjai egyeztetve |  | A(z) „Kijelentkezés (a beteg elhagyása előtt)” fázis tétele: a felépülés és az ellátás fő szempontjai egyeztet |
| `op.who.signOut.specimen` | WHO — A minta megjelölve, a beteg nevével |  | A(z) „Kijelentkezés (a beteg elhagyása előtt)” fázis tétele: a minta megjelölve, a beteg nevével. |
| `op.who.timeOut.anesthesiaConcerns` | WHO — Az aneszteziológus elmondta a beteg-specifikus aggályokat |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: az aneszteziológus elmondta a beteg-specifikus aggályokat. |
| `op.who.timeOut.completedAt` | WHO Időkérés (bemetszés előtt) — időbélyeg |  | Mikor zárult le a(z) „Időkérés (bemetszés előtt)” fázis. |
| `op.who.timeOut.confirmPatient` | WHO — A beteg, a beavatkozás és a terület hangosan megerősítve |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: a beteg, a beavatkozás és a terület hangosan megerősítve. |
| `op.who.timeOut.criticalSteps` | WHO — A sebész elmondta a kritikus lépéseket és a várható időt |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: a sebész elmondta a kritikus lépéseket és a várható időt. |
| `op.who.timeOut.imaging` | WHO — A szükséges képalkotó felvételek megjelenítve |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: a szükséges képalkotó felvételek megjelenítve. |
| `op.who.timeOut.introductions` | WHO — A csapat tagjai bemutatkoztak, név és szerep |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: a csapat tagjai bemutatkoztak, név és szerep. |
| `op.who.timeOut.nursingConcerns` | WHO — A műtősnő megerősítette a sterilitást és az eszközöket |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: a műtősnő megerősítette a sterilitást és az eszközöket. |
| `op.who.timeOut.prophylaxis` | WHO — Az antibiotikus profilaxis 60 percen belül megtörtént |  | A(z) „Időkérés (bemetszés előtt)” fázis tétele: az antibiotikus profilaxis 60 percen belül megtörtént. |

### Neonatológia `neo`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `neo.dextroseGel.dose` | 40% dextróz gél adag [mL] |  | A buccalisan adandó 40%-os dextróz gél adagja hypoglykaemiában. |
| `neo.glucose` | Újszülött vércukor [mmol/L] |  | Az újszülött vércukorértéke. |
| `neo.latch.audible` | LATCH — hallható nyelés |  | A LATCH-skála második tétele (A). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `neo.latch.comfort` | LATCH — kényelem |  | A LATCH-skála negyedik tétele (C). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `neo.latch.hold` | LATCH — segítségigény a tartáshoz |  | A LATCH-skála ötödik tétele (H). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `neo.latch.latch` | LATCH — mellrefogás |  | A LATCH-skála első tétele (L). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `neo.latch.nipple` | LATCH — mellbimbó típusa |  | A LATCH-skála harmadik tétele (T). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `neo.latch.total` | LATCH összpontszám [{pont}] |  | A LATCH szoptatási értékelő skála összpontszáma. |
| `neo.nows.esc.consoling` | ESC — megnyugtatható 10 percen belül |  | Az Eat-Sleep-Console funkcionális értékelés harmadik kérdése. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `neo.nows.esc.feeding` | ESC — eszik legalább 30 mL-t etetésenként |  | Az Eat-Sleep-Console funkcionális értékelés első kérdése. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `neo.nows.esc.sleeping` | ESC — alszik legalább 1 órát zavarás nélkül |  | Az Eat-Sleep-Console funkcionális értékelés második kérdése. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `neo.nows.finnegan` | Finnegan-pontszám [{pont}] |  | A neonatális megvonási tünetegyüttes pontozása. |
| `neo.nows.pharmacotherapy` | Farmakoterápia indult |  | Kapott-e az újszülött gyógyszeres kezelést a megvonásra. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `neo.nows.substance` | Az anyai opioid-expozíció típusa |  | Milyen opioidnak volt kitéve a magzat. |
| ↳ `none` | Nem volt expozíció |  | opció |
| ↳ `heroin` | Heroin / rövid hatású opioid |  | opció |
| ↳ `buprenorphine` | Buprenorfin |  | opció |
| ↳ `methadone` | Metadon |  | opció |
| ↳ `other` | Egyéb / több szer |  | opció |
| `neo.nrp.epi.dose` | NRP — epinephrin adag (IV/IO) [mg] |  | Az újraélesztés során adandó epinephrin egyszeri adagja. |
| `neo.nrp.volume.dose` | NRP — volumenbolus [mL] |  | Az újraélesztés során adandó fiziológiás sóoldat bolus. |

### Szülés `labour`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `labour.amniotic` | Magzatvíz |  | A lefolyó magzatvíz jellege. |
| `labour.bleedingStartedAt` | A vérzés kezdete |  | Mikor kezdődött a jelentős vérzés. |
| `labour.caput` | Caput succedaneum [1] |  | A vezérpont feletti duzzanat. |
| `labour.cervix` | Méhszáj-tágulat [cm] |  | A méhszáj tágassága. |
| `labour.companion` | Kísérő jelen van |  | Van-e a vajúdó mellett választott kísérője. |
| `labour.contractionDuration` | Kontrakció időtartama [s] |  | Egy összehúzódás hossza. |
| `labour.contractions` | Kontrakciók száma [/(10.min)] |  | Hány összehúzódás 10 perc alatt. |
| `labour.deliveryMode` | Szülés módja |  | Hogyan született meg a magzat. |
| ↳ `spontaneous` | Spontán hüvelyi |  | opció |
| ↳ `vacuum` | Vákuum-extrakció |  | opció |
| ↳ `forceps` | Fogóműtét |  | opció |
| ↳ `breechVaginal` | Hüvelyi farfekvéses |  | opció |
| ↳ `csElective` | Tervezett császármetszés |  | opció |
| ↳ `csIntrapartum` | Vajúdás alatti császármetszés |  | opció |
| ↳ `csEmergency` | Sürgős császármetszés |  | opció |
| `labour.descent` | Fejbeszállás (ötödökben) [1] |  | Hány ötöde tapintható a koponyának a medencebemenet felett. |
| `labour.fhr.accel` | Akcelerációk |  | Vannak-e a magzati szívfrekvencia gyorsulásai. |
| `labour.fhr.baseline` | Magzati alapszívfrekvencia [/min] |  | A magzat alapvonala percenkénti ütésszámban. |
| `labour.fhr.decel` | Decelerációk |  | Milyen típusú lassulások láthatók. |
| ↳ `none` | Nincs |  | opció |
| ↳ `early` | Korai |  | opció |
| ↳ `variable` | Változó |  | opció |
| ↳ `late` | Késői |  | opció |
| ↳ `prolonged` | Elhúzódó (2–10 perc) |  | opció |
| ↳ `recurrentVariable` | Ismétlődő változó |  | opció |
| ↳ `recurrentLate` | Ismétlődő késői |  | opció |
| `labour.fhr.method` | Monitorozás módja |  | Hogyan történik a magzati szívhang követése. |
| ↳ `intermittent` | Időszakos hallgatózás |  | opció |
| ↳ `continuous` | Folyamatos CTG |  | opció |
| ↳ `internal` | Belső elektróda |  | opció |
| ↳ `none` | Nincs monitorozás |  | opció |
| `labour.fhr.variability` | Variabilitás |  | Az alapvonal ütésről ütésre való ingadozása. |
| ↳ `absent` | Hiányzó (< 1/perc) |  | opció |
| ↳ `minimal` | Minimális (≤ 5/perc) |  | opció |
| ↳ `moderate` | Mérsékelt (6–25/perc) |  | opció |
| ↳ `marked` | Kifejezett (> 25/perc) |  | opció |
| ↳ `sinusoidal` | Sinusoidalis mintázat |  | opció |
| `labour.hour` | Eltelt óra [h] |  | A vajúdás kezdete óta eltelt idő. |
| `labour.mgso4.startedAt` | Magnézium-szulfát kezdete |  | Mikor indult a magnézium-szulfát-kezelés. |
| `labour.moulding` | Koponyacsont-egymásra csúszás [1] |  | A varratok menti egymásra csúszás mértéke. |
| `labour.oxytocin` | Oxitocin-infúzió fut |  | Kap-e a vajúdó oxitocint. |
| `labour.perinealTrauma` | Gátsérülés |  | Milyen sérülés keletkezett a szülés során. |
| ↳ `none` | Nincs |  | opció |
| ↳ `firstDegree` | I. fokú |  | opció |
| ↳ `secondDegree` | II. fokú |  | opció |
| ↳ `thirdA` | III/a fokú |  | opció |
| ↳ `thirdB` | III/b fokú |  | opció |
| ↳ `thirdC` | III/c fokú |  | opció |
| ↳ `fourthDegree` | IV. fokú |  | opció |
| ↳ `episiotomy` | Gátmetszés |  | opció |
| ↳ `cervicalTear` | Méhnyakrepedés |  | opció |
| `labour.posture` | Testhelyzet |  | Milyen testhelyzetben van a vajúdó. |
| ↳ `upright` | Függőleges (áll, jár, ül) |  | opció |
| ↳ `lateral` | Oldalfekvés |  | opció |
| ↳ `supine` | Hanyatt fekvés |  | opció |
| ↳ `allFours` | Négykézláb |  | opció |
| ↳ `squatting` | Guggolás |  | opció |
| ↳ `waterBirth` | Vízben |  | opció |
| `labour.qbl` | Mennyiségi vérvesztés (kumulatív) [mL] |  | A mért vérvesztés összesen, a szülés kezdetétől. |
| `labour.qbl.total` | Teljes mennyiségi vérvesztés (szülés + műtét) [mL] |  | A beteg TELJES mért vérvesztése, szakaszoktól függetlenül. |
| `labour.stage` | Vajúdási szak |  | A szülés melyik szakában tart a beteg. |
| ↳ `latent` | Látens szak |  | opció |
| ↳ `active` | Aktív első szak |  | opció |
| ↳ `second` | Kitolási szak |  | opció |
| ↳ `third` | Lepényi szak |  | opció |
| ↳ `fourth` | Negyedik szak (a szülést követő 2 óra) |  | opció |
| `labour.startedAt` | Vajúdás kezdete |  | Mikor indult meg a vajúdás. |
| `labour.txa.givenAt` | Tranexámsav beadása |  | Mikor kapta a beteg a tranexámsavat. |
| `labour.urine` | Vizeletmennyiség [mL] |  | A rögzített óradiurézis. |
| `score.cmqcc.ob.sepsis` | CMQCC szülészeti szepszis — élettani szűrő [{trigger}] |  | A négy élettani szepszis-kritériumból hány teljesül. A küszöbök a `registry/szepszis/` regiszterből jönnek, ne |
| `score.cmqcc.stage` | CMQCC vérzési stádium [{stádium}] |  | A szülés utáni vérzés stádiuma. |
| `score.isth.dic` | ISTH terhességi DIC-pontszám [{pont}] |  | A terhességre módosított DIC-pontszám. |
| `score.meows` | MEOWS-pontszám [{trigger}] |  | A tartományon kívüli vitális paraméterek száma. |
| `score.omqsofa` | omqSOFA-pontszám [{pont}] |  | A négy szepszis-kritériumból hány teljesül. |

### Szülőszoba — Apgar `szuloszoba`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `nb.apgar.activity` | Apgar — Izomtónus (Activity) |  | Az Apgar-pontszám izomtónus (activity) tétele (tónus). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `nb.apgar.appearance` | Apgar — Szín (Appearance) |  | Az Apgar-pontszám szín (appearance) tétele (bőrszín, cyanosis). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `nb.apgar.grimace` | Apgar — Reflexingerlékenység (Grimace) |  | Az Apgar-pontszám reflexingerlékenység (grimace) tétele (reflexválasz). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `nb.apgar.pulse` | Apgar — Pulzus (Pulse) |  | Az Apgar-pontszám pulzus (pulse) tétele (szívfrekvencia). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `nb.apgar.respiration` | Apgar — Légzés (Respiration) |  | Az Apgar-pontszám légzés (respiration) tétele (légzési erőfeszítés). |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| `nb.apgar.total` | Apgar-összpontszám [{pont}] |  | Az öt Apgar-tétel összege. |

### Újszülött `nb`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `nb.apgar.at1` | Apgar 1 percnél [{pont}] |  | Az Apgar-pontszám az első percben. |
| `nb.apgar.at10` | Apgar 10 percnél [{pont}] |  | Az Apgar-pontszám a tizedik percben. |
| `nb.apgar.at5` | Apgar 5 percnél [{pont}] |  | Az Apgar-pontszám az ötödik percben. |
| `nb.birth.at` | A születés időpontja |  | Mikor született a gyermek. |
| `nb.birthInjury` | Születési sérülés |  | A szüléssel összefüggő újszülöttkori sérülés. |
| ↳ `none` | Nincs |  | opció |
| ↳ `brachialPlexus` | Plexus brachialis sérülés |  | opció |
| ↳ `fracture.clavicle` | Kulcscsonttörés |  | opció |
| ↳ `fracture.other` | Egyéb csonttörés |  | opció |
| ↳ `cephalhaematoma` | Cephalhaematoma |  | opció |
| ↳ `subgaleal` | Subgalealis vérzés |  | opció |
| ↳ `facialNerve` | Arcideg-bénulás |  | opció |
| ↳ `laceration` | Bőrsérülés (pl. császármetszésnél) |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `nb.birthWeight` | Születési súly [g] |  | A gyermek súlya születéskor. |
| `nb.birthWeight.percentile` | Születési súly percentilis [%] |  | A születési súly percentilise a gesztációs korhoz képest. |
| `nb.cordBe` | Köldökzsinór-artéria bázisfelesleg [mmol/L] |  | Base excess az arteria umbilicalis mintában. |
| `nb.cordPh` | Köldökzsinór-artéria pH [1] |  | Az arteria umbilicalis vérgáz pH-ja. |
| `nb.ga.atBirth` | Gesztációs kor a születéskor [wk] |  | Hányadik terhességi héten született a gyermek. |
| `nb.nicuAdmit` | Újszülött intenzív ellátás |  | Szükség volt-e NIC-osztályos felvételre. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `nb.nlos` | Újszülött ápolási ideje [d] |  | Hány napot töltött az újszülött az intézményben. |
| `nb.oxygenDep` | Oxigénfüggőség |  | Szorult-e az újszülött tartós oxigénpótlásra. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `nb.preterm.type` | Koraszülés típusa |  | Spontán indult-e a koraszülés, vagy orvosi döntés előzte meg. |
| ↳ `none` | Nem koraszülés (≥ 37 hét) |  | opció |
| ↳ `spontaneous` | Spontán koraszülés |  | opció |
| ↳ `iatrogenic` | Iatrogén (orvosi javallatú) koraszülés |  | opció |

### Gyermeknőgyógyászat `pedgyn`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `pedgyn.bleeding.prepubertal` | Genitális vérzés pubertás előtt |  | Volt-e genitális vérzés a pubertás megindulása előtt. |
| ↳ `no` | Nincs |  | opció |
| ↳ `yes` | Van |  | opció |
| ↳ `notAsked` | Nem kérdeztük meg |  | opció |
| `pedgyn.chaperone` | Kísérő jelen volt a vizsgálatnál |  | Ki volt jelen a genitális vizsgálat alatt. |
| ↳ `parent` | Szülő / törvényes képviselő |  | opció |
| ↳ `staff` | Egészségügyi dolgozó (chaperone) |  | opció |
| ↳ `both` | Mindkettő |  | opció |
| ↳ `byRequest` | A kiskorú kérésére NEM volt jelen szülő |  | opció |
| ↳ `none` | Senki |  | opció |
| `pedgyn.confidentiality.discussed` | Titoktartás megbeszélve a serdülővel |  | Elhangzott-e, hogy mit tartunk bizalmasan, és mi az, amit nem tarthatunk annak. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem rögzített |  | opció |
| `pedgyn.consent.who` | Ki adta a beleegyezést |  | Ki egyezett bele a vizsgálatba, és milyen alapon. |
| ↳ `parent` | Törvényes képviselő |  | opció |
| ↳ `both` | Törvényes képviselő ÉS a kiskorú együtt |  | opció |
| ↳ `minor` | A kiskorú önállóan (belátási képesség alapján) |  | opció |
| ↳ `emerg` | Sürgős szükség — utólagos tájékoztatással |  | opció |
| ↳ `none` | NINCS rögzítve |  | opció |
| `pedgyn.contraception.discussed` | Fogamzásgátlás megbeszélve |  | Szóba került-e a fogamzásgátlás. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem rögzített |  | opció |
| `pedgyn.discharge` | Hüvelyváladék |  | A hüvelyváladék jellege. |
| ↳ `none` | Nincs |  | opció |
| ↳ `physiologic` | Élettani (pubertás előtti ösztrogénhatás) |  | opció |
| ↳ `purulent` | Gennyes |  | opció |
| ↳ `bloody` | Véres |  | opció |
| ↳ `foul` | Bűzös — idegentest gyanúja |  | opció |
| ↳ `unk` | Nem tudja / nem emlékszik |  | opció |
| `pedgyn.dsd.suspected` | Nemi fejlődés eltérésének (DSD) gyanúja |  | Felmerült-e a nemi fejlődés eltérésének gyanúja. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem merült fel kérdésként |  | opció |
| `pedgyn.dysmenorrhea.severity` | Dysmenorrhoea súlyossága |  | A menstruációs fájdalom mértéke, a napi működés alapján. |
| ↳ `none` | Nincs |  | opció |
| ↳ `mild` | Enyhe — nem befolyásolja a napi életet |  | opció |
| ↳ `moderate` | Közepes — fájdalomcsillapítóval kezelhető |  | opció |
| ↳ `severe` | Súlyos — iskolai hiányzást okoz |  | opció |
| ↳ `unk` | Nem tudja / nem emlékszik |  | opció |
| `pedgyn.exam.approach` | A genitális vizsgálat módja |  | Milyen módon történt a külső és belső nemi szervek vizsgálata. |
| ↳ `inspection` | Megtekintés (béka-ülés / térd-mell helyzet) |  | opció |
| ↳ `vulvoscopy` | Vulvoszkópia / nagyítós megtekintés |  | opció |
| ↳ `vaginoscopy` | Vaginoszkópia — altatásban vagy szedálásban |  | opció |
| ↳ `speculum` | Tükrös feltárás |  | opció |
| ↳ `declined` | A gyermek elutasította — nem történt vizsgálat |  | opció |
| ↳ `notNeeded` | Nem volt indokolt |  | opció |
| `pedgyn.foreignBody` | Hüvelyi idegentest |  | Igazolódott-e hüvelyi idegentest. |
| ↳ `no` | Nem igazolódott |  | opció |
| ↳ `suspected` | Gyanú |  | opció |
| ↳ `confirmed` | Igazolt |  | opció |
| ↳ `notAssessed` | Nem vizsgált |  | opció |
| `pedgyn.hpv.vaccine` | HPV-oltás |  | A HPV elleni védőoltás állapota. |
| ↳ `complete` | Teljes sorozat |  | opció |
| ↳ `partial` | Megkezdett, nem befejezett |  | opció |
| ↳ `none` | Nem kapott |  | opció |
| ↳ `offered` | Felajánlva, elutasítva |  | opció |
| ↳ `unk` | Nem tudja / nem emlékszik |  | opció |
| `pedgyn.minor.ownView` | A kiskorú saját véleménye rögzítve |  | Megkérdezték-e a kiskorút magát, és rögzítették-e a válaszát. |
| ↳ `pos` | Igen — megkérdeztük, és rögzítettük |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem rögzített |  | opció |
| `pedgyn.mullerian.anomaly` | Müller-cső fejlődési rendellenesség |  | Igazolt vagy gyanított Müller-cső eredetű fejlődési rendellenesség. |
| ↳ `none` | Nincs |  | opció |
| ↳ `imperforateHymen` | Hymen imperforatus |  | opció |
| ↳ `vaginalSeptum` | Hüvelyi septum |  | opció |
| ↳ `agenesis` | Hüvely-/méhaplasia (MRKH) |  | opció |
| ↳ `uterineAnomaly` | Méhfejlődési rendellenesség |  | opció |
| ↳ `other` | Egyéb |  | opció |
| ↳ `notAssessed` | Nem vizsgált |  | opció |
| `pedgyn.partner.age` | A partner életkora (év) [év] |  | A szexuális partner életkora, ha a beteg elmondta. Nem kikövetkeztetett érték. |
| `pedgyn.presentations.12m` | Genitális panasz miatti megjelenések száma (12 hónap) [alkalom] |  | Hányszor jelent meg a gyermek genitális panasszal az elmúlt 12 hónapban — bármelyik ellátóhelyen. |
| `pedgyn.pubarche.age` | Pubarche (szeméremszőrzet megjelenése) életkora [a] |  | Az az életkor, amikor a szeméremszőrzet megjelent. |
| `pedgyn.puberty.timing` | Pubertás időzítése |  | A pubertás menetének besorolása. |
| ↳ `precocious` | Korai (< 8 év) |  | opció |
| ↳ `normal` | Időben |  | opció |
| ↳ `delayed` | Késői (13 évig nincs thelarche, vagy 15 évig nincs menarche) |  | opció |
| ↳ `unassessable` | Nem megítélhető |  | opció |
| `pedgyn.report.made` | Gyermekvédelmi jelzés megtörtént |  | Megtörtént-e a jelzés a gyermekvédelmi jelzőrendszer felé. |
| ↳ `pos` | Megtörtént |  | opció |
| ↳ `neg` | Nem történt meg |  | opció |
| ↳ `unk` | Nem rögzített |  | opció |
| `pedgyn.safeguarding.asked` | Bántalmazás lehetősége mérlegelve |  | Történt-e mérlegelés arról, hogy a lelet mögött bántalmazás állhat-e. |
| ↳ `yes` | Igen — mérlegeltük |  | opció |
| ↳ `notAsked` | NEM mérlegeltük |  | opció |
| `pedgyn.safeguarding.concern` | Bántalmazás gyanúja |  | A mérlegelés eredménye. |
| ↳ `no` | A mérlegelés nem vetett fel gyanút |  | opció |
| ↳ `uncertain` | Bizonytalan — további tisztázás szükséges |  | opció |
| ↳ `yes` | Igen |  | opció |
| `pedgyn.sti.confirmed` | Igazolt nemi úton terjedő fertőzés |  | Laboratóriumilag IGAZOLT nemi úton terjedő fertőzés. A klinikai gyanú nem elég: a gyermekvédelmi következmény  |
| ↳ `none` | Nincs |  | opció |
| ↳ `gonorrhoea` | Gonorrhoea |  | opció |
| ↳ `chlamydia` | Chlamydia trachomatis |  | opció |
| ↳ `syphilis` | Syphilis |  | opció |
| ↳ `trichomonas` | Trichomonas vaginalis |  | opció |
| ↳ `hiv` | HIV |  | opció |
| ↳ `hpv` | HPV (anogenitalis szemölcs) |  | opció |
| ↳ `hsv` | HSV (genitalis herpes) |  | opció |
| ↳ `unk` | Nem vizsgálták |  | opció |
| `pedgyn.tanner.pubic` | Szeméremszőrzet Tanner-stádium |  | A szeméremszőrzet fejlettsége a Tanner-beosztás szerint. |
| ↳ `1` | PH1 — nincs terminális szőrzet |  | opció |
| ↳ `2` | PH2 — gyér, egyenes szőrzet a nagyajkakon |  | opció |
| ↳ `3` | PH3 — sötétebb, göndörödő, ritkás |  | opció |
| ↳ `4` | PH4 — felnőtt jellegű, kisebb területen |  | opció |
| ↳ `5` | PH5 — felnőtt mennyiség és eloszlás |  | opció |
| `pedgyn.thelarche.age` | Thelarche (mellfejlődés kezdete) életkora [a] |  | Az az életkor, amikor a mellfejlődés megindult. |
| `pedgyn.trauma.consistent` | A lelet és az elmondott mechanizmus összeillik |  | A látott sérülés magyarázható-e az elmondott történettel. |
| ↳ `yes` | Összeillik |  | opció |
| ↳ `uncertain` | Bizonytalan |  | opció |
| ↳ `no` | NEM illik össze |  | opció |
| ↳ `notApplicable` | Nincs sérülés |  | opció |
| `pedgyn.trauma.mechanism` | A sérülés elmondott mechanizmusa |  | Ahogyan a sérülés keletkezését elmondták — SZÓ SZERINT, a gyermek szavaival, ha ő mondta el. |
| `pedgyn.vulva.finding` | Vulva lelet |  | A külső nemi szervek megtekintéses lelete. |
| ↳ `norm` | Eltérés nélkül |  | opció |
| ↳ `erythema` | Bőrpír / gyulladás |  | opció |
| ↳ `adhesion` | Kisajak-összenövés (synechia vulvae) |  | opció |
| ↳ `lichen` | Lichen sclerosus gyanúja |  | opció |
| ↳ `lesion` | Körülírt elváltozás |  | opció |
| ↳ `trauma` | Sérülés |  | opció |
| ↳ `notExamined` | Nem vizsgálva |  | opció |

### Onkológia `onc`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `onc.fertility.discussed` | Fertilitásmegőrzés megbeszélve |  | Szóba került-e a termékenység megőrzése a kezelés előtt. |
| ↳ `yes` | Igen, dokumentáltan |  | opció |
| ↳ `notApplicable` | Nem releváns |  | opció |
| ↳ `no` | Nem került szóba |  | opció |
| ↳ `declined` | A beteg nem kérte |  | opció |
| `onc.fertility.method` | Fertilitásmegőrzés módja |  | Milyen eljárás történt. |
| ↳ `oocyte` | Petesejt-fagyasztás |  | opció |
| ↳ `embryo` | Embrió-fagyasztás |  | opció |
| ↳ `ovarianTissue` | Ovariumszövet-fagyasztás |  | opció |
| ↳ `gnrh` | GnRH-agonista ovariumvédelem |  | opció |
| ↳ `transposition` | Ovarium-transzpozíció sugárkezelés előtt |  | opció |
| ↳ `none` | Nem történt |  | opció |
| `onc.gyn.figo.cervix` | FIGO-stádium — méhnyak |  | A méhnyakrák FIGO-stádiuma. |
| ↳ `IA1` | IA1 — mikroszkopikus, ≤ 3 mm mélység |  | opció |
| ↳ `IA2` | IA2 — mikroszkopikus, 3–5 mm mélység |  | opció |
| ↳ `IB1` | IB1 — ≤ 2 cm |  | opció |
| ↳ `IB2` | IB2 — 2–4 cm |  | opció |
| ↳ `IB3` | IB3 — > 4 cm |  | opció |
| ↳ `IIA1` | IIA1 — hüvely felső kétharmada, ≤ 4 cm |  | opció |
| ↳ `IIA2` | IIA2 — hüvely felső kétharmada, > 4 cm |  | opció |
| ↳ `IIB` | IIB — parametrium érintett |  | opció |
| ↳ `IIIA` | IIIA — hüvely alsó harmada |  | opció |
| ↳ `IIIB` | IIIB — medencefal vagy hydronephrosis |  | opció |
| ↳ `IIIC1` | IIIC1 — kismedencei nyirokcsomó-áttét |  | opció |
| ↳ `IIIC2` | IIIC2 — paraaortikus nyirokcsomó-áttét |  | opció |
| ↳ `IVA` | IVA — hólyag vagy végbél nyálkahártyája |  | opció |
| ↳ `IVB` | IVB — távoli áttét |  | opció |
| `onc.gyn.figo.endometrium` | FIGO-stádium — méhtest |  | A méhtestrák FIGO-stádiuma. |
| ↳ `IA1` | IA1 — nem myoinvazív, POLE-mutált vagy jó prognózisú |  | opció |
| ↳ `IA2` | IA2 — < 50% myometrium-invázió, alacsony grádus |  | opció |
| ↳ `IA3` | IA3 — méhre és petefészekre korlátozott, alacsony grádus |  | opció |
| ↳ `IB` | IB — ≥ 50% myometrium-invázió, alacsony grádus |  | opció |
| ↳ `IC` | IC — agresszív szövettan, myometrium-invázió nélkül |  | opció |
| ↳ `IIA` | IIA — méhnyak stromájának érintettsége |  | opció |
| ↳ `IIB` | IIB — jelentős nyirokér-invázió |  | opció |
| ↳ `IIC` | IIC — agresszív szövettan myometrium-invázióval |  | opció |
| ↳ `IIIA` | IIIA — savós hártya vagy függelék |  | opció |
| ↳ `IIIB` | IIIB — hüvely vagy parametrium |  | opció |
| ↳ `IIIC1` | IIIC1 — kismedencei nyirokcsomó |  | opció |
| ↳ `IIIC2` | IIIC2 — paraaortikus nyirokcsomó |  | opció |
| ↳ `IVA` | IVA — hólyag vagy bél nyálkahártyája |  | opció |
| ↳ `IVB` | IVB — hasi áttét a kismedencén kívül |  | opció |
| ↳ `IVC` | IVC — távoli áttét |  | opció |
| `onc.gyn.germline` | Csíravonalas mutáció |  | Örökletes daganathajlam igazolt-e. |
| ↳ `none` | Nem igazolódott |  | opció |
| ↳ `brca1` | BRCA1 |  | opció |
| ↳ `brca2` | BRCA2 |  | opció |
| ↳ `lynch` | Lynch-szindróma |  | opció |
| ↳ `other` | Egyéb patogén variáns |  | opció |
| ↳ `vus` | Bizonytalan jelentőségű variáns |  | opció |
| ↳ `notTested` | Nem történt vizsgálat |  | opció |
| `onc.gyn.grade` | Differenciáltság |  | A daganat szöveti érettsége. |
| ↳ `1` | G1 — jól differenciált |  | opció |
| ↳ `2` | G2 — közepesen |  | opció |
| ↳ `3` | G3 — rosszul differenciált |  | opció |
| ↳ `x` | GX — nem megítélhető |  | opció |
| `onc.gyn.histology` | Szövettani típus |  | A daganat szövettani besorolása. |
| ↳ `scc` | Laphámrák |  | opció |
| ↳ `adeno` | Adenocarcinoma |  | opció |
| ↳ `adenosquamous` | Adenosquamosus |  | opció |
| ↳ `clearCell` | Világossejtes |  | opció |
| ↳ `serous` | Serosus |  | opció |
| ↳ `mucinous` | Mucinosus |  | opció |
| ↳ `endometrioid` | Endometrioid |  | opció |
| ↳ `carcinosarcoma` | Carcinosarcoma |  | opció |
| ↳ `sarcoma` | Sarcoma |  | opció |
| ↳ `neuroendocrine` | Neuroendokrin |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `onc.gyn.molecular` | Molekuláris besorolás |  | A méhtestrák molekuláris alcsoportja. |
| ↳ `pole` | POLE-mutált — kedvező prognózis |  | opció |
| ↳ `mmrd` | MMR-deficiens / MSI-magas |  | opció |
| ↳ `p53abn` | p53-abnormális — kedvezőtlen prognózis |  | opció |
| ↳ `nsmp` | Nem specifikus molekuláris profil |  | opció |
| ↳ `notDone` | Nem történt meghatározás |  | opció |
| `onc.gyn.site` | Daganat lokalizációja |  | Melyik szerv daganatáról van szó. |
| ↳ `cervix` | Méhnyak |  | opció |
| ↳ `endometrium` | Méhtest |  | opció |
| ↳ `ovary` | Petefészek |  | opció |
| ↳ `tube` | Petevezeték |  | opció |
| ↳ `peritoneum` | Hashártya |  | opció |
| ↳ `vulva` | Szeméremtest |  | opció |
| ↳ `vagina` | Hüvely |  | opció |
| ↳ `breast` | Emlő |  | opció |
| ↳ `gtd` | Trophoblast-betegség |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `onc.mdt.date` | Onkoteam időpontja |  | Mikor tárgyalta a csapat az esetet. |
| `onc.mdt.presented` | Onkoteam elé került |  | Megtárgyalta-e az esetet a multidiszciplináris onkológiai csapat. |
| `onc.preg.decision.options` | Az onkológiai döntésnél megbeszélt lehetőségek |  | Milyen kezelési utak kerültek szóba, és mi szólt mellettük-ellenük. |
| `onc.preg.decision.outcome` | A közös döntés |  | Mi mellett döntött a beteg a csapattal együtt. |
| ↳ `continueDelay` | A terhesség folytatása, a kezelés halasztásával |  | opció |
| ↳ `continueTreat` | A terhesség folytatása, kezeléssel |  | opció |
| ↳ `deliverEarly` | Korai szülésbefejezés, majd kezelés |  | opció |
| ↳ `terminate` | A terhesség megszakítása |  | opció |
| ↳ `undecided` | Még nem döntött |  | opció |
| `onc.preg.gaAtDiagnosis` | Gesztációs kor a diagnóziskor [wk] |  | Hányadik terhességi héten állították fel a diagnózist. |
| `onc.preg.placentaExamined` | Méhlepény szövettani vizsgálata |  | Megtörtént-e a lepény szövettani vizsgálata a szülés után. |
| `onc.preg.sharedDecision` | Megosztott döntéshozatal dokumentálva |  | Megtörtént-e és rögzült-e a beteggel közös döntéshozatal. |
| `onc.response.recist` | Válaszértékelés (RECIST 1.1) |  | A képalkotó válaszértékelés eredménye. |
| ↳ `cr` | Teljes válasz |  | opció |
| ↳ `pr` | Részleges válasz |  | opció |
| ↳ `sd` | Stabil betegség |  | opció |
| ↳ `pd` | Progresszió |  | opció |
| ↳ `ne` | Nem értékelhető |  | opció |
| `onc.tx.cycle` | Ciklusszám [1] |  | Hányadik kezelési ciklus. |
| `onc.tx.modality` | Kezelési modalitás |  | Milyen kezelés történt vagy tervezett. |
| ↳ `surgery` | Műtét |  | opció |
| ↳ `chemo` | Kemoterápia |  | opció |
| ↳ `radio` | Sugárterápia |  | opció |
| ↳ `targeted` | Célzott terápia |  | opció |
| ↳ `immuno` | Immunterápia |  | opció |
| ↳ `hormonal` | Hormonterápia |  | opció |
| ↳ `supportive` | Szupportív ellátás |  | opció |
| ↳ `none` | Nincs aktív kezelés |  | opció |
| `onc.tx.protocol` | Protokoll |  | A kemoterápiás vagy egyéb kezelési protokoll megnevezése. |
| `onc.tx.toxicity.grade` | Toxicitás foka (CTCAE) |  | A legsúlyosabb észlelt mellékhatás foka. |
| ↳ `0` | 0 — nincs |  | opció |
| ↳ `1` | 1 — enyhe |  | opció |
| ↳ `2` | 2 — közepes |  | opció |
| ↳ `3` | 3 — súlyos |  | opció |
| ↳ `4` | 4 — életveszélyes |  | opció |
| ↳ `5` | 5 — halálos kimenetel |  | opció |

### Gyógyszerelés `rx`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `rx.active` | Rendelt készítmények |  | A jelen ellátás során rendelt vagy szedett készítmények listája a gyógyszertörzsből. |
| ↳ `rx.betamethasone` | Betametazon |  | opció |
| ↳ `rx.calciumCarbonate` | Kalcium-karbonát |  | opció |
| ↳ `rx.carboprost` | Carboprost |  | opció |
| ↳ `rx.cyanocobalamin` | B12-vitamin |  | opció |
| ↳ `rx.dha` | Omega-3 (DHA) |  | opció |
| ↳ `rx.dinoprostone` | Dinoproszton |  | opció |
| ↳ `rx.enoxaparin` | Enoxaparin |  | opció |
| ↳ `rx.folicAcid` | Folsav |  | opció |
| ↳ `rx.ibuprofen` | Ibuprofén |  | opció |
| ↳ `rx.ironSulfate` | Vas-szulfát |  | opció |
| ↳ `rx.labetalol` | Labetalol |  | opció |
| ↳ `rx.magnesiumSulfate` | Magnézium-szulfát |  | opció |
| ↳ `rx.methyldopa` | Metildopa |  | opció |
| ↳ `rx.methylergometrine` | Methylergometrin |  | opció |
| ↳ `rx.misoprostol` | Misoprostol |  | opció |
| ↳ `rx.nifedipine` | Nifedipin |  | opció |
| ↳ `rx.oxytocin` | Oxitocin |  | opció |
| ↳ `rx.paracetamol` | Paracetamol |  | opció |
| ↳ `rx.potassiumIodide` | Kálium-jodid |  | opció |
| ↳ `rx.prenatalMultivitamin` | Terhes-multivitamin |  | opció |
| ↳ `rx.ramipril` | Ramipril |  | opció |
| ↳ `rx.tranexamic` | Tranexámsav |  | opció |
| ↳ `rx.vitaminD3` | D3-vitamin |  | opció |
| `rx.allergy.other` | Egyéb ismert gyógyszerallergia |  | Milyen más készítményre volt korábban reakció. |
| `rx.allergy.penicillin` | Penicillin-allergia |  | Ismert-e penicillin-túlérzékenység. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem tudom |  | opció |
| `rx.allergy.reaction` | Az allergiás reakció jellege |  | Mi történt a korábbi expozíciókor. |
| ↳ `anaphylaxis` | Anafilaxia |  | opció |
| ↳ `urticaria` | Csalánkiütés, viszketés |  | opció |
| ↳ `rash` | Kiütés |  | opció |
| ↳ `giUpset` | Gyomor-bél panasz |  | opció |
| ↳ `unknown` | Nem tudja |  | opció |
| `rx.crcl` | Kreatinin-clearance [mL/min] |  | A gyógyszeradagoláshoz használt becsült kreatinin-clearance. |
| `rx.dose.amount` | Adag |  | Az egyszeri adag mennyisége. |
| `rx.dose.unit` | Adagolási egység |  | Milyen egységben adjuk meg az adagot. |
| ↳ `mg` | mg |  | opció |
| ↳ `ug` | µg |  | opció |
| ↳ `g` | g |  | opció |
| ↳ `mL` | ml |  | opció |
| ↳ `[IU]` | NE |  | opció |
| ↳ `{tbl}` | tabletta |  | opció |
| ↳ `{drop}` | csepp |  | opció |
| ↳ `{puff}` | belégzés |  | opció |
| ↳ `mg/kg` | mg/testsúlykilogramm |  | opció |
| `rx.frequency` | Adagolás gyakorisága |  | Milyen gyakran kapja a beteg. |
| ↳ `once` | Egyszeri adag |  | opció |
| ↳ `qd` | Naponta egyszer |  | opció |
| ↳ `bid` | Naponta kétszer |  | opció |
| ↳ `tid` | Naponta háromszor |  | opció |
| ↳ `qid` | Naponta négyszer |  | opció |
| ↳ `q4h` | 4 óránként |  | opció |
| ↳ `q6h` | 6 óránként |  | opció |
| ↳ `q8h` | 8 óránként |  | opció |
| ↳ `q12h` | 12 óránként |  | opció |
| ↳ `prn` | Szükség szerint |  | opció |
| ↳ `cont` | Folyamatos infúzióban |  | opció |
| `rx.indication` | A gyógyszerelés indikációja |  | Miért kapja a beteg ezt a szert. |
| ↳ `pph` | Szülés utáni vérzés |  | opció |
| ↳ `inductionCervical` | Méhszáj-érlelés, szülésindítás |  | opció |
| ↳ `tocolysis` | Koraszülés gátlása |  | opció |
| ↳ `lungMaturation` | Magzati tüdőérlelés |  | opció |
| ↳ `seizureProphylaxis` | Görcsmegelőzés (praeeclampsia) |  | opció |
| ↳ `hypertension` | Magas vérnyomás |  | opció |
| ↳ `thromboprophylaxis` | Thrombosis-megelőzés |  | opció |
| ↳ `infection` | Fertőzés kezelése |  | opció |
| ↳ `antibioticProphylaxis` | Antibiotikus profilaxis |  | opció |
| ↳ `analgesia` | Fájdalomcsillapítás |  | opció |
| ↳ `nausea` | Hányinger, hányás |  | opció |
| ↳ `supplementation` | Pótlás, szupplementáció |  | opció |
| ↳ `thyroid` | Pajzsmirigy-kezelés |  | opció |
| ↳ `diabetes` | Cukorbetegség kezelése |  | opció |
| ↳ `other` | Egyéb |  | opció |
| `rx.lmwh.dailyDose` | Javasolt profilaktikus enoxaparin-adag [mg] |  | A testsúlysáv szerinti napi profilaktikus adag. |
| `rx.override.gate` | Megkerült kapu |  | Melyik kontraindikáció-kaput kerülte meg a rendelés. |
| `rx.override.reason` | A megkerülés indoklása |  | Miért vállalható a kockázat ebben a helyzetben. |
| `rx.route` | Beadási mód |  | Hogyan kapja a beteg a készítményt. |
| ↳ `po` | Szájon át |  | opció |
| ↳ `iv` | Intravénásan |  | opció |
| ↳ `im` | Intramuszkulárisan |  | opció |
| ↳ `sc` | Bőr alá |  | opció |
| ↳ `pv` | Hüvelybe |  | opció |
| ↳ `pr` | Végbélbe |  | opció |
| ↳ `top` | Helyileg |  | opció |
| ↳ `inh` | Belégzéssel |  | opció |
| ↳ `id` | Méhűrbe / intramyometrialisan |  | opció |
| ↳ `ed` | Epiduralisan |  | opció |
| `rx.start` | Kezdés |  | Mikortól kapja a beteg. |
| `rx.status` | Rendelés állapota |  | Hol tart a rendelés. |
| ↳ `proposed` | Javasolt, még nem indult |  | opció |
| ↳ `active` | Fut |  | opció |
| ↳ `held` | Felfüggesztve |  | opció |
| ↳ `stopped` | Leállítva |  | opció |
| ↳ `completed` | Befejezve |  | opció |
| ↳ `homeMedication` | Otthoni szedés (nem mi rendeltük) |  | opció |
| `rx.stop` | Befejezés |  | Meddig kapja a beteg. |

### PROM-kérdőívek `prom`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `prom.bses.q1` | BSES-SF — 1. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q10` | BSES-SF — 10. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q11` | BSES-SF — 11. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q12` | BSES-SF — 12. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q13` | BSES-SF — 13. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q14` | BSES-SF — 14. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q2` | BSES-SF — 2. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q3` | BSES-SF — 3. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q4` | BSES-SF — 4. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q5` | BSES-SF — 5. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q6` | BSES-SF — 6. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q7` | BSES-SF — 7. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q8` | BSES-SF — 8. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.q9` | BSES-SF — 9. tétel |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem vagyok biztos benne |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Néha |  | opció |
| ↳ `4` | Többnyire |  | opció |
| ↳ `5` | Mindig biztos vagyok benne |  | opció |
| `prom.bses.total` | BSES-SF összpontszám [{pont}] |  | A 14 tétel összege (14–70). |
| `prom.bssr.q1` | BSS-R — 1. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q10` | BSS-R — 10. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q2` | BSS-R — 2. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q3` | BSS-R — 3. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q4` | BSS-R — 4. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q5` | BSS-R — 5. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q6` | BSS-R — 6. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q7` | BSS-R — 7. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q8` | BSS-R — 8. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.q9` | BSS-R — 9. tétel |  | A beteg saját válasza. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| ↳ `4` | 4 pont |  | opció |
| `prom.bssr.total` | BSS-R összpontszám [{pont}] |  | A 10 tétel összege (0–40). |
| `prom.clinicianNote` | Klinikusi megjegyzés a kérdőívhez |  | A klinikus észrevétele egy felvett kérdőívvel kapcsolatban. |
| `prom.eq5d.activities` | EQ-5D-5L — Szokásos tevékenységek |  | A beteg saját válasza. |
| ↳ `1` | Nem okoz problémát |  | opció |
| ↳ `2` | Enyhe probléma |  | opció |
| ↳ `3` | Közepes probléma |  | opció |
| ↳ `4` | Súlyos probléma |  | opció |
| ↳ `5` | Képtelen rá / rendkívül súlyos |  | opció |
| `prom.eq5d.anxiety` | EQ-5D-5L — Szorongás / lehangoltság |  | A beteg saját válasza. |
| ↳ `1` | Nem okoz problémát |  | opció |
| ↳ `2` | Enyhe probléma |  | opció |
| ↳ `3` | Közepes probléma |  | opció |
| ↳ `4` | Súlyos probléma |  | opció |
| ↳ `5` | Képtelen rá / rendkívül súlyos |  | opció |
| `prom.eq5d.mobility` | EQ-5D-5L — Mozgékonyság |  | A beteg saját válasza. |
| ↳ `1` | Nem okoz problémát |  | opció |
| ↳ `2` | Enyhe probléma |  | opció |
| ↳ `3` | Közepes probléma |  | opció |
| ↳ `4` | Súlyos probléma |  | opció |
| ↳ `5` | Képtelen rá / rendkívül súlyos |  | opció |
| `prom.eq5d.pain` | EQ-5D-5L — Fájdalom / rossz közérzet |  | A beteg saját válasza. |
| ↳ `1` | Nem okoz problémát |  | opció |
| ↳ `2` | Enyhe probléma |  | opció |
| ↳ `3` | Közepes probléma |  | opció |
| ↳ `4` | Súlyos probléma |  | opció |
| ↳ `5` | Képtelen rá / rendkívül súlyos |  | opció |
| `prom.eq5d.profile` | EQ-5D-5L profil |  | Az öt dimenzió szintjeiből álló ötjegyű kód. |
| `prom.eq5d.selfCare` | EQ-5D-5L — Önellátás |  | A beteg saját válasza. |
| ↳ `1` | Nem okoz problémát |  | opció |
| ↳ `2` | Enyhe probléma |  | opció |
| ↳ `3` | Közepes probléma |  | opció |
| ↳ `4` | Súlyos probléma |  | opció |
| ↳ `5` | Képtelen rá / rendkívül súlyos |  | opció |
| `prom.eq5d.vas` | EQ-5D-5L — egészségi állapot ma (VAS) [1] |  | A beteg saját megítélése az aktuális egészségi állapotáról 0–100 skálán. |
| `prom.instruments` | Felvett mérőeszközök |  | Mely mérőeszközök kerültek felvételre ennél az esetnél. |
| ↳ `inst.eq5d5l` | EQ-5D-5L |  | opció |
| ↳ `inst.whodas12` | WHODAS 2.0-12 |  | opció |
| ↳ `inst.bses.sf` | BSES-SF |  | opció |
| ↳ `inst.bssr` | BSS-R |  | opció |
| ↳ `inst.epds` | EPDS |  | opció |
| ↳ `inst.whooley` | Whooley |  | opció |
| ↳ `inst.mspss` | MSPSS |  | opció |
| ↳ `inst.mibs` | MIBS |  | opció |
| ↳ `inst.phq9` | PHQ-9 |  | opció |
| ↳ `inst.latch` | LATCH |  | opció |
| `prom.mh.epds.total` | EPDS összpontszám (ICHOM) [{pont}] |  | Ugyanaz az adat, mint a(z) psy.epds.total — TÜKÖR, nem külön kitöltés. |
| `prom.mh.mibs.total` | MIBS összpontszám (ICHOM) [{pont}] |  | Ugyanaz az adat, mint a(z) psy.mibs.total — TÜKÖR, nem külön kitöltés. |
| `prom.mh.whooley.total` | Whooley összpontszám (ICHOM) [{pont}] |  | Ugyanaz az adat, mint a(z) psy.whooley.total — TÜKÖR, nem külön kitöltés. |
| `prom.resp.info` | Megkapta a szükséges tájékoztatást |  | Kapott-e elegendő és érthető tájékoztatást. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.resp.respect` | Tisztelettel bántak vele |  | Mennyire érezte úgy, hogy tisztelettel bántak vele. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.resp.role` | Olyan szerepe volt az ellátásban, amilyet szeretett volna |  | Annyira vonták-e be a döntésekbe, amennyire szerette volna. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.resp.trust` | Bízott az ellátóiban |  | Mennyire bízott az ellátásában részt vevőkben. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.sat.overall` | Elégedettség az ellátással |  | Mennyire volt elégedett a kapott ellátással. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.sat.painDecision` | Megosztott döntés a fájdalomcsillapításról |  | Bevonták-e a fájdalomcsillapítás megválasztásába. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.sat.painRelief` | Elégedettség a fájdalomcsillapítással |  | Mennyire volt elégedett a kapott fájdalomcsillapítással. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Részben |  | opció |
| ↳ `4` | Nagyrészt |  | opció |
| ↳ `5` | Teljes mértékben |  | opció |
| `prom.whodas.q1` | WHODAS 2.0-12 — 1. tétel: Koncentráció 10 percen át |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q10` | WHODAS 2.0-12 — 10. tétel: Napi teendők időigénye |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q11` | WHODAS 2.0-12 — 11. tétel: Kimaradt napok |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q12` | WHODAS 2.0-12 — 12. tétel: Csökkent teljesítményű napok |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q2` | WHODAS 2.0-12 — 2. tétel: Hosszabb távolság gyaloglása (1 km) |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q3` | WHODAS 2.0-12 — 3. tétel: Teljes test megmosása |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q4` | WHODAS 2.0-12 — 4. tétel: Öltözködés |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q5` | WHODAS 2.0-12 — 5. tétel: Idegenekkel való kapcsolat |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q6` | WHODAS 2.0-12 — 6. tétel: Barátságok fenntartása |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q7` | WHODAS 2.0-12 — 7. tétel: Napi otthoni teendők |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q8` | WHODAS 2.0-12 — 8. tétel: Munka vagy tanulás |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.q9` | WHODAS 2.0-12 — 9. tétel: Érzelmi érintettség az egészségi állapot miatt |  | A beteg saját válasza. |
| ↳ `1` | Egyáltalán nem |  | opció |
| ↳ `2` | Enyhén |  | opció |
| ↳ `3` | Közepesen |  | opció |
| ↳ `4` | Súlyosan |  | opció |
| ↳ `5` | Rendkívül súlyosan / képtelen rá |  | opció |
| `prom.whodas.total` | WHODAS 2.0-12 összpontszám [{pont}] |  | A 12 tétel egyszerű összege (0–48). |

### Pszichológia — EPDS és társai `psy`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `psy.epds.q1` | EPDS Q1 — Nevetés, humor érzékelése |  | Az Edinburgh-i szülés utáni depresszió-skála 1. tétele: nevetés, humor érzékelése. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q10` | EPDS Q10 — Önkárosítás gondolata |  | Az Edinburgh-i szülés utáni depresszió-skála 10. tétele: önkárosítás gondolata. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q2` | EPDS Q2 — Örömteli várakozás |  | Az Edinburgh-i szülés utáni depresszió-skála 2. tétele: örömteli várakozás. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q3` | EPDS Q3 — Önvád szükségtelenül |  | Az Edinburgh-i szülés utáni depresszió-skála 3. tétele: önvád szükségtelenül. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q4` | EPDS Q4 — Szorongás, aggodalom ok nélkül |  | Az Edinburgh-i szülés utáni depresszió-skála 4. tétele: szorongás, aggodalom ok nélkül. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q5` | EPDS Q5 — Félelem, pánik ok nélkül |  | Az Edinburgh-i szülés utáni depresszió-skála 5. tétele: félelem, pánik ok nélkül. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q6` | EPDS Q6 — Túlterheltség érzése |  | Az Edinburgh-i szülés utáni depresszió-skála 6. tétele: túlterheltség érzése. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q7` | EPDS Q7 — Alvászavar szomorúság miatt |  | Az Edinburgh-i szülés utáni depresszió-skála 7. tétele: alvászavar szomorúság miatt. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q8` | EPDS Q8 — Szomorúság, nyomott hangulat |  | Az Edinburgh-i szülés utáni depresszió-skála 8. tétele: szomorúság, nyomott hangulat. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.q9` | EPDS Q9 — Sírás |  | Az Edinburgh-i szülés utáni depresszió-skála 9. tétele: sírás. |
| ↳ `0` | 0 pont |  | opció |
| ↳ `1` | 1 pont |  | opció |
| ↳ `2` | 2 pont |  | opció |
| ↳ `3` | 3 pont |  | opció |
| `psy.epds.total` | EPDS összpontszám [{pont}] |  | A tíz tétel pontszámának összege. |
| `psy.mibs.affection` | MIBS — Gyengédség |  | Az anya-csecsemő kötődés érzelmi tétele: gyengédség. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Alig |  | opció |
| ↳ `2` | Néha |  | opció |
| ↳ `3` | Nagyon |  | opció |
| `psy.mibs.joy` | MIBS — Öröm a babával |  | Az anya-csecsemő kötődés érzelmi tétele: öröm a babával. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Alig |  | opció |
| ↳ `2` | Néha |  | opció |
| ↳ `3` | Nagyon |  | opció |
| `psy.mibs.neutrality` | MIBS — Közömbösség |  | Az anya-csecsemő kötődés érzelmi tétele: közömbösség. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Alig |  | opció |
| ↳ `2` | Néha |  | opció |
| ↳ `3` | Nagyon |  | opció |
| `psy.mibs.protective` | MIBS — Óvó érzés |  | Az anya-csecsemő kötődés érzelmi tétele: óvó érzés. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Alig |  | opció |
| ↳ `2` | Néha |  | opció |
| ↳ `3` | Nagyon |  | opció |
| `psy.mibs.resentment` | MIBS — Ellenérzés |  | Az anya-csecsemő kötődés érzelmi tétele: ellenérzés. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Alig |  | opció |
| ↳ `2` | Néha |  | opció |
| ↳ `3` | Nagyon |  | opció |
| `psy.mibs.total` | MIBS összpontszám [{pont}] |  | Az öt tétel pontszámának összege. |
| `psy.mspss.family` | MSPSS — Család |  | Az észlelt társas támogatás mértéke: család. |
| ↳ `1` | Egyáltalán nem jellemző |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Inkább nem |  | opció |
| ↳ `4` | Közepesen |  | opció |
| ↳ `5` | Inkább igen |  | opció |
| ↳ `6` | Nagyrészt |  | opció |
| ↳ `7` | Teljesen jellemző |  | opció |
| `psy.mspss.friends` | MSPSS — Barátok |  | Az észlelt társas támogatás mértéke: barátok. |
| ↳ `1` | Egyáltalán nem jellemző |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Inkább nem |  | opció |
| ↳ `4` | Közepesen |  | opció |
| ↳ `5` | Inkább igen |  | opció |
| ↳ `6` | Nagyrészt |  | opció |
| ↳ `7` | Teljesen jellemző |  | opció |
| `psy.mspss.significantOther` | MSPSS — Partner, közeli személy |  | Az észlelt társas támogatás mértéke: partner, közeli személy. |
| ↳ `1` | Egyáltalán nem jellemző |  | opció |
| ↳ `2` | Kevéssé |  | opció |
| ↳ `3` | Inkább nem |  | opció |
| ↳ `4` | Közepesen |  | opció |
| ↳ `5` | Inkább igen |  | opció |
| ↳ `6` | Nagyrészt |  | opció |
| ↳ `7` | Teljesen jellemző |  | opció |
| `psy.mspss.total` | MSPSS összpontszám [{pont}] |  | A három tétel összege. |
| `psy.phq9.q1` | PHQ-9 Q1 — Örömtelenség |  | A PHQ-9 1. tétele: örömtelenség. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q2` | PHQ-9 Q2 — Nyomott hangulat |  | A PHQ-9 2. tétele: nyomott hangulat. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q3` | PHQ-9 Q3 — Alvászavar |  | A PHQ-9 3. tétele: alvászavar. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q4` | PHQ-9 Q4 — Fáradtság |  | A PHQ-9 4. tétele: fáradtság. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q5` | PHQ-9 Q5 — Étvágyváltozás |  | A PHQ-9 5. tétele: étvágyváltozás. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q6` | PHQ-9 Q6 — Önértékelési zavar |  | A PHQ-9 6. tétele: önértékelési zavar. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q7` | PHQ-9 Q7 — Koncentrációs nehézség |  | A PHQ-9 7. tétele: koncentrációs nehézség. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q8` | PHQ-9 Q8 — Pszichomotoros változás |  | A PHQ-9 8. tétele: pszichomotoros változás. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.q9` | PHQ-9 Q9 — Önkárosítás gondolata |  | A PHQ-9 9. tétele: önkárosítás gondolata. |
| ↳ `0` | Egyáltalán nem |  | opció |
| ↳ `1` | Néhány napon |  | opció |
| ↳ `2` | A napok több mint felén |  | opció |
| ↳ `3` | Szinte minden nap |  | opció |
| `psy.phq9.total` | PHQ-9 összpontszám [{pont}] |  | A kilenc tétel pontszámának összege. |
| `psy.ppp.admissionConsidered` | Hospitalizáció mérlegelve |  | Megtörtént-e a felvétel mérlegelése és dokumentálása magas kockázat mellett. |
| `psy.ppp.plan` | Perinatális mentális ellátási terv |  | Mi történik, ha a beteg állapota romlik: kihez fordul, hol veszik fel. |
| `psy.ppp.risk` | Postpartum pszichózis kockázata |  | A kockázati tényezők együttes, KVALITATÍV megítélése. |
| ↳ `high` | Magas — hospitalizáció mérlegelendő |  | opció |
| ↳ `elevated` | Emelt |  | opció |
| ↳ `baseline` | Alap populációs kockázat |  | opció |
| ↳ `unknown` | Nem megítélhető — hiányzó anamnézis |  | opció |
| `psy.social.finances` | Anyagi helyzet |  | Okoz-e a beteg számára gondot a mindennapi kiadások fedezése. |
| ↳ `adequate` | Nem okoz gondot |  | opció |
| ↳ `tight` | Szűkös |  | opció |
| ↳ `insufficient` | Nem elegendő |  | opció |
| ↳ `notDisclosed` | Nem kíván nyilatkozni |  | opció |
| `psy.social.housing` | Lakhatás |  | Milyen a beteg lakhatási helyzete. |
| ↳ `stable` | Rendezett |  | opció |
| ↳ `crowded` | Zsúfolt |  | opció |
| ↳ `temporary` | Ideiglenes, bizonytalan |  | opció |
| ↳ `homeless` | Hajléktalan |  | opció |
| `psy.social.partnership` | Párkapcsolati helyzet |  | Milyen a beteg párkapcsolati helyzete. |
| ↳ `supportive` | Támogató kapcsolat |  | opció |
| ↳ `strained` | Feszült kapcsolat |  | opció |
| ↳ `single` | Egyedülálló |  | opció |
| ↳ `separated` | Nemrég szakított |  | opció |
| ↳ `notDisclosed` | Nem kíván nyilatkozni |  | opció |
| `psy.social.support.contact` | Kire számíthat |  | Ki az a konkrét személy, akire a beteg szülés után számíthat. |
| `psy.social.workStress` | Munkahelyi terhelés |  | Milyen mértékű megterhelést jelent a munka. |
| ↳ `none` | Nem dolgozik |  | opció |
| ↳ `low` | Alacsony |  | opció |
| ↳ `moderate` | Közepes |  | opció |
| ↳ `high` | Magas |  | opció |
| ↳ `nightShift` | Éjszakai műszak |  | opció |
| `psy.violence.screened` | Bántalmazás szűrése megtörtént |  | Feltettük-e a bántalmazásra vonatkozó kérdést, négyszemközt. |
| `psy.whooley.helpQuestion` | Segítségkérési kérdés |  | Szeretne-e a beteg segítséget ehhez. |
| `psy.whooley.q1` | Whooley Q1 — Nyomott hangulat az elmúlt hónapban |  | A kétkérdéses depresszió-gyorsszűrés 1. kérdése. |
| ↳ `0` | Nem |  | opció |
| ↳ `1` | Igen |  | opció |
| `psy.whooley.q2` | Whooley Q2 — Örömtelenség az elmúlt hónapban |  | A kétkérdéses depresszió-gyorsszűrés 2. kérdése. |
| ↳ `0` | Nem |  | opció |
| ↳ `1` | Igen |  | opció |
| `psy.whooley.total` | Whooley összpontszám [{pont}] |  | A két kérdés összege. |

### Elbocsátás `disch`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `disch.admittedAt` | Felvétel időpontja |  | Mikor kezdődött az ellátási esemény. |
| `disch.at` | Elbocsátás időpontja |  | Mikor zárult le az ellátás. |
| `disch.condition` | Állapot az elbocsátáskor |  | A beteg állapota az ellátás lezárásakor. |
| ↳ `recovered` | Gyógyult |  | opció |
| ↳ `improved` | Javult |  | opció |
| ↳ `unchanged` | Változatlan |  | opció |
| ↳ `worsened` | Romlott |  | opció |
| ↳ `death` | Elhalálozott |  | opció |
| `disch.countersignedAt` | Ellenjegyzés időpontja |  | Mikor történt az ellenjegyzés. |
| `disch.countersignedBy` | Ellenjegyző |  | Ki ellenjegyezte a zárójelentést. |
| `disch.dxAdmission` | Felvételi diagnózis |  | Amivel a beteg érkezett. |
| `disch.dxFinal` | Végdiagnózis |  | Amivel a beteg távozik. |
| `disch.gpNotified` | A háziorvos értesítve |  | Eljutott-e a zárójelentés a háziorvoshoz. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `disch.institution.approved` | Az intézmény befogadta a generált zárójelentést |  | Jóváhagyta-e az intézmény a generált zárójelentést, és illesztette-e a saját dokumentációs rendjébe. |
| ↳ `pos` | Igen, a dokumentációs rend része |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `disch.institution.name` | Ellátó intézmény |  | Az intézmény megnevezése a fejlécben. |
| `disch.language` | A beteg példányának nyelve |  | Milyen nyelven kapta meg a beteg a zárójelentést. |
| ↳ `hu` | Magyar |  | opció |
| ↳ `en` | Angol |  | opció |
| ↳ `other` | Egyéb |  | opció |
| ↳ `notUnderstood` | A beteg nyelvén nem állt rendelkezésre |  | opció |
| `disch.medication.reconciled` | Gyógyszerelés egyeztetve az elbocsátáskor |  | Összevetették-e a felvétel előtti és az elbocsátáskori gyógyszerlistát. |
| `disch.patientCopyGiven` | A beteg példánya átadva |  | Megkapta-e a beteg a saját példányát. |
| `disch.restrictions` | Korlátozások, életmódi javaslatok |  | Terhelhetőség, sebkezelés, közösülés, fürdés, gépjárművezetés. |
| `disch.sickLeave.until` | Keresőképtelenség vége |  | Meddig tart a kiadott keresőképtelenség. |
| `disch.signedAt` | A zárójelentés aláírásának időpontja |  | Mikor történt az aláírás. |
| `disch.signedBy` | Aláíró orvos |  | Ki írta alá a zárójelentést. |
| `disch.summaryReviewedBy` | A generált tartalmat átnézte |  | Ki olvasta át a generált zárójelentést az aláírás előtt. |
| `disch.type` | Az elbocsátás módja |  | Hogyan végződött az ellátási esemény. |
| ↳ `home` | Otthonába |  | opció |
| ↳ `transfer` | Áthelyezés másik intézménybe |  | opció |
| ↳ `againstAdvice` | Távozás saját felelősségre |  | opció |
| ↳ `death` | Elhalálozás |  | opció |
| ↳ `other` | Egyéb |  | opció |

### Epikrízis `epi`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `epi.body` | Az okoslelet szövege |  | A generált összefoglaló szövege, ahogy a dokumentumba került. |
| `epi.consult.question` | A konzíliumtól kért kérdés |  | Mit kérdezünk a konzulenstől. |
| `epi.followUp.plan` | Utánkövetési terv |  | Mikor és hova jöjjön vissza a beteg, és mire figyeljen. |
| `epi.gaps.acknowledged` | Az információhiány tudomásul véve |  | A klinikus látta és tudomásul vette az „amit nem tudunk” szakaszt. |
| `epi.generation` | Előállítás módja |  | Hogyan készült a szöveg. |
| ↳ `ruleBased` | Okoslelet — szabályalapú generálás |  | opció |
| ↳ `manual` | Kézzel írt |  | opció |
| ↳ `assisted` | Gépi javaslat, klinikusi átírással |  | opció |
| `epi.outcome.disposition` | Az ellátás kimenetele |  | Hogyan zárult az ellátás. |
| ↳ `home` | Otthonába bocsátva |  | opció |
| ↳ `admitted` | Felvéve |  | opció |
| ↳ `transferred` | Átadva másik intézménynek |  | opció |
| ↳ `selfDischarge` | Saját felelősségre távozott |  | opció |
| ↳ `deceased` | Elhunyt |  | opció |
| ↳ `ongoing` | Az ellátás folyamatban |  | opció |
| `epi.outcome.lengthOfStay` | Ápolási idő [d] |  | Hány napot töltött bent a beteg. |
| `epi.reviewed` | Az okoslelet átnézve |  | A klinikus végigolvasta-e a generált szöveget aláírás előtt. |
| `epi.signedAt` | Az epikrízis aláírásának időpontja |  | Mikor írták alá. |
| `epi.signedBy` | Aláíró |  | Ki írta alá az epikrízist. |
| `epi.style` | Okoslelet stílusa |  | Melyik változat készült. |
| ↳ `clinical` | Klinikai narratíva |  | opció |
| ↳ `sbar` | SBAR átadás |  | opció |
| ↳ `discharge` | Zárójelentés |  | opció |
| ↳ `nursing` | Ápolói összefoglaló |  | opció |
| ↳ `consult` | Konzulensi kérés |  | opció |
| `epi.version` | Verziószám [1] |  | Hányadik változata ez az epikrízisnek. |

### Kimenetel `out`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `out.birth.outcome` | A szülés kimenetele |  | Élve vagy halva született-e a gyermek. |
| ↳ `liveBirth` | Élveszületés |  | opció |
| ↳ `stillbirth` | Halvaszületés |  | opció |
| `out.conAnomaly` | Veleszületett rendellenesség |  | Igazolódott-e veleszületett rendellenesség. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `out.facilityType` | Az ellátó intézmény típusa |  | Hol történt a szülés. |
| ↳ `tertiary` | Progresszív (III. szintű) centrum |  | opció |
| ↳ `secondary` | II. szintű kórház |  | opció |
| ↳ `primary` | I. szintű kórház |  | opció |
| ↳ `birthCentre` | Születésház |  | opció |
| ↳ `home` | Otthonszülés |  | opció |
| `out.icuAdmit` | Anyai intenzív ellátás |  | Szükség volt-e anyai intenzív osztályos ellátásra. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `out.maternal.alive` | Az anya él a 42. napon |  | Ellenőrizve, hogy az anya életben van-e a szülés utáni 42. napon. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `out.maternal.death` | Anyai halál |  | Az anyai halál dátuma, ha bekövetkezett. |
| `out.mlos` | Anyai ápolási idő [d] |  | Hány napot töltött az anya az intézményben. |
| `out.neo.death` | Újszülöttkori halál |  | Az újszülöttkori halál dátuma, ha bekövetkezett. |
| `out.neonate.alive` | Az újszülött él a 42. napon |  | Ellenőrizve, hogy az újszülött életben van-e a 42. napon. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `out.readmit` | Késői anyai szövődmény vagy újrafelvétel |  | Történt-e a szülés után 42 napon belül újrafelvétel vagy szövődmény. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `out.readmit.reason` | Az újrafelvétel oka |  | Miért került sor újrafelvételre. |
| `out.stillbirth` | Halvaszületés |  | A halvaszületés dátuma, ha bekövetkezett. |
| `out.transfusion` | Transzfúzió |  | Kapott-e az anya vérkészítményt. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `out.transfusion.units` | Transzfundált egységek száma [1] |  | Hány egység vörösvérsejt-koncentrátum. |

### Kódolás — BNO és OENO `code`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `code.coder` | A kódoló |  | Ki végezte a kódolást. |
| `code.dx.certainty` | A diagnózis bizonyossága |  | Mennyire biztos a rögzített diagnózis. |
| ↳ `confirmed` | Igazolt |  | opció |
| ↳ `probable` | Valószínű |  | opció |
| ↳ `suspected` | Gyanú |  | opció |
| ↳ `ruledOut` | Kizárva |  | opció |
| `code.dx.primary` | Fődiagnózis (BNO) |  | A kódoló által választott fődiagnózis BNO-kódja. |
| `code.dx.secondary` | Kísérő betegségek (BNO) |  | A kódoló által felvett kísérő diagnózisok. |
| `code.hbcs.final` | Végleges HBCS-besorolás |  | Az intézmény által rögzített végleges besorolás. |
| `code.proc.performed` | Elvégzett beavatkozások (OENO) |  | A kódoló által rögzített OENO-kódok. |
| `code.rulebook.hbcs` | A HBCS-szabálykönyv verziója |  | Melyik évi HBCS-szabálykönyv szerint történt a besorolás. |

### Utánkövetés `utankovetes`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `audit.postop.confirmed` | Műtét utáni diagnózis megerősítve |  | A műtét közben látott kép szembesítése a szövettani lelettel. |
| ↳ `confirmed` | Megerősítve — a referencia ugyanazt mondta |  | opció |
| ↳ `refuted` | Cáfolva — a referencia mást mondott |  | opció |
| ↳ `indeterminate` | A referencia NEM tudott dönteni |  | opció |
| ↳ `noReference` | Nem történt referenciavizsgálat |  | opció |
| `audit.prenatal.confirmed` | A prenatális diagnózis megerősítve? |  | A méhen belül kimondott diagnózis szembesítése a megszületés utáni igazsággal (újszülöttvizsgálat, képalkotás, |
| ↳ `confirmed` | Megerősítve — a referencia ugyanazt mondta |  | opció |
| ↳ `refuted` | Cáfolva — a referencia mást mondott |  | opció |
| ↳ `indeterminate` | A referencia NEM tudott dönteni |  | opció |
| ↳ `noReference` | Nem történt referenciavizsgálat |  | opció |
| `audit.us.confirmed` | UH diagnózis megerősítve |  | Az ultrahangos megítélés szembesítése a műtéti vagy szövettani lelettel. |
| ↳ `confirmed` | Megerősítve — a referencia ugyanazt mondta |  | opció |
| ↳ `refuted` | Cáfolva — a referencia mást mondott |  | opció |
| ↳ `indeterminate` | A referencia NEM tudott dönteni |  | opció |
| ↳ `noReference` | Nem történt referenciavizsgálat |  | opció |

### Utánkövetési hozzájárulás `fu`

| Azonosító | HU | EN | Definíció |
|---|---|---|---|
| `fu.consentToContact` | Hozzájárul az utánkövetéshez |  | Vállalja-e a beteg a szülés utáni megkeresést. |
| ↳ `pos` | Igen |  | opció |
| ↳ `neg` | Nem |  | opció |
| ↳ `unk` | Nem ismert |  | opció |
| `fu.contactAttempts` | Megkeresési kísérletek száma [1] |  | Hányszor próbáltuk elérni a beteget. |
| `fu.contactChannel` | A megkeresés csatornája |  | Hogyan próbáltuk elérni a beteget. |
| ↳ `inPerson` | Személyes megjelenés |  | opció |
| ↳ `phone` | Telefon |  | opció |
| ↳ `email` | E-mail |  | opció |
| ↳ `portal` | Beteg-portál |  | opció |
| ↳ `post` | Posta |  | opció |
| `fu.outcome` | Az utánkövetés kimenetele |  | Mi lett a mérési pont megkeresésének az eredménye. |
| ↳ `returned` | Megjelent / válaszolt |  | opció |
| ↳ `notReached` | Nem sikerült elérni |  | opció |
| ↳ `declined` | Elutasította a részvételt |  | opció |
| ↳ `lost` | Elveszett az utánkövetésből |  | opció |
| ↳ `deceased` | Elhunyt |  | opció |
| ↳ `notAttempted` | Nem volt megkeresés |  | opció |

