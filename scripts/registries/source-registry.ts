export const SOURCE_REGISTRY = [
    // --- L1: COUNTRY (GERMANY) ---
    {
        source_id: "breg_bundesregierung_news",
        name: "Bundesregierung (News)",
        base_url: "https://www.bundesregierung.de/breg-de/@@rssFeedReader/RSS?",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss",
        default_priority: "HIGH",
    },
    {
        source_id: "bk_rede",
        name: "Bundeskanzler (Reden)",
        base_url: "https://www.bundeskanzler.de/bk-de/service/rss-feed/1859760-1859760",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss",
        default_priority: "HIGH",
    },
    {
        source_id: "aa_rss",
        name: "Auswärtiges Amt (RSS)",
        base_url: "https://www.auswaertiges-amt.de/@@rssFeedReader/RSS?",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss",
        default_priority: "HIGH",
    },
    {
        source_id: "bmas_news",
        name: "BMAS (Arbeit & Soziales)",
        base_url: "https://www.bmas.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/RSSNewsfeed.xml",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss",
        default_priority: "HIGH",
    },
    {
        source_id: "zeit_index",
        name: "ZEIT ONLINE (Index)",
        base_url: "https://newsfeed.zeit.de/index",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss",
        default_priority: "MEDIUM",
    },
    {
        source_id: "spiegel_index",
        name: "DER SPIEGEL (Index)",
        base_url: "https://www.spiegel.de/index.rss",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss",
        default_priority: "MEDIUM",
    },
    {
        source_id: "tagesschau_all",
        name: "tagesschau.de (Alle Meldungen)",
        base_url: "https://www.tagesschau.de/infoservices/alle-meldungen-100~rdf.xml",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss",
        default_priority: "HIGH",
    },

    // --- L2: BUNDESLAND (BADEN-WÜRTTEMBERG) ---
    {
        source_id: "bw_swr",
        name: "SWR Baden-Württemberg",
        base_url: "https://www.swr.de/bw",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "bw_stuttgarter_zeitung",
        name: "Stuttgarter Zeitung",
        base_url: "https://www.stuttgarter-zeitung.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bw_stuttgarter_nachrichten",
        name: "Stuttgarter Nachrichten",
        base_url: "https://www.stuttgarter-nachrichten.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bw_badische_zeitung",
        name: "Badische Zeitung",
        base_url: "https://www.badische-zeitung.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "bw_suedkurier",
        name: "Südkurier",
        base_url: "https://www.suedkurier.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (BAYERN) ---
    {
        source_id: "by_br",
        name: "Bayerischer Rundfunk",
        base_url: "https://www.br.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "by_sueddeutsche",
        name: "Süddeutsche Zeitung",
        base_url: "https://www.sueddeutsche.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "by_augsburger_allgemeine",
        name: "Augsburger Allgemeine",
        base_url: "https://www.augsburger-allgemeine.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "by_muenchner_merkur",
        name: "Münchner Merkur",
        base_url: "https://www.merkur.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "by_mittelbayerische",
        name: "Mittelbayerische Zeitung",
        base_url: "https://www.mittelbayerische.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (BERLIN) ---
    {
        source_id: "be_rbb24",
        name: "rbb24 Berlin",
        base_url: "https://www.rbb24.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "be_tagesspiegel",
        name: "Der Tagesspiegel",
        base_url: "https://www.tagesspiegel.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "be_berliner_zeitung",
        name: "Berliner Zeitung",
        base_url: "https://www.berliner-zeitung.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "be_morgenpost",
        name: "Berliner Morgenpost",
        base_url: "https://www.morgenpost.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "be_taz",
        name: "taz Berlin",
        base_url: "https://taz.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (BRANDENBURG) ---
    {
        source_id: "bb_rbb24",
        name: "rbb24 Brandenburg",
        base_url: "https://www.rbb24.de/brandenburg",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "bb_pnn",
        name: "Potsdamer Neueste Nachrichten",
        base_url: "https://www.pnn.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bb_maz",
        name: "Märkische Allgemeine",
        base_url: "https://www.maz-online.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bb_lr",
        name: "Lausitzer Rundschau",
        base_url: "https://www.lr-online.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "bb_moz",
        name: "Märkische Oderzeitung",
        base_url: "https://www.moz.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (BREMEN) ---
    {
        source_id: "hb_butenunbinnen",
        name: "buten un binnen (Radio Bremen)",
        base_url: "https://www.butenunbinnen.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "hb_weser_kurier",
        name: "Weser-Kurier",
        base_url: "https://www.weser-kurier.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "hb_bremer_nachrichten",
        name: "Bremer Nachrichten",
        base_url: "https://www.weser-kurier.de/bremer-nachrichten",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "hb_radio_bremen",
        name: "Radio Bremen News",
        base_url: "https://www.radiobremen.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "hb_nordsee_zeitung",
        name: "Nordsee-Zeitung",
        base_url: "https://www.nordsee-zeitung.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (HAMBURG) ---
    {
        source_id: "hh_ndr",
        name: "NDR Hamburg",
        base_url: "https://www.ndr.de/nachrichten/hamburg",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "hh_abendblatt",
        name: "Hamburger Abendblatt",
        base_url: "https://www.abendblatt.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "hh_mopo",
        name: "Hamburger Morgenpost",
        base_url: "https://www.mopo.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "hh_tide",
        name: "TIDE Hamburg",
        base_url: "https://www.tide.de",
        language: "de",
        trust_level: "LOW",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "hh_volksblatt",
        name: "Hamburger Volksblatt",
        base_url: "https://www.volksblatt.de",
        language: "de",
        trust_level: "LOW",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (HESSEN) ---
    {
        source_id: "he_hr",
        name: "hr Hessischer Rundfunk",
        base_url: "https://www.hr.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "he_faz",
        name: "Frankfurter Allgemeine Zeitung (FAZ)",
        base_url: "https://www.faz.net",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "he_fr",
        name: "Frankfurter Rundschau",
        base_url: "https://www.fr.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "he_hna",
        name: "Hessische/Niedersächsische Allgemeine (HNA)",
        base_url: "https://www.hna.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "he_wiesbadener_kurier",
        name: "Wiesbadener Kurier",
        base_url: "https://www.wiesbadener-kurier.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (MECKLENBURG-VORPOMMERN) ---
    {
        source_id: "mv_ndr",
        name: "NDR Mecklenburg-Vorpommern",
        base_url: "https://www.ndr.de/nachrichten/mecklenburg-vorpommern",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "mv_nordkurier",
        name: "Nordkurier",
        base_url: "https://www.nordkurier.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "mv_ostsee_zeitung",
        name: "Ostsee-Zeitung",
        base_url: "https://www.ostsee-zeitung.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "mv_svz",
        name: "Schweriner Volkszeitung (SVZ)",
        base_url: "https://www.svz.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "mv_ln",
        name: "Norddeutsche Neueste Nachrichten / LN (regionaalne)",
        base_url: "https://www.ln-online.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (NIEDERSACHSEN) ---
    {
        source_id: "ni_ndr",
        name: "NDR Niedersachsen",
        base_url: "https://www.ndr.de/nachrichten/niedersachsen",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "ni_haz",
        name: "Hannoversche Allgemeine Zeitung (HAZ)",
        base_url: "https://www.haz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "ni_noz",
        name: "Neue Osnabrücker Zeitung (NOZ)",
        base_url: "https://www.noz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "ni_nwz",
        name: "Nordwest-Zeitung (NWZ)",
        base_url: "https://www.nwzonline.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "ni_cell",
        name: "Cellesche Zeitung",
        base_url: "https://www.cellesche-zeitung.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (NORDRHEIN-WESTFALEN) ---
    {
        source_id: "nrw_wdr",
        name: "WDR Nordrhein-Westfalen",
        base_url: "https://www1.wdr.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "nrw_rp",
        name: "Rheinische Post",
        base_url: "https://www.rp-online.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "nrw_waz",
        name: "Westdeutsche Allgemeine Zeitung (WAZ)",
        base_url: "https://www.waz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "nrw_ruhr_nachrichten",
        name: "Ruhr Nachrichten",
        base_url: "https://www.ruhrnachrichten.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "nrw_nw",
        name: "Neue Westfälische",
        base_url: "https://www.nw.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (RHEINLAND-PFALZ) ---
    {
        source_id: "rp_swr",
        name: "SWR Rheinland-Pfalz",
        base_url: "https://www.swr.de/rps",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "rp_rheinpfalz",
        name: "DIE RHEINPFALZ",
        base_url: "https://www.rheinpfalz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "rp_rhein_zeitung",
        name: "Rhein-Zeitung",
        base_url: "https://www.rhein-zeitung.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "rp_allgemeine_zeitung_mainz",
        name: "Allgemeine Zeitung (Mainz)",
        base_url: "https://www.allgemeine-zeitung.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "rp_volksfreund",
        name: "Trierischer Volksfreund",
        base_url: "https://www.volksfreund.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (SAARLAND) ---
    {
        source_id: "sl_sr",
        name: "SR Saarländischer Rundfunk",
        base_url: "https://www.sr.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "sl_saarbruecker_zeitung",
        name: "Saarbrücker Zeitung",
        base_url: "https://www.saarbruecker-zeitung.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "sl_sol",
        name: "SOL.DE (Saarland Online)",
        base_url: "https://www.sol.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "sl_saarnews",
        name: "Saarnews",
        base_url: "https://www.saarnews.com",
        language: "de",
        trust_level: "LOW",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "sl_bliestal",
        name: "Bliestal Nachrichten (kohalik/regionaalne)",
        base_url: "https://www.bliestal.de",
        language: "de",
        trust_level: "LOW",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (SACHSEN) ---
    {
        source_id: "sn_mdr",
        name: "MDR Sachsen",
        base_url: "https://www.mdr.de/sachsen",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "sn_saechsische",
        name: "Sächsische Zeitung",
        base_url: "https://www.saechsische.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "sn_lvz",
        name: "Leipziger Volkszeitung (LVZ)",
        base_url: "https://www.lvz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "sn_freiepresse",
        name: "Freie Presse",
        base_url: "https://www.freiepresse.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "sn_dnn",
        name: "Dresdner Neueste Nachrichten (DNN)",
        base_url: "https://www.dnn.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (SACHSEN-ANHALT) ---
    {
        source_id: "st_mdr",
        name: "MDR Sachsen-Anhalt",
        base_url: "https://www.mdr.de/sachsen-anhalt",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "st_mz",
        name: "Mitteldeutsche Zeitung (MZ)",
        base_url: "https://www.mz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "st_volksstimme",
        name: "Volksstimme",
        base_url: "https://www.volksstimme.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "st_magdeburg_volksstimme",
        name: "Volksstimme Magdeburg",
        base_url: "https://www.volksstimme.de/magdeburg",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "st_halle_news",
        name: "Halle (Saale) – Stadt/News",
        base_url: "https://www.halle.de",
        language: "de",
        trust_level: "LOW",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (SCHLESWIG-HOLSTEIN) ---
    {
        source_id: "sh_ndr",
        name: "NDR Schleswig-Holstein",
        base_url: "https://www.ndr.de/nachrichten/schleswig-holstein",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "sh_kn",
        name: "Kieler Nachrichten (KN)",
        base_url: "https://www.kn-online.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "sh_ln",
        name: "Lübecker Nachrichten (LN)",
        base_url: "https://www.ln-online.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "sh_shz",
        name: "sh:z Schleswig-Holsteinischer Zeitungsverlag",
        base_url: "https://www.shz.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "sh_flensburger_tageblatt",
        name: "Flensburger Tageblatt",
        base_url: "https://www.flensburger-tageblatt.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },

    // --- L2: BUNDESLAND (THÜRINGEN) ---
    {
        source_id: "th_mdr",
        name: "MDR Thüringen",
        base_url: "https://www.mdr.de/thueringen",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "HIGH"
    },
    {
        source_id: "th_thueringer_allgemeine",
        name: "Thüringer Allgemeine",
        base_url: "https://www.thueringer-allgemeine.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "th_otz",
        name: "Ostthüringer Zeitung (OTZ)",
        base_url: "https://www.otz.de",
        language: "de",
        trust_level: "HIGH",
        ingestion_method: "rss",
        default_priority: "MEDIUM"
    },
    {
        source_id: "th_freies_wort",
        name: "Freies Wort",
        base_url: "https://www.freies-wort.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    },
    {
        source_id: "th_tlz",
        name: "Thüringische Landeszeitung (TLZ)",
        base_url: "https://www.tlz.de",
        language: "de",
        trust_level: "MEDIUM",
        ingestion_method: "rss",
        default_priority: "LOW"
    }

] as const;
