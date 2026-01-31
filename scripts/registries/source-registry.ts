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
    },

    // --- L3: CITY (LEIPZIG) ---
    {
        source_id: "leipzig_official",
        name: "Stadt Leipzig – Offizielles Stadtportal",
        base_url: "https://www.leipzig.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "leipzig_mdr",
        name: "MDR Sachsen – Leipzig",
        base_url: "https://www.mdr.de/sachsen/leipzig/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "leipzig_lvz",
        name: "Leipziger Volkszeitung (LVZ)",
        base_url: "https://www.lvz.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (MÜNCHEN) ---
    {
        source_id: "muenchen_official",
        name: "Stadt München – Offizielles Portal",
        base_url: "https://www.muenchen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "muenchen_br",
        name: "BR Nachrichten – Bayern",
        base_url: "https://www.br.de/nachrichten/bayern/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "muenchen_sz",
        name: "Süddeutsche Zeitung – München",
        base_url: "https://www.sueddeutsche.de/muenchen",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (KÖLN) ---
    {
        source_id: "koeln_official",
        name: "Stadt Köln – Offizielles Portal",
        base_url: "https://www.stadt-koeln.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "koeln_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "koeln_ksta",
        name: "Kölner Stadt-Anzeiger",
        base_url: "https://www.ksta.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (FRANKFURT AM MAIN) ---
    {
        source_id: "frankfurt_official",
        name: "Stadt Frankfurt am Main",
        base_url: "https://www.frankfurt.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "frankfurt_hr",
        name: "Hessenschau (hr)",
        base_url: "https://www.hessenschau.de/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "frankfurt_fr",
        name: "Frankfurter Rundschau – Frankfurt",
        base_url: "https://www.fr.de/frankfurt/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (STUTTGART) ---
    {
        source_id: "stuttgart_official",
        name: "Stadt Stuttgart",
        base_url: "https://www.stuttgart.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "stuttgart_swr",
        name: "SWR Aktuell – Baden-Württemberg",
        base_url: "https://www.swr.de/swraktuell/baden-wuerttemberg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "stuttgart_stz",
        name: "Stuttgarter Zeitung",
        base_url: "https://www.stuttgarter-zeitung.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (DÜSSELDORF) ---
    {
        source_id: "duesseldorf_official",
        name: "Stadt Düsseldorf",
        base_url: "https://www.duesseldorf.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "duesseldorf_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "duesseldorf_rp",
        name: "Rheinische Post – Düsseldorf",
        base_url: "https://rp-online.de/nrw/staedte/duesseldorf/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (DORTMUND) ---
    {
        source_id: "dortmund_official",
        name: "Stadt Dortmund",
        base_url: "https://www.dortmund.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "dortmund_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "dortmund_ruhr",
        name: "Ruhr Nachrichten – Dortmund",
        base_url: "https://www.ruhrnachrichten.de/dortmund/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (ESSEN) ---
    {
        source_id: "essen_official",
        name: "Stadt Essen",
        base_url: "https://www.essen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "essen_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "essen_waz",
        name: "WAZ – Essen",
        base_url: "https://www.waz.de/staedte/essen/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (HANNOVER) ---
    {
        source_id: "hannover_official",
        name: "Region Hannover / Stadt Hannover",
        base_url: "https://www.hannover.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "hannover_ndr",
        name: "NDR Niedersachsen",
        base_url: "https://www.ndr.de/nachrichten/niedersachsen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "hannover_haz",
        name: "Hannoversche Allgemeine Zeitung",
        base_url: "https://www.haz.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (NÜRNBERG) ---
    {
        source_id: "nuernberg_official",
        name: "Stadt Nürnberg",
        base_url: "https://www.nuernberg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "nuernberg_br",
        name: "BR Nachrichten – Bayern",
        base_url: "https://www.br.de/nachrichten/bayern/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "nuernberg_nn",
        name: "Nürnberger Nachrichten",
        base_url: "https://www.nordbayern.de/region/nuernberg",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (DRESDEN) ---
    {
        source_id: "dresden_official",
        name: "Stadt Dresden",
        base_url: "https://www.dresden.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "dresden_mdr",
        name: "MDR Sachsen – Dresden",
        base_url: "https://www.mdr.de/sachsen/dresden/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "dresden_sz",
        name: "Sächsische Zeitung",
        base_url: "https://www.saechsische.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (DUISBURG) ---
    {
        source_id: "duisburg_official",
        name: "Stadt Duisburg",
        base_url: "https://www.duisburg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "duisburg_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "duisburg_waz",
        name: "WAZ – Duisburg",
        base_url: "https://www.waz.de/staedte/duisburg/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (BOCHUM) ---
    {
        source_id: "bochum_official",
        name: "Stadt Bochum",
        base_url: "https://www.bochum.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "bochum_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bochum_waz",
        name: "WAZ – Bochum",
        base_url: "https://www.waz.de/staedte/bochum/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (WUPPERTAL) ---
    {
        source_id: "wuppertal_official",
        name: "Stadt Wuppertal",
        base_url: "https://www.wuppertal.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "wuppertal_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "wuppertal_rundschau",
        name: "Wuppertaler Rundschau",
        base_url: "https://www.wuppertaler-rundschau.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (BIELEFELD) ---
    {
        source_id: "bielefeld_official",
        name: "Stadt Bielefeld",
        base_url: "https://www.bielefeld.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "bielefeld_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bielefeld_nw",
        name: "Neue Westfälische",
        base_url: "https://www.nw.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (BONN) ---
    {
        source_id: "bonn_official",
        name: "Bundesstadt Bonn",
        base_url: "https://www.bonn.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "bonn_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bonn_ga",
        name: "General-Anzeiger Bonn",
        base_url: "https://ga.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (MÜNSTER) ---
    {
        source_id: "muenster_official",
        name: "Stadt Münster",
        base_url: "https://www.muenster.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "muenster_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "muenster_wn",
        name: "Westfälische Nachrichten",
        base_url: "https://www.wn.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (KARLSRUHE) ---
    {
        source_id: "karlsruhe_official",
        name: "Stadt Karlsruhe",
        base_url: "https://www.karlsruhe.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "karlsruhe_swr",
        name: "SWR Aktuell – Baden-Württemberg",
        base_url: "https://www.swr.de/swraktuell/baden-wuerttemberg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "karlsruhe_bnn",
        name: "Badische Neueste Nachrichten",
        base_url: "https://bnn.de/karlsruhe",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (MANNHEIM) ---
    {
        source_id: "mannheim_official",
        name: "Stadt Mannheim",
        base_url: "https://www.mannheim.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "mannheim_swr",
        name: "SWR Aktuell – Baden-Württemberg",
        base_url: "https://www.swr.de/swraktuell/baden-wuerttemberg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "mannheim_mm",
        name: "Mannheimer Morgen",
        base_url: "https://www.mannheimer-morgen.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (AUGSBURG) ---
    {
        source_id: "augsburg_official",
        name: "Stadt Augsburg",
        base_url: "https://www.augsburg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "rss_or_html",
        default_priority: "HIGH"
    },
    {
        source_id: "augsburg_br",
        name: "BR Nachrichten – Bayern",
        base_url: "https://www.br.de/nachrichten/bayern/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "rss_or_html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "augsburg_aa",
        name: "Augsburger Allgemeine",
        base_url: "https://www.augsburger-allgemeine.de/augsburg/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (POTSDAM - BRANDENBURG) ---
    {
        source_id: "potsdam_official",
        name: "Landeshauptstadt Potsdam (offizielles Stadtportal)",
        base_url: "https://www.potsdam.de/de",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "potsdam_ard",
        name: "ARD Tagesschau – Regional Brandenburg (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/brandenburg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "potsdam_pnn",
        name: "Tagesspiegel Potsdam / PNN (lokale Qualitätsberichte)",
        base_url: "https://www.tagesspiegel.de/potsdam/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (BREMEN - BREMEN) ---
    {
        source_id: "bremen_official",
        name: "Bremen.de (Stadtportal / offizielles Stadtangebot)",
        base_url: "https://www.bremen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "bremen_ard",
        name: "ARD Tagesschau – Regional Bremen (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/bremen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bremen_wk",
        name: "WESER-KURIER (lokale Nachrichten Bremen)",
        base_url: "https://www.weser-kurier.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (HAMBURG - HAMBURG) ---
    {
        source_id: "hamburg_official",
        name: "Hamburg.de (offizielles Stadtportal)",
        base_url: "https://www.hamburg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "hamburg_ard",
        name: "ARD Tagesschau – Regional Hamburg (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/hamburg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "hamburg_abendblatt",
        name: "Hamburger Abendblatt (lokale Nachrichten)",
        base_url: "https://www.abendblatt.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (WIESBADEN - HESSEN) ---
    {
        source_id: "wiesbaden_official",
        name: "Wiesbaden.de (offizielles Stadtportal)",
        base_url: "https://www.wiesbaden.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "wiesbaden_ard",
        name: "ARD Tagesschau – Regional Hessen (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/hessen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "wiesbaden_wk",
        name: "Wiesbadener Kurier (lokale Nachrichten)",
        base_url: "https://www.wiesbadener-kurier.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (SCHWERIN - MECKLENBURG-VORPOMMERN) ---
    {
        source_id: "schwerin_official",
        name: "Landeshauptstadt Schwerin (offizielles Stadtportal)",
        base_url: "https://www.schwerin.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "schwerin_ard",
        name: "ARD Tagesschau – Regional Mecklenburg-Vorpommern (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/mecklenburgvorpommern/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "schwerin_svz",
        name: "Schweriner Volkszeitung (SVZ) – Lokal Schwerin",
        base_url: "https://www.svz.de/lokales/schwerin/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (MAINZ - RHEINLAND-PFALZ) ---
    {
        source_id: "mainz_official",
        name: "Landeshauptstadt Mainz (offizielles Stadtportal)",
        base_url: "https://www.mainz.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "mainz_ard",
        name: "ARD Tagesschau – Regional Rheinland-Pfalz (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/rheinlandpfalz/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "mainz_az",
        name: "Allgemeine Zeitung – Lokales Mainz",
        base_url: "https://www.allgemeine-zeitung.de/lokales/mainz/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (SAARBRÜCKEN - SAARLAND) ---
    {
        source_id: "saarbruecken_official",
        name: "Landeshauptstadt Saarbrücken (offizielles Stadtportal)",
        base_url: "https://www.saarbruecken.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "saarbruecken_ard",
        name: "ARD Tagesschau – Regional Saarland (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/saarland/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "saarbruecken_sz",
        name: "Saarbrücker Zeitung (lokale Nachrichten)",
        base_url: "https://www.saarbruecker-zeitung.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (MAGDEBURG - SACHSEN-ANHALT) ---
    {
        source_id: "magdeburg_official",
        name: "Landeshauptstadt Magdeburg (offizielles Stadtportal)",
        base_url: "https://www.magdeburg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "magdeburg_ard",
        name: "ARD Tagesschau – Regional Sachsen-Anhalt (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/sachsenanhalt/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "magdeburg_volksstimme",
        name: "Volksstimme – Lokales Magdeburg",
        base_url: "https://www.volksstimme.de/lokal/magdeburg",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (KIEL - SCHLESWIG-HOLSTEIN) ---
    {
        source_id: "kiel_official",
        name: "Landeshauptstadt Kiel (offizielles Stadtportal)",
        base_url: "https://www.kiel.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "kiel_ard",
        name: "ARD Tagesschau – Regional Schleswig-Holstein (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/schleswigholstein/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "kiel_kn",
        name: "Kieler Nachrichten (KN) – Online",
        base_url: "https://www.kn-online.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (ERFURT - THÜRINGEN) ---
    {
        source_id: "erfurt_official",
        name: "Erfurt.de (offizielles Stadtportal)",
        base_url: "https://www.erfurt.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "erfurt_ard",
        name: "ARD Tagesschau – Regional Thüringen (öffentlich-rechtlich)",
        base_url: "https://www.tagesschau.de/inland/regional/thueringen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "erfurt_ta",
        name: "Thüringer Allgemeine – Lokales Erfurt",
        base_url: "https://www.thueringer-allgemeine.de/lokales/erfurt/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "rss_or_html",
        default_priority: "LOW"
    },

    // --- L3: CITY (CHEMNITZ - SACHSEN) ---
    {
        source_id: "chemnitz_official",
        name: "Stadt Chemnitz – Offizielles Stadtportal",
        base_url: "https://www.chemnitz.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "chemnitz_mdr",
        name: "MDR Sachsen – Chemnitz",
        base_url: "https://www.mdr.de/sachsen/chemnitz/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "chemnitz_fp",
        name: "Freie Presse – Chemnitz",
        base_url: "https://www.freiepresse.de/chemnitz/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (HALLE (SAALE) - SACHSEN-ANHALT) ---
    {
        source_id: "halle_official",
        name: "Stadt Halle (Saale) – Offizielles Portal",
        base_url: "https://www.halle.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "halle_mdr",
        name: "MDR Sachsen-Anhalt – Halle",
        base_url: "https://www.mdr.de/sachsen-anhalt/halle/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "halle_mz",
        name: "Mitteldeutsche Zeitung – Halle",
        base_url: "https://www.mz.de/lokal/halle-saale",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (ROSTOCK - MECKLENBURG-VORPOMMERN) ---
    {
        source_id: "rostock_official",
        name: "Hanse- und Universitätsstadt Rostock",
        base_url: "https://www.rostock.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "rostock_ard",
        name: "ARD Tagesschau – Regional Mecklenburg-Vorpommern",
        base_url: "https://www.tagesschau.de/inland/regional/mecklenburgvorpommern/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "rostock_ostsee",
        name: "Ostsee-Zeitung – Rostock",
        base_url: "https://www.ostsee-zeitung.de/rostock",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (COTTBUS - BRANDENBURG) ---
    {
        source_id: "cottbus_official",
        name: "Stadt Cottbus / Chóśebuz",
        base_url: "https://www.cottbus.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "cottbus_ard",
        name: "ARD Tagesschau – Regional Brandenburg",
        base_url: "https://www.tagesschau.de/inland/regional/brandenburg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "cottbus_lr",
        name: "Lausitzer Rundschau – Cottbus",
        base_url: "https://www.lr-online.de/lausitz/cottbus/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (FRANKFURT (ODER) - BRANDENBURG) ---
    {
        source_id: "frankfurt_oder_official",
        name: "Stadt Frankfurt (Oder)",
        base_url: "https://www.frankfurt-oder.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "frankfurt_oder_ard",
        name: "ARD Tagesschau – Regional Brandenburg",
        base_url: "https://www.tagesschau.de/inland/regional/brandenburg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "frankfurt_oder_moz",
        name: "Märkische Oderzeitung – Frankfurt (Oder)",
        base_url: "https://www.moz.de/lokales/frankfurt-oder/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (AACHEN - NRW) ---
    {
        source_id: "aachen_official",
        name: "Stadt Aachen – Offizielles Portal",
        base_url: "https://www.aachen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "aachen_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "aachen_az",
        name: "Aachener Zeitung",
        base_url: "https://www.aachener-zeitung.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (GELSENKIRCHEN - NRW) ---
    {
        source_id: "gelsenkirchen_official",
        name: "Stadt Gelsenkirchen",
        base_url: "https://www.gelsenkirchen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "gelsenkirchen_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "gelsenkirchen_waz",
        name: "WAZ – Gelsenkirchen",
        base_url: "https://www.waz.de/staedte/gelsenkirchen/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (OBERHAUSEN - NRW) ---
    {
        source_id: "oberhausen_official",
        name: "Stadt Oberhausen",
        base_url: "https://www.oberhausen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "oberhausen_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "oberhausen_waz",
        name: "WAZ – Oberhausen",
        base_url: "https://www.waz.de/staedte/oberhausen/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (WOLFSBURG - NIEDERSACHSEN) ---
    {
        source_id: "wolfsburg_official",
        name: "Stadt Wolfsburg",
        base_url: "https://www.wolfsburg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "wolfsburg_ndr",
        name: "NDR Niedersachsen",
        base_url: "https://www.ndr.de/nachrichten/niedersachsen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "wolfsburg_waz",
        name: "WAZ – Wolfsburg",
        base_url: "https://www.waz-online.de/region/wolfsburg/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (BRAUNSCHWEIG - NIEDERSACHSEN) ---
    {
        source_id: "braunschweig_official",
        name: "Stadt Braunschweig",
        base_url: "https://www.braunschweig.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "braunschweig_ndr",
        name: "NDR Niedersachsen",
        base_url: "https://www.ndr.de/nachrichten/niedersachsen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "braunschweig_bz",
        name: "Braunschweiger Zeitung",
        base_url: "https://www.braunschweiger-zeitung.de/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (KAISERSLAUTERN - RHEINLAND-PFALZ) ---
    {
        source_id: "kaiserslautern_official",
        name: "Stadt Kaiserslautern – Offizielles Stadtportal",
        base_url: "https://www.kaiserslautern.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "kaiserslautern_ard",
        name: "ARD Tagesschau – Regional Rheinland-Pfalz",
        base_url: "https://www.tagesschau.de/inland/regional/rheinlandpfalz/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "kaiserslautern_rp",
        name: "Rheinpfalz – Kaiserslautern",
        base_url: "https://www.rheinpfalz.de/lokal/kaiserslautern/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (MÖNCHENGLADBACH - NRW) ---
    {
        source_id: "moenchengladbach_official",
        name: "Stadt Mönchengladbach",
        base_url: "https://www.moenchengladbach.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "moenchengladbach_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "moenchengladbach_rp",
        name: "Rheinische Post – Mönchengladbach",
        base_url: "https://rp-online.de/nrw/staedte/moenchengladbach/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (BREMERHAVEN - BREMEN) ---
    {
        source_id: "bremerhaven_official",
        name: "Stadt Bremerhaven",
        base_url: "https://www.bremerhaven.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "bremerhaven_ard",
        name: "ARD Tagesschau – Regional Bremen",
        base_url: "https://www.tagesschau.de/inland/regional/bremen/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "bremerhaven_nordsee",
        name: "Nordsee-Zeitung – Bremerhaven",
        base_url: "https://www.nordsee-zeitung.de/Region/Bremerhaven",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (ULM - BADEN-WÜRTTEMBERG) ---
    {
        source_id: "ulm_official",
        name: "Stadt Ulm",
        base_url: "https://www.ulm.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "ulm_swr",
        name: "SWR Aktuell – Baden-Württemberg",
        base_url: "https://www.swr.de/swraktuell/baden-wuerttemberg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "ulm_swp",
        name: "Südwest Presse – Ulm",
        base_url: "https://www.swp.de/lokales/ulm/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (HEIDELBERG - BADEN-WÜRTTEMBERG) ---
    {
        source_id: "heidelberg_official",
        name: "Stadt Heidelberg",
        base_url: "https://www.heidelberg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "heidelberg_swr",
        name: "SWR Aktuell – Baden-Württemberg",
        base_url: "https://www.swr.de/swraktuell/baden-wuerttemberg/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "heidelberg_rnz",
        name: "Rhein-Neckar-Zeitung – Heidelberg",
        base_url: "https://www.rnz.de/region/heidelberg/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (TRIER - RHEINLAND-PFALZ) ---
    {
        source_id: "trier_official",
        name: "Stadt Trier",
        base_url: "https://www.trier.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "trier_ard",
        name: "ARD Tagesschau – Regional Rheinland-Pfalz",
        base_url: "https://www.tagesschau.de/inland/regional/rheinlandpfalz/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "trier_volksfreund",
        name: "Trierischer Volksfreund",
        base_url: "https://www.volksfreund.de/region/trier/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (RECKLINGHAUSEN - NRW) ---
    {
        source_id: "recklinghausen_official",
        name: "Stadt Recklinghausen",
        base_url: "https://www.recklinghausen.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "recklinghausen_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "recklinghausen_waz",
        name: "WAZ – Recklinghausen",
        base_url: "https://www.waz.de/staedte/recklinghausen/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (KREFELD - NRW) ---
    {
        source_id: "krefeld_official",
        name: "Stadt Krefeld",
        base_url: "https://www.krefeld.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "krefeld_wdr",
        name: "WDR Nachrichten – NRW",
        base_url: "https://www1.wdr.de/nachrichten/index.html",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "krefeld_rp",
        name: "Rheinische Post – Krefeld",
        base_url: "https://rp-online.de/nrw/staedte/krefeld/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (LÜBECK - SCHLESWIG-HOLSTEIN) ---
    {
        source_id: "luebeck_official",
        name: "Hansestadt Lübeck",
        base_url: "https://www.luebeck.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "luebeck_ard",
        name: "ARD Tagesschau – Regional Schleswig-Holstein",
        base_url: "https://www.tagesschau.de/inland/regional/schleswigholstein/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "luebeck_ln",
        name: "Lübecker Nachrichten",
        base_url: "https://www.ln-online.de/lokales/luebeck/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

    // --- L3: CITY (REGENSBURG - BAYERN) ---
    {
        source_id: "regensburg_official",
        name: "Stadt Regensburg",
        base_url: "https://www.regensburg.de/",
        language: "de",
        trust_level: "official_high",
        ingestion_method: "html",
        default_priority: "HIGH"
    },
    {
        source_id: "regensburg_br",
        name: "BR Nachrichten – Bayern",
        base_url: "https://www.br.de/nachrichten/bayern/",
        language: "de",
        trust_level: "public_broadcaster_high",
        ingestion_method: "html",
        default_priority: "MEDIUM"
    },
    {
        source_id: "regensburg_mz",
        name: "Mittelbayerische Zeitung – Regensburg",
        base_url: "https://www.mittelbayerische.de/region/regensburg/",
        language: "de",
        trust_level: "media_high",
        ingestion_method: "html",
        default_priority: "LOW"
    },

] as const;
