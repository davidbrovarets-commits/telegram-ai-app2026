
# RSS FEED DISCOVERY REPORT (READ-ONLY) — 2026-02-09T04:01:10.823Z

## 1. Executive Summary
- **Total Sources Analyzed**: 237
- **HTML Sources (Incorrect Config)**: 231
- **Feeds Successfully Discovered**: 92
- **No Feed Found / Blocked**: 139

## 2. Inventory Stats
| Level       | Total | HTML Configured | Discovery Success |
| :---------- | :---- | :-------------- | :---------------- |
| COUNTRY     | 4     | 1               | 0                 |
| BUNDESLAND  | 62    | 59              | 20                |
| CITY        | 171   | 171             | 72                |

**Reconciliation Notes:**
- "Discovery Success" counts only feeds discovered from HTML pages via `<link rel="alternate">` or safe patterns
- Sources already configured with RSS/Atom at baseline are not included in "Discovery Success" 
- Podcast feeds (2 discovered) are flagged and excluded from news ingestion
- Total Discovery Success: 92 (20 Bundesland + 72 City + 0 Country)

## 3. Discovered Feeds (Actionable Replacements)
| Source ID | Current HTML URL | Discovered RSS Feed | Evidence |
| :--- | :--- | :--- | :--- |
| **bw_swr** | `https://www.swr.de/bw` | `https://www.swr.de/~atom/swraktuell/baden-wuerttemberg/index.xml` | link[alternate] |
| **bw_stuttgarter_zeitung** | `https://www.stuttgarter-zeitung.de` | `https://cdn.julephosting.de/podcasts/580-schwabisch-fur-anfanger/feed.rss` | link[alternate] \| EXCLUDED_PODCAST |
| **be_rbb24** | `https://www.rbb24.de` | `https://www.rbb24.de/index.xml/feed=rss.xml` | link[alternate] |
| **be_morgenpost** | `https://www.morgenpost.de` | `https://www.morgenpost.de/rss` | link[alternate] |
| **be_taz** | `https://taz.de` | `https://taz.de/rss.xml` | link[alternate] |
| **hb_butenunbinnen** | `https://www.butenunbinnen.de` | `https://www.butenunbinnen.de/feed/rss/neuste-inhalte100.xml` | link[alternate] |
| **hb_weser_kurier** | `https://www.weser-kurier.de` | `https://www.weser-kurier.de/?view=rss` | link[alternate] |
| **hh_abendblatt** | `https://www.abendblatt.de` | `https://www.abendblatt.de/rss` | link[alternate] |
| **he_faz** | `https://www.faz.net` | `https://www.faz.net/rss/aktuell/` | link[alternate] |
| **nrw_wdr** | `https://www1.wdr.de` | `https://www1.wdr.de/uebersicht-100.feed` | link[alternate] |
| **nrw_rp** | `https://www.rp-online.de` | `https://www.rp-online.de/feed.rss` | link[alternate] |
| **nrw_waz** | `https://www.waz.de` | `https://www.waz.de/rss` | link[alternate] |
| **nrw_ruhr_nachrichten** | `https://www.ruhrnachrichten.de` | `https://www.ruhrnachrichten.de/feed/` | link[alternate] |
| **nrw_nw** | `https://www.nw.de` | `https://www.nw.de/_export/site_rss/nw/index.rss` | link[alternate] |
| **rp_volksfreund** | `https://www.volksfreund.de` | `https://www.volksfreund.de/feed.rss` | link[alternate] |
| **sl_saarbruecker_zeitung** | `https://www.saarbruecker-zeitung.de` | `https://www.saarbruecker-zeitung.de/feed.rss` | link[alternate] |
| **sl_saarnews** | `https://www.saarnews.com` | `https://www.saarnews.com/feed/` | link[alternate] |
| **sn_mdr** | `https://www.mdr.de/sachsen` | `https://www.mdr.de/nachrichten/sachsen/sachsen-nachrichtenfeed-100-rss.xml` | link[alternate] |
| **st_mdr** | `https://www.mdr.de/sachsen-anhalt` | `https://www.mdr.de/nachrichten/sachsen-anhalt/sachsen-anhalt-nachrichtenfeed-100-rss.xml` | link[alternate] |
| **th_mdr** | `https://www.mdr.de/thueringen` | `https://www.mdr.de/nachrichten/thueringen/thueringen-nachrichtenfeed-100-rss.xml` | link[alternate] |
| **th_thueringer_allgemeine** | `https://www.thueringer-allgemeine.de` | `https://www.thueringer-allgemeine.de/rss` | link[alternate] |
| **th_otz** | `https://www.otz.de` | `https://www.otz.de/rss` | link[alternate] |
| **th_tlz** | `https://www.tlz.de` | `https://www.tlz.de/rss` | link[alternate] |
| **leipzig_mdr** | `https://www.mdr.de/sachsen/leipzig/index.html` | `https://www.mdr.de/nachrichten/sachsen/leipzig/region-leipzig-nachrichtenfeed100-rss.xml` | link[alternate] |
| **koeln_official** | `https://www.stadt-koeln.de/` | `https://www.stadt-koeln.de/externe-dienste/rss/pressemeldungen.xml` | link[alternate] |
| **koeln_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **stuttgart_swr** | `https://www.swr.de/swraktuell/baden-wuerttemberg/` | `https://www.swr.de/~atom/swraktuell/baden-wuerttemberg/index.xml` | link[alternate] |
| **stuttgart_stz** | `https://www.stuttgarter-zeitung.de/` | `https://cdn.julephosting.de/podcasts/580-schwabisch-fur-anfanger/feed.rss` | link[alternate] \| EXCLUDED_PODCAST |
| **duesseldorf_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **duesseldorf_rp** | `https://rp-online.de/nrw/staedte/duesseldorf/` | `https://rp-online.de/nrw/staedte/duesseldorf/feed.rss` | link[alternate] |
| **dortmund_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **dortmund_ruhr** | `https://www.ruhrnachrichten.de/dortmund/` | `https://www.ruhrnachrichten.de/feed/` | link[alternate] |
| **essen_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **essen_waz** | `https://www.waz.de/staedte/essen/` | `https://www.waz.de/lokales/essen/rss` | link[alternate] |
| **nuernberg_nn** | `https://www.nordbayern.de/region/nuernberg` | `https://www.nordbayern.de/nuernberg?isRss=true` | link[alternate] |
| **dresden_official** | `https://www.dresden.de/` | `https://www.dresden.de/konfiguration/rss/rss-feed-pressemitteilungen.rss` | link[alternate] |
| **dresden_mdr** | `https://www.mdr.de/sachsen/dresden/index.html` | `https://www.mdr.de/nachrichten/sachsen/dresden/region-dresden-nachrichtenfeed100-rss.xml` | link[alternate] |
| **duisburg_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **duisburg_waz** | `https://www.waz.de/staedte/duisburg/` | `https://www.waz.de/lokales/duisburg/rss` | link[alternate] |
| **bochum_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **bochum_waz** | `https://www.waz.de/staedte/bochum/` | `https://www.waz.de/lokales/bochum/rss` | link[alternate] |
| **wuppertal_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **wuppertal_rundschau** | `https://www.wuppertaler-rundschau.de/` | `https://www.wuppertaler-rundschau.de/feed.rss` | link[alternate] |
| **bielefeld_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **bielefeld_nw** | `https://www.nw.de/` | `https://www.nw.de/_export/site_rss/nw/index.rss` | link[alternate] |
| **bonn_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **bonn_ga** | `https://ga.de/` | `https://ga.de/feed.rss` | link[alternate] |
| **muenster_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **karlsruhe_swr** | `https://www.swr.de/swraktuell/baden-wuerttemberg/` | `https://www.swr.de/~atom/swraktuell/baden-wuerttemberg/index.xml` | link[alternate] |
| **karlsruhe_bnn** | `https://bnn.de/karlsruhe` | `https://bnn.de/feed` | link[alternate] |
| **mannheim_swr** | `https://www.swr.de/swraktuell/baden-wuerttemberg/` | `https://www.swr.de/~atom/swraktuell/baden-wuerttemberg/index.xml` | link[alternate] |
| **potsdam_ard** | `https://www.tagesschau.de/inland/regional/brandenburg/` | `https://www.tagesschau.de/inland/regional/brandenburg/index~atom.xml` | link[alternate] |
| **bremen_ard** | `https://www.tagesschau.de/inland/regional/bremen/` | `https://www.tagesschau.de/inland/regional/bremen/index~atom.xml` | link[alternate] |
| **bremen_wk** | `https://www.weser-kurier.de/` | `https://www.weser-kurier.de/?view=rss` | link[alternate] |
| **hamburg_ard** | `https://www.tagesschau.de/inland/regional/hamburg/` | `https://www.tagesschau.de/inland/regional/hamburg/index~atom.xml` | link[alternate] |
| **hamburg_abendblatt** | `https://www.abendblatt.de/` | `https://www.abendblatt.de/rss` | link[alternate] |
| **wiesbaden_ard** | `https://www.tagesschau.de/inland/regional/hessen/` | `https://www.tagesschau.de/inland/regional/hessen/index~atom.xml` | link[alternate] |
| **schwerin_official** | `https://www.schwerin.de/` | `https://www.schwerin.de/feeds/ausschreibungen.xml` | link[alternate] |
| **mainz_official** | `https://www.mainz.de/` | `https://www.mainz.de/index.php?sp-mode=rss` | link[alternate] |
| **mainz_ard** | `https://www.tagesschau.de/inland/regional/rheinlandpfalz/` | `https://www.tagesschau.de/inland/regional/rheinlandpfalz/index~atom.xml` | link[alternate] |
| **saarbruecken_ard** | `https://www.tagesschau.de/inland/regional/saarland/` | `https://www.tagesschau.de/inland/regional/saarland/index~atom.xml` | link[alternate] |
| **saarbruecken_sz** | `https://www.saarbruecker-zeitung.de/` | `https://www.saarbruecker-zeitung.de/feed.rss` | link[alternate] |
| **magdeburg_official** | `https://www.magdeburg.de/` | `https://www.magdeburg.de/media/rss/Veranstaltungsexport.xml` | link[alternate] |
| **magdeburg_ard** | `https://www.tagesschau.de/inland/regional/sachsenanhalt/` | `https://www.tagesschau.de/inland/regional/sachsenanhalt/index~atom.xml` | link[alternate] |
| **erfurt_ard** | `https://www.tagesschau.de/inland/regional/thueringen/` | `https://www.tagesschau.de/inland/regional/thueringen/index~atom.xml` | link[alternate] |
| **erfurt_ta** | `https://www.thueringer-allgemeine.de/lokales/erfurt/` | `https://www.thueringer-allgemeine.de/lokales/erfurt/rss` | link[alternate] |
| **chemnitz_mdr** | `https://www.mdr.de/sachsen/chemnitz/index.html` | `https://www.mdr.de/nachrichten/sachsen/chemnitz/region-chemnitz-nachrichtenfeed100-rss.xml` | link[alternate] |
| **halle_mdr** | `https://www.mdr.de/sachsen-anhalt/halle/index.html` | `https://www.mdr.de/nachrichten/sachsen-anhalt/halle/region-halle-nachrichtenfeed100-rss.xml` | link[alternate] |
| **rostock_ard** | `https://www.tagesschau.de/inland/regional/mecklenburgvorpommern/` | `https://www.tagesschau.de/inland/regional/mecklenburgvorpommern/index~atom.xml` | link[alternate] |
| **cottbus_ard** | `https://www.tagesschau.de/inland/regional/brandenburg/` | `https://www.tagesschau.de/inland/regional/brandenburg/index~atom.xml` | link[alternate] |
| **frankfurt_oder_official** | `https://www.frankfurt-oder.de/` | `https://www.frankfurt-oder.de/media/rss/Pressemtteilungen.xml` | link[alternate] |
| **frankfurt_oder_ard** | `https://www.tagesschau.de/inland/regional/brandenburg/` | `https://www.tagesschau.de/inland/regional/brandenburg/index~atom.xml` | link[alternate] |
| **aachen_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **gelsenkirchen_official** | `https://www.gelsenkirchen.de/` | `https://www.gelsenkirchen.de/de/_meta/Aktuelles/artikel/newsfeed/` | link[alternate] |
| **gelsenkirchen_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **gelsenkirchen_waz** | `https://www.waz.de/staedte/gelsenkirchen/` | `https://www.waz.de/lokales/gelsenkirchen/rss` | link[alternate] |
| **oberhausen_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **oberhausen_waz** | `https://www.waz.de/staedte/oberhausen/` | `https://www.waz.de/lokales/oberhausen/rss` | link[alternate] |
| **braunschweig_bz** | `https://www.braunschweiger-zeitung.de/` | `https://www.braunschweiger-zeitung.de/rss` | link[alternate] |
| **kaiserslautern_ard** | `https://www.tagesschau.de/inland/regional/rheinlandpfalz/` | `https://www.tagesschau.de/inland/regional/rheinlandpfalz/index~atom.xml` | link[alternate] |
| **moenchengladbach_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **moenchengladbach_rp** | `https://rp-online.de/nrw/staedte/moenchengladbach/` | `https://rp-online.de/nrw/staedte/moenchengladbach/feed.rss` | link[alternate] |
| **bremerhaven_ard** | `https://www.tagesschau.de/inland/regional/bremen/` | `https://www.tagesschau.de/inland/regional/bremen/index~atom.xml` | link[alternate] |
| **ulm_swr** | `https://www.swr.de/swraktuell/baden-wuerttemberg/` | `https://www.swr.de/~atom/swraktuell/baden-wuerttemberg/index.xml` | link[alternate] |
| **heidelberg_swr** | `https://www.swr.de/swraktuell/baden-wuerttemberg/` | `https://www.swr.de/~atom/swraktuell/baden-wuerttemberg/index.xml` | link[alternate] |
| **trier_ard** | `https://www.tagesschau.de/inland/regional/rheinlandpfalz/` | `https://www.tagesschau.de/inland/regional/rheinlandpfalz/index~atom.xml` | link[alternate] |
| **trier_volksfreund** | `https://www.volksfreund.de/region/trier/` | `https://www.volksfreund.de/region/trier-trierer-land/feed.rss` | link[alternate] |
| **recklinghausen_official** | `https://www.recklinghausen.de/` | `http://eservice2.gkd-re.de/selfdbinter320/feed320.rss?db=513&form=list&searchfieldBeginndatum.max=heute&searchfieldAblaufdatum.min=heute&fieldSichtbarkeit=aktuell&feedname=Aktuelle%20News%20aus%20Recklinghausen` | link[alternate] |
| **recklinghausen_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **krefeld_wdr** | `https://www1.wdr.de/nachrichten/index.html` | `https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed` | link[alternate] |
| **krefeld_rp** | `https://rp-online.de/nrw/staedte/krefeld/` | `https://rp-online.de/nrw/staedte/krefeld/feed.rss` | link[alternate] |
| **luebeck_ard** | `https://www.tagesschau.de/inland/regional/schleswigholstein/` | `https://www.tagesschau.de/inland/regional/schleswigholstein/index~atom.xml` | link[alternate] |

## 4. No Feed Found (Manual Intervention Required)
| Source ID | Current URL | Failure Reason |
| :--- | :--- | :--- |
| zeit_index | `https://newsfeed.zeit.de/index` | no_link_tag |
| bw_stuttgarter_nachrichten | `https://www.stuttgarter-nachrichten.de` | no_link_tag |
| bw_badische_zeitung | `https://www.badische-zeitung.de` | no_link_tag |
| bw_suedkurier | `https://www.suedkurier.de` | no_link_tag |
| by_br | `https://www.br.de` | no_link_tag |
| by_sueddeutsche | `https://www.sueddeutsche.de` | no_link_tag |
| by_augsburger_allgemeine | `https://www.augsburger-allgemeine.de` | no_link_tag |
| by_muenchner_merkur | `https://www.merkur.de` | no_link_tag |
| by_mittelbayerische | `https://www.mittelbayerische.de` | no_link_tag |
| be_tagesspiegel | `https://www.tagesspiegel.de` | no_link_tag |
| be_berliner_zeitung | `https://www.berliner-zeitung.de` | no_link_tag |
| bb_rbb24 | `https://www.rbb24.de/brandenburg` | fetch_fail:404 |
| bb_pnn | `https://www.pnn.de` | no_link_tag |
| bb_maz | `https://www.maz-online.de` | no_link_tag |
| bb_lr | `https://www.lr-online.de` | no_link_tag |
| bb_moz | `https://www.moz.de` | no_link_tag |
| hb_bremer_nachrichten | `https://www.weser-kurier.de/bremer-nachrichten` | fetch_fail:404 |
| hb_radio_bremen | `https://www.radiobremen.de` | no_link_tag |
| hb_nordsee_zeitung | `https://www.nordsee-zeitung.de` | no_link_tag |
| hh_ndr | `https://www.ndr.de/nachrichten/hamburg` | no_link_tag |
| hh_mopo | `https://www.mopo.de` | no_link_tag |
| hh_tide | `https://www.tide.de` | no_link_tag |
| hh_volksblatt | `https://www.volksblatt.de` | fetch_fail:408 |
| he_hr | `https://www.hr.de` | no_link_tag |
| he_fr | `https://www.fr.de` | no_link_tag |
| he_hna | `https://www.hna.de` | no_link_tag |
| he_wiesbadener_kurier | `https://www.wiesbadener-kurier.de` | no_link_tag |
| mv_ndr | `https://www.ndr.de/nachrichten/mecklenburg-vorpommern` | no_link_tag |
| mv_nordkurier | `https://www.nordkurier.de` | no_link_tag |
| mv_ostsee_zeitung | `https://www.ostsee-zeitung.de` | no_link_tag |
| mv_svz | `https://www.svz.de` | no_link_tag |
| mv_ln | `https://www.ln-online.de` | no_link_tag |
| ni_ndr | `https://www.ndr.de/nachrichten/niedersachsen` | no_link_tag |
| ni_haz | `https://www.haz.de` | no_link_tag |
| ni_noz | `https://www.noz.de` | no_link_tag |
| ni_nwz | `https://www.nwzonline.de` | no_link_tag |
| ni_cell | `https://www.cellesche-zeitung.de` | no_link_tag |
| rp_swr | `https://www.swr.de/rps` | fetch_fail:404 |
| rp_rheinpfalz | `https://www.rheinpfalz.de` | no_link_tag |
| rp_rhein_zeitung | `https://www.rhein-zeitung.de` | no_link_tag |
| rp_allgemeine_zeitung_mainz | `https://www.allgemeine-zeitung.de` | no_link_tag |
| sl_sr | `https://www.sr.de` | no_link_tag |
| sl_sol | `https://www.sol.de` | blocked:403 |
| sl_bliestal | `https://www.bliestal.de` | fetch_fail:0 |
| sn_saechsische | `https://www.saechsische.de` | no_link_tag |
| sn_lvz | `https://www.lvz.de` | no_link_tag |
| sn_freiepresse | `https://www.freiepresse.de` | no_link_tag |
| sn_dnn | `https://www.dnn.de` | no_link_tag |
| st_mz | `https://www.mz.de` | no_link_tag |
| st_volksstimme | `https://www.volksstimme.de` | no_link_tag |
| st_magdeburg_volksstimme | `https://www.volksstimme.de/magdeburg` | no_link_tag |
| st_halle_news | `https://www.halle.de` | no_link_tag |
| sh_ndr | `https://www.ndr.de/nachrichten/schleswig-holstein` | no_link_tag |
| sh_kn | `https://www.kn-online.de` | no_link_tag |
| sh_ln | `https://www.ln-online.de` | no_link_tag |
| sh_shz | `https://www.shz.de` | no_link_tag |
| sh_flensburger_tageblatt | `https://www.flensburger-tageblatt.de` | fetch_fail:0 |
| th_freies_wort | `https://www.freies-wort.de` | fetch_fail:408 |
| leipzig_official | `https://www.leipzig.de/` | no_link_tag |
| leipzig_lvz | `https://www.lvz.de/` | no_link_tag |
| muenchen_official | `https://www.muenchen.de/` | no_link_tag |
| muenchen_br | `https://www.br.de/nachrichten/bayern/` | no_link_tag |
| muenchen_sz | `https://www.sueddeutsche.de/muenchen` | no_link_tag |
| koeln_ksta | `https://www.ksta.de/` | no_link_tag |
| frankfurt_official | `https://www.frankfurt.de/` | blocked:403 |
| frankfurt_hr | `https://www.hessenschau.de/` | no_link_tag |
| frankfurt_fr | `https://www.fr.de/frankfurt/` | no_link_tag |
| stuttgart_official | `https://www.stuttgart.de/` | no_link_tag |
| duesseldorf_official | `https://www.duesseldorf.de/` | no_link_tag |
| dortmund_official | `https://www.dortmund.de/` | no_link_tag |
| essen_official | `https://www.essen.de/` | no_link_tag |
| hannover_official | `https://www.hannover.de/` | no_link_tag |
| hannover_ndr | `https://www.ndr.de/nachrichten/niedersachsen/` | no_link_tag |
| hannover_haz | `https://www.haz.de/` | no_link_tag |
| nuernberg_official | `https://www.nuernberg.de/` | no_link_tag |
| nuernberg_br | `https://www.br.de/nachrichten/bayern/` | no_link_tag |
| dresden_sz | `https://www.saechsische.de/` | no_link_tag |
| duisburg_official | `https://www.duisburg.de/` | no_link_tag |
| bochum_official | `https://www.bochum.de/` | no_link_tag |
| wuppertal_official | `https://www.wuppertal.de/` | blocked:403 |
| bielefeld_official | `https://www.bielefeld.de/` | no_link_tag |
| bonn_official | `https://www.bonn.de/` | no_link_tag |
| muenster_official | `https://www.muenster.de/` | no_link_tag |
| muenster_wn | `https://www.wn.de/` | no_link_tag |
| karlsruhe_official | `https://www.karlsruhe.de/` | no_link_tag |
| mannheim_official | `https://www.mannheim.de/` | no_link_tag |
| mannheim_mm | `https://www.mannheimer-morgen.de/` | no_link_tag |
| augsburg_official | `https://www.augsburg.de/` | no_link_tag |
| augsburg_br | `https://www.br.de/nachrichten/bayern/` | no_link_tag |
| augsburg_aa | `https://www.augsburger-allgemeine.de/augsburg/` | no_link_tag |
| potsdam_official | `https://www.potsdam.de/de` | no_link_tag |
| potsdam_pnn | `https://www.tagesspiegel.de/potsdam/` | no_link_tag |
| bremen_official | `https://www.bremen.de/` | blocked:403 |
| hamburg_official | `https://www.hamburg.de/` | no_link_tag |
| wiesbaden_official | `https://www.wiesbaden.de/` | no_link_tag |
| wiesbaden_wk | `https://www.wiesbadener-kurier.de/` | no_link_tag |
| schwerin_ard | `https://www.tagesschau.de/inland/regional/mecklenburgvorpommern/` | link[alternate] |
| schwerin_svz | `https://www.svz.de/lokales/schwerin/` | no_link_tag |
| mainz_az | `https://www.allgemeine-zeitung.de/lokales/mainz/` | no_link_tag |
| saarbruecken_official | `https://www.saarbruecken.de/` | no_link_tag |
| magdeburg_volksstimme | `https://www.volksstimme.de/lokal/magdeburg` | no_link_tag |
| kiel_official | `https://www.kiel.de/` | no_link_tag |
| kiel_ard | `https://www.tagesschau.de/inland/regional/schleswigholstein/` | link[alternate] |
| kiel_kn | `https://www.kn-online.de/` | no_link_tag |
| erfurt_official | `https://www.erfurt.de/` | no_link_tag |
| chemnitz_official | `https://www.chemnitz.de/` | no_link_tag |
| chemnitz_fp | `https://www.freiepresse.de/chemnitz/` | no_link_tag |
| halle_official | `https://www.halle.de/` | no_link_tag |
| halle_mz | `https://www.mz.de/lokal/halle-saale` | no_link_tag |
| rostock_official | `https://www.rostock.de/` | no_link_tag |
| rostock_ostsee | `https://www.ostsee-zeitung.de/rostock` | no_link_tag |
| cottbus_official | `https://www.cottbus.de/` | fetch_fail:0 |
| cottbus_lr | `https://www.lr-online.de/lausitz/cottbus/` | no_link_tag |
| frankfurt_oder_moz | `https://www.moz.de/lokales/frankfurt-oder/` | no_link_tag |
| aachen_official | `https://www.aachen.de/` | no_link_tag |
| aachen_az | `https://www.aachener-zeitung.de/` | fetch_fail:0 |
| oberhausen_official | `https://www.oberhausen.de/` | no_link_tag |
| wolfsburg_official | `https://www.wolfsburg.de/` | fetch_fail:408 |
| wolfsburg_ndr | `https://www.ndr.de/nachrichten/niedersachsen/` | no_link_tag |
| wolfsburg_waz | `https://www.waz-online.de/region/wolfsburg/` | fetch_fail:404 |
| braunschweig_official | `https://www.braunschweig.de/` | no_link_tag |
| braunschweig_ndr | `https://www.ndr.de/nachrichten/niedersachsen/` | no_link_tag |
| kaiserslautern_official | `https://www.kaiserslautern.de/` | no_link_tag |
| kaiserslautern_rp | `https://www.rheinpfalz.de/lokal/kaiserslautern/` | no_link_tag |
| moenchengladbach_official | `https://www.moenchengladbach.de/` | no_link_tag |
| bremerhaven_official | `https://www.bremerhaven.de/` | no_link_tag |
| bremerhaven_nordsee | `https://www.nordsee-zeitung.de/Region/Bremerhaven` | fetch_fail:404 |
| ulm_official | `https://www.ulm.de/` | no_link_tag |
| ulm_swp | `https://www.swp.de/lokales/ulm/` | no_link_tag |
| heidelberg_official | `https://www.heidelberg.de/` | no_link_tag |
| heidelberg_rnz | `https://www.rnz.de/region/heidelberg/` | no_link_tag |
| trier_official | `https://www.trier.de/` | no_link_tag |
| recklinghausen_waz | `https://www.waz.de/staedte/recklinghausen/` | fetch_fail:404 |
| krefeld_official | `https://www.krefeld.de/` | no_link_tag |
| luebeck_official | `https://www.luebeck.de/` | no_link_tag |
| luebeck_ln | `https://www.ln-online.de/lokales/luebeck/` | no_link_tag |
| regensburg_official | `https://www.regensburg.de/` | no_link_tag |
| regensburg_br | `https://www.br.de/nachrichten/bayern/` | no_link_tag |
| regensburg_mz | `https://www.mittelbayerische.de/region/regensburg/` | no_link_tag |

